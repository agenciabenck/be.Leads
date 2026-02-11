import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    RotateCcw, Loader2, CalendarIcon, X, Plus, Copy, ExternalLink, Clock, FileSpreadsheet, Sparkles, Phone, PlusCircle, MessageCircle
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { createCheckoutSession, createPortalSession } from '@/services/payment';
import { ResetPassword } from '@/components/ResetPassword';
import { Auth } from '@/components/Auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LeadTable } from '@/components/LeadTable';
import { KanbanBoard } from '@/components/KanbanBoard';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { getUserData, setUserData } from '@/utils/storageUtils';
import { formatCurrency, formatPhone } from '@/utils/formatUtils';
import { Toast, ToastContainer } from '@/components/UXComponents';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useSearch } from '@/hooks/useSearch';
import { useCRM } from '@/hooks/useCRM';
import { useCalendar } from '@/hooks/useCalendar';

// Pages
import Home from '@/pages/Home';
import LeadExtractor from '@/pages/LeadExtractor';
import CRM from '@/pages/CRM';
import Subscription from '@/pages/Subscription';
import Settings from '@/pages/Settings';

// Types & Constants
import { googleMapsService } from '@/services/googleMapsService';
import { Lead, CRMLead, CRMStatus, CalendarEvent, SearchState, SearchFilters, SortField, SortOrder, UserSettings, UserPlan, AppTab } from '@/types/types';
import {
    COMMON_NICHES, BRAZIL_STATES, TIME_OPTIONS, AVATAR_EMOJIS,
    LOADING_MESSAGES, STRIPE_PRICES, STRIPE_PRICES_ANNUAL, PLAN_HIERARCHY, DEMO_LEADS, PLAN_CREDITS
} from '@/constants/appConstants';

const App: React.FC = () => {
    // --- Custom Hooks ---
    const { user, authLoading, userSettings, setUserSettings, passwordRecoveryMode } = useAuth();

    const {
        crmLeads, setCrmLeads, crmSearchQuery, setCrmSearchQuery,
        globalHistory, setGlobalHistory, addToCRM, updateLeadStatus, updateLead, deleteLead,
        filteredLeads: filteredCrmLeads, monthlyRevenue
    } = useCRM(user?.id);
    const {
        query, setQuery, leads, setLeads, state, setState, filters, setFilters, searchMode, setSearchMode,
        loadingMessageIndex, selectedNiche, setSelectedNiche, selectedState, setSelectedState,
        selectedCity, setSelectedCity, excludedCity, setExcludedCity,
        cityList, isLoadingCities, handleSearch, handleLoadMore, isLoadingMore,
        searchHistory, loadSearchHistory, clearSearchHistory,
        showHistoryModal, setShowHistoryModal
    } = useSearch(globalHistory, (newTotal) => {
        setUserSettings(prev => ({ ...prev, leadsUsed: newTotal }));
    });
    const { calendarEvents, setCalendarEvents, upcomingEvents, addEvent, clearAllEvents } = useCalendar(user?.id);

    // --- UI Local State ---
    const [activeTab, setActiveTab] = useState<AppTab>('home');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(userSettings?.billingCycle || 'monthly');

    // Sync billingCycle with userSettings when it changes
    useEffect(() => {
        if (userSettings?.billingCycle && userSettings.billingCycle !== billingCycle) {
            setBillingCycle(userSettings.billingCycle);
        }
    }, [userSettings?.billingCycle]);

    // Modals
    const [showNewLeadModal, setShowNewLeadModal] = useState(false);
    const [newLeadValue, setNewLeadValue] = useState('');
    const [newLeadPhone, setNewLeadPhone] = useState('');
    const [newLeadNiche, setNewLeadNiche] = useState('');
    const [newLeadCity, setNewLeadCity] = useState('');
    const [newLeadUF, setNewLeadUF] = useState('');

    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDateEvents, setSelectedDateEvents] = useState<Date | null>(null);
    const [newEventData, setNewEventData] = useState({ title: '', description: '', time: '09:00' });
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    const [showExportModal, setShowExportModal] = useState(false);
    const [loadMoreQuantity, setLoadMoreQuantity] = useState(10);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Side Effects ---
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // --- Derived State ---
    const MAX_CREDITS = PLAN_CREDITS[userSettings.plan];
    const USED_CREDITS = userSettings.leadsUsed;
    const PLAN_PERCENTAGE = Math.min((USED_CREDITS / MAX_CREDITS) * 100, 100);
    const PLAN = { name: userSettings.plan };

    const hasCRMAccess = PLAN_HIERARCHY[userSettings.plan] >= PLAN_HIERARCHY.pro;
    const hasExportAccess = PLAN_HIERARCHY[userSettings.plan] >= PLAN_HIERARCHY.start;
    const hasWhatsAppAccess = PLAN_HIERARCHY[userSettings.plan] >= PLAN_HIERARCHY.start;

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Sorting Logic
    const [sortField, setSortField] = useState<SortField>(SortField.NAME);
    const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);

    // Toast Logic
    const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

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
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message: msg, type }]);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // useAuth will handle the session state change
        setLeads([]);
    };

    const handleAddToCRM = (lead: Lead) => {
        if (!hasCRMAccess) {
            setActiveTab('subscription');
            return;
        }
        addToCRM(lead);
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
            category: newLeadNiche || 'Manual',
            address: newLeadCity ? `${newLeadCity}, ${newLeadUF || 'BR'}` : 'Manual',
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
            notes: formData.get('notes') as string,
            googleMapsLink: ''
        };

        setCrmLeads(prev => [newLead, ...prev]);
        setShowNewLeadModal(false);
        setNewLeadValue('');
        setNewLeadPhone('');
        setNewLeadNiche('');
        setNewLeadCity('');
        setNewLeadUF('');
    };

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDateEvents || !newEventData.title) return;

        addEvent({
            date: selectedDateEvents.toISOString().split('T')[0],
            time: newEventData.time,
            title: newEventData.title,
            description: newEventData.description,
            type: 'meeting'
        });

        setShowEventModal(false);
        setNewEventData({ title: '', description: '', time: '09:00' });
    };

    const handleCheckout = async (planId: keyof typeof STRIPE_PRICES, isAnnual: boolean) => {
        if (!user) return;

        try {
            // Check if user needs to go to portal
            const isFree = userSettings.plan === 'free';
            const isActive = userSettings.subscriptionStatus === 'active' || userSettings.subscriptionStatus === 'trialing';

            if (isActive && !isFree) {
                showNotification('Redirecionando para atualização de plano...', 'info');
                await createPortalSession('subscription_update');
                return;
            }

            // Create Checkout Session
            showNotification('Iniciando checkout seguro...', 'info');
            const priceId = isAnnual
                ? STRIPE_PRICES_ANNUAL[planId]
                : STRIPE_PRICES[planId];

            await createCheckoutSession(priceId, isAnnual);

        } catch (err: any) {
            console.error('[Plano] Erro ao iniciar checkout:', err);
            showNotification(err.message || 'Erro ao iniciar pagamento.', 'error');
        }
    };

    const handleExportCSV = () => {
        if (!hasExportAccess) {
            setActiveTab('subscription');
            return;
        }

        // Helper function to escape CSV fields
        const escapeCSVField = (field: any): string => {
            if (field === null || field === undefined) return '';
            const str = String(field);
            // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headers = ['Nome', 'Categoria', 'Telefone', 'Endereço', 'Rating', 'Reviews', 'Website', 'Instagram', 'Google Maps'];
        const rows = leads.map(l => [
            escapeCSVField(l.name),
            escapeCSVField(l.category),
            escapeCSVField(l.phone),
            escapeCSVField(l.address),
            escapeCSVField(l.rating),
            escapeCSVField(l.reviews),
            escapeCSVField(l.website),
            escapeCSVField(l.instagram),
            escapeCSVField(l.googleMapsLink)
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `beleads_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Arquivo Excel/CSV baixado com sucesso!', 'success');
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

    // --- Loading Screen ---
    if (authLoading) {
        return (
            <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400 text-sm">Carregando...</p>
                </div>
            </div>
        );
    }

    if (passwordRecoveryMode) {
        return <ResetPassword />;
    }

    if (!user || !user.email) {
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
            <main className="flex-1 h-full overflow-y-auto relative flex flex-col p-4 md:px-4 md:py-8 pt-12 md:pt-20 scrollbar-thin">

                {/* Mobile Header */}
                <MobileHeader setIsSidebarOpen={setIsSidebarOpen} isSidebarOpen={isSidebarOpen} />

                {/* Tab Rendering */}
                {activeTab === 'home' && (
                    <Home
                        userSettings={userSettings}
                        dailyQuote="Bora prospectar e fechar novos negócios hoje?"
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
                        showNotification={showNotification}
                    />
                )}

                {activeTab === 'search' && (
                    <LeadExtractor
                        leads={leads}
                        setLeads={setLeads}
                        state={state}
                        filters={filters}
                        setFilters={setFilters}
                        handleSearch={handleSearch}
                        loadingMessageIndex={loadingMessageIndex}
                        locationPermission={locationPermission}
                        requestLocation={() => {
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    const { latitude, longitude } = position.coords;
                                    setLocationPermission('granted');

                                    // Preencher query com coordenadas para busca por proximidade
                                    setQuery(`Negócios próximos a ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

                                    // Executar busca automaticamente
                                    setTimeout(() => handleSearch(), 100);
                                },
                                (error) => {
                                    setLocationPermission('denied');
                                    console.error('Erro ao obter localização:', error);
                                }
                            );
                        }}
                        setLocationPermission={setLocationPermission}
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
                        searchHistory={searchHistory}
                        loadSearchHistory={loadSearchHistory}
                        clearSearchHistory={clearSearchHistory}
                        showHistoryModal={showHistoryModal}
                        setShowHistoryModal={setShowHistoryModal}
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
                        handleCRMStatusChange={updateLeadStatus}
                        handleUpdateLead={updateLead}
                        handleDuplicateLead={(lead) => {
                            const duplicate = { ...lead, id: `copy-${Date.now()}`, name: `${lead.name} (Cópia)`, addedAt: new Date().toISOString() };
                            setCrmLeads(prev => [duplicate, ...prev]);
                        }}
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

            {/* Modal de Histórico Diário */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-hidden">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300 overflow-hidden">
                        {/* Modal Header */}
                        <div className="w-full p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div className="flex items-center gap-3 text-left">
                                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                                    <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">Histórico diário</h3>
                                    <p className="text-[11px] text-zinc-400 font-medium tracking-tight">Buscas realizadas desde as 09:00 AM</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body - Summarized List */}
                        <div className="p-4 max-h-[60vh] overflow-y-auto w-full space-y-3 custom-scrollbar">
                            {searchHistory && searchHistory.length > 0 ? (
                                searchHistory.map((item: any) => (
                                    <div key={item.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700 flex justify-between items-center transition-all hover:border-primary/20 group">
                                        <div className="flex flex-col gap-0.5 overflow-hidden">
                                            <span className="font-bold text-zinc-900 dark:text-white text-sm truncate pr-2">
                                                {item.lead_name || 'Empresa sem nome'}
                                            </span>
                                            <span className="text-xs text-zinc-400 font-medium">
                                                {item.lead_phone || 'Telefone indisponível'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {item.lead_phone && item.lead_phone !== 'N/A' && (
                                                <a
                                                    href={`https://wa.me/${item.lead_phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-500/20 transition-all active:scale-90 shadow-sm"
                                                    title="WhatsApp"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => {
                                                    // Buscamos os dados completos do lead via placeId se necessário, 
                                                    // ou apenas adicionamos os dados básicos que temos.
                                                    // Para simplicidade e rapidez, adicionamos o que temos.
                                                    const basicLead: Lead = {
                                                        id: item.lead_id || item.id,
                                                        name: item.lead_name || 'Empresa sem nome',
                                                        phone: item.lead_phone || 'N/A',
                                                        address: '',
                                                        category: 'Lead do Histórico',
                                                        rating: 0,
                                                        reviews: 0,
                                                        website: 'N/A'
                                                    };
                                                    addToCRM(basicLead);
                                                    showNotification('Lead adicionado ao CRM com sucesso!', 'success');
                                                }}
                                                className="p-2.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-500/20 transition-all active:scale-90 shadow-sm"
                                                title="Adicionar ao CRM"
                                            >
                                                <PlusCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center opacity-40">
                                    <Clock className="w-12 h-12 mb-4 text-zinc-400" />
                                    <p className="text-sm font-medium">Nenhum lead encontrado hoje.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer - Centralized Action */}
                        <div className="w-full p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-center">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="w-full max-w-[200px] py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-xl hover:opacity-90 transition-all active:scale-95"
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Novo Evento */}
            {showEventModal && selectedDateEvents && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-hidden">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300 overflow-hidden">
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-hidden">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                                    <Plus className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Novo Negócio</h3>
                                    <p className="text-sm text-zinc-500 mt-0.5">Adicione um lead manualmente ao seu CRM.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNewLeadModal(false)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form id="manual-lead-form" onSubmit={handleManualAddLead} className="p-8 space-y-6 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">NOME DA EMPRESA *</label>
                                <input
                                    name="name"
                                    required
                                    autoFocus
                                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-[15px] font-medium"
                                    placeholder="Ex: Padaria do João"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">NICHO / CATEGORIA</label>
                                <select
                                    value={newLeadNiche}
                                    onChange={e => setNewLeadNiche(e.target.value)}
                                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-[15px] font-medium appearance-none"
                                >
                                    <option value="">Selecione um nicho...</option>
                                    {COMMON_NICHES.map(niche => (
                                        <option key={niche} value={niche}>{niche}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">VALOR POTENCIAL</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">R$</span>
                                        <input
                                            value={newLeadValue}
                                            onChange={(e) => setNewLeadValue(formatCurrency(e.target.value))}
                                            className="w-full p-4 pl-11 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-[15px] font-medium"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">TELEFONE</label>
                                    <input
                                        value={newLeadPhone}
                                        maxLength={15}
                                        onChange={(e) => setNewLeadPhone(formatPhone(e.target.value))}
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-[15px] font-medium"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3 space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">CIDADE</label>
                                    <input
                                        value={newLeadCity}
                                        onChange={e => setNewLeadCity(e.target.value)}
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-[15px] font-medium"
                                        placeholder="Ex: São Paulo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">UF</label>
                                    <input
                                        value={newLeadUF}
                                        onChange={e => setNewLeadUF(e.target.value.toUpperCase())}
                                        maxLength={2}
                                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-[15px] font-medium text-center"
                                        placeholder="SP"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">NOTAS INICIAIS</label>
                                <textarea
                                    name="notes"
                                    rows={4}
                                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-[15px] font-medium resize-none"
                                    placeholder="Detalhes do negócio..."
                                ></textarea>
                            </div>
                        </form>

                        <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900 rounded-b-[32px]">
                            <button
                                type="button"
                                onClick={() => setShowNewLeadModal(false)}
                                className="px-8 py-3 text-zinc-500 dark:text-zinc-400 font-bold hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="manual-lead-form"
                                className="px-10 py-4 bg-primary hover:opacity-90 text-white font-bold rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" /> Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Export Sheets */}
            {showExportModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300 overflow-hidden">
                    <div
                        className="absolute inset-0"
                        onClick={() => setShowExportModal(false)}
                    />
                    <div className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 fade-in duration-300">
                        <button
                            onClick={() => setShowExportModal(false)}
                            className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-zinc-900 dark:hover:text-white z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-5 md:p-6">
                            {/* Header */}
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-green-100 dark:ring-green-900/30">
                                    <FileSpreadsheet className="w-7 h-7 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Dados Copiados!</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-sm">
                                    {leads.length} lead{leads.length !== 1 ? 's' : ''} {leads.length !== 1 ? 'foram copiados' : 'foi copiado'}
                                </p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-[20px] p-4 mb-4 border border-zinc-100 dark:border-zinc-700">
                                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                    <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-primary text-[10px] font-bold">1</span>
                                    Como colar no Google Sheets:
                                </h4>
                                <div className="space-y-2.5 text-left">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-7 h-7 bg-white dark:bg-zinc-700 rounded-lg flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-600">
                                            <ExternalLink className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white">Crie uma nova planilha</p>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Clique no botão abaixo para criar</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-7 h-7 bg-white dark:bg-zinc-700 rounded-lg flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-600">
                                            <Copy className="w-3.5 h-3.5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white">Cole os dados</p>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Use <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-600 rounded text-[10px] font-mono">Ctrl+V</kbd> na célula A1</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-7 h-7 bg-white dark:bg-zinc-700 rounded-lg flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-600">
                                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white">Pronto!</p>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Dados organizados automaticamente</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleConfirmSheetsModal}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 dark:shadow-green-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Abrir Google Sheets
                                </button>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="w-full py-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl transition-all active:scale-[0.98] text-sm"
                                >
                                    Fechar
                                </button>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <label className="flex items-center justify-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={userSettings.hideSheetsModal}
                                        onChange={(e) => setUserSettings(prev => ({ ...prev, hideSheetsModal: e.target.checked }))}
                                        className="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                                    />
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                                        Não mostrar novamente (abrir direto)
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Toasts */}
            <ToastContainer>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={removeToast}
                    />
                ))}
            </ToastContainer>
        </div>
    );
};

export default App;