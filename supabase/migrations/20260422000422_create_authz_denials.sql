create table public.authz_denials (
  id bigserial primary key,
  principal_id uuid references public.profiles (id) on delete set null,
  capability text not null,
  resource_type text,
  resource_id text,
  reason text not null,
  request_path text,
  created_at timestamptz not null default now()
);

create index authz_denials_principal_idx
  on public.authz_denials (principal_id, created_at desc);
create index authz_denials_capability_idx
  on public.authz_denials (capability, created_at desc);
