-- Reception: what staff checked when a boat arrived. The documents seen are
-- the keys of the checklist (features/staff/lib/reception.ts).

alter table public.arrivals
  add column documents_checked text[] not null default '{}',
  add column authority_formalities_done boolean not null default false,
  add column authority_formalities_at timestamptz,
  add column authority_formalities_by uuid references auth.users (id) on delete set null;
