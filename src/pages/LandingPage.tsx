import React, { useEffect, Suspense } from 'react';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Marquee from '@/components/landing/Marquee';
import StickyBottomCTA from '@/components/landing/StickyBottomCTA';

// Lazy load below-the-fold components
const PainPoints = React.lazy(() => import('@/components/landing/PainPoints'));
const Features = React.lazy(() => import('@/components/landing/Features'));
const HowItWorks = React.lazy(() => import('@/components/landing/HowItWorks'));
// const Testimonials = React.lazy(() => import('@/components/landing/Testimonials'));
const AffiliateSection = React.lazy(() => import('@/components/landing/AffiliateSection'));
const BonusSection = React.lazy(() => import('@/components/landing/BonusSection'));
const Pricing = React.lazy(() => import('@/components/landing/Pricing'));
const FAQ = React.lazy(() => import('@/components/landing/FAQ'));
const FinalCTA = React.lazy(() => import('@/components/landing/FinalCTA'));
const Footer = React.lazy(() => import('@/components/landing/Footer'));

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
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-blob pointer-events-none z-0 will-change-transform" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] animate-blob animation-delay-2000 pointer-events-none z-0 will-change-transform" />

            {/* Main Content */}
            <div className="relative z-10">
                <Header />
                <main>
                    <Hero />
                    <Marquee />

                    <Suspense fallback={
                        <div className="w-full h-screen bg-slate-50 dark:bg-slate-900 animate-pulse flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    }>
                        {/* UNIFIED LIGHT SECTION WRAPPER */}
                        {/* IMPORTANT: Removed overflow-hidden to allow sticky positioning in Features */}
                        <div className="relative bg-[#f1f5f9] border-y border-slate-200 group">

                            {/* Components with clean background */}
                            <div className="relative z-10">
                                <PainPoints />
                                <Features />
                                <HowItWorks />
                            </div>
                        </div>

                        <BonusSection />
                        {/* <Testimonials /> */}
                        <AffiliateSection />
                        <Pricing />
                        <FAQ />
                        <FinalCTA />
                    </Suspense>
                </main>
                <Suspense fallback={null}>
                    <Footer />
                </Suspense>
                <StickyBottomCTA />
            </div>
        </div>
    );
}

export default LandingPage;
