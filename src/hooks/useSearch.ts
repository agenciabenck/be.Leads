import { useState, useEffect, useCallback } from 'react';
import { normalizeString } from '@/utils/formatUtils';
import { getUserData } from '@/utils/storageUtils';
import { supabase } from '@/services/supabase';
import { googleMapsService } from '@/services/googleMapsService';
import { apifyService } from '@/services/apifyService';
import { Lead, SearchState, SearchFilters, UserPlan, SearchHistoryItem } from '@/types/types';
import { LOADING_MESSAGES, PLAN_CREDITS, MAIOR_CIDADES, CIDADES_SECUNDARIAS, CAPITAL_NEIGHBORHOODS } from '@/constants/appConstants';

export const useSearch = (user: any, globalHistory: string[], onCreditsUsed?: (newUsed: number) => void) => {
    const [query, setQuery] = useState('');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [state, setState] = useState<SearchState>({ isSearching: false, error: null, hasSearched: false });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({ maxResults: 20, phoneFilter: 'required', websiteFilter: 'any', ratingFilter: 'any' });
    const [searchMode, setSearchMode] = useState<'free' | 'guided' | 'chat'>('free');
    const [searchSource, setSearchSource] = useState<any>('maps');
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [appendMode, setAppendMode] = useState(true);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

    // Guided Search State
    const [selectedCountry, setSelectedCountry] = useState('BR');
    const [selectedNiche, setSelectedNiche] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [excludedCity, setExcludedCity] = useState('');
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [excludedCities, setExcludedCities] = useState<string[]>([]);
    const [cityList, setCityList] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    // AI Chat Search State
    const [isParsingPrompt, setIsParsingPrompt] = useState(false);
    const [parsingStatus, setParsingStatus] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [conversationalFeedback, setConversationalFeedback] = useState<{
        type: 'info' | 'missing_info' | 'success';
        message: string;
        missingFields?: ('niche' | 'location')[];
    } | null>(null);
    const [chatContext, setChatContext] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<{ id: string; sender: 'user' | 'assistant'; text: string; timestamp: Date; confirmationData?: { niche: string; city: string; state: string; quantity: number } }[]>([]);

    // --- Persistência de Resultados (Local Storage) ---
    useEffect(() => {
        if (!user?.id) return;
        const savedStr = localStorage.getItem(`beleadly_last_search_state_${user.id}`);
        if (savedStr) {
            try {
                const saved = JSON.parse(savedStr);
                if (saved && saved.leads && saved.leads.length > 0) {
                    setLeads(saved.leads);
                    if (saved.query) setQuery(saved.query);
                    if (saved.searchSource) setSearchSource(saved.searchSource);
                    if (saved.searchMode) setSearchMode(saved.searchMode);
                    if (saved.selectedNiche) setSelectedNiche(saved.selectedNiche);
                    if (saved.selectedState) setSelectedState(saved.selectedState);
                    if (saved.selectedCity) setSelectedCity(saved.selectedCity);
                    if (saved.selectedCities) setSelectedCities(saved.selectedCities);
                    if (saved.chatMessages) setChatMessages(saved.chatMessages);
                    setState({ isSearching: false, error: null, hasSearched: true });
                }
            } catch (e) {
                console.error('[Search] Falha ao carregar estado da busca:', e);
            }
        }
    }, [user?.id]); // Executa apenas uma vez quando o usuário loga ou a página recarrega

    useEffect(() => {
        if (!user?.id) return;
        if (leads.length === 0 && !state.isSearching && !state.hasSearched) {
            // Se limpou e não está buscando, não sobrescreve com vazio
            return;
        }
        if (leads.length > 0) {
            const stateToSave = {
                leads,
                query,
                searchSource,
                searchMode,
                selectedNiche,
                selectedState,
                selectedCity,
                selectedCities,
                chatMessages
            };
            localStorage.setItem(`beleadly_last_search_state_${user.id}`, JSON.stringify(stateToSave));
        }
    }, [leads, query, searchSource, searchMode, selectedNiche, selectedState, selectedCity, selectedCities, chatMessages, user?.id, state.isSearching, state.hasSearched]);
    // --------------------------------------------------


    // Mensagem dinâmica ao abrir a aba de Chat AI
    useEffect(() => {
        if (searchMode === 'chat' && chatMessages.length === 0) {
            setIsParsingPrompt(true);
            setParsingStatus('Iniciando assistente Beleadly AI...');
            const timer = setTimeout(() => {
                const greetings = [
                    'Olá! Sou o assistente de IA do Beleadly. Qual é o seu público-alvo (ex: imobiliárias, clínicas, energia solar) e a região ou DDD que deseja prospectar hoje?',
                    'Boas-vindas ao Beleadly AI! Me diga o tipo de empresa ou profissional que você busca e a localidade (cidade, estado ou DDD) para iniciarmos a extração.',
                    'Olá! Pronto para decolar sua prospecção? Descreva o nicho que você precisa encontrar e a região desejada. Farei a varredura completa para você!',
                    'Saudações! Sou sua inteligência artificial de vendas. Me informe o setor (ex: arquitetos, contabilidade) e a localização para trazermos os melhores leads.'
                ];
                const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
                setChatMessages([
                    {
                        id: `welcome-${Date.now()}`,
                        sender: 'assistant',
                        text: randomGreeting,
                        timestamp: new Date()
                    }
                ]);
                setIsParsingPrompt(false);
            }, 600);

            return () => clearTimeout(timer);
        }
    }, [searchMode, chatMessages.length]);


    // IBGE City Loader
    useEffect(() => {
        if (!selectedState) {
            setCityList([]);
            setSelectedCities([]);
            setExcludedCities([]);
            setSelectedCity('');
            setExcludedCity('');
            return;
        }
        setIsLoadingCities(true);
        setSelectedCities([]);
        setExcludedCities([]);
        setSelectedCity('');
        setExcludedCity('');
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

    // Helper: fetch one query (up to maxPages) sequentially
    const fetchQuery = useCallback(async (
        currentQuery: string, 
        targetCount: number, 
        startToken?: string,
        customNiche?: string,
        customState?: string,
        customExcluded?: string,
        customPhoneFilter: 'required' | 'excluded' | 'any' = 'required',
        customWebsiteFilter: 'required' | 'excluded' | 'any' = 'any',
        customRatingFilter: 'any' | 'high' | 'low' = 'any',
        existingIds: string[] = []
    ): Promise<{ results: Lead[], lastToken?: string }> => {
        let results: Lead[] = [];
        let currentToken = startToken;
        let pageCount = 0;
        // Aumenta o limite de maxPages para garantir iteração exaustiva até cumprir a meta
        // OPTIMIZATION: Reduced from 8-15 to 3-5 to prevent extremely slow searches when leads are scarce
        const maxPages = Math.max(3, Math.min(5, Math.ceil(targetCount / 10)));

        while (results.length < targetCount && pageCount < maxPages) {
            // randomize = true para garantir alta aleatoriedade e rotação de leads
            // Aumentamos para no mínimo 30 e no máximo 50 para evitar loops infinitos quando muitos leads são filtrados
            const requestedAmount = Math.max(30, Math.min(targetCount - results.length, 50));
            const { places: gResults, nextToken } = await googleMapsService.searchBusiness(currentQuery, requestedAmount, true, currentToken);
            if (!gResults || gResults.length === 0) break;

            const mappedResults: Lead[] = gResults.map(r => {
                const activeCategory = searchMode === 'guided' ? (selectedNiche || r.types?.[0] || 'Lead') : (customNiche || r.types?.[0] || 'Lead');
                return {
                    id: r.id,
                    name: r.name,
                    category: activeCategory,
                    address: r.address,
                    rating: r.rating || 0,
                    reviews: r.userRatingCount || 0,
                    phone: r.phone || 'N/A',
                    website: r.website || 'N/A',
                    instagram: 'N/A',
                    googleMapsLink: r.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.address)}`
                };
            });

            let filtered = mappedResults;
            // O usuário pediu para manter o telefone "com", então forçamos "required" independente da UI
            filtered = filtered.filter(r => r.phone && r.phone !== 'N/A');

            if (customWebsiteFilter === 'required') {
                filtered = filtered.filter(r => r.website && r.website !== 'N/A');
            } else if (customWebsiteFilter === 'excluded') {
                filtered = filtered.filter(r => !r.website || r.website === 'N/A');
            }
            
            if (customRatingFilter === 'high') {
                filtered = filtered.filter(r => Number(r.rating) >= 4.0);
            } else if (customRatingFilter === 'low') {
                filtered = filtered.filter(r => Number(r.rating) > 0 && Number(r.rating) < 4.0);
            }
            const st = searchMode === 'guided' ? selectedState : customState;
            if (st && searchMode !== 'free') {
                const stateCode = st.toUpperCase();
                // OPTIMIZATION: Removed strict string matching for state code in address.
                // Google Maps already filters by region, and many valid leads have addresses formatted differently.
                // This prevents dropping perfectly valid leads and causing the search to loop infinitely.
            }
            const excList = searchMode === 'guided' ? (excludedCities.length > 0 ? excludedCities : (excludedCity ? [excludedCity] : [])) : (customExcluded ? [customExcluded] : []);
            if (excList.length > 0) {
                filtered = filtered.filter(r => {
                    const normAddr = normalizeString(r.address);
                    return !excList.some(excCity => normAddr.includes(normalizeString(excCity)));
                });
            }

            const newUnique = filtered.filter(nl =>
                !results.some(el => el.id === nl.id) &&
                !globalHistory.includes(nl.id) &&
                !leads.some(el => el.id === nl.id) &&
                !existingIds.includes(nl.id)
            );

            results = [...results, ...newUnique];
            currentToken = nextToken;
            pageCount++;

            if (!nextToken) break;
            if (results.length >= targetCount) break;
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        return { results: results.slice(0, targetCount), lastToken: currentToken };
    }, [excludedCities, excludedCity, globalHistory, leads, selectedNiche, selectedState]);

    const fetchReviewsInBackground = useCallback((leadsToUpdate: Lead[]) => {
        setTimeout(async () => {
            console.log(`[Background Reviews] Fetching reviews for ${leadsToUpdate.length} leads...`);
            for (const lead of leadsToUpdate) {
                try {
                    const query = `${lead.name} ${lead.address}`;
                    const data = await googleMapsService.fetchReviews(query);
                    if (data?.places?.[0]) {
                        const place = data.places[0];
                        setLeads(prev => prev.map(l => 
                            l.id === lead.id 
                                ? { ...l, rating: place.rating || l.rating, reviews: place.userRatingCount || l.reviews }
                                : l
                        ));
                    }
                } catch (error) {
                    console.error(`[Background Reviews] Error for lead ${lead.id}:`, error);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            console.log('[Background Reviews] Finished.');
        }, 0);
    }, []);

    const handleSearch = async (e?: React.FormEvent, shouldClear: boolean = false) => {
        if (e) e.preventDefault();

        const currentUser = user || (await supabase.auth.getUser()).data.user;
        if (!currentUser) return;

        let subscriptionData: any = null;
        try {
            const { data } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', currentUser.id)
                .maybeSingle();
            subscriptionData = data;
        } catch (err) {
            console.error('Erro ao buscar créditos:', err);
        }

        let planValue = String(subscriptionData?.plan_id || 'free').toLowerCase();
        if (planValue.includes('pro') || planValue === 'plano_pro' || planValue === 'pro_plan') planValue = 'pro';
        else if (planValue.includes('elite') || planValue === 'plano_elite' || planValue === 'elite_plan') planValue = 'elite';
        else if (planValue.includes('start') || planValue === 'plano_start') planValue = 'start';
        else if (planValue === 'free') {
            const cachedSettings = getUserData<any>(currentUser.id, 'settings', { plan: 'free' });
            if (cachedSettings?.plan && cachedSettings.plan !== 'free') {
                planValue = cachedSettings.plan;
            }
        }
        const plan = (planValue as UserPlan) || 'free';
        const limit = subscriptionData?.leads_limit ? Number(subscriptionData.leads_limit) : (PLAN_CREDITS[plan] || 60);
        
        // Floor protection: usar o maior valor entre o banco e o cache local
        const cachedSettingsSearch = getUserData<any>(currentUser.id, 'settings', {});
        const cachedUsed = cachedSettingsSearch?.leadsUsed || 0;
        const dbUsed = subscriptionData?.leads_used || 0;
        const used = dbUsed === 0 ? 0 : Math.max(dbUsed, cachedUsed);

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
        setState({ isSearching: true, error: null, warning: null, hasSearched: true });
        try {
            let allValidResults: Lead[] = [];
            const searchQueries: string[] = [];
            let shouldSkipMapsFetch = false;

            if (searchSource === 'instagram' || searchSource === 'linkedin') {
                if (!selectedNiche) {
                    setState(prev => ({ ...prev, isSearching: false, error: `Nicho ou hashtag é obrigatório para busca no ${searchSource}.` }));
                    return;
                }
                
                searchQueries.push(selectedNiche); // Para o histórico
                
                const activeLocation = searchMode === 'guided' 
                    ? (selectedCity ? `${selectedCity}, ${selectedState}` : selectedState)
                    : (query ? undefined : undefined); // Em modo free, a query inteira já vai pro Serper, então deixamos undefined para ele não sobrescrever
                
                let results = searchSource === 'instagram' 
                    ? await apifyService.searchInstagram(
                        searchMode === 'guided' ? selectedNiche : query,
                        requestedQuantity,
                        selectedCountry || 'BR',
                        activeLocation
                      )
                    : await apifyService.searchLinkedIn(
                        searchMode === 'guided' ? selectedNiche : query,
                        requestedQuantity,
                        selectedCountry || 'BR'
                      );
                
                results = results.filter(lead => {
                    const hasPhone = !!lead.phone;
                    const hasWebsite = !!lead.website;
                    if (!hasPhone) return false;
                    if (filters.websiteFilter === 'with' && !hasWebsite) return false;
                    if (filters.websiteFilter === 'without' && hasWebsite) return false;
                    return true;
                });
                
                allValidResults = results;
                shouldSkipMapsFetch = true;
            }

            if (!shouldSkipMapsFetch) {
                if (searchMode === 'guided') {
                    if (!selectedNiche || !selectedState) {
                        setState(prev => ({ ...prev, isSearching: false, error: 'Nicho e Estado são obrigatórios na busca guiada.' }));
                        return;
                    }

                    const activeCities = selectedCities.length > 0 ? selectedCities : (selectedCity ? [selectedCity] : []);

                    if (activeCities.length > 0) {
                        activeCities.forEach(city => {
                            let q = `${selectedNiche} em ${city}, ${selectedState}, Brasil`;
                            const bairros = CAPITAL_NEIGHBORHOODS[city];
                            if (bairros && bairros.length > 0) {
                                const randomBairro = bairros[Math.floor(Math.random() * bairros.length)];
                                q = `${selectedNiche} em ${randomBairro}, ${city}, ${selectedState}, Brasil`;
                            }
                            const excList = excludedCities.length > 0 ? excludedCities : (excludedCity ? [excludedCity] : []);
                            if (excList.length > 0) {
                                excList.forEach(exc => {
                                    q += ` -${exc}`;
                                });
                            }
                            searchQueries.push(q);
                        });
                    } else {
                        const principais = MAIOR_CIDADES[selectedState] || [];
                        const secundarias = CIDADES_SECUNDARIAS[selectedState] || [];
                        const allStateCities = [...principais, ...secundarias];
                        const excList = excludedCities.length > 0 ? excludedCities : (excludedCity ? [excludedCity] : []);
                        const validCities = allStateCities.filter(c => !excList.includes(c));

                        if (validCities.length > 0) {
                            // Embaralha (shuffle) para garantir alta aleatoriedade e rotação de cidades a cada busca!
                            const shuffled = [...validCities].sort(() => Math.random() - 0.5);
                            // OPTIMIZATION: Reduced from up to 8 cities to max 4 to speed up sequential searches
                            const selectedSample = shuffled.slice(0, Math.max(2, Math.min(4, Math.ceil(requestedQuantity / 5))));

                            selectedSample.forEach(city => {
                                let q = `${selectedNiche} em ${city}, ${selectedState}, Brasil`;
                                if (excList.length > 0) {
                                    excList.forEach(exc => {
                                        q += ` -${exc}`;
                                    });
                                }
                                searchQueries.push(q);
                            });

                            // Adicionada a busca estadual ampla como fallback
                            let qAmpla = `${selectedNiche} no estado de ${selectedState}, Brasil`;
                            if (excList.length > 0) {
                                excList.forEach(exc => {
                                    qAmpla += ` -${exc}`;
                                });
                            }
                            searchQueries.push(qAmpla);
                        } else {
                            let q = `${selectedNiche} no estado de ${selectedState}, Brasil`;
                            if (excList.length > 0) {
                                excList.forEach(exc => {
                                    q += ` -${exc}`;
                                });
                            }
                            searchQueries.push(q);
                        }
                    }
                } else {
                    if (!query) {
                        setState(prev => ({ ...prev, isSearching: false, error: 'Digite o que deseja buscar.' }));
                        return;
                    }
                    searchQueries.push(query);
                }

                const countPerQuery = Math.ceil(requestedQuantity / Math.max(1, searchQueries.length));
                const queryTokens: Record<string, string | undefined> = {};

                for (const currentQuery of searchQueries) {
                    if (allValidResults.length >= requestedQuantity) break;

                    const needed = Math.min(requestedQuantity - allValidResults.length, countPerQuery);
                    const existingIds = allValidResults.map(l => l.id);
                    
                    try {
                        const { results, lastToken } = await fetchQuery(
                            currentQuery, 
                            needed, 
                            undefined, 
                            selectedNiche, 
                            selectedState, 
                            excludedCity, 
                            'required', // phone is always required now
                            filters.websiteFilter,
                            filters.ratingFilter,
                            existingIds
                        );

                        queryTokens[currentQuery] = lastToken;
                        allValidResults = [...allValidResults, ...results];
                    } catch (error) {
                        console.error(`[Search] Falha na busca para a query "${currentQuery}":`, error);
                        // Continua para a próxima query em vez de quebrar tudo!
                    }
                }

                if (allValidResults.length < requestedQuantity && searchQueries.length > 0) {
                    for (const currentQuery of searchQueries) {
                        if (allValidResults.length >= requestedQuantity) break;
                        const needed = requestedQuantity - allValidResults.length;
                        const existingIds = allValidResults.map(l => l.id);
                        try {
                            const { results, lastToken } = await fetchQuery(
                                currentQuery, 
                                needed, 
                                queryTokens[currentQuery], 
                                selectedNiche, 
                                selectedState, 
                                excludedCity, 
                                'required', // phone is always required now
                                filters.websiteFilter,
                                filters.ratingFilter,
                                existingIds
                            );
                            queryTokens[currentQuery] = lastToken;
                            const newLeads = results.filter(r => !allValidResults.some(a => a.id === r.id));
                            allValidResults = [...allValidResults, ...newLeads];
                        } catch (error) {
                            console.error(`[Search] Falha na busca secundária para a query "${currentQuery}":`, error);
                            // Continua para a próxima query
                        }
                    }
                }
            }

            const finalResults = allValidResults.slice(0, requestedQuantity);

            if (finalResults.length > 0) {
                if (finalResults.length < requestedQuantity) {
                    const msg = `Encontramos apenas ${finalResults.length} leads disponíveis nesta região/nicho. Tente expandir a busca para novos resultados.`;
                    setState(prev => ({ ...prev, warning: msg }));
                }

                setLeads(prev => [...prev, ...finalResults]);
                
                // Trigger background reviews fetch
                if (searchSource === 'maps') {
                    fetchReviewsInBackground(finalResults);
                }

                // Desativa o carregamento imediatamente após os resultados aparecerem
                setState(prev => ({ ...prev, isSearching: false }));
                const newTotal = used + finalResults.length;

                // ── Atualiza UI de forma OTIMISTA imediatamente ──────────────────────────
                // O usuário vê os créditos decrementarem assim que os leads aparecem,
                // independente da resposta do banco. O DB é sincronizado em seguida.
                if (onCreditsUsed) {
                    onCreditsUsed(newTotal);
                }

                // ── Persiste no banco em background ──────────────────────────────────────
                supabase.rpc('consume_credits', { amount: finalResults.length }).then(({ data: rpcData, error: rpcError }) => {
                    if (rpcError) {
                        console.error('[Credits] RPC consume_credits falhou:', rpcError.message);
                        // Fallback: tenta update direto (funciona se RPC não existir no banco)
                        supabase.from('user_subscriptions')
                            .update({ leads_used: newTotal })
                            .eq('user_id', currentUser.id)
                            .then(({ error: updateErr }) => {
                                if (updateErr) {
                                    console.error('[Credits] Fallback update também falhou (verifique RLS):', updateErr.message);
                                } else {
                                    console.log('[Credits] Fallback direto aplicado com sucesso. leads_used =', newTotal);
                                }
                            });
                    } else if (rpcData && !rpcData.success) {
                        // O banco bloqueou: mostra o valor REAL do banco para o usuário
                        console.warn('[Credits] RPC bloqueou:', rpcData.message, '| DB current:', rpcData.current, '| limit:', rpcData.limit);
                        // Corrige o valor local para refletir o real do banco
                        if (onCreditsUsed && rpcData.current !== undefined) {
                            onCreditsUsed(rpcData.current);
                        }
                    } else if (rpcData?.new_usage !== undefined && onCreditsUsed) {
                        // Confirma com o valor exato retornado pelo banco
                        onCreditsUsed(rpcData.new_usage);
                    }
                });

                const historyEntries = finalResults.map(lead => ({
                    user_id: currentUser.id,
                    query: searchQueries[0],
                    search_mode: searchMode,
                    lead_name: lead.name,
                    lead_phone: lead.phone,
                    lead_id: lead.id
                }));
                await supabase.from('search_history').insert(historyEntries);
            } else {
                setState(prev => ({ ...prev, error: 'Nenhum lead novo encontrado para esta busca com os filtros selecionados (ex: com telefone). Tente um termo mais amplo.' }));
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
            const currentUser = user || (await supabase.auth.getUser()).data.user;
            if (!currentUser) throw new Error('Usuário não autenticado');

            const { data: subscriptionData } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();

            let planValue = String(subscriptionData?.plan_id || 'free').toLowerCase();
            if (planValue.includes('pro') || planValue === 'plano_pro' || planValue === 'pro_plan') planValue = 'pro';
            else if (planValue.includes('elite') || planValue === 'plano_elite' || planValue === 'elite_plan') planValue = 'elite';
            else if (planValue.includes('start') || planValue === 'plano_start') planValue = 'start';
            else if (planValue === 'free') {
                const cachedSettings = getUserData<any>(currentUser.id, 'settings', { plan: 'free' });
                if (cachedSettings?.plan && cachedSettings.plan !== 'free') {
                    planValue = cachedSettings.plan;
                }
            }
            const plan = (planValue as UserPlan) || 'free';
            const limit = subscriptionData?.leads_limit ? Number(subscriptionData.leads_limit) : (PLAN_CREDITS[plan] || 60);
            
            // Floor protection
            const cachedSettingsLoad = getUserData<any>(currentUser.id, 'settings', {});
            const cachedUsedLoad = cachedSettingsLoad?.leadsUsed || 0;
            const dbUsedLoad = subscriptionData?.leads_used || 0;
            const used = dbUsedLoad === 0 ? 0 : Math.max(dbUsedLoad, cachedUsedLoad);

            const remainingCredits = limit - used;

            if (used >= limit) {
                throw new Error('Limite de leads atingido para seu plano este mês. Faça um upgrade para continuar!');
            }

            if (quantity > remainingCredits) {
                throw new Error(`Você possui apenas ${remainingCredits} créditos restantes. Por favor, selecione uma carga de ${remainingCredits <= 10 ? '10' : '20'} resultados.`);
            }

            const requestedAmount = quantity;
            const activeCityForLoadMore = selectedCities.length > 0 ? selectedCities[0] : selectedCity;
            const currentQuery = searchMode === 'free' ? query : `${selectedNiche} em ${activeCityForLoadMore}, ${selectedState}`;
            
            const { results: finalResults } = await fetchQuery(
                currentQuery,
                requestedAmount,
                undefined,
                selectedNiche,
                selectedState,
                excludedCity,
                filters.requirePhone
            );

            if (finalResults.length > 0) {
                setLeads(prev => [...prev, ...finalResults]);
                const newTotal = used + finalResults.length;

                // Atualiza UI imediatamente (otimista)
                if (onCreditsUsed) onCreditsUsed(newTotal);

                // Persiste no banco em background
                supabase.rpc('consume_credits', { amount: finalResults.length }).then(({ data: rpcData, error: rpcError }) => {
                    if (rpcError) {
                        console.error('[Credits/LoadMore] RPC falhou:', rpcError.message);
                        supabase.from('user_subscriptions')
                            .update({ leads_used: newTotal })
                            .eq('user_id', currentUser.id)
                            .then(({ error: e }) => e && console.error('[Credits/LoadMore] Fallback falhou:', e.message));
                    } else if (rpcData?.new_usage !== undefined && onCreditsUsed) {
                        onCreditsUsed(rpcData.new_usage);
                    } else if (rpcData && !rpcData.success) {
                        console.warn('[Credits/LoadMore] RPC bloqueou:', rpcData.message);
                        if (onCreditsUsed && rpcData.current !== undefined) onCreditsUsed(rpcData.current);
                    }
                });

                const historyEntries = finalResults.map(lead => ({
                    user_id: currentUser.id,
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
        const currentUser = user || (await supabase.auth.getUser()).data.user;
        if (!currentUser) return;

        const now = new Date();
        const last9AM = new Date();
        last9AM.setHours(9, 0, 0, 0);
        if (now.getHours() < 9) {
            last9AM.setDate(last9AM.getDate() - 1);
        }

        const { data, error } = await supabase
            .from('search_history')
            .select('id, lead_name, lead_phone, lead_id, created_at')
            .eq('user_id', currentUser.id)
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
        const currentUser = user || (await supabase.auth.getUser()).data.user;
        if (!currentUser) return;

        await supabase
            .from('search_history')
            .delete()
            .eq('user_id', currentUser.id);

        setSearchHistory([]);
    };

    // Reset Chat AI conversation
    const resetChat = useCallback(() => {
        setChatContext(null);
        setConversationalFeedback(null);
        setAiPrompt('');
        setChatMessages([]);
        setIsParsingPrompt(true);
        setParsingStatus('Reiniciando assistente Beleadly AI...');
        setTimeout(() => {
            const greetings = [
                'Olá! Sou o assistente de IA do Beleadly. Qual é o seu público-alvo (ex: imobiliárias, clínicas, energia solar) e a região ou DDD que deseja prospectar hoje?',
                'Boas-vindas ao Beleadly AI! Me diga o tipo de empresa ou profissional que você busca e a localidade (cidade, estado ou DDD) para iniciarmos a extração.',
                'Olá! Pronto para decolar sua prospecção? Descreva o nicho que você precisa encontrar e a região desejada. Farei a varredura completa para você!',
                'Saudações! Sou sua inteligência artificial de vendas. Me informe o setor (ex: arquitetos, contabilidade) e a localização para trazermos os melhores leads.'
            ];
            const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
            setChatMessages([
                {
                    id: `welcome-${Date.now()}`,
                    sender: 'assistant',
                    text: randomGreeting,
                    timestamp: new Date()
                }
            ]);
            setIsParsingPrompt(false);
        }, 600);
    }, []);

    // Chat AI search function
    const handleAISearch = useCallback(async (promptText: string) => {
        if (!promptText || !promptText.trim()) return;

        const userMsgText = promptText;
        setAiPrompt('');
        setIsParsingPrompt(true);
        setParsingStatus('Analisando seu comando com IA...');

        // Adiciona a mensagem do usuário ao chat
        setChatMessages(prev => [
            ...prev,
            {
                id: `user-${Date.now()}`,
                sender: 'user',
                text: userMsgText,
                timestamp: new Date()
            }
        ]);

        try {
            const currentUser = user?.user || user || (await supabase.auth.getUser()).data.user;
            if (!currentUser) {
                setChatMessages(prev => [
                    ...prev,
                    {
                        id: `err-${Date.now()}`,
                        sender: 'assistant',
                        text: 'Erro: Você precisa estar logado para utilizar o assistente de IA.',
                        timestamp: new Date()
                    }
                ]);
                setIsParsingPrompt(false);
                return;
            }

            // Verifica créditos
            let subscriptionData: any = null;
            try {
                const { data } = await supabase
                    .from('user_subscriptions')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .maybeSingle();
                subscriptionData = data;
            } catch (err) {
                console.error('Erro ao buscar créditos AI:', err);
            }

            let planValue = String(subscriptionData?.plan_id || 'free').toLowerCase();
            if (planValue.includes('pro') || planValue === 'plano_pro' || planValue === 'pro_plan') planValue = 'pro';
            else if (planValue.includes('elite') || planValue === 'plano_elite' || planValue === 'elite_plan') planValue = 'elite';
            else if (planValue.includes('start') || planValue === 'plano_start') planValue = 'start';
            else if (planValue === 'free') {
                const cachedSettings = getUserData<any>(currentUser.id, 'settings', { plan: 'free' });
                if (cachedSettings?.plan && cachedSettings.plan !== 'free') {
                    planValue = cachedSettings.plan;
                }
            }
            const plan = (planValue as UserPlan) || 'free';
            const limit = subscriptionData?.leads_limit ? Number(subscriptionData.leads_limit) : (PLAN_CREDITS[plan] || 60);
            const used = subscriptionData?.leads_used || 0;
            const remainingCredits = limit - used;

            if (used >= limit) {
                setChatMessages(prev => [
                    ...prev,
                    {
                        id: `err-${Date.now()}`,
                        sender: 'assistant',
                        text: '❌ Limite de leads atingido para seu plano este mês. Faça um upgrade para continuar prospectando com IA!',
                        timestamp: new Date()
                    }
                ]);
                setIsParsingPrompt(false);
                return;
            }

            // Análise NLP avançada / Integração Inteligente de Conversação e Chamada de APIs
            const lowerNormPrompt = normalizeString(userMsgText).toLowerCase();

            // Interceptadores de cancelamento ou feedback do usuário
            if (/cancelar|nao aconteceu|não aconteceu|nao funcionou|não funcionou|parar|chega|erro/i.test(userMsgText)) {
                setChatMessages(prev => [
                    ...prev,
                    {
                        id: `ast-${Date.now()}`,
                        sender: 'assistant',
                        text: 'Entendido! Cancelei qualquer operação em andamento e zerei as informações. Vamos recomeçar: me informe o nicho (ex: imobiliárias, médicos, lojas) e a região ou DDD que deseja prospectar.',
                        timestamp: new Date()
                    }
                ]);
                setChatContext(null);
                setIsParsingPrompt(false);
                return;
            }

            // 2. Extrai quantidade solicitada (ex: "20 leads", "50 dentistas", etc.) com padrão 20
            let requestedQtd = 20;
            const explicitQtdMatch = userMsgText.match(/(\d+)\s*(?:leads|contatos|resultados|empresas|lojas|clínicas|profissionais|imobiliárias|dentistas|arquitetos|médicos|restaurantes|energia solar|placas|painéis)/i);
            if (explicitQtdMatch && explicitQtdMatch[1]) {
                requestedQtd = parseInt(explicitQtdMatch[1], 10);
            } else {
                const textWithoutDdd = userMsgText.replace(/ddd\s*\d{2}/gi, '');
                const isolatedNumMatch = textWithoutDdd.match(/\b(\d+)\b/);
                if (isolatedNumMatch && isolatedNumMatch[1]) {
                    requestedQtd = parseInt(isolatedNumMatch[1], 10);
                }
            }
            requestedQtd = Math.min(requestedQtd, remainingCredits);

            // 1. Chamada inteligente à IA (Modo ChatGPT / Gemini real via Frontend ou Edge Function)
            let aiHandled = false;
            try {
                // Tenta primeiro a chamada direta via VITE_GEMINI_API_KEY                // 2. Classificação com Gemini
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
                if (apiKey && apiKey.trim() !== '') {
                    const formattedHistory = chatMessages.slice(-6).map(m => `${m.sender === 'user' ? 'Usuário' : 'IA'}: ${m.text}`).join('\n');
                    const systemInstruction = `Você é a "Beleadly AI", a assistente virtual inteligente e consultiva da plataforma Beleadly de geração de leads B2B.
O usuário está conversando com você no chat da plataforma.

Seu objetivo é agir como uma IA conversacional avançada (como o ChatGPT ou Gemini), sendo empática, natural, perspicaz e altamente especializada em estratégias de vendas, prospecção e marketing.

Você recebe o histórico recente da conversa e a nova mensagem do usuário.

REGRA DE DECISÃO ABSOLUTA:
1. MODO CONVERSA ("type": "conversation"):
Se o usuário estiver apenas cumprimentando, desabafando, pedindo definições, conselhos de nicho ou debatendo estratégias, retorne "type": "conversation".
Escreva uma resposta rica, atenciosa e consultiva no campo "reply".

2. MODO COMANDO DE BUSCA ("type": "search_command"):
Se o usuário expressar claramente que deseja iniciar uma captação/extração de leads (informando um nicho/profissão E uma localidade/cidade/DDD), retorne "type": "search_command".
No campo "reply", escreva uma mensagem curta confirmando o pedido. E preencha os parâmetros no objeto "searchParams".

Você DEVE responder EXCLUSIVAMENTE com um JSON válido, sem marcações markdown, no formato:
{
  "type": "conversation" | "search_command",
  "reply": "Sua resposta aqui...",
  "searchParams": {
    "searchSource": "maps",
    "searchMode": "free" | "guided",
    "query": "[Nicho] em [Local]",
    "selectedNiche": "Nome do Nicho",
    "selectedCountry": "BR",
    "selectedState": "SP",
    "selectedCity": "Nome da Cidade",
    "maxResults": 20,
    "requirePhone": true
  }
}`;
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                    const promptWithContext = formattedHistory ? `Histórico recente:\n${formattedHistory}\n\nMensagem atual: "${userMsgText}"` : `Mensagem atual: "${userMsgText}"`;

                    const geminiPayload = {
                        contents: [
                            {
                                parts: [
                                    { text: systemInstruction },
                                    { text: promptWithContext }
                                ]
                            }
                        ],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    };

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 12000);

                    const response = await fetch(geminiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(geminiPayload),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (rawText) {
                            const cleanRawText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
                            const res = JSON.parse(cleanRawText);
                            if (res.type === 'conversation') {
                                setChatMessages(prev => [
                                    ...prev,
                                    {
                                        id: `ast-${Date.now()}`,
                                        sender: 'assistant',
                                        text: res.reply || 'Como posso ajudar na sua prospecção hoje?',
                                        timestamp: new Date()
                                    }
                                ]);
                                aiHandled = true;
                                setIsParsingPrompt(false);
                                return;
                            } else if (res.type === 'search_command' && res.searchParams) {
                                const p = res.searchParams;
                                const confirmedContext = {
                                    niche: p.selectedNiche || p.query || userMsgText,
                                    city: p.selectedCity || '',
                                    state: p.selectedState || ''
                                };
                                setChatContext(confirmedContext);

                                setChatMessages(prev => [
                                    ...prev,
                                    {
                                        id: `confirm-${Date.now()}`,
                                        sender: 'assistant',
                                        text: res.reply || `🔍 **Pedido identificado!** Confira os dados abaixo. Deseja realizar a extração e consumir créditos?`,
                                        timestamp: new Date(),
                                        confirmationData: {
                                            niche: confirmedContext.niche,
                                            city: confirmedContext.city,
                                            state: confirmedContext.state,
                                            quantity: p.maxResults || requestedQtd
                                        }
                                    }
                                ]);
                                aiHandled = true;
                                setIsParsingPrompt(false);
                                return;
                            }
                        }
                    }
                }

                // Se não tem chave local ou falhou, tenta a Edge Function no Supabase
                if (!aiHandled) {
                    const { data, error } = await supabase.functions.invoke('parse-search-prompt', {
                        body: { 
                            prompt: userMsgText,
                            history: chatMessages.slice(-6)
                        }
                    });

                    if (!error && data?.isConfigError) {
                        setChatMessages(prev => [
                            ...prev,
                            {
                                id: `err-${Date.now()}`,
                                sender: 'assistant',
                                text: `⚙️ **Configuração Necessária:**\n\n${data.error}\n\nSem essa chave configurada no Supabase Edge Functions, não consigo manter um diálogo fluido e natural. Adicione a chave GEMINI_API_KEY no seu painel para ativar a inteligência real.`,
                                timestamp: new Date()
                            }
                        ]);
                        aiHandled = true;
                        setIsParsingPrompt(false);
                        return;
                    }

                    if (!error && data?.result) {
                        const res = data.result;
                        if (res.type === 'conversation') {
                            setChatMessages(prev => [
                                ...prev,
                                {
                                    id: `ast-${Date.now()}`,
                                    sender: 'assistant',
                                    text: res.reply || 'Como posso ajudar na sua prospecção hoje?',
                                    timestamp: new Date()
                                }
                            ]);
                            aiHandled = true;
                            setIsParsingPrompt(false);
                            return;
                        } else if (res.type === 'search_command' && res.searchParams) {
                            const p = res.searchParams;
                            const confirmedContext = {
                                niche: p.selectedNiche || p.query || userMsgText,
                                city: p.selectedCity || '',
                                state: p.selectedState || ''
                            };
                            setChatContext(confirmedContext);

                            setChatMessages(prev => [
                                ...prev,
                                {
                                    id: `confirm-${Date.now()}`,
                                    sender: 'assistant',
                                    text: res.reply || `🔍 **Pedido identificado!** Confira os dados abaixo. Deseja realizar a extração e consumir créditos?`,
                                    timestamp: new Date(),
                                    confirmationData: {
                                        niche: confirmedContext.niche,
                                        city: confirmedContext.city,
                                        state: confirmedContext.state,
                                        quantity: p.maxResults || requestedQtd
                                    }
                                }
                            ]);
                            aiHandled = true;
                            setIsParsingPrompt(false);
                            return;
                        }
                    }
                }
            } catch (fnErr: any) {
                console.error("Erro na Edge Function ou API do Gemini, usando fallback local:", fnErr);
            }

            if (aiHandled) {
                setIsParsingPrompt(false);
                return;
            }

            // Fallback: Verifica se é uma pergunta conversacional sobre nichos/dicas de prospecção, conselho ou continuação de diálogo
            const isConversationalQuestion = /(?:seo|otimização|otimizacao|ranqueamento|google organico|abordar|abordagem|script|mensagem|whatsapp|copy|pitch|primeiro contato|objeção|objeçoes|objeções|caro|preco|preço|concorrente|cobrar|valores|tabela|reuniao|reunião|proposta|fechar|fechamento|contrato|funil|cadencia|cadência|follow up|follow-up|inbound|outbound|o que e|o que é|o que sao|o que são|qual a diferenca|qual a diferença|como criar|como fazer|como funciona|o que significa|me explica|explique|qual melhor|qual o melhor|quais melhores|quais os melhores|melhor nicho|melhores nichos|dica|dicas|me diga|sugestao|sugestão|sugere|sugerir|recomenda|recomende|ideia|ideias|ajuda|como prospectar|e para|para quem|o que acha|vale a pena|o que fazer|por onde começar|muito bem|legal|bacana|interessante|o que me diz|me fala|pode me ajudar|qual nicho|quais nichos|o que vc acha|o que você acha|me da uma dica|me dê uma dica|orientacao|orientação|bom dia|boa tarde|boa noite|ola|olá|oi|tudo bem|quais outros|saber de outros|quero saber|quais mais|e quais|mais algum|quais opções|quais opçoes|quais setores|qual setor|quais ramos|qual ramo|outros nichos|outras opcoes|outras opções|me de mais ideias|me dê mais ideias|quais as opções|quais as opcoes|mais exemplos|outro nicho)/i.test(userMsgText);

            if (isConversationalQuestion) {
                // Resposta conversacional inteligente e fluida
                let reply = "Para quem cria sites ou soluções digitais, os melhores nichos para prospectar costumam ser **Clínicas Médicas**, **Escritórios de Advocacia**, **Imobiliárias**, **Arquitetura** e **Construtoras**, pois possuem alto ticket médio e investem constantemente em presença online.\n\nQual desses nichos ou qual região você gostaria de explorar hoje?";
                
                if (/seo|otimização|otimizacao|ranqueamento|google organico/i.test(userMsgText)) {
                    reply = "O **SEO (Search Engine Optimization)** é o conjunto de técnicas para posicionar um site ou ficha do Google Maps no topo das buscas orgânicas (sem pagar anúncios).\n\n💡 **Como vender SEO na prospecção B2B:**\n1. Busque empresas no nosso extrator e veja o site delas.\n2. Mostre que os concorrentes delas estão roubando clientes por estarem na 1ª página.\n3. Ofereça uma análise gratuita do Perfil do Google Meu Negócio.\n\nMe diga: qual nicho e cidade ou DDD você quer extrair agora para encontrarmos empresas que precisam de SEO?";
                } else if (/abordar|abordagem|script|mensagem|whatsapp|copy|pitch|primeiro contato/i.test(userMsgText)) {
                    reply = "🚀 **Script de Abordagem Matadora pelo WhatsApp no B2B:**\n\n1. **Quebra de Gelo Personalizada:** *\"Olá [Nome], vi o Instagram/Site da [Empresa] e parabéns pelo posicionamento!\"*\n2. **Conexão com a Dor:** *\"Percebi que vocês têm uma estrutura excelente, mas o canal de captação online pode gerar 3x mais orçamentos.\"*\n3. **Chamada de Baixo Atrito:** *\"Não quero te vender nada agora. Posso te enviar um áudio de 1 minuto mostrando o que encontrei?\"*\n\nPara qual nicho e região ou DDD você quer buscar leads agora para aplicarmos esse roteiro?";
                } else if (/objeção|objeçoes|objeções|caro|preco|preço|concorrente|cobrar|valores|tabela/i.test(userMsgText)) {
                    reply = "🛡️ **Como contornar a objeção de \"Tá Caro\" ou \"Já tenho agência/dev\":**\n\n- **Se acharem caro:** *\"Entendo perfeitamente, [Nome]. Mas não veja nosso trabalho como custo, e sim como uma máquina de aquisição. Se nosso serviço te trouxer 3 novos clientes premium por mês, ele se paga e gera lucro.\"*\n- **Se já tiverem alguém:** *\"Excelente! Sinal que vocês investem no digital. Nosso objetivo não é substituir, mas somar e cobrir lacunas que podem estar deixando dinheiro na mesa.\"*\n\nQual setor ou DDD quer captar hoje para testar essa abordagem?";
                } else if (/reuniao|reunião|proposta|fechar|fechamento|contrato/i.test(userMsgText)) {
                    reply = "🤝 **Estratégia para Fechar Reuniões e Contratos B2B:**\n\n- **Foco na Reunião Curta:** Peça sempre uma reunião de *15 a 20 minutos*. Ninguém tem tempo para reuniões longas de 1 hora.\n- **Diagnóstico antes da Proposta:** Ouça 80% do tempo e fale 20%. Entenda a meta de faturamento do cliente antes de dar seu preço.\n- **Ancoragem de Valor:** Apresente 3 opções de pacotes (Básico, Recomendado e Premium).\n\nVamos começar a captação? Me informe o nicho e a cidade ou estado desejado.";
                } else if (/marketing/i.test(userMsgText) && /o que/i.test(userMsgText)) {
                    reply = "**Marketing** é o conjunto de estratégias para conectar sua marca aos clientes certos, gerando desejo e demanda pelos seus serviços ou produtos. No B2B, foca em construir autoridade e gerar oportunidades comerciais qualificadas.\n\nQuer ajuda para definir a estratégia de marketing de prospecção para o seu negócio? Me informe nicho e região.";
                } else if (/sql|mql/i.test(userMsgText)) {
                    reply = "No funil de vendas B2B:\n\n- **MQL (Marketing Qualified Lead):** É o contato que demonstrou interesse (baixou um material, visitou o site), mas ainda não está pronto para comprar.\n- **SQL (Sales Qualified Lead):** É o lead validado pelo time de pré-vendas (SDR), que tem perfil de compra, orçamento e dor clara, pronto para receber uma proposta comercial.\n\nGostaria de prospectar leads para transformar em SQLs hoje? Me diga o nicho e a cidade.";
                } else if (/quais outros|outros|mais algum|saber de outros|quais mais|quais opcoes|quais opções/i.test(userMsgText)) {
                    reply = "Além dos nichos tradicionais, existem minas de ouro inexploradas com alta demanda por digitalização:\n\n1. **Energia Solar e Fotovoltaica**\n2. **Clínicas de Estética Avançada e Harmonização**\n3. **Oficinas Premium e Estética Automotiva**\n4. **Escritórios de Contabilidade e Consultoria Financeira**\n5. **Distribuidoras e Indústrias Regionais**\n\nQual desses segmentos atrai mais você ou em qual DDD/cidade quer que eu inicie a captação?";
                } else if (/mkt|marketing|assessoria|agencia|tráfego|trafego|social media/i.test(userMsgText)) {
                    reply = "Para Assessorias de Marketing e Agências, excelentes nichos de prospecção são **Estética avançada**, **Clínicas Odontológicas**, **E-commerces em crescimento**, **Restaurantes conceituais** e **Energia Solar**. Eles dependem fortemente de atração de clientes via redes sociais e anúncios.\n\nMe diga: qual desses setores ou em qual localidade (cidade/DDD) você quer que eu inicie a extração de contatos?";
                } else if (/energia solar|fotovoltaico|solar/i.test(userMsgText)) {
                    reply = "Para o setor de **Energia Solar**, os alvos mais lucrativos são **Indústrias**, **Supermercados**, **Hotéis e Pousadas** e **Grandes Propriedades Rurais/Agronegócio**, pois possuem altíssimo consumo elétrico e o retorno do investimento é muito atrativo.\n\nEm qual estado, região ou DDD você deseja iniciar a captação de clientes?";
                } else if (/contab|contador|financeiro/i.test(userMsgText)) {
                    reply = "Para **Escritórios de Contabilidade e Finanças**, nichos promissores incluem **Prestadores de Serviços de TI**, **Startups**, **Comércio Varejista** e **Clínicas Médicas**, que frequentemente buscam redução de carga tributária e gestão profissional.\n\nQual região ou cidade você gostaria de explorar hoje?";
                } else if (/site|sites|solucoes digitais|landing page|software|dev/i.test(userMsgText)) {
                    reply = "Para quem cria **Sites ou Soluções Digitais**, os melhores nichos para prospectar costumam ser **Clínicas Médicas**, **Escritórios de Advocacia**, **Imobiliárias**, **Arquitetura** e **Construtoras**, pois possuem alto ticket médio e investem constantemente em presença online.\n\nQual desses nichos ou qual região você gostaria de explorar hoje?";
                } else if (/muito bem|sugere|sugestao|sugestão|dica|recomenda|o que acha|legal|bacana/i.test(userMsgText)) {
                    reply = "Excelente! Como você está buscando novas oportunidades, minha sugestão de ouro é focar em setores com alto fluxo de caixa e necessidade contínua de atração de clientes, como **Clínicas de Estética Avançada**, **Escritórios de Contabilidade**, **Energia Solar** e **Clínicas Odontológicas**.\n\nQual desses segmentos chama mais a sua atenção ou em qual DDD/cidade você quer que eu faça uma busca de teste?";
                } else {
                    reply = "Entendi o seu ponto! No mundo da prospecção B2B, o segredo do sucesso é focar em um nicho específico e em uma região de fácil atuação inicial para gerar autoridade.\n\nPara começarmos na prática, me informe qual é o **nicho** (ex: imobiliárias, dentistas, lojas) e a **cidade, estado ou DDD** onde deseja buscar.";
                }

                setChatMessages(prev => [
                    ...prev,
                    {
                        id: `ast-${Date.now()}`,
                        sender: 'assistant',
                        text: reply,
                        timestamp: new Date()
                    }
                ]);
                setIsParsingPrompt(false);
                return;
            }


            requestedQtd = Math.min(requestedQtd, remainingCredits);

            // 3. Extrai nicho e localização da mensagem atual
            let detectedNiche = '';
            let detectedCity = '';
            let detectedState = '';

            const nicheMap: { [key: string]: string } = {
                'energia solar': 'Energia Solar', 'placa solar': 'Energia Solar', 'fotovoltaic': 'Energia Solar', 'solar': 'Energia Solar',
                'software': 'Software', 'tecnologia': 'Tecnologia', 'mecanica': 'Oficina Mecânica', 'auto eletrica': 'Auto Elétrica',
                'imobiliaria': 'Imobiliária', 'corretor': 'Corretor', 'dentista': 'Dentista', 'arquiteto': 'Arquiteto',
                'medico': 'Médico', 'clinica': 'Clínica', 'restaurante': 'Restaurante', 'advogado': 'Advogado', 'direito': 'Direito',
                'academia': 'Academia', 'padaria': 'Padaria', 'farmacia': 'Farmácia', 'construtora': 'Construtora',
                'loja de roupa': 'Loja de Roupas', 'loja de calçado': 'Loja de Calçados', 'supermercado': 'Supermercado',
                'hotel': 'Hotel', 'pousada': 'Pousada', 'salao': 'Salão de Beleza', 'barbearia': 'Barbearia',
                'estetica': 'Estética', 'estudio': 'Estúdio', 'agencia': 'Agência', 'contabilidade': 'Contabilidade',
                'escola': 'Escola', 'oficina': 'Oficina', 'industria': 'Indústria', 'transportadora': 'Transportadora',
                'distribuidora': 'Distribuidora', 'consultorio': 'Consultório', 'petshop': 'Petshop', 'veterinaria': 'Veterinária',
                'imoveis': 'Imóveis', 'imovel': 'Imóveis'
            };

            for (const key of Object.keys(nicheMap)) {
                if (lowerNormPrompt.includes(key)) {
                    detectedNiche = nicheMap[key];
                    break;
                }
            }

            // Localização: DDD ou Cidades/Estados
            const dddMatch = userMsgText.match(/ddd\s*(\d{2})/i);
            if (dddMatch && dddMatch[1]) {
                const ddd = dddMatch[1];
                const DDD_MAP: { [key: string]: { city: string; state: string } } = {
                    '11': { city: 'São Paulo', state: 'SP' }, '12': { city: 'São José dos Campos', state: 'SP' }, '13': { city: 'Santos', state: 'SP' }, '14': { city: 'Bauru', state: 'SP' }, '15': { city: 'Sorocaba', state: 'SP' }, '16': { city: 'Ribeirão Preto', state: 'SP' }, '17': { city: 'São José do Rio Preto', state: 'SP' }, '18': { city: 'Presidente Prudente', state: 'SP' }, '19': { city: 'Campinas', state: 'SP' },
                    '21': { city: 'Rio de Janeiro', state: 'RJ' }, '22': { city: 'Campos dos Goytacazes', state: 'RJ' }, '24': { city: 'Volta Redonda', state: 'RJ' },
                    '27': { city: 'Vitória', state: 'ES' }, '28': { city: 'Cachoeiro de Itapemirim', state: 'ES' },
                    '31': { city: 'Belo Horizonte', state: 'MG' }, '32': { city: 'Juiz de Fora', state: 'MG' }, '33': { city: 'Governador Valadares', state: 'MG' }, '34': { city: 'Uberlândia', state: 'MG' }, '35': { city: 'Pouso Alegre', state: 'MG' }, '37': { city: 'Divinópolis', state: 'MG' }, '38': { city: 'Montes Claros', state: 'MG' },
                    '41': { city: 'Curitiba', state: 'PR' }, '42': { city: 'Ponta Grossa', state: 'PR' }, '43': { city: 'Londrina', state: 'PR' }, '44': { city: 'Maringá', state: 'PR' }, '45': { city: 'Cascavel', state: 'PR' }, '46': { city: 'Francisco Beltrão', state: 'PR' },
                    '47': { city: 'Joinville', state: 'SC' }, '48': { city: 'Florianópolis', state: 'SC' }, '49': { city: 'Chapecó', state: 'SC' },
                    '51': { city: 'Porto Alegre', state: 'RS' }, '53': { city: 'Pelotas', state: 'RS' }, '54': { city: 'Caxias do Sul', state: 'RS' }, '55': { city: 'Santa Maria', state: 'RS' },
                    '61': { city: 'Brasília', state: 'DF' }, '62': { city: 'Goiânia', state: 'GO' }, '63': { city: 'Palmas', state: 'TO' }, '65': { city: 'Cuiabá', state: 'MT' }, '67': { city: 'Campo Grande', state: 'MS' },
                    '68': { city: 'Rio Branco', state: 'AC' }, '69': { city: 'Porto Velho', state: 'RO' },
                    '71': { city: 'Salvador', state: 'BA' }, '73': { city: 'Ilhéus', state: 'BA' }, '75': { city: 'Feira de Santana', state: 'BA' }, '77': { city: 'Vitória da Conquista', state: 'BA' }, '79': { city: 'Aracaju', state: 'SE' },
                    '81': { city: 'Recife', state: 'PE' }, '82': { city: 'Maceió', state: 'AL' }, '83': { city: 'João Pessoa', state: 'PB' }, '84': { city: 'Natal', state: 'RN' }, '85': { city: 'Fortaleza', state: 'CE' }, '86': { city: 'Teresina', state: 'PI' }, '88': { city: 'Juazeiro do Norte', state: 'CE' },
                    '91': { city: 'Belém', state: 'PA' }, '92': { city: 'Manaus', state: 'AM' }, '95': { city: 'Boa Vista', state: 'RR' }, '96': { city: 'Macapá', state: 'AP' }, '98': { city: 'São Luís', state: 'MA' }
                };
                detectedCity = `Região DDD ${ddd}`;
                detectedState = DDD_MAP[ddd]?.state || 'PR';
            } else {
                const locationWords = userMsgText.split(/\b(?:em|no|na|regiao|região|cidade de|estado de|pode ser|quero em)\b/i);
                if (locationWords.length > 1) {
                    const locPart = locationWords.pop()?.trim();
                    if (locPart) {
                        const stateMatch = locPart.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i);
                        if (stateMatch && stateMatch[1]) {
                            detectedState = stateMatch[1].toUpperCase();
                            detectedCity = locPart.replace(stateMatch[0], '').replace(/[-/,]/g, '').trim();
                        } else {
                            detectedCity = locPart.replace(/[-/,]/g, '').trim();
                        }
                    }
                } else {
                    // Verifica se a frase informa diretamente o nome de uma cidade (ex: "pode ser ponta grossa")
                    const cleanLocText = userMsgText.replace(/\b(?:pode ser|quero|buscar|encontrar|busque|procure)\b/gi, '').trim();
                    for (const st of Object.keys(MAIOR_CIDADES)) {
                        const matchedCity = MAIOR_CIDADES[st].find((c: string) => normalizeString(c).toLowerCase() === normalizeString(cleanLocText).toLowerCase() || cleanLocText.toLowerCase().includes(normalizeString(c).toLowerCase()));
                        if (matchedCity) {
                            detectedCity = matchedCity;
                            detectedState = st;
                            break;
                        }
                    }
                }
            }

            if (detectedCity && !detectedState && !detectedCity.startsWith('Região DDD')) {
                for (const st of Object.keys(MAIOR_CIDADES)) {
                    if (MAIOR_CIDADES[st].some((c: string) => normalizeString(c).toLowerCase() === normalizeString(detectedCity).toLowerCase())) {
                        detectedState = st;
                        break;
                    }
                }
            }

            if (!detectedNiche && lowerNormPrompt.includes(' em ')) {
                const cleanNiche = userMsgText.split(/ em /i)[0].replace(/preciso de|quero|buscar|encontrar|busque|procure|liste|\d+/gi, '').trim();
                if (cleanNiche.length > 2) {
                    detectedNiche = cleanNiche.charAt(0).toUpperCase() + cleanNiche.slice(1);
                }
            }

            if (!detectedNiche) {
                const isQuestionOrChat = /^(o que|oque|quais|qual|quero|como|porque|por que|onde|quando|quem|pode|me|sim|nao|não|outros|mais|saber|explicar|ola|olá|oi|hey)\b/i.test(userMsgText.trim());
                if (!isQuestionOrChat) {
                    let cleanPrompt = userMsgText.replace(/([0-9]+\s*(?:leads|contatos|resultados|empresas|lojas|clínicas|profissionais|imobiliárias|dentistas))/gi, '');
                    cleanPrompt = cleanPrompt.replace(/\b(?:preciso de|quero|buscar|encontrar|busque|procure|liste|gostaria de|mostrar|pesquise|pode ser)\b/gi, '');
                    cleanPrompt = cleanPrompt.replace(/\b(?:ddd\s*[0-9]{2}|em\s+[^,\n]+|no\s+[^,\n]+|na\s+[^,\n]+|cidade\s+de\s+[^,\n]+|estado\s+de\s+[^,\n]+)\b/gi, '');
                    if (detectedCity && !detectedCity.startsWith('Região DDD')) {
                        const regCity = new RegExp(detectedCity, 'gi');
                        cleanPrompt = cleanPrompt.replace(regCity, '');
                    }
                    cleanPrompt = cleanPrompt.replace(/[^a-zA-Z0-9\u00C0-\u017F\s]/g, '').trim();

                    if (cleanPrompt.length > 2) {
                        detectedNiche = cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1);
                    }
                }
            }

            // Permite fluidez na conversa herdando parâmetros parciais guardados no chatContext APENAS quando for um complemento
            const finalNiche = detectedNiche || chatContext?.niche || '';
            const finalCity = detectedCity || chatContext?.city || '';
            const finalState = detectedState || chatContext?.state || '';

            const mergedResult = {
                niche: finalNiche,
                city: finalCity,
                state: finalState
            };
            setChatContext(mergedResult);

            const missing: ('niche' | 'location')[] = [];
            if (!mergedResult.niche) missing.push('niche');
            if (!mergedResult.city && !mergedResult.state) missing.push('location');

            if (missing.length > 0) {
                let question = '';
                if (missing.includes('niche') && missing.includes('location')) {
                    question = 'Entendi! Para começarmos, me diga qual é o nicho (ex: imobiliárias, dentistas) e a cidade ou estado onde deseja buscar.';
                } else if (missing.includes('niche')) {
                    question = `Certo, vou buscar na ${mergedResult.city ? mergedResult.city : mergedResult.state}. Qual nicho ou tipo de empresa você procura aí?`;
                } else {
                    question = `Perfeito, buscando por ${mergedResult.niche}. Em qual cidade, região ou DDD você deseja prospectar?`;
                }

                setChatMessages(prev => [
                    ...prev,
                    {
                        id: `ast-${Date.now()}`,
                        sender: 'assistant',
                        text: question,
                        timestamp: new Date()
                    }
                ]);
                setIsParsingPrompt(false);
                return;
            }

            // Identificou tudo com sucesso! Em vez de gastar créditos instantaneamente, pede a confirmação do usuário
            const confirmText = `🔍 **Pedido identificado!** Confira os dados abaixo. Deseja realizar a extração e consumir créditos?`;
            setChatMessages(prev => [
                ...prev,
                {
                    id: `confirm-${Date.now()}`,
                    sender: 'assistant',
                    text: confirmText,
                    timestamp: new Date(),
                    confirmationData: {
                        niche: mergedResult.niche,
                        city: mergedResult.city,
                        state: mergedResult.state,
                        quantity: requestedQtd
                    }
                }
            ]);

        } catch (err: any) {
            setChatMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    sender: 'assistant',
                    text: `❌ Ocorreu um erro ao processar o pedido: ${err.message}`,
                    timestamp: new Date()
                }
            ]);
        } finally {
            setIsParsingPrompt(false);
        }

    }, [chatContext, chatMessages, user]);

    const handleConfirmAISearch = useCallback(async (confirmedData: { niche: string; city: string; state: string; quantity: number }) => {
        if (!user) return;
        setIsParsingPrompt(true);
        setParsingStatus(`Buscando ${confirmedData.quantity} leads de ${confirmedData.niche} na ${confirmedData.city ? confirmedData.city + ', ' : ''}${confirmedData.state}...`);

        try {
            const currentUser = user?.user || user;
            let subscriptionData: any = null;
            try {
                const { data } = await supabase
                    .from('user_subscriptions')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .maybeSingle();
                subscriptionData = data;
            } catch (err) {
                console.error('Erro ao buscar créditos AI:', err);
            }

            const used = subscriptionData?.leads_used || 0;

            const aiQuery = `${confirmedData.niche} na ${confirmedData.city ? confirmedData.city + ', ' : ''}${confirmedData.state}, Brasil`;

            const { results: newLeads } = await fetchQuery(
                aiQuery,
                confirmedData.quantity,
                undefined,
                confirmedData.niche,
                confirmedData.state,
                undefined,
                true
            );

            if (newLeads.length > 0) {
                setLeads(prev => [...prev, ...newLeads]);
                const newTotal = used + newLeads.length;

                // Atualiza UI imediatamente (otimista)
                if (onCreditsUsed) onCreditsUsed(newTotal);

                // Persiste no banco em background
                supabase.rpc('consume_credits', { amount: newLeads.length }).then(({ data: rpcData, error: rpcError }) => {
                    if (rpcError) {
                        console.error('[Credits/AI] RPC falhou:', rpcError.message);
                        supabase.from('user_subscriptions')
                            .update({ leads_used: newTotal })
                            .eq('user_id', currentUser.id)
                            .then(({ error: e }) => e && console.error('[Credits/AI] Fallback falhou:', e.message));
                    } else if (rpcData?.new_usage !== undefined && onCreditsUsed) {
                        onCreditsUsed(rpcData.new_usage);
                    } else if (rpcData && !rpcData.success) {
                        console.warn('[Credits/AI] RPC bloqueou:', rpcData.message);
                        if (onCreditsUsed && rpcData.current !== undefined) onCreditsUsed(rpcData.current);
                    }
                });

                const historyEntries = newLeads.map(lead => ({
                    user_id: currentUser.id,
                    query: aiQuery,
                    search_mode: 'chat',
                    lead_name: lead.name,
                    lead_phone: lead.phone,
                    lead_id: lead.id
                }));
                await supabase.from('search_history').insert(historyEntries);

                const successMsg = `✅ Extração concluída! Encontrei **${newLeads.length} leads** de ${confirmedData.niche} na ${confirmedData.city ? confirmedData.city + ', ' : ''}${confirmedData.state}. Os resultados já foram adicionados à tabela abaixo.`;

                setChatMessages(prev => [
                    ...prev,
                    {
                        id: `success-${Date.now()}`,
                        sender: 'assistant',
                        text: successMsg,
                        timestamp: new Date()
                    }
                ]);

                // Finalizou a busca com sucesso, limpa o contexto para a próxima busca não ser influenciada por esta
                setChatContext(null);
            } else {
                setChatMessages(prev => [
                    ...prev,
                    {
                        id: `empty-${Date.now()}`,
                        sender: 'assistant',
                        text: `⚠️ Não consegui encontrar novos contatos de ${confirmedData.niche} na ${confirmedData.city ? confirmedData.city + ', ' : ''}${confirmedData.state} com telefone disponível. Tente expandir a busca para cidades vizinhas ou termos mais amplos.`,
                        timestamp: new Date()
                    }
                ]);
            }

        } catch (err: any) {
            setChatMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    sender: 'assistant',
                    text: `❌ Ocorreu um erro durante a extração: ${err.message}`,
                    timestamp: new Date()
                }
            ]);
        } finally {
            setIsParsingPrompt(false);
        }

    }, [fetchQuery, onCreditsUsed, user]);

    return {
        query, setQuery,
        leads, setLeads,
        state, setState,
        filters, setFilters,
        searchMode, setSearchMode,
        searchSource, setSearchSource,
        loadingMessageIndex,
        selectedCountry, setSelectedCountry,
        selectedNiche, setSelectedNiche,
        selectedState, setSelectedState,
        selectedCity, setSelectedCity,
        excludedCity, setExcludedCity,
        selectedCities, setSelectedCities,
        excludedCities, setExcludedCities,
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
        setShowHistoryModal,
        isParsingPrompt,
        parsingStatus,
        aiPrompt,
        setAiPrompt,
        handleAISearch,
        handleConfirmAISearch,
        conversationalFeedback,
        setConversationalFeedback,
        chatContext,
        setChatContext,
        resetChat,
        chatMessages,
        setChatMessages
    };
};

