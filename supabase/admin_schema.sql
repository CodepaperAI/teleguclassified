-- 1. Create the secure admin_users table
create table if not exists public.admin_users (
  id uuid references auth.users(id) on delete cascade not null primary key,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.admin_users enable row level security;

-- 3. Create Policies

-- READ: Authenticated users can read THEIR OWN record only. 
-- This allows the app to check "Am I an admin?"
create policy "Allow users to read own admin status" on public.admin_users
  for select using (auth.uid() = id);

-- WRITE: NO POLICIES defined for INSERT, UPDATE, or DELETE for public/authenticated users.
-- This means ONLY the Service Role (Supabase Dashboard) can add/remove admins.

-- 4. (Optional) Grant yourself admin access immediately
-- REPLACE 'YOUR_USER_ID_HERE' with your actual UUID from the Authentication tab
-- insert into public.admin_users (id) values ('507d3689-ef17-4ec9-81ac-c6644b64cac8');
