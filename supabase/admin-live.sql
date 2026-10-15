-- Admin /rag-intern: живое обновление + смена e-mail сотрудника.
-- Выполнить один раз в Supabase → SQL Editor. Повторный запуск безопасен.

-- 1) Realtime: таблицы, изменения которых админка получает без кнопки «Обновить».
--    Кто что видит, решает RLS (те же политики, что для обычных запросов).
do $$
declare t text;
begin
  foreach t in array array['leads','orders','checks','profiles','messages','notes','activity','offers','appointments','projects','check_reports','staff_invites'] loop
    if to_regclass('public.' || t) is not null and not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- 2) После подтверждения новой почты переносим её в profiles.email
--    (иначе в «Команде» и в карточках осталась бы старая).
create or replace function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id and email is distinct from new.email;
  return new;
end $$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- 3) Смена своего e-mail БЕЗ писем (старого ящика может уже не быть).
--    Защита: только сотрудник с активной сессией (is_staff, при включённой 2FA — aal2)
--    + текущий пароль. Почта меняется сразу: auth.users, identities, profiles.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.change_my_email(p_email text, p_password text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  e   text := lower(trim(coalesce(p_email, '')));
  pw  text;
begin
  if uid is null or not public.is_staff() then raise exception 'forbidden'; end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'bad_email'; end if;
  select encrypted_password into pw from auth.users where id = uid;
  if pw is null or pw = '' or extensions.crypt(coalesce(p_password, ''), pw) <> pw then raise exception 'wrong_password'; end if;
  if exists (select 1 from auth.users where lower(email) = e and id <> uid) then raise exception 'email_taken'; end if;

  update auth.users
     set email = e,
         email_confirmed_at = now(),
         email_change = '', email_change_token_new = '', email_change_token_current = '',
         email_change_confirm_status = 0,
         updated_at = now()
   where id = uid;
  update auth.identities
     set identity_data = identity_data || jsonb_build_object('email', e, 'email_verified', true),
         updated_at = now()
   where user_id = uid and provider = 'email';
  update public.profiles set email = e where id = uid;
  return e;
end $$;

revoke all on function public.change_my_email(text, text) from public, anon;
grant execute on function public.change_my_email(text, text) to authenticated;
notify pgrst, 'reload schema';

-- 4) Смена своего пароля БЕЗ писем: только с текущим паролем.
--    Остальные сессии этого сотрудника (другие браузеры/устройства) завершаются.
create or replace function public.change_my_password(p_current text, p_new text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  pw  text;
  sid text := auth.jwt() ->> 'session_id';
begin
  if uid is null or not public.is_staff() then raise exception 'forbidden'; end if;
  select encrypted_password into pw from auth.users where id = uid;
  if pw is null or pw = '' or extensions.crypt(coalesce(p_current, ''), pw) <> pw then raise exception 'wrong_password'; end if;
  if length(coalesce(p_new, '')) < 8 then raise exception 'weak_password'; end if;
  if extensions.crypt(p_new, pw) = pw then raise exception 'same_password'; end if;

  update auth.users set encrypted_password = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), updated_at = now() where id = uid;
  if sid is not null then
    delete from auth.sessions where user_id = uid and id::text <> sid;
  end if;
end $$;

revoke all on function public.change_my_password(text, text) from public, anon;
grant execute on function public.change_my_password(text, text) to authenticated;
notify pgrst, 'reload schema';

-- 5) «Прочитано»: когда сотрудник открывает переписку, сообщения клиента отмечаются прочитанными.
alter table public.messages add column if not exists read_at timestamptz;
grant update (read_at) on public.messages to authenticated;
drop policy if exists "messages: Team markiert gelesen" on public.messages;
create policy "messages: Team markiert gelesen" on public.messages for update to authenticated using (public.is_staff()) with check (public.is_staff());
-- Старые сообщения считаем прочитанными, чтобы счётчики не вспыхнули разом.
update public.messages set read_at = created_at where read_at is null and author <> 'rag' and created_at < now() - interval '1 day';
notify pgrst, 'reload schema';
