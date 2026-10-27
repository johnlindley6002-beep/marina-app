-- The staff back office: marinas, berths, staff members, arrivals and relet
-- offers. Only signed-in staff of a marina can read or write that marina's
-- rows. Nothing here is open to the public (the anon role has no grants and
-- every table has row level security on).
--
-- Guest and berth holder screens still run on the mock layer in the browser,
-- so arrivals and relet offers here are created by the seed and changed by
-- staff only, until those screens move over.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.marinas (
  -- The app's own marina id, for example 'cascais'.
  id text primary key,
  name text not null,
  location text not null,
  created_at timestamptz not null default now()
);

create table public.berths (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  -- The berth's label on the map, for example 'G-14'.
  code text not null,
  pontoon text not null,
  -- The marina's tariff class, for example 'III'.
  class text not null,
  max_length_m numeric(5, 2) not null,
  beam_m numeric(5, 2) not null,
  draft_m numeric(5, 2) not null,
  -- Whether the berth can be used. The live map status (free, reserved,
  -- released and so on) is worked out by the app from arrivals and offers.
  status text not null default 'in_service' check (status in ('in_service', 'out_of_service')),
  status_reason text not null default '',
  status_set_at timestamptz,
  created_at timestamptz not null default now(),
  unique (marina_id, code)
);

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  marina_id text not null references public.marinas (id) on delete cascade,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  unique (user_id, marina_id)
);

-- A guest's berth request and the stay it becomes once staff approve it.
create table public.arrivals (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  -- The berth staff assigned on approval. Null until then.
  berth_id uuid references public.berths (id) on delete set null,
  -- new, approved or declined: the staff decision on the request.
  status text not null default 'new' check (status in ('new', 'approved', 'declined')),
  -- pending, arrived or departed: where the boat is.
  arrival_status text not null default 'pending'
    check (arrival_status in ('pending', 'arrived', 'departed')),
  decision_at timestamptz,
  decision_note text not null default '',
  arrived_at timestamptz,
  departed_at timestamptz,
  -- A short staff-only note, never shown to the guest.
  flag_note text not null default '',

  expected_arrival date not null,
  eta time,
  -- Null for an open-ended stay with no departure set yet.
  departure date,
  etd time,
  open_ended boolean not null default false,

  boat_name text not null default '',
  boat_type text not null default '',
  length_m numeric(5, 2),
  beam_m numeric(5, 2),
  draft_m numeric(5, 2),
  flag_country text not null default '',
  -- The berth the guest picked on the map, if any, as its code.
  requested_berth_code text not null default '',

  skipper_name text not null default '',
  phone text not null default '',
  email text not null default '',
  home_port text not null default '',
  people_on_board text not null default '',
  services jsonb not null default '{}'::jsonb,

  boat_use text not null default 'private',
  operating_entity text not null default '',
  company_registration text not null default '',
  contract_name text not null default '',
  contract_role text not null default '',
  eu_status text not null default '' check (eu_status in ('yes', 'no', '')),
  last_port text not null default '',
  next_port text not null default '',
  crew jsonb not null default '[]'::jsonb,
  documents jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  check (departure is null or expected_arrival <= departure)
);

-- A berth holder's offer to relet their berth while away, and the marina's
-- consent. 'submitted' is the brief's "pending"; the app also moves an
-- approved offer through listed, booked and completed.
create table public.relet_offers (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  berth_id uuid not null references public.berths (id) on delete cascade,
  -- Berth holders have no accounts here yet, so these are the name and the
  -- mock layer's id for them.
  berth_holder text not null,
  berth_holder_ref text not null,
  away_from date not null,
  away_to date not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'declined', 'cancelled', 'listed', 'booked', 'completed')),
  boat_removal_confirmed boolean not null default false,
  relet_consent boolean not null default false,
  outside_arrangement_confirmed boolean not null default false,
  terms_accepted_at timestamptz not null,
  readiness_confirmed_at timestamptz not null,
  history jsonb not null default '[]'::jsonb,
  decision_note text not null default '',
  conditions jsonb,
  early_return_requested_at timestamptz,
  booked_nights date[] not null default '{}',
  -- Null before a decision.
  approved_nights date[],
  resubmit_of uuid references public.relet_offers (id) on delete set null,
  -- Money in whole cents, filled in once a stay is booked.
  nights_relet integer,
  gross_cents bigint,
  owner_share_cents bigint,
  fee_cents bigint,
  net_cents bigint,
  created_at timestamptz not null default now(),
  check (away_from < away_to)
);

create index berths_marina_id_idx on public.berths (marina_id);
create index staff_members_user_id_idx on public.staff_members (user_id);
create index arrivals_marina_id_idx on public.arrivals (marina_id);
create index arrivals_berth_id_idx on public.arrivals (berth_id);
create index relet_offers_marina_id_idx on public.relet_offers (marina_id);
create index relet_offers_berth_id_idx on public.relet_offers (berth_id);

-- ---------------------------------------------------------------------------
-- Membership checks used by every policy. Security definer so a policy on
-- staff_members can call them without recursing into its own policy.
-- ---------------------------------------------------------------------------

create function public.is_staff_of(target_marina text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_members s
    where s.user_id = (select auth.uid()) and s.marina_id = target_marina
  );
$$;

create function public.is_admin_of(target_marina text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_members s
    where s.user_id = (select auth.uid()) and s.marina_id = target_marina and s.role = 'admin'
  );
$$;

revoke all on function public.is_staff_of(text) from public, anon;
revoke all on function public.is_admin_of(text) from public, anon;
grant execute on function public.is_staff_of(text) to authenticated;
grant execute on function public.is_admin_of(text) to authenticated;

-- A berth must belong to the same marina as the arrival or offer pointing at it.
create function public.berth_in_marina(target_berth uuid, target_marina text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_berth is null or exists (
    select 1 from public.berths b where b.id = target_berth and b.marina_id = target_marina
  );
$$;

revoke all on function public.berth_in_marina(uuid, text) from public, anon;
grant execute on function public.berth_in_marina(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Grants: nothing for anon, only what the policies below allow for
-- authenticated users.
-- ---------------------------------------------------------------------------

revoke all on public.marinas, public.berths, public.staff_members, public.arrivals,
  public.relet_offers from anon, authenticated;

grant select on public.marinas to authenticated;
grant select, insert, delete on public.berths to authenticated;
-- Staff change a berth's service status only, never its code, class or size.
grant update (status, status_reason, status_set_at) on public.berths to authenticated;
grant select, insert, update, delete on public.staff_members to authenticated;
grant select, insert, update, delete on public.arrivals to authenticated;
grant select, insert, update, delete on public.relet_offers to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.marinas enable row level security;
alter table public.berths enable row level security;
alter table public.staff_members enable row level security;
alter table public.arrivals enable row level security;
alter table public.relet_offers enable row level security;

-- Marinas: staff see their own marina. Marinas are added by migration or seed.
create policy "Staff read their marina" on public.marinas
  for select to authenticated using (public.is_staff_of(id));

-- Berths: staff read and set the service status; admins add and remove.
create policy "Staff read berths" on public.berths
  for select to authenticated using (public.is_staff_of(marina_id));
create policy "Staff update berths" on public.berths
  for update to authenticated
  using (public.is_staff_of(marina_id)) with check (public.is_staff_of(marina_id));
create policy "Admins add berths" on public.berths
  for insert to authenticated with check (public.is_admin_of(marina_id));
create policy "Admins remove berths" on public.berths
  for delete to authenticated using (public.is_admin_of(marina_id));

-- Staff members: everyone sees their own rows and their colleagues; only an
-- admin of the marina adds, changes or removes them.
create policy "Staff read members" on public.staff_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff_of(marina_id));
create policy "Admins add members" on public.staff_members
  for insert to authenticated with check (public.is_admin_of(marina_id));
create policy "Admins change members" on public.staff_members
  for update to authenticated
  using (public.is_admin_of(marina_id)) with check (public.is_admin_of(marina_id));
create policy "Admins remove members" on public.staff_members
  for delete to authenticated using (public.is_admin_of(marina_id));

-- Arrivals: staff read and write; admins delete.
create policy "Staff read arrivals" on public.arrivals
  for select to authenticated using (public.is_staff_of(marina_id));
create policy "Staff add arrivals" on public.arrivals
  for insert to authenticated
  with check (public.is_staff_of(marina_id) and public.berth_in_marina(berth_id, marina_id));
create policy "Staff update arrivals" on public.arrivals
  for update to authenticated
  using (public.is_staff_of(marina_id))
  with check (public.is_staff_of(marina_id) and public.berth_in_marina(berth_id, marina_id));
create policy "Admins remove arrivals" on public.arrivals
  for delete to authenticated using (public.is_admin_of(marina_id));

-- Relet offers: staff read and write; admins delete.
create policy "Staff read relet offers" on public.relet_offers
  for select to authenticated using (public.is_staff_of(marina_id));
create policy "Staff add relet offers" on public.relet_offers
  for insert to authenticated
  with check (public.is_staff_of(marina_id) and public.berth_in_marina(berth_id, marina_id));
create policy "Staff update relet offers" on public.relet_offers
  for update to authenticated
  using (public.is_staff_of(marina_id))
  with check (public.is_staff_of(marina_id) and public.berth_in_marina(berth_id, marina_id));
create policy "Admins remove relet offers" on public.relet_offers
  for delete to authenticated using (public.is_admin_of(marina_id));
