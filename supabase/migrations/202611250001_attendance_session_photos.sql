-- Foto de evidencia por entrenamiento (una por sede + fecha).
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  sede text not null,
  attendance_date date not null,
  activity text not null default 'Entrenamiento',
  photo_url text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sede, attendance_date)
);

create index if not exists attendance_sessions_sede_date_idx
  on public.attendance_sessions (sede, attendance_date desc);

alter table public.attendance_sessions enable row level security;

drop policy if exists "staff_can_manage_attendance_sessions" on public.attendance_sessions;
create policy "staff_can_manage_attendance_sessions"
  on public.attendance_sessions
  for all
  to authenticated
  using (public.current_app_role() in ('admin', 'capturista', 'validador', 'comunicacion', 'entrenador'))
  with check (public.current_app_role() in ('admin', 'capturista', 'validador', 'comunicacion', 'entrenador'));
