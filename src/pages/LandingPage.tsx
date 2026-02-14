import React, { useEffect } from 'react';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Marquee from '@/components/landing/Marquee';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';
import StickyBottomCTA from '@/components/landing/StickyBottomCTA';

const LandingPage: React.FC = () => {

    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
        return () => {
            document.documentElement.style.scrollBehavior = 'auto';
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#050508] text-white selection:bg-primary/30 selection:text-white relative">

            {/* Fixed Grid Background (Dark Mode Areas) */}
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />

            {/* Fixed Orb Backgrounds (Global Dark Areas) */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-blob pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] animate-blob animation-delay-2000 pointer-events-none z-0" />

            {/* Main Content */}
            <div className="relative z-10">
                <Header />
                <main>
                    <Hero />
                    <Marquee />

                    {/* UNIFIED LIGHT SECTION WRAPPER */}
                    {/* IMPORTANT: Removed overflow-hidden to allow sticky positioning in Features */}
                    <div className="relative bg-[#f8fafc] border-y border-slate-200 group">

                        {/* 1. Base Subtle Noise Texture */}
                        <div className="absolute inset-0 opacity-[0.4] mix-blend-multiply pointer-events-none z-0"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")` }}>
                        </div>

                        {/* 2. Pastel Gradient Blobs - Contained in their own overflow-hidden div to prevent horizontal scrollbar */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-300/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 mix-blend-multiply"></div>
                            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-300/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 mix-blend-multiply"></div>
                        </div>

                        {/* 3. Dot Matrix Pattern */}
                        <div className="absolute inset-0 z-0 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                                backgroundSize: '32px 32px',
                                opacity: 0.15
                            }}>
                        </div>

                        {/* 4. Vignette / Depth Fade at edges */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80 pointer-events-none z-0"></div>

                        {/* Components with transparent backgrounds */}
                        <div className="relative z-10">
                            <Features />
                            <HowItWorks />
                        </div>
                    </div>

                    <Testimonials />
                    <Pricing />
                    <FAQ />
                    <FinalCTA />
                </main>
                <Footer />
                <StickyBottomCTA />
            </div>
        </div>
    );
}

export default LandingPage;
