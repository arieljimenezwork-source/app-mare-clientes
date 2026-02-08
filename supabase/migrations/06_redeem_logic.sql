-- LOGIC: Reward Redemption
-- Run this in Supabase SQL Editor

create or replace function redeem_reward(target_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_stamps int;
  caller_role text;
begin
  -- 1. Check permissions (Staff/Admin only)
  select role into caller_role from profiles where id = auth.uid();
  if caller_role not in ('staff', 'admin') then
    return jsonb_build_object('success', false, 'message', 'Unauthorized');
  end if;

  -- 2. Check Balance
  select count into current_stamps from stamps where user_id = target_user_id;
  
  if current_stamps is null or current_stamps < 7 then
     return jsonb_build_object('success', false, 'message', 'El cliente no tiene suficientes sellos (Mínimo 7).');
  end if;

  -- 3. Deduct Stamps (Reset to 0 or subtract 7)
  -- Strategy: Subtract 7 to allow "overflow" if they had 8? Or Reset?
  -- Requirement says "Reset to 0" (implied "Cada 7 sellos es un cafe"). 
  -- Let's subtract 7 to be fair if they have 8.
  update stamps set count = count - 7, updated_at = now() where user_id = target_user_id;

  -- 4. Log Transaction
  insert into transaction_logs (staff_id, user_id, type)
  values (auth.uid(), target_user_id, 'redeem_reward');

  return jsonb_build_object('success', true, 'message', '¡Canje exitoso! Se restaron 7 sellos.');
end;
$$;
