// Datenzugriff für den Admin-Bereich. Rechte regelt die Datenbank (RLS, supabase/admin.sql):
// nur Konten mit Rolle manager/admin sehen fremde Daten.
import { getSupabase } from '../check/data'
import type { OfferItem } from './catalog'

export type Stage = 'new' | 'contacted' | 'call_booked' | 'call_done' | 'offer_sent' | 'won' | 'lost'
export const STAGES: [Stage, string][] = [
  ['new', 'Новая'], ['contacted', 'Связались'], ['call_booked', 'Созвон назначен'], ['call_done', 'Созвон прошёл'],
  ['offer_sent', 'Предложение отправлено'], ['won', 'Клиент'], ['lost', 'Отказ'],
]
export const stageLabel = (s: Stage) => STAGES.find(x => x[0] === s)?.[1] ?? s
export const OPEN: Stage[] = ['new', 'contacted', 'call_booked', 'call_done', 'offer_sent']

export type Kind = 'lead' | 'order' | 'check'
export type Profile = { id: string; email: string | null; name: string | null; phone: string | null; role: string; created_at: string; title?: string | null; photo_url?: string | null; booking_url?: string | null }
export type Lead = { id: string; created_at: string; from_page: string | null; answers: Record<string, unknown>; recommendations: string[]; booking_clicked_at: string | null; user_id: string | null; stage: Stage; next_contact_at: string | null; assignee_id: string | null }
export type Order = { id: string; user_id: string; email: string | null; items: OfferItem[]; details: Record<string, unknown> | null; status: string; stage: Stage; next_contact_at: string | null; assignee_id: string | null; source_page: string | null; created_at: string }
export type Check = { id: string; user_id: string; email: string | null; place_id: string | null; place: Record<string, unknown>; sources: { key: string; value: string }[]; sources_confirmed: boolean; contact: Record<string, unknown>; status: string; report: unknown; report_draft: unknown; audit: unknown; audited_at: string | null; stage: Stage; next_contact_at: string | null; assignee_id: string | null; source_page: string | null; created_at: string }
export type Request = { kind: Kind; id: string; clientKey: string; userId: string | null; created_at: string; stage: Stage; next: string | null; assignee: string | null; title: string; sub: string; row: Lead | Order | Check }
export type Message = { id: string; author: 'client' | 'rag'; body: string; created_at: string }
export type Note = { id: string; body: string; author_id: string | null; created_at: string }
export type Activity = { id: string; kind: string; detail: Record<string, unknown>; actor: string | null; created_at: string }
export type Offer = { id?: string; client_key: string; user_id: string | null; items: OfferItem[]; note: string | null; status: 'draft' | 'sent' | 'accepted'; sent_at?: string | null; updated_at?: string }

const db = () => getSupabase()

export async function signInStaff(email: string, password: string): Promise<string | null> {
  const s = await db()
  const { error } = await s.auth.signInWithPassword({ email: email.trim(), password })
  if (error) return 'Неверный e-mail или пароль.'
  if (!(await isStaff())) { await s.auth.signOut(); return 'У этого аккаунта нет доступа.' }
  return null
}

export async function isStaff(): Promise<boolean> {
  const s = await db()
  const { data } = await s.auth.getSession()
  const uid = data.session?.user.id
  if (!uid) return false
  const { data: p } = await s.from('profiles').select('role').eq('id', uid).maybeSingle()
  return p?.role === 'admin' || p?.role === 'manager'
}

export async function signOutStaff() { await (await db()).auth.signOut() }

const place = (c: Check) => c.place as { name?: string; city?: string; category?: string }
const quiz = (l: Lead) => l.answers as { branche?: string; ort?: string; firma?: string }

export async function loadAll(): Promise<{ requests: Request[]; profiles: Profile[] }> {
  const s = await db()
  const [L, O, C, P] = await Promise.all([
    s.from('leads').select('*').order('created_at', { ascending: false }).limit(500),
    s.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
    s.from('checks').select('id, user_id, email, place_id, place, sources, sources_confirmed, contact, status, report, report_draft, audited_at, stage, next_contact_at, assignee_id, source_page, created_at').order('created_at', { ascending: false }).limit(500),
    s.from('profiles').select('*'),
  ])
  const profiles = (P.data ?? []) as Profile[]
  const who = (uid: string | null) => profiles.find(p => p.id === uid)
  const requests: Request[] = [
    ...((L.data ?? []) as Lead[]).map(l => ({
      kind: 'lead' as const, id: l.id, clientKey: l.user_id ? `user:${l.user_id}` : `lead:${l.id}`, userId: l.user_id, created_at: l.created_at,
      stage: l.stage, next: l.next_contact_at, assignee: l.assignee_id, row: l,
      title: quiz(l).firma || [quiz(l).branche, quiz(l).ort].filter(Boolean).join(' · ') || 'Квиз',
      sub: [(l as Lead & { email?: string }).email, l.booking_clicked_at ? 'нажал «Выбрать время»' : 'без записи на созвон'].filter(Boolean).join(' · '),
    })),
    ...((O.data ?? []) as Order[]).map(o => ({
      kind: 'order' as const, id: o.id, clientKey: `user:${o.user_id}`, userId: o.user_id, created_at: o.created_at,
      stage: o.stage, next: o.next_contact_at, assignee: o.assignee_id, row: o,
      title: String((o.details as { company?: string } | null)?.company || who(o.user_id)?.name || o.email || 'Заявка'),
      sub: (o.items ?? []).map(i => i.name).join(' + ') + (o.details ? '' : ' · анкета не заполнена'),
    })),
    ...((C.data ?? []) as Check[]).map(c => ({
      kind: 'check' as const, id: c.id, clientKey: `user:${c.user_id}`, userId: c.user_id, created_at: c.created_at,
      stage: c.stage, next: c.next_contact_at, assignee: c.assignee_id, row: c,
      title: place(c).name || 'Проверка',
      sub: [place(c).category, place(c).city].filter(Boolean).join(' · ') + ' · ' + checkState(c),
    })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return { requests, profiles }
}

export function checkState(c: Check): string {
  if (c.status === 'ready') return 'отчёт опубликован'
  if (!c.sources_confirmed) return 'ждёт подтверждения источников'
  if (c.report_draft) return 'черновик отчёта готов'
  return 'идёт сбор данных'
}

const table = (k: Kind) => (k === 'lead' ? 'leads' : k === 'order' ? 'orders' : 'checks')

export async function setStage(k: Kind, id: string, stage: Stage) {
  const { error } = await (await db()).from(table(k)).update({ stage }).eq('id', id)
  return !error
}
export async function setAssignee(k: Kind, id: string, uid: string | null) {
  const { error } = await (await db()).from(table(k)).update({ assignee_id: uid }).eq('id', id)
  return !error
}
/** Nach einem Statuswechsel: wer ist jetzt verantwortlich (Trigger setzt ihn automatisch). */
export async function getAssignee(k: Kind, id: string): Promise<string | null> {
  const { data } = await (await db()).from(table(k)).select('assignee_id').eq('id', id).maybeSingle()
  return (data as { assignee_id: string | null } | null)?.assignee_id ?? null
}
export async function setNextContact(k: Kind, id: string, date: string | null) {
  const { error } = await (await db()).from(table(k)).update({ next_contact_at: date || null }).eq('id', id)
  return !error
}
export type Recommended = { id: string; name: string; description?: string; price: number; unit: 'einmalig' | 'pro Monat'; why?: string }
/** Bericht veröffentlichen — immer mit Empfehlung, womit der Kunde starten soll. Danach kann er einen Termin buchen. */
export async function publishReport(c: Check, recommended: Recommended) {
  const report = { ...((c.report_draft as object | null) ?? {}), recommended }
  // Ohne Ansprechpartner sähe der Kunde den Bericht, könnte aber keinen Termin buchen → wer veröffentlicht, übernimmt.
  const assignee_id = c.assignee_id ?? await myId()
  const { error } = await (await db()).from('checks').update({ report, status: 'ready', assignee_id }).eq('id', c.id)
  return error ? null : report
}
/** Empfehlung im bereits veröffentlichten Bericht ändern. */
export async function setRecommended(c: Check, recommended: Recommended) {
  const report = { ...((c.report as object | null) ?? {}), recommended }
  const { error } = await (await db()).from('checks').update({ report }).eq('id', c.id)
  return error ? null : report
}

export async function loadClient(clientKey: string, userId: string | null) {
  const s = await db()
  const [M, N, A, F, T] = await Promise.all([
    userId ? s.from('messages').select('id, author, body, created_at').eq('user_id', userId).order('created_at') : Promise.resolve({ data: [] }),
    s.from('notes').select('id, body, author_id, created_at').eq('client_key', clientKey).order('created_at', { ascending: false }),
    s.from('activity').select('id, kind, detail, actor, created_at').eq('client_key', clientKey).order('created_at', { ascending: false }).limit(200),
    s.from('offers').select('*').eq('client_key', clientKey).maybeSingle(),
    s.from('appointments').select('*').eq('client_key', clientKey).order('starts_at', { ascending: false }),
  ])
  return {
    messages: (M.data ?? []) as Message[], notes: (N.data ?? []) as Note[], activity: (A.data ?? []) as Activity[],
    offer: (F.data ?? null) as Offer | null, appointments: (T.data ?? []) as Appointment[],
  }
}

export async function sendStaffMessage(userId: string, body: string) {
  const { data, error } = await (await db()).from('messages').insert({ user_id: userId, author: 'rag', body }).select('id, author, body, created_at').single()
  return error ? null : (data as Message)
}
export async function addNote(clientKey: string, body: string) {
  const { data, error } = await (await db()).from('notes').insert({ client_key: clientKey, body }).select('id, body, author_id, created_at').single()
  return error ? null : (data as Note)
}
export async function saveOffer(o: Offer) {
  const row = { client_key: o.client_key, user_id: o.user_id, items: o.items, note: o.note, status: o.status, sent_at: o.status === 'sent' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }
  const { data, error } = await (await db()).from('offers').upsert(row, { onConflict: 'client_key' }).select('*').single()
  return error ? null : (data as Offer)
}

// ── Team & Einladungen (ohne E-Mail: Link wird im Admin kopiert und selbst verschickt) ──
export type Invite = { id: string; email: string; role: 'manager' | 'admin'; created_at: string; expires_at: string; used_at: string | null; revoked_at: string | null }

export async function myId(): Promise<string | null> {
  const { data } = await (await db()).auth.getSession()
  return data.session?.user.id ?? null
}
export async function isAdmin(): Promise<boolean> {
  const s = await db(), uid = await myId()
  if (!uid) return false
  const { data } = await s.from('profiles').select('role').eq('id', uid).maybeSingle()
  return data?.role === 'admin'
}
export async function loadTeam(): Promise<{ staff: Profile[]; invites: Invite[] }> {
  const s = await db()
  const [P, I] = await Promise.all([
    s.from('profiles').select('*').in('role', ['manager', 'admin']).order('created_at'),
    s.from('staff_invites').select('id, email, role, created_at, expires_at, used_at, revoked_at').order('created_at', { ascending: false }).limit(50),
  ])
  return { staff: (P.data ?? []) as Profile[], invites: (I.data ?? []) as Invite[] }
}
const ERR: Record<string, string> = {
  not_admin: 'Это может только админ.', bad_role: 'Неверная роль.', bad_email: 'Проверьте e-mail.', self: 'Свою роль менять нельзя.',
  invalid: 'Ссылка недействительна или отменена.', used: 'Эта ссылка уже использована.', expired: 'Срок ссылки истёк — попросите новую.',
  wrong_email: 'Приглашение выписано на другой e-mail. Войдите под тем адресом, на который оно выписано.', not_signed_in: 'Сначала войдите.',
}
const errText = (m?: string) => ERR[Object.keys(ERR).find(k => m?.includes(k)) ?? ''] ?? 'Что-то пошло не так. Попробуйте ещё раз.'

export async function createInvite(email: string, role: 'manager' | 'admin'): Promise<{ link?: string; error?: string }> {
  const { data, error } = await (await db()).rpc('create_staff_invite', { p_email: email, p_role: role })
  if (error) return { error: errText(error.message) }
  // Token im #-Teil: wird nicht an Server/Logs übertragen
  return { link: `${window.location.origin}/rag-intern/einladung#t=${data as string}` }
}
export async function revokeInvite(id: string) { return !(await (await db()).rpc('revoke_staff_invite', { p_id: id })).error }
export async function setRole(userId: string, role: 'client' | 'manager' | 'admin') {
  const { error } = await (await db()).rpc('set_staff_role', { p_user: userId, p_role: role })
  return error ? errText(error.message) : null
}
export async function acceptInvite(token: string): Promise<{ role?: string; error?: string }> {
  const { data, error } = await (await db()).rpc('accept_staff_invite', { p_token: token })
  return error ? { error: errText(error.message) } : { role: data as string }
}
export async function currentEmail(): Promise<string | null> {
  const { data } = await (await db()).auth.getSession()
  return data.session?.user.email ?? null
}
export async function signUpStaff(name: string, email: string, password: string): Promise<string | null> {
  const s = await db()
  const { data, error } = await s.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } })
  if (error) return /already|exists|registered/i.test(error.message) ? 'exists' : /password/i.test(error.message) ? 'Пароль слишком простой — минимум 8 символов.' : 'Не удалось создать аккаунт.'
  if (!data.session) return 'exists'
  return null
}
export async function signInPlain(email: string, password: string): Promise<string | null> {
  const { error } = await (await db()).auth.signInWithPassword({ email: email.trim(), password })
  return error ? 'Неверный e-mail или пароль.' : null
}

// Eigenes Profil (Name, Position, Foto, Terminlink) — sieht der Kunde in seinem Kundenbereich.
export async function loadMyProfile(): Promise<Profile | null> {
  const s = await db(), uid = await myId()
  if (!uid) return null
  const { data } = await s.from('profiles').select('*').eq('id', uid).maybeSingle()
  return (data as Profile | null) ?? null
}
export async function saveMyProfile(p: { name: string; title: string; photo: string; booking: string }): Promise<string | null> {
  const { error } = await (await db()).rpc('update_my_staff_profile', { p_name: p.name.trim(), p_title: p.title.trim(), p_photo: p.photo.trim(), p_booking: p.booking.trim() })
  return error ? error.message : null
}

// ── Termine mit dem Kunden (sieht er im Kundenbereich unter «Termine») ──────
export type Appointment = { id: string; client_key: string; user_id: string | null; starts_at: string; duration_min: number; title: string; location: string | null; note: string | null; status: 'planned' | 'done' | 'cancelled'; created_by: string | null }
export async function addAppointment(a: { client_key: string; user_id: string | null; starts_at: string; duration_min: number; title: string; location: string; note: string }): Promise<boolean> {
  const { error } = await (await db()).from('appointments').insert({ ...a, location: a.location.trim() || null, note: a.note.trim() || null, title: a.title.trim() || 'Gespräch' })
  return !error
}
export async function setAppointmentStatus(id: string, status: Appointment['status']) {
  return !(await (await db()).from('appointments').update({ status }).eq('id', id)).error
}
export async function deleteAppointment(id: string) {
  return !(await (await db()).from('appointments').delete().eq('id', id)).error
}

// ── Sichtbarkeits-Check v2: Checkliste, Neu-Sammeln, Versionen ──────────────
export type CheckFull = Check & { checklist: Record<string, unknown> | null }
export async function loadCheckFull(id: string): Promise<CheckFull | null> {
  const { data } = await (await db()).from('checks').select('*').eq('id', id).maybeSingle()
  return (data as CheckFull | null) ?? null
}
export async function saveChecklist(id: string, checklist: object): Promise<boolean> {
  return !(await (await db()).from('checks').update({ checklist }).eq('id', id)).error
}
/** Daten neu sammeln (Google, Website, PageSpeed). Läuft bis zu ~1 Minute. */
export async function recollect(checkId: string): Promise<{ ok: boolean; message: string }> {
  const proxy = (import.meta.env.VITE_PLACES_PROXY as string | undefined)?.replace(/\/$/, '')
  if (!proxy) return { ok: false, message: 'VITE_PLACES_PROXY не задан' }
  const { data } = await (await db()).auth.getSession()
  const token = data.session?.access_token
  if (!token) return { ok: false, message: 'Нет сессии' }
  try {
    const res = await fetch(`${proxy}/audit-collect`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ checkId, force: true }) })
    const j = await res.json().catch(() => ({})) as { status?: string; error?: string; detail?: string; pagespeed?: number | null }
    if (!res.ok) return { ok: false, message: `${j.error ?? res.status}${j.detail ? `: ${j.detail}` : ''}` }
    return { ok: true, message: j.pagespeed == null ? 'Данные собраны. PageSpeed не ответил — впишите вручную.' : `Данные собраны. PageSpeed: ${j.pagespeed}/100` }
  } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Ошибка сети' } }
}
export type ReportVersion = { id: string; report: Record<string, unknown>; created_at: string; created_by: string | null }
export async function loadVersions(checkId: string): Promise<ReportVersion[]> {
  const { data } = await (await db()).from('check_reports').select('id, report, created_at, created_by').eq('check_id', checkId).order('created_at', { ascending: false })
  return (data ?? []) as ReportVersion[]
}
/** Neue Version veröffentlichen: checks.report + Eintrag im Archiv. Wer veröffentlicht, übernimmt eine freie Anfrage. */
export async function publishVersion(c: Check, report: object): Promise<object | null> {
  const s = await db()
  const assignee_id = c.assignee_id ?? await myId()
  const { error } = await s.from('checks').update({ report, status: 'ready', assignee_id }).eq('id', c.id)
  if (error) return null
  await s.from('check_reports').insert({ check_id: c.id, user_id: c.user_id, report })
  return report
}
