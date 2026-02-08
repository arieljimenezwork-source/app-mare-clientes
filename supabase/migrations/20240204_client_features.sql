-- Add contact details to profiles if not exists
alter table profiles 
add column if not exists full_name text,
add column if not exists phone text;

-- Create News Feed Table
create table if not exists news_feed (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  active boolean default true
);

-- RLS for News Feed
alter table news_feed enable row level security;

-- Customers can view active feed
create policy "Customers can view active news"
  on news_feed for select
  using ( active = true );

-- Staff/Admin can manage feed
create policy "Staff can manage news"
  on news_feed for all
  using ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role in ('staff', 'admin')
    ) 
  );
