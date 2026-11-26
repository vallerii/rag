// MCP-Server für Grok (docs/lead-flow.md, Etappe 8). Adresse für den Grok-Connector:
//   https://bmajnndqvpemerecvjfz.supabase.co/functions/v1/grok-mcp?key=<GROK_MCP_KEY>
// (oder Header «Authorization: Bearer <GROK_MCP_KEY>», falls Grok ein Feld dafür anbietet).
// Werkzeuge:
//   ping                    → Verbindungstest
//   list_pending_analyses   → Firmen, die auf eine Analyse warten (ohne E-Mail, Name und Telefon des Kunden),
//                             mit dem, was die Autoprüfung schon weiß; die Firmen gehen auf «in_progress»
//   save_analysis           → Analyse EINER Firma speichern (nur Felder von Grok — Bewertungen, Google Maps, Technik
//                             der Website gehören der Autoprüfung), Bericht veröffentlichen, E-Mail an den Kunden
// Nicht der offizielle Supabase-MCP (der hätte Zugriff auf das ganze Projekt). Jeder Aufruf → grok_mcp_log.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleHttp, type Tool } from '../_shared/mcp.ts'
import { companyInfo, parseResults, saveAnalysis, TASK_RULES, type QueueCheck } from '../_shared/manual.ts'

const SERVER_KEY = Deno.env.get('SB_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SERVER_KEY, { auth: { persistSession: false } })
const SECRET = Deno.env.get('GROK_MCP_KEY') ?? ''

// Eingabefelder → Spalten wie in den Lead-Tabellen
const FIELDS: Record<string, [string, string]> = {
  befund_google_profil: ['Befund Google-Profil', 'Nur Punkte, die NICHT schon automatisch geprüft sind: Inhaber bestätigt, Antworten auf Bewertungen, Verzeichnisse (Name, Adresse, Telefon gleich?). Eine Zeile je Befund, beginnend mit «+ », «~ » oder «– », auf Deutsch, bis 140 Zeichen.'],
  befund_website: ['Befund Website', 'Nur nicht automatisch geprüfte Punkte: Seiten je Leistung und Ort, Antworten auf Kundenfragen, Aktualität. Zeilen mit «+ », «~ », «– ».'],
  befund_social_media: ['Befund Social Media', 'Instagram, Facebook …: vorhanden, letzter Beitrag, Kontaktdaten wie bei Google. Zeilen mit «+ », «~ », «– ».'],
  befund_ki_suche: ['Befund KI-Suche', 'Wird die Firma in KI-Antworten genannt, stimmen die Daten? Zeilen mit «+ », «~ », «– ».'],
  platz_google_suche: ['Platz Google-Suche', 'Platz der eigenen Website in der normalen Google-Suche zum Suchbegriff: Zahl, «nicht unter den ersten 10» oder «–».'],
  ki_antworten: ['KI-Antworten', 'Je Frage eine Zeile: «Frage — Platz N» oder «Frage — nicht genannt».'],
  verzeichnisse: ['Verzeichnisse', 'Je Verzeichnis eine Zeile: «Gelbe Seiten — vorhanden | abweichend (…) | fehlt».'],
  empfehlungen: ['Empfehlungen', 'Genau 3 Zeilen «Titel — kurze Erklärung», das Wichtigste zuerst, ohne Preise.'],
  belege: ['Belege', 'Nachweise für das Team: was gesehen, Link, Datum (G1) … W1) … S1) … K1) …). Der Kunde sieht das nicht.'],
}

async function log(tool: string, ok: boolean, detail: string, checkId: string | null = null) {
  await db.from('grok_mcp_log').insert({ tool, ok, detail, check_id: checkId })
}

const tools: Tool[] = [
  {
    name: 'ping',
    description: 'Verbindungstest. Antwortet mit «pong» und der Serverzeit.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async () => ({ pong: true, time: new Date().toISOString() }),
  },
  {
    name: 'list_pending_analyses',
    description: 'Firmen, die auf eine vollständige Analyse warten (älteste zuerst). Gibt die Regeln, die Firmen und je Firma die schon automatisch geprüften Punkte zurück. Die Firmen sind danach 2 Stunden für dich reserviert. Danach für jede Firma save_analysis aufrufen. Leere Liste = nichts zu tun.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 10, description: 'Wie viele Firmen (Standard 5)' } }, additionalProperties: false },
    run: async args => {
      const limit = Math.min(10, Math.max(1, Number(args.limit ?? 5) || 5))
      const { data } = await db.from('checks').select('id, place, report_draft, audit, analysis_status')
        .eq('analysis_status', 'pending').order('created_at').limit(limit)
      const list = (data ?? []) as QueueCheck[]
      if (list.length) await db.from('checks').update({ analysis_status: 'in_progress', analysis_taken_at: new Date().toISOString() }).in('id', list.map(c => c.id)).eq('analysis_status', 'pending')
      return { rules: TASK_RULES, companies: list.map(companyInfo), count: list.length }
    },
  },
  {
    name: 'save_analysis',
    description: 'Analyse EINER Firma aus list_pending_analyses speichern. Nur Punkte, die nicht schon automatisch geprüft sind. Der Bericht wird sofort veröffentlicht und der Kunde bekommt eine E-Mail.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'id aus list_pending_analyses' }, ...Object.fromEntries(Object.entries(FIELDS).map(([k, [, d]]) => [k, { type: 'string', description: d }])) },
      required: ['id'],
      additionalProperties: false,
    },
    run: async args => {
      const id = String(args.id ?? '')
      const { data: c } = await db.from('checks').select('analysis_status').eq('id', id).maybeSingle()
      if (c?.analysis_status !== 'in_progress') throw new Error('Diese Firma ist nicht für dich reserviert (erst list_pending_analyses aufrufen).')
      const row: Record<string, unknown> = { id }
      for (const [k, [col]] of Object.entries(FIELDS)) if (typeof args[k] === 'string') row[col] = args[k]
      const { results, errors } = parseResults(JSON.stringify([row]))
      if (!results.length) throw new Error(errors.join('; ') || 'Keine gültige Analyse')
      const r = await saveAnalysis(db, results[0], 'grok')
      await log('save_analysis', r.ok, r.reason ?? 'gespeichert', id)
      if (!r.ok) throw new Error(r.reason ?? 'Speichern fehlgeschlagen')
      return { saved: true, id, note: r.reason ?? 'Bericht veröffentlicht, Kunde benachrichtigt' }
    },
  },
]

// save_analysis protokolliert Erfolge selbst (mit der Prüfung); Fehler und alle anderen Aufrufe hier.
Deno.serve(req => handleHttp(req, SECRET, tools, (tool, ok, detail) => tool === 'save_analysis' && ok ? Promise.resolve() : log(tool, ok, detail)))
