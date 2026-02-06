import React from 'react';
import {
    Shield, Trophy, Lock, User, Calendar as CalendarIcon,
    ChevronLeft, ChevronRight, Clock, Trash2, Search as SearchIcon,
    Sparkles, ArrowRight, Target, KanbanSquare
} from 'lucide-react';
import { UserSettings, CalendarEvent, CRMLead, AppTab } from '@/types/types';

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
}

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
    selectedDateEvents,
    todayStr,
    upcomingEvents,
    tomorrowStr,
    setCalendarEvents
}) => {
    return (
        <div className="animate-fade-in-up space-y-8">
            {/* Header */}
            <header className="flex flex-col gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        {renderAvatar(userSettings, 'sm')}
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Olá, {userSettings.name.split(' ')[0]}!</h1>
                    </div>
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
                                <button onClick={() => setActiveTab('subscription')} className="w-full mt-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 py-2 rounded-lg transition-colors shadow-sm shadow-green-500/20">
                                    Fazer upgrade
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card 2: Ganho Mensal */}
                <div className="bg-app-cardLight dark:bg-app-cardDark p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-20">
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ganho mensal</p>
                        <div className="p-2 bg-green-50 dark:bg-green-700/20 rounded-xl text-green-600 dark:text-green-400">
                            <Trophy className="w-5 h-5" />
                        </div>
                    </div>

                    <div className={`flex-1 flex flex-col justify-between relative z-10 transition-all ${!hasCRMAccess ? 'blur-sm opacity-50 select-none' : ''}`}>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                            R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="mt-4">
                            <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="text-zinc-400">Meta: {userSettings.pipelineGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                <span className="font-bold text-green-600 dark:text-green-400">{Math.round(Math.min((monthlyRevenue / userSettings.pipelineGoal) * 100, 100))}%</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-green-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min((monthlyRevenue / userSettings.pipelineGoal) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

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
                    <div className="flex justify-between items-start mb-4 relative z-20">
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Leads no CRM</p>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                            <User className="w-5 h-5" />
                        </div>
                    </div>

                    <div className={`flex-1 flex flex-col justify-between relative z-10 transition-all ${!hasCRMAccess ? 'blur-sm opacity-50 select-none' : ''}`}>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{crmLeads.length}</p>
                        <div className="mt-4">
                            <p className="text-xs text-zinc-400">Gerencie seu funil de vendas</p>
                        </div>
                    </div>

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
                            const isToday = dateStr === todayStr;
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
                                        <button onClick={() => setCalendarEvents(prev => prev.filter(e => e.id !== evt.id))} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
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
                <button onClick={() => setActiveTab('crm')} className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-left shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500"><Target className="w-32 h-32 text-white" /></div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-white/10"><KanbanSquare className="w-6 h-6 text-white" /></div>
                        <h3 className="text-2xl font-bold text-white mb-1">Acessar CRM</h3>
                        <p className="text-green-100 text-sm mb-4">Gerencie seu pipeline de vendas.</p>
                        <div className="inline-flex items-center gap-2 text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-lg group-hover:bg-white group-hover:text-green-600 transition-colors">Ver pipeline <ArrowRight className="w-4 h-4" /></div>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Home;
