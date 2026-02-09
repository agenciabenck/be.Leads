import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface StripeSubscription {
    id: string;
    customer: string;
    status: string;
    current_period_end: number;
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
        console.error(`Webhook Error: ${err.message}`);
        return new Response(err.message, { status: 400 })
    }

    switch (event.type) {
        case 'checkout.session.completed':
            // Logic for checkout completion if needed
            break

        case 'customer.subscription.updated':
            await updateSubscription(event.data.object as StripeSubscription)
            break

        case 'customer.subscription.deleted':
            await updateSubscription(event.data.object as StripeSubscription)
            break
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
})

async function updateSubscription(subscription: StripeSubscription) {
    const customerId = subscription.customer

    const { data: customer } = await supabaseClient
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (customer) {
        await supabaseClient
            .from('user_subscriptions')
            .update({
                status: subscription.status,
                stripe_subscription_id: subscription.id,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('user_id', customer.user_id)
    }
}
