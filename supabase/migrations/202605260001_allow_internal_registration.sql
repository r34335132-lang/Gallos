alter table public.beneficiaries enable row level security;
alter table public.documents enable row level security;
alter table public.users enable row level security;
alter table public.news enable row level security;
alter table public.gallery_photos enable row level security;

create or replace function public.current_app_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select u.role::text
  from public.users u
  where u.id = auth.uid()
  limit 1
$$;

grant execute on function public.current_app_role() to authenticated;

drop policy if exists "admins_can_manage_internal_users" on public.users;
create policy "admins_can_manage_internal_users"
  on public.users
  for all
  to authenticated
  using (
    id = auth.uid()
    or public.current_app_role() = 'admin'
  )
  with check (
    id = auth.uid()
    or public.current_app_role() = 'admin'
  );

drop policy if exists "public_can_read_news" on public.news;
create policy "public_can_read_news"
  on public.news
  for select
  to anon, authenticated
  using (true);

drop policy if exists "communication_can_insert_news" on public.news;
create policy "communication_can_insert_news"
  on public.news
  for insert
  to authenticated
  with check (public.current_app_role() in ('admin', 'comunicacion'));

drop policy if exists "public_can_read_gallery_photos" on public.gallery_photos;
create policy "public_can_read_gallery_photos"
  on public.gallery_photos
  for select
  to anon, authenticated
  using (true);

drop policy if exists "communication_can_insert_gallery_photos" on public.gallery_photos;
create policy "communication_can_insert_gallery_photos"
  on public.gallery_photos
  for insert
  to authenticated
  with check (public.current_app_role() in ('admin', 'comunicacion'));

drop policy if exists "internal_staff_can_insert_beneficiaries" on public.beneficiaries;
create policy "internal_staff_can_insert_beneficiaries"
  on public.beneficiaries
  for insert
  to authenticated
  with check (
    tutor_id = auth.uid()
    or public.current_app_role() in ('admin', 'capturista')
  );

drop policy if exists "internal_staff_can_read_beneficiaries" on public.beneficiaries;
create policy "internal_staff_can_read_beneficiaries"
  on public.beneficiaries
  for select
  to authenticated
  using (
    tutor_id = auth.uid()
    or public.current_app_role() in ('admin', 'capturista', 'validador')
  );

drop policy if exists "internal_staff_can_update_beneficiaries" on public.beneficiaries;
create policy "internal_staff_can_update_beneficiaries"
  on public.beneficiaries
  for update
  to authenticated
  using (
    tutor_id = auth.uid()
    or public.current_app_role() in ('admin', 'validador')
  )
  with check (
    tutor_id = auth.uid()
    or public.current_app_role() in ('admin', 'validador')
  );

drop policy if exists "internal_staff_and_tutors_can_insert_documents" on public.documents;
create policy "internal_staff_and_tutors_can_insert_documents"
  on public.documents
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.beneficiaries b
      where b.id = beneficiary_id
        and (
          b.tutor_id = auth.uid()
          or public.current_app_role() in ('admin', 'capturista')
        )
    )
  );

drop policy if exists "internal_staff_and_tutors_can_read_documents" on public.documents;
create policy "internal_staff_and_tutors_can_read_documents"
  on public.documents
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.beneficiaries b
      where b.id = beneficiary_id
        and (
          b.tutor_id = auth.uid()
          or public.current_app_role() in ('admin', 'capturista', 'validador')
        )
    )
  );

drop policy if exists "internal_staff_and_tutors_can_update_documents" on public.documents;
create policy "internal_staff_and_tutors_can_update_documents"
  on public.documents
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.beneficiaries b
      where b.id = beneficiary_id
        and (
          b.tutor_id = auth.uid()
          or public.current_app_role() in ('admin', 'capturista', 'validador')
        )
    )
  )
  with check (
    exists (
      select 1
      from public.beneficiaries b
      where b.id = beneficiary_id
        and (
          b.tutor_id = auth.uid()
          or public.current_app_role() in ('admin', 'capturista', 'validador')
        )
    )
  );
