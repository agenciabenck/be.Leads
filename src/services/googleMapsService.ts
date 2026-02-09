
// Interface para o resultado simplificado
export interface BusinessLead {
    id: string;
    name: string;
    address: string;
    rating?: number;
    userRatingCount?: number;
    website?: string; // Agora retornado na busca
    phone?: string; // Só em getPlaceDetails
    googleMapsUrl?: string; // Agora retornado na busca
}

const GOOGLE_PLACES_API_BASE = 'https://places.googleapis.com/v1';

// ⚡ FIELD MASKING OTIMIZADO - Usa tier "Essentials" ($5/1k)
// Documentação: https://developers.google.com/maps/documentation/places/web-service/choose-fields
const SEARCH_FIELDS = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.rating',
    'places.userRatingCount',
    'places.websiteUri', // Website para ícone
    'places.googleMapsUri', // Link do Google Maps
    'places.internationalPhoneNumber' // Telefone (Essentials tier)
].join(',');

const DETAILS_FIELDS = [
    'id',
    'displayName',
    'formattedAddress',
    'websiteUri',
    'internationalPhoneNumber',
    'googleMapsUri'
].join(',');

interface CacheEntry {
    data: any;
    timestamp: number;
}

export class GoogleMapsService {
    private apiKey: string;
    private cache: Map<string, CacheEntry> = new Map();
    private readonly CACHE_TTL = 3600000; // 1 hora

    constructor(apiKey: string) {
        this.apiKey = apiKey;

        // Limpar cache antigo a cada 30 minutos
        setInterval(() => this.clearOldCache(), 1800000);
    }

    async searchBusiness(
        query: string,
        maxResults: number = 20,
        randomize: boolean = true,
        pageToken?: string
    ): Promise<{ places: BusinessLead[], nextToken?: string }> {
        try {
            // Verificar cache (não cachear se houver token para simplificar)
            const cacheKey = `search_${query}_${maxResults}_${pageToken || ''}`;
            if (!pageToken) {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    return { places: randomize ? this.shuffleArray(cached) : cached };
                }
            }

            // Fazer requisição à API
            const response = await fetch(`${GOOGLE_PLACES_API_BASE}/places:searchText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': this.apiKey,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri,places.internationalPhoneNumber,nextPageToken', // Adicionado nextPageToken
                },
                body: JSON.stringify({
                    textQuery: query,
                    languageCode: 'pt-BR',
                    maxResultCount: Math.min(maxResults, 20),
                    pageToken: pageToken, // Token de paginação
                    rankPreference: randomize ? 'DISTANCE' : 'RELEVANCE'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error?.message ||
                    `Erro na API do Google: ${response.statusText}`
                );
            }

            const data = await response.json();

            if (!data.places || data.places.length === 0) {
                return { places: [] };
            }

            const results = data.places.map((place: any) => ({
                id: place.id,
                name: place.displayName?.text || 'Sem nome',
                address: place.formattedAddress || 'Endereço não disponível',
                rating: place.rating,
                userRatingCount: place.userRatingCount,
                website: place.websiteUri,
                googleMapsUrl: place.googleMapsUri,
                phone: place.internationalPhoneNumber,
            }));

            // Salvar no cache apenas a primeira página
            if (!pageToken) {
                this.saveToCache(cacheKey, results);
            }

            return {
                places: randomize ? this.shuffleArray(results) : results,
                nextToken: data.nextPageToken
            };

        } catch (error: any) {
            console.error('Google Maps Search Error:', error);
            if (error.message?.includes('API key')) {
                throw new Error('Chave da API inválida. Verifique as configurações.');
            }
            if (error.message?.includes('quota')) {
                throw new Error('Limite de buscas atingido. Tente novamente mais tarde.');
            }
            throw new Error(error.message || 'Erro ao buscar leads. Tente novamente.');
        }
    }

    /**
     * 📞 Busca detalhes de contato (Place Details Essentials)
     * IMPORTANTE: Só chamar quando usuário clicar em "Revelar Contato"
     */
    async getPlaceDetails(placeId: string): Promise<Partial<BusinessLead>> {
        try {
            // Verificar cache
            const cacheKey = `details_${placeId}`;
            const cached = this.getFromCache(cacheKey);

            if (cached) {
                return cached;
            }

            const response = await fetch(`${GOOGLE_PLACES_API_BASE}/places/${placeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': this.apiKey,
                    'X-Goog-FieldMask': DETAILS_FIELDS, // Só campos de contato
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error?.message ||
                    'Erro ao buscar detalhes do lead'
                );
            }

            const place = await response.json();

            const details = {
                id: place.id,
                name: place.displayName?.text,
                address: place.formattedAddress,
                website: place.websiteUri,
                phone: place.internationalPhoneNumber,
                googleMapsUrl: place.googleMapsUri
            };

            // Salvar no cache (permanente para detalhes)
            this.saveToCache(cacheKey, details, Infinity);

            return details;

        } catch (error: any) {
            console.error('Google Maps Details Error:', error);
            throw new Error(error.message || 'Erro ao buscar detalhes. Tente novamente.');
        }
    }

    /**
     * 🎲 Randomização Fisher-Yates (embaralha array)
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * 💾 Salvar no cache
     */
    private saveToCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * 📥 Buscar do cache
     */
    private getFromCache(key: string): any | null {
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Verificar se expirou
        if (Date.now() - entry.timestamp > this.CACHE_TTL) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * 🧹 Limpar cache antigo
     */
    private clearOldCache(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.CACHE_TTL) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 📊 Estatísticas do cache (para debug)
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton - Instância única do serviço
export const googleMapsService = new GoogleMapsService(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_API_KEY || ''
);
