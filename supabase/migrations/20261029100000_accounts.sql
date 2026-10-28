-- Accounts for guests and berth holders, and a berth holding the marina
-- controls.
--
-- Guests and berth holders sign in with an email link (Supabase Auth). Each
-- gets a profile and may keep several boats. A berth holding is the existing
-- berth_contracts table (the right of use), extended with the signed-in user it
-- belongs to. Only staff create or end a holding, and only through the two
-- functions at the end of this file or the staff policies already on the table.
--
-- Everything here is additive: no table or column is renamed or dropped.

create extension if not exists btree_gist with schema extensions;

-- The Lisbon calendar day. Every date rule in the app is a Lisbon day.
create function public.lisbon_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Europe/Lisbon')::date;
$$;

grant execute on function public.lisbon_today() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profiles: one per signed-in person
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- A copy of the sign-in email, set once by the trigger below and never
  -- editable, so staff can link a berth holder by it.
  email text not null default '',
  full_name text not null default '',
  phone text not null default '',
  nationality text not null default '',
  eu_status text not null default '' check (eu_status in ('eu', 'non_eu', '')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.touch_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_profile();

-- ---------------------------------------------------------------------------
-- Boats owned by a user, and the holding fields on berth_contracts
-- ---------------------------------------------------------------------------

-- A boat is either one staff keep for a customer (marina and customer set, as
-- before) or one a signed-in user keeps for themselves (user_id set). A user's
-- own boats are not tied to a marina.
alter table public.boats
  alter column marina_id drop not null,
  alter column customer_id drop not null,
  add column user_id uuid references auth.users (id) on delete cascade,
  add column home_port text not null default '',
  -- The documents the user keeps with the boat (registration, insurance,
  -- competence and VHF licence), in the shape the app already uses.
  add column documents jsonb not null default '{}'::jsonb;

alter table public.boats
  add constraint boats_owner_check
  check (user_id is not null or (marina_id is not null and customer_id is not null));

create index boats_user_id_idx on public.boats (user_id);

-- A sensible ceiling, so one account cannot fill the table.
create function public.limit_boats_per_user()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is not null
     and (select count(*) from public.boats b where b.user_id = new.user_id) >= 20 then
    raise exception 'too_many_boats' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger boats_limit before insert on public.boats
  for each row execute function public.limit_boats_per_user();

-- The holding: who holds the berth (a signed-in user, once they have signed
-- in with the email staff entered) and for which dates.
alter table public.berth_contracts
  add column user_id uuid references auth.users (id) on delete set null,
  add column holder_email text not null default '';

create index berth_contracts_user_id_idx on public.berth_contracts (user_id);

-- A berth has at most one holder at a time.
alter table public.berth_contracts
  add constraint berth_contracts_no_overlap
  exclude using gist (berth_id with =, daterange(starts_on, ends_on, '[]') with &&);

-- ---------------------------------------------------------------------------
-- New users: a profile, and any holding staff set up for their email first
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (user_id) do nothing;

  if coalesce(new.email, '') <> '' then
    update public.berth_contracts
    set user_id = new.id
    where user_id is null and holder_email <> '' and lower(holder_email) = lower(new.email);
  end if;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- People who already have an account get a profile too.
insert into public.profiles (user_id, email)
select id, coalesce(email, '') from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Helpers used by policies. Security definer, so a policy on one table can
-- ask about another without going through that table's own policies.
-- ---------------------------------------------------------------------------

-- True while the signed-in user holds the berth.
create function public.holds_berth(target_berth uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.berth_contracts c
    where c.berth_id = target_berth
      and c.user_id = (select auth.uid())
      and c.starts_on <= public.lisbon_today()
      and c.ends_on >= public.lisbon_today()
  );
$$;

revoke all on function public.holds_berth(uuid) from public, anon;
grant execute on function public.holds_berth(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Grants and row level security
-- ---------------------------------------------------------------------------

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- The email column is set by the trigger only; the rest the person edits.
grant update (full_name, phone, nationality, eu_status) on public.profiles to authenticated;

alter table public.profiles enable row level security;

create policy "People read their own profile" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "People update their own profile" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Boats: a user keeps their own. They can never attach one to a marina or a
-- customer, so a user's boat cannot show up in someone else's records.
create policy "People read their own boats" on public.boats
  for select to authenticated using (user_id = (select auth.uid()));
create policy "People add their own boats" on public.boats
  for insert to authenticated
  with check (user_id = (select auth.uid()) and marina_id is null and customer_id is null);
create policy "People change their own boats" on public.boats
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and marina_id is null and customer_id is null);
create policy "People remove their own boats" on public.boats
  for delete to authenticated using (user_id = (select auth.uid()));

-- Holdings: a holder reads their own and nothing else. Staff write them (the
-- policies from the customers migration), so a holder can never claim a berth.
create policy "Holders read their own holding" on public.berth_contracts
  for select to authenticated using (user_id = (select auth.uid()));

-- A holder may read the berth they hold (its code and size), not the others.
create policy "Holders read their own berth" on public.berths
  for select to authenticated using (public.holds_berth(id));

-- Marina information is public: the name and place, never occupancy.
grant select on public.marinas to anon;
create policy "Anyone reads marina information" on public.marinas
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Staff link and end a holding
-- ---------------------------------------------------------------------------

-- Links a berth holder to a berth by their email. If the person has an
-- account already they are linked now; otherwise the holding waits for the
-- email and attaches when they first sign in (handle_new_user above). Also
-- keeps the customer record the Customers screen shows.
create function public.link_berth_holder(
  p_berth uuid,
  p_email text,
  p_starts date,
  p_ends date,
  p_name text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  marina text;
  clean_email text := lower(trim(coalesce(p_email, '')));
  holder uuid;
  holder_name text;
  customer uuid;
  contract uuid;
begin
  select b.marina_id into marina from public.berths b where b.id = p_berth;
  if marina is null then
    raise exception 'berth_not_found' using errcode = 'P0001';
  end if;
  if not public.is_staff_of(marina) then
    raise exception 'staff_only' using errcode = '42501';
  end if;
  if clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;
  if p_starts is null or p_ends is null or p_starts > p_ends then
    raise exception 'invalid_dates' using errcode = 'P0001';
  end if;

  select u.id into holder from auth.users u where lower(u.email) = clean_email limit 1;
  select nullif(trim(pr.full_name), '') into holder_name
    from public.profiles pr where pr.user_id = holder;
  holder_name := coalesce(nullif(trim(coalesce(p_name, '')), ''), holder_name, split_part(clean_email, '@', 1));

  insert into public.customers (marina_id, kind, full_name, email)
  values (marina, 'berth_holder', holder_name, clean_email)
  on conflict (marina_id, lower(email)) where email <> ''
  do update set kind = 'berth_holder'
  returning id into customer;

  -- The exclusion constraint refuses an overlapping holding (error 23P01).
  insert into public.berth_contracts
    (marina_id, customer_id, berth_id, starts_on, ends_on, user_id, holder_email)
  values (marina, customer, p_berth, p_starts, p_ends, holder, clean_email)
  returning id into contract;

  return contract;
end;
$$;

-- Ends a holding today. One that has not started yet is removed.
create function public.end_berth_holding(p_contract uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.berth_contracts;
begin
  select * into c from public.berth_contracts where id = p_contract for update;
  if not found then
    raise exception 'holding_not_found' using errcode = 'P0001';
  end if;
  if not public.is_staff_of(c.marina_id) then
    raise exception 'staff_only' using errcode = '42501';
  end if;
  if c.ends_on < public.lisbon_today() then
    return;
  end if;
  if c.starts_on >= public.lisbon_today() then
    delete from public.berth_contracts where id = p_contract;
  else
    update public.berth_contracts set ends_on = public.lisbon_today() - 1 where id = p_contract;
  end if;
end;
$$;

revoke all on function public.link_berth_holder(uuid, text, date, date, text) from public, anon;
revoke all on function public.end_berth_holding(uuid) from public, anon;
grant execute on function public.link_berth_holder(uuid, text, date, date, text) to authenticated;
grant execute on function public.end_berth_holding(uuid) to authenticated;
