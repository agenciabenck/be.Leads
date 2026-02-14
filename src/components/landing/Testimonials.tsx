import React from 'react';
import { Star } from 'lucide-react';
import { Testimonial } from '@/types/landing';

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ricardo Silva",
    role: "Dono de agência",
    image: "https://picsum.photos/100/100?random=10",
    content: "O Be.Leads salvou minha agência. Antes gastávamos horas procurando clientes manuais. Hoje extraímos 500 leads em 10 minutos.",
    rating: 5
  },
  {
    id: 2,
    name: "Amanda Costa",
    role: "Freelancer de web design",
    image: "https://picsum.photos/100/100?random=11",
    content: "Fechei 3 sites na primeira semana usando a lista que gerei. A ferramenta se pagou no primeiro dia de uso.",
    rating: 5
  },
  {
    id: 3,
    name: "Pedro Santos",
    role: "Consultor SEO",
    image: "https://picsum.photos/100/100?random=12",
    content: "A precisão dos dados é incrível. Quase não tenho e-mails voltando. O melhor extrator do mercado brasileiro, sem dúvidas.",
    rating: 5
  }
];

const Testimonials: React.FC = () => {
  return (
    // DARK SESSION: Deep Black to reset rhythm
    <section className="py-16 md:py-24 px-6 relative overflow-hidden bg-[#050508] border-t border-white/5">

      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Standardized Title Typography */}
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-white tracking-tight">
          Quem usa, <span className="text-gradient-primary">recomenda</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.id} className="glass p-8 rounded-2xl border border-white/5 hover:border-primary/30 hover:-translate-y-2 transition-all duration-300 bg-[#08080c]/50 relative group">
              {/* Top Gradient Line on Hover */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>

              <p className="text-slate-300 mb-8 italic text-lg leading-relaxed font-normal">"{t.content}"</p>

              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full border border-white/10" />
                <div>
                  <h4 className="font-bold text-white text-base">{t.name}</h4>
                  <p className="text-sm text-slate-500 font-medium">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;