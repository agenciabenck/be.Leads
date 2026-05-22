import React, { useState, useMemo } from 'react';
import { Lock, Search as SearchIcon, Plus, KanbanSquare, Bell } from 'lucide-react';
import { CRMLead, CRMStatus, AppTab, UserPlan } from '@/types/types';
import { KanbanBoard } from '@/components/KanbanBoard';
import { CRMDashboard } from '@/components/crm/CRMDashboard';
import { DEMO_LEADS } from '@/constants/appConstants';

interface CRMProps {
    hasCRMAccess: boolean;
    hasDashboardAccess?: boolean;
    hasExportExcelAccess?: boolean;
    hasExportSheetsAccess?: boolean;
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
    handleDeleteLead: (id: string) => void;
    onEnrichLead?: (leadId: string) => void;
    enrichingLeadIds?: Set<string>;
    failedEnrichmentAttempts?: Record<string, number>;
    plan?: UserPlan;
}


const CRM: React.FC<CRMProps> = ({
    hasCRMAccess,
    hasDashboardAccess = false,
    hasExportExcelAccess = false,
    hasExportSheetsAccess = false,
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
    handleDeleteLead,
    onEnrichLead,
    enrichingLeadIds,
    failedEnrichmentAttempts = {},
    plan
}) => {

    const [focusToday, setFocusToday] = useState(false);
    const [viewMode, setViewMode] = useState<'kanban' | 'analytics'>(hasCRMAccess ? 'kanban' : 'analytics');

    const displayedLeads = useMemo(() => {
        let leads = hasCRMAccess ? filteredCrmLeads : (DEMO_LEADS as CRMLead[]);
        if (focusToday) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            leads = leads.filter(l => {
                if (!l.notifyAt) return false;
                const notifyDate = new Date(l.notifyAt);
                notifyDate.setHours(0, 0, 0, 0);

                // Retorna leads com notificação para hoje ou antes, que não estejam ganhos/perdidos
                return notifyDate.getTime() <= today.getTime() && l.status !== 'won' && l.status !== 'lost';
            });
        }
        return leads;
    }, [hasCRMAccess, filteredCrmLeads, focusToday]);

    return (
        <div className="animate-fade-in-up h-full flex flex-col relative">

            {/* Lock Overlay se não tem acesso à view atual */}
            {((viewMode === 'kanban' && !hasCRMAccess) || (viewMode === 'analytics' && !hasDashboardAccess)) && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4">
                    <div className="flex flex-col items-center gap-4 bg-white/90 dark:bg-black/80 backdrop-blur-md p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center max-w-md">
                        <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full shadow-inner">
                            <Lock className="w-10 h-10 text-zinc-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">Recurso bloqueado</h2>
                            <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-6">
                                {viewMode === 'kanban'
                                    ? 'Organize suas vendas visualmente com o CRM Kanban. Disponível a partir do plano Pro.'
                                    : 'Acompanhe seus indicadores de prospecção. Disponível a partir do plano Pro.'}
                            </p>
                            <button onClick={() => setActiveTab('subscription')} className="w-full bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
                                Liberar acesso agora
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 transition-all duration-500 ${((viewMode === 'kanban' && !hasCRMAccess) || (viewMode === 'analytics' && !hasDashboardAccess)) ? 'blur-sm select-none pointer-events-none opacity-50' : ''}`}>
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                        <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tighter">CRM</h2>
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl shadow-inner max-w-fit">
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                Pipeline
                            </button>
                            <button
                                onClick={() => setViewMode('analytics')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'analytics' ? 'bg-white dark:bg-zinc-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">Gerencie seus negócios e vendas.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:flex-none order-1">
                        <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-400 font-bold" />
                        <input
                            value={crmSearchQuery}
                            onChange={e => setCrmSearchQuery(e.target.value)}
                            placeholder="Buscar no CRM..."
                            className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 order-2 w-full sm:w-auto">
                        <button
                            onClick={() => setFocusToday(!focusToday)}
                            className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border ${focusToday ? 'bg-danger-100 dark:bg-danger-900/40 text-danger-600 dark:text-danger-400 border-danger-300 dark:border-danger-700/50 shadow-inner' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-danger-400 dark:border-danger-700/50 hover:bg-danger-50 dark:hover:bg-zinc-700 shadow-sm'}`}
                            title="Ver apenas leads com retorno agendado para hoje ou atrasados"
                        >
                            <Bell className={`w-4 h-4 ${focusToday ? 'fill-current' : 'text-danger-500'}`} />
                            Hoje
                        </button>
                        <button
                            onClick={() => setShowNewLeadModal(true)}
                            className="flex-[2] sm:flex-none whitespace-nowrap bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Novo negócio
                        </button>
                    </div>
                </div>
            </div>

            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-500 ${((viewMode === 'kanban' && !hasCRMAccess) || (viewMode === 'analytics' && !hasDashboardAccess)) ? 'blur-sm select-none pointer-events-none opacity-60 grayscale-[0.3]' : ''}`}>
                {crmLeads.length === 0 && hasCRMAccess && viewMode === 'kanban' ? (
                    <div className="flex flex-col items-center justify-center h-full bg-app-cardLight dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 m-4">
                        <KanbanSquare className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-4" />
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Seu pipeline está vazio</h3>
                        <p className="text-zinc-500 max-w-md text-center mb-6">Adicione leads manualmente ou importe da busca para começar a gerenciar suas vendas.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveTab('search')} className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-colors">Ir para Busca</button>
                            <button onClick={() => setShowNewLeadModal(true)} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">Adicionar manualmente</button>
                        </div>
                    </div>
                ) : viewMode === 'analytics' ? (
                    <CRMDashboard leads={filteredCrmLeads} goal={pipelineGoal} hasExportExcelAccess={hasExportExcelAccess} hasExportSheetsAccess={hasExportSheetsAccess} />
                ) : (
                    <KanbanBoard
                        leads={displayedLeads}
                        allLeads={filteredCrmLeads}
                        onStatusChange={handleCRMStatusChange}
                        onDelete={handleDeleteLead}
                        onUpdateLead={handleUpdateLead}
                        onDuplicate={handleDuplicateLead}
                        onEnrichLead={onEnrichLead}
                        enrichingLeadIds={enrichingLeadIds}
                        failedEnrichmentAttempts={failedEnrichmentAttempts}
                        goal={pipelineGoal}
                        onSetGoal={setPipelineGoal}
                        resetDay={pipelineResetDay}
                        readOnly={!hasCRMAccess}
                        plan={plan}
                        setActiveTab={setActiveTab}
                    />

                )}
            </div>
        </div>
    );
};

export default CRM;
