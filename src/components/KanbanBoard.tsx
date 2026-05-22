import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CRMLead, CRMStatus, CRMPriority, UserPlan, AppTab } from '@/types/types';
import { COMMON_NICHES, PLAN_HIERARCHY } from '@/constants/appConstants';
import {
    Trash2, MessageCircle, Mail, FileText, Check,
    Search, Phone, Briefcase, Trophy, XCircle, Flame, AlertCircle, Clock, DollarSign, Edit3, X, Save, Copy, Bell,
    Zap, Loader2, Building, Users, ExternalLink, Lock, Bot,
    Globe, Instagram, MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { BDRCockpit } from './crm/BDRCockpit';


interface KanbanBoardProps {
    leads: CRMLead[];
    allLeads?: CRMLead[];
    onStatusChange: (leadId: string, newStatus: CRMStatus) => void;
    onDelete: (leadId: string) => void;
    onUpdateLead: (leadId: string, updates: Partial<CRMLead>) => void;
    onDuplicate?: (lead: CRMLead) => void;
    onEnrichLead?: (leadId: string) => void;
    enrichingLeadIds?: Set<string>;
    failedEnrichmentAttempts?: Record<string, number>;
    readOnly?: boolean;
    goal?: number;
    onSetGoal?: (goal: number) => void;
    resetDay?: number;
    plan?: UserPlan;
    setActiveTab?: (tab: AppTab) => void;
}


// Configuração Visual das Colunas
const COLUMNS: { id: CRMStatus; label: string; color: string; border: string; icon: React.ReactNode }[] = [
    { id: 'prospecting', label: 'Prospectar', color: 'bg-zinc-500', border: 'border-zinc-200', icon: <Search className="w-4 h-4" /> },
    { id: 'contacted', label: 'Primeiro contato', color: 'bg-primary-500', border: 'border-primary-200', icon: <Phone className="w-4 h-4" /> },
    { id: 'follow_up', label: 'Follow up', color: 'bg-orange-500', border: 'border-orange-200', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'negotiation', label: 'Negociação', color: 'bg-indigo-500', border: 'border-indigo-200', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'won', label: 'Ganho', color: 'bg-success-500', border: 'border-success-200', icon: <Trophy className="w-4 h-4" /> },
    { id: 'lost', label: 'Perdido', color: 'bg-danger-500', border: 'border-danger-200', icon: <XCircle className="w-4 h-4" /> },
];

// Helper para formatar moeda
const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const number = Number(numericValue) / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrency = (value: string) => {
    return Number(value.replace(/\./g, '').replace(',', '.')) || 0;
};

// Helper para pegar data de reset dinâmico
const getMonthlyPeriodStart = (resetDay: number) => {
    const now = new Date();
    const currentDay = now.getDate();
    const start = new Date(now);

    // Se o dia atual for menor que o dia de reset, o período começou no mês passado
    if (currentDay < resetDay) {
        start.setMonth(start.getMonth() - 1);
    }
    start.setDate(resetDay);
    start.setHours(0, 0, 0, 0);
    return start;
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, allLeads, onStatusChange, onDelete, onUpdateLead, onDuplicate, onEnrichLead, enrichingLeadIds, failedEnrichmentAttempts = {}, readOnly = false, goal = 10000, onSetGoal, resetDay = 10, plan, setActiveTab }) => {

    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [dragTargetColumn, setDragTargetColumn] = useState<CRMStatus | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ id: string, position: 'top' | 'bottom' } | null>(null);
    const [editingLead, setEditingLead] = useState<CRMLead | null>(null);

    // Estado para ordem das colunas
    const [localOrders, setLocalOrders] = useState<Record<string, string[]>>(() => {
        try {
            return JSON.parse(localStorage.getItem('beleadly_column_orders') || '{}');
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem('beleadly_column_orders', JSON.stringify(localOrders));
    }, [localOrders]);

    // Estado para edição rápida de valor
    const [quickEditingId, setQuickEditingId] = useState<string | null>(null);
    const [quickEditValue, setQuickEditValue] = useState<string>('');

    // Estado para edição da meta
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState('');

    // Lógica de Ganho Mensal (Reset Dinâmico) 
    // Usa allLeads (se disponível) para que o progresso ignore os filtros visuais das colunas
    const baseLeadsForProgress = allLeads || leads;
    const monthlyWonValue = baseLeadsForProgress
        .filter(l => l.status === 'won')
        .filter(l => new Date(l.updatedAt) >= getMonthlyPeriodStart(resetDay))
        .reduce((acc, lead) => acc + (lead.potentialValue || 0), 0);

    // Progresso em relação à META
    const rawGoalProgress = goal > 0 ? (monthlyWonValue / goal) * 100 : 0;
    const goalProgress = Math.min(rawGoalProgress, 100);
    const isGoalReached = monthlyWonValue >= goal;
    const missingValue = Math.max(0, goal - monthlyWonValue);

    // --- Drag & Drop Logic ---
    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        if (readOnly) return;
        // Defer state update to avoid interrupting drag initialization
        setTimeout(() => setDraggedLeadId(leadId), 0);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', leadId);
    };

    const handleDragEnd = () => {
        setDraggedLeadId(null);
        setDragTargetColumn(null);
        setDropIndicator(null);
    };

    const handleDragOver = (e: React.DragEvent, columnId: CRMStatus) => {
        if (readOnly) return;
        e.preventDefault(); // Essential for drop to work
        e.dataTransfer.dropEffect = 'move';

        // Only update if changed to avoid excessive re-renders
        if (dragTargetColumn !== columnId) {
            setDragTargetColumn(columnId);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Optional: clear target if leaving board area, but usually handled by drop/end
    };

    const reorderLead = (leadId: string, targetId: string, position: 'before' | 'after', status: CRMStatus) => {
        setLocalOrders(prev => {
            const colOrder = [...(prev[status] || [])];
            
            const existingIdx = colOrder.indexOf(leadId);
            if (existingIdx !== -1) {
                colOrder.splice(existingIdx, 1);
            }

            const targetIdx = colOrder.indexOf(targetId);
            if (targetIdx === -1) {
                colOrder.push(leadId);
            } else {
                colOrder.splice(position === 'before' ? targetIdx : targetIdx + 1, 0, leadId);
            }

            return { ...prev, [status]: colOrder };
        });

        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.status !== status) {
            onStatusChange(leadId, status);
        }
    };

    const handleCardDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedLeadId === targetId) return;
        
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const dropPosition = (e.clientY - rect.top) / rect.height;
        setDropIndicator({ id: targetId, position: dropPosition < 0.5 ? 'top' : 'bottom' });
    };

    const handleCardDragLeave = (e: React.DragEvent) => {
        e.stopPropagation();
        setDropIndicator(null);
    };

    const handleCardDrop = (e: React.DragEvent, targetId: string, status: CRMStatus) => {
        e.preventDefault();
        e.stopPropagation();
        setDropIndicator(null);
        if (readOnly || !draggedLeadId || draggedLeadId === targetId) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const dropPosition = (e.clientY - rect.top) / rect.height;
        const position = dropPosition < 0.5 ? 'before' : 'after';

        reorderLead(draggedLeadId, targetId, position, status);
        setDraggedLeadId(null);
        setDragTargetColumn(null);
    };

    const handleDrop = (e: React.DragEvent, targetStatus: CRMStatus) => {
        e.preventDefault();
        if (readOnly || !draggedLeadId) return;

        setLocalOrders(prev => {
            const colOrder = [...(prev[targetStatus] || [])];
            if (!colOrder.includes(draggedLeadId)) {
                colOrder.push(draggedLeadId);
            }
            return { ...prev, [targetStatus]: colOrder };
        });

        const lead = leads.find(l => l.id === draggedLeadId);
        if (lead && lead.status !== targetStatus) {
            onStatusChange(draggedLeadId, targetStatus);
        }

        // Cleanup state
        setDraggedLeadId(null);
        setDragTargetColumn(null);
        setDropIndicator(null);
    };

    // --- Quick Edit Logic ---
    const startQuickEdit = (e: React.MouseEvent, lead: CRMLead) => {
        e.stopPropagation();
        if (readOnly) return;
        setQuickEditingId(lead.id);
        const initialVal = lead.potentialValue ? lead.potentialValue.toFixed(2).replace('.', ',') : '0,00';
        setQuickEditValue(initialVal);
    };

    const handleQuickEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const number = Number(raw) / 100;
        setQuickEditValue(number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const saveQuickEdit = () => {
        if (quickEditingId) {
            const numValue = parseCurrency(quickEditValue);
            onUpdateLead(quickEditingId, { potentialValue: numValue });
            setQuickEditingId(null);
        }
    };

    const cancelQuickEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setQuickEditingId(null);
    };

    const handleQuickEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveQuickEdit();
        } else if (e.key === 'Escape') {
            setQuickEditingId(null);
        }
    };

    // --- Goal Edit Logic ---
    const startGoalEdit = () => {
        setTempGoal(goal.toFixed(2).replace('.', ','));
        setIsEditingGoal(true);
    };

    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const number = Number(raw) / 100;
        setTempGoal(number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const saveGoal = () => {
        const newGoal = parseCurrency(tempGoal);
        if (onSetGoal) {
            onSetGoal(newGoal);
        }
        setIsEditingGoal(false);
    };

    // --- Priority Edit Logic (Click to Cycle) ---
    const cyclePriority = (e: React.MouseEvent, lead: CRMLead) => {
        e.stopPropagation();
        if (readOnly) return;

        const priorityMap: Record<CRMPriority, CRMPriority> = {
            'low': 'medium',
            'medium': 'high',
            'high': 'low'
        };

        const nextPriority = priorityMap[lead.priority];
        onUpdateLead(lead.id, { priority: nextPriority });
    };

    // --- Helpers ---
    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Adicionado hoje';
        if (diffDays === 1) return 'Adicionado ontem';

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `Adicionado dia ${day}/${month}`;
    };

    const getPriorityColor = (priority: CRMPriority) => {
        switch (priority) {
            case 'high': return 'text-danger bg-danger-50 dark:bg-danger-700/30 dark:text-danger';
            case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
            default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
        }
    };

    const getPriorityIcon = (priority: CRMPriority) => {
        switch (priority) {
            case 'high': return <Flame className="w-3 h-3" />;
            case 'medium': return <AlertCircle className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    const getPriorityCardBorder = (priority: CRMPriority) => {
        switch (priority) {
            case 'high': return 'border-danger-400/50 dark:border-danger-700/50';
            case 'medium': return 'border-amber-400/50 dark:border-amber-700/50';
            default: return 'border-blue-400/50 dark:border-blue-700/50';
        }
    };

    const getProgressMessage = (percent: number) => {
        if (percent >= 100) return "Parabéns! Meta atingida, continue fazendo um ótimo trabalho.";
        if (percent >= 75) return "Quase lá! Falta muito pouco para bater a meta.";
        if (percent >= 50) return "Ótimo ritmo! Você já chegou na metade do caminho.";
        if (percent >= 25) return "Bom começo! Continue focado nos resultados.";
        return "";
    };

    const renderNotificationIcon = (notifyAt?: string) => {
        if (!notifyAt) return null;

        // Parse ISO string (YYYY-MM-DD) to avoid timezone shifts
        const [year, month, day] = notifyAt.split('T')[0].split('-').map(Number);
        const notifyDate = new Date(year, month - 1, day);
        notifyDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = notifyDate.getTime() - today.getTime();
        // Math.round handles daylight saving time shifts better than Math.ceil here
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let textClass = 'text-zinc-500 dark:text-zinc-400';
        let bgClass = 'bg-zinc-100 dark:bg-zinc-800';
        let animationClass = '';

        if (diffDays < 0) {
            textClass = 'text-white';
            bgClass = 'bg-danger-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
            animationClass = 'animate-pulse-red';
        } else if (diffDays === 0) {
            textClass = 'text-danger-600 dark:text-danger-400';
            bgClass = 'bg-danger-100 dark:bg-danger-900/40 border border-danger-200 dark:border-danger-800';
        } else if (diffDays === 1) {
            textClass = 'text-amber-600 dark:text-amber-400';
            bgClass = 'bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800';
        } else if (diffDays > 1 && diffDays < 7) {
            textClass = 'text-blue-600 dark:text-blue-400';
            bgClass = 'bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
        } else {
            textClass = 'text-zinc-500 dark:text-zinc-400';
            bgClass = 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700';
        }

        // Parse for visual display considering timezone
        // the split('T')[0] avoids the date dropping back a day in Brazil (UTC-3)
        const displayDateParts = notifyAt.split('T')[0].split('-');
        const displayDate = `${displayDateParts[2]}/${displayDateParts[1]}/${displayDateParts[0]}`;

        return (
            <div className={`p-1.5 rounded-md flex items-center justify-center relative z-10 ${textClass} ${bgClass} ${animationClass}`} title={`Notificar em: ${displayDate}`}>
                <Bell className="w-3.5 h-3.5 fill-current" />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <style dangerouslySetInnerHTML={{
                __html: `
            @keyframes pulse-red {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
            .animate-pulse-red {
                animation: pulse-red 2s infinite;
            }
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            .animate-shimmer-bg {
                background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
                background-size: 200% 100%;
                animation: shimmer 2.5s 2 linear forwards;
            }
        `}} />

            {/* Pipeline Health Bar */}
            {!readOnly && (
                <div className="mb-6 bg-app-cardLight dark:bg-app-cardDark rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-6 border border-zinc-200 dark:border-zinc-700 relative overflow-hidden shadow-sm">

                    <div className="flex-1 w-full">
                        <div className="flex justify-between mb-3 items-end">
                            <div className="flex items-baseline gap-2">
                                <span className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-widest">
                                    Progresso mensal {isGoalReached && '🏆'}
                                </span>
                                {rawGoalProgress >= 25 && (
                                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 animate-in fade-in slide-in-from-left-2 hidden sm:inline-block">
                                        {getProgressMessage(rawGoalProgress)}
                                    </span>
                                )}
                            </div>
                            <span className="text-zinc-900 dark:text-white font-black text-sm">
                                {Math.round(goalProgress)}%
                            </span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-3 rounded-full overflow-hidden relative">
                            <div
                                className={`h-full transition-all duration-1000 rounded-full relative overflow-hidden ${isGoalReached ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]'}`}
                                style={{ width: `${Math.min(goalProgress, 100)}%` }}
                            >
                                {isGoalReached && <div className="absolute inset-0 animate-shimmer-bg"></div>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-4 sm:gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 lg:pl-6">
                        <div className="flex flex-col min-w-0">
                            <span className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider mb-1">Ganho (mês)</span>
                            <div className="flex items-baseline gap-1.5 overflow-hidden">
                                <span className="text-xs font-bold text-zinc-400">R$</span>
                                <span className={`text-xl font-black tracking-tight truncate ${isGoalReached ? 'text-success-600 dark:text-success-400' : 'text-primary-600 dark:text-primary-400'}`}>
                                    {monthlyWonValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',')[0]}
                                    <span className="text-xs opacity-70">,{monthlyWonValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',')[1]}</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col min-w-0">
                            <span className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider mb-1">Falta</span>
                            <div className="flex items-baseline gap-1.5 overflow-hidden">
                                <span className="text-xs font-bold text-zinc-400">R$</span>
                                <span className="text-xl font-black tracking-tight text-zinc-400 dark:text-zinc-600 truncate">
                                    {missingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',')[0]}
                                    <span className="text-xs opacity-70">,{missingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',')[1]}</span>
                                </span>
                            </div>
                        </div>

                        <div
                            onClick={startGoalEdit}
                            className="col-span-2 sm:col-span-1 pt-4 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 cursor-pointer group flex flex-col min-w-0"
                        >
                            <span className="block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider mb-1 flex items-center gap-2">
                                Meta mensal
                                <Edit3 className="w-2.5 h-2.5 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                            {isEditingGoal ? (
                                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 shadow-xl p-2 rounded-xl z-10 border border-primary-500 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                    <span className="text-xs font-bold text-zinc-400">R$</span>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={tempGoal}
                                        onChange={handleGoalChange}
                                        onBlur={() => setTimeout(saveGoal, 200)}
                                        onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                                        className="w-28 text-sm font-black bg-transparent outline-none text-zinc-900 dark:text-white text-right"
                                    />
                                    <button onMouseDown={(e) => { e.preventDefault(); saveGoal(); }} className="p-1 bg-success-500 text-white rounded-lg"><Check className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-baseline gap-1.5 overflow-hidden">
                                    <span className="text-xs font-bold text-zinc-400">R$</span>
                                    <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-white truncate">
                                        {goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',')[0]}
                                        <span className="text-xs opacity-70">,{goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',')[1]}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ... Rest of Kanban Board (Columns, Cards) ... */}
            <div className="flex h-full gap-4 overflow-x-auto pb-4 items-start select-none">
                {COLUMNS.map((column) => {
                    const columnOrder = localOrders[column.id] || [];
                    const columnLeads = leads.filter((lead) => lead.status === column.id).sort((a, b) => {
                        const idxA = columnOrder.indexOf(a.id);
                        const idxB = columnOrder.indexOf(b.id);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
                    });
                    const totalValue = columnLeads.reduce((acc, lead) => acc + (lead.potentialValue || 0), 0);
                    const isTarget = dragTargetColumn === column.id;

                    let specialEffectClass = '';
                    if (isTarget) {
                        if (column.id === 'won') specialEffectClass = 'ring-4 ring-success-400 bg-success-50 dark:bg-success-900/20 scale-[1.02] shadow-2xl shadow-success-500/30';
                        else if (column.id === 'negotiation') specialEffectClass = 'ring-4 ring-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02] shadow-2xl shadow-indigo-500/30';
                        else specialEffectClass = 'ring-2 ring-zinc-400 bg-zinc-50 dark:bg-zinc-800/80';
                    }

                    return (
                        <div
                            key={column.id}
                            onDragOver={(e) => handleDragOver(e, column.id)}
                            onDrop={(e) => handleDrop(e, column.id)}
                            className={`flex-shrink-0 w-72 flex flex-col h-full max-h-full rounded-2xl transition-all duration-300 ${specialEffectClass}`}
                        >
                            <div className={`flex flex-col mb-2 p-2 rounded-t-2xl border-b-2 ${column.border.replace('border-', 'border-b-')} transition-colors`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-md ${column.color} bg-opacity-10 text-zinc-700 dark:text-zinc-200`}>
                                            {column.icon}
                                        </div>
                                        <span className="font-bold text-sm text-zinc-700 dark:text-zinc-200">{column.label}</span>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{columnLeads.length}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium pl-1">
                                    <DollarSign className="w-3 h-3" />
                                    <span>{totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 p-1.5 pb-10 scrollbar-thin">
                                {columnLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        draggable={!readOnly}
                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleCardDragOver(e, lead.id)}
                                        onDragLeave={handleCardDragLeave}
                                        onDrop={(e) => handleCardDrop(e, lead.id, column.id)}
                                        onClick={() => !readOnly && setEditingLead(lead)}
                                        className={`group bg-white dark:bg-zinc-800 p-2.5 rounded-xl shadow-sm border-t-2 ${lead.priority === 'high' ? 'border-t-red-500' : lead.priority === 'medium' ? 'border-t-amber-500' : 'border-t-blue-500'} border-x ${lead.status === 'negotiation' || lead.notes?.includes('[Reunião Marcada') ? 'border-b-4 border-b-emerald-500' : 'border-b border-zinc-200 dark:border-zinc-700'} relative transition-all duration-300 ${!readOnly ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} ${draggedLeadId === lead.id ? 'opacity-40 border-dashed ring-2 ring-primary-400 rotate-2 scale-95' : ''} ${dropIndicator?.id === lead.id ? (dropIndicator.position === 'top' ? 'border-t-4 border-t-primary-500 !mt-2' : 'border-b-4 border-b-primary-500 !mb-2') : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1 pr-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => cyclePriority(e, lead)}
                                                    title="Clique para mudar prioridade"
                                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-transparent transition-all active:scale-95 ${getPriorityColor(lead.priority)} hover:brightness-95 cursor-pointer select-none`}
                                                >
                                                    {getPriorityIcon(lead.priority)} {lead.priority === 'high' ? 'Alta' : lead.priority === 'medium' ? 'Média' : 'Baixa'}
                                                </button>
                                                {lead.category !== 'Manual' && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-600 truncate max-w-[80px]">
                                                        {lead.category}
                                                    </span>
                                                )}
                                                {lead.cnpj && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 flex items-center gap-0.5">
                                                        <Zap className="w-2.5 h-2.5 fill-current" /> 100%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h4 className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100 leading-snug line-clamp-2 mb-1">{lead.name}</h4>

                                        <div className="mb-1.5 relative z-10" onClick={(e) => e.stopPropagation()}>
                                            {quickEditingId === lead.id ? (
                                                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-lg border border-primary-200 dark:border-primary-800 shadow-sm">
                                                    <span className="text-[10px] font-bold text-zinc-400 pl-1">R$</span>
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={quickEditValue}
                                                        onChange={handleQuickEditChange}
                                                        onKeyDown={handleQuickEditKeyDown}
                                                        className="w-full text-xs font-bold text-zinc-900 dark:text-white bg-transparent outline-none min-w-0"
                                                    />
                                                    <div className="flex gap-1">
                                                        <button onMouseDown={(e) => { e.preventDefault(); saveQuickEdit(); }} className="p-0.5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"><Check className="w-3 h-3" /></button>
                                                        <button onMouseDown={cancelQuickEdit} className="p-0.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-500 dark:text-zinc-300 rounded transition-colors"><X className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div onClick={(e) => startQuickEdit(e, lead)} className={`inline-flex items-center gap-1.5 py-0.5 px-1.5 -ml-1.5 rounded-lg transition-all ${!readOnly ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 group/value border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700' : ''}`}>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-zinc-400 font-medium text-[10px]">R$</span>
                                                        <span className="font-bold text-zinc-700 dark:text-zinc-200 text-sm tracking-tight">{lead.potentialValue ? lead.potentialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</span>
                                                    </div>
                                                    {!readOnly && <Edit3 className="w-2.5 h-2.5 text-zinc-300 opacity-0 group-hover/value:opacity-100 transition-opacity" />}
                                                </div>
                                            )}
                                        </div>

                                        {lead.notes && lead.notes.trim() !== '' && (
                                            <div className="mb-2 p-1.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                                                <div className="flex items-start gap-1.5">
                                                    <FileText className="w-3 h-3 text-zinc-400 mt-0.5 flex-shrink-0" />
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic leading-relaxed">{lead.notes}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-700/50">
                                            <div className="flex items-center gap-1.5">
                                                {lead.tags && lead.tags.length > 0 && (
                                                    <div className="flex -space-x-1 grayscale opacity-60">
                                                        {lead.tags.slice(0, 2).map((tag, i) => (
                                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-400 ring-1 ring-white dark:ring-zinc-800" title={tag}></div>
                                                        ))}
                                                    </div>
                                                )}
                                                <span className="text-[9px] text-zinc-400 font-medium lowercase">
                                                    {getRelativeTime(lead.updatedAt)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {!readOnly && (
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all mr-1 border-r border-zinc-200 dark:border-zinc-700 pr-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingLead(lead);
                                                            }}
                                                            className="p-1 rounded hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-zinc-400 transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onDuplicate) onDuplicate(lead);
                                                            }}
                                                            className="p-1 rounded hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-400 transition-colors"
                                                            title="Duplicar"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete(lead.id);
                                                            }}
                                                            className="p-1 rounded hover:text-danger hover:bg-danger-50 dark:hover:bg-danger-700/30 text-zinc-400 transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}

                                                {renderNotificationIcon(lead.notifyAt)}
                                                {lead.phone && lead.phone !== 'N/A' && (
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank'); }} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 text-zinc-400 hover:text-green-600 rounded-md transition-colors relative z-10"><MessageCircle className="w-3 h-3" /></button>
                                                )}
                                                {lead.email && (
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(`mailto:${lead.email}`, '_blank'); }} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-zinc-400 hover:text-blue-600 rounded-md transition-colors relative z-10"><Mail className="w-3 h-3" /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {columnLeads.length === 0 && !readOnly && (
                                    <div className={`border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center text-zinc-400 text-xs gap-2 transition-all duration-300 ${isTarget ? 'border-primary-300 bg-primary-50/20' : 'border-zinc-200 dark:border-zinc-800'}`}>
                                        <div className={`p-2 rounded-full transition-all ${isTarget ? 'bg-primary-100 text-primary-500 scale-110' : 'bg-zinc-100 dark:bg-zinc-800'}`}>{column.icon}</div>
                                        <p className={isTarget ? 'text-primary-500 font-bold' : ''}>Arraste aqui</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>


            {/* --- EDIT LEAD MODAL --- */}
            {editingLead && !readOnly && (
                <EditLeadModal
                    lead={leads.find(l => l.id === editingLead.id) || editingLead}
                    onClose={() => setEditingLead(null)}
                    onSave={(id, updates) => {
                        onUpdateLead(id, updates);
                        setEditingLead(null);
                    }}
                    onDelete={onDelete}
                    onUpdateLead={onUpdateLead}
                    onEnrichLead={onEnrichLead}
                    enrichingLeadIds={enrichingLeadIds}
                    failedEnrichmentAttempts={failedEnrichmentAttempts}
                    plan={plan}
                    setActiveTab={setActiveTab}
                />
            )}



        </div >
    );
};

// --- Subcomponent: Edit Modal ---
const EditLeadModal = ({ lead, onClose, onSave, onDelete, onUpdateLead, onEnrichLead, enrichingLeadIds, failedEnrichmentAttempts, plan, setActiveTab }: { lead: CRMLead, onClose: () => void, onSave: (id: string, data: Partial<CRMLead>) => void, onDelete: (id: string) => void, onUpdateLead: (id: string, updates: Partial<CRMLead>) => void, onEnrichLead?: (leadId: string) => void, enrichingLeadIds?: Set<string>, failedEnrichmentAttempts?: Record<string, number>, plan?: UserPlan, setActiveTab?: (tab: AppTab) => void }) => {

    const [formData, setFormData] = useState(() => {
        const draftKey = `beleadly_draft_${lead.id}`;
        try {
            const draftStr = localStorage.getItem(draftKey);
            if (draftStr) {
                const draft = JSON.parse(draftStr);
                if (draft.updatedAt && (!lead.updatedAt || new Date(draft.updatedAt) >= new Date(lead.updatedAt))) {
                    console.log('[EditLeadModal] 🛡️ Restaurando rascunho local salvo antes do F5/Queda!');
                    return draft.data;
                }
            }
        } catch (e) {}

        return {
            name: lead.name,
            contactName: lead.contactName || '',
            gatekeeperName: lead.gatekeeperName || '',
            dmName: lead.dmName || '',
            providerName: lead.providerName || '',
            potentialValue: lead.potentialValue || 0,
            phone: lead.phone,
            email: lead.email || '',
            priority: lead.priority || 'medium',
            notes: lead.notes || '',
            category: lead.category || 'Manual',
            notifyAt: lead.notifyAt || '',
            status: lead.status || 'prospecting',
            website: lead.website || '',
            instagram: lead.instagram || '',
            googleMapsLink: lead.googleMapsLink || ''
        };
    });

    const [priceInput, setPriceInput] = useState(() => {
        return (lead.potentialValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });

    const [isEditingLinks, setIsEditingLinks] = useState(false);
    const [customPrompt, setCustomPrompt] = useState<{ field: 'googleMapsLink' | 'website' | 'instagram', title: string, placeholder: string, value: string } | null>(null);

    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialRenderRef = useRef(true);
    const formDataRef = useRef(formData);
    const isDirtyRef = useRef(false);
    const onUpdateLeadRef = useRef(onUpdateLead);
    const leadIdRef = useRef(lead.id);

    // Keep refs updated
    useEffect(() => {
        formDataRef.current = formData;
        if (!initialRenderRef.current) {
            try {
                localStorage.setItem(`beleadly_draft_${lead.id}`, JSON.stringify({
                    updatedAt: new Date().toISOString(),
                    data: formData
                }));
            } catch (e) {}
        }
    }, [formData, lead.id]);

    useEffect(() => {
        onUpdateLeadRef.current = onUpdateLead;
        leadIdRef.current = lead.id;
    }, [onUpdateLead, lead.id]);

    // Reage instantaneamente a atualizações externas no lead (como enriquecimento concluído)
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            name: lead.name || prev.name,
            contactName: lead.contactName || prev.contactName,
            gatekeeperName: lead.gatekeeperName || prev.gatekeeperName,
            dmName: lead.dmName || prev.dmName,
            providerName: lead.providerName || prev.providerName,
            potentialValue: lead.potentialValue || prev.potentialValue,
            phone: lead.phone || prev.phone,
            email: lead.email || prev.email,
            priority: lead.priority || prev.priority,
            notes: lead.notes || prev.notes,
            category: lead.category || prev.category,
            notifyAt: lead.notifyAt || prev.notifyAt,
            status: lead.status || prev.status,
            website: lead.website || prev.website,
            instagram: lead.instagram || prev.instagram,
            googleMapsLink: lead.googleMapsLink || prev.googleMapsLink
        }));
    }, [lead]);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const number = Number(raw) / 100;
        setPriceInput(number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setFormData(prev => ({ ...prev, potentialValue: number }));
        isDirtyRef.current = true;
    };

    const formatPhone = (val: string) => {
        let clean = val.replace(/\D/g, '');
        if (clean.length > 11) clean = clean.slice(0, 11);
        if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
        if (clean.length === 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
        if (clean.length > 2) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
        return clean;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }));
        isDirtyRef.current = true;
    };

    const getWhatsAppLink = (phone: string) => {
        const numbers = phone.replace(/\D/g, '');
        if (numbers.length < 10) return null;
        const fullNumber = numbers.length <= 11 ? `55${numbers}` : numbers;
        return `https://wa.me/${fullNumber}`;
    };

    const handleDMChangeWithAutoSave = useCallback((newDM: string) => {
        setFormData(prev => ({ ...prev, dmName: newDM }));
        formDataRef.current.dmName = newDM;
        isDirtyRef.current = true;
    }, []);

    const isPhoneValid = formData.phone.replace(/\D/g, '').length >= 10;

    // Unified save function
    const saveAllData = useCallback(async (dataToSave: typeof formData) => {
        if (!leadIdRef.current || !isDirtyRef.current) return;
        try {
            await onUpdateLeadRef.current(leadIdRef.current, {
                ...dataToSave,
                updatedAt: new Date().toISOString()
            });
            isDirtyRef.current = false;
            try { localStorage.removeItem(`beleadly_draft_${leadIdRef.current}`); } catch (e) {}
        } catch (err) {
            console.error('[EditLeadModal] Falha ao salvar:', err);
        }
    }, []);

    const handleExplicitSave = useCallback(() => {
        if (isDirtyRef.current) saveAllData(formDataRef.current);
    }, [saveAllData]);

    // Unmount save - CRITICAL: No dependencies to avoid loop!
    useEffect(() => {
        const timer = autoSaveTimerRef;
        return () => {
            if (timer.current) clearTimeout(timer.current);
            if (isDirtyRef.current && leadIdRef.current) {
                onUpdateLeadRef.current(leadIdRef.current, {
                    ...formDataRef.current,
                    updatedAt: new Date().toISOString()
                });
            }
            if (leadIdRef.current) {
                try { localStorage.removeItem(`beleadly_draft_${leadIdRef.current}`); } catch (e) {}
            }
        };
    }, []);

    // Debounced auto-save
    useEffect(() => {
        if (initialRenderRef.current) {
            initialRenderRef.current = false;
            return;
        }
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
            saveAllData(formData);
        }, 800);
    }, [formData, saveAllData]);

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl relative z-10 flex flex-col lg:flex-row max-h-[90vh] animate-fade-in-up border border-zinc-200 dark:border-zinc-700 rounded-3xl shadow-2xl overflow-hidden">
                {/* Custom Prompt Overlay */}
                {customPrompt && (
                    <div className="absolute inset-0 z-[110] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl rounded-2xl p-6 w-full max-w-sm m-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                                {customPrompt.field === 'googleMapsLink' ? <MapPin className="w-4 h-4 text-primary-500" /> : 
                                 customPrompt.field === 'website' ? <Globe className="w-4 h-4 text-primary-500" /> : 
                                 <Instagram className="w-4 h-4 text-primary-500" />}
                                {customPrompt.title}
                            </h3>
                            <input 
                                type="text"
                                value={customPrompt.value}
                                onChange={e => setCustomPrompt({...customPrompt, value: e.target.value})}
                                placeholder={customPrompt.placeholder}
                                className="w-full p-3 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white mb-6 transition-all"
                                autoFocus
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setFormData(p => ({...p, [customPrompt.field]: customPrompt.value || 'N/A'}));
                                        isDirtyRef.current = true;
                                        setCustomPrompt(null);
                                    } else if (e.key === 'Escape') {
                                        setCustomPrompt(null);
                                    }
                                }}
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setCustomPrompt(null)} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                                    Cancelar
                                </button>
                                <button type="button" onClick={() => {
                                    setFormData(p => ({...p, [customPrompt.field]: customPrompt.value || 'N/A'}));
                                    isDirtyRef.current = true;
                                    setCustomPrompt(null);
                                }} className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors shadow-sm">
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-thin">
                    <div className="flex flex-col lg:flex-row flex-1">
                        {/* Lado Esquerdo: Edit Form */}
                        <div className="flex-1 flex flex-col border-zinc-200 dark:border-zinc-800 lg:border-r">
                            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-20">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <Edit3 className="w-5 h-5 text-primary-500" />
                                            Editar oportunidade
                                        </h2>
                                        <p className="text-sm text-zinc-500">ID: {lead.id.slice(0, 8)}...</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors lg:hidden"><X className="w-5 h-5 text-zinc-500" /></button>
                            </div>

                            <form id="edit-lead-form" onSubmit={(e) => e.preventDefault()} className="flex-1 p-5 space-y-4">
                                {/* Bloco 1: Empresa e Contatos */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div><label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Nome da empresa</label><input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} onBlur={handleExplicitSave} className="w-full p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div>
                                        <div><label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Nicho</label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} onBlur={handleExplicitSave} className="w-full p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white">{COMMON_NICHES.map(niche => <option key={niche} value={niche}>{niche}</option>)}</select></div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Coluna / Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={e => {
                                                    const newStatus = e.target.value as any;
                                                    setFormData({ ...formData, status: newStatus });
                                                    onUpdateLead(lead.id, { status: newStatus });
                                                }}
                                                onBlur={handleExplicitSave}
                                                className="w-full p-2.5 text-sm font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg border border-primary-200 dark:border-primary-800 focus:ring-2 focus:ring-primary-500"
                                            >
                                                {COLUMNS.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div><label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Contato da empresa</label><input type="text" placeholder="Primeiro contato" value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} onBlur={handleExplicitSave} className="w-full p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div>
                                        <div><label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Gatekeeper</label><input type="text" placeholder="Filtro (Ex: Recepcionista)" value={formData.gatekeeperName} onChange={e => setFormData({ ...formData, gatekeeperName: e.target.value })} onBlur={handleExplicitSave} className="w-full p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Prestador</label>
                                            <input
                                                type="text"
                                                placeholder="Quem vai prestar o serviço"
                                                value={formData.providerName}
                                                onChange={e => setFormData({ ...formData, providerName: e.target.value })}
                                                onBlur={handleExplicitSave}
                                                className="w-full p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white"
                                                title="No caso de agências que prospectam para parceiros"
                                            />
                                        </div>
                                    </div>

                                     <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        <div className="md:col-span-2"><label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">E-mail</label><div className="relative"><Mail className="absolute left-2.5 top-3 w-4 h-4 text-zinc-400" /><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} onBlur={handleExplicitSave} placeholder="contato@" className="w-full pl-9 p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div></div>
                                        <div className="md:col-span-3">
                                            <div className="flex justify-between items-end mb-1">
                                                <label className="block text-[10px] font-bold text-zinc-500 uppercase">WhatsApp e Links</label>
                                                <button type="button" onClick={() => setIsEditingLinks(!isEditingLinks)} className="text-[10px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1 uppercase transition-colors">
                                                    {isEditingLinks ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                                                    {isEditingLinks ? 'Concluir' : 'Editar links'}
                                                </button>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <div className="relative flex-1">
                                                    {isPhoneValid ? (
                                                        <a
                                                            href={getWhatsAppLink(formData.phone) || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="absolute left-2.5 top-3 w-4 h-4 text-green-500 hover:text-green-600 transition-colors z-10"
                                                            title="Abrir no WhatsApp"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </a>
                                                    ) : (
                                                        <MessageCircle className="absolute left-2.5 top-3 w-4 h-4 text-zinc-400 z-10" />
                                                    )}
                                                    <input type="text" maxLength={15} value={formData.phone} onChange={handlePhoneChange} onBlur={handleExplicitSave} className="w-full pl-9 p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white relative" />
                                                </div>
                                                
                                                <div className="flex items-center gap-1">
                                                    {/* Maps */}
                                                    {isEditingLinks ? (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setCustomPrompt({
                                                                    field: 'googleMapsLink',
                                                                    title: 'Editar Maps',
                                                                    placeholder: 'Link do Maps (em branco p/ remover)',
                                                                    value: formData.googleMapsLink === 'N/A' ? '' : formData.googleMapsLink
                                                                });
                                                            }}
                                                            className="p-2.5 bg-primary-50 dark:bg-primary-900/20 border border-dashed border-primary-400 dark:border-primary-700 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-colors" title="Editar link do Google Maps"
                                                        >
                                                            <MapPin className="w-4 h-4" />
                                                        </button>
                                                    ) : formData.googleMapsLink && formData.googleMapsLink !== 'N/A' ? (
                                                        <a href={formData.googleMapsLink.startsWith('http') ? formData.googleMapsLink : `https://${formData.googleMapsLink}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-red-500 text-zinc-600 dark:text-zinc-400 hover:text-red-500 transition-colors" title="Acessar Google Maps">
                                                            <MapPin className="w-4 h-4" />
                                                        </a>
                                                    ) : (
                                                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg opacity-50 cursor-not-allowed" title="Google Maps não informado">
                                                            <MapPin className="w-4 h-4 text-zinc-400" />
                                                        </div>
                                                    )}

                                                    {/* Site */}
                                                    {isEditingLinks ? (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setCustomPrompt({
                                                                    field: 'website',
                                                                    title: 'Editar Site',
                                                                    placeholder: 'Ex: beleads.com.br (em branco p/ remover)',
                                                                    value: formData.website === 'N/A' ? '' : formData.website
                                                                });
                                                            }}
                                                            className="p-2.5 bg-primary-50 dark:bg-primary-900/20 border border-dashed border-primary-400 dark:border-primary-700 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-colors" title="Editar Site"
                                                        >
                                                            <Globe className="w-4 h-4" />
                                                        </button>
                                                    ) : formData.website && formData.website !== 'N/A' ? (
                                                        <a href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-primary-500 text-zinc-600 dark:text-zinc-400 hover:text-primary-500 transition-colors" title="Acessar Site">
                                                            <Globe className="w-4 h-4" />
                                                        </a>
                                                    ) : (
                                                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg opacity-50 cursor-not-allowed" title="Site não informado">
                                                            <Globe className="w-4 h-4 text-zinc-400" />
                                                        </div>
                                                    )}

                                                    {/* Instagram */}
                                                    {isEditingLinks ? (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setCustomPrompt({
                                                                    field: 'instagram',
                                                                    title: 'Editar Instagram',
                                                                    placeholder: 'Ex: @empresa (em branco p/ remover)',
                                                                    value: formData.instagram === 'N/A' ? '' : formData.instagram
                                                                });
                                                            }}
                                                            className="p-2.5 bg-primary-50 dark:bg-primary-900/20 border border-dashed border-primary-400 dark:border-primary-700 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-colors" title="Editar Instagram"
                                                        >
                                                            <Instagram className="w-4 h-4" />
                                                        </button>
                                                    ) : formData.instagram && formData.instagram !== 'N/A' ? (
                                                        <a href={formData.instagram.startsWith('http') ? formData.instagram : `https://instagram.com/${formData.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-pink-500 text-zinc-600 dark:text-zinc-400 hover:text-pink-500 transition-colors" title="Acessar Instagram">
                                                            <Instagram className="w-4 h-4" />
                                                        </a>
                                                    ) : (
                                                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg opacity-50 cursor-not-allowed" title="Instagram não informado">
                                                            <Instagram className="w-4 h-4 text-zinc-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bloco 2: Negociação */}
                                <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Valor</label>
                                            <div className="relative"><span className="absolute left-2.5 top-2.5 text-zinc-400 font-bold text-xs">R$</span><input type="text" value={priceInput} onChange={handlePriceChange} onBlur={handleExplicitSave} className="w-full pl-8 p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white font-bold" /></div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Prioridade</label>
                                            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as any })} onBlur={handleExplicitSave} className="w-full p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white">
                                                <option value="low">Baixa</option>
                                                <option value="medium">Média</option>
                                                <option value="high">Alta 🔥</option>
                                            </select>
                                        </div>
                                        <div><label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> Notificar</label><input type="date" value={formData.notifyAt ? formData.notifyAt.split('T')[0] : ''} onChange={e => setFormData({ ...formData, notifyAt: e.target.value ? new Date(e.target.value).toISOString() : '' })} onBlur={handleExplicitSave} className="w-full p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">notas iniciais</label>
                                        <textarea rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} onBlur={handleExplicitSave} className="w-full p-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white resize-none" placeholder="Detalhes da negociação..."></textarea>
                                    </div>

                                    {lead.cnpj && (
                                        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/20 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                                        <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-current" />
                                                    </div>
                                                    <h4 className="text-[11px] font-black text-amber-950 dark:text-amber-400 uppercase tracking-wider">
                                                        Dados Oficiais Enriquecidos
                                                    </h4>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const promptText = `Você é um estrategista de vendas B2B e BDR Sênior especializado em prospecção. 
Seu objetivo é montar um guia de contexto rápido para auxiliar na abordagem comercial desta empresa.

Serviço que será ofertado nessa abordagem: Assessoria completa de marketing digital: geração de leads, estruturação do processo comercial e retenção de clientes, do primeiro contato até a recompra.

 — 

Empresa prospectada:

Nome: ${formData.name || 'N/A'}
Nicho: ${formData.category || 'N/A'}
CNPJ: ${lead.cnpj || 'N/A'}
Sócios: ${lead.socios && lead.socios.length > 0 ? lead.socios.join(', ') : 'N/A'}
Endereço: ${lead.address || 'N/A'}
Site: ${lead.website && lead.website !== 'N/A' ? lead.website : 'N/A'}
Instagram: ${lead.instagram || 'N/A'}

Faça uma pesquisa rápida na web para encontrar informações reais sobre a presença digital dessa empresa. Se encontrar site ou Instagram real, inclua o link. Não invente dados — se não encontrar, diga que não encontrou.

Gere exatamente este guia, nesta ordem, sempre considerando o serviço que será ofertado para personalizar o contexto, as lacunas e a abordagem:

---

1. CONTEXTO DA EMPRESA
O que essa empresa faz, em até 2 frases diretas. Se for profissional liberal (advogado, médico, dentista, corretor), descreve o perfil de atuação típico do segmento.

2. PRESENÇA DIGITAL ATUAL
O que foi encontrado: site, Instagram, Google Meu Negócio, avaliações. Se não tem presença, diga explicitamente. Não encha com suposições.

3. LACUNAS IDENTIFICADAS
2 pontos concretos onde essa empresa provavelmente tem oportunidade de melhoria — com base no segmento, no que foi encontrado e no Método AVR. Foco em: visibilidade, geração de leads previsível, processo de atendimento ou recorrência de clientes. Seja específico, não genérico.

4. PERGUNTAS DE DIAGNÓSTICO
2 perguntas curtas para fazer ao decisor no início da ligação. Objetivo: entender a situação atual dele antes de falar qualquer coisa sobre a Benck. Inspire-se em: "Como os seus clientes chegam até você hoje?" e "Você tem alguma ação ativa para gerar novos contatos toda semana?" — adapte conforme o segmento e as lacunas identificadas.

5. ABERTURA PARA LIGAÇÃO (30 segundos)
Frase de abertura direta, sem enrolação. Deve: identificar quem é, mencionar o segmento dele, e abrir com uma pergunta ou observação que gera curiosidade. Tom: consultivo, não de vendedor. Evite frases como "tenho uma proposta incrível".

6. MENSAGEM DE WHATSAPP
Mensagem curta (máximo 3 linhas). Deve parecer escrita por um humano, não por um robô. Objetivo: gerar uma resposta, não fechar venda. Sem emojis em excesso. Sem enrolação, Sem parecer algo genérico ou copia e cola. Pode ser uma cadência de até 3 mensagens. 

---

Formato final: tópicos curtos, sem texto longo, porém um conteúdo de valor. 
O BDR vai ler isso em 2 minutos antes de ligar.`;
                                                        navigator.clipboard.writeText(promptText);
                                                        toast.success('Contexto copiado! Abrindo ChatGPT...');
                                                        window.open('https://chatgpt.com/', '_blank');
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold border border-amber-200/60 dark:border-amber-700/40 hover:bg-amber-50 dark:hover:bg-zinc-700 transition-colors shadow-sm cursor-pointer active:scale-95"
                                                    title="Copiar informações da empresa e abrir no ChatGPT para gerar abordagem comercial"
                                                >
                                                    <Bot className="w-4 h-4 text-primary-500" />
                                                    <span>Gerar contexto</span>
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50 flex flex-col justify-between">
                                                    <div>
                                                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">CNPJ Oficial</span>
                                                        <div className="mt-0.5">
                                                            <span 
                                                                className="text-xs font-black text-zinc-700 dark:text-zinc-300 font-mono cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                                                title="Clique para copiar CNPJ limpo"
                                                                onClick={() => {
                                                                    const cleanedCnpj = lead.cnpj!.replace(/\D/g, '');
                                                                    navigator.clipboard.writeText(cleanedCnpj);
                                                                    toast.success('CNPJ limpo copiado!');
                                                                }}
                                                            >
                                                                {lead.cnpj}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <a 
                                                            href="https://cnpjaberto.com.br/"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700 text-[8px] font-bold text-zinc-500 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                                                            title="Copiar CNPJ limpo e pesquisar no CNPJAberto"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const cleanedCnpj = lead.cnpj!.replace(/\D/g, '');
                                                                navigator.clipboard.writeText(cleanedCnpj);
                                                                toast.success('CNPJ copiado! Buscando no CNPJ Aberto...');
                                                            }}
                                                        >
                                                            CNPJ Aberto <ExternalLink className="w-2 h-2" />
                                                        </a>
                                                        <a 
                                                            href="https://www.teiacnpj.com.br/"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700 text-[8px] font-bold text-zinc-500 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                                                            title="Copiar CNPJ limpo e pesquisar no TeiaCNPJ"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const cleanedCnpj = lead.cnpj!.replace(/\D/g, '');
                                                                navigator.clipboard.writeText(cleanedCnpj);
                                                                toast.success('CNPJ copiado! Buscando no TeiaCNPJ...');
                                                            }}
                                                        >
                                                            TeiaCNPJ <ExternalLink className="w-2 h-2" />
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50 flex flex-col">
                                                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">E-mail Oficial</span>
                                                    {lead.email ? (
                                                        <a href={`mailto:${lead.email}`} className="text-xs font-black text-primary-600 dark:text-primary-400 hover:underline mt-0.5 truncate" title={`Enviar e-mail para ${lead.email}`}>
                                                            {lead.email}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-zinc-400 dark:text-zinc-500 italic mt-0.5">Não localizado</span>
                                                    )}
                                                </div>
                                            </div>

                                            {lead.socios && lead.socios.length > 0 && (
                                                <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                                                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block mb-1.5">
                                                        Quadro de Sócios e Administradores ({lead.socios.length})
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {lead.socios.map((socio, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                                                                {socio}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Lado Direito: Cockpit BDR */}
                        <div className="w-full lg:w-96 bg-white dark:bg-zinc-900 border-t lg:border-t-0 p-4 pb-4 lg:p-6 lg:pb-6 flex flex-col relative shrink-0">
                            <button onClick={onClose} className="hidden lg:flex absolute top-4 right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors z-20"><X className="w-5 h-5 text-zinc-400" /></button>
                            <BDRCockpit
                                lead={lead}
                                dmName={formData.dmName}
                                onDMChange={handleDMChangeWithAutoSave}
                                onMeetingScheduled={(link) => {
                                    // Quando uma reunião é agendada no Cockpit, avisamos a Form e atualizamos o estado
                                    // Vamos colocar as notas sobre o link da reunião, caso não exista campo
                                    const noteAppend = `\n[Reunião Marcada: ${link}]`;
                                    setFormData(prev => {
                                        isDirtyRef.current = true;
                                        return {
                                            ...prev,
                                            notes: prev.notes + noteAppend
                                        };
                                    });
                                }}
                            />
                        </div>
                    </div>

                    {/* Rodapé: Ações do Modal (Sempre no fim de tudo) */}
                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 sticky bottom-0 z-20 mt-auto">
                        <button type="button" onClick={() => { onDelete(lead.id); onClose(); }} className="flex items-center gap-2 text-danger-500 hover:text-danger-700 font-medium px-4 py-2 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /> Excluir</button>
                        <div className="flex gap-2 items-center">

                            {/* Enrich button */}
                            {onEnrichLead && (
                                lead.cnpj ? (
                                    <div className="flex items-center gap-1.5 mr-2">
                                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
                                            <Zap className="w-3.5 h-3.5 fill-current" /> Enriquecido
                                        </span>
                                    </div>
                                ) : (plan && PLAN_HIERARCHY[plan] < PLAN_HIERARCHY.pro) ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            toast.error('O Enriquecimento de Leads é exclusivo para os planos Pro e Elite. Faça o upgrade para liberar!', {
                                                action: setActiveTab ? {
                                                    label: 'Ver Planos',
                                                    onClick: () => {
                                                        onClose();
                                                        setActiveTab('subscription');
                                                    }
                                                } : undefined,
                                                duration: 6000
                                            });
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-sm mr-2 cursor-pointer"
                                        title="Recurso exclusivo do plano PRO"
                                    >
                                        <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" /> Enriquecer ⚡ <span className="text-zinc-400 dark:text-zinc-500 font-normal text-[10px]">PRO</span>
                                    </button>
                                ) : enrichingLeadIds?.has(lead.id) ? (
                                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 mr-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...
                                    </span>
                                ) : failedEnrichmentAttempts && failedEnrichmentAttempts[lead.id] >= 2 ? (
                                    <button
                                        type="button"
                                        disabled={true}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 dark:bg-zinc-900/10 text-zinc-400 dark:text-zinc-500 font-bold rounded-xl text-xs border border-zinc-200 dark:border-zinc-800/50 cursor-not-allowed mr-2"
                                        title="Enriquecimento não encontrado após várias tentativas"
                                    >
                                        Dados não encontrados
                                    </button>
                                ) : failedEnrichmentAttempts && failedEnrichmentAttempts[lead.id] > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => onEnrichLead(lead.id)}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 font-bold rounded-xl text-xs border border-amber-400 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all active:scale-95 shadow-sm mr-2 animate-pulse"
                                        title="Falhou na primeira tentativa. Tente novamente!"
                                    >
                                        <Zap className="w-3.5 h-3.5 animate-bounce" /> Tentar novamente
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => onEnrichLead(lead.id)}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-bold rounded-xl text-xs border border-amber-300 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all active:scale-95 shadow-sm mr-2"
                                        title="Adicionar CNPJ, e-mail e sócios (1 crédito)"
                                    >
                                        <Zap className="w-3.5 h-3.5" /> Enriquecer ⚡ <span className="text-amber-500 dark:text-amber-600 font-normal text-[10px]">1 crédito</span>
                                    </button>
                                )
                            )}

                            <div className="flex items-center gap-2 mr-2 text-zinc-400 text-xs font-medium">
                                <Check className="w-3.5 h-3.5 text-success-500" /> Salvo automaticamente
                            </div>
                            <button type="button" onClick={onClose} className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
                                Fechar
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};