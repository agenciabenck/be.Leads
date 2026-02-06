import React from 'react';
import { Home, Search as SearchIcon, KanbanSquare, Wallet, Settings, Shield, Check, RotateCcw } from 'lucide-react';
import { AppTab, UserSettings } from '@/types/types';

interface SidebarProps {
    isSidebarOpen: boolean;
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
    PLAN: { name: string };
    USED_CREDITS: number;
    MAX_CREDITS: number;
    PLAN_PERCENTAGE: number;
    userSettings: UserSettings;
    setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
    theme: 'light' | 'dark';
    handleLogout: () => void;
    renderAvatar: (settings: UserSettings, size: 'sm' | 'md' | 'lg') => React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({
    isSidebarOpen,
    activeTab,
    setActiveTab,
    PLAN,
    USED_CREDITS,
    MAX_CREDITS,
    PLAN_PERCENTAGE,
    userSettings,
    setTheme,
    theme,
    handleLogout,
    renderAvatar
}) => {
    return (
        <aside className={`flex-shrink-0 h-full w-60 bg-sidebar text-white flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-ml-60'} z-50 border-r border-white/5`}>
            <div className="h-16 flex items-center px-4 border-b border-white/5 bg-sidebar shrink-0">
                <img src="https://i.postimg.cc/0jF5PGV8/logo-beleads-h1-1.png" alt="be.leads" className="h-7 w-auto object-contain" />
            </div>

            <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                {[
                    { id: 'home', icon: Home, label: 'Início' },
                    { id: 'search', icon: SearchIcon, label: 'Buscar leads' },
                    { id: 'crm', icon: KanbanSquare, label: 'CRM' },
                    { id: 'subscription', icon: Wallet, label: 'Assinatura' },
                    { id: 'settings', icon: Settings, label: 'Configurações' }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as AppTab)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${activeTab === item.id ? 'bg-primary-500 shadow-md shadow-black/20 text-white font-bold' : 'hover:bg-white/5 text-slate-400 hover:text-white font-medium'}`}
                    >
                        <item.icon className="w-4 h-4" /> {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-3 bg-black/20 m-2 rounded-lg border border-white/5 shrink-0">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Seu Plano</span>
                        <span className="text-xs font-bold text-white capitalize">{PLAN.name}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Créditos</span>
                    <span className="text-[10px] font-bold text-white">{USED_CREDITS}/{MAX_CREDITS}</span>
                </div>
                <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary-500 h-full transition-all duration-500" style={{ width: `${PLAN_PERCENTAGE}%` }}></div>
                </div>
                {userSettings.plan === 'elite' ? (
                    <div className="mt-2 text-center">
                        <span className="text-[10px] font-bold text-green-400 flex items-center justify-center gap-1 animate-pulse"><Check className="w-3 h-3" /> Limite Máximo</span>
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
                    <button onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} className="text-slate-400 hover:text-white transition-colors">
                        {theme === 'light' ? <span className="text-xs">🌙</span> : <span className="text-xs">☀️</span>}
                    </button>
                </div>
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
    );
};

export default Sidebar;
