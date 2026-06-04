alter table if exists public.beneficiaries
  add column if not exists carta_responsiva_recibida boolean not null default false,
  add column if not exists certificado_medico_recibido boolean not null default false;

update public.beneficiaries b
set carta_responsiva_recibida = true
where exists (
  select 1
  from public.documents d
  where d.beneficiary_id = b.id
    and lower(coalesce(d.document_type, d.name, '')) like '%responsiva%'
    and d.status::text in ('validado', 'aprobado')
);

update public.beneficiaries b
set certificado_medico_recibido = true
where exists (
  select 1
  from public.documents d
  where d.beneficiary_id = b.id
    and lower(coalesce(d.document_type, d.name, '')) like '%certificado%'
    and d.status::text in ('validado', 'aprobado')
);

delete from public.documents;

alter table if exists public.beneficiaries
  drop column if exists diagnosis,
  drop column if exists medical_diagnosis,
  drop column if exists clinical_history,
  drop column if exists medical_history,
  drop column if exists medical_condition,
  drop column if exists condition,
  drop column if exists clinical_record,
  drop column if exists medical_record,
  drop column if exists medical_notes,
  drop column if exists observations,
  drop column if exists disability_type;

alter table if exists public.gallery_photos
  add column if not exists type text not null default 'imagen',
  add column if not exists media_url text,
  add column if not exists video_url text,
  add column if not exists thumbnail_url text;

update public.gallery_photos
set
  type = coalesce(nullif(type, ''), 'imagen'),
  media_url = coalesce(media_url, image_url)
where media_url is null;

do $$
begin
  if to_regclass('public.gallery_photos') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'gallery_photos_type_check'
        and conrelid = 'public.gallery_photos'::regclass
    )
  then
    alter table public.gallery_photos
      add constraint gallery_photos_type_check check (type in ('imagen', 'video')) not valid;
  end if;
end $$;

alter table if exists public.sponsors
  add column if not exists website text,
  add column if not exists promo_image_url text;
