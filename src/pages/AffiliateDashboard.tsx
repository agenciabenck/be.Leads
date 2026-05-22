import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, DollarSign, Users, Link as LinkIcon, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';

interface AffiliateData {
    id: string;
    stripe_account_id: string | null;
    status: 'pending' | 'active' | 'restricted';
    total_earnings: number;
}

export default function AffiliateDashboard({ user }: { user: any }) {
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [affiliate, setAffiliate] = useState<AffiliateData | null>(() => {
        // Restore cached affiliate data keyed by user ID
        try {
            const cached = sessionStorage.getItem(`affiliate_${user?.id}_data`);
            return cached ? JSON.parse(cached) : null;
        } catch { return null; }
    });
    const [stats, setStats] = useState(() => {
        try {
            const cached = sessionStorage.getItem(`affiliate_${user?.id}_stats`);
            return cached ? JSON.parse(cached) : { clicks: 0, conversions: 0, pendingPayout: 0 };
        } catch { return { clicks: 0, conversions: 0, pendingPayout: 0 }; }
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        if (user) {
            fetchAffiliateData(cancelled);
        } else {
            setLoading(true);
        }

        return () => { cancelled = true; };
    }, [user]);

    // Auto-verify pending affiliates: when status is 'pending', silently check 
    // with Stripe via connect-affiliate to see if onboarding was completed
    useEffect(() => {
        if (!user || !affiliate || affiliate.status !== 'pending') return;

        let cancelled = false;
        const checkActivation = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session || cancelled) return;

                // Call connect-affiliate which now auto-activates if Stripe confirms
                await supabase.functions.invoke('connect-affiliate', {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });

                // Re-fetch affiliate data to pick up the status change
                if (!cancelled) {
                    await fetchAffiliateData(cancelled);
                }
            } catch (err) {
                console.warn('[Affiliate] Auto-check failed:', err);
            }
        };

        // Small delay to avoid racing with initial load
        const timer = setTimeout(checkActivation, 1500);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [user, affiliate?.status]);

    // Handle return from Stripe onboarding (?affiliate_setup=success)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('affiliate_setup') === 'success') {
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
            // Re-fetch to pick up activated status
            if (user) {
                fetchAffiliateData(false);
            }
        }
    }, [user]);


    const fetchAffiliateData = async (cancelled: boolean = false) => {
        try {
            if (!affiliate) setLoading(true);
            setStatsLoading(true);
            setFetchError(null);

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 10000)
            );

            const fetchPromise = Promise.all([
                supabase
                    .from('affiliates')
                    .select('*')
                    .eq('user_id', user?.id)
                    .maybeSingle(),
                supabase
                    .from('user_subscriptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('affiliate_ref', user?.id)
                    .in('status', ['active', 'trialing'])
            ]);

            const [affiliateRes, conversionsRes] = await Promise.race([fetchPromise, timeoutPromise]);

            // Don't update state if component was unmounted or user changed
            if (cancelled) return;

            if (affiliateRes.error) throw affiliateRes.error;
            if (conversionsRes.error) console.error('Error fetching conversions:', conversionsRes.error);

            const affiliateData = affiliateRes.data;
            const newStats = {
                clicks: (affiliateData as any)?.clicks_count || 0,
                conversions: conversionsRes.count || 0,
                pendingPayout: 0
            };

            setAffiliate(affiliateData);
            setStats(newStats);

            // Cache keyed by user ID for tab-switch persistence (prevents cross-account leaks)
            try {
                const cacheKey = `affiliate_${user?.id}`;
                if (affiliateData) sessionStorage.setItem(`${cacheKey}_data`, JSON.stringify(affiliateData));
                sessionStorage.setItem(`${cacheKey}_stats`, JSON.stringify(newStats));
            } catch { /* sessionStorage full — ignore */ }

        } catch (error: any) {
            if (cancelled) return; // Component unmounted — ignore

            // Silently ignore AbortError (caused by React StrictMode or fast tab switching)
            if (error?.name === 'AbortError' || error?.message?.includes('abort')) {
                console.warn('[Affiliate] Request aborted (component unmounted or re-rendered)');
                return;
            }
            if (error?.message === 'TIMEOUT') {
                console.warn('[Affiliate] Request timed out, showing cached/default state');
            } else {
                console.error('Error fetching affiliate data:', error);
                if (!affiliate) {
                    setFetchError('Erro ao carregar dados de parceiro: ' + (error.message || 'Erro desconhecido'));
                }
            }
        } finally {
            if (!cancelled) {
                setLoading(false);
                setStatsLoading(false);
            }
        }
    };

    const handleConnect = async () => {
        try {
            setIsConnecting(true);
            const { data, error } = await supabase.functions.invoke('connect-affiliate', {
                headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('URL not returned');
            }
        } catch (error: any) {
            // Silently ignore AbortError (component unmounted)
            if (error?.name === 'AbortError' || error?.message?.includes('abort')) {
                console.warn('[Affiliate] Connect request aborted');
                return;
            }
            console.error('Error connecting affiliate:', error);
            alert('Erro ao conectar: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setIsConnecting(false);
        }
    };

    const handleLoginToStripe = async () => {
        handleConnect();
    };

    const affiliateLink = `${window.location.origin}?ref=${user?.id}`;

    // Show skeletons only if we have NO data yet, but keep the structure
    const showInitialLoading = loading && !affiliate;

    return (
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Programa de parceiros</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie suas indicações e acompanhe seus ganhos em tempo real.</p>
                </div>
            </div>

            {fetchError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold">Problema ao carregar painel</h4>
                        <p className="text-sm opacity-90">{fetchError}</p>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {showInitialLoading ? (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center animate-pulse">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4" />
                        <div className="h-8 w-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-2" />
                        <div className="h-4 w-96 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
                    </div>
                </div>
            ) : !affiliate ? (
                <div className="space-y-6">
                    {/* Brand New — Never registered */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Comece a lucrar com sua rede
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4 text-sm md:text-base leading-relaxed">
                            Torne-se um parceiro oficial e receba comissões automáticas.
                            Sem burocracia, tudo integrado via Stripe.
                        </p>

                        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto mb-6">
                            <div className="p-3 md:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div className="font-bold text-xl md:text-2xl text-primary mb-1">20%</div>
                                <div className="text-[10px] md:text-xs font-semibold text-gray-500">Recorrente</div>
                            </div>
                            <div className="p-3 md:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div className="font-bold text-xl md:text-2xl text-green-500 mb-1">Grátis</div>
                                <div className="text-[10px] md:text-xs font-semibold text-gray-500">Adesão</div>
                            </div>
                            <div className="p-3 md:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div className="font-bold text-xl md:text-2xl text-emerald-500 mb-1">Stripe</div>
                                <div className="text-[10px] md:text-xs font-semibold text-gray-500">Pagamentos</div>
                            </div>
                        </div>

                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="px-8 py-3.5 bg-sidebar hover:bg-sidebar/90 text-white rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                        >
                            {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
                            Quero ser Parceiro
                        </button>
                    </div>

                    {/* Infographic Steps */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative group hover:border-primary/20 transition-all">
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-zinc-900">1</div>
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-3">
                                <LinkIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Cadastro rápido</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Ative seu painel em segundos.</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative group hover:border-primary/20 transition-all">
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-zinc-900">2</div>
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-3">
                                <Users className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Divulgação</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Compartilhe seu link exclusivo.</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative group hover:border-primary/20 transition-all">
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-zinc-900">3</div>
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-3">
                                <DollarSign className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Lucro recorrente</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Receba por assinaturas ativas.</p>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-zinc-400 text-center">Pagamentos processados com segurança pelo Stripe.</p>
                </div>
            ) : affiliate.status === 'pending' ? (
                <div className="space-y-6">
                    {/* Pending State — Registration started but not completed */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-blue-200 dark:border-blue-800/40 shadow-xl text-center relative overflow-hidden">
                        {/* Subtle gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-primary/5 dark:from-blue-900/10 dark:via-transparent dark:to-primary/5 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-50 dark:ring-blue-900/20">
                                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Cadastro em andamento
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-6 text-sm md:text-base leading-relaxed">
                                Você já iniciou seu cadastro como parceiro! Falta apenas concluir a verificação
                                da sua conta no Stripe para começar a receber comissões.
                            </p>

                            {/* Status timeline */}
                            <div className="max-w-md mx-auto mb-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Cadastro iniciado</p>
                                        <p className="text-xs text-gray-500">Conta criada com sucesso na plataforma</p>
                                    </div>
                                </div>
                                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 ml-4" />
                                <div className="flex items-center gap-3 mt-3">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-blue-300 dark:ring-blue-700 animate-pulse">
                                        <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Verificação pendente no Stripe</p>
                                        <p className="text-xs text-gray-500">Complete seus dados para ativar os pagamentos</p>
                                    </div>
                                </div>
                                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 ml-4" />
                                <div className="flex items-center gap-3 mt-3 opacity-40">
                                    <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                                        <DollarSign className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-gray-500">Pronto para receber</p>
                                        <p className="text-xs text-gray-400">Seu link será ativado automaticamente</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="px-8 py-3.5 bg-sidebar hover:bg-sidebar/90 text-white rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                            >
                                {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
                                Continuar cadastro no Stripe
                            </button>

                            <p className="text-xs text-gray-400 mt-4">
                                Você será redirecionado para o Stripe para finalizar a verificação.
                            </p>
                        </div>
                    </div>

                    {/* Progress cards */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative group hover:border-primary/20 transition-all">
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-zinc-900">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-3">
                                <LinkIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Cadastro iniciado</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Sua conta já foi criada.</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-blue-200 dark:border-blue-800/40 shadow-sm relative group hover:border-blue-300 transition-all ring-1 ring-blue-100 dark:ring-blue-900/20">
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-zinc-900 animate-pulse">!</div>
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-3">
                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-1">Verificação</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Finalize seus dados no Stripe.</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative group hover:border-primary/20 transition-all opacity-50">
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-zinc-900">3</div>
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-3">
                                <DollarSign className="w-5 h-5 text-zinc-400" />
                            </div>
                            <h3 className="font-bold text-zinc-400 mb-1">Lucro recorrente</h3>
                            <p className="text-xs text-zinc-400">Ativado após verificação.</p>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-zinc-400 text-center">Pagamentos processados com segurança pelo Stripe.</p>
                </div>
            ) : (
                // Active Dashboard State
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Link Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-zinc-400" />
                                Seu link de parceiro
                            </h3>
                            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                <code className="flex-1 block w-0 text-sm font-mono text-zinc-600 dark:text-zinc-300 truncate">
                                    {affiliateLink}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(affiliateLink);
                                        alert('Link copiado!');
                                    }}
                                    className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors text-primary font-medium text-sm"
                                >
                                    Copiar
                                </button>
                            </div>
                            <p className="text-sm text-zinc-500 mt-2">
                                Compartilhe este link. O cookie de rastreamento dura 30 dias.
                            </p>
                        </div>

                        {/* Account Status */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Status da conta</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="font-medium text-green-600 dark:text-green-400 capitalize">
                                        {affiliate.status === 'active' ? 'Ativo' :
                                            affiliate.status === 'restricted' ? 'Restrito' : affiliate.status}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-500">
                                    Sua conta Stripe está conectada e pronta para receber pagamentos.
                                </p>
                            </div>
                            <button
                                onClick={handleLoginToStripe}
                                className="mt-4 w-full py-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Acessar painel Stripe
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            icon={<Users className="w-6 h-6 text-blue-500" />}
                            label="Indicações ativas"
                            value={stats.conversions.toString()}
                            subtext="Assinaturas vigentes"
                        />
                        <StatCard
                            icon={<DollarSign className="w-6 h-6 text-green-500" />}
                            label="Ganhos totais"
                            value={`R$ ${affiliate.total_earnings?.toFixed(2).replace('.', ',') || '0,00'}`}
                            subtext="Desde o início"
                        />
                        <StatCard
                            icon={<LinkIcon className="w-6 h-6 text-emerald-500" />}
                            label="Cliques no link"
                            value={stats.clicks.toString()}
                            subtext="Visitantes únicos"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, subtext }: { icon: any, label: string, value: string, subtext: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-primary/20 transition-all group">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-zinc-500">{label}</p>
                    <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</h4>
                </div>
            </div>
            <p className="text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-2">
                {subtext}
            </p>
        </div>
    );
}
