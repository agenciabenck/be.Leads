import React, { useState } from 'react';
import { Home, Search, KanbanSquare, Handshake, Menu, Wallet, Settings, LogOut, X, Zap } from 'lucide-react';
import { AppTab } from '@/types/types';

interface MobileNavBarProps {
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
    handleLogout: () => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, setActiveTab, handleLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { id: 'home', icon: Home, label: 'Início' },
        { id: 'search', icon: Search, label: 'Buscar' },
        { id: 'crm', icon: KanbanSquare, label: 'CRM' },
        { id: 'extras', icon: Zap, label: 'Material de apoio' },
        { id: 'affiliates', icon: Handshake, label: 'Parceiros' },
    ];

    return (
        <>
            {/* Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-50 h-[90px] pb-5 pt-3 px-6 flex items-start justify-between">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id as AppTab);
                                setIsMenuOpen(false);
                            }}
                            className={`flex flex-col items-center gap-1 min-w-[60px] transition-all duration-300 ${isActive
                                ? 'text-white transform -translate-y-1'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <div className={`p-2 rounded-2xl transition-all ${isActive
                                ? 'bg-primary shadow-lg shadow-primary/30 text-white'
                                : 'bg-transparent'
                                }`}>
                                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                            </div>
                            <span className={`text-[10px] font-medium transition-opacity duration-300 ${isActive ? 'opacity-100 font-bold' : 'opacity-70'
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                {/* More / Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={`flex flex-col items-center gap-1 min-w-[60px] text-slate-400 hover:text-white transition-all active:scale-90`}
                >
                    <div className="p-2 rounded-2xl bg-transparent">
                        <Menu className="w-6 h-6 stroke-2" />
                    </div>
                    <span className="text-[10px] font-medium opacity-70">
                        Menu
                    </span>
                </button>
            </div>

            {/* Menu Drawer / Modal */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 rounded-t-[32px] p-6 pb-24 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom duration-300 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Menu</h3>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => { setActiveTab('subscription'); setIsMenuOpen(false); }}
                                className="w-full flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl transition-transform active:scale-[0.98]"
                            >
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-zinc-900 dark:text-white">Assinatura</p>
                                    <p className="text-xs text-zinc-500">Gerenciar plano e pagamentos</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }}
                                className="w-full flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl transition-transform active:scale-[0.98]"
                            >
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-zinc-900 dark:text-white">Configurações</p>
                                    <p className="text-xs text-zinc-500">Dados da conta e preferências</p>
                                </div>
                            </button>

                            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl transition-transform active:scale-[0.98] group"
                            >
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl text-red-600 group-hover:text-red-700">
                                    <LogOut className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-red-600 group-hover:text-red-700">Sair da conta</p>
                                    <p className="text-xs text-red-400">Encerrar sessão atual</p>
                                </div>
                            </button>
                        </div>
                    </div>
                    {/* Click backdrop to close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setIsMenuOpen(false)} />
                </div>
            )}
        </>
    );
};

export default MobileNavBar;
