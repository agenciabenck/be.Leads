import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CRMLead, CRMActivity } from '@/types/types';
import { supabase } from '@/services/supabase';
import {
    TrendingUp, Users, UserCheck, Calendar, Activity,
    Target, Zap, Clock, ShieldCheck, ChevronRight, Download, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

interface CRMDashboardProps {
    leads: CRMLead[];
    goal: number;
    hasExportExcelAccess?: boolean;
    hasExportSheetsAccess?: boolean;
}

export const CRMDashboard: React.FC<CRMDashboardProps> = ({ leads, goal, hasExportExcelAccess = false, hasExportSheetsAccess = false }) => {
    const [activities, setActivities] = useState<CRMActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showExportModal, setShowExportModal] = useState(false);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        setIsLoading(true);
        try {
            // Obtém todas as atividades do usuário logado (RLS garante o escopo)
            const { data, error } = await supabase
                .from('crm_activities')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setActivities(data || []);
        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
            toast.error('Erro ao carregar métricas do CRM. Verifique sua conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Calculando Métricas do Funil de Esforço ---

    // 1. Quantos leads únicos receberam pelo menos um touch (call, wpp, email)
    const leadsContactedIds = new Set(
        activities
            .filter(a => ['call', 'whatsapp', 'instagram', 'email', 'generic_touch'].includes(a.activity_type))
            .map(a => a.lead_id)
    );
    const totalContacted = leadsContactedIds.size;

    // 2. Quantos gatekeepers foram superados (leads únicos)
    const gatekeepersBypassedIds = new Set(
        activities
            .filter(a => a.activity_type === 'gatekeeper_bypassed')
            .map(a => a.lead_id)
    );
    const totalBypassed = gatekeepersBypassedIds.size;

    // 3. Quantas DM foram conectadas (leads únicos)
    const dmsConnectedIds = new Set(
        activities
            .filter(a => a.activity_type === 'dm_connected')
            .map(a => a.lead_id)
    );
    const totalDMs = dmsConnectedIds.size;

    // 4. Quantas reuniões foram agendadas
    const meetingsScheduledIds = new Set(
        activities
            .filter(a => a.activity_type === 'meeting_scheduled')
            .map(a => a.lead_id)
    );
    const totalMeetings = meetingsScheduledIds.size;

    // --- KPIs ---
    const bypassRate = totalContacted > 0 ? Math.round((totalBypassed / totalContacted) * 100) : 0;
    const dmRate = totalBypassed > 0 ? Math.round((totalDMs / totalBypassed) * 100) : 0;
    const meetingRate = totalDMs > 0 ? Math.round((totalMeetings / totalDMs) * 100) : 0;

    // Overall Conversion from Contact -> Meeting
    const overallConversion = totalContacted > 0 ? Math.round((totalMeetings / totalContacted) * 100) : 0;

    // Ganho Atual x Meta (Gap)
    const monthlyWonValue = leads
        .filter(l => l.status === 'won')
        .reduce((acc, lead) => acc + (lead.potentialValue || 0), 0);
    const missingValue = Math.max(0, goal - monthlyWonValue);

    // Calculadora Automática (Quantos agendamentos/leads preciso pra bater a meta?)
    // Exemplo Simples: Se o ticket médio ganho for X, e a conversão de meeting para WON for Y...
    const wonLeads = leads.filter(l => l.status === 'won');
    let averageTicket = wonLeads.length > 0 ? monthlyWonValue / wonLeads.length : (goal / 10); // Dummy fallback
    if (averageTicket <= 0 || !isFinite(averageTicket)) {
        averageTicket = 1000; // safe fallback
    }

    // Estimativa de quantos WON faltam
    const neededWons = missingValue > 0 ? Math.ceil(missingValue / averageTicket) : 0;
    // Assumindo 30% de conversão de reunião pra WON pra cálculo ilustrativo, se não houver base.
    const estimatedWinRate = 0.3;
    const neededMeetings = Math.ceil(neededWons / estimatedWinRate);
    const neededContacts = overallConversion > 0 ? Math.ceil(neededMeetings / (overallConversion / 100)) : neededMeetings * 10;

    // --- Exportação ---
    const getEnrichedData = () => {
        return leads.map(lead => {
            const leadActivities = activities.filter(a => a.lead_id === lead.id);

            const countActivities = (type: string) => leadActivities.filter(a => a.activity_type === type).length;
            const callTouches = countActivities('call');
            const wppTouches = countActivities('whatsapp');
            const instagramTouches = countActivities('instagram');
            const emailTouches = countActivities('email');

            const totalTouches = leadActivities.filter(a => ['call', 'whatsapp', 'instagram', 'email', 'generic_touch'].includes(a.activity_type)).length;

            const touchesDetails = [];
            if (callTouches > 0) touchesDetails.push(`${callTouches} Ligação(ões)`);
            if (wppTouches > 0) touchesDetails.push(`${wppTouches} WhatsApp`);
            if (instagramTouches > 0) touchesDetails.push(`${instagramTouches} Insta`);
            if (emailTouches > 0) touchesDetails.push(`${emailTouches} Email(s)`);

            const bypassed = leadActivities.some(a => a.activity_type === 'gatekeeper_bypassed') ? 'Sim' : 'Não';
            const dmConnected = leadActivities.some(a => a.activity_type === 'dm_connected') ? 'Sim' : 'Não';
            const scheduled = leadActivities.some(a => a.activity_type === 'meeting_scheduled') ? 'Sim' : 'Não';

            const statusMap: Record<string, string> = {
                'lead': 'Lead',
                'prospecting': 'Prospectar',
                'contacted': 'Primeiro contato',
                'follow_up': 'Follow up',
                'negotiation': 'Negociação',
                'won': 'Ganho',
                'lost': 'Perdido'
            };

            return {
                'Nome Empresa': lead.name,
                'Status': statusMap[lead.status] || lead.status,
                'Nicho': lead.category,
                'Valor Potencial': lead.potentialValue ? `R$ ${lead.potentialValue}` : '',
                'Telefone': lead.phone,
                'Contato Empresa': lead.contactName || '',
                'Gatekeeper': lead.gatekeeperName || '',
                'Decisor': lead.dmName || '',
                'Prestador': lead.providerName || '',
                'CNPJ': lead.cnpj || '',
                'E-mail Oficial': lead.email || '',
                'Sócios': lead.socios ? lead.socios.join(', ') : '',
                'Touches totais': totalTouches,
                'Detalhe dos Touches': touchesDetails.join(' | ') || 'Nenhum',
                'Filtro superado?': bypassed,
                'DM conectado?': dmConnected,
                'Reunião agendada?': scheduled,
                'Notas': lead.notes?.replace(/\n/g, ' ') || ''
            };
        });
    };

    const handleExportCSV = () => {
        const data = getEnrichedData();
        if (data.length === 0) return toast.info('Nenhum dado para exportar.');

        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(header => {
            const val = String((item as any)[header] || '');
            if (val.includes(';') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }));

        const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `performance_bdr_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Relatório CSV exportado com sucesso!');
    };

    const handleExportSheets = () => {
        const data = getEnrichedData();
        if (data.length === 0) return toast.info('Nenhum dado para exportar.');

        const headers = Object.keys(data[0]);
        const text = data.map(item => headers.map(header => {
            const val = (item as any)[header] || '';
            // protect phone numbers in sheets
            if (header === 'Telefone') return `'${val}`;
            return val;
        }).join('\t')).join('\n');

        navigator.clipboard.writeText(headers.join('\t') + '\n' + text);
        setShowExportModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 font-medium">Analisando performance de prospecção...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-32 lg:pb-40 relative">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                            <Activity className="w-6 h-6 text-primary-500" />
                            Dashboard de performance
                        </h2>
                        <p className="text-zinc-500 mt-1">
                            Análise de esforço, taxas de conversão e velocidade de prospecção do seu time.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportCSV}
                            disabled={!hasExportExcelAccess}
                            className={`px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-sm flex items-center gap-2 transition ${!hasExportExcelAccess ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                            title={!hasExportExcelAccess ? "Disponível a partir do plano Start" : ""}
                        >
                            <Download className="w-4 h-4" /> CSV
                        </button>
                        <button
                            onClick={handleExportSheets}
                            disabled={!hasExportSheetsAccess}
                            className={`px-4 py-2 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl text-sm flex items-center gap-2 transition ${!hasExportSheetsAccess ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50'}`}
                            title={!hasExportSheetsAccess ? "Disponível a partir do plano Pro" : ""}
                        >
                            <FileSpreadsheet className="w-4 h-4" /> Exportar Sheets
                        </button>
                    </div>
                </div>

                {/* Top KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Leads abordados"
                        value={totalContacted.toString()}
                        trend="+12% essa semana"
                        icon={<Users className="w-5 h-5 text-blue-500" />}
                        color="bg-blue-50 dark:bg-blue-900/20"
                    />
                    <KPICard
                        title="Filtro superado"
                        value={`${bypassRate}%`}
                        subtitle="Passagem pela secretária (Gatekeeper)"
                        icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
                        color="bg-emerald-50 dark:bg-emerald-900/20"
                    />
                    <KPICard
                        title="Chegada no decisor"
                        value={`${dmRate}%`}
                        subtitle="Decisores alcançados após filtro"
                        icon={<UserCheck className="w-5 h-5 text-amber-500" />}
                        color="bg-amber-50 dark:bg-amber-900/20"
                    />
                    <KPICard
                        title="Conversão global"
                        value={`${overallConversion}%`}
                        subtitle="De abordagem até reunião"
                        icon={<Target className="w-5 h-5 text-primary-500" />}
                        color="bg-primary-50 dark:bg-primary-900/20"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Funil de Esforço (Effort Funnel) */}
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 dark:bg-primary-500/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />

                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                            <TrendingUp className="w-5 h-5 text-primary-500" />
                            Funil de esforço (micro-conversões)
                        </h3>

                        <div className="space-y-4 relative z-10">
                            <FunnelRow
                                label="Abordagens iniciais"
                                count={totalContacted}
                                max={totalContacted || 1}
                                color="bg-zinc-400"
                            />
                            <FunnelRow
                                label="Filtro superado"
                                count={totalBypassed}
                                max={totalContacted || 1}
                                color="bg-emerald-400"
                                conversion={bypassRate}
                            />
                            <FunnelRow
                                label="Conversa com decisor"
                                count={totalDMs}
                                max={totalContacted || 1}
                                color="bg-amber-400"
                                conversion={dmRate}
                            />
                            <FunnelRow
                                label="Reuniões marcadas"
                                count={totalMeetings}
                                max={totalContacted || 1}
                                color="bg-primary-500"
                                conversion={meetingRate}
                            />
                        </div>
                    </div>

                    {/* Gap de Meta & Velocity */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-zinc-900 to-black dark:from-zinc-800 dark:to-zinc-900 rounded-3xl p-6 shadow-xl border border-zinc-800 dark:border-zinc-700 relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 blur-2xl rounded-full -mr-10 -mt-10" />

                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" /> Calculadora de gap
                            </h3>

                            <div className="mb-6">
                                <p className="text-xs text-zinc-400 mb-1">Para bater a meta (falta R$ {missingValue.toLocaleString('pt-BR')}), você precisa de aproximadamente:</p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <span className="text-4xl font-black text-white">{neededWons}</span>
                                    <span className="text-sm text-zinc-400 font-medium">vendas</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex bg-white/5 rounded-xl p-3 items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-300">Reuniões necessárias</span>
                                    <span className="font-bold text-primary-400 text-lg">~ {neededMeetings}</span>
                                </div>
                                <div className="flex bg-white/5 rounded-xl p-3 items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-300">Novas abordagens</span>
                                    <span className="font-bold text-amber-400 text-lg">~ {neededContacts}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Pipeline Velocity
                            </h3>
                            <div className="flex items-end gap-3 mb-2">
                                <span className="text-3xl font-black text-zinc-900 dark:text-white">...</span>
                                <span className="text-sm text-zinc-500 mb-1 font-medium">dias</span>
                            </div>
                            <p className="text-xs text-zinc-500">
                                Tempo médio histórico desde a captura do lead até o status de Ganho. (Coleta de dados em andamento)
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal de Sheets */}
            {showExportModal && createPortal(
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[32px] shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden animate-in zoom-in-95">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-white dark:ring-zinc-900">
                            <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">Copiado!</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
                            Os dados de performance e micro-conversões foram copiados. Abra o Google Sheets e <span className="font-bold text-emerald-600 dark:text-emerald-500">Cole (Ctrl+V)</span> na célula <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md font-mono text-xs border border-zinc-200 dark:border-zinc-700">A1</span>.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => { setShowExportModal(false); window.open('https://sheets.new', '_blank'); }}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                            >
                                Abrir Planilha em Branco
                            </button>
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="w-full py-3.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold rounded-2xl transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// --- Subcomponentes ---

const KPICard = ({ title, value, subtitle, trend, icon, color }: any) => (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col group hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2.5 rounded-xl ${color} shadow-inner`}>
                {icon}
            </div>
        </div>
        <div>
            <span className="block text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{value}</span>
            <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mt-1 block">{title}</span>
            {trend && <span className="text-xs font-medium text-success-500 mt-2 block">{trend}</span>}
            {subtitle && <span className="text-xs font-medium text-zinc-400 mt-2 block">{subtitle}</span>}
        </div>
    </div>
);

const FunnelRow = ({ label, count, max, color, conversion }: { label: string, count: number, max: number, color: string, conversion?: number }) => {
    // Definir largura mínima de 5% para sempre aparecer
    let width = Math.max((count / max) * 100, 5);
    if (!count) width = 0; // Exceto se for 0 mesmo

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{label}</span>
                <div className="flex items-center gap-3">
                    {conversion !== undefined && (
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" /> {conversion}%
                        </span>
                    )}
                    <span className="text-lg font-black text-zinc-900 dark:text-white w-12 text-right">{count}</span>
                </div>
            </div>
            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${width}%` }}
                />
            </div>
        </div>
    );
};
