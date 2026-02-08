-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
-- Links to Supabase Auth users
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text check (role in ('customer', 'staff', 'admin')) default 'customer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- STAMPS TABLE
create table stamps (
  user_id uuid references profiles(id) not null primary key,
  count int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table stamps enable row level security;

create policy "Users can view own stamps"
  on stamps for select
  using ( auth.uid() = user_id );

-- TRANSACTION LOGS TABLE
create table transaction_logs (
  id uuid default uuid_generate_v4() primary key,
  staff_id uuid references profiles(id) not null,
  user_id uuid references profiles(id) not null,
  location_id text, -- For future multi-branch support
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table transaction_logs enable row level security;

-- Only staff/admin can view transaction logs (or maybe just their own scans?)
create policy "Staff can view logs they created"
  on transaction_logs for select
  using ( auth.uid() = staff_id );

create policy "Admins can view all logs"
  on transaction_logs for select
  using ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    ) 
  );

-- DATABASE FUNCTION: Add Stamp
-- Securely adds a stamp and logs the transaction
create or replace function add_stamp(target_user_id uuid)
returns void
language plpgsql
security definer -- Runs with permissions of the function creator (admin)
as $$
declare
  caller_role text;
begin
  -- Check if caller is staff or admin
  select role into caller_role from profiles where id = auth.uid();
  
  if caller_role not in ('staff', 'admin') then
    raise exception 'Unauthorized: Only staff can add stamps.';
  end if;

  -- 1. Upsert stamp count
  insert into stamps (user_id, count)
  values (target_user_id, 1)
  on conflict (user_id)
  do update set 
    count = stamps.count + 1,
    updated_at = now();

  -- 2. Log transaction
  insert into transaction_logs (staff_id, user_id)
  values (auth.uid(), target_user_id);
  
end;
$$;
