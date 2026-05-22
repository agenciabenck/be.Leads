import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // 1. Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        let bodyParsed: any = {};
        try {
            bodyParsed = await req.json();
        } catch (jsonErr) {
            console.error('JSON parsing error:', jsonErr);
            return new Response(
                JSON.stringify({ error: 'Formato de requisição inválido.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        const { action, query, maxResults = 20, placeId } = bodyParsed;
        
        // Setup API Keys (Rotation)
        const keysRaw = Deno.env.get('GOOGLE_PLACES_API_KEYS') || Deno.env.get('GOOGLE_MAPS_API_KEY') || '';
        let apiKeys = keysRaw.split(',').map(k => k.trim()).filter(Boolean);
        
        if (apiKeys.length === 0) {
            console.error('GOOGLE_PLACES_API_KEYS is not set');
            return new Response(
                JSON.stringify({ error: 'System configuration error. Missing Google Places API Key.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        // Embaralha para balanceamento e fallback
        apiKeys = apiKeys.sort(() => Math.random() - 0.5);

        // Action: search (Google Places API v1)
        if (action === 'search') {
            if (!query) {
                return new Response(
                    JSON.stringify({ error: 'Query is missing' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                );
            }

            console.log(`[search-maps] Buscando no Google Places API para: "${query}" com maxResults: ${maxResults}`);

            let lastError = null;
            let allPlaces: any[] = [];
            let currentToken: string | null = null;
            let totalFetched = 0;
            const targetCount = Math.min(40, maxResults || 20);

            for (const key of apiKeys) {
                try {
                    let pageCount = 0;
                    
                    while (totalFetched < targetCount && pageCount < 2) { // max 2 pages for 40 results
                        const reqBody: any = {
                            textQuery: query,
                            maxResultCount: 20,
                            languageCode: 'pt-BR'
                        };
                        if (currentToken) {
                            reqBody.pageToken = currentToken;
                        }

                        const response = await fetch(
                            'https://places.googleapis.com/v1/places:searchText',
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Goog-Api-Key': key,
                                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber,places.googleMapsUri,places.rating,places.userRatingCount,nextPageToken'
                                },
                                body: JSON.stringify(reqBody),
                                signal: AbortSignal.timeout(10000)
                            }
                        );

                        if (!response.ok) {
                            const textError = await response.text();
                            console.error(`Google Places API Error on key ...${key.slice(-4)}: ${response.status} - ${textError}`);
                            lastError = `Google Error: ${response.status}`;
                            break; // Tenta próxima chave no caso de falha HTTP
                        }

                        const data = await response.json();
                        const pagePlaces = data.places || [];
                        allPlaces = allPlaces.concat(pagePlaces);
                        totalFetched += pagePlaces.length;

                        // Se não retornou token para próxima página, ou se a página veio vazia, interrompe
                        if (!data.nextPageToken || pagePlaces.length === 0) {
                            break;
                        }

                        currentToken = data.nextPageToken;
                        pageCount++;
                        
                        // O Google Places v1 exige um leve delay se chamarmos nextPageToken imediatamente.
                        // Caso a API rejeite INVALID_ARGUMENT (token não está pronto), podemos dormir um pouco,
                        // Mas para evitar lentidão excessiva, fazemos um sleep leve de 1000ms.
                        if (totalFetched < targetCount) {
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                    
                    // Se conseguimos dados com essa chave, podemos sair do loop de chaves
                    if (allPlaces.length > 0) {
                        break;
                    }
                } catch (fetchErr: any) {
                    console.error(`Fetch to Google Places failed on key ...${key.slice(-4)}:`, fetchErr);
                    lastError = fetchErr.message;
                }
            }

            if (allPlaces.length === 0) {
                return new Response(
                    JSON.stringify({ error: `A busca falhou ou nenhum resultado foi encontrado. Erro: ${lastError}` }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                );
            }

            // O Google pode não retornar places se não achar nada
            const rawPlaces = allPlaces.slice(0, targetCount);

            // Mapeamento para o formato esperado pelo frontend 
            const places = rawPlaces.map((item: any) => {
                const payload = {
                    i: item.id || '',
                    n: item.displayName?.text || '',
                    a: item.formattedAddress || '',
                    w: item.websiteUri || '',
                    p: item.internationalPhoneNumber || '',
                    u: item.googleMapsUri || '',
                    r: item.rating || 0,
                    rc: item.userRatingCount || 0
                };
                
                const encodedId = `goog_${btoa(encodeURIComponent(JSON.stringify(payload)))}`;

                return {
                    id: encodedId,
                    displayName: { text: item.displayName?.text || 'Sem nome' },
                    formattedAddress: item.formattedAddress || 'Endereço não disponível',
                    websiteUri: item.websiteUri,
                    internationalPhoneNumber: item.internationalPhoneNumber,
                    googleMapsUri: item.googleMapsUri,
                    rating: item.rating || 0,
                    userRatingCount: item.userRatingCount || 0
                };
            });

            return new Response(
                JSON.stringify({ places }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        // Action: details (Decode details from ID)
        else if (action === 'details') {
            if (!placeId) {
                return new Response(
                    JSON.stringify({ error: 'Place ID is missing' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                );
            }

            if (placeId.startsWith('goog_') || placeId.startsWith('apf_')) {
                // A tag apf_ é suportada para compatibilidade retroativa com drafts antigos
                const encodedData = placeId.substring(5);
                try {
                    const decoded = JSON.parse(decodeURIComponent(atob(encodedData)));
                    return new Response(
                        JSON.stringify({
                            id: placeId,
                            displayName: { text: decoded.n || 'Sem nome' },
                            formattedAddress: decoded.a || 'Endereço não disponível',
                            websiteUri: decoded.w,
                            internationalPhoneNumber: decoded.p,
                            googleMapsUri: decoded.u
                        }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                    );
                } catch (e) {
                    console.error('Error decoding placeId:', e);
                    return new Response(
                        JSON.stringify({ error: 'Erro ao decodificar detalhes do local.' }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                    );
                }
            } else {
                return new Response(
                    JSON.stringify({ error: 'Este ID não é válido e não pode ser decodificado.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                );
            }
        }

        else {
            return new Response(
                JSON.stringify({ error: 'Unknown action' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

    } catch (error: any) {
        console.error('Search Maps Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    }
});
