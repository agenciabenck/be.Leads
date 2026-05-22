import React from 'react';
import { Sun, Moon, BadgeCheck } from 'lucide-react';
import { UserSettings } from '@/types/types';

interface MobileHeaderProps {
    userSettings: UserSettings;
    renderAvatar: (settings: UserSettings, size: 'sm' | 'md' | 'lg') => React.ReactNode;
    setActiveTab: (tab: any) => void;
    theme: 'light' | 'dark';
    setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
    userSettings,
    renderAvatar,
    setActiveTab,
    theme,
    setTheme
}) => {
    return (
        <header className="md:hidden fixed top-0 left-0 right-0 bg-sidebar shadow-lg z-40 px-4 h-20 flex items-center justify-between transition-all duration-300">
            {/* Logo */}
            <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setActiveTab('home')}
            >
                <img
                    src="/beleadly_logo_h1.png"
                    alt="beleadly"
                    className="h-8 w-auto object-contain"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                    {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Plan Badge */}
                {(userSettings.plan === 'elite' || userSettings.plan === 'pro') ? (
                    <div
                        onClick={() => setActiveTab('subscription')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg border border-white/10 cursor-pointer transition-colors"
                    >
                        <span>{userSettings.plan === 'elite' ? 'ELITE' : 'PRO'}</span>
                        <BadgeCheck className="w-3.5 h-3.5 text-green-400" />
                    </div>
                ) : (
                    <button
                        onClick={() => setActiveTab('subscription')}
                        className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg shadow-sm hover:opacity-90"
                    >
                        Upgrade
                    </button>
                )}

                {/* Avatar */}
                <div
                    onClick={() => setActiveTab('settings')}
                    className="cursor-pointer ml-1"
                >
                    {renderAvatar(userSettings, 'sm')}
                </div>
            </div>
        </header>
    );
};

export default MobileHeader;
