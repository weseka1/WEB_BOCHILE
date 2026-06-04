-- ============================================================================
-- Bochile Web — Esquema Supabase (Postgres)
-- Pegá TODO este archivo en: Supabase → SQL Editor → New query → Run.
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Tabla `properties`
--    Modela el shape de DISPLAY que usa la web (lo que antes vivía en
--    src/data/properties.js como campos derivados ya pasa a columnas reales).
-- ----------------------------------------------------------------------------
create table if not exists public.properties (
  id            text primary key,                 -- id estable (scraper en la migración; generado para nuevas)
  slug          text unique not null,             -- URL pública /propiedad/:slug
  op            text not null default 'sale',     -- 'sale' | 'rent'
  type          text,                             -- tipo interno (casa, departamento…)
  type_label    text,                             -- display (Casa, Departamento…)
  title         text not null,
  description   text,
  price         numeric,                          -- null = "Consultar"
  price_text    text,
  currency      text default 'USD',               -- 'USD' (venta) | 'ARS' (alquiler)
  city          text,
  barrio        text,
  zone          text,
  address       text,
  location      text,
  area          numeric,                          -- m² cubierta
  area_total    numeric,                          -- m² total (si el aviso lo declara)
  beds          integer,
  baths         integer,
  features      jsonb not null default '[]'::jsonb,   -- array de strings
  images        jsonb not null default '[]'::jsonb,   -- array de URLs públicas
  main_image    text,
  videos        jsonb not null default '[]'::jsonb,   -- array {label, src, poster}
  badge         text,
  pozo          boolean not null default false,
  featured      boolean not null default false,   -- aparece en Destacadas
  featured_rank integer,                          -- orden dentro de Destacadas (0 = spotlight)
  exclusive     boolean not null default false,
  published     boolean not null default true,    -- ← "subir/bajar" = togglear esto
  url           text,                             -- link al aviso original (opcional)
  created_by    uuid,                             -- qué usuario (dueño/vendedor) la cargó
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists properties_published_idx on public.properties (published);
create index if not exists properties_op_idx        on public.properties (op);
create index if not exists properties_type_idx      on public.properties (type_label);
create index if not exists properties_featured_idx  on public.properties (featured, featured_rank);

-- updated_at automático en cada UPDATE (nombre específico para no pisar otras funciones del proyecto)
create or replace function public.properties_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.properties_set_updated_at();

-- ----------------------------------------------------------------------------
-- 2) RLS (Row Level Security) — la ÚNICA barrera de seguridad.
--    La anon key es pública; sin estas políticas la tabla quedaría abierta.
-- ----------------------------------------------------------------------------
alter table public.properties enable row level security;

-- Cualquiera (anon + logueado) puede LEER solo las publicadas.
drop policy if exists "public_read_published" on public.properties;
create policy "public_read_published" on public.properties
  for select using (published = true);

-- El equipo logueado puede leer TODO (incluye borradores / bajadas).
drop policy if exists "auth_read_all" on public.properties;
create policy "auth_read_all" on public.properties
  for select to authenticated using (true);

-- Escritura: SOLO logueados.
drop policy if exists "auth_insert" on public.properties;
create policy "auth_insert" on public.properties
  for insert to authenticated with check (true);

drop policy if exists "auth_update" on public.properties;
create policy "auth_update" on public.properties
  for update to authenticated using (true) with check (true);

drop policy if exists "auth_delete" on public.properties;
create policy "auth_delete" on public.properties
  for delete to authenticated using (true);

-- ----------------------------------------------------------------------------
-- 3) Storage — bucket público para MEDIA de propiedades (fotos Y videos).
--    El equipo sube acá tanto imágenes como recorridos en video.
--    OJO con el límite de tamaño: por defecto Supabase corta en 50 MB por archivo
--    (Storage → Settings → "Upload file size limit"). Subilo si los videos pesan más.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', true)
on conflict (id) do update set public = true;

-- Lectura pública del bucket.
drop policy if exists "property_media_public_read" on storage.objects;
create policy "property_media_public_read" on storage.objects
  for select using (bucket_id = 'property-media');

-- Subir / actualizar / borrar: solo logueados (dueños / vendedores).
drop policy if exists "property_media_auth_insert" on storage.objects;
create policy "property_media_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'property-media');

drop policy if exists "property_media_auth_update" on storage.objects;
create policy "property_media_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'property-media');

drop policy if exists "property_media_auth_delete" on storage.objects;
create policy "property_media_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'property-media');

-- ============================================================================
-- LISTO. Próximos pasos (consola, una sola vez):
--   • Authentication → Providers → Email: dejá habilitado Email; DESACTIVÁ
--     "Allow new users to sign up" (no queremos registro público).
--   • Authentication → Users → Add user: creá la(s) cuenta(s) del equipo Bochile.
--   • Settings → API: copiá Project URL y la anon key al .env del proyecto.
-- ============================================================================
