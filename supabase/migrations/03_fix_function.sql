-- FIX: Update add_stamp function to recognize 'barista' role
-- Run this in Supabase SQL Editor

create or replace function add_stamp(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  caller_role text;
begin
  -- Check if caller is barista or admin
  select role into caller_role from profiles where id = auth.uid();
  
  -- Updated check to include 'barista'
  if caller_role not in ('barista', 'staff', 'admin') then
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
