-- Tokens de notificaciones push de la app publica (sin cuenta).
-- Solo guarda el token de Expo y la plataforma; no se vincula a ninguna persona.
create table if not exists public.public_push_subscriptions (
  token text primary key,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- Sin policies: anon/authenticated no pueden leer ni escribir directamente.
-- El registro pasa por la funcion de abajo y el envio por la Edge Function (service role).
alter table public.public_push_subscriptions enable row level security;

create or replace function public.register_public_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$' then
    raise exception 'invalid push token';
  end if;

  insert into public.public_push_subscriptions (token, platform)
  values (p_token, p_platform)
  on conflict (token) do update
    set platform = excluded.platform,
        last_seen_at = now();
end;
$$;

revoke all on function public.register_public_push_token(text, text) from public;
grant execute on function public.register_public_push_token(text, text) to anon, authenticated;
