-- ============================================================
--  SplitFamily — Supabase SQL Setup
--  Paste this entire file into:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================


-- 1. PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  full_name            text,
  avatar_initials      text,
  avatar_color         text default '#4A7C59',
  co_parent_id         uuid references public.profiles(id),
  co_parent_email      text,
  default_split_self   int  default 50,
  default_split_other  int  default 50,
  created_at           timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Own profile: select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Own profile: insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Own profile: update"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Co-parent profile: select"
  on public.profiles for select
  using (
    id in (
      select co_parent_id from public.profiles where id = auth.uid()
    )
  );


-- 2. KIDS
-- ============================================================
create table if not exists public.kids (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null,
  name        text not null,
  age         int,
  grade       text,
  avatar      text,
  color       text default '#4A7C59',
  split_self  int  default 50,
  split_other int  default 50,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

alter table public.kids enable row level security;

create policy "Kids: select (own family or co-parent family)"
  on public.kids for select
  using (
    family_id = auth.uid()
    or family_id in (
      select co_parent_id from public.profiles where id = auth.uid()
    )
  );

create policy "Kids: insert (own family)"
  on public.kids for insert
  with check (family_id = auth.uid());

create policy "Kids: update (own family)"
  on public.kids for update
  using (family_id = auth.uid());

create policy "Kids: delete (own family)"
  on public.kids for delete
  using (family_id = auth.uid());


-- 3. EXPENSES
-- ============================================================
create table if not exists public.expenses (
  id                  uuid primary key default gen_random_uuid(),
  family_id           uuid not null,
  title               text not null,
  amount              numeric(10,2) not null,
  category            text not null,
  kid_id              uuid references public.kids(id),
  kid_name            text,
  submitted_by        uuid references auth.users(id),
  submitted_by_name   text,
  split_self          int  default 50,
  split_other         int  default 50,
  status              text default 'pending'
                        check (status in ('pending','approved','rejected')),
  note                text,
  receipt_url         text,
  expense_date        date default current_date,
  created_at          timestamptz default now()
);

alter table public.expenses enable row level security;

create policy "Expenses: select (own or co-parent family)"
  on public.expenses for select
  using (
    family_id = auth.uid()
    or family_id in (
      select co_parent_id from public.profiles where id = auth.uid()
    )
  );

create policy "Expenses: insert (own family)"
  on public.expenses for insert
  with check (family_id = auth.uid());

create policy "Expenses: update status (own or co-parent family)"
  on public.expenses for update
  using (
    family_id = auth.uid()
    or family_id in (
      select co_parent_id from public.profiles where id = auth.uid()
    )
  );


-- 4. INVITATIONS
-- ============================================================
create table if not exists public.invitations (
  id             uuid primary key default gen_random_uuid(),
  inviter_id     uuid references auth.users(id),
  inviter_name   text,
  invitee_email  text not null,
  token          text unique default encode(gen_random_bytes(32), 'hex'),
  accepted       boolean default false,
  created_at     timestamptz default now(),
  expires_at     timestamptz default now() + interval '7 days'
);

alter table public.invitations enable row level security;

create policy "Invitations: select own"
  on public.invitations for select
  using (inviter_id = auth.uid());

create policy "Invitations: insert own"
  on public.invitations for insert
  with check (inviter_id = auth.uid());

create policy "Invitations: select by token (public read)"
  on public.invitations for select
  using (true);


-- 5. AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email), 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 6. ENABLE REALTIME (optional — live expense notifications)
-- ============================================================
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.invitations;


-- ============================================================
--  Done! Now configure Auth providers in the dashboard:
--
--  Authentication → Providers:
--    Email  → enable "Confirm email"
--    Google → paste Client ID + Secret from console.cloud.google.com
--
--  Authentication → URL Configuration:
--    Site URL:       http://localhost:5173
--    Redirect URLs:  http://localhost:5173/**
--                    https://yourdomain.com/**
-- ============================================================
