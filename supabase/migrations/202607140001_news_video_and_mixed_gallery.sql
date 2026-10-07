alter table if exists public.news
  add column if not exists video_url text;

alter table if exists public.gallery_photos
  add column if not exists event_name text;
