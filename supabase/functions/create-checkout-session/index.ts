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
        // 1. Log request start
        console.log('Received create-checkout-session request');

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            console.error('Auth User Error:', authError);
            throw new Error('User not authenticated or not found')
        }

        console.log(`User authenticated: ${user.id}`);

        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            throw new Error('STRIPE_SECRET_KEY is missing in Edge Function secrets');
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // Create Admin Client for DB operations (bypass RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { priceId, isAnnual } = await req.json()

        if (!priceId) {
            throw new Error('priceId is required');
        }
        console.log(`Request params - Price: ${priceId}, Annual: ${isAnnual}`);

        // 1. Check if user already has a Stripe Customer ID
        const { data: subscriptionData } = await supabaseAdmin
            .from('user_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single()

        let customerId = subscriptionData?.stripe_customer_id
        console.log(`Existing Customer ID: ${customerId || 'None'}`);

        // 2. If not, create a new Customer in Stripe
        if (!customerId) {
            console.log('Creating new Stripe customer...');
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id
                }
            })
            customerId = customer.id

            // Save to DB using Admin Client
            await supabaseAdmin
                .from('user_subscriptions')
                .upsert({
                    user_id: user.id,
                    stripe_customer_id: customerId,
                    status: 'incomplete' // Initial status
                })
        }

        // 3. Create Checkout Session using the priceId
        console.log(`Creating session for customer: ${customerId}`);
        const origin = req.headers.get('origin') || 'http://localhost:5173'; // Fallback for testing

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/?canceled=true`,
            allow_promotion_codes: true,
        })

        console.log(`Session created: ${session.url}`);

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('CRITICAL EDGE FUNCTION ERROR:', error);
        return new Response(
            JSON.stringify({
                error: error.message || 'Unknown error',
                stack: error.stack,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200, // Return 200 so frontend can parse the JSON error
            }
        )
    }
})
