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
            style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 10, border: `1.5px solid ${selDay === i ? '#2600FF' : '#e5e7eb'}`, backgroundColor: selDay === i ? '#f2f2ff' : '#f9fafb', color: selDay === i ? '#2600FF' : '#4b5563', fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            {d.label}
          </button>
        ))}
      </div>
      {/* Time slots */}
      {selDay !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {BOOKING_SLOTS.map(slot => (
            <button key={slot} onClick={() => setSelSlot(slot)}
              style={{ padding: '11px', borderRadius: 10, border: `1.5px solid ${selSlot === slot ? '#2600FF' : '#e5e7eb'}`, backgroundColor: selSlot === slot ? '#2600FF' : '#fff', color: selSlot === slot ? '#fff' : '#030712', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: selSlot === slot ? '0 1px 2px rgba(0,0,0,0.12)' : 'none' }}>
              {slot}
            </button>
          ))}
        </div>
      )}
      <button
        disabled={selDay === null || selSlot === null}
        onClick={() => { if (selDay !== null && selSlot !== null) onConfirm(days[selDay], selSlot) }}
        style={{ backgroundColor: selDay !== null && selSlot !== null ? '#2600FF' : '#e5e7eb', color: selDay !== null && selSlot !== null ? '#fff' : '#9ca3af', fontWeight: 500, fontSize: 14, padding: '12px 22px', borderRadius: 12, border: 'none', cursor: selDay !== null && selSlot !== null ? 'pointer' : 'not-allowed', width: '100%', fontFamily: 'inherit', transition: 'all 0.2s' }}>
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
      style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(3,7,18,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 4px 28px rgba(0,0,0,0.06)', maxWidth: 440, width: '100%', padding: 32, position: 'relative' }}>

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
              style={{ width: '100%', padding: '11px 13px', border: '1px solid #d1d5db', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
            <select
              value={bService} onChange={e => setBService(e.target.value)}
              style={{ width: '100%', padding: '11px 13px', border: '1px solid #d1d5db', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box', backgroundColor: '#fff', color: bService ? '#030712' : '#9ca3af', appearance: 'auto' }}>
              <option value="" disabled>Service auswählen</option>
              {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              value={bEmail} onChange={e => setBEmail(e.target.value)}
              type="email" placeholder="E-Mail-Adresse"
              style={{ width: '100%', padding: '11px 13px', border: '1px solid #d1d5db', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 20, boxSizing: 'border-box' }} />
            <button
              disabled={!canContinue}
              onClick={() => canContinue && setModalStep(2)}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', backgroundColor: canContinue ? '#2600FF' : '#d1d5db', color: '#fff', fontWeight: 500, fontSize: 15, cursor: canContinue ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background 0.15s' }}>
              Weiter
            </button>
          </>
        )}

        {/* ── Step 2: slot picker ── */}
        {modalStep === 2 && (
          <>
            <h2 style={{ fontWeight: 700, fontSize: 22, color: '#030712', marginBottom: 6, letterSpacing: '-0.4px' }}>Wählen Sie einen Termin für Ihren Anruf</h2>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#4b5563', marginBottom: 20, lineHeight: 1.6 }}>
              Wählen Sie einen passenden Termin. Ein Berater bespricht live mit Ihnen Ihre Audit-Ergebnisse.
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
              Hinweis (Build): Hierfür wird ein echtes Terminbuchungssystem (Cal.com / Calendly) benötigt, das mit dem Buchungsschritt nach dem Audit geteilt wird. Ein einziges Verfügbarkeitssystem sollte hinter beiden Einstiegspunkten stehen.
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
function ServicesNavDropdown() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <a href={homeHref('modules')} style={{ fontWeight: 500, fontSize: 14, color: '#030712', textDecoration: 'none', transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#2600FF')}
        onMouseLeave={e => (e.currentTarget.style.color = '#030712')}>
        Leistungen
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <div style={{
        position: 'absolute', top: '100%', left: '50%', transform: `translate(-50%, ${open ? '6px' : '-2px'})`,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.15s ease, transform 0.15s ease',
        backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, boxShadow: '0 16px 36px rgba(0,0,0,0.12)', padding: 8, minWidth: 280, zIndex: 60,
      }}>
        {modules.map(m => (
          <a key={m.slug} href={`/services/${m.slug}`} style={{ display: 'block', padding: '9px 12px', borderRadius: 9, textDecoration: 'none', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f3ff')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#030712', marginBottom: 1 }}>{m.label}</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{m.sentence}</div>
          </a>
        ))}
      </div>
    </div>
  )
}

function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontWeight: 700, fontSize: 22, color: '#030712', letterSpacing: '-0.5px', textDecoration: 'none' }}>RAG<span style={{ color: '#2600FF' }}>.</span></a>
        <div style={{ display: 'flex', gap: 30, alignItems: 'center' }} className="hidden-mobile">
          <a href={homeHref('audit')} style={{ fontWeight: 500, fontSize: 14, color: '#030712', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2600FF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#030712')}>Audit</a>
          <ServicesNavDropdown />
          {[['Ergebnisse', 'results'], ['FAQ', 'faq']].map(([l, anchor]) => (
            <a key={l} href={homeHref(anchor)} style={{ fontWeight: 500, fontSize: 14, color: '#030712', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#2600FF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#030712')}>{l}</a>
          ))}
          <span style={{ fontWeight: 500, fontSize: 14, color: '#4b5563' }}>+49 30 12345678</span>
          <a href={homeHref('audit-quiz')} style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 14, padding: '9px 18px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a00cc')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2600FF')}>
            Kostenloses Audit erhalten
          </a>
        </div>
        <button className="show-mobile" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setOpen(v => !v)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#030712" strokeWidth="2" strokeLinecap="round">
            {open ? <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></> : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
          </svg>
        </button>
      </div>
      {open && (
        <div className="show-mobile" style={{ display: 'none', flexDirection: 'column', gap: 14, padding: '16px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          {[['Audit', 'audit'], ['Leistungen', 'modules'], ['Ergebnisse', 'results'], ['FAQ', 'faq']].map(([l, anchor]) => (
            <a key={l} href={homeHref(anchor)} style={{ fontWeight: 500, fontSize: 15, color: '#030712', textDecoration: 'none' }} onClick={() => setOpen(false)}>{l}</a>
          ))}
          <span style={{ fontWeight: 500, fontSize: 14, color: '#4b5563' }}>+49 30 12345678</span>
          <a href={homeHref('audit-quiz')} style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 14, padding: '11px 18px', borderRadius: 12, textDecoration: 'none', textAlign: 'center' }} onClick={() => setOpen(false)}>Kostenloses Audit erhalten</a>
        </div>
      )}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────
function Hero() {
  const [bookModal, setBookModal] = useState(false)
  return (
    <>
      {bookModal && <BookCallModal onClose={() => setBookModal(false)} />}
      <section style={{ backgroundColor: '#f9fafb', padding: '80px 24px 96px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.055, backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1400&h=700&fit=crop&auto=format")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="hero-pin-1" style={{ position: 'absolute', top: '16%', left: '7%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
        <MapPin /><div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: '#030712', marginTop: 2 }}>4.9 ★</div>
      </div>
      <div className="hero-pin-2" style={{ position: 'absolute', top: '26%', right: '8%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.4 }}>
        <MapPin color="#7c3aed" /><div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: '#030712', marginTop: 2 }}>4.7 ★</div>
      </div>
      <div style={{ maxWidth: 740, margin: '0 auto', position: 'relative' }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 18 }}>
          Für lokale Unternehmen in Deutschland, Österreich &amp; der Schweiz
        </p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 700, color: '#030712', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 18 }}>
          Werden Sie zur Nr. 1 in der lokalen Suche,<br /><span style={{ color: '#2600FF' }}>bei Maps und in KI-Suchergebnissen</span>
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
          {[GLogo, GMapsLogo, ChatGPTLogo, PerplexityLogo, TrustpilotLogo].map((Logo, i) => (
            <div key={i} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 9, padding: '6px 9px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
              <Logo />
            </div>
          ))}
        </div>
        <p style={{ fontSize: 16, fontWeight: 400, color: '#4b5563', lineHeight: 1.65, maxWidth: 500, margin: '0 auto 28px' }}>
          Ein einziges Team kümmert sich um Maps, KI-Suche, Bewertungen und Social Media. So finden lokale Kunden zuerst Sie.
        </p>
        <div style={{ marginBottom: 28 }}>
          <a href="#audit-quiz" className="cta-pulse" style={{ display: 'inline-block', backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 15, padding: '13px 30px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a00cc')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2600FF')}>
            Kostenloses Audit erhalten
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          {['Klarer Wettbewerbsvorteil', 'Stetig neue Leads', 'Planbarer Umsatz'].map(b => (
            <span key={b} style={{ backgroundColor: '#f2f2ff', color: '#2600FF', fontWeight: 500, fontSize: 12, padding: '5px 13px', borderRadius: 8, border: '1px solid #ddd6fe' }}>{b}</span>
          ))}
        </div>
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
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    itemRefs.current.forEach((el, i) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(i) },
        { threshold: 0.55 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  const ActiveIllust = problems[active].Illust

  return (
    <section id="audit" style={{ backgroundColor: '#f9fafb', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section header */}
        <h2 className="reveal" style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, color: '#030712', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.5px' }}>
          Einen Kanal zu reparieren, macht Sie nicht sichtbar. <span style={{ color: '#2600FF' }}>Es behebt nur ein Teilstück davon</span>
        </h2>
        <p style={{ fontSize: 15, fontWeight: 400, color: '#4b5563', textAlign: 'center', maxWidth: 500, margin: '0 auto 56px', lineHeight: 1.6 }}>
          Jede der folgenden Lücken ist ein eigener Grund, warum sich ein Kunde für jemand anderen statt für Sie entscheidet
        </p>

        {/* Two-column scroll layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }} className="problem-grid">

          {/* LEFT — scrolling text blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {problems.map((p, i) => (
              <div
                key={p.tag}
                ref={el => { itemRefs.current[i] = el }}
                onClick={() => setActive(i)}
                style={{
                  padding: '36px 28px',
                  borderLeft: `3px solid ${active === i ? '#2600FF' : '#e5e7eb'}`,
                  backgroundColor: active === i ? '#fff' : 'transparent',
                  borderRadius: active === i ? '0 16px 16px 0' : '0',
                  boxShadow: active === i ? '0 4px 20px rgba(38,0,255,0.07)' : 'none',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  marginBottom: 4,
                }}
              >
                <span style={{
                  display: 'inline-block',
                  backgroundColor: active === i ? '#f2f2ff' : '#f3f4f6',
                  color: active === i ? '#2600FF' : '#6b7280',
                  fontWeight: 600,
                  fontSize: 11,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: 6,
                  marginBottom: 12,
                  transition: 'all 0.3s',
                }}>
                  {p.tag}
                </span>
                <h3 style={{
                  fontWeight: 700,
                  fontSize: 17,
                  color: active === i ? '#030712' : '#6b7280',
                  marginBottom: active === i ? 12 : 0,
                  lineHeight: 1.35,
                  transition: 'color 0.3s',
                }}>
                  {p.heading}
                </h3>
                {active === i && (
                  <p style={{
                    fontWeight: 400,
                    fontSize: 14,
                    color: '#4b5563',
                    lineHeight: 1.75,
                    margin: 0,
                  }}>
                    {p.body}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT — sticky illustration */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div style={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(38,0,255,0.08)',
              transition: 'box-shadow 0.3s',
            }}>
              {/* Illustration area — fades between states */}
              <div style={{ padding: '8px 8px 0', transition: 'opacity 0.3s' }} key={active}>
                <ActiveIllust />
              </div>
              {/* Caption */}
              <div style={{ padding: '16px 20px 20px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2600FF', marginBottom: 8 }} />
                <p style={{ fontWeight: 600, fontSize: 13, color: '#030712', margin: 0, lineHeight: 1.4 }}>
                  {problems[active].heading}
                </p>
              </div>
              {/* Step dots */}
              <div style={{ display: 'flex', gap: 6, padding: '0 20px 18px', justifyContent: 'center' }}>
                {problems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    style={{
                      width: active === i ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: active === i ? '#2600FF' : '#ddd6fe',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
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
function AboutRAG() {
  return (
    <section style={{ backgroundColor: '#fff', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Two-column: text left, photo right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 56, alignItems: 'center', marginBottom: 52 }} className="about-grid">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#2600FF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>WER WIR SIND</p>
            <h2 className="reveal" style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700, color: '#030712', marginBottom: 24, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Lokale Kunden zu gewinnen ist schwerer geworden.<br />Wir sind seit über 10 Jahren immer einen Schritt voraus.
            </h2>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.8, marginBottom: 18 }}>
              Lokale Suche bedeutete früher einen Eintrag und eine Website. Heute bedeutet sie Google Maps, KI-Antworten in ChatGPT und Gemini, Bewertungen auf drei Plattformen, Social Proof, bezahlte Anzeigen und den Flyer am Aushang um die Ecke. All das konkurriert um denselben Kunden – und all das ändert sich alle paar Monate.
            </p>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.8, marginBottom: 0 }}>
              RAG ist ein Team von Spezialisten für lokale Sichtbarkeit, das ausschließlich mit Unternehmen in Deutschland, Österreich und der Schweiz arbeitet. Seit über 10 Jahren verfolgen wir, wie lokale Kunden wirklich suchen und kaufen, und haben ein System entwickelt, das jeden Kanal als ein zusammenhängendes Problem behandelt – nicht als sechs separate Dienstleister, die es zu koordinieren gilt.
            </p>
          </div>
          {/* Photo placeholder */}
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', aspectRatio: '4/5', backgroundColor: '#f2f2ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 280 }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
              <circle cx="28" cy="28" r="28" fill="#ede9fe"/>
              <circle cx="28" cy="22" r="10" fill="#c4b5fd"/>
              <path d="M8 50c0-11.05 8.95-20 20-20s20 8.95 20 20" fill="#c4b5fd"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#7c3aed', textAlign: 'center', padding: '0 20px', lineHeight: 1.5 }}>Teamfoto<br />(durch echtes Foto ersetzen)</span>
          </div>
        </div>
        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, backgroundColor: '#e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { stat: '500+', label: 'lokale Unternehmen in der DACH-Region' },
            { stat: '10+ Jahre', label: 'ausschließlich auf lokale Sichtbarkeit fokussiert' },
            { stat: 'Nur DACH', label: 'Spezialisten statt Generalisten-Agentur' },
          ].map(({ stat, label }) => (
            <div key={stat} style={{ backgroundColor: '#f9fafb', padding: '28px 24px', textAlign: 'center' }}>
              <div className={stat === '500+' ? 'count-glow' : undefined} style={{ fontSize: 28, fontWeight: 700, color: '#2600FF', lineHeight: 1, marginBottom: 6 }}>{stat}</div>
              <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>{label}</div>
            </div>
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
    how: 'Wir bereinigen Ihre Profildaten, wählen ertragsstarke Kategorien aus, optimieren lokalisierte Inhalte und bauen konsistente Zitate auf, um Ihren Eintrag in die Top 3 von Google Maps zu bringen.',
    why: 'Über 70 % der Klicks und Anrufe bei lokalen Dienstleistungen gehen direkt an die Top-3-Positionen auf der Karte. Diese Positionen zu sichern, generiert sofort Anfragen von lokalen Kunden – ganz ohne Klickkosten.',
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
    why: 'Bezahlte Medien geben Ihnen sofortige Kontrolle über die Kundengewinnung und bringen qualifizierte Leads in Ihre Pipeline, ohne auf organisches Wachstum warten zu müssen.',
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
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#030712', backgroundColor: '#fff' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(3,7,18,0.4)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', backgroundColor: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 480, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
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
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', backgroundColor: (!name || !contact || services.length === 0) ? '#e5e7eb' : '#2600FF', color: (!name || !contact || services.length === 0) ? '#9ca3af' : '#fff', fontWeight: 600, fontSize: 14, cursor: (!name || !contact || services.length === 0) ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}>
              Anfrage senden
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SolutionSection() {
  const [selected, setSelected] = useState<string[]>([])
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])

  const toggle = (label: string) => setSelected(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])
  const toggleExpanded = (label: string) => setExpanded(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])

  return (
    <>
      {quoteOpen && <QuoteModal selected={selected} onClose={() => setQuoteOpen(false)} />}
      <section id="modules" style={{ backgroundColor: '#f9fafb', padding: '80px 24px', paddingBottom: selected.length > 0 ? '140px' : '80px', transition: 'padding-bottom 0.3s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 className="reveal" style={{ fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 700, color: '#030712', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.5px' }}>
            Wählen Sie den Service. <span style={{ color: '#2600FF' }}>Wir vermitteln Ihnen den passenden Spezialisten</span>
          </h2>
          <p style={{ fontSize: 14, fontWeight: 400, color: '#4b5563', textAlign: 'center', marginBottom: 36, lineHeight: 1.6 }}>
            Wählen Sie alle Leistungen aus, die Ihr Unternehmen braucht. Wir erstellen daraus einen Plan. Nicht sicher?{' '}
            <a href="#audit-quiz" style={{ color: '#2600FF', textDecoration: 'underline', fontWeight: 500 }}>Machen Sie stattdessen das kostenlose Audit.</a>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {modules.map(m => {
              const checked = selected.includes(m.label)
              const isOpen = expanded.includes(m.label)
              return (
                <div key={m.label}
                  onClick={() => toggle(m.label)}
                  style={{ backgroundColor: '#fff', border: `2px solid ${checked ? '#2600FF' : '#e5e7eb'}`, borderRadius: 16, overflow: 'hidden', boxShadow: checked ? '0 8px 28px rgba(38,0,255,0.1)' : '0 4px 16px rgba(0,0,0,0.05)', transition: 'border-color 0.2s, box-shadow 0.2s', cursor: 'pointer', position: 'relative' }}>
                  {checked && (
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, backgroundColor: '#2600FF', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Zu Ihrem Plan hinzugefügt
                    </div>
                  )}
                  <m.Illust />
                  <div style={{ padding: '14px 18px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? '#2600FF' : '#d1d5db'}`, backgroundColor: checked ? '#2600FF' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
                        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 14, color: '#030712', marginBottom: 4 }}>{m.label}</h3>
                        <p style={{ fontWeight: 400, fontSize: 13, color: '#4b5563', lineHeight: 1.55, margin: 0 }}>{m.sentence}</p>
                        <button
                          onClick={e => { e.stopPropagation(); toggleExpanded(m.label) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#2600FF' }}>
                          {isOpen ? 'Weniger anzeigen' : 'Mehr erfahren'}
                          <IconChevron open={isOpen} />
                        </button>
                        <div style={{ overflow: 'hidden', maxHeight: isOpen ? 460 : 0, transition: 'max-height 0.3s ease' }}>
                          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Was es ist</p>
                              <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>{m.what}</p>
                            </div>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Wie es funktioniert</p>
                              <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>{m.how}</p>
                            </div>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#2600FF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Warum Sie es brauchen</p>
                              <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>{m.why}</p>
                            </div>
                            <a href={`/services/${m.slug}`} onClick={e => e.stopPropagation()}
                              style={{ fontSize: 12, fontWeight: 600, color: '#2600FF', textDecoration: 'underline' }}>
                              Zur vollständigen Service-Seite →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {/* 7th card — "Not Sure" */}
            <div style={{ backgroundColor: '#f5f3ff', border: '2px dashed #c4b5fd', borderRadius: 16, padding: '28px 22px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', minHeight: 160 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#030712', marginBottom: 8 }}>Nicht sicher, wo Sie anfangen sollen?</h3>
              <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, marginBottom: 18 }}>Machen Sie das kostenlose 2-Minuten-Audit und wir sagen Ihnen genau, welche Leistungen Ihr Unternehmen braucht.</p>
              <a href="#audit-quiz"
                onClick={e => e.stopPropagation()}
                style={{ display: 'inline-block', backgroundColor: '#2600FF', color: '#fff', fontWeight: 600, fontSize: 13, padding: '10px 18px', borderRadius: 10, textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a00cc')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2600FF')}>
                Kostenloses Audit starten →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, transform: selected.length > 0 ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#4b5563' }}>
            Ihr Plan: <span style={{ fontWeight: 700, color: '#030712' }}>{selected.length} Leistung{selected.length !== 1 ? 'en' : ''} ausgewählt</span>
          </div>
          <button onClick={() => setQuoteOpen(true)}
            style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 600, fontSize: 14, padding: '11px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a00cc')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2600FF')}>
            Individuelles Angebot erhalten →
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS
// ─────────────────────────────────────────────────────────────────────────────
const steps = [
  { num: '01', title: 'Wir analysieren Ihre aktuelle Sichtbarkeit im Detail', desc: 'Wir erfassen Ihr Google-Maps-Ranking, Ihre KI-Suchpräsenz, Bewertungen und Social-Media-Profile. Dann zeigen wir Ihnen genau, wo sich Kunden für Mitbewerber statt für Sie entscheiden.', cta: true },
  { num: '02', title: 'Sie erhalten einen Plan, keine Verkaufsshow', desc: "Ein persönlicher Berater bespricht Ihre Ergebnisse mit Ihnen und zeigt, welche Leistungen zuerst etwas bewegen. Sie entscheiden, was aktiviert wird. Kein Paket, das Sie nicht brauchen." },
  { num: '03', title: 'Wir kümmern uns um jedes Detail', desc: 'Unser Team baut, startet und betreut jede Leistung von Anfang bis Ende. Nichts landet wieder auf Ihrem Schreibtisch.' },
  { num: '04', title: 'Sie sehen zu, wie die Leads eintreffen', desc: 'Verfolgen Sie Anrufe, Rankings und Bewertungen in einem wöchentlichen Bericht. Echte Zahlen statt Schönwetter-Kennzahlen.' },
]

function Process() {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Cascade each step in with a delay
        steps.forEach((_, i) => {
          setTimeout(() => setActive(i), i * 420)
        })
        obs.disconnect()
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} style={{ backgroundColor: '#fff', padding: '80px 24px' }}>
      <style>{`
        @keyframes stepPop {
          0% { opacity:0; transform: translateY(18px) scale(0.94); }
          60% { transform: translateY(-3px) scale(1.02); }
          100% { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes connectorGrow {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes dotSlide {
          0% { left: 0%; opacity:0; }
          20% { opacity:1; }
          80% { opacity:1; }
          100% { left: 100%; opacity:0; }
        }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 className="reveal" style={{ fontSize: 'clamp(20px, 3.5vw, 30px)', fontWeight: 700, color: '#030712', textAlign: 'center', marginBottom: 52, letterSpacing: '-0.5px' }}>
          Vier Schritte zu <span style={{ color: '#2600FF' }}>planbaren lokalen Leads</span>
        </h2>

        {/* Steps row with animated connectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative', alignItems: 'start' }} className="process-grid">
          {steps.map((s, i) => (
            <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* Connector line between steps */}
              {i < steps.length - 1 && (
                <div style={{ position: 'absolute', top: 28, left: '50%', width: '100%', height: 2, zIndex: 0 }}>
                  {/* Track */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#e5e7eb', borderRadius: 1 }}/>
                  {/* Fill */}
                  {active >= i + 1 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: '#2600FF', borderRadius: 1, animation: 'connectorGrow 0.35s ease forwards' }}/>
                  )}
                  {/* Travelling dot */}
                  {active === i && (
                    <div style={{ position: 'absolute', top: -4, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2600FF', boxShadow: '0 0 8px rgba(38,0,255,0.5)', animation: 'dotSlide 0.4s ease forwards' }}/>
                  )}
                </div>
              )}

              {/* Step circle */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: active >= i ? '#2600FF' : '#f3f4f6',
                border: `2px solid ${active >= i ? '#2600FF' : '#e5e7eb'}`,
                zIndex: 1, position: 'relative', transition: 'background-color 0.3s, border-color 0.3s',
                animation: active === i ? 'stepPop 0.4s ease forwards' : 'none',
                boxShadow: active >= i ? '0 0 0 6px rgba(38,0,255,0.08)' : 'none',
              }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: active >= i ? '#fff' : '#9ca3af', transition: 'color 0.3s', fontFamily: 'Satoshi, sans-serif' }}>{s.num}</span>
              </div>

              {/* Content */}
              <div style={{
                marginTop: 16, padding: '0 12px', textAlign: 'center',
                opacity: active >= i ? 1 : 0,
                transform: active >= i ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}>
                <h3 style={{ fontWeight: 700, fontSize: 14, color: '#030712', marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontWeight: 400, fontSize: 13, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                {'cta' in s && s.cta && (
                  <a href="#audit-quiz" style={{ display: 'inline-block', marginTop: 12, backgroundColor: '#2600FF', color: '#fff', fontWeight: 600, fontSize: 12, padding: '8px 16px', borderRadius: 9, textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a00cc')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2600FF')}>
                    Kostenloses Audit starten →
                  </a>
                )}
              </div>
            </div>
          ))}
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
      <text x="255" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#059669" fontFamily="Arial, sans-serif">NACHHER · nach Audit-Fix</text>
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

function RealResults() {
  const [active, setActive] = useState(0)
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  const [paused, setPaused] = useState(false)
  const total = caseStudies.length
  const touchX = useRef<number | null>(null)

  const goPrev = () => { setDir('prev'); setActive(a => (a - 1 + total) % total) }
  const goNext = () => { setDir('next'); setActive(a => (a + 1) % total) }
  const goTo = (i: number) => { setDir(i > active ? 'next' : 'prev'); setActive(i) }

  // Auto-advance every 5s; restarts on any manual navigation and pauses on hover/touch.
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => { setDir('next'); setActive(a => (a + 1) % total) }, 5000)
    return () => clearInterval(id)
  }, [active, paused, total])

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; setPaused(true) }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const delta = e.changedTouches[0].clientX - touchX.current
    if (delta > 50) goPrev()
    else if (delta < -50) goNext()
    touchX.current = null
    setPaused(false)
  }

  const c = caseStudies[active]
  const arrowBtnStyle: React.CSSProperties = {
    width: 38, height: 38, borderRadius: '50%', border: '1px solid #e5e7eb', backgroundColor: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', cursor: 'pointer',
    flexShrink: 0, transition: 'all 0.15s', fontFamily: 'inherit',
  }

  return (
    <section id="results" style={{ backgroundColor: '#f9fafb', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 className="reveal" style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700, color: '#030712', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.5px' }}>
          Echte Ergebnisse, <span style={{ color: '#2600FF' }}>echte Unternehmen</span>
        </h2>
        <p style={{ fontSize: 15, fontWeight: 400, color: '#4b5563', textAlign: 'center', marginBottom: 40 }}>
          Was sich für drei Unternehmen verändert hat, die genau dort gestartet sind, wo Sie jetzt stehen.
        </p>

        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <button aria-label="Vorherige Fallstudie" onClick={goPrev} style={arrowBtnStyle} className="hidden-mobile"
            onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = '#2600FF'; b.style.color = '#2600FF' }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = '#e5e7eb'; b.style.color = '#4b5563' }}>
            <ChevronIcon />
          </button>

          <div style={{ flex: 1, overflow: 'hidden' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div key={active} className={`testimonial-card ${dir === 'next' ? 'case-slide-next' : 'case-slide-prev'}`} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
              {/* Before/After visual */}
              <div style={{ padding: '16px 16px 0' }}>
                <c.Illust />
              </div>
              {/* Client identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px 0' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#2600FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>{c.initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#030712' }}>{c.name}</div>
                  <div style={{ fontWeight: 400, fontSize: 12, color: '#4b5563' }}>{c.role}</div>
                </div>
              </div>
              {/* Structured lines */}
              <div style={{ padding: '16px 22px 0', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {[
                  { label: 'Ausgangslage', value: c.startingPoint },
                  { label: 'Unser Ansatz', value: c.approach },
                  { label: 'Das Ergebnis', value: c.result, accent: true },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: row.accent ? '#2600FF' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', paddingTop: 2, minWidth: 90 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: row.accent ? 600 : 400, color: row.accent ? '#030712' : '#374151', lineHeight: 1.55 }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {/* Pull-quote */}
              <div style={{ margin: '16px 22px 22px', padding: '14px 16px', backgroundColor: '#f2f2ff', borderRadius: 12, borderLeft: '3px solid #2600FF' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#2600FF', fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>{c.quote}</p>
              </div>
            </div>
          </div>

          <button aria-label="Nächste Fallstudie" onClick={goNext} style={arrowBtnStyle} className="hidden-mobile"
            onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = '#2600FF'; b.style.color = '#2600FF' }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = '#e5e7eb'; b.style.color = '#4b5563' }}>
            <ChevronIcon flip />
          </button>
        </div>

        {/* Mobile arrows + dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
          <button aria-label="Vorherige Fallstudie" onClick={goPrev} style={arrowBtnStyle} className="show-mobile">
            <ChevronIcon />
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {caseStudies.map((_, i) => (
              <button
                key={i}
                aria-label={`Zur Fallstudie ${i + 1}`}
                onClick={() => goTo(i)}
                style={{
                  width: active === i ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: active === i ? '#2600FF' : '#ddd6fe',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <button aria-label="Nächste Fallstudie" onClick={goNext} style={arrowBtnStyle} className="show-mobile">
            <ChevronIcon flip />
          </button>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT QUIZ
// ─────────────────────────────────────────────────────────────────────────────
function AuditQuiz() {
  const [step, setStep] = useState(0)
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
    <button onClick={onClick} style={{ display: 'block', width: '100%', padding: '11px 16px', textAlign: 'left', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, fontWeight: 500, fontSize: 13, color: '#030712', cursor: 'pointer', marginBottom: 8, transition: 'all 0.15s', fontFamily: 'inherit' }}
      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#2600FF'; b.style.backgroundColor = '#f2f2ff'; b.style.color = '#2600FF' }}
      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#e5e7eb'; b.style.backgroundColor = '#f9fafb'; b.style.color = '#030712' }}>
      {label}
    </button>
  )

  const reset = () => { setStep(0); setAnswers({}); setName(''); setPhone(''); setEmail(''); setCompanyName(''); setIndustry(''); setBookedQuizDay(null); setBookedQuizSlot(null) }

  return (
    <section id="audit-quiz" style={{ backgroundColor: '#f9fafb', padding: '80px 24px' }}>
      <div className="audit-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 480px', gap: 56, alignItems: 'center' }}>
        <div className="audit-copy" style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 700, color: '#030712', marginBottom: 14, letterSpacing: '-0.5px' }}>
            Kostenloses <span style={{ color: '#2600FF' }}>2-Minuten-Sichtbarkeits-Audit</span>
          </h2>
          <p style={{ fontSize: 15, fontWeight: 400, color: '#4b5563', marginBottom: 26, lineHeight: 1.7 }}>&thinsp;5 Fragen · Google- &amp; KI-Präsenz-Check · Persönlicher Wachstumsplan</p>
          <div className="audit-bullets" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Kein Verkaufsgespräch, nur Ihre Ergebnisse', 'Fertig in unter 2 Minuten', 'Persönlicher Plan innerhalb von 24 Stunden'].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', backgroundColor: '#f2f2ff', color: '#2600FF', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 14, color: '#374151' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '32px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
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

          {step === 0 && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, marginBottom: 22 }}>Beantworten Sie 5 kurze Fragen, um genau herauszufinden, wo Sie unsichtbar sind&nbsp;&nbsp;und erhalten Sie einen Schritt-für-Schritt-Wachstumsplan</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 14, padding: '12px 26px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', fontFamily: 'inherit' }}>Kostenloses Audit starten</button>
                {/* Hidden anchor so the hero "Book a Call" button can trigger booking directly */}
                <button id="quiz-book-direct" onClick={() => setStep(9)} style={{ backgroundColor: '#fff', color: '#2600FF', fontWeight: 500, fontSize: 14, padding: '12px 26px', borderRadius: 12, border: '1.5px solid #c4b5fd', cursor: 'pointer', fontFamily: 'inherit', display: 'none' }}>Direkt zur Buchung</button>
              </div>
            </div>
          )}
          {step === 1 && <><h3 style={{ fontWeight: 600, fontSize: 15, color: '#030712', marginBottom: 16 }}>In welcher Stadt sind Sie ansässig?</h3>{['München', 'Berlin', 'Hamburg', 'Frankfurt', 'Sonstige'].map(c => <Btn key={c} label={c} onClick={() => pick('city', c)} />)}</>}
          {step === 2 && <><h3 style={{ fontWeight: 600, fontSize: 15, color: '#030712', marginBottom: 16 }}>Wie viele neue Kunden pro Monat?</h3>{['Weniger als 10', '10–30', '30–60', 'Mehr als 60'].map(c => <Btn key={c} label={c} onClick={() => pick('clients', c)} />)}</>}
          {step === 3 && <><h3 style={{ fontWeight: 600, fontSize: 15, color: '#030712', marginBottom: 16 }}>Wie erreichen Sie die meisten Kunden?</h3>{['Mundpropaganda', 'Google-Suche', 'Social Media', 'Bezahlte Anzeigen', "Ich bin mir nicht sicher"].map(c => <Btn key={c} label={c} onClick={() => pick('channel', c)} />)}</>}
          {step === 4 && (
            <div>
              <h3 style={{ fontWeight: 600, fontSize: 15, color: '#030712', marginBottom: 16 }}>In welcher Branche sind Sie tätig?</h3>
              <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="z. B. Autowerkstatt, Zahnmedizin, Heizungstechnik…" style={{ width: '100%', padding: '11px 13px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
              <button onClick={() => pick('industry', industry || 'Nicht angegeben')} style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 13, padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>Weiter</button>
            </div>
          )}
          {step === 5 && (
            <div>
              <h3 style={{ fontWeight: 600, fontSize: 14, color: '#030712', marginBottom: 4 }}>Wir prüfen jetzt Ihre Sichtbarkeit in der KI-Suche</h3>
              <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 14 }}>Illustratives Beispiel, keine Live-Abfrage</p>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Name Ihres Unternehmens" style={{ width: '100%', padding: '11px 13px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
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
                  Ein vollständiges Sichtbarkeits-Audit und ein Schritt-für-Schritt-Optimierungsplan werden nach Abschluss der Umfrage erstellt und zugesendet.
                </p>
              </div>
              <button onClick={() => setStep(6)} style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 13, padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>So ändern Sie das</button>
            </div>
          )}
          {step === 6 && <><h3 style={{ fontWeight: 600, fontSize: 15, color: '#030712', marginBottom: 16 }}>Was ist Ihre größte Sorge?</h3>{['Ein Mitbewerber ist mir voraus', 'Zu wenig Leads', 'Leads passen nicht', "Ich bin bei Google & KI unsichtbar", "Ich habe es satt, Dienstleister zu koordinieren", 'Sonstiges'].map(c => <Btn key={c} label={c} onClick={() => pick('concern', c)} />)}</>}
          {step === 7 && <><h3 style={{ fontWeight: 600, fontSize: 15, color: '#030712', marginBottom: 16 }}>Monatliches Marketingbudget?</h3>{['Bis 500 €', '500–1.500 €', '1.500–3.000 €', 'Über 3.000 €', "Ich bin noch nicht investitionsbereit"].map(c => <Btn key={c} label={c} onClick={() => pick('budget', c)} />)}</>}
          {step === 8 && (
            <div>
              <h3 style={{ fontWeight: 600, fontSize: 15, color: '#030712', marginBottom: 5 }}>Erhalten Sie Ihre Analyse &amp; Ihren Aktionsplan</h3>
              <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 16 }}>Ein Berater sendet Ihnen innerhalb von 24 Stunden Ihren persönlichen Plan.</p>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Vollständiger Name" style={{ width: '100%', padding: '11px 13px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefonnummer" style={{ width: '100%', padding: '11px 13px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-Mail-Adresse" style={{ width: '100%', padding: '11px 13px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
              <button onClick={() => setStep(9)} style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 14, padding: '12px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', width: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', fontFamily: 'inherit' }}>Analyse und Aktionsplan erhalten</button>
            </div>
          )}

          {/* ── Step 9: Book a consultation call ── */}
          {step === 9 && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: '#030712', marginBottom: 4 }}>Wählen Sie einen Termin für Ihren Anruf</h3>
              <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 18, lineHeight: 1.6 }}>
                Wählen Sie einen passenden Termin, ein Berater bespricht live mit Ihnen Ihre Audit-Ergebnisse
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
                  Eine Kalendereinladung und Ihre Audit-Ergebnisse werden an <strong>{email || 'Ihre E-Mail-Adresse'}</strong> gesendet
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, marginBottom: 16 }}>
                Ihr Berater sichtet Ihr Audit vor dem Anruf, damit Sie eine persönliche Beratung erhalten – keine Standard-Präsentation.
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
  { q: 'Wie wird RAG abgerechnet?', a: "RAG ist als monatliches Retainer-Modell aufgebaut, mit dem Preis abhängig von den aktivierten Modulen. Nach dem kostenlosen Audit wählen Sie ein Paket, das zu Ihrem Budget passt. Es gibt keine versteckten Gebühren oder langfristige Bindung. Die meisten Kunden starten mit dem Kern-Sichtbarkeitspaket (Maps, Bewertungen, KI) und ergänzen Anzeigen oder Offline-Werbung, sobald sie skalieren wollen." },
  { q: "Warum reicht ein Google-Unternehmensprofil allein nicht aus?", a: "Ein gut optimiertes Google-Unternehmensprofil bringt Sie auf Google Maps. Es deckt aber nicht die KI-Suche (ChatGPT, Gemini, Perplexity), Bewertungsplattformen wie Trustpilot, Social Media oder Offline-Kontaktpunkte ab. Kunden nutzen all das, bevor sie anrufen. Nur einen Kanal zu reparieren, während die anderen Lecks bleiben, ist der Grund, warum so viele Unternehmer das Gefühl haben, dass nichts funktioniert." },
  { q: 'Wie schnell sehe ich Ergebnisse?', a: 'Die meisten Kunden sehen innerhalb der ersten 2–4 Wochen messbare Verbesserungen bei Anrufvolumen und Ranking-Position. Bewertungsdynamik und KI-Sichtbarkeit bauen sich in der Regel über 6–8 Wochen auf. Wir verfolgen alles und teilen wöchentliche Fortschrittsberichte, damit Sie immer wissen, was sich bewegt hat.' },
  { q: 'Warum ist KI-Suche gerade jetzt wichtig?', a: "Ein wachsender Anteil der Dienstleistungssuchen beginnt heute mit \"frag ChatGPT\" oder einer Perplexity-Anfrage statt einer Google-Suche. Wird Ihr Unternehmen nicht von KI-Modellen empfohlen, sind Sie für dieses Publikum komplett unsichtbar. RAG optimiert Ihren Online-Auftritt gezielt dafür, in KI-generierten lokalen Empfehlungen zu erscheinen." },
  { q: "Ich habe es schon mit anderen Agenturen versucht, ohne Erfolg. Was ist hier anders?", a: "Die meisten Agenturen konzentrieren sich auf einen einzigen Kanal, meist SEO oder Anzeigen, und optimieren isoliert. Es bewegt sich nichts, weil Kunden mehrere Signale nutzen, bevor sie jemanden kontaktieren. RAG behandelt alle fünf Kanäle als ein System. Das Audit zeigt Ihnen zudem genau, welche Lücke Sie am meisten kostet, sodass Sie nicht raten müssen." },
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
]

function LocalVisibilityExplained() {
  return (
    <section style={{ backgroundColor: '#fff', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 className="reveal" style={{ fontSize: 'clamp(20px, 3.5vw, 30px)', fontWeight: 700, color: '#030712', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.5px' }}>
          Lokale Sichtbarkeit, <span style={{ color: '#2600FF' }}>einfach erklärt</span>
        </h2>
        <p style={{ fontSize: 15, color: '#4b5563', textAlign: 'center', marginBottom: 40, lineHeight: 1.65 }}>Die kurzen Antworten auf die Fragen, die uns in fast jedem Erstgespräch gestellt werden.</p>
        <div className="explained-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {explainedItems.map((item, i) => (
            <div key={i} style={{ backgroundColor: '#f9fafb', borderRadius: 16, border: '1px solid #e5e7eb', borderLeft: '3px solid #2600FF', padding: '26px 26px 24px' }}>
              <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#2600FF', backgroundColor: '#f2f2ff', border: '1px solid #ddd6fe', borderRadius: 6, padding: '2px 8px', marginBottom: 12, letterSpacing: '0.04em' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 style={{ fontWeight: 600, fontSize: 16, color: '#030712', lineHeight: 1.4, marginBottom: 10 }}>{item.q}</h3>
              <p style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.75 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" style={{ backgroundColor: '#fff', padding: '80px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: 700, color: '#030712', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.5px' }}>
          Häufige Fragen <span style={{ color: '#2600FF' }}>beantwortet</span>
        </h2>
        <p style={{ fontSize: 14, fontWeight: 400, color: '#4b5563', textAlign: 'center', marginBottom: 36 }}>Alles, was Sie wissen müssen, bevor Sie Ihr Audit starten</p>
        <div className="faq-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'start' }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 13, overflow: 'hidden', backgroundColor: '#f9fafb' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#030712', lineHeight: 1.4 }}>{f.q}</span>
                <IconChevron open={open === i} />
              </button>
              {open === i && <div style={{ padding: '0 18px 14px', fontSize: 13, color: '#4b5563', lineHeight: 1.75 }}>{f.a}</div>}
            </div>
          ))}
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
  const cardStyle: React.CSSProperties = { borderRadius: 20, padding: '48px 36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }
  return (
    <>
      {modal && <BookCallModal onClose={() => setModal(false)} />}
      <section style={{ backgroundColor: '#fff', padding: '80px 24px', borderTop: '1px solid #e5e7eb' }}>
        <div className="dual-cta-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'stretch' }}>
          <div style={{ ...cardStyle, backgroundColor: '#f2f2ff', border: '1px solid #ddd6fe' }}>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: '#030712', marginBottom: 12, letterSpacing: '-0.5px' }}>
              Machen Sie das kostenlose <span style={{ color: '#2600FF' }}>2-Minuten-Sichtbarkeits-Audit</span>
            </h2>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#4b5563', marginBottom: 26, lineHeight: 1.7 }}>
              Beantworten Sie in 2 Minuten 5 Fragen, um Ihren aktuellen Status bei Google und KI zu erfahren, und erhalten Sie einen Schritt-für-Schritt-Wachstumsplan
            </p>
            <a href="#audit-quiz" className="cta-pulse" style={{ display: 'inline-block', backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 15, padding: '13px 30px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a00cc')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2600FF')}>
              Kostenloses Audit erhalten
            </a>
          </div>
          <div style={{ ...cardStyle, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <span style={{ display: 'inline-block', backgroundColor: '#f2f2ff', color: '#2600FF', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 8, border: '1px solid #ddd6fe', marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Neugründung
            </span>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: '#030712', marginBottom: 14, letterSpacing: '-0.4px', lineHeight: 1.3 }}>
              Starten Sie bei null und wollen{' '}
              <span style={{ color: '#2600FF' }}>lokale Sichtbarkeit von Anfang an richtig aufbauen?</span>
            </h2>
            <p style={{ fontSize: 15, fontWeight: 400, color: '#4b5563', lineHeight: 1.7, marginBottom: 28 }}>
              Keine Bewertungen, keine Google-Präsenz, keine Social-Media-Follower. Kein Problem. Buchen Sie einen Anruf, und wir entwickeln von Tag eins an ein Sichtbarkeitssystem für Ihre Branche und Ihre Stadt.
            </p>
            <button
              onClick={() => setModal(true)}
              style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 600, fontSize: 15, padding: '13px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a00cc')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2600FF')}>
              Kostenloses Beratungsgespräch buchen
            </button>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>Kein Audit nötig. Nur ein Gespräch über Ihre Ziele.</p>
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
    <footer style={{ backgroundColor: '#030712', color: '#e5e7eb', padding: '52px 24px 28px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 36, marginBottom: 44 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 8 }}>RAG<span style={{ color: '#2600FF' }}>.</span></div>
            <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.7, maxWidth: 210 }}>Das einheitliche System für lokale Sichtbarkeit bei Google, KI und Offline-Kanälen.</p>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>Navigation</div>
            {[['Audit', 'audit'], ['Leistungen', 'modules'], ['Ergebnisse', 'results'], ['FAQ', 'faq']].map(([l, anchor]) => (
              <a key={l} href={homeHref(anchor)} style={{ display: 'block', fontSize: 13, color: '#d1d5db', textDecoration: 'none', marginBottom: 7, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}>{l}</a>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>Rechtliches</div>
            {['Impressum', 'Datenschutz', 'DSGVO-Konformität', 'AGB'].map(l => (
              <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: '#d1d5db', textDecoration: 'none', marginBottom: 7, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}>{l}</a>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>Kontakt</div>
            <p style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.85, margin: 0 }}>Musterstraße 12<br />10115 Berlin, Deutschland<br />+49 30 12345678<br />hallo@rag-agentur.de</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1f2937', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>© 2026 RAG, Regionale Agentur. Alle Rechte vorbehalten.</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>DSGVO-konform · Made in Deutschland</p>
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
    ctaTitle: 'Holen Sie sich Ihr kostenloses Local-Maps-Audit',
    ctaBody: 'Fordern Sie ein umfassendes Audit Ihres Google-Unternehmensprofils an, um Ranking-Blocker und lokale Wachstumschancen zu identifizieren.',
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
    ctaTitle: 'Holen Sie sich Ihr kostenloses KI-Sichtbarkeits-Audit',
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
    ctaTitle: 'Holen Sie sich Ihr kostenloses Bewertungsprofil-Audit',
    ctaBody: 'Vergleichen Sie Ihre aktuelle Bewertungsgeschwindigkeit und Sternebewertung mit den führenden Mitbewerbern in Ihrem Markt.',
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
    ctaTitle: 'Holen Sie sich Ihr kostenloses Social-Media-Audit',
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
    ctaTitle: 'Holen Sie sich Ihr kostenloses Anzeigenkonto-Audit',
    ctaBody: 'Erhalten Sie ein vollständiges Audit Ihres aktuellen Anzeigenkontos oder eine individuelle Kampagnenstrategie.',
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
  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#030712', backgroundColor: '#fff' }

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
        <h3 style={{ fontWeight: 700, fontSize: 18, color: '#030712', marginBottom: 6 }}>Anfrage gesendet!</h3>
        <p style={{ fontSize: 14, color: '#4b5563' }}>Ein Berater sendet Ihnen Ihr {serviceLabel}-Audit innerhalb von 24 Stunden.</p>
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
        style={{ padding: '13px', borderRadius: 12, border: 'none', backgroundColor: (!name || !contact) ? '#e5e7eb' : '#2600FF', color: (!name || !contact) ? '#9ca3af' : '#fff', fontWeight: 600, fontSize: 14, cursor: (!name || !contact) ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}>
        Anfrage senden
      </button>
    </div>
  )
}

function ServicePage({ slug }: { slug: string }) {
  const data = servicePages.find(s => s.slug === slug)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  if (!data) {
    return (
      <>
        <Nav />
        <section style={{ padding: '120px 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#030712', marginBottom: 14 }}>Service nicht gefunden</h1>
          <a href="/" style={{ color: '#2600FF', fontWeight: 600, textDecoration: 'none' }}>← Zurück zur Startseite</a>
        </section>
        <Footer />
      </>
    )
  }

  const others = modules.filter(m => m.slug !== slug)

  return (
    <>
      <Nav />
      <section style={{ backgroundColor: '#f9fafb', padding: '64px 24px 56px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2600FF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>{data.kicker}</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: '#030712', lineHeight: 1.15, letterSpacing: '-0.8px', marginBottom: 18 }}>{data.heroTitle}</h1>
          <p style={{ fontSize: 16, color: '#4b5563', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 28px' }}>{data.heroSubtitle}</p>
          <a href="#get-audit" style={{ display: 'inline-block', backgroundColor: '#2600FF', color: '#fff', fontWeight: 600, fontSize: 15, padding: '13px 28px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>{data.ctaTitle} →</a>
        </div>
      </section>

      <section style={{ backgroundColor: '#fff', padding: '64px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ marginBottom: 44 }}><data.Illust /></div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#030712', marginBottom: 12 }}>{data.whatTitle}</h2>
          <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.75, marginBottom: 40 }}>{data.whatBody}</p>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#030712', marginBottom: 20 }}>{data.howTitle}</h2>
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

          <div style={{ backgroundColor: '#f2f2ff', border: '1px solid #ddd6fe', borderRadius: 16, padding: '28px 26px', marginBottom: 40 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#030712', marginBottom: 14 }}>{data.receiveTitle}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.receiveItems.map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 2, flexShrink: 0 }}><circle cx="8" cy="8" r="8" fill="#2600FF" /><path d="M4.5 8l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#030712', marginBottom: 12 }}>{data.whyTitle}</h2>
          <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.75, marginBottom: 40 }}>{data.whyBody}</p>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#030712', marginBottom: 16 }}>Häufig gestellte Fragen</h2>
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
      </section>

      <section id="get-audit" style={{ backgroundColor: '#f9fafb', padding: '64px 24px' }}>
        <div style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: 700, color: '#030712', marginBottom: 10 }}>{data.ctaTitle}</h2>
          <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.65, marginBottom: 28 }}>{data.ctaBody}</p>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '28px 26px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', textAlign: 'left' }}>
            <ServiceLeadForm serviceLabel={data.heroTitle} />
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: '#fff', padding: '64px 24px 80px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: '#030712', textAlign: 'center', marginBottom: 8 }}>Entdecken Sie unsere weiteren Leistungen</h2>
          <p style={{ fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 32 }}>Die meisten Unternehmen brauchen mehr als einen Kanal, um echte Ergebnisse zu sehen. Entdecken Sie das gesamte System.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {others.map(m => (
              <a key={m.slug} href={`/services/${m.slug}`} style={{ display: 'block', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px', textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2600FF')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#030712', margin: '0 0 4px' }}>{m.label}</p>
                <p style={{ fontSize: 12.5, color: '#4b5563', margin: 0, lineHeight: 1.5 }}>{m.sentence}</p>
              </a>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <a href="/" style={{ fontSize: 13, fontWeight: 600, color: '#2600FF', textDecoration: 'underline' }}>Das komplette RAG-System auf der Startseite ansehen →</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE
// ─────────────────────────────────────────────────────────────────────────────
const responsiveCSS = `
@media (max-width: 768px) {
  .hidden-mobile { display: none !important; }
  .show-mobile { display: flex !important; }
  .problem-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
  .process-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
  .about-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
  .audit-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
  .audit-copy { text-align: center !important; }
  .audit-bullets > div { justify-content: center !important; }
  .explained-grid { grid-template-columns: 1fr !important; }
  .faq-grid { grid-template-columns: 1fr !important; }
  .dual-cta-grid { grid-template-columns: 1fr !important; }
}
@media (min-width: 769px) {
  .show-mobile { display: none !important; }
}

/* ── Global scroll-reveal ── */
.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
.reveal-delay-1 { transition-delay: 0.1s; }
.reveal-delay-2 { transition-delay: 0.2s; }
.reveal-delay-3 { transition-delay: 0.3s; }
.reveal-delay-4 { transition-delay: 0.4s; }

/* ── Real Results case-study carousel slide ── */
@keyframes caseSlideNext {
  from { opacity: 0; transform: translateX(28px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes caseSlidePrev {
  from { opacity: 0; transform: translateX(-28px); }
  to   { opacity: 1; transform: translateX(0); }
}
.case-slide-next { animation: caseSlideNext 0.35s ease both; }
.case-slide-prev { animation: caseSlidePrev 0.35s ease both; }

/* ── Hero radar rings ── */
@keyframes radarPulse {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(7); opacity: 0; }
}
.radar-ring-1 { animation: radarPulse 3s ease-out infinite; transform-box: fill-box; transform-origin: center; }
.radar-ring-2 { animation: radarPulse 3s ease-out infinite 1s; transform-box: fill-box; transform-origin: center; }
.radar-ring-3 { animation: radarPulse 3s ease-out infinite 2s; transform-box: fill-box; transform-origin: center; }

/* ── Hero "Your Business #1" card float ── */
@keyframes cardFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
.hero-card-float { animation: cardFloat 3.4s ease-in-out infinite; }

/* ── Hero pin drift ── */
@keyframes pinDrift {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.55; }
  50%       { transform: translateY(-6px) scale(1.07); opacity: 0.75; }
}
.hero-pin-1 { animation: pinDrift 4s ease-in-out infinite; }
.hero-pin-2 { animation: pinDrift 4s ease-in-out infinite 1.4s; }

/* ── Trust row count-up glow ── */
@keyframes numberGlow {
  0%, 100% { text-shadow: none; }
  50%       { text-shadow: 0 0 18px rgba(38,0,255,0.35); }
}
.count-glow { animation: numberGlow 2.4s ease-in-out infinite 1s; }

/* ── CTA button pulse ── */
@keyframes ctaPulse {
  0%, 100% { box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
  50%       { box-shadow: 0 0 0 8px rgba(38,0,255,0.12), 0 1px 2px rgba(0,0,0,0.12); }
}
.cta-pulse { animation: ctaPulse 2.6s ease-in-out infinite; }

/* ── Testimonial card shimmer on hover ── */
.testimonial-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  overflow: hidden;
}
.testimonial-card::after {
  content: '';
  position: absolute;
  top: -60%;
  left: -60%;
  width: 60%;
  height: 220%;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%);
  transform: skewX(-15deg);
  opacity: 0;
  transition: opacity 0s;
}
.testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,0.1); }
.testimonial-card:hover::after { animation: shimmer 0.55s ease forwards; }
@keyframes shimmer {
  0%   { left: -60%; opacity: 1; }
  100% { left: 130%; opacity: 1; }
}

/* ── Comparison table row reveal ── */
@keyframes rowSlideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.table-row-anim { animation: rowSlideIn 0.4s ease both; }

/* ── Badge entrance bounce ── */
@keyframes badgeBounce {
  0%   { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); }
}
.badge-bounce { animation: badgeBounce 0.5s ease both; }
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
          position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          pointerEvents: visible ? 'auto' : 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRight: 'none',
          borderRadius: '12px 0 0 12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          padding: hovered ? '18px 20px' : '14px 14px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          transition: 'padding 0.25s ease',
          maxWidth: hovered ? 200 : 48,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}>
          {!hovered && (
            <button onClick={() => setModal(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2600FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#2600FF', textTransform: 'uppercase', letterSpacing: '0.05em', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Buchen</span>
            </button>
          )}
          {hovered && (
            <>
              <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>Wissen Sie schon, was Sie brauchen?</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#030712', textAlign: 'center', margin: 0 }}>Kein Audit nötig.</p>
              <button onClick={() => setModal(true)}
                style={{ backgroundColor: '#2600FF', color: '#fff', fontWeight: 600, fontSize: 13, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a00cc')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2600FF')}>
                Anruf buchen
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function LandingPage() {
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
      <Hero />
      {/* Sentinel: widget is visible while this is on screen (i.e. within the hero area) */}
      <div ref={widgetSentinel} style={{ height: 1, pointerEvents: 'none' }} />
      <AboutRAG />
      <ProblemSection />
      <section style={{ backgroundColor: '#f9fafb', padding: '0 24px 72px', textAlign: 'center' }}>
        <a href="#audit-quiz"
          style={{ display: 'inline-block', backgroundColor: '#2600FF', color: '#fff', fontWeight: 500, fontSize: 16, padding: '14px 32px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a00cc')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2600FF')}>
          Finden Sie die Ursache für meinen Kundenverlust
        </a>
      </section>
      <SolutionSection />
      <Process />
      <RealResults />
      <AuditQuiz />
      <LocalVisibilityExplained />
      <FAQ />
      <DualCTA />
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
  return <LandingPage />
}
