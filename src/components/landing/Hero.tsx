import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Zap, LayoutDashboard, Search, Users, Settings, LogOut, CheckCircle2, PieChart, DollarSign, Home, ArrowRight } from 'lucide-react';
import Button from './ui/Button';

const Hero: React.FC = () => {
  // ... (lines 8-105 remain unchanged)


  const heroRef = useRef<HTMLDivElement>(null);
  const notifRef1 = useRef<HTMLDivElement>(null);
  const notifRef2 = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let ctx: gsap.Context;
    // Defer animation to reduce TBT (Total Blocking Time)
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        // Intro Animation
        const tl = gsap.timeline();

        // Only animate Badge (Bullet) as requested
        tl.from(".hero-badge", { y: -20, opacity: 0, duration: 0.6, ease: "power3.out" });

        // Main Content (Title, Desc, Btns) is now immediate for LCP

        // Visual Illustration Animation (Kept as requested)
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
    }, 100);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, []);

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={heroRef} className="relative pt-24 lg:pt-28 pb-8 md:pb-12 px-5 sm:px-6 md:px-10 min-h-[85vh] lg:min-h-[680px] flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0f]">

      {/* Background Glows & Effects - Enhanced Visibility */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0a0a0f] to-[#0a0a0f] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/20 rounded-full blur-[100px] -z-10 animate-blob opacity-50" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] -z-10 animate-blob animation-delay-2000 opacity-40" />

      <div className="container mx-auto max-w-7xl px-2 sm:px-4 md:px-12 relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">

        {/* Left Content */}
        <div className="hero-content text-left space-y-5 lg:space-y-6">
          <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] sm:text-xs font-bold tracking-wide uppercase mb-6 whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Instagram, LinkedIn e Maps Integrados
          </div>

          {/* Title: Standardized to 3 lines (as requested) with 50px and 1.15 leading */}
          <h1 className="hero-title text-3xl sm:text-4xl lg:text-[50px] font-bold lg:leading-[1.15] leading-[1.15] tracking-tighter">
            <span className="block">Plataforma completa</span>
            <span className="block">
              para <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066ff] to-blue-400 whitespace-nowrap">buscar e gerenciar</span>
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066ff] to-blue-400 block">seus leads.</span>
          </h1>

          {/* Desc: Updated to force 3 lines on mobile and span normally on larger screens */}
          <p className="hero-desc text-[15px] sm:text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
            Encontre milhares de clientes qualificados em segundos, <br className="block sm:hidden" />
            valide contatos em tempo real e gerencie <br className="block sm:hidden" />
            todo o seu pipeline em um CRM integrado.
          </p>

          <div className="hero-btns-container flex flex-col gap-4 items-center lg:items-start pt-1">
            <div className="hero-btns flex flex-col sm:flex-row gap-3 justify-center lg:justify-start w-full">
              <Button size="lg" icon={<Zap className="w-5 h-5" fill="currentColor" />} className="w-full sm:w-auto px-8 py-3 text-base" onClick={scrollToPricing}>
                Gerar leads grátis
              </Button>
              <Button variant="secondary" size="lg" icon={<ArrowRight className="w-5 h-5" />} onClick={scrollToPricing} className="w-full sm:w-auto px-8 py-3 text-base">
                Ver planos
              </Button>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Teste com 60 créditos inclusos. Sem cartão de crédito.
            </p>
          </div>


        </div>

        {/* Right Visual - Illustrative "Light Mode" Dashboard Updated */}
        <div className="hero-visual relative perspective-[2000px] mt-10 lg:mt-0 flex flex-col items-center">
          <div className="dashboard-container relative z-10 rounded-[2rem] bg-[#0f172a] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden group flex h-[280px] sm:h-[340px] lg:h-[380px] w-full max-w-[540px] mx-auto">

            {/* Sidebar - Wide, Dark, Rounded Top Right */}
            <div className="w-14 sm:w-24 bg-[#0f172a] flex flex-col items-center flex-shrink-0 py-3 sm:py-6 gap-2 sm:gap-6 relative z-20 rounded-tr-[30px]">
              <div className="mb-0.5 sm:mb-1">
                {/* Logo Icon */}
                <img src="/beleadly_logo_h1.png" alt="beleadly" width="40" height="40" className="w-6 sm:w-10 h-auto opacity-90" />
              </div>

              {/* Active State (Home) - Wide Button */}
              <div className="w-9 sm:w-16 h-7 sm:h-9 rounded-lg bg-primary text-white flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 relative">
                <Home size={14} />
                <div className="hidden sm:block w-6 h-1.5 bg-white/30 rounded-full"></div>
              </div>

              {/* Inactive States - All 5 visible now */}
              {[Search, LayoutDashboard, Users, Settings].map((Icon, i) => (
                <div key={i} className="w-9 sm:w-16 h-7 sm:h-9 rounded-lg text-slate-500 flex items-center justify-center gap-1.5 opacity-70 hover:bg-white/5 transition-colors">
                  <Icon size={14} />
                  <div className="hidden sm:block w-6 h-1.5 bg-slate-700/50 rounded-full"></div>
                </div>
              ))}
            </div>

            {/* Main Content Area - Wide, Light, Straight (No Rounding per user request) */}
            <div className="flex-1 bg-[#f1f5f9] relative flex flex-col p-2.5 sm:p-5 lg:p-6 overflow-hidden">

              {/* Header Abstract */}
              <div className="flex items-center justify-between mb-3 sm:mb-6">
                <div>
                  <div className="h-2.5 sm:h-4 w-16 sm:w-28 bg-slate-300 rounded-full mb-1 sm:mb-1.5"></div>
                  <div className="h-2 sm:h-2.5 w-24 sm:w-40 bg-slate-200 rounded-full"></div>
                </div>
                <div className="flex gap-2 sm:gap-2.5">
                  <div className="w-20 sm:w-28 h-7 sm:h-9 rounded-full bg-white border border-slate-200 hidden sm:block shadow-sm"></div>
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-green-600">
                    <CheckCircle2 size={12} />
                  </div>
                </div>
              </div>

              {/* Dashboard Grid - Illustrative */}
              <div className="grid grid-cols-12 gap-1.5 sm:gap-4 h-full content-start">
                {/* Row 1: 3 Stats Cards - ALL VISIBLE ON MOBILE NOW */}
                <div className="col-span-4 bg-white rounded-lg sm:rounded-2xl p-1.5 sm:p-4 shadow-sm flex flex-col justify-between border border-slate-100/50 aspect-square sm:aspect-auto">
                  <div className="w-5 h-5 sm:w-9 sm:h-9 rounded sm:rounded-xl bg-blue-50 flex items-center justify-center mb-0.5 sm:mb-1.5"><PieChart size={10} className="text-blue-500 sm:w-4 sm:h-4" /></div>
                  <div className="h-1.5 sm:h-4 w-6 sm:w-14 bg-slate-100 rounded-md mb-0.5"></div>
                  <div className="h-1 sm:h-1.5 w-full bg-slate-50 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-blue-500 rounded-full"></div></div>
                </div>
                <div className="col-span-4 bg-white rounded-lg sm:rounded-2xl p-1.5 sm:p-4 shadow-sm flex flex-col justify-between border border-slate-100/50 aspect-square sm:aspect-auto">
                  <div className="w-5 h-5 sm:w-9 sm:h-9 rounded sm:rounded-xl bg-emerald-50 flex items-center justify-center mb-0.5 sm:mb-1.5"><Users size={10} className="text-emerald-500 sm:w-4 sm:h-4" /></div>
                  <div className="h-1.5 sm:h-4 w-5 sm:w-8 bg-slate-100 rounded-md mb-0.5"></div>
                  <div className="flex -space-x-0.5 sm:-space-x-1.5"><div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-slate-200 ring-1 sm:ring-2 ring-white"></div><div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-slate-300 ring-1 sm:ring-2 ring-white"></div></div>
                </div>
                {/* DOLLAR CARD - NOW VISIBLE ON MOBILE */}
                <div className="col-span-4 bg-white rounded-lg sm:rounded-2xl p-1.5 sm:p-4 shadow-sm flex flex-col justify-between border border-slate-100/50 aspect-square sm:aspect-auto">
                  <div className="w-5 h-5 sm:w-9 sm:h-9 rounded sm:rounded-xl bg-emerald-50 flex items-center justify-center mb-0.5 sm:mb-1.5"><DollarSign size={10} className="text-emerald-500 sm:w-4 sm:h-4" /></div>
                  <div className="h-1.5 sm:h-4 w-8 sm:w-16 bg-slate-100 rounded-md mb-0.5"></div>
                  <div className="h-1 sm:h-1.5 w-1/2 bg-emerald-500 rounded-full"></div>
                </div>

                {/* Row 2: Agenda (Wide) + Tasks - NOW VISIBLE (Small) ON MOBILE */}
                <div className="col-span-8 bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-sm relative overflow-hidden border border-slate-100/50 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1 sm:mb-3">
                    <div className="h-2 sm:h-3 w-12 sm:w-20 bg-slate-200 rounded-full"></div>
                    <div className="h-2 sm:h-3 w-2 sm:w-3 bg-slate-100 rounded-full"></div>
                  </div>
                  {/* Calendar Grid Abstract */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1 opacity-50">
                    {[...Array(7)].map((_, i) => <div key={i} className="aspect-square rounded sm:rounded-md bg-slate-50"></div>)}
                    <div className="aspect-square rounded sm:rounded-md bg-blue-500/10 border border-blue-200"></div>
                    {/* Show fewer items on mobile to fit */}
                    <div className="hidden sm:grid grid-cols-6 col-span-6 gap-1 contents">
                      {[...Array(6)].map((_, i) => <div key={i} className="aspect-square rounded-md bg-slate-50"></div>)}
                    </div>
                  </div>
                </div>
                <div className="col-span-4 bg-[#1e293b] rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center border border-slate-700/50">
                  <div className="w-6 h-6 sm:w-10 sm:h-10 rounded sm:rounded-xl bg-slate-700/50 mb-1 sm:mb-2 flex items-center justify-center"><LayoutDashboard size={12} className="text-slate-400 sm:w-4 sm:h-4" /></div>
                  <div className="h-1 sm:h-2 w-8 sm:w-16 bg-slate-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Notifications - High Contrast against Dark Background */}
          {/* Centered on mobile relative to visual, moved down slightly */}
          <div className="absolute right-0 top-6 lg:-right-4 lg:top-12 z-30 w-56 lg:w-64 pointer-events-none scale-90 lg:scale-95 origin-top-right flex flex-col items-end">
            <div ref={notifRef1} className="glass-card p-3 rounded-xl flex items-center gap-3 mb-3 border-l-4 border-green-500 shadow-xl backdrop-blur-xl bg-[#161b22]/90 ring-1 ring-white/10">
              <div className="p-2 bg-green-500/20 rounded-full text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.2)]"><CheckCircle2 size={16} /></div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Busca concluída</p>
                <p className="text-xs font-bold text-white">+470 Leads novos</p>
              </div>
            </div>

            <div ref={notifRef2} className="glass-card p-3 rounded-xl flex items-center gap-3 mb-3 border-l-4 border-blue-500 shadow-xl backdrop-blur-xl bg-[#161b22]/90 ring-1 ring-white/10">
              <div className="p-2 bg-blue-500/20 rounded-full text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.2)]"><Users size={16} /></div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">CRM Inteligente</p>
                <p className="text-xs font-bold text-white">Lead movido para 'Negociação'</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section >
  );
};

export default Hero;