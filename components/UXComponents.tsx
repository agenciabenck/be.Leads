import React from 'react';
import { Search, Inbox, Calendar as CalendarIcon, History } from 'lucide-react';

interface EmptyStateProps {
    icon: 'search' | 'inbox' | 'calendar' | 'history';
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const ICONS = {
    search: Search,
    inbox: Inbox,
    calendar: CalendarIcon,
    history: History
};

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
    const Icon = ICONS[icon];

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-6 mb-4">
                <Icon className="w-12 h-12 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
                {description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 shadow-lg shadow-primary-500/20"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export const SkeletonCard: React.FC = () => (
    <div className="bg-app-cardLight dark:bg-app-cardDark p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-pulse">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
            <div className="flex-1">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
            </div>
        </div>
    </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);
