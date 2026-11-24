import { useEffect, useState } from 'react'
import './home.css'
import AiSection from './AiSection'
import ChannelStory from './ChannelStory'
import CheckReport from './CheckReport'
import Hero from './Hero'
import MapsSection from './MapsSection'
import OfferBand from './OfferBand'
import Overview from './Overview'
import SearchTimeline from './SearchTimeline'
import SiteHeader from './SiteHeader'
import SocialStory from './SocialStory'
import { Arrow, ThemeIcon } from './icons'

// Startseite im Recto-Stil (Design + Texte aus codex/rag-style-exploration).
// Stilbeschreibung mit Farben, Schrift, Bewegung und Interaktionen: DESIGN.md im Projektordner.

export const HOME_FAQ: { q: string; a: string }[] = [
  { q: 'Wie schnell verbessert sich meine lokale Sichtbarkeit?', a: 'Nach der Arbeit an Profil und Verzeichnissen zeigen sich erste Veränderungen bei Aufrufen und Anrufen häufig innerhalb weniger Wochen. Bewertungen, Website-Inhalte und KI-Sichtbarkeit bauen sich über Monate auf. Wir messen von Anfang an, damit Sie sehen, was sich bewegt.' },
  { q: 'Können Sie Platz 1 bei Google garantieren?', a: 'Nein. Und niemand kann das seriös versprechen. Google bewertet lokale Ergebnisse unter anderem nach Relevanz, Entfernung zum Suchenden und Bekanntheit des Unternehmens. Auf einen Teil davon haben wir direkten Einfluss, auf anderes nicht. Was wir zusagen: Wir bringen alle beeinflussbaren Faktoren in Ordnung, arbeiten kontinuierlich daran und zeigen Ihnen an konkreten Zahlen, was sich bewegt.' },
  { q: 'Brauche ich unbedingt eine Website?', a: 'Für den Start nicht zwingend. Ein vollständig gepflegtes Google-Unternehmensprofil kann die erste Grundlage sein. Sobald Sie mehrere Leistungen, mehrere Regionen oder erklärungsbedürftige Angebote haben, wird die Website aber zur Wissensbasis, aus der Google und KI-Systeme ihre Antworten über Sie ziehen.' },
  { q: 'Können Sie meine bestehende Website optimieren?', a: 'In den meisten Fällen ja. Wir prüfen Struktur, Inhalte und Technik Ihrer bestehenden Website und verbessern gezielt das, was Sichtbarkeit und Anfragen blockiert. Nur wenn die technische Basis eine sinnvolle Weiterentwicklung nicht zulässt, empfehlen wir einen Neuaufbau.' },
  { q: 'Wie bekomme ich mehr Google-Bewertungen?', a: 'Indem Sie zu einem festen Zeitpunkt fragen, am besten direkt nach einem gelungenen Auftrag, den Weg zur Abgabe so kurz wie möglich machen und auf Bewertungen antworten. Gekaufte oder erfundene Bewertungen verstoßen gegen die Google-Richtlinien und können zur Sperrung des Profils führen. Wir richten einen Ablauf ein, der echte Bewertungen mit konkreten Erfahrungen bringt.' },
  { q: 'Wie kann mein Unternehmen in ChatGPT erscheinen?', a: 'Indem die Informationen über Ihr Unternehmen im Web klar, zugänglich und widerspruchsfrei sind: verständlich beschriebene Leistungen, eine logisch strukturierte Website, übereinstimmende Angaben auf allen Plattformen, externe Erwähnungen und Inhalte, die für Suchsysteme abrufbar sind. Eine separate "KI-Optimierung" jenseits sauberer Grundlagen gibt es nicht, wir sorgen dafür, dass diese Grundlagen stimmen.' },
  { q: 'Was kostet die laufende Betreuung?', a: 'Die Website gibt es als monatliches Paket: One Pager für 30 €, Local Website für 299 € und AI Plus für 499 € im Monat. Die Social-Media-Betreuung kostet 199 € im Monat, zusätzlich zu einem Paket oder ganz allein. Nur das Google-Unternehmensprofil einzurichten kostet einmalig 149 €. Nach dem kostenlosen Sichtbarkeits-Check erhalten Sie eine Empfehlung, die zu Ihrer Situation und Ihrem Budget passt, ohne versteckte Gebühren.' },
  { q: 'Für welche Unternehmen eignet sich lokale Optimierung?', a: 'Für alle, deren Kunden aus der Umgebung kommen: Handwerksbetriebe, Werkstätten, Praxen, Kanzleien, Restaurants, Salons und Dienstleister mit Servicegebiet. Entscheidend ist nicht die Branche, sondern dass Kunden lokal suchen, ob Sie ein Ladengeschäft haben oder zu Ihren Kunden fahren.' },
]

const THEME_KEY = 'rag-recto-theme'

export default function HomePage({ children, headerMenu }: { children?: React.ReactNode; headerMenu?: React.ReactNode }) {
  // Hell/Dunkel nur auf der Startseite; die Wahl wird gespeichert.
  const [dark, setDark] = useState(false)
  useEffect(() => {
    try { setDark(localStorage.getItem(THEME_KEY) === 'dark') } catch { /* Speicher gesperrt */ }
  }, [])
  const toggleTheme = () => setDark(d => {
    try { localStorage.setItem(THEME_KEY, d ? 'light' : 'dark') } catch { /* ignore */ }
    return !d
  })

  return (
    <div className="rx" data-theme={dark ? 'dark' : 'light'}>
      {children}
      <SiteHeader home menu={headerMenu} />
      <main id="inhalt">
        <Hero />
        <Overview />
        <AiSection />
        <MapsSection />
        <OfferBand />
        <SearchTimeline />
        <SocialStory />
        <ChannelStory />
        <CheckReport />
        <section className="rx-faq rx-container" id="faq" aria-labelledby="rx-faq-title">
          <div>
            <h2 id="rx-faq-title">Gute Fragen.<br /><em>Klare Antworten.</em></h2>
          </div>
          <div className="rx-faq-list">
            {HOME_FAQ.map((f, i) => (
              <details key={f.q} name="rx-faq" open={i === 0}>
                <summary>{f.q}<span aria-hidden="true">+</span></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="rx-closing rx-container">
          <div className="rx-closing-glow" aria-hidden="true" />
          <h2>Ihre Region sucht.<br /><em>Sorgen wir dafür, dass sie Sie findet.</em></h2>
          <a className="rx-button rx-primary" href="#unternehmen">Sichtbarkeit kostenlos prüfen <Arrow /></a>
        </section>
      </main>
      <footer className="rx-footer rx-container">
        <button className="rx-theme" type="button" onClick={toggleTheme} aria-label={dark ? 'Helle Ansicht aktivieren' : 'Dunkle Ansicht aktivieren'} aria-pressed={dark}>
          <ThemeIcon dark={dark} />
        </button>
        <a className="rx-logo" href="/">RAG<span>.</span></a>
        <div>
          <a href="/preise">Preise</a>
          <a href="/ratgeber">Ratgeber</a>
          <a href="/glossar">Glossar</a>
          <a href="#faq">FAQ</a>
          <a href="/impressum">Impressum</a>
          <a href="/datenschutz">Datenschutz</a>
          <a href="/agb">AGB</a>
        </div>
      </footer>
    </div>
  )
}
