-- CoParent Pay — Supabase Schema
-- Expense splitting app for co-parents
-- Run this in your Supabase SQL editor at https://app.supabase.com

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User profiles table
create table if not exists user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Children table
create table if not exists children (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  date_of_birth date,
  created_at timestamptz default now()
);

-- Co-parent connections table
create table if not exists coparent_connections (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references children(id) on delete cascade not null,
  parent1_id uuid references auth.users(id) on delete cascade not null,
  parent2_id uuid references auth.users(id) on delete cascade not null,
  parent1_split_pct numeric(5,2) not null default 50.00 check (parent1_split_pct between 0 and 100),
  parent2_split_pct numeric(5,2) not null default 50.00 check (parent2_split_pct between 0 and 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(child_id, parent1_id, parent2_id)
);

-- Expense categories table
create table if not exists expense_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  icon text,
  color text,
  created_at timestamptz default now()
);

-- Expenses table
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references children(id) on delete cascade not null,
  paid_by_user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references expense_categories(id) on delete set null,
  description text not null,
  amount numeric(10,2) not null check (amount > 0),
  date date not null,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Expense splits table (tracks who owes what)
create table if not exists expense_splits (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade not null,
  parent_id uuid references auth.users(id) on delete cascade not null,
  share_pct numeric(5,2) not null check (share_pct between 0 and 100),
  amount_owed numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table user_profiles enable row level security;
alter table children enable row level security;
alter table coparent_connections enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;

-- User profiles policies
create policy "Users can read own profile"
  on user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Children policies (user can see if they're a parent)
create policy "Users can see children they're a parent of"
  on children for select
  using (
    user_id = auth.uid() or
    exists (
      select 1 from coparent_connections
      where child_id = children.id
      and (parent1_id = auth.uid() or parent2_id = auth.uid())
    )
  );

create policy "Users can create children they own"
  on children for insert
  with check (user_id = auth.uid());

create policy "Users can update children they own"
  on children for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- CoParent connections policies
create policy "Users can see their co-parent connections"
  on coparent_connections for select
  using (
    parent1_id = auth.uid() or parent2_id = auth.uid()
  );

create policy "Users can create co-parent connections"
  on coparent_connections for insert
  with check (parent1_id = auth.uid() or parent2_id = auth.uid());

create policy "Users can update co-parent connections"
  on coparent_connections for update
  using (parent1_id = auth.uid() or parent2_id = auth.uid())
  with check (parent1_id = auth.uid() or parent2_id = auth.uid());

-- Expenses policies
create policy "Users can see expenses for children they're a parent of"
  on expenses for select
  using (
    exists (
      select 1 from coparent_connections
      where child_id = expenses.child_id
      and (parent1_id = auth.uid() or parent2_id = auth.uid())
    )
    or paid_by_user_id = auth.uid()
  );

create policy "Users can add expenses for children they're a parent of"
  on expenses for insert
  with check (
    paid_by_user_id = auth.uid() and
    exists (
      select 1 from coparent_connections
      where child_id = expenses.child_id
      and (parent1_id = auth.uid() or parent2_id = auth.uid())
    )
  );

-- Expense splits policies
create policy "Users can see splits for their expenses"
  on expense_splits for select
  using (
    parent_id = auth.uid() or
    exists (
      select 1 from expenses
      where expenses.id = expense_splits.expense_id
      and expenses.paid_by_user_id = auth.uid()
    )
  );

-- Insert default expense categories
insert into expense_categories (name, icon, color) values
  ('Groceries', '🛒', '#10B981'),
  ('Healthcare', '⚕️', '#EF4444'),
  ('Education', '📚', '#3B82F6'),
  ('Clothing', '👕', '#F59E0B'),
  ('Entertainment', '🎬', '#8B5CF6'),
  ('Transport', '🚗', '#06B6D4'),
  ('Childcare', '👶', '#EC4899'),
  ('Activities', '⚽', '#6366F1'),
  ('Other', '📌', '#6B7280')
on conflict (name) do nothing;

-- Indexes for performance
create index if not exists user_profiles_user_id on user_profiles(user_id);
create index if not exists children_user_id on children(user_id);
create index if not exists coparent_connections_child_id on coparent_connections(child_id);
create index if not exists coparent_connections_parent1_id on coparent_connections(parent1_id);
create index if not exists coparent_connections_parent2_id on coparent_connections(parent2_id);
create index if not exists expenses_child_id on expenses(child_id);
create index if not exists expenses_paid_by on expenses(paid_by_user_id);
create index if not exists expenses_date on expenses(date desc);
create index if not exists expense_splits_expense_id on expense_splits(expense_id);
create index if not exists expense_splits_parent_id on expense_splits(parent_id);

-- Trigger to auto-create user profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
