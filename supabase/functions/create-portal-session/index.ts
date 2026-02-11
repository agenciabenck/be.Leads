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

        try {
            const body = await req.json();
            returnUrl = body.returnUrl;
            if (body.flowType) flowType = body.flowType;
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

        if (flowType === 'subscription_update' && subscriptionData.stripe_subscription_id) {
            const updateData: any = {
                type: 'subscription_update',
                subscription_update: {
                    subscription: subscriptionData.stripe_subscription_id,
                },
            };

            if (body.targetPriceId) {
                updateData.subscription_update.items = [{
                    id: subscriptionData.stripe_subscription_item_id, // We need to store this or fetch it.
                    // WAIT. If we don't have the item ID, we can't easily update.
                    // Stripe requires the 'price' for new items or 'id' for existing items.
                    // For a simple swap (most SaaS), we usually replace the item.

                    // Actually, for a single subscription item, we can just pass the new price 
                    // IF we know the item ID.
                    // Since we don't store stripe_subscription_item_id in DB yet, we should fetch it from stripe 
                    // OR just rely on the portal letting them choose (IF config is valid).

                    // STRATEGY SHIFT:
                    // If we want to force the selection, we MUST know the subscription item ID.
                    // Let's fetch the subscription from Stripe first to get the item ID.
                }];
            }

            // Re-writing the block below to fetch subscription first if targetPriceId is present
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
