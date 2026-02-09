import { useState, useEffect } from 'react';
import { googleMapsService } from '@/services/googleMapsService';
import { Lead, SearchState, SearchFilters } from '@/types/types';
import { LOADING_MESSAGES } from '@/constants/appConstants';

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
    const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
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

        let finalQuery = query;
        if (searchMode === 'guided') {
            if (!selectedNiche || !selectedState) return;

            let queryParts = [`${selectedNiche}`];
            if (selectedCity) {
                queryParts.push(`em ${selectedCity}, ${selectedState}, Brasil`);
            } else {
                queryParts.push(`no estado de ${selectedState}, Brasil`);
            }
            finalQuery = queryParts.join(' ');
            if (selectedNeighborhood && selectedCity) finalQuery += `, bairro ${selectedNeighborhood}`;
            if (excludedCity) finalQuery += ` -${excludedCity}`;
        }

        if (!finalQuery.trim()) return;

        setState({ isSearching: true, error: null, hasSearched: true });
        try {
            const requestedAmount = filters.maxResults || 20;
            let allValidResults: Lead[] = [];
            let nextPageToken: string | undefined = undefined;
            let attempts = 0;
            const maxAttempts = 3; // Evita loop infinito se houver poucos resultados no Google

            while (allValidResults.length < requestedAmount && attempts < maxAttempts) {
                const gResults = await googleMapsService.searchBusiness(finalQuery, 20, true);

                if (gResults.length === 0) break;

                const mappedResults: Lead[] = gResults.map(r => ({
                    id: r.id,
                    name: r.name,
                    category: selectedNiche || 'Lead',
                    address: r.address,
                    rating: r.rating || 0,
                    reviews: r.userRatingCount || 0,
                    phone: r.phone || 'N/A',
                    website: r.website || 'N/A',
                    instagram: 'N/A',
                    googleMapsLink: r.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.address)}`
                }));

                // Aplicar filtros internos (ex: Telefone Obrigatório)
                let filtered = mappedResults;
                if (filters.requirePhone) {
                    filtered = filtered.filter(r => r.phone && r.phone !== 'N/A');
                }

                // Filtrar duplicatas locais e histórico global
                const newUnique = filtered.filter(nl =>
                    !allValidResults.some(el => el.id === nl.id) &&
                    !globalHistory.includes(nl.id)
                );

                allValidResults = [...allValidResults, ...newUnique];
                attempts++;

                // Se a API trouxe poucos resultados e não temos mais o que buscar, paramos
                if (gResults.length < 5) break;
            }

            setLeads(allValidResults.slice(0, requestedAmount));
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
            const currentQuery = searchMode === 'free' ? query : `${selectedNiche} em ${selectedCity}, ${selectedState}`;
            const gResults = await googleMapsService.searchBusiness(currentQuery, quantity, true);
            const newResults: Lead[] = gResults.map(r => ({
                id: r.id,
                name: r.name,
                category: selectedNiche || 'Lead',
                address: r.address,
                rating: r.rating || 0,
                reviews: r.userRatingCount || 0,
                phone: r.phone || 'N/A',
                website: r.website || 'N/A',
                instagram: 'N/A',
                googleMapsLink: r.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.address)}`
            }));

            const uniqueNewLeads = newResults.filter(nl => !leads.some(el => el.id === nl.id) && !globalHistory.includes(nl.id));
            setLeads(prev => [...prev, ...uniqueNewLeads]);
        } catch (err: any) {
            setState(prev => ({ ...prev, error: err.message }));
        } finally {
            setIsLoadingMore(false);
        }
    };

    return {
        query, setQuery,
        leads, setLeads,
        state,
        filters, setFilters,
        searchMode, setSearchMode,
        loadingMessageIndex,
        selectedNiche, setSelectedNiche,
        selectedState, setSelectedState,
        selectedCity, setSelectedCity,
        selectedNeighborhood, setSelectedNeighborhood,
        excludedCity, setExcludedCity,
        cityList,
        isLoadingCities,
        handleSearch,
        handleLoadMore,
        isLoadingMore
    };
};
