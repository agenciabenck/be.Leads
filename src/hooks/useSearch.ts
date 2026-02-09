import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { googleMapsService } from '@/services/googleMapsService';
import { Lead, SearchState, SearchFilters, UserPlan } from '@/types/types';
import { LOADING_MESSAGES, PLAN_CREDITS } from '@/constants/appConstants';

export const useSearch = (globalHistory: string[]) => {
    const [query, setQuery] = useState('');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [state, setState] = useState<SearchState>({ isSearching: false, error: null, hasSearched: false });
    const [filters, setFilters] = useState<SearchFilters>({ maxResults: 10, minRating: 0, requirePhone: true });
    const [searchMode, setSearchMode] = useState<'free' | 'guided'>('free');
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    // Guided Search State
    const [selectedNiche, setSelectedNiche] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [excludedCity, setExcludedCity] = useState('');
    const [cityList, setCityList] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    // IBGE City Loader
    useEffect(() => {
        if (!selectedState) {
            setCityList([]);
            return;
        }
        setIsLoadingCities(true);
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`)
            .then(res => res.json())
            .then(data => {
                setCityList(data.map((c: any) => c.nome).sort());
                setIsLoadingCities(false);
            })
            .catch(() => setIsLoadingCities(false));
    }, [selectedState]);

    // Loading Messages Animation
    useEffect(() => {
        let interval: any;
        if (state.isSearching) {
            interval = setInterval(() => {
                setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [state.isSearching]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // --- LÓGICA DE CRÉDITOS E RESET MENSAL ---
        let subscriptionData: any = null;
        try {
            const { data } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle(); // Use maybeSingle to avoid 406 errors
            subscriptionData = data;
        } catch (err) {
            console.error('Erro ao buscar créditos:', err);
        }

        const now = new Date();
        const plan = subscriptionData?.plan_id || 'free';
        const limit = PLAN_CREDITS[plan as UserPlan] || 60;
        let used = subscriptionData?.leads_used || 0;
        let lastReset = subscriptionData?.last_credit_reset ? new Date(subscriptionData.last_credit_reset) : null;

        // Reset Mensal se necessário
        if (lastReset) {
            const nextReset = new Date(lastReset);
            nextReset.setMonth(nextReset.getMonth() + 1);

            if (now >= nextReset) {
                console.log('[Créditos] Reset mensal detectado. Renovando Leads...');
                used = 0;
                lastReset = now;
                await supabase
                    .from('user_subscriptions')
                    .update({ leads_used: 0, last_credit_reset: now.toISOString() })
                    .eq('user_id', user.id);
            }
        } else {
            // Primeira vez ou erro, inicializa
            await supabase
                .from('user_subscriptions')
                .upsert({ user_id: user.id, last_credit_reset: now.toISOString(), plan_id: 'free', leads_used: 0, status: 'active' });
        }

        if (used >= limit) {
            setState(prev => ({ ...prev, error: 'Limite de leads atingido para seu plano este mês. Faça um upgrade para continuar!' }));
            return;
        }

        // --- FIM LÓGICA DE CRÉDITOS ---

        const requestedAmount = Math.min(filters.maxResults || 20, limit - used);
        if (requestedAmount <= 0) {
            setState(prev => ({ ...prev, error: 'Você não possui créditos suficientes para esta busca.' }));
            return;
        }

        setState({ isSearching: true, error: null, hasSearched: true });

        try {
            let allValidResults: Lead[] = [];
            const searchQueries: string[] = [];

            if (searchMode === 'guided') {
                if (!selectedNiche || !selectedState) {
                    setState(prev => ({ ...prev, isSearching: false, error: 'Nicho e Estado são obrigatórios na busca guiada.' }));
                    return;
                }

                if (selectedCity) {
                    let q = `${selectedNiche} em ${selectedCity}, ${selectedState}, Brasil`;
                    if (excludedCity) q += ` -${excludedCity}`;
                    searchQueries.push(q);
                } else {
                    // MULTI-CITY SEARCH: If state selected but no city, use major cities
                    const { MAIOR_CIDADES } = await import('@/constants/appConstants');
                    const cities = MAIOR_CIDADES[selectedState] || [];

                    if (cities.length > 0) {
                        cities.forEach(city => {
                            searchQueries.push(`${selectedNiche} em ${city}, ${selectedState}, Brasil`);
                        });
                    } else {
                        searchQueries.push(`${selectedNiche} no estado de ${selectedState}, Brasil`);
                    }
                }
            } else {
                searchQueries.push(query);
            }

            console.log(`[Busca] Iniciando para: ${searchQueries.length} query(s) | Alvo: ${requestedAmount}`);

            for (const currentQuery of searchQueries) {
                if (allValidResults.length >= requestedAmount) break;

                let currentToken: string | undefined = undefined;
                let pageCount = 0;
                const maxPages = 5; // Limite de páginas por nicho/cidade para não esgotar quota atoa

                while (allValidResults.length < requestedAmount && pageCount < maxPages) {
                    console.log(`[Busca] Paginação ${pageCount + 1}: "${currentQuery}"`);
                    const { places: gResults, nextToken } = await googleMapsService.searchBusiness(currentQuery, 20, true, currentToken);

                    if (!gResults || gResults.length === 0) break;

                    const mappedResults: Lead[] = gResults.map(r => ({
                        id: r.id,
                        name: r.name,
                        category: selectedNiche || r.types?.[0] || 'Lead',
                        address: r.address,
                        rating: r.rating || 0,
                        reviews: r.userRatingCount || 0,
                        phone: r.phone || 'N/A',
                        website: r.website || 'N/A',
                        instagram: 'N/A',
                        googleMapsLink: r.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.address)}`
                    }));

                    let filtered = mappedResults;
                    if (filters.requirePhone) {
                        filtered = filtered.filter(r => r.phone && r.phone !== 'N/A');
                    }

                    // Strict state filtering for guided mode
                    if (searchMode === 'guided' && selectedState) {
                        const stateCode = selectedState.toUpperCase();
                        filtered = filtered.filter(r => {
                            const addr = r.address.toUpperCase();
                            return addr.includes(`, ${stateCode}`) || addr.includes(` - ${stateCode}`) || addr.includes(stateCode);
                        });
                    }

                    const newUnique = filtered.filter(nl =>
                        !allValidResults.some(el => el.id === nl.id) &&
                        !globalHistory.includes(nl.id)
                    );

                    allValidResults = [...allValidResults, ...newUnique];
                    currentToken = nextToken;
                    pageCount++;

                    if (!nextToken || allValidResults.length >= requestedAmount) break;

                    // Pequeno delay para evitar rate limit da API se estivermos paginando muito rápido
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            const finalResults = allValidResults.slice(0, requestedAmount);
            setLeads(finalResults);

            // Atualiza uso no banco
            if (finalResults.length > 0) {
                await supabase
                    .from('user_subscriptions')
                    .update({ leads_used: used + finalResults.length })
                    .eq('user_id', user.id);
            }

        } catch (err: any) {
            setState(prev => ({ ...prev, error: err.message }));
        } finally {
            setState(prev => ({ ...prev, isSearching: false }));
        }
    };

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const handleLoadMore = async (quantity: number) => {
        setIsLoadingMore(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: subscriptionData } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            const plan = subscriptionData?.plan_id || 'free';
            const limit = PLAN_CREDITS[plan as UserPlan] || 60;
            const used = subscriptionData?.leads_used || 0;

            if (used >= limit) {
                throw new Error('Limite de leads atingido para seu plano este mês.');
            }

            const remainingCredits = limit - used;
            const requestedAmount = Math.min(quantity, remainingCredits);

            const currentQuery = searchMode === 'free' ? query : `${selectedNiche} em ${selectedCity}, ${selectedState}`;
            let allValidResults: Lead[] = [];
            let currentToken: string | undefined = undefined;
            let attempts = 0;
            const maxAttempts = 10;

            console.log(`[LoadMore] Iniciando | Disponível: ${remainingCredits}`);

            while (allValidResults.length < requestedAmount && attempts < maxAttempts) {
                const { places: gResults, nextToken } = await googleMapsService.searchBusiness(currentQuery, 20, true, currentToken);
                if (!gResults || gResults.length === 0) break;

                const mappedResults: Lead[] = gResults.map(r => ({
                    id: r.id, name: r.name, category: selectedNiche || 'Lead',
                    address: r.address, rating: r.rating || 0, reviews: r.userRatingCount || 0,
                    phone: r.phone || 'N/A', website: r.website || 'N/A',
                    instagram: 'N/A', googleMapsLink: r.googleMapsUrl || ''
                }));

                let filtered = mappedResults;
                if (filters.requirePhone) filtered = filtered.filter(r => r.phone && r.phone !== 'N/A');

                const newUnique = filtered.filter(nl =>
                    !leads.some(el => el.id === nl.id) &&
                    !allValidResults.some(el => el.id === nl.id) &&
                    !globalHistory.includes(nl.id)
                );

                allValidResults = [...allValidResults, ...newUnique];
                currentToken = nextToken;
                attempts++;
                if (!nextToken) break;
            }

            const finalResults = allValidResults.slice(0, requestedAmount);
            setLeads(prev => [...prev, ...finalResults]);

            if (finalResults.length > 0) {
                await supabase
                    .from('user_subscriptions')
                    .update({ leads_used: used + finalResults.length })
                    .eq('user_id', user.id);
            }

        } catch (err: any) {
            console.error('[LoadMore] Erro:', err);
            setState(prev => ({ ...prev, error: err.message }));
        } finally {
            setIsLoadingMore(false);
        }
    };

    return {
        query, setQuery,
        leads, setLeads,
        state, setState, // Exportando setState para o App.tsx
        filters, setFilters,
        searchMode, setSearchMode,
        loadingMessageIndex,
        selectedNiche, setSelectedNiche,
        selectedState, setSelectedState,
        selectedCity, setSelectedCity,
        excludedCity, setExcludedCity,
        cityList,
        isLoadingCities,
        handleSearch,
        handleLoadMore,
        isLoadingMore
    };
};
