-- BALAM v0.13 · Catálogo institucional de auxilios y estaciones con ticket.
-- No contiene datos inventados: comienza vacío y requiere validación del Administrador Maestro.
create table if not exists public.balam_route_support_sites (
  site_id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('fuel','tire','repair','roadside_assistance')),
  name text not null check (length(btrim(name)) between 3 and 180),
  lat numeric(9,6) not null check (lat between 26 and 33.5),
  lon numeric(9,6) not null check (lon between -115.5 and -108),
  municipality_code text check (municipality_code is null or municipality_code ~ '^26[0-9]{3}$'),
  district_id text check (district_id is null or district_id in ('DS01','DS02','DS03','DS04','DS05','DS06')),
  address_text text,
  phone text,
  operating_hours text,
  service_details text,
  fuel_types text[] not null default '{}',
  ticket_status text not null default 'unverified' check (ticket_status in ('unverified','accepted','not_accepted')),
  ticket_program text,
  ticket_valid_until date,
  validation_status text not null default 'draft' check (validation_status in ('draft','verified','suspended')),
  verification_evidence text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  is_active boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ticket_only_fuel check (ticket_status = 'unverified' or kind = 'fuel'),
  constraint ticket_acceptance_requires_proof check (
    ticket_status <> 'accepted' or (
      validation_status = 'verified'
      and nullif(btrim(coalesce(ticket_program,'')),'') is not null
      and ticket_valid_until is not null
      and nullif(btrim(coalesce(verification_evidence,'')),'') is not null
    )
  ),
  constraint verify_requires_evidence check (
    validation_status <> 'verified'
    or nullif(btrim(coalesce(verification_evidence,'')),'') is not null
  )
);

create index if not exists balam_support_status_kind_idx
  on public.balam_route_support_sites(validation_status,is_active,kind);
create index if not exists balam_support_district_idx
  on public.balam_route_support_sites(district_id,municipality_code);

create table if not exists public.balam_route_support_audit (
  event_id bigint generated always as identity primary key,
  site_id uuid not null,
  event_action text not null check(event_action in ('INSERT','UPDATE','DELETE')),
  actor_id uuid,
  occurred_at timestamptz not null default now(),
  record_before jsonb,
  record_after jsonb
);
create index if not exists balam_support_audit_site_idx
  on public.balam_route_support_audit(site_id,occurred_at desc);

create or replace function balam_private.route_support_stamp()
returns trigger language plpgsql security invoker
set search_path = ''
as $f$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  if tg_op='INSERT' then
    new.created_at := now();
    new.created_by := (select auth.uid());
  end if;
  if new.validation_status = 'verified' then
    if tg_op = 'INSERT' or old.validation_status is distinct from new.validation_status
       or old.verification_evidence is distinct from new.verification_evidence
       or old.ticket_program is distinct from new.ticket_program
       or old.ticket_valid_until is distinct from new.ticket_valid_until
       or old.ticket_status is distinct from new.ticket_status then
      new.verified_at := now();
      new.verified_by := (select auth.uid());
    end if;
  else
    new.verified_at := null;
    new.verified_by := null;
    if new.ticket_status = 'accepted' then
      raise exception 'Una aceptación de ticket requiere ficha verificada';
    end if;
  end if;
  return new;
end;
$f$;

create or replace function balam_private.route_support_log()
returns trigger language plpgsql security definer
set search_path = ''
as $f$
begin
  insert into public.balam_route_support_audit
    (site_id,event_action,actor_id,record_before,record_after)
  values (
    case when tg_op = 'DELETE' then old.site_id else new.site_id end,
    tg_op, (select auth.uid()),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return null;
end;
$f$;
revoke all on function balam_private.route_support_log() from public,anon,authenticated;
revoke all on function balam_private.route_support_stamp() from public,anon,authenticated;

drop trigger if exists balam_support_stamp_trg on public.balam_route_support_sites;
create trigger balam_support_stamp_trg
before insert or update on public.balam_route_support_sites
for each row execute function balam_private.route_support_stamp();

drop trigger if exists balam_support_log_trg on public.balam_route_support_sites;
create trigger balam_support_log_trg
after insert or update or delete on public.balam_route_support_sites
for each row execute function balam_private.route_support_log();

alter table public.balam_route_support_sites enable row level security;
alter table public.balam_route_support_audit enable row level security;
revoke all on public.balam_route_support_sites from anon,authenticated;
revoke all on public.balam_route_support_audit from anon,authenticated;
grant select,insert,update,delete on public.balam_route_support_sites to authenticated;
grant select on public.balam_route_support_audit to authenticated;

create policy balam_support_read on public.balam_route_support_sites
for select to authenticated
using (
  (select balam_private.is_master())
  or (
    (select balam_private.is_member()) and is_active and validation_status='verified'
  )
);
create policy balam_support_insert on public.balam_route_support_sites
for insert to authenticated
with check ((select balam_private.is_master()));
create policy balam_support_update on public.balam_route_support_sites
for update to authenticated
using ((select balam_private.is_master()))
with check ((select balam_private.is_master()));
create policy balam_support_delete on public.balam_route_support_sites
for delete to authenticated
using ((select balam_private.is_master()));

create policy balam_support_audit_master_read on public.balam_route_support_audit
for select to authenticated
using ((select balam_private.is_master()));

comment on table public.balam_route_support_sites is
'Catálogo BALAM de sitios de auxilio con fuente verificable; escritura sólo Administrador Maestro; sin datos preinventados.';
comment on table public.balam_route_support_audit is
'Bitácora histórica de cambios a catálogo de auxilio; sólo lectura del Administrador Maestro.';
