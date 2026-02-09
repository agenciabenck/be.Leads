import React, { useState } from 'react';
import {
    Shield, Lock, Calendar as CalendarIcon,
    ChevronLeft, ChevronRight, Clock, Search as SearchIcon,
    ArrowRight, ListTodo, TrendingUp, Crown, Share2, Sun, Moon, DollarSign, Users,
    LayoutList, Trash2, X, Gift, UserPlus, Zap, Edit3, Copy, MessageCircle, Mail
} from 'lucide-react';
import { UserSettings, CalendarEvent, CRMLead, AppTab } from '@/types/types';
import { PLAN_HIERARCHY } from '@/constants/appConstants';

interface HomeProps {
    userSettings: UserSettings;
    dailyQuote: string;
    renderAvatar: (settings: UserSettings, size: 'sm' | 'md' | 'lg') => React.ReactNode;
    PLAN: { name: string };
    USED_CREDITS: number;
    MAX_CREDITS: number;
    PLAN_PERCENTAGE: number;
    setActiveTab: (tab: AppTab) => void;
    monthlyRevenue: number;
    hasCRMAccess: boolean;
    crmLeads: CRMLead[];
    currentCalendarDate: Date;
    setCurrentCalendarDate: React.Dispatch<React.SetStateAction<Date>>;
    getFirstDayOfMonth: (date: Date) => number;
    getDaysInMonth: (date: Date) => number;
    openAddEventModal: (date: Date) => void;
    calendarEvents: CalendarEvent[];
    selectedDateEvents: Date | null;
    todayStr: string;
    upcomingEvents: CalendarEvent[];
    tomorrowStr: string;
    setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
    theme: 'light' | 'dark';
    setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}

const motivationalQuotes = [
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "Acredite que você pode e você já está no meio do caminho.",
    "A persistência é o caminho do êxito.",
    "Não espere por oportunidades, crie-as.",
    "O seu único limite é a sua mente.",
    "Grandes jornadas começam com um único passo.",
    "Foque no progresso, não na perfeição."
];

const Home: React.FC<HomeProps> = ({
    userSettings,
    dailyQuote,
    renderAvatar,
    PLAN,
    USED_CREDITS,
    MAX_CREDITS,
    PLAN_PERCENTAGE,
    setActiveTab,
    monthlyRevenue,
    hasCRMAccess,
    crmLeads,
    currentCalendarDate,
    setCurrentCalendarDate,
    getFirstDayOfMonth,
    getDaysInMonth,
    openAddEventModal,
    calendarEvents,
    todayStr,
    tomorrowStr,
    setCalendarEvents,
    theme,
    setTheme
}) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Determine daily quote
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const quote = motivationalQuotes[dayOfYear % motivationalQuotes.length];

    return (
        <div className="font-sans relative">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10">
                {/* Header */}
                <header className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                            Olá, {userSettings.name || 'Usuário'}!
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {quote}
                        </p>
                    </div>
                    <div className="flex items-center gap-6 mt-4">
                        <button
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className="flex items-center gap-3 group"
                        >
                            <span className="text-[13px] font-medium text-text-secondary">
                                {theme === 'light' ? 'Modo light ativo.' : 'Modo dark ativo.'}
                            </span>
                            <div className="w-10 h-10 bg-zinc-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-white/10 transition-all border dark:border-white/5">
                                {theme === 'light' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('subscription')}
                            className="flex items-center gap-3 px-6 py-3.5 bg-primary hover:opacity-90 text-white text-[15px] font-bold rounded-2xl transition-all shadow-lg shadow-primary/20"
                        >
                            Fazer upgrade de plano
                            <Crown className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {/* Card 1: Status do seu plano */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center ring-1 ring-zinc-100/50 dark:ring-white/10">
                                <Shield className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                            </div>
                            <h3 className="text-base font-bold text-zinc-800 dark:text-white tracking-tight">Status do seu plano</h3>
                        </div>

                        <div className="mt-auto">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-[10px] font-bold text-text-secondary dark:text-zinc-500 uppercase tracking-widest">CRÉDITOS</span>
                                <span className="text-[12px] font-bold text-text-secondary dark:text-zinc-400">{USED_CREDITS} / {MAX_CREDITS}</span>
                            </div>
                            <div className="w-full bg-zinc-900 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-primary h-full transition-all duration-700 rounded-full" style={{ width: `${PLAN_PERCENTAGE}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Leads no CRM */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-sm border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center ring-1 ring-zinc-100/50 dark:ring-white/10">
                                <Users className={`w-5 h-5 ${hasCRMAccess ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-300 dark:text-zinc-600'}`} />
                            </div>
                            <h3 className={`text-base font-bold tracking-tight ${hasCRMAccess ? 'text-zinc-800 dark:text-white' : 'text-text-secondary dark:text-zinc-500'}`}>Leads no CRM</h3>
                        </div>

                        {hasCRMAccess ? (
                            <div className="flex items-baseline gap-2 mt-auto">
                                <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                                    {crmLeads.length}
                                </span>
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">leads ativos</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-10 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800 shadow-sm">
                                        <Lock className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                                    </div>
                                    <p className="text-[10px] font-bold text-text-secondary dark:text-zinc-500 leading-tight max-w-[90px]">Disponível a partir <br />do plano Pro.</p>
                                </div>
                                <button onClick={() => setActiveTab('subscription')} className="px-8 py-3.5 bg-primary text-white text-[15px] font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90">
                                    Liberar acesso
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Card 3: Ganho mensal */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-sm border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center ring-1 ring-zinc-100/50 dark:ring-white/10">
                                <DollarSign className={`w-5 h-5 ${hasCRMAccess ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-300 dark:text-zinc-600'}`} />
                            </div>
                            <h3 className={`text-base font-bold tracking-tight ${hasCRMAccess ? 'text-zinc-800 dark:text-white' : 'text-text-secondary dark:text-zinc-500'}`}>Ganho mensal</h3>
                        </div>

                        {hasCRMAccess ? (
                            <div className="flex flex-col gap-1 mt-auto">
                                <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                                    R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">neste mês</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-10 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800 shadow-sm">
                                        <Lock className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                                    </div>
                                    <p className="text-[10px] font-bold text-text-secondary dark:text-zinc-500 leading-tight max-w-[90px]">Disponível a partir <br />do plano Pro.</p>
                                </div>
                                <button onClick={() => setActiveTab('subscription')} className="px-8 py-3.5 bg-primary text-white text-[15px] font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90">
                                    Liberar acesso
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dynamic Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    {/* Calendar / Agenda */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col h-[340px]">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                                    <CalendarIcon className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                                </div>
                                <div>
                                    <h3 className="text-[20px] font-bold text-zinc-900 dark:text-white tracking-tight">Agenda</h3>
                                    <p className="text-[10px] font-medium text-text-secondary dark:text-zinc-500 -mt-1">(Clique no dia para agendar)</p>
                                </div>
                            </div>
                            <div className="flex bg-zinc-100/80 dark:bg-white/5 p-1.5 rounded-full gap-1 items-center border dark:border-white/5">
                                <button
                                    onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1))}
                                    className="p-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="px-4 text-[13px] font-bold text-zinc-800 dark:text-zinc-200 capitalize min-w-[100px] text-center">
                                    {currentCalendarDate.toLocaleString('pt-BR', { month: 'long' })}
                                </div>
                                <button
                                    onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1))}
                                    className="p-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="grid grid-cols-7 gap-y-1">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                    <div key={`wk-${i}`} className="text-center text-[12px] font-bold text-blue-200/80 dark:text-primary/40 mb-2">{d}</div>
                                ))}

                                {Array.from({ length: getFirstDayOfMonth(currentCalendarDate) }).map((_, i) => <div key={`empty-${i}`} className="h-8" />)}

                                {Array.from({ length: getDaysInMonth(currentCalendarDate) }).map((_, i) => {
                                    const day = i + 1;
                                    const d = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
                                    const dateStr = d.toISOString().split('T')[0];
                                    const hasEvents = calendarEvents.some(e => e.date === dateStr);
                                    const isToday = day === new Date().getDate() &&
                                        currentCalendarDate.getMonth() === new Date().getMonth() &&
                                        currentCalendarDate.getFullYear() === new Date().getFullYear();

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => openAddEventModal(d)}
                                            className={`relative w-9 h-8 mx-auto flex items-center justify-center text-[14px] font-bold rounded-lg transition-all
                                            ${isToday ? 'bg-primary/15 dark:bg-primary/20 text-zinc-900 dark:text-white' : 'text-zinc-900 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'}
                                        `}
                                        >
                                            {day}
                                            {hasEvents && (
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-white dark:ring-zinc-900" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Tasks */}
                    <div className="bg-sidebar rounded-[40px] p-6 shadow-lg flex flex-col h-[340px]">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center ring-1 ring-white/10">
                                    <Edit3 className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-[20px] font-bold text-white tracking-tight">Próximas tarefas</h3>
                            </div>
                            {calendarEvents.length > 0 && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white flex items-center justify-center group"
                                    title="Excluir todos os compromissos"
                                >
                                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col px-1 min-h-0">
                            {calendarEvents.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-700">
                                    <div className="w-16 h-16 bg-white/5 rounded-[20px] flex items-center justify-center mx-auto mb-4 border border-white/10">
                                        <LayoutList className="w-8 h-8 text-white/20" />
                                    </div>
                                    <h4 className="text-[18px] font-bold text-white">Nada por aqui</h4>
                                    <p className="text-[13px] text-white/40 font-medium max-w-[180px] leading-relaxed">
                                        Você não tem compromissos agendados para este período.
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full space-y-3 overflow-y-auto scrollbar-none pb-4">
                                    {calendarEvents
                                        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                                        .map((evt) => {
                                            const isToday = evt.date === todayStr;
                                            const isTomorrow = evt.date === tomorrowStr;
                                            const [y, m, d] = evt.date.split('-');

                                            return (
                                                <div
                                                    key={evt.id}
                                                    className="flex items-center gap-4 p-4 rounded-full transition-all group border border-white/5 bg-white/[0.03] hover:bg-white/[0.08]"
                                                >
                                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                                                        <span className="text-white text-[14px] font-bold">{d}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white text-[14px] font-bold truncate group-hover:text-primary transition-colors">{evt.title}</h4>
                                                        <div className="flex items-center gap-3 mt-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-3.5 h-3.5 bg-primary/20 rounded-full flex items-center justify-center">
                                                                    <Clock className="w-2.5 h-2.5 text-primary" />
                                                                </div>
                                                                <span className="text-white/40 text-[11px] font-bold tracking-tight uppercase">{evt.time}</span>
                                                            </div>
                                                            <div className="w-1 h-1 rounded-full bg-white/20" />
                                                            <span className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? 'text-primary' : isTomorrow ? 'text-amber-400' : 'text-white/30'}`}>
                                                                {isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : `${d}/${m}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setCalendarEvents(prev => prev.filter(e => e.id !== evt.id));
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full transition-all text-white/20 hover:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Lead Search Action */}
                    <button onClick={() => setActiveTab('search')} className="group flex items-center gap-5 p-6 bg-primary rounded-[32px] text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                            <SearchIcon className="w-7 h-7" />
                        </div>
                        <div className="text-left">
                            <h4 className="text-[18px] font-bold mb-1">Buscar novos leads</h4>
                            <p className="text-[11px] text-white/60 font-medium leading-normal">
                                Encontre clientes ideais em segundos usando nossa IA de busca avançada por nicho e região.
                            </p>
                        </div>
                    </button>

                    {/* CRM Action */}
                    <button onClick={() => setActiveTab('crm')} className="group flex items-center gap-5 p-6 bg-[#079160] rounded-[32px] text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-success/20">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                            <ListTodo className="w-7 h-7" />
                        </div>
                        <div className="text-left">
                            <h4 className="text-[18px] font-bold mb-1">Gerenciar CRM</h4>
                            <p className="text-[11px] text-white/60 font-medium leading-normal">
                                Acompanhe todo o seu funil de vendas e organize seus leads sem perder nenhuma oportunidade.
                            </p>
                        </div>
                    </button>

                    {/* Share Action */}
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="group flex items-center gap-5 p-6 bg-white dark:bg-zinc-900 rounded-[32px] text-zinc-900 dark:text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg border border-zinc-100 dark:border-zinc-800"
                    >
                        <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                            <Share2 className="w-7 h-7 dark:text-zinc-100" />
                        </div>
                        <div className="text-left">
                            <h4 className="text-[18px] font-bold mb-1 dark:text-white">Compartilhe com amigos</h4>
                            <p className="text-[11px] text-text-secondary dark:text-zinc-500 font-medium leading-normal">
                                Ajude outros empreendedores a descobrir essa ferramenta e facilite a busca por novos clientes.
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowShareModal(false)}
                    />
                    <div className="relative bg-white dark:bg-zinc-900 rounded-[40px] w-full max-w-lg shadow-2xl p-8 md:p-10 animate-in zoom-in-95 fade-in duration-300 border dark:border-zinc-800">
                        <button
                            onClick={() => setShowShareModal(false)}
                            className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-zinc-900"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mb-6">
                                <Share2 className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-[28px] font-bold text-zinc-900 dark:text-white mb-2">Compartilhe essa ferramenta!</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-8 max-w-md">
                                Ajude outros empreendedores a encontrar clientes de forma mais eficiente. Compartilhe o be.Leads com seus amigos e colegas!
                            </p>

                            <div className="w-full space-y-3 mb-8">
                                <button
                                    onClick={() => {
                                        const text = '🚀 Descobri o be.Leads - uma ferramenta incrível para encontrar leads qualificados! Confira: https://beleads.com.br';
                                        navigator.clipboard.writeText(text);
                                        alert('Mensagem copiada! Cole no WhatsApp, e-mail ou redes sociais.');
                                    }}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Copy className="w-5 h-5" />
                                    Copiar mensagem para compartilhar
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            const text = encodeURIComponent('🚀 Descobri o be.Leads - uma ferramenta incrível para encontrar leads qualificados! Confira: https://beleads.com.br');
                                            window.open(`https://wa.me/?text=${text}`, '_blank');
                                        }}
                                        className="py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        WhatsApp
                                    </button>

                                    <button
                                        onClick={() => {
                                            const subject = encodeURIComponent('Ferramenta incrível para encontrar leads');
                                            const body = encodeURIComponent('Olá!\n\nDescobrí o be.Leads, uma ferramenta que ajuda a encontrar leads qualificados de forma rápida e eficiente.\n\nConfira: https://beleads.com.br\n\nAcho que pode ser útil para você!');
                                            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                                        }}
                                        className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Mail className="w-4 h-4" />
                                        E-mail
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                Obrigado por ajudar a divulgar nossa ferramenta! 💙
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Deletion Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setShowDeleteConfirm(false)}
                    />
                    <div className="relative bg-white dark:bg-zinc-900 rounded-[40px] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 fade-in duration-400 border dark:border-zinc-800">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-red-100 dark:ring-red-900/30">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-[22px] font-bold text-zinc-900 dark:text-white mb-3">Limpar agenda?</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-[15px] mb-8 leading-relaxed">
                                Tem certeza? Ao confirmar você vai apagar todos os itens da sua agenda permanentemente.
                            </p>

                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={() => {
                                        setCalendarEvents([]);
                                        setShowDeleteConfirm(false);
                                    }}
                                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
                                >
                                    Sim, apagar tudo
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full py-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 font-bold rounded-2xl transition-all active:scale-[0.98]"
                                >
                                    Não, manter itens
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
