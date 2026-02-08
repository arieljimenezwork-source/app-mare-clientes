-- Create Campaigns Table
create table if not exists campaigns (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  status text default 'active', -- 'active' | 'inactive'
  audience text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb -- For storing rich content or editor config
);

-- Enable RLS
alter table campaigns enable row level security;

-- Policies (Admin only for now, maybe public read if needed for Client page check but let's stick to safe defaults)
-- Actually, the client page needs to read the campaign status. So 'anon' needs SELECT.
create policy "Public campaigns" on campaigns for select using (true);

-- Only Admin can insert/update
create policy "Admins can manage campaigns" on campaigns for all using (
  auth.uid() in (select id from profiles where role = 'admin')
);
