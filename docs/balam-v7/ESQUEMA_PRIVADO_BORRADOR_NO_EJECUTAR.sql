-- BALAM v7 · DRAFT ONLY · 2026-11-18
-- NO EJECUTAR EN PRODUCCIÓN. No incluye grants de API ni políticas de acceso.
-- Objetivo: esquema privado y RLS habilitado para pruebas de integración.
-- Revisar tablas existentes de BALAM y relaciones con balam_access antes de aplicar.
begin;
create schema if not exists balam_capture;

create table if not exists balam_capture.operativos (
 id uuid primary key default gen_random_uuid(),
 clave text not null unique,
 nombre text not null,
 fecha_inicio date not null,
 fecha_fin date,
 estado text not null default 'borrador' check (estado in ('borrador','activo','cerrado')),
 siesa_version text not null default 'V2401',
 created_at timestamptz not null default now(),
 created_by uuid not null,
 check(fecha_fin is null or fecha_fin>=fecha_inicio)
);

create table if not exists balam_capture.asignaciones (
 id uuid primary key default gen_random_uuid(),
 operativo_id uuid not null references balam_capture.operativos(id),
 distrito text not null check (distrito in ('DS01','DS02','DS03','DS04','DS05','DS06')),
 user_id uuid not null,
 rol text not null check (rol in ('capturista_distrital','supervisor_distrital','admin_estatal','admin_maestro')),
 activo boolean not null default true,
 inicio timestamptz not null default now(),
 fin timestamptz,
 unique(operativo_id,distrito,user_id),
 check(fin is null or fin>=inicio)
);

create table if not exists balam_capture.personas (
 id uuid primary key default gen_random_uuid(),
 -- DATOS PERSONALES: schema privado; acceso sólo mediante API segura específica.
 nombre_completo text not null,
 fecha_nacimiento date,
 sexo_registro text,
 identificador_normalizado text,
 created_at timestamptz not null default now()
);
create index if not exists idx_balam_personas_identificador
 on balam_capture.personas(identificador_normalizado);

create table if not exists balam_capture.participaciones (
 id uuid primary key default gen_random_uuid(),
 operativo_id uuid not null references balam_capture.operativos(id),
 distrito text not null check(distrito in ('DS01','DS02','DS03','DS04','DS05','DS06')),
 persona_id uuid not null references balam_capture.personas(id),
 folio text not null,
 created_by uuid not null,
 created_at timestamptz not null default now(),
 unique(operativo_id,distrito,folio),
 unique(operativo_id,distrito,persona_id)
);

create table if not exists balam_capture.atenciones (
 id uuid primary key default gen_random_uuid(),
 participacion_id uuid not null references balam_capture.participaciones(id),
 fecha_atencion date not null,
 codigo_localidad text,
 metodo_origen text not null check (metodo_origen in ('captura_digital','transcripcion_fisica','importacion_siesa')),
 responsable_id uuid not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists balam_capture.acciones (
 id uuid primary key default gen_random_uuid(),
 atencion_id uuid not null references balam_capture.atenciones(id),
 area text not null,
 codigo_accion text not null,
 cantidad integer not null check(cantidad between 1 and 999999),
 unidad_medida text not null,
 clave_siesa text,
 created_at timestamptz not null default now()
);

create table if not exists balam_capture.lotes_importacion (
 id uuid primary key default gen_random_uuid(),
 operativo_id uuid not null references balam_capture.operativos(id),
 distrito text not null check(distrito in ('DS01','DS02','DS03','DS04','DS05','DS06')),
 sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
 archivo_nombre text not null,
 fuente text not null,
 estado text not null default 'pendiente' check(estado in ('pendiente','validado','rechazado','aplicado')),
 iniciado_por uuid not null,
 creado_at timestamptz not null default now(),
 unique(operativo_id,distrito,sha256)
);

create table if not exists balam_capture.auditoria (
 id uuid primary key default gen_random_uuid(),
 operacion text not null,
 entidad text not null,
 entidad_id uuid not null,
 operativo_id uuid,
 distrito text,
 actor uuid,
 ocurrido_at timestamptz not null default now(),
 resumen jsonb not null default '{}'::jsonb
 -- ATENCIÓN: evitar valores clínicos y datos de identidad en resumen.
);

-- Política segura por defecto. NO existe política permisiva ni grant de Data API.
alter table balam_capture.operativos enable row level security;
alter table balam_capture.asignaciones enable row level security;
alter table balam_capture.personas enable row level security;
alter table balam_capture.participaciones enable row level security;
alter table balam_capture.atenciones enable row level security;
alter table balam_capture.acciones enable row level security;
alter table balam_capture.lotes_importacion enable row level security;
alter table balam_capture.auditoria enable row level security;

revoke all on schema balam_capture from public, anon, authenticated;
revoke all on all tables in schema balam_capture from public, anon, authenticated;
-- No crear funciones SECURITY DEFINER ni exposiciones REST hasta auditar permisos.
commit;
