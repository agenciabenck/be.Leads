import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import Button from './ui/Button';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? 'py-4 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5' : 'py-6 bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4 md:px-12 max-w-7xl flex items-center justify-between relative">

        {/* Left Side: Logo + Nav */}
        <div className="flex items-center gap-12">
          {/* Logo */}
          <div
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}
            className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2 z-50 relative"
          >
            <img
              src="/beleadly_logo_h1.png"
              alt="beleadly"
              width={150}
              height={40}
              className="h-8 md:h-10 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation (Left Aligned after Logo) */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Funcionalidades
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Como funciona
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Planos
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              FAQ
            </button>
          </nav>
        </div>

        {/* Right Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/login')}
          >
            Acessar conta
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary-600 text-white px-6 py-2 shadow-lg hover:shadow-primary/20"
            onClick={() => scrollToSection('pricing')}
          >
            Começar grátis
          </Button>
        </div>

        {/* Mobile Actions (Login + Menu) */}
        <div className="md:hidden z-50 relative flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Acessar conta"
          >
            <User size={24} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-0 left-0 right-0 min-h-screen bg-[#0a0a0f] z-40 flex flex-col pt-24 px-4 pb-8 gap-6 animate-in slide-in-from-top-10 duration-300">
            <div className="flex flex-col gap-4 items-start">
              <button
                onClick={() => scrollToSection('features')}
                className="text-lg font-medium text-slate-300 hover:text-white transition-colors py-2 border-b border-white/5 w-full text-left"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-lg font-medium text-slate-300 hover:text-white transition-colors py-2 border-b border-white/5 w-full text-left"
              >
                Como funciona
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-lg font-medium text-slate-300 hover:text-white transition-colors py-2 border-b border-white/5 w-full text-left"
              >
                Planos
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-lg font-medium text-slate-300 hover:text-white transition-colors py-2 border-b border-white/5 w-full text-left"
              >
                FAQ
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary-600 text-white shadow-lg"
                onClick={() => { scrollToSection('pricing'); setMobileMenuOpen(false); }}
              >
                Começar grátis
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full text-slate-300 hover:text-white"
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
              >
                Acessar conta
              </Button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;