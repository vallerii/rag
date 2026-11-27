-- ─────────────────────────────────────────────────────────────────────────────
-- Анализ компании без менеджера (ТЗ docs/lead-flow.md, версия 2 от 25.11.2026).
--
-- Выполнять в Supabase → SQL Editor ПОСЛЕ schema.sql, admin.sql, project.sql, flow.sql, addendum.sql.
-- Повторный запуск безопасен. После повторного запуска schema.sql этот файл нужно выполнить снова
-- (schema.sql пересоздаёт правило вставки проверки без новых полей).
--
-- Что делает:
--   1) удаляет старую копию лидов: таблицы prospects и staff_settings, функции prospect_prefill,
--      prospect_responded, prospect_place (коды писем ?c=). Лиды живут только в Google-таблицах.
--   2) добавляет в checks поля анализа:
--        analysis_status  lookup      — проверка создана, RAG ищет готовый анализ (другая проверка, таблица лидов)
--                         pending     — готового анализа нет, ждёт Grok / ручной анализ
--                         in_progress — Grok взял (дольше 2 часов → обратно pending, release_stale_analyses)
--                         done        — анализ есть
--                         none        — анализ не нужен (старт с нуля) и все проверки, созданные до этого файла
--        analysis_source  check | sheet | grok | manual — откуда анализ
--        analysis         jsonb: скопированная строка таблицы + откуда она (или ответ Grok)
--        analysis_at, analysis_taken_at, analysis_tried_at, analysis_error, reviewed_at, reviewed_by
--      Клиент эти поля не может ни задать при создании, ни изменить (на них нет прав на изменение).
--   3) lead_sheets — подключённые вкладки Google-таблиц лидов (только команда).
--   4) company_keys — ключи компании (cid карточки Google, домен, телефон, название + индекс) для поиска
--      готового анализа; check_analysis_private — полная строка таблицы, откуда она и дубли (только команда).
--      Клиенту в checks.analysis попадают только колонки анализа: без Belege, заметок, контактов лида.
--   5) publish_system_report — система публикует отчёт из готового анализа (без менеджера), версия в check_reports,
--      без письма «Ihr Bericht ist fertig» (клиент видит отчёт сразу; см. notify.sql → rag.silent).
--   6) publish_partial_report — готового анализа нет: клиент сразу видит отчёт автопроверки (Places, сайт, PageSpeed)
--      с пометкой partial; полный анализ (Grok / вручную) потом заменяет его новой версией.
--   7) mark_analysis_reviewed — выборочная проверка менеджером (отметка «проверено»).
--   8) grok_mcp_log — журнал всех вызовов MCP-сервера для Grok (Edge Function grok-mcp), только команда.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Старая копия лидов больше не нужна
drop trigger if exists checks_prospect_prefill on public.checks;
drop trigger if exists checks_prospect_responded on public.checks;
drop function if exists public.prospect_prefill();
drop function if exists public.prospect_responded();
drop function if exists public.prospect_place(text);
do $$ begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'prospects') then
    alter publication supabase_realtime drop table public.prospects;
  end if;
end $$;
drop table if exists public.prospects;
drop table if exists public.staff_settings;

-- 2) Поля анализа в checks
alter table public.checks add column if not exists analysis_status   text;
alter table public.checks add column if not exists analysis_source   text;
alter table public.checks add column if not exists analysis          jsonb;
alter table public.checks add column if not exists analysis_at       timestamptz;  -- дата самого анализа (из таблицы — «Datum der Prüfung»)
alter table public.checks add column if not exists analysis_taken_at timestamptz;  -- когда Grok взял в работу
alter table public.checks add column if not exists analysis_tried_at timestamptz;  -- последняя попытка найти готовый анализ
alter table public.checks add column if not exists analysis_error    text;         -- почему поиск не удался (например, Google не ответил)
alter table public.checks add column if not exists reviewed_at       timestamptz;  -- выборочная проверка менеджером (ничего не блокирует)
alter table public.checks add column if not exists reviewed_by       uuid references auth.users (id) on delete set null;
alter table public.checks add column if not exists company_keys      text[] not null default '{}'; -- заполняет сервер (analysis-lookup)

-- Проверки, созданные до этого файла, живут по-старому (отчёт публикует команда).
update public.checks set analysis_status = 'none' where analysis_status is null;
alter table public.checks alter column analysis_status set default 'lookup';
alter table public.checks alter column analysis_status set not null;

alter table public.checks drop constraint if exists checks_analysis_status_chk;
alter table public.checks add constraint checks_analysis_status_chk
  check (analysis_status in ('lookup', 'pending', 'in_progress', 'done', 'none'));
alter table public.checks drop constraint if exists checks_analysis_source_chk;
alter table public.checks add constraint checks_analysis_source_chk
  check (analysis_source is null or analysis_source in ('check', 'sheet', 'grok', 'manual'));
-- Готовый анализ всегда знает, откуда он
alter table public.checks drop constraint if exists checks_analysis_done_chk;
alter table public.checks add constraint checks_analysis_done_chk
  check (analysis_status <> 'done' or (analysis is not null and analysis_source is not null));

create index if not exists checks_analysis_open_idx on public.checks (analysis_status, created_at)
  where analysis_status in ('lookup', 'pending', 'in_progress');

-- Старт с нуля («ничего нет»): анализировать нечего
create or replace function public.checks_analysis_init() returns trigger
language plpgsql as $$
begin
  if coalesce(new.scratch, false) then new.analysis_status := 'none'; end if;
  return new;
end $$;
drop trigger if exists checks_analysis_init on public.checks;
create trigger checks_analysis_init before insert on public.checks
for each row execute function public.checks_analysis_init();

-- Клиент создаёт проверку только без анализа (как раньше — без отчёта и автопроверки).
-- Заменяет правило из schema.sql.
drop policy if exists "checks: eigene anlegen" on public.checks;
create policy "checks: eigene anlegen" on public.checks
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'submitted' and report is null
              and report_draft is null and audit is null
              and analysis is null and analysis_source is null and analysis_status in ('lookup', 'none')
              and analysis_at is null and analysis_taken_at is null and reviewed_at is null and reviewed_by is null
              and company_keys = '{}'::text[]);

-- Зависшие «у Grok» дольше 2 часов → снова ждут. Вызывает сервер (позже — по расписанию).
create or replace function public.release_stale_analyses() returns integer
language sql security definer set search_path = public as $$
  with x as (
    update checks set analysis_status = 'pending', analysis_taken_at = null
     where analysis_status = 'in_progress' and analysis_taken_at < now() - interval '2 hours'
    returning 1)
  select count(*)::int from x
$$;
revoke all on function public.release_stale_analyses() from public, anon, authenticated;
grant execute on function public.release_stale_analyses() to service_role;

-- 3) Подключённые вкладки Google-таблиц лидов
create table if not exists public.lead_sheets (
  id             uuid primary key default gen_random_uuid(),
  spreadsheet_id text not null check (spreadsheet_id ~ '^[A-Za-z0-9_-]{20,100}$'),
  gid            bigint not null check (gid >= 0),
  url            text not null check (url ~ '^https://docs\.google\.com/spreadsheets/'),
  title          text,                              -- название таблицы (заполняет сервер при чтении)
  tab_title      text,                              -- название вкладки
  active         boolean not null default true,     -- выключенная вкладка не участвует в поиске
  row_count      integer,
  last_read_at   timestamptz,
  last_error     text,                              -- например «нет доступа — расшарьте на сервисный аккаунт»
  created_at     timestamptz not null default now(),
  created_by     uuid default auth.uid() references auth.users (id) on delete set null,
  unique (spreadsheet_id, gid)
);
alter table public.lead_sheets enable row level security;
revoke all on public.lead_sheets from anon, authenticated;
grant select, insert, update, delete on public.lead_sheets to authenticated;
grant all on public.lead_sheets to service_role;
drop policy if exists "lead_sheets: Team" on public.lead_sheets;
create policy "lead_sheets: Team" on public.lead_sheets
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- 4) Ключи компании и закрытая часть анализа
create index if not exists checks_company_keys_idx on public.checks using gin (company_keys);

create table if not exists public.check_analysis_private (
  check_id      uuid primary key references public.checks (id) on delete cascade,
  source        text not null check (source in ('check', 'sheet', 'grok', 'manual')),
  lead_sheet_id uuid references public.lead_sheets (id) on delete set null,
  sheet         jsonb,                              -- { spreadsheet_id, gid, title, tab_title } на момент копирования
  row_number    integer,                            -- номер строки в таблице
  matched_by    text check (matched_by in ('place', 'cid', 'web', 'tel', 'name')),
  row           jsonb,                              -- строка целиком, вместе с Belege
  duplicates    jsonb not null default '[]'::jsonb, -- та же компания в других строках: [{ sheet, tab, row_number, by }]
  from_check    uuid references public.checks (id) on delete set null, -- анализ взят у другой проверки
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists check_analysis_private_dups_idx on public.check_analysis_private (created_at desc)
  where duplicates <> '[]'::jsonb;
alter table public.check_analysis_private enable row level security;
revoke all on public.check_analysis_private from anon, authenticated;
grant select on public.check_analysis_private to authenticated;
grant all on public.check_analysis_private to service_role;
drop policy if exists "check_analysis_private: Team" on public.check_analysis_private;
create policy "check_analysis_private: Team" on public.check_analysis_private
  for select to authenticated using (public.is_staff());
drop trigger if exists check_analysis_private_touch on public.check_analysis_private;
create trigger check_analysis_private_touch before update on public.check_analysis_private
for each row execute function public.touch_updated_at();

-- 5) Отчёт из готового анализа публикует система.
-- p_notify = true (анализ Grok / вручную) или заменён частичный отчёт → событие analysis_ready →
-- письмо клиенту «Ihre vollständige Analyse ist fertig» (notify). Без этого — тихо (клиент видит отчёт сразу).
drop function if exists public.publish_system_report(uuid, jsonb);
create or replace function public.publish_system_report(p_check uuid, p_report jsonb, p_notify boolean default false) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean; was_partial boolean; c checks;
begin
  if p_report is null or jsonb_typeof(p_report -> 'channels') is distinct from 'object' then raise exception 'bad_report'; end if;
  select coalesce((report ->> 'partial')::boolean, false) into was_partial from checks where id = p_check;
  perform set_config('rag.silent', 'on', true);
  -- Заменяет и частичный отчёт автопроверки (partial), но не опубликованный командой полный отчёт.
  update checks set report = p_report, status = 'ready'
   where id = p_check and analysis_status = 'done'
     and (status <> 'ready' or coalesce((report ->> 'partial')::boolean, false))
  returning * into c;
  ok := found;
  if ok then
    insert into check_reports (check_id, user_id, report, created_by) values (c.id, c.user_id, p_report, null);
  end if;
  perform set_config('rag.silent', 'off', true);
  if ok and (p_notify or coalesce(was_partial, false)) then
    insert into activity (client_key, kind, detail)
    values ('user:' || c.user_id, 'analysis_ready', jsonb_build_object('req', 'check:' || c.id, 'name', c.place ->> 'name', 'source', c.analysis_source));
  end if;
  return ok;
end $$;
revoke all on function public.publish_system_report(uuid, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.publish_system_report(uuid, jsonb, boolean) to service_role;

-- 6) Частичный отчёт автопроверки, пока полный анализ ждёт Grok / ручную проверку
create or replace function public.publish_partial_report(p_check uuid, p_report jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if p_report is null or jsonb_typeof(p_report -> 'channels') is distinct from 'object' then raise exception 'bad_report'; end if;
  perform set_config('rag.silent', 'on', true);
  update checks set report = p_report || '{"partial": true}'::jsonb, status = 'ready'
   where id = p_check and status <> 'ready' and analysis_status in ('lookup', 'pending', 'in_progress');
  ok := found;
  if ok then
    insert into check_reports (check_id, user_id, report, created_by)
    select id, user_id, report, null from checks where id = p_check;
  end if;
  perform set_config('rag.silent', 'off', true);
  return ok;
end $$;
revoke all on function public.publish_partial_report(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.publish_partial_report(uuid, jsonb) to service_role;

-- 7) Выборочная проверка менеджером: «проверено» (ничего не блокирует, отчёт уже у клиента)
create or replace function public.mark_analysis_reviewed(p_check uuid, p_reviewed boolean default true) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  update checks set reviewed_at = case when p_reviewed then now() end, reviewed_by = case when p_reviewed then auth.uid() end
   where id = p_check and analysis_status = 'done';
end $$;
revoke all on function public.mark_analysis_reviewed(uuid, boolean) from public, anon;
grant execute on function public.mark_analysis_reviewed(uuid, boolean) to authenticated;

-- 8) Журнал вызовов MCP-сервера для Grok
create table if not exists public.grok_mcp_log (
  id         uuid primary key default gen_random_uuid(),
  tool       text not null,
  ok         boolean not null,
  detail     text,
  check_id   uuid references public.checks (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists grok_mcp_log_recent_idx on public.grok_mcp_log (created_at desc);
alter table public.grok_mcp_log enable row level security;
revoke all on public.grok_mcp_log from anon, authenticated;
grant select on public.grok_mcp_log to authenticated;
grant all on public.grok_mcp_log to service_role;
drop policy if exists "grok_mcp_log: Team" on public.grok_mcp_log;
create policy "grok_mcp_log: Team" on public.grok_mcp_log for select to authenticated using (public.is_staff());

notify pgrst, 'reload schema';
