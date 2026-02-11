import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const PRICE_MAP: Record<string, string> = {
    "price_1SzdGU3fc3cZuklGVPzlU4Fi": 'start',
    "price_1SzdGu3fc3cZuklGDHAMMsBR": 'start',
    "price_1SzdHi3fc3cZuklG5rtVblVa": 'pro',
    "price_1SzdI83fc3cZuklGDBe9TJVy": 'pro',
    "price_1SzdJQ3fc3cZuklGzmncl1Oh": 'elite',
    "price_1SzdJi3fc3cZuklGhjinw5av": 'elite'
};

async function updateSubscription(subscription: any) {
    const customerId = subscription.customer
    const priceId = subscription.items?.data[0]?.price?.id;
    const planName = PRICE_MAP[priceId] || 'free';
    const status = subscription.status;
    const subscriptionId = subscription.id;

    const { data: customer } = await supabaseClient
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (customer) {
        await supabaseClient
            .from('user_subscriptions')
            .update({
                stripe_subscription_id: subscriptionId,
                status: status,
                plan_id: planName,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('user_id', customer.user_id)
    }
}

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')
    const body = await req.text()
    let event

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
            undefined,
            cryptoProvider
        )
    } catch (err: any) {
        return new Response(err.message, { status: 400 })
    }

    switch (event.type) {
        case 'checkout.session.completed':
            if (event.data.object.subscription) {
                const subscription = await stripe.subscriptions.retrieve(event.data.object.subscription);
                await updateSubscription(subscription);
            }
            break
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            await updateSubscription(event.data.object)
            break
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
})
