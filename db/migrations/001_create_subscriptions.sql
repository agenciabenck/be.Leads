-- Create user_subscriptions table
create table public.user_subscriptions (
  user_id uuid references auth.users not null primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_id text, -- 'start', 'pro', 'elite'
  status text check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_subscriptions enable row level security;

-- Policies
create policy "Users can view own subscription"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

-- Only service role (Edge Functions) can insert/update
create policy "Service role can manage subscriptions"
  on public.user_subscriptions
  using (true)
  with check (true);

-- Function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger handle_updated_at
  before update on public.user_subscriptions
  for each row
  execute function public.handle_updated_at();
