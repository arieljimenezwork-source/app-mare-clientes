-- MIGRATION: Phase 2 - Role-Based Architecture
-- Run this entire script in the Supabase SQL Editor

-- 1. Create SHOPS table (Multi-tenant support)
create table if not exists shops (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  admin_pin text not null, -- Simple text for MVP
  config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Update PROFILES table
-- Add new columns
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists shop_id uuid references shops(id);

-- Update role Enum constraint
-- We are changing 'staff' to 'barista' for clarity, but if you want to keep 'staff' as 'barista', that's fine too.
-- Let's standardize on: 'customer', 'barista', 'admin'
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('customer', 'barista', 'admin'));

-- 3. Create REDEMPTIONS table (For approval queue)
create table if not exists redemptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  shop_id uuid references shops(id) not null,
  staff_id uuid references profiles(id), -- Who processed it
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  reward_id text, -- e.g. "free_coffee"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

-- 4. Update TRANSACTION_LOGS
alter table transaction_logs add column if not exists type text check (type in ('add_stamp', 'redeem_reward')) default 'add_stamp';

-- 5. Enable RLS on new tables
alter table shops enable row level security;
alter table redemptions enable row level security;

-- 6. Setup Basic Policies (Open for now, restricted later)
create policy "Shops are viewable by public" on shops for select using (true);

create policy "Users view own redemptions" on redemptions for select using (auth.uid() = user_id);
create policy "Staff view shop redemptions" on redemptions for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('barista', 'admin'))
);

create policy "Staff can update redemptions" on redemptions for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('barista', 'admin'))
);

-- 7. SEED DATA: Create the first Shop 'Mare Cafe'
insert into shops (name, admin_pin, config)
values ('Mare Cafe', '1234', '{"theme": "brown"}'::jsonb)
on conflict do nothing;

-- NOTE: You will need to manually link your existing staff profile to this shop_id once created.
