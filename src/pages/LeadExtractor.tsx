import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, Search as SearchIcon, MapPin, LayoutGrid, List, Briefcase,
    ChevronDown, Building2, Trash2, AlertTriangle, X, Filter, Phone,
    Loader2, Download, FileSpreadsheet, Plus, Sparkles, Clock, EyeOff, Globe, Instagram, Linkedin, Lock, Zap, Cpu,
    Wand2, Brain, Bot, Users, Check, MessageSquare, Send, RotateCcw, Star
} from 'lucide-react';
import { Lead, SearchState, SearchFilters, SortField, SortOrder, CRMLead, AppTab, SearchSource, UserPlan } from '@/types/types';
import { COMMON_NICHES, BRAZIL_STATES, LOADING_MESSAGES, INSTAGRAM_CATEGORIES, LINKEDIN_CATEGORIES, PLAN_HIERARCHY, PLAN_FEATURES } from '@/constants/appConstants';
import { LeadTable } from '@/components/LeadTable';
import { enrichLead } from '@/services/enrichmentService';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';


interface LeadExtractorProps {
    leads: Lead[];
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
    state: SearchState;
    filters: SearchFilters;
    setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
    handleSearch: (e?: React.FormEvent, shouldClear?: boolean) => Promise<void>;
    loadingMessageIndex: number;
    locationPermission: 'prompt' | 'granted' | 'denied';
    requestLocation: () => void;
    setLocationPermission: (v: 'prompt' | 'granted' | 'denied') => void;
    searchMode: 'free' | 'guided' | 'chat';
    setSearchMode: (v: 'free' | 'guided' | 'chat') => void;
    searchSource: SearchSource;
    setSearchSource: (v: SearchSource) => void;
    query: string;
    setQuery: (v: string) => void;
    selectedCountry: string;
    setSelectedCountry: (v: string) => void;
    selectedNiche: string;
    setSelectedNiche: (v: string) => void;
    selectedState: string;
    setSelectedState: (v: string) => void;
    selectedCity: string;
    setSelectedCity: (v: string) => void;
    selectedCities?: string[];
    setSelectedCities?: React.Dispatch<React.SetStateAction<string[]>>;
    isLoadingCities: boolean;
    cityList: string[];
    excludedCity: string;
    setExcludedCity: (v: string) => void;
    excludedCities?: string[];
    setExcludedCities?: React.Dispatch<React.SetStateAction<string[]>>;
    globalHistory: string[];
    setGlobalHistory: React.Dispatch<React.SetStateAction<string[]>>;
    sortedLeads: Lead[];
    sortField: SortField;
    sortOrder: SortOrder;
    setSortField: (v: SortField) => void;
    handleExportCSV: () => void;
    handleExportGoogleSheets: () => void;
    hasExportAccess: boolean;
    hasExportSheetsAccess: boolean;
    handleAddToCRM: (lead: Lead) => void;
    crmLeads: CRMLead[];
    hasCRMAccess: boolean;
    hasWhatsAppAccess: boolean;
    loadMoreQuantity: number;
    setLoadMoreQuantity: (v: number) => void;
    handleLoadMore: (quantity: number) => Promise<void>;
    isLoadingMore: boolean;
    searchHistory: any[];
    loadSearchHistory: () => Promise<void>;
    clearSearchHistory: () => Promise<void>;
    showHistoryModal: boolean;
    setShowHistoryModal: (v: boolean) => void;
    plan: UserPlan;
    isParsingPrompt?: boolean;
    parsingStatus?: string;
    aiPrompt?: string;
    setAiPrompt?: (v: string) => void;
    handleAISearch?: (promptText: string) => Promise<void>;
    conversationalFeedback?: { type: 'info' | 'missing_info' | 'success'; message: string; missingFields?: ('niche' | 'location')[] } | null;
    setConversationalFeedback?: React.Dispatch<React.SetStateAction<any>>;
    chatContext?: any;
    setChatContext?: React.Dispatch<React.SetStateAction<any>>;
    chatMessages?: { id: string; sender: 'user' | 'assistant'; text: string; timestamp: Date; confirmationData?: { niche: string; city: string; state: string; quantity: number } }[];
    setChatMessages?: React.Dispatch<React.SetStateAction<any>>;
    handleConfirmAISearch?: (data: { niche: string; city: string; state: string; quantity: number }) => Promise<void>;


    resetChat?: () => void;
    // Credit callback to update parent credit counter after enrichment
    onCreditsUsed?: (newTotal: number) => void;
    // Failed enrichment attempts tracking
    failedEnrichmentAttempts?: Record<string, number>;
    setFailedEnrichmentAttempts?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    setActiveTab?: (tab: AppTab) => void;
}const LeadExtractor: React.FC<LeadExtractorProps> = ({
    leads,
    setLeads,
    state,
    filters,
    setFilters,
    handleSearch,
    loadingMessageIndex,
    locationPermission,
    requestLocation,
    setLocationPermission,
    searchMode,
    setSearchMode,
    searchSource,
    setSearchSource,
    query,
    setQuery,
    selectedCountry,
    setSelectedCountry,
    selectedNiche,
    setSelectedNiche,
    selectedState,
    setSelectedState,
    selectedCity,
    setSelectedCity,
    selectedCities,
    setSelectedCities,
    isLoadingCities,
    cityList,
    excludedCity,
    setExcludedCity,
    excludedCities,
    setExcludedCities,
    globalHistory,
    setGlobalHistory,
    sortedLeads,
    sortField,
    sortOrder,
    setSortField,
    handleExportCSV,
    handleExportGoogleSheets,
    hasExportAccess,
    hasExportSheetsAccess,
    handleAddToCRM,
    crmLeads,
    hasCRMAccess,
    hasWhatsAppAccess,
    loadMoreQuantity,
    setLoadMoreQuantity,
    handleLoadMore,
    isLoadingMore,
    searchHistory,
    loadSearchHistory,
    clearSearchHistory,
    showHistoryModal,
    setShowHistoryModal,
    plan,
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
    chatMessages = [],
    setChatMessages,
    resetChat,
    onCreditsUsed,
    failedEnrichmentAttempts = {},
    setFailedEnrichmentAttempts,
    setActiveTab
}) => {
    const safePlan = (plan || 'free').toLowerCase() as UserPlan;
    const features = PLAN_FEATURES[safePlan] || PLAN_FEATURES.free;
    const hasProAccess = PLAN_HIERARCHY[safePlan] >= PLAN_HIERARCHY.pro;

    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, isParsingPrompt]);

    const handleIgnoreReset = () => {
        setGlobalHistory([]);
    };

    // Custom niche typed by the user (overrides dropdown selection)
    const [customNicheInput, setCustomNicheInput] = React.useState('');

    // Bulk enrichment state
    const [showEnrichModal, setShowEnrichModal] = React.useState(false);
    const [enrichingIds, setEnrichingIds] = React.useState<Set<string>>(new Set());
    const [bulkEnrichProgress, setBulkEnrichProgress] = React.useState(0);
    const [isBulkEnriching, setIsBulkEnriching] = React.useState(false);

    // Individual lead enrichment from search results
    const handleEnrichLead = useCallback(async (lead: Lead) => {
        if (!hasProAccess) {
            toast.error('O Enriquecimento de Leads é exclusivo para os planos Pro e Elite. Faça o upgrade para liberar!', {
                action: setActiveTab ? {
                    label: 'Ver Planos',
                    onClick: () => setActiveTab('subscription')
                } : undefined,
                duration: 6000
            });
            return;
        }
        if (enrichingIds.has(lead.id)) return;

        setEnrichingIds(prev => new Set(prev).add(lead.id));
        try {
            toast.loading('Buscando informações públicas e sócios...', { id: `enrich-${lead.id}` });

            const enrichResult = await enrichLead(lead);

            if (!enrichResult.found) {
                if (setFailedEnrichmentAttempts) {
                    setFailedEnrichmentAttempts(prev => ({
                        ...prev,
                        [lead.id]: (prev[lead.id] || 0) + 1
                    }));
                }
                toast.info('Informações públicas não localizadas para esta empresa no momento. Nenhum crédito foi descontado.', { id: `enrich-${lead.id}` });
                return;
            }

            // Charge 1 credit only now
            const rpcPromise = supabase.rpc('consume_credits', { amount: 1 });
            const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Tempo limite esgotado.')), 10000));
            const { data: creditResult, error: creditError } = await Promise.race([rpcPromise, timeoutPromise]);
            
            if (creditError) throw creditError;

            const result = creditResult as any;
            if (!result?.success) {
                toast.error(`Enriquecimento bloqueado: ${result?.message || 'Créditos insuficientes'}`, { id: `enrich-${lead.id}` });
                return;
            }

            if (onCreditsUsed && result?.new_usage !== undefined) {
                onCreditsUsed(result.new_usage);
            }

            // Update leads in-place
            const enrichedFields = {
                cnpj: enrichResult.cnpj,
                socios: enrichResult.socios,
                email: enrichResult.email || lead.email || '',
                enrichedAt: new Date().toISOString()
            };

            setLeads(prev => prev.map(l => l.id === lead.id ? {
                ...l,
                ...enrichedFields
            } : l));

            // Sincroniza automaticamente com o CRM caso o lead já tenha sido adicionado
            const isInCRM = crmLeads.some(l => l.id === lead.id);
            if (isInCRM) {
                console.log('[LeadExtractor] Lead está no CRM, sincronizando dados enriquecidos...');
                handleAddToCRM({
                    ...lead,
                    ...enrichedFields
                });
            }

            toast.success(
                enrichResult.socios?.length
                    ? `Enriquecido! CNPJ + ${enrichResult.socios.length} sócio(s).`
                    : 'CNPJ adicionado ao lead!',
                { id: `enrich-${lead.id}` }
            );
        } catch (err: any) {
            if (setFailedEnrichmentAttempts) {
                setFailedEnrichmentAttempts(prev => ({
                    ...prev,
                    [lead.id]: (prev[lead.id] || 0) + 1
                }));
            }
            toast.info('Informações públicas não localizadas para esta empresa no momento. Nenhum crédito foi descontado.', { id: `enrich-${lead.id}` });
        } finally {
            setEnrichingIds(prev => { const n = new Set(prev); n.delete(lead.id); return n; });
        }
    }, [enrichingIds, setLeads, onCreditsUsed, setFailedEnrichmentAttempts, crmLeads, handleAddToCRM, hasProAccess, setActiveTab]);

    // Bulk enrichment (all results) - only charge for successful ones!
    const handleBulkEnrich = useCallback(async () => {
        if (!hasProAccess) {
            toast.error('O Enriquecimento de Leads em lote é exclusivo para os planos Pro e Elite. Faça o upgrade para liberar!', {
                action: setActiveTab ? {
                    label: 'Ver Planos',
                    onClick: () => setActiveTab('subscription')
                } : undefined,
                duration: 6000
            });
            return;
        }
        const toEnrich = sortedLeads.filter(l => !l.cnpj);
        if (toEnrich.length === 0) return;

        setShowEnrichModal(false);
        setIsBulkEnriching(true);
        setBulkEnrichProgress(0);

        try {
            // Mark all as enriching
            setEnrichingIds(new Set(toEnrich.map(l => l.id)));

            let completed = 0;
            let successCount = 0;
            const CONCURRENCY = 4;

            for (let i = 0; i < toEnrich.length; i += CONCURRENCY) {
                const chunk = toEnrich.slice(i, i + CONCURRENCY);
                const chunkResults = await Promise.all(
                    chunk.map(l => enrichLead(l).then(r => ({ id: l.id, result: r as any })).catch(() => ({ id: l.id, result: { found: false } as any })))
                );

                chunkResults.forEach(({ id, result: enrichResult }) => {
                    if (enrichResult.found) {
                        successCount++;
                        
                        const enrichedFields = {
                            cnpj: enrichResult.cnpj,
                            socios: enrichResult.socios,
                            email: enrichResult.email || '',
                            enrichedAt: new Date().toISOString()
                        };

                        setLeads(prev => prev.map(l => l.id === id ? {
                            ...l,
                            ...enrichedFields
                        } : l));

                        // Sincroniza automaticamente com o CRM caso o lead já tenha sido adicionado
                        const isInCRM = crmLeads.some(l => l.id === id);
                        if (isInCRM) {
                            const originalLead = toEnrich.find(l => l.id === id);
                            if (originalLead) {
                                handleAddToCRM({
                                    ...originalLead,
                                    ...enrichedFields
                                });
                            }
                        }
                    } else {
                        if (setFailedEnrichmentAttempts) {
                            setFailedEnrichmentAttempts(prev => ({
                                ...prev,
                                [id]: (prev[id] || 0) + 1
                            }));
                        }
                    }
                    setEnrichingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
                });

                completed += chunk.length;
                setBulkEnrichProgress(Math.round((completed / toEnrich.length) * 100));

                if (i + CONCURRENCY < toEnrich.length) {
                    await new Promise(r => setTimeout(r, 300));
                }
            }

            if (successCount > 0) {
                // Consume exactly the amount of successfully enriched leads, with a timeout wrapper to prevent hanging
                const rpcPromise = supabase.rpc('consume_credits', { amount: successCount });
                const timeoutPromise = new Promise<any>((_, reject) => 
                    setTimeout(() => reject(new Error('Tempo limite esgotado ao contatar o servidor de faturamento.')), 15000)
                );
                
                const { data: creditResult, error: creditError } = await Promise.race([rpcPromise, timeoutPromise]);
                
                if (creditError) {
                    console.error('Error charging bulk credits:', creditError);
                } else {
                    const result = creditResult as any;
                    if (onCreditsUsed && result?.new_usage !== undefined) {
                        onCreditsUsed(result.new_usage);
                    }
                }
                toast.success(`${successCount} de ${toEnrich.length} leads enriquecidos com sucesso! Cobrado ${successCount} crédito(s).`);
            } else {
                toast.info('Informações públicas não localizadas para as empresas selecionadas no momento. Nenhum crédito foi cobrado.');
            }
        } catch (err: any) {
            console.error('[Bulk Enrich Error]:', err);
            toEnrich.forEach(l => {
                if (setFailedEnrichmentAttempts) {
                    setFailedEnrichmentAttempts(prev => ({ ...prev, [l.id]: (prev[l.id] || 0) + 1 }));
                }
            });
            toast.info('Informações públicas não localizadas para as empresas selecionadas no momento. Nenhum crédito foi cobrado.');
        } finally {
            setIsBulkEnriching(false);
            setEnrichingIds(new Set());
            setBulkEnrichProgress(0);
        }
    }, [sortedLeads, setLeads, onCreditsUsed, crmLeads, handleAddToCRM, setFailedEnrichmentAttempts, hasProAccess, setActiveTab]);



    // Dynamic prompt analysis for quantity limits > 100
    const [promptWarning, setPromptWarning] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!aiPrompt) {
            setPromptWarning(null);
            return;
        }
        const match = aiPrompt.match(/\b(\d+)\b/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > 100) {
                setPromptWarning(`Você solicitou ${num} leads. O limite máximo é de 100 leads por busca. Nós limitaremos a busca para 100 resultados automaticamente.`);
            } else {
                setPromptWarning(null);
            }
        } else {
            setPromptWarning(null);
        }
    }, [aiPrompt]);

    // Simulated progress for long running searches without native progress (e.g. Apify)
    const [simulatedProgress, setSimulatedProgress] = React.useState(0);

    React.useEffect(() => {
        let interval: any;
        if (state.isSearching && state.progress === undefined) {
            setSimulatedProgress(0);
            // Simulate progress up to 95% over ~45 seconds
            interval = setInterval(() => {
                setSimulatedProgress(prev => {
                    if (prev >= 95) return prev;
                    // Slow down as it gets closer to 95%
                    const remaining = 95 - prev;
                    const increment = Math.max(0.1, remaining / 30) + Math.random() * 0.5;
                    return Math.min(95, prev + increment);
                });
            }, 500);
        } else {
            setSimulatedProgress(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [state.isSearching, state.progress]);

    const COUNTRIES = [
        { code: 'BR', name: '🇧🇷 Brasil' },
        { code: 'US', name: '🇺🇸 Estados Unidos' },
        { code: 'PT', name: '🇵🇹 Portugal' },
        { code: 'CA', name: '🇨🇦 Canadá' },
        { code: 'AR', name: '🇦🇷 Argentina' },
        { code: 'MX', name: '🇲🇽 México' },
        { code: 'PY', name: '🇵🇾 Paraguai' }
    ];

    const handleDropdownNicheChange = (value: string) => {
        setCustomNicheInput('');
        setSelectedNiche(value);
    };

    const handleCustomNicheChange = (value: string) => {
        setCustomNicheInput(value);
        setSelectedNiche(value);
    };

    // Reset custom niche and location when switching between search sources to prevent accidental filtering
    React.useEffect(() => {
        setCustomNicheInput('');
        setSelectedNiche('');
        setSelectedCity('');
        setSelectedState('');
    }, [searchSource]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header com título */}
            <div>
                <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tighter">
                    Buscar Leads
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Encontre novos clientes potenciais para o seu negócio.
                </p>
            </div>

            {/* Seleção de Fonte (Top-level) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-fit">
                    <button
                        onClick={() => setSearchSource('maps')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${searchSource === 'maps'
                            ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-md text-white'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        <MapPin className={`w-4 h-4 ${searchSource === 'maps' ? 'text-white' : ''}`} /> Google Maps
                    </button>
                    <button
                        onClick={() => {
                            if (features.instagram) {
                                setSearchSource('instagram');
                                setSearchMode('guided');
                            }
                        }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative ${searchSource === 'instagram'
                            ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-md text-white'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'} ${!features.instagram ? 'opacity-70 cursor-not-allowed group' : ''}`}
                    >
                        <Instagram className={`w-4 h-4 ${searchSource === 'instagram' ? 'text-white' : ''}`} />
                        <span>Instagram</span>
                        {!features.instagram && (
                            <Lock className="w-3 h-3 ml-0.5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            if (features.linkedin) {
                                setSearchSource('linkedin');
                                setSearchMode('guided');
                            }
                        }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative ${searchSource === 'linkedin'
                            ? 'bg-gradient-to-r from-[#0077b5] to-[#00a0dc] shadow-md text-white'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'} ${!features.linkedin ? 'opacity-70 cursor-not-allowed group' : ''}`}
                    >
                        <Linkedin className={`w-4 h-4 ${searchSource === 'linkedin' ? 'text-white' : ''}`} />
                        <span>LinkedIn</span>
                        {!features.linkedin && (
                            <Lock className="w-3 h-3 ml-0.5 text-zinc-400 group-hover:text-sky-300 transition-colors" />
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {globalHistory.length > 0 && (
                        <button
                            onClick={handleIgnoreReset}
                            className="text-xs font-bold text-zinc-500 hover:text-red-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-900/20 rounded-xl"
                            title="Clique para limpar a lista de ignorados"
                        >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ignorando {globalHistory.length} leads do CRM (Limpar)</span>
                        </button>
                    )}
                    <button
                        onClick={() => { loadSearchHistory(); setShowHistoryModal(true); }}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
                    >
                        <Clock className="w-3.5 h-3.5" /> Histórico diário
                    </button>
                </div>
            </div>

            {/* Progress Bar moved below Results header */}

            <div className="bg-app-cardLight dark:bg-zinc-900 p-4 md:p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                {/* Sub-modos apenas para Google Maps */}
                {searchSource === 'maps' && (
                    <div className="flex flex-wrap items-center gap-3 mb-6 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                        {/* Standard Search Modes Box */}
                        <div className="bg-zinc-100/80 dark:bg-zinc-900/60 p-1.5 rounded-2xl flex items-center gap-1.5 border border-zinc-200/50 dark:border-zinc-800/40">
                            <button 
                                onClick={() => setSearchMode('free')} 
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                                    searchMode === 'free' 
                                        ? 'bg-white dark:bg-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-black/20 text-blue-600 dark:text-blue-400 transform scale-[1.01]' 
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                                }`}
                            >
                                <Globe className="w-4 h-4" /> 
                                <span>Busca livre</span>
                            </button>
                            <button 
                                onClick={() => setSearchMode('guided')} 
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                                    searchMode === 'guided' 
                                        ? 'bg-white dark:bg-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-black/20 text-blue-600 dark:text-blue-400 transform scale-[1.01]' 
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                                }`}
                            >
                                <List className="w-4 h-4" /> 
                                <span>Busca guiada</span>
                            </button>
                        </div>
                        
                        {/* Premium AI Chat Search Separated Button */}
                        <button 
                            onClick={() => {
                                toast.info('A Busca por Chat IA estará disponível em breve!');
                            }} 
                            className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center gap-2 border group relative overflow-hidden cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/10 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800`}
                        >
                            <Wand2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            <span className="tracking-tight">Busca por chat IA</span>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 tracking-wider">
                                Em breve
                            </span>
                        </button>
                    </div>
                )}

                {searchMode === 'chat' ? (
                    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
                        {/* Elegant Centered Greeting */}
                        <div className="relative flex flex-col items-center justify-center text-center pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 mb-2">
                                Beleadly AI Assistant
                            </span>
                            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                Como posso ajudar na sua prospecção hoje?
                            </h3>
                            
                            {chatMessages.length > 1 && resetChat && (
                                <button
                                    onClick={resetChat}
                                    className="absolute right-0 top-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-0 transition-all cursor-pointer shadow-sm"
                                    title="Limpar conversa e começar de novo"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Nova conversa</span>
                                </button>
                            )}
                        </div>

                        {/* Conversational Area - Render chat log messages */}
                        <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                            {chatMessages.map((msg, idx) => {
                                const isUser = msg.sender === 'user';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-2.5 max-w-[85%] ${
                                            isUser ? 'self-end flex-row-reverse' : 'self-start'
                                        } animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out`}
                                    >
                                        {/* Avatar element */}
                                        <div
                                            className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${
                                                isUser
                                                    ? 'rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 shadow-sm'
                                                    : 'bg-transparent'
                                            }`}
                                        >
                                            {isUser ? (
                                                <Users className="w-3.5 h-3.5" />
                                            ) : (
                                                <img src="/favicon_beleadly.png" alt="Beleadly AI" className="w-6 h-6 object-contain animate-pulse" />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div
                                            className={`p-3 px-4 rounded-2xl ${
                                                isUser
                                                    ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 shadow-md shadow-black/5'
                                                    : 'bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-sm backdrop-blur-md'
                                            }`}
                                        >
                                            <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                                                {isUser ? msg.text : (
                                                    msg.text.split(/\*\*([^*]+)\*\*/g).map((part, idx) => 
                                                        idx % 2 === 1 
                                                            ? <strong key={idx} className="font-bold text-blue-600 dark:text-blue-400">{part}</strong> 
                                                            : part
                                                    )
                                                )}
                                            </p>
                                            <div className={`text-[9px] mt-1.5 text-right ${isUser ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>

                                            {msg.confirmationData && (
                                                <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 space-y-2.5 animate-in fade-in zoom-in-95 duration-300">
                                                    <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-700 pb-1.5">
                                                        <SearchIcon className="w-3.5 h-3.5 text-blue-500" />
                                                        Resumo da Prospecção
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="bg-white dark:bg-zinc-800 p-2 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                                                            <span className="block text-[9px] uppercase font-black text-zinc-400">Nicho</span>
                                                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{msg.confirmationData.niche}</span>
                                                        </div>
                                                        <div className="bg-white dark:bg-zinc-800 p-2 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                                                            <span className="block text-[9px] uppercase font-black text-zinc-400">Localização</span>
                                                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{msg.confirmationData.city ? `${msg.confirmationData.city}, ${msg.confirmationData.state}` : msg.confirmationData.state}</span>
                                                        </div>
                                                        <div className="col-span-2 bg-white dark:bg-zinc-800 p-2 rounded-lg border border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between">
                                                            <span className="text-[10px] uppercase font-black text-zinc-400">Quantidade Alvo</span>
                                                            <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">{msg.confirmationData.quantity} Leads</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <button
                                                            disabled={isParsingPrompt}
                                                            onClick={() => {
                                                                if (handleConfirmAISearch && setChatMessages) {
                                                                    setChatMessages((prev: any[]) => prev.map(m => m.id === msg.id ? { ...m, confirmationData: undefined } : m));
                                                                    handleConfirmAISearch(msg.confirmationData!);
                                                                }
                                                            }}
                                                            className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                            Confirmar e Buscar
                                                        </button>
                                                        <button
                                                            disabled={isParsingPrompt}
                                                            onClick={() => {
                                                                if (setChatMessages && setChatContext) {
                                                                    setChatMessages((prev: any[]) => [
                                                                        ...prev.map(m => m.id === msg.id ? { ...m, confirmationData: undefined } : m),
                                                                        {
                                                                            id: `cancel-${Date.now()}`,
                                                                            sender: 'assistant',
                                                                            text: '❌ Busca cancelada. Nenhum crédito foi consumido. O que mais gostaria de buscar?',
                                                                            timestamp: new Date()
                                                                        }
                                                                    ]);
                                                                    setChatContext(null);
                                                                }
                                                            }}
                                                            className="py-2 px-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-semibold rounded-lg text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Parsing Status or Loader inside Chat log */}
                            {isParsingPrompt && (
                                <div className="flex items-start gap-2.5 max-w-[85%] self-start animate-in fade-in duration-200">
                                    <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 bg-transparent">
                                        <img src="/favicon_beleadly.png" alt="Beleadly AI" className="w-6 h-6 object-contain" />
                                    </div>
                                    <div className="p-3 px-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-sm backdrop-blur-md space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                                                <Sparkles className="w-3 h-3 animate-pulse" /> Beleadly está pensando
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                                            {parsingStatus || 'Analisando dados do seu comando...'}
                                        </p>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Scroll marker anchor */}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Chat Prompt Container with Premium Styling */}
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (aiPrompt && aiPrompt.trim() && handleAISearch) {
                                handleAISearch(aiPrompt);
                            }
                        }} className="relative flex flex-col gap-4">
                            <div className="relative group rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-2 shadow-xl shadow-zinc-200/50 dark:shadow-black/40 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300">
                                <textarea
                                    rows={2}
                                    disabled={isParsingPrompt || state.isSearching}
                                    value={aiPrompt || ''}
                                    onChange={e => setAiPrompt && setAiPrompt(e.target.value)}
                                    placeholder="Descreva o tipo de lead e local que deseja encontrar..."
                                    className="w-full p-4 rounded-2xl border-0 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-0 shadow-none transition-all resize-none text-sm font-medium leading-relaxed outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (aiPrompt && aiPrompt.trim() && handleAISearch) {
                                                handleAISearch(aiPrompt);
                                            }
                                        }
                                    }}
                                />
                                <div className="flex justify-between items-center px-4 py-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-1">
                                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 font-medium">
                                        <kbd className="px-2 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono font-bold shadow-sm">Enter</kbd> para enviar
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={isParsingPrompt || !aiPrompt?.trim() || state.isSearching}
                                        className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer border-0"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Enviar</span>
                                    </button>
                                </div>
                            </div>

                            {promptWarning && (
                                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-800 dark:text-amber-400 flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-amber-950 dark:text-amber-300 text-xs">Aviso de Limite Máximo</p>
                                        <p className="text-[11px] text-amber-700/90 dark:text-amber-400/80 mt-1 leading-relaxed">{promptWarning}</p>
                                    </div>
                                </div>
                            )}

                            {/* Active search filter preview showing currently detected search context */}
                            {!isParsingPrompt && query && (
                                <div className="p-5 rounded-3xl bg-zinc-50/70 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/50 mt-2 space-y-4 shadow-sm animate-in fade-in duration-300">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Filter className="w-3.5 h-3.5 text-blue-500" /> Parâmetros compreendidos
                                        </span>
                                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-3 py-1 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1 animate-pulse">
                                            <Check className="w-3 h-3" /> Busca Iniciada
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {selectedNiche && (
                                            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 flex flex-col">
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Nicho</span>
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 truncate">
                                                    {selectedNiche}
                                                </span>
                                            </div>
                                        )}
                                        {selectedCity && (
                                            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 flex flex-col">
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Cidade</span>
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 truncate">
                                                    {selectedCity}{selectedState ? `, ${selectedState}` : ''}
                                                </span>
                                            </div>
                                        )}
                                        {filters.maxResults && (
                                            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 flex flex-col">
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Quantidade</span>
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                                                    {filters.maxResults} leads
                                                </span>
                                            </div>
                                        )}
                                        {searchSource && (
                                            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 flex flex-col">
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Plataforma</span>
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-1.5 truncate capitalize">
                                                    {searchSource === 'maps' && <><Globe className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Google Maps</>}
                                                    {searchSource === 'instagram' && <><Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram</>}
                                                    {searchSource === 'linkedin' && <><Linkedin className="w-3.5 h-3.5 text-sky-500" /> LinkedIn</>}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/30 p-2.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/40">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">Query executada:</span>
                                        <span className="font-mono bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex-1 truncate">{query}</span>
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Premium Card de Progresso Dinâmico */}
                        {state.isSearching && state.progress !== undefined && (
                            <div className="p-6 rounded-3xl bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-300 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl text-white shadow-lg shadow-blue-500/10 flex-shrink-0 animate-pulse">
                                            <SearchIcon className="w-5 h-5 animate-spin-slow" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-200">Extração de Leads Ativa...</h4>
                                            <p className="text-[11px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">
                                                {searchSource === 'maps' ? 'Google Maps (Oficial)' : searchSource === 'linkedin' ? 'LinkedIn Scraper' : 'Instagram Scraper'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-mono">
                                            {state.progress}%
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar Container */}
                                <div className="relative w-full h-3.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-700 ease-out"
                                        style={{ width: `${Math.max(5, state.progress)}%` }}
                                    />
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-stripes"></div>
                                </div>

                                {/* Live status message mapping */}
                                <div className="flex items-center gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/40 text-xs font-mono">
                                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin flex-shrink-0" />
                                    <span className="text-zinc-300">
                                        {state.progress < 25 && "Iniciando conexões de rede seguras com as APIs..."}
                                        {state.progress >= 25 && state.progress < 55 && "Consultando provedores oficiais de dados e buscando geolocalizações..."}
                                        {state.progress >= 55 && state.progress < 85 && "Filtrando registros, eliminando duplicados e enriquecendo contatos de leads..."}
                                        {state.progress >= 85 && "Finalizando processamento seguro dos leads e sincronizando resultados..."}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : searchMode === 'free' ? (
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (query.trim()) {
                                handleSearch(e, true);
                            }
                        }}
                        className="space-y-4"
                    >
                        <div className="flex flex-col gap-1 ml-1">
                            <label htmlFor="free-search" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Search className="w-3.5 h-3.5 text-primary-500" />
                                O que você deseja buscar?
                            </label>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                Digite o segmento e a região (ex: nicho em cidade estado) para obter os leads do Google Maps.
                            </span>
                        </div>

                        <div className="relative flex items-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all shadow-sm">
                            <Search className="w-5 h-5 text-zinc-400 dark:text-zinc-500 ml-4 flex-shrink-0" />
                            <input 
                                id="free-search"
                                type="text"
                                name="searchQuery"
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck={false}
                                disabled={state.isSearching}
                                className="w-full bg-transparent p-4 pl-3 pr-4 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400/80 outline-none border-none focus:ring-0 focus:outline-none text-base font-medium transition-all" 
                                placeholder="Ex: Restaurantes Italianos em Pinheiros, SP..." 
                                value={query} 
                                onChange={e => setQuery(e.target.value)} 
                            />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">Ideias de busca:</span>
                            <button
                                type="button"
                                disabled={state.isSearching}
                                onClick={() => setQuery('Contabilidades em São Paulo, SP')}
                                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all border border-zinc-200/50 dark:border-zinc-700/50"
                            >
                                Contabilidades em São Paulo, SP
                            </button>
                            <button
                                type="button"
                                disabled={state.isSearching}
                                onClick={() => setQuery('Dentistas em Copacabana, Rio de Janeiro')}
                                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all border border-zinc-200/50 dark:border-zinc-700/50"
                            >
                                Dentistas em Copacabana, Rio de Janeiro
                            </button>
                            <button
                                type="button"
                                disabled={state.isSearching}
                                onClick={() => setQuery('Academia de CrossFit em Curitiba')}
                                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all border border-zinc-200/50 dark:border-zinc-700/50"
                            >
                                Academia de CrossFit em Curitiba
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1.5 ml-1">
                                <label className="block text-xs font-bold text-zinc-500 uppercase">
                                    {searchSource === 'maps' ? 'Nicho de mercado' : searchSource === 'linkedin' ? 'Segmento ou Cargo' : 'Nicho ou hashtag'}
                                </label>
                            </div>
                            <div className="relative group">
                                {searchSource === 'maps' && (
                                    <>
                                        <select value={selectedNiche} onChange={e => setSelectedNiche(e.target.value)} className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all shadow-sm">
                                            <option value="">Selecione o nicho...</option>
                                            {COMMON_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-zinc-400 pointer-events-none" />
                                    </>
                                )}
                                {searchSource === 'instagram' && (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <select
                                                value={customNicheInput ? '' : selectedNiche}
                                                onChange={e => handleDropdownNicheChange(e.target.value)}
                                                className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all shadow-sm"
                                            >
                                                <option value="">Selecione o nicho do Instagram...</option>
                                                {INSTAGRAM_CATEGORIES.map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-zinc-400 pointer-events-none" />
                                        </div>
                                        <input
                                            type="text"
                                            value={customNicheInput}
                                            onChange={e => handleCustomNicheChange(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch(undefined, true)}
                                            placeholder="Ou escreva um nicho personalizado..."
                                            className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                )}
                                {searchSource === 'linkedin' && (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <select
                                                value={customNicheInput ? '' : selectedNiche}
                                                onChange={e => handleDropdownNicheChange(e.target.value)}
                                                className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all shadow-sm"
                                            >
                                                <option value="">Selecione o segmento do LinkedIn...</option>
                                                {LINKEDIN_CATEGORIES.map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-zinc-400 pointer-events-none" />
                                        </div>
                                        <input
                                            type="text"
                                            value={customNicheInput}
                                            onChange={e => handleCustomNicheChange(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch(undefined, true)}
                                            placeholder="Ou escreva um segmento personalizado..."
                                            className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">
                                {searchSource === 'maps' ? 'Localização (País, Estado e Cidade)' : 'Localização (País)'}
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* PAÍS */}
                                <div className="md:col-span-3 mb-2 md:mb-0">
                                    <div className="relative group">
                                        <select
                                            value={selectedCountry}
                                            onChange={(e) => {
                                                setSelectedCountry(e.target.value);
                                                setSelectedState('');
                                                setSelectedCity('');
                                            }}
                                            disabled={state.isSearching}
                                            className="w-full text-sm pl-3 pr-8 py-3 bg-zinc-50/50 dark:bg-black/20 border border-zinc-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-400 dark:text-white appearance-none"
                                        >
                                            {COUNTRIES.map(c => (
                                                <option key={c.code} value={c.code}>{c.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* ESTADO e CIDADE */}
                                {searchSource === 'maps' && (
                                    <>
                                        <div className="md:col-span-3 mb-2 md:mb-0 relative group">
                                            {selectedCountry === 'BR' ? (
                                                <select
                                                    value={selectedState}
                                                    onChange={(e) => {
                                                        setSelectedState(e.target.value);
                                                        setSelectedCity('');
                                                        if (setSelectedCities) setSelectedCities([]);
                                                        if (setExcludedCities) setExcludedCities([]);
                                                        setExcludedCity('');
                                                    }}
                                                    disabled={state.isSearching}
                                                    className="w-full text-sm pl-3 pr-8 py-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all shadow-sm font-medium"
                                                >
                                                    <option value="">UF</option>
                                                    <option value="BR" className="font-bold text-primary-600">Brasil Inteiro</option>
                                                    {BRAZIL_STATES.map(s => <option key={s.sigla} value={s.sigla}>{s.nome}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={selectedState}
                                                    onChange={(e) => setSelectedState(e.target.value)}
                                                    disabled={state.isSearching}
                                                    placeholder={`Estado/Província`}
                                                    className="w-full text-sm pl-3 pr-4 py-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm h-[46px]"
                                                />
                                            )}
                                            {selectedCountry === 'BR' && <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />}
                                        </div>

                                        {selectedCountry === 'BR' && (
                                            <>
                                                <div className="md:col-span-3 relative group">
                                                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                                                    <select 
                                                        value="" 
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (!val) return;
                                                            if (setSelectedCities) {
                                                                setSelectedCities(prev => prev.includes(val) ? prev : [...prev, val]);
                                                            }
                                                            setSelectedCity(val);
                                                        }} 
                                                        disabled={!selectedState || selectedState === 'BR' || isLoadingCities} 
                                                        className="w-full text-sm pl-10 pr-3 py-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all shadow-sm font-medium"
                                                    >
                                                        <option value="">{isLoadingCities ? 'Carregando...' : 'Adicionar cidade...'}</option>
                                                        {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                                                </div>
                                                <div className="md:col-span-3 relative group">
                                                    <Trash2 className="absolute left-3 top-3.5 w-5 h-5 text-red-400 pointer-events-none" />
                                                    <select 
                                                        value="" 
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (!val) return;
                                                            if (setExcludedCities) {
                                                                setExcludedCities(prev => prev.includes(val) ? prev : [...prev, val]);
                                                            }
                                                            setExcludedCity(val);
                                                        }} 
                                                        disabled={!selectedState || selectedState === 'BR' || isLoadingCities} 
                                                        className="w-full text-sm pl-10 pr-3 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-300 dark:border-red-900/30 focus:ring-2 focus:ring-red-500 outline-none appearance-none transition-all shadow-sm font-medium"
                                                    >
                                                        <option value="">Excluir cidade...</option>
                                                        {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-red-400 pointer-events-none" />
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Painel Visual Dinâmico de Badges de Cidades Selecionadas e Excluídas */}
                            {searchSource === 'maps' && ((selectedCities && selectedCities.length > 0) || (excludedCities && excludedCities.length > 0)) && (
                                <div className="mt-4 flex flex-wrap gap-2 items-center bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 animate-in fade-in">
                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mr-1 uppercase tracking-wider">Cidades:</span>
                                    {selectedCities?.map(city => (
                                        <span key={`sel-${city}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/50 text-xs font-bold shadow-sm">
                                            <MapPin className="w-3 h-3 text-primary-500" />
                                            {city}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (setSelectedCities) setSelectedCities(prev => prev.filter(c => c !== city));
                                                    if (selectedCity === city && selectedCities && selectedCities.length > 1) {
                                                        const next = selectedCities.find(c => c !== city) || '';
                                                        setSelectedCity(next);
                                                    } else if (selectedCity === city) {
                                                        setSelectedCity('');
                                                    }
                                                }}
                                                className="hover:bg-primary-200 dark:hover:bg-primary-800 p-0.5 rounded-full transition-colors ml-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {excludedCities?.map(city => (
                                        <span key={`exc-${city}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50 text-xs font-bold shadow-sm">
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                            {city}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (setExcludedCities) setExcludedCities(prev => prev.filter(c => c !== city));
                                                    if (excludedCity === city && excludedCities && excludedCities.length > 1) {
                                                        const next = excludedCities.find(c => c !== city) || '';
                                                        setExcludedCity(next);
                                                    } else if (excludedCity === city) {
                                                        setExcludedCity('');
                                                    }
                                                }}
                                                className="hover:bg-red-200 dark:hover:bg-red-800 p-0.5 rounded-full transition-colors ml-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {state.error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-2xl flex items-start gap-3 mt-4 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">Ocorreu um erro na busca</p>
                            <p className="text-sm opacity-90">{state.error}</p>
                        </div>
                    </div>
                )}

                {state.warning && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 p-4 rounded-2xl flex items-start gap-3 mt-4 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">{state.warning}</p>
                        </div>
                    </div>
                )}

                {searchMode !== 'chat' && (
                    <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        <div className="flex gap-3 items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <div className="flex items-center gap-2">
                                <select value={filters.maxResults} onChange={e => setFilters(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))} className="py-1.5 px-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none">
                                    <option value="20">20 resultados</option>
                                    <option value="40">40 resultados</option>
                                </select>
                            </div>
                            
                            {searchSource === 'maps' && (
                                <>
                                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                        <Globe className="w-3.5 h-3.5 text-zinc-500 ml-1" />
                                        <select value={filters.websiteFilter || 'any'} onChange={e => setFilters(prev => ({ ...prev, websiteFilter: e.target.value as any }))} className="py-0.5 text-sm bg-transparent outline-none text-zinc-600 dark:text-zinc-300 cursor-pointer">
                                            <option value="any">Site: Todos</option>
                                            <option value="required">Com site</option>
                                            <option value="excluded">Sem site</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                        <Star className="w-3.5 h-3.5 text-zinc-500 ml-1" />
                                        <select value={filters.ratingFilter || 'any'} onChange={e => setFilters(prev => ({ ...prev, ratingFilter: e.target.value as any }))} className="py-0.5 text-sm bg-transparent outline-none text-zinc-600 dark:text-zinc-300 cursor-pointer">
                                            <option value="any">Avaliação: Qualquer</option>
                                            <option value="high">Apenas 4.0+</option>
                                            <option value="low">Abaixo de 4.0</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        <button onClick={(e) => handleSearch(e, true)} disabled={state.isSearching || isLoadingMore} className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100">
                            {state.isSearching
                                ? <><Loader2 className="animate-spin w-5 h-5" /> {LOADING_MESSAGES[loadingMessageIndex]}</>
                                : <><Search className="w-5 h-5" /> {
                                    searchSource === 'maps' ? 'Buscar no Maps' : searchSource === 'linkedin' ? 'Buscar no LinkedIn' : 'Extrair do Instagram'
                                }</>
                            }
                        </button>
                    </div>
                )}
            </div>

            {/* Results Area */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Resultados</h2>
                        {leads.length > 0 && <span className={`${searchSource === 'maps' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : searchSource === 'linkedin' ? 'bg-[#0A66C2]/10 text-[#0A66C2] dark:bg-[#0A66C2]/20 dark:text-[#70b1f3]' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'} px-2.5 py-0.5 rounded-full text-sm font-bold`}>{leads.length}</span>}
                        {leads.length > 0 && (
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => setLeads([])}
                                    className="text-xs font-medium text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" /> Limpar resultados
                                </button>
                                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
                                <button
                                    onClick={handleExportCSV}
                                    disabled={!hasExportAccess}
                                    className={`px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition ${!hasExportAccess ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                    title={!hasExportAccess ? "Disponível a partir do plano Start" : "Exportar para CSV (Excel)"}
                                >
                                    <Download className="w-3 h-3" /> CSV
                                </button>
                                <button
                                    onClick={handleExportGoogleSheets}
                                    disabled={!hasExportSheetsAccess}
                                    className={`px-3 py-1.5 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition ${!hasExportSheetsAccess ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50'}`}
                                    title={!hasExportSheetsAccess ? "Disponível a partir do plano Pro" : "Exportar para Google Sheets"}
                                >
                                    <FileSpreadsheet className="w-3 h-3" /> Sheets
                                </button>

                                {/* Bulk enrich button — maps only */}
                                {searchSource === 'maps' && (
                                    <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
                                )}
                                {searchSource === 'maps' && !isBulkEnriching && (
                                    <button
                                        onClick={() => {
                                            if (!hasProAccess) {
                                                toast.error('O Enriquecimento de Leads em lote é exclusivo para os planos Pro e Elite. Faça o upgrade para liberar!', {
                                                    action: setActiveTab ? {
                                                        label: 'Ver Planos',
                                                        onClick: () => setActiveTab('subscription')
                                                    } : undefined,
                                                    duration: 6000
                                                });
                                                return;
                                            }
                                            setShowEnrichModal(true);
                                        }}
                                        className={`px-3 py-1.5 font-bold rounded-xl text-[10px] flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
                                            !hasProAccess
                                                ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700/60'
                                                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                        }`}
                                        title={
                                            !hasProAccess
                                                ? "Disponível a partir do plano Pro"
                                                : `Enriquecer todos os ${sortedLeads.filter(l => !l.cnpj).length} leads com CNPJ, e-mail e sócios`
                                        }
                                    >
                                        {!hasProAccess ? (
                                            <Lock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                                        ) : (
                                            <Zap className="w-3 h-3" />
                                        )}
                                        Enriquecer todos ({sortedLeads.filter(l => !l.cnpj).length})
                                    </button>
                                )}
                                {isBulkEnriching && (
                                    <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold rounded-xl text-[10px] flex items-center gap-1.5 border border-amber-300 dark:border-amber-700/50">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Enriquecendo... {bulkEnrichProgress}%
                                    </span>
                                )}
                            </div>

                        )}
                        <span className="text-xs text-zinc-400 dark:text-zinc-600 ml-auto hidden md:flex items-center gap-1.5">
                            {searchSource === 'maps' ? 'Dados do Google Maps (API oficial)' : searchSource === 'linkedin' ? 'Dados do LinkedIn (Professional Scraper)' : 'Dados públicos do Instagram'}
                            <Sparkles className={`w-3 h-3 ${searchSource === 'maps' ? 'text-blue-500' : searchSource === 'linkedin' ? 'text-[#0A66C2]' : 'text-pink-500'}`} />
                        </span>
                    </div>
                </div>

                {/* Progress Bar - Moved below "Resultados" text as requested */}
                {state.isSearching && (
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden mb-6 shadow-inner border border-zinc-200/50 dark:border-zinc-700/30">
                        <div
                            className={`h-full transition-all duration-700 ease-out relative ${searchSource === 'maps' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : searchSource === 'linkedin' ? 'bg-[#0A66C2] shadow-[0_0_10px_rgba(10,102,194,0.4)]' : 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]'}`}
                            style={{ width: `${Math.max(5, state.progress !== undefined ? state.progress : simulatedProgress)}%` }}
                        >
                            {state.progress === undefined && (
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-stripes"></div>
                            )}
                        </div>
                    </div>
                )}

                <LeadTable
                    leads={sortedLeads}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={(f) => setSortField(f)}
                    isSearching={state.isSearching}
                    onAddToCRM={handleAddToCRM}
                    savedLeadIds={crmLeads.map(l => l.id)}
                    hasCRMAccess={hasCRMAccess}
                    hasWhatsAppAccess={hasWhatsAppAccess}
                    searchSource={searchSource}
                    onEnrichLead={searchSource === 'maps' ? handleEnrichLead : undefined}
                    enrichingIds={enrichingIds}
                    failedEnrichmentAttempts={failedEnrichmentAttempts}
                    plan={plan}
                />

                {/* Enrich Confirmation Modal */}
                {showEnrichModal && createPortal(
                    (() => {
                        const toEnrich = sortedLeads.filter(l => !l.cnpj);
                        return (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                                <div className="absolute inset-0" onClick={() => setShowEnrichModal(false)} />
                                <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-8 max-w-[480px] w-full animate-in zoom-in-95">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
                                            <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-zinc-900 dark:text-white">Enriquecer leads</h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Adicionar CNPJ, e-mail e sócios</p>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 mb-6 border border-zinc-200 dark:border-zinc-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400">Leads a enriquecer</span>
                                            <span className="font-black text-zinc-900 dark:text-white">{toEnrich.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400">Créditos a usar</span>
                                            <span className="font-black text-amber-600 dark:text-amber-400">{toEnrich.length} crédito(s)</span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                Os dados de CNPJ, e-mail oficial e nomes dos sócios serão adicionados a cada lead encontrado. Leads já enriquecidos não serão cobrados.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowEnrichModal(false)}
                                            className="flex-1 px-3 md:px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleBulkEnrich}
                                            className="flex-1 px-3 md:px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap flex-shrink-0"
                                        >
                                            <Zap className="w-4 h-4 shrink-0" />
                                            <span>Confirmar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })(),
                    document.body
                )}

                {isBulkEnriching && createPortal(
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-md w-full text-center overflow-hidden">
                            {/* Decorative background aura */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
                            
                            {/* Animated icon with pulse */}
                            <div className="relative flex justify-center mb-6">
                                <div className="absolute inset-0 m-auto w-16 h-16 bg-amber-500/20 dark:bg-amber-500/10 rounded-full animate-ping duration-1000" />
                                <div className="relative p-5 bg-gradient-to-br from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700 rounded-2xl shadow-lg shadow-amber-500/20">
                                    <Zap className="w-8 h-8 text-white animate-pulse" />
                                </div>
                            </div>

                            {/* Copy/Typography */}
                            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-2 tracking-tight">
                                Enriquecendo Leads...
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-xs mx-auto">
                                Buscando dados CNPJ, e-mails e parceiros corporativos na BrasilAPI em tempo real. Por favor, aguarde.
                            </p>

                            {/* Glowing Progress bar container */}
                            <div className="relative w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3 border border-zinc-200/50 dark:border-zinc-700/50 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                                    style={{ width: `${Math.max(4, bulkEnrichProgress)}%` }}
                                />
                            </div>

                            {/* Percentage progress text */}
                            <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400 px-1">
                                <span>Progresso</span>
                                <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                                    {bulkEnrichProgress}%
                                </span>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}


                {leads.length > 0 && (
                    <div className="mt-6 flex flex-col items-center gap-4 bg-app-cardLight dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        <div className="flex items-center gap-3">
                            <select
                                value={loadMoreQuantity}
                                onChange={(e) => setLoadMoreQuantity(parseInt(e.target.value) || 10)}
                                className="py-2 px-4 text-sm font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            >
                                <option value="10">10 resultados</option>
                            </select>
                        </div>
                        <button
                            onClick={() => handleLoadMore(loadMoreQuantity)}
                            disabled={isLoadingMore}
                            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {isLoadingMore ? 'Buscando...' : 'Carregar mais leads'}
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
};

export default LeadExtractor;
