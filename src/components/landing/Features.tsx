import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Search, Trello, FileDown, Zap, CheckCircle2, ArrowRight, MapPin, Sheet, FileSpreadsheet, Users } from 'lucide-react';
import Button from './ui/Button';

const Features: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Radar Animation (Looping)
            gsap.to(".radar-ring", {
                scale: 1.5,
                opacity: 0,
                duration: 2,
                repeat: -1,
                stagger: 0.5,
                ease: "power1.out"
            });

            // Radar Scanner Rotation
            gsap.to(".radar-scanner", {
                rotation: 360,
                duration: 4,
                repeat: -1,
                ease: "linear"
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="features" ref={containerRef} className="relative py-12 md:py-20">
            <div className="container mx-auto max-w-7xl px-4 md:px-12 relative z-10">

                {/* HEADER */}
                <div className="text-left md:text-center max-w-4xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-wide uppercase shadow-sm">
                        <Zap size={14} className="fill-blue-600" />
                        AUTOMATIZE SEU OUTBOUND
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-[50px] lg:leading-[1.15] font-bold mb-4 text-slate-900 tracking-tight leading-[1.15]">
                        Seu processo de vendas, <br className="hidden md:block" /> finalmente no <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066ff] to-blue-500">automático.</span>
                    </h2>
                    <p className="text-slate-600 text-lg font-normal leading-relaxed max-w-2xl mx-auto">
                        Uma interface limpa e poderosa que transforma dados brutos em oportunidades de venda reais, sem o trabalho braçal.
                    </p>
                </div>

                {/* Section 1 - Extração Massiva */}
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mb-32">
                    {/* Content */}
                    <div className="w-full lg:w-1/2 space-y-8">
                        <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <Search size={28} />
                        </div>

                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4 block">
                                PROSPECÇÃO MULTICANAL
                            </span>
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-[1.15]">Prospecção cirúrgica <br /> e qualificada</h3>
                        </div>

                        <p className="text-slate-600 text-lg leading-relaxed font-normal opacity-80">
                            Utilize nossa inteligência artificial para mapear seu mercado ideal. Encontre milhares de empresas por nicho ou região e extraia telefones, e-mails validados e dados estratégicos em segundos.
                        </p>

                        <div className="space-y-3">
                            {[
                                "Filtros inteligentes (nicho, região e cidade)",
                                "Extração multicanal (Maps, LinkedIn e Insta)",
                                "Categorização automática por Inteligência Artificial"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-slate-700 font-semibold bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60 shadow-sm w-fit text-sm hover:border-blue-500/30 transition-all group/item">
                                    <CheckCircle2 size={18} className="text-blue-600 group-hover/item:scale-110 transition-transform" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <Button variant="primary" size="lg" className="w-fit" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                            Ver prospecção na prática <ArrowRight size={20} />
                        </Button>
                    </div>

                    {/* Illustration */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center">
                        <div className="w-full aspect-square max-w-[520px] bg-white/50 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-200/60 p-1">
                            <div className="w-full h-full rounded-[2.3rem] overflow-hidden">
                                <RadarVisual />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2 - CRM Kanban (Blue Variant) */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16 mb-32">
                    {/* Content */}
                    <div className="w-full lg:w-1/2 space-y-8">
                        <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <Trello size={28} />
                        </div>

                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4 block">
                                GESTÃO DE PIPELINE
                            </span>
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-[1.15]">CRM Kanban nativo <br /> e integrado</h3>
                        </div>

                        <p className="text-slate-600 text-lg leading-relaxed font-normal opacity-80">
                            Dê adeus às planilhas bagunçadas. Cada lead encontrado entra automaticamente no seu funil de vendas. Arraste as oportunidades pelas etapas, mapeie decisores e feche mais negócios.
                        </p>

                        <div className="space-y-3">
                            {[
                                "Pipeline visual intuitivo (arraste e solte)",
                                "Mapeamento de decisores e gatekeepers",
                                "Histórico centralizado de interações e follow-ups"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-slate-700 font-semibold bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60 shadow-sm w-fit text-sm hover:border-blue-500/30 transition-all group/item">
                                    <CheckCircle2 size={18} className="text-blue-600 group-hover/item:scale-110 transition-transform" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <Button variant="primary" size="lg" className="w-fit bg-blue-600 hover:bg-blue-700" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                            Explorar meu pipeline <ArrowRight size={20} />
                        </Button>
                    </div>

                    {/* Illustration */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center">
                        <div className="w-full aspect-square max-w-[520px] bg-white/50 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-200/60 p-1">
                            <div className="w-full h-full rounded-[2.3rem] overflow-hidden">
                                <KanbanVisual />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3 - Exportação (Blue Variant) */}
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                    {/* Content */}
                    <div className="w-full lg:w-1/2 space-y-8">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <FileDown size={28} />
                        </div>

                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4 block">
                                FLUXO DE TRABALHO
                            </span>
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-[1.15]">Integração total com <br /> a sua operação</h3>
                        </div>

                        <p className="text-slate-600 text-lg leading-relaxed font-normal opacity-80">
                            Seus dados nunca ficam presos. Sincronize suas listas de prospecção diretamente com o Google Sheets em um clique, ou baixe relatórios completos para usar no seu CRM favorito.
                        </p>

                        <div className="space-y-3">
                            {[
                                "Integração nativa com Google Sheets",
                                "Exportação rápida em formato CSV / Excel",
                                "Dados estruturados prontos para qualquer sistema"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-slate-700 font-semibold bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60 shadow-sm w-fit text-sm hover:border-blue-500/30 transition-all group/item">
                                    <CheckCircle2 size={18} className="text-blue-600 group-hover/item:scale-110 transition-transform" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <Button variant="primary" size="lg" className="w-fit bg-blue-600 hover:bg-blue-700" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                            Começar integração <ArrowRight size={20} />
                        </Button>
                    </div>

                    {/* Illustration */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center">
                        <div className="w-full aspect-square max-w-[520px] bg-white/50 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-200/60 p-1">
                            <div className="w-full h-full rounded-[2.3rem] overflow-hidden">
                                <SheetVisual />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Extracted Components for Reusability ---

const RadarVisual = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden py-12 md:py-0">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <div className="relative z-10 scale-90 md:scale-125">
            {/* Center Dot */}
            <div className="w-4 h-4 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)] relative z-30"></div>

            {/* Rings */}
            <div className="radar-ring absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-blue-500/30 rounded-full z-10"></div>
            <div className="radar-ring absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-blue-500/20 rounded-full z-10" style={{ animationDelay: '0.5s' }}></div>
            <div className="radar-ring absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] border border-blue-500/10 rounded-full z-10" style={{ animationDelay: '1s' }}></div>

            {/* Scanner Beam */}
            <div className="radar-scanner absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full z-20 pointer-events-none opacity-40"
                style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(37,99,235,0.1) 60deg, rgba(37,99,235,0.4) 90deg, transparent 91deg)' }}>
            </div>
        </div>

        {/* Floating Pins - Updated with real context */}
        <div className="absolute top-12 md:top-16 left-4 md:left-12 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.12)] border border-white flex items-center gap-3 animate-float z-30 scale-90 origin-left md:scale-100">
            <div className="bg-blue-50 p-1.5 rounded-lg"><MapPin size={16} className="text-blue-600" /></div>
            <div>
                <div className="text-xs font-bold text-slate-800">Imobiliária Meu Lar</div>
                <div className="flex gap-1 mt-0.5"><div className="w-1 h-1 rounded-full bg-blue-500"></div><span className="text-[9px] text-blue-500 font-bold uppercase tracking-wide">Google Maps</span></div>
            </div>
        </div>

        {/* Instagram/LinkedIn Tags */}
        <div className="absolute top-28 md:top-32 right-2 md:right-12 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-pink-100 flex items-center gap-2 animate-float z-30 scale-90 origin-right md:scale-100" style={{ animationDelay: '0.8s' }}>
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-pink-600 uppercase tracking-tighter">@Instagram Encontrado</span>
        </div>

        <div className="absolute bottom-20 md:bottom-24 left-6 md:left-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-blue-100 flex items-center gap-2 animate-float z-30 scale-90 origin-left md:scale-100" style={{ animationDelay: '1.4s' }}>
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">LinkedIn Enriquecido</span>
        </div>

        <div className="absolute bottom-28 md:bottom-32 right-2 md:right-20 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.12)] border border-white flex items-center gap-3 animate-float z-30 scale-90 origin-right md:scale-100" style={{ animationDelay: '1.2s' }}>
            <div className="bg-emerald-50 p-1.5 rounded-lg"><MapPin size={16} className="text-emerald-600" /></div>
            <div>
                <div className="text-xs font-bold text-slate-800">Construtora Alpha</div>
                <div className="flex gap-1 mt-0.5"><div className="w-1 h-1 rounded-full bg-emerald-500"></div><span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wide">Painel CRM</span></div>
            </div>
        </div>
    </div>
);

const KanbanVisual = () => (
    <div className="w-full h-full flex flex-col bg-slate-50 relative p-4 md:p-8 overflow-hidden scale-90 origin-top md:scale-100">
        {/* CSS for Drag Animation - Improved for smoother feel */}
        <style>{`
            @keyframes kanban-move {
                0% { transform: translate(0, 0) scale(1) rotate(0deg); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                15% { transform: translate(0, -8px) scale(1.05) rotate(2deg); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); z-index: 50; }
                50% { transform: translate(110%, -8px) scale(1.05) rotate(-1deg); z-index: 50; }
                85% { transform: translate(110%, 0) scale(1) rotate(0deg); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); z-index: 50; }
                100% { transform: translate(110%, 0) scale(1) rotate(0deg); z-index: 50; }
            }
            .animate-kanban-move {
                animation: kanban-move 4s ease-in-out infinite;
            }
        `}</style>

        {/* Abstract Header - Better contrast */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"><Trello size={20} className="text-white" /></div>
                <div className="space-y-1.5">
                    <div className="h-2 w-32 bg-slate-300 rounded-full"></div>
                    <div className="h-1.5 w-20 bg-slate-200 rounded-full"></div>
                </div>
            </div>
            <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div>
                ))}
            </div>
        </div>

        {/* Abstract Columns - Darker BG for definition */}
        <div className="flex gap-4 h-full items-start overflow-hidden relative pb-10">
            {/* Column 1 (Prospecção) */}
            <div className="flex-1 flex flex-col gap-3 min-w-[120px] bg-slate-200/40 p-2.5 rounded-2xl h-full border border-slate-200/50">
                <div className="flex items-center justify-between mb-1 px-1">
                    <div className="h-2 w-14 bg-slate-400 rounded-full"></div>
                    <div className="w-4 h-4 rounded-full bg-slate-300"></div>
                </div>

                {/* Static Card 1 */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg"></div>
                        <div className="h-3 w-10 bg-emerald-50 text-[8px] font-bold text-emerald-600 rounded flex items-center justify-center">R$ 1.5k</div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
                </div>

                {/* MOVING CARD */}
                <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-md flex flex-col justify-between animate-kanban-move relative h-28">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center"><Zap size={14} className="text-white" /></div>
                        <div className="bg-blue-600 text-white text-[7px] px-1.5 py-0.5 rounded font-black tracking-tighter shadow-sm whitespace-nowrap">QUALIFICADO</div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-2 w-3/4 bg-slate-200 rounded-full"></div>
                        <div className="h-1 w-full bg-slate-100 rounded-full"></div>
                    </div>
                    <div className="mt-2 flex justify-between items-center border-t border-slate-100 pt-2">
                        <div className="h-1.5 w-8 bg-slate-100 rounded-full"></div>
                        <div className="w-4 h-4 rounded-full bg-slate-200"></div>
                    </div>
                </div>

                {/* Filler Card 1 */}
                <div className="bg-white/80 p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 opacity-60">
                    <div className="h-2 w-16 bg-slate-200 rounded-full"></div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
                </div>
            </div>

            {/* Column 2 (Em Negociação) - Primary Color Accent */}
            <div className="flex-1 flex flex-col gap-3 min-w-[120px] bg-blue-50/30 p-2.5 rounded-2xl h-full border border-blue-100/50 ring-1 ring-blue-500/5">
                <div className="flex items-center justify-between mb-1 px-1">
                    <div className="h-2 w-20 bg-blue-500/40 rounded-full"></div>
                    <div className="w-4 h-4 rounded-full bg-blue-400 opacity-20"></div>
                </div>

                {/* Static Card in Col 2 */}
                <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-[0_4px_12px_rgba(37,99,235,0.08)] flex flex-col gap-3">
                    <div className="flex justify-between">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><Users size={16} className="text-white" /></div>
                        <div className="flex flex-col items-end">
                            <div className="text-[10px] font-black text-blue-700">R$ 12.450</div>
                            <div className="h-1 w-8 bg-blue-100 rounded-full mt-1"></div>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                </div>

                {/* Space Filler Card at bottom */}
                <div className="bg-white/60 p-3 rounded-xl border border-dashed border-slate-200 flex flex-col gap-2 mt-auto">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
                </div>
            </div>

            {/* Column 3 (Fechado) */}
            <div className="flex-1 flex flex-col gap-3 min-w-[120px] bg-emerald-50/20 p-2.5 rounded-2xl h-full border border-emerald-100/50">
                <div className="flex items-center justify-between mb-1 px-1">
                    <div className="h-2 w-14 bg-emerald-500/40 rounded-full"></div>
                    <div className="w-4 h-4 rounded-full bg-emerald-400 opacity-20"></div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex flex-col gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-600"><CheckCircle2 size={12} /></div>
                    <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                </div>

                {/* Filler Card 3 */}
                <div className="bg-white/40 p-3 rounded-xl border border-slate-200 h-24 mt-auto"></div>
            </div>
        </div>
    </div>
);

const SheetVisual = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        <style>{`
            @keyframes scan-rows {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .animate-scan-green {
                background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.2), transparent);
                background-size: 200% 100%;
                animation: scan-rows 1.5s infinite linear;
            }
            @keyframes fly-out {
                0% { transform: translateY(20px) scale(0.8); opacity: 0; }
                50% { transform: translateY(0) scale(1); opacity: 1; }
                100% { transform: translateY(-50px) scale(1.05); opacity: 0; }
            }
            .animate-file-export {
                animation: fly-out 3s ease-in-out infinite;
                animation-delay: 1s;
            }
        `}</style>

        {/* Background - Removed Grid, just clean slate-50 */}
        <div className="absolute inset-0 bg-slate-50"></div>

        <div className="relative z-10 w-80 scale-75 sm:scale-110">
            {/* Main Sheet Container */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden mb-4">
                {/* Header */}
                <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-3 gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <div className="h-1.5 w-20 bg-slate-200 rounded-full ml-2"></div>
                </div>
                {/* Rows - Increased count to fill more space */}
                <div className="p-1 space-y-1">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex gap-1 h-6 relative overflow-hidden">
                            {/* Cell 1 */}
                            <div className="w-1/4 bg-slate-50 rounded h-full"></div>
                            {/* Cell 2 */}
                            <div className="w-1/4 bg-slate-50 rounded h-full"></div>
                            {/* Cell 3 */}
                            <div className="w-1/2 bg-slate-50 rounded h-full"></div>

                            {/* Scanning Effect Overlay */}
                            <div className="absolute inset-0 animate-scan-green" style={{ animationDelay: `${i * 0.1}s` }}></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Exported File Card (Animated) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 bg-[#107c41] rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-file-export z-20 border border-green-600">
                <div className="bg-white/20 p-2 rounded-lg">
                    <FileSpreadsheet className="text-white w-6 h-6" />
                </div>
                <div>
                    <div className="h-2 w-20 bg-white rounded-full mb-1.5"></div>
                    <div className="h-1.5 w-12 bg-white/50 rounded-full"></div>
                </div>
                <div className="ml-auto">
                    <CheckCircle2 className="text-white w-5 h-5" />
                </div>
            </div>
        </div>

        {/* Background Status Badge */}
        <div className="absolute bottom-12 bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full font-medium shadow-lg flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            Processando 1.240 linhas...
        </div>
    </div>
);

export default Features;