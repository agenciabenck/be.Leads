import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('--- START PORTAL SESSION CREATION ---');
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Authorization header is missing');

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) throw new Error(`Auth Error: ${userError?.message || 'User not found'}`);

        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is missing');

        // Explicitly setting the API version to support the 'flow' parameter
        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        let body;
        try {
            body = await req.json();
        } catch (e) {
            throw new Error('Req body is not valid JSON');
        }

        const { returnUrl, flowType = 'default', targetPriceId } = body;

        const { data: subscriptionData, error: dbError } = await supabaseClient
            .from('user_subscriptions')
            .select('stripe_customer_id, stripe_subscription_id')
            .eq('user_id', user.id)
            .single()

        if (dbError) throw new Error(`Database Error: ${dbError.message}`);
        if (!subscriptionData?.stripe_customer_id) {
            throw new Error(`Customer not found for user ${user.id}`);
        }

        const portalConfig: any = {
            customer: subscriptionData.stripe_customer_id,
            return_url: returnUrl || req.headers.get('origin') || '',
        };

        if (targetPriceId && subscriptionData.stripe_subscription_id) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionData.stripe_subscription_id);
            if (!subscription.items.data[0]) throw new Error('Subscription has no items');
            const itemId = subscription.items.data[0].id;

            portalConfig.flow = {
                type: 'subscription_update_confirm',
                subscription_update_confirm: {
                    subscription: subscriptionData.stripe_subscription_id,
                    items: [{
                        id: itemId,
                        price: targetPriceId,
                    }],
                },
            };
        } else if (flowType === 'subscription_update' && subscriptionData.stripe_subscription_id) {
            portalConfig.flow = {
                type: 'subscription_update',
                subscription_update: {
                    subscription: subscriptionData.stripe_subscription_id,
                },
            };
        }

        const session = await stripe.billingPortal.sessions.create(portalConfig)

        return new Response(
            JSON.stringify({ url: session.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('PORTAL ERROR:', error.message);
        return new Response(
            JSON.stringify({ error: error.message, detail: error.raw?.message || null }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
