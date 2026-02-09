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
    return (
        <div className="animate-fade-in-up max-w-6xl mx-auto w-full pb-10">
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Planos</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">Escolha a melhor ferramenta para escalar suas vendas.</p>

                {/* Toggle Mensal/Anual */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === 'monthly'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-md'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all relative ${billingCycle === 'annual'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-md'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Anual
                            <span className="absolute -top-2 -right-2 bg-success-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                -20%
                            </span>
                        </button>
                    </div>

                    {billingCycle === 'annual' && (
                        <p className="text-xs text-success-600 dark:text-success-400 mt-3 font-medium">
                            💰 Economize 20% com o plano anual!
                        </p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { id: 'free', name: 'Free', priceMonthly: 0, priceAnnual: 0, credits: 50, features: ['50 Buscas/mês', 'Visualização Básica'], missing: ['WhatsApp Click', 'Exportar Excel/Sheets', 'CRM Completo'], text: "Indicado para começar e conhecer a plataforma" },
                    { id: 'start', name: 'Start', priceMonthly: 39, priceAnnual: 374.40, credits: 300, features: ['300 Buscas/mês', 'WhatsApp Click', 'Exportar Excel', 'Suporte Email'], missing: ['Google Sheets', 'CRM Completo', 'IA Avançada'], text: "Para quem está começando a prospectar ativamente" },
                    { id: 'pro', name: 'Pro', priceMonthly: 69, priceAnnual: 662.40, credits: 1500, features: ['1.500 Buscas/mês', 'CRM Completo', 'WhatsApp Click', 'Exportar Excel & Sheets'], missing: ['IA Avançada'], popular: true, text: "Para quem quer escalar vendas com organização" },
                    { id: 'elite', name: 'Elite', priceMonthly: 149, priceAnnual: 1430.40, credits: 5000, features: ['5.000 Buscas/mês', 'IA Avançada', 'Suporte prioritário'], missing: [], text: "Poder máximo para grandes operações" }
                ].map(plan => {
                    const currentLevel = PLAN_HIERARCHY[userSettings.plan];
                    const planLevel = PLAN_HIERARCHY[plan.id as UserPlan];
                    const isCurrent = userSettings.plan === plan.id;
                    const isLower = planLevel < currentLevel;
                    const showPopular = plan.popular && userSettings.plan !== 'elite' && userSettings.plan !== 'pro';

                    let cardStyle = 'bg-app-cardLight dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800';
                    if (showPopular) {
                        cardStyle = 'bg-app-cardLight dark:bg-zinc-900 border-success-500 ring-2 ring-success-500/20 scale-105 z-10';
                    } else if (isCurrent) {
                        if (plan.id === 'free') {
                            cardStyle = 'bg-zinc-50 dark:bg-zinc-900 border-zinc-400 ring-1 ring-zinc-400 shadow-xl shadow-zinc-500/10 scale-[1.02]';
                        } else {
                            cardStyle = 'bg-gradient-to-br from-success-50 to-white dark:from-zinc-900 dark:to-zinc-800/50 border-success-500 ring-1 ring-success-500 shadow-xl shadow-success-500/10 scale-[1.02]';
                        }
                    }

                    return (
                        <div key={plan.id} className={`relative rounded-2xl p-6 border flex flex-col transition-all ${cardStyle} ${isLower ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                            {showPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-lg shadow-success-500/30">Mais popular</div>}
                            {isCurrent && (
                                <div className="absolute top-2 right-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${plan.id === 'free' ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700' : 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300 border-success-200 dark:border-success-800'}`}>
                                        <Check className="w-3 h-3" /> Atual
                                    </span>
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                            <p className="text-xs text-zinc-500 min-h-[40px] mb-4">{plan.text}</p>

                            <div className="mb-6">
                                {billingCycle === 'monthly' ? (
                                    <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                                        R$ {plan.priceMonthly.toFixed(2).replace('.', ',')}
                                        <span className="text-sm text-zinc-400 font-normal">/mês</span>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                                            R$ {(plan.priceAnnual / 12).toFixed(2).replace('.', ',')}
                                            <span className="text-sm text-zinc-400 font-normal">/mês</span>
                                        </div>
                                        {plan.id !== 'free' && (
                                            <>
                                                <div className="text-xs text-zinc-400 mt-1 line-through">
                                                    R$ {plan.priceMonthly.toFixed(2).replace('.', ',')}/mês
                                                </div>
                                                <div className="inline-block mt-2 bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 text-xs font-bold px-2 py-1 rounded">
                                                    Economize R$ {((plan.priceMonthly * 12 - plan.priceAnnual)).toFixed(2).replace('.', ',')}/ano
                                                </div>
                                                <div className="text-[10px] text-zinc-400 mt-2">
                                                    Cobrança anual: R$ {plan.priceAnnual.toFixed(2).replace('.', ',')}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map(f => <li key={f} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300"><Check className="w-3.5 h-3.5 text-success-500 flex-shrink-0" /> {f}</li>)}
                                {plan.missing?.map(f => <li key={f} className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-600 line-through"><X className="w-3.5 h-3.5 flex-shrink-0" /> {f}</li>)}
                            </ul>
                            <button
                                onClick={() => {
                                    // Desbloqueado para testes
                                    handleCheckout(plan.id as keyof typeof STRIPE_PRICES, billingCycle === 'annual');
                                }}
                                className={`w-full py-3 rounded-xl font-bold transition-all text-sm ${isCurrent
                                    ? (plan.id === 'free' ? 'bg-zinc-600 text-white cursor-default shadow-md' : 'bg-success-600 text-white cursor-default shadow-md shadow-success-500/20')
                                    : isLower
                                        ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-800'
                                        : showPopular
                                            ? 'bg-success-600 text-white hover:bg-success-700 shadow-lg shadow-success-500/30 hover:-translate-y-0.5'
                                            : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 hover:-translate-y-0.5'
                                    }`}
                            >
                                {isCurrent ? 'Plano atual' : isLower ? 'Plano inferior' : 'Assinar Agora'}
                            </button>
                        </div>
                    )
                })}
            </div>
            {/* Removed renderSubscriptionMessage */}
        </div>
    );
};

export default Subscription;
