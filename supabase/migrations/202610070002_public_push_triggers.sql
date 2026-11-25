-- Llama a la Edge Function notify-public-content cuando se publica una noticia o un evento.
-- La URL de la funcion y el secreto se leen de Supabase Vault (no se guardan en el codigo):
--   select vault.create_secret('https://<proyecto>.supabase.co/functions/v1/notify-public-content', 'push_function_url');
--   select vault.create_secret('<mismo valor que PUSH_WEBHOOK_SECRET>', 'push_webhook_secret');
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_public_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'push_function_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_webhook_secret';

  if v_url is null or v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    body := jsonb_build_object(
      'type', tg_op,
      'table', tg_table_name,
      'record', to_jsonb(new),
      'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) else null end
    )
  );

  return new;
exception when others then
  -- Una falla al notificar nunca debe impedir guardar la noticia o el evento.
  raise warning 'notify_public_content: %', sqlerrm;
  return new;
end;
$$;

revoke all on function public.notify_public_content() from public, anon, authenticated;

drop trigger if exists notify_public_news on public.news;
create trigger notify_public_news
  after insert on public.news
  for each row execute function public.notify_public_content();

drop trigger if exists notify_public_events on public.events;
create trigger notify_public_events
  after insert or update of status on public.events
  for each row execute function public.notify_public_content();
