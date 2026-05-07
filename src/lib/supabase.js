import { createClient } from '@supabase/supabase-js'

// ─── Replace these with your actual Supabase project values ───────────────────
// Found at: https://supabase.com/dashboard → your project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'
// ─────────────────────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,   // Needed for password-reset & magic-link redirects
  }
})

/*
══════════════════════════════════════════════════════════════════════
  SUPABASE SETUP — run this SQL in your Supabase SQL Editor once
  Dashboard → SQL Editor → New query → paste → Run
══════════════════════════════════════════════════════════════════════

-- 1. Profiles table (extends auth.users)
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  avatar_initials text,
  avatar_color text default '#4A7C59',
  co_parent_id uuid references public.profiles(id),
  co_parent_email text,
  default_split_self   int default 50,
  default_split_other  int default 50,
  created_at   timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
-- Allow reading co-parent profile
create policy "Users can read co-parent profile" on public.profiles for select using (
  id in (select co_parent_id from public.profiles where id = auth.uid())
);

-- 2. Kids table
create table public.kids (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null,   -- either parent's user id (both parents share same family_id)
  name        text not null,
  age         int,
  grade       text,
  avatar      text,
  color       text default '#4A7C59',
  split_self  int default 50,
  split_other int default 50,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);
alter table public.kids enable row level security;
create policy "Family members can read kids" on public.kids for select using (
  family_id = auth.uid() or
  family_id in (select co_parent_id from public.profiles where id = auth.uid())
);
create policy "Family members can insert kids" on public.kids for insert with check (
  family_id = auth.uid()
);
create policy "Family members can update kids" on public.kids for update using (
  family_id = auth.uid()
);
create policy "Family members can delete kids" on public.kids for delete using (
  family_id = auth.uid()
);

-- 3. Expenses table
create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null,
  title           text not null,
  amount          numeric(10,2) not null,
  category        text not null,
  kid_id          uuid references public.kids(id),
  kid_name        text,
  submitted_by    uuid references auth.users(id),
  submitted_by_name text,
  split_self      int default 50,
  split_other     int default 50,
  status          text default 'pending' check (status in ('pending','approved','rejected')),
  note            text,
  receipt_url     text,
  expense_date    date default current_date,
  created_at      timestamptz default now()
);
alter table public.expenses enable row level security;
create policy "Family members can read expenses" on public.expenses for select using (
  family_id = auth.uid() or
  family_id in (select co_parent_id from public.profiles where id = auth.uid())
);
create policy "Family members can insert expenses" on public.expenses for insert with check (
  family_id = auth.uid()
);
create policy "Co-parent can update status" on public.expenses for update using (
  family_id = auth.uid() or
  family_id in (select co_parent_id from public.profiles where id = auth.uid())
);

-- 4. Co-parent invitations table
create table public.invitations (
  id            uuid primary key default gen_random_uuid(),
  inviter_id    uuid references auth.users(id),
  inviter_name  text,
  invitee_email text not null,
  token         text unique default encode(gen_random_bytes(32), 'hex'),
  accepted      boolean default false,
  created_at    timestamptz default now(),
  expires_at    timestamptz default now() + interval '7 days'
);
alter table public.invitations enable row level security;
create policy "Inviter can see own invitations" on public.invitations for select using (inviter_id = auth.uid());
create policy "Inviter can create invitations"  on public.invitations for insert with check (inviter_id = auth.uid());
create policy "Anyone can read by token" on public.invitations for select using (true);

-- 5. Auto-create profile on signup (trigger)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email), 2))
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Enable Realtime for live updates (optional but great for notifications)
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.invitations;

══════════════════════════════════════════════════════════════════════
  SUPABASE AUTH SETTINGS (Dashboard → Authentication → Providers)
══════════════════════════════════════════════════════════════════════

  ✅ Email: Enable "Confirm email" (sends real OTP — no mock needed)
             Enable "Secure email change"

  ✅ Google OAuth:
     1. Go to console.cloud.google.com → APIs & Services → Credentials
     2. Create OAuth 2.0 Client ID (Web application)
     3. Add Authorized redirect URI:
        https://YOUR_PROJECT.supabase.co/auth/v1/callback
     4. Paste Client ID + Secret into Supabase Auth → Providers → Google

  ✅ Site URL: http://localhost:5173  (+ your production URL)
  ✅ Redirect URLs: http://localhost:5173/**

  Password Reset email will work automatically once Email provider is on.
*/
