-- Relet offers from berth holders, and the berth history.
--
-- A berth holder's offer is the existing relet_offers table. Its first status
-- 'submitted' is shown as "Pending"; staff approve or decline it, and only an
-- approved offer makes the berth appear in suggest_berths. The berth holder
-- creates, cancels and reports an early return only through the functions
-- below, so they can never touch a field staff own.
--
-- berth_events is an append-only log of every status change on an arrival, a
-- relet offer and a berth holding, written by triggers, so no screen can
-- forget to log.

-- ---------------------------------------------------------------------------
-- Relet offers belong to a user
-- ---------------------------------------------------------------------------

alter table public.relet_offers
  add column user_id uuid references auth.users (id) on delete set null;

create index relet_offers_user_id_idx on public.relet_offers (user_id);

create policy "Holders read their own relet offers" on public.relet_offers
  for select to authenticated using (user_id = (select auth.uid()));

-- Creates an offer for the berth the signed-in user holds today. The berth is
-- never taken from the caller unless it is one they hold.
create function public.submit_relet_offer(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  holding public.berth_contracts;
  wanted uuid := nullif(p ->> 'berth_id', '')::uuid;
  leaving date := nullif(p ->> 'away_from', '')::date;
  returning_on date := nullif(p ->> 'away_to', '')::date;
  holder_name text;
  now_at timestamptz := now();
  created uuid;
begin
  if uid is null then
    raise exception 'not_signed_in' using errcode = '28000';
  end if;

  select c.* into holding
  from public.berth_contracts c
  where c.user_id = uid
    and c.starts_on <= public.lisbon_today()
    and c.ends_on >= public.lisbon_today()
    and (wanted is null or c.berth_id = wanted)
  order by c.starts_on
  limit 1;
  if not found then
    raise exception 'not_a_berth_holder' using errcode = '42501';
  end if;

  if leaving is null or returning_on is null or leaving >= returning_on then
    raise exception 'invalid_dates' using errcode = 'P0001';
  end if;
  if leaving < public.lisbon_today() then
    raise exception 'dates_in_past' using errcode = 'P0001';
  end if;
  if not (
    coalesce((p ->> 'boat_removal_confirmed')::boolean, false)
    and coalesce((p ->> 'relet_consent')::boolean, false)
    and coalesce((p ->> 'outside_arrangement_confirmed')::boolean, false)
    and coalesce((p ->> 'terms_accepted')::boolean, false)
    and coalesce((p ->> 'readiness_confirmed')::boolean, false)
  ) then
    raise exception 'confirmations_needed' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.relet_offers o
    where o.user_id = uid
      and o.berth_id = holding.berth_id
      and o.status in ('submitted', 'approved', 'listed', 'booked')
      and leaving < o.away_to and o.away_from < returning_on
  ) then
    raise exception 'offer_overlaps' using errcode = 'P0001';
  end if;

  select coalesce(nullif(trim(pr.full_name), ''), pr.email, 'Berth holder') into holder_name
  from public.profiles pr where pr.user_id = uid;

  insert into public.relet_offers (
    marina_id, berth_id, user_id, berth_holder, berth_holder_ref,
    away_from, away_to, status,
    boat_removal_confirmed, relet_consent, outside_arrangement_confirmed,
    terms_accepted_at, readiness_confirmed_at, history, resubmit_of
  ) values (
    holding.marina_id, holding.berth_id, uid, coalesce(holder_name, 'Berth holder'), uid::text,
    leaving, returning_on, 'submitted',
    true, true, true,
    now_at, now_at,
    jsonb_build_array(jsonb_build_object('status', 'submitted', 'at', now_at)),
    nullif(p ->> 'resubmit_of', '')::uuid
  )
  returning id into created;
  return created;
end;
$$;

-- Cancels the signed-in holder's offer. Refused when a guest is already
-- confirmed on the berth in the period: the marina has made a commitment, so
-- the holder has to contact the marina instead.
create function public.cancel_relet_offer(p_offer uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.relet_offers;
begin
  select * into o from public.relet_offers
  where id = p_offer and user_id = (select auth.uid()) for update;
  if not found then
    raise exception 'offer_not_found' using errcode = 'P0001';
  end if;
  if o.status not in ('submitted', 'approved', 'listed', 'booked') then
    raise exception 'offer_not_active' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.arrivals a
    where a.berth_id = o.berth_id
      and a.status = 'approved'
      and a.arrival_status in ('pending', 'arrived')
      and public.stay_range(a.expected_arrival, a.departure) && daterange(o.away_from, o.away_to, '[)')
  ) then
    raise exception 'guest_confirmed' using errcode = 'P0001';
  end if;
  update public.relet_offers
  set status = 'cancelled',
      history = history || jsonb_build_array(jsonb_build_object(
        'status', 'cancelled', 'at', now(), 'note', 'Cancelled by the berth holder'))
  where id = p_offer;
end;
$$;

-- The holder tells the marina they are coming back early.
create function public.request_early_return(p_offer uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.relet_offers;
begin
  select * into o from public.relet_offers
  where id = p_offer and user_id = (select auth.uid()) for update;
  if not found then
    raise exception 'offer_not_found' using errcode = 'P0001';
  end if;
  if o.status not in ('approved', 'listed', 'booked') then
    raise exception 'offer_not_active' using errcode = 'P0001';
  end if;
  if o.early_return_requested_at is not null then
    return;
  end if;
  update public.relet_offers
  set early_return_requested_at = now(),
      history = history || jsonb_build_array(jsonb_build_object(
        'status', o.status, 'at', now(), 'note', 'Berth holder asked to return early'))
  where id = p_offer;
end;
$$;

revoke all on function public.submit_relet_offer(jsonb) from public, anon;
revoke all on function public.cancel_relet_offer(uuid) from public, anon;
revoke all on function public.request_early_return(uuid) from public, anon;
grant execute on function public.submit_relet_offer(jsonb) to authenticated;
grant execute on function public.cancel_relet_offer(uuid) to authenticated;
grant execute on function public.request_early_return(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- History
-- ---------------------------------------------------------------------------

create table public.berth_events (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null,
  -- The berth the change concerns. Null for a request that has no berth yet.
  berth_id uuid,
  subject text not null check (subject in ('arrival', 'relet_offer', 'berth_holding')),
  subject_id uuid not null,
  -- The status before and after. A holding uses 'linked', 'changed', 'ended'
  -- and 'removed'; an arrival that only moved berth uses 'berth_changed'.
  from_status text,
  to_status text not null,
  note text not null default '',
  -- Who did it: the signed-in user, their name and role at the time. Null and
  -- 'system' for a change made outside a session (the seed, a migration).
  actor_id uuid,
  actor_name text not null default '',
  actor_role text not null check (actor_role in ('staff', 'guest', 'berth_holder', 'system')),
  created_at timestamptz not null default now()
);

create index berth_events_berth_idx on public.berth_events (berth_id, created_at desc);
create index berth_events_subject_idx on public.berth_events (subject, subject_id);

revoke all on public.berth_events from anon, authenticated;
grant select on public.berth_events to authenticated;

alter table public.berth_events enable row level security;

-- Staff read their marina's history. Nobody writes it directly: the triggers
-- below do, with the table owner's rights.
create policy "Staff read berth events" on public.berth_events
  for select to authenticated using (public.is_staff_of(marina_id));

create function public.log_berth_event(
  p_marina text,
  p_berth uuid,
  p_subject text,
  p_subject_id uuid,
  p_from text,
  p_to text,
  p_note text,
  p_user_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_label text := '';
  actor_kind text;
begin
  if actor is null then
    actor_kind := 'system';
  elsif public.is_staff_of(p_marina) then
    actor_kind := 'staff';
    select coalesce(
      nullif((select s.display_name from public.staff_members s
              where s.user_id = actor and s.marina_id = p_marina limit 1), ''),
      nullif((select pr.full_name from public.profiles pr where pr.user_id = actor), ''),
      (select pr.email from public.profiles pr where pr.user_id = actor),
      ''
    ) into actor_label;
  else
    actor_kind := p_user_role;
    select coalesce(
      nullif((select pr.full_name from public.profiles pr where pr.user_id = actor), ''),
      (select pr.email from public.profiles pr where pr.user_id = actor),
      ''
    ) into actor_label;
  end if;

  insert into public.berth_events
    (marina_id, berth_id, subject, subject_id, from_status, to_status, note,
     actor_id, actor_name, actor_role)
  values
    (p_marina, p_berth, p_subject, p_subject_id, p_from, p_to, coalesce(p_note, ''),
     actor, coalesce(actor_label, ''), actor_kind);
end;
$$;

revoke all on function public.log_berth_event(text, uuid, text, uuid, text, text, text, text)
  from public, anon, authenticated;

create function public.arrivals_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_berth_event(new.marina_id, new.berth_id, 'arrival', new.id,
      null, new.status, '', 'guest');
  elsif new.status is distinct from old.status then
    perform public.log_berth_event(new.marina_id, coalesce(new.berth_id, old.berth_id), 'arrival', new.id,
      old.status, new.status, new.decision_note, 'guest');
  elsif new.arrival_status is distinct from old.arrival_status then
    perform public.log_berth_event(new.marina_id, coalesce(new.berth_id, old.berth_id), 'arrival', new.id,
      old.arrival_status, new.arrival_status, '', 'guest');
  elsif new.berth_id is distinct from old.berth_id then
    perform public.log_berth_event(new.marina_id, coalesce(new.berth_id, old.berth_id), 'arrival', new.id,
      new.status, 'berth_changed', '', 'guest');
  end if;
  return null;
end;
$$;

create trigger arrivals_history
  after insert or update on public.arrivals
  for each row execute function public.arrivals_log();

create function public.relet_offers_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_berth_event(new.marina_id, new.berth_id, 'relet_offer', new.id,
      null, new.status, '', 'berth_holder');
  elsif new.status is distinct from old.status then
    perform public.log_berth_event(new.marina_id, new.berth_id, 'relet_offer', new.id,
      old.status, new.status, new.decision_note, 'berth_holder');
  end if;
  return null;
end;
$$;

create trigger relet_offers_history
  after insert or update on public.relet_offers
  for each row execute function public.relet_offers_log();

create function public.berth_contracts_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_berth_event(new.marina_id, new.berth_id, 'berth_holding', new.id,
      null, 'linked', new.holder_email, 'berth_holder');
  elsif tg_op = 'DELETE' then
    perform public.log_berth_event(old.marina_id, old.berth_id, 'berth_holding', old.id,
      'linked', 'removed', old.holder_email, 'berth_holder');
  elsif new.ends_on is distinct from old.ends_on then
    perform public.log_berth_event(new.marina_id, new.berth_id, 'berth_holding', new.id,
      'linked', case when new.ends_on < public.lisbon_today() then 'ended' else 'changed' end,
      new.holder_email, 'berth_holder');
  elsif new.user_id is distinct from old.user_id and new.user_id is not null then
    perform public.log_berth_event(new.marina_id, new.berth_id, 'berth_holding', new.id,
      'linked', 'linked', 'Signed in: ' || new.holder_email, 'berth_holder');
  end if;
  return null;
end;
$$;

create trigger berth_contracts_history
  after insert or update or delete on public.berth_contracts
  for each row execute function public.berth_contracts_log();

-- Staff see offers arrive as they are made.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.relet_offers;
  end if;
end;
$$;
