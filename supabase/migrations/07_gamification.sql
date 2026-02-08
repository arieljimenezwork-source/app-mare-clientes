-- MIGRATION: Phase 5 - Gamification (Levels & Preferences)
-- Run this in Supabase SQL Editor

-- 1. Add Level and Preferences to Profiles
alter table profiles 
add column if not exists level int default 1,
add column if not exists preferences jsonb default '{}'::jsonb;

-- 2. Update 'redeem_reward' to increment level
create or replace function redeem_reward(target_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_stamps int;
  caller_role text;
  new_level int;
begin
  -- Check permissions (Staff/Admin only)
  select role into caller_role from profiles where id = auth.uid();
  if caller_role not in ('staff', 'admin') then
    return jsonb_build_object('success', false, 'message', 'Unauthorized');
  end if;

  -- Check Stamps
  select count into current_stamps from stamps where user_id = target_user_id;
  
  if current_stamps is null or current_stamps < 7 then
     return jsonb_build_object('success', false, 'message', 'El cliente no tiene suficientes sellos (Mínimo 7).');
  end if;

  -- Deduct Stamps
  update stamps set count = count - 7, updated_at = now() where user_id = target_user_id;

  -- Log Transaction
  insert into transaction_logs (staff_id, user_id, type)
  values (auth.uid(), target_user_id, 'redeem_reward');

  -- GAMIFICATION: Level Up!
  update profiles 
  set level = coalesce(level, 1) + 1 
  where id = target_user_id
  returning level into new_level;

  return jsonb_build_object(
      'success', true, 
      'message', '¡Canje exitoso! Se restaron 7 sellos.',
      'new_level', new_level
  );
end;
$$;
