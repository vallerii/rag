-- ─────────────────────────────────────────────────────────────────────────────
-- Projekt nach dem angenommenen Angebot: Rechnung → Zahlung → Umsetzung → Ergebnis.
-- Dazu: Vertriebsstatus «Bericht gesendet» und automatische Statuswechsel.
-- Ausführen NACH schema.sql und admin.sql (idempotent, kann wiederholt werden).
--
-- Vertrieb (stage, je Anfrage):  new → contacted → report_sent → call_booked → call_done → offer_sent → won | lost
-- Projekt (projects.status, je Angebot = je Unternehmen/Anfrage): awaiting_payment → paid → in_progress → result → support | done
--
-- Automatisch:
--   Bericht veröffentlicht      → Anfrage «Bericht gesendet» (wenn sie noch «Neu»/«Kontaktiert» ist)
--   Angebot gesendet            → DIESE Anfrage «Angebot gesendet»
--   Kunde nimmt Angebot an      → DIESE Anfrage «Kunde» + Projekt «Rechnung offen» wird angelegt
-- Angebot, Rechnung, Projekt gehören zu einer Anfrage (offers.request_kind/request_id), nicht zum ganzen Konto.
--   Projektstatus ändert sich   → Zeitstempel (paid_at, started_at …) + Eintrag im Verlauf
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Neuer Vertriebsstatus report_sent
alter table public.checks drop constraint if exists checks_stage_chk;
alter table public.checks add constraint checks_stage_chk
  check (stage in ('new','contacted','report_sent','call_booked','call_done','offer_sent','won','lost'));
alter table public.orders drop constraint if exists orders_stage_chk;
alter table public.orders add constraint orders_stage_chk
  check (stage in ('new','contacted','report_sent','call_booked','call_done','offer_sent','won','lost'));
alter table public.leads drop constraint if exists leads_stage_check;
alter table public.leads drop constraint if exists leads_stage_chk;
alter table public.leads add constraint leads_stage_chk
  check (stage in ('new','contacted','report_sent','call_booked','call_done','offer_sent','won','lost'));

-- Systemwechsel (aus Funktionen unten) dürfen geschützte Felder ändern, auch wenn der Kunde sie auslöst.
-- Ersetzt die Fassung aus admin.sql — nach jedem erneuten Lauf von admin.sql diese Datei wieder ausführen.
create or replace function public.guard_staff_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Server (Edge Functions mit service_role), SQL Editor, Table Editor: kein auth.uid() → erlaubt
  if auth.uid() is null or public.is_staff() or current_setting('rag.system', true) = 'on' then return new; end if;
  if new.stage is distinct from old.stage or new.next_contact_at is distinct from old.next_contact_at
     or new.status is distinct from old.status or new.assignee_id is distinct from old.assignee_id then
    raise exception 'not allowed';
  end if;
  if tg_table_name = 'checks' then
    if new.report is distinct from old.report or new.checklist is distinct from old.checklist then raise exception 'not allowed'; end if;
  end if;
  return new;
end $$;

-- 2) Bericht veröffentlicht → «Bericht gesendet»
create or replace function public.stage_on_report() returns trigger
language plpgsql as $$
begin
  if new.status = 'ready' and old.status is distinct from 'ready' and new.stage in ('new', 'contacted') then
    new.stage := 'report_sent';
  end if;
  return new;
end $$;
drop trigger if exists checks_stage_on_report on public.checks;
create trigger checks_stage_on_report before update on public.checks for each row execute function public.stage_on_report();

-- Angebot, Rechnung und Projekt gehören zu EINER Anfrage (Unternehmen bzw. Paket-Anfrage), nicht zum ganzen Konto:
-- Ein Kunde kann mehrere Unternehmen haben. Status nur dieser Anfrage heben (nie zurück, nie aus «Absage»).
drop function if exists public.raise_client_stage(text, text);
create or replace function public.raise_request_stage(p_kind text, p_id uuid, p_stage text) returns void
language plpgsql security definer set search_path = public as $$
declare ord text[] := array['new','contacted','report_sent','call_booked','call_done','offer_sent','won'];
begin
  if p_id is null then return; end if;
  perform set_config('rag.system', 'on', true);
  if p_kind = 'check' then
    update checks set stage = p_stage where id = p_id and stage <> 'lost' and array_position(ord, stage) < array_position(ord, p_stage);
  elsif p_kind = 'order' then
    update orders set stage = p_stage where id = p_id and stage <> 'lost' and array_position(ord, stage) < array_position(ord, p_stage);
  elsif p_kind = 'lead' then
    update leads set stage = p_stage where id = p_id and stage <> 'lost' and array_position(ord, stage) < array_position(ord, p_stage);
  end if;
  perform set_config('rag.system', 'off', true);
end $$;
revoke execute on function public.raise_request_stage(text, uuid, text) from public, anon, authenticated;

-- Angebot ↔ Anfrage
alter table public.offers add column if not exists request_kind text check (request_kind in ('check', 'order', 'lead'));
alter table public.offers add column if not exists request_id uuid;
alter table public.offers drop constraint if exists offers_client_key_key;   -- früher: ein Angebot je Kunde
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'offers_request_uq') then
    alter table public.offers add constraint offers_request_uq unique (request_kind, request_id);
  end if;
end $$;
create index if not exists offers_client_idx on public.offers (client_key);

-- 3) Angebot gesendet → «Angebot gesendet»
create or replace function public.stage_on_offer() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'sent' and (tg_op = 'INSERT' or old.status is distinct from 'sent') then
    perform public.raise_request_stage(new.request_kind, new.request_id, 'offer_sent');
  end if;
  return new;
end $$;
drop trigger if exists offers_stage on public.offers;
create trigger offers_stage after insert or update on public.offers for each row execute function public.stage_on_offer();

-- 4) Projekt
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  client_key      text not null,
  user_id         uuid references auth.users (id) on delete cascade,
  offer_id        uuid references public.offers (id) on delete cascade,
  request_kind    text,
  request_id      uuid,
  status          text not null default 'awaiting_payment'
                  check (status in ('awaiting_payment', 'paid', 'in_progress', 'result', 'support', 'done')),
  invoice_number  text check (length(invoice_number) <= 60),
  invoice_amount  numeric(10, 2) check (invoice_amount >= 0),
  invoice_due     date,
  invoice_url     text check (invoice_url is null or invoice_url ~ '^https://'),
  invoice_sent_at timestamptz,
  note            text check (length(note) <= 2000),      -- Hinweis für den Kunden
  paid_at         timestamptz,
  started_at      timestamptz,
  result_at       timestamptz,
  finished_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects (user_id);
-- Ältere Fassung: ein Projekt je Kunde → jetzt ein Projekt je Angebot (= je Anfrage)
alter table public.projects add column if not exists request_kind text;
alter table public.projects add column if not exists request_id uuid;
alter table public.projects drop constraint if exists projects_client_key_key;
-- Projekt verschwindet mit seinem Angebot (z. B. wenn der Kunde das Unternehmen löscht)
alter table public.projects drop constraint if exists projects_offer_id_fkey;
alter table public.projects add constraint projects_offer_id_fkey foreign key (offer_id) references public.offers (id) on delete cascade;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'projects_offer_uq') then
    alter table public.projects add constraint projects_offer_uq unique (offer_id);
  end if;
end $$;
alter table public.projects enable row level security;
revoke all on public.projects from anon;
grant select, insert, update on public.projects to authenticated;
drop policy if exists "projects: Kunde liest" on public.projects;
drop policy if exists "projects: Team" on public.projects;
create policy "projects: Kunde liest" on public.projects for select to authenticated using (user_id = auth.uid());
create policy "projects: Team" on public.projects for all to authenticated using (public.is_staff()) with check (public.is_staff());

create or replace function public.project_touch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'paid'        and new.paid_at     is null then new.paid_at     := now(); end if;
    if new.status = 'in_progress' and new.started_at  is null then new.started_at  := now(); end if;
    if new.status = 'result'      and new.result_at   is null then new.result_at   := now(); end if;
    if new.status in ('support', 'done') and new.finished_at is null then new.finished_at := now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before insert or update on public.projects for each row execute function public.project_touch();

create or replace function public.log_project() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into activity (client_key, kind, detail) values (new.client_key, 'project', jsonb_build_object('status', new.status));
  end if;
  if tg_op = 'UPDATE' and old.invoice_sent_at is null and new.invoice_sent_at is not null then
    insert into activity (client_key, kind, detail) values (new.client_key, 'invoice_sent', jsonb_build_object('number', new.invoice_number, 'amount', new.invoice_amount));
  end if;
  return new;
end $$;
drop trigger if exists projects_log on public.projects;
create trigger projects_log after insert or update on public.projects for each row execute function public.log_project();

-- 5) Angebot annehmen → Anfragen «Kunde» + Projekt «Rechnung offen»
create or replace function public.accept_offer(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o offers;
begin
  select * into o from offers where id = p_id and user_id = auth.uid() and status = 'sent' for update;
  if not found then raise exception 'not_found'; end if;
  update offers set status = 'accepted', updated_at = now() where id = p_id;
  insert into activity (client_key, kind, detail) values (o.client_key, 'offer_accepted',
    jsonb_build_object('req', o.request_kind || ':' || o.request_id, 'name', public.request_name(o.request_kind, o.request_id)));
  insert into projects (client_key, user_id, offer_id, request_kind, request_id)
    values (o.client_key, o.user_id, o.id, o.request_kind, o.request_id)
    on conflict (offer_id) do update set status = case when projects.status = 'done' then 'awaiting_payment' else projects.status end;
  perform public.raise_request_stage(o.request_kind, o.request_id, 'won');
end $$;
revoke execute on function public.accept_offer(uuid) from public, anon;
grant execute on function public.accept_offer(uuid) to authenticated;

-- Bestehende Angebote ohne Anfrage zuordnen (einmalig): bevorzugt das Unternehmen mit veröffentlichtem Bericht,
-- sonst das neueste Unternehmen, sonst die neueste Paket-Anfrage, sonst das Quiz.
update public.offers o set request_kind = x.kind, request_id = x.id
from (
  select o2.id as offer_id,
    coalesce(
      (select 'check' from checks c where c.user_id = o2.user_id limit 1),
      (select 'order' from orders r where r.user_id = o2.user_id limit 1),
      case when o2.client_key like 'lead:%' then 'lead' end) as kind,
    coalesce(
      (select c.id from checks c where c.user_id = o2.user_id order by (c.status = 'ready') desc, c.created_at desc limit 1),
      (select r.id from orders r where r.user_id = o2.user_id order by r.created_at desc limit 1),
      case when o2.client_key like 'lead:%' then substr(o2.client_key, 6)::uuid end) as id
  from public.offers o2 where o2.request_id is null
) x
where o.id = x.offer_id and x.id is not null;
update public.projects p set request_kind = o.request_kind, request_id = o.request_id
from public.offers o where p.offer_id = o.id and p.request_id is null;

-- Erste Fassung hatte «Kunde» auf ALLE Anfragen des Kontos gesetzt. Zurücksetzen, wo kein angenommenes Angebot dazugehört.
-- (Nur Anfragen ohne Angebot, also nichts, was ein Mitarbeiter bewusst so gesetzt hätte, um ein Angebot abzuschließen.)
update public.checks c set stage = case when c.status = 'ready' then 'report_sent' else 'contacted' end
where c.stage = 'won' and not exists (select 1 from offers o where o.request_kind = 'check' and o.request_id = c.id)
  and exists (select 1 from activity a where a.client_key = 'user:' || c.user_id and a.kind = 'offer_accepted');

-- Quiz-Lead wird einem Konto zugeordnet: Angebote/Projekte wandern mit (mehrere je Kunde sind jetzt erlaubt).
create or replace function public.claim_lead(p_lead uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); old_key text := 'lead:' || p_lead; new_key text;
begin
  if uid is null then return; end if;
  new_key := 'user:' || uid;
  update leads set user_id = uid where id = p_lead and user_id is null and created_at > now() - interval '7 days';
  if not found then return; end if;
  update activity set client_key = new_key where client_key = old_key;
  update notes set client_key = new_key where client_key = old_key;
  update appointments set client_key = new_key, user_id = uid where client_key = old_key;
  update offers set client_key = new_key, user_id = uid where client_key = old_key;
  update projects set client_key = new_key, user_id = uid where client_key = old_key;
  insert into activity (client_key, kind) values (new_key, 'lead_claimed');
end $$;
revoke execute on function public.claim_lead(uuid) from public, anon;
grant execute on function public.claim_lead(uuid) to authenticated;

-- Kunde entfernt ein Unternehmen: dessen Angebot und Projekt mit entfernen.
create or replace function public.delete_my_check(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare c checks;
begin
  select * into c from checks where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'not_found'; end if;
  update messages set check_id = null where check_id = p_id;
  delete from offers where request_kind = 'check' and request_id = p_id;   -- Projekt folgt per Cascade
  delete from checks where id = p_id;
  insert into activity (client_key, kind, detail) values ('user:' || c.user_id, 'check_deleted', jsonb_build_object('name', c.place ->> 'name'));
end $$;
revoke execute on function public.delete_my_check(uuid) from public, anon;
grant execute on function public.delete_my_check(uuid) to authenticated;

-- Verlauf: jeder Eintrag einer Anfrage trägt deren Unternehmen (req + name),
-- damit im Verlauf eines Kunden mit mehreren Unternehmen klar ist, worauf er sich bezieht.
create or replace function public.request_name(p_kind text, p_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select case p_kind
    when 'check' then (select place ->> 'name' from checks where id = p_id)
    when 'order' then (select coalesce(details ->> 'company', 'Paket') from orders where id = p_id)
    when 'lead'  then (select coalesce(nullif(answers ->> 'firma', ''), 'Quiz') from leads where id = p_id)
  end
$$;
revoke execute on function public.request_name(text, uuid) from public, anon, authenticated;

create or replace function public.log_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text; req jsonb;
begin
  if tg_table_name = 'leads' then
    k := case when new.user_id is not null then 'user:' || new.user_id else 'lead:' || new.id end;
    req := jsonb_build_object('req', 'lead:' || new.id, 'name', coalesce(nullif(new.answers ->> 'firma', ''), 'Quiz'));
    if tg_op = 'INSERT' then insert into activity (client_key, kind, detail) values (k, 'lead_created', req || jsonb_build_object('from', new.from_page)); end if;
    if tg_op = 'UPDATE' and old.booking_clicked_at is null and new.booking_clicked_at is not null then
      insert into activity (client_key, kind, detail) values (k, 'booking_clicked', req); end if;
  elsif tg_table_name = 'checks' then
    k := 'user:' || new.user_id;
    req := jsonb_build_object('req', 'check:' || new.id, 'name', new.place ->> 'name');
    if tg_op = 'INSERT' then insert into activity (client_key, kind, detail) values (k, 'check_created', req); end if;
    if tg_op = 'UPDATE' and not old.sources_confirmed and new.sources_confirmed then insert into activity (client_key, kind, detail) values (k, 'sources_confirmed', req); end if;
    if tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'ready' then insert into activity (client_key, kind, detail) values (k, 'report_published', req); end if;
  elsif tg_table_name = 'orders' then
    k := 'user:' || new.user_id;
    req := jsonb_build_object('req', 'order:' || new.id, 'name', coalesce(new.details ->> 'company', 'Paket'));
    if tg_op = 'INSERT' then insert into activity (client_key, kind, detail) values (k, 'order_created', req || jsonb_build_object('items', new.items)); end if;
    if tg_op = 'UPDATE' and old.details is null and new.details is not null then insert into activity (client_key, kind, detail) values (k, 'order_details', req); end if;
  elsif tg_table_name = 'messages' then
    insert into activity (client_key, kind, detail) values ('user:' || new.user_id, 'message', jsonb_build_object('author', new.author));
    return new;
  elsif tg_table_name = 'notes' then
    insert into activity (client_key, kind) values (new.client_key, 'note');
    return new;
  elsif tg_table_name = 'offers' then
    if (tg_op = 'INSERT' or old.status is distinct from new.status) and new.status = 'sent' then
      insert into activity (client_key, kind, detail) values (new.client_key, 'offer_sent',
        jsonb_build_object('req', new.request_kind || ':' || new.request_id, 'name', public.request_name(new.request_kind, new.request_id)));
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and old.stage is distinct from new.stage then
    insert into activity (client_key, kind, detail) values (k, 'stage', req || jsonb_build_object('type', tg_table_name, 'stage', new.stage));
  end if;
  if tg_op = 'UPDATE' and old.assignee_id is distinct from new.assignee_id then
    insert into activity (client_key, kind, detail) values (k, 'assigned', req || jsonb_build_object('type', tg_table_name, 'to', new.assignee_id));
  end if;
  return new;
end $$;

create or replace function public.log_check_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into activity (client_key, kind, detail) values ('user:' || new.user_id, 'report_version',
    jsonb_build_object('check', new.check_id, 'req', 'check:' || new.check_id, 'name', public.request_name('check', new.check_id)));
  return new;
end $$;

create or replace function public.log_project() returns trigger
language plpgsql security definer set search_path = public as $$
declare req jsonb := jsonb_build_object('req', new.request_kind || ':' || new.request_id, 'name', public.request_name(new.request_kind, new.request_id));
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into activity (client_key, kind, detail) values (new.client_key, 'project', req || jsonb_build_object('status', new.status));
  end if;
  if tg_op = 'UPDATE' and old.invoice_sent_at is null and new.invoice_sent_at is not null then
    insert into activity (client_key, kind, detail) values (new.client_key, 'invoice_sent', req || jsonb_build_object('number', new.invoice_number, 'amount', new.invoice_amount));
  end if;
  return new;
end $$;

-- Angenommenes Angebot ist eingefroren (Projekt und Rechnung beziehen sich darauf).
create or replace function public.offer_freeze() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.status = 'accepted' and coalesce(current_setting('rag.system', true), '') <> 'on'
     and (new.status is distinct from old.status or new.items is distinct from old.items
          or new.request_kind is distinct from old.request_kind or new.request_id is distinct from old.request_id) then
    raise exception 'offer_accepted_locked';
  end if;
  return new;
end $$;
drop trigger if exists offers_freeze on public.offers;
create trigger offers_freeze before update on public.offers for each row execute function public.offer_freeze();

-- Alte Verlaufseinträge zu Angebot/Projekt: Unternehmen nachtragen, wenn der Kunde genau ein Angebot hat (eindeutig).
update activity a set detail = a.detail || jsonb_build_object('req', o.request_kind || ':' || o.request_id, 'name', public.request_name(o.request_kind, o.request_id))
from offers o
where a.detail ->> 'req' is null and a.kind in ('offer_sent', 'offer_accepted', 'project', 'invoice_sent')
  and o.client_key = a.client_key and o.request_id is not null
  and (select count(*) from offers x where x.client_key = a.client_key) = 1;

notify pgrst, 'reload schema';
