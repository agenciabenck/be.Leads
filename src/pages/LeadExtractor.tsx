import React, { useState, useEffect } from 'react';
import {
    Search, Search as SearchIcon, MapPin, LayoutGrid, List, Briefcase,
    ChevronDown, Building2, Trash2, AlertTriangle, X, Filter, Phone,
    Loader2, Download, FileSpreadsheet, Plus, Sparkles, Clock
} from 'lucide-react';
import { Lead, SearchState, SearchFilters, SortField, SortOrder, CRMLead, AppTab } from '@/types/types';
import { COMMON_NICHES, BRAZIL_STATES, LOADING_MESSAGES } from '@/constants/appConstants';
import { LeadTable } from '@/components/LeadTable';

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
    searchMode: 'free' | 'guided';
    setSearchMode: (v: 'free' | 'guided') => void;
    query: string;
    setQuery: (v: string) => void;
    selectedNiche: string;
    setSelectedNiche: (v: string) => void;
    selectedState: string;
    setSelectedState: (v: string) => void;
    selectedCity: string;
    setSelectedCity: (v: string) => void;
    isLoadingCities: boolean;
    cityList: string[];
    excludedCity: string;
    setExcludedCity: (v: string) => void;
    globalHistory: string[];
    setGlobalHistory: React.Dispatch<React.SetStateAction<string[]>>;
    sortedLeads: Lead[];
    sortField: SortField;
    sortOrder: SortOrder;
    setSortField: (v: SortField) => void;
    handleExportCSV: () => void;
    handleExportGoogleSheets: () => void;
    hasExportAccess: boolean;
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
}

const LeadExtractor: React.FC<LeadExtractorProps> = ({
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
    query,
    setQuery,
    selectedNiche,
    setSelectedNiche,
    selectedState,
    setSelectedState,
    selectedCity,
    setSelectedCity,
    isLoadingCities,
    cityList,
    excludedCity,
    setExcludedCity,
    globalHistory,
    setGlobalHistory,
    sortedLeads,
    sortField,
    sortOrder,
    setSortField,
    handleExportCSV,
    handleExportGoogleSheets,
    hasExportAccess,
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
    setShowHistoryModal
}) => {

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header com título */}
            <div>
                <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tighter">
                    Buscar Leads
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Encontre novos clientes potenciais para o seu negócio.
                </p>
            </div>

            <div className="bg-app-cardLight dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex gap-1">
                        <button onClick={() => setSearchMode('free')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${searchMode === 'free' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                            <LayoutGrid className="w-4 h-4" /> Livre
                        </button>
                        <button onClick={() => setSearchMode('guided')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${searchMode === 'guided' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                            <List className="w-4 h-4" /> Guiada
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {crmLeads.length > 0 && (
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Ignorando {crmLeads.length} leads do CRM
                            </span>
                        )}
                        <button
                            onClick={() => { loadSearchHistory(); setShowHistoryModal(true); }}
                            className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
                        >
                            <Clock className="w-3.5 h-3.5" /> Histórico diário
                        </button>
                        <button
                            onClick={() => { if (globalHistory.length > 0) setGlobalHistory([]) }}
                            disabled={globalHistory.length === 0}
                            className={`text-xs font-medium flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-3 transition-colors ${globalHistory.length === 0 ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-red-500'}`}
                        >
                            <X className="w-3.5 h-3.5" /> Limpar histórico ({globalHistory.length})
                        </button>
                    </div>
                </div>

                {/* Title and Reset Info */}
                <div className="mt-4 mb-2 flex flex-col md:flex-row md:items-end justify-between gap-2">
                    {searchMode === 'free' ? (
                        <h3 className="text-xs font-bold text-zinc-500 uppercase ml-1">Escolha o nicho e local</h3>
                    ) : (
                        <div className="hidden md:block"></div> /* Spacer to keep alignment if needed */
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>O histórico de buscas é resetado automaticamente todos os dias às 09:00 AM.</span>
                    </div>
                </div>

                {searchMode === 'free' ? (
                    <div className="flex gap-2">
                        <input className="flex-1 p-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all" placeholder="Ex: Restaurantes Italianos em Pinheiros, SP..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch(e, true)} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">Nicho de mercado</label>
                            <div className="relative group">
                                <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                                <select value={selectedNiche} onChange={e => setSelectedNiche(e.target.value)} className="w-full pl-10 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all shadow-sm">
                                    <option value="">Selecione o nicho...</option>
                                    {COMMON_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">Localização</label>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-2 relative group">
                                    <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all shadow-sm font-medium">
                                        <option value="">UF</option>
                                        {BRAZIL_STATES.map(s => <option key={s.sigla} value={s.sigla}>{s.nome}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-zinc-400 pointer-events-none" />
                                </div>
                                <div className="md:col-span-5 relative group">
                                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedState || isLoadingCities} className="w-full pl-10 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all shadow-sm">
                                        <option value="">{isLoadingCities ? 'Carregando...' : 'Cidade'}</option>
                                        {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-zinc-400 pointer-events-none" />
                                </div>
                                <div className="md:col-span-5 relative group">
                                    <Trash2 className="absolute left-3 top-3.5 w-5 h-5 text-red-400 pointer-events-none" />
                                    <select value={excludedCity} onChange={e => setExcludedCity(e.target.value)} disabled={!selectedState || isLoadingCities} className="w-full pl-10 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-300 dark:border-red-900/30 focus:ring-2 focus:ring-red-500 outline-none appearance-none transition-all shadow-sm">
                                        <option value="">Excluir cidade...</option>
                                        {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-red-400 pointer-events-none" />
                                </div>
                            </div>
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

                <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <div className="flex gap-4 items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Filter className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Filtros</span>
                        </div>
                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700"></div>
                        <div className="flex items-center gap-2">
                            <select value={filters.maxResults} onChange={e => setFilters(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))} className="py-1.5 px-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none">
                                <option value="10">10 resultados</option>
                                <option value="20">20 resultados</option>
                            </select>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-primary-300 transition-colors">
                            <input type="checkbox" checked={filters.requirePhone} onChange={e => setFilters(prev => ({ ...prev, requirePhone: e.target.checked }))} className="rounded text-primary-600 focus:ring-primary-500" />
                            <Phone className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-nowrap">Com telefone</span>
                        </label>
                    </div>
                    <button onClick={(e) => handleSearch(e, true)} disabled={state.isSearching} className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100">
                        {state.isSearching ? <><Loader2 className="animate-spin w-5 h-5" /> {LOADING_MESSAGES[loadingMessageIndex]}</> : <><Search className="w-5 h-5" /> Nova busca de leads</>}
                    </button>
                </div>
            </div>

            {/* Results Area */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Resultados</h2>
                        {leads.length > 0 && <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2.5 py-0.5 rounded-full text-sm font-bold">{leads.length}</span>}
                        {leads.length > 0 && (
                            <button
                                onClick={() => setLeads([])}
                                className="text-xs font-medium text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1 ml-2"
                            >
                                <Trash2 className="w-3 h-3" /> Limpar resultados
                            </button>
                        )}
                        <span className="text-xs text-zinc-400 dark:text-zinc-600 ml-auto hidden md:flex items-center gap-1.5">
                            Dados do Google Maps (API oficial e a magia da IA <Sparkles className="w-3 h-3 text-primary-500" />)
                        </span>
                    </div>
                    {leads.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportCSV}
                                className={`px-3 py-1.5 text-sm font-medium border rounded-xl flex items-center gap-2 transition-colors shadow-sm ${hasExportAccess ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 cursor-not-allowed opacity-70'}`}
                                title={!hasExportAccess ? "Disponível a partir do plano Start" : ""}
                            >
                                {hasExportAccess ? <Download className="w-4 h-4 text-green-600" /> : <X className="w-3.5 h-3.5" />} Excel/CSV
                            </button>
                            <button
                                onClick={handleExportGoogleSheets}
                                className={`px-3 py-1.5 text-sm font-medium border rounded-xl flex items-center gap-2 transition-colors shadow-sm ${hasExportAccess ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 cursor-not-allowed opacity-70'}`}
                                title={!hasExportAccess ? "Disponível a partir do plano Start" : ""}
                            >
                                {hasExportAccess ? <FileSpreadsheet className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />} Google Sheets
                            </button>
                        </div>
                    )}
                </div>

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
                />

                {leads.length > 0 && (
                    <div className="mt-6 flex flex-col items-center gap-4 bg-app-cardLight dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        <div className="flex items-center gap-3">
                            <select
                                value={loadMoreQuantity}
                                onChange={(e) => setLoadMoreQuantity(parseInt(e.target.value) || 10)}
                                className="py-2 px-4 text-sm font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            >
                                <option value="10">10 resultados</option>
                                <option value="20">20 resultados</option>
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
