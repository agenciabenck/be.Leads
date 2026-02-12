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

    console.log(`[updateSubscription] Customer: ${customerId}, Price: ${priceId}, Plan: ${planName}, Status: ${status}`);

    if (!customerId) {
        console.error('[updateSubscription] Missing customer ID');
        return;
    }

    const { data: customer, error: fetchError } = await supabaseClient
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

    if (fetchError) {
        console.error('[updateSubscription] Error fetching customer:', fetchError.message);
        throw fetchError;
    }

    if (customer) {
        const updateData: any = {
            stripe_subscription_id: subscriptionId,
            status: status,
            plan_id: planName,
            billing_cycle: subscription.plan?.interval || 'monthly',
            current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            updated_at: new Date().toISOString()
        };

        // Reset credits on renewal or new subscription
        updateData.leads_used = 0;

        const { error: updateError } = await supabaseClient
            .from('user_subscriptions')
            .update(updateData)
            .eq('user_id', customer.user_id)

        if (updateError) {
            console.error('[updateSubscription] Error updating subscription:', updateError.message);
            throw updateError;
        }

        console.log(`[updateSubscription] Successfully updated user: ${customer.user_id}`);
    } else {
        console.warn(`[updateSubscription] No user found for customer ID: ${customerId}`);
    }
}

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')
    const body = await req.text()
    let event

    console.log('--- WEBHOOK EVENT RECEIVED ---')
    console.log('Type:', req.method)
    console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())))

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
            undefined,
            cryptoProvider
        )
        console.log('Event verified:', event.type)
    } catch (err: any) {
        console.error('Signature verification failed:', err.message)
        return new Response(err.message, { status: 400 })
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                if (event.data.object.subscription) {
                    console.log('Processing checkout.session.completed for subscription:', event.data.object.subscription)
                    const subscription = await stripe.subscriptions.retrieve(event.data.object.subscription)
                    await updateSubscription(subscription)
                }
                break
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                console.log(`Processing ${event.type} for:`, event.data.object.id)
                await updateSubscription(event.data.object)
                break
            default:
                console.log('Unhandled event type:', event.type)
        }
    } catch (error: any) {
        console.error('Error processing webhook:', error.message)
        // Return 500 to trigger Stripe retry
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
})
