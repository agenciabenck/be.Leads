import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Authorization header is missing')

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) throw new Error('Usuário não encontrado')

        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is missing');

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2024-06-20',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const { targetPriceId, coupon } = await req.json();
        if (!targetPriceId) throw new Error('Price ID obrigatório');

        const { data: subscriptionData } = await supabaseClient
            .from('user_subscriptions')
            .select('stripe_subscription_id')
            .eq('user_id', user.id)
            .single()

        if (!subscriptionData?.stripe_subscription_id) throw new Error('Assinatura não encontrada');

        const subscription = await stripe.subscriptions.retrieve(subscriptionData.stripe_subscription_id);
        const itemId = subscription.items.data[0].id;

        const updateParams: any = {
            items: [{ id: itemId, price: targetPriceId }],
            proration_behavior: 'always_invoice',
            payment_behavior: 'allow_incomplete',
        };

        if (coupon) {
            updateParams.coupon = coupon;
        }

        const updatedSubscription = await stripe.subscriptions.update(subscriptionData.stripe_subscription_id, updateParams);

        return new Response(
            JSON.stringify({ success: true, subscription: updatedSubscription }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('ERROR:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
