-- ─────────────────────────────────────────────────────────────────────────────
-- RAG · Admin-Bereich (02.10.2026) — Ergänzung zu schema.sql
--
-- Einmal im Supabase-Dashboard ausführen: SQL Editor → New query → alles einfügen → Run.
-- Kann gefahrlos erneut ausgeführt werden. Setzt schema.sql voraus.
--
--   profiles  — Rolle je Konto: client | manager | admin (+ Name, Telefon, E-Mail)
--   leads     — Antworten aus dem Quiz /start (ohne Konto)
--   offers    — vom Team zusammengestelltes Angebot je Kunde/Lead
--   notes     — interne Notizen (Kunde sieht sie nie)
--   activity  — Verlauf: wird per Trigger automatisch geschrieben
--   stage     — Vertriebsstatus in leads, orders, checks (gleiche Werte überall)
--
-- Ersten Admin festlegen: ganz unten die E-Mail eintragen (Konto muss schon existieren).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profile + Rollen ─────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  name       text,
  phone      text,
  role       text not null default 'client' check (role in ('client', 'manager', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- bestehende Konten übernehmen
insert into public.profiles (id, email, name, phone)
select id, email, raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'phone' from auth.users
on conflict (id) do nothing;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin'))
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;
drop policy if exists "profiles: eigenes oder Team" on public.profiles;
drop policy if exists "profiles: Team ändert" on public.profiles;
create policy "profiles: eigenes oder Team" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_staff());
-- Rollen ändert nur ein Admin (Manager nicht — sonst könnten sie sich selbst befördern)
create policy "profiles: Team ändert" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Vertriebsstatus (stage) ─────────────────────────────────────────────────
-- new · contacted · call_booked · call_done · offer_sent · won · lost
alter table public.checks add column if not exists stage text not null default 'new';
alter table public.checks add column if not exists next_contact_at date;
alter table public.orders add column if not exists stage text not null default 'new';
alter table public.orders add column if not exists next_contact_at date;
do $$ begin
  alter table public.checks add constraint checks_stage_chk check (stage in ('new','contacted','call_booked','call_done','offer_sent','won','lost'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.orders add constraint orders_stage_chk check (stage in ('new','contacted','call_booked','call_done','offer_sent','won','lost'));
exception when duplicate_object then null; end $$;

-- Verantwortlicher Mitarbeiter je Anfrage (wird beim ersten Statuswechsel automatisch gesetzt)
alter table public.checks add column if not exists assignee_id uuid references auth.users (id) on delete set null;
alter table public.orders add column if not exists assignee_id uuid references auth.users (id) on delete set null;

-- Team darf Status/Bericht/Verantwortlichen ändern, Kunden weiterhin nur ihre Felder (Trigger prüft das).
grant update (stage, next_contact_at, status, report, assignee_id) on public.checks to authenticated;
grant update (stage, next_contact_at, status, assignee_id) on public.orders to authenticated;

create or replace function public.guard_staff_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Server (Edge Functions mit service_role), SQL Editor, Table Editor: kein auth.uid() → erlaubt
  if auth.uid() is null or public.is_staff() then return new; end if;
  if new.stage is distinct from old.stage or new.next_contact_at is distinct from old.next_contact_at
     or new.status is distinct from old.status or new.assignee_id is distinct from old.assignee_id then
    raise exception 'not allowed';
  end if;
  if tg_table_name = 'checks' then
    if new.report is distinct from old.report then raise exception 'not allowed'; end if;
  end if;
  return new;
end $$;
drop trigger if exists checks_guard on public.checks;
create trigger checks_guard before update on public.checks for each row execute function public.guard_staff_fields();
drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before update on public.orders for each row execute function public.guard_staff_fields();

-- Wer als Erster den Status einer freien Anfrage ändert, übernimmt sie.
create or replace function public.auto_assign() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.assignee_id is null and new.assignee_id is null and new.stage is distinct from old.stage and public.is_staff() then
    new.assignee_id := auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists checks_assign on public.checks;
create trigger checks_assign before update on public.checks for each row execute function public.auto_assign();
drop trigger if exists orders_assign on public.orders;
create trigger orders_assign before update on public.orders for each row execute function public.auto_assign();

-- Kundensicht der Paket-Anfrage folgt dem Vertriebsstatus.
create or replace function public.sync_order_status() returns trigger
language plpgsql as $$
begin
  if new.stage is distinct from old.stage then
    new.status := case new.stage
      when 'new' then 'new'
      when 'won' then 'active'
      when 'lost' then 'closed'
      else 'contacted' end;
  end if;
  return new;
end $$;
drop trigger if exists orders_sync_status on public.orders;
create trigger orders_sync_status before update on public.orders for each row execute function public.sync_order_status();

-- Team sieht und bearbeitet alles
drop policy if exists "checks: Team" on public.checks;
create policy "checks: Team" on public.checks for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "orders: Team" on public.orders;
create policy "orders: Team" on public.orders for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Nachrichten: Team liest alles und antwortet als 'rag'
alter table public.messages add column if not exists author_id uuid default auth.uid();
drop policy if exists "messages: Team liest" on public.messages;
drop policy if exists "messages: Team schreibt" on public.messages;
create policy "messages: Team liest" on public.messages for select to authenticated using (public.is_staff());
create policy "messages: Team schreibt" on public.messages for insert to authenticated with check (public.is_staff() and author = 'rag');

-- ── Leads aus dem Quiz ───────────────────────────────────────────────────────
create table if not exists public.leads (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  source             text not null default 'quiz',
  from_page          text,
  answers            jsonb not null default '{}'::jsonb,
  recommendations    text[] not null default '{}',
  booking_clicked_at timestamptz,
  user_id            uuid references auth.users (id) on delete set null,
  stage              text not null default 'new'
                     check (stage in ('new','contacted','call_booked','call_done','offer_sent','won','lost')),
  next_contact_at    date
);
alter table public.leads add column if not exists assignee_id uuid references auth.users (id) on delete set null;
alter table public.leads add column if not exists email text;
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
grant insert (id, source, from_page, email, answers, recommendations) on public.leads to anon, authenticated;
grant select, update on public.leads to authenticated;
drop policy if exists "leads: jeder legt an" on public.leads;
drop policy if exists "leads: Team" on public.leads;
create policy "leads: jeder legt an" on public.leads for insert to anon, authenticated with check (true);
create policy "leads: Team" on public.leads for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- «Termin wählen» geklickt (ohne Leserechte für Anonyme)
create or replace function public.lead_booking_clicked(lead uuid) returns void
language sql security definer set search_path = public as $$
  update public.leads set booking_clicked_at = coalesce(booking_clicked_at, now())
  where id = lead and created_at > now() - interval '2 days'
$$;
grant execute on function public.lead_booking_clicked(uuid) to anon, authenticated;
-- Nach Registrierung: Quiz-Lead dem Konto zuordnen (Verlauf, Notizen, Angebot ziehen mit um)
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
  if not exists (select 1 from offers where client_key = new_key) then
    update offers set client_key = new_key, user_id = uid where client_key = old_key;
  end if;
  insert into activity (client_key, kind) values (new_key, 'lead_claimed');
end $$;
revoke execute on function public.claim_lead(uuid) from public, anon;
grant execute on function public.claim_lead(uuid) to authenticated;
drop trigger if exists leads_assign on public.leads;
create trigger leads_assign before update on public.leads for each row execute function public.auto_assign();

-- ── Angebote, Notizen, Verlauf ───────────────────────────────────────────────
-- client_key = 'user:<uuid>' (Konto) oder 'lead:<uuid>' (nur Quiz)
create table if not exists public.offers (
  id         uuid primary key default gen_random_uuid(),
  client_key text not null unique,
  user_id    uuid references auth.users (id) on delete cascade,
  items      jsonb not null default '[]'::jsonb,   -- [{ id, name, description?, price, unit, custom? }]
  note       text,
  status     text not null default 'draft' check (status in ('draft', 'sent', 'accepted')),
  sent_at    timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
alter table public.offers enable row level security;
revoke all on public.offers from anon;
grant select, insert, update on public.offers to authenticated;
drop policy if exists "offers: Team" on public.offers;
drop policy if exists "offers: Kunde liest gesendetes" on public.offers;
create policy "offers: Team" on public.offers for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "offers: Kunde liest gesendetes" on public.offers for select to authenticated using (user_id = auth.uid() and status <> 'draft');

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  client_key text not null,
  author_id  uuid default auth.uid(),
  body       text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists notes_client_idx on public.notes (client_key, created_at desc);
alter table public.notes enable row level security;
revoke all on public.notes from anon;
grant select, insert on public.notes to authenticated;
drop policy if exists "notes: Team" on public.notes;
create policy "notes: Team" on public.notes for all to authenticated using (public.is_staff()) with check (public.is_staff());

create table if not exists public.activity (
  id         uuid primary key default gen_random_uuid(),
  client_key text not null,
  kind       text not null,
  detail     jsonb not null default '{}'::jsonb,
  actor      uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists activity_client_idx on public.activity (client_key, created_at desc);
alter table public.activity enable row level security;
revoke all on public.activity from anon;
grant select on public.activity to authenticated;
drop policy if exists "activity: Team" on public.activity;
create policy "activity: Team" on public.activity for select to authenticated using (public.is_staff());

create or replace function public.log_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text; uid uuid;
begin
  if tg_table_name = 'leads' then
    k := case when new.user_id is not null then 'user:' || new.user_id else 'lead:' || new.id end;
    if tg_op = 'INSERT' then insert into activity (client_key, kind, detail) values (k, 'lead_created', jsonb_build_object('from', new.from_page)); end if;
    if tg_op = 'UPDATE' and old.booking_clicked_at is null and new.booking_clicked_at is not null then
      insert into activity (client_key, kind) values (k, 'booking_clicked'); end if;
  elsif tg_table_name = 'checks' then
    k := 'user:' || new.user_id;
    if tg_op = 'INSERT' then insert into activity (client_key, kind, detail) values (k, 'check_created', jsonb_build_object('name', new.place ->> 'name')); end if;
    if tg_op = 'UPDATE' and not old.sources_confirmed and new.sources_confirmed then insert into activity (client_key, kind) values (k, 'sources_confirmed'); end if;
    if tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'ready' then insert into activity (client_key, kind) values (k, 'report_published'); end if;
  elsif tg_table_name = 'orders' then
    k := 'user:' || new.user_id;
    if tg_op = 'INSERT' then insert into activity (client_key, kind, detail) values (k, 'order_created', jsonb_build_object('items', new.items)); end if;
    if tg_op = 'UPDATE' and old.details is null and new.details is not null then insert into activity (client_key, kind) values (k, 'order_details'); end if;
  elsif tg_table_name = 'messages' then
    insert into activity (client_key, kind, detail) values ('user:' || new.user_id, 'message', jsonb_build_object('author', new.author));
    return new;
  elsif tg_table_name = 'notes' then
    insert into activity (client_key, kind) values (new.client_key, 'note');
    return new;
  elsif tg_table_name = 'offers' then
    if (tg_op = 'INSERT' or old.status is distinct from new.status) and new.status = 'sent' then
      insert into activity (client_key, kind) values (new.client_key, 'offer_sent'); end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and old.stage is distinct from new.stage then
    insert into activity (client_key, kind, detail) values (k, 'stage', jsonb_build_object('type', tg_table_name, 'stage', new.stage));
  end if;
  if tg_op = 'UPDATE' and old.assignee_id is distinct from new.assignee_id then
    insert into activity (client_key, kind, detail) values (k, 'assigned', jsonb_build_object('type', tg_table_name, 'to', new.assignee_id));
  end if;
  return new;
end $$;

drop trigger if exists leads_log on public.leads;
create trigger leads_log after insert or update on public.leads for each row execute function public.log_activity();
drop trigger if exists checks_log on public.checks;
create trigger checks_log after insert or update on public.checks for each row execute function public.log_activity();
drop trigger if exists orders_log on public.orders;
create trigger orders_log after insert or update on public.orders for each row execute function public.log_activity();
drop trigger if exists messages_log on public.messages;
create trigger messages_log after insert on public.messages for each row execute function public.log_activity();
drop trigger if exists notes_log on public.notes;
create trigger notes_log after insert on public.notes for each row execute function public.log_activity();
drop trigger if exists offers_log on public.offers;
create trigger offers_log after insert or update on public.offers for each row execute function public.log_activity();

-- ── Team-Einladungen per Link (ohne E-Mail-Versand) ──────────────────────────
-- Admin erzeugt im Admin-Bereich einen Link mit einmaligem Token und schickt ihn selbst.
-- Gespeichert wird nur der SHA-256-Hash des Tokens. Gültig 72 Stunden, einmal verwendbar,
-- nur für die eingetragene E-Mail.
create table if not exists public.staff_invites (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  email       text not null,
  role        text not null check (role in ('manager', 'admin')),
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  used_by     uuid,
  revoked_at  timestamptz
);
alter table public.staff_invites enable row level security;
revoke all on public.staff_invites from anon, authenticated;
grant select on public.staff_invites to authenticated;
drop policy if exists "staff_invites: Admin liest" on public.staff_invites;
create policy "staff_invites: Admin liest" on public.staff_invites for select to authenticated using (public.is_admin());

create or replace function public.create_staff_invite(p_email text, p_role text) returns text
language plpgsql security definer set search_path = public as $$
declare tok text;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_role not in ('manager', 'admin') then raise exception 'bad_role'; end if;
  if coalesce(trim(p_email), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'bad_email'; end if;
  tok := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into staff_invites (token_hash, email, role, expires_at)
  values (encode(sha256(convert_to(tok, 'UTF8')), 'hex'), lower(trim(p_email)), p_role, now() + interval '72 hours');
  return tok;
end $$;

create or replace function public.accept_staff_invite(p_token text) returns text
language plpgsql security definer set search_path = public as $$
declare inv staff_invites; me text;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select * into inv from staff_invites
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
   for update;
  if not found or inv.revoked_at is not null then raise exception 'invalid'; end if;
  if inv.used_at is not null then raise exception 'used'; end if;
  if inv.expires_at < now() then raise exception 'expired'; end if;
  select lower(email) into me from auth.users where id = auth.uid();
  if me is distinct from inv.email then raise exception 'wrong_email'; end if;
  insert into profiles (id, email) values (auth.uid(), me) on conflict (id) do nothing;
  update profiles set role = inv.role where id = auth.uid();
  update staff_invites set used_at = now(), used_by = auth.uid() where id = inv.id;
  return inv.role;
end $$;

create or replace function public.revoke_staff_invite(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  update staff_invites set revoked_at = now() where id = p_id and used_at is null;
end $$;

-- Rolle ändern / Zugang entziehen (nicht für das eigene Konto)
create or replace function public.set_staff_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_user = auth.uid() then raise exception 'self'; end if;
  if p_role not in ('client', 'manager', 'admin') then raise exception 'bad_role'; end if;
  update profiles set role = p_role where id = p_user;
end $$;

revoke execute on function public.create_staff_invite(text, text), public.accept_staff_invite(text),
  public.revoke_staff_invite(uuid), public.set_staff_role(uuid, text) from public, anon;
grant execute on function public.create_staff_invite(text, text), public.accept_staff_invite(text),
  public.revoke_staff_invite(uuid), public.set_staff_role(uuid, text) to authenticated;


-- ── Ansprechpartner & Angebot im Kundenbereich ──────────────────────────────
alter table public.profiles add column if not exists title       text;   -- z. B. «Ihr Ansprechpartner»
alter table public.profiles add column if not exists photo_url   text;
alter table public.profiles add column if not exists booking_url text;   -- eigener Terminlink (Google Calendar)

-- Mitarbeiter pflegen ihr eigenes Profil (Rolle bleibt unberührt)
create or replace function public.update_my_staff_profile(p_name text, p_title text, p_photo text, p_booking text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'not_staff'; end if;
  update profiles set name = nullif(trim(p_name), ''), title = nullif(trim(p_title), ''),
    photo_url = nullif(trim(p_photo), ''), booking_url = nullif(trim(p_booking), '')
  where id = auth.uid();
end $$;

-- Kunde: wer betreut mich? (Verantwortlicher der neuesten offenen Anfrage; nur öffentliche Felder)
create or replace function public.my_manager()
returns table (name text, title text, photo_url text, booking_url text)
language sql stable security definer set search_path = public as $$
  with mine as (
    select assignee_id, created_at from checks where user_id = auth.uid() and assignee_id is not null and stage <> 'lost'
    union all select assignee_id, created_at from orders where user_id = auth.uid() and assignee_id is not null and stage <> 'lost'
    union all select assignee_id, created_at from leads where user_id = auth.uid() and assignee_id is not null and stage <> 'lost'
  )
  select p.name, p.title, p.photo_url, p.booking_url
  from mine m join profiles p on p.id = m.assignee_id and p.role in ('manager', 'admin')
  order by m.created_at desc limit 1
$$;

-- Kunde nimmt ein gesendetes Angebot an
create or replace function public.accept_offer(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o offers;
begin
  select * into o from offers where id = p_id and user_id = auth.uid() and status = 'sent' for update;
  if not found then raise exception 'not_found'; end if;
  update offers set status = 'accepted', updated_at = now() where id = p_id;
  insert into activity (client_key, kind) values (o.client_key, 'offer_accepted');
end $$;

revoke execute on function public.update_my_staff_profile(text, text, text, text), public.my_manager(), public.accept_offer(uuid) from public, anon;
grant execute on function public.update_my_staff_profile(text, text, text, text), public.my_manager(), public.accept_offer(uuid) to authenticated;

-- ── Termine (vom Team eingetragen, Kunde sieht sie unter «Termine») ─────────
create table if not exists public.appointments (
  id           uuid primary key default gen_random_uuid(),
  client_key   text not null,
  user_id      uuid references auth.users (id) on delete cascade,
  starts_at    timestamptz not null,
  duration_min int not null default 30 check (duration_min between 5 and 480),
  title        text not null default 'Gespräch' check (length(title) between 1 and 200),
  location     text check (length(location) <= 500),   -- Video-Link, Telefon oder Adresse
  note         text check (length(note) <= 2000),
  status       text not null default 'planned' check (status in ('planned', 'done', 'cancelled')),
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists appointments_client_idx on public.appointments (client_key, starts_at);
create index if not exists appointments_user_idx on public.appointments (user_id, starts_at);
alter table public.appointments enable row level security;
revoke all on public.appointments from anon;
grant select, insert, update, delete on public.appointments to authenticated;
drop policy if exists "appointments: Kunde liest" on public.appointments;
drop policy if exists "appointments: Team" on public.appointments;
create policy "appointments: Kunde liest" on public.appointments for select to authenticated using (user_id = auth.uid());
create policy "appointments: Team" on public.appointments for all to authenticated using (public.is_staff()) with check (public.is_staff());

create or replace function public.log_appointment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into activity (client_key, kind, detail) values (new.client_key, 'appointment', jsonb_build_object('at', new.starts_at, 'title', new.title));
  elsif old.status is distinct from new.status or old.starts_at is distinct from new.starts_at then
    insert into activity (client_key, kind, detail) values (new.client_key, 'appointment_changed', jsonb_build_object('at', new.starts_at, 'title', new.title, 'status', new.status));
  end if;
  return new;
end $$;
drop trigger if exists appointments_log on public.appointments;
create trigger appointments_log after insert or update on public.appointments for each row execute function public.log_appointment();

-- ── Konto des Kunden: Name/Telefon ändern, Konto löschen ────────────────────
create or replace function public.update_my_contact(p_name text, p_phone text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if length(coalesce(p_name, '')) > 120 or length(coalesce(p_phone, '')) > 40 then raise exception 'too_long'; end if;
  update profiles set name = nullif(trim(p_name), ''), phone = nullif(trim(p_phone), '') where id = auth.uid();
end $$;

-- Löscht das eigene Konto mit allen Daten (Checks, Anfragen, Nachrichten, Angebote, Termine, Notizen, Verlauf).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); k text;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if public.is_staff() then raise exception 'staff_account'; end if;
  k := 'user:' || uid;
  delete from public.activity where client_key = k;
  delete from public.notes where client_key = k;
  delete from public.offers where client_key = k;
  delete from public.appointments where client_key = k;
  delete from public.leads where user_id = uid;
  delete from auth.users where id = uid;   -- checks, orders, messages, profiles: on delete cascade
end $$;

revoke execute on function public.update_my_contact(text, text), public.delete_my_account() from public, anon;
grant execute on function public.update_my_contact(text, text), public.delete_my_account() to authenticated;
