-- ─────────────────────────────────────────────────────────────────────────────
-- RAG · Sichtbarkeits-Check & Kundenbereich — Supabase-Schema (25.09.2026)
--
-- Einmal komplett im Supabase-Dashboard ausführen: SQL Editor → New query →
-- alles einfügen → Run. Das Skript kann gefahrlos erneut ausgeführt werden.
--
-- Zwei Wege in den Kundenbereich:
--   • checks  — kostenloser Sichtbarkeits-Check (Google-Profil + Quellen + Bericht)
--   • orders  — Paket-Anfrage (gewählte Leistungen + Angaben zum Unternehmen)
--   • messages — ein Nachrichtenverlauf pro Kunde (user_id)
--
-- Rechte:
--   • Kunden (angemeldet) sehen und ändern nur ihre eigenen Checks.
--     Ändern dürfen sie nur Quellen (+ Bestätigung) und Region — Status und Bericht nicht.
--   • Nachrichten: Kunden lesen alles zu ihrem Check und schreiben als 'client'.
--   • Das RAG-Team arbeitet im Table Editor (umgeht RLS): Status setzen,
--     Bericht (report) eintragen, als 'rag' antworten.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.checks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email        text default (auth.jwt() ->> 'email'),
  place_id     text,
  place        jsonb not null,                       -- Name, Adresse, Branche, Bewertung … (Stand bei Anlage)
  region       text,
  sources      jsonb not null default '[]'::jsonb,   -- [{ key, value, found }]
  sources_confirmed boolean not null default false,  -- Kunde hat Website/Profile im Kundenbereich bestätigt
  contact      jsonb not null default '{}'::jsonb,   -- { name, phone, role, okEmail, okPhone }
  source_page  text,                                 -- Seite, auf der der Check gestartet wurde
  status       text not null default 'submitted'
               check (status in ('submitted', 'in_review', 'ready')),
  report       jsonb,                                -- vom Team: { channels: {ai|maps|search|social: {score, summary, points}}, recommendations }
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- Für Datenbanken, die mit einer älteren Version dieses Skripts angelegt wurden:
alter table public.checks add column if not exists sources_confirmed boolean not null default false;

create index if not exists checks_user_idx on public.checks (user_id, created_at desc);

create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email        text default (auth.jwt() ->> 'email'),
  items        jsonb not null,                       -- [{ id, name, price, unit }]
  details      jsonb,                                -- vom Kunden: { company, industry, city, website, goals[], problem, reach, phone }
  source_page  text,
  status       text not null default 'new'
               check (status in ('new', 'contacted', 'active', 'closed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid default auth.uid() references auth.users (id) on delete cascade,
  check_id    uuid references public.checks (id) on delete cascade,
  order_id    uuid references public.orders (id) on delete set null,
  author      text not null default 'client' check (author in ('client', 'rag')),
  body        text not null check (length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);
-- Ältere Version: Nachrichten hingen nur am Check → auf Kunde (user_id) umstellen.
alter table public.messages add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.messages add column if not exists order_id uuid references public.orders (id) on delete set null;
alter table public.messages alter column check_id drop not null;
alter table public.messages alter column user_id set default auth.uid();
update public.messages m set user_id = c.user_id from public.checks c where m.user_id is null and m.check_id = c.id;
create index if not exists messages_user_idx on public.messages (user_id, created_at);

-- updated_at automatisch pflegen
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists checks_touch on public.checks;
create trigger checks_touch before update on public.checks
for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
for each row execute function public.touch_updated_at();

-- Begrüßung im Nachrichtenbereich, sobald ein Check angelegt ist
create or replace function public.greet_new_check() returns trigger
language plpgsql security definer set search_path = public as $$
declare first_name text := split_part(coalesce(new.contact ->> 'name', ''), ' ', 1);
begin
  insert into public.messages (user_id, check_id, author, body) values (
    new.user_id, new.id, 'rag',
    'Hallo' || case when first_name <> '' then ' ' || first_name else '' end ||
    ', wir haben Ihre Anfrage erhalten und mit dem Check von ' || coalesce(new.place ->> 'name', 'Ihrem Unternehmen') ||
    ' begonnen. Falls wir noch Informationen brauchen, schreiben wir Ihnen hier.'
  );
  return new;
end $$;

drop trigger if exists checks_greet on public.checks;
create trigger checks_greet after insert on public.checks
for each row execute function public.greet_new_check();

-- Begrüßung bei einer Paket-Anfrage
create or replace function public.greet_new_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare names text;
begin
  select string_agg(i ->> 'name', ' + ') into names from jsonb_array_elements(new.items) as i;
  insert into public.messages (user_id, order_id, author, body) values (
    new.user_id, new.id, 'rag',
    'Danke für Ihre Anfrage (' || coalesce(names, 'Paket') || '). Bitte ergänzen Sie in der Übersicht kurz die Angaben zu Ihrem Unternehmen — dann melden wir uns innerhalb eines Werktags.'
  );
  return new;
end $$;

drop trigger if exists orders_greet on public.orders;
create trigger orders_greet after insert on public.orders
for each row execute function public.greet_new_order();

-- ── Zugriffsrechte ───────────────────────────────────────────────────────────
alter table public.checks   enable row level security;
alter table public.orders   enable row level security;
alter table public.messages enable row level security;

revoke all on public.checks, public.orders, public.messages from anon;
revoke update, delete on public.orders from authenticated;
grant select, insert on public.orders to authenticated;
grant update (details) on public.orders to authenticated;
revoke update, delete on public.checks from authenticated;
grant select, insert on public.checks to authenticated;
grant update (sources, sources_confirmed, region) on public.checks to authenticated;
revoke update, delete on public.messages from authenticated;
grant select, insert on public.messages to authenticated;

drop policy if exists "checks: eigene lesen"   on public.checks;
drop policy if exists "checks: eigene anlegen" on public.checks;
drop policy if exists "checks: eigene ändern"  on public.checks;
create policy "checks: eigene lesen" on public.checks
  for select to authenticated using (user_id = auth.uid());
create policy "checks: eigene anlegen" on public.checks
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'submitted' and report is null);
create policy "checks: eigene ändern" on public.checks
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "orders: eigene lesen"   on public.orders;
drop policy if exists "orders: eigene anlegen" on public.orders;
drop policy if exists "orders: eigene ändern"  on public.orders;
create policy "orders: eigene lesen" on public.orders
  for select to authenticated using (user_id = auth.uid());
create policy "orders: eigene anlegen" on public.orders
  for insert to authenticated with check (user_id = auth.uid() and status = 'new');
create policy "orders: eigene ändern" on public.orders
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "messages: eigene lesen"     on public.messages;
drop policy if exists "messages: als Kunde senden" on public.messages;
create policy "messages: eigene lesen" on public.messages
  for select to authenticated using (user_id = auth.uid());
create policy "messages: als Kunde senden" on public.messages
  for insert to authenticated with check (author = 'client' and user_id = auth.uid());
