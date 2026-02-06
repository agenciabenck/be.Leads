import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, Map as MapIcon, Loader2, KanbanSquare, Search as SearchIcon,
    Menu, Wallet, Home, Check, Calendar as CalendarIcon,
    Settings, Plus, X, ChevronLeft, ChevronRight, User, Shield,
    CreditCard, Zap, Trash2, Filter, Phone, Star, LayoutGrid, List,
    Briefcase, MapPin, Building2, ChevronDown, Download, FileSpreadsheet, Copy, ExternalLink,
    Clock, Lock, Quote, ArrowRight, Sparkles, Target, ChevronUp, MousePointerClick, Keyboard, Camera, Upload, Image as ImageIcon, Smile, AlertTriangle, Eye, Trophy, CalendarDays, Mail, RotateCcw, Database, LifeBuoy
} from 'lucide-react';
import { searchLeads } from './services/gemini';
import { Lead, SearchState, SearchFilters, SortField, SortOrder, AppTab, CRMLead, CRMStatus, UserSettings, CalendarEvent, UserPlan } from './types';
import { LeadTable } from './components/LeadTable';
import { KanbanBoard } from './components/KanbanBoard';
import { Auth } from './components/Auth';
import { EmptyState, SkeletonList } from './components/UXComponents';
import { supabase } from './services/supabase';
import { createCheckoutSession } from './services/payment';
import { STRIPE_PRICES } from './config/stripe';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Helper for safe JSON parsing
const safeJSONParse = <T,>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.warn(`Error parsing localStorage key "${key}":`, error);
        return fallback;
    }
};

// --- CONSTANTES ---
const COMMON_NICHES = [
    "Academias e Crossfit",
    "Açougues e Frigoríficos",
    "Advocacia e Escritórios Jurídicos",
    "Agências de Marketing Digital",
    "Agências de Turismo",
    "Arquitetura e Decoração",
    "Autopeças e Acessórios",
    "Barbearias",
    "Bares e Pubs",
    "Cafeterias e Docerias",
    "Clínicas de Estética",
    "Clínicas Odontológicas",
    "Clínicas Veterinárias",
    "Concessionárias de Veículos",
    "Condomínios Residenciais",
    "Construtoras e Incorporadoras",
    "Consultórios Médicos",
    "Contabilidade",
    "Corretoras de Seguros",
    "Distribuidoras de Bebidas",
    "Empresas de Energia Solar",
    "Empresas de Engenharia",
    "Escolas de Idiomas",
    "Escolas Particulares",
    "Farmácias e Drogarias",
    "Floriculturas",
    "Hamburguerias",
    "Hotéis e Pousadas",
    "Imobiliárias",
    "Laboratórios de Análises",
    "Lojas de Calçados",
    "Lojas de Informática",
    "Lojas de Material de Construção",
    "Lojas de Móveis",
    "Lojas de Roupa Feminina",
    "Lojas de Roupa Infantil",
    "Lojas de Roupa Masculina",
    "Lojas de Roupa Sport/Fitness",
    "Lojas de Suplementos",
    "Oficinas Mecânicas",
    "Óticas",
    "Padarias",
    "Pet Shops",
    "Pizzarias",
    "Restaurantes",
    "Salões de Beleza",
    "Supermercados",
    "Transportadoras"
].sort();

const BRAZIL_STATES = [{ sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }];
const LOADING_MESSAGES = ["Conectando ao Google Maps...", "Aplicando filtro de anti-repetição...", "Procurando por empresas na região...", "Diversificando resultados com IA...", "Extraindo telefones e endereços...", "Verificando avaliações e reputação...", "Formatando lista de contatos..."];

const MOTIVATIONAL_QUOTES = [
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "A persistência é o caminho do êxito.",
    "Não espere por oportunidades, crie-as.",
    "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
    "Sua atitude determina sua altitude.",
    "Foque no cliente, não na venda.",
    "Grandes resultados requerem grandes ambições."
];

const AVATAR_EMOJIS = ['👨‍💼', '👩‍💼', '🚀', '🦁', '💼', '🤖', '⚡', '🌟', '🎩', '👓', '🦄', '🦅', '🦉', '🎓', '👑'];

const PLAN_HIERARCHY = { free: 0, start: 1, pro: 2, elite: 3 };

const PLAN_CONFIG = {
    free: { credits: 50, whatsapp: false, export: false, crm: false, name: 'Free', priceMonthly: 0, priceAnnual: 0 },
    start: { credits: 300, whatsapp: true, export: true, crm: false, name: 'Start', priceMonthly: 39, priceAnnual: 374.40 },
    pro: { credits: 1500, whatsapp: true, export: true, crm: true, name: 'Pro', priceMonthly: 69, priceAnnual: 662.40 },
    elite: { credits: 5000, whatsapp: true, export: true, crm: true, name: 'Elite', priceMonthly: 149, priceAnnual: 1430.40 }
};

// Gerar lista de horários de 30 em 30 min
const TIME_OPTIONS = Array.from({ length: 33 }).map((_, i) => {
    const hour = Math.floor(i / 2) + 6; // Começa as 06:00
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

// Dados fictícios para o background blur do CRM
const DEMO_LEADS: CRMLead[] = [
    { id: 'd1', name: 'Construtora Elite', category: 'Construção', rating: 4.8, reviews: 120, address: 'Av. Paulista', phone: '1199999999', website: '', status: 'prospecting', priority: 'high', tags: ['Quente'], addedAt: '', updatedAt: '' },
    { id: 'd2', name: 'Clínica Sorriso', category: 'Odontologia', rating: 4.5, reviews: 45, address: 'Centro', phone: '1199999999', website: '', status: 'contacted', priority: 'medium', tags: [], addedAt: '', updatedAt: '' },
    { id: 'd3', name: 'Tech Solutions', category: 'TI', rating: 5.0, reviews: 12, address: 'Vila Olímpia', phone: '1199999999', website: '', status: 'negotiation', priority: 'high', tags: [], addedAt: '', updatedAt: '', potentialValue: 15000 },
];

// Helper para formatar moeda
const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const number = Number(numericValue) / 100;
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const parseCurrency = (value: string) => {
    return Number(value.replace(/\D/g, '')) / 100;
};

// Helper para máscara de telefone (DDD + 9 dígitos)
const formatPhone = (v: string) => {
    v = v.replace(/\D/g, ""); // Remove tudo o que não é dígito
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2"); // Coloca parênteses em volta dos dois primeiros dígitos
    v = v.replace(/(\d)(\d{4})$/, "$1-$2"); // Coloca hífen entre o quarto e o quinto dígitos
    return v;
};

// Helper para pegar data de reset dinâmico
const getMonthlyPeriodStart = (resetDay: number) => {
    const now = new Date();
    const currentDay = now.getDate();
    const start = new Date(now);

    // Se o dia atual for menor que o dia de reset, o período começou no mês passado
    if (currentDay < resetDay) {
        start.setMonth(start.getMonth() - 1);
    }
    start.setDate(resetDay);
    start.setHours(0, 0, 0, 0);
    return start;
};

// --- DATA PERSISTENCE HELPERS ---
const getUserKey = (userId: string | undefined, key: string) => userId ? `user-${userId}-${key}` : key;

const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Theme State
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Layout State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<AppTab>('home');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Data States (LocalStorage synced per user)
    const [globalHistory, setGlobalHistory] = useState<string[]>([]);
    const [crmLeads, setCrmLeads] = useState<CRMLead[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [userSettings, setUserSettings] = useState<UserSettings>({
        name: 'Usuário',
        email: 'usuario@exemplo.com',
        avatar: '👨‍💼',
        avatarType: 'emoji',
        avatarColor: '#0068ff',
        defaultState: '',
        defaultCity: '',
        pipelineGoal: 10000,
        pipelineResetDay: 10,
        plan: 'free',
        hideSheetsModal: false,
        notifications: { email: true, browser: true, weeklyReport: false }
    });

    // Search UI States
    const [searchMode, setSearchMode] = useState<'free' | 'guided'>('guided');
    const [query, setQuery] = useState('');
    const [selectedNiche, setSelectedNiche] = useState('');
    const [selectedState, setSelectedState] = useState(userSettings.defaultState || '');
    const [selectedCity, setSelectedCity] = useState(userSettings.defaultCity || '');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
    const [excludedCity, setExcludedCity] = useState('');
    const [cityList, setCityList] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [state, setState] = useState<SearchState>({ isSearching: false, error: null, hasSearched: false });
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [filters, setFilters] = useState<SearchFilters>({ maxResults: 10, minRating: 0, requirePhone: false });
    const [sortField, setSortField] = useState<SortField>(SortField.RATING);
    const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
    const [showExportModal, setShowExportModal] = useState(false);
    const [dontShowSheetsAgain, setDontShowSheetsAgain] = useState(false);
    const [loadMoreQuantity, setLoadMoreQuantity] = useState(10);
    const [userLocation, setUserLocation] = useState<GeolocationCoordinates | undefined>(undefined);
    const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

    // Settings UI States
    const [settingsCityList, setSettingsCityList] = useState<string[]>([]);
    const [isSettingsLoadingCities, setIsSettingsLoadingCities] = useState(false);

    // CRM UI States
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [showNewLeadModal, setShowNewLeadModal] = useState(false);
    const [newLeadValue, setNewLeadValue] = useState('');
    const [newLeadPhone, setNewLeadPhone] = useState(''); // Estado para máscara de telefone

    // Calendar UI States
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [selectedDateEvents, setSelectedDateEvents] = useState<Date | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [newEventData, setNewEventData] = useState({
        title: '',
        time: '',
        description: ''
    });
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    // Daily Quote
    const dailyQuote = useMemo(() => {
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
    }, []);

    // Computed Values based on Plan
    const PLAN = PLAN_CONFIG[userSettings.plan] || PLAN_CONFIG.free;
    const MAX_CREDITS = PLAN.credits;
    const USED_CREDITS = globalHistory.length;
    const PLAN_PERCENTAGE = Math.min((USED_CREDITS / MAX_CREDITS) * 100, 100);

    const hasExportAccess = PLAN.export;
    const hasWhatsAppAccess = PLAN.whatsapp;
    const hasCRMAccess = PLAN.crm;

    // Calculo de Ganho Mensal (Reset Dinâmico)
    const monthlyRevenue = useMemo(() => {
        const resetDay = userSettings.pipelineResetDay || 10;
        const startDate = getMonthlyPeriodStart(resetDay);
        return crmLeads
            .filter(l => l.status === 'won')
            .filter(l => new Date(l.updatedAt) >= startDate) // Filtra leads ganhos APÓS a data de corte
            .reduce((acc, l) => acc + (l.potentialValue || 0), 0);
    }, [crmLeads, userSettings.pipelineResetDay]);

    // --- GEOLOCALIZAÇÃO ---
    const requestLocation = () => {
        if (!navigator.geolocation) {
            showNotification("Geolocalização não suportada no seu navegador", "error");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation(position.coords);
                setLocationPermission('granted');
                showNotification("Localização ativada com sucesso!", "success");
            },
            (error) => {
                console.error("Erro ao obter localização:", error);
                setLocationPermission('denied');
                showNotification("Não foi possível obter sua localização", "error");
            }
        );
    };

    // Lista de Exclusão Combinada (Histórico + CRM)
    const getExclusionList = () => {
        // Pega nomes do histórico
        const historyNames = globalHistory;
        // Pega nomes do CRM
        const crmNames = crmLeads.map(l => l.name);
        // Combina e remove duplicatas
        const combined = Array.from(new Set([...historyNames, ...crmNames]));
        return combined;
    };

    // --- EFFECTS ---
    // Check authentication status on mount
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load user-specific data whenever user changes
    useEffect(() => {
        if (!authLoading) {
            const userId = user?.id;

            // Theme is global by default but can be saved per user if desired
            // Here we prioritize light if no theme is found, as requested
            setTheme((localStorage.getItem('theme') as 'light' | 'dark') || 'light');

            if (userId) {
                setGlobalHistory(safeJSONParse(getUserKey(userId, 'search-history'), []));
                setCrmLeads(safeJSONParse(getUserKey(userId, 'crm-leads'), []));
                setCalendarEvents(safeJSONParse(getUserKey(userId, 'calendar-events'), []));
                setUserSettings(safeJSONParse(getUserKey(userId, 'user-settings'), {
                    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
                    email: user.email || 'usuario@exemplo.com',
                    avatar: '👨‍💼',
                    avatarType: 'emoji',
                    avatarColor: '#0068ff',
                    defaultState: '',
                    defaultCity: '',
                    pipelineGoal: 10000,
                    pipelineResetDay: 10,
                    plan: 'free',
                    hideSheetsModal: false,
                    notifications: { email: true, browser: true, weeklyReport: false }
                }));
            } else {
                // Reset to defaults on logout
                setGlobalHistory([]);
                setCrmLeads([]);
                setCalendarEvents([]);
                setActiveTab('home');
            }
        }
    }, [user, authLoading]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [theme]);

    // Update document title with user name
    useEffect(() => {
        document.title = `Olá, ${userSettings.name.split(' ')[0]} - be.leads`;
    }, [userSettings.name]);

    // Sync state to user-specific localStorage
    useEffect(() => { if (user?.id) localStorage.setItem(getUserKey(user.id, 'search-history'), JSON.stringify(globalHistory)); }, [globalHistory, user?.id]);
    useEffect(() => { if (user?.id) localStorage.setItem(getUserKey(user.id, 'crm-leads'), JSON.stringify(crmLeads)); }, [crmLeads, user?.id]);
    useEffect(() => { if (user?.id) localStorage.setItem(getUserKey(user.id, 'calendar-events'), JSON.stringify(calendarEvents)); }, [calendarEvents, user?.id]);
    useEffect(() => { if (user?.id) localStorage.setItem(getUserKey(user.id, 'user-settings'), JSON.stringify(userSettings)); }, [userSettings, user?.id]);

    // Sync Search Location when User Default Changes
    useEffect(() => {
        if (userSettings.defaultState) {
            setSelectedState(userSettings.defaultState);
        }
        if (userSettings.defaultCity) {
            setSelectedCity(userSettings.defaultCity);
        }
    }, [userSettings.defaultState, userSettings.defaultCity]);

    useEffect(() => {
        let interval: any;
        if (state.isSearching || isLoadingMore) interval = setInterval(() => setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length), 2000);
        return () => clearInterval(interval);
    }, [state.isSearching, isLoadingMore]);

    // IBGE API para Cidades (Search Tab)
    useEffect(() => {
        if (!selectedState) { setCityList([]); setSelectedCity(''); return; }
        setIsLoadingCities(true);
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`)
            .then(res => res.json())
            .then(data => {
                const cities = data.map((c: any) => c.nome).sort((a: string, b: string) => a.localeCompare(b));
                setCityList([...new Set(cities as string[])]);
                if (userSettings.defaultCity && selectedState === userSettings.defaultState && !selectedCity) {
                    if (cities.includes(userSettings.defaultCity)) {
                        setSelectedCity(userSettings.defaultCity);
                    }
                }
            })
            .finally(() => setIsLoadingCities(false));
    }, [selectedState]);

    // IBGE API para Cidades (Settings Tab)
    useEffect(() => {
        if (!userSettings.defaultState) { setSettingsCityList([]); return; }
        setIsSettingsLoadingCities(true);
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${userSettings.defaultState}/municipios`)
            .then(res => res.json())
            .then(data => {
                const cities = data.map((c: any) => c.nome).sort((a: string, b: string) => a.localeCompare(b));
                setSettingsCityList([...new Set(cities as string[])]);
            })
            .finally(() => setIsSettingsLoadingCities(false));
    }, [userSettings.defaultState]);

    // --- ACTIONS ---
    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserSettings(prev => ({
                    ...prev,
                    avatarType: 'image',
                    avatarImage: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
        // Reset input value to allow selecting same file again
        if (e.target) e.target.value = '';
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (USED_CREDITS >= MAX_CREDITS) {
            showNotification("Limite de buscas atingido. Faça upgrade do plano!", "error");
            setActiveTab('subscription');
            return;
        }

        let finalQuery = query;
        let cityToExclude = '';

        if (searchMode === 'guided') {
            if (!selectedNiche || !selectedState) { showNotification("Preencha Nicho e Estado.", 'error'); return; }
            const parts = [selectedNiche, selectedNeighborhood, selectedCity, selectedState].filter(Boolean);
            finalQuery = parts.length > 1 ? `${selectedNiche} em ${[selectedNeighborhood, selectedCity, selectedState].filter(Boolean).join(', ')}` : '';
            setQuery(finalQuery);
            cityToExclude = excludedCity;
        }

        if (!finalQuery.trim()) return;

        setState({ isSearching: true, error: null, hasSearched: true });
        setLeads([]);

        // Pega lista combinada de exclusões (Histórico + CRM)
        const exclusionList = getExclusionList();

        try {
            const results = await searchLeads(
                finalQuery,
                filters,
                userLocation,
                exclusionList, // Envia lista completa para o serviço
                undefined,
                cityToExclude
            );
            setLeads(results);
            // Adiciona novos resultados ao histórico global
            setGlobalHistory(prev => [...prev, ...results.map(r => r.name)].slice(-500));
            setState(prev => ({ ...prev, isSearching: false }));
        } catch (err: any) {
            setState({ isSearching: false, error: err.message, hasSearched: true });
        }
    };

    const handleLoadMore = async () => {
        if (!query.trim()) return;
        if (USED_CREDITS >= MAX_CREDITS) {
            showNotification("Limite de buscas atingido. Faça upgrade do plano!", "error");
            setActiveTab('subscription');
            return;
        }

        setIsLoadingMore(true);

        // Pega lista combinada + resultados atuais da tela
        const currentNames = leads.map(l => l.name);
        const exclusionList = [...getExclusionList(), ...currentNames];

        try {
            const results = await searchLeads(
                query,
                filters,
                undefined,
                exclusionList, // Envia lista expandida
                loadMoreQuantity,
                excludedCity
            );
            setLeads(prev => [...prev, ...results]);
            setGlobalHistory(prev => [...prev, ...results.map(r => r.name)].slice(-500));
        } catch (err: any) {
            showNotification(err.message || "Erro ao carregar mais", "error");
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleAddToCRM = (lead: Lead) => {
        if (!hasCRMAccess) {
            showNotification("Recurso disponível nos planos Pro e Elite.", "error");
            setActiveTab('subscription');
            return;
        }
        if (crmLeads.some(l => l.id === lead.id)) return;
        const newLead: CRMLead = {
            ...lead,
            status: 'prospecting',
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            priority: 'medium',
            tags: []
        };
        setCrmLeads(prev => [...prev, newLead]);
        showNotification(`${lead.name} salvo no CRM!`);
    };

    const handleDuplicateLead = (lead: CRMLead) => {
        if (!hasCRMAccess) return;
        const newLead: CRMLead = {
            ...lead,
            id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: `${lead.name} (Cópia)`,
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setCrmLeads(prev => [...prev, newLead]);
        showNotification('Card duplicado com sucesso!');
    };

    const handleManualAddLead = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const city = formData.get('city') as string;
        const uf = formData.get('uf') as string;
        const fullAddress = city && uf ? `${city} - ${uf}` : city || uf || 'N/A';

        const newLead: CRMLead = {
            id: `manual-${Date.now()}`,
            name: formData.get('name') as string,
            phone: newLeadPhone || 'N/A', // Usa o estado com a máscara
            address: fullAddress,
            category: 'Manual',
            rating: 0,
            reviews: 0,
            website: 'N/A',
            status: 'prospecting',
            priority: 'medium',
            tags: ['Manual'],
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            potentialValue: parseCurrency(newLeadValue),
            notes: formData.get('notes') as string
        };
        setCrmLeads(prev => [...prev, newLead]);
        setShowNewLeadModal(false);
        setNewLeadValue('');
        setNewLeadPhone('');
        showNotification('Oportunidade adicionada!');
    };

    const openAddEventModal = (date: Date) => {
        setSelectedDateEvents(date);
        setNewEventData({ title: '', time: '', description: '' });
        setIsTimePickerOpen(false);
        setShowEventModal(true);
    };

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventData.title.trim() || !selectedDateEvents) return;

        const timeToSave = newEventData.time || '09:00';

        const newEvent: CalendarEvent = {
            id: `evt-${Date.now()}`,
            date: selectedDateEvents.toISOString().split('T')[0],
            title: newEventData.title,
            description: newEventData.description,
            time: timeToSave,
            type: 'meeting'
        };
        setCalendarEvents(prev => [...prev, newEvent]);
        setShowEventModal(false);
        showNotification('Compromisso agendado!');
    };

    const handleCRMStatusChange = (leadId: string, newStatus: CRMStatus) => {
        setCrmLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l));
    };

    const handleUpdateLead = (leadId: string, updates: Partial<CRMLead>) => {
        setCrmLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l));
    };

    // ... (Export functions unchanged) ...
    const handleExportCSV = () => {
        if (!hasExportAccess) {
            showNotification("Recurso disponível nos planos Start, Pro e Elite.", "error");
            setActiveTab('subscription');
            return;
        }
        if (leads.length === 0) return;
        const headers = ["Nome", "Categoria", "Telefone", "Endereço", "Avaliação", "Reviews", "Site", "Instagram"];
        const rows = leads.map(l => [
            `"${l.name}"`,
            `"${l.category}"`,
            `"${l.phone}"`,
            `"${l.address}"`,
            l.rating,
            l.reviews,
            `"${l.website}"`,
            `"${l.instagram || ''}"`
        ].join(","));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `leads_beleads_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification("Planilha Excel/CSV baixada com sucesso!");
    };

    const handleExportGoogleSheets = () => {
        if (!hasExportAccess) {
            showNotification("Recurso disponível nos planos Start, Pro e Elite.", "error");
            setActiveTab('subscription');
            return;
        }
        if (leads.length === 0) return;

        if (userSettings.hideSheetsModal) {
            copyToClipboardAndOpenSheets();
        } else {
            const headers = ["Nome", "Categoria", "Telefone", "Endereço", "Avaliação", "Reviews", "Site", "Instagram"];
            const rows = leads.map(l => [
                l.name, l.category, l.phone, l.address, l.rating, l.reviews, l.website, l.instagram || ''
            ].join("\t"));
            const tsvContent = [headers.join("\t"), ...rows].join("\n");

            navigator.clipboard.writeText(tsvContent).then(() => {
                setShowExportModal(true);
            });
        }
    };

    const copyToClipboardAndOpenSheets = () => {
        const headers = ["Nome", "Categoria", "Telefone", "Endereço", "Avaliação", "Reviews", "Site", "Instagram"];
        const rows = leads.map(l => [
            l.name, l.category, l.phone, l.address, l.rating, l.reviews, l.website, l.instagram || ''
        ].join("\t"));
        const tsvContent = [headers.join("\t"), ...rows].join("\n");

        navigator.clipboard.writeText(tsvContent).then(() => {
            window.open('https://sheets.new', '_blank');
            showNotification("Dados copiados! Colando na planilha...");
        });
    };

    const handleConfirmSheetsModal = () => {
        if (dontShowSheetsAgain) {
            setUserSettings(prev => ({ ...prev, hideSheetsModal: true }));
        }
        window.open('https://sheets.new', '_blank');
        setShowExportModal(false);
    };

    const sortedLeads = useMemo(() => {
        return [...leads].sort((a, b) => {
            let valA = sortField === SortField.RATING ? Number(a.rating) : a.name;
            let valB = sortField === SortField.RATING ? Number(b.rating) : b.name;
            if (sortOrder === SortOrder.DESC) return valA < valB ? 1 : -1;
            return valA > valB ? 1 : -1;
        });
    }, [leads, sortField, sortOrder]);

    const filteredCrmLeads = useMemo(() => crmLeads.filter(l => l.name.toLowerCase().includes(crmSearchQuery.toLowerCase())), [crmLeads, crmSearchQuery]);

    // Calendar Helpers
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

    // Upcoming Events Widget Logic
    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return calendarEvents
            .filter(e => {
                const eventDate = new Date(e.date + 'T00:00:00');
                return eventDate >= today;
            })
            .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')).getTime() - new Date(b.date + 'T' + (b.time || '00:00')).getTime());
    }, [calendarEvents]);

    // Helper para renderizar Avatar
    const renderAvatar = (settings: UserSettings, size: 'sm' | 'lg' = 'sm') => {
        const sizeClasses = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-24 h-24 text-4xl';
        if (settings.avatarType === 'image' && settings.avatarImage) {
            return <img src={settings.avatarImage} alt="Avatar" className={`${sizeClasses} rounded-full object-cover shadow-sm border-2 border-white dark:border-zinc-700 bg-app-cardLight`} />;
        }
        if (settings.avatarType === 'color') {
            return (
                <div className={`${sizeClasses} rounded-full flex items-center justify-center font-bold text-white shadow-sm border-2 border-white dark:border-zinc-700 uppercase transition-colors`} style={{ backgroundColor: settings.avatarColor || '#0068ff' }}>
                    {settings.name.charAt(0)}
                </div>
            );
        }
        return (
            <div className={`${sizeClasses} rounded-full flex items-center justify-center font-bold text-zinc-900 dark:text-zinc-100 bg-app-cardLight dark:bg-app-cardDark shadow-sm border-2 border-white dark:border-zinc-700 transition-colors`}>
                {settings.avatar || '👨‍💼'}
            </div>
        );
    };

    const renderSubscriptionMessage = () => {
        const currentPlan = userSettings.plan;

        switch (currentPlan) {
            case 'free':
                return (
                    <div className="mt-8 text-center animate-pulse">
                        <div className="text-zinc-900 dark:text-white font-bold text-sm mb-1">Parabéns! Você deu o primeiro passo.</div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-xs">Desbloqueie o WhatsApp Click e Exportação para Excel escolhendo o plano Start.</div>
                    </div>
                );
            case 'start':
                return (
                    <div className="mt-8 text-center">
                        <div className="text-zinc-900 dark:text-white font-bold text-sm mb-1">Parabéns! Você já profissionalizou sua busca.</div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-xs">Tenha o CRM completo e exportação para Google Sheets fazendo upgrade para o plano Pro.</div>
                    </div>
                );
            case 'pro':
                return (
                    <div className="mt-8 text-center">
                        <div className="text-zinc-900 dark:text-white font-bold text-sm mb-1">Parabéns! Você desbloqueou o CRM e Pipeline.</div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-xs">Libere o poder máximo da IA e tenha suporte prioritário fazendo upgrade para o plano Elite.</div>
                    </div>
                );
            case 'elite':
                return (
                    <div className="mt-8 text-center">
                        <div className="text-zinc-900 dark:text-white font-bold text-sm mb-1">Parabéns! Você está no topo.</div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-xs">Você possui o poder máximo da ferramenta e suporte exclusivo.</div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            // Limpa localStorage antes de fazer logout
            const theme = localStorage.getItem('theme');
            localStorage.clear();
            if (theme) localStorage.setItem('theme', theme);

            await supabase.auth.signOut();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleCheckout = async (planId: keyof typeof STRIPE_PRICES, isAnnual: boolean) => {
        console.log('handleCheckout iniciado', { planId, isAnnual });
        try {
            const planPrices = STRIPE_PRICES[planId];
            if (!planPrices) {
                throw new Error(`Preços não encontrados para o plano: ${planId}`);
            }

            const priceId = planPrices[isAnnual ? 'annual' : 'monthly'];
            console.log('Price ID identificado:', priceId);

            showNotification("Redirecionando para o pagamento...", "success");

            // Debug alert 
            alert(`Iniciando checkout via função para ${planId} (${isAnnual ? 'Anual' : 'Mensal'})...`);

            await createCheckoutSession(priceId, isAnnual);
        } catch (error: any) {
            console.error('Erro no handleCheckout:', error);
            showNotification(error.message, "error");
            alert(`Erro: ${error.message}`);
        }
    };

    // Auth loading screen
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

    // Auth protection - show Auth component if not logged in
    if (!user) {
        return <Auth onAuthSuccess={() => { }} />;
    }

    return (
        <div className={`h-screen w-full bg-app-light dark:bg-app-dark flex font-sans transition-colors duration-300 overflow-hidden`}>
            {/* ... Sidebar ... */}
            <aside className={`flex-shrink-0 h-full w-60 bg-sidebar text-white flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-ml-60'} z-50 border-r border-white/5`}>

                <div className="h-16 flex items-center px-4 border-b border-white/5 bg-sidebar shrink-0">
                    <img src="https://i.postimg.cc/0jF5PGV8/logo-beleads-h1-1.png" alt="be.leads" className="h-7 w-auto object-contain" />
                </div>

                <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                    {[{ id: 'home', icon: Home, label: 'Início' }, { id: 'search', icon: SearchIcon, label: 'Buscar leads' }, { id: 'crm', icon: KanbanSquare, label: 'CRM' }, { id: 'subscription', icon: Wallet, label: 'Assinatura' }, { id: 'settings', icon: Settings, label: 'Configurações' }].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id as AppTab)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${activeTab === item.id ? 'bg-primary-500 shadow-md shadow-black/20 text-white font-bold' : 'hover:bg-white/5 text-slate-400 hover:text-white font-medium'}`}><item.icon className="w-4 h-4" /> {item.label}</button>
                    ))}
                </nav>

                <div className="p-3 bg-black/20 m-2 rounded-lg border border-white/5 shrink-0">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Seu Plano</span>
                            <span className="text-xs font-bold text-white capitalize">{PLAN.name}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-slate-400 uppercase">Créditos</span><span className="text-[10px] font-bold text-white">{USED_CREDITS}/{MAX_CREDITS}</span></div>
                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden"><div className="bg-primary-500 h-full transition-all duration-500" style={{ width: `${PLAN_PERCENTAGE}%` }}></div></div>
                    {userSettings.plan === 'elite' ? (
                        <div className="mt-2 text-center">
                            <span className="text-[10px] font-bold text-success-400 flex items-center justify-center gap-1 animate-pulse"><Check className="w-3 h-3" /> Limite Máximo</span>
                            <p className="text-[10px] text-zinc-500 mt-1 cursor-pointer hover:text-white transition-colors" onClick={() => window.open('mailto:suporte@beleads.com')}>Precisa de mais? Fale conosco.</p>
                        </div>
                    ) : (
                        <button onClick={() => setActiveTab('subscription')} className={`mt-2 w-full py-2 text-[10px] font-bold rounded-md border transition-all active:scale-95 flex items-center justify-center gap-2 ${userSettings.plan === 'free' ? 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white border-transparent shadow-lg shadow-primary-500/30' : 'bg-primary-500/10 hover:bg-primary-500/20 text-primary-300 border-primary-500/20'}`}>
                            {userSettings.plan === 'free' ? 'Escolher plano' : 'Aumentar limite'}
                        </button>
                    )}
                </div>

                <div className="p-3 border-t border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab('settings')}>
                            {renderAvatar(userSettings, 'sm')}
                            <div className="flex-1 overflow-hidden"><p className="text-xs font-bold truncate text-white">{userSettings.name}</p></div>
                        </div>
                        <button onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} className="text-slate-400 hover:text-white transition-colors">{theme === 'light' ? <span className="text-xs">🌙</span> : <span className="text-xs">☀️</span>}</button>
                    </div>
                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Sair da conta"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* ... Main Content ... */}
            <main className="flex-1 h-full overflow-y-auto relative flex flex-col p-4 md:p-8 pt-6 md:pt-10 scrollbar-thin">

                {/* ... (Mobile header) ... */}
                <div className="md:hidden mb-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                        <img src="https://i.postimg.cc/0jF5PGV8/logo-beleads-h1-1.png" alt="be.leads" className="h-8 w-auto object-contain" />
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-app-cardLight dark:bg-app-cardDark rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700"><Menu className="w-6 h-6 text-zinc-800 dark:text-zinc-200" /></button>
                </div>

                {/* ... HOME TAB ... */}
                {activeTab === 'home' && (
                    <div className="animate-fade-in-up space-y-8">
                        {/* Header */}
                        <header className="flex flex-col gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">{renderAvatar(userSettings, 'sm')}<h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Olá, {userSettings.name.split(' ')[0]}!</h1></div>
                                <div className="text-zinc-500 dark:text-zinc-400 text-sm italic">{dailyQuote}</div>
                            </div>
                        </header>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: Plano Atual */}
                            <div className="bg-app-cardLight dark:bg-app-cardDark p-0 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden relative group">
                                <div className="p-5 relative z-10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Plano Atual</p>
                                            <h3 className="text-2xl font-black text-primary-600 dark:text-primary-400 mt-1 uppercase">{PLAN.name}</h3>
                                        </div>
                                        <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 p-2 rounded-lg">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium text-zinc-500">
                                            <span>Créditos: {USED_CREDITS}/{MAX_CREDITS}</span>
                                            <span>{PLAN_PERCENTAGE.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                            <div className="bg-primary-500 h-full rounded-full transition-all duration-1000" style={{ width: `${PLAN_PERCENTAGE}%` }}></div>
                                        </div>
                                        {(userSettings.plan === 'free' || userSettings.plan === 'start') && (
                                            <button onClick={() => setActiveTab('subscription')} className="w-full mt-2 text-xs font-bold text-white bg-success-600 hover:bg-success-700 py-2 rounded-lg transition-colors shadow-sm shadow-success-500/20">
                                                Fazer upgrade
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Ganho Mensal */}
                            <div className="bg-app-cardLight dark:bg-app-cardDark p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between relative overflow-hidden group">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4 relative z-20">
                                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ganho mensal</p>
                                    <div className="p-2 bg-success-50 dark:bg-success-700/20 rounded-xl text-success-600 dark:text-success-400">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className={`flex-1 flex flex-col justify-between relative z-10 transition-all ${!hasCRMAccess ? 'blur-sm opacity-50 select-none' : ''}`}>
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                                        R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <div className="mt-4">
                                        <div className="flex justify-between items-center text-xs mb-1.5">
                                            <span className="text-zinc-400">Meta: {userSettings.pipelineGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            <span className="font-bold text-success-600 dark:text-success-400">{Math.round(Math.min((monthlyRevenue / userSettings.pipelineGoal) * 100, 100))}%</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-success-500 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min((monthlyRevenue / userSettings.pipelineGoal) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Unlock Overlay - Cleaner - BLUE CTA as requested */}
                                {!hasCRMAccess && (
                                    <div className="absolute inset-x-0 bottom-0 top-16 z-30 flex flex-col items-center justify-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Lock className="w-5 h-5 text-primary-500 mb-1" />
                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">CRM disponível no Pro</span>
                                            <button onClick={() => setActiveTab('subscription')} className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-md transition-all">
                                                Liberar acesso
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card 3: Leads no CRM */}
                            <div className="bg-app-cardLight dark:bg-app-cardDark p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between relative overflow-hidden group">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4 relative z-20">
                                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Leads no CRM</p>
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className={`flex-1 flex flex-col justify-between relative z-10 transition-all ${!hasCRMAccess ? 'blur-sm opacity-50 select-none' : ''}`}>
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{crmLeads.length}</p>
                                    <div className="mt-4">
                                        <p className="text-xs text-zinc-400">Gerencie seu funil de vendas</p>
                                    </div>
                                </div>

                                {/* Unlock Overlay - Cleaner - BLUE CTA as requested */}
                                {!hasCRMAccess && (
                                    <div className="absolute inset-x-0 bottom-0 top-16 z-30 flex flex-col items-center justify-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Lock className="w-5 h-5 text-primary-500 mb-1" />
                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Gestão de pipeline</span>
                                            <button onClick={() => setActiveTab('subscription')} className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-md transition-all">
                                                Liberar acesso
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ... Calendar & Quick Actions (Unchanged) ... */}
                        {/* ... (Kept existing code for brevity) ... */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-app-cardLight dark:bg-app-cardDark p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <CalendarIcon className="w-5 h-5 text-primary-500" /> Agenda
                                        </h3>
                                        <span className="text-xs text-zinc-400 font-normal ml-2 hidden md:inline">(Clique no dia para agendar)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)))} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                                        <span className="text-sm font-bold capitalize w-32 text-center">
                                            {currentCalendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)))} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-2 mb-2">
                                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={`weekday-${i}`} className="text-center text-xs font-bold text-zinc-400">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {Array.from({ length: getFirstDayOfMonth(currentCalendarDate) }).map((_, i) => <div key={`empty-${i}`} />)}
                                    {Array.from({ length: getDaysInMonth(currentCalendarDate) }).map((_, i) => {
                                        const day = i + 1;
                                        const dateStr = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day).toISOString().split('T')[0];
                                        const hasEvents = calendarEvents.some(e => e.date === dateStr);
                                        const isSelected = selectedDateEvents?.toISOString().split('T')[0] === dateStr;
                                        const isToday = dateStr === todayStr;
                                        // Removed persistent selection style, added hover effect
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => openAddEventModal(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day))}
                                                className={`h-10 rounded-lg text-sm font-medium flex flex-col items-center justify-center relative transition-all border
                                            ${isToday ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800 font-bold' :
                                                        'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-transparent'}
                                        `}
                                            >
                                                {day}
                                                {hasEvents && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday ? 'bg-primary-600' : 'bg-primary-400'}`}></div>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="bg-app-cardLight dark:bg-app-cardDark p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[450px]">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 flex-shrink-0">
                                    <Clock className="w-5 h-5 text-primary-500" /> Próximos compromissos
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin max-h-[220px]">
                                    {upcomingEvents.length === 0 ? (
                                        <div className="text-center py-8 text-zinc-400">
                                            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">Agenda livre!</p>
                                            <button onClick={() => openAddEventModal(new Date())} className="mt-2 text-xs text-primary-500 hover:underline">Agendar para hoje</button>
                                        </div>
                                    ) : (
                                        upcomingEvents.map(evt => {
                                            const evtDate = new Date(evt.date + 'T00:00:00');
                                            const isToday = evt.date === todayStr;
                                            const isTomorrow = evt.date === tomorrowStr;
                                            return (
                                                <div key={evt.id} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-l-4 border-primary-500 flex items-start gap-3 group">
                                                    <div className="text-center min-w-[3rem]">
                                                        <div className="text-[10px] font-bold uppercase text-zinc-400">{evtDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</div>
                                                        <div className="text-lg font-bold text-zinc-800 dark:text-white leading-none">{evtDate.getDate()}</div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-zinc-900 dark:text-white truncate" title={evt.title}>{evt.title}</p>
                                                        <p className="text-xs text-zinc-500 flex justify-between mt-1 items-center">
                                                            <span>{evt.time || 'Dia todo'}</span>
                                                            {isToday && <span className="text-green-600 font-bold bg-green-100 dark:bg-green-900/30 px-1.5 rounded text-[10px]">HOJE</span>}
                                                            {isTomorrow && <span className="text-blue-600 font-bold bg-blue-100 dark:bg-blue-900/30 px-1.5 rounded text-[10px]">AMANHÃ</span>}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => setCalendarEvents(prev => prev.filter(e => e.id !== evt.id))} className="text-zinc-400 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button onClick={() => setActiveTab('search')} className="group relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-left shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500"><SearchIcon className="w-32 h-32 text-white" /></div>
                                <div className="relative z-10">
                                    <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-white/10"><Sparkles className="w-6 h-6 text-white" /></div>
                                    <h3 className="text-2xl font-bold text-white mb-1">Buscar leads</h3>
                                    <p className="text-primary-100 text-sm mb-4">Encontre novas empresas e extraia dados.</p>
                                    <div className="inline-flex items-center gap-2 text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-lg group-hover:bg-white group-hover:text-primary-600 transition-colors">Começar agora <ArrowRight className="w-4 h-4" /></div>
                                </div>
                            </button>
                            <button onClick={() => setActiveTab('crm')} className="group relative overflow-hidden bg-gradient-to-br from-success-500 to-success-700 rounded-2xl p-6 text-left shadow-lg shadow-success-500/20 hover:shadow-success-500/40 transition-all hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500"><Target className="w-32 h-32 text-white" /></div>
                                <div className="relative z-10">
                                    <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-white/10"><KanbanSquare className="w-6 h-6 text-white" /></div>
                                    <h3 className="text-2xl font-bold text-white mb-1">Acessar CRM</h3>
                                    <p className="text-success-100 text-sm mb-4">Gerencie seu pipeline de vendas.</p>
                                    <div className="inline-flex items-center gap-2 text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-lg group-hover:bg-white group-hover:text-success-600 transition-colors">Ver pipeline <ArrowRight className="w-4 h-4" /></div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* ... (Search, Subscription, CRM, Settings - All unchanged) ... */}
                {activeTab === 'search' && (
                    <div className="space-y-6 animate-fade-in-up">
                        {/* Geolocation Prompt */}
                        {locationPermission === 'prompt' && (
                            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary-100 p-2 rounded-xl text-primary-600">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Leads por proximidade</h4>
                                        <p className="text-xs text-slate-500">Ative sua localização para encontrar leads perto de você.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setLocationPermission('denied')}
                                        className="text-xs font-bold text-slate-400 px-3 py-2 hover:text-slate-600 transition-colors"
                                    >
                                        Agora não
                                    </button>
                                    <button
                                        onClick={requestLocation}
                                        className="bg-primary-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-700 shadow-md shadow-primary-500/20 active:scale-95 transition-all"
                                    >
                                        Ativar
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="bg-app-cardLight dark:bg-app-cardDark p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex gap-1">
                                    <button onClick={() => setSearchMode('free')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${searchMode === 'free' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                                        <LayoutGrid className="w-4 h-4" /> Livre
                                    </button>
                                    <button onClick={() => setSearchMode('guided')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${searchMode === 'guided' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                                        <List className="w-4 h-4" /> Guiada
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Informação sobre exclusão automática */}
                                    {crmLeads.length > 0 && (
                                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                            <Shield className="w-3 h-3" /> Ignorando {crmLeads.length} leads do CRM
                                        </span>
                                    )}
                                    {/* Botão de Histórico - Sempre visível, mas desabilitado se vazio */}
                                    <button
                                        onClick={() => { if (globalHistory.length > 0 && confirm('Limpar histórico de busca? Isso fará com que resultados anteriores possam aparecer novamente.')) setGlobalHistory([]) }}
                                        disabled={globalHistory.length === 0}
                                        className={`text-xs font-medium flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-3 transition-colors ${globalHistory.length === 0 ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-danger-500'}`}
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" /> Limpar histórico ({globalHistory.length})
                                    </button>
                                </div>
                            </div>

                            {searchMode === 'free' ? (
                                <div className="flex gap-2">
                                    <input className="flex-1 p-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all" placeholder="Ex: Restaurantes Italianos em Pinheiros, SP..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
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
                                            <div className="md:col-span-3 relative group">
                                                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                                                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedState || isLoadingCities} className="w-full pl-10 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all shadow-sm">
                                                    <option value="">{isLoadingCities ? 'Carregando...' : 'Cidade'}</option>
                                                    {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-zinc-400 pointer-events-none" />
                                            </div>
                                            <div className="md:col-span-3 relative group">
                                                <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                                                <input placeholder="Bairro (Opcional)" value={selectedNeighborhood} onChange={e => setSelectedNeighborhood(e.target.value)} className="w-full pl-10 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm" />
                                            </div>
                                            <div className="md:col-span-4 relative group">
                                                <Trash2 className="absolute left-3 top-3.5 w-5 h-5 text-red-400 pointer-events-none" />
                                                <select value={excludedCity} onChange={e => setExcludedCity(e.target.value)} disabled={!selectedState || isLoadingCities} className="w-full pl-10 p-3 rounded-xl border border-danger-200 bg-danger-50 text-danger-700 dark:bg-danger-900/10 dark:text-danger-300 dark:border-danger-900/30 focus:ring-2 focus:ring-danger-500 outline-none appearance-none transition-all shadow-sm">
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
                                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 p-4 rounded-xl flex items-start gap-3 mt-4 animate-in fade-in slide-in-from-top-2">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-sm">Ocorreu um erro na busca</p>
                                        <p className="text-sm opacity-90">{state.error}</p>
                                    </div>
                                    <button onClick={() => setState(prev => ({ ...prev, error: null }))} className="ml-auto hover:bg-danger-100 dark:hover:bg-danger-900/40 p-1 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
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
                                        <select value={filters.maxResults} onChange={e => setFilters(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))} className="py-1.5 px-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                                            <option value="5">5 resultados</option>
                                            <option value="10">10 resultados</option>
                                            <option value="20">20 resultados</option>
                                            <option value="30">30 resultados</option>
                                            <option value="50">50 resultados</option>
                                        </select>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-primary-300 transition-colors">
                                        <input type="checkbox" checked={filters.requirePhone} onChange={e => setFilters(prev => ({ ...prev, requirePhone: e.target.checked }))} className="rounded text-primary-600 focus:ring-primary-500" />
                                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                                        <span className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-nowrap">Com telefone</span>
                                    </label>
                                </div>
                                <button onClick={(e) => handleSearch(e)} disabled={state.isSearching} className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100">
                                    {state.isSearching ? <><Loader2 className="animate-spin w-5 h-5" /> {LOADING_MESSAGES[loadingMessageIndex]}</> : <><Search className="w-5 h-5" /> Buscar leads</>}
                                </button>
                            </div>
                        </div>

                        {/* Results Area */}
                        <div>
                            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Resultados</h2>
                                    {leads.length > 0 && <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2.5 py-0.5 rounded-full text-sm font-bold">{leads.length}</span>}
                                </div>
                                {leads.length > 0 && (
                                    <div className="flex gap-2">
                                        <button onClick={handleExportCSV} className={`px-3 py-1.5 text-sm font-medium border rounded-lg flex items-center gap-2 transition-colors shadow-sm ${hasExportAccess ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 cursor-not-allowed opacity-70'}`} title={!hasExportAccess ? "Disponível a partir do plano Start" : ""}>{hasExportAccess ? <Download className="w-4 h-4 text-green-600" /> : <Lock className="w-3.5 h-3.5" />} Excel/CSV</button>
                                        <button onClick={handleExportGoogleSheets} className={`px-3 py-1.5 text-sm font-medium border rounded-lg flex items-center gap-2 transition-colors shadow-sm ${hasExportAccess ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 cursor-not-allowed opacity-70'}`} title={!hasExportAccess ? "Disponível a partir do plano Start" : ""}>{hasExportAccess ? <FileSpreadsheet className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />} Google Sheets</button>
                                    </div>
                                )}
                            </div>

                            <LeadTable leads={sortedLeads} sortField={sortField} sortOrder={sortOrder} onSort={(f) => setSortField(f)} isSearching={state.isSearching} onAddToCRM={handleAddToCRM} savedLeadIds={crmLeads.map(l => l.id)} hasCRMAccess={hasCRMAccess} hasWhatsAppAccess={hasWhatsAppAccess} />

                            {leads.length > 0 && (
                                <div className="mt-6 flex flex-col items-center gap-4 bg-app-cardLight dark:bg-app-cardDark p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={loadMoreQuantity}
                                            onChange={(e) => setLoadMoreQuantity(parseInt(e.target.value) || 10)}
                                            className="py-2 px-4 text-sm font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                                        >
                                            <option value="5">5 resultados</option>
                                            <option value="10">10 resultados</option>
                                            <option value="20">20 resultados</option>
                                            <option value="30">30 resultados</option>
                                            <option value="50">50 resultados</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleLoadMore}
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
                )}

                {/* ... (SUBSCRIPTION, CRM TABs kept intact) ... */}
                {/* --- SUBSCRIPTION TAB --- */}
                {activeTab === 'subscription' && (
                    <div className="animate-fade-in-up max-w-6xl mx-auto w-full pb-10">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Planos</h2>
                            <p className="text-zinc-500 mb-6">Escolha a melhor ferramenta para escalar suas vendas.</p>

                            {/* Toggle Mensal/Anual */}
                            <div className="inline-flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === 'monthly'
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-md'
                                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    Mensal
                                </button>
                                <button
                                    onClick={() => setBillingCycle('annual')}
                                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all relative ${billingCycle === 'annual'
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-md'
                                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    Anual
                                    <span className="absolute -top-2 -right-2 bg-success-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        -20%
                                    </span>
                                </button>
                            </div>

                            {billingCycle === 'annual' && (
                                <p className="text-xs text-success-600 dark:text-success-400 mt-3 font-medium">
                                    💰 Economize 20% com o plano anual!
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { id: 'free', name: 'Free', priceMonthly: 0, priceAnnual: 0, credits: 50, features: ['50 Buscas/mês', 'Visualização Básica'], missing: ['WhatsApp Click', 'Exportar Excel/Sheets', 'CRM Completo'], text: "Indicado para começar e conhecer a plataforma" },
                                { id: 'start', name: 'Start', priceMonthly: 39, priceAnnual: 374.40, credits: 300, features: ['300 Buscas/mês', 'WhatsApp Click', 'Exportar Excel', 'Suporte Email'], missing: ['Google Sheets', 'CRM Completo', 'IA Avançada'], text: "Para quem está começando a prospectar ativamente" },
                                { id: 'pro', name: 'Pro', priceMonthly: 69, priceAnnual: 662.40, credits: 1500, features: ['1.500 Buscas/mês', 'CRM Completo', 'WhatsApp Click', 'Exportar Excel & Sheets'], missing: ['IA Avançada'], popular: true, text: "Para quem quer escalar vendas com organização" },
                                { id: 'elite', name: 'Elite', priceMonthly: 149, priceAnnual: 1430.40, credits: 5000, features: ['5.000 Buscas/mês', 'IA Avançada', 'Suporte prioritário'], missing: [], text: "Poder máximo para grandes operações" }
                            ].map(plan => {
                                const currentLevel = PLAN_HIERARCHY[userSettings.plan];
                                const planLevel = PLAN_HIERARCHY[plan.id as UserPlan];
                                const isCurrent = userSettings.plan === plan.id;
                                const isLower = planLevel < currentLevel;
                                // Removed "popular" badge if user is already on Pro or Elite
                                const showPopular = plan.popular && userSettings.plan !== 'elite' && userSettings.plan !== 'pro';

                                // Determinar estilo do card baseado no plano
                                let cardStyle = 'bg-app-cardLight dark:bg-app-cardDark border-zinc-200 dark:border-zinc-800';
                                if (showPopular) {
                                    cardStyle = 'bg-app-cardLight dark:bg-app-cardDark border-success-500 ring-2 ring-success-500/20 scale-105 z-10';
                                } else if (isCurrent) {
                                    if (plan.id === 'free') {
                                        // Estilo CINZA para plano FREE atual
                                        cardStyle = 'bg-zinc-50 dark:bg-zinc-900 border-zinc-400 ring-1 ring-zinc-400 shadow-xl shadow-zinc-500/10 scale-[1.02]';
                                    } else {
                                        // Estilo VERDE para planos PAGOS atuais (PRO e ELITE)
                                        cardStyle = 'bg-gradient-to-br from-success-50 to-white dark:from-zinc-900 dark:to-zinc-800/50 border-success-500 ring-1 ring-success-500 shadow-xl shadow-success-500/10 scale-[1.02]';
                                    }
                                }

                                return (
                                    <div key={plan.id} className={`relative rounded-2xl p-6 border flex flex-col transition-all ${cardStyle} ${isLower ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                                        {showPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-lg shadow-success-500/30">Mais popular</div>}
                                        {isCurrent && (
                                            <div className="absolute top-2 right-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${plan.id === 'free' ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700' : 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300 border-success-200 dark:border-success-800'}`}>
                                                    <Check className="w-3 h-3" /> Atual
                                                </span>
                                            </div>
                                        )}
                                        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                                        <p className="text-xs text-zinc-500 min-h-[40px] mb-4">{plan.text}</p>

                                        {/* Preço */}
                                        <div className="mb-6">
                                            {billingCycle === 'monthly' ? (
                                                <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                                                    R$ {plan.priceMonthly.toFixed(2).replace('.', ',')}
                                                    <span className="text-sm text-zinc-400 font-normal">/mês</span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                                                        R$ {(plan.priceAnnual / 12).toFixed(2).replace('.', ',')}
                                                        <span className="text-sm text-zinc-400 font-normal">/mês</span>
                                                    </div>
                                                    {plan.id !== 'free' && (
                                                        <>
                                                            <div className="text-xs text-zinc-400 mt-1 line-through">
                                                                R$ {plan.priceMonthly.toFixed(2).replace('.', ',')}/mês
                                                            </div>
                                                            <div className="inline-block mt-2 bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 text-xs font-bold px-2 py-1 rounded">
                                                                Economize R$ {((plan.priceMonthly * 12 - plan.priceAnnual)).toFixed(2).replace('.', ',')}/ano
                                                            </div>
                                                            <div className="text-[10px] text-zinc-400 mt-2">
                                                                Cobrança anual: R$ {plan.priceAnnual.toFixed(2).replace('.', ',')}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <ul className="space-y-3 mb-8 flex-1">
                                            {plan.features.map(f => <li key={f} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300"><Check className="w-3.5 h-3.5 text-success-500 flex-shrink-0" /> {f}</li>)}
                                            {plan.missing?.map(f => <li key={f} className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-600 line-through"><X className="w-3.5 h-3.5 flex-shrink-0" /> {f}</li>)}
                                        </ul>
                                        <button
                                            onClick={() => {
                                                alert(`Clique reconhecido no plano: ${plan.id}`); // Debug explícito

                                                if (isCurrent || isLower) {
                                                    alert('Botão desabilitado pela lógica (isCurrent ou isLower)');
                                                    return;
                                                }

                                                // Se for free, apenas atualiza localmente (não tem checkout)
                                                if (plan.id === 'free') {
                                                    setUserSettings(prev => ({ ...prev, plan: 'free' }));
                                                    return;
                                                }

                                                // Para planos pagos, inicia checkout
                                                handleCheckout(plan.id as keyof typeof STRIPE_PRICES, billingCycle === 'annual');
                                            }}
                                            // disabled={isCurrent || isLower} // Removendo disabled nativo temporariamente para testar clique
                                            className={`w-full py-3 rounded-xl font-bold transition-all text-sm ${isCurrent
                                                ? (plan.id === 'free' ? 'bg-zinc-600 text-white cursor-default shadow-md' : 'bg-success-600 text-white cursor-default shadow-md shadow-success-500/20')
                                                : isLower
                                                    ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-800'
                                                    : showPopular
                                                        ? 'bg-success-600 text-white hover:bg-success-700 shadow-lg shadow-success-500/30 hover:-translate-y-0.5'
                                                        : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 hover:-translate-y-0.5'
                                                }`}
                                        >
                                            {isCurrent ? 'Plano atual' : isLower ? 'Plano inferior' : 'Assinar Agora'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                        {renderSubscriptionMessage()}
                    </div>
                )}

                {/* --- CRM TAB --- */}
                {activeTab === 'crm' && (
                    <div className="animate-fade-in-up h-full flex flex-col relative">

                        {/* Lock Overlay if no access - renders ON TOP of the blurry board */}
                        {!hasCRMAccess && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4">
                                <div className="flex flex-col items-center gap-4 bg-white/90 dark:bg-black/80 backdrop-blur-md p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center max-w-md">
                                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full shadow-inner">
                                        <Lock className="w-10 h-10 text-primary-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Pipeline Bloqueado</h2>
                                        <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-6">Organize suas vendas visualmente com o CRM Kanban. Disponível a partir do plano Pro.</p>
                                        <button onClick={() => setActiveTab('subscription')} className="w-full bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
                                            Liberar acesso agora
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={`flex justify-between items-center mb-6 transition-all duration-500 ${!hasCRMAccess ? 'blur-sm select-none pointer-events-none opacity-50' : ''}`}>
                            <div>
                                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">CRM Pipeline</h2>
                                <p className="text-zinc-500">Gerencie seus negócios e vendas.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                                    <input value={crmSearchQuery} onChange={e => setCrmSearchQuery(e.target.value)} placeholder="Buscar no CRM..." className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 text-sm w-64" />
                                </div>
                                <button onClick={() => setShowNewLeadModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all"><Plus className="w-4 h-4" /> Novo negócio</button>
                            </div>
                        </div>

                        <div className={`flex-1 overflow-hidden transition-all duration-500 ${!hasCRMAccess ? 'blur-sm select-none pointer-events-none opacity-60 grayscale-[0.3]' : ''}`}>
                            {crmLeads.length === 0 && hasCRMAccess ? (
                                <div className="flex flex-col items-center justify-center h-full bg-app-cardLight dark:bg-app-cardDark rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 m-4">
                                    <KanbanSquare className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4" />
                                    <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Seu pipeline está vazio</h3>
                                    <p className="text-zinc-500 max-w-md text-center mb-6">Adicione leads manualmente ou importe da busca para começar a gerenciar suas vendas.</p>
                                    <div className="flex gap-4">
                                        <button onClick={() => setActiveTab('search')} className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-colors">Ir para Busca</button>
                                        <button onClick={() => setShowNewLeadModal(true)} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">Adicionar manualmente</button>
                                    </div>
                                </div>
                            ) : (
                                <KanbanBoard
                                    leads={hasCRMAccess ? filteredCrmLeads : DEMO_LEADS}
                                    onStatusChange={handleCRMStatusChange}
                                    onDelete={(id) => setCrmLeads(prev => prev.filter(l => l.id !== id))}
                                    onUpdateLead={handleUpdateLead}
                                    onDuplicate={handleDuplicateLead}
                                    goal={userSettings.pipelineGoal}
                                    onSetGoal={(g) => setUserSettings(prev => ({ ...prev, pipelineGoal: g }))}
                                    resetDay={userSettings.pipelineResetDay}
                                    readOnly={!hasCRMAccess}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeTab === 'settings' && (
                    <div className="animate-fade-in-up max-w-3xl mx-auto pb-10">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">Configurações</h2>

                        {/* ... (Conteúdo da Tab Settings mantido igual) ... */}
                        <div className="bg-app-cardLight dark:bg-app-cardDark rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><User className="w-5 h-5 text-primary-500" /> Perfil</h3>
                            </div>
                            <div className="p-6 space-y-6 overflow-visible">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-500 mb-3">Avatar</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group p-1">
                                            {renderAvatar(userSettings, 'lg')}
                                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold m-1" onClick={() => fileInputRef.current?.click()}>Alterar</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setUserSettings(prev => ({ ...prev, avatarType: 'emoji' }))} className={`p-2 rounded-lg border ${userSettings.avatarType === 'emoji' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}><Smile className="w-5 h-5" /></button>
                                            <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-lg border ${userSettings.avatarType === 'image' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}><ImageIcon className="w-5 h-5" /></button>
                                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </div>
                                    </div>

                                    {/* Container fixo para evitar pulo de layout */}
                                    <div className="mt-4 h-16 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center px-2 transition-all">
                                        <div className="w-full h-full flex items-center gap-2 overflow-x-auto px-1 scrollbar-thin">
                                            {AVATAR_EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => setUserSettings(prev => ({ ...prev, avatar: emoji, avatarType: 'emoji' }))}
                                                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${userSettings.avatar === emoji && userSettings.avatarType === 'emoji' ? 'bg-primary-100 ring-2 ring-primary-500' : ''}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Seu nome</label>
                                        <div className="relative"><User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" /><input value={userSettings.name} onChange={e => setUserSettings(prev => ({ ...prev, name: e.target.value }))} className="w-full pl-10 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Seu e-mail</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                                            <input
                                                readOnly
                                                disabled
                                                value={userSettings.email}
                                                className="w-full pl-10 p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-not-allowed focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-app-cardLight dark:bg-app-cardDark rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-500" /> Preferências de busca</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Estado padrão</label>
                                    <select value={userSettings.defaultState} onChange={e => setUserSettings(prev => ({ ...prev, defaultState: e.target.value, defaultCity: '' }))} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white">
                                        <option value="">Selecione...</option>
                                        {BRAZIL_STATES.map(s => <option key={s.sigla} value={s.sigla}>{s.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Cidade padrão</label>
                                    <select value={userSettings.defaultCity} onChange={e => setUserSettings(prev => ({ ...prev, defaultCity: e.target.value }))} disabled={!userSettings.defaultState || isSettingsLoadingCities} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white disabled:opacity-50">
                                        <option value="">{isSettingsLoadingCities ? 'Carregando...' : 'Selecione...'}</option>
                                        {settingsCityList.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-app-cardLight dark:bg-app-cardDark rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Target className="w-5 h-5 text-primary-500" /> Metas e CRM</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Meta mensal (R$)</label>
                                    <div className="relative"><span className="absolute left-3 top-3.5 text-zinc-400 font-bold text-xs">R$</span><input type="number" value={userSettings.pipelineGoal} onChange={e => setUserSettings(prev => ({ ...prev, pipelineGoal: Number(e.target.value) }))} className="w-full pl-9 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Dia de fechamento</label>
                                    <div className="relative"><CalendarDays className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" /><select value={userSettings.pipelineResetDay} onChange={e => setUserSettings(prev => ({ ...prev, pipelineResetDay: Number(e.target.value) }))} className="w-full pl-10 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white">
                                        {[1, 5, 10, 15, 20, 25, 30].map(d => <option key={d} value={d}>Dia {d}</option>)}
                                    </select></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-app-cardLight dark:bg-app-cardDark rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Database className="w-5 h-5 text-danger-500" /> Gerenciamento de Dados</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <div>
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Histórico de Busca</h4>
                                        <p className="text-xs text-zinc-500 mt-1">Limpa a memória de empresas já visitadas pela IA.</p>
                                    </div>
                                    <button onClick={() => { if (confirm('Tem certeza? Isso fará com que empresas já vistas possam aparecer novamente.')) { setGlobalHistory([]); showNotification('Histórico limpo com sucesso!'); } }} disabled={globalHistory.length === 0} className="px-4 py-2 text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:text-danger-500 hover:border-danger-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        Limpar ({globalHistory.length})
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                    <div>
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Resetar CRM</h4>
                                        <p className="text-xs text-zinc-500 mt-1">Apaga todos os leads e recomeça do zero.</p>
                                    </div>
                                    <button onClick={() => { if (confirm('ATENÇÃO: Isso apagará TODOS os seus leads do CRM. Esta ação não pode ser desfeita.')) { setCrmLeads([]); showNotification('CRM resetado com sucesso!'); } }} disabled={crmLeads.length === 0} className="px-4 py-2 text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        Apagar Tudo ({crmLeads.length})
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-app-cardLight dark:bg-app-cardDark rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-primary-500" /> Suporte</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <div>
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Precisa de ajuda?</h4>
                                        <p className="text-xs text-zinc-500 mt-1">Entre em contato para suporte, dúvidas ou feedback.</p>
                                    </div>
                                    <a href="mailto:suporte@agenciabenck.com" className="px-4 py-2 text-xs font-bold bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm">
                                        suporte@agenciabenck.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button onClick={() => showNotification('Configurações salvas com sucesso!')} className="bg-success-600 hover:bg-success-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-success-500/20 transition-all active:scale-95 flex items-center gap-2"><Check className="w-5 h-5" /> Salvar tudo</button>
                        </div>
                    </div>
                )}
            </main>

            {/* --- MODAL DE NOVO EVENTO --- */}
            {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-fade-in-up overflow-hidden">
                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-primary-500" />
                                Novo Compromisso
                            </h3>
                            <button onClick={() => setShowEventModal(false)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X className="w-5 h-5 text-zinc-500" /></button>
                        </div>
                        <form onSubmit={handleAddEvent} className="p-6 space-y-4">
                            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center gap-3 border border-primary-100 dark:border-primary-800/50">
                                <div className="bg-white dark:bg-zinc-800 p-2 rounded-lg shadow-sm">
                                    <span className="block text-xs font-bold text-zinc-500 uppercase text-center">{selectedDateEvents?.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                    <span className="block text-xl font-black text-zinc-900 dark:text-white text-center leading-none">{selectedDateEvents?.getDate()}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-primary-700 dark:text-primary-300">Data selecionada</p>
                                    <p className="text-xs text-primary-600/80 dark:text-primary-400/80 capitalize">{selectedDateEvents?.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Título do evento</label>
                                <input autoFocus required value={newEventData.title} onChange={e => setNewEventData({ ...newEventData, title: e.target.value })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white outline-none transition-all" placeholder="Ex: Reunião com Cliente" />
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Horário</label>
                                <button type="button" onClick={() => setIsTimePickerOpen(!isTimePickerOpen)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-left flex justify-between items-center hover:border-primary-300 transition-colors">
                                    <span className="text-zinc-900 dark:text-white font-medium">{newEventData.time || '09:00'}</span>
                                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                                </button>
                                {isTimePickerOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl max-h-48 overflow-y-auto z-20 scrollbar-thin">
                                        {TIME_OPTIONS.map(time => (
                                            <button key={time} type="button" onClick={() => { setNewEventData({ ...newEventData, time }); setIsTimePickerOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm text-zinc-700 dark:text-zinc-200 transition-colors">
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Descrição (Opcional)</label>
                                <textarea value={newEventData.description} onChange={e => setNewEventData({ ...newEventData, description: e.target.value })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white outline-none transition-all resize-none h-24" placeholder="Detalhes do compromisso..."></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 py-3 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95">Agendar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL DE NOVO LEAD MANUAL --- */}
            {showNewLeadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-fade-in-up flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Plus className="w-6 h-6 text-primary-500 bg-primary-100 dark:bg-primary-900/30 rounded-lg p-1" />
                                    Novo Negócio
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1">Adicione um lead manualmente ao seu CRM.</p>
                            </div>
                            <button onClick={() => setShowNewLeadModal(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="w-5 h-5 text-zinc-500" /></button>
                        </div>
                        <form id="manual-lead-form" onSubmit={handleManualAddLead} className="p-6 space-y-5 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Nome da Empresa <span className="text-red-500">*</span></label>
                                <input name="name" required className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white outline-none transition-all placeholder:text-zinc-400" placeholder="Ex: Padaria do João" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Valor Potencial</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-zinc-400 font-bold text-xs">R$</span>
                                        <input
                                            value={newLeadValue}
                                            onChange={(e) => {
                                                const v = formatCurrency(e.target.value);
                                                setNewLeadValue(v);
                                            }}
                                            className="w-full pl-9 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white outline-none font-medium"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Telefone</label>
                                    <input
                                        value={newLeadPhone}
                                        maxLength={15}
                                        onChange={(e) => {
                                            const v = formatPhone(e.target.value);
                                            setNewLeadPhone(v);
                                        }}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white outline-none transition-all"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Cidade</label>
                                    <input name="city" className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white outline-none" placeholder="São Paulo" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">UF</label>
                                    <input name="uf" maxLength={2} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white outline-none uppercase" placeholder="SP" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Notas iniciais</label>
                                <textarea name="notes" rows={4} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white resize-none" placeholder="Detalhes do negócio..."></textarea>
                            </div>
                        </form>
                        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 rounded-b-2xl">
                            <button type="button" onClick={() => setShowNewLeadModal(false)} className="px-6 py-2.5 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors">Cancelar</button>
                            <button type="submit" form="manual-lead-form" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 flex items-center gap-2"><Plus className="w-4 h-4" /> Adicionar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL EXPORT SHEETS --- */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-fade-in-up overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Copy className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Dados copiados!</h3>
                            <p className="text-sm text-zinc-500 mb-6">
                                Os leads foram copiados para sua área de transferência. Agora basta abrir o Google Sheets e colar (Ctrl+V).
                            </p>

                            <div className="flex items-center justify-center gap-2 mb-6">
                                <input
                                    type="checkbox"
                                    id="dontShowAgain"
                                    checked={dontShowSheetsAgain}
                                    onChange={(e) => setDontShowSheetsAgain(e.target.checked)}
                                    className="rounded text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="dontShowAgain" className="text-xs text-zinc-500 cursor-pointer select-none">Não mostrar essa mensagem novamente</label>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">Fechar</button>
                                <button onClick={handleConfirmSheetsModal} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <ExternalLink className="w-4 h-4" /> Abrir Google Sheets
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;