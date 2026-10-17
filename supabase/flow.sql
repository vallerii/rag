-- Новые пути клиента (октябрь 2026): пакет и квиз → регистрация → данные компании в кабинете,
-- отказ, «Что мы делаем» (план + новости), ежемесячное напоминание об отчёте.
-- Выполнить один раз в Supabase → SQL Editor. Повторный запуск безопасен.

-- 1) Компания, заведённая вручную в кабинете
alter table public.checks add column if not exists wish jsonb;          -- выбранный на /preise пакет (позиции заказа)
alter table public.checks add column if not exists quiz jsonb;          -- ответы квиза
alter table public.checks add column if not exists profile_hint text;   -- «есть Google-профиль?»: yes / no / unknown
alter table public.checks add column if not exists scratch boolean not null default false; -- «ничего нет» → старт с нуля, без анализа
alter table public.orders add column if not exists merged_into uuid references public.checks (id) on delete set null;
alter table public.leads  add column if not exists merged_into uuid references public.checks (id) on delete set null;

-- Квиз-лиды теперь создаются только после регистрации — клиент читает свой последний открытый квиз.
create or replace function public.my_quiz() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', id, 'answers', answers)
  from leads where user_id = auth.uid() and merged_into is null
  order by created_at desc limit 1
$$;
revoke execute on function public.my_quiz() from public, anon;
grant execute on function public.my_quiz() to authenticated;

-- Пакет и квиз переходят в карточку компании: в админке одна заявка вместо двух-трёх.
create or replace function public.attach_requests(p_check uuid, p_order uuid default null) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c checks; o orders; l leads;
begin
  select * into c from checks where id = p_check and user_id = uid;
  if not found then raise exception 'not_found'; end if;
  perform set_config('rag.system', 'on', true);   -- Verantwortlichen übernehmen darf nur das System
  if p_order is not null then
    select * into o from orders where id = p_order and user_id = uid and merged_into is null;
    if found then
      update checks set wish = o.items, assignee_id = coalesce(checks.assignee_id, o.assignee_id) where id = c.id;
      update orders set merged_into = c.id where id = o.id;
      if not exists (select 1 from offers where request_kind = 'check' and request_id = c.id) then
        update offers set request_kind = 'check', request_id = c.id where request_kind = 'order' and request_id = o.id;
        update projects set request_kind = 'check', request_id = c.id where request_kind = 'order' and request_id = o.id;
      end if;
    end if;
  end if;
  select * into l from leads where user_id = uid and merged_into is null order by created_at desc limit 1;
  if found then
    update checks set quiz = l.answers, assignee_id = coalesce(checks.assignee_id, l.assignee_id) where id = c.id;
    update leads set merged_into = c.id where id = l.id;
    if not exists (select 1 from offers where request_kind = 'check' and request_id = c.id) then
      update offers set request_kind = 'check', request_id = c.id where request_kind = 'lead' and request_id = l.id;
      update projects set request_kind = 'check', request_id = c.id where request_kind = 'lead' and request_id = l.id;
    end if;
  end if;
  perform set_config('rag.system', 'off', true);
end $$;
revoke execute on function public.attach_requests(uuid, uuid) from public, anon;
grant execute on function public.attach_requests(uuid, uuid) to authenticated;

-- 2) «Что мы делаем»: план работ и новости (видит клиент), ежемесячный отчёт
alter table public.projects add column if not exists plan text check (length(plan) <= 4000);
alter table public.projects add column if not exists updates jsonb not null default '[]'::jsonb;  -- [{ at, text }]
alter table public.projects add column if not exists monthly boolean not null default false;
alter table public.projects add column if not exists next_report_at date;

-- Новая версия отчёта → следующий ежемесячный отчёт через 30 дней.
create or replace function public.monthly_report_reset() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update projects set next_report_at = current_date + 30
  where monthly and request_kind = 'check' and request_id = new.check_id;
  return new;
end $$;
drop trigger if exists check_reports_monthly on public.check_reports;
create trigger check_reports_monthly after insert on public.check_reports for each row execute function public.monthly_report_reset();

-- 3) Анализ сам ищет Google-профиль компании, заведённой вручную (один раз)
alter table public.checks add column if not exists profile_searched_at timestamptz;

-- 4) Приветствия в чате под новые пути
-- «С нуля»: анализа нет — сразу предлагаем время для разговора.
create or replace function public.greet_new_check() returns trigger
language plpgsql security definer set search_path = public as $$
declare first_name text := split_part(coalesce(new.contact ->> 'name', ''), ' ', 1);
        hello text := 'Hallo' || case when first_name <> '' then ' ' || first_name else '' end;
begin
  insert into public.messages (user_id, check_id, author, body) values (
    new.user_id, new.id, 'rag',
    case when coalesce(new.scratch, false)
      then hello || ', danke für Ihre Angaben zu ' || coalesce(new.place ->> 'name', 'Ihrem Unternehmen') ||
           '. Wählen Sie gern direkt einen Termin für das Erstgespräch — Fragen können Sie uns auch hier schreiben.'
      else hello || ', wir haben Ihre Anfrage erhalten und mit dem Check von ' || coalesce(new.place ->> 'name', 'Ihrem Unternehmen') ||
           ' begonnen. Falls wir noch Informationen brauchen, schreiben wir Ihnen hier.'
    end);
  return new;
end $$;

-- Пакет: анкеты больше нет — просим указать компанию (или выбрать уже существующую).
create or replace function public.greet_new_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare names text;
begin
  select string_agg(i ->> 'name', ' + ') into names from jsonb_array_elements(new.items) as i;
  insert into public.messages (user_id, order_id, author, body) values (
    new.user_id, new.id, 'rag',
    'Danke für Ihre Anfrage (' || coalesce(names, 'Paket') || '). Ihre Auswahl ist gespeichert. Tragen Sie in der Übersicht kurz Ihr Unternehmen ein oder wählen Sie es aus — dann geht es weiter.');
  return new;
end $$;

-- 5) Анализ из лида / другой проверки: исправление (вставка проверки по QR падала на правиле доступа)
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
