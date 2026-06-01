import React, { useEffect, useState, useCallback } from 'react';
import {
    Handshake, DollarSign, TrendingUp, Zap, Copy, Check, Users,
    Clock, ChevronRight, ExternalLink, RefreshCw, AlertCircle,
    Wallet, ArrowDownToLine, QrCode, CreditCard, Sparkles
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';

// Always use the real Supabase URL for Edge Functions (not the dev proxy)
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL;

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface Commission {
    id: string;
    amount: number;
    original_amount: number;
    plan_id: string;
    billing_cycle: string;
    status: 'pending' | 'paid' | 'cancelled';
    created_at: string;
}

interface Payout {
    id: string;
    amount: number;
    pix_key: string;
    pix_key_type: string;
    status: 'requested' | 'processing' | 'paid' | 'rejected';
    notes: string | null;
    created_at: string;
}

interface AffiliateDashboardData {
    clicks_count: number;
    conversions_count: number;
    pending_balance: number;
    paid_balance: number;
    total_earnings: number;
    pix_key: string | null;
    pix_key_type: string | null;
    status: string;
    referral_link: string;
    user_id: string;
    commissions: Commission[];
    payouts: Payout[];
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const fmt = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const PIX_KEY_LABELS: Record<string, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    phone: 'Celular',
    random: 'Chave Aleatória'
};

const formatPixKey = (value: string, type: string) => {
    if (type === 'email' || type === 'random') return value;
    const clean = value.replace(/\D/g, '');
    if (type === 'cpf') {
        const val = clean.slice(0, 11);
        if (val.length <= 3) return val;
        if (val.length <= 6) return `${val.slice(0, 3)}.${val.slice(3)}`;
        if (val.length <= 9) return `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6)}`;
        return `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6, 9)}-${val.slice(9)}`;
    }
    if (type === 'cnpj') {
        const val = clean.slice(0, 14);
        if (val.length <= 2) return val;
        if (val.length <= 5) return `${val.slice(0, 2)}.${val.slice(2)}`;
        if (val.length <= 8) return `${val.slice(0, 2)}.${val.slice(2, 5)}.${val.slice(5)}`;
        if (val.length <= 12) return `${val.slice(0, 2)}.${val.slice(2, 5)}.${val.slice(5, 8)}/${val.slice(8)}`;
        return `${val.slice(0, 2)}.${val.slice(2, 5)}.${val.slice(5, 8)}/${val.slice(8, 12)}-${val.slice(12)}`;
    }
    if (type === 'phone') {
        const val = clean.slice(0, 11);
        if (val.length <= 2) return val.length > 0 ? `(${val}` : '';
        if (val.length <= 7) return `(${val.slice(0, 2)}) ${val.slice(2)}`;
        return `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    }
    return value;
};

const STATUS_COMMISSION: Record<string, { label: string; className: string }> = {
    pending:   { label: 'Pendente',   className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    paid:      { label: 'Pago',       className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    cancelled: { label: 'Cancelado',  className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const STATUS_PAYOUT: Record<string, { label: string; className: string }> = {
    requested:  { label: 'Solicitado',  className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    processing: { label: 'Processando', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    paid:       { label: 'Pago',        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    rejected:   { label: 'Rejeitado',   className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

// ─────────────────────────────────────────────────────────
// API helper
// ─────────────────────────────────────────────────────────
const callFunction = async (fnName: string, body: object) => {
    // Always use getSession() — reliable, avoids legacy JWT format issues
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/functions/v1/${fnName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
    });

    let data: any;
    try {
        data = await res.json();
    } catch {
        throw new Error(`Erro ao processar resposta do servidor (HTTP ${res.status})`);
    }

    if (!res.ok || data?.error) {
        const msg = data?.message || data?.error || 'Erro inesperado';
        throw new Error(msg);
    }
    return data;
};

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
export default function AffiliateDashboard({ user }: { user: any }) {
    const [data, setData] = useState<AffiliateDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedType, setCopiedType] = useState<'landing' | 'checkout' | null>(null);
    const [activeTab, setActiveTab] = useState<'commissions' | 'payouts'>('commissions');
 
    // PIX form
    const [pixKey, setPixKey] = useState('');
    const [pixKeyType, setPixKeyType] = useState('cpf');
    const [savingPix, setSavingPix] = useState(false);
 
    // Payout form
    const [payoutAmount, setPayoutAmount] = useState('');
    const [requestingPayout, setRequestingPayout] = useState(false);
    const [showPayoutForm, setShowPayoutForm] = useState(false);
 
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await callFunction('affiliate-dashboard', {});
            setData(result);
            if (result.pix_key) setPixKey(result.pix_key);
            if (result.pix_key_type) setPixKeyType(result.pix_key_type);
        } catch (err: any) {
            toast.error('Erro ao carregar dados: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, []);
 
    useEffect(() => { load(); }, [load]);
 
    const copyToClipboard = async (text: string, type: 'landing' | 'checkout') => {
        await navigator.clipboard.writeText(text);
        setCopiedType(type);
        toast.success('Link copiado com sucesso!');
        setTimeout(() => setCopiedType(null), 2000);
    };

    const savePix = async () => {
        if (!pixKey.trim()) { toast.error('Informe a chave PIX.'); return; }
        setSavingPix(true);
        try {
            await callFunction('affiliate-payout', { action: 'save_pix', pix_key: pixKey.trim(), pix_key_type: pixKeyType });
            toast.success('Chave PIX salva!');
            load();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSavingPix(false);
        }
    };

    const requestPayout = async () => {
        const amount = parseFloat(payoutAmount.replace(',', '.'));
        if (!amount || amount < 100) { toast.error('Valor mínimo é R$ 100,00.'); return; }
        if (!data?.pix_key) { toast.error('Configure sua chave PIX primeiro.'); return; }
        setRequestingPayout(true);
        try {
            await callFunction('affiliate-payout', {
                action: 'request_payout',
                amount,
                pix_key: data.pix_key,
                pix_key_type: data.pix_key_type
            });
            toast.success('Saque solicitado! Em breve você receberá o PIX.');
            setPayoutAmount('');
            setShowPayoutForm(false);
            load();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setRequestingPayout(false);
        }
    };

    // ── Loading skeleton ──────────────────────────────────
    if (loading) {
        return (
            <div className="w-full space-y-6 pb-10 animate-pulse">
                <div className="h-48 rounded-3xl bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-32 rounded-3xl bg-zinc-100 dark:bg-zinc-800" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />)}
                </div>
            </div>
        );
    }

    const pendingBalance = data?.pending_balance ?? 0;
    const canRequestPayout = pendingBalance >= 100;

    return (
        <div className="w-full space-y-6 pb-10 animate-in fade-in duration-500 font-sans">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* ── Hero Header ───────────────────────────────── */}
                <div className="lg:col-span-8 relative overflow-hidden rounded-3xl bg-sidebar text-white border border-white/5 p-8 md:p-10 shadow-xl flex flex-col justify-center">
                    <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5 blur-[100px] pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/[0.02] blur-[80px] pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between h-full">
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg shadow-black/10 mb-5">
                                <Handshake className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
                                Programa de <span className="text-primary">afiliados</span>
                            </h1>
                            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-xl">
                                Ganhe <strong className="text-white font-black">15% recorrente</strong> em comissões sobre cada renovação mensal ou anual de todos os novos clientes indicados pelo seu link exclusivo. Indique hoje mesmo, aumente seu faturamento passivo e acompanhe tudo em tempo real!
                            </p>
                        </div>

                        {/* Saldo em destaque */}
                        <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-3xl p-8 min-w-[260px] text-center flex flex-col justify-center shadow-lg shadow-black/10">
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Saldo disponível</p>
                            <p className="text-4xl md:text-5xl font-black text-white leading-none tracking-tight">{fmt(pendingBalance)}</p>
                            <button
                                onClick={() => setShowPayoutForm(v => !v)}
                                disabled={!canRequestPayout}
                                className={`mt-5 w-full text-sm font-bold py-3 px-4 rounded-xl transition-all ${
                                    canRequestPayout
                                        ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25'
                                        : 'bg-white/5 text-zinc-400 border border-white/5 cursor-not-allowed'
                                }`}
                            >
                                Solicitar saque
                            </button>
                            <p className="text-[10px] text-white/50 mt-3 font-medium animate-pulse">Saque mínimo: R$ 100,00</p>
                        </div>
                    </div>
                </div>

                {/* ── Stats Grid (Bento columns) ───────────────── */}
                <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                    {[
                        { icon: Users,       label: 'Cliques',      value: data?.clicks_count ?? 0,      prefix: '' },
                        { icon: TrendingUp,  label: 'Conversões',   value: data?.conversions_count ?? 0, prefix: '' },
                        { icon: Clock,       label: 'Pendente',     value: data?.pending_balance ?? 0,   prefix: 'R$', isCurrency: true },
                        { icon: DollarSign,  label: 'Total ganho',  value: data?.total_earnings ?? 0,    prefix: 'R$', isCurrency: true },
                    ].map(({ icon: Icon, label, value, isCurrency }) => (
                        <div key={label} className="bg-white dark:bg-app-cardDark border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-2 shadow-sm">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-none mb-1">{label}</p>
                                <p className="text-lg font-black text-zinc-900 dark:text-white">
                                    {isCurrency ? fmt(value as number) : value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Formulário de Saque ───────────────────────── */}
            {showPayoutForm && (
                <div className="bg-white dark:bg-app-cardDark border border-primary/20 rounded-2xl p-5 shadow-md">
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <ArrowDownToLine className="w-4 h-4 text-primary" />
                        Solicitar saque
                    </h3>
                    {!data?.pix_key ? (
                        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            Configure sua chave PIX abaixo antes de solicitar o saque.
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">
                                    Valor (R$) <span className="text-[11px] font-normal text-amber-500 dark:text-amber-400 ml-1">(Saque mínimo de R$ 100,00)</span>
                                </label>
                                <input
                                    type="number"
                                    value={payoutAmount}
                                    onChange={e => setPayoutAmount(e.target.value)}
                                    placeholder={`Máx. ${fmt(pendingBalance)}`}
                                    min={100}
                                    max={pendingBalance}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="sm:mt-5">
                                <button
                                    onClick={requestPayout}
                                    disabled={requestingPayout}
                                    className="w-full sm:w-auto bg-primary text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-primary/90 transition disabled:opacity-60"
                                >
                                    {requestingPayout ? 'Enviando...' : 'Confirmar saque via PIX'}
                                </button>
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-zinc-400 mt-3">
                        PIX configurado: <strong>{data?.pix_key || '—'}</strong> ({PIX_KEY_LABELS[data?.pix_key_type || ''] || data?.pix_key_type})
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* ── Links de Referência (lg:col-span-8) ───────── */}
                <div className="lg:col-span-8 bg-white dark:bg-app-cardDark border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-primary" />
                            Seu link de afiliado
                        </h3>
                        {(() => {
                            const checkoutLink = data?.referral_link || `https://beleadly.com.br/checkout?ref=${user?.id}`;
                            const landingLink = checkoutLink.replace('/checkout', '');
                            return (
                                <div className="flex flex-col gap-4">
                                    {/* Link da Página de Vendas */}
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wider">
                                            Página de Vendas (Recomendado)
                                        </label>
                                        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3">
                                            <span className="flex-1 text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">
                                                {landingLink}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(landingLink, 'landing')}
                                                className="flex-shrink-0 flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition"
                                            >
                                                {copiedType === 'landing' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copiedType === 'landing' ? 'Copiado!' : 'Copiar'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Link de Cadastro Direto */}
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wider">
                                            Cadastro / Checkout Direto
                                        </label>
                                        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3">
                                            <span className="flex-1 text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">
                                                {checkoutLink}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(checkoutLink, 'checkout')}
                                                className="flex-shrink-0 flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition"
                                            >
                                                {copiedType === 'checkout' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copiedType === 'checkout' ? 'Copiado!' : 'Copiar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-4 leading-relaxed">
                        Compartilhe qualquer um dos links. Quando alguém assinar através deles, você ganha 15% de comissão de cada renovação.
                    </p>
                </div>

                {/* ── Configurar PIX (lg:col-span-4) ───────────── */}
                <div className="lg:col-span-4 bg-white dark:bg-app-cardDark border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" />
                            Chave PIX para receber
                        </h3>
                        <div className="flex flex-col gap-3">
                            {/* Caixa de seleção (permanece no topo esquerdo) */}
                            <div>
                                <select
                                    value={pixKeyType}
                                    onChange={e => {
                                        setPixKeyType(e.target.value);
                                        setPixKey(''); // Limpa o input ao trocar o tipo de chave
                                    }}
                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30 font-medium cursor-pointer"
                                >
                                    {Object.entries(PIX_KEY_LABELS).map(([val, label]) => (
                                        <option key={val} value={val} className="bg-white dark:bg-zinc-800">{label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Campo para digitar em baixo com máscara */}
                            <input
                                type="text"
                                value={pixKey}
                                onChange={e => setPixKey(formatPixKey(e.target.value, pixKeyType))}
                                placeholder={
                                    pixKeyType === 'cpf' ? '000.000.000-00' :
                                    pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                                    pixKeyType === 'phone' ? '(00) 00000-0000' :
                                    pixKeyType === 'email' ? 'Ex: seuemail@gmail.com' :
                                    'Chave aleatória'
                                }
                                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30"
                            />

                            {/* Botão de salvar abaixo */}
                            <button
                                onClick={savePix}
                                disabled={savingPix}
                                className="w-full bg-primary text-white font-bold text-xs py-2.5 rounded-xl hover:bg-primary/90 transition disabled:opacity-60 whitespace-nowrap"
                            >
                                {savingPix ? 'Salvando...' : 'Salvar PIX'}
                            </button>
                        </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-4 leading-relaxed flex flex-col gap-2">
                        {data?.pix_key ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1.5 rounded-xl w-max border border-emerald-500/10">
                                <Check className="w-3.5 h-3.5" /> Chave ativa: {PIX_KEY_LABELS[data.pix_key_type || ''] || data.pix_key_type} ({data.pix_key})
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-bold bg-zinc-100 dark:bg-zinc-800/50 px-2.5 py-1.5 rounded-xl w-max border border-zinc-200 dark:border-zinc-700/50">
                                <AlertCircle className="w-3.5 h-3.5 text-zinc-400" /> Nenhuma chave cadastrada
                            </span>
                        )}
                        <span>
                            Cadastre sua chave PIX. Os pagamentos das comissões solicitadas serão enviados diretamente para ela.
                        </span>
                    </p>
                </div>
            </div>

            {/* ── Histórico e Como Funciona ────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* ── Histórico: Comissões / Saques ────────────── */}
                <div className="lg:col-span-8 bg-white dark:bg-app-cardDark border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                        {/* Tab bar */}
                        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                            {(['commissions', 'payouts'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-3 text-xs font-bold transition-colors ${
                                        activeTab === tab
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    {tab === 'commissions' ? '💰 Comissões' : '🏦 Saques'}
                                </button>
                            ))}
                        </div>

                        {/* Commission list */}
                        {activeTab === 'commissions' && (
                            <div>
                                {!data?.commissions?.length ? (
                                    <EmptyState icon={DollarSign} text="Suas comissões aparecerão aqui quando seus indicados realizarem pagamentos." />
                                ) : (
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {data.commissions.map(c => {
                                            const s = STATUS_COMMISSION[c.status] || STATUS_COMMISSION.pending;
                                            return (
                                                <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white capitalize">
                                                            Plano {c.plan_id} — {c.billing_cycle === 'annual' ? 'Anual' : 'Mensal'}
                                                        </p>
                                                        <p className="text-xs text-zinc-400">{fmtDate(c.created_at)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-zinc-900 dark:text-white">{fmt(c.amount)}</p>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.className}`}>{s.label}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payouts list */}
                        {activeTab === 'payouts' && (
                            <div>
                                {!data?.payouts?.length ? (
                                    <EmptyState icon={Wallet} text="Suas solicitações de saque aparecerão aqui." />
                                ) : (
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {data.payouts.map(p => {
                                            const s = STATUS_PAYOUT[p.status] || STATUS_PAYOUT.requested;
                                            return (
                                                <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                                            Saque via PIX — {PIX_KEY_LABELS[p.pix_key_type] || p.pix_key_type}
                                                        </p>
                                                        <p className="text-xs text-zinc-400">{fmtDate(p.created_at)}</p>
                                                        {p.notes && <p className="text-xs text-zinc-500 mt-0.5 italic">{p.notes}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-zinc-900 dark:text-white">{fmt(p.amount)}</p>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.className}`}>{s.label}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer com refresh */}
                    <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-2.5 flex justify-end">
                        <button
                            onClick={load}
                            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Atualizar
                        </button>
                    </div>
                </div>

                {/* ── Como funciona? ───────────────────────────── */}
                <div className="lg:col-span-4 bg-white dark:bg-app-cardDark border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="mb-5">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Como funciona?</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-xs font-black flex items-center justify-center text-primary mt-0.5">1</span>
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-800 dark:text-white">Divulgue seu link</h4>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Compartilhe seu link exclusivo com amigos, clientes ou audiência.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-xs font-black flex items-center justify-center text-primary mt-0.5">2</span>
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-800 dark:text-white">Rastreado pra sempre</h4>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Mesmo se criarem uma conta gratuita primeiro, o vínculo com você é vitalício.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-xs font-black flex items-center justify-center text-primary mt-0.5">3</span>
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-800 dark:text-white">15% de recorrência</h4>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Receba 15% sobre a primeira mensalidade e sobre todas as renovações.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-xs font-black flex items-center justify-center text-primary mt-0.5">4</span>
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-800 dark:text-white">Receba via PIX</h4>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Solicite saques rápidos a partir de R$ 100,00 direto para sua chave cadastrada.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Icon className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">{text}</p>
        </div>
    );
}
