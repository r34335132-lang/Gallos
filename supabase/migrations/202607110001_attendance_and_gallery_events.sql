create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  event_name text,
  attendance_date date not null default current_date,
  status text not null default 'asistio' check (status in ('asistio', 'no_asistio', 'justificado')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.attendance_records enable row level security;

drop policy if exists "internal_staff_can_manage_attendance" on public.attendance_records;
create policy "internal_staff_can_manage_attendance"
  on public.attendance_records
  for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'capturista', 'validador', 'comunicacion')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'capturista', 'validador', 'comunicacion')
    )
  );

drop policy if exists "tutors_can_read_own_beneficiary_attendance" on public.attendance_records;
create policy "tutors_can_read_own_beneficiary_attendance"
  on public.attendance_records
  for select
  using (
    exists (
      select 1
      from public.beneficiaries b
      where b.id = attendance_records.beneficiary_id
        and b.tutor_id = auth.uid()
    )
  );

alter table if exists public.gallery_photos
  add column if not exists album_id uuid references public.gallery_albums(id) on delete set null,
  add column if not exists event_id uuid references public.events(id) on delete set null,
  add column if not exists event_name text;

create index if not exists attendance_records_beneficiary_date_idx
  on public.attendance_records (beneficiary_id, attendance_date desc);

create index if not exists gallery_photos_event_name_idx
  on public.gallery_photos (event_name);
