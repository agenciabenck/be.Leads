import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error('Usuário não encontrado')

        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) throw new Error('Configuração de pagamento ausente');

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const { targetPriceId } = await req.json();
        if (!targetPriceId) throw new Error('Price ID obrigatório');

        // 1. Get current subscription
        const { data: subscriptionData } = await supabaseClient
            .from('user_subscriptions')
            .select('stripe_subscription_id')
            .eq('user_id', user.id)
            .single()

        if (!subscriptionData?.stripe_subscription_id) {
            throw new Error('Assinatura não encontrada para upgrade.');
        }

        // 2. Retrieve Stripe Subscription to get Item ID
        const subscription = await stripe.subscriptions.retrieve(subscriptionData.stripe_subscription_id);
        const itemId = subscription.items.data[0].id;

        // 3. Update Subscription
        // proration_behavior: 'always_invoice' -> Calculate and charge immediately
        const updatedSubscription = await stripe.subscriptions.update(subscriptionData.stripe_subscription_id, {
            items: [{
                id: itemId,
                price: targetPriceId,
            }],
            proration_behavior: 'always_invoice',
            pending_invoice_item_interval: {
                interval: 'month',
                interval_count: 1, // Reset billing cycle anchor? No, usually we keep anchor or reset it.
                // Actually, for immediate charge, we don't need this.
                // Just 'always_invoice' attempts to pay the diff now.
            },
            payment_behavior: 'pending_if_incomplete', // If payment fails, don't update yet (or use 'allow_incomplete')
        });

        return new Response(
            JSON.stringify({ success: true, subscription: updatedSubscription }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('UPDATE SUB ERROR:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
