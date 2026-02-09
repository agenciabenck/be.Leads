import React from 'react';
import { Lock, Search as SearchIcon, Plus, KanbanSquare } from 'lucide-react';
import { CRMLead, CRMStatus, AppTab } from '@/types/types';
import { KanbanBoard } from '@/components/KanbanBoard';
import { DEMO_LEADS } from '@/constants/appConstants';

interface CRMProps {
    hasCRMAccess: boolean;
    setActiveTab: (tab: AppTab) => void;
    crmSearchQuery: string;
    setCrmSearchQuery: (query: string) => void;
    setShowNewLeadModal: (show: boolean) => void;
    crmLeads: CRMLead[];
    filteredCrmLeads: CRMLead[];
    handleCRMStatusChange: (leadId: string, newStatus: CRMStatus) => void;
    handleUpdateLead: (leadId: string, updates: Partial<CRMLead>) => void;
    handleDuplicateLead: (lead: CRMLead) => void;
    pipelineGoal: number;
    setPipelineGoal: (goal: number) => void;
    pipelineResetDay: number;
    setCrmLeads: React.Dispatch<React.SetStateAction<CRMLead[]>>;
}

const CRM: React.FC<CRMProps> = ({
    hasCRMAccess,
    setActiveTab,
    crmSearchQuery,
    setCrmSearchQuery,
    setShowNewLeadModal,
    crmLeads,
    filteredCrmLeads,
    handleCRMStatusChange,
    handleUpdateLead,
    handleDuplicateLead,
    pipelineGoal,
    setPipelineGoal,
    pipelineResetDay,
    setCrmLeads
}) => {
    return (
        <div className="animate-fade-in-up h-full flex flex-col relative">

            {/* Lock Overlay if no access */}
            {!hasCRMAccess && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4">
                    <div className="flex flex-col items-center gap-4 bg-white/90 dark:bg-black/80 backdrop-blur-md p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center max-w-md">
                        <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full shadow-inner">
                            <Lock className="w-10 h-10 text-primary-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Pipeline Bloqueado</h2>
                            <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-6">Organize suas vendas visualmente com o CRM Kanban. Disponível a partir do plano Pro.</p>
                            <button onClick={() => setActiveTab('subscription')} className="w-full bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
                                Liberar acesso agora
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex justify-between items-center mb-6 transition-all duration-500 ${!hasCRMAccess ? 'blur-sm select-none pointer-events-none opacity-50' : ''}`}>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">CRM Pipeline</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">Gerencie seus negócios e vendas.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                        <input value={crmSearchQuery} onChange={e => setCrmSearchQuery(e.target.value)} placeholder="Buscar no CRM..." className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 text-sm w-64" />
                    </div>
                    <button onClick={() => setShowNewLeadModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all"><Plus className="w-4 h-4" /> Novo negócio</button>
                </div>
            </div>

            <div className={`flex-1 overflow-hidden transition-all duration-500 ${!hasCRMAccess ? 'blur-sm select-none pointer-events-none opacity-60 grayscale-[0.3]' : ''}`}>
                {crmLeads.length === 0 && hasCRMAccess ? (
                    <div className="flex flex-col items-center justify-center h-full bg-app-cardLight dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 m-4">
                        <KanbanSquare className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4" />
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Seu pipeline está vazio</h3>
                        <p className="text-zinc-500 max-w-md text-center mb-6">Adicione leads manualmente ou importe da busca para começar a gerenciar suas vendas.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveTab('search')} className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-colors">Ir para Busca</button>
                            <button onClick={() => setShowNewLeadModal(true)} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">Adicionar manualmente</button>
                        </div>
                    </div>
                ) : (
                    <KanbanBoard
                        leads={hasCRMAccess ? filteredCrmLeads : (DEMO_LEADS as CRMLead[])}
                        onStatusChange={handleCRMStatusChange}
                        onDelete={(id) => setCrmLeads(prev => prev.filter(l => l.id !== id))}
                        onUpdateLead={handleUpdateLead}
                        onDuplicate={handleDuplicateLead}
                        goal={pipelineGoal}
                        onSetGoal={setPipelineGoal}
                        resetDay={pipelineResetDay}
                        readOnly={!hasCRMAccess}
                    />
                )}
            </div>
        </div>
    );
};

export default CRM;
