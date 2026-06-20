create table if not exists public.news_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  summary text,
  content text,
  image_url text,
  video_url text,
  category text,
  status text not null default 'borrador' check (status in ('borrador', 'publicada', 'archivada')),
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  description text,
  image_url text,
  status text not null default 'publicada' check (status in ('borrador', 'publicada', 'privada', 'archivada')),
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.gallery_albums(id) on delete set null,
  title text not null,
  slug text unique,
  description text,
  type text not null default 'imagen' check (type in ('imagen', 'video')),
  media_url text not null,
  thumbnail_url text,
  storage_path text,
  status text not null default 'publicada' check (status in ('borrador', 'publicada', 'privada', 'archivada')),
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  description text,
  content text,
  image_url text,
  video_url text,
  goal text,
  status text not null default 'activa' check (status in ('activa', 'pausada', 'finalizada', 'publicada', 'borrador', 'archivada')),
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  description text,
  location text,
  event_date timestamptz,
  image_url text,
  video_url text,
  status text not null default 'publicada' check (status in ('borrador', 'publicada', 'archivada', 'activa', 'finalizada')),
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  message text not null,
  status text not null default 'nuevo' check (status in ('nuevo', 'en_revision', 'atendido', 'archivado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  description text,
  is_public boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_categories enable row level security;
alter table public.news_posts enable row level security;
alter table public.gallery_albums enable row level security;
alter table public.gallery_items enable row level security;
alter table public.campaigns enable row level security;
alter table public.events enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;

do $$
begin
  create policy "Public can read news categories" on public.news_categories for select using (true);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public can read published news posts" on public.news_posts for select using (status = 'publicada');
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public can read public gallery items" on public.gallery_items for select using (status = 'publicada');
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public can read public albums" on public.gallery_albums for select using (status = 'publicada');
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public can read active campaigns" on public.campaigns for select using (status in ('activa', 'publicada'));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public can read published events" on public.events for select using (status in ('publicada', 'activa', 'finalizada'));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public can read public settings" on public.site_settings for select using (is_public = true);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Anyone can create contact messages" on public.contact_messages for insert with check (true);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Staff can manage news posts" on public.news_posts for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'comunicacion'))
  ) with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'comunicacion'))
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Staff can manage campaigns" on public.campaigns for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'comunicacion'))
  ) with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'comunicacion'))
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Staff can manage events" on public.events for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'comunicacion'))
  ) with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'comunicacion'))
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Admins can read contact messages" on public.contact_messages for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );
exception when duplicate_object then null;
end $$;

insert into public.news_categories (name, slug, description)
values
  ('Eventos', 'eventos', 'Noticias relacionadas con eventos'),
  ('Campanas', 'campanas', 'Campanas y programas'),
  ('Beneficiarios', 'beneficiarios', 'Historias institucionales de beneficiarios'),
  ('Avisos', 'avisos', 'Avisos oficiales'),
  ('Logros', 'logros', 'Logros e impacto'),
  ('Comunidad', 'comunidad', 'Comunidad Gallos Smiling')
on conflict (slug) do nothing;

insert into public.site_settings (key, value, description)
values
  ('about_story', 'Gallos Smiling utiliza esta plataforma para comunicacion institucional, noticias, eventos, actividades, patrocinadores y seguimiento basico de documentacion.', 'Texto publico de historia'),
  ('mission', 'Impulsar oportunidades, comunidad y bienestar mediante programas institucionales y actividades.', 'Mision publica'),
  ('vision', 'Ser una fundacion cercana, transparente y confiable para familias, aliados y patrocinadores.', 'Vision publica'),
  ('values', 'Transparencia,Cercania,Respeto,Comunidad,Responsabilidad', 'Valores publicos'),
  ('whatsapp_url', 'https://wa.me/524421234567', 'Contacto WhatsApp'),
  ('email', 'contacto@gallossmiling.org', 'Correo publico'),
  ('phone', '+52 442 123 4567', 'Telefono publico'),
  ('service_area', 'Queretaro y zona metropolitana', 'Zona de atencion')
on conflict (key) do nothing;
