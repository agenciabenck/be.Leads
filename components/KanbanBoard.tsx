import React, { useState } from 'react';
import { CRMLead, CRMStatus, CRMPriority } from '../types';
import { 
  Trash2, MessageCircle, Mail, FileText, Check, 
  Search, Phone, Briefcase, Trophy, XCircle, Flame, AlertCircle, Clock, DollarSign, Edit3, Tag, X, Save, Copy
} from 'lucide-react';

interface KanbanBoardProps {
  leads: CRMLead[];
  onStatusChange: (leadId: string, newStatus: CRMStatus) => void;
  onDelete: (leadId: string) => void;
  onUpdateLead: (leadId: string, updates: Partial<CRMLead>) => void;
  onDuplicate?: (lead: CRMLead) => void;
  readOnly?: boolean;
  goal?: number;
  onSetGoal?: (goal: number) => void;
  resetDay?: number;
}

// Configuração Visual das Colunas
const COLUMNS: { id: CRMStatus; label: string; color: string; border: string; icon: React.ReactNode }[] = [
  { id: 'prospecting', label: 'Prospecção', color: 'bg-zinc-500', border: 'border-zinc-200', icon: <Search className="w-4 h-4"/> },
  { id: 'contacted', label: 'Contato feito', color: 'bg-primary-500', border: 'border-primary-200', icon: <Phone className="w-4 h-4"/> },
  { id: 'negotiation', label: 'Negociação', color: 'bg-indigo-500', border: 'border-indigo-200', icon: <Briefcase className="w-4 h-4"/> },
  { id: 'won', label: 'Ganho', color: 'bg-success-500', border: 'border-success-200', icon: <Trophy className="w-4 h-4"/> },
  { id: 'lost', label: 'Perdido', color: 'bg-danger-500', border: 'border-danger-200', icon: <XCircle className="w-4 h-4"/> },
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

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, onStatusChange, onDelete, onUpdateLead, onDuplicate, readOnly = false, goal = 10000, onSetGoal, resetDay = 10 }) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragTargetColumn, setDragTargetColumn] = useState<CRMStatus | null>(null);
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null);
  
  // Estado para edição rápida de valor
  const [quickEditingId, setQuickEditingId] = useState<string | null>(null);
  const [quickEditValue, setQuickEditValue] = useState<string>('');

  // Estado para edição da meta
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');

  // Lógica de Ganho Mensal (Reset Dinâmico)
  const monthlyWonValue = leads
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
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: CRMStatus) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragTargetColumn !== columnId) {
        setDragTargetColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
  };

  const handleDrop = (e: React.DragEvent, targetStatus: CRMStatus) => {
    e.preventDefault();
    if (readOnly) return;
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      onStatusChange(id, targetStatus);
      setDraggedLeadId(null);
      setDragTargetColumn(null);
    }
  };

  // --- Quick Edit Logic ---
  const startQuickEdit = (e: React.MouseEvent, lead: CRMLead) => {
      e.stopPropagation(); 
      if (readOnly) return;
      setQuickEditingId(lead.id);
      const initialVal = lead.potentialValue ? lead.potentialValue.toFixed(2).replace('.',',') : '0,00';
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
      setTempGoal(goal.toFixed(2).replace('.',','));
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
      if(readOnly) return;
      
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
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    return `${days}d atrás`;
  };

  const getPriorityColor = (priority: CRMPriority) => {
      switch(priority) {
          case 'high': return 'text-danger-500 bg-danger-50 dark:bg-danger-900/20';
          case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
          default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      }
  };

  const getPriorityIcon = (priority: CRMPriority) => {
      switch(priority) {
          case 'high': return <Flame className="w-3 h-3"/>;
          case 'medium': return <AlertCircle className="w-3 h-3"/>;
          default: return <Clock className="w-3 h-3"/>;
      }
  };

  const getProgressMessage = (percent: number) => {
      if (percent >= 100) return "Parabéns! Meta atingida, continue fazendo um ótimo trabalho.";
      if (percent >= 75) return "Quase lá! Falta muito pouco para bater a meta.";
      if (percent >= 50) return "Ótimo ritmo! Você já chegou na metade do caminho.";
      if (percent >= 25) return "Bom começo! Continue focado nos resultados.";
      return "";
  };

  return (
    <div className="flex flex-col h-full">
        <style dangerouslySetInnerHTML={{__html: `
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
            <div className="mb-4 bg-app-cardLight dark:bg-app-cardDark rounded-xl p-4 flex items-center gap-6 border border-zinc-200 dark:border-zinc-700 relative overflow-hidden shadow-sm">
                
                <div className="flex-1">
                    <div className="flex justify-between mb-2 items-end">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                                Progresso mensal {isGoalReached && '🏆'}
                            </span>
                            {/* Mensagem Motivacional Dinâmica */}
                            {rawGoalProgress >= 25 && (
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 animate-in fade-in slide-in-from-left-2 hidden sm:inline-block">
                                    {getProgressMessage(rawGoalProgress)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-zinc-900 dark:text-white font-bold">
                                {Math.round(goalProgress)}%
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden relative">
                        <div 
                            className={`h-full transition-all duration-1000 rounded-full relative overflow-hidden ${isGoalReached ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-primary-500'}`} 
                            style={{ width: `${Math.min(goalProgress, 100)}%` }}
                        >
                            {/* Efeito de Shimmer/Brilho quando 100% */}
                            {isGoalReached && <div className="absolute inset-0 animate-shimmer-bg"></div>}
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 border-l border-zinc-200 dark:border-zinc-700 pl-6">
                    <div className="flex gap-4">
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 mb-0.5">Ganho (mês)</span>
                            <span className={`block text-lg font-bold ${isGoalReached ? 'text-success-600 dark:text-success-400' : 'text-primary-600 dark:text-primary-400'}`}>
                                R$ {monthlyWonValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 mb-0.5">Falta</span>
                            <span className="block text-lg font-bold text-zinc-400 dark:text-zinc-500">
                                R$ {missingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div onClick={startGoalEdit} className="cursor-pointer group relative pl-4 border-l border-zinc-200 dark:border-zinc-700">
                        <span className="block text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 mb-0.5">Meta mensal</span>
                        {isEditingGoal ? (
                            <div className="flex items-center gap-1 absolute top-4 right-0 bg-white dark:bg-zinc-800 shadow-lg p-1 rounded-lg z-10 border border-primary-200">
                                <span className="text-xs font-bold text-zinc-400 pl-1">R$</span>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={tempGoal}
                                    onChange={handleGoalChange}
                                    onBlur={() => setTimeout(saveGoal, 200)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                                    className="w-24 text-sm font-bold p-1 bg-transparent outline-none border-b border-primary-500 text-zinc-900 dark:text-white text-right"
                                />
                                <button onMouseDown={(e) => { e.preventDefault(); saveGoal(); }}><Check className="w-4 h-4 text-green-500"/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 rounded px-1 -ml-1 transition-colors">
                                <span className="block text-lg font-bold text-zinc-900 dark:text-white">R$ {goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <Edit3 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ... Rest of Kanban Board (Columns, Cards) ... */}
        <div className="flex h-full gap-6 overflow-x-auto pb-4 items-start select-none">
        {COLUMNS.map((column) => {
            const columnLeads = leads.filter((lead) => lead.status === column.id);
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
                className={`flex-shrink-0 w-80 flex flex-col h-full max-h-full rounded-2xl transition-all duration-300 ${specialEffectClass}`}
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
                        <DollarSign className="w-3 h-3"/>
                        <span>{totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-2 pb-10 scrollbar-thin">
                {columnLeads.map((lead) => (
                    <div
                    key={lead.id}
                    draggable={!readOnly}
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => !readOnly && setEditingLead(lead)}
                    className={`group relative bg-app-cardLight dark:bg-app-cardDark p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 transition-all duration-200 
                        ${readOnly ? 'cursor-default opacity-80' : 'cursor-grab hover:shadow-lg hover:-translate-y-1 hover:border-primary-300 dark:hover:border-primary-700'} 
                        ${draggedLeadId === lead.id ? 'opacity-40 border-dashed ring-2 ring-primary-400 rotate-2 scale-95' : ''}
                    `}
                    >
                        {!readOnly && (
                            <>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (onDuplicate) onDuplicate(lead); 
                                    }}
                                    className="absolute top-2 right-9 p-1.5 rounded-lg bg-white dark:bg-zinc-700 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-20 cursor-pointer"
                                    title="Duplicar"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onDelete(lead.id); 
                                    }}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white dark:bg-zinc-700 text-zinc-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/30 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-20 cursor-pointer"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}

                        <div className="flex justify-between items-start mb-3 pr-14">
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
                            </div>
                        </div>

                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-snug line-clamp-2 mb-2">{lead.name}</h4>
                        
                        <div className="mb-3 relative z-10" onClick={(e) => e.stopPropagation()}>
                            {quickEditingId === lead.id ? (
                                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-lg border border-primary-200 dark:border-primary-800 shadow-sm">
                                    <span className="text-xs font-bold text-zinc-400 pl-1">R$</span>
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={quickEditValue}
                                        onChange={handleQuickEditChange}
                                        onKeyDown={handleQuickEditKeyDown}
                                        className="w-full text-sm font-bold text-zinc-900 dark:text-white bg-transparent outline-none min-w-0"
                                    />
                                    <div className="flex gap-1">
                                        <button onMouseDown={(e) => { e.preventDefault(); saveQuickEdit(); }} className="p-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"><Check className="w-3.5 h-3.5" /></button>
                                        <button onMouseDown={cancelQuickEdit} className="p-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-500 dark:text-zinc-300 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ) : (
                                <div onClick={(e) => startQuickEdit(e, lead)} className={`inline-flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-lg transition-all ${!readOnly ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 group/value border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700' : ''}`}>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-zinc-400 font-medium text-xs">R$</span>
                                        <span className="font-bold text-zinc-700 dark:text-zinc-200 text-base tracking-tight">{lead.potentialValue ? lead.potentialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</span>
                                    </div>
                                    {!readOnly && <Edit3 className="w-3 h-3 text-zinc-300 opacity-0 group-hover/value:opacity-100 transition-opacity" />}
                                </div>
                            )}
                        </div>

                        {lead.notes && lead.notes.trim() !== '' && (
                            <div className="mb-3 p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                                <div className="flex items-start gap-1.5">
                                    <FileText className="w-3 h-3 text-zinc-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic leading-relaxed">{lead.notes}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
                            <div className="flex items-center gap-2">
                                {lead.tags && lead.tags.length > 0 && (
                                    <div className="flex -space-x-1">
                                        {lead.tags.slice(0,2).map((tag, i) => (
                                            <div key={i} className="w-2 h-2 rounded-full bg-primary-400 ring-1 ring-white dark:ring-zinc-800" title={tag}></div>
                                        ))}
                                        {lead.tags.length > 2 && <div className="w-2 h-2 rounded-full bg-zinc-300 ring-1 ring-white"></div>}
                                    </div>
                                )}
                                <span className="text-[10px] text-zinc-400 font-medium">{getRelativeTime(lead.updatedAt)}</span>
                            </div>
                            
                            <div className="flex gap-1">
                                {lead.phone && lead.phone !== 'N/A' && (
                                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${lead.phone.replace(/\D/g,'')}`, '_blank'); }} className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 text-zinc-400 hover:text-green-600 rounded-md transition-colors relative z-10"><MessageCircle className="w-3.5 h-3.5" /></button>
                                )}
                                {lead.email && (
                                    <button onClick={(e) => { e.stopPropagation(); window.open(`mailto:${lead.email}`, '_blank'); }} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-zinc-400 hover:text-blue-600 rounded-md transition-colors relative z-10"><Mail className="w-3.5 h-3.5" /></button>
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
                lead={editingLead} 
                onClose={() => setEditingLead(null)} 
                onSave={(id, updates) => {
                    onUpdateLead(id, updates);
                    setEditingLead(null);
                }}
                onDelete={onDelete}
            />
        )}
    </div>
  );
};

// --- Subcomponent: Edit Modal ---
const EditLeadModal = ({ lead, onClose, onSave, onDelete }: { lead: CRMLead, onClose: () => void, onSave: (id: string, data: Partial<CRMLead>) => void, onDelete: (id: string) => void }) => {
    // ... (Mantendo a modal de edição igual)
    const [formData, setFormData] = useState({
        name: lead.name,
        potentialValue: lead.potentialValue || 0,
        phone: lead.phone,
        email: lead.email || '',
        priority: lead.priority || 'medium',
        notes: lead.notes || '',
        tags: lead.tags ? lead.tags.join(', ') : ''
    });

    const [priceInput, setPriceInput] = useState(() => {
        return (lead.potentialValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const number = Number(raw) / 100;
        setPriceInput(number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setFormData(prev => ({...prev, potentialValue: number}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(lead.id, {
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) as string[],
            updatedAt: new Date().toISOString()
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/60" onClick={onClose}></div>
            <div className="bg-app-cardLight dark:bg-app-cardDark w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] animate-fade-in-up border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-primary-500"/>
                            Editar oportunidade
                        </h2>
                        <p className="text-sm text-zinc-500">ID: {lead.id.slice(0, 8)}...</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="w-5 h-5 text-zinc-500"/></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Nome da empresa</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Valor</label>
                                    <div className="relative"><span className="absolute left-3 top-3 text-zinc-400 font-bold text-xs">R$</span><input type="text" value={priceInput} onChange={handlePriceChange} className="w-full pl-9 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white font-bold" /></div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Prioridade</label>
                                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white">
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta 🔥</option>
                                    </select>
                                </div>
                            </div>
                            <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Tags (separadas por vírgula)</label><div className="relative"><Tag className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" /><input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="Ex: Quente, Indicação, SP" className="w-full pl-10 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Telefone / WhatsApp</label><div className="relative"><Phone className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" /><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div></div>
                            <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">E-mail</label><div className="relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" /><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contato@empresa.com" className="w-full pl-10 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white" /></div></div>
                            <div className="flex-1"><label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Notas & Observações</label><textarea rows={4} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary-500 dark:text-white resize-none" placeholder="Detalhes da negociação..."></textarea></div>
                        </div>
                    </div>
                </form>
                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 rounded-b-2xl">
                    <button type="button" onClick={() => { if(confirm('Tem certeza que deseja excluir este negócio?')) { onDelete(lead.id); onClose(); } }} className="flex items-center gap-2 text-danger-500 hover:text-danger-700 font-medium px-4 py-2 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /> Excluir</button>
                    <div className="flex gap-3"><button type="button" onClick={onClose} className="px-6 py-2.5 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors">Cancelar</button><button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-success-600 hover:bg-success-700 text-white font-bold rounded-xl shadow-lg shadow-success-500/20 flex items-center gap-2"><Save className="w-4 h-4" /> Salvar alterações</button></div>
                </div>
            </div>
        </div>
    );
};