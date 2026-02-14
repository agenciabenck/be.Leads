import React from 'react';

const niches = [
  "Academias", "Restaurantes", "Clínicas odontológicas", "Imobiliárias", 
  "Escolas de idiomas", "Pet shops", "Salões de beleza", "Oficinas mecânicas", 
  "Advogados", "Contadores", "Marketing digital", "Construtoras"
];

const Marquee: React.FC = () => {
  return (
    <div className="w-full py-10 bg-[#050508] border-y border-white/5 relative overflow-hidden z-20">
      <div className="absolute inset-y-0 left-0 w-20 md:w-60 bg-gradient-to-r from-[#050508] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 md:w-60 bg-gradient-to-l from-[#050508] to-transparent z-10" />
      
      <div className="flex w-full">
        {/* Container 1 */}
        <div className="flex animate-marquee min-w-full shrink-0 items-center justify-around gap-16 pr-16">
            {niches.map((niche, i) => (
              <div key={i} className="flex items-center gap-4 shrink-0 group">
                  <span className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_10px_#0068ff] transition-all duration-300"></span>
                  <span className="text-lg font-bold text-slate-500 group-hover:text-white transition-colors duration-300 uppercase tracking-widest">
                    {niche}
                  </span>
              </div>
            ))}
        </div>
        {/* Container 2 (Duplicate) */}
        <div className="flex animate-marquee min-w-full shrink-0 items-center justify-around gap-16 pr-16" aria-hidden="true">
            {niches.map((niche, i) => (
              <div key={`dup-${i}`} className="flex items-center gap-4 shrink-0 group">
                  <span className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_10px_#0068ff] transition-all duration-300"></span>
                  <span className="text-lg font-bold text-slate-500 group-hover:text-white transition-colors duration-300 uppercase tracking-widest">
                    {niche}
                  </span>
              </div>
            ))}
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Marquee;