-- E-Mail-Benachrichtigungen über Brevo (14.10.2026).
-- Jeder neue Eintrag in public.activity (neue Anfrage, Nachricht, Bericht fertig, Angebot, Termin, Projektstatus …)
-- ruft die Edge Function «notify» auf. Sie entscheidet, wer eine E-Mail bekommt, und verschickt sie über Brevo.
-- Neue Anfragen ohne Ansprechpartner gehen an alle Admins und Manager; TEAM_EMAIL ist nur die Reserve.
-- Die eigentliche Aktion wird nie blockiert: Fehler beim Aufruf werden ignoriert, die Function protokolliert in notify_log.
--
-- Einrichtung (einmalig):
-- 1) Brevo: Absender ist vorerst tools@agenturro.co (in Brevo bereits bestätigt). Sobald RAG eine eigene Domain hat,
--    diese in Brevo authentifizieren (DKIM, SPF, DMARC) und MAIL_FROM_EMAIL / SITE_URL umstellen.
-- 2) Secrets der Function setzen:
--      npx supabase secrets set --project-ref bmajnndqvpemerecvjfz \
--        BREVO_API_KEY=xkeysib-... \
--        NOTIFY_SECRET=<langer Zufallswert> \
--        TEAM_EMAIL=tools@agenturro.co \
--        MAIL_FROM_EMAIL=tools@agenturro.co MAIL_FROM_NAME="RAG" \
--        SITE_URL=https://rag-theta-one.vercel.app
-- 3) Function deployen:   npx supabase functions deploy notify --project-ref bmajnndqvpemerecvjfz
-- 4) Im SQL Editor die Adresse und denselben NOTIFY_SECRET im Vault ablegen (nicht im Repo!):
--      select vault.create_secret('https://bmajnndqvpemerecvjfz.supabase.co/functions/v1/notify', 'notify_url');
--      select vault.create_secret('<derselbe Zufallswert wie NOTIFY_SECRET>', 'notify_secret');
-- 5) Diese Datei im SQL Editor ausführen (wiederholbar).
-- Abschalten: drop trigger activity_notify on public.activity;

create extension if not exists pg_net with schema extensions;

-- Protokoll: was verschickt wurde (auch für die Pause zwischen Chat-Benachrichtigungen)
create table if not exists public.notify_log (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid,
  recipient   text not null,
  kind        text not null,
  client_key  text,
  status      text not null default 'sent' check (status in ('sent', 'skipped', 'error')),
  error       text,
  created_at  timestamptz not null default now()
);
create index if not exists notify_log_recent_idx on public.notify_log (recipient, kind, created_at desc);
alter table public.notify_log enable row level security;
revoke all on public.notify_log from anon, authenticated;
grant select on public.notify_log to authenticated;
drop policy if exists "notify_log: Team" on public.notify_log;
create policy "notify_log: Team" on public.notify_log for select to authenticated using (public.is_staff());

create or replace function public.notify_activity() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_url text; v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'notify_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'notify_secret';
  if v_url is null or v_secret is null then return new; end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('record', to_jsonb(new)),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret),
    timeout_milliseconds := 8000
  );
  return new;
exception when others then
  return new;  -- eine E-Mail darf nie die eigentliche Aktion verhindern
end $$;

drop trigger if exists activity_notify on public.activity;
create trigger activity_notify after insert on public.activity for each row execute function public.notify_activity();
