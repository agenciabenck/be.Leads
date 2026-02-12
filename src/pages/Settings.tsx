import React from 'react';
import { User, Smile, Image as ImageIcon, Mail, MapPin, Target, CalendarDays, Database, LifeBuoy, Check } from 'lucide-react';
import { UserSettings } from '@/types/types';
import { AVATAR_EMOJIS, BRAZIL_STATES } from '@/constants/appConstants';

interface SettingsProps {
    userSettings: UserSettings;
    setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
    renderAvatar: (settings: UserSettings, size: 'sm' | 'md' | 'lg') => React.ReactNode;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isSettingsLoadingCities: boolean;
    settingsCityList: string[];
    globalHistory: string[];
    setGlobalHistory: React.Dispatch<React.SetStateAction<string[]>>;
    crmLeads: any[];
    setCrmLeads: React.Dispatch<React.SetStateAction<any[]>>;
    showNotification: (msg: string, type?: "success" | "error" | "info") => void;
}

const Settings: React.FC<SettingsProps> = ({
    userSettings,
    setUserSettings,
    renderAvatar,
    fileInputRef,
    handleImageUpload,
    isSettingsLoadingCities,
    settingsCityList,
    globalHistory,
    setGlobalHistory,
    crmLeads,
    setCrmLeads,
    showNotification
}) => {
    return (
        <div className="animate-fade-in-up max-w-3xl mx-auto pb-10">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8 tracking-tighter">Configurações</h2>

            <div className="bg-app-cardLight dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
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

            <div className="bg-app-cardLight dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
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

            <div className="bg-app-cardLight dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
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

            <div className="bg-app-cardLight dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Database className="w-5 h-5 text-red-500" /> Gerenciamento de dados</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <div>
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Histórico de Busca</h4>
                            <p className="text-xs text-zinc-500 mt-1">Limpa a memória de empresas já visitadas pela IA.</p>
                        </div>
                        <button onClick={() => { setGlobalHistory([]); }} disabled={globalHistory.length === 0} className="px-4 py-2 text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Limpar ({globalHistory.length})
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <div>
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Resetar CRM</h4>
                            <p className="text-xs text-zinc-500 mt-1">Apaga todos os leads e recomeça do zero.</p>
                        </div>
                        <button onClick={() => { setCrmLeads([]); }} disabled={crmLeads.length === 0} className="px-4 py-2 text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Apagar tudo ({crmLeads.length})
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-app-cardLight dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
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
                <button onClick={() => { }} className="bg-success-600 hover:bg-success-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-success-500/20 transition-all active:scale-95 flex items-center gap-2"><Check className="w-5 h-5" /> Salvar tudo</button>
            </div>
        </div>
    );
};

export default Settings;
