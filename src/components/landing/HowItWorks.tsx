import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Server, TrendingUp, ArrowRight } from 'lucide-react';
import Button from './ui/Button';

gsap.registerPlugin(ScrollTrigger);

const HowItWorks: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

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
            start: "top 60%",
            end: "center center",
            scrub: 1
          }
        }
      );

      // Pop in the steps
      gsap.from(".timeline-step", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.3,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 60%",
        }
      });

      // Animate the main CTA
      gsap.from(".main-cta", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 1,
        scrollTrigger: {
          trigger: ".timeline-step:last-child",
          start: "top 70%",
        }
      });

    }, containerRef);
    return () => ctx.revert();
  }, []);

  const steps = [
    {
      id: "01",
      icon: <Search className="w-6 h-6 text-white" />,
      title: "Busque seu nicho",
      desc: "Defina o tipo de negócio e a cidade (ex: Pizzarias em Curitiba).",
      color: "bg-blue-600 shadow-blue-600/30",
      cta: "Testar busca agora"
    },
    {
      id: "02",
      icon: <Server className="w-6 h-6 text-white" />,
      title: "A ferramenta extrai",
      desc: "Nossa IA varre o Google Maps e valida telefones e e-mails.",
      color: "bg-purple-600 shadow-purple-600/30",
      cta: "Ver funcionamento"
    },
    {
      id: "03",
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      title: "Você vende",
      desc: "Receba a lista pronta e aborde clientes que precisam de você.",
      color: "bg-emerald-500 shadow-emerald-500/30",
      cta: "Simular lucro"
    }
  ];

  return (
    <section id="how-it-works" ref={containerRef} className="py-12 md:py-20 px-6 relative bg-transparent overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">

        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Como funciona
          </h2>
        </div>

        <div className="relative mb-10">
          {/* The Connecting Line (Absolute) */}
          <div className="absolute top-[3rem] left-0 w-full h-1 bg-slate-100 rounded-full hidden md:block">
            <div ref={lineRef} className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500 origin-left rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="timeline-step flex flex-col items-center text-center group">

                {/* Circle Icon Node */}
                <div className={`w-24 h-24 rounded-full ${step.color} shadow-xl flex items-center justify-center mb-8 relative z-10 transition-transform duration-300 group-hover:scale-110 ring-8 ring-white`}>
                  {step.icon}
                  {/* Number Badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                    {step.id}
                  </div>
                </div>

                {/* Text Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed max-w-xs mb-6 font-normal">{step.desc}</p>

                {/* Item CTA */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 !hover:bg-blue-50 font-bold group/btn"
                  icon={<ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />}
                >
                  {step.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Section CTA */}
        <div className="main-cta flex flex-col items-center justify-center relative z-10 mt-12">
          <Button size="lg" className="shadow-2xl shadow-blue-500/20 px-12 py-5 text-lg">
            Gerar meus leads agora
          </Button>
          <p className="mt-4 text-sm text-slate-400 font-normal">Teste gratuito disponível sem compromisso</p>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;