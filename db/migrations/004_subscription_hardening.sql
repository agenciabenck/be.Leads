-- 1. Create permissions function for plan limits (UPDATED with actual values)
create or replace function public.get_plan_limit(plan_text text)
returns int as $$
begin
    return case plan_text
        when 'free' then 60
        when 'start' then 500
        when 'pro' then 1200
        when 'elite' then 3200
        else 60
    end;
end;
$$ language plpgsql;

-- 2. Create consume_credits RPC
create or replace function public.consume_credits(amount int)
returns json as $$
declare
    usr_id uuid := auth.uid();
    sub public.user_subscriptions%rowtype;
    limit_val int;
    new_usage int;
    reset_date timestamptz;
    next_reset timestamptz;
begin
    -- Get subscription with lock to prevent race conditions
    select * from public.user_subscriptions 
    where user_id = usr_id 
    for update
    into sub;

    if not found then
        return json_build_object('success', false, 'message', 'Plano não encontrado');
    end if;

    -- Handle Monthly Reset logic
    -- Reset date is stored in DB. If null, assume now.
    reset_date := coalesce(sub.last_credit_reset, now());
    next_reset := reset_date + interval '1 month';
    
    if now() >= next_reset then
        -- Reset credits
        update public.user_subscriptions
        set leads_used = 0, last_credit_reset = now()
        where user_id = usr_id;
        
        -- Update local variable to reflect reset
        sub.leads_used := 0;
    end if;

    -- Check limits
    limit_val := public.get_plan_limit(sub.plan_id);
    
    if (sub.leads_used + amount) > limit_val then
        return json_build_object(
            'success', false, 
            'message', 'Créditos insuficientes',
            'current', sub.leads_used,
            'limit', limit_val
        );
    end if;

    -- Deduct
    update public.user_subscriptions
    set leads_used = sub.leads_used + amount
    where user_id = usr_id
    returning leads_used into new_usage;

    return json_build_object('success', true, 'new_usage', new_usage);
end;
$$ language plpgsql security definer;

-- 3. Create ensure_free_plan RPC
create or replace function public.ensure_free_plan()
returns void as $$
declare
    usr_id uuid := auth.uid();
begin
    insert into public.user_subscriptions (user_id, plan_id, leads_used, last_credit_reset, status)
    values (usr_id, 'free', 0, now(), 'active')
    on conflict (user_id) do nothing;
end;
$$ language plpgsql security definer;

-- 4. Lockdown RLS
alter table public.user_subscriptions enable row level security;

-- Drop old loose policies if they exist (ignoring errors if they don't)
drop policy if exists "Service role can manage subscriptions" on public.user_subscriptions;
drop policy if exists "Users can view own subscription" on public.user_subscriptions;

-- Re-create View Policy: Authenticated users can view their own
create policy "Users can view own subscription"
on public.user_subscriptions for select
to authenticated
using (auth.uid() = user_id);

-- Explicitly DENY insert/update for authenticated users by NOT creating a policy for them.
-- Only service_role (implicit bypass) and security definer functions can write.
