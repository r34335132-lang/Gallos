-- 1) Rol "entrenador" para pasar asistencia por sede.
--    users.role puede ser un enum o un text con CHECK; se cubren ambos casos.
do $$
declare
  v_type_oid oid;
  v_typtype "char";
  v_had_check boolean := false;
  v_roles text[];
  r record;
begin
  select a.atttypid, t.typtype
    into v_type_oid, v_typtype
  from pg_attribute a
  join pg_type t on t.oid = a.atttypid
  where a.attrelid = 'public.users'::regclass
    and a.attname = 'role'
    and not a.attisdropped;

  if v_typtype = 'e' then
    execute format('alter type %s add value if not exists %L', v_type_oid::regtype, 'entrenador');
  end if;

  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.users'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.users drop constraint %I', r.conname);
    v_had_check := true;
  end loop;

  if v_had_check then
    select array_agg(distinct role_name order by role_name)
      into v_roles
    from (
      select unnest(array['admin', 'capturista', 'validador', 'comunicacion', 'entrenador', 'tutor', 'patrocinador', 'visitante']) as role_name
      union
      select u.role::text from public.users u where u.role is not null
    ) roles;

    execute format('alter table public.users add constraint users_role_check check (role::text = any (%L::text[]))', v_roles);
  end if;
end $$;

-- 2) Asistencia por sede.
alter table if exists public.attendance_records
  add column if not exists sede text;

create index if not exists attendance_records_sede_date_idx
  on public.attendance_records (sede, attendance_date desc);

drop policy if exists "internal_staff_can_manage_attendance" on public.attendance_records;
create policy "internal_staff_can_manage_attendance"
  on public.attendance_records
  for all
  to authenticated
  using (public.current_app_role() in ('admin', 'capturista', 'validador', 'comunicacion', 'entrenador'))
  with check (public.current_app_role() in ('admin', 'capturista', 'validador', 'comunicacion', 'entrenador'));

-- Los entrenadores solo ven nombre, folio y foto de los alumnos de una sede;
-- no tienen acceso directo a la tabla de beneficiarios (CURP, tutor, etc.).
create or replace function public.attendance_roster(p_sede text)
returns table (id uuid, name text, folio text, photo_url text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if coalesce(public.current_app_role(), '') not in ('admin', 'capturista', 'validador', 'entrenador') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
    select b.id, b.name::text, b.folio::text, b.photo_url::text
    from public.beneficiaries b
    where lower(trim(coalesce(b.municipality::text, ''))) = lower(trim(coalesce(p_sede, '')))
      and coalesce(b.status::text, '') not in ('rechazado', 'inactivo')
    order by b.name;
end;
$$;

revoke all on function public.attendance_roster(text) from public, anon;
grant execute on function public.attendance_roster(text) to authenticated;

-- 3) Permisos para editar y borrar desde el panel (antes solo existia "insert",
--    por eso editar un album podia duplicar fotos sin avisar).
drop policy if exists "communication_can_update_gallery_photos" on public.gallery_photos;
create policy "communication_can_update_gallery_photos"
  on public.gallery_photos
  for update
  to authenticated
  using (public.current_app_role() in ('admin', 'comunicacion'))
  with check (public.current_app_role() in ('admin', 'comunicacion'));

drop policy if exists "communication_can_delete_gallery_photos" on public.gallery_photos;
create policy "communication_can_delete_gallery_photos"
  on public.gallery_photos
  for delete
  to authenticated
  using (public.current_app_role() in ('admin', 'comunicacion'));

drop policy if exists "communication_can_update_news" on public.news;
create policy "communication_can_update_news"
  on public.news
  for update
  to authenticated
  using (public.current_app_role() in ('admin', 'comunicacion'))
  with check (public.current_app_role() in ('admin', 'comunicacion'));

-- 4) Patrocinadores: el panel los administra y el publico los puede ver.
alter table if exists public.sponsors enable row level security;

drop policy if exists "public_can_read_sponsors" on public.sponsors;
create policy "public_can_read_sponsors"
  on public.sponsors
  for select
  to anon, authenticated
  using (true);

drop policy if exists "communication_can_manage_sponsors" on public.sponsors;
create policy "communication_can_manage_sponsors"
  on public.sponsors
  for all
  to authenticated
  using (public.current_app_role() in ('admin', 'comunicacion'))
  with check (public.current_app_role() in ('admin', 'comunicacion'));

-- 5) Ajustes publicos editables desde el panel (link de Moni).
drop policy if exists "communication_can_manage_site_settings" on public.site_settings;
create policy "communication_can_manage_site_settings"
  on public.site_settings
  for all
  to authenticated
  using (public.current_app_role() in ('admin', 'comunicacion'))
  with check (public.current_app_role() in ('admin', 'comunicacion'));

insert into public.site_settings (key, value, description, is_public)
values ('moni_url', 'https://moni-landing-fawn.vercel.app', 'Link para descargar Moni', true)
on conflict (key) do nothing;

-- 6) El nombre del album vive en event_name; las fotos antiguas solo tenian title.
update public.gallery_photos
set event_name = title
where event_name is null and title is not null;
