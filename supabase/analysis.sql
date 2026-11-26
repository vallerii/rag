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
              and analysis_at is null and analysis_taken_at is null and reviewed_at is null and reviewed_by is null);

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

notify pgrst, 'reload schema';
