-- MIGRATION: Add client_code to stamps table
-- Run this in Supabase SQL Editor

alter table stamps 
add column if not exists client_code text;

-- Add index for performance/filtering
create index if not exists idx_stamps_client_code on stamps(client_code);
