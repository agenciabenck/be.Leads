/**
 * enrichmentService.ts
 * 
 * Zero-cost lead enrichment via BrasilAPI, ReceitaWS, and Minha Receita.
 * Strategy: extract CNPJ from lead website → fallback to Multi-Engine HTML search (Google/DDG/Bing/Yahoo) → Multi-API lookup.
 */

import { Lead } from '@/types/types';

export interface EnrichmentResult {
  found: boolean;
  cnpj?: string;
  email?: string;
  socios?: string[];
  razaoSocial?: string;
  telefone?: string;
}

// Regex altamente resiliente que aceita variações de formatação, espaços e pontuações
const CNPJ_REGEX = /\b\d{2}\s*[\.\-]?\s*\d{3}\s*[\.\-]?\s*\d{3}\s*[\/\.]?\s*\d{4}\s*[\-\.]?\s*\d{2}\b/g;

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Mathematically validates a Brazilian CNPJ number using checksum validation digits.
 */
function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;

  // Check for common invalid sequences (all same digits)
  if (/^(\d)\1+$/.test(digits)) return false;

  // Validate first digit
  let size = 12;
  let numbers = digits.substring(0, size);
  const tempDigits = digits.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(tempDigits.charAt(0))) return false;

  // Validate second digit
  size = 13;
  numbers = digits.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(tempDigits.charAt(1))) return false;

  return true;
}

/**
 * Highly resilient CORS proxy helper with multi-proxy fallback mechanism.
 * Attempts corsproxy.io, codetabs, allorigins, thingproxy, and direct fetch in parallel.
 * Returns the first successful response to maximize speed.
 */
async function fetchWithProxyFallback(targetUrl: string, timeoutMs: number = 10000): Promise<string | null> {
  const controller = new AbortController();
  const signal = controller.signal;

  const fetchFromUrl = async (url: string, isDirect = false): Promise<string> => {
    try {
      const resp = await fetch(url, { signal });
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      
      const text = await resp.text();
      if (!text || text.trim().length === 0) throw new Error('Empty response');
      
      // Simple validation for search engine results or target pages
      if (!isDirect && text.length < 50) throw new Error('Response too short to be valid');

      // Check for common security block pages / Cloudflare challenges / captchas
      const lower = text.toLowerCase();
      if (
        lower.includes('cloudflare') ||
        lower.includes('cf-challenge') ||
        lower.includes('captcha') ||
        lower.includes('security check') ||
        lower.includes('forbidden') ||
        lower.includes('access denied') ||
        lower.includes('robot check') ||
        lower.includes('unusual traffic') ||
        lower.includes('checking your browser') ||
        lower.includes('ddg-captcha') ||
        lower.includes('blocked ip') ||
        lower.includes('rate limit') ||
        lower.includes('click here to prove you are not a robot')
      ) {
        throw new Error('Blocked by security protection (Cloudflare/Captcha)');
      }
      
      return text;
    } catch (err) {
      throw err;
    }
  };

  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
    targetUrl // Direct
  ];

  const promises = proxies.map((url, index) => fetchFromUrl(url, index === 4));

  try {
    // Race all proxies using Promise.any. Also wrap it with a timeout to guarantee it finishes.
    const result = await (Promise as any).race([
      (Promise as any).any(promises),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
    ]);
    
    // Abort other pending requests to save bandwidth
    controller.abort();
    return result;
  } catch (err) {
    controller.abort();
    return null;
  }
}

/**
 * Clean HTML content before searching for CNPJ to prevent tag concatenation issues.
 */
function cleanHtmlForRegex(rawHtml: string): string {
  let cleaned = rawHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  cleaned = cleaned.replace(/&nbsp;/gi, ' ').replace(/&ndash;/gi, '-').replace(/&mdash;/gi, '-');
  return cleaned;
}

/**
 * Try to extract a CNPJ from a website URL by fetching its HTML content.
 */
async function extractCnpjFromWebsite(website: string): Promise<string | null> {
  try {
    if (!website || website === 'N/A') return null;

    const url = website.startsWith('http') ? website : `https://${website}`;
    const html = await fetchWithProxyFallback(url, 10000);
    if (!html) return null;

    const cleanedText = cleanHtmlForRegex(html);
    const matches = cleanedText.match(CNPJ_REGEX);
    if (!matches) return null;

    // Return the first mathematically valid CNPJ found
    const valid = matches.find(m => isValidCnpj(m));
    return valid ? valid.replace(/\D/g, '') : null;
  } catch {
    return null;
  }
}

/**
 * Advanced corporate and branding name cleaner.
 * Extrai o núcleo do nome fantasia para maximizar correspondência com a Razão Social.
 */
function cleanBusinessNameForSearch(name: string): { full: string; core: string } {
  let brandName = name.split(/[\-\|:•@\/]/)[0].trim();

  brandName = brandName
    .replace(/\b(ltda|ltd|s\.?a\.?|me|epp|eireli|eirely|mei|cnpj|cpf|advogados|advocacia|arquitetura|arquiteto|arquiteta|clinica|consultoria|engenharia)\b/gi, '')
    .replace(/[^\w\s\d]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = brandName.split(' ');
  let coreName = brandName;
  if (words.length > 2) {
    coreName = words.slice(0, 2).join(' '); // Pega as 2 primeiras palavras principais (ex: "Camila Picolo", "Larissa Engler")
  }
  if (words.length > 4) {
    brandName = words.slice(0, 4).join(' ');
  }

  return { full: brandName, core: coreName };
}

/**
 * Execute search query across multiple search engines and Brazilian CNPJ directories in cascade.
 */
async function searchCnpjAcrossEngines(searchQuery: string): Promise<string | null> {
  const engines = [
    { name: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}` },
    { name: 'DuckDuckGo', url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}` },
    { name: 'CNPJ Biz', url: `https://cnpj.biz/procura/${encodeURIComponent(searchQuery.replace(/\s+/g, '-'))}` },
    { name: 'Casa dos Dados', url: `https://casadosdados.com.br/solucao/cnpj/pesquisa-avancada?q=${encodeURIComponent(searchQuery)}` },
    { name: 'Econodata', url: `https://www.econodata.com.br/consulta-empresa?q=${encodeURIComponent(searchQuery)}` },
    { name: 'Bing', url: `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}` },
    { name: 'Yahoo', url: `https://search.yahoo.com/search?p=${encodeURIComponent(searchQuery)}` }
  ];

  for (const engine of engines) {
    console.log(`[Enrichment] Buscando via ${engine.name}:`, searchQuery);
    const html = await fetchWithProxyFallback(engine.url, 8000);
    if (html) {
      const cleanedText = cleanHtmlForRegex(html);
      
      // Busca tanto por formato pontuado quanto por sequências de 14 dígitos puros
      const matches = cleanedText.match(CNPJ_REGEX) || [];
      const pureDigitsMatches = cleanedText.match(/\b\d{14}\b/g) || [];
      const allMatches = [...matches, ...pureDigitsMatches];

      if (allMatches.length > 0) {
        const valid = allMatches.find(m => isValidCnpj(m));
        if (valid) {
          console.log(`[Enrichment] 🎉 CNPJ encontrado via ${engine.name}:`, valid);
          return valid.replace(/\D/g, '');
        }
      }
    }
  }

  return null;
}

/**
 * Try to find a CNPJ by searching public directories across multiple search engines.
 * Realiza buscas em cascata do mais preciso (Núcleo do nome + Cidade) para o mais amplo.
 */
async function findCnpjByName(name: string, address: string): Promise<string | null> {
  try {
    let city = '';
    let state = '';
    if (address) {
      const matchHyphen = address.match(/([^,\-]+)\s*-\s*([A-Z]{2})/);
      if (matchHyphen) {
        city = matchHyphen[1].trim();
        state = matchHyphen[2].trim();
      } else {
        const matchComma = address.match(/([^,]+),\s*([A-Z]{2})\b/);
        if (matchComma) {
          city = matchComma[1].trim();
          state = matchComma[2].trim();
        }
      }
      if (!city) {
        const parts = address.split(',');
        if (parts.length > 1) {
          city = parts[parts.length - 2].trim();
        } else {
          city = address;
        }
      }
    }

    const cleaned = cleanBusinessNameForSearch(name);

    // Passo 1: Busca extremamente cirúrgica com o núcleo do nome + cidade e estado
    if (cleaned.core && city) {
      const queryCoreLoc = `${cleaned.core} ${city} ${state} cnpj`.trim();
      const cnpj = await searchCnpjAcrossEngines(queryCoreLoc);
      if (cnpj) return cnpj;
    }

    // Passo 2: Busca com o nome completo limpo + cidade e estado
    if (city) {
      const queryFullLoc = `${cleaned.full} ${city} ${state} cnpj`.trim();
      const cnpj = await searchCnpjAcrossEngines(queryFullLoc);
      if (cnpj) return cnpj;
    }

    // Passo 3: Fallback com o núcleo do nome em âmbito nacional (apenas cnpj)
    if (cleaned.core) {
      console.log('[Enrichment] Buscas locais falharam. Tentando busca nacional pelo núcleo do nome...');
      const queryCoreBroad = `${cleaned.core} cnpj`.trim();
      const cnpj = await searchCnpjAcrossEngines(queryCoreBroad);
      if (cnpj) return cnpj;
    }

    // Passo 4: Fallback amplo com o nome original da empresa
    const queryOriginal = `${name.split(/[\-\|:•]/)[0].trim()} cnpj`.trim();
    const cnpj = await searchCnpjAcrossEngines(queryOriginal);
    if (cnpj) return cnpj;

    return null;
  } catch (err) {
    console.error('[Enrichment] Erro em findCnpjByName:', err);
    return null;
  }
}

/**
 * Fetch full enrichment data cascading through BrasilAPI, ReceitaWS, and Minha Receita.
 */
async function fetchFullEnrichmentData(cnpj: string): Promise<EnrichmentResult> {
  const clean = cnpj.replace(/\D/g, '');
  const formattedCnpj = formatCnpj(clean);

  // API 1: BrasilAPI (Direta)
  try {
    console.log('[Enrichment] Consultando BrasilAPI para CNPJ:', formattedCnpj);
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      signal: AbortSignal.timeout(8000)
    });

    if (resp.ok) {
      const data = await resp.json();
      const socios: string[] = (data.qsa || []).map((s: any) => {
        const name = s.nome_socio || s.nome_representante_legal || '';
        const qual = s.qualificacao_socio || '';
        return qual ? `${name} (${qual})` : name;
      }).filter(Boolean);

      return {
        found: true,
        cnpj: formattedCnpj,
        email: data.email || undefined,
        socios: socios.length > 0 ? socios : undefined,
        razaoSocial: data.razao_social || undefined,
        telefone: data.ddd_telefone_1 || undefined,
      };
    }
  } catch (err) {
    console.warn('[Enrichment] BrasilAPI falhou, tentando fallback...');
  }

  // API 2: ReceitaWS (Via Proxy)
  try {
    console.log('[Enrichment] Consultando ReceitaWS para CNPJ:', formattedCnpj);
    const receitaWsUrl = `https://www.receitaws.com.br/v1/cnpj/${clean}`;
    const rawJson = await fetchWithProxyFallback(receitaWsUrl, 8000);
    if (rawJson) {
      const data = JSON.parse(rawJson);
      if (data.status !== 'ERROR') {
        const socios: string[] = (data.qsa || []).map((s: any) => {
          const name = s.nome || s.nome_rep_legal || '';
          const qual = s.qual || '';
          return qual ? `${name} (${qual})` : name;
        }).filter(Boolean);

        return {
          found: true,
          cnpj: formattedCnpj,
          email: data.email || undefined,
          socios: socios.length > 0 ? socios : undefined,
          razaoSocial: data.nome || undefined,
          telefone: data.telefone || undefined,
        };
      }
    }
  } catch (err) {
    console.warn('[Enrichment] ReceitaWS falhou, tentando Minha Receita...');
  }

  // API 3: Minha Receita (Via Proxy)
  try {
    console.log('[Enrichment] Consultando Minha Receita para CNPJ:', formattedCnpj);
    const minhaReceitaUrl = `https://minhareceita.org/${clean}`;
    const rawJson = await fetchWithProxyFallback(minhaReceitaUrl, 8000);
    if (rawJson) {
      const data = JSON.parse(rawJson);
      const socios: string[] = (data.qsa || []).map((s: any) => {
        const name = s.nome_socio || s.nome_representante_legal || '';
        const qual = s.qualificacao_socio || '';
        return qual ? `${name} (${qual})` : name;
      }).filter(Boolean);

      return {
        found: true,
        cnpj: formattedCnpj,
        email: data.email || undefined,
        socios: socios.length > 0 ? socios : undefined,
        razaoSocial: data.razao_social || undefined,
        telefone: data.ddd_telefone_1 || undefined,
      };
    }
  } catch (err) {
    console.warn('[Enrichment] Minha Receita falhou.');
  }

  // Se todas as APIs falharem, retornamos o CNPJ encontrado com dados parciais
  return {
    found: true,
    cnpj: formattedCnpj
  };
}

/**
 * Main enrichment function. Tries a cascade of strategies to find the CNPJ,
 * then calls multi-API lookup for the full data.
 * 
 * @param lead The lead to enrich (must be a Google Maps lead)
 */
export async function enrichLead(lead: Lead): Promise<EnrichmentResult> {
  let cnpj: string | null = null;

  // Strategy 1: If lead already has a CNPJ in our data, skip lookup
  if (lead.cnpj && isValidCnpj(lead.cnpj)) {
    cnpj = lead.cnpj.replace(/\D/g, '');
  }

  // Strategy 2: Extract from website
  if (!cnpj && lead.website && lead.website !== 'N/A') {
    cnpj = await extractCnpjFromWebsite(lead.website);
  }

  // Strategy 3: Search by name + city (fallback)
  if (!cnpj) {
    cnpj = await findCnpjByName(lead.name, lead.address || '');
  }

  // No CNPJ found → partial result
  if (!cnpj) {
    return { found: false };
  }

  // Fetch full data cascading through multiple APIs
  return fetchFullEnrichmentData(cnpj);
}

/**
 * Batch enrichment with concurrency control (max 4 parallel requests).
 */
export async function enrichLeads(
  leads: Lead[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, EnrichmentResult>> {
  const results = new Map<string, EnrichmentResult>();
  const CONCURRENCY = 4;

  for (let i = 0; i < leads.length; i += CONCURRENCY) {
    const chunk = leads.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(lead => enrichLead(lead).then(r => ({ id: lead.id, result: r })))
    );

    chunkResults.forEach(({ id, result }) => results.set(id, result));

    if (onProgress) {
      onProgress(Math.min(i + CONCURRENCY, leads.length), leads.length);
    }

    // Small delay between chunks to avoid rate limiting
    if (i + CONCURRENCY < leads.length) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  return results;
}
