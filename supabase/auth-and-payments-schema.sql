-- ============================================================================
-- Auth & Payments Schema
-- Run this in Supabase SQL Editor to set up user profiles, subscriptions,
-- and credit system tables.
-- ============================================================================

-- User profiles (linked to Supabase auth.users)
create table if not exists user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  stripe_customer_id text unique,
  credits integer not null default 0,
  anonymous_player_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscriptions
create table if not exists user_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id) on delete cascade not null,
  stripe_subscription_id text unique not null,
  stripe_price_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Credit transaction log (audit trail)
create table if not exists credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id) on delete cascade not null,
  amount integer not null,
  reason text not null,
  stripe_session_id text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_user_subscriptions_user on user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_stripe on user_subscriptions(stripe_subscription_id);
create index if not exists idx_credit_transactions_user on credit_transactions(user_id);
create index if not exists idx_user_profiles_stripe on user_profiles(stripe_customer_id);

-- RLS policies
alter table user_profiles enable row level security;
alter table user_subscriptions enable row level security;
alter table credit_transactions enable row level security;

-- Users can read their own profile
create policy "Users read own profile"
  on user_profiles for select using (auth.uid() = id);

-- Users can update their own display_name
create policy "Users update own profile"
  on user_profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can read their own subscriptions
create policy "Users read own subscriptions"
  on user_subscriptions for select using (auth.uid() = user_id);

-- Users can read their own credit transactions
create policy "Users read own transactions"
  on credit_transactions for select using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Atomic credit deduction function
create or replace function deduct_credits(p_user_id uuid, p_amount integer, p_reason text)
returns integer as $$
declare
  current_credits integer;
begin
  select credits into current_credits from user_profiles where id = p_user_id for update;
  if current_credits < p_amount then
    return -1;
  end if;
  update user_profiles set credits = credits - p_amount, updated_at = now() where id = p_user_id;
  insert into credit_transactions (user_id, amount, reason) values (p_user_id, -p_amount, p_reason);
  return current_credits - p_amount;
end;
$$ language plpgsql security definer;
