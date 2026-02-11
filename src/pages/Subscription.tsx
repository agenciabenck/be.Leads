import React, { useState } from 'react';
import { Check, X, BadgeCheck } from 'lucide-react';
import { UserSettings, UserPlan } from '@/types/types';
import { PLAN_HIERARCHY, STRIPE_PRICES, STRIPE_PRICES_ANNUAL } from '@/constants/appConstants';
import { createCheckoutSession, createPortalSession, getSubscriptionStatus, updateSubscription } from '@/services/payment';
import { UpgradeConfirmationModal } from '@/components/UpgradeConfirmationModal';
import { Toast } from '@/components/UXComponents';

interface SubscriptionProps {
    billingCycle: 'monthly' | 'annual';
    setBillingCycle: (v: 'monthly' | 'annual') => void;
    userSettings: UserSettings;
    handleCheckout: (planId: 'start' | 'pro' | 'elite', isAnnual: boolean) => Promise<void>;
}

const Subscription: React.FC<SubscriptionProps> = ({
    billingCycle,
    setBillingCycle,
    userSettings,
    handleCheckout: parentHandleCheckout, // Renamed to use internal logic
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeTarget, setUpgradeTarget] = useState<{ priceId: string; planName: string } | null>(null);
    const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

    const addToast = (t: { type: 'success' | 'error' | 'info'; title?: string; message: string }) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message: t.message, type: t.type }]);
        setTimeout(() => setToasts(prev => prev.filter(item => item.id !== id)), 5000);
    };

    const handleConfirmUpgrade = async () => {
        if (!upgradeTarget) return;
        setIsLoading(true);
        try {
            await updateSubscription(upgradeTarget.priceId);
            setIsUpgradeModalOpen(false);
            addToast({
                type: 'success',
                message: 'Plano atualizado com sucesso! Aproveite os novos recursos.'
            });
            // Reload page to reflect changes after a short delay
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            addToast({
                type: 'error',
                message: error.message || 'Erro ao atualizar plano.'
            });
            setIsLoading(false);
        }
    };

    const handleCheckout = async (planId: 'start' | 'pro' | 'elite', isAnnual: boolean) => {
        setIsLoading(true);
        try {

            // Determine if it's an upgrade
            const subscription = await getSubscriptionStatus();
            const isUpgrade = subscription && subscription.status === 'active' && subscription.plan_id !== 'free';

            // Calculate Price ID
            const priceId = isAnnual ? STRIPE_PRICES_ANNUAL[planId] : STRIPE_PRICES[planId];

            // Plan Name for display
            const planName = planId.charAt(0).toUpperCase() + planId.slice(1);

            if (isUpgrade) {
                // Open Custom Confirmation Modal
                setUpgradeTarget({ priceId, planName });
                setIsUpgradeModalOpen(true);
            } else {
                // New Checkout
                await createCheckoutSession(priceId, isAnnual);
            }
        } catch (error: any) {
            addToast({
                type: 'error',
                message: error.message || 'Tente novamente mais tarde.'
            });
        } finally {
            if (!isUpgradeModalOpen) setIsLoading(false);
        }
    };

    // ... [Rest of the component code identical to previous content, just updating the return]

    const planList = [
        {
            id: 'free',
            name: 'Free',
            headline: 'Indicado para começar e conhecer a plataforma.',
            priceMonthly: 0,
            priceAnnual: 0,
            credits: 50,
            features: ['50 buscas/mês', 'visualização básica'],
            missing: ['whatsapp click', 'exportar excel/sheets', 'crm completo', 'ia avançada'],
        },
        {
            id: 'start',
            name: 'Start',
            headline: 'Para quem está começando a prospectar ativamente.',
            priceMonthly: 57,
            priceAnnual: 547.20,
            credits: 500,
            features: ['500 créditos/mês', 'whatsapp click', 'exportar excel'],
            missing: ['exportar sheets', 'crm completo', 'ia avançada'],
        },
        {
            id: 'pro',
            name: 'Pro',
            headline: 'Para quem quer escalar vendas com organização.',
            priceMonthly: 87,
            priceAnnual: 835.20,
            credits: 1200,
            features: ['1.100 créditos/mês', 'whatsapp click', 'exportar excel', 'exportar sheets', 'crm completo'],
            missing: ['ia avançada'],
            popular: true,
        },
        {
            id: 'elite',
            name: 'Elite',
            headline: 'Poder máximo para grandes operações.',
            priceMonthly: 197,
            priceAnnual: 1891.20,
            credits: 3200,
            features: ['3.200 buscas/mês', 'whatsapp click', 'exportar excel', 'exportar sheets', 'crm completo', 'ia avançada', 'suporte prioritário'],
            missing: [],
        }
    ];

    return (
        <div className="animate-fade-in-up max-w-6xl mx-auto w-full pb-10 relative">
            {/* Toasts */}
            <div className="fixed top-4 right-4 z-[500] flex flex-col gap-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} id={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
                ))}
            </div>

            <UpgradeConfirmationModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onConfirm={handleConfirmUpgrade}
                isLoading={isLoading}
                newPlanName={upgradeTarget?.planName || ''}
                userName={userSettings.name}
            />

            <div className="mb-10">
                <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tighter">Planos</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">Escolha a melhor ferramenta para escalar suas vendas.</p>

                {/* Toggle Mensal/Anual & Banner - Alinhados em linha com mesmo gap dos planos */}
                <div className="flex flex-col lg:flex-row items-center justify-center gap-6 mb-12">
                    <div className="bg-white dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center shadow-sm relative group/toggle">
                        <button
                            onClick={() => {
                                if (userSettings.plan !== 'free' && userSettings.billingCycle === 'annual') return;
                                setBillingCycle('monthly');
                            }}
                            disabled={userSettings.plan !== 'free' && userSettings.billingCycle === 'annual'}
                            title={userSettings.plan !== 'free' && userSettings.billingCycle === 'annual' ? "Plano anual em vigência" : ""}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly'
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                } ${userSettings.plan !== 'free' && userSettings.billingCycle === 'annual'
                                    ? 'cursor-not-allowed opacity-50 hover:text-zinc-500'
                                    : 'cursor-pointer'
                                }`}
                        >
                            Mensal
                        </button>

                        {/* Tooltip personalizado para quando estiver bloqueado */}
                        {userSettings.plan !== 'free' && userSettings.billingCycle === 'annual' && (
                            <div className="hidden group-hover/toggle:block absolute -top-10 left-0 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50">
                                Plano anual em vigência
                                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-zinc-900 rotate-45"></div>
                            </div>
                        )}

                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'annual' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md' : 'text-zinc-500'}`}
                        >
                            Anual
                            <span className="bg-success-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                                20% OFF
                            </span>
                        </button>
                    </div>

                    <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm animate-fade-in">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 transition-all duration-300">
                            {billingCycle === 'monthly' ? '🚀' : '✨'}
                        </span>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all duration-300">
                            {billingCycle === 'monthly' ? (
                                <>Economize agora e garanta o melhor preço com o <span className="text-zinc-900 dark:text-white font-bold">plano anual</span></>
                            ) : (
                                <><span className="text-success-600 dark:text-success-400 font-bold">Desconto aplicado</span> com sucesso em todos os planos!</>
                            )}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {planList.map(plan => {
                        const currentLevel = PLAN_HIERARCHY[userSettings.plan];
                        const planLevel = PLAN_HIERARCHY[plan.id as UserPlan];

                        // Exact match: Same Plan AND Same Cycle
                        const isCurrentPlan = userSettings.plan === plan.id;
                        const isCurrentCycle = userSettings.billingCycle === billingCycle;
                        const isExactMatch = isCurrentPlan && isCurrentCycle;

                        // Logic:
                        // 1. Block Downgrade of Tiers
                        const isTierDowngrade = planLevel < currentLevel;

                        // 2. Block Cycle Downgrade
                        const isCycleDowngrade = userSettings.billingCycle === 'annual' && billingCycle === 'monthly';

                        // 3. Upgrade opportunities
                        const isDowngrade = isTierDowngrade || (isCurrentPlan && isCycleDowngrade);
                        const isCrossCycleUpgrade = isCurrentPlan && userSettings.billingCycle === 'monthly' && billingCycle === 'annual';

                        // Show popular on PRO if user is on Free or Start (Logic: highlight PRO for non-premium/low-tier users)
                        const showPopular = plan.id === 'pro' && (userSettings.plan === 'free' || userSettings.plan === 'start');
                        // Current Plan Logic
                        const isCurrentTier = userSettings.plan === plan.id;
                        // isExactMatch already defined

                        // Determine Badge Text
                        let badgeText = '';
                        if (isExactMatch) badgeText = 'Plano Atual';
                        else if (isCurrentTier) badgeText = userSettings.billingCycle === 'annual' ? 'Seu plano (Anual)' : 'Seu plano (Mensal)';

                        const showCurrentBadge = isCurrentTier; // Show badge for any card of the current tier

                        let cardStyle = 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800';

                        if (showPopular) {
                            cardStyle = 'bg-white dark:bg-zinc-900 border-success-500 ring-2 ring-success-500/20 scale-105 z-10';
                        } else if (showCurrentBadge) {
                            if (plan.id === 'free') {
                                cardStyle = 'bg-zinc-50 dark:bg-zinc-900 border-zinc-400 ring-1 ring-zinc-400 shadow-xl shadow-zinc-500/10 scale-[1.02]';
                            } else {
                                // Premium Plan Highlight
                                cardStyle = 'bg-gradient-to-br from-success-50/50 to-white dark:from-zinc-900 dark:to-zinc-800/50 border-success-500 ring-2 ring-success-500/40 shadow-2xl shadow-success-500/10 scale-[1.02] z-0';
                            }
                        }

                        // Button State Logic
                        let buttonText = 'Selecionar plano';
                        let buttonStyle = 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-95'; // Default Black
                        let isDisabled = false;

                        if (isExactMatch) {
                            buttonText = 'Plano atual';
                            // Gray for current plan
                            buttonStyle = 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default shadow-none';
                            isDisabled = true;
                        } else if (isCurrentTier) {
                            // User has this Tier but different cycle
                            if (isCycleDowngrade) {
                                buttonText = 'Seu plano é Anual';
                                // Gray for current plan variation
                                buttonStyle = 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default border border-zinc-300 dark:border-zinc-700';
                                isDisabled = true;
                            } else if (plan.id === 'free') {
                                // Free plan is always "Current" regardless of cycle view - NO upgrade to annual option
                                buttonText = 'Plano atual';
                                buttonStyle = 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default shadow-none';
                                isDisabled = true;
                            } else {
                                // Upgrade from Monthly to Annual (Cross Cycle)
                                buttonText = 'Mudar para anual';
                                // Default Black
                                buttonStyle = 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-95';
                            }
                        } else if (showCurrentBadge) {
                            // Fallback
                            buttonText = 'Plano atual';
                            buttonStyle = 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default shadow-none';
                            isDisabled = true;
                        } else if (isDowngrade) {
                            buttonText = 'Indisponível';
                            buttonStyle = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-50';
                            isDisabled = true;
                        } else if (isCrossCycleUpgrade) {
                            buttonText = 'Mudar para anual';
                            // Default Black
                        } else if (planLevel > currentLevel) {
                            buttonText = 'Selecionar plano';
                            // Default Black
                        }

                        // Override for Popular (Green)
                        if (showPopular && !showCurrentBadge && !isDowngrade) {
                            buttonStyle = 'bg-success-600 text-white hover:bg-success-700 shadow-lg shadow-success-500/20 active:scale-95';
                        }

                        return (
                            <div key={plan.id} className={`relative rounded-3xl p-5 border flex flex-col transition-all ${cardStyle} ${isDowngrade && !showCurrentBadge ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                                {showPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-success-500/30">Mais popular</div>}
                                {showCurrentBadge && (
                                    <div className="absolute top-2 right-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${plan.id === 'free' ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700' : 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300 border-success-200 dark:border-success-800'}`}>
                                            <BadgeCheck className="w-3 h-3" /> {badgeText}
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-col mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tighter">{plan.name}</h3>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed min-h-[32px] mb-3">
                                        {plan.headline}
                                    </p>

                                    <div className="flex flex-col">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold text-zinc-900 dark:text-white">R$</span>
                                            <span className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                                                {billingCycle === 'monthly'
                                                    ? plan.priceMonthly.toFixed(2).replace('.', ',')
                                                    : (plan.priceAnnual / 12).toFixed(2).replace('.', ',')
                                                }
                                            </span>
                                            <span className="text-sm text-zinc-400 font-medium">/mês</span>
                                        </div>

                                        {billingCycle === 'annual' && plan.id !== 'free' && (
                                            <div className="mt-1 flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-[10px] text-zinc-400 line-through">
                                                        R$ {plan.priceMonthly.toFixed(2).replace('.', ',')}/mês
                                                    </div>
                                                    <span className="text-[10px] font-bold text-success-600 dark:text-success-400">
                                                        Economia de 20% no anual
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-zinc-500 font-normal mt-2">
                                                    Pagamento único de R$ {plan.priceAnnual.toFixed(2).replace('.', ',')}/ano
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-b border-zinc-200 dark:border-zinc-700/50 mb-4" />

                                <ul className="space-y-1.5 mb-5 flex-1">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 lowercase">
                                            <Check className="w-3.5 h-3.5 text-success-500 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                    {plan.missing?.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-600 lowercase line-through">
                                            <X className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => !isDisabled && handleCheckout(plan.id as keyof typeof STRIPE_PRICES, billingCycle === 'annual')}
                                    disabled={isDisabled}
                                    className={`w-full py-3 rounded-xl font-bold transition-all text-sm ${buttonStyle}`}
                                >
                                    {buttonText}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Card Enterprise/Suporte - Compacto, Centralizado e Rounded-3xl */}
                <div className="mt-12 bg-zinc-900 dark:bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-zinc-900/20 max-w-2xl mx-auto">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Precisa de mais recursos?</h3>
                        <p className="text-xs text-zinc-400 max-w-xs">Para planos customizados, limites maiores ou suporte para times, entre em contato.</p>
                    </div>
                    <a
                        href="mailto:suporte@agenciabenck.com"
                        className="px-6 py-2.5 bg-white text-zinc-900 rounded-xl font-bold hover:bg-zinc-100 transition-all active:scale-95 shadow-lg text-sm whitespace-nowrap"
                    >
                        suporte@agenciabenck.com
                    </a>
                </div>

            </div>
        </div>
    );
};

export default Subscription;
