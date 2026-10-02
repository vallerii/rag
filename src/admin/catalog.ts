// Bausteine für Angebote im Admin. Preise wie auf /preise (Stand 25.09.2026) — im Angebot änderbar.
export type Unit = 'einmalig' | 'pro Monat'
export type OfferItem = { id: string; name: string; description?: string; price: number; unit: Unit; custom?: boolean }
export type CatalogItem = OfferItem & { group: string }

export const CATALOG: CatalogItem[] = [
  { group: 'Google', id: 'profile', name: 'Google-Profil schlüsselfertig', price: 149, unit: 'einmalig' },
  { group: 'Website', id: 'onepager', name: 'One Pager', price: 30, unit: 'pro Monat' },
  { group: 'Website', id: 'local', name: 'Local Website', price: 299, unit: 'pro Monat' },
  { group: 'Website', id: 'aiplus', name: 'AI Plus', price: 499, unit: 'pro Monat' },
  { group: 'Social Media', id: 'social-instagram', name: 'Social Media: Instagram', price: 199, unit: 'pro Monat' },
  { group: 'Social Media', id: 'social-facebook', name: 'Social Media: Facebook', price: 199, unit: 'pro Monat' },
  { group: 'Social Media', id: 'social-tiktok', name: 'Social Media: TikTok', price: 199, unit: 'pro Monat' },
  { group: 'Social Media', id: 'social-linkedin', name: 'Social Media: LinkedIn', price: 199, unit: 'pro Monat' },
]

export function totals(items: OfferItem[]): string {
  const once = items.filter(i => i.unit === 'einmalig').reduce((a, i) => a + (Number(i.price) || 0), 0)
  const monthly = items.filter(i => i.unit === 'pro Monat').reduce((a, i) => a + (Number(i.price) || 0), 0)
  return [once ? `${once} € разово` : '', monthly ? `${monthly} € в месяц` : ''].filter(Boolean).join(' + ') || '—'
}
