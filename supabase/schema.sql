create table if not exists public.leads (
  id bigint generated always as identity primary key,
  email text not null,
  name text,
  phone text,
  company text,
  domain text,
  industry text,
  score int,
  lost_revenue_month int,
  potential_percent int,
  created_at timestamptz not null default now()
);

-- Nur der Server (Service-Role-Key) darf schreiben/lesen.
alter table public.leads enable row level security;
