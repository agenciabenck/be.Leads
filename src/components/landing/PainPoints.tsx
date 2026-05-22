import React, { useEffect, useRef } from 'react';
import { AlertCircle, FileSpreadsheet, Hourglass } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PainPoints: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    const points = [
        {
            icon: <AlertCircle />,
            text: "Leads desatualizados ou duplicados."
        },
        {
            icon: <FileSpreadsheet />,
            text: "Dados espalhados em diversas planilhas."
        },
        {
            icon: <Hourglass />,
            text: "Falta de controle sobre quem já foi contatado."
        }
    ];

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate icons sequentially to red when the section comes into view
            gsap.fromTo(".pain-point-icon-wrapper",
                {
                    scale: 1,
                    backgroundColor: "#f8fafc", // slate-50
                    borderColor: "transparent"
                },
                {
                    scrollTrigger: {
                        trigger: ".pain-points-grid",
                        start: "top 75%", // Start animation when grid top is 75% down viewport
                        end: "bottom 20%",
                        toggleActions: "play none none reverse"
                    },
                    scale: 1.1,
                    backgroundColor: "#ffffff",
                    borderColor: "#f1f5f9", // slate-100
                    duration: 0.5,
                    stagger: 0.3 // Key request: "na ordem" (in sequence)
                }
            );

            gsap.fromTo(".pain-point-icon",
                { color: "#94a3b8" }, // slate-400 (Gray)
                {
                    scrollTrigger: {
                        trigger: ".pain-points-grid",
                        start: "top 75%",
                        toggleActions: "play none none reverse"
                    },
                    color: "#ef4444", // red-500 (All become red)
                    duration: 0.5,
                    stagger: 0.3
                }
            );

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="py-20 px-4 md:px-8 relative">
            <div className="container mx-auto max-w-4xl relative z-10">
                <div className="text-left md:text-center">
                    <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-xs text-red-600 font-bold tracking-wide uppercase">
                        A prova do problema
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-[50px] lg:leading-[1.15] font-bold text-slate-900 mb-6 leading-[1.15] tracking-tight">
                        A prospecção manual está <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">roubando o tempo</span> que você <br className="hidden md:block" />
                        deveria usar para vender.
                    </h2>

                    <p className="text-slate-700 text-lg font-normal leading-relaxed max-w-2xl mx-auto opacity-90 mb-12 text-balance">
                        Quantas horas sua equipe perde por semana procurando contatos no Google, filtrando empresas no Instagram e organizando dados soltos no Excel? O trabalho braçal mata a sua previsibilidade de vendas.
                    </p>
                </div>

                <div className="pain-points-grid grid md:grid-cols-3 gap-6 md:gap-12">
                    {points.map((point, index) => (
                        <div
                            key={index}
                            className="flex flex-row md:flex-col items-center md:text-center gap-6 p-4 rounded-2xl border border-transparent"
                        >
                            {/* Icon Wrapper */}
                            <div className="shrink-0 relative">
                                <div className="pain-point-icon-wrapper w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-transparent">
                                    {React.cloneElement(point.icon as React.ReactElement, {
                                        className: "pain-point-icon w-7 h-7 text-slate-400",
                                        strokeWidth: 1.5
                                    })}
                                </div>
                            </div>

                            {/* Text */}
                            <p className="text-slate-700 font-medium leading-relaxed text-lg flex-1 md:flex-none md:max-w-[260px] text-left md:text-center">
                                {point.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PainPoints;
