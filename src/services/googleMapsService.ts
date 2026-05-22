
import { supabase } from '@/services/supabase';

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
    types?: string[]; // Categorias do Google
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
    private cache: Map<string, CacheEntry> = new Map();
    private readonly CACHE_TTL = 3600000; // 1 hora
    private readonly STORAGE_KEY_TOKENS = 'beleadly_google_search_tokens';

    constructor() {
        // Limpar cache antigo a cada 30 minutos
        setInterval(() => this.clearOldCache(), 1800000);
    }

    /**
     * Store and retrieve tokens from localStorage so pagination persists across refreshes
     */
    private getMemory(): Record<string, { token: string; timestamp: number }> {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY_TOKENS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    private saveMemory(memory: Record<string, { token: string; timestamp: number }>) {
        try {
            localStorage.setItem(this.STORAGE_KEY_TOKENS, JSON.stringify(memory));
        } catch (e) {
            console.error('[GoogleMaps] Failed to save token memory to localStorage', e);
        }
    }

    getNextTokenForQuery(query: string): string | undefined {
        const memory = this.getMemory();
        const entry = memory[query.toLowerCase().trim()];
        
        // Tokens expire after 6 hours (just in case Google expires them)
        if (entry && Date.now() - entry.timestamp < 21600000) {
            return entry.token;
        }
        return undefined;
    }

    rememberTokenForQuery(query: string, token: string | undefined) {
        const memory = this.getMemory();
        const key = query.toLowerCase().trim();
        
        if (!token) {
            delete memory[key];
        } else {
            memory[key] = { token, timestamp: Date.now() };
        }
        
        this.saveMemory(memory);
        console.log(`[GoogleMaps] Pagination memory updated for: "${query.substring(0, 30)}..." (Has Token: ${!!token})`);
    }

    async searchBusiness(
        query: string,
        maxResults: number = 20,
        randomize: boolean = true,
        pageToken?: string,
        signal?: AbortSignal
    ): Promise<{ places: BusinessLead[], nextToken?: string }> {
        try {
            // NO CACHE for search results — every search hits the API fresh
            // This ensures repeated searches can return different results

            let data: any = null;
                    const res = await supabase.functions.invoke('search-maps', {
                        body: {
                            action: 'search',
                            query,
                            maxResults: Math.min(maxResults, 50),
                            pageToken: pageToken || undefined,
                            randomize,
                        },
                        signal
                    });
                    if (res.error) throw res.error;
                    if (res.data?.error) throw new Error(res.data.error);
                    data = res.data;

            if (!data?.places || data.places.length === 0) {
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

            let finalResults = results;
            // Introduce a small drop-out rate to force deep pagination and true randomization
            // This guarantees different users searching the same query get different leads
            // by forcing the system to dig deeper into Google Maps pagination.
            if (randomize && results.length > 5) {
                // Keep roughly 90% of leads (was 60%), discard the rest randomly to avoid wasting API hits
                finalResults = results.filter(() => Math.random() > 0.1);
            }

            return {
                places: randomize ? this.shuffleArray(finalResults) : finalResults,
                nextToken: data.nextPageToken
            };

        } catch (error: any) {
            if (error.name === 'AbortError' || error.message?.includes('aborted') || signal?.aborted) {
                throw error;
            }
            console.error('Google Maps Search Error:', error);
            if (error.message?.includes('API key')) {
                throw new Error('Chave da API inválida. Verifique as configurações.');
            }
            if (error.message?.includes('quota')) {
                throw new Error('Limite de buscas atingido. Tente novamente mais tarde.');
            }
            if (error.message?.includes('Failed to send a request') || error.message?.includes('Edge Function') || error.message?.includes('fetch failed')) {
                throw new Error('Não foi possível conectar ao servidor de buscas no momento. O serviço pode estar temporariamente indisponível ou congestionado. Por favor, tente novamente em alguns instantes.');
            }
            throw new Error(error.message || 'Erro ao buscar leads. Tente novamente.');
        }
    }

    async fetchReviews(query: string): Promise<any> {
        try {
            const res = await supabase.functions.invoke('search-maps', {
                body: {
                    action: 'search',
                    query,
                    maxResults: 1,
                    includeReviews: true,
                }
            });
            if (res.error) throw res.error;
            return res.data;
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return null;
        }
    }

    /**
     * 📞 Busca detalhes de contato (Place Details Essentials)
     * IMPORTANTE: Só chamar quando usuário clicar em "Revelar Contato"
     */
    async getPlaceDetails(placeId: string): Promise<Partial<BusinessLead>> {
        try {
            const cacheKey = `details_${placeId}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            let data: any = null;
                const res = await supabase.functions.invoke('search-maps', {
                    body: { action: 'details', placeId },
                });
                if (res.error) throw res.error;
                if (res.data?.error) throw new Error(res.data.error);
                data = res.data;

            const details = {
                id: data.id,
                name: data.displayName?.text,
                address: data.formattedAddress,
                website: data.websiteUri,
                phone: data.internationalPhoneNumber,
                googleMapsUrl: data.googleMapsUri
            };

            this.saveToCache(cacheKey, details, Infinity);
            return details;

        } catch (error: any) {
            console.error('Google Maps Details Error:', error);
            if (error.message?.includes('Failed to send a request') || error.message?.includes('Edge Function') || error.message?.includes('fetch failed')) {
                throw new Error('Não foi possível conectar ao servidor para obter detalhes. O serviço pode estar temporariamente congestionado. Tente novamente.');
            }
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

// Singleton - Instância única do serviço (no API key needed - handled by Edge Function)
export const googleMapsService = new GoogleMapsService();
