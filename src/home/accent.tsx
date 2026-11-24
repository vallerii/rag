import { Fragment } from 'react'

// Markenzeichen des Recto-Stils: Überschriften mischen zwei Schriften — der Hauptteil in Geist,
// der betonte Schluss in Instrument Serif kursiv und orange (<em>, gestylt in index.css / home.css).
//
// accent('Google Maps ist Pflicht für *lokale Unternehmen*')  → explizit markiert
// accent('Nicht sicher, wo Sie anfangen sollen?')              → automatisch: Teil nach «,» / «:» / «–»
// accent('Google Maps ist Pflicht für lokale Unternehmen')     → automatisch: die letzten zwei Wörter
// Nicht-Text (ReactNode mit eigenem <em>) bleibt unverändert; ein einzelnes Wort ebenso.

const SEPARATORS = [': ', ' – ', ' — ', ', ']

function split(text: string): [string, string] | null {
  for (const sep of SEPARATORS) {
    const i = text.lastIndexOf(sep)
    if (i > 0 && i < text.length - sep.length - 2) return [text.slice(0, i + sep.length), text.slice(i + sep.length)]
  }
  const words = text.trim().split(/\s+/)
  if (words.length < 2) return null
  const last = words[words.length - 1]
  const take = words.length >= 3 && last.replace(/[^\p{L}]/gu, '').length < 12 && words[words.length - 2].length > 2 ? 2 : 1
  return [words.slice(0, -take).join(' ') + ' ', words.slice(-take).join(' ')]
}

export function accent(node: React.ReactNode): React.ReactNode {
  if (typeof node !== 'string') return node
  if (node.includes('*')) {
    return node.split(/\*([^*]+)\*/).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>))
  }
  const parts = split(node)
  if (!parts) return node
  return <>{parts[0]}<em>{parts[1]}</em></>
}
