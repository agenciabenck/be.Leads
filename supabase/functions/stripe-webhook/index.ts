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
    } catch (err) {
        return new Response(err.message, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object
            // Atualizar customer_id se ainda não tiver
            // Atualizar status para active
            break

        case 'customer.subscription.updated':
            const subscription = event.data.object
            await updateSubscription(subscription)
            break

        case 'customer.subscription.deleted':
            const deletedSubscription = event.data.object
            await updateSubscription(deletedSubscription)
            break
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
})

async function updateSubscription(subscription: any) {
    const customerId = subscription.customer

    const { data: customer } = await supabaseClient
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (customer) {
        // Map product ID to plan name logic here if needed, or store product ID
        // For simplicity, we just store status and current_period_end
        await supabaseClient
            .from('user_subscriptions')
            .update({
                status: subscription.status,
                stripe_subscription_id: subscription.id,
                current_period_end: new Date(subscription.current_period_end * 1000)
            })
            .eq('user_id', customer.user_id)
    }
}
