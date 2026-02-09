import React from 'react';
import { Check, X } from 'lucide-react';
import { UserSettings, UserPlan } from '@/types/types';
import { PLAN_HIERARCHY, STRIPE_PRICES } from '@/constants/appConstants';

interface SubscriptionProps {
    billingCycle: 'monthly' | 'annual';
    setBillingCycle: (v: 'monthly' | 'annual') => void;
    userSettings: UserSettings;
    handleCheckout: (planId: keyof typeof STRIPE_PRICES, isAnnual: boolean) => Promise<void>;
}

const Subscription: React.FC<SubscriptionProps> = ({
    billingCycle,
    setBillingCycle,
    userSettings,
    handleCheckout,
}) => {
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
        <div className="animate-fade-in-up max-w-6xl mx-auto w-full pb-10">
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Planos</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">Escolha a melhor ferramenta para escalar suas vendas.</p>

                {/* Toggle Mensal/Anual */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="bg-white dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center shadow-sm">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md' : 'text-zinc-500'}`}
                        >
                            Mensal
                        </button>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {planList.map(plan => {
                        const currentLevel = PLAN_HIERARCHY[userSettings.plan];
                        const planLevel = PLAN_HIERARCHY[plan.id as UserPlan];
                        const isCurrent = userSettings.plan === plan.id;
                        const isLower = planLevel < currentLevel;
                        const showPopular = plan.popular && userSettings.plan !== 'elite' && userSettings.plan !== 'pro';

                        let cardStyle = 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800';
                        if (showPopular) {
                            cardStyle = 'bg-white dark:bg-zinc-900 border-success-500 ring-2 ring-success-500/20 scale-105 z-10';
                        } else if (isCurrent) {
                            if (plan.id === 'free') {
                                cardStyle = 'bg-zinc-50 dark:bg-zinc-900 border-zinc-400 ring-1 ring-zinc-400 shadow-xl shadow-zinc-500/10 scale-[1.02]';
                            } else {
                                cardStyle = 'bg-gradient-to-br from-success-50 to-white dark:from-zinc-900 dark:to-zinc-800/50 border-success-500 ring-1 ring-success-500 shadow-xl shadow-success-500/10 scale-[1.02]';
                            }
                        }

                        return (
                            <div key={plan.id} className={`relative rounded-3xl p-5 border flex flex-col transition-all ${cardStyle} ${isLower ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                                {showPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-success-500/30">Mais popular</div>}
                                {isCurrent && (
                                    <div className="absolute top-2 right-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${plan.id === 'free' ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700' : 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300 border-success-200 dark:border-success-800'}`}>
                                            <Check className="w-3 h-3" /> Atual
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-col mb-4">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{plan.name}</h3>
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
                                    onClick={() => !isLower && handleCheckout(plan.id as keyof typeof STRIPE_PRICES, billingCycle === 'annual')}
                                    disabled={isCurrent || isLower}
                                    className={`w-full py-3 rounded-2xl font-bold transition-all text-sm ${isCurrent
                                        ? 'bg-success-600 text-white cursor-default shadow-md active:scale-100'
                                        : isLower
                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-50'
                                            : showPopular
                                                ? 'bg-success-600 text-white hover:bg-success-700 shadow-lg shadow-success-500/20 active:scale-95'
                                                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-95'
                                        }`}
                                >
                                    {isCurrent ? 'Plano atual' : isLower ? 'Plano inferior' : 'Selecionar plano'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 text-center pb-12">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm animate-fade-in">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400">
                            🚀
                        </span>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Economize agora e garanta o melhor preço com o <span className="text-zinc-900 dark:text-white font-bold">plano anual</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
