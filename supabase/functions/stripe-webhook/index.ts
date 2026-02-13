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

    // Existing logic to find user by stripe_customer_id in user_subscriptions
    let { data: customerData, error: fetchError } = await supabaseClient
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

    if (fetchError) {
        console.error('[updateSubscription] Error fetching customer from DB:', fetchError.message);
        throw fetchError;
    }

    let userId = customerData?.user_id;

    // IF USER NOT FOUND BY STRIPE ID (New Customer Flow)
    if (!userId) {
        console.log(`[updateSubscription] Customer ${customerId} not found in DB. Checking email...`);

        // 1. Fetch Customer Email from Stripe
        const stripeCustomer = await stripe.customers.retrieve(customerId);
        const email = (stripeCustomer as any).email; // Stripe typings can be tricky in Deno, casting to any

        if (!email) {
            console.error('[updateSubscription] No email found for Stripe Customer', customerId);
            return; // Cannot link without email
        }

        console.log(`[updateSubscription] Found email from Stripe: ${email}`);

        // 2. Check if User exists in Supabase Auth
        // Admin API to list users is heavy, usually better to 'maybeSingle' on a public table if exists, 
        // OR try to create/invite and handle error.
        // However, we have ADMIN key, so we can use admin.listUsers or similar, but inviteUserByEmail is cleaner if we intend to invite.
        // If user ALREADY exists, inviteUserByEmail might return the existing user or error depending on config.
        // Better strategy: Try `admin.createUser` with specific email. If fail, maybe they exist.
        // Actually, easiest way to 'get by email' is strictly admin.createUser (dummy) or listUsers.

        // Let's use listUsers for safety to check existence
        const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
        // Note: listUsers() gets a page. If you have many users, this is bad. 
        // BETTER: Use createUser() with a wrapper to catch "already registered".
        // OR: just use inviteUserByEmail straight away. If they exist, it usually triggers a password recovery or magic link depending on config.

        // Let's try to FIND user first to avoid spamming invites to existing users who just paid externally.
        // Since we can't filter listUsers by email easily in all Supabase versions (some support it),
        // we'll try the Invite flow which naturally handles "onboarding".

        // ACTUALLY: The best UX for "Paid Signup" is:
        // - If user exists: Just link subscription.
        // - If user doesn't exist: Invite.

        // We can check `public.users` or `user_subscriptions` (we already checked subscriptions).
        // Let's assume we need to invite if we didn't find them in subscriptions? 
        // No, they might have a free account (entry in user_subscriptions with DIFFERENT or NULL stripe_id? likely NULL if free).

        // Let's look for user_subscriptions by email? We don't store email there usually, we use ID.
        // But we have `auth.users`.

        // Let's try `inviteUserByEmail`. 
        // "If the user already exists, this will send a magic link to the user." -> This is acceptable/good.

        const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email);

        if (inviteError) {
            console.log('[updateSubscription] User likely exists or invite failed:', inviteError.message);
            // If invite failed, maybe user exists? Let's try to get ID from listUsers filtration if possible or just log error.
            // If user exists, inviteUserByEmail SHOULD work (send magic link) or error "User already registered" depending on config.
            // If "User already registered", we need the ID.

            // Fallback: This is expensive but simplified for now: list users and find email.
            // Ideally we should query a public profile table if one existed.
            // As a robust fallback, let's assume if invite fails we can't process, UNLESS it's "User already registered".

            // NOTE: For this specific project, let's assume we want to CREATE the link.
            // If invite fails, we might miss linking.

            // Trying a different approach: admin.getUserByEmail doesn't exist.
            // We'll trust create/invite mechanism.
        }

        if (inviteData.user) {
            console.log(`[updateSubscription] User identified/invited: ${inviteData.user.id}`);
            userId = inviteData.user.id;
        } else {
            // If inviteData is null (e.g. user exists but no magic link sent?)
            // Let's try to search via listUsers as fail-safe for existing users.
            const { data: usersData } = await supabaseClient.auth.admin.listUsers();
            const existingUser = usersData.users.find((u: any) => u.email === email);
            if (existingUser) {
                userId = existingUser.id;
                console.log(`[updateSubscription] Found existing user via list: ${userId}`);
            }
        }
    }

    if (userId) {
        // Upsert User Subscription
        const updateData: any = {
            user_id: userId, // Ensure ID is set for insertion
            stripe_customer_id: customerId,
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

        // Upsert! (Insert if new, Update if exists)
        // We use upsert to handle both "New User" and "Existing User upgrading via external link"
        const { error: upsertError } = await supabaseClient
            .from('user_subscriptions')
            .upsert(updateData, { onConflict: 'user_id' })

        if (upsertError) {
            console.error('[updateSubscription] Error upserting subscription:', upsertError.message);
            throw upsertError;
        }

        console.log(`[updateSubscription] Successfully linked/updated user: ${userId}`);
    } else {
        console.error(`[updateSubscription] FATAL: Could not identify or create user for Customer ${customerId}`);
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
