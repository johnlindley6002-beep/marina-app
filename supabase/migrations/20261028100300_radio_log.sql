-- The reception's log of VHF calls and walk-ins, each of which can become an
-- arrival (a new enquiry in the staff inbox).

create table public.radio_log (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  logged_at timestamptz not null default now(),
  boat_name text not null check (length(trim(boat_name)) > 0),
  source text not null check (source in ('vhf', 'walk_in')),
  vhf_channel smallint check (vhf_channel between 1 and 88),
  request text not null check (length(trim(request)) > 0),
  arrival_id uuid references public.arrivals (id) on delete set null,
  logged_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  -- A VHF call has a channel; a walk-in has none.
  check ((source = 'vhf') = (vhf_channel is not null))
);

create index radio_log_marina_logged_idx on public.radio_log (marina_id, logged_at desc);

revoke all on public.radio_log from anon, authenticated;
grant select, insert, update, delete on public.radio_log to authenticated;
alter table public.radio_log enable row level security;

create policy "Staff read the log" on public.radio_log
  for select to authenticated using (public.is_staff_of(marina_id));
create policy "Staff add to the log" on public.radio_log
  for insert to authenticated with check (public.is_staff_of(marina_id));
create policy "Staff update the log" on public.radio_log
  for update to authenticated
  using (public.is_staff_of(marina_id)) with check (public.is_staff_of(marina_id));
create policy "Admins remove log entries" on public.radio_log
  for delete to authenticated using (public.is_admin_of(marina_id));

-- Turns a log entry into a new enquiry in one step: the arrival is dated the
-- Lisbon day of the call, open ended, with the request as the staff note.
-- Security invoker, so the caller's row level security applies to both writes.
create function public.radio_entry_to_arrival(entry_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  entry public.radio_log;
  new_id uuid;
begin
  select * into entry from public.radio_log where id = entry_id for update;
  if not found then
    raise exception 'Log entry not found';
  end if;
  if entry.arrival_id is not null then
    return entry.arrival_id;
  end if;
  insert into public.arrivals (marina_id, status, expected_arrival, open_ended, boat_name, flag_note)
  values (
    entry.marina_id,
    'new',
    (entry.logged_at at time zone 'Europe/Lisbon')::date,
    true,
    entry.boat_name,
    entry.request
  )
  returning id into new_id;
  update public.radio_log set arrival_id = new_id where id = entry_id;
  return new_id;
end;
$$;

revoke all on function public.radio_entry_to_arrival(uuid) from public, anon;
grant execute on function public.radio_entry_to_arrival(uuid) to authenticated;
