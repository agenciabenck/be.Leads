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
            apiVersion: '2024-06-20',
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
            console.log('Mode: subscription_update_confirm', { targetPriceId });

            // Get the current subscription item ID (required for update_confirm)
            const subscription = await stripe.subscriptions.retrieve(subscriptionData.stripe_subscription_id);
            const itemId = subscription.items.data[0]?.id;

            if (!itemId) throw new Error('O item da assinatura atual não foi encontrado.');

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
            console.log('Mode: subscription_update (menu)');
            portalConfig.flow = {
                type: 'subscription_update',
                subscription_update: {
                    subscription: subscriptionData.stripe_subscription_id,
                },
            };
        }

        console.log('Final Portal Config:', JSON.stringify(portalConfig, null, 2));

        let session;
        try {
            // Explicitly pass the version here too, sometimes required in edge environments
            session = await stripe.billingPortal.sessions.create(portalConfig, {
                apiVersion: '2024-06-20' as any
            });
        } catch (stripeError: any) {
            console.error('Stripe Portal Creation Error:', stripeError.message);

            // For debugging: Do not fallback silently if targetPriceId was provided
            if (targetPriceId) {
                console.error('Target Price ID was provided but Portal creation failed. Error:', stripeError.message);
                throw new Error(`Stripe Portal Error: ${stripeError.message}. Verifique se o preço ${targetPriceId} está habilitado no Portal.`);
            }

            // Fallback for general usage
            if (portalConfig.flow) {
                console.log('Falling back to basic portal...');
                delete portalConfig.flow;
                session = await stripe.billingPortal.sessions.create(portalConfig);
            } else {
                throw stripeError;
            }
        }

        return new Response(
            JSON.stringify({
                url: session.url,
                debug: {
                    flow_used: portalConfig.flow?.type || 'default',
                    targetPriceId: targetPriceId || null
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('PORTAL ERROR:', error.message);

        let message = error.message;
        let suggestion = null;

        if (message.includes('No such customer')) {
            message = 'ID de cliente não encontrado no Stripe.';
            suggestion = 'Como você resetou sua conta Stripe, o ID antigo é inválido. Por favor, realize um novo checkout.';
        } else if (message.includes('API key')) {
            message = 'Chave de API do Stripe inválida.';
            suggestion = 'Verifique se a STRIPE_SECRET_KEY no Supabase está correta para sua nova conta.';
        }

        return new Response(
            JSON.stringify({
                error: message,
                suggestion: suggestion
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
