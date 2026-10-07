-- 2FA für das Team (Admin /rag-intern).
-- Erst ausführen, wenn ALLE Mitarbeiter den zweiten Faktor im Admin eingerichtet haben
-- (beim nächsten Login fragt /rag-intern automatisch danach).
-- Danach sieht ein Konto mit Rolle manager/admin Kundendaten nur noch mit aal2 —
-- ein gestohlenes Passwort allein reicht nicht mehr.
--
-- Vorher: Supabase → Authentication → Multi-Factor → TOTP «Enabled».

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
     and exists (select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin'))
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
     and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- Rückgängig (Notfall, z. B. Telefon verloren): Funktionen aus admin.sql erneut ausführen,
-- dem Konto in Supabase → Authentication → Users → MFA-Faktor löschen, neu einrichten, diese Datei erneut ausführen.
