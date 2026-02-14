import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Sparkles, Info } from 'lucide-react';
import Button from './ui/Button';
import gsap from 'gsap';
import { PricingTier } from '@/types/landing';

const tiers: PricingTier[] = [
  {
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    description: "Indicado para começar e conhecer a plataforma.",
    features: ["50 créditos/mês", "Visualização básica", "!WhatsApp click", "!Exportar excel/sheets", "!CRM completo"],
    stripeIdMonthly: "",
    stripeIdAnnual: "",
    buttonText: "Começar grátis"
  },
  {
    name: "Start",
    priceMonthly: 57.00,
    priceAnnual: 45.60,
    description: "Para quem está começando a prospectar ativamente.",
    features: ["500 créditos/mês", "WhatsApp click", "Exportar excel", "!Exportar sheets", "!CRM completo"],
    stripeIdMonthly: "price_1SzdGU3fc3cZuklGVPzlU4Fi",
    stripeIdAnnual: "price_1SzdGu3fc3cZuklGDHAMMsBR",
  },
  {
    name: "Pro",
    priceMonthly: 87.00,
    priceAnnual: 69.60,
    description: "Para quem quer escalar vendas com organização.",
    features: ["1.100 créditos/mês", "WhatsApp click", "Exportar excel", "Exportar sheets", "CRM completo"],
    stripeIdMonthly: "price_1SzdHi3fc3cZuklG5rtVblVa",
    stripeIdAnnual: "price_1SzdI83fc3cZuklGDBe9TJVy",
    highlight: true,
  },
  {
    name: "Elite",
    priceMonthly: 197.00,
    priceAnnual: 157.60,
    description: "Poder máximo para grandes operações.",
    features: ["3.200 créditos/mês", "WhatsApp click", "Exportar excel", "Exportar sheets", "CRM completo", "Suporte prioritário"],
    stripeIdMonthly: "price_1SzdJQ3fc3cZuklGzmncl1Oh",
    stripeIdAnnual: "price_1SzdJi3fc3cZuklGhjinw5av",
  }
];

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation when toggling
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fluid, simple transition for numbers. No elastic pop.
      gsap.fromTo(".price-number",
        { y: -5, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "power2.out", stagger: 0.05 }
      );

      // Subtle reveal for savings badge if annual
      if (isAnnual) {
        gsap.fromTo(".savings-badge",
          { opacity: 0, x: -5 },
          { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", stagger: 0.1 }
        );
      }

    }, containerRef);
    return () => ctx.revert();
  }, [isAnnual]);

  const handleCheckout = (tier: PricingTier) => {
    if (tier.priceMonthly === 0) {
      window.location.href = '/app?plan=free';
      return;
    }
    const planId = tier.name.toLowerCase();
    window.location.href = `/app?subscribe=${planId}&annual=${isAnnual}`;
  };

  const formatPrice = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <section id="pricing" ref={containerRef} className="py-12 md:py-20 px-6 relative border-t border-white/5 bg-[#050508] overflow-hidden">

      {/* Background FX */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-radial from-blue-900/20 to-transparent opacity-50 pointer-events-none"></div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Investimento que se <br /><span className="text-gradient-primary">paga na 1ª venda</span></h2>

          {/* Custom Toggle Switch */}
          <div className="flex justify-center mt-10">
            <div
              className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-1.5 rounded-full flex items-center cursor-pointer select-none w-[280px] sm:w-[320px] h-14"
              onClick={() => setIsAnnual(!isAnnual)}
            >
              {/* Sliding Background */}
              <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#0068ff] rounded-full shadow-lg shadow-blue-600/30 transition-all duration-500 ease-out ${isAnnual ? 'translate-x-[100%]' : 'translate-x-0'}`}></div>

              {/* Monthly Option */}
              <div className={`flex-1 flex items-center justify-center relative z-10 text-sm font-bold transition-colors duration-300 ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>
                Mensal
              </div>

              {/* Annual Option */}
              <div className={`flex-1 flex items-center justify-center gap-2 relative z-10 text-sm font-bold transition-colors duration-300 ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
                Anual
                <span className="bg-[#10b981] text-white text-[10px] px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  -20%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`pricing-card relative p-6 rounded-[2rem] flex flex-col transition-all duration-300 group
                ${tier.highlight
                  ? 'bg-transparent border border-white/10 shadow-[0_0_80px_-10px_rgba(0,104,255,0.4)] scale-105 z-20'
                  : 'glass-card border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
                }`}
            >
              {tier.highlight && (
                <>
                  {/* Animated Neon Border - SVG Spotlight */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }}>
                    <rect
                      x="1"
                      y="1"
                      width="calc(100% - 2px)"
                      height="calc(100% - 2px)"
                      rx="31"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      pathLength="100"
                      className="opacity-100"
                      style={{ strokeDasharray: '30 70', strokeDashoffset: '0', animation: 'dash 4s linear infinite' }}
                    />
                  </svg>
                  <style>{`
                    @keyframes dash {
                      to { stroke-dashoffset: -100; }
                    }
                  `}</style>

                  {/* Card Background (Inset to reveal border) */}
                  <div className="absolute inset-[2px] rounded-[calc(2rem-2px)] bg-[#0a0a0f] pointer-events-none z-10" />

                  {/* Premium Inner Glow */}
                  <div className="absolute inset-[2px] rounded-[calc(2rem-2px)] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                  {/* Mais Popular Badge (Floating well above border) */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)] flex items-center gap-2 tracking-wider uppercase z-50 w-max border border-blue-400/30">
                    <Sparkles className="w-3.5 h-3.5 fill-blue-100 animate-pulse" />
                    <span>Mais Popular</span>
                  </div>
                </>
              )}

              <div className="mb-4 relative z-10 pt-2">
                <h3 className={`text-2xl font-bold flex items-center gap-2 ${tier.highlight ? 'text-white' : 'text-slate-200'}`}>
                  {tier.name}
                </h3>
                <p className="text-sm text-slate-400 mt-2 min-h-[40px] font-normal leading-normal">{tier.description}</p>
              </div>

              <div className="mb-4 relative z-10 border-b border-white/5 pb-2">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-sm text-slate-400 font-medium">R$</span>

                  {/* Dynamic Price Display */}
                  <div className="relative flex flex-col items-start min-w-[100px]">
                    <span className="text-5xl font-bold text-white price-number tracking-tighter">
                      {formatPrice(isAnnual ? tier.priceAnnual : tier.priceMonthly)}
                    </span>
                  </div>

                  <span className="text-slate-500 font-normal">/mês</span>
                </div>

                {/* Savings Info - Using Fixed Height Container to align all cards */}
                <div className="min-h-[40px] flex flex-col justify-start">
                  {isAnnual && tier.priceMonthly > 0 && (
                    <div className="space-y-1">
                      <div className="savings-badge text-[10px] font-bold text-emerald-400 tracking-wide uppercase">
                        Economia de 20% no anual
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Pagamento único de R$ {formatPrice(tier.priceAnnual * 12)}/ano
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-grow relative z-10">
                {tier.features.map((feat, fIdx) => {
                  const isExcluded = feat.startsWith('!');
                  const cleanFeat = isExcluded ? feat.substring(1) : feat;

                  return (
                    <div key={fIdx} className={`flex items-start gap-3 text-sm transition-colors ${isExcluded ? 'text-slate-500' : 'text-slate-300 group-hover:text-slate-200'}`}>
                      <div className={`p-0.5 rounded-full mt-0.5 shrink-0 transition-all duration-300 ${isExcluded
                        ? 'bg-transparent text-slate-600'
                        : (tier.highlight ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'bg-white/10 text-slate-400 group-hover:bg-white/20 group-hover:text-white')
                        }`}>
                        {isExcluded ? <X className="w-3 h-3" strokeWidth={3} /> : <Check className="w-3 h-3" strokeWidth={3} />}
                      </div>
                      <span className={`font-normal ${isExcluded ? '' : ''} flex items-center`}>
                        {cleanFeat}
                        {cleanFeat.toLowerCase().includes('créditos') && (
                          <div className="group/tooltip relative ml-1.5 flex items-center cursor-help">
                            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400 transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-[#1e1e24] border border-white/10 rounded-xl shadow-2xl text-[11px] leading-relaxed text-slate-300 text-center opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md">
                              Cada crédito libera um lead com contato validado. O consumo ocorre apenas na entrega dos dados.
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e1e24]" />
                            </div>
                          </div>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {tier.highlight ? (
                <button
                  className="w-full relative z-20 overflow-hidden font-bold transition-all duration-200 rounded-2xl flex items-center justify-center gap-2 group tracking-wide select-none active:scale-95 bg-[#0068ff] text-white hover:bg-[#0054cc] shadow-[0_0_30px_rgba(0,104,255,0.5)] h-12 px-8"
                  onClick={() => handleCheckout(tier)}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {tier.buttonText || (tier.priceMonthly === 0 ? "Começar grátis" : "Selecionar plano")}
                  </span>
                </button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => handleCheckout(tier)}
                >
                  {tier.buttonText || (tier.priceMonthly === 0 ? "Começar grátis" : "Selecionar plano")}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;