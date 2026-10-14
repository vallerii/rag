// POST { record: <Zeile aus public.activity> }  (Header x-notify-secret = Secret NOTIFY_SECRET)
// Aufgerufen vom Trigger activity_notify (supabase/notify.sql). Verschickt E-Mails über Brevo:
//   Team:  neue Anfrage (Check, Paket, Fragebogen), Nachricht vom Kunden, Angebot angenommen.
//          Ohne zugeteilten Ansprechpartner an alle Admins und Manager (profiles.role), sonst nur an den Ansprechpartner.
//          TEAM_EMAIL ist nur die Reserve, falls es keine Admins/Manager mit E-Mail gibt.
//   Kunde: Nachricht vom Team, Ansprechpartner zugeteilt, Bericht fertig, Angebot, Termin, Projektstatus, Rechnung.
// Chat-Nachrichten: höchstens eine E-Mail pro Empfänger in MESSAGE_PAUSE_MIN Minuten (Standard 15).
// Automatische Begrüßungen (Trigger greet_new_*) lösen keine E-Mail aus.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SERVER_KEY = Deno.env.get('SB_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SERVER_KEY, { auth: { persistSession: false } })

const BREVO_KEY = Deno.env.get('BREVO_API_KEY') ?? ''
const SECRET = Deno.env.get('NOTIFY_SECRET') ?? ''
const FROM_EMAIL = Deno.env.get('MAIL_FROM_EMAIL') ?? 'tools@agenturro.co'
const FROM_NAME = Deno.env.get('MAIL_FROM_NAME') ?? 'RAG'
const TEAM_EMAIL = Deno.env.get('TEAM_EMAIL') ?? ''
const SITE = (Deno.env.get('SITE_URL') ?? 'https://rag-theta-one.vercel.app').replace(/\/$/, '')
const MESSAGE_PAUSE_MIN = Number(Deno.env.get('MESSAGE_PAUSE_MIN') ?? 15)

type Activity = { id: string; client_key: string; kind: string; detail: Record<string, unknown> | null; actor: string | null; created_at: string }
type Person = { email: string; name: string }
type Mail = { to: Person; subject: string; title: string; lines: string[]; cta: { label: string; href: string }; pause?: { kind: string; minutes: number } }

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

/** Alle Admins und Manager mit E-Mail; ohne sie die Reserveadresse TEAM_EMAIL. */
async function staff(): Promise<Person[]> {
  const { data } = await db.from('profiles').select('email, name').in('role', ['admin', 'manager'])
  const seen = new Set<string>()
  const list = (data ?? []).filter(p => p.email && !seen.has(p.email.toLowerCase()) && seen.add(p.email.toLowerCase()))
    .map(p => ({ email: p.email as string, name: (p.name as string) ?? '' }))
  return list.length ? list : TEAM_EMAIL ? [{ email: TEAM_EMAIL, name: 'RAG-Team' }] : []
}

async function profile(id: unknown): Promise<(Person & { role: string }) | null> {
  if (typeof id !== 'string' || !id) return null
  const { data } = await db.from('profiles').select('email, name, role').eq('id', id).maybeSingle()
  return data?.email ? { email: data.email, name: data.name ?? '', role: data.role ?? 'client' } : null
}

/** Kunde (E-Mail, Name), Firmenname und zuständiger Ansprechpartner zu einem client_key. */
async function clientInfo(key: string): Promise<{ person: Person | null; company: string; assignee: Person | null }> {
  if (key.startsWith('lead:')) {
    const { data } = await db.from('leads').select('email, assignee_id').eq('id', key.slice(5)).maybeSingle()
    return { person: data?.email ? { email: data.email, name: '' } : null, company: '', assignee: await profile(data?.assignee_id) }
  }
  if (!key.startsWith('user:')) return { person: null, company: '', assignee: null }
  const uid = key.slice(5)
  const [p, c, o, l] = await Promise.all([
    profile(uid),
    db.from('checks').select('place, assignee_id, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
    db.from('orders').select('details, assignee_id, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
    db.from('leads').select('assignee_id, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
  ])
  // deno-lint-ignore no-explicit-any
  const rows: any[] = [...(c.data ?? []), ...(o.data ?? []), ...(l.data ?? [])]
  const company = str(c.data?.[0]?.place?.name) || str(o.data?.[0]?.details?.company)
  const latest = rows.filter(r => r.assignee_id).sort((a, b) => str(b.created_at).localeCompare(str(a.created_at)))[0]
  return { person: p ? { email: p.email, name: p.name } : null, company, assignee: await profile(latest?.assignee_id) }
}

const when = (v: unknown) => {
  const d = new Date(str(v))
  return isNaN(d.getTime()) ? '' : d.toLocaleString('de-DE', { timeZone: 'Europe/Berlin', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + ' Uhr'
}

async function mailsFor(a: Activity): Promise<Mail[]> {
  const d = a.detail ?? {}
  const info = await clientInfo(a.client_key)
  const who = [info.person?.name, info.company].filter(Boolean).join(' · ') || info.person?.email || 'Ein neuer Kontakt'
  const team = await staff()
  const responsible = info.assignee ? [info.assignee] : team
  const out: Mail[] = []
  const toTeam = (to: Person[], subject: string, title: string, lines: string[], pause?: Mail['pause']) => {
    for (const p of to) out.push({ to: p, subject, title, lines, cta: { label: 'Im Admin öffnen', href: `${SITE}/rag-intern` }, pause })
  }
  const client = info.person
  const hello = client?.name ? `Hallo ${client.name.split(' ')[0]},` : 'Hallo,'
  const toClient = (subject: string, title: string, lines: string[], hash = '', pause?: Mail['pause']) => {
    if (client && a.client_key.startsWith('user:')) out.push({ to: client, subject, title, lines: [hello, ...lines], cta: { label: 'Zum Kundenbereich', href: `${SITE}/kabinett${hash}` }, pause })
  }

  switch (a.kind) {
    // ── an das Team ──
    case 'check_created':
      toTeam(team, `Neue Anfrage: Sichtbarkeits-Check${d.name ? ` ${str(d.name)}` : ''}`, 'Neue Anfrage: Sichtbarkeits-Check',
        [`${who} hat einen Sichtbarkeits-Check angefragt${d.name ? ` für ${str(d.name)}` : ''}.`, 'Bitte übernehmen Sie die Anfrage im Admin.'])
      break
    case 'order_created': {
      // deno-lint-ignore no-explicit-any
      const items = Array.isArray(d.items) ? (d.items as any[]).map(i => str(i?.name)).filter(Boolean).join(' + ') : ''
      toTeam(team, `Neue Paket-Anfrage${items ? `: ${items}` : ''}`, 'Neue Paket-Anfrage',
        [`${who} hat ${items || 'ein Paket'} angefragt.`, 'Bitte übernehmen Sie die Anfrage im Admin.'])
      break
    }
    case 'lead_created':
      toTeam(team, 'Neue Anfrage aus dem Fragebogen', 'Neue Anfrage aus dem Fragebogen',
        [`${info.person?.email ?? 'Ein Besucher'} hat den Fragebogen ausgefüllt${d.from ? ` (Seite ${str(d.from)})` : ''}.`, 'Die Antworten sehen Sie im Admin.'])
      break
    case 'offer_accepted':
      toTeam(responsible, `Angebot angenommen: ${who}`, 'Angebot angenommen',
        [`${who} hat das Angebot angenommen.`, 'Jetzt können Sie die Rechnung stellen und den Start planen.'])
      break
    case 'message':
      if (d.author === 'client') {
        toTeam(responsible, `Neue Nachricht von ${who}`, 'Neue Nachricht im Kundenbereich', [`${who} hat Ihnen geschrieben.`], { kind: 'message', minutes: MESSAGE_PAUSE_MIN })
      } else {
        const actor = await profile(a.actor)
        if (actor && actor.role !== 'client') { // nur echte Nachrichten aus dem Team, keine automatische Begrüßung
          toClient('Neue Nachricht von Ihrem Ansprechpartner', 'Sie haben eine neue Nachricht',
            [`${actor.name || 'Ihr Ansprechpartner'} hat Ihnen im Kundenbereich geschrieben.`], '#messages', { kind: 'message', minutes: MESSAGE_PAUSE_MIN })
        }
      }
      break

    // ── an den Kunden ──
    case 'assigned': {
      if (!d.to) break
      const m = await profile(d.to)
      const name = m?.name || 'ein Ansprechpartner aus unserem Team'
      toClient('Ihr persönlicher Ansprechpartner', `${m?.name || 'Ihr Ansprechpartner'} betreut Ihre Anfrage`,
        [`ab jetzt betreut ${name} Ihre Anfrage persönlich.`, 'Fragen können Sie jederzeit im Kundenbereich stellen.'], '', { kind: 'assigned', minutes: 60 })
      break
    }
    case 'report_published':
      toClient('Ihr Bericht ist fertig', 'Die Analyse ist abgeschlossen',
        ['wir haben die Analyse Ihres Unternehmens abgeschlossen. Ihr Bericht mit Bewertung und Empfehlungen liegt im Kundenbereich.'], '#report')
      break
    case 'offer_sent':
      toClient('Ihr Angebot ist da', 'Ihr Angebot ist da', ['wir haben ein Angebot für Ihr Unternehmen zusammengestellt. Sie finden es im Kundenbereich.'], '#offer')
      break
    case 'appointment':
      toClient('Ihr Termin', 'Termin eingetragen', [`Ihr Termin „${str(d.title) || 'Gespräch'}“ ist für ${when(d.at)} eingetragen.`], '#termine')
      break
    case 'appointment_changed':
      if (d.status === 'cancelled') toClient('Termin abgesagt', 'Termin abgesagt', [`Ihr Termin „${str(d.title) || 'Gespräch'}“ am ${when(d.at)} wurde abgesagt.`], '#termine')
      else if (d.status === 'planned') toClient('Termin geändert', 'Neuer Termin', [`Ihr Termin „${str(d.title) || 'Gespräch'}“ ist jetzt für ${when(d.at)} eingetragen.`], '#termine')
      break
    case 'project': {
      const s = str(d.status)
      if (s === 'paid') toClient('Zahlung eingegangen', 'Danke, Ihre Zahlung ist eingegangen', ['wir haben Ihre Zahlung erhalten und bereiten den Start vor.'])
      else if (s === 'in_progress') toClient('Wir arbeiten an Ihrem Projekt', 'Die Umsetzung hat begonnen', ['wir haben mit der Umsetzung begonnen. Den Stand sehen Sie jederzeit im Kundenbereich.'])
      else if (s === 'result') toClient('Ihr Ergebnis ist da', 'Ihr Ergebnis ist da', ['die Arbeit ist erledigt. Das Ergebnis sehen Sie im Kundenbereich.'], '#ergebnis')
      else if (s === 'support' || s === 'done') toClient('Projekt abgeschlossen', 'Ihr Projekt ist abgeschlossen', ['Ihr Projekt ist abgeschlossen. Danke für die Zusammenarbeit!'])
      break
    }
    case 'invoice_sent': {
      const amount = typeof d.amount === 'number' ? ` über ${d.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}` : ''
      toClient('Ihre Rechnung', 'Ihre Rechnung ist da', [`die Rechnung${d.number ? ` Nr. ${str(d.number)}` : ''}${amount} liegt im Kundenbereich.`])
      break
    }
  }
  // Satzanfang nach der Anrede groß schreiben
  for (const m of out) m.lines = m.lines.map((l, i) => (i === 1 && m.lines[0].startsWith('Hallo') ? l.charAt(0).toUpperCase() + l.slice(1) : l))
  return out
}

function html(m: Mail): string {
  const p = m.lines.map(l => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2B2A3A">${esc(l)}</p>`).join('')
  return `<!doctype html><html lang="de"><body style="margin:0;padding:0;background:#F4F3FA;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3FA;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;padding:32px">
<tr><td style="font-size:20px;font-weight:800;color:#0B0B1A;padding-bottom:22px">RAG<span style="color:#2600FF">.</span></td></tr>
<tr><td><h1 style="margin:0 0 18px;font-size:22px;line-height:1.25;color:#0B0B1A">${esc(m.title)}</h1>${p}
<a href="${esc(m.cta.href)}" style="display:inline-block;margin-top:8px;background:#2600FF;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:12px">${esc(m.cta.label)}</a></td></tr>
<tr><td style="padding-top:28px;font-size:12px;line-height:1.6;color:#8A88A0">Diese E-Mail wurde automatisch versendet. Bitte antworten Sie im Kundenbereich, damit Ihre Nachricht direkt bei Ihrem Ansprechpartner ankommt.<br>RAG · <a href="${esc(SITE)}" style="color:#8A88A0">${esc(SITE.replace(/^https?:\/\//, ''))}</a></td></tr>
</table></td></tr></table></body></html>`
}
const text = (m: Mail) => [m.title, '', ...m.lines, '', `${m.cta.label}: ${m.cta.href}`].join('\n')

async function log(a: Activity, to: string, kind: string, status: 'sent' | 'skipped' | 'error', error?: string) {
  await db.from('notify_log').insert({ activity_id: a.id, recipient: to, kind, client_key: a.client_key, status, error: error?.slice(0, 500) ?? null })
}

async function pausing(to: string, kind: string, minutes: number): Promise<boolean> {
  const since = new Date(Date.now() - minutes * 60_000).toISOString()
  const { count } = await db.from('notify_log').select('id', { count: 'exact', head: true })
    .eq('recipient', to).eq('kind', kind).eq('status', 'sent').gte('created_at', since)
  return (count ?? 0) > 0
}

async function send(m: Mail, a: Activity) {
  const kind = m.pause?.kind ?? a.kind
  if (m.pause && await pausing(m.to.email, m.pause.kind, m.pause.minutes)) return log(a, m.to.email, kind, 'skipped', 'pause')
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: m.to.email, ...(m.to.name ? { name: m.to.name } : {}) }],
      subject: m.subject, htmlContent: html(m), textContent: text(m), tags: ['rag-kabinett', a.kind],
    }),
  }).catch(e => e as Error)
  if (res instanceof Error) return log(a, m.to.email, kind, 'error', res.message)
  if (!res.ok) return log(a, m.to.email, kind, 'error', `HTTP ${res.status} ${await res.text().catch(() => '')}`)
  return log(a, m.to.email, kind, 'sent')
}

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('method', { status: 405 })
  if (!SECRET || req.headers.get('x-notify-secret') !== SECRET) return new Response('forbidden', { status: 403 })
  if (!BREVO_KEY) return new Response('BREVO_API_KEY fehlt', { status: 500 })
  const body = await req.json().catch(() => ({}))
  const a = (body?.record ?? body) as Activity
  if (!a?.kind || !a?.client_key) return Response.json({ ok: true, skipped: 'leer' })
  try {
    const mails = await mailsFor(a)
    for (const m of mails) await send(m, a)
    return Response.json({ ok: true, mails: mails.length })
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
})
