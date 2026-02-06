import { GoogleGenerativeAI } from "@google/generative-ai";
import { Lead, SearchFilters } from "../types";

export const searchLeads = async (
  query: string,
  filters: SearchFilters,
  location?: GeolocationCoordinates,
  excludedNames: string[] = [],
  limitOverride?: number,
  excludedCity?: string
): Promise<Lead[]> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error("Chave da API não configurada. Verifique o arquivo .env");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Lista de modelos otimizada para estabilidade e quota (Plano Gratuito)
  // Usamos gemini-flash-latest pois gemini-1.5-flash retornou 404 em testes anteriores
  const modelsToTry = ["gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-2.0-flash"];
  let lastError = null;

  for (const modelId of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelId,
        // Removemos ferramentas de busca (Google Search Retrieval) para economizar quota
        // e evitar erros de permissão em contas gratuitas
        tools: undefined
      } as any);

      const targetCount = limitOverride || filters.maxResults;
      const recentExclusions = excludedNames.slice(-50);
      const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 99999)}`;

      const diversityStrategies = [
        "Foque EXCLUSIVAMENTE em bairros periféricos e comerciais.",
        "Busque 'Jóias Escondidas': empresas locais pequenas.",
        "Ignore franquias e grandes redes.",
        "Priorize empresas recentemente adicionadas ao Google Maps.",
        "Misture resultados de extremos opostos da cidade."
      ];
      const randomStrategy = diversityStrategies[Math.floor(Math.random() * diversityStrategies.length)];

      const constraints = [
        `Quantidade alvo: ${targetCount} resultados distintos.`,
        filters.minRating > 0 ? `Nota mínima: ${filters.minRating}.` : '',
        filters.requirePhone ? 'OBRIGATÓRIO ter telefone válido.' : '',
        excludedCity ? `IGNORAR cidade: ${excludedCity}` : '',
        recentExclusions.length > 0 ? `IGNORAR estes nomes: ${JSON.stringify(recentExclusions)}` : ''
      ].filter(Boolean).join('\n');

      const systemInstruction = `
        Você é um buscador de leads industriais e comerciais. Responda APENAS em JSON.
        Formato: [{"name":"Nome","category":"Cat","rating":0.0,"reviews":0,"address":"Endereço","phone":"(00) 0000-0000","website":"https://...","instagram":"https://..."}]
      `;

      const prompt = `
        ID: ${requestId} | Estratégia: ${randomStrategy}
        Local: ${location ? `${location.latitude}, ${location.longitude}` : 'Padrão'}
        Busca: "${query}"
        ${constraints}
      `;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
        generationConfig: {
          temperature: 0.7, // Reduzido um pouco para ser mais estável e evitar alucinações de formato
          topP: 0.95,
        }
      });

      const response = await result.response;
      const text = response.text();

      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');

      if (start === -1 || end === -1) {
        if (text.length > 0) return [];
        continue; // Tenta o próximo modelo
      }

      const jsonString = text.substring(start, end + 1);
      const data = JSON.parse(jsonString);

      if (!Array.isArray(data)) return [];

      return data.map((item: any, index: number) => ({
        id: `lead-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
        name: item.name || "Sem Nome",
        category: item.category || "Geral",
        rating: item.rating || 0,
        reviews: item.reviews || 0,
        address: item.address || "Endereço não disponível",
        phone: item.phone || "N/A",
        website: item.website || "N/A",
        googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((item.name || "") + " " + (item.address || ""))}`,
        instagram: item.instagram !== "N/A" ? item.instagram : undefined
      }));

    } catch (error: any) {
      lastError = error;
      console.warn(`Erro no modelo ${modelId}:`, error.message);

      // Se for erro de cota (429), tentamos o próximo modelo
      if (error.status === 429 || error.message?.includes('429')) {
        continue;
      }

      // Se for outro erro fatal, interrompemos
      break;
    }
  }

  // Se chegamos aqui, todos os modelos falharam
  if (lastError) {
    const isQuota = lastError.status === 429 || lastError.message?.includes('429');
    if (isQuota) {
      throw new Error("COTA EXCEDIDA: O Google limitou o uso da sua chave gratuita temporariamente. Por favor, aguarde alguns minutos e tente novamente.");
    }
    throw new Error(lastError.message || "Erro na comunicação com a IA.");
  }

  return [];
};