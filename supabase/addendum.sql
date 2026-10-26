-- ─────────────────────────────────────────────────────────────────────────────
-- Zusatzangebot (Nachtrag) nach einem angenommenen Angebot.
-- Ausführen NACH project.sql und flow.sql (idempotent, kann wiederholt werden).
--
-- Bisher: genau ein Angebot je Anfrage, nach der Annahme eingefroren → weitere Leistungen
-- (z. B. Social Media zu Local Website) ließen sich nicht anbieten.
-- Jetzt: Hauptangebot bleibt eins je Anfrage und bleibt eingefroren. Dazu beliebig viele
-- Zusatzangebote (offers.parent_id = Hauptangebot), immer nur eins gleichzeitig offen.
-- Annahme eines Zusatzangebots → eigenes Projekt mit eigener Rechnung (projects.offer_id).
-- Arbeitsplan, Neuigkeiten, Umsetzung und Ergebnis bleiben beim Projekt des Hauptangebots.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.offers add column if not exists parent_id uuid references public.offers (id) on delete cascade;

-- Eindeutig: ein Hauptangebot je Anfrage; je Hauptangebot höchstens ein offenes Zusatzangebot.
alter table public.offers drop constraint if exists offers_request_uq;
create unique index if not exists offers_main_uq on public.offers (request_kind, request_id) where parent_id is null;
create unique index if not exists offers_addendum_open_uq on public.offers (parent_id) where parent_id is not null and status <> 'accepted';
create index if not exists offers_parent_idx on public.offers (parent_id);

-- Zusatzangebot nur zu einem angenommenen Hauptangebot desselben Kunden und derselben Anfrage.
create or replace function public.offer_addendum_check() returns trigger
language plpgsql security definer set search_path = public as $$
declare p offers;
begin
  if new.parent_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.parent_id is not distinct from old.parent_id then return new; end if;
  select * into p from offers where id = new.parent_id;
  if not found or p.parent_id is not null or p.status <> 'accepted'
     or p.request_kind is distinct from new.request_kind or p.request_id is distinct from new.request_id
     or p.user_id is distinct from new.user_id then
    raise exception 'addendum_invalid';
  end if;
  return new;
end $$;
drop trigger if exists offers_addendum_check on public.offers;
create trigger offers_addendum_check before insert or update on public.offers for each row execute function public.offer_addendum_check();

drop trigger if exists offers_log_addendum on public.offers;
drop function if exists public.log_offer_addendum();

notify pgrst, 'reload schema';
