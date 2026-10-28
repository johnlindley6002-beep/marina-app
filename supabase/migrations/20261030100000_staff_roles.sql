-- Staff roles and capabilities, enforced by the database.
--
-- Five roles replace admin and staff: director, dockmaster, reception,
-- marinheiro and night_watch. What each role may do is a list of named
-- capabilities in role_capabilities; has_capability() checks the signed-in
-- member's role, that the account is active and that access_until has not
-- passed. Row level security on the sensitive tables now asks for a
-- capability, so a marinheiro or the night watch never reads customer
-- contact details, passports or documents.
--
-- Existing members: admin becomes director, staff becomes reception.

-- ---------------------------------------------------------------------------
-- Members: role, team lead, seasonal end date, active
-- ---------------------------------------------------------------------------

alter table public.staff_members drop constraint staff_members_role_check;
alter table public.staff_members alter column role drop default;

update public.staff_members
set role = case role when 'admin' then 'director' else 'reception' end
where role in ('admin', 'staff');

alter table public.staff_members
  add constraint staff_members_role_check
  check (role in ('director', 'dockmaster', 'reception', 'marinheiro', 'night_watch')),
  -- A marinheiro who may also assign jobs to the dock team.
  add column team_lead boolean not null default false,
  -- The last day a seasonal account works. After it, no access at all.
  add column access_until date,
  -- Deactivation takes effect at once.
  add column active boolean not null default true,
  add column updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------

create table public.role_capabilities (
  role text not null check (role in ('director', 'dockmaster', 'reception', 'marinheiro', 'night_watch')),
  capability text not null,
  primary key (role, capability)
);

insert into public.role_capabilities (role, capability)
select 'director', c from unnest(array[
  'assign_berths', 'confirm_arrivals', 'check_in', 'approve_relets', 'link_berth_holders',
  'view_customers', 'view_documents', 'plan_day', 'assign_jobs', 'claim_jobs', 'create_jobs',
  'manage_shifts', 'manage_dock_team', 'view_staffing', 'radio_log', 'incident_report',
  'late_check_in', 'view_own_shifts', 'manage_team', 'view_audit_log', 'view_overview'
]) as c
union all
select 'dockmaster', c from unnest(array[
  'assign_berths', 'confirm_arrivals', 'check_in', 'approve_relets', 'link_berth_holders',
  'view_customers', 'view_documents', 'plan_day', 'assign_jobs', 'claim_jobs', 'manage_shifts',
  'manage_dock_team', 'view_staffing', 'radio_log', 'incident_report'
]) as c
union all
select 'reception', c from unnest(array[
  'confirm_arrivals', 'check_in', 'view_customers', 'view_documents', 'create_jobs', 'radio_log'
]) as c
union all
select 'marinheiro', c from unnest(array['claim_jobs', 'view_own_shifts', 'radio_log']) as c
union all
select 'night_watch', c from unnest(array[
  'claim_jobs', 'create_jobs', 'radio_log', 'incident_report', 'late_check_in', 'view_own_shifts'
]) as c;

revoke all on public.role_capabilities from anon, authenticated;
grant select on public.role_capabilities to authenticated;
alter table public.role_capabilities enable row level security;
create policy "Anyone signed in reads the capability list" on public.role_capabilities
  for select to authenticated using (true);

-- The signed-in user's membership of a marina, only while it counts: active
-- and not past access_until (that day still counts).
create function public.effective_member(target_marina text)
returns public.staff_members
language sql
stable
security definer
set search_path = ''
as $$
  select s.* from public.staff_members s
  where s.user_id = (select auth.uid())
    and s.marina_id = target_marina
    and s.active
    and (s.access_until is null or s.access_until >= public.lisbon_today())
  limit 1;
$$;

revoke all on function public.effective_member(text) from public, anon, authenticated;

-- Every policy that asks "is this person staff here" now also requires the
-- account to be active and in date.
create or replace function public.is_staff_of(target_marina text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (public.effective_member(target_marina)).id is not null;
$$;

create function public.has_capability(cap text, target_marina text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members s
    where s.user_id = (select auth.uid())
      and s.marina_id = target_marina
      and s.active
      and (s.access_until is null or s.access_until >= public.lisbon_today())
      and (
        exists (select 1 from public.role_capabilities r where r.role = s.role and r.capability = cap)
        or (cap = 'assign_jobs' and s.role = 'marinheiro' and s.team_lead)
      )
  );
$$;

create function public.has_any_capability(caps text[], target_marina text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from unnest(caps) c where public.has_capability(c, target_marina));
$$;

create function public.require_capability(caps text[], target_marina text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_any_capability(caps, target_marina) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
end;
$$;

-- Admin now means director (deletes, berths and the team).
create or replace function public.is_admin_of(target_marina text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_capability('manage_team', target_marina);
$$;

revoke all on function public.has_capability(text, text) from public, anon;
revoke all on function public.has_any_capability(text[], text) from public, anon;
revoke all on function public.require_capability(text[], text) from public, anon, authenticated;
grant execute on function public.has_capability(text, text) to authenticated;
grant execute on function public.has_any_capability(text[], text) to authenticated;

-- What the signed-in user may do, for the screens: one row per marina where
-- the membership counts.
create function public.my_staff_access()
returns table (
  member_id uuid,
  marina_id text,
  role text,
  team_lead boolean,
  display_name text,
  access_until date,
  capabilities text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.marina_id, s.role, s.team_lead, s.display_name, s.access_until,
    array(
      select r.capability from public.role_capabilities r where r.role = s.role
      union
      select 'assign_jobs' where s.role = 'marinheiro' and s.team_lead
      order by 1
    )
  from public.staff_members s
  where s.user_id = (select auth.uid())
    and s.active
    and (s.access_until is null or s.access_until >= public.lisbon_today());
$$;

revoke all on function public.my_staff_access() from public, anon;
grant execute on function public.my_staff_access() to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security by capability
-- ---------------------------------------------------------------------------

-- Arrivals hold contact details, crew and documents: the desk and the
-- dockmaster only. The dock team reads boats through jobs instead.
drop policy "Staff read arrivals" on public.arrivals;
drop policy "Staff add arrivals" on public.arrivals;
drop policy "Staff update arrivals" on public.arrivals;
drop policy "Admins remove arrivals" on public.arrivals;
create policy "Booking staff read arrivals" on public.arrivals
  for select to authenticated
  using (public.has_any_capability(
    array['confirm_arrivals', 'check_in', 'assign_berths', 'approve_relets', 'view_customers'], marina_id));
create policy "Booking staff add arrivals" on public.arrivals
  for insert to authenticated
  with check (
    public.has_any_capability(array['confirm_arrivals', 'check_in'], marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and public.customer_in_marina(customer_id, marina_id)
  );
create policy "Booking staff update arrivals" on public.arrivals
  for update to authenticated
  using (public.has_any_capability(array['confirm_arrivals', 'check_in', 'assign_berths'], marina_id))
  with check (
    public.has_any_capability(array['confirm_arrivals', 'check_in', 'assign_berths'], marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and public.customer_in_marina(customer_id, marina_id)
  );
create policy "Directors remove arrivals" on public.arrivals
  for delete to authenticated using (public.has_capability('manage_team', marina_id));

drop policy "Staff read relet offers" on public.relet_offers;
drop policy "Staff add relet offers" on public.relet_offers;
drop policy "Staff update relet offers" on public.relet_offers;
drop policy "Admins remove relet offers" on public.relet_offers;
create policy "Booking staff read relet offers" on public.relet_offers
  for select to authenticated
  using (public.has_any_capability(
    array['confirm_arrivals', 'check_in', 'assign_berths', 'approve_relets'], marina_id));
create policy "Relet approvers add relet offers" on public.relet_offers
  for insert to authenticated
  with check (public.has_capability('approve_relets', marina_id) and public.berth_in_marina(berth_id, marina_id));
create policy "Relet approvers update relet offers" on public.relet_offers
  for update to authenticated
  using (public.has_capability('approve_relets', marina_id))
  with check (public.has_capability('approve_relets', marina_id) and public.berth_in_marina(berth_id, marina_id));
create policy "Directors remove relet offers" on public.relet_offers
  for delete to authenticated using (public.has_capability('manage_team', marina_id));

-- Berths carry no personal data: every active member reads them.
drop policy "Staff update berths" on public.berths;
create policy "Berth planners update berths" on public.berths
  for update to authenticated
  using (public.has_capability('assign_berths', marina_id))
  with check (public.has_capability('assign_berths', marina_id));

drop policy "Staff read customers" on public.customers;
drop policy "Staff add customers" on public.customers;
drop policy "Staff update customers" on public.customers;
create policy "Customer staff read customers" on public.customers
  for select to authenticated using (public.has_capability('view_customers', marina_id));
create policy "Customer staff add customers" on public.customers
  for insert to authenticated with check (public.has_capability('view_customers', marina_id));
create policy "Customer staff update customers" on public.customers
  for update to authenticated
  using (public.has_capability('view_customers', marina_id))
  with check (public.has_capability('view_customers', marina_id));

drop policy "Staff read boats" on public.boats;
drop policy "Staff add boats" on public.boats;
drop policy "Staff update boats" on public.boats;
create policy "Customer staff read boats" on public.boats
  for select to authenticated using (public.has_capability('view_customers', marina_id));
create policy "Customer staff add boats" on public.boats
  for insert to authenticated
  with check (public.has_capability('view_customers', marina_id) and public.customer_in_marina(customer_id, marina_id));
create policy "Customer staff update boats" on public.boats
  for update to authenticated
  using (public.has_capability('view_customers', marina_id))
  with check (public.has_capability('view_customers', marina_id) and public.customer_in_marina(customer_id, marina_id));

drop policy "Staff read contracts" on public.berth_contracts;
drop policy "Staff add contracts" on public.berth_contracts;
drop policy "Staff update contracts" on public.berth_contracts;
create policy "Booking staff read holdings" on public.berth_contracts
  for select to authenticated
  using (public.has_any_capability(
    array['view_customers', 'link_berth_holders', 'assign_berths', 'confirm_arrivals'], marina_id));
create policy "Holder linkers add holdings" on public.berth_contracts
  for insert to authenticated
  with check (
    public.has_capability('link_berth_holders', marina_id)
    and public.customer_in_marina(customer_id, marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and public.boat_in_marina(boat_id, marina_id)
  );
create policy "Holder linkers update holdings" on public.berth_contracts
  for update to authenticated
  using (public.has_capability('link_berth_holders', marina_id))
  with check (
    public.has_capability('link_berth_holders', marina_id)
    and public.customer_in_marina(customer_id, marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and public.boat_in_marina(boat_id, marina_id)
  );

-- Documents (passports, insurance, licences): only roles that need them.
drop policy "Staff read documents" on public.customer_documents;
drop policy "Staff add documents" on public.customer_documents;
drop policy "Staff update documents" on public.customer_documents;
create policy "Document staff read documents" on public.customer_documents
  for select to authenticated using (public.has_capability('view_documents', marina_id));
create policy "Document staff add documents" on public.customer_documents
  for insert to authenticated
  with check (
    public.has_capability('view_documents', marina_id)
    and public.customer_in_marina(customer_id, marina_id)
    and public.boat_in_marina(boat_id, marina_id)
  );
create policy "Document staff update documents" on public.customer_documents
  for update to authenticated
  using (public.has_capability('view_documents', marina_id))
  with check (
    public.has_capability('view_documents', marina_id)
    and public.customer_in_marina(customer_id, marina_id)
    and public.boat_in_marina(boat_id, marina_id)
  );

drop policy "Staff read berth events" on public.berth_events;
create policy "Booking staff read berth events" on public.berth_events
  for select to authenticated
  using (public.has_any_capability(
    array['assign_berths', 'link_berth_holders', 'view_customers', 'confirm_arrivals'], marina_id));

drop policy "Staff read the log" on public.radio_log;
drop policy "Staff add to the log" on public.radio_log;
drop policy "Staff update the log" on public.radio_log;
create policy "Radio staff read the log" on public.radio_log
  for select to authenticated using (public.has_capability('radio_log', marina_id));
create policy "Radio staff add to the log" on public.radio_log
  for insert to authenticated with check (public.has_capability('radio_log', marina_id));
create policy "Radio staff update the log" on public.radio_log
  for update to authenticated
  using (public.has_capability('radio_log', marina_id))
  with check (public.has_capability('radio_log', marina_id));

-- Turning a log entry into an arrival writes an arrival row, which the night
-- watch may not read; it now runs with the function owner's rights after a
-- capability check.
alter function public.radio_entry_to_arrival(uuid) security definer;
alter function public.radio_entry_to_arrival(uuid) rename to radio_entry_to_arrival_core;
revoke all on function public.radio_entry_to_arrival_core(uuid) from public, anon, authenticated;

create function public.radio_entry_to_arrival(entry_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_capability(
    array['radio_log'], (select r.marina_id from public.radio_log r where r.id = entry_id));
  return public.radio_entry_to_arrival_core(entry_id);
end;
$$;

revoke all on function public.radio_entry_to_arrival(uuid) from public, anon;
grant execute on function public.radio_entry_to_arrival(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The existing staff functions now ask for the right capability first. Their
-- own logic is unchanged: each is renamed to *_core and a checking wrapper
-- takes its name.
-- ---------------------------------------------------------------------------

alter function public.suggest_berths(uuid, integer) rename to suggest_berths_core;
alter function public.confirm_arrival(uuid, uuid, text) rename to confirm_arrival_core;
alter function public.decline_arrival(uuid, text) rename to decline_arrival_core;
alter function public.propose_dates(uuid, date, date, text) rename to propose_dates_core;
alter function public.link_berth_holder(uuid, text, date, date, text) rename to link_berth_holder_core;
alter function public.end_berth_holding(uuid) rename to end_berth_holding_core;

revoke all on function public.suggest_berths_core(uuid, integer) from public, anon, authenticated;
revoke all on function public.confirm_arrival_core(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.decline_arrival_core(uuid, text) from public, anon, authenticated;
revoke all on function public.propose_dates_core(uuid, date, date, text) from public, anon, authenticated;
revoke all on function public.link_berth_holder_core(uuid, text, date, date, text) from public, anon, authenticated;
revoke all on function public.end_berth_holding_core(uuid) from public, anon, authenticated;

create function public.arrival_marina(p_arrival uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.marina_id from public.arrivals a where a.id = p_arrival;
$$;

revoke all on function public.arrival_marina(uuid) from public, anon, authenticated;

create function public.suggest_berths(p_arrival uuid, p_limit integer default 8)
returns table (
  berth_id uuid,
  code text,
  pontoon text,
  class text,
  max_length_m numeric,
  beam_m numeric,
  draft_m numeric,
  via_relet boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_capability(array['confirm_arrivals', 'assign_berths'], public.arrival_marina(p_arrival));
  return query select * from public.suggest_berths_core(p_arrival, p_limit);
end;
$$;

create function public.confirm_arrival(p_arrival uuid, p_berth uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_capability(array['confirm_arrivals', 'assign_berths'], public.arrival_marina(p_arrival));
  perform public.confirm_arrival_core(p_arrival, p_berth, p_note);
end;
$$;

create function public.decline_arrival(p_arrival uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_capability(array['confirm_arrivals'], public.arrival_marina(p_arrival));
  perform public.decline_arrival_core(p_arrival, p_reason);
end;
$$;

create function public.propose_dates(p_arrival uuid, p_from date, p_to date, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_capability(array['confirm_arrivals'], public.arrival_marina(p_arrival));
  perform public.propose_dates_core(p_arrival, p_from, p_to, p_note);
end;
$$;

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
begin
  perform public.require_capability(
    array['link_berth_holders'], (select b.marina_id from public.berths b where b.id = p_berth));
  return public.link_berth_holder_core(p_berth, p_email, p_starts, p_ends, p_name);
end;
$$;

create function public.end_berth_holding(p_contract uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_capability(
    array['link_berth_holders'], (select c.marina_id from public.berth_contracts c where c.id = p_contract));
  perform public.end_berth_holding_core(p_contract);
end;
$$;

revoke all on function public.suggest_berths(uuid, integer) from public, anon;
revoke all on function public.confirm_arrival(uuid, uuid, text) from public, anon;
revoke all on function public.decline_arrival(uuid, text) from public, anon;
revoke all on function public.propose_dates(uuid, date, date, text) from public, anon;
revoke all on function public.link_berth_holder(uuid, text, date, date, text) from public, anon;
revoke all on function public.end_berth_holding(uuid) from public, anon;
grant execute on function public.suggest_berths(uuid, integer) to authenticated;
grant execute on function public.confirm_arrival(uuid, uuid, text) to authenticated;
grant execute on function public.decline_arrival(uuid, text) to authenticated;
grant execute on function public.propose_dates(uuid, date, date, text) to authenticated;
grant execute on function public.link_berth_holder(uuid, text, date, date, text) to authenticated;
grant execute on function public.end_berth_holding(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Who controls access: invites, changes, deactivation, the audit log
-- ---------------------------------------------------------------------------

-- The team is changed only through the functions below.
drop policy "Admins add members" on public.staff_members;
drop policy "Admins change members" on public.staff_members;
drop policy "Admins remove members" on public.staff_members;
drop policy "Staff read members" on public.staff_members;
revoke insert, update, delete on public.staff_members from authenticated;
create policy "Members read their own row and managers their team" on public.staff_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_any_capability(array['manage_team', 'manage_dock_team'], marina_id)
  );

create table public.staff_audit_log (
  id bigint generated always as identity primary key,
  marina_id text not null references public.marinas (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_email text not null default '',
  target_member uuid references public.staff_members (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);

create index staff_audit_log_marina_at_idx on public.staff_audit_log (marina_id, at desc);
revoke all on public.staff_audit_log from anon, authenticated;
grant select on public.staff_audit_log to authenticated;
alter table public.staff_audit_log enable row level security;
create policy "Directors read the audit log" on public.staff_audit_log
  for select to authenticated using (public.has_capability('view_audit_log', marina_id));

create function public.audit_staff(
  p_marina text, p_action text, p_email text, p_member uuid, p_details jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.staff_audit_log (marina_id, actor_id, action, target_email, target_member, details)
  values (p_marina, (select auth.uid()), p_action, coalesce(p_email, ''), p_member, coalesce(p_details, '{}'::jsonb));
$$;

revoke all on function public.audit_staff(text, text, text, uuid, jsonb) from public, anon, authenticated;

-- Invites for people who have no account yet. Their membership is created the
-- moment they first sign in with that email.
create table public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  email text not null,
  role text not null check (role in ('director', 'dockmaster', 'reception', 'marinheiro', 'night_watch')),
  team_lead boolean not null default false,
  access_until date,
  display_name text not null default '',
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index staff_invites_open_key
  on public.staff_invites (marina_id, lower(email)) where accepted_at is null;

revoke all on public.staff_invites from anon, authenticated;
grant select on public.staff_invites to authenticated;
alter table public.staff_invites enable row level security;
create policy "Managers read open invites" on public.staff_invites
  for select to authenticated
  using (
    public.has_capability('manage_team', marina_id)
    or (public.has_capability('manage_dock_team', marina_id) and role in ('marinheiro', 'night_watch'))
  );

-- One person who looks after the platform and may create the first director
-- of a marina. A platform admin is not staff and reads no marina data.
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

revoke all on public.platform_admins from anon, authenticated;
alter table public.platform_admins enable row level security;

create function public.dock_role(p_role text)
returns boolean
language sql
immutable
as $$
  select p_role in ('marinheiro', 'night_watch');
$$;

-- Whether the signed-in user may give someone this role in this marina:
-- a director any role, a dockmaster only the dock team's roles.
create function public.may_manage_role(p_marina text, p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_capability('manage_team', p_marina)
    or (public.has_capability('manage_dock_team', p_marina) and public.dock_role(p_role));
$$;

revoke all on function public.may_manage_role(text, text) from public, anon, authenticated;

-- Adds a member now if the email has an account, or leaves an invite that
-- becomes a membership at their first sign-in. Returns 'added' or 'invited'.
create function public.invite_staff_core(
  p_marina text,
  p_email text,
  p_role text,
  p_team_lead boolean,
  p_access_until date,
  p_name text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_email text := lower(trim(coalesce(p_email, '')));
  existing uuid;
  member uuid;
begin
  if clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;
  if p_role not in ('director', 'dockmaster', 'reception', 'marinheiro', 'night_watch') then
    raise exception 'invalid_role' using errcode = 'P0001';
  end if;

  select u.id into existing from auth.users u where lower(u.email) = clean_email limit 1;
  if existing is not null then
    if exists (select 1 from public.staff_members s where s.user_id = existing and s.marina_id = p_marina) then
      raise exception 'already_staff' using errcode = 'P0001';
    end if;
    insert into public.staff_members (user_id, marina_id, role, team_lead, access_until, display_name)
    values (existing, p_marina, p_role, p_team_lead and p_role = 'marinheiro', p_access_until, left(trim(coalesce(p_name, '')), 80))
    returning id into member;
    perform public.audit_staff(p_marina, 'added', clean_email, member,
      jsonb_build_object('role', p_role, 'team_lead', p_team_lead and p_role = 'marinheiro', 'access_until', p_access_until));
    return 'added';
  end if;

  insert into public.staff_invites (marina_id, email, role, team_lead, access_until, display_name, invited_by)
  values (p_marina, clean_email, p_role, p_team_lead and p_role = 'marinheiro', p_access_until,
          left(trim(coalesce(p_name, '')), 80), (select auth.uid()))
  on conflict (marina_id, lower(email)) where accepted_at is null
  do update set role = excluded.role, team_lead = excluded.team_lead,
    access_until = excluded.access_until, display_name = excluded.display_name,
    invited_by = excluded.invited_by, created_at = now();
  perform public.audit_staff(p_marina, 'invited', clean_email, null,
    jsonb_build_object('role', p_role, 'team_lead', p_team_lead and p_role = 'marinheiro', 'access_until', p_access_until));
  return 'invited';
end;
$$;

revoke all on function public.invite_staff_core(text, text, text, boolean, date, text) from public, anon, authenticated;

create function public.invite_staff(
  p_marina text,
  p_email text,
  p_role text,
  p_team_lead boolean default false,
  p_access_until date default null,
  p_name text default ''
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.may_manage_role(p_marina, p_role) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return public.invite_staff_core(p_marina, p_email, p_role, p_team_lead, p_access_until, p_name);
end;
$$;

-- A platform admin creates a marina's first director, and nothing else.
create function public.platform_create_director(p_marina text, p_email text, p_name text default '')
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid())) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.marinas m where m.id = p_marina) then
    raise exception 'marina_not_found' using errcode = 'P0001';
  end if;
  return public.invite_staff_core(p_marina, p_email, 'director', false, null, p_name);
end;
$$;

-- Changes another member: role, team lead, access_until, active. Only the
-- keys present in p change ("access_until": null clears the end date).
-- Nobody changes their own membership here. A dockmaster changes only the
-- dock team and only to dock roles. The last active director stays.
create function public.update_staff_member(p_member uuid, p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.staff_members;
  next_role text;
  next_lead boolean;
  next_until date;
  next_active boolean;
  email text;
begin
  select * into target from public.staff_members where id = p_member for update;
  if not found then
    raise exception 'member_not_found' using errcode = 'P0001';
  end if;
  if target.user_id = (select auth.uid()) then
    raise exception 'not_yourself' using errcode = '42501';
  end if;

  next_role := coalesce(p ->> 'role', target.role);
  next_active := coalesce((p ->> 'active')::boolean, target.active);
  next_until := case when p ? 'access_until' then nullif(p ->> 'access_until', '')::date else target.access_until end;
  next_lead := coalesce((p ->> 'team_lead')::boolean, target.team_lead) and next_role = 'marinheiro';

  if not (public.may_manage_role(target.marina_id, target.role)
          and public.may_manage_role(target.marina_id, next_role)) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if target.role = 'director' and target.active and (next_role <> 'director' or not next_active)
     and not exists (
       select 1 from public.staff_members s
       where s.marina_id = target.marina_id and s.id <> target.id and s.role = 'director' and s.active
     ) then
    raise exception 'last_director' using errcode = 'P0001';
  end if;

  update public.staff_members
  set role = next_role, team_lead = next_lead, access_until = next_until, active = next_active,
      updated_at = now()
  where id = p_member;

  select u.email into email from auth.users u where u.id = target.user_id;
  perform public.audit_staff(target.marina_id,
    case
      when target.active and not next_active then 'deactivated'
      when not target.active and next_active then 'reactivated'
      when target.role <> next_role then 'role_changed'
      else 'changed'
    end,
    email, p_member,
    jsonb_build_object(
      'role', jsonb_build_array(target.role, next_role),
      'team_lead', jsonb_build_array(target.team_lead, next_lead),
      'access_until', jsonb_build_array(target.access_until, next_until),
      'active', jsonb_build_array(target.active, next_active)));
end;
$$;

create function public.cancel_staff_invite(p_invite uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.staff_invites;
begin
  select * into inv from public.staff_invites where id = p_invite and accepted_at is null;
  if not found then
    raise exception 'invite_not_found' using errcode = 'P0001';
  end if;
  if not public.may_manage_role(inv.marina_id, inv.role) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  delete from public.staff_invites where id = p_invite;
  perform public.audit_staff(inv.marina_id, 'invite_cancelled', inv.email, null, jsonb_build_object('role', inv.role));
end;
$$;

-- The team as a manager sees it: a director all of it, a dockmaster the dock
-- team. Includes open invites.
create function public.team_members(p_marina text)
returns table (
  member_id uuid,
  invite_id uuid,
  email text,
  display_name text,
  role text,
  team_lead boolean,
  access_until date,
  active boolean,
  effective boolean,
  is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, null::uuid, coalesce(u.email, ''), s.display_name, s.role, s.team_lead, s.access_until, s.active,
    s.active and (s.access_until is null or s.access_until >= public.lisbon_today()),
    s.user_id = (select auth.uid())
  from public.staff_members s
  left join auth.users u on u.id = s.user_id
  where s.marina_id = p_marina
    and (public.has_capability('manage_team', p_marina)
         or (public.has_capability('manage_dock_team', p_marina) and public.dock_role(s.role)))
  union all
  select null::uuid, i.id, i.email, i.display_name, i.role, i.team_lead, i.access_until, true, false, false
  from public.staff_invites i
  where i.marina_id = p_marina and i.accepted_at is null
    and (public.has_capability('manage_team', p_marina)
         or (public.has_capability('manage_dock_team', p_marina) and public.dock_role(i.role)))
  order by 5, 4, 3;
$$;

-- Names and roles of the active team, for anyone on it: who is on a job.
create function public.team_directory(p_marina text)
returns table (member_id uuid, display_name text, role text, team_lead boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.display_name, s.role, s.team_lead
  from public.staff_members s
  where s.marina_id = p_marina
    and public.is_staff_of(p_marina)
    and s.active
    and (s.access_until is null or s.access_until >= public.lisbon_today())
  order by s.display_name;
$$;

revoke all on function public.invite_staff(text, text, text, boolean, date, text) from public, anon;
revoke all on function public.platform_create_director(text, text, text) from public, anon;
revoke all on function public.update_staff_member(uuid, jsonb) from public, anon;
revoke all on function public.cancel_staff_invite(uuid) from public, anon;
revoke all on function public.team_members(text) from public, anon;
revoke all on function public.team_directory(text) from public, anon;
grant execute on function public.invite_staff(text, text, text, boolean, date, text) to authenticated;
grant execute on function public.platform_create_director(text, text, text) to authenticated;
grant execute on function public.update_staff_member(uuid, jsonb) to authenticated;
grant execute on function public.cancel_staff_invite(uuid) to authenticated;
grant execute on function public.team_members(text) to authenticated;
grant execute on function public.team_directory(text) to authenticated;

-- A new account with an open invite becomes a member straight away.
create function public.claim_staff_invites()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.staff_invites;
begin
  if coalesce(new.email, '') = '' then
    return new;
  end if;
  for inv in
    select * from public.staff_invites i
    where i.accepted_at is null and lower(i.email) = lower(new.email)
  loop
    insert into public.staff_members (user_id, marina_id, role, team_lead, access_until, display_name)
    values (new.id, inv.marina_id, inv.role, inv.team_lead, inv.access_until, inv.display_name)
    on conflict (user_id, marina_id) do nothing;
    update public.staff_invites set accepted_at = now() where id = inv.id;
    insert into public.staff_audit_log (marina_id, actor_id, action, target_email, details)
    values (inv.marina_id, new.id, 'invite_accepted', inv.email, jsonb_build_object('role', inv.role));
  end loop;
  return new;
end;
$$;

revoke all on function public.claim_staff_invites() from public, anon, authenticated;

create trigger on_auth_user_claims_staff_invites
  after insert on auth.users
  for each row execute function public.claim_staff_invites();
