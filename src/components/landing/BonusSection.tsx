import React, { useEffect, useRef } from 'react';
import { Zap, ShieldCheck, Map, ArrowRight, Gift, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const bonuses = [
    {
        title: "Scripts de alta conversão",
        description: "Dezenas de templates validados para WhatsApp, LinkedIn e E-mail. Pule a etapa de testes e inicie conversas com mensagens desenhadas para gerar respostas de decisores.",
        icon: Zap,
        color: "from-blue-500/20 to-blue-600/5",
        iconColor: "text-blue-400",
        badge: "WhatsApp & E-mail"
    },
    {
        title: "Kit jurídico e comercial",
        description: "Proteja seu negócio e transmita autoridade. Acesse modelos prontos de contratos de prestação de serviços, NDAs e propostas comerciais focadas em ROI.",
        icon: ShieldCheck,
        color: "from-blue-500/20 to-blue-600/5", // Unified Blue
        iconColor: "text-blue-300",
        badge: "Segurança Jurídica"
    },
    {
        title: "Guia: A jornada da conversão",
        description: "O passo a passo estratégico para qualificar, nutrir e transformar o contato frio extraído do mapa em um cliente ativo e recorrente na sua base.",
        icon: Map,
        color: "from-blue-500/20 to-blue-600/5", // Unified Blue
        iconColor: "text-blue-200",
        badge: "Metodologia"
    }
];

const BonusSection: React.FC = () => {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Header animation
            gsap.from(".bonus-header", {
                scrollTrigger: {
                    trigger: ".bonus-header",
                    start: "top 85%",
                },
                y: 20,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out"
            });

            // Flat Cards entrance animation
            gsap.from(".bonus-card", {
                scrollTrigger: {
                    trigger: ".bonus-grid",
                    start: "top 80%",
                },
                y: 20,
                opacity: 0,
                stagger: 0.1,
                duration: 0.6,
                ease: "power2.out",
                clearProps: "all"
            });

            // Refresh ScrollTrigger after delay
            const timer = setTimeout(() => ScrollTrigger.refresh(), 500);
            return () => clearTimeout(timer);
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="bonus" ref={sectionRef} className="py-24 relative overflow-hidden bg-[#050508] border-t border-white/5">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-radial from-primary/5 to-transparent pointer-events-none opacity-50" />

            <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-7xl">
                <div className="bonus-header text-left md:text-center mb-20">
                    <div className="inline-flex items-center justify-start md:justify-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wide mb-6">
                        <Gift size={14} className="text-primary" />
                        <span>ACELERAÇÃO DE VENDAS</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-[50px] lg:leading-[1.15] font-bold text-white mb-6 tracking-tight leading-[1.15]">
                        Um <span className="text-gradient-primary">ecossistema completo</span> <br className="hidden md:block" />
                        para fechar contratos.
                    </h2>
                    <p className="text-slate-400 text-lg max-w-5xl mx-auto leading-relaxed font-normal text-balance">
                        Entregamos não apenas a tecnologia, mas os processos, roteiros e documentos <br className="hidden md:block" />
                        que agências e equipes comerciais de alto nível usam para escalar suas operações com segurança.
                    </p>
                </div>

                {/* Clean Flat Grid */}
                <div className="bonus-grid grid grid-cols-1 md:grid-cols-3 gap-8">
                    {bonuses.map((bonus, idx) => (
                        <div
                            key={idx}
                            className="bonus-card group relative p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 transition-all duration-300 hover:bg-white/[0.05] hover:border-primary/40"
                        >
                            {/* Card Glow Corner */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bonus.color} blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full`} />

                            <div className="relative z-10">
                                <div className={`inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 transition-colors group-hover:border-primary/20`}>
                                    <bonus.icon className={bonus.iconColor} size={28} />
                                </div>

                                <div className="mb-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        {bonus.badge}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-primary transition-colors">
                                    {bonus.title}
                                </h3>

                                <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[60px]">
                                    {bonus.description}
                                </p>

                                <div className="flex items-center gap-2 text-[10px] font-bold text-primary/60 uppercase tracking-widest pt-6 border-t border-white/5">
                                    <Sparkles size={12} className="text-primary" />
                                    <span>Conteúdo Pro</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Final CTA anchor */}
                <div className="text-center mt-20">
                    <a href="#pricing" className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                        <span>Garantir meus bônus</span>
                        <ArrowRight size={20} />
                    </a>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .text-gradient-primary {
                    background: linear-gradient(to right, #0066ff, #60a5fa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}} />
        </section>
    );
};

export default BonusSection;
