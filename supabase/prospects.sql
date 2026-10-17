-- Лиды (потенциальные клиенты): компании из Google Таблицы, мини-анализ, письма для печати.
-- Выполнить один раз в Supabase → SQL Editor после admin.sql и admin-live.sql. Повторный запуск безопасен.
-- Видит и меняет только команда (is_staff). Клиент и аноним — только place_id по коду из письма (prospect_place).

create table if not exists public.prospects (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  dedup_key    text not null unique,            -- maps-ссылка / домен сайта / «название|город» — защита от повторов
  name         text not null,
  category     text,
  city         text,
  address      text,
  phone        text,
  website      text,
  maps_url     text,
  query        text,                            -- как ищут такие компании («Heizungsbau Siegen»)
  extra        jsonb not null default '{}'::jsonb, -- остальные колонки строки таблицы
  place_id     text,
  status       text not null default 'new' check (status in ('new','checking','checked','error','printed','responded','hidden')),
  error        text,
  audit        jsonb,                           -- сырые данные (как checks.audit)
  report_draft jsonb,                           -- автоматический отчёт (как checks.report_draft)
  score        int,
  issues       jsonb not null default '[]'::jsonb, -- главные проблемы (тексты для письма, нем.)
  audited_at   timestamptz,
  printed_at   timestamptz,
  responded_at timestamptz,
  check_id     uuid references public.checks (id) on delete set null,
  code         text unique default upper(substr(md5(gen_random_uuid()::text), 1, 6))  -- код в письме: /check?c=CODE
);
create index if not exists prospects_place_id on public.prospects (place_id);
create index if not exists prospects_status on public.prospects (status);

alter table public.prospects enable row level security;
revoke all on public.prospects from anon, authenticated;
grant select, insert, update, delete on public.prospects to authenticated;
drop policy if exists "prospects: Team" on public.prospects;
create policy "prospects: Team" on public.prospects for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Настройки команды (ссылка на CSV таблицы лидов и т. п.)
create table if not exists public.staff_settings (key text primary key, value text, updated_at timestamptz not null default now());
alter table public.staff_settings enable row level security;
revoke all on public.staff_settings from anon, authenticated;
grant select, insert, update on public.staff_settings to authenticated;
drop policy if exists "staff_settings: Team" on public.staff_settings;
create policy "staff_settings: Team" on public.staff_settings for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Код из письма → Google place_id (для формы «Проверить компанию»). Больше ничего наружу не отдаём.
create or replace function public.prospect_place(p_code text) returns text
language sql stable security definer set search_path = public as $$
  select place_id from prospects where code = upper(trim(p_code)) and place_id is not null and status <> 'hidden' limit 1
$$;
revoke all on function public.prospect_place(text) from public;
grant execute on function public.prospect_place(text) to anon, authenticated;

-- Владелец сам пришёл на сайт и начал проверку → лид «откликнулся», связываем с заявкой.
create or replace function public.prospect_responded() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.place_id is not null then
    update prospects set status = 'responded', responded_at = coalesce(responded_at, now()), check_id = coalesce(check_id, new.id)
     where place_id = new.place_id and status <> 'responded';
  end if;
  return new;
end $$;
drop trigger if exists checks_prospect_responded on public.checks;
create trigger checks_prospect_responded after insert on public.checks for each row execute function public.prospect_responded();

-- Компания уже проверена (как лид или для другого клиента, анализ не старше 30 дней) → новая проверка
-- сразу получает этот анализ и запросы: без повторных платных запросов к Google, черновик сразу готов.
-- AFTER INSERT + UPDATE (а не BEFORE): иначе правило «клиент создаёт проверку без анализа» отклоняет вставку.
create or replace function public.prospect_prefill() returns trigger
language plpgsql security definer set search_path = public as $$
declare pr prospects; ch checks;
begin
  if new.place_id is null or new.place_id like 'manual:%' or new.audit is not null then return null; end if;
  -- Systemänderung: Schutz «nur das Team ändert checklist/status» hier nicht anwenden (siehe guard_staff_fields).
  perform set_config('rag.system', 'on', true);
  select * into pr from prospects
   where place_id = new.place_id and audit is not null and audited_at > now() - interval '30 days'
   order by audited_at desc limit 1;
  if found then
    update checks set
      audit = pr.audit || jsonb_build_object('from_prospect', pr.id),
      report_draft = pr.report_draft, audited_at = pr.audited_at,
      checklist = case when pr.query is not null and coalesce(checklist, '{}'::jsonb) = '{}'::jsonb
                       then jsonb_build_object('keywords', jsonb_build_array(pr.query)) else checklist end
    where id = new.id;
    perform set_config('rag.system', 'off', true);
    return null;
  end if;
  -- Иначе: ту же компанию недавно проверяли для другого клиента — берём её анализ и запросы.
  select * into ch from checks c
   where c.place_id = new.place_id and c.id <> new.id and c.audit is not null and c.audited_at > now() - interval '30 days'
   order by c.audited_at desc limit 1;
  if found then
    update checks set
      audit = (ch.audit - 'from_prospect') || jsonb_build_object('from_check', ch.id),
      report_draft = ch.report_draft, audited_at = ch.audited_at,
      checklist = case when ch.checklist ? 'keywords' and coalesce(checklist, '{}'::jsonb) = '{}'::jsonb
                       then jsonb_build_object('keywords', ch.checklist -> 'keywords') else checklist end
    where id = new.id;
  end if;
  perform set_config('rag.system', 'off', true);
  return null;
end $$;
drop trigger if exists checks_prospect_prefill on public.checks;
create trigger checks_prospect_prefill after insert on public.checks for each row execute function public.prospect_prefill();

-- Живое обновление списка лидов
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'prospects') then
    alter publication supabase_realtime add table public.prospects;
  end if;
end $$;

notify pgrst, 'reload schema';
