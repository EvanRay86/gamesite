-- Rooms table for Slime Volleyball matchmaking
-- Run this in your Supabase SQL editor

create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  room_code text unique not null,
  status text default 'waiting',
  host_id text not null,
  guest_id text,
  created_at timestamptz default now()
);

create index if not exists idx_rooms_status on rooms (status);
create index if not exists idx_rooms_code on rooms (room_code);

-- Enable RLS with permissive policies (no auth required)
alter table rooms enable row level security;

create policy "Anyone can read rooms" on rooms for select using (true);
create policy "Anyone can create rooms" on rooms for insert with check (true);
create policy "Anyone can update rooms" on rooms for update using (true);
create policy "Anyone can delete rooms" on rooms for delete using (true);
