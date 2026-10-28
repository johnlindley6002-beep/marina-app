-- The arrival flow: a guest asks for a berth, staff see the request at once,
-- get a list of berths that really fit and are free, and confirm, decline or
-- propose other dates. The database refuses a double booking.
--
-- Status mapping, so nothing in the staff screens has to be renamed:
--   requested = status 'new'
--   confirmed = status 'approved', arrival_status 'pending'
--   declined  = status 'declined'
--   arrived   = arrival_status 'arrived'
--   departed  = arrival_status 'departed'
-- and one new status, 'dates_proposed', when staff offer other dates.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.arrivals
  add column user_id uuid references auth.users (id) on delete set null,
  add column boat_id uuid references public.boats (id) on delete set null,
  -- Other dates staff offered, waiting for the guest to accept.
  add column proposed_arrival date,
  add column proposed_departure date;

alter table public.arrivals drop constraint arrivals_status_check;
alter table public.arrivals
  add constraint arrivals_status_check
  check (status in ('new', 'approved', 'declined', 'dates_proposed'));

alter table public.arrivals
  add constraint arrivals_proposal_check
  check (
    (proposed_arrival is null and proposed_departure is null)
    or (
      proposed_arrival is not null
      and (proposed_departure is null or proposed_arrival <= proposed_departure)
    )
  );

create index arrivals_user_id_idx on public.arrivals (user_id);
create index arrivals_boat_id_idx on public.arrivals (boat_id);

-- ---------------------------------------------------------------------------
-- No double booking
-- ---------------------------------------------------------------------------

-- The nights a stay occupies: the arrival day up to, not including, the
-- departure day, so one guest can leave the morning another arrives. A stay
-- with no departure yet is open ended. A same-day stay counts as one night.
create function public.stay_range(arrival date, departure date)
returns daterange
language sql
immutable
as $$
  select daterange(
    arrival,
    case when departure is null then null else greatest(departure, arrival + 1) end,
    '[)'
  );
$$;

-- Two confirmed or arrived stays can never overlap on the same berth. This is
-- the last line of defence: confirm_arrival checks first, and this refuses
-- whatever slips through, including two staff members acting at once.
alter table public.arrivals
  add constraint arrivals_no_double_booking
  exclude using gist (
    berth_id with =,
    public.stay_range(expected_arrival, departure) with &&
  )
  where (
    berth_id is not null
    and status = 'approved'
    and arrival_status in ('pending', 'arrived')
  );

-- ---------------------------------------------------------------------------
-- What a guest may read: their own requests, without the staff-only fields
-- ---------------------------------------------------------------------------

-- A view that runs with its owner's rights, on purpose: guests get no policy
-- on the arrivals table (it holds staff notes and berth ids), so this view is
-- their only way in, and it filters to the signed-in user. It shows the berth
-- code only once staff have confirmed that guest into it.
create view public.my_arrivals as
select
  a.id,
  a.marina_id,
  m.name as marina_name,
  case
    when a.arrival_status = 'departed' then 'departed'
    when a.arrival_status = 'arrived' then 'arrived'
    when a.status = 'approved' then 'confirmed'
    when a.status = 'declined' then 'declined'
    when a.status = 'dates_proposed' then 'dates_proposed'
    else 'requested'
  end as display_status,
  a.expected_arrival,
  a.eta,
  a.departure,
  a.etd,
  a.open_ended,
  a.boat_id,
  a.boat_name,
  case when a.status = 'approved' then b.code else null end as berth_code,
  case when a.status in ('declined', 'dates_proposed', 'approved') then a.decision_note else '' end
    as decision_note,
  a.proposed_arrival,
  a.proposed_departure,
  a.created_at
from public.arrivals a
join public.marinas m on m.id = a.marina_id
left join public.berths b on b.id = a.berth_id
where a.user_id = (select auth.uid());

revoke all on public.my_arrivals from anon, authenticated;
grant select on public.my_arrivals to authenticated;

-- ---------------------------------------------------------------------------
-- Guest actions
-- ---------------------------------------------------------------------------

-- Creates an arrival request for the signed-in guest and their boat. The
-- caller supplies the stay and the boat details as entered on the form; the
-- user, the boat link, the customer record and the status are set here and
-- cannot be chosen by the caller.
create function public.request_arrival(p_marina text, p_boat uuid, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  boat public.boats;
  profile public.profiles;
  arrival date;
  leaving date;
  guest_email text;
  guest_name text;
  customer uuid;
  created uuid;
begin
  if uid is null then
    raise exception 'not_signed_in' using errcode = '28000';
  end if;
  if not exists (select 1 from public.marinas where id = p_marina) then
    raise exception 'marina_not_found' using errcode = 'P0001';
  end if;
  select * into boat from public.boats where id = p_boat and user_id = uid;
  if not found then
    raise exception 'boat_not_found' using errcode = 'P0001';
  end if;
  select * into profile from public.profiles where user_id = uid;

  arrival := nullif(p ->> 'expected_arrival', '')::date;
  leaving := nullif(p ->> 'departure', '')::date;
  if arrival is null or arrival < public.lisbon_today() then
    raise exception 'invalid_dates' using errcode = 'P0001';
  end if;
  if leaving is not null and leaving < arrival then
    raise exception 'invalid_dates' using errcode = 'P0001';
  end if;

  if (select count(*) from public.arrivals a
      where a.user_id = uid and a.status in ('new', 'dates_proposed')) >= 5 then
    raise exception 'too_many_requests' using errcode = 'P0001';
  end if;

  guest_email := coalesce(nullif(trim(p ->> 'email'), ''), profile.email);
  guest_name := coalesce(nullif(trim(p ->> 'skipper_name'), ''), nullif(profile.full_name, ''), guest_email);

  if guest_email <> '' then
    insert into public.customers (marina_id, kind, full_name, email, phone, nationality)
    values (p_marina, 'guest', guest_name, guest_email,
            coalesce(p ->> 'phone', profile.phone), profile.nationality)
    on conflict (marina_id, lower(email)) where email <> ''
    do update set phone = case when excluded.phone <> '' then excluded.phone else public.customers.phone end
    returning id into customer;
  else
    insert into public.customers (marina_id, kind, full_name)
    values (p_marina, 'guest', guest_name)
    returning id into customer;
  end if;

  insert into public.arrivals (
    marina_id, user_id, boat_id, customer_id, status, arrival_status,
    expected_arrival, eta, departure, etd, open_ended,
    boat_name, boat_type, length_m, beam_m, draft_m, flag_country, requested_berth_code,
    skipper_name, phone, email, home_port, people_on_board, services,
    boat_use, operating_entity, company_registration, contract_name, contract_role,
    eu_status, last_port, next_port, crew, documents
  ) values (
    p_marina, uid, p_boat, customer, 'new', 'pending',
    arrival, nullif(p ->> 'eta', '')::time, leaving, nullif(p ->> 'etd', '')::time,
    coalesce((p ->> 'open_ended')::boolean, leaving is null),
    coalesce(nullif(p ->> 'boat_name', ''), boat.name),
    coalesce(p ->> 'boat_type', boat.boat_type),
    coalesce(nullif(p ->> 'length_m', '')::numeric, boat.length_m),
    coalesce(nullif(p ->> 'beam_m', '')::numeric, boat.beam_m),
    coalesce(nullif(p ->> 'draft_m', '')::numeric, boat.draft_m),
    coalesce(nullif(p ->> 'flag_country', ''), boat.flag_country),
    coalesce(p ->> 'requested_berth_code', ''),
    guest_name,
    coalesce(p ->> 'phone', profile.phone, ''),
    guest_email,
    coalesce(nullif(p ->> 'home_port', ''), boat.home_port, ''),
    coalesce(p ->> 'people_on_board', ''),
    coalesce(p -> 'services', '{}'::jsonb),
    coalesce(p ->> 'boat_use', 'private'),
    coalesce(p ->> 'operating_entity', ''),
    coalesce(p ->> 'company_registration', ''),
    coalesce(p ->> 'contract_name', ''),
    coalesce(p ->> 'contract_role', ''),
    case when p ->> 'eu_status' in ('yes', 'no') then p ->> 'eu_status' else '' end,
    coalesce(p ->> 'last_port', ''),
    coalesce(p ->> 'next_port', ''),
    coalesce(p -> 'crew', '[]'::jsonb),
    coalesce(p -> 'documents', '{}'::jsonb)
  )
  returning id into created;

  return created;
end;
$$;

-- The guest accepts the dates staff proposed. The request goes back to
-- 'requested' with the new dates, for staff to confirm with a berth.
create function public.accept_proposed_dates(p_arrival uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.arrivals;
begin
  select * into a from public.arrivals
  where id = p_arrival and user_id = (select auth.uid()) for update;
  if not found then
    raise exception 'arrival_not_found' using errcode = 'P0001';
  end if;
  if a.status <> 'dates_proposed' or a.proposed_arrival is null then
    raise exception 'no_proposal' using errcode = 'P0001';
  end if;
  update public.arrivals
  set expected_arrival = a.proposed_arrival,
      departure = a.proposed_departure,
      open_ended = a.proposed_departure is null,
      proposed_arrival = null,
      proposed_departure = null,
      status = 'new',
      decision_note = '',
      decision_at = null
  where id = p_arrival;
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff: suggested berths, confirm, decline, propose other dates
-- ---------------------------------------------------------------------------

-- The berths that fit this request and are free for every night of the stay.
--
--  * the boat's length, beam and draft are within the berth's limits (a
--    measurement left blank on the request is not checked);
--  * the berth is in service;
--  * no confirmed or arrived stay overlaps (the same rule as the constraint);
--  * on every night a berth holder has the berth, an approved relet offer
--    covers it, so a held berth shows up only while its holder is away.
--
-- Berths nobody holds come first, then the tightest fit. Staff only.
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
#variable_conflict use_column
declare
  a public.arrivals;
  stay daterange;
  first_night date;
  last_night date;
begin
  select * into a from public.arrivals where id = p_arrival;
  if not found then
    raise exception 'arrival_not_found' using errcode = 'P0001';
  end if;
  if not public.is_staff_of(a.marina_id) then
    raise exception 'staff_only' using errcode = '42501';
  end if;

  stay := public.stay_range(a.expected_arrival, a.departure);
  first_night := lower(stay);
  -- An open ended stay is checked for a year ahead.
  last_night := coalesce(upper(stay) - 1, first_night + 365);

  return query
  with candidates as (
  select
    b.id as c_id,
    b.code as c_code,
    b.pontoon as c_pontoon,
    b.class as c_class,
    b.max_length_m as c_length,
    b.beam_m as c_beam,
    b.draft_m as c_draft,
    exists (
      select 1 from public.berth_contracts c
      where c.berth_id = b.id
        and daterange(c.starts_on, c.ends_on, '[]') && daterange(first_night, last_night, '[]')
    ) as c_relet,
    b.max_length_m - coalesce(a.length_m, 0) as c_slack
  from public.berths b
  where b.marina_id = a.marina_id
    and b.status = 'in_service'
    and (a.length_m is null or a.length_m <= b.max_length_m)
    and (a.beam_m is null or a.beam_m <= b.beam_m)
    and (a.draft_m is null or a.draft_m <= b.draft_m)
    and not exists (
      select 1 from public.arrivals x
      where x.berth_id = b.id
        and x.id <> a.id
        and x.status = 'approved'
        and x.arrival_status in ('pending', 'arrived')
        and public.stay_range(x.expected_arrival, x.departure) && stay
    )
    and not exists (
      select 1
      from generate_series(first_night, last_night, interval '1 day') as g(night)
      where exists (
          select 1 from public.berth_contracts c
          where c.berth_id = b.id and c.starts_on <= g.night::date and c.ends_on >= g.night::date
        )
        and not exists (
          select 1 from public.relet_offers o
          where o.berth_id = b.id
            and o.status in ('approved', 'listed', 'booked')
            and o.approved_nights @> array[g.night::date]
        )
    )
  ), ranked as (
    select
      k.*,
      row_number() over (order by k.c_relet, k.c_slack, k.c_code) as rn_all,
      row_number() over (partition by k.c_relet order by k.c_slack, k.c_code) as rn_group
    from candidates k
  )
  select r.c_id, r.c_code, r.c_pontoon, r.c_class, r.c_length, r.c_beam, r.c_draft, r.c_relet
  from ranked r
  -- The first p_limit berths, and always the three best berths a berth holder
  -- offered, so a released berth is never crowded out by a long list of free ones.
  where r.rn_all <= greatest(p_limit, 1) or (r.c_relet and r.rn_group <= 3)
  order by r.c_relet, r.c_slack, r.c_code;
end;
$$;

-- Confirms a request into a berth, in one step and one transaction. The berth
-- must be one the suggestion list would offer. If another confirmation took
-- the berth in the meantime the exclusion constraint refuses (error 23P01).
create function public.confirm_arrival(p_arrival uuid, p_berth uuid, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.arrivals;
  stay daterange;
  offer record;
begin
  select * into a from public.arrivals where id = p_arrival for update;
  if not found then
    raise exception 'arrival_not_found' using errcode = 'P0001';
  end if;
  if not public.is_staff_of(a.marina_id) then
    raise exception 'staff_only' using errcode = '42501';
  end if;
  if a.status not in ('new', 'dates_proposed') then
    raise exception 'already_decided' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.suggest_berths(p_arrival, 100000) s where s.berth_id = p_berth
  ) then
    raise exception 'berth_not_available' using errcode = 'P0001';
  end if;

  update public.arrivals
  set status = 'approved',
      berth_id = p_berth,
      decision_at = now(),
      decision_note = coalesce(p_note, ''),
      proposed_arrival = null,
      proposed_departure = null
  where id = p_arrival;

  -- A stay on a berth its holder released uses up those nights of the offer.
  stay := public.stay_range(a.expected_arrival, a.departure);
  for offer in
    select o.id, o.approved_nights, o.booked_nights
    from public.relet_offers o
    where o.berth_id = p_berth and o.status in ('approved', 'listed', 'booked')
  loop
    update public.relet_offers o
    set booked_nights = array(
          select distinct n from unnest(o.booked_nights || array(
            select d::date
            from generate_series(lower(stay), coalesce(upper(stay) - 1, lower(stay)), interval '1 day') as d
            where o.approved_nights @> array[d::date]
          )) as n order by n
        ),
        status = 'booked'
    where o.id = offer.id
      and exists (
        select 1
        from generate_series(lower(stay), coalesce(upper(stay) - 1, lower(stay)), interval '1 day') as d
        where o.approved_nights @> array[d::date]
      );
  end loop;
end;
$$;

create function public.decline_arrival(p_arrival uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.arrivals;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required' using errcode = 'P0001';
  end if;
  select * into a from public.arrivals where id = p_arrival for update;
  if not found then
    raise exception 'arrival_not_found' using errcode = 'P0001';
  end if;
  if not public.is_staff_of(a.marina_id) then
    raise exception 'staff_only' using errcode = '42501';
  end if;
  if a.status not in ('new', 'dates_proposed') then
    raise exception 'already_decided' using errcode = 'P0001';
  end if;
  update public.arrivals
  set status = 'declined',
      berth_id = null,
      decision_at = now(),
      decision_note = trim(p_reason),
      proposed_arrival = null,
      proposed_departure = null
  where id = p_arrival;
end;
$$;

create function public.propose_dates(p_arrival uuid, p_from date, p_to date, p_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.arrivals;
begin
  if p_from is null or p_from < public.lisbon_today() or (p_to is not null and p_to < p_from) then
    raise exception 'invalid_dates' using errcode = 'P0001';
  end if;
  select * into a from public.arrivals where id = p_arrival for update;
  if not found then
    raise exception 'arrival_not_found' using errcode = 'P0001';
  end if;
  if not public.is_staff_of(a.marina_id) then
    raise exception 'staff_only' using errcode = '42501';
  end if;
  if a.status not in ('new', 'dates_proposed') then
    raise exception 'already_decided' using errcode = 'P0001';
  end if;
  update public.arrivals
  set status = 'dates_proposed',
      proposed_arrival = p_from,
      proposed_departure = p_to,
      decision_at = now(),
      decision_note = coalesce(trim(p_note), '')
  where id = p_arrival;
end;
$$;

revoke all on function public.request_arrival(text, uuid, jsonb) from public, anon;
revoke all on function public.accept_proposed_dates(uuid) from public, anon;
revoke all on function public.suggest_berths(uuid, integer) from public, anon;
revoke all on function public.confirm_arrival(uuid, uuid, text) from public, anon;
revoke all on function public.decline_arrival(uuid, text) from public, anon;
revoke all on function public.propose_dates(uuid, date, date, text) from public, anon;
grant execute on function public.request_arrival(text, uuid, jsonb) to authenticated;
grant execute on function public.accept_proposed_dates(uuid) to authenticated;
grant execute on function public.suggest_berths(uuid, integer) to authenticated;
grant execute on function public.confirm_arrival(uuid, uuid, text) to authenticated;
grant execute on function public.decline_arrival(uuid, text) to authenticated;
grant execute on function public.propose_dates(uuid, date, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: staff see new requests as they arrive. Realtime applies the row
-- level security policies, so each member only receives their own marina.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.arrivals;
  end if;
end;
$$;
