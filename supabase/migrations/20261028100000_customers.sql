-- Customers: berth holders and guests, their boats, a berth holder's right of
-- use (berth contract) and their documents. Staff of a marina see and change
-- only that marina's customers; admins remove them. Nothing for anon.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  kind text not null check (kind in ('berth_holder', 'guest')),
  full_name text not null check (length(trim(full_name)) > 0),
  email text not null default '',
  phone text not null default '',
  nationality text not null default '',
  created_at timestamptz not null default now()
);

-- One customer per email address in a marina, so a returning guest keeps one
-- history. Customers without an email are not matched.
create unique index customers_marina_email_key
  on public.customers (marina_id, lower(email)) where email <> '';

create table public.boats (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  boat_type text not null default '',
  length_m numeric(5, 2),
  beam_m numeric(5, 2),
  draft_m numeric(5, 2),
  flag_country text not null default '',
  registration_number text not null default '',
  created_at timestamptz not null default now()
);

-- A berth holder's right of use for a berth.
create table public.berth_contracts (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  berth_id uuid not null references public.berths (id) on delete cascade,
  boat_id uuid references public.boats (id) on delete set null,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (starts_on <= ends_on)
);

create table public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  boat_id uuid references public.boats (id) on delete set null,
  kind text not null check (
    kind in ('registration', 'insurance', 'competence', 'vhf_licence', 'passport', 'right_of_use', 'other')
  ),
  reference text not null default '',
  expires_on date,
  created_at timestamptz not null default now()
);

-- The guest an arrival belongs to.
alter table public.arrivals
  add column customer_id uuid references public.customers (id) on delete set null;

create index boats_customer_id_idx on public.boats (customer_id);
create index berth_contracts_customer_id_idx on public.berth_contracts (customer_id);
create index berth_contracts_berth_id_idx on public.berth_contracts (berth_id);
create index customer_documents_customer_id_idx on public.customer_documents (customer_id);
create index arrivals_customer_id_idx on public.arrivals (customer_id);

-- A row pointing at another row must stay in the same marina.
create function public.customer_in_marina(target_customer uuid, target_marina text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_customer is null or exists (
    select 1 from public.customers c where c.id = target_customer and c.marina_id = target_marina
  );
$$;

create function public.boat_in_marina(target_boat uuid, target_marina text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_boat is null or exists (
    select 1 from public.boats b where b.id = target_boat and b.marina_id = target_marina
  );
$$;

revoke all on function public.customer_in_marina(uuid, text) from public, anon;
revoke all on function public.boat_in_marina(uuid, text) from public, anon;
grant execute on function public.customer_in_marina(uuid, text) to authenticated;
grant execute on function public.boat_in_marina(uuid, text) to authenticated;

revoke all on public.customers, public.boats, public.berth_contracts, public.customer_documents
  from anon, authenticated;
grant select, insert, update, delete on public.customers, public.boats, public.berth_contracts,
  public.customer_documents to authenticated;

alter table public.customers enable row level security;
alter table public.boats enable row level security;
alter table public.berth_contracts enable row level security;
alter table public.customer_documents enable row level security;

create policy "Staff read customers" on public.customers
  for select to authenticated using (public.is_staff_of(marina_id));
create policy "Staff add customers" on public.customers
  for insert to authenticated with check (public.is_staff_of(marina_id));
create policy "Staff update customers" on public.customers
  for update to authenticated
  using (public.is_staff_of(marina_id)) with check (public.is_staff_of(marina_id));
create policy "Admins remove customers" on public.customers
  for delete to authenticated using (public.is_admin_of(marina_id));

create policy "Staff read boats" on public.boats
  for select to authenticated using (public.is_staff_of(marina_id));
create policy "Staff add boats" on public.boats
  for insert to authenticated
  with check (public.is_staff_of(marina_id) and public.customer_in_marina(customer_id, marina_id));
create policy "Staff update boats" on public.boats
  for update to authenticated
  using (public.is_staff_of(marina_id))
  with check (public.is_staff_of(marina_id) and public.customer_in_marina(customer_id, marina_id));
create policy "Admins remove boats" on public.boats
  for delete to authenticated using (public.is_admin_of(marina_id));

create policy "Staff read contracts" on public.berth_contracts
  for select to authenticated using (public.is_staff_of(marina_id));
create policy "Staff add contracts" on public.berth_contracts
  for insert to authenticated
  with check (
    public.is_staff_of(marina_id)
    and public.customer_in_marina(customer_id, marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and public.boat_in_marina(boat_id, marina_id)
  );
create policy "Staff update contracts" on public.berth_contracts
  for update to authenticated
  using (public.is_staff_of(marina_id))
  with check (
    public.is_staff_of(marina_id)
    and public.customer_in_marina(customer_id, marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and public.boat_in_marina(boat_id, marina_id)
  );
create policy "Admins remove contracts" on public.berth_contracts
  for delete to authenticated using (public.is_admin_of(marina_id));

create policy "Staff read documents" on public.customer_documents
  for select to authenticated using (public.is_staff_of(marina_id));
create policy "Staff add documents" on public.customer_documents
  for insert to authenticated
  with check (
    public.is_staff_of(marina_id)
    and public.customer_in_marina(customer_id, marina_id)
    and public.boat_in_marina(boat_id, marina_id)
  );
create policy "Staff update documents" on public.customer_documents
  for update to authenticated
  using (public.is_staff_of(marina_id))
  with check (
    public.is_staff_of(marina_id)
    and public.customer_in_marina(customer_id, marina_id)
    and public.boat_in_marina(boat_id, marina_id)
  );
create policy "Admins remove documents" on public.customer_documents
  for delete to authenticated using (public.is_admin_of(marina_id));

-- An arrival may only point at a customer of its own marina.
drop policy "Staff add arrivals" on public.arrivals;
drop policy "Staff update arrivals" on public.arrivals;
create policy "Staff add arrivals" on public.arrivals
  for insert to authenticated
  with check (
    public.is_staff_of(marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and public.customer_in_marina(customer_id, marina_id)
  );
create policy "Staff update arrivals" on public.arrivals
  for update to authenticated
  using (public.is_staff_of(marina_id))
  with check (
    public.is_staff_of(marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and public.customer_in_marina(customer_id, marina_id)
  );
