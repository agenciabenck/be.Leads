import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Server, TrendingUp, ArrowRight } from 'lucide-react';
import Button from './ui/Button';

gsap.registerPlugin(ScrollTrigger);

const HowItWorks: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Animate the connecting line
      gsap.fromTo(lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.5,
          ease: "power3.inOut",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
            end: "center center",
            scrub: 1
          }
        }
      );

      // Pop in the steps
      const steps = gsap.utils.toArray('.timeline-step');
      gsap.fromTo(steps,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 60%",
          }
        }
      );

      // Animate the main CTA
      gsap.fromTo(".main-cta",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: 0.8,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 60%",
          }
        }
      );

    }, containerRef);
    return () => ctx.revert();
  }, []);

  const steps = [
    {
      id: "01",
      icon: <Search className="w-8 h-8 text-[#0066ff]" />,
      title: "Busque seu nicho",
      desc: "Defina o tipo de negócio e a cidade (ex: Pizzarias em Curitiba).",
      color: "hover:border-blue-400",
      cta: "Testar busca agora",
      action: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
    },
    {
      id: "02",
      icon: <Server className="w-8 h-8 text-[#0066ff]" />,
      title: "A ferramenta extrai",
      desc: "Nossa IA varre o Google Maps e valida telefones e e-mails.",
      color: "hover:border-blue-400",
      cta: "Ver funcionamento",
      action: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
    },
    {
      id: "03",
      icon: <TrendingUp className="w-8 h-8 text-[#0066ff]" />,
      title: "Você vende",
      desc: "Receba a lista pronta e aborde clientes que precisam de você.",
      color: "hover:border-blue-400",
      cta: "Simular lucro",
      action: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
    }
  ];

  return (
    <section id="how-it-works" ref={containerRef} className="py-12 md:py-20 px-4 md:px-12 relative">
      <div className="container mx-auto max-w-7xl relative z-10">

        <div className="text-left md:text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-[50px] lg:leading-[1.15] font-bold text-slate-900 tracking-tight">
            Como funciona
          </h2>
        </div>

        <div className="relative mb-10">
          {/* The Connecting Line (Absolute) */}
          <div className="absolute top-[3rem] left-0 w-full h-1 bg-slate-200 rounded-full hidden md:block">
            <div ref={lineRef} className="h-full bg-gradient-to-r from-[#0066ff] to-blue-400 origin-left rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="timeline-step group relative p-8 rounded-[2rem] bg-white/80 backdrop-blur-md border border-slate-200/60 transition-all duration-300 hover:bg-white hover:border-primary/30 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
              >
                {/* squircle icon container */}
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:border-primary/20 transition-all duration-500">
                  {step.icon}
                </div>

                <div className="mb-4">
                  {/* Step label removed */}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed max-w-xs mb-6 font-normal opacity-80 text-sm">
                  {step.desc}
                </p>

                {/* Number Badge (Subtle) */}
                {/* Number Badge (Subtle) - Removed */}
              </div>
            ))}
          </div>
        </div>

        {/* Main Section CTA */}
        <div className="main-cta flex flex-col items-center justify-center relative z-10 mt-12">
          <Button size="lg" className="shadow-2xl shadow-blue-500/20 px-12 py-5 text-lg" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
            Extrair leads agora
          </Button>
          <p className="mt-4 text-sm text-slate-400 font-normal">Teste gratuito disponível sem compromisso</p>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;