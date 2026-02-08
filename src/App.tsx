import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    RotateCcw, Loader2, CalendarIcon, X, Plus, Copy, ExternalLink, Clock
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { createCheckoutSession } from '@/services/payment';
import { searchLeads } from '@/services/gemini';
import { Auth } from '@/components/Auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LeadTable } from '@/components/LeadTable';
import { KanbanBoard } from '@/components/KanbanBoard';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';

// Pages
import Home from '@/pages/Home';
import LeadExtractor from '@/pages/LeadExtractor';
import CRM from '@/pages/CRM';
import Subscription from '@/pages/Subscription';
import Settings from '@/pages/Settings';

// Types & Constants
import { Lead, CRMLead, CRMStatus, CalendarEvent, SearchState, SearchFilters, SortField, SortOrder, UserSettings, UserPlan, AppTab } from '@/types/types';
import {
    COMMON_NICHES, BRAZIL_STATES, TIME_OPTIONS, AVATAR_EMOJIS,
    LOADING_MESSAGES, STRIPE_PRICES, PLAN_HIERARCHY, DEMO_LEADS, PLAN_CREDITS
} from '@/constants/appConstants';

// Utilities
const formatCurrency = (val: string) => {
    let clean = val.replace(/\D/g, '');
    let num = parseInt(clean) || 0;
    return (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
};

const formatPhone = (val: string) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 11) clean = clean.slice(0, 11);
    if (clean.length > 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    if (clean.length > 6) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    if (clean.length > 2) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return clean;
};

const App: React.FC = () => {
    // --- State Management ---
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<AppTab>('home');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // User Profile & Settings
    const [userSettings, setUserSettings] = useState<UserSettings>(() => {
        const saved = localStorage.getItem('beleads_settings');
        return saved ? JSON.parse(saved) : {
            name: 'Usuário',
            email: '',
            avatar: '👨‍💼',
            avatarType: 'emoji',
            defaultState: 'SP',
            pipelineGoal: 5000,
            pipelineResetDay: 1,
            plan: 'free',
            hideSheetsModal: false,
            notifications: { email: true, browser: true, weeklyReport: true }
        };
    });

    // Search & Leads
    const [query, setQuery] = useState('');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [state, setState] = useState<SearchState>({ isSearching: false, error: null, hasSearched: false });
    const [filters, setFilters] = useState<SearchFilters>({ maxResults: 10, minRating: 0, requirePhone: true });
    const [searchMode, setSearchMode] = useState<'free' | 'guided'>('free');
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [globalHistory, setGlobalHistory] = useState<string[]>(() => {
        const saved = localStorage.getItem('beleads_history');
        return saved ? JSON.parse(saved) : [];
    });

    // Guided Search State
    const [selectedNiche, setSelectedNiche] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
    const [excludedCity, setExcludedCity] = useState('');
    const [cityList, setCityList] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    // CRM State
    const [crmLeads, setCrmLeads] = useState<CRMLead[]>(() => {
        const saved = localStorage.getItem('beleads_crm');
        return saved ? JSON.parse(saved) : [];
    });
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [showNewLeadModal, setShowNewLeadModal] = useState(false);
    const [newLeadValue, setNewLeadValue] = useState('');
    const [newLeadPhone, setNewLeadPhone] = useState('');

    // Calendar & Events
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
        const saved = localStorage.getItem('beleads_calendar');
        return saved ? JSON.parse(saved) : [];
    });
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDateEvents, setSelectedDateEvents] = useState<Date | null>(null);
    const [newEventData, setNewEventData] = useState({ title: '', description: '', time: '09:00' });
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    // Dashboard State
    const [dailyQuote, setDailyQuote] = useState('Bora prospectar e fechar novos negócios hoje?');

    // Subscription & Billing
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    // Export Modals
    const [showExportModal, setShowExportModal] = useState(false);
    const [dontShowSheetsAgain, setDontShowSheetsAgain] = useState(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Side Effects ---
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setUserSettings(prev => ({ ...prev, email: session.user.email ?? '' }));
            }
            setAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setUserSettings(prev => ({ ...prev, email: session.user.email ?? '' }));
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        localStorage.setItem('beleads_settings', JSON.stringify(userSettings));
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [userSettings, theme]);

    useEffect(() => localStorage.setItem('beleads_crm', JSON.stringify(crmLeads)), [crmLeads]);
    useEffect(() => localStorage.setItem('beleads_calendar', JSON.stringify(calendarEvents)), [calendarEvents]);
    useEffect(() => localStorage.setItem('beleads_history', JSON.stringify(globalHistory)), [globalHistory]);

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

    // --- Derived State ---
    const MAX_CREDITS = PLAN_CREDITS[userSettings.plan];
    const USED_CREDITS = leads.length + (crmLeads.length / 10); // Simulação simples
    const PLAN_PERCENTAGE = Math.min((USED_CREDITS / MAX_CREDITS) * 100, 100);
    const PLAN = { name: userSettings.plan };

    const hasCRMAccess = PLAN_HIERARCHY[userSettings.plan] >= PLAN_HIERARCHY.pro;
    const hasExportAccess = PLAN_HIERARCHY[userSettings.plan] >= PLAN_HIERARCHY.start;
    const hasWhatsAppAccess = PLAN_HIERARCHY[userSettings.plan] >= PLAN_HIERARCHY.start;

    const filteredCrmLeads = useMemo(() => {
        if (!crmSearchQuery) return crmLeads;
        const q = crmSearchQuery.toLowerCase();
        return crmLeads.filter(l =>
            l.name.toLowerCase().includes(q) ||
            l.category.toLowerCase().includes(q) ||
            (l.phone && l.phone.includes(q))
        );
    }, [crmLeads, crmSearchQuery]);

    const monthlyRevenue = useMemo(() => {
        return crmLeads
            .filter(l => l.status === 'won')
            .reduce((acc, l) => acc + (l.potentialValue || 0), 0);
    }, [crmLeads]);

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return calendarEvents
            .filter(e => new Date(e.date + 'T00:00:00') >= today)
            .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
            .slice(0, 3);
    }, [calendarEvents]);

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Sorting Logic
    const [sortField, setSortField] = useState<SortField>(SortField.NAME);
    const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);

    const sortedLeads = useMemo(() => {
        return [...leads].sort((a, b) => {
            let valA: any = a[sortField as keyof Lead] || '';
            let valB: any = b[sortField as keyof Lead] || '';

            if (sortField === SortField.RATING || sortField === SortField.REVIEWS) {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            }

            if (valA < valB) return sortOrder === SortOrder.ASC ? -1 : 1;
            if (valA > valB) return sortOrder === SortOrder.ASC ? 1 : -1;
            return 0;
        });
    }, [leads, sortField, sortOrder]);

    // --- Handlers ---
    const showNotification = (msg: string, type: "success" | "error" | "info" = "success") => {
        alert(`${type.toUpperCase()}: ${msg}`);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        let finalQuery = query;
        if (searchMode === 'guided') {
            if (!selectedNiche || !selectedState) {
                showNotification('Preencha pelo menos o nicho e o estado!', 'error');
                return;
            }

            let queryParts = [`${selectedNiche}`];
            if (selectedCity) {
                queryParts.push(`em ${selectedCity}, ${selectedState}`);
            } else {
                queryParts.push(`no estado de ${selectedState}`);
            }

            finalQuery = queryParts.join(' ');

            if (selectedNeighborhood && selectedCity) finalQuery += `, bairro ${selectedNeighborhood}`;
            if (excludedCity) finalQuery += ` -${excludedCity}`;
        }

        if (!finalQuery.trim()) return;

        setState({ isSearching: true, error: null, hasSearched: true });
        try {
            const results = await searchLeads(finalQuery, filters, undefined, globalHistory);
            const newLeads = results.filter(r => !globalHistory.includes(r.id));
            setLeads(newLeads);
            if (newLeads.length === 0) showNotification('Nenhum lead novo encontrado.', 'info');
        } catch (err: any) {
            setState(prev => ({ ...prev, error: err.message }));
        } finally {
            setState(prev => ({ ...prev, isSearching: false }));
        }
    };

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMoreQuantity, setLoadMoreQuantity] = useState(10);
    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        // Lógica de "ver mais" delegada ao Gemini
        await handleSearch();
        setIsLoadingMore(false);
    };

    const handleAddToCRM = (lead: Lead) => {
        if (!hasCRMAccess) {
            setActiveTab('subscription');
            return;
        }
        if (crmLeads.some(l => l.id === lead.id)) {
            showNotification('Lead já está no CRM!', 'info');
            return;
        }
        const newCrmLead: CRMLead = {
            ...lead,
            status: 'prospecting',
            priority: 'medium',
            tags: [],
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            potentialValue: 0
        };
        setCrmLeads(prev => [newCrmLead, ...prev]);
        setGlobalHistory(prev => [...prev, lead.id]);
        showNotification('Lead adicionado ao CRM!');
    };

    const handleCRMStatusChange = (leadId: string, newStatus: CRMStatus) => {
        setCrmLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l
        ));
    };

    const handleUpdateLead = (leadId: string, updates: Partial<CRMLead>) => {
        setCrmLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
    };

    const handleDuplicateLead = (lead: CRMLead) => {
        const duplicate = { ...lead, id: `copy-${Date.now()}`, name: `${lead.name} (Cópia)`, addedAt: new Date().toISOString() };
        setCrmLeads(prev => [duplicate, ...prev]);
    };

    const handleManualAddLead = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        if (!name) return;

        const valClean = newLeadValue.replace(/\D/g, '');
        const valNum = (parseInt(valClean) || 0) / 100;

        const newLead: CRMLead = {
            id: `manual-${Date.now()}`,
            name,
            category: 'Manual',
            address: formData.get('city') ? `${formData.get('city')}, ${formData.get('uf')}` : 'Manual',
            phone: newLeadPhone,
            website: '',
            rating: 0,
            reviews: 0,
            status: 'prospecting',
            priority: 'medium',
            tags: ['Manual'],
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            potentialValue: valNum,
            notes: formData.get('notes') as string
        };

        setCrmLeads(prev => [newLead, ...prev]);
        setShowNewLeadModal(false);
        setNewLeadValue('');
        setNewLeadPhone('');
        showNotification('Novo negócio adicionado!');
    };

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDateEvents || !newEventData.title) return;

        const newEvent: CalendarEvent = {
            id: Math.random().toString(36).substr(2, 9),
            date: selectedDateEvents.toISOString().split('T')[0],
            time: newEventData.time,
            title: newEventData.title,
            description: newEventData.description,
            type: 'meeting'
        };

        setCalendarEvents(prev => [...prev, newEvent]);
        setShowEventModal(false);
        setNewEventData({ title: '', description: '', time: '09:00' });
        showNotification('Compromisso agendado!');
    };

    const handleCheckout = async (planId: keyof typeof STRIPE_PRICES, isAnnual: boolean) => {
        // MODO TESTE: Mudança instantânea de plano ignorando Stripe
        setUserSettings(prev => ({ ...prev, plan: planId as UserPlan }));
        showNotification(`Plano atualizado para ${planId} (Modo Teste)!`);
    };

    const handleExportCSV = () => {
        if (!hasExportAccess) {
            setActiveTab('subscription');
            return;
        }
        const headers = ['Nome', 'Categoria', 'Telefone', 'Endereço', 'Rating', 'Reviews', 'Website'];
        const rows = leads.map(l => [l.name, l.category, l.phone, l.address, l.rating, l.reviews, l.website]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `beleads_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportGoogleSheets = () => {
        if (!hasExportAccess) {
            setActiveTab('subscription');
            return;
        }
        const text = leads.map(l => `${l.name}\t${l.category}\t${l.phone}\t${l.address}\t${l.rating}`).join('\n');
        navigator.clipboard.writeText(text);
        if (userSettings.hideSheetsModal) {
            window.open('https://sheets.new', '_blank');
        } else {
            setShowExportModal(true);
        }
    };

    const handleConfirmSheetsModal = () => {
        setShowExportModal(false);
        window.open('https://sheets.new', '_blank');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserSettings(prev => ({
                    ...prev,
                    avatarImage: reader.result as string,
                    avatarType: 'image'
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Helpers ---
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const openAddEventModal = (date: Date) => {
        setSelectedDateEvents(date);
        setShowEventModal(true);
    };

    const renderAvatar = (settings: UserSettings, size: 'sm' | 'md' | 'lg' = 'md') => {
        const sizeClasses = {
            sm: 'w-8 h-8 text-sm',
            md: 'w-10 h-10 text-lg',
            lg: 'w-20 h-20 text-4xl'
        };

        if (settings.avatarType === 'image' && settings.avatarImage) {
            return <img src={settings.avatarImage} alt="Avatar" className={`${sizeClasses[size]} rounded-full object-cover shadow-sm bg-zinc-200 dark:bg-zinc-800`} />;
        }

        return (
            <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm`}>
                {settings.avatar}
            </div>
        );
    };

    const renderSubscriptionMessage = () => {
        return null;
    };

    // --- Loading Screen ---
    if (authLoading) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400 text-sm">Carregando...</p>
                </div>
            </div>
        );
    }

    // --- Auth Protection ---
    if (!user) {
        return <Auth onAuthSuccess={() => { }} />;
    }

    return (
        <div className={`h-screen w-full bg-app-light dark:bg-app-dark flex font-sans transition-colors duration-300 overflow-hidden`}>
            {/* Sidebar Component */}
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                PLAN={PLAN}
                USED_CREDITS={USED_CREDITS}
                MAX_CREDITS={MAX_CREDITS}
                PLAN_PERCENTAGE={PLAN_PERCENTAGE}
                userSettings={userSettings}
                setTheme={setTheme}
                theme={theme}
                handleLogout={handleLogout}
                renderAvatar={renderAvatar}
            />

            {/* Main Content Area */}
            <main className="flex-1 h-full overflow-y-auto relative flex flex-col p-4 md:p-8 pt-6 md:pt-10 scrollbar-thin">

                {/* Mobile Header */}
                <MobileHeader setIsSidebarOpen={setIsSidebarOpen} isSidebarOpen={isSidebarOpen} />

                {/* Tab Rendering */}
                {activeTab === 'home' && (
                    <Home
                        userSettings={userSettings}
                        dailyQuote={dailyQuote}
                        renderAvatar={renderAvatar}
                        PLAN={PLAN}
                        USED_CREDITS={USED_CREDITS}
                        MAX_CREDITS={MAX_CREDITS}
                        PLAN_PERCENTAGE={PLAN_PERCENTAGE}
                        setActiveTab={setActiveTab}
                        monthlyRevenue={monthlyRevenue}
                        hasCRMAccess={hasCRMAccess}
                        crmLeads={crmLeads}
                        currentCalendarDate={currentCalendarDate}
                        setCurrentCalendarDate={setCurrentCalendarDate}
                        getFirstDayOfMonth={getFirstDayOfMonth}
                        getDaysInMonth={getDaysInMonth}
                        openAddEventModal={openAddEventModal}
                        calendarEvents={calendarEvents}
                        selectedDateEvents={selectedDateEvents}
                        todayStr={todayStr}
                        upcomingEvents={upcomingEvents}
                        tomorrowStr={tomorrowStr}
                        setCalendarEvents={setCalendarEvents}
                        theme={theme}
                        setTheme={setTheme}
                    />
                )}

                {activeTab === 'search' && (
                    <LeadExtractor
                        leads={leads}
                        setLeads={setLeads}
                        state={state}
                        setState={setState}
                        filters={filters}
                        setFilters={setFilters}
                        handleSearch={handleSearch}
                        loadingMessageIndex={loadingMessageIndex}
                        locationPermission={'prompt'} // Simplificado
                        requestLocation={() => { }}
                        setLocationPermission={() => { }}
                        searchMode={searchMode}
                        setSearchMode={setSearchMode}
                        query={query}
                        setQuery={setQuery}
                        selectedNiche={selectedNiche}
                        setSelectedNiche={setSelectedNiche}
                        selectedState={selectedState}
                        setSelectedState={setSelectedState}
                        selectedCity={selectedCity}
                        setSelectedCity={setSelectedCity}
                        isLoadingCities={isLoadingCities}
                        cityList={cityList}
                        selectedNeighborhood={selectedNeighborhood}
                        setSelectedNeighborhood={setSelectedNeighborhood}
                        excludedCity={excludedCity}
                        setExcludedCity={setExcludedCity}
                        globalHistory={globalHistory}
                        setGlobalHistory={setGlobalHistory}
                        sortedLeads={sortedLeads}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        setSortField={setSortField}
                        handleExportCSV={handleExportCSV}
                        handleExportGoogleSheets={handleExportGoogleSheets}
                        hasExportAccess={hasExportAccess}
                        handleAddToCRM={handleAddToCRM}
                        crmLeads={crmLeads}
                        hasCRMAccess={hasCRMAccess}
                        hasWhatsAppAccess={hasWhatsAppAccess}
                        loadMoreQuantity={loadMoreQuantity}
                        setLoadMoreQuantity={setLoadMoreQuantity}
                        handleLoadMore={handleLoadMore}
                        isLoadingMore={isLoadingMore}
                    />
                )}

                {activeTab === 'crm' && (
                    <CRM
                        hasCRMAccess={hasCRMAccess}
                        setActiveTab={setActiveTab}
                        crmSearchQuery={crmSearchQuery}
                        setCrmSearchQuery={setCrmSearchQuery}
                        setShowNewLeadModal={setShowNewLeadModal}
                        crmLeads={crmLeads}
                        filteredCrmLeads={filteredCrmLeads}
                        handleCRMStatusChange={handleCRMStatusChange}
                        handleUpdateLead={handleUpdateLead}
                        handleDuplicateLead={handleDuplicateLead}
                        pipelineGoal={userSettings.pipelineGoal}
                        setPipelineGoal={(g) => setUserSettings(prev => ({ ...prev, pipelineGoal: g }))}
                        pipelineResetDay={userSettings.pipelineResetDay}
                        setCrmLeads={setCrmLeads}
                    />
                )}

                {activeTab === 'subscription' && (
                    <Subscription
                        billingCycle={billingCycle}
                        setBillingCycle={setBillingCycle}
                        userSettings={userSettings}
                        handleCheckout={handleCheckout}
                        renderSubscriptionMessage={renderSubscriptionMessage}
                    />
                )}

                {activeTab === 'settings' && (
                    <Settings
                        userSettings={userSettings}
                        setUserSettings={setUserSettings}
                        renderAvatar={renderAvatar}
                        fileInputRef={fileInputRef}
                        handleImageUpload={handleImageUpload}
                        isSettingsLoadingCities={isLoadingCities}
                        settingsCityList={cityList}
                        globalHistory={globalHistory}
                        setGlobalHistory={setGlobalHistory}
                        crmLeads={crmLeads}
                        setCrmLeads={setCrmLeads}
                        showNotification={showNotification}
                    />
                )}
            </main>

            {/* Modals are kept in App.tsx for shared access or can be moved to pages */}
            {/* Modal de Novo Evento */}
            {showEventModal && selectedDateEvents && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-hidden">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <CalendarIcon className="w-5 h-5 text-primary" />
                                </div>
                                Novo Compromisso
                            </h3>
                            <button
                                onClick={() => setShowEventModal(false)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddEvent} className="p-8 space-y-6">
                            {/* Selected Date Highlight */}
                            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 flex items-center gap-4 border border-primary/10 dark:border-primary/20">
                                <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-xl flex flex-col items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700 shrink-0">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                        {selectedDateEvents.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
                                    </span>
                                    <span className="text-[20px] font-bold text-zinc-900 dark:text-white -mt-1">
                                        {selectedDateEvents.getDate()}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-[14px] font-bold text-primary mb-0.5">Data selecionada</h4>
                                    <p className="text-[13px] text-primary/60 font-medium capitalize">
                                        {selectedDateEvents.toLocaleString('pt-BR', { weekday: 'long' })}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">TÍTULO DO EVENTO</label>
                                <input
                                    autoFocus
                                    required
                                    value={newEventData.title}
                                    onChange={e => setNewEventData({ ...newEventData, title: e.target.value })}
                                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-[15px] font-medium"
                                    placeholder="Ex: Reunião com Cliente"
                                />
                            </div>

                            <div className="space-y-2 relative">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">HORÁRIO</label>
                                <button
                                    type="button"
                                    onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-left flex justify-between items-center text-zinc-900 dark:text-white transition-all hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                >
                                    <span className="font-medium">{newEventData.time || '09:00'}</span>
                                    <Clock className="w-5 h-5 text-zinc-400" />
                                </button>
                                {isTimePickerOpen && (
                                    <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-zinc-800 rounded-[24px] border border-zinc-100 dark:border-zinc-700 shadow-2xl max-h-48 overflow-y-auto z-[210] p-2 animate-in slide-in-from-bottom-2">
                                        {TIME_OPTIONS
                                            .filter(t => {
                                                const h = parseInt(t.split(':')[0]);
                                                return h >= 6 && h <= 22;
                                            })
                                            .map(time => (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => { setNewEventData({ ...newEventData, time }); setIsTimePickerOpen(false); }}
                                                    className={`w-full text-left px-5 py-2.5 rounded-xl text-sm transition-colors ${newEventData.time === time ? 'bg-primary/10 text-primary font-bold' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}
                                                >
                                                    {time}
                                                </button>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">DESCRIÇÃO (OPCIONAL)</label>
                                <textarea
                                    value={newEventData.description}
                                    onChange={e => setNewEventData({ ...newEventData, description: e.target.value })}
                                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white h-24 text-[15px] font-medium resize-none"
                                    placeholder="Detalhes do compromisso..."
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEventModal(false)}
                                    className="px-6 py-2 text-zinc-500 dark:text-zinc-400 font-bold hover:text-zinc-900 dark:hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-4 bg-primary hover:opacity-90 text-white font-bold rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-95"
                                >
                                    Agendar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Novo Lead Manual */}
            {showNewLeadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-fade-in-up flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Novo Negócio</h3>
                            <button onClick={() => setShowNewLeadModal(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full"><X className="w-5 h-5 text-zinc-500" /></button>
                        </div>
                        <form id="manual-lead-form" onSubmit={handleManualAddLead} className="p-6 space-y-5 overflow-y-auto">
                            <input name="name" required className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" placeholder="Nome da Empresa" />
                            <div className="grid grid-cols-2 gap-4">
                                <input value={newLeadValue} onChange={(e) => setNewLeadValue(formatCurrency(e.target.value))} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" placeholder="Valor Potencial (R$)" />
                                <input value={newLeadPhone} maxLength={15} onChange={(e) => setNewLeadPhone(formatPhone(e.target.value))} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" placeholder="Telefone" />
                            </div>
                            <textarea name="notes" rows={4} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" placeholder="Notas"></textarea>
                        </form>
                        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <button type="button" onClick={() => setShowNewLeadModal(false)} className="px-6 py-2.5 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl">Cancelar</button>
                            <button type="submit" form="manual-lead-form" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg">Adicionar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Export Sheets */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
                        <Copy className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Dados copiados!</h3>
                        <p className="text-sm text-zinc-500 mb-6">Cole no Google Sheets usando Ctrl+V.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-100 rounded-xl">Fechar</button>
                            <button onClick={handleConfirmSheetsModal} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" /> Abrir Sheets</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;