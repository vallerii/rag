import AccountStep from './AccountStep'
import { Logo, useNoindex } from './CheckPage'
import { createOrder, orderTotal, type OrderItem } from './data'

// /anfrage?pkg=onepager|local|aiplus|profile&social=1 — Paket-Anfrage, Schritt 2 von 2.
// Schritt 1 ist das Auswahlfenster (Preise / Startseite / Leistungsseiten).
// Hier: Konto anlegen oder anmelden → Anfrage speichern → Kundenbereich (dort Angaben zum Unternehmen).

export default function OrderPage({ items }: { items: OrderItem[] }) {
  useNoindex('Paket anfragen | RAG')
  const from = new URLSearchParams(window.location.search).get('from')

  const createAndGo = async (): Promise<string | null> => {
    const id = await createOrder(items, from)
    if (!id) return 'Das Speichern hat nicht geklappt. Bitte versuchen Sie es noch einmal.'
    window.location.href = '/kabinett?welcome=1'
    return null
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bone)' }}>
      <header style={{ borderBottom: '1px solid var(--line)', backgroundColor: 'rgba(241,240,235,0.9)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 clamp(20px, 4vw, 48px)', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Logo />
          <p className="eyebrow ck-hide-sm" style={{ color: 'var(--muted)' }}>Paket anfragen</p>
          <a href="/preise" className="ul" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Abbrechen</a>
        </div>
        <div style={{ height: 3, backgroundColor: 'var(--line-soft)' }}>
          <div style={{ height: '100%', width: '100%', backgroundColor: 'var(--electric)' }} />
        </div>
      </header>

      <main id="inhalt" className="ck-grid" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(28px, 5vw, 64px) clamp(20px, 4vw, 48px) 96px' }}>
        <aside style={{ backgroundColor: 'var(--ink)', color: '#fff', borderRadius: 26, padding: 'clamp(24px, 3vw, 34px)', alignSelf: 'start', position: 'relative', overflow: 'hidden' }}>
          <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
              <p className="eyebrow" style={{ color: 'var(--electric-2)' }}>Ihre Auswahl</p>
              <a href="/preise" className="ul" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Ändern</a>
            </div>
            {items.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderTop: '1px solid var(--line-dark)' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{i.name}</span>
                <span style={{ whiteSpace: 'nowrap', fontSize: 15 }}><strong>{i.price} €</strong> <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>{i.unit}</span></span>
              </div>
            ))}
            {items.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '14px 0 0', borderTop: '1px solid rgba(255,255,255,0.3)', fontSize: 14 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Gesamt</span><strong style={{ textAlign: 'right' }}>{orderTotal(items)}</strong>
              </div>
            )}
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', margin: '20px 0 0' }}>
              Noch keine Bestellung. Nach dem Absenden rufen wir Sie an und besprechen alles persönlich — erst dann entstehen Kosten.
            </p>
          </div>
        </aside>

        <section style={{ backgroundColor: '#fff', borderRadius: 26, padding: 'clamp(24px, 4vw, 48px)', boxShadow: '0 30px 70px rgba(7,7,12,0.06)', minWidth: 0 }}>
          {items.length === 0 ? (
            <>
              <h1 className="display" style={{ fontSize: 'clamp(26px, 3vw, 36px)', margin: '0 0 12px' }}>Kein Paket gewählt</h1>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: '0 0 24px' }}>Wählen Sie zuerst ein Paket auf der Preisseite.</p>
              <a href="/preise" className="btn btn-lg btn-electric">Zu den Paketen <span className="arw">→</span></a>
            </>
          ) : (
            <>
              <p className="eyebrow" style={{ color: 'var(--electric)', marginBottom: 12 }}>Schritt 2 von 2</p>
              <h1 className="display" style={{ fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.08, margin: '0 0 12px' }}>Ihr Kundenbereich</h1>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: '0 0 26px', maxWidth: 540 }}>
                Legen Sie ein Konto an oder melden Sie sich an. Im Kundenbereich ergänzen Sie kurz die Angaben zu Ihrem Unternehmen und sehen, wie es weitergeht.
              </p>
              <AccountStep submitLabel="Anfrage senden" onAuthed={createAndGo} />
            </>
          )}
        </section>
      </main>
    </div>
  )
}
