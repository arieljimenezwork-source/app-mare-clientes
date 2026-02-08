-- SECURITY UPDATE: 24h Cooldown Logic
-- Run this in Supabase SQL Editor

-- Drop previous function signature to allow adding new parameter
drop function if exists add_stamp(uuid);

create or replace function add_stamp(target_user_id uuid, force_override boolean default false)
returns jsonb
language plpgsql
security definer
as $$
declare
  caller_role text;
  last_scan timestamp;
  shop_config jsonb;
  result_message text;
begin
  -- 1. Check permissions
  select role into caller_role from profiles where id = auth.uid();
  if caller_role not in ('staff', 'admin') then
    return jsonb_build_object('success', false, 'message', 'Unauthorized');
  end if;

  -- 2. Check 24h Rule (Unless forced)
  if not force_override then
      select created_at into last_scan 
      from transaction_logs 
      where user_id = target_user_id 
        and type = 'add_stamp'
        and created_at > (now() - interval '24 hours')
      order by created_at desc 
      limit 1;

      if last_scan is not null then
         return jsonb_build_object('success', false, 'code', 'COOLDOWN_ACTIVE', 'message', 'Ya se escaneó hace menos de 24hs.');
      end if;
  end if;

  -- 3. Proceed to Add Stamp
  insert into stamps (user_id, count)
  values (target_user_id, 1)
  on conflict (user_id)
  do update set 
    count = stamps.count + 1,
    updated_at = now();

  -- 4. Log Transaction
  insert into transaction_logs (staff_id, user_id, type)
  values (auth.uid(), target_user_id, 'add_stamp');
  
  return jsonb_build_object('success', true, 'message', 'Sello agregado correctamente');
end;
$$;
