import { createClient } from '@supabase/supabase-js'

// Öffentliche Projektdaten (Publishable Key darf im Browser stehen — Schutz über RLS).
// Überschreibbar per VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (z. B. in Vercel).
// Den service_role / secret key NIE hier eintragen.
const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://bmajnndqvpemerecvjfz.supabase.co'
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'sb_publishable_iWKGRZQGMLy1Msm_juKdJg_VW9Wpwtx'

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
