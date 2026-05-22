import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CRMActivity, CRMActivityType, CRMLead, CRMStatus } from '@/types/types';
import { crmActivitiesService } from '@/services/supabase';
import { Phone, MessageCircle, Instagram, Mail, UserCheck, CheckCircle2, Calendar, Clock, Loader2, Link as LinkIcon, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface BDRCockpitProps {
    lead: CRMLead;
    onMeetingScheduled: (meetingLink: string) => void;
    onDMChange?: (name: string) => void;
    dmName?: string;
}

export const BDRCockpit: React.FC<BDRCockpitProps> = ({ lead, onMeetingScheduled, onDMChange, dmName }) => {
    const [activities, setActivities] = useState<CRMActivity[]>(() => {
        const localKey = `beleadly_crm_activities_${lead.id}`;
        try {
            return JSON.parse(localStorage.getItem(localKey) || '[]');
        } catch {
            return [];
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isLogging, setIsLogging] = useState<CRMActivityType | null>(null);
    const [meetingLink, setMeetingLink] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);

    useEffect(() => {
        // Pre-load imediato do cache local quando o lead muda
        const localKey = `beleadly_crm_activities_${lead.id}`;
        try {
            setActivities(JSON.parse(localStorage.getItem(localKey) || '[]'));
        } catch {
            setActivities([]);
        }
        
        loadActivities();
    }, [lead.id]);

    const loadActivities = async () => {
        setIsLoading(true);
        try {
            const data = await crmActivitiesService.getActivitiesForLead(lead.id);
            setActivities(data);
        } catch (err) {
            console.error('[BDRCockpit] Erro ao carregar atividades:', err);
            toast.error('Erro ao carregar histórico de atividades.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogActivity = async (type: CRMActivityType, metadata?: any) => {
        setIsLogging(type);
        try {
            const newActivity = await crmActivitiesService.logActivity(lead.id, type, metadata);
            if (newActivity) {
                setActivities(prev => [newActivity, ...prev]);
                toast.success('Atividade registrada com sucesso!');
            } else {
                toast.error('Erro ao registrar atividade. Verifique o console ou sua conexão.');
            }
        } catch (err: any) {
            console.error('[BDRCockpit] Erro ao registrar atividade:', err);
            toast.error(`Erro ao registrar atividade: ${err.message || 'Tente novamente.'}`);
        } finally {
            setIsLogging(null);
        }
    };

    const handleScheduleMeeting = async () => {
        try {
            await handleLogActivity('meeting_scheduled', meetingLink.trim() ? { link: meetingLink.trim() } : undefined);
            if (meetingLink.trim()) {
                onMeetingScheduled(meetingLink.trim());
            }
            setMeetingLink('');
        } catch (err) {
            console.error('[BDRCockpit] Erro ao agendar reunião:', err);
        }
    };

    const handleReset = async () => {
        setShowResetModal(false);
        setIsLoading(true);
        const success = await crmActivitiesService.resetActivitiesForLead(lead.id);
        if (success) {
            setActivities([]);
            toast.success('Histórico resetado com sucesso!');
        } else {
            toast.error('Erro ao resetar histórico.');
        }
        setIsLoading(false);
    };

    // Calculate metrics
    const callTouches = activities.filter(a => a.activity_type === 'call').length;
    const wppTouches = activities.filter(a => a.activity_type === 'whatsapp').length;
    const instagramTouches = activities.filter(a => a.activity_type === 'instagram').length;
    const emailTouches = activities.filter(a => a.activity_type === 'email').length;

    const hasGatekeeperBypass = activities.some(a => a.activity_type === 'gatekeeper_bypassed');
    const hasDMConnection = activities.some(a => a.activity_type === 'dm_connected');
    const hasMeeting = activities.some(a => a.activity_type === 'meeting_scheduled');

    return (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 h-full flex flex-col">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    Painel de Ações
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />}
                </span>
                <button
                    onClick={() => setShowResetModal(true)}
                    title="Resetar Cockpit"
                    className="p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </h3>

            {/* Quick Touches */}
            <div className="mb-5">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Registro Rápido (Touches)</p>
                <div className="grid grid-cols-4 gap-2">
                    <button
                        onClick={() => handleLogActivity('call')}
                        className={`flex flex-col items-center justify-center p-2 border rounded-xl transition-colors shadow-sm group ${callTouches > 0 ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-primary-500 hover:text-primary-500'}`}
                        disabled={isLogging !== null}
                    >
                        {isLogging === 'call' ? <Loader2 className="w-4 h-4 animate-spin mb-1 text-primary-500" /> : <Phone className={`w-4 h-4 mb-1 ${callTouches > 0 ? 'text-primary-500' : 'text-zinc-400 group-hover:text-primary-500'}`} />}
                        <span className="text-[10px] font-bold">Ligar {callTouches > 0 && `(${callTouches})`}</span>
                    </button>
                    <button
                        onClick={() => handleLogActivity('whatsapp')}
                        className={`flex flex-col items-center justify-center p-2 border rounded-xl transition-colors shadow-sm group ${wppTouches > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-green-500 hover:text-green-500'}`}
                        disabled={isLogging !== null}
                    >
                        {isLogging === 'whatsapp' ? <Loader2 className="w-4 h-4 animate-spin mb-1 text-green-500" /> : <MessageCircle className={`w-4 h-4 mb-1 ${wppTouches > 0 ? 'text-green-500' : 'text-zinc-400 group-hover:text-green-500'}`} />}
                        <span className="text-[10px] font-bold">Whats {wppTouches > 0 && `(${wppTouches})`}</span>
                    </button>
                    <button
                        onClick={() => handleLogActivity('instagram')}
                        className={`flex flex-col items-center justify-center p-2 border rounded-xl transition-colors shadow-sm group ${instagramTouches > 0 ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-500 text-pink-600 dark:text-pink-400' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-pink-500 hover:text-pink-500'}`}
                        disabled={isLogging !== null}
                    >
                        {isLogging === 'instagram' ? <Loader2 className="w-4 h-4 animate-spin mb-1 text-pink-500" /> : <Instagram className={`w-4 h-4 mb-1 ${instagramTouches > 0 ? 'text-pink-500' : 'text-zinc-400 group-hover:text-pink-500'}`} />}
                        <span className="text-[10px] font-bold">Insta {instagramTouches > 0 && `(${instagramTouches})`}</span>
                    </button>
                    <button
                        onClick={() => handleLogActivity('email')}
                        className={`flex flex-col items-center justify-center p-2 border rounded-xl transition-colors shadow-sm group ${emailTouches > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-blue-500 hover:text-blue-500'}`}
                        disabled={isLogging !== null}
                    >
                        {isLogging === 'email' ? <Loader2 className="w-4 h-4 animate-spin mb-1 text-blue-500" /> : <Mail className={`w-4 h-4 mb-1 ${emailTouches > 0 ? 'text-blue-500' : 'text-zinc-400 group-hover:text-blue-500'}`} />}
                        <span className="text-[10px] font-bold">Email {emailTouches > 0 && `(${emailTouches})`}</span>
                    </button>
                </div>
                {(callTouches > 0 || wppTouches > 0 || instagramTouches > 0 || emailTouches > 0) && (
                    <div className="mt-3 flex flex-col gap-1.5 px-1">
                        {callTouches > 0 && <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary-500" /> {callTouches} {callTouches === 1 ? 'ligação feita' : 'ligações feitas'}</span>}
                        {wppTouches > 0 && <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5 text-green-500" /> {wppTouches} {wppTouches === 1 ? 'mensagem enviada' : 'mensagens enviadas'} por WhatsApp</span>}
                        {instagramTouches > 0 && <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><Instagram className="w-3.5 h-3.5 text-pink-500" /> {instagramTouches} {instagramTouches === 1 ? 'mensagem enviada' : 'mensagens enviadas'} por Instagram</span>}
                        {emailTouches > 0 && <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-blue-500" /> {emailTouches} {emailTouches === 1 ? 'email enviado' : 'emails enviados'}</span>}
                    </div>
                )}
            </div>

            {/* Sales Pipeline Micro-Conversions */}
            <div className="mb-5 space-y-2">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Avanço no funil</p>
                <button
                    onClick={() => !hasGatekeeperBypass && handleLogActivity('gatekeeper_bypassed')}
                    disabled={hasGatekeeperBypass || isLogging !== null}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-sm font-medium transition-colors ${hasGatekeeperBypass
                        ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-600 dark:text-success-400'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Filtro superado (Gatekeeper)
                    </div>
                    {hasGatekeeperBypass && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <button
                    onClick={() => !hasDMConnection && handleLogActivity('dm_connected')}
                    disabled={hasDMConnection || isLogging !== null}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-sm font-medium transition-colors ${hasDMConnection
                        ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-600 dark:text-success-400'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Conversou com o Decisor (Dono)
                    </div>
                    {hasDMConnection && <CheckCircle2 className="w-4 h-4" />}
                </button>
            </div>

            {/* Decisor (Destaque) */}
            <div className="mb-5 bg-primary-50/30 dark:bg-primary-900/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-900/30 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-primary-100/50 dark:bg-primary-900/20 rounded-full blur-2xl group-hover:bg-primary-200/50 transition-colors"></div>
                <label className="block text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    Nome do decisor
                </label>
                <input
                    type="text"
                    value={dmName || ''}
                    onChange={e => onDMChange?.(e.target.value)}
                    placeholder="Responsável pela empresa"
                    className="w-full p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-primary-200 dark:border-primary-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-sm font-bold placeholder:font-normal placeholder:text-zinc-400 outline-none transition-all shadow-inner"
                />
            </div>

            {/* Meeting Schedule */}
            {!hasMeeting ? (
                <div className="mt-auto">
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Agendamento</p>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleScheduleMeeting}
                            disabled={isLogging === 'meeting_scheduled'}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-sm font-medium transition-colors bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300`}
                        >
                            <div className="flex items-center gap-2">
                                {isLogging === 'meeting_scheduled' ? <Loader2 className="w-4 h-4 animate-spin text-zinc-500" /> : <Calendar className="w-4 h-4 text-zinc-500" />}
                                <span className={isLogging === 'meeting_scheduled' ? 'text-zinc-500' : 'text-zinc-700 dark:text-zinc-300'}>
                                    Reunião agendada
                                </span>
                            </div>
                        </button>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Link da reunião (Meet, Zoom...)"
                                value={meetingLink}
                                onChange={e => setMeetingLink(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-auto p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-xl">
                    <div className="flex items-center gap-2 text-success-600 dark:text-success-400 font-bold text-sm mb-1">
                        <Calendar className="w-4 h-4" /> Reunião Marcada!
                    </div>
                    {activities.find(a => a.activity_type === 'meeting_scheduled')?.metadata?.link && (
                        <a
                            href={activities.find(a => a.activity_type === 'meeting_scheduled')?.metadata?.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-500 hover:underline break-all"
                        >
                            {activities.find(a => a.activity_type === 'meeting_scheduled')?.metadata?.link}
                        </a>
                    )}
                </div>
            )}

            {/* Custom Reset Modal */}
            {showResetModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden animate-in zoom-in-95">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-white dark:ring-zinc-900">
                            <RotateCcw className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">Resetar histórico?</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
                            Tem certeza que deseja resetar todo o histórico de engajamento e avanços no funil deste lead? Essa ação não pode ser desfeita.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleReset}
                                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> Sim, resetar tudo
                            </button>
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="w-full py-3.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold rounded-2xl transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
