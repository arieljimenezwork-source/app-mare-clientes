-- MIGRATION: Fix Redeem Logic to be Dynamic
-- This replaces the function create in 07_gamification.sql / 06_redeem_logic.sql

create or replace function redeem_reward(target_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_stamps int;
  stamps_needed int;
  caller_role text;
  user_shop_id uuid;
  shop_config jsonb;
  default_stamps int := 10; -- Default fallback if config sucks
  new_level int;
begin
  -- Check permissions (Staff/Admin only)
  select role into caller_role from profiles where id = auth.uid();
  if caller_role not in ('staff', 'admin') then
    return jsonb_build_object('success', false, 'message', 'Unauthorized');
  end if;

  -- Get User's Shop via Profile
  select shop_id into user_shop_id from profiles where id = target_user_id;
  
  -- Get Shop Config
  if user_shop_id is not null then
      select config into shop_config from shops where id = user_shop_id;
      -- Try to read rules.stampsPerReward from jsonb
      -- Note: JSONB extraction depends on structure: {"rules": {"stampsPerReward": 10}}
      stamps_needed := (shop_config->'rules'->>'stampsPerReward')::int;
  end if;

  -- Fallback if null
  if stamps_needed is null then
      stamps_needed := default_stamps; 
  end if;

  -- Check Stamps
  select count into current_stamps from stamps where user_id = target_user_id;
  
  if current_stamps is null or current_stamps < stamps_needed then
     return jsonb_build_object('success', false, 'message', 'El cliente no tiene suficientes sellos (Mínimo ' || stamps_needed || ').');
  end if;

  -- Deduct Stamps
  update stamps set count = count - stamps_needed, updated_at = now() where user_id = target_user_id;

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
      'message', '¡Canje exitoso! Se restaron ' || stamps_needed || ' sellos.',
      'new_level', new_level
  );
end;
$$;
