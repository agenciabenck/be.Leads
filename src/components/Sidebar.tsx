import { Home, Search as SearchIcon, KanbanSquare, Wallet, Settings, LogOut } from 'lucide-react';
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
    handleLogout,
    renderAvatar
}) => {
    return (
        <aside className={`flex-shrink-0 h-full w-64 bg-sidebar text-text-light flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-ml-64'} z-50 rounded-tr-[40px] overflow-hidden font-sans`}>
            {/* Logo Section */}
            <div className="pt-10 pb-8 px-6 flex flex-col items-center">
                <img src="https://i.postimg.cc/0jF5PGV8/logo-beleads-h1-1.png" alt="be.leads" className="h-10 w-auto object-contain mb-2" />
                <span className="text-[11px] font-medium text-text-secondary">Criado por Agência Benck</span>
                <div className="w-full h-[1px] bg-white/10 mt-8"></div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-[15px] ${activeTab === item.id ? 'bg-primary text-white font-bold' : 'text-text-secondary hover:text-text-light font-medium'}`}
                    >
                        <item.icon className="w-5 h-5" /> {item.label}
                    </button>
                ))}
            </nav>

            {/* Plan Card */}
            <div className="mx-4 mb-8 p-4 bg-sidebar-plan rounded-3xl">
                <div className="mb-3">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">SEU PLANO</span>
                    <h4 className="text-xl font-bold text-text-light mt-1 capitalize">{PLAN.name}</h4>
                </div>

                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">CRÉDITOS</span>
                    <span className="text-xs font-bold text-text-light">{USED_CREDITS} / {MAX_CREDITS}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-3">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${PLAN_PERCENTAGE}%` }}
                    />
                </div>

                {userSettings.plan === 'elite' ? (
                    <div className="w-full py-3 text-[13px] font-bold rounded-2xl bg-success/20 text-success flex items-center justify-center gap-2 border border-success/30 cursor-default">
                        Você está no topo! 👑
                    </div>
                ) : (
                    <button
                        onClick={() => setActiveTab('subscription')}
                        className="w-full py-3 text-[13px] font-bold rounded-2xl bg-success hover:bg-success-600 text-white transition-all active:scale-[0.98] shadow-lg shadow-success/20"
                    >
                        Fazer upgrade de plano
                    </button>
                )}
            </div>

            {/* User Section */}
            <div className="px-6 py-4 mb-2">
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab('settings')}>
                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {renderAvatar(userSettings, 'md')}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[15px] font-bold text-text-light">{userSettings.name || 'Usuário'}</p>
                        <p className="text-[12px] font-medium text-text-secondary">Ver configurações</p>
                    </div>
                </div>
            </div>

            {/* Logout Footer */}
            <div className="bg-black py-4 px-6 flex items-center justify-center">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-[16px] font-bold text-text-light hover:text-white transition-colors group"
                >
                    Sair da conta
                    <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-400" />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
