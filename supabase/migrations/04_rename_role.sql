-- MIGRATION: Rename 'barista' role to 'staff'
-- Run this in Supabase SQL Editor

-- 1. Update existing profiles (if any were created as 'barista')
update profiles set role = 'staff' where role = 'barista';

-- 2. Update the constraint to allow 'staff' instead of 'barista'
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('customer', 'staff', 'admin'));

-- 3. Update redemptions policies or triggers if they hardcoded 'barista' (The previous policies used 'barista' in the list, we need to update expected values if strictly checked, but RLS usually just checks the current row).
-- Re-applying RLS for clarity:
drop policy if exists "Staff view shop redemptions" on redemptions;
create policy "Staff view shop redemptions" on redemptions for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('staff', 'admin'))
);

drop policy if exists "Staff can update redemptions" on redemptions;
create policy "Staff can update redemptions" on redemptions for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('staff', 'admin'))
);

-- 4. Verify add_stamp function (It already checked for 'staff' in my previous fix, but let's be sure).
-- No change needed if 03_fix_function.sql was run, as it allowed ('barista', 'staff', 'admin').
