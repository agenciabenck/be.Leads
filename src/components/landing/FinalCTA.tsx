import React, { useEffect } from 'react';
import Button from './ui/Button';

const FinalCTA: React.FC = () => {
    return (
        <section className="py-16 md:py-24 px-4 md:px-12 relative overflow-hidden">
            {/* Background Gradient Animation */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050508] to-[#0a0a1f] z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-glow"></div>

            <div className="container mx-auto max-w-4xl relative z-10 text-center">
                {/* Standardized Title Typography */}
                <h2 className="text-3xl sm:text-4xl lg:text-[50px] lg:leading-[1.15] font-bold mb-6 tracking-tight text-balance">
                    Pronto para <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066ff] to-blue-400">acelerar sua <br className="hidden md:block" />
                        prospecção</span> hoje?
                </h2>
                <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed font-normal text-balance">
                    Junte-se a centenas de empresas que deixaram o trabalho braçal e as planilhas para trás. Encontre, gerencie e aborde seus clientes ideais em uma única plataforma.
                </p>

                <div className="flex flex-col gap-8 justify-center items-center">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-50 animate-pulse"></div>
                        <Button size="lg" className="px-12 py-7 text-xl shadow-2xl relative w-full sm:w-auto animate-[pulse_2z_infinite] font-black" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                            Criar conta grátis
                        </Button>
                    </div>
                    <div className="flex flex-col items-center text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-2 text-white mb-1">60 créditos de prospecção inclusos</span>
                        <span>Sem exigência de cartão de crédito</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FinalCTA;