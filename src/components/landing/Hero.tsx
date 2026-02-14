import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Zap, LayoutDashboard, Search, Users, Settings, LogOut, CheckCircle2, PieChart, DollarSign, Home } from 'lucide-react';
import Button from './ui/Button';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const notifRef1 = useRef<HTMLDivElement>(null);
  const notifRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro Animation
      const tl = gsap.timeline();

      tl.from(".hero-badge", { y: -20, opacity: 0, duration: 0.6, ease: "power3.out" })
        .from(".hero-title", { y: 50, opacity: 0, duration: 1, ease: "power4.out" }, "-=0.3")
        .from(".hero-desc", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
        .from(".hero-btns", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.4")
        .from(".hero-social", { opacity: 0, duration: 0.6 }, "-=0.2");

      gsap.from(".hero-visual", {
        y: 100,
        opacity: 0,
        scale: 0.95,
        duration: 1.5,
        delay: 0.2,
        ease: "power3.out",
      });

      // Floating Notifications Loop
      const notifTl = gsap.timeline({ repeat: -1 });
      const notifs = [notifRef1.current, notifRef2.current];

      notifs.forEach((notif) => {
        if (!notif) return;
        notifTl.fromTo(notif,
          { y: 20, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
        )
          .to(notif, { opacity: 0, y: -20, scale: 0.95, duration: 0.4, delay: 2.5 });
      });

      // Gentle Float for Dashboard
      gsap.to(".dashboard-container", {
        y: -15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={heroRef} className="relative pt-24 lg:pt-32 pb-16 px-6 min-h-[90vh] lg:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050508]">

      {/* Background Glows & Effects - Enhanced Visibility */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-[#050508] to-[#050508] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-blob opacity-60" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] -z-10 animate-blob animation-delay-2000 opacity-50" />

      <div className="container mx-auto max-w-7xl relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

        {/* Left Content */}
        <div className="hero-content text-center lg:text-left space-y-6 lg:space-y-8">
          {/* Badge: Updated Text */}
          {/* Badge: Updated Visual to match "Mais Popular" */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600/90 to-indigo-600/90 border border-blue-400/30 text-xs text-white font-bold tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.4)] mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            IA + Google Maps = Leads infinitos
          </div>

          {/* Title: Adjusted size for notebook fit */}
          <h1 className="hero-title text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
            Transforme o <br />
            Google Maps em <br />
            uma <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 relative z-10">máquina de</span>
              <div className="absolute -inset-1 bg-primary/20 blur-xl -z-10 rounded-lg"></div>
            </span> <br />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 relative z-10">leads</span>
              <div className="absolute -inset-1 bg-primary/20 blur-xl -z-10 rounded-lg"></div>
            </span> automática.
          </h1>

          {/* Desc: Adjusted max-w and spacing */}
          <p className="hero-desc text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
            Extraia milhares de contatos qualificados, telefones e e-mails de empresas locais em segundos. Encha seu pipeline de vendas enquanto dorme.
          </p>

          <div className="hero-btns flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
            <Button size="lg" icon={<Zap className="w-5 h-5" fill="currentColor" />} className="w-full sm:w-auto px-8">
              Gerar leads grátis
            </Button>
            <Button variant="secondary" size="lg" onClick={scrollToPricing} className="w-full sm:w-auto px-8">
              Ver planos
            </Button>
          </div>

          <div className="hero-social flex items-center gap-4 justify-center lg:justify-start text-xs sm:text-sm text-slate-500 pt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://picsum.photos/40/40?random=${i + 20}`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#050508] ring-2 ring-white/5" alt="User" />
              ))}
            </div>
            <div className="flex flex-col items-start">
              <div className="flex gap-0.5 text-yellow-500">
                <span className="text-xs">★★★★★</span>
              </div>
              <span className="font-medium text-slate-300">Mais de 2.400 empresas ativas</span>
            </div>
          </div>
        </div>

        {/* Right Visual - Illustrative "Light Mode" Dashboard Updated */}
        <div className="hero-visual relative perspective-[2000px] mt-8 lg:mt-0">
          <div className="dashboard-container relative z-10 rounded-[2.5rem] bg-[#0f172a] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden group flex h-[360px] sm:h-[400px] lg:h-[420px] w-full max-w-[600px] mx-auto box-content">

            {/* Sidebar - Wide, Dark, Rounded Top Right */}
            <div className="w-28 bg-[#0f172a] flex flex-col items-center flex-shrink-0 py-8 gap-8 relative z-20 rounded-tr-[40px]">
              <div className="mb-2">
                {/* Logo Icon */}
                <img src="https://i.postimg.cc/ZKTLpRxM/logo-beleads-h1-1.png" alt="Be.Leads" className="w-12 h-auto opacity-90" />
              </div>

              {/* Active State (Home) - Wide Button */}
              <div className="w-20 h-10 rounded-xl bg-primary text-white flex items-center justify-center gap-2 shadow-lg shadow-primary/20 relative">
                <Home size={18} />
                <div className="w-8 h-2 bg-white/30 rounded-full"></div>
              </div>

              {/* Inactive States */}
              {[Search, LayoutDashboard, Users, Settings].map((Icon, i) => (
                <div key={i} className="w-20 h-10 rounded-xl text-slate-500 flex items-center justify-center gap-2 opacity-70 hover:bg-white/5 transition-colors">
                  <Icon size={18} />
                  <div className="w-8 h-2 bg-slate-700/50 rounded-full"></div>
                </div>
              ))}
            </div>

            {/* Main Content Area - Wide, Light, Straight (No Rounding per user request) */}
            <div className="flex-1 bg-[#f1f5f9] relative flex flex-col p-6 sm:p-8 overflow-hidden">

              {/* Header Abstract */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="h-5 w-32 bg-slate-300 rounded-full mb-2"></div>
                  <div className="h-3 w-48 bg-slate-200 rounded-full"></div>
                </div>
                <div className="flex gap-3">
                  <div className="w-32 h-10 rounded-full bg-white border border-slate-200 hidden sm:block shadow-sm"></div>
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-green-600">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
              </div>

              {/* Dashboard Grid - Illustrative */}
              <div className="grid grid-cols-12 gap-5 h-full">
                {/* Row 1: 3 Stats Cards */}
                <div className="col-span-4 bg-white rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col justify-between border border-slate-100/50">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-2"><PieChart size={18} className="text-blue-500" /></div>
                  <div className="h-5 w-16 bg-slate-100 rounded-md mb-1"></div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-blue-500 rounded-full"></div></div>
                </div>
                <div className="col-span-4 bg-white rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col justify-between border border-slate-100/50">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center mb-2"><Users size={18} className="text-purple-500" /></div>
                  <div className="h-5 w-10 bg-slate-100 rounded-md mb-1"></div>
                  <div className="flex -space-x-2"><div className="w-6 h-6 rounded-full bg-slate-200 ring-2 ring-white"></div><div className="w-6 h-6 rounded-full bg-slate-300 ring-2 ring-white"></div></div>
                </div>
                <div className="col-span-4 bg-white rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col justify-between border border-slate-100/50 hidden sm:flex">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-2"><DollarSign size={18} className="text-emerald-500" /></div>
                  <div className="h-5 w-20 bg-slate-100 rounded-md mb-1"></div>
                  <div className="h-2 w-1/2 bg-emerald-500 rounded-full"></div>
                </div>

                {/* Row 2: Agenda (Wide) + Tasks */}
                <div className="col-span-8 bg-white rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden border border-slate-100/50">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-4 w-24 bg-slate-200 rounded-full"></div>
                    <div className="h-4 w-4 bg-slate-100 rounded-full"></div>
                  </div>
                  {/* Calendar Grid Abstract */}
                  <div className="grid grid-cols-7 gap-1.5 opacity-50">
                    {[...Array(14)].map((_, i) => <div key={i} className="aspect-square rounded-lg bg-slate-50"></div>)}
                    <div className="col-span-2 aspect-square rounded-lg bg-blue-500/10 border border-blue-200"></div>
                  </div>
                </div>
                <div className="col-span-4 bg-[#1e293b] rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center border border-slate-700/50">
                  <div className="w-12 h-12 rounded-2xl bg-slate-700/50 mb-3 flex items-center justify-center"><LayoutDashboard size={20} className="text-slate-400" /></div>
                  <div className="h-2.5 w-20 bg-slate-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Notifications - High Contrast against Dark Background */}
          <div className="absolute -right-4 top-8 lg:-right-8 lg:top-16 z-30 w-64 lg:w-72 pointer-events-none scale-90 lg:scale-100 origin-top-right">
            <div ref={notifRef1} className="glass-card p-4 rounded-2xl flex items-center gap-4 mb-4 border-l-4 border-green-500 shadow-2xl backdrop-blur-xl bg-[#161b22]/90 ring-1 ring-white/10">
              <div className="p-3 bg-green-500/20 rounded-full text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]"><CheckCircle2 size={20} /></div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Status do sistema</p>
                <p className="text-sm font-bold text-white">+5 Leads novos</p>
              </div>
            </div>

            <div ref={notifRef2} className="glass-card p-4 rounded-2xl flex items-center gap-4 mb-4 border-l-4 border-blue-500 shadow-2xl backdrop-blur-xl bg-[#161b22]/90 ring-1 ring-white/10">
              <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.2)]"><Users size={20} /></div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Enriquecimento</p>
                <p className="text-sm font-bold text-white">E-mail CEO validado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;