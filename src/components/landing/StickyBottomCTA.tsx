import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { Zap } from 'lucide-react';

const StickyBottomCTA: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Target section to hide the bar (Pricing)
      const pricingSection = document.getElementById('pricing');

      // 1. Show after scrolling past Hero (approx 600px)
      const isPastHero = scrollY > 600;

      // 2. Hide when Pricing section comes into view
      let isBeforePricing = true;
      if (pricingSection) {
        const pricingTop = pricingSection.offsetTop;
        // Check if the bottom of the viewport has reached the pricing section
        if (scrollY + windowHeight > pricingTop + 100) {
          isBeforePricing = false;
        }
      }

      setIsVisible(isPastHero && isBeforePricing);
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-4 transition-all duration-500 ease-in-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'}`}
    >
      <div className="container mx-auto max-w-3xl">
        <div className="bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/5 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3 text-left">
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center shrink-0">
              <Zap size={20} className="text-primary fill-primary" />
            </div>
            <div>
              <p className="text-white font-bold text-sm md:text-base leading-tight">
                Transforme o Google Maps em dinheiro.
              </p>
            </div>
          </div>

          <Button size="sm" className="shadow-lg shadow-primary/20 whitespace-nowrap shrink-0">
            Começar grátis
          </Button>

        </div>
      </div>
    </div>
  );
};

export default StickyBottomCTA;