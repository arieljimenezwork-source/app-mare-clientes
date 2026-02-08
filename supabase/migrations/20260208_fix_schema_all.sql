-- MIGRATION: Fix Schema (Consolidated)
-- Run this in Supabase SQL Editor to unblock the dashboard

-- 1. Fix Profiles Table
alter table profiles 
add column if not exists client_code text,
add column if not exists first_name text;

-- 2. Fix Stamps Table (Add client_code for insert compatibility)
alter table stamps 
add column if not exists client_code text;

-- 3. Add Indexes for performance
create index if not exists idx_profiles_client_code on profiles(client_code);
create index if not exists idx_stamps_client_code on stamps(client_code);

-- 4. Ensure RLS allows reading these new columns (usually automatic, but good to check)
-- No changes needed to policies if "select using (true)" is active for profiles.
