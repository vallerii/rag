// Zentrale Einstellungen der Website.

/**
 * Link zur Terminbuchung (z. B. Google Calendar «Terminplan»).
 * Setzen per Umgebungsvariable VITE_BOOKING_URL (.env.local und Vercel) — oder hier direkt eintragen.
 * Solange es kein http(s)-Link ist, gilt die Buchung als Platzhalter.
 */
export const BOOKING_URL: string = (import.meta.env.VITE_BOOKING_URL as string | undefined)?.trim() || '#termin-platzhalter'
export const BOOKING_READY = /^https?:\/\//.test(BOOKING_URL)
