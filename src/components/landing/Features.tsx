import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Trello, FileDown, Zap, CheckCircle2, ArrowRight, MapPin, Sheet, FileSpreadsheet } from 'lucide-react';
import Button from './ui/Button';

gsap.registerPlugin(ScrollTrigger);

const Features: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {

            const details = gsap.utils.toArray<HTMLElement>('.feature-detail');
            // Only select desktop visuals for the sticky animation
            const desktopVisuals = gsap.utils.toArray<HTMLElement>('.desktop-feature-visual');

            // Init desktop visuals: hide all except first
            gsap.set(desktopVisuals, { autoAlpha: 0, scale: 0.95, position: 'absolute', inset: 0 });
            gsap.set(desktopVisuals[0], { autoAlpha: 1, scale: 1 });

            // Radar Animation (Looping) - affects both mobile and desktop instances
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

            details.forEach((detail, index) => {
                ScrollTrigger.create({
                    trigger: detail,
                    start: "top center", // Trigger when the text section hits the middle of viewport
                    end: "bottom center",
                    onEnter: () => switchVisual(index),
                    onEnterBack: () => switchVisual(index),
                });
            });

            function switchVisual(index: number) {
                // Animate all out
                desktopVisuals.forEach((v, i) => {
                    if (i !== index) {
                        gsap.to(v, { autoAlpha: 0, scale: 0.95, duration: 0.5, overwrite: true });
                    }
                });
                // Animate active in
                gsap.to(desktopVisuals[index], { autoAlpha: 1, scale: 1, duration: 0.5, overwrite: true });
            }

        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="features" ref={containerRef} className="relative py-12 md:py-20">
            <div className="container mx-auto max-w-7xl px-6">

                {/* HEADER */}
                <div className="text-center max-w-4xl mx-auto mb-2">
                    <div className="inline-flex items-center gap-2 mb-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium tracking-widest uppercase shadow-sm">
                        <Zap size={14} className="fill-blue-600" />
                        Automático e rápido
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold mb-2 text-slate-900 tracking-tight leading-[1.1]">
                        Poder de uma <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">agência inteira</span> <br className="hidden md:block" /> em um clique.
                    </h2>
                    <p className="text-slate-500 text-lg font-normal leading-relaxed max-w-2xl mx-auto">
                        Uma interface limpa e poderosa que transforma dados brutos em oportunidades de venda reais.
                    </p>
                </div>

                {/* SIDE BY SIDE LAYOUT */}
                <div className="flex flex-col lg:flex-row items-start lg:gap-20">

                    {/* LEFT COLUMN (SCROLLING TEXT) */}
                    <div className="w-full lg:w-1/2 relative z-10 pb-16">

                        {/* Section 1 */}
                        <div className="feature-detail min-h-screen flex flex-col justify-center py-10 group">
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
                                <Search size={28} />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Extração Massiva</h3>
                            <p className="text-slate-400 text-base leading-relaxed mb-6 font-normal">
                                Nossa IA varre cada esquina do Google Maps. Encontre milhares de empresas por nicho e cidade. Extraímos telefones, e-mails validados, website e endereço.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3 text-slate-600 font-medium bg-white p-3 rounded-xl shadow-sm border border-slate-100 w-fit text-sm">
                                    <CheckCircle2 size={18} className="text-blue-600" /> Validação de e-mails em tempo real
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium bg-white p-3 rounded-xl shadow-sm border border-slate-100 w-fit text-sm">
                                    <CheckCircle2 size={18} className="text-blue-600" /> Filtro por avaliações e reputação
                                </li>
                            </ul>
                            <Button variant="primary" className="w-fit">
                                Ver extração na prática <ArrowRight size={18} />
                            </Button>

                            {/* MOBILE VISUAL 1 */}
                            <div className="lg:hidden mt-12 w-full aspect-square max-w-[400px] mx-auto bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden ring-1 ring-slate-100">
                                <RadarVisual />
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="feature-detail min-h-screen flex flex-col justify-center py-10 group">
                            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-purple-600/20 group-hover:scale-110 transition-transform duration-500">
                                <Trello size={28} />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">CRM Kanban Visual</h3>
                            <p className="text-slate-400 text-base leading-relaxed mb-6 font-normal">
                                Não perca leads em planilhas confusas. Organize sua prospecção em colunas visuais. Arraste cards de "Novo Lead" para "Negociação" e "Fechado" com um clique.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg w-full sm:w-1/2 group-hover:-translate-y-1 transition-transform">
                                    <div className="text-3xl font-bold text-purple-600 mb-1">2.4x</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Mais conversão</div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg w-full sm:w-1/2 group-hover:-translate-y-1 transition-transform delay-75">
                                    <div className="text-3xl font-bold text-purple-600 mb-1">-4h</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Tempo gasto</div>
                                </div>
                            </div>
                            <Button variant="primary" className="w-fit">
                                Explorar CRM <ArrowRight size={18} />
                            </Button>

                            {/* MOBILE VISUAL 2 */}
                            <div className="lg:hidden mt-12 w-full aspect-square max-w-[400px] mx-auto bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden ring-1 ring-slate-100">
                                <KanbanVisual />
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="feature-detail min-h-screen flex flex-col justify-center py-10 group">
                            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                                <FileDown size={28} />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Exportação Instantânea</h3>
                            <p className="text-slate-400 text-base leading-relaxed mb-6 font-normal">
                                Baixe listas completas em <strong>CSV/Excel</strong> ou exporte direto para o <strong>Google Sheets</strong> em tempo real. Compatível com seu CRM favorito.
                            </p>
                            <Button variant="primary" className="w-fit shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 border-emerald-500/20">
                                Começar a exportar <ArrowRight size={18} />
                            </Button>

                            {/* MOBILE VISUAL 3 */}
                            <div className="lg:hidden mt-12 w-full aspect-square max-w-[400px] mx-auto bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden ring-1 ring-slate-100">
                                <SheetVisual />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (STICKY VISUALS - DESKTOP ONLY) */}
                    <div className="w-full lg:w-1/2 hidden lg:block sticky top-0 h-screen">
                        <div className="w-full h-full flex items-center justify-center px-6">
                            <div className="relative w-full aspect-square max-h-[600px] bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden ring-1 ring-slate-100">

                                {/* VISUAL 1 */}
                                <div className="desktop-feature-visual w-full h-full absolute inset-0">
                                    <RadarVisual />
                                </div>

                                {/* VISUAL 2 */}
                                <div className="desktop-feature-visual w-full h-full absolute inset-0">
                                    <KanbanVisual />
                                </div>

                                {/* VISUAL 3 */}
                                <div className="desktop-feature-visual w-full h-full absolute inset-0">
                                    <SheetVisual />
                                </div>

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
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <div className="relative z-10 scale-125">
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

        {/* Floating Pins */}
        <div className="absolute top-24 left-10 md:left-16 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-3 animate-float z-30">
            <div className="bg-orange-100 p-1.5 rounded-lg"><MapPin size={16} className="text-orange-600" /></div>
            <div>
                <div className="text-xs font-bold text-slate-800">Padaria Real</div>
                <div className="flex gap-1 mt-0.5"><div className="w-1 h-1 rounded-full bg-green-500"></div><span className="text-[9px] text-slate-500 uppercase tracking-wide">Aberto</span></div>
            </div>
        </div>
        <div className="absolute bottom-32 right-10 md:right-16 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-3 animate-float z-30" style={{ animationDelay: '1.5s' }}>
            <div className="bg-blue-100 p-1.5 rounded-lg"><MapPin size={16} className="text-blue-600" /></div>
            <div>
                <div className="text-xs font-bold text-slate-800">Tech Solutions</div>
                <div className="flex gap-1 mt-0.5"><div className="w-1 h-1 rounded-full bg-green-500"></div><span className="text-[9px] text-slate-500 uppercase tracking-wide">Verificado</span></div>
            </div>
        </div>
    </div>
);

const KanbanVisual = () => (
    <div className="w-full h-full flex flex-col bg-slate-50 relative p-6 md:p-8 overflow-hidden">
        {/* CSS for Drag Animation */}
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

        {/* Abstract Header */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Trello size={20} className="text-purple-500" /></div>
                <div className="h-2 w-32 bg-slate-200 rounded-full"></div>
            </div>
            <div className="flex -space-x-2 opacity-50">
                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
            </div>
        </div>

        {/* Abstract Columns - Now filling height */}
        <div className="flex gap-4 h-full items-start overflow-hidden relative pb-6">

            {/* Column 1 (Novos) */}
            <div className="flex-1 flex flex-col gap-3 min-w-[100px] bg-slate-100/50 p-2 rounded-xl h-full">
                <div className="h-1.5 w-12 bg-slate-300 rounded-full mb-1 ml-1"></div>

                {/* Static Card */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-20 opacity-60"></div>

                {/* MOVING CARD - Starts here */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-24 flex flex-col justify-between animate-kanban-move relative">
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100"></div>
                        <div className="h-2 w-12 bg-slate-100 rounded-full mt-1"></div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full"></div>
                </div>

                {/* Filler Card to use vertical space */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-16 opacity-30"></div>
            </div>

            {/* Column 2 (Em Negociação) */}
            <div className="flex-1 flex flex-col gap-3 min-w-[100px] bg-slate-100/50 p-2 rounded-xl h-full">
                <div className="h-1.5 w-16 bg-purple-400 rounded-full mb-1 ml-1"></div>
                {/* Static Card in Col 2 */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-24 flex flex-col justify-between opacity-50">
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100"></div>
                        <div className="h-2 w-12 bg-slate-100 rounded-full mt-1"></div>
                    </div>
                </div>
                {/* Filler Card */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-20 opacity-30"></div>
            </div>

            {/* Column 3 (Fechado) */}
            <div className="flex-1 flex flex-col gap-3 opacity-40 min-w-[100px] bg-slate-100/50 p-2 rounded-xl h-full">
                <div className="h-1.5 w-10 bg-green-500 rounded-full mb-1 ml-1"></div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-28"></div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-16 opacity-50"></div>
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

        <div className="relative z-10 w-80 scale-110">
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