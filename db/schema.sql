-- 1. Criação da Tabela de Perfis (Vinculada ao Auth do Supabase)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free', -- free, start, pro, elite
  credits_used int default 0,
  pipeline_goal numeric default 10000,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  primary key (id)
);

-- 2. Ativar RLS (Row Level Security) para Perfis
alter table public.profiles enable row level security;

-- Política: Usuário só vê e edita o próprio perfil
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 3. Trigger para criar perfil automaticamente ao se cadastrar
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Criação da Tabela de Leads (CRM)
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  name text not null,
  category text,
  address text,
  phone text,
  website text,
  instagram text,
  rating numeric,
  reviews int,
  
  status text default 'prospecting', -- prospecting, contacted, negotiation, won, lost
  priority text default 'medium',    -- low, medium, high
  potential_value numeric default 0,
  notes text,
  tags text[], -- Array de strings
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Ativar RLS para Leads
alter table public.leads enable row level security;

-- Política: Usuário só vê, cria, edita e deleta seus próprios leads
create policy "Users can CRUD own leads" on public.leads
  for all using (auth.uid() = user_id);

-- 6. Índices para performance
create index leads_user_id_idx on public.leads(user_id);
create index leads_status_idx on public.leads(status);
