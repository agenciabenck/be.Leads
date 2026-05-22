import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';

export const AffiliateTracker = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            localStorage.setItem('affiliate_ref', ref);
            console.log('Affiliate captured:', ref);

            // Track click in background
            // We use a simple check to avoid double counting in strict mode or immediate re-renders, 
            // though for MVP accurate unique clicks might need more logic (cookies/IP).
            // Here we just fire and forget.
            const trackClick = async () => {
                try {
                    const { error } = await supabase.rpc('track_affiliate_click', { affiliate_id: ref });
                    if (error) console.error('[Affiliate] Error tracking click:', error.message);
                } catch (err) {
                    console.error('[Affiliate] Unexpected error:', err);
                }
            };
            trackClick();
        }
    }, [searchParams]);

    return null;
};
