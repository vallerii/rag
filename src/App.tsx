import { useState, useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ILLUSTRATION PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

// Faint hexagonal mesh lines — reference background texture
function MeshLines({ w = 200, h = 150 }: { w?: number; h?: number }) {
  const lines = []
  for (let x = 0; x <= w; x += 28) lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={h} stroke="#e8e8e8" strokeWidth="0.8" />)
  for (let y = 0; y <= h; y += 28) lines.push(<line key={`h${y}`} x1={0} y1={y} x2={w} y2={y} stroke="#e8e8e8" strokeWidth="0.8" />)
  // diagonal accents
  lines.push(<line key="d1" x1={0} y1={0} x2={w} y2={h} stroke="#eeeeee" strokeWidth="0.6" />)
  lines.push(<line key="d2" x1={w} y1={0} x2={0} y2={h} stroke="#eeeeee" strokeWidth="0.6" />)
  return <>{lines}</>
}

// Floating avatar circle — person initial bubble
function Avatar({ cx, cy, r = 18, bg = '#ede9fe', border = '#c4b5fd', label = 'MK', fontSize = 7 }: {
  cx: number; cy: number; r?: number; bg?: string; border?: string; label?: string; fontSize?: number
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 2} fill="white" opacity="0.7" />
      <circle cx={cx} cy={cy} r={r} fill={bg} stroke={border} strokeWidth="1.2" />
      <text x={cx} y={cy + fontSize * 0.38} textAnchor="middle" fontSize={fontSize} fontWeight="700"
        fill="#2600FF" fontFamily="Satoshi, Inter, sans-serif">{label}</text>
    </g>
  )
}

// Star rating badge chip
function RatingBadge({ x, y, rating, source = 'G' }: { x: number; y: number; rating: string; source?: string }) {
  return (
    <g>
      <rect x={x} y={y} width="46" height="18" rx="9" fill="white" stroke="#e5e7eb" strokeWidth="1" />
      <text x={x + 7} y={y + 12} fontSize="8" fontWeight="700" fill={source === 'G' ? '#4285F4' : '#00b67a'}
        fontFamily="Satoshi, Inter, sans-serif">{source}</text>
      <text x={x + 16} y={y + 12} fontSize="7.5" fontWeight="600" fill="#f59e0b" fontFamily="Satoshi, Inter, sans-serif">★</text>
      <text x={x + 24} y={y + 12} fontSize="7.5" fontWeight="700" fill="#030712" fontFamily="Satoshi, Inter, sans-serif">{rating}</text>
    </g>
  )
}

// Violet map pin
function PinIcon({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  const s = scale
  return (
    <g transform={`translate(${cx - 9 * s}, ${cy - 20 * s}) scale(${s})`}>
      <path d="M9 0C4.03 0 0 4.03 0 9c0 6.75 9 19 9 19s9-12.25 9-19C18 4.03 13.97 0 9 0z" fill="#2600FF" />
      <circle cx="9" cy="9" r="3.5" fill="white" />
    </g>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM SECTION ILLUSTRATIONS
// ─────────────────────────────────────────────────────────────────────────────

function IllustProblemMaps() {
  // Google Maps search results: Before (you at #14) vs After (you at #1)
  return (
    <svg viewBox="0 0 340 180" fill="none" width="100%" height="180" aria-hidden>
      {/* Card background */}
      <rect width="340" height="180" rx="12" fill="#f9fafb"/>
      {/* BEFORE panel */}
      <rect x="6" y="6" width="158" height="168" rx="8" fill="#fff" stroke="#e5e7eb" strokeWidth="1"/>
      <text x="85" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#9ca3af" fontFamily="Arial, sans-serif">VORHER</text>
      {/* Search bar */}
      <rect x="14" y="28" width="142" height="14" rx="7" fill="#f3f4f6"/>
      <text x="25" y="38" fontSize="6.5" fill="#9ca3af" fontFamily="Arial, sans-serif">Restaurants in meiner Nähe</text>
      {/* Competitor rows */}
      {[['Mitbewerber Nr. 1','4,9 ★ (338)'],['Mitbewerber Nr. 2','4,8 ★ (213)'],['Mitbewerber Nr. 3','4,7 ★ (185)']].map(([name,rating],i) => (
        <g key={i}>
          <rect x="14" y={50+i*26} width="142" height="22" rx="4" fill="#f9fafb"/>
          <circle cx="24" cy={61+i*26} r="5" fill="#EA4335" opacity="0.85"/>
          <text x="24" y={64+i*26} textAnchor="middle" fontSize="5" fontWeight="700" fill="white" fontFamily="Arial, sans-serif">{i+1}</text>
          <text x="33" y={60+i*26} fontSize="6.5" fontWeight="600" fill="#111827" fontFamily="Arial, sans-serif">{name}</text>
          <text x="33" y={68+i*26} fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">{rating}</text>
        </g>
      ))}
      {/* "Your Business" at #14 — faded */}
      <rect x="14" y="130" width="142" height="22" rx="4" fill="#fef2f2" stroke="#fecaca" strokeWidth="0.8"/>
      <rect x="14" y="130" width="28" height="22" rx="4" fill="#fee2e2"/>
      <text x="28" y="145" textAnchor="middle" fontSize="7" fontWeight="800" fill="#dc2626" fontFamily="Arial, sans-serif">#14</text>
      <text x="47" y="139" fontSize="6.5" fontWeight="600" fill="#6b7280" fontFamily="Arial, sans-serif">Ihr Unternehmen</text>
      <text x="47" y="147" fontSize="5.5" fill="#9ca3af" fontFamily="Arial, sans-serif">2,8 ★ (14) · weit hinten</text>
      {/* Blurred address */}
      <rect x="47" y="149" width="60" height="4" rx="2" fill="#e5e7eb" opacity="0.7"/>

      {/* AFTER panel */}
      <rect x="176" y="6" width="158" height="168" rx="8" fill="#fff" stroke="#bbf7d0" strokeWidth="1.5"/>
      <text x="255" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#059669" fontFamily="Arial, sans-serif">NACHHER</text>
      {/* Search bar */}
      <rect x="184" y="28" width="142" height="14" rx="7" fill="#f3f4f6"/>
      <text x="195" y="38" fontSize="6.5" fill="#9ca3af" fontFamily="Arial, sans-serif">Restaurants in meiner Nähe</text>
      {/* Your Business highlighted #1 */}
      <rect x="184" y="46" width="142" height="46" rx="6" fill="#f0fdf4" stroke="#86efac" strokeWidth="1"/>
      {/* Maps pin */}
      <path d="M197 58c0-3.3 2.7-6 6-6s6 2.7 6 6c0 4.5-6 11-6 11s-6-6.5-6-11z" fill="#EA4335"/>
      <circle cx="203" cy="58" r="2.2" fill="white"/>
      <text x="212" y="57" fontSize="7" fontWeight="700" fill="#111827" fontFamily="Arial, sans-serif">Ihr Unternehmen</text>
      <text x="212" y="65" fontSize="6" fill="#f59e0b" fontFamily="Arial, sans-serif">4,9 ★★★★★</text>
      <text x="212" y="72" fontSize="5.5" fill="#059669" fontWeight="600" fontFamily="Arial, sans-serif">180+ verifizierte Bewertungen</text>
      <rect x="213" y="75" width="38" height="10" rx="5" fill="#2600FF"/>
      <text x="232" y="83" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="white" fontFamily="Arial, sans-serif">Route</text>
      {/* Competitors below — smaller */}
      {[['Mitbewerber Nr. 2','4,8 ★'],['Mitbewerber Nr. 3','4,7 ★']].map(([name,r],i) => (
        <g key={i}>
          <rect x="184" y={100+i*24} width="142" height="20" rx="4" fill="#f9fafb"/>
          <circle cx="194" cy={110+i*24} r="4" fill="#EA4335" opacity="0.5"/>
          <text x="202" y={109+i*24} fontSize="6" fill="#6b7280" fontFamily="Arial, sans-serif">{name}</text>
          <text x="202" y={116+i*24} fontSize="5.5" fill="#9ca3af" fontFamily="Arial, sans-serif">{r}</text>
        </g>
      ))}
    </svg>
  )
}

function IllustProblemAI() {
  // ChatGPT dark interface: Before (you not listed) vs After (you #1)
  return (
    <svg viewBox="0 0 340 180" fill="none" width="100%" height="180" aria-hidden>
      <rect width="340" height="180" rx="12" fill="#f9fafb"/>
      {/* BEFORE panel — dark ChatGPT UI */}
      <rect x="6" y="6" width="158" height="168" rx="8" fill="#1e1e2e"/>
      {/* Sidebar strip */}
      <rect x="6" y="6" width="28" height="168" rx="8" fill="#161621"/>
      <text x="20" y="25" textAnchor="middle" fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">☰</text>
      <text x="20" y="38" textAnchor="middle" fontSize="5" fill="#6b7280" fontFamily="Arial, sans-serif">Chat</text>
      <text x="20" y="50" textAnchor="middle" fontSize="5" fill="#4b5563" fontFamily="Arial, sans-serif">Verl.</text>
      <text x="85" y="22" textAnchor="middle" fontSize="7" fontWeight="700" fill="#6b7280" fontFamily="Arial, sans-serif">VORHER</text>
      {/* Prompt bar */}
      <rect x="38" y="154" width="118" height="13" rx="6" fill="#2d2d3f"/>
      <text x="97" y="163" textAnchor="middle" fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">Beste Heizungsreparatur in meiner Nähe?</text>
      {/* AI response rows */}
      {[['#1. ████████ Unternehmen','5★ · lokaler Service'],['#2. ████ Unternehmen','5★ · Service'],['#3. ██████ Unternehmen','4,5★'],['#4. ████ Unternehmen','4,5★']].map(([t,s],i) => (
        <g key={i}>
          <rect x="38" y={30+i*28} width="118" height="24" rx="4" fill={i===0?"#2d2d3f":"transparent"}/>
          <rect x="42" y={34+i*28} width={[64,58,62,60][i]||60} height="4" rx="2" fill="#374151"/>
          <rect x="42" y={41+i*28} width="40" height="3" rx="1.5" fill="#1f2937"/>
          <text x="43" y={37+i*28} fontSize="5.5" fontWeight="600" fill="#9ca3af" fontFamily="Arial, sans-serif">{`#${i+1}.`}</text>
          {/* blurred name bar */}
          <rect x="52" y={33+i*28} width="55" height="5" rx="2" fill="#374151" opacity="0.8"/>
          <text x="43" y={45+i*28} fontSize="4.5" fill="#6b7280" fontFamily="Arial, sans-serif">{s}</text>
        </g>
      ))}

      {/* AFTER panel */}
      <rect x="176" y="6" width="158" height="168" rx="8" fill="#1e1e2e"/>
      <rect x="176" y="6" width="28" height="168" rx="8" fill="#161621"/>
      <text x="190" y="25" textAnchor="middle" fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">☰</text>
      <text x="255" y="22" textAnchor="middle" fontSize="7" fontWeight="700" fill="#4ade80" fontFamily="Arial, sans-serif">NACHHER</text>
      <rect x="208" y="154" width="118" height="13" rx="6" fill="#2d2d3f"/>
      <text x="267" y="163" textAnchor="middle" fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">Beste Heizungsreparatur in meiner Nähe?</text>
      {/* #1 Your Business highlighted */}
      <rect x="208" y="30" width="118" height="40" rx="4" fill="#14532d" stroke="#22c55e" strokeWidth="0.8"/>
      <text x="213" y="41" fontSize="6" fontWeight="700" fill="#4ade80" fontFamily="Arial, sans-serif">#1. Ihr Unternehmen</text>
      <text x="213" y="50" fontSize="5" fill="#86efac" fontFamily="Arial, sans-serif">· Höchster Vertrauenswert der Region</text>
      <text x="213" y="57" fontSize="5" fill="#86efac" fontFamily="Arial, sans-serif">· 5,0-Sterne-Bewertung von 200+</text>
      <text x="213" y="64" fontSize="5" fill="#86efac" fontFamily="Arial, sans-serif">· Schnellste Reaktionszeiten u...</text>
      {/* Competitors below blurred */}
      {['#2. ██████ Unternehmen','#3. ████ Unternehmen','#4. ██████ Unternehmen'].map((t,i) => (
        <g key={i}>
          <rect x="208" y={78+i*26} width="118" height="22" rx="4"/>
          <text x="213" y={88+i*26} fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">{t.split(' ')[0]}</text>
          <rect x="225" y={84+i*26} width="55" height="4" rx="2" fill="#374151" opacity="0.6"/>
          <rect x="213" y={90+i*26} width="40" height="3" rx="1.5" fill="#1f2937"/>
        </g>
      ))}
    </svg>
  )
}

function IllustProblemSocial() {
  // Instagram profile: Before (inactive) vs After (optimized)
  return (
    <svg viewBox="0 0 340 210" fill="none" width="100%" height="210" aria-hidden>
      <rect width="340" height="210" rx="12" fill="#f9fafb"/>
      {/* BEFORE phone */}
      <rect x="18" y="6" width="128" height="198" rx="14" fill="#111827"/>
      <rect x="22" y="22" width="120" height="178" rx="8" fill="white"/>
      <text x="82" y="16" textAnchor="middle" fontSize="6" fontWeight="700" fill="#6b7280" fontFamily="Arial, sans-serif">VORHER</text>
      {/* Status bar */}
      <text x="30" y="32" fontSize="5" fill="#374151" fontFamily="Arial, sans-serif">9:41</text>
      {/* Profile header */}
      <circle cx="48" cy="58" r="14" fill="#e5e7eb"/>
      <circle cx="48" cy="53" r="5" fill="#9ca3af"/>
      <path d="M36 68c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="#9ca3af" opacity="0.5"/>
      <text x="76" y="50" fontSize="7" fontWeight="700" fill="#111827" fontFamily="Arial, sans-serif">Ihr Unternehmen</text>
      <text x="76" y="60" fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">14 Follower  2 Beiträge  54 Folgt</text>
      <text x="76" y="70" fontSize="5" fill="#9ca3af" fontFamily="Arial, sans-serif">Willkommen auf meiner Seite...</text>
      <rect x="36" y="76" width="76" height="11" rx="5" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.8"/>
      <text x="74" y="84.5" textAnchor="middle" fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">Profil bearbeiten</text>
      {/* Story circles — empty */}
      {[0,1,2].map(i => <circle key={i} cx={38+i*22} cy={106} r="10" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1"/>)}
      {/* Post grid — 2 old dark photos */}
      <rect x="28" y="122" width="50" height="50" rx="2" fill="#374151"/>
      <rect x="82" y="122" width="50" height="50" rx="2" fill="#1f2937"/>
      <text x="53" y="180" textAnchor="middle" fontSize="5" fill="#9ca3af" fontFamily="Arial, sans-serif">vor 2 Jahren</text>
      <text x="107" y="180" textAnchor="middle" fontSize="5" fill="#9ca3af" fontFamily="Arial, sans-serif">vor 2 Jahren</text>

      {/* AFTER phone */}
      <rect x="194" y="6" width="128" height="198" rx="14" fill="#111827"/>
      <rect x="198" y="22" width="120" height="178" rx="8" fill="white"/>
      <text x="258" y="16" textAnchor="middle" fontSize="6" fontWeight="700" fill="#059669" fontFamily="Arial, sans-serif">NACHHER</text>
      <text x="206" y="32" fontSize="5" fill="#374151" fontFamily="Arial, sans-serif">9:41</text>
      {/* Profile — optimized */}
      <defs>
        <radialGradient id="igAvatar" cx="40%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="100%" stopColor="#2600FF"/>
        </radialGradient>
      </defs>
      <circle cx="224" cy="58" r="15" fill="url(#igAvatar)"/>
      <text x="224" y="62" textAnchor="middle" fontSize="10" fontWeight="900" fill="white" fontFamily="Arial, sans-serif">Y3</text>
      {/* Verified badge */}
      <circle cx="235" cy="47" r="4.5" fill="#2600FF"/>
      <text x="235" y="50" textAnchor="middle" fontSize="5" fontWeight="700" fill="white" fontFamily="Arial, sans-serif">✓</text>
      <text x="252" y="50" fontSize="7" fontWeight="700" fill="#111827" fontFamily="Arial, sans-serif">Ihr Unternehmen</text>
      <text x="252" y="59" fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">125K  583  918</text>
      <text x="252" y="66" fontSize="4.5" fill="#9ca3af" fontFamily="Arial, sans-serif">Follower Beiträge Folgt</text>
      <text x="206" y="76" fontSize="5" fill="#374151" fontFamily="Arial, sans-serif">Preisgekrönte Agentur | Wir lassen Marken wachsen</text>
      {/* CTA button */}
      <rect x="204" y="81" width="50" height="11" rx="5" fill="#2600FF"/>
      <text x="229" y="89.5" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="white" fontFamily="Arial, sans-serif">Jetzt buchen</text>
      <rect x="258" y="81" width="32" height="11" rx="5" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.8"/>
      <text x="274" y="89.5" textAnchor="middle" fontSize="5.5" fill="#374151" fontFamily="Arial, sans-serif">Nachricht</text>
      {/* Highlights */}
      {[['#2600FF','Info'],['#059669','Arbeiten'],['#ea580c','Blog'],['#7c3aed','Kontakt']].map(([c,l],i) => (
        <g key={i}>
          <circle cx={210+i*24} cy={106} r="10" fill={c} opacity="0.85"/>
          <text x={210+i*24} y={120} textAnchor="middle" fontSize="4.5" fill="#374151" fontFamily="Arial, sans-serif">{l}</text>
        </g>
      ))}
      {/* Post grid — professional */}
      {[['#1d4ed8',''],['#065f46',''],['#7c3aed',''],['#9a3412',''],['#1e1b4b',''],['#134e4a','']].map((c,i) => (
        <rect key={i} x={204+(i%3)*38} y={126+Math.floor(i/3)*38} width="34" height="34" rx="2" fill={c[0]}/>
      ))}
    </svg>
  )
}

function IllustProblemReviews() {
  // Google Maps review card: Before (3.1★, stale) vs After (4.9★, active)
  return (
    <svg viewBox="0 0 340 200" fill="none" width="100%" height="200" aria-hidden>
      <rect width="340" height="200" rx="12" fill="#f9fafb"/>
      {/* BEFORE card */}
      <rect x="6" y="6" width="158" height="188" rx="8" fill="white" stroke="#fecaca" strokeWidth="1"/>
      <text x="85" y="20" textAnchor="middle" fontSize="7" fontWeight="700" fill="#dc2626" fontFamily="Arial, sans-serif">VORHER</text>
      {/* Google Maps header */}
      <path d="M20 32c0-2.2 1.8-4 4-4s4 1.8 4 4c0 3-4 7-4 7s-4-4-4-7z" fill="#EA4335"/>
      <circle cx="24" cy="32" r="1.5" fill="white"/>
      <text x="32" y="33" fontSize="6" fontWeight="600" fill="#374151" fontFamily="Arial, sans-serif">Google Maps</text>
      <text x="14" y="46" fontSize="8" fontWeight="700" fill="#111827" fontFamily="Arial, sans-serif">Ihr Unternehmen</text>
      {/* 3.1 stars */}
      <text x="14" y="58" fontSize="13" fontWeight="800" fill="#dc2626" fontFamily="Arial, sans-serif">3,1</text>
      <text x="34" y="58" fontSize="10" fill="#f59e0b" fontFamily="Arial, sans-serif">★★★</text>
      <text x="64" y="58" fontSize="10" fill="#d1d5db" fontFamily="Arial, sans-serif">★★</text>
      <text x="14" y="68" fontSize="6" fill="#6b7280" fontFamily="Arial, sans-serif">5 Bewertungen insgesamt</text>
      <text x="14" y="78" fontSize="6" fontWeight="600" fill="#dc2626" fontFamily="Arial, sans-serif">Letzte Bewertung vor 9 Monaten</text>
      {/* Divider */}
      <line x1="14" y1="84" x2="152" y2="84" stroke="#f3f4f6" strokeWidth="1"/>
      {/* Review rows — blurred */}
      {[0,1,2].map(i => (
        <g key={i}>
          <circle cx="22" cy={98+i*30} r="7" fill="#e5e7eb"/>
          <rect x="34" y={93+i*30} width="50" height="4" rx="2" fill="#d1d5db"/>
          <text x="34" y={105+i*30} fontSize="7" fill="#f59e0b" fontFamily="Arial, sans-serif">★★</text>
          <text x="53" y={105+i*30} fontSize="7" fill="#d1d5db" fontFamily="Arial, sans-serif">★★★</text>
          <rect x="34" y={108+i*30} width="100" height="3" rx="1.5" fill="#f3f4f6"/>
          <rect x="34" y={113+i*30} width="80" height="3" rx="1.5" fill="#f3f4f6"/>
        </g>
      ))}

      {/* AFTER card */}
      <rect x="176" y="6" width="158" height="188" rx="8" fill="white" stroke="#bbf7d0" strokeWidth="1.5"/>
      <text x="255" y="20" textAnchor="middle" fontSize="7" fontWeight="700" fill="#059669" fontFamily="Arial, sans-serif">NACHHER</text>
      <path d="M190 32c0-2.2 1.8-4 4-4s4 1.8 4 4c0 3-4 7-4 7s-4-4-4-7z" fill="#EA4335"/>
      <circle cx="194" cy="32" r="1.5" fill="white"/>
      <text x="202" y="33" fontSize="6" fontWeight="600" fill="#374151" fontFamily="Arial, sans-serif">Google Maps</text>
      <text x="184" y="46" fontSize="8" fontWeight="700" fill="#111827" fontFamily="Arial, sans-serif">Ihr Unternehmen</text>
      {/* 4.9 stars */}
      <text x="184" y="58" fontSize="13" fontWeight="800" fill="#059669" fontFamily="Arial, sans-serif">4,9</text>
      <text x="205" y="58" fontSize="10" fill="#f59e0b" fontFamily="Arial, sans-serif">★★★★★</text>
      <text x="184" y="68" fontSize="6" fontWeight="600" fill="#059669" fontFamily="Arial, sans-serif">250+ verifizierte Kundenbewertungen</text>
      <line x1="184" y1="74" x2="322" y2="74" stroke="#f3f4f6" strokeWidth="1"/>
      {/* Review rows with "Response from owner" badges */}
      {[0,1,2].map(i => (
        <g key={i}>
          <circle cx="192" cy={88+i*34} r="7" fill="#e5e7eb"/>
          <rect x="204" y={83+i*34} width="45" height="4" rx="2" fill="#d1d5db"/>
          <text x="204" y={94+i*34} fontSize="7.5" fill="#f59e0b" fontFamily="Arial, sans-serif">★★★★★</text>
          <rect x="248" y={89+i*34} width="60" height="9" rx="4" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.8"/>
          <text x="278" y={96+i*34} textAnchor="middle" fontSize="4.5" fontWeight="600" fill="#059669" fontFamily="Arial, sans-serif">Antwort vom Inhaber</text>
          <rect x="204" y={100+i*34} width="90" height="3" rx="1.5" fill="#f3f4f6"/>
          <rect x="204" y={105+i*34} width="70" height="3" rx="1.5" fill="#f3f4f6"/>
        </g>
      ))}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WHY ONE SERVICE — CONNECTED CHANNELS ILLUSTRATION
// ─────────────────────────────────────────────────────────────────────────────

function IllustConnected() {
  const channels = [
    { cx: 40, cy: 50, bg: '#fee2e2', border: '#fca5a5', label: 'G' },
    { cx: 88, cy: 28, bg: '#fef3c7', border: '#fcd34d', label: 'AI' },
    { cx: 136, cy: 28, bg: '#dbeafe', border: '#93c5fd', label: '★' },
    { cx: 184, cy: 50, bg: '#d1fae5', border: '#6ee7b7', label: '📢' },
    { cx: 112, cy: 68, bg: '#f3e8ff', border: '#d8b4fe', label: '📷' },
  ]
  return (
    <svg viewBox="0 0 224 96" fill="none" width="100%" height="96" aria-hidden>
      {/* Disconnected state */}
      {channels.map((c, i) => (
        <g key={i}>
          <circle cx={c.cx} cy={c.cy} r={18} fill={c.bg} stroke={c.border} strokeWidth="1.5" />
          <text x={c.cx} y={c.cy + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#374151" fontFamily="Satoshi, Inter, sans-serif">{c.label}</text>
        </g>
      ))}
      {/* Connected lines (appearing after arrow) */}
      {[
        [40, 50, 88, 28], [88, 28, 136, 28], [136, 28, 184, 50],
        [40, 50, 112, 68], [184, 50, 112, 68], [88, 28, 112, 68], [136, 28, 112, 68],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" />
      ))}
      {/* Central hub */}
      <circle cx={112} cy={68} r={22} fill="#2600FF" opacity="0.12" />
      <circle cx={112} cy={68} r={14} fill="#2600FF" />
      <text x={112} y={72.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="Satoshi, Inter, sans-serif">RAG</text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION SECTION ILLUSTRATIONS — 6 modules
// ─────────────────────────────────────────────────────────────────────────────

function IllustMapsProfile() {
  return (
    <div style={{ height: 120, backgroundColor: '#f7f7fb', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      {/* Google Maps pin */}
      <svg width="52" height="66" viewBox="0 0 52 66" fill="none">
        <path d="M26 0C11.64 0 0 11.64 0 26c0 18.2 26 40 26 40S52 44.2 52 26C52 11.64 40.36 0 26 0z" fill="#EA4335"/>
        <path d="M26 0C11.64 0 0 11.64 0 26c0 18.2 26 40 26 40V0z" fill="#C5221F" opacity="0.3"/>
        <circle cx="26" cy="26" r="11" fill="white"/>
        <text x="26" y="31" textAnchor="middle" fontSize="11" fontWeight="900" fill="#4285F4" fontFamily="Arial, sans-serif">G</text>
      </svg>
      {/* Google Business Profile store icon */}
      <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#1A73E8"/>
        {/* Awning stripes */}
        <path d="M6 22h36v2H6z" fill="white" opacity="0.3"/>
        <path d="M6 18l6-8h24l6 8H6z" fill="#1558B0"/>
        <path d="M10 18l4-8h4l-4 8h-4zM18 18l2-8h4l-2 8h-4zM26 18l-2-8h4l2 8h-4zM34 18l-4-8h4l4 8h-4z" fill="white" opacity="0.25"/>
        <rect x="10" y="22" width="28" height="20" rx="2" fill="white" opacity="0.15"/>
        <rect x="16" y="28" width="16" height="14" rx="2" fill="white" opacity="0.9"/>
        <text x="24" y="38" textAnchor="middle" fontSize="10" fontWeight="900" fill="#1A73E8" fontFamily="Arial, sans-serif">G</text>
      </svg>
    </div>
  )
}

function IllustAIOptimization() {
  return (
    <div style={{ height: 120, backgroundColor: '#f7f7fb', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      {/* ChatGPT */}
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="28" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
        <path d="M28 12c-5 0-9.3 3-11.2 7.3a9 9 0 00.3 17.4A12 12 0 0028 44a12 12 0 0010.9-7.3 9 9 0 00.3-17.4A12 12 0 0028 12z" fill="none" stroke="#10a37f" strokeWidth="2"/>
        <path d="M20 28h16M28 20v16" stroke="#10a37f" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="28" cy="28" r="4" fill="#10a37f"/>
      </svg>
      {/* Perplexity */}
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="28" fill="#1C1C1E"/>
        {/* Perplexity asterisk/snowflake */}
        <line x1="28" y1="14" x2="28" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="14" y1="28" x2="42" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="18.1" y1="18.1" x2="37.9" y2="37.9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="37.9" y1="18.1" x2="18.1" y2="37.9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="21" y="21" width="14" height="14" rx="2" fill="#1C1C1E"/>
        <rect x="23" y="23" width="10" height="10" rx="1.5" fill="none" stroke="white" strokeWidth="1.5"/>
      </svg>
    </div>
  )
}

function IllustWebsiteSearch() {
  return (
    <div style={{ height: 120, backgroundColor: '#f7f7fb', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      {/* browser window with a clear page structure */}
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="0.75" y="0.75" width="118.5" height="78.5" rx="7" fill="#fff" stroke="#e5e7eb" strokeWidth="1.5" />
        <path d="M0 14h120" stroke="#e5e7eb" strokeWidth="1.5" />
        <circle cx="10" cy="7.5" r="2" fill="#EA4335" />
        <circle cx="18" cy="7.5" r="2" fill="#FBBC05" />
        <circle cx="26" cy="7.5" r="2" fill="#34A853" />
        <rect x="10" y="22" width="46" height="7" rx="3.5" fill="#07070C" />
        <rect x="10" y="34" width="72" height="4" rx="2" fill="#d7d7e0" />
        <rect x="10" y="42" width="62" height="4" rx="2" fill="#d7d7e0" />
        <rect x="10" y="54" width="30" height="14" rx="4" fill="#2600FF" />
        <rect x="46" y="54" width="30" height="14" rx="4" fill="none" stroke="#d7d7e0" strokeWidth="1.5" />
        <rect x="88" y="22" width="22" height="46" rx="4" fill="#f2f2f7" />
      </svg>
      {/* Google search glyph */}
      <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
        <circle cx="21" cy="21" r="14" fill="none" stroke="#4285F4" strokeWidth="4" />
        <path d="M31.5 31.5L42 42" stroke="#34A853" strokeWidth="4" strokeLinecap="round" />
        <path d="M21 7a14 14 0 0114 14" stroke="#EA4335" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M7 21a14 14 0 0114-14" stroke="#FBBC05" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  )
}

function IllustCitations() {
  return (
    <div style={{ height: 120, backgroundColor: '#f7f7fb', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      {[0, 1, 2].map(i => (
        <svg key={i} width="64" height="76" viewBox="0 0 64 76" fill="none">
          <rect x="0.75" y="0.75" width="62.5" height="74.5" rx="7" fill="#fff" stroke="#e5e7eb" strokeWidth="1.5" />
          <rect x="10" y="12" width="26" height="5" rx="2.5" fill="#07070C" />
          <rect x="10" y="24" width="44" height="3.5" rx="1.75" fill="#d7d7e0" />
          <rect x="10" y="33" width="36" height="3.5" rx="1.75" fill="#d7d7e0" />
          <rect x="10" y="42" width="40" height="3.5" rx="1.75" fill="#d7d7e0" />
          <circle cx="16" cy="60" r="6" fill={i === 2 ? '#2600FF' : '#34A853'} opacity={i === 2 ? 1 : 0.9} />
          <path d={i === 2 ? 'M13.4 60l1.9 1.9 3.4-3.6' : 'M13.4 60l1.9 1.9 3.4-3.6'} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="27" y="57" width="24" height="3.5" rx="1.75" fill="#d7d7e0" />
        </svg>
      ))}
    </div>
  )
}

function IllustReviews() {
  return (
    <div style={{ height: 120, backgroundColor: '#f7f7fb', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
      {/* Trustpilot green star */}
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <rect width="60" height="60" rx="10" fill="#00b67a"/>
        {/* Star shape */}
        <path d="M30 10l5.9 18.1H54L39.1 38.8l5.9 18.1L30 46.2 15 56.9l5.9-18.1L6 28.1h18.1z" fill="white"/>
      </svg>
      {/* Google G multicolor */}
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="30" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
        {/* Google G */}
        <path d="M42 30.5c0-.9-.1-1.8-.2-2.6H30v5h6.7c-.3 1.6-1.2 2.9-2.5 3.8v3.1h4c2.3-2.1 3.8-5.2 3.8-9.3z" fill="#4285F4"/>
        <path d="M30 45c3.2 0 5.9-1.1 7.9-2.9l-4-3.1c-1.1.7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.8H19.4v3.2C21.4 42.6 25.4 45 30 45z" fill="#34A853"/>
        <path d="M23.6 35.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3v-3.2H19.4c-.8 1.6-1.4 3.4-1.4 5.5s.5 3.9 1.4 5.5l4.2-3.2z" fill="#FBBC05"/>
        <path d="M30 22.9c1.7 0 3.2.6 4.4 1.7l3.3-3.3C35.9 19.3 33.2 18 30 18c-4.6 0-8.6 2.4-10.6 6.1l4.2 3.2c.9-2.8 3.4-4.4 6.4-4.4z" fill="#EA4335"/>
      </svg>
      {/* Stars */}
      <div style={{ fontSize: 18, color: '#f59e0b', lineHeight: 1 }}>★★★★★</div>
    </div>
  )
}

function IllustSocial() {
  return (
    <div style={{ height: 120, backgroundColor: '#f7f7fb', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      {/* Instagram */}
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <defs>
          <radialGradient id="igBg" cx="30%" cy="107%" r="130%">
            <stop offset="0%" stopColor="#feda75"/>
            <stop offset="30%" stopColor="#fa7e1e"/>
            <stop offset="60%" stopColor="#d62976"/>
            <stop offset="80%" stopColor="#962fbf"/>
            <stop offset="100%" stopColor="#4f5bd5"/>
          </radialGradient>
        </defs>
        <rect width="60" height="60" rx="14" fill="url(#igBg)"/>
        <rect x="14" y="14" width="32" height="32" rx="8" fill="none" stroke="white" strokeWidth="2.5"/>
        <circle cx="30" cy="30" r="8" fill="none" stroke="white" strokeWidth="2.5"/>
        <circle cx="41" cy="19" r="2.5" fill="white"/>
      </svg>
      {/* Facebook */}
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="30" fill="#1877F2"/>
        <path d="M37 30h-5v18h-6V30h-3v-6h3v-3.5C26 16.6 28.1 14 33 14h4v6h-2.5c-1.4 0-1.5.5-1.5 1.5V24h4.5l-.5 6z" fill="white"/>
      </svg>
    </div>
  )
}

function IllustAds() {
  return (
    <div style={{ height: 120, backgroundColor: '#f7f7fb', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      {/* Google G multicolor */}
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="30" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
        <path d="M42 30.5c0-.9-.1-1.8-.2-2.6H30v5h6.7c-.3 1.6-1.2 2.9-2.5 3.8v3.1h4c2.3-2.1 3.8-5.2 3.8-9.3z" fill="#4285F4"/>
        <path d="M30 45c3.2 0 5.9-1.1 7.9-2.9l-4-3.1c-1.1.7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.8H19.4v3.2C21.4 42.6 25.4 45 30 45z" fill="#34A853"/>
        <path d="M23.6 35.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3v-3.2H19.4c-.8 1.6-1.4 3.4-1.4 5.5s.5 3.9 1.4 5.5l4.2-3.2z" fill="#FBBC05"/>
        <path d="M30 22.9c1.7 0 3.2.6 4.4 1.7l3.3-3.3C35.9 19.3 33.2 18 30 18c-4.6 0-8.6 2.4-10.6 6.1l4.2 3.2c.9-2.8 3.4-4.4 6.4-4.4z" fill="#EA4335"/>
      </svg>
      {/* Meta ∞ */}
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="30" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
        <defs>
          <linearGradient id="metaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0081FB"/>
            <stop offset="100%" stopColor="#00C3FF"/>
          </linearGradient>
        </defs>
        {/* Meta infinity mark */}
        <path d="M14 30c0-4.4 2.8-8 7-8 2.6 0 4.6 1.4 6.4 3.8.6.8 1.2 1.7 1.6 2.4.4-.7 1-1.6 1.6-2.4C32.4 23.4 34.4 22 37 22c4.2 0 7 3.6 7 8 0 4.4-2.8 8-7 8-2.6 0-4.6-1.4-6.4-3.8-.6-.8-1.2-1.7-1.6-2.4-.4.7-1 1.6-1.6 2.4C25.6 36.6 23.6 38 21 38c-4.2 0-7-3.6-7-8z" fill="none" stroke="url(#metaGrad)" strokeWidth="3.5"/>
      </svg>
    </div>
  )
}

function IllustOffline() {
  return (
    <div style={{ height: 120, backgroundColor: '#f7f7fb', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outdoor digital billboard glyph */}
      <svg width="72" height="90" viewBox="0 0 72 90" fill="none">
        {/* Screen frame */}
        <rect x="4" y="4" width="64" height="46" rx="6" fill="#1e1e2e" stroke="#374151" strokeWidth="1.5"/>
        {/* Screen bezel inset */}
        <rect x="8" y="8" width="56" height="38" rx="4" fill="#111827"/>
        {/* Colourful ad content on screen */}
        <rect x="8" y="8" width="56" height="38" rx="4" fill="url(#bbGrad)"/>
        <defs>
          <linearGradient id="bbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed"/>
            <stop offset="50%" stopColor="#2600FF"/>
            <stop offset="100%" stopColor="#0ea5e9"/>
          </linearGradient>
        </defs>
        <text x="36" y="26" textAnchor="middle" fontSize="7" fontWeight="700" fill="white" fontFamily="Arial, sans-serif">Ihr Unternehmen</text>
        <rect x="14" y="29" width="44" height="3" rx="1.5" fill="white" opacity="0.35"/>
        <text x="36" y="39" textAnchor="middle" fontSize="6" fontWeight="600" fill="white" fontFamily="Arial, sans-serif">Jetzt geöffnet · Rufen Sie an</text>
        {/* Stand */}
        <rect x="32" y="50" width="8" height="22" rx="2" fill="#6b7280"/>
        {/* Base */}
        <rect x="22" y="70" width="28" height="7" rx="3.5" fill="#9ca3af"/>
        {/* Feet */}
        <rect x="20" y="75" width="10" height="4" rx="2" fill="#6b7280"/>
        <rect x="42" y="75" width="10" height="4" rx="2" fill="#6b7280"/>
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFORMATION GALLERY ILLUSTRATIONS
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// SMALL UTILITY ICONS
// ─────────────────────────────────────────────────────────────────────────────
function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="9" fill="#2600FF" />
      <path d="M5 9.5l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="9" fill="#e5e7eb" />
      <path d="M6 6l6 6M12 6l-6 6" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s', flexShrink: 0 }}>
      <path d="M5 7.5l5 5 5-5" stroke="#4b5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function MapPin({ color = '#2600FF' }: { color?: string }) {
  return (
    <svg width="20" height="24" viewBox="0 0 24 28" fill="none">
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 19 9 19s9-12.25 9-19c0-4.97-4.03-9-9-9z" fill={color} />
      <circle cx="12" cy="9" r="3.5" fill="#fff" />
    </svg>
  )
}
function Stars() {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 14 14" fill="#f59e0b">
          <path d="M7 1l1.6 4.9H14l-4.1 3 1.6 4.9L7 11 2.5 13.8l1.6-4.9L0 5.9h5.4L7 1z" />
        </svg>
      ))}
    </div>
  )
}
function GLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.77h5.4a4.62 4.62 0 01-2 3.04v2.53h3.23c1.9-1.75 2.97-4.33 2.97-7.34z" fill="#4285F4" />
      <path d="M10 20c2.7 0 4.97-.9 6.63-2.43l-3.23-2.53c-.9.6-2.04.96-3.4.96-2.6 0-4.8-1.76-5.6-4.12H1.07v2.6A9.99 9.99 0 0010 20z" fill="#34A853" />
      <path d="M4.4 11.88A6 6 0 014.16 10c0-.65.11-1.28.24-1.88V5.52H1.07A9.99 9.99 0 000 10c0 1.61.39 3.14 1.07 4.48l3.33-2.6z" fill="#FBBC05" />
      <path d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.96.99 12.7 0 10 0A9.99 9.99 0 001.07 5.52l3.33 2.6C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335" />
    </svg>
  )
}
function GMapsLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 1C6.13 1 3 4.13 3 8c0 5.25 7 12 7 12s7-6.75 7-12c0-3.87-3.13-7-7-7z" fill="#EA4335" />
      <circle cx="10" cy="8" r="2.5" fill="#fff" />
    </svg>
  )
}
function ChatGPTLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="#10a37f" />
      <path d="M10 4.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11z" fill="none" stroke="#fff" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2" fill="#fff" />
    </svg>
  )
}
function TrustpilotLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="#00b67a" />
      <path d="M10 3.5l1.8 5.5H17l-4.6 3.3 1.8 5.5L10 14.5 5.8 17.8l1.8-5.5L3 9l5.2 0L10 3.5z" fill="#fff" />
    </svg>
  )
}
function PerplexityLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="#1e2226" />
      <path d="M10 3v14M5 7l5-4 5 4M5 13l5 4 5-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: booking days + SlotPicker (reused in nav modal and audit quiz)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// MOTION / LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const EASE = 'cubic-bezier(0.16,1,0.3,1)'
const SHELL: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', width: '100%' }

function useInView(threshold = 0.15) {
  const ref = useRef<any>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, seen }
}

function Reveal({ children, delay = 0, style, className = '', threshold = 0.15 }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties; className?: string; threshold?: number
}) {
  const { ref, seen } = useInView(threshold)
  return (
    <div ref={ref} className={`rv ${seen ? 'in' : ''} ${className}`} style={{ ...style, ['--d' as any]: `${delay}s` }}>
      {children}
    </div>
  )
}

/** Headline that reveals line by line behind a mask. Pass an array of lines. */
function MaskHeading({ lines, className = '', style, delay = 0 }: {
  lines: React.ReactNode[]; className?: string; style?: React.CSSProperties; delay?: number
}) {
  const { ref, seen } = useInView(0.2)
  return (
    <h2 ref={ref} className={`mask display ${seen ? 'in' : ''} ${className}`} style={style}>
      {lines.map((l, i) => (
        <span key={i} className="mask-line">
          <span style={{ ['--d' as any]: `${delay + i * 0.09}s` }}>{l}</span>
        </span>
      ))}
    </h2>
  )
}

function Counter({ to, suffix = '', prefix = '', duration = 1600 }: { to: number; suffix?: string; prefix?: string; duration?: number }) {
  const { ref, seen } = useInView(0.4)
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!seen) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to, duration])
  return <span ref={ref}>{prefix}{v}{suffix}</span>
}

/** Крупная контурная метка на карте — ставится только в пустые поля, вне текста. */
function PinMark({ size = 150, color, opacity }: { size?: number; color: string; opacity: number }) {
  return (
    <svg width={size} height={size * 1.34} viewBox="0 0 100 134" fill="none" style={{ opacity, display: 'block' }}>
      <circle cx="50" cy="46" r="45" stroke={color} strokeWidth="1" strokeDasharray="5 11" opacity="0.7" />
      <circle cx="50" cy="46" r="30" stroke={color} strokeWidth="1" strokeDasharray="3 9" opacity="0.45" />
      <path d="M50 8c-14.9 0-27 12.1-27 27 0 20.2 27 54 27 54s27-33.8 27-54c0-14.9-12.1-27-27-27z"
        stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="50" cy="35" r="9.5" stroke={color} strokeWidth="2.4" />
      <path d="M38 108h24" stroke={color} strokeWidth="1.4" opacity="0.5" />
    </svg>
  )
}

/**
 * Фон секции: спокойный план кварталов + пара магистралей.
 * Пины живут в боковых полях макета (шире 1620px) либо у нижнего края,
 * то есть никогда не попадают под текст.
 */
function MapBackdrop({ tone = 'dark', shift = 0 }: { tone?: 'dark' | 'light' | 'electric'; shift?: number }) {
  const isLight = tone === 'light'
  const base = isLight ? '7,7,12' : '255,255,255'
  const fine = `rgba(${base},${tone === 'electric' ? 0.1 : isLight ? 0.045 : 0.04})`
  const bold = `rgba(${base},${tone === 'electric' ? 0.2 : isLight ? 0.09 : 0.085})`
  const pinColor = isLight ? '#07070C' : '#ffffff'
  const pinOpacity = tone === 'electric' ? 0.3 : isLight ? 0.11 : 0.16

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* кварталы: мелкая сетка + опорные линии каждые 4 шага */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(90deg, ${bold} 1px, transparent 1px),
          linear-gradient(0deg, ${bold} 1px, transparent 1px),
          linear-gradient(90deg, ${fine} 1px, transparent 1px),
          linear-gradient(0deg, ${fine} 1px, transparent 1px)`,
        backgroundSize: '376px 376px, 376px 376px, 94px 94px, 94px 94px',
        backgroundPosition: `${shift}px 0px, 0px ${shift / 2}px, ${shift}px 0px, 0px ${shift / 2}px`,
      }} />

      {/* главные дороги: одна диагональ + одна горизонталь.
          vector-effect НЕ наследуется от <g>, ставить его на каждую линию,
          иначе при preserveAspectRatio="none" штрих растягивается вместе с SVG. */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g stroke={bold}>
          <line x1="-4" y1="86" x2="104" y2="10" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <line x1="-4" y1="34" x2="104" y2="34" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>

      {/* пины — в полях, вне колонки контента */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 1240 }}>
          <div className="mb-pin-side" style={{ position: 'absolute', left: -196, top: '13%' }}>
            <PinMark size={150} color={pinColor} opacity={pinOpacity} />
          </div>
          <div className="mb-pin-side" style={{ position: 'absolute', right: -178, bottom: '16%' }}>
            <PinMark size={112} color={pinColor} opacity={pinOpacity * 0.8} />
          </div>
          <div className="mb-pin-edge" style={{ position: 'absolute', left: '4%', bottom: -78 }}>
            <PinMark size={124} color={pinColor} opacity={pinOpacity * 0.85} />
          </div>
          <div className="mb-pin-edge" style={{ position: 'absolute', right: '7%', bottom: -64 }}>
            <PinMark size={92} color={pinColor} opacity={pinOpacity * 0.7} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Фон-текстура из случайных пересечений — линии под разными углами, скрещивающиеся по полю. */
function CrossBackdrop({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const base = tone === 'light' ? '7,7,12' : '255,255,255'
  // [x1, y1, x2, y2, толщина, прозрачность]
  const lines: [number, number, number, number, number, number][] = [
    [-80, 300, 430, -40, 2.6, 0.2],
    [40, -40, 690, 300, 2, 0.14],
    [300, 300, 1000, -40, 3, 0.24],
    [540, -40, 1150, 300, 2, 0.15],
    [-80, 128, 1280, 44, 2.4, 0.18],
    [-80, 36, 1280, 196, 2, 0.13],
    [770, -40, 1280, 232, 2.6, 0.2],
    [130, 300, 600, -40, 2, 0.12],
    [880, 300, 1280, 52, 2, 0.16],
    [-80, 214, 560, 300, 2.4, 0.17],
    [1010, -40, 1280, 140, 2, 0.13],
    [200, -40, 260, 300, 2, 0.1],
    [660, 300, 720, -40, 2.4, 0.14],
  ]
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMid slice" fill="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {lines.map(([x1, y1, x2, y2, w, a], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={`rgba(${base},${a})`} strokeWidth={w} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  )
}

/** Фон секции результатов — ступенчатый график роста в нижней трети. */
function GrowthBackdrop() {
  const line = 'rgba(255,255,255,0.2)'
  const faint = 'rgba(255,255,255,0.11)'
  const nodes: [number, number][] = [[14, 88], [28, 84], [40, 80], [54, 74], [68, 70], [82, 63], [96, 58]]
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g vectorEffect="non-scaling-stroke">
          {/* ось */}
          <line x1="-2" y1="93" x2="102" y2="93" stroke={line} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {[6, 18, 30, 42, 54, 66, 78, 90].map(x => (
            <line key={x} x1={x} y1="93" x2={x} y2="95.4" stroke={line} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          {/* вертикали от узлов к оси */}
          {nodes.map(([x, y]) => (
            <line key={`d${x}`} x1={x} y1={y} x2={x} y2="93" stroke={faint} strokeWidth="1" strokeDasharray="3 6" vectorEffect="non-scaling-stroke" />
          ))}
          {/* ступени */}
          <path d="M2 91 H14 V88 H28 V84 H40 V80 H54 V74 H68 V70 H82 V63 H96 V58 H104"
            stroke="rgba(255,255,255,0.34)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      {nodes.map(([x, y]) => (
        <span key={`n${x}`} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)',
          width: 9, height: 9, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.5)',
        }} />
      ))}
    </div>
  )
}

/** Фон секции аудита — концентрический скан из нижнего правого угла. */
function ScanBackdrop() {
  const ring = (step: number, a: number, w = 1) =>
    `repeating-radial-gradient(circle at 84% 116%, rgba(255,255,255,0) 0 ${step}px, rgba(255,255,255,${a}) ${step}px ${step + w}px)`
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: ring(132, 0.14) }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: ring(528, 0.22, 2) }} />
      <span style={{
        position: 'absolute', left: '84%', top: '116%', transform: 'translate(-50%,-50%)',
        width: 18, height: 18, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)',
      }} />
    </div>
  )
}

/** Фон финального CTA — расходящиеся полосы, «развилка» на стыке половин. */
function ForkBackdrop({ tone, dir }: { tone: 'light' | 'dark'; dir: 'up' | 'down' }) {
  const c = tone === 'light' ? 'rgba(7,7,12,0.3)' : 'rgba(255,255,255,0.3)'
  const cSoft = tone === 'light' ? 'rgba(7,7,12,0.16)' : 'rgba(255,255,255,0.16)'
  const oy = dir === 'up' ? 106 : -6
  const targets: [number, number][] = dir === 'up'
    ? [[66, -8], [78, -10], [90, -12], [104, -4], [110, 30]]
    : [[66, 108], [78, 110], [90, 112], [104, 104], [110, 70]]
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {targets.map(([x, y], i) => (
          <line key={i} x1="102" y1={oy} x2={x} y2={y}
            stroke={i === 2 ? c : cSoft} strokeWidth={i === 2 ? 3 : 1.6} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <span style={{
        position: 'absolute', left: '100%', top: `${oy}%`, transform: 'translate(-50%,-50%)',
        width: 18, height: 18, borderRadius: '50%', border: `2px solid ${c}`,
      }} />
    </div>
  )
}

/** Фон секции «Die Lücken» — разорванные линии, пропуски складываются в диагональный разлом. */
function GapsBackdrop() {
  const rows = 16
  const lines: React.ReactElement[] = []
  for (let i = 0; i < rows; i++) {
    const y = 24 + i * 58
    const t = i / (rows - 1)
    const gx = 180 + t * 900 + Math.sin(i * 1.7) * 70      // центр основного пропуска
    const gw = 200 + Math.sin(i * 0.9) * 90                 // его ширина
    const op = 0.55 + Math.sin(i * 0.6) * 0.25
    const a1 = Math.max(0, gx - gw / 2)
    const a2 = Math.min(1600, gx + gw / 2)
    lines.push(<line key={`a${i}`} x1="-40" y1={y} x2={a1} y2={y} opacity={op} />)
    if (i % 3 === 1) {
      // второй, короткий разрыв ближе к правому краю
      const bx = 1180 + Math.sin(i) * 120
      lines.push(<line key={`b${i}`} x1={a2} y1={y} x2={bx - 55} y2={y} opacity={op} />)
      lines.push(<line key={`c${i}`} x1={bx + 55} y1={y} x2="1640" y2={y} opacity={op} />)
    } else {
      lines.push(<line key={`b${i}`} x1={a2} y1={y} x2="1640" y2={y} opacity={op} />)
    }
    // засечки на краях разрыва
    lines.push(<line key={`t1${i}`} x1={a1} y1={y - 6} x2={a1} y2={y + 6} opacity={op * 0.8} />)
    lines.push(<line key={`t2${i}`} x1={a2} y1={y - 6} x2={a2} y2={y + 6} opacity={op * 0.8} />)
  }

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" fill="none"
        style={{ display: 'block', opacity: 0.13 }}>
        <g stroke="#ffffff" strokeWidth="1" strokeLinecap="square">{lines}</g>
      </svg>
    </div>
  )
}

/** Small uppercase section marker with a hairline. */
function Kicker({ children, tone = 'dark' }: { children: React.ReactNode; tone?: 'dark' | 'light' }) {
  const c = tone === 'dark' ? '#07070C' : '#ffffff'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 28, height: 1, backgroundColor: 'var(--electric)' }} />
      <p className="eyebrow" style={{ color: c, opacity: 0.55 }}>{children}</p>
    </div>
  )
}

/** Scroll progress 0..1 through an element. */
function useScrollProgress() {
  const ref = useRef<any>(null)
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const total = r.height + vh * 0.4
      const done = vh * 0.8 - r.top
      setP(Math.max(0, Math.min(1, done / total)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) }
  }, [])
  return { ref, p }
}

const PLATFORMS: { Logo: React.ComponentType; name: string }[] = [
  { Logo: GLogo, name: 'Google' },
  { Logo: GMapsLogo, name: 'Google Maps' },
  { Logo: ChatGPTLogo, name: 'ChatGPT' },
  { Logo: PerplexityLogo, name: 'Perplexity' },
  { Logo: TrustpilotLogo, name: 'Trustpilot' },
]

function PlatformMarquee({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const col = tone === 'light' ? 'rgba(255,255,255,0.55)' : 'rgba(7,7,12,0.5)'
  const items = [...PLATFORMS, ...PLATFORMS, ...PLATFORMS, ...PLATFORMS]
  const Track = () => (
    <div className="marquee-track" aria-hidden>
      {items.map(({ Logo, name }, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <Logo />
          <span style={{ fontSize: 13, fontWeight: 500, color: col, letterSpacing: '-0.01em' }}>{name}</span>
          <span style={{ color: 'var(--electric)', fontSize: 11, marginLeft: 6 }}>◆</span>
        </span>
      ))}
    </div>
  )
  return <div className="marquee"><Track /><Track /></div>
}

function generateBookingDays() {
  const days: { label: string; date: string }[] = []
  const d = new Date()
  while (days.length < 6) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      days.push({
        label: d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }),
        date: d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }),
      })
    }
  }
  return days
}

const BOOKING_SLOTS = ['09:00', '11:00', '14:00', '16:00']

function SlotPicker({ onConfirm }: { onConfirm: (day: { label: string; date: string }, slot: string) => void }) {
  const [selDay, setSelDay] = useState<number | null>(null)
  const [selSlot, setSelSlot] = useState<string | null>(null)
  const days = generateBookingDays()

  return (
    <div>
      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {days.map((d, i) => (
          <button key={i} onClick={() => { setSelDay(i); setSelSlot(null) }}
            style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: `1px solid ${selDay === i ? '#2600FF' : 'rgba(7,7,12,0.14)'}`, backgroundColor: selDay === i ? '#f2f2ff' : '#f9fafb', color: selDay === i ? '#2600FF' : '#4b5563', fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            {d.label}
          </button>
        ))}
      </div>
      {/* Time slots */}
      {selDay !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {BOOKING_SLOTS.map(slot => (
            <button key={slot} onClick={() => setSelSlot(slot)}
              style={{ padding: '12px', borderRadius: 14, border: `1px solid ${selSlot === slot ? '#2600FF' : 'rgba(7,7,12,0.14)'}`, backgroundColor: selSlot === slot ? '#2600FF' : '#fff', color: selSlot === slot ? '#fff' : '#030712', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: selSlot === slot ? '0 1px 2px rgba(0,0,0,0.12)' : 'none' }}>
              {slot}
            </button>
          ))}
        </div>
      )}
      <button
        disabled={selDay === null || selSlot === null}
        onClick={() => { if (selDay !== null && selSlot !== null) onConfirm(days[selDay], selSlot) }}
        style={{ backgroundColor: selDay !== null && selSlot !== null ? '#2600FF' : '#e5e7eb', color: selDay !== null && selSlot !== null ? '#fff' : '#9ca3af', fontWeight: 600, fontSize: 14, padding: '13px 22px', borderRadius: 999, border: 'none', cursor: selDay !== null && selSlot !== null ? 'pointer' : 'not-allowed', width: '100%', fontFamily: 'inherit', transition: 'all 0.2s' }}>
        Buchung bestätigen
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOK CALL MODAL
// ─────────────────────────────────────────────────────────────────────────────
const SERVICE_OPTIONS = [
  'Google Maps & Unternehmensprofil',
  'KI-Suchoptimierung',
  'Google- & Trustpilot-Bewertungen',
  'Social-Media-Präsenz',
  'Google- & Meta-Anzeigen',
  'Offline-Werbung',
]

function BookCallModal({ onClose }: { onClose: () => void }) {
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1)
  const [bName, setBName] = useState('')
  const [bService, setBService] = useState('')
  const [bEmail, setBEmail] = useState('')
  const [bookedDay, setBookedDay] = useState<{ label: string; date: string } | null>(null)
  const [bookedSlot, setBookedSlot] = useState<string | null>(null)

  const canContinue = bName.trim() !== '' && bService !== '' && bEmail.includes('@')

  const handleClose = () => {
    // Reset on close
    setModalStep(1); setBName(''); setBService(''); setBEmail(''); setBookedDay(null); setBookedSlot(null)
    onClose()
  }

  return (
    <div
      onClick={handleClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(7,7,12,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#fff', borderRadius: 26, boxShadow: '0 40px 90px rgba(7,7,12,0.35)', maxWidth: 460, width: '100%', padding: 36, position: 'relative' }}>

        {/* Close button */}
        <button onClick={handleClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#5c5c5c', lineHeight: 1, padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
        </button>

        {/* ── Step 1: form ── */}
        {modalStep === 1 && (
          <>
            <h2 style={{ fontWeight: 700, fontSize: 22, color: '#030712', marginBottom: 6, letterSpacing: '-0.4px' }}>Sagen Sie uns, was Sie brauchen</h2>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#4b5563', marginBottom: 24, lineHeight: 1.6 }}>Wir verbinden Sie mit dem passenden Spezialisten.</p>
            <input
              value={bName} onChange={e => setBName(e.target.value)}
              placeholder="Ihr Name"
              style={{ width: '100%', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 14, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
            <select
              value={bService} onChange={e => setBService(e.target.value)}
              style={{ width: '100%', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 14, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box', backgroundColor: '#fff', color: bService ? '#030712' : '#9ca3af', appearance: 'auto' }}>
              <option value="" disabled>Service auswählen</option>
              {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              value={bEmail} onChange={e => setBEmail(e.target.value)}
              type="email" placeholder="E-Mail-Adresse"
              style={{ width: '100%', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 14, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 20, boxSizing: 'border-box' }} />
            <button
              disabled={!canContinue}
              onClick={() => canContinue && setModalStep(2)}
              style={{ width: '100%', padding: '13px', borderRadius: 999, border: 'none', backgroundColor: canContinue ? '#2600FF' : '#d1d5db', color: '#fff', fontWeight: 500, fontSize: 15, cursor: canContinue ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background 0.15s' }}>
              Weiter
            </button>
          </>
        )}

        {/* ── Step 2: slot picker ── */}
        {modalStep === 2 && (
          <>
            <h2 style={{ fontWeight: 700, fontSize: 22, color: '#030712', marginBottom: 6, letterSpacing: '-0.4px' }}>Wählen Sie einen Termin für Ihren Anruf</h2>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#4b5563', marginBottom: 20, lineHeight: 1.6 }}>
              Wählen Sie einen passenden Termin. Ein Berater bespricht live mit Ihnen die Ergebnisse Ihres Sichtbarkeits-Checks.
            </p>
            <SlotPicker onConfirm={(day, slot) => { setBookedDay(day); setBookedSlot(slot); setModalStep(3) }} />
          </>
        )}

        {/* ── Step 3: confirmation ── */}
        {modalStep === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#2600FF" /><path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: 22, color: '#030712', marginBottom: 12, letterSpacing: '-0.4px' }}>Ihr Termin ist gebucht!</h2>
            <div style={{ backgroundColor: '#f2f2ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '14px 16px', marginBottom: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#2600FF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Ihr Termin</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#030712', marginBottom: 4 }}>
                {bookedDay?.date} um {bookedSlot} Uhr · {bService}
              </p>
              <p style={{ fontSize: 13, color: '#4b5563', margin: 0 }}>
                Wir senden eine Kalendereinladung an <strong>{bEmail}</strong>
              </p>
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6, marginBottom: 20, fontStyle: 'italic' }}>
              Hinweis (Build): Hierfür wird ein echtes Terminbuchungssystem (Cal.com / Calendly) benötigt, das mit dem Buchungsschritt nach dem Sichtbarkeits-Check geteilt wird. Ein einziges Verfügbarkeitssystem sollte hinter beiden Einstiegspunkten stehen.
            </p>
            <button onClick={handleClose}
              style={{ padding: '11px 28px', borderRadius: 12, border: '1.5px solid #d1d5db', backgroundColor: '#fff', color: '#030712', fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Schließen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTING HELPERS — plain-anchor navigation, no router lib. A link to a page
// anchor needs "/#anchor" from a standalone service page, but "#anchor" when
// already on the homepage.
// ─────────────────────────────────────────────────────────────────────────────
function isHomePath() {
  return typeof window === 'undefined' || window.location.pathname === '/'
}
function homeHref(anchor: string) {
  return isHomePath() ? `#${anchor}` : `/#${anchor}`
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────
function linkHref(target: string) {
  return target.startsWith('/') ? target : homeHref(target)
}

function ServicesNavDropdown({ fg }: { fg: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <a href="/services" className="ul" style={{ fontWeight: 500, fontSize: 14, color: fg, display: 'flex', alignItems: 'center', gap: 6 }}>
        Leistungen
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <div style={{
        position: 'absolute', top: '100%', left: '50%',
        transform: `translate(-50%, ${open ? '10px' : '0px'})`,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: `opacity 0.28s ease, transform 0.4s ${EASE}`,
        backgroundColor: '#07070C', borderRadius: 18, padding: 10, minWidth: 320, zIndex: 60,
        boxShadow: '0 30px 70px rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {modules.map((m, i) => (
          <a key={m.slug} href={`/services/${m.slug}`}
            style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 13px', borderRadius: 12, textDecoration: 'none', transition: 'background 0.25s' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--electric)', paddingTop: 3, letterSpacing: '0.08em' }}>{String(i + 1).padStart(2, '0')}</span>
            <span>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{m.label}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>{m.sentence}</span>
            </span>
          </a>
        ))}
        <a href="/services" style={{ display: 'block', padding: '11px 13px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--electric-2)', textDecoration: 'none' }}>
          Alle Leistungen ansehen →
        </a>
      </div>
    </div>
  )
}

function Nav() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const fg = solid ? '#07070C' : '#ffffff'

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90,
      backgroundColor: solid ? 'rgba(255,255,255,0.82)' : 'transparent',
      backdropFilter: solid ? 'saturate(180%) blur(18px)' : 'none',
      WebkitBackdropFilter: solid ? 'saturate(180%) blur(18px)' : 'none',
      borderBottom: `1px solid ${solid ? 'var(--line)' : 'transparent'}`,
      transition: 'background-color 0.5s ease, border-color 0.5s ease, backdrop-filter 0.5s ease',
    }}>
      <nav aria-label="Hauptnavigation" style={{ ...SHELL, padding: '0 clamp(20px, 4vw, 48px)', height: solid ? 66 : 82, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'height 0.5s ' + EASE }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 21, color: fg, letterSpacing: '-0.05em', textDecoration: 'none', transition: 'color 0.4s ease' }}>
          RAG<span style={{ color: 'var(--electric)' }}>.</span>
        </a>

        <div className="hidden-mobile" style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
          <a href={homeHref('audit')} className="ul" style={{ fontWeight: 500, fontSize: 14, color: fg, transition: 'color 0.4s ease' }}>Sichtbarkeit</a>
          <ServicesNavDropdown fg={fg} />
          {[['Ergebnisse', 'results'], ['Ratgeber', '/ratgeber'], ['FAQ', 'faq']].map(([l, target]) => (
            <a key={l} href={linkHref(target)} className="ul" style={{ fontWeight: 500, fontSize: 14, color: fg, transition: 'color 0.4s ease' }}>{l}</a>
          ))}
          <span style={{ width: 1, height: 18, backgroundColor: solid ? 'var(--line)' : 'rgba(255,255,255,0.2)' }} />
          <a href="tel:+493012345678" className="ul" style={{ fontWeight: 500, fontSize: 14, color: fg, opacity: 0.75, transition: 'color 0.4s ease' }}>+49 30 12345678</a>
          <a href={homeHref('audit-quiz')} className={`btn btn-md ${solid ? 'btn-ink' : 'btn-paper'}`}>
            Sichtbarkeits-Check starten
            <span className="arw">→</span>
          </a>
        </div>

        <button className="show-mobile" aria-label="Menü" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => setOpen(v => !v)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={open ? '#07070C' : fg} strokeWidth="1.8" strokeLinecap="round">
            {open ? <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></> : <><path d="M3 7h18" /><path d="M3 12h18" /><path d="M3 17h18" /></>}
          </svg>
        </button>
      </nav>

      {open && (
        <nav aria-label="Mobile Navigation" className="show-mobile" style={{ display: 'none', flexDirection: 'column', gap: 2, padding: '10px 24px 26px', backgroundColor: '#fff', borderTop: '1px solid var(--line)' }}>
          {[['Sichtbarkeit', 'audit'], ['Leistungen', '/services'], ['Ratgeber', '/ratgeber'], ['Glossar', '/glossar'], ['Ergebnisse', 'results'], ['FAQ', 'faq']].map(([l, target]) => (
            <a key={l} href={linkHref(target)} style={{ fontWeight: 600, fontSize: 22, letterSpacing: '-0.03em', color: '#07070C', textDecoration: 'none', padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }} onClick={() => setOpen(false)}>{l}</a>
          ))}
          <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--muted)', padding: '14px 0 10px' }}>+49 30 12345678</span>
          <a href={homeHref('audit-quiz')} className="btn btn-lg btn-electric" style={{ width: '100%' }} onClick={() => setOpen(false)}>Sichtbarkeits-Check starten</a>
        </nav>
      )}
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────
// Live-looking Maps ranking that lifts "your business" from #14 to #1 on a loop.
function RankPanel() {
  const [won, setWon] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setWon(v => !v), 4200)
    return () => clearInterval(id)
  }, [])

  const comps = [
    { name: 'Mitbewerber Nr. 1', rating: '4,9', reviews: '338' },
    { name: 'Mitbewerber Nr. 2', rating: '4,8', reviews: '213' },
    { name: 'Mitbewerber Nr. 3', rating: '4,7', reviews: '185' },
  ]
  const H = 72
  const youIndex = won ? 0 : 3
  const rows = [
    ...comps.map((c, i) => ({ ...c, you: false, pos: won ? i + 1 : i })),
    { name: 'Ihr Unternehmen', rating: won ? '4,9' : '2,8', reviews: won ? '214' : '14', you: true, pos: youIndex },
  ]

  return (
    <div className="floaty" style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
      <div style={{
        position: 'relative', backgroundColor: '#fff', borderRadius: 24, padding: 16,
        boxShadow: '0 40px 90px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 999, backgroundColor: '#F2F2F5', marginBottom: 14 }}>
          <GMapsLogo />
          <span style={{ fontSize: 13, color: '#6B6B78', fontWeight: 500 }}>Dienstleister in meiner Nähe</span>
          <span className="blink" style={{ width: 1.5, height: 14, backgroundColor: 'var(--electric)', marginLeft: 'auto' }} />
        </div>

        <div style={{ position: 'relative', height: H * 4 }}>
          {rows.map(r => (
            <div key={r.name} style={{
              position: 'absolute', left: 0, right: 0, top: 0, height: H - 8,
              transform: `translateY(${r.pos * H}px)`,
              transition: `transform 0.95s ${EASE}, background-color 0.6s ease, box-shadow 0.6s ease`,
              display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px',
              borderRadius: 16,
              backgroundColor: r.you ? (won ? '#F0EDFF' : '#FBFBFC') : '#FBFBFC',
              boxShadow: r.you && won ? 'inset 0 0 0 1.5px var(--electric)' : 'inset 0 0 0 1px rgba(7,7,12,0.06)',
              opacity: r.you ? 1 : won ? 0.55 : 1,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: r.you ? (won ? 'var(--electric)' : '#FEE2E2') : '#E9E9EE',
                color: r.you ? (won ? '#fff' : '#DC2626') : '#8E8E9E',
                fontSize: r.you && !won ? 11 : 13, fontWeight: 800,
                transition: 'background-color 0.6s ease, color 0.6s ease',
              }}>{r.you ? (won ? '1' : '14') : r.pos + 1}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#07070C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ fontSize: 11.5, color: '#6B6B78', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#F59E0B' }}>★</span>{r.rating} · {r.reviews} Bewertungen
                </div>
              </div>
              {r.you && won && (
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#fff', backgroundColor: 'var(--electric)', padding: '5px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>ANRUF</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', borderRadius: 14, backgroundColor: won ? '#07070C' : '#F2F2F5', transition: 'background-color 0.6s ease' }}>
          <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
            <span className="ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: won ? '#4ADE80' : '#DC2626' }} />
            <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', backgroundColor: won ? '#4ADE80' : '#DC2626' }} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: won ? '#fff' : '#6B6B78', transition: 'color 0.6s ease' }}>
            {won ? 'Position 1 · 8 Anrufe diese Woche' : 'Position 14 · 0 Anrufe diese Woche'}
          </span>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  const { ref, seen } = useInView(0.05)

  return (
    <>
      <section ref={ref} className={`mask ${seen ? 'in' : ''}`} style={{
        position: 'relative', backgroundColor: 'var(--ink)', color: '#fff',
        padding: 'clamp(126px, 14vh, 178px) clamp(20px, 4vw, 48px) 0', overflow: 'hidden',
      }}>
        <MapBackdrop tone="dark" />

        <div style={{ ...SHELL, position: 'relative' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(360px, 0.8fr)', gap: 'clamp(36px, 4vw, 64px)', alignItems: 'center', paddingBottom: 'clamp(56px, 7vw, 90px)' }}>
            <div>
              <div className="mask-line" style={{ marginBottom: 26 }}>
                <span style={{ ['--d' as any]: '0s' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '7px 16px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ADE80' }} />
                    <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Für lokale Unternehmen in Deutschland, Österreich &amp; der Schweiz</span>
                  </span>
                </span>
              </div>

              <h1 className="display" style={{ fontSize: 'clamp(34px, 4vw, 58px)', marginBottom: 26 }}>
                <span className="mask-line"><span style={{ ['--d' as any]: '0.08s' }}>Werden Sie zur</span></span>
                <span className="mask-line"><span style={{ ['--d' as any]: '0.16s' }}><span style={{ color: 'var(--electric-2)' }}>ersten Wahl</span></span></span>
                <span className="mask-line"><span style={{ ['--d' as any]: '0.24s' }}>in Ihrer Region.</span></span>
              </h1>

              <div className="mask-line" style={{ marginBottom: 34 }}>
                <span style={{ ['--d' as any]: '0.42s' }}>
                  <p className="lead" style={{ color: 'rgba(255,255,255,0.62)', maxWidth: 480, margin: 0 }}>
                    Wir machen Ihr Unternehmen dort sichtbar, wo Kunden heute suchen und entscheiden: bei Google Maps, Google, ChatGPT, Perplexity und in sozialen Netzwerken.
                  </p>
                </span>
              </div>

              <div className="mask-line" style={{ marginBottom: 30 }}>
                <span style={{ ['--d' as any]: '0.5s' }}>
                  <span style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <a href="#audit-quiz" className="btn btn-lg btn-paper">Kostenlosen Sichtbarkeits-Check starten <span className="arw">→</span></a>
                    <a href="#start" className="btn btn-lg btn-outline-dark">Google Business Profil ab 149 €</a>
                  </span>
                </span>
              </div>

              <div className="mask-line">
                <span style={{ ['--d' as any]: '0.58s' }}>
                  <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {['Mehr lokale Sichtbarkeit', 'Mehr Vertrauen', 'Mehr qualifizierte Anfragen'].map(b => (
                      <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '7px 15px' }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--electric-2)' }} />
                        {b}
                      </span>
                    ))}
                  </span>
                </span>
              </div>
            </div>

            <div className="hero-visual" style={{ display: 'flex', justifyContent: 'flex-end', opacity: seen ? 1 : 0, transform: seen ? 'none' : 'translateY(40px)', transition: `opacity 1s ease 0.35s, transform 1.1s ${EASE} 0.35s` }}>
              <RankPanel />
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', borderTop: '1px solid var(--line-dark)', padding: '22px 0' }}>
          <PlatformMarquee tone="light" />
        </div>
      </section>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUST ROW
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM SECTION — scroll-driven split layout
// ─────────────────────────────────────────────────────────────────────────────
const problems = [
  {
    Illust: IllustProblemMaps,
    tag: 'Google Maps',
    heading: 'Unsichtbar für Kunden, die gerade jetzt suchen',
    body: "Über 70 % aller Anrufe und Buchungen gehen direkt an die Top-3-Einträge auf Google Maps. Steht Ihr Unternehmen nicht in diesen Top 3, rufen lokale Kunden, die gerade nach Ihrer Leistung suchen, Ihre Mitbewerber an, ohne Ihren Namen je gesehen zu haben.",
  },
  {
    Illust: IllustProblemAI,
    tag: 'KI-Suche',
    heading: 'KI empfiehlt Ihre Mitbewerber – nicht Sie',
    body: "Google rollt AI Overviews für über 1 Milliarde Nutzer aus, während täglich Millionen Menschen ChatGPT und Gemini nach lokalen Empfehlungen fragen. Ist Ihr Unternehmen nicht für KI strukturiert, empfehlen diese Tools aktiv Ihre Mitbewerber – Sie bleiben für moderne Käufer komplett unsichtbar.",
  },
  {
    Illust: IllustProblemSocial,
    tag: 'Social Media',
    heading: 'Ein inaktives Profil signalisiert ein Unternehmen im Abstieg',
    body: "Über 80 % der Käufer prüfen Social-Media-Profile, um ein Unternehmen zu verifizieren, bevor sie Kontakt aufnehmen. Wirken Ihre Profile inaktiv oder veraltet, gehen Kunden von Vernachlässigung aus und wählen einen Mitbewerber mit sichtbar aktiver Arbeit.",
  },
  {
    Illust: IllustProblemReviews,
    tag: 'Bewertungen',
    heading: 'Veraltete Bewertungen kosten Sie täglich neue Kunden',
    body: "Alte Rückmeldungen schaffen kein Vertrauen. Aktuelle schon. Über 85 % der Verbraucher ignorieren Bewertungen, die älter als drei Monate sind. Sehen Käufer keine aktuellen Bewertungen, zweifeln sie an Ihrer heutigen Servicequalität und wenden sich Mitbewerbern mit frischen 5-Sterne-Bewertungen zu.",
  },
]

function ProblemSection() {
  const [active, setActive] = useState(0)
  const ActiveIllust = problems[active].Illust

  return (
    <section id="audit" style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)', position: 'relative', overflow: 'clip' }}>
      <GapsBackdrop />

      <div style={{ ...SHELL, position: 'relative' }}>
        <Reveal><Kicker tone="light">Die Lücken</Kicker></Reveal>
        <div className="problem-head" style={{ marginTop: 26, marginBottom: 'clamp(48px, 6vw, 84px)' }}>
          <MaskHeading
            className="h-lg"
            style={{ maxWidth: 1080 }}
            lines={[
              <>Einen Kanal zu reparieren, macht Sie</>,
              <>nicht sichtbar. <span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>Es behebt nur ein</span></>,
              <><span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>Teilstück davon</span></>,
            ]}
          />
          <Reveal delay={0.15}>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', margin: '26px 0 0', maxWidth: 520 }}>
              Jede der folgenden Lücken ist ein eigener Grund, warum sich ein Kunde für jemand anderen statt für Sie entscheidet
            </p>
          </Reveal>
        </div>

        <div className="problem-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)', gap: 'clamp(32px, 5vw, 80px)' }}>

          {/* LEFT — sticky visual */}
          <div className="problem-sticky" style={{ position: 'relative' }}>
          <div style={{ position: 'sticky', top: 110 }}>
            <div style={{ position: 'relative' }}>
              <div key={active} style={{
                position: 'relative', backgroundColor: '#fff', borderRadius: 22, padding: 12,
                boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
                animation: `fadeSwap 0.5s ${EASE} both`,
              }}>
                <ActiveIllust />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--electric-2)' }}>
                {String(active + 1).padStart(2, '0')} / {String(problems.length).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${((active + 1) / problems.length) * 100}%`, backgroundColor: 'var(--electric-2)', transition: `width 0.5s ${EASE}` }} />
              </div>
            </div>
            </div>
          </div>

          {/* RIGHT — список; переключение только по наведению / клику */}
          <div>
            {problems.map((p, i) => {
              const on = active === i
              return (
                <button
                  key={p.tag}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-expanded={on}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'none', border: 'none', borderTop: '1px solid var(--line-dark)',
                    padding: 'clamp(26px, 2.8vw, 40px) 0',
                    fontFamily: 'inherit', cursor: 'pointer', color: 'inherit',
                    opacity: on ? 1 : 0.32,
                    transform: on ? 'translateX(10px)' : 'none',
                    transition: `opacity 0.45s ease, transform 0.55s ${EASE}`,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 14 }}>
                    <span className="display" style={{ fontSize: 15, color: on ? 'var(--electric-2)' : 'rgba(255,255,255,0.35)', transition: 'color 0.45s ease', letterSpacing: '0.06em' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10.5 }}>{p.tag}</span>
                  </span>
                  <span className="display" style={{ display: 'block', fontSize: 'clamp(21px, 2.3vw, 32px)', lineHeight: 1.15, marginBottom: 14, color: '#fff' }}>
                    {p.heading}
                  </span>
                  <span style={{ display: 'block', fontSize: 14.5, lineHeight: 1.85, color: 'rgba(255,255,255,0.55)', maxWidth: 560 }}>{p.body}</span>
                </button>
              )
            })}
            <div style={{ borderTop: '1px solid var(--line-dark)', paddingTop: 'clamp(32px, 4vw, 48px)' }}>
              <a href="#audit-quiz" className="btn btn-lg btn-electric">Finden Sie die Ursache für meinen Kundenverlust <span className="arw">→</span></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// ABOUT RAG SECTION
// ─────────────────────────────────────────────────────────────────────────────
function SearchReality() {
  const platforms = ['Google Maps', 'Google Search', 'ChatGPT', 'Perplexity', 'Bewertungen', 'Instagram']
  return (
    <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)' }}>
      <div style={{ ...SHELL }}>
        <Reveal><Kicker>Die neue Realität</Kicker></Reveal>

        <div style={{ marginTop: 28, maxWidth: 1000 }}>
          <MaskHeading
            className="h-lg"
            lines={[<>Ihre Kunden suchen nicht</>, <>mehr <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>nur bei Google.</span></>]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(24px, 4vw, 72px)', marginTop: 'clamp(34px, 4vw, 56px)' }}>
          <Reveal delay={0.08}>
            <p className="lead" style={{ color: 'var(--muted)', margin: 0 }}>
              Sie suchen bei Google Maps, fragen ChatGPT und Perplexity, lesen Bewertungen und prüfen Ihre Website und Ihre sozialen Netzwerke — meist innerhalb weniger Minuten.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="h-sm display" style={{ margin: 0 }}>
              Wir sorgen dafür, dass überall ein klares, glaubwürdiges Bild Ihres Unternehmens entsteht.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.18}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 3vw, 34px)', alignItems: 'center', marginTop: 'clamp(40px, 5vw, 64px)', paddingTop: 26, borderTop: '1px solid var(--line)' }}>
            {platforms.map(pl => (
              <span key={pl} className="eyebrow" style={{ fontSize: 11, color: 'rgba(7,7,12,0.45)' }}>{pl}</span>
            ))}
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(24px, 4vw, 72px)', marginTop: 'clamp(48px, 6vw, 88px)', paddingTop: 'clamp(34px, 4vw, 54px)', borderTop: '1px solid var(--line)' }}>
          <Reveal>
            <h3 className="h-sm display" style={{ margin: 0, maxWidth: 420 }}>
              Lokale Sichtbarkeit entsteht nicht an <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>einem einzigen Ort.</span>
            </h3>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: 'var(--muted)', margin: '0 0 16px', maxWidth: 520 }}>
                Damit Ihr Unternehmen gefunden, verstanden und empfohlen wird, müssen mehrere Bereiche zusammenspielen: Ihr Google-Profil, Ihre Website, Bewertungen, Inhalte, Erwähnungen und Ihr gesamter digitaler Auftritt.
              </p>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: 'var(--ink)', margin: 0, maxWidth: 520, fontWeight: 600 }}>
                Wir verbinden diese Elemente zu einem System, das Ihre lokale Präsenz Schritt für Schritt stärkt.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function AboutRAG() {
  return (
    <section style={{ backgroundColor: 'var(--bone)', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ ...SHELL }}>
        <Reveal><Kicker>Wer wir sind</Kicker></Reveal>

        <div className="about-top" style={{ marginTop: 28, maxWidth: 900 }}>
          <MaskHeading
            className="h-md"
            lines={[
              <>Lokale Kunden zu gewinnen ist schwerer</>,
              <>geworden. Wir sind seit über 10 Jahren</>,
              <>immer <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>einen Schritt voraus.</span></>,
            ]}
          />
        </div>

        {/* photo band + copy */}
        <div className="about-band" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)', gap: 'clamp(28px, 4vw, 64px)', alignItems: 'center', marginTop: 'clamp(48px, 6vw, 88px)' }}>
          <Reveal>
            <div style={{
              position: 'relative', aspectRatio: '1/1', borderRadius: 4, overflow: 'hidden',
              backgroundColor: '#E3E2DA', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14,
            }}>
              <div className="grid-bg-light" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
              <svg width="64" height="64" viewBox="0 0 56 56" fill="none" aria-hidden style={{ position: 'relative', opacity: 0.45 }}>
                <circle cx="28" cy="22" r="10" fill="#07070C" />
                <path d="M8 50c0-11.05 8.95-20 20-20s20 8.95 20 20" fill="#07070C" />
              </svg>
              <span style={{ position: 'relative', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(7,7,12,0.4)', textAlign: 'center', lineHeight: 1.8 }}>
                Teamfoto<br />(durch echtes Foto ersetzen)
              </span>
              <span style={{ position: 'absolute', left: 18, bottom: 18, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--electric)' }}>RAG · Team</span>
            </div>
          </Reveal>

          <div>
            <Reveal delay={0.08}>
              <p className="h-sm display" style={{ marginBottom: 22, maxWidth: 560 }}>
                All das konkurriert um denselben Kunden — und all das ändert sich alle paar Monate.
              </p>
            </Reveal>
            <Reveal delay={0.11}>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: 'var(--muted)', maxWidth: 560, margin: '0 0 18px' }}>
                Lokale Suche bedeutete früher einen Eintrag und eine Website. Heute bedeutet sie Google Maps, KI-Antworten in ChatGPT und Gemini, Bewertungen auf drei Plattformen, Social Proof, bezahlte Anzeigen und den Flyer am Aushang um die Ecke.
              </p>
            </Reveal>
            <Reveal delay={0.14}>
              <p style={{ fontSize: 15.5, lineHeight: 1.85, color: 'var(--muted)', maxWidth: 560, margin: 0 }}>
                RAG ist ein Team von Spezialisten für lokale Sichtbarkeit, das ausschließlich mit Unternehmen in Deutschland, Österreich und der Schweiz arbeitet. Seit über 10 Jahren verfolgen wir, wie lokale Kunden wirklich suchen und kaufen, und haben ein System entwickelt, das jeden Kanal als ein zusammenhängendes Problem behandelt — nicht als ein halbes Dutzend separater Dienstleister, die es zu koordinieren gilt.
              </p>
            </Reveal>

          </div>
        </div>

        {/* stat strip — hairlines, no boxes */}
        <div className="about-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 'clamp(48px, 6vw, 84px)', borderTop: '1px solid var(--line)' }}>
          {[
            { big: <><Counter to={500} />+</>, label: 'lokale Unternehmen in der DACH-Region' },
            { big: <><Counter to={10} />+ Jahre</>, label: 'ausschließlich auf lokale Sichtbarkeit fokussiert' },
            { big: <>Nur DACH</>, label: 'Spezialisten statt Generalisten-Agentur' },
          ].map((s, i) => (
            <Reveal key={i} delay={0.1 + i * 0.08} style={{ padding: '30px 24px 0 0', borderRight: i < 2 ? '1px solid var(--line)' : 'none', paddingLeft: i > 0 ? 24 : 0 }}>
              <div className="display" style={{ fontSize: 'clamp(34px, 4vw, 58px)', color: 'var(--electric)', marginBottom: 10 }}>{s.big}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, maxWidth: 240 }}>{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION SECTION — checkbox multi-select cards + sticky bar + quote modal
// ─────────────────────────────────────────────────────────────────────────────
const modules = [
  {
    Illust: IllustMapsProfile,
    label: 'Google Maps & Unternehmensprofil',
    slug: 'google-maps-business-profile',
    sentence: 'In den lokalen Top-Ergebnissen platziert und für jede Suchabsicht optimiert.',
    what: 'Ihr Unternehmenseintrag auf Google Maps und in den Suchergebnissen mit Adresse, Öffnungszeiten, Fotos und verifizierten Bewertungen.',
    how: 'Wir bereinigen Ihre Profildaten, wählen ertragsstarke Kategorien aus, optimieren lokalisierte Inhalte und sorgen für einheitliche Firmendaten in lokalen Verzeichnissen und Branchenportalen (NAP-Konsistenz), um Ihren Eintrag in die Top 3 von Google Maps zu bringen.',
    why: 'Über 70 % der Klicks und Anrufe bei lokalen Dienstleistungen gehen direkt an die Top-3-Positionen auf der Karte. Diese Positionen zu sichern, generiert sofort Anfragen von lokalen Kunden – ganz ohne Klickkosten.',
  },
  {
    Illust: IllustWebsiteSearch,
    label: 'Website & Google Search',
    slug: 'website-google-search',
    sentence: 'Eine Website, die Menschen, Suchmaschinen und KI-Systeme klar verstehen.',
    what: 'Ihre Website ist die Wissensbasis Ihres Unternehmens. Sie erklärt Kunden, Suchmaschinen und KI-Systemen, wer Sie sind, welche Leistungen Sie anbieten, wo Sie tätig sind und warum man Ihnen vertrauen kann.',
    how: 'Wir bauen eine klare Struktur: Leistungsseiten, Regionen- und Servicegebietsseiten, Unternehmens- und Teamseite, Referenzen, Ratgeber-Artikel und Glossar – dazu interne Verlinkung, saubere Technik und strukturierte Daten.',
    why: 'Google und KI-Systeme können nur empfehlen, was sie verstehen. Ohne klare Struktur bleibt Ihre Website ein hübsches Bild – statt der Quelle, aus der Suchergebnisse und KI-Antworten über Sie entstehen.',
  },
  {
    Illust: IllustAIOptimization,
    label: 'KI-Suchoptimierung',
    slug: 'ai-search-optimization',
    sentence: 'Empfohlen von ChatGPT, Gemini und Perplexity – nicht nur von Google.',
    what: 'Generative Engine Optimization (GEO) sorgt dafür, dass Ihr Unternehmen als vertrauenswürdige Antwort genannt wird, wenn Kunden KI-Plattformen um Empfehlungen bitten.',
    how: 'Wir strukturieren Ihre Unternehmensdaten mit Schema-Markup, sichern autoritative Zitate und veröffentlichen semantische Inhalte, die Sprachmodelle verarbeiten und referenzieren.',
    why: 'Käufer nutzen ChatGPT, Perplexity und Google AI Overviews für ihre Kaufentscheidungen. Fehlt Ihr Unternehmen in den Wissensdatenbanken der KI, entdecken potenzielle Kunden Ihre Marke nie.',
  },
  {
    Illust: IllustReviews,
    label: 'Google- & Trustpilot-Bewertungen',
    slug: 'reviews',
    sentence: 'Frische Top-Bewertungen, die schon vor dem ersten Anruf Vertrauen schaffen.',
    what: 'Automatisierte Gewinnung und Verwaltung von Kundenfeedback auf Google und Trustpilot.',
    how: 'Wir bauen Systeme für Bewertungsanfragen nach dem Kauf, gestalten einfache Abläufe zur Bewertungsabgabe und pflegen strukturierte Antwortprozesse.',
    why: 'Hohe Sternebewertungen und viele Rezensionen wirken sich direkt auf Conversion-Raten und Suchrankings aus, weil sie schon vor dem ersten Kontakt Vertrauen schaffen.',
  },
  {
    Illust: IllustCitations,
    label: 'Lokale Verzeichnisse & Erwähnungen',
    slug: 'local-citations',
    sentence: 'Einheitliche Firmendaten überall dort, wo nach Ihnen gesucht wird.',
    what: 'Ihre Einträge und Nennungen auf Branchenportalen, Kartendiensten, Kammer- und Verbandsverzeichnissen sowie in lokalen Medien.',
    how: 'Wir erfassen bestehende Einträge, korrigieren veraltete Adressen und Rufnummern, löschen Dubletten und legen fehlende Einträge auf den Portalen an, die in Ihrer Branche und Region tatsächlich zählen.',
    why: 'Name, Adresse, Telefonnummer, Leistungen und Beschreibung müssen überall übereinstimmen. Widersprüchliche Angaben schwächen Ihre lokale Platzierung und sorgen dafür, dass KI-Systeme kein verlässliches Bild Ihres Unternehmens zusammensetzen können.',
  },
  {
    Illust: IllustSocial,
    label: 'Social-Media-Präsenz',
    slug: 'social-media',
    sentence: 'Aktive, markenkonforme Inhalte auf jeder Plattform, die Kunden checken.',
    what: 'Professionelles Branding, Content-Erstellung und Profilverwaltung auf Instagram und Facebook.',
    how: 'Wir erstellen strukturierte visuelle Inhalte, verfassen klare Texte, halten einen regelmäßigen Veröffentlichungsplan ein und optimieren Profile, damit Besuche zu Verkaufschancen werden.',
    why: 'Interessenten prüfen Social-Media-Profile, um sich zu vergewissern, dass ein Unternehmen aktiv, seriös und bei bestehenden Kunden angesehen ist, bevor sie handeln.',
  },
  {
    Illust: IllustAds,
    label: 'Google- & Meta-Anzeigen',
    slug: 'google-meta-ads',
    sentence: 'Sofortige Sichtbarkeit, während organische Rankings wachsen.',
    what: 'Gezielte bezahlte Werbekampagnen auf Google Search, Instagram und Facebook.',
    how: 'Wir erstellen keyword-genaue Suchkampagnen, gestalten konversionsstarke visuelle Anzeigen, schreiben direkte Werbetexte und messen Conversions präzise.',
    why: 'Organische Sichtbarkeit schafft die Grundlage — Anzeigen beschleunigen sie. Bezahlte Kampagnen bringen früher qualifizierte Anfragen und liefern nebenbei Daten darüber, welche Suchanfragen und Leistungen wirklich Kunden bringen.',
  },
  {
    Illust: IllustOffline,
    label: 'Offline-Werbung',
    slug: 'offline-advertising',
    sentence: 'Plakate, Banner und Printwerbung, die Ihre Marke der ganzen Stadt zeigen.',
    what: 'Geo-gezielte Plakate, Banner, Direktwerbung und lokale Printanzeigen in Ihrer Stadt.',
    how: 'Wir identifizieren stark frequentierte Standorte, gestalten gut lesbare Anzeigen, steuern Druck und Versand und messen die Resonanz über Anruf-Tracking-Nummern und QR-Codes.',
    why: 'Offline-Medien schaffen breites regionales Vertrauen und stärken Ihre Online-Präsenz, indem sie Aufmerksamkeit abseits überfüllter digitaler Feeds gewinnen.',
  },
]

function QuoteModal({ selected, onClose }: { selected: string[]; onClose: () => void }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [city, setCity] = useState('')
  const [services, setServices] = useState<string[]>(selected)
  const [sent, setSent] = useState(false)

  const toggle = (s: string) => setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(7,7,12,0.14)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#030712', backgroundColor: '#fff' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(7,7,12,0.55)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', backgroundColor: '#fff', borderRadius: 26, padding: '34px 30px', maxWidth: 480, width: '100%', boxShadow: '0 40px 90px rgba(7,7,12,0.35)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <h3 style={{ fontWeight: 700, fontSize: 20, color: '#030712', marginBottom: 8 }}>Anfrage gesendet!</h3>
            <p style={{ fontSize: 14, color: '#4b5563' }}>Ein Berater sendet Ihnen innerhalb von 24 Stunden Ihren individuellen Plan.</p>
          </div>
        ) : (
          <>
            <h3 style={{ fontWeight: 700, fontSize: 20, color: '#030712', marginBottom: 6 }}>Sagen Sie uns, was Sie brauchen</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Wir erstellen einen Plan rund um Ihre ausgewählten Leistungen.</p>
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#2600FF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Ausgewählte Leistungen</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {modules.map(m => (
                  <label key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${services.includes(m.label) ? '#c4b5fd' : '#e5e7eb'}`, backgroundColor: services.includes(m.label) ? '#f5f3ff' : '#fff', transition: 'all 0.15s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${services.includes(m.label) ? '#2600FF' : '#d1d5db'}`, backgroundColor: services.includes(m.label) ? '#2600FF' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {services.includes(m.label) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <input type="checkbox" checked={services.includes(m.label)} onChange={() => toggle(m.label)} style={{ display: 'none' }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#030712' }}>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <input style={inputStyle} placeholder="Ihr Name" value={name} onChange={e => setName(e.target.value)} />
              <input style={inputStyle} placeholder="E-Mail oder Telefon" value={contact} onChange={e => setContact(e.target.value)} />
              <input style={inputStyle} placeholder="Stadt" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <button
              disabled={!name || !contact || services.length === 0}
              onClick={() => setSent(true)}
              style={{ width: '100%', padding: '13px', borderRadius: 999, border: 'none', backgroundColor: (!name || !contact || services.length === 0) ? '#e5e7eb' : '#2600FF', color: (!name || !contact || services.length === 0) ? '#9ca3af' : '#fff', fontWeight: 600, fontSize: 14, cursor: (!name || !contact || services.length === 0) ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}>
              Anfrage senden
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SolutionSection() {
  return (
    <section id="modules" style={{ backgroundColor: 'var(--paper)', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)' }}>
      <div style={{ ...SHELL }}>
        <Reveal><Kicker>Das System</Kicker></Reveal>
        <div className="sol-head" style={{ marginTop: 26, marginBottom: 'clamp(36px, 4vw, 60px)' }}>
          <MaskHeading
            className="h-lg"
            style={{ maxWidth: 1080 }}
            lines={[
              <>Woraus lokale</>,
              <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>Sichtbarkeit besteht</span></>,
            ]}
          />
          <Reveal delay={0.12}>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', margin: '26px 0 0', maxWidth: 560 }}>
              Acht Bereiche, ein System. Google Maps ist der zentrale Kanal — alles andere zahlt darauf ein.
            </p>
          </Reveal>
        </div>

        <div style={{ borderTop: '1px solid var(--line)' }}>
          {modules.map((m, i) => (
            <Reveal key={m.slug} delay={Math.min(i * 0.04, 0.24)}>
              <a href={`/services/${m.slug}`} className="row" style={{
                display: 'flex', alignItems: 'baseline', gap: 'clamp(14px, 2vw, 30px)',
                padding: 'clamp(16px, 1.8vw, 24px) 0', borderBottom: '1px solid var(--line)',
                textDecoration: 'none', color: 'inherit',
              }}>
                <span className="row-idx display" style={{ fontSize: 13, color: 'rgba(7,7,12,0.3)', letterSpacing: '0.08em', flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="row-title display" style={{
                  fontSize: i === 0 ? 'clamp(24px, 2.8vw, 40px)' : 'clamp(20px, 2.1vw, 30px)',
                  lineHeight: 1.15, margin: 0, flex: 1,
                }}>
                  {m.label}
                  {i === 0 && (
                    <span className="eyebrow hidden-mobile" style={{ fontSize: 9.5, color: 'var(--electric)', marginLeft: 16, verticalAlign: 'middle' }}>
                      Zentraler Kanal
                    </span>
                  )}
                </h3>
                <span className="ul" style={{ fontSize: 13, fontWeight: 600, color: 'var(--electric)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Mehr erfahren →
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.12}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginTop: 'clamp(34px, 4vw, 54px)' }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--muted)', margin: 0, maxWidth: 460 }}>
              Alle Bereiche im Detail — mit Beschreibung, Beispielen und der Möglichkeit, sich daraus ein Paket zusammenzustellen.
            </p>
            <a href="/services" className="btn btn-lg btn-ink" style={{ flexShrink: 0 }}>
              Alle Leistungen ansehen <span className="arw">→</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ServiceSelector() {
  const [selected, setSelected] = useState<string[]>([])
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (label: string) => setSelected(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])

  return (
    <>
      {quoteOpen && <QuoteModal selected={selected} onClose={() => setQuoteOpen(false)} />}
      <section id="auswahl" style={{
        backgroundColor: 'var(--paper)',
        padding: `clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px) ${selected.length > 0 ? '160px' : 'clamp(80px, 10vw, 140px)'}`,
        transition: 'padding-bottom 0.4s',
      }}>
        <div style={{ ...SHELL }}>
          <Reveal><Kicker>Ihr Plan</Kicker></Reveal>
          <div className="sol-head" style={{ marginTop: 26, marginBottom: 'clamp(40px, 5vw, 68px)' }}>
            <MaskHeading
              className="h-lg"
              style={{ maxWidth: 1080 }}
              lines={[
                <>Stellen Sie sich Ihr</>,
                <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>Paket zusammen</span></>,
              ]}
            />
            <Reveal delay={0.12}>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', margin: '26px 0 0', maxWidth: 560 }}>
                Google Maps ist der zentrale Kanal — alles andere zahlt darauf ein. Wählen Sie die Bereiche aus, die Ihr Unternehmen braucht, und fordern Sie ein Angebot dafür an. Nicht sicher?{' '}
                <a href="/#audit-quiz" className="ul" style={{ color: 'var(--ink)', fontWeight: 600 }}>Machen Sie den kostenlosen Sichtbarkeits-Check.</a>
              </p>
            </Reveal>
          </div>

          {/* zentraler Kanal — bewusst größer als alles andere */}
          <Reveal>
            <div style={{
              border: '1px solid var(--line)', borderRadius: 26, overflow: 'hidden',
              backgroundColor: selected.includes(modules[0].label) ? 'rgba(38,0,255,0.04)' : 'var(--bone)',
              marginBottom: 'clamp(30px, 3.5vw, 52px)', transition: 'background-color 0.4s ease',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                <div style={{ padding: 'clamp(26px, 3vw, 46px)' }}>
                  <span className="eyebrow" style={{ fontSize: 9.5, color: 'var(--electric)' }}>01 · Zentraler Kanal</span>
                  <h3 className="display" style={{ fontSize: 'clamp(27px, 3.4vw, 46px)', lineHeight: 1.08, margin: '16px 0 14px' }}>
                    {modules[0].label}
                  </h3>
                  <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink)', fontWeight: 600, margin: '0 0 14px', maxWidth: 460 }}>
                    {modules[0].sentence}
                  </p>
                  <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'var(--muted)', margin: '0 0 26px', maxWidth: 460 }}>
                    {modules[0].why}
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button onClick={() => toggle(modules[0].label)} className="btn btn-md btn-ink">
                      {selected.includes(modules[0].label) ? '✓ Im Plan' : 'Zum Plan hinzufügen'}
                    </button>
                    <a href={`/services/${modules[0].slug}`} className="btn btn-md" style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}>
                      Zur Leistungsseite <span className="arw">→</span>
                    </a>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--paper)', padding: 'clamp(26px, 3vw, 46px)', borderLeft: '1px solid var(--line)' }}>
                  <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--muted)', margin: '0 0 20px', maxWidth: 380 }}>
                    Alle weiteren Bereiche zahlen auf diesen einen Punkt ein — auf das Bild, das ein Kunde von Ihnen bekommt, wenn er lokal sucht.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {modules.slice(1).map(m => (
                      <a key={m.slug} href={`/services/${m.slug}`} style={{
                        fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', textDecoration: 'none',
                        border: '1px solid var(--line)', borderRadius: 999, padding: '8px 15px',
                        transition: 'border-color 0.25s, color 0.25s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--electric)'; e.currentTarget.style.color = 'var(--electric)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(7,7,12,0.12)'; e.currentTarget.style.color = 'var(--ink)' }}>
                        {m.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* module rows */}
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {modules.slice(1).map((m, idx) => {
              const i = idx + 1
              const checked = selected.includes(m.label)
              const isOpen = expanded === m.label
              return (
                <Reveal key={m.label} delay={Math.min(i * 0.05, 0.25)}>
                  <div className="row" style={{
                    borderBottom: '1px solid var(--line)',
                    backgroundColor: checked ? 'rgba(38,0,255,0.035)' : 'transparent',
                  }}>
                    <div className="mod-row" style={{
                      display: 'grid', gridTemplateColumns: '58px minmax(0,1fr) minmax(0,0.9fr) auto',
                      alignItems: 'center', gap: 'clamp(14px, 2vw, 32px)',
                      padding: 'clamp(22px, 2.4vw, 34px) 0',
                    }}>
                      <span className="row-idx display" style={{ fontSize: 14, color: 'rgba(7,7,12,0.3)', letterSpacing: '0.08em' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      <div>
                        <h3 className="row-title display" style={{ fontSize: i === 0 ? 'clamp(22px, 2.4vw, 34px)' : 'clamp(19px, 1.9vw, 27px)', lineHeight: 1.15, margin: 0, color: checked ? 'var(--electric)' : 'var(--ink)' }}>
                          {m.label}
                        </h3>
                        {i === 0 && (
                          <span className="eyebrow" style={{ display: 'inline-block', marginTop: 10, fontSize: 9.5, color: 'var(--electric)' }}>Zentraler Kanal</span>
                        )}
                      </div>

                      <p className="mod-sentence" style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', margin: 0 }}>{m.sentence}</p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setExpanded(isOpen ? null : m.label)}
                          aria-label="Details"
                          style={{
                            width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--line)',
                            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: `transform 0.5s ${EASE}, background-color 0.3s, border-color 0.3s`,
                            transform: isOpen ? 'rotate(45deg)' : 'none',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bone)' }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" stroke="#07070C" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                        <button
                          onClick={() => toggle(m.label)}
                          className="btn btn-md"
                          style={{
                            fontSize: 12.5, padding: '10px 18px', whiteSpace: 'nowrap',
                            backgroundColor: checked ? 'var(--electric)' : 'transparent',
                            color: checked ? '#fff' : 'var(--ink)',
                            border: checked ? '1px solid var(--electric)' : '1px solid var(--line)',
                            ['--btn-fill' as any]: checked ? '#07070C' : 'var(--electric)',
                            ['--btn-fill-text' as any]: '#fff',
                          }}>
                          {checked ? '✓ Im Plan' : 'Hinzufügen'}
                        </button>
                      </div>
                    </div>

                    {/* expandable detail */}
                    <div style={{ overflow: 'hidden', maxHeight: isOpen ? 620 : 0, transition: `max-height 0.7s ${EASE}` }}>
                      <div className="mod-detail" style={{
                        display: 'grid', gridTemplateColumns: '58px minmax(0,260px) minmax(0,1fr)',
                        gap: 'clamp(14px, 2vw, 32px)', padding: '4px 0 clamp(28px, 3vw, 40px)',
                      }}>
                        <span />
                        <div style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: 'var(--bone)', alignSelf: 'start' }}>
                          <m.Illust />
                        </div>
                        <div className="mod-detail-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                          {[
                            { k: 'Was es ist', v: m.what },
                            { k: 'Wie es funktioniert', v: m.how },
                            { k: 'Warum Sie es brauchen', v: m.why, accent: true },
                          ].map(col => (
                            <div key={col.k}>
                              <p className="eyebrow" style={{ fontSize: 9.5, color: col.accent ? 'var(--electric)' : 'rgba(7,7,12,0.35)', marginBottom: 8 }}>{col.k}</p>
                              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)', margin: 0 }}>{col.v}</p>
                            </div>
                          ))}
                          <a href={`/services/${m.slug}`} className="ul" style={{ gridColumn: '1 / -1', fontSize: 13, fontWeight: 600, color: 'var(--electric)' }}>
                            Zur vollständigen Service-Seite →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>

          {/* not-sure band */}
          <Reveal delay={0.1}>
            <div className="notsure" style={{
              marginTop: 'clamp(40px, 5vw, 64px)', backgroundColor: 'var(--ink)', color: '#fff',
              borderRadius: 24, padding: 'clamp(32px, 4vw, 52px)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap',
              position: 'relative', overflow: 'hidden',
            }}>
              <CrossBackdrop tone="dark" />
              <div style={{ position: 'relative', maxWidth: 560 }}>
                <h3 className="display" style={{ fontSize: 'clamp(22px, 2.6vw, 34px)', marginBottom: 12 }}>Nicht sicher, wo Sie anfangen sollen?</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                  Machen Sie den kostenlosen 2-Minuten-Sichtbarkeits-Check. Wir sagen Ihnen genau, welche Bereiche Ihr Unternehmen zuerst braucht.
                </p>
              </div>
              <a href="/#audit-quiz" className="btn btn-lg btn-paper" style={{ position: 'relative', flexShrink: 0 }}>
                Sichtbarkeits-Check starten <span className="arw">→</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Sticky selection bar */}
      <div style={{
        position: 'fixed', bottom: 20, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'center', padding: '0 20px',
        transform: selected.length > 0 ? 'translateY(0)' : 'translateY(160%)',
        transition: `transform 0.6s ${EASE}`, pointerEvents: selected.length > 0 ? 'auto' : 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
          backgroundColor: 'rgba(7,7,12,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 999, padding: '10px 10px 10px 26px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)' }}>
            Ihr Plan: <strong style={{ color: '#fff' }}>{selected.length} Leistung{selected.length !== 1 ? 'en' : ''}</strong>
          </span>
          <button onClick={() => setQuoteOpen(true)} className="btn btn-md btn-electric" style={{ ['--btn-fill' as any]: '#fff', ['--btn-fill-text' as any]: '#07070C' }}>
            Individuelles Angebot <span className="arw">→</span>
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS
// ─────────────────────────────────────────────────────────────────────────────
function TwoRoutes() {
  const [modal, setModal] = useState(false)
  const routeA = [
    'Analyse Ihrer aktuellen Sichtbarkeit',
    'Stärken und Schwachstellen',
    'Vergleich mit lokalen Mitbewerbern',
    'Liste der wichtigsten Maßnahmen',
    'Schritt-für-Schritt-Empfehlung',
  ]
  const routeB = [
    'Erstellung oder Einrichtung des Profils',
    'Auswahl der Hauptkategorie',
    'Unternehmensbeschreibung und Leistungen',
    'Kontaktdaten, Öffnungszeiten, Verbindung zur Website',
    'Empfehlungen zu Fotos',
    'Link und Vorlage für die ersten Bewertungen',
  ]

  return (
    <>
      {modal && <BookCallModal onClose={() => setModal(false)} />}
      <section id="start" style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)', position: 'relative', overflow: 'clip' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.55 }}><CrossBackdrop tone="dark" /></div>
        <div style={{ ...SHELL, position: 'relative' }}>
          <Reveal><Kicker tone="light">Zwei Wege</Kicker></Reveal>
          <div style={{ marginTop: 26, marginBottom: 'clamp(44px, 5vw, 72px)', maxWidth: 900 }}>
            <MaskHeading
              className="h-lg"
              lines={[<>Wo steht Ihr</>, <><span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>Unternehmen heute?</span></>]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(28px, 4vw, 64px)' }}>
            <Reveal>
              <div style={{ borderTop: '1px solid var(--line-dark)', paddingTop: 30, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <span className="eyebrow" style={{ fontSize: 10, color: 'var(--electric-2)' }}>Variante 01</span>
                <h3 className="display" style={{ fontSize: 'clamp(21px, 2.2vw, 30px)', lineHeight: 1.2, margin: '16px 0 14px' }}>
                  Sie sind bereits online — werden aber nicht ausreichend gefunden?
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.55)', margin: '0 0 24px' }}>
                  Wir analysieren kostenlos, wie Ihr Unternehmen aktuell bei Google Maps, in der Google-Suche und in der KI-Suche dargestellt wird.
                </p>
                <div style={{ marginBottom: 28 }}>
                  {routeA.map((r, i) => (
                    <div key={r} style={{ display: 'flex', gap: 14, padding: '11px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-dark)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)' }}>{r}</span>
                    </div>
                  ))}
                </div>
                <a href="#audit-quiz" className="btn btn-lg btn-paper" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                  Kostenlosen Sichtbarkeits-Check erhalten <span className="arw">→</span>
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div style={{ borderTop: '1px solid var(--line-dark)', paddingTop: 30, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <span className="eyebrow" style={{ fontSize: 10, color: 'var(--electric-2)' }}>Variante 02</span>
                <h3 className="display" style={{ fontSize: 'clamp(21px, 2.2vw, 30px)', lineHeight: 1.2, margin: '16px 0 14px' }}>
                  Sie starten gerade? Beginnen Sie mit Google Maps.
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.55)', margin: '0 0 18px' }}>
                  Wir erstellen und optimieren Ihr Google-Unternehmensprofil — die professionelle Grundlage für Ihre lokale Sichtbarkeit.
                </p>
                <p className="display" style={{ fontSize: 'clamp(28px, 3vw, 42px)', color: 'var(--electric-2)', margin: '0 0 22px' }}>ab 149 €</p>
                <div style={{ marginBottom: 28 }}>
                  {routeB.map((r, i) => (
                    <div key={r} style={{ display: 'flex', gap: 14, padding: '11px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-dark)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)' }}>{r}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <button onClick={() => setModal(true)} className="btn btn-lg btn-electric">
                    Google-Profil starten <span className="arw">→</span>
                  </button>
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', margin: '14px 0 0' }}>
                    Hinweis: Die Verifizierung des Profils muss Google teilweise direkt mit dem Inhaber durchführen.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS
// ─────────────────────────────────────────────────────────────────────────────
const steps = [
  { num: '01', title: 'Analysieren — wir prüfen Ihre aktuelle Sichtbarkeit', desc: 'Wir erfassen Ihr Google-Maps-Ranking, Ihre Website, Ihre KI-Suchpräsenz, Bewertungen und Verzeichniseinträge — und vergleichen sie mit Ihren wichtigsten lokalen Mitbewerbern.', cta: true },
  { num: '02', title: 'Priorisieren — Sie erhalten einen Plan, keine Verkaufsshow', desc: "Sie bekommen einen konkreten Plan: Was bringt jetzt den größten Effekt? Ein persönlicher Berater bespricht die Ergebnisse mit Ihnen, und Sie entscheiden, was aktiviert wird. Kein Paket, das Sie nicht brauchen." },
  { num: '03', title: 'Optimieren — wir bringen die Grundlagen in Ordnung', desc: 'Wir verbessern Google-Unternehmensprofil, Website, Inhalte, Bewertungen und die relevanten Plattformen. Unser Team übernimmt die Umsetzung, nichts landet wieder auf Ihrem Schreibtisch.' },
  { num: '04', title: 'Ausbauen — wir erweitern Ihre lokale Präsenz', desc: 'Wir veröffentlichen neue Inhalte, stärken Ihre Reputation und erweitern Ihre Sichtbarkeit Schritt für Schritt auf weitere Kanäle.' },
  { num: '05', title: 'Messen — Sie sehen, was die Arbeit bewirkt', desc: 'Wir beobachten Rankings, Anrufe, Anfragen, Website-Besuche und Bewertungen und berichten regelmäßig. Echte Zahlen statt Schönwetter-Kennzahlen.' },
]

function Process() {
  const { ref, p } = useScrollProgress()

  return (
    <section ref={ref} style={{ backgroundColor: 'var(--bone)', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)' }}>
      <div style={{ ...SHELL }}>
        <Reveal><Kicker>Der Ablauf</Kicker></Reveal>
        <MaskHeading
          className="h-lg"
          style={{ marginTop: 26, marginBottom: 'clamp(48px, 6vw, 80px)', maxWidth: 900 }}
          lines={[<>Fünf Schritte zu</>, <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>planbaren</span> lokalen Leads</>]}
        />

        <div className="process-wrap" style={{ display: 'grid', gridTemplateColumns: '80px minmax(0,1fr)', gap: 'clamp(16px, 3vw, 48px)' }}>
          {/* rail */}
          <div className="process-rail" style={{ position: 'relative' }}>
            <div style={{ position: 'sticky', top: 120, height: 'calc(100vh - 240px)', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 2, height: '100%', backgroundColor: 'rgba(7,7,12,0.1)', position: 'relative', borderRadius: 2 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${p * 100}%`, backgroundColor: 'var(--electric)', borderRadius: 2, transition: 'height 0.15s linear' }} />
                <div style={{ position: 'absolute', top: `${p * 100}%`, left: '50%', transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--electric)', boxShadow: '0 0 0 6px rgba(38,0,255,0.15)', transition: 'top 0.15s linear' }} />
              </div>
            </div>
          </div>

          {/* steps */}
          <div>
            {steps.map((s, i) => (
              <Reveal key={s.num} threshold={0.3}>
                <div className="step-row" style={{
                  display: 'grid', gridTemplateColumns: 'minmax(0, 0.42fr) minmax(0, 0.58fr)',
                  gap: 'clamp(20px, 3vw, 48px)',
                  padding: 'clamp(34px, 4vw, 56px) 0',
                  borderTop: '1px solid var(--line)',
                  marginLeft: i % 2 === 1 ? 'clamp(0px, 4vw, 56px)' : 0,
                }}>
                  <div>
                    <div className="display" style={{ fontSize: 'clamp(54px, 8vw, 104px)', lineHeight: 0.9, marginBottom: 18, color: 'transparent', WebkitTextStroke: '1.6px #2600FF' }}>{s.num}</div>
                    <h3 className="display" style={{ fontSize: 'clamp(19px, 2vw, 28px)', lineHeight: 1.18, margin: 0 }}>{s.title}</h3>
                  </div>
                  <div style={{ paddingTop: 'clamp(0px, 6vw, 88px)' }}>
                    <p style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--muted)', margin: 0, maxWidth: 460 }}>{s.desc}</p>
                    {'cta' in s && s.cta && (
                      <a href="#audit-quiz" className="btn btn-md btn-ink" style={{ marginTop: 22 }}>
                        Sichtbarkeits-Check starten <span className="arw">→</span>
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// REAL RESULTS — case-study cards with before/after visuals
// ─────────────────────────────────────────────────────────────────────────────

function IllustCaseMaps() {
  // Markus K. — Auto Repair Shop: Maps ranking before/after
  return (
    <svg viewBox="0 0 340 170" fill="none" width="100%" height="170" aria-hidden>
      <rect width="340" height="170" rx="12" fill="#f9fafb"/>
      {/* BEFORE panel */}
      <rect x="6" y="6" width="158" height="158" rx="8" fill="#fff" stroke="#e5e7eb" strokeWidth="1"/>
      <text x="85" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#9ca3af" fontFamily="Arial, sans-serif">VORHER</text>
      <rect x="14" y="28" width="142" height="13" rx="6" fill="#f3f4f6"/>
      <text x="25" y="37.5" fontSize="6.5" fill="#9ca3af" fontFamily="Arial, sans-serif">Autowerkstatt in meiner Nähe</text>
      {[['Mitbewerber Nr. 1','4,9 ★'],['Mitbewerber Nr. 2','4,8 ★'],['Mitbewerber Nr. 3','4,7 ★']].map(([n,r],i)=>(
        <g key={i}>
          <rect x="14" y={50+i*26} width="142" height="22" rx="4" fill="#f9fafb"/>
          <circle cx="24" cy={61+i*26} r="5" fill="#EA4335" opacity="0.8"/>
          <text x="24" y={64+i*26} textAnchor="middle" fontSize="5" fontWeight="700" fill="white" fontFamily="Arial, sans-serif">{i+1}</text>
          <text x="33" y={60+i*26} fontSize="6.5" fontWeight="600" fill="#111827" fontFamily="Arial, sans-serif">{n}</text>
          <text x="33" y={68+i*26} fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">{r}</text>
        </g>
      ))}
      <rect x="14" y="128" width="142" height="20" rx="4" fill="#fef2f2" stroke="#fecaca" strokeWidth="0.8"/>
      <text x="28" y="141" textAnchor="middle" fontSize="7" fontWeight="800" fill="#dc2626" fontFamily="Arial, sans-serif">#14</text>
      <text x="46" y="137" fontSize="6.5" fontWeight="600" fill="#6b7280" fontFamily="Arial, sans-serif">Ihre Autowerkstatt</text>
      <text x="46" y="145" fontSize="5.5" fill="#9ca3af" fontFamily="Arial, sans-serif">0 Anrufe diese Woche</text>
      {/* AFTER panel */}
      <rect x="176" y="6" width="158" height="158" rx="8" fill="#fff" stroke="#bbf7d0" strokeWidth="1.5"/>
      <text x="255" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#059669" fontFamily="Arial, sans-serif">NACHHER · 4 Tage</text>
      <rect x="184" y="28" width="142" height="13" rx="6" fill="#f3f4f6"/>
      <text x="195" y="37.5" fontSize="6.5" fill="#9ca3af" fontFamily="Arial, sans-serif">Autowerkstatt in meiner Nähe</text>
      <rect x="184" y="46" width="142" height="44" rx="6" fill="#f0fdf4" stroke="#86efac" strokeWidth="1"/>
      <path d="M197 58c0-3.3 2.7-6 6-6s6 2.7 6 6c0 4.5-6 11-6 11s-6-6.5-6-11z" fill="#EA4335"/>
      <circle cx="203" cy="58" r="2.2" fill="white"/>
      <text x="212" y="57" fontSize="7" fontWeight="700" fill="#111827" fontFamily="Arial, sans-serif">Ihre Autowerkstatt</text>
      <text x="212" y="65" fontSize="6" fill="#f59e0b" fontFamily="Arial, sans-serif">4,9 ★★★★★</text>
      <text x="212" y="72" fontSize="5.5" fill="#059669" fontWeight="600" fontFamily="Arial, sans-serif">8 Anrufe · erste Woche</text>
      <rect x="213" y="75" width="38" height="10" rx="5" fill="#2600FF"/>
      <text x="232" y="83" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="white" fontFamily="Arial, sans-serif">Jetzt anrufen</text>
      {[['Mitbewerber Nr. 2','4,8 ★'],['Mitbewerber Nr. 3','4,7 ★']].map(([n,r],i)=>(
        <g key={i}>
          <rect x="184" y={98+i*24} width="142" height="20" rx="4" fill="#f9fafb"/>
          <circle cx="194" cy={108+i*24} r="4" fill="#EA4335" opacity="0.45"/>
          <text x="202" y={107+i*24} fontSize="6" fill="#9ca3af" fontFamily="Arial, sans-serif">{n}</text>
          <text x="202" y={114+i*24} fontSize="5.5" fill="#d1d5db" fontFamily="Arial, sans-serif">{r}</text>
        </g>
      ))}
    </svg>
  )
}

function IllustCaseReviews() {
  // Sabine R. — Cosmetic Dentistry: booking flow before/after
  return (
    <svg viewBox="0 0 340 170" fill="none" width="100%" height="170" aria-hidden>
      <rect width="340" height="170" rx="12" fill="#f9fafb"/>
      {/* BEFORE — phone barely rang */}
      <rect x="6" y="6" width="158" height="158" rx="8" fill="#fff" stroke="#e5e7eb" strokeWidth="1"/>
      <text x="85" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#9ca3af" fontFamily="Arial, sans-serif">VORHER</text>
      {/* Weekly bookings bar — low */}
      <text x="14" y="38" fontSize="7" fontWeight="600" fill="#4b5563" fontFamily="Arial, sans-serif">Wöchentliche Buchungsanfragen</text>
      {[3,2,3,1,3,2,3].map((v,i)=>(
        <g key={i}>
          <rect x={16+i*20} y={120-v*12} width="14" height={v*12} rx="3" fill="#fecaca"/>
          <text x={23+i*20} y="128" textAnchor="middle" fontSize="4.5" fill="#9ca3af" fontFamily="Arial, sans-serif">{['Mo','Di','Mi','Do','Fr','Sa','So'][i]}</text>
        </g>
      ))}
      <text x="85" y="148" textAnchor="middle" fontSize="9" fontWeight="700" fill="#dc2626" fontFamily="Arial, sans-serif">⌀ 3 / Woche</text>
      {/* AFTER — jumped to 18 */}
      <rect x="176" y="6" width="158" height="158" rx="8" fill="#fff" stroke="#bbf7d0" strokeWidth="1.5"/>
      <text x="255" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#059669" fontFamily="Arial, sans-serif">NACHHER · nach Optimierung</text>
      <text x="184" y="38" fontSize="7" fontWeight="600" fill="#4b5563" fontFamily="Arial, sans-serif">Wöchentliche Buchungsanfragen</text>
      {[14,16,18,15,18,17,18].map((v,i)=>(
        <g key={i}>
          <rect x={184+i*20} y={120-v*4} width="14" height={v*4} rx="3" fill="#86efac"/>
          <text x={191+i*20} y="128" textAnchor="middle" fontSize="4.5" fill="#6b7280" fontFamily="Arial, sans-serif">{['Mo','Di','Mi','Do','Fr','Sa','So'][i]}</text>
        </g>
      ))}
      <text x="255" y="148" textAnchor="middle" fontSize="9" fontWeight="700" fill="#059669" fontFamily="Arial, sans-serif">⌀ 18 / Woche</text>
    </svg>
  )
}

function IllustCaseAI() {
  // Thomas H. — HVAC: AI search before/after
  return (
    <svg viewBox="0 0 340 170" fill="none" width="100%" height="170" aria-hidden>
      <rect width="340" height="170" rx="12" fill="#f9fafb"/>
      {/* BEFORE — dark ChatGPT-style panel */}
      <rect x="6" y="6" width="158" height="158" rx="8" fill="#1e1e2e"/>
      <rect x="6" y="6" width="26" height="158" rx="8" fill="#161621"/>
      <text x="85" y="22" textAnchor="middle" fontSize="7" fontWeight="700" fill="#6b7280" fontFamily="Arial, sans-serif">VORHER</text>
      <rect x="36" y="148" width="120" height="12" rx="5" fill="#2d2d3f"/>
      <text x="96" y="157" textAnchor="middle" fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">Beste Heizungsreparatur in Berlin?</text>
      {['#1. ███████ Dienstleistungen','#2. ██████ GmbH','#3. ████ Reparatur','(Ihr Unternehmen nicht gelistet)'].map((t,i)=>(
        <g key={i}>
          <rect x="36" y={30+i*26} width="120" height="22" rx="4" fill={i===3?'transparent':'#2d2d3f'} opacity={i===3?1:1}/>
          {i<3 && <rect x="42" y={36+i*26} width={[68,60,52][i]} height="5" rx="2" fill="#374151"/>}
          {i<3 && <rect x="42" y={44+i*26} width="36" height="3" rx="1.5" fill="#1f2937"/>}
          {i===3 && <text x="96" y="138" textAnchor="middle" fontSize="6" fill="#ef4444" fontFamily="Arial, sans-serif">{t}</text>}
        </g>
      ))}
      {/* AFTER panel */}
      <rect x="176" y="6" width="158" height="158" rx="8" fill="#1e1e2e"/>
      <rect x="176" y="6" width="26" height="158" rx="8" fill="#161621"/>
      <text x="255" y="22" textAnchor="middle" fontSize="7" fontWeight="700" fill="#4ade80" fontFamily="Arial, sans-serif">NACHHER</text>
      <rect x="206" y="148" width="120" height="12" rx="5" fill="#2d2d3f"/>
      <text x="266" y="157" textAnchor="middle" fontSize="5.5" fill="#6b7280" fontFamily="Arial, sans-serif">Beste Heizungsreparatur in Berlin?</text>
      <rect x="206" y="30" width="120" height="44" rx="4" fill="#14532d" stroke="#22c55e" strokeWidth="0.8"/>
      <text x="211" y="43" fontSize="6.5" fontWeight="700" fill="#4ade80" fontFamily="Arial, sans-serif">#1. Ihre Heizungsfirma</text>
      <text x="211" y="53" fontSize="5" fill="#86efac" fontFamily="Arial, sans-serif">· Bestbewertet in der Region · 5,0★ · 200+ Bewertungen</text>
      <text x="211" y="61" fontSize="5" fill="#86efac" fontFamily="Arial, sans-serif">· Schnellste Reaktionszeit · DSGVO-konform verifiziert</text>
      <text x="211" y="68" fontSize="5" fill="#86efac" fontFamily="Arial, sans-serif">· Auch in den Top 3 von Google Maps empfohlen</text>
      {['#2. ██████ GmbH','#3. ████ Reparatur'].map((t,i)=>(
        <g key={i}>
          <rect x="206" y={82+i*26} width="120" height="22" rx="4"/>
          <rect x="212" y={88+i*26} width="55" height="4" rx="2" fill="#374151" opacity="0.6"/>
          <rect x="212" y={94+i*26} width="38" height="3" rx="1.5" fill="#1f2937"/>
        </g>
      ))}
    </svg>
  )
}

const caseStudies = [
  {
    initials: 'MK',
    name: 'Markus K.',
    role: 'Inhaber, Autowerkstatt',
    Illust: IllustCaseMaps,
    startingPoint: 'Jede andere Agentur nannte 6 Monate, bevor überhaupt Ergebnisse sichtbar wären.',
    approach: 'Komplettes Google Maps & Unternehmensprofil-Setup, live in 4 Tagen.',
    result: '8 direkte Anrufe über Google Maps in der ersten Woche.',
    quote: '"Klar, schnell und völlig transparent."',
  },
  {
    initials: 'SR',
    name: 'Sabine R.',
    role: 'Praxisleiterin, Ästhetische Zahnmedizin',
    Illust: IllustCaseReviews,
    startingPoint: 'Neue Website, selbst geschaltete Anzeigen – aber das Telefon klingelte kaum.',
    approach: 'Das Audit fand genau die technischen Lücken, an denen lokale Patienten absprangen, und wir haben das Setup entsprechend neu aufgestellt.',
    result: 'Wöchentliche Buchungsanfragen stiegen von 3 auf 18.',
    quote: "\"Das Audit zeigte uns genau das, was wir selbst nicht sehen konnten.\"",
  },
  {
    initials: 'TH',
    name: 'Thomas H.',
    role: 'Gründer, Heizungs- & Reparaturservice',
    Illust: IllustCaseAI,
    startingPoint: 'Eine Stadt voller Anbieter. Einfaches SEO reichte nicht mehr aus.',
    approach: 'Kombination aus Google-Maps-Ranking und KI-Suchoptimierung für ChatGPT und Gemini.',
    result: 'Top 3 bei Google Maps, dazu Empfehlungen in ChatGPT und Gemini. Jetzt gewinnt er Leads, von denen die Konkurrenz nicht einmal weiß, dass es sie gibt.',
    quote: "\"Wir gewinnen jetzt hochwertige Leads, von denen unsere Konkurrenz nicht einmal weiß, dass es sie gibt.\"",
  },
]

function ChevronIcon({ flip }: { flip?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SystemSummary() {
  const lines = [
    ['Ihre Website', 'erklärt Ihre Leistungen.'],
    ['Google Maps', 'zeigt Ihre lokale Präsenz.'],
    ['Bewertungen', 'schaffen Vertrauen.'],
    ['Soziale Netzwerke', 'zeigen die Menschen hinter dem Unternehmen.'],
    ['Suchmaschinen und KI-Systeme', 'verbinden diese Informationen.'],
  ]
  return (
    <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)' }}>
      <div style={{ ...SHELL }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(28px, 4vw, 72px)', alignItems: 'start' }}>
          <div>
            <Reveal><Kicker>Das Zusammenspiel</Kicker></Reveal>
            <MaskHeading
              className="h-md"
              style={{ marginTop: 22 }}
              lines={[<>Aus einzelnen Kanälen wird</>, <>ein <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>klares Bild</span> Ihres</>, <>Unternehmens.</>]}
            />
          </div>
          <div>
            {lines.map(([a, b], i) => (
              <Reveal key={a} delay={0.06 * i}>
                <p style={{ fontSize: 'clamp(16px, 1.5vw, 19px)', lineHeight: 1.6, margin: 0, padding: '16px 0', borderTop: '1px solid var(--line)', color: 'var(--muted)' }}>
                  <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{a}</strong> {b}
                </p>
              </Reveal>
            ))}
            <Reveal delay={0.34}>
              <p className="h-sm display" style={{ margin: '34px 0 0', maxWidth: 560 }}>
                So entsteht eine digitale Präsenz, die gefunden wird, Vertrauen aufbaut und neue Anfragen erzeugt.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

function RealResults() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = caseStudies.length
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setActive(a => (a + 1) % total), 6000)
    return () => clearInterval(id)
  }, [active, paused, total])

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; setPaused(true) }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const d = e.changedTouches[0].clientX - touchX.current
    if (d > 50) setActive(a => (a - 1 + total) % total)
    else if (d < -50) setActive(a => (a + 1) % total)
    touchX.current = null
    setPaused(false)
  }

  const c = caseStudies[active]

  return (
    <section id="results" style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)', position: 'relative', overflow: 'hidden' }}>
      <GrowthBackdrop />

      <div style={{ ...SHELL, position: 'relative' }}
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        <Reveal><Kicker tone="light">Ergebnisse</Kicker></Reveal>

        <div className="res-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', marginTop: 26, marginBottom: 'clamp(40px, 5vw, 64px)' }}>
          <div>
            <MaskHeading className="h-lg" lines={[<>Echte Ergebnisse,</>, <><span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>echte Unternehmen</span></>]} />
            <Reveal delay={0.12}>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.5)', margin: '18px 0 0', maxWidth: 480 }}>
                Was sich für drei Unternehmen verändert hat, die genau dort gestartet sind, wo Sie jetzt stehen.
              </p>
            </Reveal>
          </div>
          {/* tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {caseStudies.map((cs, i) => (
              <button key={cs.name} onClick={() => setActive(i)}
                style={{
                  position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 16px', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
                  color: active === i ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: 'color 0.35s ease',
                }}>
                {cs.name}
                <span style={{
                  position: 'absolute', left: 16, right: 16, bottom: 2, height: 1.5, borderRadius: 2,
                  backgroundColor: 'var(--electric-2)',
                  transform: active === i ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left', transition: `transform 0.5s ${EASE}`,
                }} />
              </button>
            ))}
          </div>
        </div>

        <div key={active} className="res-body" style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 'clamp(32px, 5vw, 72px)', alignItems: 'start',
          animation: `fadeSwap 0.6s ${EASE} both`,
        }}>
          <div>
            <p className="serif" style={{ fontSize: 'clamp(28px, 3.6vw, 52px)', lineHeight: 1.15, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 28px' }}>
              {c.quote}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 34 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--electric)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13.5 }}>{c.initials}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{c.name}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>{c.role}</div>
              </div>
            </div>
            <div>
              {[
                { label: 'Ausgangslage', value: c.startingPoint },
                { label: 'Unser Ansatz', value: c.approach },
                { label: 'Das Ergebnis', value: c.result, accent: true },
              ].map(row => (
                <div key={row.label} className="res-row" style={{ display: 'grid', gridTemplateColumns: '132px minmax(0,1fr)', gap: 18, padding: '16px 0', borderTop: '1px solid var(--line-dark)' }}>
                  <span className="eyebrow" style={{ fontSize: 9.5, color: row.accent ? 'var(--electric-2)' : 'rgba(255,255,255,0.35)', paddingTop: 3 }}>{row.label}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.7, color: row.accent ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: row.accent ? 600 : 400 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', backgroundColor: '#fff', borderRadius: 22, padding: 12, boxShadow: '0 40px 80px rgba(0,0,0,0.45)' }}>
              <c.Illust />
            </div>
          </div>
        </div>

        {/* what we make measurable */}
        <div style={{ position: 'relative', marginTop: 'clamp(48px, 6vw, 88px)', paddingTop: 'clamp(30px, 4vw, 48px)', borderTop: '1px solid var(--line-dark)', backgroundColor: 'var(--ink)' }}>
          <Reveal>
            <h3 className="display" style={{ fontSize: 'clamp(20px, 2.1vw, 30px)', margin: '0 0 8px' }}>Was wir sichtbar machen</h3>
          </Reveal>
          <Reveal delay={0.06}>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'rgba(255,255,255,0.5)', margin: '0 0 26px', maxWidth: 520 }}>
              Diese Kennzahlen berichten wir regelmäßig — damit Sichtbarkeit nachvollziehbar bleibt und nicht Gefühlssache ist.
            </p>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0 clamp(20px, 3vw, 48px)' }}>
            {[
              'Aufrufe und Impressionen bei Google Maps',
              'Anrufe und Klicks aus dem Unternehmensprofil',
              'Positionen bei lokalen Suchanfragen',
              'Anzahl und Qualität der Bewertungen',
              'Organische Besuche auf der Website',
              'Eingehende Anfragen',
              'Erwähnungen und Zitate in der KI-Suche',
            ].map((m, i) => (
              <Reveal key={m} delay={Math.min(i * 0.04, 0.2)}>
                <div style={{ display: 'flex', gap: 12, padding: '13px 0', borderTop: '1px solid var(--line-dark)' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--electric-2)', letterSpacing: '0.1em', paddingTop: 3 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)' }}>{m}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* progress dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 'clamp(36px, 4vw, 56px)' }}>
          {caseStudies.map((_, i) => (
            <button key={i} aria-label={`Fallstudie ${i + 1}`} onClick={() => setActive(i)}
              style={{ width: active === i ? 32 : 8, height: 4, borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer', backgroundColor: active === i ? 'var(--electric-2)' : 'rgba(255,255,255,0.2)', transition: `all 0.45s ${EASE}` }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT QUIZ
// ─────────────────────────────────────────────────────────────────────────────
function AuditQuiz() {
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [bookedQuizDay, setBookedQuizDay] = useState<{ label: string; date: string } | null>(null)
  const [bookedQuizSlot, setBookedQuizSlot] = useState<string | null>(null)
  // TOTAL covers steps 1–9; step 10 is the final confirmation (no bar)
  const TOTAL = 9

  const pick = (key: string, val: string) => { setAnswers(a => ({ ...a, [key]: val })); setStep(s => s + 1) }
  const pct = Math.min((step / TOTAL) * 100, 100)


  const Btn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', padding: '13px 16px', textAlign: 'left', backgroundColor: '#fff', border: '1px solid var(--line)', borderRadius: 14, fontWeight: 500, fontSize: 14, color: 'var(--ink)', cursor: 'pointer', marginBottom: 8, transition: 'all 0.25s ease', fontFamily: 'inherit' }}
      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#2600FF'; b.style.backgroundColor = '#F4F2FF'; b.style.transform = 'translateX(4px)' }}
      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(7,7,12,0.12)'; b.style.backgroundColor = '#fff'; b.style.transform = 'none' }}>
      {label}
      <span style={{ color: '#2600FF', fontSize: 13 }}>→</span>
    </button>
  )

  const reset = () => { setStep(1); setAnswers({}); setName(''); setPhone(''); setEmail(''); setCompanyName(''); setIndustry(''); setBookedQuizDay(null); setBookedQuizSlot(null) }

  return (
    <section id="audit-quiz" style={{ backgroundColor: 'var(--electric)', color: '#fff', padding: 'clamp(80px, 10vw, 130px) clamp(20px, 4vw, 48px)', position: 'relative', overflow: 'hidden' }}>
      <ScanBackdrop />
      <div className="audit-grid" style={{ ...SHELL, position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0, 500px)', gap: 'clamp(36px, 5vw, 80px)', alignItems: 'center' }}>
        <div className="audit-copy">
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ width: 28, height: 1, backgroundColor: 'rgba(255,255,255,0.6)' }} />
              <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Kostenlos · 2 Minuten</p>
            </div>
          </Reveal>
          <MaskHeading
            className="h-md"
            style={{ marginBottom: 24, color: '#fff' }}
            lines={[<>Kostenloses <span className="serif italic-serif">2-Minuten-</span></>, <><span className="serif italic-serif">Sichtbarkeits-Check</span></>]}
          />
          <Reveal delay={0.12}>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.75)', marginBottom: 34, maxWidth: 460 }}>
              5 Fragen zu Ihrem Unternehmen + Kontaktdaten · Google- &amp; KI-Präsenz-Check · Persönlicher Wachstumsplan
            </p>
          </Reveal>
          <div className="audit-bullets" style={{ display: 'flex', flexDirection: 'column' }}>
            {['Kein Verkaufsgespräch, nur Ihre Ergebnisse', 'Fertig in unter 2 Minuten', 'Persönlicher Plan innerhalb von 24 Stunden'].map((b, i) => (
              <Reveal key={b} delay={0.16 + i * 0.07}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 15, color: '#fff' }}>{b}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', color: 'var(--ink)', borderRadius: 26, padding: 'clamp(26px, 3vw, 38px)', boxShadow: '0 40px 80px rgba(7,7,12,0.28)' }}>
          {step > 0 && step <= TOTAL && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#4b5563' }}>Schritt {step} von {TOTAL}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#2600FF' }}>{Math.round(pct)}%</span>
              </div>
              <div style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#2600FF', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Скрытый якорь: кнопка «Anruf buchen» в hero может открыть шаг брони напрямую */}
          <button id="quiz-book-direct" onClick={() => setStep(9)} style={{ display: 'none' }}>Direkt zur Buchung</button>
          {step === 1 && <><h3 style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 18 }}>In welcher Stadt sind Sie ansässig?</h3>{['München', 'Berlin', 'Hamburg', 'Frankfurt', 'Sonstige'].map(c => <Btn key={c} label={c} onClick={() => pick('city', c)} />)}</>}
          {step === 2 && <><h3 style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 18 }}>Wie viele neue Kunden pro Monat?</h3>{['Weniger als 10', '10–30', '30–60', 'Mehr als 60'].map(c => <Btn key={c} label={c} onClick={() => pick('clients', c)} />)}</>}
          {step === 3 && <><h3 style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 18 }}>Wie erreichen Sie die meisten Kunden?</h3>{['Mundpropaganda', 'Google-Suche', 'Social Media', 'Bezahlte Anzeigen', "Ich bin mir nicht sicher"].map(c => <Btn key={c} label={c} onClick={() => pick('channel', c)} />)}</>}
          {step === 4 && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 18 }}>In welcher Branche sind Sie tätig?</h3>
              <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="z. B. Autowerkstatt, Zahnmedizin, Heizungstechnik…" style={{ width: '100%', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
              <button onClick={() => pick('industry', industry || 'Nicht angegeben')} style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 13, padding: '13px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>Weiter</button>
            </div>
          )}
          {step === 5 && (
            <div>
              <h3 style={{ fontWeight: 600, fontSize: 14, color: '#030712', marginBottom: 4 }}>Wir prüfen jetzt Ihre Sichtbarkeit in der KI-Suche</h3>
              <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 14 }}>Illustratives Beispiel, keine Live-Abfrage</p>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Name Ihres Unternehmens" style={{ width: '100%', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
              <div style={{ backgroundColor: '#f2f2ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2600FF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>KI-Sichtbarkeits-Check: {answers.city || 'Ihre Region'}</div>
                <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '0 0 10px' }}>
                  <strong>{companyName || 'Ihr Unternehmen'}</strong> steht aktuell nicht unter den Top-3-KI-Empfehlungen in Ihrer Region, da das Unternehmensprofil nicht indexiert ist.
                </p>
                <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '0 0 10px' }}>
                  Algorithmen empfehlen 3 andere Unternehmen in Ihrer Kategorie:{' '}
                  <span style={{ display: 'inline-block', backgroundColor: '#e5e7eb', borderRadius: 4, padding: '1px 7px', filter: 'blur(3.5px)', userSelect: 'none', fontSize: 11 }}>Müller &amp; Partner</span>{' '}
                  <span style={{ display: 'inline-block', backgroundColor: '#e5e7eb', borderRadius: 4, padding: '1px 7px', filter: 'blur(3.5px)', userSelect: 'none', fontSize: 11 }}>Schmidt Services GmbH</span>{' '}
                  <span style={{ display: 'inline-block', backgroundColor: '#e5e7eb', borderRadius: 4, padding: '1px 7px', filter: 'blur(3.5px)', userSelect: 'none', fontSize: 11 }}>Becker Pro</span>
                </p>
                <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.75, margin: 0, borderTop: '1px solid #ddd6fe', paddingTop: 8 }}>
                  Ein vollständiges Sichtbarkeits-Check und ein Schritt-für-Schritt-Optimierungsplan werden nach Abschluss der Umfrage erstellt und zugesendet.
                </p>
              </div>
              <button onClick={() => setStep(6)} style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 13, padding: '13px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>So ändern Sie das</button>
            </div>
          )}
          {step === 6 && <><h3 style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 18 }}>Was ist Ihre größte Sorge?</h3>{['Ein Mitbewerber ist mir voraus', 'Zu wenig Leads', 'Leads passen nicht', "Ich bin bei Google & KI unsichtbar", "Ich habe es satt, Dienstleister zu koordinieren", 'Sonstiges'].map(c => <Btn key={c} label={c} onClick={() => pick('concern', c)} />)}</>}
          {step === 7 && <><h3 style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 18 }}>Monatliches Marketingbudget?</h3>{['Bis 500 €', '500–1.500 €', '1.500–3.000 €', 'Über 3.000 €', "Ich bin noch nicht investitionsbereit"].map(c => <Btn key={c} label={c} onClick={() => pick('budget', c)} />)}</>}
          {step === 8 && (
            <div>
              <h3 style={{ fontWeight: 600, fontSize: 15, color: '#030712', marginBottom: 5 }}>Erhalten Sie Ihre Analyse &amp; Ihren Aktionsplan</h3>
              <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 16 }}>Ein Berater sendet Ihnen innerhalb von 24 Stunden Ihren persönlichen Plan.</p>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Vollständiger Name" style={{ width: '100%', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefonnummer" style={{ width: '100%', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-Mail-Adresse" style={{ width: '100%', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
              <button onClick={() => setStep(9)} style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 600, fontSize: 14, padding: '13px 22px', borderRadius: 999, border: 'none', cursor: 'pointer', width: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', fontFamily: 'inherit' }}>Analyse und Aktionsplan erhalten</button>
            </div>
          )}

          {/* ── Step 9: Book a consultation call ── */}
          {step === 9 && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: '#030712', marginBottom: 4 }}>Wählen Sie einen Termin für Ihren Anruf</h3>
              <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 18, lineHeight: 1.6 }}>
                Wählen Sie einen passenden Termin, ein Berater bespricht live mit Ihnen die Ergebnisse Ihres Sichtbarkeits-Checks
              </p>
              <SlotPicker onConfirm={(day, slot) => { setBookedQuizDay(day); setBookedQuizSlot(slot); setStep(10) }} />
            </div>
          )}

          {/* ── Step 10: Booking confirmed ── */}
          {step === 10 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>✅</div>
              <h3 style={{ fontWeight: 700, fontSize: 18, color: '#030712', marginBottom: 10 }}>Ihr Termin ist gebucht!</h3>
              <div style={{ backgroundColor: '#f2f2ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '14px 16px', marginBottom: 14, textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#2600FF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Ihr Termin</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#030712', marginBottom: 3 }}>
                  {bookedQuizDay?.date ?? ''} um {bookedQuizSlot} Uhr
                </div>
                <div style={{ fontSize: 12, color: '#4b5563' }}>
                  Eine Kalendereinladung und Ihre Check-Ergebnisse werden an <strong>{email || 'Ihre E-Mail-Adresse'}</strong> gesendet
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, marginBottom: 16 }}>
                Ihr Berater sichtet Ihre Ergebnisse vor dem Anruf, damit Sie eine persönliche Beratung erhalten – keine Standard-Präsentation.
              </p>
              <button onClick={reset} style={{ backgroundColor: '#f2f2ff', color: '#2600FF', fontWeight: 500, fontSize: 13, padding: '9px 20px', borderRadius: 10, border: '1px solid #ddd6fe', cursor: 'pointer', fontFamily: 'inherit' }}>Neu starten</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────
const faqs = [
  { q: 'Können Sie Platz 1 bei Google garantieren?', a: "Nein — und niemand kann das seriös versprechen. Google bewertet lokale Ergebnisse unter anderem nach Relevanz, Entfernung zum Suchenden und Bekanntheit des Unternehmens. Auf einen Teil davon haben wir direkten Einfluss, auf anderes nicht. Was wir zusagen: Wir bringen alle beeinflussbaren Faktoren in Ordnung, arbeiten kontinuierlich daran und zeigen Ihnen an konkreten Zahlen, was sich bewegt." },
  { q: 'Brauche ich unbedingt eine Website?', a: "Für den Start nicht zwingend. Ein vollständig gepflegtes Google-Unternehmensprofil kann die erste Grundlage sein. Sobald Sie mehrere Leistungen, mehrere Regionen oder erklärungsbedürftige Angebote haben, wird die Website aber zur Wissensbasis, aus der Google und KI-Systeme ihre Antworten über Sie ziehen." },
  { q: 'Wie kann mein Unternehmen in ChatGPT erscheinen?', a: "Indem die Informationen über Ihr Unternehmen im Web klar, zugänglich und widerspruchsfrei sind: verständlich beschriebene Leistungen, eine logisch strukturierte Website, übereinstimmende Angaben auf allen Plattformen, externe Erwähnungen und Inhalte, die für Suchsysteme abrufbar sind. Eine separate \"KI-Optimierung\" jenseits sauberer Grundlagen gibt es nicht — wir sorgen dafür, dass diese Grundlagen stimmen." },
  { q: 'Wie wird RAG abgerechnet?', a: "RAG ist als monatliches Retainer-Modell aufgebaut, mit dem Preis abhängig von den aktivierten Modulen. Nach dem kostenlosen Sichtbarkeits-Check wählen Sie ein Paket, das zu Ihrem Budget passt. Es gibt keine versteckten Gebühren oder langfristige Bindung. Die meisten Kunden starten mit dem Kern-Sichtbarkeitspaket (Maps, Bewertungen, KI) und ergänzen Anzeigen oder Offline-Werbung, sobald sie skalieren wollen." },
  { q: 'Wie schnell sehe ich Ergebnisse?', a: 'Die meisten Kunden sehen innerhalb der ersten 2–4 Wochen messbare Verbesserungen bei Anrufvolumen und Ranking-Position. Bewertungsdynamik und KI-Sichtbarkeit bauen sich in der Regel über 6–8 Wochen auf. Wir verfolgen alles und teilen wöchentliche Fortschrittsberichte, damit Sie immer wissen, was sich bewegt hat.' },
  { q: "Ich habe es schon mit anderen Agenturen versucht, ohne Erfolg. Was ist hier anders?", a: "Die meisten Agenturen konzentrieren sich auf einen einzigen Kanal, meist SEO oder Anzeigen, und optimieren isoliert. Es bewegt sich nichts, weil Kunden mehrere Signale nutzen, bevor sie jemanden kontaktieren. RAG behandelt alle Kanäle als ein System. Der Sichtbarkeits-Check zeigt Ihnen zudem genau, welche Lücke Sie am meisten kostet, sodass Sie nicht raten müssen." },
  { q: 'Wie viel von meiner Zeit kostet das?', a: "Nach dem ersten Onboarding-Gespräch (ca. 45 Minuten) fast keine. Wir übernehmen Einrichtung, Optimierung und laufende Betreuung. Sie sichten einen kurzen Wochenbericht und beantworten Bewertungen, die wir Ihnen markieren. Die meisten Kunden wenden weniger als 30 Minuten pro Woche auf." },
]

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL VISIBILITY EXPLAINED
// ─────────────────────────────────────────────────────────────────────────────
const explainedItems = [
  { q: 'Was ist lokales Marketing?', a: "Lokales Marketing ist alles, was Ihr Unternehmen zur naheliegenden Wahl für Kunden in der Umgebung macht: Ihr Google-Maps-Ranking, was KI-Tools über Sie sagen, Ihre Bewertungen, Ihre Social-Media-Präsenz und jede bezahlte oder Offline-Werbung in Ihrer Region. Es ist nicht ein Kanal. Es ist, wie sichtbar Sie überall dort sind, wo ein Kunde in dem Moment nachschaut, in dem er kaufbereit ist." },
  { q: 'Warum braucht es einen umfassenden Ansatz?', a: 'Ein Kunde findet Sie vielleicht auf Google Maps, checkt Ihr Instagram, liest Ihre Bewertungen und fragt ChatGPT, ob Sie gut sind – alles innerhalb von fünf Minuten. Scheitert nur einer dieser Checks, geht er zum nächsten Ergebnis. Einen Kanal zu reparieren und die anderen zu ignorieren, kostet Sie trotzdem den Verkauf.' },
  { q: 'Wie wird ein lokales Unternehmen bei Google gefunden?', a: "Google rankt lokale Ergebnisse vor allem nach drei Dingen: wie vollständig und aktiv Ihr Unternehmensprofil ist, wie viele aktuelle Top-Bewertungen Sie haben, und wie relevant Ihr Eintrag für die Suche ist. Die meisten Unternehmen verlieren bei allen drei Punkten, einfach weil niemand dafür zuständig ist, sie aktuell zu halten." },
  { q: 'Warum sind Bewertungen so wichtig?', a: "Bewertungen sind das schnellste Vertrauenssignal, das ein Fremder prüfen kann. 85 % der Kunden behandeln sie wie eine persönliche Empfehlung – aber nur, wenn sie aktuell sind. Ein 4,9-Sterne-Schnitt von vor zwei Jahren wirkt inaktiv. Ein stetiger Strom frischer Bewertungen wirkt wie ein Unternehmen, das gerade jetzt floriert." },
  { q: 'Wie funktioniert lokales SEO?', a: "Lokales SEO sorgt dafür, dass Ihr Unternehmen bei Suchanfragen mit örtlichem Bezug erscheint. Dafür zählen vor allem drei Dinge: ein vollständiges, aktives Google-Unternehmensprofil, eine Website, die Ihre Leistungen und Ihr Einzugsgebiet klar beschreibt, und einheitliche Angaben zu Name, Adresse und Telefonnummer über alle Plattformen und Verzeichnisse hinweg." },
  { q: 'Wie wird ein Unternehmen in ChatGPT und Perplexity gefunden?', a: "KI-Systeme geben wieder, was sie im Web verlässlich über Sie finden. Sie brauchen also klare Leistungsbeschreibungen, eine logisch strukturierte Website, übereinstimmende Informationen auf allen Plattformen und externe Erwähnungen, die das bestätigen. Gute Grundlagen in Suche und Profil wirken direkt auch hier — eine getrennte Zauberformel für KI gibt es nicht." },
]

function LocalVisibilityExplained() {
  return (
    <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)' }}>
      <div style={{ ...SHELL }}>
        <div className="expl-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.4fr) minmax(0, 1fr)', gap: 'clamp(32px, 5vw, 80px)', alignItems: 'start' }}>
          <div className="expl-sticky" style={{ position: 'sticky', top: 120 }}>
            <Reveal><Kicker>Grundlagen</Kicker></Reveal>
            <MaskHeading
              className="h-md"
              style={{ marginTop: 22, marginBottom: 20 }}
              lines={[<>Lokale Sichtbarkeit,</>, <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>einfach erklärt</span></>]}
            />
            <Reveal delay={0.12}>
              <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'var(--muted)', margin: '0 0 26px', maxWidth: 320 }}>
                Die kurzen Antworten auf die Fragen, die uns in fast jedem Erstgespräch gestellt werden.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20, maxWidth: 320 }}>
                <p className="eyebrow" style={{ fontSize: 9.5, color: 'rgba(7,7,12,0.35)', marginBottom: 14 }}>Ausführlich im Ratgeber</p>
                {ratgeberArticles.map(a => (
                  <a key={a.slug} href={`/ratgeber/${a.slug}`} className="ul" style={{ display: 'block', width: 'fit-content', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 10, lineHeight: 1.5 }}>
                    {a.title}
                  </a>
                ))}
                <a href="/glossar" className="ul" style={{ display: 'inline-block', marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--electric)' }}>
                  Alle Begriffe im Glossar →
                </a>
              </div>
            </Reveal>
          </div>

          <div>
            {explainedItems.map((item, i) => (
              <Reveal key={i} delay={Math.min(i * 0.06, 0.24)}>
                <div className="expl-row" style={{
                  display: 'grid', gridTemplateColumns: '46px minmax(0, 0.9fr) minmax(0, 1.1fr)',
                  gap: 'clamp(14px, 2vw, 32px)',
                  padding: 'clamp(26px, 3vw, 40px) 0',
                  borderTop: '1px solid var(--line)',
                }}>
                  <span className="display" style={{ fontSize: 13, color: 'var(--electric)', letterSpacing: '0.08em', paddingTop: 6 }}>{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="display" style={{ fontSize: 'clamp(18px, 1.7vw, 24px)', lineHeight: 1.2, margin: 0 }}>{item.q}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--muted)', margin: 0 }}>{item.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" style={{ backgroundColor: 'var(--bone)', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)' }}>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }} />
      <div style={{ ...SHELL, maxWidth: 1000 }}>
        <Reveal><Kicker>FAQ</Kicker></Reveal>
        <div className="faq-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap', marginTop: 26, marginBottom: 'clamp(36px, 4vw, 56px)' }}>
          <MaskHeading className="h-lg" lines={[<>Häufige Fragen</>, <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>beantwortet</span></>]} />
          <Reveal delay={0.12}>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, paddingBottom: 8, maxWidth: 280 }}>Alles, was Sie wissen müssen, bevor Sie Ihren Sichtbarkeits-Check starten</p>
          </Reveal>
        </div>

        <div style={{ borderTop: '1px solid var(--line)' }}>
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                <button onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
                    padding: 'clamp(22px, 2.4vw, 32px) 0', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}>
                  <span className="display" style={{ fontSize: 'clamp(17px, 1.7vw, 25px)', lineHeight: 1.25, color: isOpen ? 'var(--electric)' : 'var(--ink)', transition: 'color 0.35s ease' }}>{f.q}</span>
                  <span style={{
                    flexShrink: 0, width: 38, height: 38, borderRadius: '50%',
                    border: `1px solid ${isOpen ? 'var(--electric)' : 'var(--line)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                    transition: `transform 0.5s ${EASE}, border-color 0.35s ease`,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" stroke={isOpen ? '#2600FF' : '#07070C'} strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </span>
                </button>
                <div style={{ overflow: 'hidden', maxHeight: isOpen ? 400 : 0, transition: `max-height 0.6s ${EASE}` }}>
                  <p className="faq-answer" style={{ margin: 0, paddingBottom: 30, paddingRight: 62, maxWidth: 760, fontSize: 14.5, lineHeight: 1.85, color: 'var(--muted)' }}>{f.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOSING CTA (audit + new-business, side by side on desktop)
// ─────────────────────────────────────────────────────────────────────────────
function DualCTA() {
  const [modal, setModal] = useState(false)
  const [hover, setHover] = useState<0 | 1 | null>(null)

  return (
    <>
      {modal && <BookCallModal onClose={() => setModal(false)} />}
      <section className="dual-cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '68vh' }}>
        {/* left — light */}
        <div
          onMouseEnter={() => setHover(0)} onMouseLeave={() => setHover(null)}
          style={{
            backgroundColor: 'var(--paper)', padding: 'clamp(56px, 7vw, 110px) clamp(24px, 5vw, 80px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            transition: 'background-color 0.6s ease',
          }}>
          <div style={{ position: 'absolute', inset: 0, opacity: hover === 0 ? 1 : 0.8, transition: 'opacity 0.7s ease' }}><ForkBackdrop tone="light" dir="down" /></div>
          <div style={{ position: 'relative', maxWidth: 620 }}>
            <Reveal><Kicker>Schritt eins</Kicker></Reveal>
            <MaskHeading
              className="h-md"
              style={{ marginTop: 22, marginBottom: 18 }}
              lines={[<>Machen Sie das kostenlose</>, <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>2-Minuten-</span></>, <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>Sichtbarkeits-Check</span></>]}
            />
            <Reveal delay={0.1}>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', marginBottom: 30 }}>
                Beantworten Sie in 2 Minuten 5 Fragen, um Ihren aktuellen Status bei Google und KI zu erfahren, und erhalten Sie einen Schritt-für-Schritt-Wachstumsplan
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <a href="#audit-quiz" className="btn btn-lg btn-electric">Sichtbarkeits-Check starten <span className="arw">→</span></a>
            </Reveal>
          </div>
        </div>

        {/* right — dark */}
        <div
          onMouseEnter={() => setHover(1)} onMouseLeave={() => setHover(null)}
          style={{
            backgroundColor: 'var(--ink)', color: '#fff',
            padding: 'clamp(56px, 7vw, 110px) clamp(24px, 5vw, 80px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
          <div style={{ position: 'absolute', inset: 0, opacity: hover === 1 ? 1 : 0.8, transition: 'opacity 0.7s ease' }}><ForkBackdrop tone="dark" dir="up" /></div>
          <div style={{ position: 'relative', maxWidth: 620 }}>
            <Reveal><Kicker tone="light">Neugründung</Kicker></Reveal>
            <MaskHeading
              className="h-md"
              style={{ marginTop: 22, marginBottom: 18 }}
              lines={[<>Noch keine</>, <><span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>digitale Präsenz?</span></>, <>Starten Sie mit Google Maps.</>]}
            />
            <Reveal delay={0.1}>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.55)', marginBottom: 30 }}>
                Keine Bewertungen, kein Google-Profil, keine Social-Media-Follower. Kein Problem. Wir erstellen und optimieren Ihr Google-Unternehmensprofil ab 149 € — die professionelle Grundlage, auf der alles Weitere aufbaut.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <button onClick={() => setModal(true)} className="btn btn-lg btn-paper">Google Business Profil ab 149 € starten <span className="arw">→</span></button>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', marginTop: 14 }}>Kein Check nötig. Wir sprechen kurz über Ihr Unternehmen und legen los.</p>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: 'clamp(56px, 6vw, 88px) clamp(20px, 4vw, 48px) 28px', position: 'relative', overflow: 'hidden', borderTop: '1px solid var(--line-dark)' }}>
      <div style={{ ...SHELL, position: 'relative' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) repeat(3, minmax(0,1fr))', gap: 'clamp(28px, 4vw, 56px)', marginBottom: 'clamp(48px, 6vw, 80px)' }}>
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', maxWidth: 300, margin: '0 0 22px' }}>
              Das einheitliche System für lokale Sichtbarkeit bei Google, KI und Offline-Kanälen.
            </p>
            <a href={homeHref('audit-quiz')} className="btn btn-md btn-outline-dark">Sichtbarkeits-Check starten <span className="arw">→</span></a>
          </div>
          {[
            { title: 'Navigation', items: [['Sichtbarkeit', 'audit'], ['Leistungen', '/services'], ['Ratgeber', '/ratgeber'], ['Glossar', '/glossar'], ['Ergebnisse', 'results'], ['FAQ', 'faq']] as [string, string][] },
          ].map(col => (
            <div key={col.title}>
              <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>{col.title}</p>
              {col.items.map(([l, target]) => (
                <a key={l} href={linkHref(target)} className="ul" style={{ display: 'block', width: 'fit-content', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>{l}</a>
              ))}
            </div>
          ))}
          <div>
            <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>Rechtliches</p>
            {['Impressum', 'Datenschutz', 'DSGVO-Konformität', 'AGB'].map(l => (
              <a key={l} href="#" className="ul" style={{ display: 'block', width: 'fit-content', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>{l}</a>
            ))}
          </div>
          <div>
            <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>Kontakt</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.9, margin: 0 }}>
              Musterstraße 12<br />10115 Berlin, Deutschland<br />
              <a href="tel:+493012345678" className="ul" style={{ color: 'inherit' }}>+49 30 12345678</a><br />
              <a href="mailto:hallo@rag-agentur.de" className="ul" style={{ color: 'inherit' }}>hallo@rag-agentur.de</a>
            </p>
          </div>
        </div>

        {/* oversized wordmark */}
        <div aria-hidden style={{ position: 'relative', lineHeight: 0.8, marginBottom: 24, overflow: 'hidden' }}>
          <span className="display" style={{ fontSize: 'clamp(72px, 20vw, 300px)', letterSpacing: '-0.06em', display: 'block', color: '#fff' }}>
            RAG<span style={{ color: 'var(--electric)' }}>.</span>
          </span>
        </div>

        <div style={{ borderTop: '1px solid var(--line-dark)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>© 2026 RAG, Regionale Agentur. Alle Rechte vorbehalten.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>DSGVO-konform · Made in Deutschland</p>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE PAGES — standalone landing page per service, one per paid-ad angle.
// Each one stands alone (own hero, own CTA) and cross-links to the others,
// rather than asking a visitor to piece together a bundle up front.
// ─────────────────────────────────────────────────────────────────────────────
type ServicePageData = {
  slug: string
  Illust: React.ComponentType
  kicker: string
  heroTitle: string
  heroSubtitle: string
  whatTitle: string
  whatBody: string
  howTitle: string
  howItems: { title: string; body: string }[]
  receiveTitle: string
  receiveItems: string[]
  whyTitle: string
  whyBody: string
  faq: { q: string; a: string }[]
  ctaTitle: string
  ctaBody: string
}

const servicePages: ServicePageData[] = [
  {
    slug: 'google-maps-business-profile',
    Illust: IllustMapsProfile,
    kicker: 'GOOGLE MAPS & UNTERNEHMENSPROFIL',
    heroTitle: 'Dominieren Sie die lokale Suche auf Google Maps',
    heroSubtitle: 'Optimierung Ihres Google-Unternehmensprofils, damit Google Ihr Unternehmen als führende lokale Lösung für Ihre Leistungen einstuft.',
    whatTitle: 'Was ist Google-Unternehmensprofil-Optimierung?',
    whatBody: 'Die Optimierung des Google-Unternehmensprofils (GBP) strukturiert Ihre lokale digitale Präsenz so, dass Google Ihr Unternehmen als führende lokale Lösung für Ihre Leistungen einstuft.',
    howTitle: 'Wie wir Ihre lokalen Rankings steigern',
    howItems: [
      { title: 'Datenbereinigung', body: 'Wir prüfen und bereinigen doppelte Einträge sowie fehlerhafte NAP-Daten (Name, Adresse, Telefon) in allen Verzeichnissen.' },
      { title: 'Kategorieauswahl', body: 'Wir identifizieren und konfigurieren reichweitenstarke Haupt- und Nebenkategorien passend zur lokalen Suchabsicht.' },
      { title: 'Inhaltliche Anreicherung', body: 'Wir laden geotaggte Bilder, lokalisierte Produktlisten und klare Leistungsbeschreibungen hoch.' },
      { title: 'Laufende Pflege', body: 'Wir pflegen Ihr Profil laufend und veröffentlichen Updates, damit Google-Algorithmen aktiven Betrieb erkennen.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Hochsichtbare Platzierung im lokalen Top-3-Bereich von Google Maps bei kaufbezogenen Suchanfragen.',
      'Direktes Wachstum bei eingehenden Anrufen, Routenanfragen und Website-Besuchen.',
      'Regelmäßige Leistungsanalysen zu den Suchaktionen Ihrer Kunden.',
    ],
    whyTitle: 'Warum lokale Sichtbarkeit auf der Karte zählt',
    whyBody: 'Interessenten, die lokale Anbieter suchen, schauen selten über die ersten drei Platzierungen auf der Karte hinaus. Ein nicht optimierter Eintrag überlässt kaufbereite Leads den Mitbewerbern auf diesen Top-Positionen.',
    faq: [
      { q: 'Wie lange dauert es, bis ich Ergebnisse auf Google Maps sehe?', a: 'Erste Ranking-Verbesserungen und mehr Kundenaktionen zeigen sich in der Regel innerhalb von 30 bis 90 Tagen nach der Profiloptimierung und Bereinigung der Verzeichniseinträge.' },
      { q: 'Brauche ich ein physisches Ladengeschäft, um Google Business Profile zu nutzen?', a: 'Nein. Dienstleistungsunternehmen, die zu ihren Kunden fahren, können optimierte Profile mit festgelegten Servicegebieten betreiben, ohne die Privatadresse offenzulegen.' },
    ],
    ctaTitle: 'Kostenloser Sichtbarkeits-Check Ihres Google-Profils',
    ctaBody: 'Wir prüfen Ihr Google-Unternehmensprofil, benennen die Blocker in Ihrer Platzierung und zeigen die lokalen Wachstumschancen, die Sie aktuell liegen lassen.',
  },
  {
    slug: 'website-google-search',
    Illust: IllustWebsiteSearch,
    kicker: 'WEBSITE & GOOGLE SEARCH',
    heroTitle: 'Eine Website, die Menschen, Google und KI-Systeme verstehen',
    heroSubtitle: 'Ihre Website ist die Wissensbasis Ihres Unternehmens. Wir strukturieren sie so, dass Kunden schnell finden, was sie suchen – und Suchmaschinen wie KI-Systeme Ihre Leistungen korrekt wiedergeben.',
    whatTitle: 'Was bedeutet eine strukturierte Website?',
    whatBody: 'Eine gute Website sieht nicht nur gut aus. Sie erklärt in klarer Struktur, wer Sie sind, welche Leistungen Sie anbieten, in welchen Regionen Sie arbeiten und warum man Ihnen vertrauen kann – für Menschen und für Maschinen gleichermaßen lesbar.',
    howTitle: 'Wie wir Ihre Website aufbauen',
    howItems: [
      { title: 'Klare Seitenstruktur', body: 'Eigene Seiten für jede Leistung, für Ihre Regionen und Servicegebiete, für Unternehmen und Team sowie für Referenzen und Kundenprojekte.' },
      { title: 'Inhalte, die Fragen beantworten', body: 'Ratgeber-Artikel zu den Fragen Ihrer Kunden und ein Glossar, das Fachbegriffe verständlich erklärt – die Grundlage für Sichtbarkeit in Suche und KI.' },
      { title: 'Interne Verlinkung', body: 'Glossar führt zum Ratgeber, Ratgeber zur passenden Leistung, Leistung zur Anfrage. So findet jeder Besucher den nächsten sinnvollen Schritt.' },
      { title: 'Technik & strukturierte Daten', body: 'Ladezeiten, mobile Darstellung, Indexierbarkeit und Schema-Markup, damit Ihre Inhalte gefunden, verstanden und korrekt zitiert werden können.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Eine Website-Struktur, die jede Leistung und jede Region eigenständig sichtbar macht.',
      'Inhalte, die Suchmaschinen und KI-Systeme als Quelle über Ihr Unternehmen nutzen können.',
      'Einen klaren Weg vom ersten Besuch bis zur Anfrage – ohne Umwege.',
    ],
    whyTitle: 'Warum die Website die Basis bleibt',
    whyBody: 'Google-Profil, Bewertungen und soziale Netzwerke verweisen alle auf einen Punkt: Ihre Website. Fehlen dort klare Antworten, brechen Interessenten genau in dem Moment ab, in dem sie sich entscheiden wollten – und KI-Systeme haben keine verlässliche Quelle über Sie.',
    faq: [
      { q: 'Können Sie meine bestehende Website optimieren?', a: 'In den meisten Fällen ja. Wir prüfen Struktur, Inhalte und Technik Ihrer bestehenden Website und verbessern gezielt das, was Sichtbarkeit und Anfragen blockiert. Nur wenn die technische Basis eine sinnvolle Weiterentwicklung nicht zulässt, empfehlen wir einen Neuaufbau.' },
      { q: 'Brauche ich unbedingt eine Website?', a: 'Für den Start reicht ein gut gepflegtes Google-Unternehmensprofil oft aus. Sobald Sie aber mehrere Leistungen, mehrere Regionen oder erklärungsbedürftige Angebote haben, ist die Website der Ort, an dem all das verständlich zusammenkommt – auch für KI-Systeme.' },
    ],
    ctaTitle: 'Kostenloser Sichtbarkeits-Check Ihrer Website',
    ctaBody: 'Wir prüfen Struktur, Inhalte und Technik Ihrer Website und zeigen Ihnen, welche Schritte Ihre Sichtbarkeit bei Google und in der KI-Suche am stärksten verbessern.',
  },
  {
    slug: 'ai-search-optimization',
    Illust: IllustAIOptimization,
    kicker: 'KI-SUCHOPTIMIERUNG',
    heroTitle: 'Werden Sie von ChatGPT, Perplexity & Google AI empfohlen',
    heroSubtitle: 'Generative Engine Optimization (GEO) strukturiert Ihre Markeninformationen so, dass große Sprachmodelle Ihr Unternehmen bei KI-gestützten Suchanfragen erkennen, verarbeiten und empfehlen.',
    whatTitle: 'Was ist KI-Optimierung (Generative Engine Optimization)?',
    whatBody: 'KI-Optimierung strukturiert Ihre Markeninformationen so, dass große Sprachmodelle (LLMs) Ihr Unternehmen bei KI-gestützten Suchanfragen erkennen, verarbeiten und empfehlen.',
    howTitle: 'Wie wir Ihre Marke in KI-Antworten platzieren',
    howItems: [
      { title: 'Entitätsstrukturierung', body: 'Wir implementieren präzises JSON-LD-Schema-Markup, damit KI-Algorithmen exakte Fakten zu Ihren Leistungen erfassen.' },
      { title: 'Aufbau von Autorität', body: 'Wir schaffen Fremdzitate auf Plattformen, die KI-Modelle für Echtzeit-Webrecherche und Trainingsdaten nutzen.' },
      { title: 'Semantische Content-Optimierung', body: 'Wir gestalten Online-Inhalte so, dass sie natürlichsprachliche Anfragen beantworten, wie sie ChatGPT, Perplexity und Google AI Overviews verarbeiten.' },
      { title: 'KI-Abruf-Monitoring', body: 'Wir verfolgen Markenwahrnehmung, Zitierhäufigkeit und Platzierungsgenauigkeit auf den wichtigsten KI-Plattformen.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Direkte Markenerwähnungen in KI-generierten Zusammenfassungen und Empfehlungen.',
      'Frühzeitige Gewinnung von Käufern, die sich von klassischen Suchmaschinen abwenden.',
      "Messbares Wachstum Ihrer Markenpräsenz in KI-Antwortsystemen.",
    ],
    whyTitle: 'Warum KI-Sichtbarkeit entscheidend ist',
    whyBody: 'Suchgewohnheiten verändern sich. Verbraucher verlassen sich auf KI-Assistenten, um Optionen zu filtern und konkrete Empfehlungen zu erhalten. Unternehmen, die in KI-Abrufsystemen fehlen, verlieren Marktanteile, noch bevor klassische Suchergebnisse überhaupt betrachtet werden.',
    faq: [
      { q: 'Wie unterscheidet sich KI-Optimierung von klassischem SEO?', a: 'Klassisches SEO rankt einzelne Webseiten in den Suchergebnissen. KI-Optimierung sorgt dafür, dass generative KI-Modelle (wie ChatGPT und Perplexity) Ihre Marke in ihren Zusammenfassungen referenzieren und empfehlen.' },
      { q: 'Können KI-Plattformen eine Empfehlung für mein Unternehmen garantieren?', a: 'Generative Modelle basieren auf probabilistischem Datenabruf. Durch strukturierte Entitätsautorität und klare semantische Signale maximieren wir die Wahrscheinlichkeit, dass Ihr Unternehmen als primäre Antwort ausgewählt wird.' },
    ],
    ctaTitle: 'Kostenloser Check Ihrer KI-Sichtbarkeit',
    ctaBody: 'Erfahren Sie, wie ChatGPT, Perplexity und Google AI Ihre Marke aktuell bewerten, und erhalten Sie einen Optimierungsfahrplan.',
  },
  {
    slug: 'reviews',
    Illust: IllustReviews,
    kicker: 'GOOGLE- & TRUSTPILOT-BEWERTUNGEN',
    heroTitle: 'Machen Sie aus jedem Kunden eine 5-Sterne-Bewertung',
    heroSubtitle: 'Strategisches Bewertungsmanagement erzeugt einen stetigen Strom verifizierter Top-Bewertungen auf den Plattformen, die Kaufentscheidungen beeinflussen.',
    whatTitle: 'Was ist strategisches Bewertungsmanagement?',
    whatBody: 'Bewertungsmanagement erzeugt einen stetigen Strom verifizierter Top-Bewertungen auf den Plattformen, die Kaufentscheidungen beeinflussen.',
    howTitle: 'Wie wir Ihr Bewertungsprofil aufbauen',
    howItems: [
      { title: 'Automatisierte Anfragen', body: 'Wir integrieren automatisierte SMS- und E-Mail-Abläufe, die nach dem Kundenkontakt ausgelöst werden.' },
      { title: 'Reibungslose Abgabe', body: 'Wir bauen direkte Bewertungsportale, über die Kunden mit wenigen Klicks Feedback abgeben können.' },
      { title: 'SEO-optimierte Antworten', body: 'Wir verfassen professionelle Antworten mit relevanten Keywords, die das lokale Suchranking unterstützen.' },
      { title: 'Benachrichtigungssysteme', body: 'Wir richten sofortige Benachrichtigungen ein, um kritisches Feedback effizient zu bearbeiten.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Mehr und häufigere 5-Sterne-Bewertungen bei Google und Trustpilot.',
      'Bessere lokale Suchrelevanz dank keywordreichem Kundenfeedback.',
      'Conversion-Badges auf Ihrer Website, die Besuchern Live-Sternebewertungen zeigen.',
    ],
    whyTitle: 'Warum die Bewertungsgeschwindigkeit den Umsatz antreibt',
    whyBody: 'Käufer gewichten Kundenfeedback deutlich stärker als Werbebotschaften. Unternehmen mit aktiven 5-Sterne-Bewertungen konvertieren Interessenten deutlich zuverlässiger als Mitbewerber mit wenigen oder veralteten Bewertungen.',
    faq: [
      { q: 'Ist es im Einklang mit den Plattformrichtlinien, um Bewertungen zu bitten?', a: 'Ja. Google und Trustpilot erlauben es Unternehmen, Kunden um authentisches Feedback zu bitten. Wir halten uns strikt an die Plattformrichtlinien und vermeiden gefilterte oder incentivierte Bewertungen.' },
      { q: 'Wie gehen Sie mit negativem Kundenfeedback um?', a: 'Wir richten schnelle Benachrichtigungsabläufe und öffentliche Antwortstrukturen ein, die Anliegen professionell adressieren und Verantwortungsbewusstsein gegenüber potenziellen Kunden zeigen.' },
    ],
    ctaTitle: 'Kostenloser Check Ihres Bewertungsprofils',
    ctaBody: 'Vergleichen Sie Ihre aktuelle Bewertungsgeschwindigkeit und Sternebewertung mit den führenden Mitbewerbern in Ihrem Markt.',
  },
  {
    slug: 'local-citations',
    Illust: IllustCitations,
    kicker: 'LOKALE VERZEICHNISSE & ERWÄHNUNGEN',
    heroTitle: 'Überall dieselben Angaben — überall auffindbar',
    heroSubtitle: 'Wir bringen Ihre Firmendaten auf allen relevanten Portalen in Übereinstimmung und sorgen dafür, dass Ihr Unternehmen dort auftaucht, wo in Ihrer Branche und Region gesucht wird.',
    whatTitle: 'Was sind lokale Verzeichnisse und Erwähnungen?',
    whatBody: 'Jede Nennung Ihres Unternehmens außerhalb Ihrer eigenen Kanäle — Branchenportale, Kartendienste, Kammer- und Verbandsverzeichnisse, lokale Medien — bestätigt, dass es Ihren Betrieb gibt und dass die Angaben stimmen. Diese Quellen nutzen Suchmaschinen und KI-Systeme, um sich ein Bild von Ihnen zu machen.',
    howTitle: 'Wie wir vorgehen',
    howItems: [
      { title: 'Bestandsaufnahme', body: 'Wir erfassen, wo Ihr Unternehmen bereits eingetragen ist — inklusive vergessener Einträge mit alter Adresse oder alter Rufnummer.' },
      { title: 'Korrektur und Bereinigung', body: 'Wir korrigieren abweichende Angaben, führen Dubletten zusammen und lassen veraltete Einträge entfernen.' },
      { title: 'Gezielter Ausbau', body: 'Wir legen fehlende Einträge auf den Portalen an, die in Ihrer Branche und Ihrer Region tatsächlich Reichweite haben — statt auf hunderten belanglosen Verzeichnissen.' },
      { title: 'Laufende Kontrolle', body: 'Wir prüfen regelmäßig, ob Angaben von Dritten verändert wurden, und halten Name, Adresse und Telefonnummer überall identisch.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Einheitliche Firmendaten auf allen relevanten Plattformen (NAP-Konsistenz).',
      'Eine dokumentierte Übersicht Ihrer Einträge mit Zugangsdaten und Status.',
      'Eine stabilere Grundlage für Ihre Platzierung bei Google Maps und für KI-Antworten über Ihr Unternehmen.',
    ],
    whyTitle: 'Warum widersprüchliche Angaben teuer sind',
    whyBody: 'Eine alte Telefonnummer in einem vergessenen Portal kostet Sie zweimal: Anrufe, die nirgends ankommen, und Signale, die Ihrer Sichtbarkeit widersprechen. Konsistenz ist unspektakuläre Arbeit — und einer der häufigsten Gründe, warum ein gut gepflegtes Google-Profil trotzdem nicht nach oben kommt.',
    faq: [
      { q: 'Brauche ich Einträge in hunderten Verzeichnissen?', a: 'Nein. Entscheidend sind die Portale, die in Ihrer Branche und Region tatsächlich genutzt und von Suchmaschinen ausgewertet werden. Masse an belanglosen Einträgen bringt nichts und erschwert die Pflege.' },
      { q: 'Was passiert mit alten, falschen Einträgen?', a: 'Wir beantragen Korrektur oder Löschung. Bei manchen Portalen dauert das einige Wochen, weil die Freigabe beim Betreiber liegt — wir verfolgen den Status und melden zurück.' },
    ],
    ctaTitle: 'Kostenloser Check Ihrer Einträge',
    ctaBody: 'Wir prüfen, wo Ihr Unternehmen eingetragen ist, welche Angaben voneinander abweichen und welche Portale in Ihrer Region fehlen.',
  },
  {
    slug: 'social-media',
    Illust: IllustSocial,
    kicker: 'SOCIAL-MEDIA-PRÄSENZ',
    heroTitle: 'Social Proof, der wirklich konvertiert',
    heroSubtitle: 'Professionelles Social-Media-Management macht aus passiven Profilen einen organisierten Kompetenznachweis, der Ihre Arbeit, Werte und Kundenzufriedenheit zeigt.',
    whatTitle: 'Was ist professionelles Social-Media-Präsenzmanagement?',
    whatBody: 'Social-Media-Management macht aus passiven Profilen einen organisierten Kompetenznachweis, der Ihre Arbeit, Werte und Kundenzufriedenheit zeigt.',
    howTitle: 'Wie wir Ihre Social-Media-Kanäle betreuen',
    howItems: [
      { title: 'Content-Strategie', body: 'Wir planen Redaktionspläne rund um echte Projekte, Kundenfeedback und Ihre Kompetenz.' },
      { title: 'Content-Erstellung', body: 'Wir gestalten klare visuelle Inhalte mit informativen, nutzenorientierten Texten.' },
      { title: 'Konsequente Veröffentlichung', body: 'Wir veröffentlichen regelmäßig auf Instagram und Facebook.' },
      { title: 'Profiloptimierung', body: 'Wir strukturieren Profilbeschreibungen, Aktionsbuttons und Ziel-Links, um Besucher in den Verkaufsprozess zu führen.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Eine aktive, professionelle Markenpräsenz, die sofort Glaubwürdigkeit schafft.',
      'Gezielten Traffic von sozialen Netzwerken zu Ihrer Unternehmenswebsite.',
      'Einen wiederverwendbaren Fundus an visuellen Inhalten für künftige Kampagnen.',
    ],
    whyTitle: 'Warum Social Proof Conversions antreibt',
    whyBody: 'Inaktive Social-Media-Profile wecken Zweifel am Geschäftsbetrieb. Ein aktueller, gepflegter Feed ist der klare Beweis, dass Ihr Unternehmen aktiv, zuverlässig und bei Kunden geschätzt ist.',
    faq: [
      { q: 'Wie oft werden Inhalte auf meinen Kanälen veröffentlicht?', a: 'Die Veröffentlichungsfrequenz orientiert sich an den Standards der jeweiligen Plattform, typischerweise 3 bis 5 strukturierte Beiträge pro Woche zzgl. regelmäßiger Story-Updates.' },
      { q: 'Übernehmen Sie sowohl die visuelle Produktion als auch das Texten?', a: 'Ja. Wir übernehmen die komplette Produktion – von Grafik-Layouts über Videoschnitt und Texterstellung bis zur Veröffentlichungsplanung.' },
    ],
    ctaTitle: 'Kostenloser Check Ihrer Social-Media-Präsenz',
    ctaBody: 'Fordern Sie eine Bewertung Ihrer bestehenden Social-Media-Kanäle an, um Lücken in Präsentation und Engagement aufzudecken.',
  },
  {
    slug: 'google-meta-ads',
    Illust: IllustAds,
    kicker: 'GOOGLE- & META-ANZEIGEN',
    heroTitle: 'Sofortige Sichtbarkeit, während organische Rankings wachsen',
    heroSubtitle: 'Google- & Meta-Anzeigen bringen Ihr Angebot direkt vor Zielgruppen, die aktiv nach Lösungen suchen oder zu Ihrem Käuferprofil passen.',
    whatTitle: 'Was ist bezahlte Such- und Social-Media-Werbung?',
    whatBody: 'Google- & Meta-Anzeigen bringen Ihr Angebot direkt vor Zielgruppen, die aktiv nach Lösungen suchen oder zu Ihrem Käuferprofil passen.',
    howTitle: 'Wie wir profitable Werbekampagnen aufbauen',
    howItems: [
      { title: 'Absichtsbasiertes Targeting', body: 'Wir strukturieren Google-Search-Kampagnen für kaufstarke Suchbegriffe.' },
      { title: 'Visuelle Social-Kampagnen', body: 'Wir gestalten kontraststarke Meta-Anzeigen (Facebook/Instagram), die klare Vorteile vermitteln.' },
      { title: 'Conversion-Analyse', body: 'Wir implementieren Conversion-Tracking für Anrufe, Formularausfüllungen und Abschlüsse.' },
      { title: 'Laufende Optimierung', body: 'Wir testen laufend Textvarianten, visuelle Inhalte und Landingpages, um die Kosten pro Lead zu senken.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Sofortigen Traffic von kaufbereiten lokalen Interessenten.',
      'Klare Kennzahlen zu Werbebudget, Kosten pro Lead und erzielter Rendite.',
      'Skalierbare Systeme zur Kundengewinnung mit planbarer Leistung.',
    ],
    whyTitle: 'Warum bezahlte Medien schnelles Wachstum liefern',
    whyBody: 'Organische Maßnahmen bauen Wert über Zeit auf, bezahlte Medien erzeugen dagegen sofortiges Anfragevolumen. Über die Kampagnenkosten steuern Sie den Lead-Zufluss direkt nach Ihrer Kapazität.',
    faq: [
      { q: 'Welches Budget brauche ich, um Werbekampagnen zu starten?', a: 'Das nötige Werbebudget hängt vom lokalen Wettbewerb und Branchenkennzahlen ab. Wir bewerten die Kampagnenparameter, um ein Startbudget festzulegen, das schnell aussagekräftige Daten liefert.' },
      { q: 'Sollte mein Unternehmen in Google Ads oder Meta Ads investieren?', a: 'Google Ads erfassen direkte Kaufabsicht von Nutzern, die aktiv nach Leistungen suchen. Meta Ads erzeugen visuell Nachfrage bei gezielten Zielgruppen. Die Kombination beider bietet umfassende Kanalabdeckung.' },
    ],
    ctaTitle: 'Kostenloser Check Ihres Anzeigenkontos',
    ctaBody: 'Wir sehen uns Ihr aktuelles Anzeigenkonto an oder entwickeln eine Kampagnenstrategie für Ihre Region und Ihre Leistungen.',
  },
  {
    slug: 'offline-advertising',
    Illust: IllustOffline,
    kicker: 'OFFLINE-WERBUNG',
    heroTitle: 'Physische Präsenz, die regionale Autorität aufbaut',
    heroSubtitle: 'Offline-Werbung platziert auffällige physische Anzeigen wie Plakate, Banner und lokale Printwerbung an Orten, die Ihre Zielgruppe täglich passiert.',
    whatTitle: 'Was ist strategische Offline-Werbung?',
    whatBody: 'Offline-Werbung platziert auffällige physische Anzeigen wie Plakate, Banner und lokale Printwerbung an Orten, die Ihre Zielgruppe täglich passiert.',
    howTitle: 'Wie wir Offline-Kampagnen umsetzen',
    howItems: [
      { title: 'Standortanalyse', body: 'Wir wählen Standorte nach Passantenfrequenz und Zielgruppenpassung aus.' },
      { title: 'Visuelle Gestaltung', body: 'Wir gestalten einfache, kontraststarke Layouts, die auch aus der Ferne und in Bewegung gut lesbar sind.' },
      { title: 'Erfolgsmessung', body: 'Wir integrieren dynamische Tracking-Mechanismen wie individuelle Landingpages, eigene URLs und exklusive Telefonnummern.' },
      { title: 'Medienbeschaffung', body: 'Wir übernehmen Flächenbuchung, Druck, Aufbau und Mediaplanung.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Gut sichtbare physische Präsenz an zentralen Zielorten.',
      'Höhere Markenbekanntheit, die die Conversion-Rate Ihrer Online-Kampagnen steigert.',
      'Messbares Conversion-Tracking für Offline-Medienkanäle.',
    ],
    whyTitle: 'Warum physische Medien Autorität aufbauen',
    whyBody: 'Physische Werbung demonstriert Größe und Stabilität Ihres Unternehmens. Die Kombination aus physischer Präsenz und Online-Kampagnen-Targeting schafft Multi-Touch-Wiedererkennung, die rein online agierende Mitbewerber nicht nachbilden können.',
    faq: [
      { q: 'Wie messen Sie die Ergebnisse physischer Werbekampagnen?', a: 'Wir integrieren eindeutige QR-Codes, spezifische Landingpage-Adressen und dedizierte Anruf-Tracking-Nummern auf physischen Medien, um eingehenden Traffic gezielt zu messen.' },
      { q: 'Ist Offline-Werbung sinnvoll für dienstleistungsbasierte Unternehmen?', a: 'Ja. Anzeigen in den jeweiligen Servicegebieten sorgen dafür, dass Ihr Unternehmen die erste Wahl bleibt, wenn lokale Kunden Ihre Leistungen benötigen.' },
    ],
    ctaTitle: 'Holen Sie sich Ihre kostenlose Offline-Medienstrategie',
    ctaBody: 'Fordern Sie eine Standortdichteanalyse an, um ertragsstarke physische Werbeflächen in Ihrer Region zu finden.',
  },
]

function ServiceLeadForm({ serviceLabel }: { serviceLabel: string }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [sent, setSent] = useState(false)
  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(7,7,12,0.14)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#030712', backgroundColor: '#fff' }

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
        <h3 style={{ fontWeight: 700, fontSize: 18, color: '#030712', marginBottom: 6 }}>Anfrage gesendet!</h3>
        <p style={{ fontSize: 14, color: '#4b5563' }}>Ein Berater sendet Ihnen Ihren {serviceLabel}-Check innerhalb von 24 Stunden.</p>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input style={inputStyle} placeholder="Ihr Name" value={name} onChange={e => setName(e.target.value)} />
      <input style={inputStyle} placeholder="E-Mail oder Telefon" value={contact} onChange={e => setContact(e.target.value)} />
      <button
        disabled={!name || !contact}
        onClick={() => setSent(true)}
        style={{ padding: '13px', borderRadius: 999, border: 'none', backgroundColor: (!name || !contact) ? '#e5e7eb' : '#2600FF', color: (!name || !contact) ? '#9ca3af' : '#fff', fontWeight: 600, fontSize: 14, cursor: (!name || !contact) ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}>
        Anfrage senden
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT HUB — Glossar → Ratgeber → Leistung → Anfrage
// Glossar erklärt den Begriff, der Ratgeber erklärt den Zusammenhang,
// die Leistungsseite verkauft die Umsetzung, der Check ist die Anfrage.
// ─────────────────────────────────────────────────────────────────────────────

type GlossarEntry = {
  term: string
  short: string
  body: string
  ratgeber?: string
  service?: string
}

const glossarEntries: GlossarEntry[] = [
  {
    term: 'Lokale Sichtbarkeit',
    short: 'Wie gut Ihr Unternehmen dort auffindbar ist, wo Kunden in Ihrer Region suchen.',
    body: 'Lokale Sichtbarkeit ist kein einzelner Kanal, sondern die Summe aus Google-Unternehmensprofil, Website, Bewertungen, Verzeichniseinträgen, sozialen Netzwerken und dem, was KI-Systeme über Sie wiedergeben. Sie entscheidet darüber, ob ein kaufbereiter Kunde Sie überhaupt zu Gesicht bekommt.',
    ratgeber: 'wie-funktioniert-lokales-seo',
  },
  {
    term: 'Google-Unternehmensprofil',
    short: 'Ihr kostenloser Eintrag bei Google, der in Maps und in der Suche erscheint.',
    body: 'Das Google-Unternehmensprofil (früher Google My Business) enthält Name, Adresse, Öffnungszeiten, Leistungen, Fotos und Bewertungen. Es ist die Grundlage für jede lokale Platzierung: Ohne vollständiges, gepflegtes Profil erscheint ein Unternehmen bei lokalen Suchanfragen faktisch nicht.',
    ratgeber: 'google-maps-ranking-verbessern',
    service: 'google-maps-business-profile',
  },
  {
    term: 'Local Pack',
    short: 'Der Kartenblock mit drei Einträgen ganz oben in den Google-Ergebnissen.',
    body: 'Bei Suchanfragen mit örtlichem Bezug zeigt Google eine Karte mit drei Unternehmen an. Dieser Block bekommt einen sehr großen Teil aller Klicks und Anrufe. Wer dort nicht auftaucht, konkurriert nur noch um die Aufmerksamkeit, die darunter übrig bleibt.',
    ratgeber: 'google-maps-ranking-verbessern',
    service: 'google-maps-business-profile',
  },
  {
    term: 'NAP-Konsistenz',
    short: 'Name, Adresse und Telefonnummer müssen überall identisch geschrieben sein.',
    body: 'NAP steht für Name, Address, Phone. Weichen diese Angaben zwischen Google, Website, Branchenverzeichnissen und sozialen Profilen voneinander ab, entstehen widersprüchliche Signale — für Suchmaschinen ebenso wie für Kunden. Konsistenz ist unspektakulär, aber eine der zuverlässigsten Grundlagen lokaler Sichtbarkeit.',
    ratgeber: 'google-maps-ranking-verbessern',
    service: 'local-citations',
  },
  {
    term: 'Lokale Verzeichnisse & Erwähnungen',
    short: 'Einträge und Nennungen Ihres Unternehmens auf Portalen außerhalb Ihrer eigenen Kanäle.',
    body: 'Branchenportale, Kammer- und Verbandsverzeichnisse, Kartendienste, lokale Presse: Jede korrekte Nennung bestätigt, dass es Ihr Unternehmen gibt und dass die Angaben stimmen. Solche Erwähnungen sind auch die Quellen, aus denen KI-Systeme ihr Bild von einem Unternehmen zusammensetzen.',
    ratgeber: 'in-chatgpt-und-perplexity-gefunden-werden',
    service: 'local-citations',
  },
  {
    term: 'Bewertungen',
    short: 'Öffentliches Kundenfeedback auf Google, Trustpilot und Branchenportalen.',
    body: 'Bewertungen wirken doppelt: Sie beeinflussen, ob ein Interessent anruft, und sie gehören zu den Signalen, die Google für die Einordnung lokaler Ergebnisse heranzieht. Entscheidend ist nicht nur die Sternebewertung, sondern Aktualität, Anzahl, Inhalt und ob auf Bewertungen geantwortet wird.',
    service: 'reviews',
  },
  {
    term: 'Suchintention',
    short: 'Die Absicht hinter einer Suchanfrage — Information, Vergleich oder Kauf.',
    body: '„Was kostet eine Heizungswartung" und „Heizungsnotdienst in meiner Nähe" sind zwei völlig verschiedene Situationen. Inhalte funktionieren dann, wenn sie zur Absicht passen: Ratgeber und Glossar bedienen die Recherche, Leistungs- und Regionenseiten die Entscheidung.',
    ratgeber: 'wie-funktioniert-lokales-seo',
    service: 'website-google-search',
  },
  {
    term: 'Strukturierte Daten (Schema-Markup)',
    short: 'Maschinenlesbare Zusatzangaben im Quelltext Ihrer Website.',
    body: 'Mit Schema-Markup wird aus einer Textseite eine eindeutige Aussage: Das hier ist ein Unternehmen, das sind die Öffnungszeiten, das ist eine Leistung, das ist eine Bewertung. Suchmaschinen und KI-Systeme müssen dann nicht raten, was auf der Seite steht.',
    ratgeber: 'in-chatgpt-und-perplexity-gefunden-werden',
    service: 'website-google-search',
  },
  {
    term: 'KI-Suche & AI Overviews',
    short: 'Antworten, die ein KI-System zusammenfasst, statt eine Linkliste auszugeben.',
    body: 'ChatGPT, Perplexity und die KI-Übersichten in der Google-Suche beantworten Fragen direkt und nennen dabei einige wenige Quellen und Unternehmen. Wer in diesen Antworten nicht vorkommt, ist für diesen Teil der Kundschaft nicht vorhanden — auch bei guter klassischer Platzierung.',
    ratgeber: 'in-chatgpt-und-perplexity-gefunden-werden',
    service: 'ai-search-optimization',
  },
  {
    term: 'GEO (Generative Engine Optimization)',
    short: 'Die Arbeit daran, in KI-generierten Antworten korrekt vorzukommen.',
    body: 'GEO ist keine geheime zweite Disziplin neben SEO. Es geht um dieselben Grundlagen — klare Inhalte, saubere Technik, abrufbare Seiten, übereinstimmende Angaben, externe Bestätigung — nur konsequent auf die Frage ausgerichtet, ob ein Sprachmodell Ihr Unternehmen verlässlich wiedergeben kann.',
    ratgeber: 'in-chatgpt-und-perplexity-gefunden-werden',
    service: 'ai-search-optimization',
  },
  {
    term: 'Servicegebiet',
    short: 'Die Region, in der Sie arbeiten — auch ohne Ladengeschäft vor Ort.',
    body: 'Betriebe, die zu ihren Kunden fahren, können im Google-Profil ein Servicegebiet hinterlegen, statt eine Adresse zu veröffentlichen. Auf der Website gehört dazu je eine eigene Seite pro Region, damit für jede Stadt nachvollziehbar ist, welche Leistung Sie dort anbieten.',
    service: 'website-google-search',
  },
  {
    term: 'Sichtbarkeits-Check',
    short: 'Unsere kostenlose Bestandsaufnahme Ihrer aktuellen lokalen Präsenz.',
    body: 'Wir sehen uns an, wie Ihr Unternehmen heute bei Google Maps, in der Google-Suche und in der KI-Suche dargestellt wird, vergleichen das mit Ihren lokalen Mitbewerbern und benennen die Maßnahmen, die in Ihrer Situation den größten Effekt haben. Ohne Verkaufsgespräch.',
  },
]

type RatgeberArticle = {
  slug: string
  title: string
  teaser: string
  minutes: number
  intro: string
  sections: { h: string; p: string[] }[]
  terms: string[]
  serviceSlug: string
  serviceNote: string
}

const ratgeberArticles: RatgeberArticle[] = [
  {
    slug: 'wie-funktioniert-lokales-seo',
    title: 'Wie funktioniert lokales SEO?',
    teaser: 'Warum lokale Ergebnisse anders zustande kommen als normale Suchergebnisse — und woran Sie tatsächlich arbeiten können.',
    minutes: 6,
    intro: 'Lokales SEO ist die Arbeit daran, bei Suchanfragen mit örtlichem Bezug gefunden zu werden: „Zahnarzt in der Nähe", „Heizung reparieren Siegen", „bestes Café Innenstadt". Diese Ergebnisse funktionieren nach anderen Regeln als eine gewöhnliche Websuche.',
    sections: [
      {
        h: 'Der Unterschied zur klassischen Suche',
        p: [
          'Bei einer normalen Suche ranken Seiten. Bei einer lokalen Suche ranken Unternehmen. Google zeigt zuerst eine Karte mit drei Einträgen — das Local Pack — und erst darunter klassische Ergebnisse. Diese drei Plätze bekommen den größten Teil der Anrufe und Routenanfragen.',
          'Deshalb reicht eine gut gebaute Website allein nicht aus: Ohne gepflegtes Google-Unternehmensprofil fehlt Ihnen der Eintrag, um den es in diesem Block überhaupt geht.',
        ],
      },
      {
        h: 'Die drei Faktoren, die Google selbst nennt',
        p: [
          'Google beschreibt für lokale Ergebnisse drei Faktoren: Relevanz (passt Ihr Profil zur Suchanfrage?), Entfernung (wie weit sind Sie vom Suchenden entfernt?) und Bekanntheit (wie bekannt ist Ihr Unternehmen — Erwähnungen, Verlinkungen, Bewertungen).',
          'Die Entfernung können Sie nicht beeinflussen. Genau deshalb sind pauschale Versprechen auf „Platz 1" unseriös: Derselbe Betrieb steht für einen Nutzer zwei Straßen weiter oben und für einen Nutzer am anderen Stadtrand weiter unten.',
        ],
      },
      {
        h: 'Woran Sie tatsächlich arbeiten können',
        p: [
          'Relevanz entsteht durch ein vollständiges Profil mit korrekter Hauptkategorie, klar benannten Leistungen und einer Website, die dieselben Leistungen ausführlich erklärt. Bekanntheit entsteht durch echte Bewertungen, einheitliche Angaben in Verzeichnissen und Erwähnungen außerhalb Ihrer eigenen Kanäle.',
          'Das klingt unspektakulär, ist aber der Grund, warum in den meisten Städten dieselben zwei, drei Betriebe dauerhaft oben stehen: Bei ihnen kümmert sich jemand regelmäßig darum.',
        ],
      },
      {
        h: 'In welcher Reihenfolge man arbeitet',
        p: [
          'Zuerst das Google-Unternehmensprofil, weil es am schnellsten wirkt. Dann die einheitlichen Firmendaten in den wichtigsten Verzeichnissen, weil widersprüchliche Angaben jede weitere Maßnahme ausbremsen. Dann die Website mit eigenen Seiten je Leistung und je Region. Dann ein verlässlicher Ablauf für Bewertungen.',
          'Anzeigen kommen zuletzt — nicht weil sie unwichtig wären, sondern weil sie die Lücke überbrücken, solange die organische Sichtbarkeit noch wächst.',
        ],
      },
      {
        h: 'Wie lange es dauert',
        p: [
          'Profil- und Verzeichnisarbeit zeigt sich häufig innerhalb weniger Wochen an Aufrufen und Anrufen. Bewertungen und Website-Inhalte brauchen länger, weil sie sich aufbauen müssen. Wichtig ist, dass Sie beides messen: Ohne Zahlen zu Aufrufen, Anrufen und Anfragen bleibt jede Einschätzung Gefühlssache.',
        ],
      },
    ],
    terms: ['Local Pack', 'Google-Unternehmensprofil', 'NAP-Konsistenz', 'Suchintention'],
    serviceSlug: 'google-maps-business-profile',
    serviceNote: 'Wir richten Ihr Profil ein, wählen die Kategorien und bringen Ihre Einträge in Ordnung.',
  },
  {
    slug: 'google-maps-ranking-verbessern',
    title: 'Wie kommt mein Unternehmen bei Google Maps nach oben?',
    teaser: 'Die Arbeitsschritte, die bei Google Maps tatsächlich etwas bewegen — und die Abkürzungen, die Ihr Profil gefährden.',
    minutes: 7,
    intro: 'Google Maps ist für die meisten lokalen Betriebe der wichtigste Kanal überhaupt: Wer dort in den ersten Ergebnissen steht, bekommt Anrufe, ohne dass ein einziger Klick bezahlt werden muss. Was dorthin führt, ist keine Geheimwissenschaft, sondern eine Liste, die konsequent abgearbeitet werden will.',
    sections: [
      {
        h: '1. Das Profil vollständig ausfüllen',
        p: [
          'Öffnungszeiten, Leistungen, Beschreibung, Kontaktdaten, Verbindung zur Website, Fotos: Jedes leere Feld ist eine Information, die Google nicht hat und ein Kunde nicht sieht. Vollständigkeit ist der Schritt mit dem besten Verhältnis von Aufwand zu Wirkung.',
        ],
      },
      {
        h: '2. Die richtige Hauptkategorie wählen',
        p: [
          'Die Hauptkategorie entscheidet mit darüber, bei welchen Suchanfragen Ihr Profil überhaupt in Frage kommt. Sie sollte exakt beschreiben, was Sie hauptsächlich tun — nicht das breiteste denkbare Feld. Weitere Tätigkeiten kommen als Nebenkategorien und als Leistungen dazu.',
        ],
      },
      {
        h: '3. Bewertungen zu einem Ablauf machen',
        p: [
          'Nicht „mehr Bewertungen", sondern mehr echte Bewertungen mit konkreten Erfahrungen. Dafür braucht es einen festen Moment, in dem gefragt wird, einen kurzen Weg zur Abgabe und Antworten auf das, was geschrieben wird — auch auf Kritik.',
          'Alte Bewertungen verlieren an Überzeugungskraft. Ein stetiger Strom frischer Rückmeldungen wirkt auf Kunden wie auf Google anders als ein sehr guter Durchschnitt von vor zwei Jahren.',
        ],
      },
      {
        h: '4. Einheitliche Firmendaten überall',
        p: [
          'Name, Adresse und Telefonnummer müssen auf Ihrer Website, im Profil und in den relevanten Verzeichnissen identisch sein. Alte Einträge mit früherer Adresse oder alter Rufnummer sind erstaunlich oft der Grund, warum sich ein Profil trotz guter Pflege nicht bewegt.',
        ],
      },
      {
        h: '5. Aktivität zeigen',
        p: [
          'Neue Fotos, aktualisierte Leistungen, gepflegte Öffnungszeiten an Feiertagen, beantwortete Fragen: Ein Profil, an dem sichtbar gearbeitet wird, wirkt für Kunden lebendig — und liefert Google laufend frische Informationen.',
        ],
      },
      {
        h: 'Was Sie nicht tun sollten',
        p: [
          'Keine gekauften oder erfundenen Bewertungen. Keine Keywords im Unternehmensnamen, die nicht zum tatsächlichen Namen gehören. Keine Adressen, an denen Sie nicht arbeiten. All das verstößt gegen die Google-Richtlinien und kann zur Sperrung des Profils führen — dann ist nicht die Platzierung weg, sondern der gesamte Eintrag.',
        ],
      },
    ],
    terms: ['Google-Unternehmensprofil', 'Local Pack', 'NAP-Konsistenz', 'Bewertungen'],
    serviceSlug: 'google-maps-business-profile',
    serviceNote: 'Wir übernehmen Einrichtung, Kategorien, Bewertungsprozess und laufende Pflege.',
  },
  {
    slug: 'in-chatgpt-und-perplexity-gefunden-werden',
    title: 'Wie wird ein Unternehmen in ChatGPT und Perplexity gefunden?',
    teaser: 'Was KI-Systeme brauchen, um Ihr Unternehmen zu nennen — und warum es dafür keine getrennte Zauberformel gibt.',
    minutes: 6,
    intro: 'Immer mehr Menschen stellen ihre Frage direkt an ein KI-System, statt eine Ergebnisliste durchzusehen. Die Antwort nennt dann zwei, drei Anbieter. Wer dort nicht vorkommt, existiert für diese Kundschaft nicht — auch mit guter klassischer Platzierung.',
    sections: [
      {
        h: 'Wie eine KI-Antwort entsteht',
        p: [
          'Moderne KI-Systeme antworten nicht nur aus dem Gedächtnis. Sie rufen bei aktuellen Fragen Webinhalte ab, fassen sie zusammen und geben einige Quellen an. Für Ihr Unternehmen heißt das: Es zählt, was im Web verlässlich über Sie zu finden ist — und ob es abrufbar ist.',
        ],
      },
      {
        h: 'Klare Inhalte statt Werbesprache',
        p: [
          'Ein Sprachmodell kann nur wiedergeben, was eindeutig formuliert ist. „Ganzheitliche Lösungen für Ihren Erfolg" ist für ein KI-System wertlos. „Wir reparieren Gasheizungen in Siegen und im Umkreis von 30 Kilometern, Notdienst rund um die Uhr" ist eine Aussage, die zitiert werden kann.',
          'Deshalb ist die Website die Grundlage: Sie ist der einzige Ort, an dem Sie vollständig bestimmen, welche Informationen über Sie im Umlauf sind.',
        ],
      },
      {
        h: 'Abrufbar sein',
        p: [
          'Inhalte, die technisch nicht erreichbar sind, existieren für KI-Systeme nicht. Dazu gehören blockierte Seiten, Inhalte, die erst nach Interaktion erscheinen, und Zugriffsregeln, die die Crawler der KI-Anbieter aussperren. Wer dort vorkommen möchte, muss diese Zugriffe zulassen — eine bewusste Entscheidung, die man treffen sollte, statt sie dem Zufall zu überlassen.',
        ],
      },
      {
        h: 'Übereinstimmung und externe Bestätigung',
        p: [
          'KI-Systeme gleichen Quellen ab. Wenn Ihre Telefonnummer auf der Website, im Google-Profil und in Verzeichnissen unterschiedlich ist, sinkt die Wahrscheinlichkeit, dass eine Antwort Sie sicher nennt. Umgekehrt stärkt jede korrekte externe Erwähnung das Bild.',
        ],
      },
      {
        h: 'Was das mit SEO zu tun hat',
        p: [
          'Sehr viel. Google selbst hält fest, dass es für die KI-Funktionen der Suche keine gesonderte Optimierung braucht — es gelten die bekannten Grundlagen: nützliche Inhalte, saubere Technik, indexierbare Seiten, interne Verlinkung, ein aktuelles Unternehmensprofil.',
          'Seriös ist deshalb nicht das Versprechen einer geheimen KI-Optimierung, sondern die konsequente Arbeit an diesen Grundlagen — plus die Beobachtung, ob und wie Ihr Unternehmen in KI-Antworten auftaucht.',
        ],
      },
      {
        h: 'Was niemand garantieren kann',
        p: [
          'KI-Antworten sind nicht deterministisch: Dieselbe Frage kann zu unterschiedlichen Antworten führen. Garantierte Nennungen kann niemand zusagen. Was man tun kann, ist die Wahrscheinlichkeit systematisch erhöhen und regelmäßig prüfen, was die Systeme über Sie sagen.',
        ],
      },
    ],
    terms: ['KI-Suche & AI Overviews', 'GEO (Generative Engine Optimization)', 'Strukturierte Daten (Schema-Markup)', 'Lokale Verzeichnisse & Erwähnungen'],
    serviceSlug: 'ai-search-optimization',
    serviceNote: 'Wir strukturieren Ihre Unternehmensdaten und beobachten, wie KI-Systeme Sie wiedergeben.',
  },
]

type Crumb = { label: string; href?: string }

function Breadcrumbs({ items, tone = 'dark' }: { items: Crumb[]; tone?: 'dark' | 'light' }) {
  const dim = tone === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(7,7,12,0.45)'
  const current = tone === 'dark' ? 'rgba(255,255,255,0.85)' : 'var(--ink)'
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: origin + it.href } : {}),
    })),
  }
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 22 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9, listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((it, i) => (
          <li key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5 }}>
            {it.href
              ? <a href={it.href} className="ul" style={{ color: dim }}>{it.label}</a>
              : <span aria-current="page" style={{ color: current }}>{it.label}</span>}
            {i < items.length - 1 && <span aria-hidden style={{ color: dim, opacity: 0.55 }}>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

const SITE_NAME = 'RAG — Regionale Agentur'

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

// Seitentitel, Description, Canonical und Social-Tags pro Route —
// index.html ist statisch und liefert sonst überall dieselben Angaben.
function usePageMeta(title: string, description: string, ogType: 'website' | 'article' = 'website') {
  useEffect(() => {
    document.documentElement.lang = 'de'
    document.title = title

    const url = window.location.origin + window.location.pathname

    const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let tag = document.head.querySelector(`meta[${attr}="${key}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, key)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', ogType)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:locale', 'de_DE')
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }, [title, description, ogType])
}

function ContentCTA() {
  return (
    <section style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: 'clamp(60px, 7vw, 96px) clamp(20px,4vw,48px)', position: 'relative', overflow: 'clip' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><CrossBackdrop tone="dark" /></div>
      <div style={{ ...SHELL, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 560 }}>
          <h2 className="display" style={{ fontSize: 'clamp(22px, 2.6vw, 34px)', margin: '0 0 12px' }}>
            Wie steht Ihr Unternehmen heute da?
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Wir prüfen kostenlos Ihre Sichtbarkeit bei Google Maps, in der Google-Suche und in der KI-Suche — und sagen Ihnen, was zuerst zu tun ist.
          </p>
        </div>
        <a href="/#audit-quiz" className="btn btn-lg btn-paper" style={{ flexShrink: 0 }}>
          Kostenlosen Sichtbarkeits-Check starten <span className="arw">→</span>
        </a>
      </div>
    </section>
  )
}

function ContentHero({ kicker, title, sub, meta, crumbs }: { kicker: string; title: React.ReactNode; sub: string; meta?: string; crumbs?: Crumb[] }) {
  return (
    <section style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: 'clamp(140px, 16vh, 190px) clamp(20px,4vw,48px) clamp(60px, 7vw, 96px)', position: 'relative', overflow: 'hidden' }}>
      <MapBackdrop tone="dark" shift={120} />
      <div style={{ ...SHELL, position: 'relative' }}>
        {crumbs && <Breadcrumbs items={crumbs} />}
        <p className="eyebrow" style={{ color: 'var(--electric-2)', marginBottom: 22 }}>{kicker}</p>
        <h1 className="display h-lg" style={{ marginBottom: 22, maxWidth: 900 }}>{title}</h1>
        <p className="lead" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 640, margin: 0 }}>{sub}</p>
        {meta && <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', margin: '20px 0 0', letterSpacing: '0.04em' }}>{meta}</p>}
      </div>
    </section>
  )
}

function RatgeberIndex() {
  usePageMeta(
    'Ratgeber — lokale Sichtbarkeit verständlich erklärt | RAG',
    'Wie lokales SEO funktioniert, wie Sie bei Google Maps nach oben kommen und wie Ihr Unternehmen in ChatGPT und Perplexity gefunden wird.',
  )
  return (
    <>
      <Nav />
      <main id="inhalt">
      <ContentHero
        crumbs={[{ label: 'Start', href: '/' }, { label: 'Ratgeber' }]}
        kicker="RATGEBER"
        title={<>Lokale Sichtbarkeit, <span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>ohne Fachchinesisch</span></>}
        sub="Die drei Fragen, die uns Inhaberinnen und Inhaber am häufigsten stellen — ausführlich beantwortet, ohne Versprechen, die niemand halten kann."
      />
      <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(60px, 7vw, 96px) clamp(20px,4vw,48px) clamp(70px, 8vw, 110px)' }}>
        <div style={{ ...SHELL, borderTop: '1px solid var(--line)' }}>
          {ratgeberArticles.map((a, i) => (
            <a key={a.slug} href={`/ratgeber/${a.slug}`} className="row" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'clamp(14px, 2vw, 40px)', alignItems: 'center',
              padding: 'clamp(26px, 3vw, 42px) 0', borderBottom: '1px solid var(--line)',
              textDecoration: 'none', color: 'inherit',
            }}>
              <div>
                <span className="eyebrow" style={{ fontSize: 9.5, color: 'var(--electric)' }}>{String(i + 1).padStart(2, '0')} · {a.minutes} Min. Lesezeit</span>
                <h2 className="display" style={{ fontSize: 'clamp(21px, 2.2vw, 30px)', lineHeight: 1.18, margin: '12px 0 0' }}>{a.title}</h2>
              </div>
              <div>
                <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'var(--muted)', margin: '0 0 14px' }}>{a.teaser}</p>
                <span className="ul" style={{ fontSize: 13, fontWeight: 600, color: 'var(--electric)' }}>Artikel lesen →</span>
              </div>
            </a>
          ))}
          <p style={{ fontSize: 14.5, color: 'var(--muted)', marginTop: 34 }}>
            Begriffe kurz nachschlagen? <a href="/glossar" className="ul" style={{ color: 'var(--ink)', fontWeight: 600 }}>Zum Glossar</a>
          </p>
        </div>
      </section>
      <ContentCTA />
      </main>
      <Footer />
    </>
  )
}

function RatgeberArticlePage({ slug }: { slug: string }) {
  const a = ratgeberArticles.find(x => x.slug === slug)
  usePageMeta(
    a ? `${a.title} | RAG Ratgeber` : 'Artikel nicht gefunden | RAG',
    a ? a.teaser : 'Dieser Ratgeber-Artikel existiert nicht.',
    'article',
  )
  if (!a) {
    return (
      <>
        <Nav />
        <main id="inhalt" style={{ padding: '180px clamp(20px,4vw,48px) 120px' }}>
          <div style={{ ...SHELL }}>
            <h1 className="display" style={{ fontSize: 30, marginBottom: 14 }}>Artikel nicht gefunden</h1>
            <a href="/ratgeber" className="ul" style={{ color: 'var(--electric)', fontWeight: 600 }}>← Zurück zum Ratgeber</a>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const service = modules.find(m => m.slug === a.serviceSlug)
  const terms = glossarEntries.filter(g => a.terms.includes(g.term))
  const others = ratgeberArticles.filter(x => x.slug !== a.slug)

  return (
    <>
      <Nav />
      <main id="inhalt">
      <article>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.title,
        description: a.teaser,
        inLanguage: 'de',
        author: { '@type': 'Organization', name: SITE_NAME },
        publisher: { '@type': 'Organization', name: SITE_NAME },
        mainEntityOfPage: (typeof window !== 'undefined' ? window.location.origin : '') + '/ratgeber/' + a.slug,
      }} />
      <ContentHero
        crumbs={[{ label: 'Start', href: '/' }, { label: 'Ratgeber', href: '/ratgeber' }, { label: a.title }]}
        kicker="RATGEBER"
        title={a.title}
        sub={a.teaser}
        meta={`${a.minutes} Minuten Lesezeit`}
      />

      <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(56px, 7vw, 90px) clamp(20px,4vw,48px)' }}>
        <div style={{ ...SHELL, maxWidth: 1240 }}><div style={{ maxWidth: 760 }}>
          <p className="lead" style={{ color: 'var(--ink)', margin: '0 0 clamp(34px, 4vw, 52px)' }}>{a.intro}</p>
          {a.sections.map(sec => (
            <div key={sec.h} style={{ marginBottom: 'clamp(30px, 4vw, 48px)' }}>
              <h2 className="display" style={{ fontSize: 'clamp(20px, 2vw, 27px)', lineHeight: 1.22, margin: '0 0 14px' }}>{sec.h}</h2>
              {sec.p.map((t, i) => (
                <p key={i} style={{ fontSize: 15.5, lineHeight: 1.85, color: 'var(--muted)', margin: '0 0 14px' }}>{t}</p>
              ))}
            </div>
          ))}
        </div></div>
      </section>

      {/* Glossar → Begriffe aus dem Artikel */}
      <section style={{ backgroundColor: 'var(--bone)', padding: 'clamp(50px, 6vw, 80px) clamp(20px,4vw,48px)' }}>
        <div style={{ ...SHELL, maxWidth: 1240 }}><div style={{ maxWidth: 760 }}>
          <Kicker>Begriffe aus diesem Artikel</Kicker>
          <div style={{ marginTop: 22, borderTop: '1px solid var(--line)' }}>
            {terms.map(t => (
              <a key={t.term} href="/glossar" style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16,
                padding: '16px 0', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit',
              }}>
                <span className="display" style={{ fontSize: 16 }}>{t.term}</span>
                <span style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>{t.short}</span>
              </a>
            ))}
          </div>
        </div></div>
      </section>

      {/* Ratgeber → Leistung */}
      {service && (
        <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(50px, 6vw, 80px) clamp(20px,4vw,48px)' }}>
          <div style={{ ...SHELL, maxWidth: 1240 }}><div style={{ maxWidth: 760 }}>
            <Kicker>Passende Leistung</Kicker>
            <div style={{ marginTop: 22, border: '1px solid var(--line)', borderRadius: 20, padding: 'clamp(24px, 3vw, 36px)' }}>
              <h2 className="display" style={{ fontSize: 'clamp(20px, 2vw, 28px)', margin: '0 0 10px' }}>{service.label}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', margin: '0 0 22px' }}>{a.serviceNote}</p>
              <a href={`/services/${service.slug}`} className="btn btn-md btn-ink">Zur Leistungsseite <span className="arw">→</span></a>
            </div>
            <div style={{ marginTop: 'clamp(34px, 4vw, 52px)' }}>
              <Kicker>Weiterlesen</Kicker>
              <div style={{ marginTop: 18 }}>
                {others.map(o => (
                  <a key={o.slug} href={`/ratgeber/${o.slug}`} className="ul" style={{ display: 'block', width: 'fit-content', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
                    {o.title} →
                  </a>
                ))}
              </div>
            </div>
          </div></div>
        </section>
      )}

      </article>
      <ContentCTA />
      </main>
      <Footer />
    </>
  )
}

function GlossarPage() {
  usePageMeta(
    'Glossar — Begriffe der lokalen Sichtbarkeit | RAG',
    'Local Pack, NAP-Konsistenz, GEO, strukturierte Daten: die wichtigsten Begriffe rund um Google Maps, lokale Suche und KI-Suche, kurz erklärt.',
  )
  return (
    <>
      <Nav />
      <main id="inhalt">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: 'Glossar der lokalen Sichtbarkeit',
        inLanguage: 'de',
        hasDefinedTerm: glossarEntries.map(g => ({
          '@type': 'DefinedTerm',
          name: g.term,
          description: g.body,
        })),
      }} />
      <ContentHero
        crumbs={[{ label: 'Start', href: '/' }, { label: 'Glossar' }]}
        kicker="GLOSSAR"
        title={<>Die Begriffe, <span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>kurz erklärt</span></>}
        sub="Von Local Pack bis GEO: was hinter den Wörtern steckt, die in Angeboten und Berichten zur lokalen Sichtbarkeit auftauchen."
      />
      <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(56px, 7vw, 90px) clamp(20px,4vw,48px) clamp(70px, 8vw, 110px)' }}>
        <div style={{ ...SHELL }}>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {glossarEntries.map((g, i) => {
              const article = g.ratgeber ? ratgeberArticles.find(a => a.slug === g.ratgeber) : undefined
              const service = g.service ? modules.find(m => m.slug === g.service) : undefined
              return (
                <div key={g.term} style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 'clamp(14px, 2vw, 48px)', padding: 'clamp(26px, 3vw, 40px) 0', borderBottom: '1px solid var(--line)',
                }}>
                  <div>
                    <span className="display" style={{ fontSize: 13, color: 'var(--electric)', letterSpacing: '0.08em' }}>{String(i + 1).padStart(2, '0')}</span>
                    <h2 className="display" style={{ fontSize: 'clamp(19px, 1.9vw, 26px)', lineHeight: 1.2, margin: '10px 0 8px' }}>{g.term}</h2>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink)', fontWeight: 600, margin: 0, maxWidth: 360 }}>{g.short}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--muted)', margin: 0 }}>{g.body}</p>
                    {(article || service) && (
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 16 }}>
                        {article && (
                          <a href={`/ratgeber/${article.slug}`} className="ul" style={{ fontSize: 13, fontWeight: 600, color: 'var(--electric)' }}>Im Ratgeber →</a>
                        )}
                        {service && (
                          <a href={`/services/${service.slug}`} className="ul" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Passende Leistung →</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <ContentCTA />
      </main>
      <Footer />
    </>
  )
}

function ServicesIndex() {
  usePageMeta(
    'Leistungen — woraus lokale Sichtbarkeit besteht | RAG',
    'Google Maps, Website & Google Search, KI-Suche, Bewertungen, lokale Verzeichnisse, Social Media, Anzeigen und Offline-Werbung: die acht Bereiche, die lokale Sichtbarkeit ausmachen — einzeln erklärt und als Paket zusammenstellbar.',
  )
  return (
    <>
      <Nav />
      <main id="inhalt">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Leistungen von RAG',
        itemListElement: modules.map((m, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: m.label,
          url: (typeof window !== 'undefined' ? window.location.origin : '') + '/services/' + m.slug,
        })),
      }} />
      <section style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: 'clamp(140px, 16vh, 190px) clamp(20px,4vw,48px) clamp(70px, 8vw, 110px)', position: 'relative', overflow: 'hidden' }}>
        <MapBackdrop tone="dark" shift={120} />
        <div style={{ ...SHELL, position: 'relative' }}>
          <Breadcrumbs items={[{ label: 'Start', href: '/' }, { label: 'Leistungen' }]} />
          <p className="eyebrow" style={{ color: 'var(--electric-2)', marginBottom: 22 }}>LEISTUNGEN</p>
          <h1 className="display h-lg" style={{ marginBottom: 22, maxWidth: 900 }}>
            Woraus lokale <span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>Sichtbarkeit besteht</span>
          </h1>
          <p className="lead" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 620, margin: '0 0 34px' }}>
            Acht Bereiche, die zusammen darüber entscheiden, ob lokale Kunden Sie finden, verstehen und Ihnen vertrauen. Google Maps ist der zentrale Kanal — alles andere zahlt darauf ein.
          </p>
          <a href="/#audit-quiz" className="btn btn-lg btn-paper">Kostenlosen Sichtbarkeits-Check starten <span className="arw">→</span></a>
        </div>
      </section>

      <ServiceSelector />
      </main>
      <Footer />
    </>
  )
}

function ServicePage({ slug }: { slug: string }) {
  const data = servicePages.find(s => s.slug === slug)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  usePageMeta(
    data ? `${data.heroTitle} | RAG` : 'Leistung nicht gefunden | RAG',
    data ? data.heroSubtitle : 'Diese Leistungsseite existiert nicht.',
  )

  if (!data) {
    return (
      <>
        <Nav />
        <main id="inhalt" style={{ padding: '180px clamp(20px,4vw,48px) 120px' }}>
          <div style={{ ...SHELL }}>
          <h1 className="display" style={{ fontSize: 30, marginBottom: 14 }}>Leistung nicht gefunden</h1>
          <a href="/services" className="ul" style={{ color: 'var(--electric)', fontWeight: 600 }}>← Zurück zu den Leistungen</a>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const others = modules.filter(m => m.slug !== slug)

  return (
    <>
      <Nav />
      <main id="inhalt">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: modules.find(m => m.slug === slug)?.label ?? data.heroTitle,
        description: data.heroSubtitle,
        serviceType: data.kicker,
        areaServed: ['Germany', 'Austria', 'Switzerland'],
        provider: { '@type': 'ProfessionalService', name: SITE_NAME },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }} />
      <section style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: 'clamp(140px, 16vh, 190px) clamp(20px,4vw,48px) clamp(70px, 8vw, 110px)', position: 'relative', overflow: 'hidden' }}>
        <MapBackdrop tone="dark" shift={120} />
        <div style={{ ...SHELL, position: 'relative' }}>
          <Breadcrumbs items={[{ label: 'Start', href: '/' }, { label: 'Leistungen', href: '/services' }, { label: modules.find(m => m.slug === slug)?.label ?? data.heroTitle }]} />
          <h1 className="display h-lg" style={{ marginBottom: 22, maxWidth: 900 }}>{data.heroTitle}</h1>
          <p className="lead" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 620, margin: '0 0 34px' }}>{data.heroSubtitle}</p>
          <a href="#get-audit" className="btn btn-lg btn-paper">{data.ctaTitle} <span className="arw">→</span></a>
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(60px, 7vw, 96px) clamp(20px,4vw,48px)' }}>
        <div style={{ ...SHELL, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(28px, 4vw, 64px)', alignItems: 'start' }}>
          <div className="svc-rail" style={{ position: 'sticky', top: 96 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: 'var(--bone)', marginBottom: 26 }}><data.Illust /></div>

            <div style={{ backgroundColor: '#f2f2ff', border: '1px solid #ddd6fe', borderRadius: 16, padding: '28px 26px' }}>
              <h2 className="display" style={{ fontSize: 18, marginBottom: 14 }}>{data.receiveTitle}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.receiveItems.map(item => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 2, flexShrink: 0 }}><circle cx="8" cy="8" r="8" fill="#2600FF" /><path d="M4.5 8l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 680 }}>
          <h2 className="display" style={{ fontSize: 'clamp(20px, 2vw, 26px)', marginBottom: 12 }}>{data.whatTitle}</h2>
          <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.75, marginBottom: 40 }}>{data.whatBody}</p>

          <h2 className="display" style={{ fontSize: 'clamp(20px, 2vw, 26px)', marginBottom: 20 }}>{data.howTitle}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 40 }}>
            {data.howItems.map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2600FF', marginTop: 8, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#030712', margin: '0 0 3px' }}>{item.title}</p>
                  <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.65, margin: 0 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="display" style={{ fontSize: 'clamp(20px, 2vw, 26px)', marginBottom: 12 }}>{data.whyTitle}</h2>
          <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.75, marginBottom: 40 }}>{data.whyBody}</p>

          <h2 className="display" style={{ fontSize: 'clamp(20px, 2vw, 26px)', marginBottom: 16 }}>Häufig gestellte Fragen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {data.faq.map((item, i) => (
              <div key={i} style={{ backgroundColor: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16, fontFamily: 'inherit' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#030712' }}>{item.q}</span>
                  <IconChevron open={faqOpen === i} />
                </button>
                <div style={{ overflow: 'hidden', maxHeight: faqOpen === i ? 300 : 0, transition: 'max-height 0.3s ease' }}>
                  <p style={{ margin: 0, padding: '0 20px 16px', fontSize: 13.5, color: '#4b5563', lineHeight: 1.7 }}>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      <section id="get-audit" style={{ backgroundColor: 'var(--bone)', padding: 'clamp(60px, 7vw, 96px) clamp(20px,4vw,48px)' }}>
        <div style={{ ...SHELL, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(28px, 4vw, 64px)', alignItems: 'center' }}>
          <div>
            <Kicker>Anfrage</Kicker>
            <h2 className="display" style={{ fontSize: 'clamp(22px, 2.6vw, 34px)', margin: '20px 0 12px', maxWidth: 460 }}>{data.ctaTitle}</h2>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8, margin: 0, maxWidth: 460 }}>{data.ctaBody}</p>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid var(--line)', borderRadius: 24, padding: '30px 28px', boxShadow: '0 20px 50px rgba(7,7,12,0.07)' }}>
            <ServiceLeadForm serviceLabel={data.heroTitle} />
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(60px, 7vw, 96px) clamp(20px,4vw,48px) clamp(70px, 8vw, 110px)' }}>
        <div style={{ ...SHELL }}>
          <Kicker>Weitere Leistungen</Kicker>
          <h2 className="display" style={{ fontSize: 'clamp(20px, 2.2vw, 28px)', margin: '20px 0 8px' }}>Lokale Sichtbarkeit entsteht selten aus einem einzigen Kanal</h2>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 32, maxWidth: 560 }}>Die meisten Unternehmen brauchen mehrere Bereiche, die zusammenspielen. Hier ist der Rest des Systems.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 16 }}>
            {others.map(m => (
              <a key={m.slug} href={`/services/${m.slug}`} style={{ display: 'block', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px', textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2600FF')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#030712', margin: '0 0 4px' }}>{m.label}</p>
                <p style={{ fontSize: 12.5, color: '#4b5563', margin: 0, lineHeight: 1.5 }}>{m.sentence}</p>
              </a>
            ))}
          </div>
          <div style={{ marginTop: 28 }}>
            <a href="/services" className="ul" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--electric)' }}>Alle Leistungen mit Details ansehen →</a>
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE
// ─────────────────────────────────────────────────────────────────────────────
const responsiveCSS = `
@keyframes fadeSwap {
  from { opacity: 0; transform: translateY(14px) scale(0.985); }
  to   { opacity: 1; transform: none; }
}

@media (max-width: 1024px) {
  .hero-grid { grid-template-columns: 1fr !important; }
  .hero-visual { justify-content: flex-start !important; margin-top: 8px; }
  .hero-visual > div { max-width: 100% !important; }
  .about-top, .about-band, .problem-head, .sol-head, .res-head, .faq-head { grid-template-columns: 1fr !important; }
  .about-band { gap: 40px !important; }
  .problem-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
  .problem-sticky > div { position: static !important; }
  .audit-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
  .res-body { grid-template-columns: 1fr !important; }
  .expl-grid { grid-template-columns: 1fr !important; }
  .expl-sticky { position: static !important; }
  .expl-row { grid-template-columns: 40px 1fr !important; }
  .expl-row > p { grid-column: 2 / -1; margin-top: 12px !important; }
  .mod-row { grid-template-columns: 44px minmax(0,1fr) auto !important; }
  .mod-sentence { display: none; }
  .mod-detail { grid-template-columns: 1fr !important; }
  .mod-detail-cols { grid-template-columns: 1fr !important; gap: 18px !important; }
  .footer-grid { grid-template-columns: 1fr 1fr !important; }
}

@media (max-width: 768px) {
  .hidden-mobile { display: none !important; }
  .show-mobile { display: flex !important; }
  .hero-stats { gap: 20px !important; }
  .process-wrap { grid-template-columns: 1fr !important; }
  .process-rail { display: none !important; }
  .step-row { grid-template-columns: 1fr !important; margin-left: 0 !important; gap: 14px !important; }
  .step-row > div:last-child { padding-top: 0 !important; }
  .dual-cta-grid { grid-template-columns: 1fr !important; }
  .audit-grid { grid-template-columns: 1fr !important; gap: 34px !important; }
  .res-row { grid-template-columns: 1fr !important; gap: 6px !important; }
  .about-stats { grid-template-columns: 1fr !important; }
  .about-stats > div { border-right: none !important; border-bottom: 1px solid var(--line); padding-left: 0 !important; padding-bottom: 22px; }
  .footer-grid { grid-template-columns: 1fr !important; }
  .faq-answer { padding-right: 0 !important; }
  .mod-row { grid-template-columns: 34px minmax(0,1fr) !important; row-gap: 14px !important; }
  .mod-row > div:last-child { grid-column: 1 / -1; justify-content: flex-start !important; }
}

@media (min-width: 769px) {
  .show-mobile { display: none !important; }
}

/* пины фона: в боковых полях, если они есть, иначе у нижнего края */
.mb-pin-side { display: block; }
.mb-pin-edge { display: none; }
@media (max-width: 1660px) {
  .mb-pin-side { display: none; }
  .mb-pin-edge { display: block; }
}

/* legacy reveal (service pages) */
.reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.6s ease, transform 0.6s ease; }
.reveal.visible { opacity: 1; transform: none; }
`

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// FLOATING BOOK-A-CALL WIDGET
// ─────────────────────────────────────────────────────────────────────────────
function BookCallWidget({ sentinelRef }: { sentinelRef: React.RefObject<HTMLDivElement | null> }) {
  const [modal, setModal] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [sentinelRef])

  return (
    <>
      {modal && <BookCallModal onClose={() => setModal(false)} />}
      <div
        className="hidden-mobile"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'fixed', right: 18, top: '50%', transform: 'translateY(-50%)',
          zIndex: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          pointerEvents: visible ? 'auto' : 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.45s ease',
        }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(7,7,12,0.08)',
          borderRadius: 20,
          boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
          padding: hovered ? '20px' : '14px 12px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          transition: `padding 0.45s ${EASE}, max-width 0.45s ${EASE}`,
          maxWidth: hovered ? 210 : 52,
          overflow: 'hidden',
        }}>
          {!hovered ? (
            <button onClick={() => setModal(true)} aria-label="Anruf buchen"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2600FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
              </svg>
              <span className="eyebrow" style={{ fontSize: 9, color: '#2600FF', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Buchen</span>
            </button>
          ) : (
            <>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5, margin: 0, whiteSpace: 'normal' }}>Wissen Sie schon, was Sie brauchen?</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', margin: 0 }}>Kein Check nötig.</p>
              <button onClick={() => setModal(true)} className="btn btn-md btn-electric" style={{ width: '100%', fontSize: 13 }}>Anruf buchen</button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function LandingPage() {
  // Beim direkten Aufruf von /#anchor steht der Inhalt erst nach dem Mount —
  // ohne diesen Sprung landet der Besucher oben statt beim gewünschten Abschnitt.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    // Schriften und Reveal-Animationen verschieben das Layout noch nach dem Mount,
    // deshalb mehrfach nachfassen statt einmal zu springen.
    const timers = [60, 300, 800, 1500].map(delay => setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' })
    }, delay))
    return () => timers.forEach(clearTimeout)
  }, [])
  usePageMeta(
    'RAG — System für lokale Sichtbarkeit bei Google Maps, Google & KI-Suche',
    'Wir machen lokale Unternehmen in Deutschland, Österreich und der Schweiz dort sichtbar, wo Kunden heute suchen: Google Maps, Google, ChatGPT, Perplexity, Bewertungen und soziale Netzwerke. Kostenloser Sichtbarkeits-Check.',
  )
  const widgetSentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0.15 }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  return (
    <>
      <style>{responsiveCSS}</style>
      <BookCallWidget sentinelRef={widgetSentinel} />
      <Nav />
      <main id="inhalt">
      <Hero />
      <div ref={widgetSentinel} style={{ height: 1, pointerEvents: 'none' }} />
      <SearchReality />
      <AboutRAG />
      <ProblemSection />
      <SolutionSection />
      <TwoRoutes />
      <Process />
      <SystemSummary />
      <RealResults />
      <AuditQuiz />
      <LocalVisibilityExplained />
      <FAQ />
      <DualCTA />
      </main>
      <Footer />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — plain pathname dispatch, no router lib. "/" renders the full
// landing page; "/services/:slug" renders a standalone service page. Vite's
// dev server (and any SPA-fallback host) serves index.html for both.
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/'
  const serviceMatch = path.match(/^\/services\/([a-z0-9-]+)\/?$/)
  if (serviceMatch) {
    return <ServicePage slug={serviceMatch[1]} />
  }
  if (/^\/services\/?$/.test(path)) {
    return <ServicesIndex />
  }
  const ratgeberMatch = path.match(/^\/ratgeber\/([a-z0-9-]+)\/?$/)
  if (ratgeberMatch) {
    return <RatgeberArticlePage slug={ratgeberMatch[1]} />
  }
  if (/^\/ratgeber\/?$/.test(path)) {
    return <RatgeberIndex />
  }
  if (/^\/glossar\/?$/.test(path)) {
    return <GlossarPage />
  }
  return <LandingPage />
}
