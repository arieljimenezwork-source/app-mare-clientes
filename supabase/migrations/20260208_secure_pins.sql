-- Enable pgcrypto for hashing
create extension if not exists "pgcrypto";

-- Add hash columns
alter table shops add column if not exists admin_pin_hash text;
alter table shops add column if not exists staff_pin_hash text;

-- Update with defaults for now (will be changed securely later)
update shops
set 
    admin_pin_hash = crypt('MARE-ADMIN-2024', gen_salt('bf')),
    staff_pin_hash = crypt('1234', gen_salt('bf'))
where admin_pin_hash is null;

-- Secure verification function
create or replace function verify_shop_pin(input_pin text, shop_code text)
returns jsonb
language plpgsql
security definer
as $$
declare
    stored_admin_hash text;
    stored_staff_hash text;
begin
    -- Get hashes for the shop
    select admin_pin_hash, staff_pin_hash 
    into stored_admin_hash, stored_staff_hash
    from shops 
    where code = shop_code;

    if not found then
        return jsonb_build_object('valid', false, 'message', 'Shop not found');
    end if;

    -- Check Admin PIn
    if stored_admin_hash is not null and (stored_admin_hash = crypt(input_pin, stored_admin_hash)) then
        return jsonb_build_object('valid', true, 'role', 'admin');
    end if;

    -- Check Staff PIN
    if stored_staff_hash is not null and (stored_staff_hash = crypt(input_pin, stored_staff_hash)) then
         return jsonb_build_object('valid', true, 'role', 'staff');
    end if;

    return jsonb_build_object('valid', false, 'message', 'Invalid PIN');
end;
$$;
