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
        if (!stripeKey) throw new Error('Configuração de pagamento ausente (STRIPE_SECRET_KEY)');

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        })

        let returnUrl: string;
        let flowType: 'default' | 'subscription_update' = 'default';
        let targetPriceId: string | null = null;

        try {
            const body = await req.json();
            returnUrl = body.returnUrl;
            if (body.flowType) flowType = body.flowType;
            if (body.targetPriceId) targetPriceId = body.targetPriceId;
        } catch (e) {
            throw new Error('Corpo da requisição inválido');
        }

        const { data: subscriptionData } = await supabaseClient
            .from('user_subscriptions')
            .select('stripe_customer_id, stripe_subscription_id')
            .eq('user_id', user.id)
            .single()

        if (!subscriptionData?.stripe_customer_id) {
            throw new Error('Nenhum cliente Stripe encontrado para este usuário');
        }

        const portalConfig: any = {
            customer: subscriptionData.stripe_customer_id,
            return_url: returnUrl || req.headers.get('origin') || '',
        };

        // If it's an upgrade flow, we target the specific price and confirmation screen
        if (targetPriceId && subscriptionData.stripe_subscription_id) {
            // We need to fetch the subscription to get the correct subscription item ID
            const subscription = await stripe.subscriptions.retrieve(subscriptionData.stripe_subscription_id);
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
            // Generic management portal flow
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
        console.error('PORTAL ERROR:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
