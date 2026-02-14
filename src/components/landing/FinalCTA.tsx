import React, { useEffect } from 'react';
import Button from './ui/Button';

const FinalCTA: React.FC = () => {
    return (
        <section className="py-16 md:py-24 px-6 relative overflow-hidden">
            {/* Background Gradient Animation */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050508] to-[#0a0a1f] z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-glow"></div>

            <div className="container mx-auto max-w-4xl relative z-10 text-center">
                {/* Standardized Title Typography */}
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                    Pronto para escalar suas <br />
                    <span className="text-gradient-primary">vendas hoje?</span>
                </h2>
                <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed font-normal">
                    Não deixe seus concorrentes pegarem esses leads primeiro. O acesso ao banco de dados do Google Maps está a um clique de distância.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-50 animate-pulse"></div>
                        <Button size="lg" className="px-10 py-6 text-xl shadow-2xl relative w-full sm:w-auto animate-[pulse_2s_infinite]">
                            Começar gratuitamente
                        </Button>
                    </div>
                    <div className="flex flex-col items-center sm:items-start text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-2 text-white">Não precisa de cartão de crédito</span>
                        <span>Cancele quando quiser</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FinalCTA;