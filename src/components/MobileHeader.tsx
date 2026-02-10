import React from 'react';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
    setIsSidebarOpen: (open: boolean) => void;
    isSidebarOpen: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ setIsSidebarOpen, isSidebarOpen }) => {
    return (
        <div className="md:hidden mb-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                <img src="https://i.postimg.cc/0jF5PGV8/logo-beleads-h1-1.png" alt="be.leads" className="h-8 w-auto object-contain" />
            </div>
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 bg-app-cardLight dark:bg-app-cardDark rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700"
            >
                <Menu className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
            </button>
        </div>
    );
};

export default MobileHeader;
