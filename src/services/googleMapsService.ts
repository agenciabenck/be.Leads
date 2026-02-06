
import { createClient } from '@supabase/supabase-js';

// Interface para o resultado simplificado que queremos (baixo custo)
export interface BusinessLead {
    id: string;
    name: string;
    address: string;
    rating?: number;
    userRatingCount?: number;
    website?: string;
    phone?: string;
    googleMapsUrl?: string;
}

const GOOGLE_PLACES_API_BASE = 'https://places.googleapis.com/v1';

// Campos específicos para 'Field Masking' - Reduz custo buscando apenas o necessário
// Documentação: https://developers.google.com/maps/documentation/places/web-service/choose-fields
const SEARCH_FIELDS = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.rating',
    'places.userRatingCount'
].join(',');

const DETAILS_FIELDS = [
    'id',
    'displayName',
    'formattedAddress',
    'websiteUri',
    'internationalPhoneNumber',
    'googleMapsUri'
].join(',');

export class GoogleMapsService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Busca lugares baseado em um texto (ex: "Advogados em São Paulo")
     * Custo: Text Search (ID Only) - Baixo custo se usar apenas ID, mas aqui pegamos nome/endereço para listar.
     */
    async searchBusiness(query: string): Promise<BusinessLead[]> {
        try {
            const response = await fetch(`${GOOGLE_PLACES_API_BASE}/places:searchText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': this.apiKey,
                    'X-Goog-FieldMask': SEARCH_FIELDS, // MÁSCARA DE CAMPOS É CRUCIAL PARA O CUSTO
                },
                body: JSON.stringify({
                    textQuery: query,
                    languageCode: 'pt-BR' // Resultados em português
                }),
            });

            if (!response.ok) {
                throw new Error(`Google API Error: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.places) return [];

            return data.places.map((place: any) => ({
                id: place.id,
                name: place.displayName?.text || 'Sem nome',
                address: place.formattedAddress || 'Endereço não disponível',
                rating: place.rating,
                userRatingCount: place.userRatingCount,
            }));

        } catch (error) {
            console.error('Error searching places:', error);
            throw error;
        }
    }

    /**
     * Busca detalhes de contato de um lugar específico
     * Custo: Place Details (Basic + Contact)
     * Chamamos isso APENAS quando o usuário clica para "Revelar" ou "Salvar" o lead.
     */
    async getPlaceDetails(placeId: string): Promise<Partial<BusinessLead>> {
        try {
            const response = await fetch(`${GOOGLE_PLACES_API_BASE}/places/${placeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': this.apiKey,
                    'X-Goog-FieldMask': DETAILS_FIELDS, // PEGANDO APENAS DETALHES NECESSÁRIOS
                },
            });

            if (!response.ok) {
                throw new Error(`Google API Details Error: ${response.statusText}`);
            }

            const place = await response.json();

            return {
                id: place.id,
                name: place.displayName?.text,
                address: place.formattedAddress,
                website: place.websiteUri,
                phone: place.internationalPhoneNumber,
                googleMapsUrl: place.googleMapsUri
            };

        } catch (error) {
            console.error('Error fetching details:', error);
            throw error;
        }
    }
}

// Singleton ou export simples
export const googleMapsService = new GoogleMapsService(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
