import React from 'react';
import { TrendingUp, Link, LayoutDashboard, Infinity, ArrowRight, Users } from 'lucide-react';
import Button from './ui/Button';

const AffiliateSection: React.FC = () => {
    const benefits = [
        {
            icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
            title: "Comissão Recorrente",
            description: "Ganhe não apenas na primeira venda, mas todos os meses. Sua receita cresce junto com o tempo de permanência do seu indicado na plataforma."
        },
        {
            icon: <Link className="w-5 h-5 text-blue-400" />,
            title: "Tracking Transparente",
            description: "Sistema robusto e preciso. Você saberá exatamente de onde veio cada clique, cadastro e assinatura gerada pelo seu link exclusivo."
        },
        {
            icon: <LayoutDashboard className="w-5 h-5 text-blue-400" />,
            title: "Dashboard do Parceiro",
            description: "Acompanhe seus resultados em tempo real. Visualize acessos, leads gerados, conversões e solicite seus saques direto na sua área de membros."
        },
        {
            icon: <Infinity className="w-5 h-5 text-blue-400" />,
            title: "Escala sem Limites",
            description: "Não há teto de ganhos. Quanto mais empresas você ajudar a modernizar a prospecção com o BELEADLY, maior será sua receita passiva mensal."
        }
    ];

    return (
        <section className="py-24 px-4 md:px-8 relative overflow-hidden bg-[#0a0a0f]">
            {/* Premium Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] -z-10" />

            <div className="container mx-auto max-w-6xl relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold tracking-wide uppercase">
                            <Users size={14} className="text-blue-500" />
                            <span>PROGRAMA DE PARCEIROS</span>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl sm:text-4xl lg:text-[50px] lg:leading-[1.15] font-bold leading-[1.15] tracking-tight text-balance">
                                Transforme suas indicações em <span className="text-blue-500">receita recorrente.</span>
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed text-balance">
                                Indique nossa plataforma para clientes, parceiros de negócios ou outras agências e receba 20% de comissão todos os meses, enquanto eles forem assinantes.
                            </p>
                        </div>

                        <Button
                            size="lg"
                            className="px-8 group"
                            icon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Quero ser um parceiro
                        </Button>
                        <p className="text-xs text-slate-500 mt-3 text-left">
                            Necessário criar uma conta no BELEADLY
                        </p>
                    </div>

                    {/* Right: Benefits Grid */}
                    <div className="grid sm:grid-cols-2 gap-6 pb-4">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 leading-[1.15]">
                                    {benefit.title}
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AffiliateSection;
