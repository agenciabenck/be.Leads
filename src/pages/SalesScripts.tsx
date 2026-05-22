
import React, { useState } from 'react';
import { SALES_SCRIPTS, ScriptCategory, ScriptItem } from '@/data/salesScripts';
import { Copy, Check, Search, Filter, Zap, ShieldAlert, CalendarClock, FileText, Sparkles, ExternalLink, Globe, Map, Flag } from 'lucide-react';

const iconMap: Record<string, any> = {
    Zap,
    ShieldAlert,
    CalendarClock,
    FileText,
    Globe,
    Map,
    Flag
};

export default function SalesScripts() {
    const [selectedCategory, setSelectedCategory] = useState<string>(SALES_SCRIPTS[0].id);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const activeCategory = SALES_SCRIPTS.find(c => c.id === selectedCategory);

    // Filter items based on search
    const filteredItems = activeCategory?.items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Scripts de alta conversão 🚀
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Copie e cole nossas estratégias validadas para vender mais.
                </p>
            </div>

            {/* Category Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-3 mb-8">
                {SALES_SCRIPTS.map((category) => {
                    const Icon = iconMap[category.iconName];
                    const isActive = selectedCategory === category.id;
                    return (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 px-3 py-4 md:px-6 md:py-3 rounded-xl transition-all duration-200 border text-center md:text-left
                                ${isActive
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                                    : 'bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800'
                                }`}
                        >
                            <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'} />
                            <span className="font-medium text-sm md:text-base leading-tight md:leading-normal">{category.title}</span>
                        </button>
                    );
                })}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-primary-50 dark:bg-primary-900/10 p-6 rounded-xl border border-primary-100 dark:border-primary-800 flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-primary-900 dark:text-primary-100 flex items-center gap-2 mb-2">
                            {activeCategory && React.createElement(iconMap[activeCategory.iconName], { size: 24 })}
                            {activeCategory?.title}
                        </h2>
                        <p className="text-primary-700 dark:text-primary-300 leading-relaxed mb-4">
                            {activeCategory?.description}
                        </p>
                    </div>

                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar script..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* AI Pro Tip */}
                <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Sparkles size={24} className="text-emerald-600 dark:text-emerald-400" />
                            Dica de Mestre: Multiplique seus resultados
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                            Gostou de um modelo? Copie o script e peça para a IA criar 5 variações para seu nicho.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-auto">
                        <a
                            href="https://chatgpt.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors"
                        >
                            ChatGPT <ExternalLink size={12} />
                        </a>
                        <a
                            href="https://gemini.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors border-l border-zinc-200 dark:border-zinc-700 pl-4"
                        >
                            Gemini <ExternalLink size={12} />
                        </a>
                        <a
                            href="https://claude.ai/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline transition-colors border-l border-zinc-200 dark:border-zinc-700 pl-4"
                        >
                            Claude <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
            </div>



            {/* Scripts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems?.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 flex flex-col group"
                    >
                        <div className="p-5 flex-1">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex flex-wrap gap-2">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                {item.description}
                            </p>

                            <div className="relative bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-line leading-relaxed">
                                    {item.content}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end">
                            <button
                                onClick={() => handleCopy(item.content, item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                    ${copiedId === item.id
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
                                    }`}
                            >
                                {copiedId === item.id ? (
                                    <>
                                        <Check size={16} />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} />
                                        Copiar script
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems?.length === 0 && (
                <div className="text-center py-12">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Search className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nenhum script encontrado
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Tente buscar por outros termos ou troque de categoria.
                    </p>
                </div>
            )}
        </div>
    );
}
