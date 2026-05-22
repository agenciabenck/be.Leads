import { Lead } from '@/types/types';
import { supabase } from '@/services/supabase';

function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

// Multi-Country Region Dictionaries
const LOCATIONS = {
    'BR': [
        'São Paulo', 'SP', 'Rio de Janeiro', 'RJ', 'Belo Horizonte', 'MG', 'Curitiba', 'PR',
        'Porto Alegre', 'RS', 'Goiânia', 'GO', 'Salvador', 'BA', 'Fortaleza', 'CE', 'Recife', 'PE',
        'Brasília', 'DF', 'Campinas', 'São Bernardo do Campo', 'Guarulhos', 'Campinas', 'Nova Iguaçu',
        'Maceió', 'AL', 'São Luís', 'MA', 'Natal', 'RN', 'Teresina', 'PI', 'João Pessoa', 'PB',
        'Aracaju', 'SE', 'Florianópolis', 'SC', 'Joinville', 'Londrina', 'Caxias do Sul', 'Ribeirão Preto',
        'Sorocaba', 'Uberlândia', 'Juiz de Fora', 'Vitória', 'ES', 'Vila Velha', 'Cuiabá', 'MT', 'Campo Grande', 'MS',
        'Manaus', 'AM', 'Belém', 'PA', 'Porto Velho', 'RO', 'Maringá', 'Cascavel', 'Ponta Grossa',
        'Bauru', 'Franca', 'Niterói', 'Canoas', 'Pelotas', 'Blumenau', 'Itajaí', 'Balneário Camboriú',
        'Foz do Iguaçu', 'Criciúma', 'Lages', 'Chapecó', 'Norte', 'Sul', 'Interior', 'Capital', 'Centro'
    ],
    'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Jacksonville', 'San Jose', 'Texas', 'California', 'Florida', 'Ohio', 'Georgia'],
    'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Ontario', 'Alberta', 'British Columbia'],
    'PT': ['Lisboa', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Funchal', 'Coimbra', 'Setúbal', 'Almada', 'Agualva-Cacém', 'Faro', 'Algarve'],
    'AR': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Tucumán', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan'],
    'MX': ['Ciudad de México', 'Ecatepec', 'Guadalajara', 'Puebla', 'Juárez', 'Tijuana', 'León', 'Zapopan', 'Monterrey', 'Nezahualcóyotl', 'Jalisco'],
    'PY': ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá', 'Lambaré', 'Fernando de la Mora', 'Limpio', 'Nemby', 'Encarnación']
};

const SUFFIXES = {
    'PT': ['whatsapp', 'contato', 'telefone', 'saiba mais'],
    'ES': ['whatsapp', 'contacto', 'teléfono', 'saber más'],
    'EN': ['whatsapp', 'contact', 'phone', 'learn more']
};

const FOOTPRINTS = {
    'PT': ['"+55"', '"@gmail.com"'],
    'ES': ['"@gmail.com"'],
    'EN': ['"@gmail.com"']
};

const getCountryData = (countryCode: string) => {
    const code = countryCode.toUpperCase();
    const isPT = code === 'BR' || code === 'PT';
    const isES = code === 'AR' || code === 'MX' || code === 'PY';
    const lang = isPT ? 'PT' : isES ? 'ES' : 'EN';

    return {
        locations: LOCATIONS[code as keyof typeof LOCATIONS] || LOCATIONS['US'],
        suffixes: SUFFIXES[lang],
        footprints: FOOTPRINTS[lang]
    };
};

// Custom error class to distinguish timeouts from other errors
class SearchTimeoutError extends Error {
    constructor(ms: number) {
        super(`A busca demorou mais que ${ms / 1000}s e foi cancelada pelo sistema.`);
        this.name = 'SearchTimeoutError';
    }
}

// Helper to provide a hard timeout to fetch calls so the UI never hangs infinitely
// Helper to create a combined signal that aborts on either the user's signal or a timeout
function createTimeoutSignal(signal: AbortSignal | undefined, ms: number): { signal: AbortSignal; cleanup: () => void } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new SearchTimeoutError(ms)), ms);
    
    const onAbort = () => {
        controller.abort(signal?.reason);
        clearTimeout(timeoutId);
    };

    if (signal) {
        if (signal.aborted) onAbort();
        else signal.addEventListener('abort', onAbort);
    }

    return {
        signal: controller.signal,
        cleanup: () => {
            clearTimeout(timeoutId);
            if (signal) signal.removeEventListener('abort', onAbort);
        }
    };
}

function buildInstagramQueries(niche: string, maxResults: number, countryCode: string, userLocation?: string): string[] {
    const cleanNiche = niche.replace(/"/g, '').trim();
    const exclusions = '-inurl:/explore/ -inurl:/tags/ -inurl:/stories/';
    let optimizedNiche = cleanNiche;
    if (optimizedNiche.includes(' e ')) optimizedNiche = optimizedNiche.replace(/ e /g, ' OR ');
    if (optimizedNiche.includes(' / ')) optimizedNiche = optimizedNiche.replace(/ \/ /g, ' OR ');
    if (optimizedNiche.includes(' e/ou ')) optimizedNiche = optimizedNiche.replace(/ e\/ou /g, ' OR ');
    
    const nicheTerm = optimizedNiche.includes(' OR ') ? `(${optimizedNiche})` : optimizedNiche;

    const { locations, suffixes, footprints } = getCountryData(countryCode);
    const countryName = countryCode === 'BR' ? 'Brasil' : countryCode === 'US' ? 'United States' : countryCode === 'CA' ? 'Canada' : countryCode === 'PT' ? 'Portugal' : countryCode === 'AR' ? 'Argentina' : countryCode === 'MX' ? 'Mexico' : 'Paraguay';

    // Consolidate all contact methods into a single powerful OR group
    const footprintsStr = footprints.map(f => `"${f.replace(/"/g, '')}"`).join(' OR ');
    const suffixesStr = suffixes.map(s => `"${s}"`).join(' OR ');
    const contactIndicators = `(${footprintsStr} OR ${suffixesStr})`;

    const queries: string[] = [];
    let targetLocations: string[] = [];
    
    const isBroad = !userLocation || 
                    userLocation === countryName || 
                    userLocation === 'Brasil' || 
                    userLocation === 'BR' || 
                    userLocation.toLowerCase().includes('inteiro');
    
    if (userLocation && !isBroad) {
        targetLocations = [userLocation];
    } else {
        targetLocations = shuffleArray(locations).slice(0, 2);
        if (!targetLocations.includes(countryName)) targetLocations.push(countryName);
    }

    // Generate 1 ultra-dense query per location. We limit to max 2 queries total for extreme speed.
    for (const loc of targetLocations.slice(0, 2)) {
        const cleanLoc = loc.replace(/,/g, '');
        queries.push(`site:instagram.com ${nicheTerm} ${cleanLoc} ${contactIndicators} ${exclusions}`);
    }

    return queries;
}

function buildLinkedInQueries(niche: string, maxResults: number, countryCode: string, userLocation?: string): string[] {
    const cleanNiche = niche.replace(/"/g, '').trim();
    let optimizedNiche = cleanNiche;
    if (optimizedNiche.includes(' e ')) optimizedNiche = optimizedNiche.replace(/ e /g, ' OR ');
    if (optimizedNiche.includes(' / ')) optimizedNiche = optimizedNiche.replace(/ \/ /g, ' OR ');
    if (optimizedNiche.includes(' e/ou ')) optimizedNiche = optimizedNiche.replace(/ e\/ou /g, ' OR ');

    const nicheTerm = optimizedNiche.includes(' OR ') ? `(${optimizedNiche})` : optimizedNiche;

    const { locations } = getCountryData(countryCode);
    const countryName = countryCode === 'BR' ? 'Brasil' : countryCode === 'US' ? 'United States' : countryCode === 'CA' ? 'Canada' : countryCode === 'PT' ? 'Portugal' : countryCode === 'AR' ? 'Argentina' : countryCode === 'MX' ? 'Mexico' : 'Paraguay';

    const queries: string[] = [];
    let targetLocations: string[] = [];
    
    const isBroad = !userLocation || 
                    userLocation === countryName || 
                    userLocation === 'Brasil' || 
                    userLocation === 'BR' || 
                    userLocation.toLowerCase().includes('inteiro');
    
    if (userLocation && !isBroad) {
        targetLocations = [userLocation];
    } else {
        targetLocations = shuffleArray(locations).slice(0, 2);
    }

    for (const loc of targetLocations.slice(0, 2)) {
        const cleanLoc = loc.replace(/,/g, '');
        queries.push(`site:linkedin.com/in/ ${nicheTerm} ${cleanLoc}`);
    }

    return queries;
}


function isValidInstagramProfile(url: string | undefined): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    // We now allow /p/ and /reel/ as they often lead to valid profiles through the search title/snippet
    const invalid = ['/explore/', '/tags/', '/accounts/', '/stories/'];
    return lower.includes('instagram.com/') && !invalid.some(seg => lower.includes(seg));
}

function extractEmailFromText(text: string): string | null {
    if (!text) return null;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const matches = text.match(emailRegex);
    return matches ? matches[0].toLowerCase() : null;
}

function deepSearchEmail(item: any): string | null {
    if (!item) return null;
    const find = (obj: any, depth = 0): string | null => {
        if (depth > 5 || !obj) return null;
        if (typeof obj === 'string') {
            return extractEmailFromText(obj);
        }
        if (typeof obj === 'object') {
            for (const k in obj) {
                if (['url', 'link', 'profileUrl', 'image'].includes(k)) continue;
                const result = find(obj[k], depth + 1);
                if (result) return result;
            }
        }
        return null;
    };
    return find(item);
}

function extractPhoneFromText(text: string): string | null {
    if (!text) return null;
    // Broad international phone regex (handles +1, +55, 9 digit numbers, formats like (X) XXX-XXXX etc.)
    const phoneRegex = /(?:\+?\d{1,3}[-\s.]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{3,5}/g;
    const matches = text.match(phoneRegex);

    // Look for anything that has between 9 and 15 digits
    const validMatch = matches?.find(m => {
        const digits = m.replace(/\D/g, '');
        return digits.length >= 9 && digits.length <= 15;
    });
    return validMatch ? validMatch.trim() : null;
}

function deepSearchPhone(item: any): string | null {
    if (!item) return null;
    const find = (obj: any, depth = 0): string | null => {
        if (depth > 5 || !obj) return null;
        if (typeof obj === 'string') {
            return extractPhoneFromText(obj);
        }
        if (typeof obj === 'object') {
            for (const k in obj) {
                if (['url', 'link', 'profileUrl', 'image'].includes(k)) continue;
                const result = find(obj[k], depth + 1);
                if (result) return result;
            }
        }
        return null;
    };
    return find(item);
}

function extractExternalUrl(text: string): string | null {
    if (!text) return null;

    // More generic regex with broad TLD support common in Brazil (.adv.br, .me, .linktr.ee, etc)
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.(?:com|br|net|org|io|me|linktr\.ee|bit\.ly|sh|app|dev|site|xyz|online|contact|link|wa\.me|info|gov|tech|website|space|live|email|shop|plus|store|work|icu|vip|group|digital|rocks|band|studio|agency|services|contractor|solutions|associates|adv\.br|law\.br|prof\.br|ind\.br|srv\.br|etc\.br)(?:\/[\w\-\._~:/?#\[\]@!\$&'\(\)\*\+,;=%]*)?)/gi;

    const matches = text.match(urlRegex);
    if (!matches) return null;

    const socialDomains = ['instagram.com', 'linkedin.com', 'facebook.com', 'twitter.com', 't.co', 'youtube.com', 'google.com', 'apple.com', 'pinterest.com', 'tiktok.com'];

    const external = matches.find(m => {
        const lowerM = m.toLowerCase();
        if (!lowerM.includes('.') || lowerM.length < 4) return false;

        const domainPart = lowerM.split('.')[0];
        if (!/[a-zA-Z]/.test(domainPart)) return false; // Must contain letters

        if (socialDomains.some(domain => lowerM.includes(domain))) return false;

        return true;
    });

    if (!external) return null;

    let cleaned = external.replace(/[.,;!?)]+$/, '');
    if (cleaned.toLowerCase().endsWith('.read')) cleaned = cleaned.substring(0, cleaned.length - 5);

    if (cleaned.length < 4 || !cleaned.includes('.')) return null;

    return cleaned.toLowerCase().startsWith('http') ? cleaned : `https://${cleaned}`;
}

function deepSearchWebsite(item: any): string | null {
    if (!item) return null;
    const ignoredDomains = ['instagram.com', 'linkedin.com', 'facebook.com', 'twitter.com', 't.co', 'youtube.com', 'google.com', 'apple.com', 'pinterest.com', 'tiktok.com'];

    const find = (obj: any, depth = 0): string | null => {
        if (depth > 8 || !obj) return null;
        if (typeof obj === 'string') {
            if (obj.startsWith('http')) {
                const lower = obj.toLowerCase();
                if (!ignoredDomains.some(d => lower.includes(d))) return obj;
            }
            return extractExternalUrl(obj);
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (['url', 'link', 'profileUrl', 'cacheUrl', 'googleMapsUrl', 'image', 'favicon'].includes(key)) continue;
                const result = find(obj[key], depth + 1);
                if (result) return result;
            }
        }
        return null;
    };
    return find(item);
}

function mapInstagramResult(item: any, query: string): Lead {
    const rawSnippet = item.description || item.snippet || '';
    const title = item.title || '';
    const itemUrl = item.url || item.link || '';

    // Improved name/username extraction
    let name = 'Perfil do Instagram';
    let username = 'N/A';

    // Try standard title format: "Name (@username) • Instagram..."
    const standardMatch = title.match(/^(.*)\s\((@[\w._]+)\)/);
    if (standardMatch) {
        name = standardMatch[1].trim();
        username = standardMatch[2].replace('@', '');
    } else {
        const atMatch = title.match(/@([\w._]+)/);
        if (atMatch) username = atMatch[1];
        name = title.split(' (@')[0].split(' • ')[0].trim();
    }

    // URL fallback for usernames
    if (username === 'N/A' || ['reel', 'p', 'reels', 'tv', 'stories'].includes(username.toLowerCase())) {
        const displayedUrl = item.displayedUrl || '';
        const displayedMatch = displayedUrl.match(/Instagram\s*(?:›|>)\s*([\w._]+)/i);
        if (displayedMatch) {
            username = displayedMatch[1];
        }
    }

    if (username === 'N/A' || ['reel', 'p', 'reels', 'tv', 'stories'].includes(username.toLowerCase())) {
        const urlMatch = itemUrl.match(/instagram.com\/([\w._]+)\/?/);
        if (urlMatch && !['reel', 'p', 'reels', 'tv', 'stories'].includes(urlMatch[1].toLowerCase())) {
            username = urlMatch[1];
        }
    }

    // Desperate fallback for username via snippet
    if (username === 'N/A') {
        const snippetMatch = rawSnippet.match(/@([\w._]+)/);
        if (snippetMatch) username = snippetMatch[1];
    }

    // Aggressive discovery of website
    const directWebsite = item.website ||
        item.richSnippet?.top?.website ||
        item.richSnippet?.top?.url ||
        (item.richSnippet?.socialMetadata?.website) ||
        (item.siteLinks?.[0]?.url) ||
        (item.sitelinks?.[0]?.url);

    const bioLink = extractExternalUrl(rawSnippet);
    const discoveredLink = deepSearchWebsite(item);

    // Post vs Profile fix: if the source URL is a post, but we have a username, use the profile URL
    const isPostUrl = itemUrl && (itemUrl.includes('/p/') || itemUrl.includes('/reel/') || itemUrl.includes('/reels/'));
    const profileUrl = username !== 'N/A' ? `https://instagram.com/${username}` : (isPostUrl ? 'N/A' : (itemUrl || 'N/A'));

    const finalWebsite = (directWebsite && !directWebsite.includes('instagram.com') && !directWebsite.includes('facebook.com'))
        ? directWebsite
        : (discoveredLink || bioLink);

    let extractedPhone = extractPhoneFromText(rawSnippet) || deepSearchPhone(item);
    const extractedEmail = extractEmailFromText(rawSnippet) || deepSearchEmail(item);

    // Append email into notes or website field conceptually. For now, we format it neatly into address if not present anywhere else
    let addressField = rawSnippet.substring(0, 100) || `Instagram: @${username}`;
    if (extractedEmail) {
        addressField = `✉️ ${extractedEmail} | ${addressField.substring(0, 70)}`;
    }

    // Recovery from links
    const linkToCheck = finalWebsite || directWebsite || bioLink || discoveredLink;
    if (!extractedPhone && linkToCheck && typeof linkToCheck === 'string' && linkToCheck.includes('wa.me/')) {
        const waMatch = linkToCheck.match(/wa\.me\/(\+?\d+)/);
        if (waMatch && waMatch[1]) {
            extractedPhone = waMatch[1];
            // Format only if it looks like a BR number to avoid breaking international formats
            if (extractedPhone.startsWith('55') && extractedPhone.length >= 12) {
                const cleanBR = extractedPhone.replace(/^55/, '');
                const ddd = cleanBR.substring(0, 2);
                const rest = cleanBR.substring(2);
                extractedPhone = `(${ddd}) ${rest.length === 9 ? rest.substring(0, 5) + '-' + rest.substring(5) : rest.substring(0, 4) + '-' + rest.substring(4)}`;
            } else if (!extractedPhone.startsWith('+')) {
                extractedPhone = '+' + extractedPhone;
            }
        }
    }

    return {
        id: generateStableId('ig', item.inputUrl || item.username || item.fullName || profileUrl || itemUrl || ''),
        name,
        category: query,
        address: addressField,
        rating: 0,
        reviews: 0,
        phone: extractedPhone || 'N/A',
        website: finalWebsite || profileUrl,
        instagram: username,
        googleMapsLink: ''
    };
}

function mapLinkedInResult(item: any, query: string): Lead {
    const titleParts = item.title ? item.title.split(' - ') : ['Profissional LinkedIn'];
    const name = titleParts[0]?.trim() || 'Profissional LinkedIn';
    const snippet = item.snippet || item.description || '';
    const itemUrl = item.link || item.url || '';
    const occupation = titleParts[1]?.trim() || snippet.substring(0, 60) || 'LinkedIn Professional';

    const directWebsite = item.website || item.richSnippet?.top?.website || item.richSnippet?.top?.url || (item.sitelinks?.[0]?.url) || (item.siteLinks?.[0]?.url);
    const bioLink = extractExternalUrl(snippet);
    const discoveredLink = deepSearchWebsite(item);

    const finalWebsite = (directWebsite && !directWebsite.includes('linkedin.com') && !directWebsite.includes('facebook.com'))
        ? directWebsite
        : (discoveredLink || bioLink);

    const extractedPhone = extractPhoneFromText(snippet) || deepSearchPhone(item);
    const extractedEmail = extractEmailFromText(snippet) || deepSearchEmail(item);

    let addressField = occupation;
    if (extractedEmail) {
        addressField = `✉️ ${extractedEmail} | ${addressField.substring(0, 70)}`;
    }

    return {
        id: generateStableId('li', item.publicIdentifier || itemUrl || ''),
        name,
        category: query,
        address: addressField,
        rating: 0,
        reviews: 0,
        phone: extractedPhone || 'N/A',
        website: finalWebsite || itemUrl || 'N/A',
        instagram: 'N/A',
        linkedin: itemUrl?.split('linkedin.com/in/')[1]?.replace('/', '') || 'N/A',
        googleMapsLink: ''
    };
}

// Helper to generate a stable ID from a string
const generateStableId = (prefix: string, source: string): string => {
    if (!source || source === 'N/A') return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

    // Simple hash function for consistent IDs
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
        const char = source.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `${prefix}-${Math.abs(hash).toString(36)}`;
};

export const apifyService = {
    async searchInstagram(
        query: string,
        maxResults: number = 20,
        countryCode: string = 'BR',
        location?: string,
        signal?: AbortSignal,
        onProgress?: (current: number, total: number) => void
    ): Promise<Lead[]> {
        const bufferResults = maxResults * 2;
        const queries = buildInstagramQueries(query, bufferResults, countryCode, location);
        
        const allResults: Lead[] = [];
        const seenUsernames = new Set<string>();

        if (onProgress) onProgress(10, 100);

        console.log(`[SearchInstagram] Starting unified ultra-fast search with ${queries.length} queries...`);

        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        const { signal: timeoutSignal, cleanup } = createTimeoutSignal(signal, 55000);
        try {
            let data: any = null;
            const res = await supabase.functions.invoke('search-apify', {
                body: {
                    source: 'instagram',
                    queries: queries.join('\n'),
                    resultsPerPage: 10,
                    maxPagesPerQuery: 4,
                    countryCode: countryCode.toLowerCase(),
                    maxConcurrency: 10,
                },
                signal: timeoutSignal
            });
            if (res.error) throw res.error;
            if (res.data?.error) throw new Error(res.data.error);
            data = res.data;

            const pages: any[] = Array.isArray(data) ? data : [];
            for (const page of pages) {
                const results = [
                    ...(page?.organicResults || []),
                    ...(page?.suggestedResults || [])
                ];
                for (const item of results) {
                    const itemUrl = item.url || item.link;
                    if (!isValidInstagramProfile(itemUrl)) continue;
                    const lead = mapInstagramResult(item, query);
                    if (lead.instagram && lead.instagram !== 'N/A') {
                        if (!seenUsernames.has(lead.instagram)) {
                            seenUsernames.add(lead.instagram);
                            allResults.push(lead);
                        }
                    }
                }
            }
        } catch (err: any) {
            if (err.name === 'AbortError' || signal?.aborted) {
                throw err;
            }
            console.error(`[SearchInstagram] Major failure:`, err);
        } finally {
            cleanup();
        }
        
        console.log(`[SearchInstagram] Unified search finished. Yield: ${allResults.length} leads`);

        if (allResults.length === 0) {
            throw new Error('Nenhum resultado encontrado no Instagram. Tente um nicho mais amplo.');
        }

        if (onProgress) onProgress(100, 100);
        return allResults;
    },

    async searchLinkedIn(
        query: string,
        maxResults: number = 20,
        countryCode: string = 'BR',
        signal?: AbortSignal,
        onProgress?: (current: number, total: number) => void
    ): Promise<Lead[]> {
        const bufferResults = maxResults * 2;
        const queries = buildLinkedInQueries(query, bufferResults, countryCode);
        const allResults: Lead[] = [];
        const seenUrls = new Set<string>();

        if (onProgress) onProgress(10, 100);

        console.log(`[SearchLinkedIn] Starting unified ultra-fast search with ${queries.length} queries...`);

        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        const { signal: timeoutSignal, cleanup } = createTimeoutSignal(signal, 55000);
        try {
            let data: any = null;
            const res = await supabase.functions.invoke('search-apify', {
                body: {
                    source: 'linkedin',
                    queries: queries.join('\n'),
                    resultsPerPage: 10,
                    maxPagesPerQuery: 4,
                    countryCode: countryCode.toLowerCase(),
                    maxConcurrency: 10,
                },
                signal: timeoutSignal
            });
            if (res.error) throw res.error;
            if (res.data?.error) throw new Error(res.data.error);
            data = res.data;

            const pages: any[] = Array.isArray(data) ? data : [];
            for (const page of pages) {
                const results = [
                    ...(page?.organicResults || []),
                    ...(page?.suggestedResults || [])
                ];
                for (const item of results) {
                    const itemUrl = item.url || item.link;
                    if (!itemUrl?.toLowerCase().includes('linkedin.com/in/')) continue;
                    const lead = mapLinkedInResult(item, query);
                    if (lead.id) {
                        if (!seenUrls.has(lead.id)) {
                            seenUrls.add(lead.id);
                            allResults.push(lead);
                        }
                    }
                }
            }
        } catch (err: any) {
            if (err.name === 'AbortError' || signal?.aborted) {
                throw err;
            }
            console.error(`[SearchLinkedIn] Major failure:`, err);
        } finally {
            cleanup();
        }

        if (allResults.length === 0) {
            throw new Error('Nenhum resultado encontrado no LinkedIn.');
        }

        if (onProgress) onProgress(100, 100);
        return allResults;
    }
};
