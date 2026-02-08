-- MIGRATION: Add missing columns to profiles table
-- Run this in Supabase SQL Editor

alter table profiles 
add column if not exists client_code text,
add column if not exists first_name text;

-- Optional: Add index for client_code if we query by it often
create index if not exists idx_profiles_client_code on profiles(client_code);

-- Update RLS if needed (usually not for adding columns unless we filter by them)
-- Ensure users can update these fields
create policy "Users can update own profile fields"
on profiles for update
using ( auth.uid() = id )
with check ( auth.uid() = id );
