-- Booked mooring help and the marinheiros' day.
--
-- dock_tasks becomes the job list: arrivals, departures and returns boaters
-- book in advance, plus power connections, inspections and anything staff,
-- a walk-in or a VHF call add. Each job knows the boat (name, length, beam),
-- the berth, the time, why help is wanted and how many people it needs.
-- job_assignments says who is on it; shifts say who is working, which sets
-- the capacity of each 30-minute slot (marinheiros on shift, counted in
-- people). Bookings are never refused: a full slot is only shown as busy.

-- ---------------------------------------------------------------------------
-- Jobs (extending dock_tasks)
-- ---------------------------------------------------------------------------

alter table public.dock_tasks drop constraint dock_tasks_description_check;
alter table public.dock_tasks drop constraint dock_tasks_status_check;
alter table public.dock_tasks alter column description set default '';

alter table public.dock_tasks
  add column job_type text not null default 'other'
    check (job_type in ('arrival', 'departure', 'return', 'power', 'inspection', 'other')),
  add column boat_name text not null default '',
  add column length_m numeric(5, 2),
  add column beam_m numeric(5, 2),
  -- Why help is wanted. Nothing health related is ever asked.
  add column reason text not null default ''
    check (reason in ('', 'short_handed', 'first_time', 'other')),
  add column reason_note text not null default '',
  add column people_needed smallint not null default 1 check (people_needed between 1 and 6),
  add column source text not null default 'staff' check (source in ('booked', 'walk_in', 'vhf', 'staff')),
  add column arrival_id uuid references public.arrivals (id) on delete cascade,
  add column contract_id uuid references public.berth_contracts (id) on delete set null,
  add column booked_by uuid references auth.users (id) on delete set null,
  -- A dockmaster's override of the order jobs are handed out in.
  add column sort_order integer,
  add column help_requested_at timestamptz,
  add column updated_at timestamptz not null default now(),
  -- pending: an arrival job waiting for staff to confirm the arrival.
  add constraint dock_tasks_status_check check (status in ('pending', 'to_do', 'done', 'cancelled'));

create unique index dock_tasks_arrival_key on public.dock_tasks (arrival_id) where arrival_id is not null;
create index dock_tasks_booked_by_idx on public.dock_tasks (booked_by);

-- People needed from the boat's length: under 12 m one, 12 to 20 m two,
-- over 20 m three. A boat of unknown length gets one.
create function public.people_for_length(p_length numeric)
returns smallint
language sql
immutable
as $$
  select case
    when p_length is null or p_length < 12 then 1
    when p_length <= 20 then 2
    else 3
  end::smallint;
$$;

create table public.job_assignments (
  job_id uuid not null references public.dock_tasks (id) on delete cascade,
  member_id uuid not null references public.staff_members (id) on delete cascade,
  -- false when a team lead or the dockmaster put them on it.
  claimed boolean not null default true,
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (job_id, member_id)
);

create index job_assignments_member_idx on public.job_assignments (member_id);

-- Jobs that were assigned before move to the new assignment table.
insert into public.job_assignments (job_id, member_id, claimed)
select id, assigned_to, false from public.dock_tasks where assigned_to is not null
on conflict do nothing;

-- Jobs carry no contact details: everyone on the team reads them. They change
-- only through the functions below.
drop policy "Staff read tasks" on public.dock_tasks;
drop policy "Staff add tasks" on public.dock_tasks;
drop policy "Staff update tasks" on public.dock_tasks;
drop policy "Staff remove tasks" on public.dock_tasks;
revoke insert, update, delete on public.dock_tasks from authenticated;
create policy "The team reads jobs" on public.dock_tasks
  for select to authenticated using (public.is_staff_of(marina_id));

revoke all on public.job_assignments from anon, authenticated;
grant select on public.job_assignments to authenticated;
alter table public.job_assignments enable row level security;
create policy "The team reads who is on each job" on public.job_assignments
  for select to authenticated
  using (public.is_staff_of((select t.marina_id from public.dock_tasks t where t.id = job_id)));

-- ---------------------------------------------------------------------------
-- Shifts
-- ---------------------------------------------------------------------------

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  member_id uuid not null references public.staff_members (id) on delete cascade,
  day date not null,
  starts_at time not null,
  -- An end at or before the start runs past midnight (a night watch).
  ends_at time not null,
  created_at timestamptz not null default now(),
  check (starts_at <> ends_at)
);

create index shifts_marina_day_idx on public.shifts (marina_id, day);

create function public.member_is_mine(p_member uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff_members s where s.id = p_member and s.user_id = (select auth.uid()));
$$;

revoke all on function public.member_is_mine(uuid) from public, anon;
grant execute on function public.member_is_mine(uuid) to authenticated;

revoke all on public.shifts from anon, authenticated;
grant select, insert, update, delete on public.shifts to authenticated;
alter table public.shifts enable row level security;
create policy "Shift planners and staffing read shifts" on public.shifts
  for select to authenticated
  using (
    public.has_any_capability(array['manage_shifts', 'view_staffing'], marina_id)
    or (public.has_capability('view_own_shifts', marina_id) and public.member_is_mine(member_id))
  );
create policy "Shift planners add shifts" on public.shifts
  for insert to authenticated
  with check (public.has_capability('manage_shifts', marina_id) and public.staff_member_in_marina(member_id, marina_id));
create policy "Shift planners change shifts" on public.shifts
  for update to authenticated
  using (public.has_capability('manage_shifts', marina_id))
  with check (public.has_capability('manage_shifts', marina_id) and public.staff_member_in_marina(member_id, marina_id));
create policy "Shift planners remove shifts" on public.shifts
  for delete to authenticated using (public.has_capability('manage_shifts', marina_id));

-- ---------------------------------------------------------------------------
-- Alerts (shown in the app, and as a notification where allowed) and
-- incident reports
-- ---------------------------------------------------------------------------

create table public.staff_alerts (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  member_id uuid not null references public.staff_members (id) on delete cascade,
  kind text not null check (kind in ('assigned', 'help')),
  job_id uuid references public.dock_tasks (id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index staff_alerts_member_idx on public.staff_alerts (member_id, created_at desc);

revoke all on public.staff_alerts from anon, authenticated;
grant select on public.staff_alerts to authenticated;
grant update (read_at) on public.staff_alerts to authenticated;
alter table public.staff_alerts enable row level security;
create policy "Members read their own alerts" on public.staff_alerts
  for select to authenticated using (public.member_is_mine(member_id) and public.is_staff_of(marina_id));
create policy "Members mark their own alerts read" on public.staff_alerts
  for update to authenticated
  using (public.member_is_mine(member_id)) with check (public.member_is_mine(member_id));

create table public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  reported_by uuid references auth.users (id) on delete set null default auth.uid(),
  occurred_at timestamptz not null default now(),
  berth_id uuid references public.berths (id) on delete set null,
  description text not null check (length(trim(description)) > 0),
  created_at timestamptz not null default now()
);

revoke all on public.incident_reports from anon, authenticated;
grant select, insert on public.incident_reports to authenticated;
alter table public.incident_reports enable row level security;
create policy "Incident staff read reports" on public.incident_reports
  for select to authenticated using (public.has_capability('incident_report', marina_id));
create policy "Incident staff file reports" on public.incident_reports
  for insert to authenticated
  with check (
    public.has_capability('incident_report', marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and reported_by = (select auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Help on an arrival request
-- ---------------------------------------------------------------------------

alter table public.arrivals
  add column help_requested boolean not null default false,
  add column help_reason text not null default ''
    check (help_reason in ('', 'short_handed', 'first_time', 'other')),
  add column help_note text not null default '';

-- A Lisbon day and wall-clock time as a moment.
create function public.lisbon_at(p_day date, p_time time)
returns timestamptz
language sql
stable
as $$
  select (p_day + coalesce(p_time, time '12:00')) at time zone 'Europe/Lisbon';
$$;

-- Keeps an arrival's help job in step with the arrival: inactive until staff
-- confirm it, then on the berth and at the time of the stay; cancelled if the
-- request is declined or help is no longer wanted.
create function public.sync_arrival_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_status text;
begin
  if not new.help_requested then
    update public.dock_tasks set status = 'cancelled', updated_at = now()
    where arrival_id = new.id and status in ('pending', 'to_do');
    return new;
  end if;

  next_status := case
    when new.status = 'declined' then 'cancelled'
    when new.status = 'approved' and new.arrival_status = 'pending' then 'to_do'
    when new.status = 'approved' then 'done'
    else 'pending'
  end;

  insert into public.dock_tasks (
    marina_id, berth_id, description, due_at, status, job_type, boat_name, length_m, beam_m,
    reason, reason_note, people_needed, source, arrival_id, booked_by
  ) values (
    new.marina_id, new.berth_id, '', public.lisbon_at(new.expected_arrival, new.eta), next_status, 'arrival',
    new.boat_name, new.length_m, new.beam_m, new.help_reason, new.help_note,
    public.people_for_length(new.length_m), 'booked', new.id, new.user_id
  )
  on conflict (arrival_id) where arrival_id is not null do update set
    berth_id = excluded.berth_id,
    boat_name = excluded.boat_name,
    length_m = excluded.length_m,
    beam_m = excluded.beam_m,
    reason = excluded.reason,
    reason_note = excluded.reason_note,
    -- A job a marinheiro already finished stays done.
    status = case when public.dock_tasks.status = 'done' then 'done' else excluded.status end,
    -- The time follows the arrival only when the date or ETA changed, so a
    -- dockmaster's move is kept otherwise.
    due_at = case
      when old.expected_arrival is distinct from new.expected_arrival or old.eta is distinct from new.eta
        then excluded.due_at
      else public.dock_tasks.due_at
    end,
    updated_at = now();
  return new;
end;
$$;

revoke all on function public.sync_arrival_job() from public, anon, authenticated;

create trigger arrivals_sync_job
  after insert or update of help_requested, help_reason, help_note, status, arrival_status,
    berth_id, expected_arrival, eta, boat_name, length_m, beam_m
  on public.arrivals
  for each row execute function public.sync_arrival_job();

-- ---------------------------------------------------------------------------
-- Slot busyness: what a boater may know (busy or not), never other boats
-- ---------------------------------------------------------------------------

-- The start of the 30-minute slot a moment falls in.
create function public.slot_start(p_at timestamptz)
returns timestamptz
language sql
immutable
as $$
  select date_trunc('hour', p_at) + case when extract(minute from p_at) >= 30 then interval '30 minutes' else interval '0' end;
$$;

-- Marinheiros on shift for the whole of a slot, in the Lisbon day and time.
create function public.slot_capacity(p_marina text, p_slot timestamptz)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with l as (
    select (p_slot at time zone 'Europe/Lisbon') as t
  )
  select count(distinct sh.member_id)::integer
  from public.shifts sh
  join public.staff_members s on s.id = sh.member_id
  cross join l
  where sh.marina_id = p_marina
    and s.role = 'marinheiro'
    and s.active
    and (s.access_until is null or s.access_until >= l.t::date)
    and (
      (sh.ends_at > sh.starts_at and sh.day = l.t::date
        and sh.starts_at <= l.t::time and sh.ends_at >= (l.t + interval '30 minutes')::time)
      or (sh.ends_at <= sh.starts_at and sh.day = l.t::date and sh.starts_at <= l.t::time)
      or (sh.ends_at <= sh.starts_at and sh.day = l.t::date - 1 and sh.ends_at >= (l.t + interval '30 minutes')::time)
    );
$$;

-- People already booked into a slot (jobs waiting or to do).
create function public.slot_load(p_marina text, p_slot timestamptz)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(t.people_needed), 0)::integer
  from public.dock_tasks t
  where t.marina_id = p_marina
    and t.status in ('pending', 'to_do')
    and t.due_at >= p_slot and t.due_at < p_slot + interval '30 minutes';
$$;

revoke all on function public.slot_capacity(text, timestamptz) from public, anon, authenticated;
revoke all on function public.slot_load(text, timestamptz) from public, anon, authenticated;

-- For a boater choosing a time: is that slot busy, and the nearest quieter
-- slots within three hours either side, the same day, between 07:00 and
-- 21:00. A slot is busy when the people already booked reach the
-- marinheiros on shift. A day with no shifts planned yet is never busy.
create function public.slot_busyness(p_marina text, p_at timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  slot timestamptz := public.slot_start(p_at);
  local_day date := (p_at at time zone 'Europe/Lisbon')::date;
  planned boolean;
  busy boolean;
  quieter jsonb := '[]'::jsonb;
  candidate timestamptz;
  local_time time;
begin
  if (select auth.uid()) is null then
    raise exception 'not_signed_in' using errcode = '28000';
  end if;
  planned := exists (select 1 from public.shifts sh where sh.marina_id = p_marina and sh.day = local_day);
  if not planned then
    return jsonb_build_object('busy', false, 'quieter', quieter);
  end if;
  busy := public.slot_load(p_marina, slot) >= public.slot_capacity(p_marina, slot);
  if busy then
    select coalesce(jsonb_agg(c order by abs(extract(epoch from c - slot))), '[]'::jsonb) into quieter
    from (
      select c
      from generate_series(slot - interval '3 hours', slot + interval '3 hours', interval '30 minutes') as c
      where c <> slot
        and (c at time zone 'Europe/Lisbon')::date = local_day
        and (c at time zone 'Europe/Lisbon')::time between time '07:00' and time '21:00'
        and c > now()
        and public.slot_load(p_marina, c) < public.slot_capacity(p_marina, c)
      order by abs(extract(epoch from c - slot))
      limit 3
    ) q;
  end if;
  return jsonb_build_object('busy', busy, 'quieter', quieter);
end;
$$;

revoke all on function public.slot_busyness(text, timestamptz) from public, anon;
grant execute on function public.slot_busyness(text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Boater actions: book help, say you are running late, cancel
-- ---------------------------------------------------------------------------

-- The guest asks for help mooring on their own arrival request.
create function public.book_arrival_help(p_arrival uuid, p_reason text, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_reason not in ('short_handed', 'first_time', 'other') then
    raise exception 'invalid_reason' using errcode = 'P0001';
  end if;
  update public.arrivals
  set help_requested = true, help_reason = p_reason, help_note = left(trim(coalesce(p_note, '')), 200)
  where id = p_arrival and user_id = (select auth.uid());
  if not found then
    raise exception 'arrival_not_found' using errcode = 'P0001';
  end if;
end;
$$;

-- A berth holder books help leaving or coming back to the berth they hold.
create function public.book_holder_help(p_contract uuid, p_kind text, p_at timestamptz, p_note text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.berth_contracts;
  b public.boats;
  created uuid;
begin
  if p_kind not in ('departure', 'return') then
    raise exception 'invalid_kind' using errcode = 'P0001';
  end if;
  select * into c from public.berth_contracts
  where id = p_contract and user_id = (select auth.uid())
    and ends_on >= public.lisbon_today();
  if not found then
    raise exception 'holding_not_found' using errcode = 'P0001';
  end if;
  if p_at is null or p_at < now() - interval '1 hour' then
    raise exception 'invalid_time' using errcode = 'P0001';
  end if;
  select * into b from public.boats where id = c.boat_id;
  insert into public.dock_tasks (
    marina_id, berth_id, description, due_at, status, job_type, boat_name, length_m, beam_m,
    reason_note, people_needed, source, contract_id, booked_by
  ) values (
    c.marina_id, c.berth_id, '', p_at, 'to_do', p_kind, coalesce(b.name, ''), b.length_m, b.beam_m,
    left(trim(coalesce(p_note, '')), 200), public.people_for_length(b.length_m), 'booked', c.id, (select auth.uid())
  )
  returning id into created;
  return created;
end;
$$;

-- On the day: a new time for a booked job. The schedule updates at once.
create function public.report_running_late(p_job uuid, p_new_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.dock_tasks;
begin
  select * into t from public.dock_tasks
  where id = p_job and booked_by = (select auth.uid()) and status in ('pending', 'to_do')
  for update;
  if not found then
    raise exception 'job_not_found' using errcode = 'P0001';
  end if;
  if p_new_at is null or p_new_at < now() - interval '1 hour' then
    raise exception 'invalid_time' using errcode = 'P0001';
  end if;
  update public.dock_tasks set due_at = p_new_at, updated_at = now() where id = p_job;
  if t.arrival_id is not null then
    update public.arrivals
    set eta = (p_new_at at time zone 'Europe/Lisbon')::time
    where id = t.arrival_id;
  end if;
end;
$$;

create function public.cancel_my_help(p_job uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.dock_tasks;
begin
  select * into t from public.dock_tasks
  where id = p_job and booked_by = (select auth.uid()) and status in ('pending', 'to_do');
  if not found then
    raise exception 'job_not_found' using errcode = 'P0001';
  end if;
  if t.arrival_id is not null then
    update public.arrivals set help_requested = false where id = t.arrival_id;
  else
    update public.dock_tasks set status = 'cancelled', updated_at = now() where id = p_job;
  end if;
end;
$$;

-- A boater's own bookings, and nothing about anyone else's. Runs with its
-- owner's rights and filters to the signed-in user, like my_arrivals.
create view public.my_help_bookings as
select
  t.id,
  t.marina_id,
  t.job_type,
  t.due_at,
  case t.status when 'done' then 'done' when 'cancelled' then 'cancelled' when 'pending' then 'waiting' else 'booked' end
    as display_status,
  t.reason,
  t.arrival_id,
  t.contract_id,
  case when t.contract_id is not null then b.code else null end as berth_code,
  t.created_at
from public.dock_tasks t
left join public.berths b on b.id = t.berth_id
where t.booked_by = (select auth.uid());

revoke all on public.my_help_bookings from anon, authenticated;
grant select on public.my_help_bookings to authenticated;

revoke all on function public.book_arrival_help(uuid, text, text) from public, anon;
revoke all on function public.book_holder_help(uuid, text, timestamptz, text) from public, anon;
revoke all on function public.report_running_late(uuid, timestamptz) from public, anon;
revoke all on function public.cancel_my_help(uuid) from public, anon;
grant execute on function public.book_arrival_help(uuid, text, text) to authenticated;
grant execute on function public.book_holder_help(uuid, text, timestamptz, text) to authenticated;
grant execute on function public.report_running_late(uuid, timestamptz) to authenticated;
grant execute on function public.cancel_my_help(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Staff actions on jobs
-- ---------------------------------------------------------------------------

create function public.job_marina(p_job uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select t.marina_id from public.dock_tasks t where t.id = p_job;
$$;

revoke all on function public.job_marina(uuid) from public, anon, authenticated;

create function public.my_member_id(p_marina text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select (public.effective_member(p_marina)).id;
$$;

revoke all on function public.my_member_id(text) from public, anon, authenticated;

-- A job from the desk, the night watch, a walk-in or a VHF call. Always
-- accepted. people_needed defaults to the boat's length rule.
create function public.create_job(p_marina text, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  berth uuid;
  len numeric := nullif(p ->> 'length_m', '')::numeric;
  created uuid;
begin
  perform public.require_capability(array['create_jobs', 'plan_day', 'assign_jobs'], p_marina);
  if nullif(trim(coalesce(p ->> 'berth_code', '')), '') is not null then
    select b.id into berth from public.berths b
    where b.marina_id = p_marina and b.code = upper(trim(p ->> 'berth_code'));
    if berth is null then
      raise exception 'berth_not_found' using errcode = 'P0001';
    end if;
  end if;
  if coalesce(p ->> 'job_type', 'other') not in ('arrival', 'departure', 'return', 'power', 'inspection', 'other') then
    raise exception 'invalid_kind' using errcode = 'P0001';
  end if;
  insert into public.dock_tasks (
    marina_id, berth_id, description, due_at, status, job_type, boat_name, length_m, beam_m,
    reason, reason_note, people_needed, source
  ) values (
    p_marina, berth, left(trim(coalesce(p ->> 'description', '')), 300),
    coalesce(nullif(p ->> 'due_at', '')::timestamptz, now()), 'to_do',
    coalesce(p ->> 'job_type', 'other'), left(trim(coalesce(p ->> 'boat_name', '')), 80),
    len, nullif(p ->> 'beam_m', '')::numeric,
    case when p ->> 'reason' in ('short_handed', 'first_time', 'other') then p ->> 'reason' else '' end,
    left(trim(coalesce(p ->> 'reason_note', '')), 200),
    coalesce(nullif(p ->> 'people_needed', '')::smallint, public.people_for_length(len)),
    case when p ->> 'source' in ('walk_in', 'vhf') then p ->> 'source' else 'staff' end
  )
  returning id into created;
  return created;
end;
$$;

-- A marinheiro (or the night watch) takes a job for themselves.
create function public.claim_job(p_job uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  marina text := public.job_marina(p_job);
  member uuid;
begin
  perform public.require_capability(array['claim_jobs'], marina);
  if not exists (select 1 from public.dock_tasks t where t.id = p_job and t.status = 'to_do') then
    raise exception 'job_not_open' using errcode = 'P0001';
  end if;
  member := public.my_member_id(marina);
  insert into public.job_assignments (job_id, member_id, claimed, assigned_by)
  values (p_job, member, true, (select auth.uid()))
  on conflict (job_id, member_id) do update set claimed = true;
end;
$$;

-- Done: by someone on the job, or by whoever plans the day.
create function public.complete_job(p_job uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  marina text := public.job_marina(p_job);
begin
  if not (
    public.has_capability('plan_day', marina)
    or (public.has_capability('claim_jobs', marina)
        and exists (select 1 from public.job_assignments a
                    where a.job_id = p_job and a.member_id = public.my_member_id(marina)))
  ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  update public.dock_tasks set status = 'done', done_at = now(), help_requested_at = null, updated_at = now()
  where id = p_job and status = 'to_do';
  if not found then
    raise exception 'job_not_open' using errcode = 'P0001';
  end if;
end;
$$;

-- Need help: the others on shift now get an alert.
create function public.request_job_help(p_job uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  marina text := public.job_marina(p_job);
  me uuid;
  lnow timestamp := now() at time zone 'Europe/Lisbon';
begin
  perform public.require_capability(array['claim_jobs'], marina);
  me := public.my_member_id(marina);
  if not exists (select 1 from public.job_assignments a where a.job_id = p_job and a.member_id = me) then
    raise exception 'not_on_job' using errcode = 'P0001';
  end if;
  update public.dock_tasks set help_requested_at = now(), updated_at = now() where id = p_job;
  insert into public.staff_alerts (marina_id, member_id, kind, job_id)
  select distinct marina, sh.member_id, 'help', p_job
  from public.shifts sh
  join public.staff_members s on s.id = sh.member_id
  where sh.marina_id = marina and sh.member_id <> me
    and s.active and s.role in ('marinheiro', 'night_watch', 'dockmaster')
    and (
      (sh.ends_at > sh.starts_at and sh.day = lnow::date and lnow::time between sh.starts_at and sh.ends_at)
      or (sh.ends_at <= sh.starts_at and sh.day = lnow::date and lnow::time >= sh.starts_at)
      or (sh.ends_at <= sh.starts_at and sh.day = lnow::date - 1 and lnow::time <= sh.ends_at)
    );
end;
$$;

-- A team lead or the dockmaster puts someone on a job; they get an alert.
create function public.assign_job(p_job uuid, p_member uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  marina text := public.job_marina(p_job);
begin
  perform public.require_capability(array['assign_jobs'], marina);
  if not exists (
    select 1 from public.staff_members s
    where s.id = p_member and s.marina_id = marina and s.active
      and (s.access_until is null or s.access_until >= public.lisbon_today())
  ) then
    raise exception 'member_not_found' using errcode = 'P0001';
  end if;
  insert into public.job_assignments (job_id, member_id, claimed, assigned_by)
  values (p_job, p_member, false, (select auth.uid()))
  on conflict (job_id, member_id) do nothing;
  if found and p_member <> public.my_member_id(marina) then
    insert into public.staff_alerts (marina_id, member_id, kind, job_id)
    values (marina, p_member, 'assigned', p_job);
  end if;
end;
$$;

create function public.unassign_job(p_job uuid, p_member uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  marina text := public.job_marina(p_job);
begin
  if not (
    public.has_capability('assign_jobs', marina)
    or (public.has_capability('claim_jobs', marina) and p_member = public.my_member_id(marina))
  ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  delete from public.job_assignments where job_id = p_job and member_id = p_member;
end;
$$;

-- The dockmaster moves a job (the boater sees the new time), changes how many
-- people it needs or its place in the order, or cancels it.
create function public.update_job(p_job uuid, p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  marina text := public.job_marina(p_job);
begin
  perform public.require_capability(array['plan_day'], marina);
  update public.dock_tasks set
    due_at = coalesce(nullif(p ->> 'due_at', '')::timestamptz, due_at),
    people_needed = coalesce(nullif(p ->> 'people_needed', '')::smallint, people_needed),
    sort_order = case when p ? 'sort_order' then nullif(p ->> 'sort_order', '')::integer else sort_order end,
    status = case when p ->> 'status' in ('to_do', 'cancelled') then p ->> 'status' else status end,
    updated_at = now()
  where id = p_job;
  if not found then
    raise exception 'job_not_found' using errcode = 'P0001';
  end if;
end;
$$;

-- Tonight, for the night watch: boats still to arrive today and boats due to
-- leave tomorrow morning. Boat, size, berth and time only.
create function public.tonight_movements(p_marina text)
returns table (
  arrival_id uuid,
  kind text,
  boat_name text,
  length_m numeric,
  beam_m numeric,
  berth_code text,
  at_time time,
  arrival_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_capability(array['late_check_in', 'check_in'], p_marina);
  return query
  select a.id, 'arrival', a.boat_name, a.length_m, a.beam_m, b.code, a.eta, a.arrival_status
  from public.arrivals a
  left join public.berths b on b.id = a.berth_id
  where a.marina_id = p_marina and a.status = 'approved' and a.arrival_status = 'pending'
    and a.expected_arrival <= public.lisbon_today()
  union all
  select a.id, 'departure', a.boat_name, a.length_m, a.beam_m, b.code, a.etd, a.arrival_status
  from public.arrivals a
  left join public.berths b on b.id = a.berth_id
  where a.marina_id = p_marina and a.status = 'approved' and a.arrival_status = 'arrived'
    and a.departure = public.lisbon_today() + 1
    and (a.etd is null or a.etd <= time '10:00')
  order by 7 nulls last;
end;
$$;

-- A late arrival checked in by the night watch.
create function public.late_check_in(p_arrival uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_capability(array['late_check_in', 'check_in'], public.arrival_marina(p_arrival));
  update public.arrivals set arrival_status = 'arrived', arrived_at = now()
  where id = p_arrival and status = 'approved' and arrival_status = 'pending'
    and expected_arrival <= public.lisbon_today();
  if not found then
    raise exception 'arrival_not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.create_job(text, jsonb) from public, anon;
revoke all on function public.claim_job(uuid) from public, anon;
revoke all on function public.complete_job(uuid) from public, anon;
revoke all on function public.request_job_help(uuid) from public, anon;
revoke all on function public.assign_job(uuid, uuid) from public, anon;
revoke all on function public.unassign_job(uuid, uuid) from public, anon;
revoke all on function public.update_job(uuid, jsonb) from public, anon;
revoke all on function public.tonight_movements(text) from public, anon;
revoke all on function public.late_check_in(uuid) from public, anon;
grant execute on function public.create_job(text, jsonb) to authenticated;
grant execute on function public.claim_job(uuid) to authenticated;
grant execute on function public.complete_job(uuid) to authenticated;
grant execute on function public.request_job_help(uuid) to authenticated;
grant execute on function public.assign_job(uuid, uuid) to authenticated;
grant execute on function public.unassign_job(uuid, uuid) to authenticated;
grant execute on function public.update_job(uuid, jsonb) to authenticated;
grant execute on function public.tonight_movements(text) to authenticated;
grant execute on function public.late_check_in(uuid) to authenticated;

-- Jobs, who is on them and alerts reach the phones live.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.dock_tasks;
    alter publication supabase_realtime add table public.job_assignments;
    alter publication supabase_realtime add table public.staff_alerts;
  end if;
end;
$$;
