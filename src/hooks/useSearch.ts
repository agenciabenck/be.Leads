import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { googleMapsService } from '@/services/googleMapsService';
import { Lead, SearchState, SearchFilters, UserPlan, SearchHistoryItem } from '@/types/types';
import { LOADING_MESSAGES, PLAN_CREDITS } from '@/constants/appConstants';

export const useSearch = (globalHistory: string[], onCreditsUsed?: (newUsed: number) => void) => {
    const [query, setQuery] = useState('');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [state, setState] = useState<SearchState>({ isSearching: false, error: null, hasSearched: false });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({ maxResults: 10, minRating: 0, requirePhone: true });
    const [searchMode, setSearchMode] = useState<'free' | 'guided'>('free');
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [appendMode, setAppendMode] = useState(true);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

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

    const handleSearch = async (e?: React.FormEvent, shouldClear: boolean = false) => {
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
                .maybeSingle();
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
                used = 0;
                lastReset = now;
                await supabase
                    .from('user_subscriptions')
                    .update({ leads_used: 0, last_credit_reset: now.toISOString() })
                    .eq('user_id', user.id);
            }
        } else {
            await supabase
                .from('user_subscriptions')
                .upsert({ user_id: user.id, last_credit_reset: now.toISOString(), plan_id: 'free', leads_used: 0, status: 'active' });
        }

        const remainingCredits = limit - used;
        const requestedQuantity = filters.maxResults || 20;

        if (used >= limit) {
            setState(prev => ({ ...prev, error: 'Limite de leads atingido para seu plano este mês. Faça um upgrade para continuar!' }));
            return;
        }

        if (requestedQuantity > remainingCredits) {
            setState(prev => ({
                ...prev,
                error: `Você possui apenas ${remainingCredits} créditos restantes. Por favor, selecione uma busca de ${remainingCredits <= 10 ? '10' : '20'} resultados ou faça um upgrade.`
            }));
            return;
        }

        if (shouldClear) setLeads([]);
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
                if (!query) {
                    setState(prev => ({ ...prev, isSearching: false, error: 'Digite o que deseja buscar.' }));
                    return;
                }
                searchQueries.push(query);
            }

            for (const currentQuery of searchQueries) {
                if (allValidResults.length >= requestedQuantity) break;

                let currentToken: string | undefined = undefined;
                let pageCount = 0;
                const maxPages = 5;

                while (allValidResults.length < requestedQuantity && pageCount < maxPages) {
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

                    if (searchMode === 'guided' && selectedState) {
                        const stateCode = selectedState.toUpperCase();
                        filtered = filtered.filter(r => {
                            const addr = r.address.toUpperCase();
                            return addr.includes(`, ${stateCode}`) || addr.includes(` - ${stateCode}`) || addr.includes(stateCode);
                        });
                    }

                    const newUnique = filtered.filter(nl =>
                        !allValidResults.some(el => el.id === nl.id) &&
                        !globalHistory.includes(nl.id) &&
                        !leads.some(el => el.id === nl.id)
                    );

                    allValidResults = [...allValidResults, ...newUnique];
                    currentToken = nextToken;
                    pageCount++;

                    if (!nextToken || allValidResults.length >= requestedQuantity) break;
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            const finalResults = allValidResults.slice(0, requestedQuantity);

            if (finalResults.length > 0) {
                setLeads(prev => [...prev, ...finalResults]);
                const newTotal = used + finalResults.length;

                // ATUALIZAR CRÉDITOS NO SUPABASE
                await supabase
                    .from('user_subscriptions')
                    .update({ leads_used: newTotal })
                    .eq('user_id', user.id);

                if (onCreditsUsed) onCreditsUsed(newTotal);

                // SALVAR NO HISTÓRICO DIÁRIO
                const historyEntries = finalResults.map(lead => ({
                    user_id: user.id,
                    query: searchQueries[0],
                    search_mode: searchMode,
                    lead_name: lead.name,
                    lead_phone: lead.phone,
                    lead_id: lead.id
                }));
                await supabase.from('search_history').insert(historyEntries);
            } else {
                setState(prev => ({ ...prev, error: 'Nenhum lead novo encontrado para esta busca.' }));
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

            const remainingCredits = limit - used;

            if (used >= limit) {
                throw new Error('Limite de leads atingido para seu plano este mês. Faça um upgrade para continuar!');
            }

            if (quantity > remainingCredits) {
                throw new Error(`Você possui apenas ${remainingCredits} créditos restantes. Por favor, selecione uma carga de ${remainingCredits <= 10 ? '10' : '20'} resultados.`);
            }

            const requestedAmount = quantity;
            const currentQuery = searchMode === 'free' ? query : `${selectedNiche} em ${selectedCity}, ${selectedState}`;
            let allValidResults: Lead[] = [];
            let currentToken: string | undefined = undefined;
            let attempts = 0;
            const maxAttempts = 10;

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

            if (finalResults.length > 0) {
                setLeads(prev => [...prev, ...finalResults]);
                const newTotal = used + finalResults.length;

                await supabase
                    .from('user_subscriptions')
                    .update({ leads_used: newTotal })
                    .eq('user_id', user.id);

                if (onCreditsUsed) onCreditsUsed(newTotal);

                // SALVAR NO HISTÓRICO DIÁRIO
                const historyEntries = finalResults.map(lead => ({
                    user_id: user.id,
                    query: currentQuery,
                    search_mode: searchMode,
                    lead_name: lead.name,
                    lead_phone: lead.phone,
                    lead_id: lead.id
                }));
                await supabase.from('search_history').insert(historyEntries);
            } else {
                throw new Error('Nenhum lead novo encontrado para esta carga.');
            }

        } catch (err: any) {
            console.error('[LoadMore] Erro:', err);
            setState(prev => ({ ...prev, error: err.message }));
        } finally {
            setIsLoadingMore(false);
        }
    };

    const loadSearchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const last9AM = new Date();
        last9AM.setHours(9, 0, 0, 0);
        if (now.getHours() < 9) {
            last9AM.setDate(last9AM.getDate() - 1);
        }

        const { data, error } = await supabase
            .from('search_history')
            .select('id, lead_name, lead_phone, lead_id, created_at')
            .eq('user_id', user.id)
            .gte('created_at', last9AM.toISOString())
            .not('lead_name', 'is', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao carregar histórico:', error);
            return;
        }

        setSearchHistory(data || []);
    };

    const clearSearchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('search_history')
            .delete()
            .eq('user_id', user.id);

        setSearchHistory([]);
    };

    return {
        query, setQuery,
        leads, setLeads,
        state, setState,
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
        isLoadingMore,
        appendMode,
        setAppendMode,
        searchHistory,
        loadSearchHistory,
        clearSearchHistory,
        showHistoryModal,
        setShowHistoryModal
    };
};
