-- Zeitplan für die Analyse (docs/lead-flow.md), 26.11.2026 — alle 30 Minuten die Edge Function «analysis-cron»:
--   • bei Grok hängengebliebene Analysen (> 2 h) zurück in die Warteschlange,
--   • Prüfungen, bei denen Google Sheets bei der Registrierung nicht geantwortet hat, erneut suchen (nach 24 h → «pending»).
-- Wiederholbar. Setzt analysis.sql voraus.
--
-- Einrichtung (einmalig):
-- 1) Supabase → Integrations → Cron aktivieren (Erweiterung pg_cron) — oder unten «create extension» ausführen lassen.
-- 2) Secret der Function:   npx supabase secrets set --project-ref bmajnndqvpemerecvjfz ANALYSIS_CRON_SECRET=<langer Zufallswert>
-- 3) Function deployen:     npx supabase functions deploy analysis-cron --project-ref bmajnndqvpemerecvjfz
-- 4) Im SQL Editor Adresse und denselben Wert im Vault ablegen (nicht im Repo!):
--      select vault.create_secret('https://bmajnndqvpemerecvjfz.supabase.co/functions/v1/analysis-cron', 'analysis_cron_url');
--      select vault.create_secret('<derselbe Zufallswert wie ANALYSIS_CRON_SECRET>', 'analysis_cron_secret');
-- 5) Diese Datei im SQL Editor ausführen.
-- Abschalten: select cron.unschedule('rag-analysis');

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.analysis_cron_ping() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v_url text; v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'analysis_cron_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'analysis_cron_secret';
  if v_url is null or v_secret is null then return; end if;
  perform net.http_post(
    url := v_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    timeout_milliseconds := 60000
  );
end $$;
revoke all on function public.analysis_cron_ping() from public, anon, authenticated;

do $$ begin
  perform cron.unschedule('rag-analysis') where exists (select 1 from cron.job where jobname = 'rag-analysis');
end $$;
select cron.schedule('rag-analysis', '*/30 * * * *', 'select public.analysis_cron_ping()');
