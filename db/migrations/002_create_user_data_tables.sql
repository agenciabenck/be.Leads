-- Create crm_leads table for server-side persistence
create table public.crm_leads (
    id text primary key, -- Google Place ID or manual ID
    user_id uuid references auth.users not null,
    name text not null,
    category text,
    address text,
    phone text,
    website text,
    rating numeric,
    reviews integer,
    status text default 'prospecting', -- 'prospecting', 'contacted', 'negotiating', 'won', 'lost'
    priority text default 'medium',    -- 'low', 'medium', 'high'
    potential_value numeric default 0,
    notes text,
    google_maps_link text,
    instagram text,
    tags text[],
    added_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS for leads
alter table public.crm_leads enable row level security;

create policy "Users can manage own leads"
    on public.crm_leads
    for all
    using (auth.uid() = user_id);

-- Create search_history table
create table public.search_history (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    query text not null,
    search_mode text, -- 'free', 'guided'
    created_at timestamptz default now()
);

-- Enable RLS for history
alter table public.search_history enable row level security;

create policy "Users can view own history"
    on public.search_history
    for all
    using (auth.uid() = user_id);

-- Index for performance
create index crm_leads_user_id_idx on public.crm_leads(user_id);
create index search_history_user_id_idx on public.search_history(user_id);

-- Update trigger for updated_at
create trigger handle_updated_at_leads
    before update on public.crm_leads
    for each row
    execute function public.handle_updated_at();
