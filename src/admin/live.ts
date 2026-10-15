import { useEffect, useRef, useState } from 'react'
import { getSupabase } from '../check/data'

// ── Живое обновление админки (Supabase Realtime) ─────────────────────────────
// Один общий канал на все таблицы. Компоненты подписываются через useLive(match, onChange)
// и сами решают, какие изменения им интересны. Права те же, что у обычных запросов (RLS).
// Подстраховка: при возврате на вкладку и при переподключении — полная пересинхронизация,
// а если Realtime недоступен — опрос раз в 30 секунд.

export type Change = { table: string; row: Record<string, unknown> }
export type LiveStatus = 'connecting' | 'live' | 'offline'

const TABLES = ['leads', 'orders', 'checks', 'profiles', 'messages', 'notes', 'activity', 'offers', 'appointments', 'projects', 'check_reports', 'staff_invites', 'prospects']
const RESYNC: Change = { table: '*', row: {} }

const listeners = new Set<(c: Change) => void>()
const statusListeners = new Set<(s: LiveStatus) => void>()
let status: LiveStatus = 'connecting'
let stop: (() => void) | null = null

const emit = (c: Change) => listeners.forEach(l => l(c))
const setStatus = (s: LiveStatus) => { status = s; statusListeners.forEach(l => l(s)) }

async function start() {
  if (stop) return
  let alive = true, wasLive = false, poll: number | undefined
  stop = () => { alive = false }
  const s = await getSupabase()
  if (!alive) return
  let ch = s.channel('admin-live')
  for (const table of TABLES) {
    ch = ch.on('postgres_changes', { event: '*', schema: 'public', table }, p => {
      const n = p.new as Record<string, unknown> | null
      emit({ table, row: n && Object.keys(n).length ? n : ((p.old as Record<string, unknown>) ?? {}) })
    })
  }
  ch.subscribe(st => {
    if (st === 'SUBSCRIBED') {
      if (poll) { clearInterval(poll); poll = undefined }
      if (wasLive || status === 'offline') emit(RESYNC) // пропущенное, пока не было связи
      wasLive = true; setStatus('live')
    } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT' || st === 'CLOSED') {
      setStatus('offline')
      if (!poll && alive) poll = window.setInterval(() => emit(RESYNC), 30_000)
    }
  })
  const onVisible = () => { if (document.visibilityState === 'visible') emit(RESYNC) }
  document.addEventListener('visibilitychange', onVisible)
  stop = () => {
    alive = false
    if (poll) clearInterval(poll)
    document.removeEventListener('visibilitychange', onVisible)
    void s.removeChannel(ch)
    setStatus('connecting')
  }
}

/** Вызвать при выходе из админки. */
export function stopLive() { stop?.(); stop = null }

/** onChange вызывается (с задержкой, пачкой), когда приходит изменение, для которого match → true. Пересинхронизация задевает всех. */
export function useLive(match: (c: Change) => boolean, onChange: () => void, delay = 350) {
  const ref = useRef({ match, onChange })
  ref.current = { match, onChange }
  useEffect(() => {
    let t: number | undefined
    const l = (c: Change) => {
      if (c.table !== '*' && !ref.current.match(c)) return
      clearTimeout(t)
      t = window.setTimeout(() => ref.current.onChange(), delay)
    }
    listeners.add(l)
    void start()
    return () => { listeners.delete(l); clearTimeout(t) }
  }, [delay])
}

export function useLiveStatus(): LiveStatus {
  const [s, set] = useState(status)
  useEffect(() => { statusListeners.add(set); set(status); return () => { statusListeners.delete(set) } }, [])
  return s
}
