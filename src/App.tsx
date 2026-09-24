import { useState, useEffect, useRef } from 'react'
import { getLang, setLang, dateLocale, type Lang } from './i18n'

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
        fill="#2600FF" fontFamily="Satoshi, 'RAG Cyrillic Sans', Inter, sans-serif">{label}</text>
    </g>
  )
}

// Star rating badge chip
function RatingBadge({ x, y, rating, source = 'G' }: { x: number; y: number; rating: string; source?: string }) {
  return (
    <g>
      <rect x={x} y={y} width="46" height="18" rx="9" fill="white" stroke="#e5e7eb" strokeWidth="1" />
      <text x={x + 7} y={y + 12} fontSize="8" fontWeight="700" fill={source === 'G' ? '#4285F4' : '#00b67a'}
        fontFamily="Satoshi, 'RAG Cyrillic Sans', Inter, sans-serif">{source}</text>
      <text x={x + 16} y={y + 12} fontSize="7.5" fontWeight="600" fill="#f59e0b" fontFamily="Satoshi, 'RAG Cyrillic Sans', Inter, sans-serif">★</text>
      <text x={x + 24} y={y + 12} fontSize="7.5" fontWeight="700" fill="#030712" fontFamily="Satoshi, 'RAG Cyrillic Sans', Inter, sans-serif">{rating}</text>
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
          <text x={c.cx} y={c.cy + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#374151" fontFamily="Satoshi, 'RAG Cyrillic Sans', Inter, sans-serif">{c.label}</text>
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
      <text x={112} y={72.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fontFamily="Satoshi, 'RAG Cyrillic Sans', Inter, sans-serif">RAG</text>
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
        label: d.toLocaleDateString(dateLocale(), { weekday: 'short', day: 'numeric', month: 'short' }),
        date: d.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' }),
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
// Dieselben vier Leistungen wie auf /services und der Startseite.
const serviceOptions = () => modules.map(m => m.label)

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
              {serviceOptions().map(s => <option key={s} value={s}>{s}</option>)}
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
// PREISE (25.09.2026) — Die Website ist ein eigenes Produkt: drei Pakete pro Monat.
// Social-Media-Betreuung ist das Add-on: zu jedem Paket dazu — oder ganz allein.
// Das Google-Unternehmensprofil (149 € einmalig) bleibt als separater Einstieg.
// Quelle: Produktkatalog «RAG · Каталог продуктов» vom 24.09.2026.
// ─────────────────────────────────────────────────────────────────────────────
type PackageId = 'onepager' | 'local' | 'aiplus'
type PackageOrder = { pkg: PackageId | null; social: boolean }

const PROFILE_PRICE = '149 €'

const WEBSITE_PACKAGES: { id: PackageId; tag: string; name: string; price: number; thesis: string; includes: string[] }[] = [
  {
    id: 'onepager', tag: 'Einstieg', name: 'One Pager', price: 30,
    thesis: 'Ein professioneller Auftritt im Netz — schnell und günstig.',
    includes: ['Website auf einer Seite', 'Leistungen und Kontakt klar aufgebaut', 'Optimiert für das Smartphone', 'Hosting und technische Betreuung'],
  },
  {
    id: 'local', tag: 'Standard', name: 'Local Website', price: 299,
    thesis: 'Ihre Website bringt Anfragen aus Ihrer Stadt und Region.',
    includes: ['Mehrseitige lokale Website', 'Seiten für Leistungen und Orte', 'Google-Unternehmensprofil', 'Lokales SEO (Grundlagen)', 'Regelmäßige Updates und Betreuung'],
  },
  {
    id: 'aiplus', tag: 'Premium', name: 'AI Plus', price: 499,
    thesis: 'Maximale Sichtbarkeit — bei Google, in Karten, Verzeichnissen und der KI-Suche.',
    includes: ['Alles aus Local Website', 'Erweiterte Optimierung des Google-Profils', 'Verzeichnisse und einheitliche Unternehmensdaten', 'Inhalte für Google und die KI-Suche', 'Monitoring und Empfehlungen'],
  },
]

const SOCIAL_ADDON = {
  name: 'Social-Media-Betreuung', price: 199,
  thesis: 'Regelmäßig präsent in sozialen Netzwerken — ohne selbst planen und posten zu müssen.',
  includes: ['Redaktionsplan', 'Vorbereitung der Beiträge', 'Regelmäßiges Posten', 'Themen passend zu Ihren Leistungen und Ihrer Region'],
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
}

const orderInput: React.CSSProperties = { width: '100%', padding: '11px 13px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box', color: 'var(--ink)', backgroundColor: '#fff' }

function OrderShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEscape(onClose)
  return (
    <div onClick={onClose} className="order-overlay"
      style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(7,7,12,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="order-title" onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#fff', color: 'var(--ink)', borderRadius: 24, boxShadow: '0 40px 90px rgba(7,7,12,0.35)', maxWidth: 540, width: '100%', padding: 'clamp(22px, 4vw, 34px)', position: 'relative', margin: 'auto' }}>
        <button onClick={onClose} aria-label="Schließen" style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#5c5c5c', lineHeight: 1, padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
        </button>
        {children}
      </div>
    </div>
  )
}

function OrderRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5 }}>
      <span>{label}</span>
      <strong style={{ whiteSpace: 'nowrap' }}>{value} <span style={{ fontWeight: 500, color: 'var(--muted)' }}>{unit}</span></strong>
    </div>
  )
}

function OrderDone({ name, contact, summary, onClose }: { name: string; contact: string; summary: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#EEEBFF', color: '#2600FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 700 }}>✓</div>
      <h2 id="order-title" style={{ fontWeight: 700, fontSize: 21, margin: '0 0 10px' }}>Danke, {name.trim()}!</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 16px' }}>
        Wir melden uns unter <strong style={{ color: 'var(--ink)' }}>{contact}</strong> und besprechen alles Weitere mit Ihnen.
      </p>
      <div style={{ textAlign: 'left', marginBottom: 18 }}>{summary}</div>
      <button type="button" onClick={onClose} style={{ padding: '10px 26px', borderRadius: 999, border: '1px solid rgba(7,7,12,0.15)', backgroundColor: '#fff', fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Schließen</button>
    </div>
  )
}

function SendButton({ enabled, onSend, label = 'Anfrage senden' }: { enabled: boolean; onSend: () => void; label?: string }) {
  return (
    <>
      <button type="button" disabled={!enabled} onClick={() => enabled && onSend()}
        style={{ width: '100%', marginTop: 16, padding: '13px 20px', borderRadius: 999, border: 'none', backgroundColor: enabled ? '#2600FF' : '#e5e7eb', color: enabled ? '#fff' : '#9ca3af', fontWeight: 600, fontSize: 14.5, cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit' }}>
        {label}
      </button>
      <p style={{ fontSize: 11.5, color: '#9ca3af', lineHeight: 1.6, margin: '10px 0 0' }}>
        Die Anfrage ist noch keine Bestellung. Wir klären alles persönlich mit Ihnen, bevor Kosten entstehen.
      </p>
    </>
  )
}

// Google-Unternehmensprofil — einmalige Einrichtung, ohne Website-Kopplung.
function ProfileOrderModal({ onClose, initialSocial = false }: { onClose: () => void; initialSocial?: boolean }) {
  const [social, setSocial] = useState(initialSocial)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [done, setDone] = useState(false)
  const canSend = name.trim() !== '' && contact.trim() !== ''
  const summary = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, backgroundColor: '#F7F6FF', border: '1px solid #E4DFFF', borderRadius: 14, padding: '12px 16px' }}>
      <OrderRow label="Google-Unternehmensprofil" value={PROFILE_PRICE} unit="einmalig" />
      {social && <OrderRow label={SOCIAL_ADDON.name} value={`${SOCIAL_ADDON.price} €`} unit="pro Monat" />}
    </div>
  )
  return (
    <OrderShell onClose={onClose}>
      {!done ? (
        <>
          <p className="eyebrow" style={{ fontSize: 9.5, color: 'var(--electric)', marginBottom: 10 }}>Einmalige Einrichtung</p>
          <h2 id="order-title" style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', margin: '0 0 6px', paddingRight: 28 }}>Google-Unternehmensprofil einrichten</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 18px' }}>
            <strong style={{ color: 'var(--ink)' }}>{PROFILE_PRICE} einmalig</strong> — wir erstellen oder optimieren Ihr Profil. Hinterlassen Sie Ihre Kontaktdaten, wir melden uns zur Abstimmung.
          </p>
          <input style={orderInput} value={name} onChange={e => setName(e.target.value)} placeholder="Ihr Name" autoComplete="name" />
          <input style={orderInput} value={company} onChange={e => setCompany(e.target.value)} placeholder="Name Ihres Unternehmens" autoComplete="organization" />
          <input style={{ ...orderInput, marginBottom: 16 }} value={contact} onChange={e => setContact(e.target.value)} placeholder="Telefon oder E-Mail" autoComplete="email" />
          <p className="eyebrow" style={{ fontSize: 9.5, color: 'rgba(7,7,12,0.45)', marginBottom: 8 }}>Optional dazu · monatlich</p>
          <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '11px 14px', borderRadius: 14, marginBottom: 14, border: `1px solid ${social ? '#2600FF' : 'rgba(7,7,12,0.12)'}`, backgroundColor: social ? '#F4F2FF' : '#fff', transition: 'all 0.2s ease' }}>
            <input type="checkbox" checked={social} onChange={() => setSocial(!social)} style={{ width: 18, height: 18, marginTop: 1, accentColor: '#2600FF', flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 14.5 }}>{SOCIAL_ADDON.name}</span>
                <span style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: 'nowrap' }}>{SOCIAL_ADDON.price} € <span style={{ fontWeight: 500, fontSize: 12.5, color: 'var(--muted)' }}>pro Monat</span></span>
              </span>
              <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)', marginTop: 3 }}>{SOCIAL_ADDON.thesis}</span>
            </span>
          </label>
          {summary}
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--muted)', margin: '12px 0 0' }}>
            Tipp: In den Website-Paketen Local Website und AI Plus ist das Google-Profil bereits enthalten.{' '}
            <a href={'/preise'} onClick={onClose} className="ul" style={{ color: 'var(--electric)', fontWeight: 600 }}>Pakete ansehen →</a>
          </p>
          <SendButton enabled={canSend} onSend={() => setDone(true)} />
        </>
      ) : <OrderDone name={name} contact={contact} summary={summary} onClose={onClose} />}
    </OrderShell>
  )
}

// Website-Paket und/oder Social Media. Ein Paket (oder keins) + Social Media als Häkchen.
function PackageOrderModal({ initial, onClose }: { initial: PackageOrder; onClose: () => void }) {
  const [pkg, setPkg] = useState<PackageId | null>(initial.pkg)
  const [social, setSocial] = useState(initial.social)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [done, setDone] = useState(false)
  const chosen = WEBSITE_PACKAGES.find(p => p.id === pkg)
  const total = (chosen?.price ?? 0) + (social ? SOCIAL_ADDON.price : 0)
  const canSend = name.trim() !== '' && contact.trim() !== '' && total > 0

  const option = (on: boolean, onToggle: () => void, title: string, price: number, note: string, type: 'radio' | 'checkbox') => (
    <label key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '11px 14px', borderRadius: 14, border: `1px solid ${on ? '#2600FF' : 'rgba(7,7,12,0.12)'}`, backgroundColor: on ? '#F4F2FF' : '#fff', transition: 'all 0.2s ease' }}>
      <input type={type} name={type === 'radio' ? 'rag-package' : undefined} checked={on} onChange={onToggle} onClick={type === 'radio' && on ? onToggle : undefined}
        style={{ width: 18, height: 18, marginTop: 1, accentColor: '#2600FF', flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</span>
          <span style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: 'nowrap' }}>{price} € <span style={{ fontWeight: 500, fontSize: 12.5, color: 'var(--muted)' }}>pro Monat</span></span>
        </span>
        <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)', marginTop: 3 }}>{note}</span>
      </span>
    </label>
  )

  const summary = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, backgroundColor: '#F7F6FF', border: '1px solid #E4DFFF', borderRadius: 14, padding: '12px 16px' }}>
      {chosen && <OrderRow label={chosen.name} value={`${chosen.price} €`} unit="pro Monat" />}
      {social && <OrderRow label={SOCIAL_ADDON.name} value={`${SOCIAL_ADDON.price} €`} unit="pro Monat" />}
      {total === 0
        ? <span style={{ fontSize: 13, color: 'var(--muted)' }}>Wählen Sie ein Paket oder Social Media.</span>
        : (chosen && social) && <div style={{ borderTop: '1px solid #E4DFFF', paddingTop: 6 }}><OrderRow label="Gesamt" value={`${total} €`} unit="pro Monat" /></div>}
    </div>
  )

  return (
    <OrderShell onClose={onClose}>
      {!done ? (
        <>
          <p className="eyebrow" style={{ fontSize: 9.5, color: 'var(--electric)', marginBottom: 10 }}>Monatliches Paket</p>
          <h2 id="order-title" style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', margin: '0 0 6px', paddingRight: 28 }}>Paket anfragen</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
            Wählen Sie eine Website — Social Media können Sie dazu nehmen oder allein buchen.
          </p>

          <p className="eyebrow" style={{ fontSize: 9.5, color: 'rgba(7,7,12,0.45)', marginBottom: 8 }}>Website</p>
          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
            {WEBSITE_PACKAGES.map(p => option(pkg === p.id, () => setPkg(pkg === p.id ? null : p.id), p.name, p.price, p.thesis, 'radio'))}
          </div>
          <p className="eyebrow" style={{ fontSize: 9.5, color: 'rgba(7,7,12,0.45)', marginBottom: 8 }}>{pkg ? 'Dazu' : 'Oder allein'}</p>
          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {option(social, () => setSocial(!social), SOCIAL_ADDON.name, SOCIAL_ADDON.price, SOCIAL_ADDON.thesis, 'checkbox')}
          </div>

          <input style={orderInput} value={name} onChange={e => setName(e.target.value)} placeholder="Ihr Name" autoComplete="name" />
          <input style={orderInput} value={company} onChange={e => setCompany(e.target.value)} placeholder="Name Ihres Unternehmens" autoComplete="organization" />
          <input style={{ ...orderInput, marginBottom: 16 }} value={contact} onChange={e => setContact(e.target.value)} placeholder="Telefon oder E-Mail" autoComplete="email" />

          {summary}
          <SendButton enabled={canSend} onSend={() => setDone(true)} />
        </>
      ) : <OrderDone name={name} contact={contact} summary={summary} onClose={onClose} />}
    </OrderShell>
  )
}

// Google-Profil als eigenes Einmal-Paket in der Preisliste.
const PROFILE_PACKAGE = {
  tag: 'Einmalig', name: 'Google-Profil schlüsselfertig', price: 149,
  thesis: 'Ihr Google-Unternehmensprofil — fertig eingerichtet, ohne Abo.',
  includes: ['Erstellung oder Einrichtung des Profils', 'Auswahl der Hauptkategorie', 'Unternehmensbeschreibung und Leistungen', 'Kontaktdaten, Öffnungszeiten, Verbindung zur Website', 'Link und Vorlage für die ersten Bewertungen'],
}

// Kontur-Nummer wie in den Kanalblöcken der Startseite (01 KI-Suche … 04 Social Media).
function OutlineNum({ n, dark = false, size = 'clamp(40px, 4vw, 56px)' }: { n: number | string; dark?: boolean; size?: string }) {
  return (
    <span className="display" style={{ fontSize: size, lineHeight: 0.9, color: 'transparent', WebkitTextStroke: `1.4px ${dark ? '#6B4BFF' : '#2600FF'}` }}>
      {typeof n === 'number' ? String(n).padStart(2, '0') : n}
    </span>
  )
}

function PriceTag({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <span className="eyebrow" style={{ fontSize: 9.5, padding: '5px 10px', borderRadius: 999, backgroundColor: dark ? 'rgba(107,75,255,0.22)' : '#EEEBFF', color: dark ? '#fff' : 'var(--electric)' }}>{children}</span>
}

// Preisliste für die Seite /preise: oben das Google-Profil (einmalig) über die volle Breite,
// darunter drei Website-Pakete (monatlich), dann Social Media als Add-on (auch einzeln).
function Pricing() {
  const [order, setOrder] = useState<PackageOrder | null>(null)
  const [profile, setProfile] = useState(false)
  const [profileSocial, setProfileSocial] = useState(false)
  return (
    <>
      {order && <PackageOrderModal initial={order} onClose={() => setOrder(null)} />}
      {profile && <ProfileOrderModal initialSocial={profileSocial} onClose={() => setProfile(false)} />}
      <style>{`@media (max-width: 900px) { .price-addon, .price-profile { grid-template-columns: 1fr !important; } }
@media (max-width: 560px) { .price-profile-list { grid-template-columns: 1fr !important; } }`}</style>
      <section id="pakete" style={{ backgroundColor: 'var(--bone)', padding: 'clamp(56px, 6vw, 88px) clamp(20px, 4vw, 48px)' }}>
        <div style={{ ...SHELL }}>

          {/* 01 — Google-Profil schlüsselfertig, volle Breite */}
          <Reveal>
            <article className="price-profile" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)', gap: 'clamp(24px, 4vw, 64px)', alignItems: 'center', padding: 'clamp(24px, 3.2vw, 44px)', borderRadius: 24, backgroundColor: '#fff', border: '1px solid var(--line)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 1.6vw, 20px)', marginBottom: 20 }}>
                  <OutlineNum n={1} />
                  <PriceTag>{PROFILE_PACKAGE.tag}</PriceTag>
                </div>
                <h2 className="display" style={{ fontSize: 'clamp(24px, 2.4vw, 34px)', lineHeight: 1.15, margin: '0 0 12px' }}>{PROFILE_PACKAGE.name}</h2>
                <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 18px', maxWidth: 440 }}>{PROFILE_PACKAGE.thesis}</p>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '9px 14px', borderRadius: 999, marginBottom: 22, border: `1px solid ${profileSocial ? '#2600FF' : 'rgba(7,7,12,0.14)'}`, backgroundColor: profileSocial ? '#F4F2FF' : '#fff', fontSize: 14, transition: 'all 0.2s ease' }}>
                  <input type="checkbox" checked={profileSocial} onChange={() => setProfileSocial(!profileSocial)} style={{ width: 17, height: 17, margin: 0, accentColor: '#2600FF' }} />
                  <span>+ {SOCIAL_ADDON.name}</span>
                  <strong style={{ whiteSpace: 'nowrap' }}>{SOCIAL_ADDON.price} €/Monat</strong>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px 22px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
                    <span className="display" style={{ fontSize: 'clamp(36px, 3.4vw, 46px)', lineHeight: 1 }}>{PROFILE_PACKAGE.price} €</span>
                    <span style={{ fontSize: 14, color: 'var(--muted)' }}>einmalig</span>
                  </span>
                  <button type="button" onClick={() => setProfile(true)} className="btn btn-md btn-electric">Paket anfragen <span className="arw">→</span></button>
                </div>
              </div>
              <div className="price-profile-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 'clamp(16px, 2vw, 32px)' }}>
                {PROFILE_PACKAGE.includes.map(it => (
                  <div key={it} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                    {checkIcon()}<span style={{ fontSize: 14.5, lineHeight: 1.5 }}>{it}</span>
                  </div>
                ))}
              </div>
            </article>
          </Reveal>

          {/* 02–04 — Website-Pakete */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 'clamp(12px, 1.4vw, 18px)', marginTop: 'clamp(12px, 1.4vw, 18px)' }}>
            {WEBSITE_PACKAGES.map((p, i) => {
              const dark = p.id === 'aiplus'
              return (
                <Reveal key={p.id} delay={0.06 * i}>
                  <article style={{ height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', padding: 'clamp(22px, 2.4vw, 32px)', borderRadius: 24, backgroundColor: dark ? 'var(--ink)' : '#fff', color: dark ? '#fff' : 'var(--ink)', border: dark ? 'none' : '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <OutlineNum n={i + 2} dark={dark} />
                      <PriceTag dark={dark}>{p.tag}</PriceTag>
                    </div>
                    <h2 className="display" style={{ fontSize: 'clamp(21px, 1.9vw, 27px)', lineHeight: 1.15, margin: '0 0 10px' }}>{p.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
                      <span className="display" style={{ fontSize: 'clamp(34px, 3.2vw, 44px)', lineHeight: 1 }}>{p.price} €</span>
                      <span style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,0.55)' : 'var(--muted)' }}>/ Monat</span>
                    </div>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: dark ? 'rgba(255,255,255,0.7)' : 'var(--muted)', margin: '0 0 18px' }}>{p.thesis}</p>
                    <div style={{ marginBottom: 22 }}>
                      {p.includes.map(it => (
                        <div key={it} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 0', borderTop: `1px solid ${dark ? 'var(--line-dark)' : 'var(--line)'}` }}>
                          {checkIcon(dark)}<span style={{ fontSize: 14, lineHeight: 1.5 }}>{it}</span>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setOrder({ pkg: p.id, social: false })} className={`btn btn-md ${dark ? 'btn-electric' : 'btn-ink'}`} style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                      Paket anfragen <span className="arw">→</span>
                    </button>
                  </article>
                </Reveal>
              )
            })}
          </div>

          {/* + — Social Media, Add-on oder einzeln */}
          <Reveal delay={0.1}>
            <div className="price-addon" style={{ marginTop: 'clamp(12px, 1.4vw, 18px)', display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr) auto', gap: 'clamp(20px, 3vw, 48px)', alignItems: 'center', padding: 'clamp(24px, 2.4vw, 32px)', borderRadius: 24, backgroundColor: '#fff', border: '1px dashed rgba(38,0,255,0.35)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 1.6vw, 20px)', marginBottom: 16 }}>
                  <OutlineNum n="+" />
                  <PriceTag>Add-on · auch einzeln</PriceTag>
                </div>
                <h2 className="display" style={{ fontSize: 'clamp(20px, 1.8vw, 25px)', lineHeight: 1.2, margin: '0 0 8px' }}>{SOCIAL_ADDON.name}</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="display" style={{ fontSize: 30, lineHeight: 1 }}>{SOCIAL_ADDON.price} €</span>
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>/ Monat</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--muted)', margin: '0 0 12px' }}>{SOCIAL_ADDON.thesis} Zu jedem Website-Paket dazu — oder ganz ohne Website.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SOCIAL_ADDON.includes.map(it => (
                    <span key={it} style={{ fontSize: 12.5, padding: '6px 11px', borderRadius: 999, backgroundColor: 'var(--bone)' }}>{it}</span>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setOrder({ pkg: null, social: true })} className="btn btn-md btn-outline-light" style={{ whiteSpace: 'nowrap' }}>
                Social Media anfragen <span className="arw">→</span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

function PreisePage() {
  usePageMeta(
    'Preise — Google-Profil, Website-Pakete und Social Media | RAG',
    'Google-Profil schlüsselfertig für 149 € einmalig. Websites als Monatspaket: One Pager 30 €, Local Website 299 €, AI Plus 499 €. Social-Media-Betreuung 199 € im Monat — dazu oder einzeln.',
  )
  return (
    <>
      <Nav />
      <main id="inhalt">
      <ContentHero
        crumbs={[{ label: 'Start', href: '/' }, { label: 'Preise' }]}
        kicker="PREISE"
        title={<>Klare Preise für Ihre <span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>lokale Sichtbarkeit</span></>}
        sub="Starten Sie mit dem Google-Profil, wählen Sie eine Website als Monatspaket — und nehmen Sie Social Media dazu oder einzeln."
      />
      <Pricing />
      <ContentCTA />
      </main>
      <Footer />
    </>
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
  // Small close delay: the pointer can cross the gap between the link and the panel
  // (or leave it for a moment) without the menu disappearing.
  const closeTimer = useRef<number | null>(null)
  const show = () => { if (closeTimer.current) window.clearTimeout(closeTimer.current); setOpen(true) }
  const hide = () => { if (closeTimer.current) window.clearTimeout(closeTimer.current); closeTimer.current = window.setTimeout(() => setOpen(false), 180) }
  useEffect(() => () => { if (closeTimer.current) window.clearTimeout(closeTimer.current) }, [])
  return (
    <div style={{ position: 'relative' }} onMouseEnter={show} onMouseLeave={hide}
      onFocus={show} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hide() }}>
      <a href="/services" className="ul" style={{ fontWeight: 500, fontSize: 14, color: fg, display: 'flex', alignItems: 'center', gap: 6 }}>
        Leistungen
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      {/* outer layer is a transparent hover bridge from the link down to the panel */}
      <div style={{
        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
        paddingTop: 18, zIndex: 60,
        pointerEvents: open ? 'auto' : 'none',
      }}>
      <div style={{
        transform: `translateY(${open ? '0px' : '-8px'})`,
        opacity: open ? 1 : 0,
        transition: `opacity 0.28s ease, transform 0.4s ${EASE}`,
        backgroundColor: '#07070C', borderRadius: 18, padding: 10, minWidth: 320,
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
    </div>
  )
}

// DE / RU switch — see src/i18n. Labels are language codes, never translated.
function LangSwitch({ fg, border }: { fg: string; border: string }) {
  const current = getLang()
  const opts: Lang[] = ['de', 'ru']
  return (
    <div role="group" aria-label="Sprache / Язык" data-no-translate
      style={{ display: 'inline-flex', border: `1px solid ${border}`, borderRadius: 999, padding: 2, gap: 2, transition: 'border-color 0.4s ease' }}>
      {opts.map(l => {
        const active = l === current
        return (
          <button key={l} type="button" lang={l} aria-pressed={active}
            onClick={() => { if (!active) setLang(l) }}
            style={{
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1,
              padding: '6px 9px', borderRadius: 999, border: 'none', cursor: active ? 'default' : 'pointer',
              backgroundColor: active ? 'var(--electric)' : 'transparent',
              color: active ? '#fff' : fg, opacity: active ? 1 : 0.7,
              transition: 'background-color 0.25s ease, color 0.4s ease, opacity 0.25s ease',
            }}>
            {l.toUpperCase()}
          </button>
        )
      })}
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

  // Open mobile menu is white, so the bar above it switches to the light look too.
  const light = solid || open
  const fg = light ? '#07070C' : '#ffffff'

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90,
      backgroundColor: solid ? 'rgba(255,255,255,0.82)' : open ? '#ffffff' : 'transparent',
      backdropFilter: solid ? 'saturate(180%) blur(18px)' : 'none',
      WebkitBackdropFilter: solid ? 'saturate(180%) blur(18px)' : 'none',
      borderBottom: `1px solid ${solid ? 'var(--line)' : 'transparent'}`,
      transition: 'background-color 0.5s ease, border-color 0.5s ease, backdrop-filter 0.5s ease',
    }}>
      <nav aria-label="Hauptnavigation" style={{ ...SHELL, padding: '0 clamp(20px, 4vw, 48px)', height: solid ? 66 : 82, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'height 0.5s ' + EASE }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 21, color: fg, letterSpacing: '-0.05em', textDecoration: 'none', transition: 'color 0.4s ease' }}>
          RAG<span style={{ color: 'var(--electric)' }}>.</span>
        </a>

        <div className="hidden-mobile nav-links" style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
          <a href={homeHref('kanaele')} className="ul" style={{ fontWeight: 500, fontSize: 14, color: fg, transition: 'color 0.4s ease' }}>Sichtbarkeit</a>
          <ServicesNavDropdown fg={fg} />
          {/* FAQ removed from the header; 'Ergebnisse' hidden while the results block is off: ['Ergebnisse', 'results'], ['FAQ', 'faq'] */}
          {[['Preise', '/preise'], ['Ratgeber', '/ratgeber']].map(([l, target]) => (
            <a key={l} href={linkHref(target)} className="ul" style={{ fontWeight: 500, fontSize: 14, color: fg, transition: 'color 0.4s ease' }}>{l}</a>
          ))}
          <LangSwitch fg={fg} border={solid ? 'var(--line)' : 'rgba(255,255,255,0.25)'} />
          <span className="nav-phone" style={{ width: 1, height: 18, backgroundColor: solid ? 'var(--line)' : 'rgba(255,255,255,0.2)' }} />
          <a href="tel:+493012345678" className="ul nav-phone" style={{ fontWeight: 500, fontSize: 14, color: fg, opacity: 0.75, transition: 'color 0.4s ease' }}>+49 30 12345678</a>
          <a href={homeHref('audit-quiz')} className={`btn btn-md ${solid ? 'btn-ink' : 'btn-paper'}`} style={{ whiteSpace: 'nowrap' }}>
            Sichtbarkeits-Check starten
            <span className="arw">→</span>
          </a>
        </div>

        <div className="show-mobile" style={{ display: 'none', alignItems: 'center', gap: 12 }}>
        <LangSwitch fg={fg} border={light ? 'var(--line)' : 'rgba(255,255,255,0.25)'} />
        <button aria-label="Menü" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => setOpen(v => !v)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={open ? '#07070C' : fg} strokeWidth="1.8" strokeLinecap="round">
            {open ? <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></> : <><path d="M3 7h18" /><path d="M3 12h18" /><path d="M3 17h18" /></>}
          </svg>
        </button>
        </div>
      </nav>

      {open && (
        <nav aria-label="Mobile Navigation" className="show-mobile" style={{ display: 'none', flexDirection: 'column', gap: 2, padding: '10px 24px 26px', backgroundColor: '#fff', borderTop: '1px solid var(--line)' }}>
          {/* FAQ removed from the header; 'Ergebnisse' hidden while the results block is off: ['Ergebnisse', 'results'], ['FAQ', 'faq'] */}
          {[['Sichtbarkeit', 'kanaele'], ['Leistungen', '/services'], ['Preise', '/preise'], ['Ratgeber', '/ratgeber'], ['Glossar', '/glossar']].map(([l, target]) => (
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
    <div className="floaty" style={{ position: 'relative', width: '100%', maxWidth: 370 }}>
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
          {/* zentriert, ohne Animation rechts (21.09) */}
          <div className="hero-center" style={{ textAlign: 'center', maxWidth: 900, margin: '0 auto', paddingBottom: 'clamp(56px, 7vw, 96px)' }}>
            <div className="mask-line" style={{ marginBottom: 26 }}>
              <span style={{ ['--d' as any]: '0s' }}>
                {/* Bewertungsplakette wie in der Kundenvorlage: Google-Logo · 5,0 · Sterne · bei Google (21.09) */}
                <span role="img" aria-label="Bewertung 5,0 von 5 Sternen bei Google" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, border: '1px solid rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: '8px 22px 8px 8px' }}>
                  <span aria-hidden style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><GLogo /></span>
                  <span aria-hidden className="display" style={{ fontSize: 22, color: '#fff', lineHeight: 1 }}>5,0</span>
                  <span aria-hidden style={{ display: 'inline-flex', gap: 2 }}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <svg key={i} width="17" height="17" viewBox="0 0 24 24"><path fill="#fff" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                    ))}
                  </span>
                  <span aria-hidden style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>bei Google</span>
                </span>
              </span>
            </div>

            <h1 className="display" style={{ fontSize: 'clamp(40px, 5.8vw, 86px)', marginBottom: 28 }}>
              <span className="mask-line"><span style={{ ['--d' as any]: '0.08s' }}>Werden Sie zur</span></span>
              <span className="mask-line"><span style={{ ['--d' as any]: '0.16s' }}><span style={{ color: 'var(--electric-2)' }}>ersten Wahl</span></span></span>
              <span className="mask-line"><span style={{ ['--d' as any]: '0.24s' }}>in Ihrer Region.</span></span>
            </h1>

            <div className="mask-line" style={{ marginBottom: 34 }}>
              <span style={{ ['--d' as any]: '0.42s' }}>
                <p className="lead" style={{ color: 'rgba(255,255,255,0.62)', maxWidth: 640, margin: '0 auto' }}>
                  Kunden rufen den Betrieb an, den sie zuerst finden — nicht unbedingt den besten. Wir verbinden Google-Profil, Website, Bewertungen und KI-Suche zu einem System aus einer Hand, damit diese Anrufe bei Ihnen landen statt bei der Konkurrenz.
                </p>
              </span>
            </div>

            <div className="mask-line">
              <span style={{ ['--d' as any]: '0.5s' }}>
                <span style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <a href="#audit-quiz" className="btn btn-lg btn-paper">Kostenlosen Sichtbarkeits-Check starten <span className="arw">→</span></a>
                  <a href="#maps" className="btn btn-lg btn-outline-dark">Google-Profil · 149 € einmalig</a>
                </span>
              </span>
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
// HOMEPAGE STORY (21.09.2026, Struktur nach Kundenvorlage, unser Design):
// Hero (zentriert) → Kanäle (4 Karten) → 01 KI-Suche → 02 Google Maps →
// 03 Google Search → 04 Social Media → Zusammenspiel → Unternehmen finden → FAQ.
// Jeder Kanalblock endet mit dem passenden Ratgeber-Artikel.
// ─────────────────────────────────────────────────────────────────────────────

const channels = [
  { id: 'ki', label: 'KI-Suche', text: 'ChatGPT, Perplexity und andere KI-Dienste empfehlen lokale Unternehmen immer öfter direkt in der Antwort.' },
  { id: 'maps', label: 'Google Maps', text: 'Einer der gewohntesten Wege, ein Unternehmen in der Nähe zu finden, Bewertungen zu lesen und sofort Kontakt aufzunehmen.' },
  { id: 'search', label: 'Google Search', text: 'Hier entscheidet die Website: Versteht Google Ihre Leistungen, Ihre Region und Ihre Erfahrung?' },
  { id: 'social', label: 'Social Media', text: 'Hier lernen Kunden ein Unternehmen über Menschen, echte Arbeiten und lebendige Inhalte kennen.' },
]

// 1 — Die Suche hat sich verändert: vier Kanäle, jede Karte springt zu ihrem Block.
function ChannelOverview() {
  return (
    <section id="kanaele" style={{ backgroundColor: 'var(--paper)', padding: 'var(--sec-y) clamp(20px, 4vw, 48px)', scrollMarginTop: 90 }}>
      <div style={{ ...SHELL }}>
        <Reveal><Kicker>Die Suche hat sich verändert</Kicker></Reveal>
        <div className="chan-head" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 'clamp(24px, 4vw, 72px)', alignItems: 'end', marginTop: 26 }}>
          <MaskHeading
            className="h-lg"
            lines={[<>Ihre Kunden suchen Sie</>, <>nicht mehr <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>an einem Ort.</span></>]}
          />
          <Reveal delay={0.1}>
            <p className="lead" style={{ color: 'var(--muted)', maxWidth: 520, margin: 0 }}>
              Heute suchen sie bei Google Maps, Google, ChatGPT, Perplexity und in sozialen Netzwerken. Wir machen Ihr Unternehmen überall dort sichtbar — gleichzeitig.
            </p>
          </Reveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'clamp(12px, 1.4vw, 18px)', marginTop: 'clamp(36px, 4vw, 56px)' }}>
          {channels.map((c, i) => (
            <Reveal key={c.id} delay={0.06 * i}>
              <a href={`#${c.id}`} className="chan-card">
                <span className="chan-num display">{String(i + 1).padStart(2, '0')}</span>
                <span className="display" style={{ fontSize: 'clamp(20px, 1.7vw, 24px)', lineHeight: 1.2, color: 'var(--ink)' }}>{c.label}</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', flex: 1 }}>{c.text}</span>
                <span className="chan-more">Mehr erfahren <span aria-hidden className="chan-arrow">↓</span></span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Rahmen eines Kanalblocks: Kontur-Nummer wie früher im Ablauf, Titel, Text,
// rechts der Inhalt, unten der passende Ratgeber-Artikel.
function ChannelBlock({ id, n, label, title, body, actions, aside, article, tone = 'light', stacked = false, reverse = false }: {
  id: string; n: number; label: string; title: React.ReactNode; body: string
  actions: React.ReactNode; aside: React.ReactNode
  article?: { href: string; title: string }; tone?: 'light' | 'bone' | 'dark'
  stacked?: boolean // Inhalt unter dem Text statt daneben
  reverse?: boolean // Inhalt links, Text rechts (nur Desktop)
}) {
  const dark = tone === 'dark'
  const bg = dark ? 'var(--ink)' : tone === 'bone' ? 'var(--bone)' : 'var(--paper)'
  return (
    <section id={id} style={{ backgroundColor: bg, color: dark ? '#fff' : 'var(--ink)', padding: 'clamp(56px, 6vw, 88px) clamp(20px, 4vw, 48px)', scrollMarginTop: 70, position: 'relative', overflow: 'clip' }}>
      {dark && <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><CrossBackdrop tone="dark" /></div>}
      <div style={{ ...SHELL, position: 'relative' }}>
        <div className={`chan-grid${reverse ? ' chan-rev' : ''}`} style={{ display: 'grid', gridTemplateColumns: stacked ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: stacked ? 'clamp(36px, 4vw, 56px)' : 'clamp(32px, 5vw, 88px)', alignItems: 'center' }}>
          <div style={reverse ? { order: 2 } : undefined}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 2vw, 24px)', marginBottom: 22 }}>
                <span className="display" style={{ fontSize: 'clamp(44px, 5vw, 72px)', lineHeight: 0.9, color: 'transparent', WebkitTextStroke: `1.4px ${dark ? '#6B4BFF' : '#2600FF'}` }}>{String(n).padStart(2, '0')}</span>
                <span className="eyebrow" style={{ color: dark ? 'var(--electric-2)' : 'var(--electric)' }}>{label}</span>
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="display h-md" style={{ margin: '0 0 18px', maxWidth: stacked ? 'none' : 560 }}>{title}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p style={{ fontSize: 'clamp(15.5px, 1.3vw, 17px)', lineHeight: 1.75, color: dark ? 'rgba(255,255,255,0.62)' : 'var(--muted)', margin: '0 0 28px', maxWidth: stacked ? 'none' : 520 }}>{body}</p>
            </Reveal>
            <Reveal delay={0.14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px 24px', flexWrap: 'wrap' }}>
                {actions}
                {/* passender Ratgeber-Artikel direkt neben dem Button (21.09) */}
                {article && <a href={article.href} className="ul chan-article" style={{ fontSize: 14, fontWeight: 600, color: dark ? '#fff' : 'var(--ink)' }}>
                  {article.title} <span aria-hidden className="chan-arrow" style={{ color: dark ? 'var(--electric-2)' : 'var(--electric)' }}>→</span>
                </a>}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1}>{aside}</Reveal>
        </div>

      </div>
    </section>
  )
}

const checkIcon = (dark = false) => (
  <span aria-hidden style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', display: 'inline-grid', placeItems: 'center', backgroundColor: dark ? 'rgba(107,75,255,0.22)' : '#EEEBFF', color: dark ? '#fff' : 'var(--electric)', fontSize: 11, fontWeight: 700 }}>✓</span>
)

function articleTitle(slug: string) {
  return ratgeberArticles.find(a => a.slug === slug)?.title ?? 'Ratgeber'
}

// 01 — KI-Suche
function ChannelAI() {
  const signals = ['Was Sie anbieten', 'Wo Sie tätig sind', 'Was Kunden über Sie sagen', 'Ob Ihre Angaben auf Website, Karten, Verzeichnissen und Social Media übereinstimmen']
  return (
    <ChannelBlock
      id="ki" n={1} label="KI-Suche"
      title={<>Lokale Suche beginnt immer öfter mit einer <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>Frage an die KI.</span></>}
      body="ChatGPT, Perplexity und die KI-Übersichten bei Google nennen nur wenige Anbieter — und zwar die, die sie eindeutig verstehen und für vertrauenswürdig halten."
      actions={<>
        <a href="#audit-quiz" className="btn btn-md btn-electric">Prüfen, wie die KI mich sieht <span className="arw">→</span></a>
      </>}
      aside={
        <div style={{ backgroundColor: 'var(--ink)', color: '#fff', borderRadius: 24, padding: 'clamp(24px, 3vw, 36px)' }}>
          <p className="eyebrow" style={{ fontSize: 10, color: 'var(--electric-2)', marginBottom: 14 }}>Sichtbarkeit in der KI ist ein System</p>
          <p className="display" style={{ fontSize: 'clamp(19px, 1.7vw, 23px)', lineHeight: 1.3, margin: '0 0 22px' }}>Die KI muss schnell verstehen, was Sie tun, wo Sie arbeiten und ob man Ihnen vertrauen kann.</p>
          {signals.map(s => (
            <div key={s} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderTop: '1px solid var(--line-dark)' }}>
              {checkIcon(true)}<span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>{s}</span>
            </div>
          ))}
        </div>
      }
      article={{ href: '/ratgeber/in-chatgpt-und-perplexity-gefunden-werden', title: articleTitle('in-chatgpt-und-perplexity-gefunden-werden') }}
    />
  )
}

// 02 — Google Maps: hier sitzt das Einstiegsangebot (149 € einmalig).
function ChannelMaps() {
  const [order, setOrder] = useState(false)
  const included = [
    'Erstellung oder Einrichtung des Profils',
    'Auswahl der Hauptkategorie',
    'Unternehmensbeschreibung und Leistungen',
    'Kontaktdaten, Öffnungszeiten, Verbindung zur Website',
    'Link und Vorlage für die ersten Bewertungen',
  ]
  return (
    <>
      {order && <ProfileOrderModal onClose={() => setOrder(false)} />}
      <ChannelBlock
        id="maps" n={2} label="Google Maps" tone="dark"
        title={<>Google Maps ist <span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>Pflicht</span> für lokale Unternehmen.</>}
        body="Menschen suchen in der Nähe, lesen Bewertungen und rufen direkt an. Für ein lokales Unternehmen ist das einer der kürzesten Wege von der Suche zur Anfrage."
        actions={<>
          <a href="/services/google-maps-business-profile" className="btn btn-md btn-outline-dark">Mehr zu Google Maps <span className="arw">→</span></a>
        </>}
        stacked
        aside={
          <div className="chan-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: 'clamp(24px, 4vw, 64px)', alignItems: 'center', backgroundColor: '#fff', color: 'var(--ink)', borderRadius: 24, padding: 'clamp(24px, 3.4vw, 48px)', boxShadow: '0 40px 90px rgba(0,0,0,0.35)' }}>
            <div>
              <p className="eyebrow" style={{ fontSize: 10, color: 'var(--electric)', marginBottom: 12 }}>Selbst machen — oder wir übernehmen das</p>
              <p className="display" style={{ fontSize: 'clamp(24px, 2.4vw, 34px)', lineHeight: 1.15, margin: '0 0 12px' }}>Google-Profil, fertig eingerichtet.</p>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: '0 0 24px', maxWidth: 440 }}>Wir erstellen oder überarbeiten Ihr Profil, pflegen Leistungen und Angaben ein und bereiten alles für die ersten Bewertungen vor.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px 20px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setOrder(true)} className="btn btn-md btn-electric">Google-Profil starten <span className="arw">→</span></button>
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
                  <span className="display" style={{ fontSize: 26 }}>149 €</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>einmalig · ohne Abo</span>
                </span>
              </div>
            </div>
            <div>
              {included.map((s, i) => (
                <div key={s} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                  {checkIcon()}<span style={{ fontSize: 14.5, lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        }
        article={{ href: '/ratgeber/google-maps-ranking-verbessern', title: articleTitle('google-maps-ranking-verbessern') }}
      />
    </>
  )
}

// 03 — Google Search: die Website.
function ChannelSearch() {
  const [order, setOrder] = useState<null | PackageOrder>(null)
  return (
    <>
      {order && <PackageOrderModal initial={order} onClose={() => setOrder(null)} />}
      <ChannelBlock
        id="search" n={3} label="Google Search" tone="bone"
        title={<>Google Search schaut auf <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>Ihre Website.</span></>}
        body="Ihre Website muss in einfachen Worten erklären, was Sie tun, wo Sie arbeiten und warum man Ihnen vertrauen kann — für Menschen und für Google."
        actions={<>
          <a href="/services/website-google-search" className="btn btn-md btn-ink">Mehr zu Website & Google Search <span className="arw">→</span></a>
        </>}
        reverse
        aside={
          // Suchergebnis-Mockup statt Liste: 03 soll sich optisch von 01 (dunkle Checkliste)
          // und 04 (nummerierte Zeilen) unterscheiden (25.09).
          <div style={{ position: 'relative' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 24, boxShadow: '0 30px 70px rgba(7,7,12,0.10)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'clamp(16px, 2vw, 22px) clamp(18px, 2.4vw, 28px)', borderBottom: '1px solid var(--line)' }}>
                <GLogo />
                <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(7,7,12,0.12)', fontSize: 14.5, color: 'var(--ink)' }}>
                  Elektriker in Siegen
                  <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2600FF" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                </span>
              </div>

              <div style={{ padding: 'clamp(18px, 2.4vw, 28px)' }}>
                <div style={{ position: 'relative', padding: '18px 18px 16px', borderRadius: 18, backgroundColor: '#F4F2FF', border: '1px solid #DCD5FF' }}>
                  <span className="eyebrow" style={{ position: 'absolute', top: -10, right: 16, fontSize: 9, padding: '4px 9px', borderRadius: 999, backgroundColor: 'var(--electric)', color: '#fff' }}>Ihr Unternehmen</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span aria-hidden style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'var(--ink)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>M</span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.3, color: 'var(--muted)' }}>
                      <span style={{ display: 'block', color: 'var(--ink)', fontWeight: 600 }}>Muster Elektrotechnik</span>
                      muster-elektro.de › leistungen
                    </span>
                  </div>
                  <p style={{ fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.3, color: '#1A0DAB', margin: '0 0 6px', fontWeight: 500 }}>Elektriker in Siegen — Installation, Smart Home & Notdienst</p>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--muted)', margin: '0 0 14px' }}>Was wir tun, wo wir arbeiten und welche Projekte wir in der Region umgesetzt haben — klar erklärt.</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Leistungen', 'Region', 'Referenzen', 'Kontakt'].map(t => (
                      <span key={t} style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 12px', borderRadius: 999, backgroundColor: '#fff', border: '1px solid #DCD5FF', color: 'var(--electric)' }}>{t}</span>
                    ))}
                  </div>
                </div>

                {[0.62, 0.48].map((w, i) => (
                  <div key={i} aria-hidden style={{ padding: '16px 4px 0', opacity: 0.55 - i * 0.2 }}>
                    <div style={{ width: '38%', height: 8, borderRadius: 4, backgroundColor: 'rgba(7,7,12,0.10)', marginBottom: 8 }} />
                    <div style={{ width: `${w * 100}%`, height: 11, borderRadius: 5, backgroundColor: 'rgba(26,13,171,0.18)', marginBottom: 8 }} />
                    <div style={{ width: '88%', height: 7, borderRadius: 4, backgroundColor: 'rgba(7,7,12,0.07)' }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px 16px', flexWrap: 'wrap', fontSize: 14, lineHeight: 1.6 }}>
              <span>
                Noch keine Website? Wir starten mit einem One Pager —{' '}
                <button type="button" onClick={() => setOrder({ pkg: 'onepager', social: false })} className="ul" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontWeight: 600, color: 'var(--electric)', cursor: 'pointer' }}>ab 30 €/Monat →</button>
              </span>
              <a href={'/preise'} className="ul" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Alle Website-Pakete ansehen <span aria-hidden style={{ color: 'var(--electric)' }}>→</span></a>
            </div>
          </div>
        }
        article={{ href: '/ratgeber/wie-funktioniert-lokales-seo', title: articleTitle('wie-funktioniert-lokales-seo') }}
      />
    </>
  )
}

// 04 — Social Media
function ChannelSocial() {
  const [order, setOrder] = useState(false)
  const pillars = [
    ['Menschen', 'Zeigen Sie sich und Ihr Team. So bekommt das Unternehmen ein Gesicht.'],
    ['Arbeitsweise', 'Zeigen Sie, wie Sie arbeiten — ohne Inszenierung und Marketing-Floskeln.'],
    ['Ergebnisse', 'Echte Arbeiten, Projekte und Kunden erklären Qualität besser als jedes Werbeversprechen.'],
  ]
  return (
    <>
    {order && <PackageOrderModal initial={{ pkg: null, social: true }} onClose={() => setOrder(false)} />}
    <ChannelBlock
      id="social" n={4} label="Social Media"
      title={<>In sozialen Netzwerken sehen Kunden <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>Menschen.</span></>}
      body="Team, Arbeitsweise und echte Ergebnisse machen Ihr Unternehmen vertraut — schon vor dem ersten Anruf. Dafür müssen Sie kein Influencer werden."
      actions={<>
        <a href="/services/social-media" className="btn btn-md btn-ink">Mehr zu Social Media <span className="arw">→</span></a>
      </>}
      aside={
        <div>
          {pillars.map(([t, d], i) => (
            <div key={t} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr)', gap: 16, padding: '18px 0', borderTop: '1px solid var(--line)' }}>
              <span className="display" style={{ fontSize: 13, color: 'var(--electric)', letterSpacing: '0.08em', paddingTop: 4 }}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="display" style={{ fontSize: 'clamp(18px, 1.6vw, 22px)', margin: '0 0 6px' }}>{t}</p>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)', margin: 0 }}>{d}</p>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '16px 18px', borderRadius: 16, backgroundColor: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px 18px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, lineHeight: 1.55 }}>
              <strong>Auch einzeln buchbar</strong> — ohne Website-Paket.<br />
              <span style={{ color: 'var(--muted)' }}>Social-Media-Betreuung · {SOCIAL_ADDON.price} €/Monat</span>
            </span>
            <button type="button" onClick={() => setOrder(true)} className="btn btn-md btn-ink">Social Media anfragen <span className="arw">→</span></button>
          </div>
        </div>
      }
    />
    </>
  )
}

// Zusammenspiel — alle Kanäle erzählen dieselbe Geschichte.
// Überschrift zentriert, darunter vier Karten im Stil der Kanal-Übersicht (21.09).
function ChannelSummary() {
  const rows = [
    ['KI-Suche', 'Damit man Sie empfehlen kann.'],
    ['Google Maps', 'Damit man Sie in der Nähe findet.'],
    ['Google Search', 'Damit Google Ihre Leistungen versteht.'],
    ['Social Media', 'Damit Kunden die Menschen dahinter sehen.'],
  ]
  return (
    <section style={{ backgroundColor: 'var(--paper)', padding: 'var(--sec-y) clamp(20px, 4vw, 48px)', borderTop: '1px solid var(--line)' }}>
      <div style={{ ...SHELL }}>
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span style={{ width: 28, height: 1, backgroundColor: 'var(--electric)' }} />
              <p className="eyebrow" style={{ color: 'var(--ink)', opacity: 0.55 }}>Das Zusammenspiel</p>
              <span style={{ width: 28, height: 1, backgroundColor: 'var(--electric)' }} />
            </div>
          </Reveal>
          <MaskHeading
            className="h-md"
            style={{ marginTop: 22 }}
            lines={[<>Alle Kanäle sollten eine</>, <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>klare Geschichte</span></>, <>über Ihr Unternehmen erzählen.</>]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 'clamp(12px, 1.4vw, 18px)', marginTop: 'clamp(36px, 4vw, 56px)' }}>
          {rows.map(([a, b], i) => (
            <Reveal key={a} delay={0.06 * i}>
              <div style={{ height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12, padding: 'clamp(22px, 2.2vw, 30px)', borderRadius: 22, backgroundColor: 'var(--bone)' }}>
                <span className="chan-num display">{String(i + 1).padStart(2, '0')}</span>
                <span className="display" style={{ fontSize: 'clamp(20px, 1.7vw, 24px)', lineHeight: 1.2 }}>{a}</span>
                <span style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{b}</span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'clamp(32px, 3.5vw, 48px)' }}>
            <a href="/services" className="btn btn-lg btn-ink">Alle Leistungen ansehen <span className="arw">→</span></a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// Unternehmen finden — ersetzt das Quiz. Die Suche (Google Places) folgt später,
// Eingabe und Button haben vorerst keine Logik. Anker bleibt #audit-quiz,
// damit alle bestehenden Links auf der Website weiter funktionieren.
function BusinessCheck() {
  const [order, setOrder] = useState(false)
  const [query, setQuery] = useState('')
  const scores = [['Google Maps', 72], ['Google Search', 64], ['KI-Suche', 44], ['Social Media', 67]] as const
  return (
    <>
      {order && <ProfileOrderModal onClose={() => setOrder(false)} />}
      <section id="audit-quiz" style={{ backgroundColor: 'var(--electric)', color: '#fff', padding: 'var(--sec-y) clamp(20px, 4vw, 48px)', position: 'relative', overflow: 'hidden', scrollMarginTop: 70 }}>
        <ScanBackdrop />
        <div className="audit-grid" style={{ ...SHELL, position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 440px)', gap: 'clamp(36px, 5vw, 80px)', alignItems: 'center' }}>
          <div>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <span style={{ width: 28, height: 1, backgroundColor: 'rgba(255,255,255,0.6)' }} />
                <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Kostenloser Sichtbarkeits-Check</p>
              </div>
            </Reveal>
            <MaskHeading
              className="h-md"
              style={{ marginBottom: 20, color: '#fff' }}
              lines={[<>Finden Sie Ihr Unternehmen —</>, <><span className="serif italic-serif">wir zeigen, wie Google und KI Sie sehen.</span></>]}
            />
            <Reveal delay={0.1}>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.75)', margin: '0 0 28px', maxWidth: 520 }}>
                Starten Sie mit dem Namen oder der Adresse Ihres Unternehmens. Wir prüfen die wichtigsten Signale bei Google Maps, in der Google-Suche und in der KI-Suche und zeigen, wo schon alles stimmt und wo Potenzial liegt.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <form onSubmit={e => e.preventDefault()} className="bc-form" style={{ display: 'flex', gap: 8, maxWidth: 560, backgroundColor: '#fff', borderRadius: 999, padding: 6 }}>
                <label htmlFor="bc-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Unternehmen in Google finden</label>
                <input id="bc-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Unternehmen in Google finden" autoComplete="organization"
                  style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)', padding: '0 18px' }} />
                <button type="submit" className="btn btn-md btn-ink" style={{ flexShrink: 0 }}>Mein Unternehmen finden</button>
              </form>
            </Reveal>
            <Reveal delay={0.22}>
              <div style={{ marginTop: 30, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '12px 20px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: 0, maxWidth: 340 }}>Ihr Unternehmen ist noch nicht bei Google? Wir erstellen Ihr Google-Profil.</p>
                <button type="button" onClick={() => setOrder(true)} className="btn btn-md btn-paper">Google-Profil · 149 € einmalig <span className="arw">→</span></button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div style={{ backgroundColor: '#fff', color: 'var(--ink)', borderRadius: 26, padding: 'clamp(24px, 3vw, 34px)', boxShadow: '0 40px 80px rgba(7,7,12,0.28)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
                <div>
                  <p className="eyebrow" style={{ fontSize: 9.5, color: 'var(--electric)', marginBottom: 8 }}>Beispielbericht</p>
                  <p className="display" style={{ fontSize: 19, lineHeight: 1.3, margin: 0 }}>Lokale Sichtbarkeit</p>
                </div>
                <span className="display" style={{ fontSize: 46, lineHeight: 1, color: 'var(--electric)' }}>62</span>
              </div>
              {scores.map(([l, v]) => (
                <div key={l} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>{l}</span><span style={{ color: 'var(--muted)' }}>{v}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: '#EEEBFF' }}>
                    <div style={{ width: `${v}%`, height: '100%', borderRadius: 3, backgroundColor: 'var(--electric)' }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--muted)', margin: '14px 0 0' }}>Die Zahlen sind nur ein Beispiel für den späteren Bericht.</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

// ── Frühere Startseiten-Blöcke (bis 21.09) — nicht mehr eingebunden, bleiben als Vorlage ──
// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE STORY (Sept 2026): Hero → der Markt hat sich verändert → woraus lokale
// Sichtbarkeit besteht (je Bereich: was sich verändert hat + was wir tun)
// → zwei Wege → Ablauf → Ergebnisse → Ratgeber → FAQ → Check.
// ─────────────────────────────────────────────────────────────────────────────

// 1 — Der Markt hat sich verändert
function MarketShift() {
  const journey = ['Google Maps', 'Bewertungen', 'Website', 'KI-Antwort', 'Auswahl', 'Anruf']
  return (
    <section id="markt" style={{ backgroundColor: 'var(--paper)', padding: 'var(--sec-y) clamp(20px, 4vw, 48px)' }}>
      <div style={{ ...SHELL }}>
        <Reveal><Kicker>Der Markt hat sich verändert</Kicker></Reveal>

        <div style={{ marginTop: 28, maxWidth: 1000 }}>
          <MaskHeading
            className="h-lg"
            lines={[<>Ihre Kunden suchen nicht</>, <>mehr <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>nur bei Google.</span></>]}
          />
          <Reveal delay={0.1}>
            <p className="lead" style={{ color: 'var(--muted)', maxWidth: 620, margin: '22px 0 0' }}>
              Heute suchen sie bei Google Maps, Google, ChatGPT, Perplexity und in sozialen Netzwerken. Wir machen Ihr Unternehmen überall dort sichtbar — gleichzeitig.
            </p>
          </Reveal>
        </div>

        {/* früher / heute */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(16px, 2vw, 24px)', marginTop: 'clamp(44px, 5vw, 72px)' }}>
          <Reveal>
            <div style={{ height: '100%', border: '1px solid var(--line)', borderRadius: 22, padding: 'clamp(26px, 3vw, 40px)' }}>
              <p className="eyebrow" style={{ color: 'rgba(7,7,12,0.4)', marginBottom: 18 }}>Früher</p>
              <p className="h-sm display" style={{ margin: '0 0 14px', color: 'rgba(7,7,12,0.45)' }}>Suchen, Links vergleichen, anrufen.</p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', margin: 0 }}>
                Wer einen Handwerker oder eine Praxis suchte, tippte ein paar Wörter bei Google ein, öffnete zwei, drei Websites aus den ersten Ergebnissen — und rief an. Wer weit oben stand, bekam den Anruf.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div style={{ height: '100%', backgroundColor: 'var(--ink)', color: '#fff', borderRadius: 22, padding: 'clamp(26px, 3vw, 40px)' }}>
              <p className="eyebrow" style={{ color: 'var(--electric-2)', marginBottom: 18 }}>Heute</p>
              <p className="h-sm display" style={{ margin: '0 0 14px' }}>Die KI prüft Unternehmen — der Kunde wählt.</p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.62)', margin: '0 0 24px' }}>
                Auf die Anfrage eines Kunden antwortet immer öfter direkt eine KI — mit zwei, drei Namen statt einer Linkliste. Welche Unternehmen darauf stehen, entscheidet die KI anhand dessen, was sie findet: Google-Maps-Eintrag, Bewertungen, Website und Erwähnungen. Der Kunde wählt dann nur noch aus dieser kurzen Liste.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                {journey.map((j, i) => (
                  <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 12.5, fontWeight: 600, borderRadius: 999, padding: '6px 12px',
                      border: i === journey.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.18)',
                      backgroundColor: i === journey.length - 1 ? 'var(--electric)' : 'transparent',
                      color: '#fff',
                    }}>{j}</span>
                    {i < journey.length - 1 && <span aria-hidden style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// 2 — Woraus lokale Sichtbarkeit besteht: je Bereich die Veränderung und unsere Antwort, Google Maps im Zentrum.
type PromoArea = {
  id: string
  label: string
  claim: string
  body: string
  items: string[]
  change?: string // what changed for customers in this area (pre-AI search vs. today)
  links: { href: string; label: string }[]
  accelerator?: boolean
}

const mapsArea: PromoArea = {
  id: 'leistung-maps',
  label: 'Google Maps & Google Business Profil',
  claim: 'Dort sichtbar sein, wo lokale Entscheidungen fallen.',
  body: 'Ein vollständiges und professionell gepflegtes Google-Unternehmensprofil hilft Kunden und Google zu verstehen, was Sie anbieten, wo Sie tätig sind und warum Ihr Unternehmen relevant ist.',
  items: [
    'Kategorie und Leistungen',
    'Unternehmensbeschreibung',
    'Region und Servicegebiet',
    'Fotos und Videos',
    'Öffnungszeiten und Kontaktdaten',
    'Verbindung zur Website',
    'Gewinnung und Beantwortung von Bewertungen',
    'Regelmäßige Aktualisierung des Profils',
  ],
  change: 'Bei lokalen Suchen zeigt Google zuerst eine Karte mit drei Unternehmen — dort fällt oft schon die Entscheidung.',
  links: [{ href: '/services/google-maps-business-profile', label: 'Mehr zu Google Maps' }],
}

const promoAreas: PromoArea[] = [
  {
    id: 'leistung-ki',
    label: 'ChatGPT, Perplexity & KI-Suche',
    claim: 'Auch KI-Systeme müssen Ihr Unternehmen finden und verstehen können.',
    body: 'Immer mehr Menschen stellen ihre Fragen direkt an KI-Systeme. Dafür braucht Ihr Unternehmen klare, zugängliche und glaubwürdige Informationen im Web — keine geheime Zusatz-Optimierung.',
    items: ['Inhalte für Suchsysteme abrufbar', 'Leistungen konkret beschrieben', 'Übereinstimmende Angaben auf allen Plattformen', 'Logische Seitenstruktur', 'Externe Erwähnungen und Bestätigungen'],
    change: 'ChatGPT, Perplexity und die KI-Übersichten bei Google fassen zusammen und nennen nur wenige Anbieter.',
    links: [{ href: '/services/ai-search-optimization', label: 'Mehr erfahren' }],
  },
  {
    id: 'leistung-bewertungen',
    label: 'Bewertungen & Reputation',
    claim: 'Vertrauen entsteht, bevor der erste Kontakt stattfindet.',
    body: 'Bewertungen beeinflussen, ob ein Kunde anruft oder sich für einen Mitbewerber entscheidet. Unser Ziel: mehr echte Bewertungen mit konkreten Erfahrungen.',
    items: ['Wann und wie Sie um Bewertungen bitten', 'Ein kurzer Weg zur Abgabe', 'Antworten auf Lob und Kritik', 'Bewertungen auf Google, Trustpilot und der Website', 'Laufende Beobachtung Ihrer Reputation'],
    change: 'Kunden vergleichen Sterne, Aktualität und die Antworten des Inhabers — bei Unternehmen, die sie noch nie erlebt haben.',
    links: [{ href: '/services/google-maps-business-profile', label: 'Mehr erfahren' }],
  },
  {
    id: 'leistung-website',
    label: 'Website & Google Search',
    claim: 'Ihre Website ist die Wissensbasis Ihres Unternehmens.',
    body: 'Eine gute Website sieht nicht nur gut aus. Sie erklärt Menschen, Suchmaschinen und KI-Systemen, wer Sie sind, welche Leistungen Sie anbieten und warum man Ihnen vertrauen kann.',
    items: ['Seiten für jede Leistung', 'Regionen und Servicegebiete', 'Unternehmen, Team und Referenzen', 'Ratgeber-Artikel und Glossar', 'Interne Verlinkung', 'Technische SEO-Struktur und Markup'],
    change: 'Google und KI-Systeme lesen dort nach, was Sie anbieten, wo Sie arbeiten und warum man Ihnen vertrauen kann.',
    links: [{ href: '/services/website-google-search', label: 'Mehr erfahren' }],
  },
  {
    id: 'leistung-verzeichnisse',
    label: 'Lokale Verzeichnisse & Erwähnungen',
    claim: 'Einheitliche Informationen schaffen Klarheit.',
    body: 'Name, Adresse, Telefon, Website, Leistungen und Beschreibung stimmen auf den wichtigen lokalen Plattformen und Branchenportalen überein — so entsteht ein widerspruchsfreies Bild Ihres Unternehmens.',
    items: ['Bestehende Einträge erfassen', 'Falsche und doppelte Einträge bereinigen', 'Fehlende Portale gezielt ergänzen', 'Angaben regelmäßig kontrollieren'],
    change: 'Name, Adresse und Telefonnummer werden zwischen Google, Website und Verzeichnissen verglichen. Widersprüche kosten Vertrauen.',
    links: [{ href: '/services/ai-search-optimization', label: 'Mehr erfahren' }],
  },
  {
    id: 'leistung-social',
    label: 'Social Media',
    claim: 'Sie müssen kein Influencer werden.',
    body: 'Für ein lokales Unternehmen reichen oft wenige, gut geplante Inhalte: wer hinter dem Unternehmen steht, wie gearbeitet wird und welche Ergebnisse Kunden erwarten können.',
    items: ['Das Team zeigen', 'Arbeitsweise und Ergebnisse sichtbar machen', 'Einheitlicher Auftritt', 'Aktivität und Echtheit belegen'],
    change: 'Viele Kunden werfen kurz einen Blick auf Instagram oder Facebook, um zu sehen, ob das Unternehmen aktiv ist und wer dahintersteht.',
    links: [{ href: '/services/social-media', label: 'Mehr erfahren' }],
  },
  {
    id: 'leistung-anzeigen',
    label: 'Anzeigen: Google, Meta & offline',
    claim: 'Sichtbarkeit gezielt beschleunigen.',
    body: 'Organische Sichtbarkeit braucht Zeit. Mit lokalen Kampagnen erreichen wir relevante Kunden früher und sehen nebenbei, welche Suchanfragen und Leistungen wirklich Anfragen bringen.',
    items: ['Lokale Google-Ads- und Maps-Kampagnen', 'Meta-Anzeigen für Ihre Region', 'Plakate, Banner und Print — wo es passt', 'Messung über Anrufe und Anfragen'],
    links: [
      { href: '/services/google-meta-ads', label: 'Online-Anzeigen' },
      { href: '/services/offline-advertising', label: 'Offline-Werbung' },
    ],
    accelerator: true,
  },
]

function PromoAreaRow({ area: a, n }: { area: PromoArea; n: number }) {
  const [open, setOpen] = useState(false)
  const panelId = `${a.id}-details`
  return (
    <article id={a.id} className={`promo-row${open ? ' is-open' : ''}`} style={{ borderBottom: '1px solid var(--line)', scrollMarginTop: 90 }}>
      <button
        type="button"
        className="promo-row-head"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(o => !o)}
      >
        <span className="display promo-row-num">{String(n).padStart(2, '0')}</span>
        <span className="promo-row-title">
          <span className="display" style={{ fontSize: 'clamp(19px, 1.8vw, 24px)', lineHeight: 1.2, color: 'var(--ink)' }}>{a.label}</span>
          {a.accelerator && <span className="eyebrow" style={{ display: 'block', fontSize: 9.5, color: 'var(--electric)', marginTop: 8 }}>Beschleuniger</span>}
        </span>
        <span className="promo-row-change">{a.change ?? a.body}</span>
        <span className="promo-row-toggle">
          <span className="promo-row-more">{open ? 'Weniger' : 'Was wir tun'}</span>
          <span className="promo-row-icon" aria-hidden>+</span>
        </span>
      </button>
      <div id={panelId} className="promo-row-panel" role="region" aria-hidden={!open}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div className="promo-row-body">
            <div>
              <p className="eyebrow" style={{ fontSize: 9.5, color: 'var(--electric)', marginBottom: 8 }}>Was wir tun</p>
              <p style={{ fontSize: 16, lineHeight: 1.5, fontWeight: 600, color: 'var(--ink)', margin: '0 0 10px' }}>{a.claim}</p>
              {a.accelerator && (
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 6px' }}>
                  Organische Sichtbarkeit schafft die Grundlage — Anzeigen beschleunigen sie.
                </p>
              )}
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 16 }}>
                {a.links.map(l => (
                  <a key={l.href} href={l.href} tabIndex={open ? 0 : -1} className="ul" style={{ fontSize: 13, fontWeight: 600, color: 'var(--electric)', width: 'fit-content' }}>{l.label} →</a>
                ))}
              </div>
            </div>
            <ul className="promo-row-items">
              {a.items.map(it => (
                <li key={it}>
                  <span aria-hidden style={{ color: 'var(--electric)', fontWeight: 700 }}>·</span>{it}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  )
}

function LocalPromotion() {
  const summary = [
    ['Ihre Website', 'erklärt Ihre Leistungen.'],
    ['Google Maps', 'zeigt Ihre lokale Präsenz.'],
    ['Bewertungen', 'schaffen Vertrauen.'],
    ['Soziale Netzwerke', 'zeigen die Menschen hinter dem Unternehmen.'],
    ['Suchmaschinen und KI-Systeme', 'verbinden diese Informationen.'],
  ]
  return (
    <section id="modules" style={{ backgroundColor: 'var(--paper)', padding: '0 clamp(20px, 4vw, 48px) var(--sec-y)', scrollMarginTop: 90 }}>
      <div style={{ ...SHELL }}>
        <Reveal><Kicker>Die neue Realität</Kicker></Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(24px, 4vw, 72px)', alignItems: 'end', marginTop: 26, marginBottom: 'clamp(40px, 5vw, 64px)' }}>
          <MaskHeading
            className="h-lg"
            lines={[<>Woraus lokale</>, <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>Sichtbarkeit heute besteht</span></>]}
          />
          <Reveal delay={0.1}>
            <div>
              <p style={{ fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.6, fontWeight: 500, color: 'var(--ink)', margin: 0, maxWidth: 540 }}>
                Lokale Sichtbarkeit ist kein einzelner Kanal und kein Trick. Sie entsteht, wenn Google-Profil, Website, Bewertungen und Erwähnungen dasselbe klare Bild Ihres Unternehmens zeigen.
              </p>
            </div>
          </Reveal>
        </div>

        {/* centerpiece — Google Maps */}
        <Reveal>
          <article id={mapsArea.id} style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--ink)', color: '#fff', borderRadius: 28, padding: 'clamp(28px, 4vw, 60px)', scrollMarginTop: 90 }}>
            <div className="maps-grid" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'clamp(28px, 5vw, 80px)', alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', backgroundColor: 'var(--electric)', borderRadius: 999, padding: '6px 12px', textTransform: 'uppercase' }}>01 · Zentraler Kanal</span>
                </div>
                <h3 className="display" style={{ fontSize: 'clamp(30px, 3.8vw, 54px)', lineHeight: 1.02, margin: '0 0 18px' }}>{mapsArea.label}</h3>
                <p className="serif italic-serif" style={{ fontSize: 'clamp(22px, 2.2vw, 30px)', lineHeight: 1.2, color: 'var(--electric-2)', margin: '0 0 18px' }}>{mapsArea.claim}</p>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.6)', margin: '0 0 30px', maxWidth: 480 }}>{mapsArea.body}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href={mapsArea.links[0].href} className="btn btn-md btn-paper">{mapsArea.links[0].label} <span className="arw">→</span></a>
                  <a href="#start" className="btn btn-md btn-outline-dark">Profil · 149 € einmalig</a>
                </div>
              </div>
              <div>
                <p className="eyebrow" style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>Was sich verändert hat</p>
                <p style={{ fontSize: 16, lineHeight: 1.65, color: '#fff', margin: '0 0 34px', paddingLeft: 16, borderLeft: '2px solid var(--electric-2)' }}>{mapsArea.change}</p>
                <p className="eyebrow" style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Was wir tun · Wir optimieren</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', columnGap: 24 }}>
                  {mapsArea.items.map((it, i) => (
                    <div key={it} style={{ display: 'flex', gap: 12, padding: '13px 0', borderTop: '1px solid var(--line-dark)' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--electric-2)', letterSpacing: '0.1em', paddingTop: 3 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </Reveal>

        {/* the other areas — collapsed rows, open for details */}
        <div style={{ marginTop: 'clamp(14px, 1.6vw, 20px)', borderTop: '1px solid var(--line)' }}>
          {promoAreas.map((a, i) => (
            <PromoAreaRow key={a.id} area={a} n={i + 2} />
          ))}
        </div>

        {/* how it adds up */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(28px, 4vw, 72px)', alignItems: 'start', marginTop: 'clamp(64px, 8vw, 110px)' }}>
          <div>
            <Reveal><Kicker>Das Zusammenspiel</Kicker></Reveal>
            <MaskHeading
              className="h-md"
              style={{ marginTop: 22 }}
              lines={[<>Aus einzelnen Kanälen</>, <>wird ein <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>klares Bild</span></>, <>Ihres Unternehmens.</>]}
            />
            <Reveal delay={0.12}>
              <a href="/services" className="btn btn-lg btn-ink" style={{ marginTop: 32 }}>
                Alle Leistungen ansehen <span className="arw">→</span>
              </a>
            </Reveal>
          </div>
          <div>
            {summary.map(([a, b], i) => (
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

// 7 — Ratgeber: kurz einordnen, dann in die drei Artikel verweisen.
function RatgeberTeaser() {
  return (
    <section id="ratgeber" style={{ backgroundColor: 'var(--paper)', padding: 'var(--sec-y) clamp(20px, 4vw, 48px)' }}>
      <div className="ratgeber-row" style={{ ...SHELL, display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 2.2fr)', gap: 'clamp(24px, 4vw, 64px)', alignItems: 'stretch' }}>
        <Reveal>
          <div>
            <Kicker>Ratgeber</Kicker>
            <p className="display" style={{ fontSize: 'clamp(20px, 1.9vw, 26px)', lineHeight: 1.2, margin: '18px 0 18px' }}>
              Was lokale Sichtbarkeit <span className="serif italic-serif" style={{ color: 'var(--electric)' }}>heute wirklich bedeutet</span>
            </p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <a href="/ratgeber" className="ul" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Zum Ratgeber →</a>
              <a href="/glossar" className="ul" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--electric)' }}>Glossar →</a>
            </div>
          </div>
        </Reveal>
        <div className="ratgeber-links" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'clamp(16px, 2vw, 32px)' }}>
          {ratgeberArticles.map((a, i) => (
            <Reveal key={a.slug} delay={Math.min(0.06 + i * 0.06, 0.24)} style={{ height: '100%' }}>
              <a href={`/ratgeber/${a.slug}`} className="ratgeber-link" style={{ height: '100%', display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'var(--ink)', borderTop: '2px solid var(--ink)', paddingTop: 18 }}>
                <span className="eyebrow" style={{ fontSize: 9.5, color: 'var(--electric)' }}>{String(i + 1).padStart(2, '0')} · {a.minutes} Min. Lesezeit</span>
                <span className="display" style={{ fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.25, margin: '12px 0 14px' }}>{a.title}</span>
                <span className="ratgeber-arrow" style={{ marginTop: 'auto', fontSize: 13, fontWeight: 600, color: 'var(--electric)' }}>Artikel lesen →</span>
              </a>
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
const allModules = [
  {
    Illust: IllustMapsProfile,
    label: 'Google Maps & Unternehmensprofil',
    slug: 'google-maps-business-profile',
    sentence: 'Gefunden werden, wo Menschen in der Nähe suchen.',
    what: 'Ihr Eintrag bei Google Maps und in der Google-Suche mit Kategorie, Leistungen, Öffnungszeiten, Fotos und Bewertungen.',
    how: 'Wir richten das Profil ein oder überarbeiten es, wählen die Hauptkategorie, beschreiben Ihre Leistungen und bereiten alles für die ersten Bewertungen vor.',
    why: 'Menschen suchen in der Nähe, lesen Bewertungen und rufen direkt an — einer der kürzesten Wege von der Suche zur Anfrage.',
  },
  {
    Illust: IllustWebsiteSearch,
    label: 'Website & Google Search',
    slug: 'website-google-search',
    sentence: 'Eine Website, die Menschen, Suchmaschinen und KI-Systeme klar verstehen.',
    what: 'Ihre Website erklärt Kunden, Google und KI-Systemen, was Sie tun, wo Sie arbeiten und warum man Ihnen vertrauen kann.',
    how: 'Vom One Pager bis zur mehrseitigen Website mit Seiten für jede Leistung und jeden Ort — mit sauberer Technik, strukturierten Daten und regelmäßigen Updates.',
    why: 'Google-Profil, Bewertungen und Social Media verweisen alle auf Ihre Website. Fehlen dort klare Antworten, springen Interessenten ab.',
  },
  {
    Illust: IllustAIOptimization,
    label: 'KI-Suche',
    slug: 'ai-search-optimization',
    sentence: 'Genannt werden, wenn Kunden ChatGPT, Perplexity oder Google fragen.',
    what: 'KI-Assistenten nennen nur wenige Anbieter — die, die sie eindeutig verstehen und für vertrauenswürdig halten.',
    how: 'Wir sorgen für klare Inhalte, strukturierte Daten und einheitliche Einträge in Verzeichnissen und prüfen regelmäßig, wie die KI Sie darstellt.',
    why: 'Immer mehr Menschen fragen zuerst eine KI. Wer in der Antwort fehlt, wird gar nicht erst verglichen.',
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
    label: 'Social Media',
    slug: 'social-media',
    sentence: 'Kunden sehen die Menschen hinter Ihrem Unternehmen.',
    what: 'Regelmäßige Beiträge auf Instagram und Facebook über Ihr Team, Ihre Arbeitsweise und echte Ergebnisse.',
    how: 'Wir planen die Themen, bereiten die Beiträge vor und veröffentlichen regelmäßig — passend zu Ihren Leistungen und Ihrer Region.',
    why: 'Viele Kunden sehen sich vor dem Anruf Ihr Profil an. Ein gepflegter Feed schafft Vertrauen, ein verwaistes wirft Fragen auf.',
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

// 25.09.2026: Leistungen = die vier Kanäle der Startseite, in derselben Reihenfolge.
// Bewertungen gehören zu Google Maps, Verzeichnisse zur KI-Suche; Anzeigen und
// Offline-Werbung werden nicht mehr angeboten. Die Daten bleiben für später erhalten.
const SERVICE_ORDER = ['ai-search-optimization', 'google-maps-business-profile', 'website-google-search', 'social-media']
const SERVICE_REDIRECTS: Record<string, string> = {
  'reviews': '/services/google-maps-business-profile',
  'local-citations': '/services/ai-search-optimization',
  'google-meta-ads': '/services',
  'offline-advertising': '/services',
}
const modules = SERVICE_ORDER.map(slug => allModules.find(m => m.slug === slug)!)

// Was jede Leistung kostet und welches Formular sie öffnet (Preise wie auf /preise).
const SERVICE_OFFER: Record<string, { price: string; note: string; order: 'profile' | PackageOrder }> = {
  'ai-search-optimization': { price: '499 €/Monat', note: 'Im Paket AI Plus', order: { pkg: 'aiplus', social: false } },
  'google-maps-business-profile': { price: '149 € einmalig', note: 'Google-Profil schlüsselfertig · auch in Local Website und AI Plus', order: 'profile' },
  'website-google-search': { price: 'ab 30 €/Monat', note: 'One Pager, Local Website oder AI Plus', order: { pkg: 'onepager', social: false } },
  'social-media': { price: '199 €/Monat', note: 'Zu jedem Paket dazu — oder einzeln', order: { pkg: null, social: true } },
}

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

function ServiceSelector() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pkgOrder, setPkgOrder] = useState<PackageOrder | null>(null)
  const [profileOrder, setProfileOrder] = useState(false)

  const open = (slug: string) => {
    const o = SERVICE_OFFER[slug]
    if (!o) return
    if (o.order === 'profile') setProfileOrder(true)
    else setPkgOrder(o.order)
  }

  return (
    <>
      {pkgOrder && <PackageOrderModal initial={pkgOrder} onClose={() => setPkgOrder(null)} />}
      {profileOrder && <ProfileOrderModal onClose={() => setProfileOrder(false)} />}
      <section id="auswahl" style={{ backgroundColor: 'var(--paper)', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)' }}>
        <div style={{ ...SHELL }}>
          <Reveal><Kicker>Leistungen & Pakete</Kicker></Reveal>
          <div className="sol-head" style={{ marginTop: 26, marginBottom: 'clamp(40px, 5vw, 64px)' }}>
            <MaskHeading
              className="h-lg"
              style={{ maxWidth: 1080 }}
              lines={[<>Vier Kanäle —</>, <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>ein System.</span></>]}
            />
            <Reveal delay={0.12}>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', margin: '26px 0 0', maxWidth: 600 }}>
                Zu jedem Kanal sehen Sie, in welchem Paket er steckt und was er kostet. Wählen Sie ein Paket — wir melden uns und klären alles, bevor Kosten entstehen.{' '}
                <a href="/preise" className="ul" style={{ color: 'var(--ink)', fontWeight: 600 }}>Alle Preise ansehen →</a>
              </p>
            </Reveal>
          </div>

          <div style={{ borderTop: '1px solid var(--line)' }}>
            {modules.map((m, i) => {
              const offer = SERVICE_OFFER[m.slug]
              const isOpen = expanded === m.slug
              return (
                <Reveal key={m.slug} delay={Math.min(i * 0.05, 0.2)}>
                  <div className="row" style={{ borderBottom: '1px solid var(--line)' }}>
                    <div className="svc-row" style={{ display: 'grid', gridTemplateColumns: '84px minmax(0, 1.1fr) minmax(0, 0.9fr) auto', alignItems: 'center', gap: 'clamp(14px, 2vw, 32px)', padding: 'clamp(24px, 2.6vw, 36px) 0' }}>
                      <OutlineNum n={i + 1} />
                      <div>
                        <h3 className="display" style={{ fontSize: 'clamp(20px, 2vw, 28px)', lineHeight: 1.15, margin: '0 0 8px' }}>{m.label}</h3>
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)', margin: 0 }}>{m.sentence}</p>
                      </div>
                      <div className="svc-price">
                        {offer && <>
                          <span className="display" style={{ display: 'block', fontSize: 'clamp(20px, 1.8vw, 24px)', lineHeight: 1.1 }}>{offer.price}</span>
                          <span style={{ display: 'block', fontSize: 13, lineHeight: 1.5, color: 'var(--muted)', marginTop: 4 }}>{offer.note}</span>
                        </>}
                      </div>
                      <div className="svc-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                        <button onClick={() => setExpanded(isOpen ? null : m.slug)} aria-label="Details"
                          style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: `transform 0.5s ${EASE}`, transform: isOpen ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" stroke="#07070C" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                        <button type="button" onClick={() => open(m.slug)} className="btn btn-md btn-ink" style={{ whiteSpace: 'nowrap' }}>
                          Paket wählen <span className="arw">→</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ overflow: 'hidden', maxHeight: isOpen ? 700 : 0, transition: `max-height 0.7s ${EASE}` }}>
                      <div className="mod-detail" style={{ display: 'grid', gridTemplateColumns: '84px minmax(0,260px) minmax(0,1fr)', gap: 'clamp(14px, 2vw, 32px)', padding: '4px 0 clamp(28px, 3vw, 40px)' }}>
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

          <Reveal delay={0.1}>
            <div className="notsure" style={{ marginTop: 'clamp(40px, 5vw, 64px)', backgroundColor: 'var(--ink)', color: '#fff', borderRadius: 24, padding: 'clamp(32px, 4vw, 52px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
              <CrossBackdrop tone="dark" />
              <div style={{ position: 'relative', maxWidth: 560 }}>
                <h3 className="display" style={{ fontSize: 'clamp(22px, 2.6vw, 34px)', marginBottom: 12 }}>Nicht sicher, wo Sie anfangen sollen?</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                  Fordern Sie den kostenlosen Sichtbarkeits-Check an. Wir sagen Ihnen genau, welche Bereiche Ihr Unternehmen zuerst braucht.
                </p>
              </div>
              <a href="/#audit-quiz" className="btn btn-lg btn-paper" style={{ position: 'relative', flexShrink: 0 }}>
                Sichtbarkeits-Check starten <span className="arw">→</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
      <style>{`@media (max-width: 900px) {
  .svc-row { grid-template-columns: 56px minmax(0, 1fr) !important; }
  .svc-price, .svc-actions { grid-column: 2 / -1; }
  .svc-actions { justify-content: flex-start !important; }
}`}</style>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS
// ─────────────────────────────────────────────────────────────────────────────
function TwoRoutes() {
  const [order, setOrder] = useState(false)
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
      {order && <ProfileOrderModal onClose={() => setOrder(false)} />}
      <section id="start" style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: 'var(--sec-y) clamp(20px, 4vw, 48px)', position: 'relative', overflow: 'clip' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.55 }}><CrossBackdrop tone="dark" /></div>
        <div style={{ ...SHELL, position: 'relative' }}>
          <Reveal><Kicker tone="light">Zwei Wege</Kicker></Reveal>
          <div style={{ marginTop: 20, marginBottom: 'clamp(28px, 3vw, 44px)', maxWidth: 900 }}>
            <MaskHeading
              className="h-md"
              lines={[<>Wo steht Ihr</>, <><span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>Unternehmen heute?</span></>]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(28px, 4vw, 64px)' }}>
            <Reveal>
              <div style={{ borderTop: '1px solid var(--line-dark)', paddingTop: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <span className="eyebrow" style={{ fontSize: 10, color: 'var(--electric-2)' }}>Variante 01</span>
                <h3 className="display" style={{ fontSize: 'clamp(20px, 1.8vw, 26px)', lineHeight: 1.2, margin: '12px 0 10px' }}>
                  Sie sind bereits online — werden aber nicht ausreichend gefunden?
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', margin: '0 0 16px' }}>
                  Wir analysieren kostenlos, wie Ihr Unternehmen aktuell bei Google Maps, in der Google-Suche und in der KI-Suche dargestellt wird.
                </p>
                <div style={{ marginBottom: 24 }}>
                  {routeA.map((r, i) => (
                    <div key={r} style={{ display: 'flex', gap: 14, padding: '7px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-dark)' }}>
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
              <div style={{ borderTop: '1px solid var(--line-dark)', paddingTop: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <span className="eyebrow" style={{ fontSize: 10, color: 'var(--electric-2)' }}>Variante 02</span>
                <h3 className="display" style={{ fontSize: 'clamp(20px, 1.8vw, 26px)', lineHeight: 1.2, margin: '12px 0 10px' }}>
                  Sie starten gerade? Beginnen Sie mit Google Maps.
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', margin: '0 0 16px' }}>
                  Wir erstellen und optimieren Ihr Google-Unternehmensprofil — die professionelle Grundlage für Ihre lokale Sichtbarkeit.
                </p>
                <div style={{ marginBottom: 20 }}>
                  {routeB.map((r, i) => (
                    <div key={r} style={{ display: 'flex', gap: 14, padding: '7px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-dark)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)' }}>{r}</span>
                    </div>
                  ))}
                </div>
                <div className="route-addons" style={{ display: 'flex', alignItems: 'center', gap: '8px 10px', flexWrap: 'wrap', margin: '-4px 0 20px' }}>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>Optional dazu:</span>
                  {WEBSITE_PACKAGES.map(w => (
                    <a key={w.id} href={'/preise'} className="route-addon"
                      style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 12px' }}>
                      {w.name} · {w.price} €/Monat
                    </a>
                  ))}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px 22px', flexWrap: 'wrap' }}>
                  <button onClick={() => setOrder(true)} className="btn btn-lg btn-electric">
                    Google-Profil starten <span className="arw">→</span>
                  </button>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
                    <span className="display" style={{ fontSize: 24, color: '#fff' }}>149 €</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>einmalig</span>
                  </span>
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
  { num: '01', title: 'Analysieren — wir prüfen Ihre aktuelle Sichtbarkeit', desc: 'Wir erfassen Ihr Google-Maps-Ranking, Ihre Website, Ihre KI-Suchpräsenz, Bewertungen und Verzeichniseinträge — und vergleichen sie mit Ihren wichtigsten lokalen Mitbewerbern.' },
  { num: '02', title: 'Priorisieren — Sie erhalten einen Plan, keine Verkaufsshow', desc: "Sie bekommen einen konkreten Plan: Was bringt jetzt den größten Effekt? Ein persönlicher Berater bespricht die Ergebnisse mit Ihnen, und Sie entscheiden, was aktiviert wird. Kein Paket, das Sie nicht brauchen." },
  { num: '03', title: 'Optimieren — wir bringen die Grundlagen in Ordnung', desc: 'Wir verbessern Google-Unternehmensprofil, Website, Inhalte, Bewertungen und die relevanten Plattformen. Unser Team übernimmt die Umsetzung, nichts landet wieder auf Ihrem Schreibtisch.' },
  { num: '04', title: 'Ausbauen — wir erweitern Ihre lokale Präsenz', desc: 'Wir veröffentlichen neue Inhalte, stärken Ihre Reputation und erweitern Ihre Sichtbarkeit Schritt für Schritt auf weitere Kanäle.' },
  { num: '05', title: 'Messen — Sie sehen, was die Arbeit bewirkt', desc: 'Wir beobachten Rankings, Anrufe, Anfragen, Website-Besuche und Bewertungen und berichten regelmäßig. Echte Zahlen statt Schönwetter-Kennzahlen.' },
]

function Process() {
  const { ref, p } = useScrollProgress()

  return (
    <section ref={ref} style={{ backgroundColor: 'var(--bone)', padding: 'var(--sec-y) clamp(20px, 4vw, 48px)' }}>
      <div style={{ ...SHELL }}>
        <Reveal><Kicker>Der Ablauf</Kicker></Reveal>
        <MaskHeading
          className="h-lg"
          style={{ marginTop: 26, marginBottom: 'clamp(36px, 4vw, 56px)', maxWidth: 900 }}
          lines={[<>So bauen wir Ihre</>, <><span className="serif italic-serif" style={{ color: 'var(--electric)' }}>lokale Sichtbarkeit</span> auf</>]}
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
                  display: 'grid', gridTemplateColumns: 'minmax(0, 0.5fr) minmax(0, 0.5fr)',
                  gap: 'clamp(20px, 3vw, 48px)', alignItems: 'center',
                  padding: 'clamp(22px, 2.4vw, 32px) 0',
                  borderTop: '1px solid var(--line)',
                  marginLeft: i % 2 === 1 ? 'clamp(0px, 4vw, 56px)' : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 2vw, 28px)' }}>
                    <div className="display" style={{ flex: '0 0 auto', minWidth: '1.25em', fontSize: 'clamp(44px, 5vw, 72px)', lineHeight: 0.9, color: 'transparent', WebkitTextStroke: '1.4px #2600FF' }}>{s.num}</div>
                    <h3 className="display" style={{ fontSize: 'clamp(18px, 1.7vw, 24px)', lineHeight: 1.2, margin: 0 }}>{s.title}</h3>
                  </div>
                  <div>
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: 0, maxWidth: 500 }}>{s.desc}</p>
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
    result: 'Top 3 bei Google Maps, dazu Empfehlungen in ChatGPT und Gemini.',
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
  // No autoplay: the case only changes when the visitor picks it, so nothing moves while reading.
  const [active, setActive] = useState(0)
  const total = caseStudies.length
  const touchX = useRef<number | null>(null)

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const d = e.changedTouches[0].clientX - touchX.current
    if (d > 50) setActive(a => (a - 1 + total) % total)
    else if (d < -50) setActive(a => (a + 1) % total)
    touchX.current = null
  }

  return (
    <section id="results" style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: 'var(--sec-y) clamp(20px, 4vw, 48px) clamp(110px, 11vw, 160px)', position: 'relative', overflow: 'hidden' }}>
      {/* growth graph lives in its own strip under the content, so its line never crosses text */}
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 'clamp(130px, 13vw, 190px)', pointerEvents: 'none' }}>
        <GrowthBackdrop />
      </div>

      <div style={{ ...SHELL, position: 'relative' }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        <Reveal><Kicker tone="light">Ergebnisse</Kicker></Reveal>

        <div className="res-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', marginTop: 26, marginBottom: 'clamp(40px, 5vw, 64px)' }}>
          <div>
            <MaskHeading className="h-lg" lines={[<>Echte Ergebnisse,</>, <><span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>echte Unternehmen</span></>]} />
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

        {/* all cases share one grid cell: the block keeps the height of the longest case and never jumps */}
        <div style={{ display: 'grid' }}>
          {caseStudies.map((c, i) => {
            const on = i === active
            return (
              <div key={c.name} className="res-body" aria-hidden={!on} style={{
                gridArea: '1 / 1',
                display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: 'clamp(32px, 5vw, 72px)', alignItems: 'start',
                opacity: on ? 1 : 0, visibility: on ? 'visible' : 'hidden',
                transition: 'opacity 0.45s ease, visibility 0.45s',
              }}>
                <div>
                  <p className="serif" style={{ fontSize: 'clamp(22px, 2.3vw, 32px)', lineHeight: 1.25, letterSpacing: '-0.01em', color: '#fff', margin: '0 0 20px', maxWidth: 560 }}>
                    {c.quote}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
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
                      <div key={row.label} className="res-row" style={{ display: 'grid', gridTemplateColumns: '132px minmax(0,1fr)', gap: 18, padding: '12px 0', borderTop: '1px solid var(--line-dark)' }}>
                        <span className="eyebrow" style={{ fontSize: 9.5, color: row.accent ? 'var(--electric-2)' : 'rgba(255,255,255,0.35)', paddingTop: 3 }}>{row.label}</span>
                        <span style={{ fontSize: 14.5, lineHeight: 1.7, color: row.accent ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: row.accent ? 600 : 400 }}>{row.value}</span>
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
            )
          })}
        </div>

        {/* progress dots — mobile only (desktop has the tabs above) */}
        <div className="res-dots" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
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
  // Three short steps: what exists → links → contact. A person reviews the links
  // afterwards and sends back concrete next steps.
  const [order, setOrder] = useState(false)
  const [step, setStep] = useState(1)
  const [presence, setPresence] = useState<string[]>([])
  const [link, setLink] = useState('')
  const [industry, setIndustry] = useState('')
  const [city, setCity] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const TOTAL = 3
  const DONE = TOTAL + 1
  const NONE = 'Noch nichts davon'
  const P_MAPS = 'Google-Unternehmensprofil'
  const P_SITE = 'Eigene Website'
  const P_SOCIAL = 'Social-Media-Profile'

  const next = () => setStep(s => Math.min(s + 1, DONE))
  const back = () => setStep(s => Math.max(s - 1, 1))
  const reset = () => { setStep(1); setPresence([]); setLink(''); setIndustry(''); setCity(''); setName(''); setCompany(''); setContact('') }
  const togglePresence = (v: string) => setPresence(p => {
    if (v === NONE) return p.includes(v) ? [] : [v]
    const without = p.filter(x => x !== NONE)
    return without.includes(v) ? without.filter(x => x !== v) : [...without, v]
  })
  const has = (v: string) => presence.includes(v)
  const canStep2 = industry.trim() !== '' && city.trim() !== ''

  const h3: React.CSSProperties = { fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '0 0 6px', lineHeight: 1.3 }
  const hint: React.CSSProperties = { fontSize: 13, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.6 }
  const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px' }
  const input: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1px solid rgba(7,7,12,0.14)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 12, color: 'var(--ink)', backgroundColor: '#fff' }
  const primary = (disabled: boolean): React.CSSProperties => ({ backgroundColor: disabled ? '#e5e7eb' : '#2600FF', color: disabled ? '#9ca3af' : '#fff', fontWeight: 600, fontSize: 14, padding: '13px 20px', borderRadius: 999, border: 'none', cursor: disabled ? 'default' : 'pointer', width: '100%', fontFamily: 'inherit', transition: 'background-color 0.2s' })

  const Option = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick} aria-pressed={selected}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', padding: '12px 16px', textAlign: 'left', backgroundColor: selected ? '#F4F2FF' : '#fff', border: `1px solid ${selected ? '#2600FF' : 'rgba(7,7,12,0.12)'}`, borderRadius: 14, fontWeight: 500, fontSize: 14, color: 'var(--ink)', cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s ease', fontFamily: 'inherit' }}>
      {label}
      <span aria-hidden style={{
        flexShrink: 0, width: 18, height: 18, borderRadius: 5,
        border: `1.5px solid ${selected ? '#2600FF' : 'rgba(7,7,12,0.25)'}`,
        backgroundColor: selected ? '#2600FF' : 'transparent', color: '#fff', fontSize: 11, lineHeight: '15px', textAlign: 'center',
      }}>{selected ? '✓' : ''}</span>
    </button>
  )

  const BackLink = () => (
    <button type="button" onClick={back} style={{ background: 'none', border: 'none', padding: 0, marginTop: 12, fontSize: 13, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>← Zurück</button>
  )

  return (
    <>
    {order && <ProfileOrderModal onClose={() => setOrder(false)} />}
    <section id="audit-quiz" style={{ backgroundColor: 'var(--electric)', color: '#fff', padding: 'var(--sec-y) clamp(20px, 4vw, 48px)', position: 'relative', overflow: 'hidden' }}>
      <ScanBackdrop />
      <div className="audit-grid" style={{ ...SHELL, position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0, 500px)', gap: 'clamp(36px, 5vw, 80px)', alignItems: 'center' }}>
        <div className="audit-copy">
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ width: 28, height: 1, backgroundColor: 'rgba(255,255,255,0.6)' }} />
              <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Kostenlos · unverbindlich</p>
            </div>
          </Reveal>
          <MaskHeading
            className="h-md"
            style={{ marginBottom: 24, color: '#fff' }}
            lines={[<>Wir sagen Ihnen,</>, <><span className="serif italic-serif">was jetzt zu tun ist.</span></>]}
          />
          <Reveal delay={0.12}>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.75)', marginBottom: 34, maxWidth: 460 }}>
              Zeigen Sie uns, was es von Ihrem Unternehmen schon gibt: Google-Maps-Eintrag, Website, Social Media. Wir sehen uns alles an und schicken Ihnen eine klare Anleitung — was Sie zuerst verbessern sollten und welche Schritte danach kommen.
            </p>
          </Reveal>
          <div className="audit-bullets" style={{ display: 'flex', flexDirection: 'column' }}>
            {['Drei kurze Schritte — Ihre Links genügen', 'Konkrete Anleitung statt allgemeiner Tipps', 'Ehrlich: auch was Sie selbst erledigen können'].map((b, i) => (
              <Reveal key={b} delay={0.16 + i * 0.07}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 15, color: '#fff' }}>{b}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.4}>
            <div style={{ marginTop: 34, paddingTop: 26, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Noch keine digitale Präsenz?</p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px', maxWidth: 440 }}>Dann starten Sie direkt mit dem Google-Unternehmensprofil.</p>
              <button onClick={() => setOrder(true)} className="btn btn-md btn-paper">Google-Profil · 149 € einmalig <span className="arw">→</span></button>
            </div>
          </Reveal>
        </div>

        <div style={{ backgroundColor: '#fff', color: 'var(--ink)', borderRadius: 26, padding: 'clamp(26px, 3vw, 38px)', boxShadow: '0 40px 80px rgba(7,7,12,0.28)' }}>
          {step <= TOTAL && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#4b5563' }}>Schritt {step} von {TOTAL}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TOTAL}, 1fr)`, gap: 4 }}>
                {Array.from({ length: TOTAL }, (_, i) => (
                  <div key={i} style={{ height: 4, borderRadius: 2, backgroundColor: i < step ? '#2600FF' : '#e5e7eb', transition: 'background-color 0.3s' }} />
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 style={h3}>Was gibt es von Ihrem Unternehmen bereits?</h3>
              <p style={hint}>Mehrfachauswahl möglich.</p>
              {[P_MAPS, P_SITE, P_SOCIAL, NONE].map(o => (
                <Option key={o} label={o} selected={has(o)} onClick={() => togglePresence(o)} />
              ))}
              <button type="button" disabled={!presence.length} onClick={next} style={{ ...primary(!presence.length), marginTop: 6 }}>Weiter</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={h3}>{has(NONE) ? 'Womit und wo sind Sie tätig?' : 'Wo finden wir Sie online?'}</h3>
              <p style={hint}>{has(NONE) ? 'Dann starten wir bei null — so wissen wir, womit wir anfangen.' : 'Ein Link genügt — den Rest sehen wir uns selbst an.'}</p>
              {!has(NONE) && (<>
                <label style={label} htmlFor="q-link">Link</label>
                <input id="q-link" style={input} value={link} onChange={e => setLink(e.target.value)} placeholder="Google Maps, Website oder Social Media" inputMode="url" />
              </>)}
              <label style={label} htmlFor="q-industry">Branche</label>
              <input id="q-industry" style={input} value={industry} onChange={e => setIndustry(e.target.value)} placeholder="z. B. Heizungsbau, Zahnarztpraxis, Autowerkstatt" />
              <label style={label} htmlFor="q-city">Stadt</label>
              <input id="q-city" style={input} value={city} onChange={e => setCity(e.target.value)} placeholder="z. B. Dortmund" autoComplete="address-level2" />
              <button type="button" disabled={!canStep2} onClick={next} style={{ ...primary(!canStep2), marginTop: 2 }}>Weiter</button>
              <BackLink />
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={h3}>Wohin dürfen wir Ihre Anleitung schicken?</h3>
              <p style={hint}>Wir prüfen Ihre Angaben und melden uns persönlich mit den nächsten Schritten.</p>
              <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="Ihr Name" autoComplete="name" />
              <input style={input} value={company} onChange={e => setCompany(e.target.value)} placeholder="Name Ihres Unternehmens" autoComplete="organization" />
              <input style={input} value={contact} onChange={e => setContact(e.target.value)} placeholder="Telefon oder E-Mail" autoComplete="email" />
              <button type="button" disabled={!name.trim() || !contact.trim()} onClick={next} style={{ ...primary(!name.trim() || !contact.trim()), marginTop: 2 }}>Anleitung anfordern</button>
              <p style={{ fontSize: 11.5, color: '#9ca3af', lineHeight: 1.6, margin: '12px 0 0' }}>
                Mit dem Absenden stimmen Sie zu, dass wir Sie zu Ihrer Anfrage kontaktieren. Keine Werbung, keine Weitergabe an Dritte.
              </p>
              <BackLink />
            </div>
          )}

          {step === DONE && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#EEEBFF', color: '#2600FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 700 }}>✓</div>
              <h3 style={{ ...h3, fontSize: 20, marginBottom: 10 }}>Danke, {name.trim()}!</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 18px' }}>
                Wir sehen uns Ihre Angaben an und melden uns mit Ihrer Anleitung unter <strong style={{ color: 'var(--ink)' }}>{contact}</strong>.
              </p>
              <div style={{ textAlign: 'left', backgroundColor: '#F7F6FF', border: '1px solid #E4DFFF', borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
                <p className="eyebrow" style={{ fontSize: 9.5, color: '#2600FF', marginBottom: 8 }}>Ihre Angaben</p>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)', margin: 0, overflowWrap: 'anywhere' }}>
                  <span>{industry}</span> · <span>{city}</span><br />
                  {presence.map((x, i) => <span key={x}>{i > 0 && ', '}{x}</span>)}
                  {link.trim() && <><br /><span>{link.trim()}</span></>}
                </p>
              </div>
              <button type="button" onClick={reset} style={{ backgroundColor: '#F4F2FF', color: '#2600FF', fontWeight: 500, fontSize: 13, padding: '9px 20px', borderRadius: 10, border: '1px solid #ddd6fe', cursor: 'pointer', fontFamily: 'inherit' }}>Neue Anfrage</button>
            </div>
          )}
        </div>
      </div>
    </section>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────
const faqs = [
  { q: 'Wie schnell verbessert sich meine lokale Sichtbarkeit?', a: 'Nach der Arbeit an Profil und Verzeichnissen zeigen sich erste Veränderungen bei Aufrufen und Anrufen häufig innerhalb weniger Wochen. Bewertungen, Website-Inhalte und KI-Sichtbarkeit bauen sich über Monate auf. Wir messen von Anfang an, damit Sie sehen, was sich bewegt.' },
  { q: 'Können Sie Platz 1 bei Google garantieren?', a: "Nein — und niemand kann das seriös versprechen. Google bewertet lokale Ergebnisse unter anderem nach Relevanz, Entfernung zum Suchenden und Bekanntheit des Unternehmens. Auf einen Teil davon haben wir direkten Einfluss, auf anderes nicht. Was wir zusagen: Wir bringen alle beeinflussbaren Faktoren in Ordnung, arbeiten kontinuierlich daran und zeigen Ihnen an konkreten Zahlen, was sich bewegt." },
  { q: 'Brauche ich unbedingt eine Website?', a: "Für den Start nicht zwingend. Ein vollständig gepflegtes Google-Unternehmensprofil kann die erste Grundlage sein. Sobald Sie mehrere Leistungen, mehrere Regionen oder erklärungsbedürftige Angebote haben, wird die Website aber zur Wissensbasis, aus der Google und KI-Systeme ihre Antworten über Sie ziehen." },
  { q: 'Können Sie meine bestehende Website optimieren?', a: 'In den meisten Fällen ja. Wir prüfen Struktur, Inhalte und Technik Ihrer bestehenden Website und verbessern gezielt das, was Sichtbarkeit und Anfragen blockiert. Nur wenn die technische Basis eine sinnvolle Weiterentwicklung nicht zulässt, empfehlen wir einen Neuaufbau.' },
  { q: 'Wie bekomme ich mehr Google-Bewertungen?', a: 'Indem Sie zu einem festen Zeitpunkt fragen — am besten direkt nach einem gelungenen Auftrag —, den Weg zur Abgabe so kurz wie möglich machen und auf Bewertungen antworten. Gekaufte oder erfundene Bewertungen verstoßen gegen die Google-Richtlinien und können zur Sperrung des Profils führen. Wir richten einen Ablauf ein, der echte Bewertungen mit konkreten Erfahrungen bringt.' },
  { q: 'Wie kann mein Unternehmen in ChatGPT erscheinen?', a: "Indem die Informationen über Ihr Unternehmen im Web klar, zugänglich und widerspruchsfrei sind: verständlich beschriebene Leistungen, eine logisch strukturierte Website, übereinstimmende Angaben auf allen Plattformen, externe Erwähnungen und Inhalte, die für Suchsysteme abrufbar sind. Eine separate \"KI-Optimierung\" jenseits sauberer Grundlagen gibt es nicht — wir sorgen dafür, dass diese Grundlagen stimmen." },
  { q: 'Was kostet die laufende Betreuung?', a: 'Die Website gibt es als monatliches Paket: One Pager für 30 €, Local Website für 299 € und AI Plus für 499 € im Monat. Die Social-Media-Betreuung kostet 199 € im Monat — zusätzlich zu einem Paket oder ganz allein. Nur das Google-Unternehmensprofil einzurichten kostet einmalig 149 €. Nach dem kostenlosen Sichtbarkeits-Check erhalten Sie eine Empfehlung, die zu Ihrer Situation und Ihrem Budget passt — ohne versteckte Gebühren.' },
  { q: 'Für welche Unternehmen eignet sich lokale Optimierung?', a: 'Für alle, deren Kunden aus der Umgebung kommen: Handwerksbetriebe, Werkstätten, Praxen, Kanzleien, Restaurants, Salons und Dienstleister mit Servicegebiet. Entscheidend ist nicht die Branche, sondern dass Kunden lokal suchen — ob Sie ein Ladengeschäft haben oder zu Ihren Kunden fahren.' },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" style={{ backgroundColor: 'var(--bone)', padding: 'var(--sec-y) clamp(20px, 4vw, 48px)' }}>
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
            { title: 'Navigation', items: [['Sichtbarkeit', 'kanaele'], ['Leistungen', '/services'], ['Preise', '/preise'], ['Ratgeber', '/ratgeber'], ['Glossar', '/glossar'], /* ['Ergebnisse', 'results'] — hidden with the results block */ ['FAQ', 'faq']] as [string, string][] },
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
    heroTitle: 'Google Maps ist Pflicht für lokale Unternehmen',
    heroSubtitle: 'Menschen suchen in der Nähe, lesen Bewertungen und rufen direkt an. Wir richten Ihr Google-Unternehmensprofil so ein, dass es vollständig, aktuell und vertrauenswürdig ist.',
    whatTitle: 'Was ist das Google-Unternehmensprofil?',
    whatBody: 'Ihr Eintrag bei Google Maps und in der Google-Suche: Name, Kategorie, Leistungen, Öffnungszeiten, Fotos und Bewertungen. Für viele Kunden ist er der kürzeste Weg von der Suche zum Anruf — oft noch bevor sie Ihre Website sehen.',
    howTitle: 'Was wir für Ihr Profil tun',
    howItems: [
      { title: 'Einrichtung', body: 'Wir erstellen Ihr Profil oder übernehmen und überarbeiten ein bestehendes.' },
      { title: 'Hauptkategorie und Leistungen', body: 'Die Hauptkategorie entscheidet, bei welchen Suchen Google Sie überhaupt zeigt. Wir wählen sie sorgfältig und beschreiben Ihre Leistungen klar.' },
      { title: 'Angaben, die überall stimmen', body: 'Kontaktdaten, Öffnungszeiten, Servicegebiet und die Verbindung zur Website — einheitlich mit Ihren anderen Einträgen im Netz.' },
      { title: 'Bewertungen', body: 'Sie bekommen einen Link und eine Vorlage, mit der Sie zufriedene Kunden einfach um eine Bewertung bitten.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Ein vollständig eingerichtetes Google-Profil — einmalig, ohne Abo.',
      'Eine klare Kategorie und Leistungen, damit Google versteht, wofür Sie stehen.',
      'Einheitliche Kontaktdaten, Öffnungszeiten und die Verbindung zur Website.',
      'Link und Vorlage für echte Google-Bewertungen.',
    ],
    whyTitle: 'Warum Google Maps zuerst kommt',
    whyBody: 'Wer einen Handwerker, eine Praxis oder einen Dienstleister in der Nähe sucht, entscheidet meist schnell und zwischen wenigen Anbietern auf der Karte. Ein unvollständiges Profil überlässt diese Anfragen den Mitbewerbern — auch wenn Ihre Arbeit besser ist.',
    faq: [
      { q: 'Können Sie Platz 1 auf Google Maps garantieren?', a: 'Nein, das kann niemand seriös versprechen. Google berücksichtigt unter anderem die Entfernung zum Suchenden und die Bekanntheit des Unternehmens. Wir bringen alles in Ordnung, was sich beeinflussen lässt.' },
      { q: 'Brauche ich ein physisches Ladengeschäft, um Google Business Profile zu nutzen?', a: 'Nein. Dienstleistungsunternehmen, die zu ihren Kunden fahren, können optimierte Profile mit festgelegten Servicegebieten betreiben, ohne die Privatadresse offenzulegen.' },
      { q: 'Was kostet das Google-Profil?', a: 'Die Einrichtung kostet einmalig 149 € — ohne Abo. In den Website-Paketen Local Website (299 € im Monat) und AI Plus (499 € im Monat) ist das Google-Profil bereits enthalten, bei AI Plus mit erweiterter Optimierung.' },
    ],
    ctaTitle: 'Kostenloser Check Ihres Google-Profils',
    ctaBody: 'Wir prüfen Ihr Google-Unternehmensprofil und zeigen, was fehlt und was Sie zuerst verbessern sollten.',
  },
  {
    slug: 'website-google-search',
    Illust: IllustWebsiteSearch,
    kicker: 'WEBSITE & GOOGLE SEARCH',
    heroTitle: 'Google Search schaut auf Ihre Website',
    heroSubtitle: 'Ihre Website muss in einfachen Worten erklären, was Sie tun, wo Sie arbeiten und warum man Ihnen vertrauen kann — für Menschen und für Google.',
    whatTitle: 'Was eine gute lokale Website ausmacht',
    whatBody: 'Eine gute Website sieht nicht nur gut aus. Sie beantwortet die Fragen Ihrer Kunden: Was bieten Sie an, wo sind Sie tätig, welche Arbeiten haben Sie schon gemacht und wie erreicht man Sie. Genau daraus lesen auch Google und KI-Systeme, wer Sie sind.',
    howTitle: 'Drei Pakete — je nachdem, wo Sie stehen',
    howItems: [
      { title: 'One Pager', body: 'Eine Seite mit Leistungen und Kontakt, optimiert für das Smartphone — Hosting und Technik inklusive. Der schnelle Einstieg.' },
      { title: 'Local Website', body: 'Mehrere Seiten: eine pro Leistung und pro Ort, dazu Google-Unternehmensprofil, lokales SEO und regelmäßige Updates.' },
      { title: 'AI Plus', body: 'Alles aus Local Website, dazu Verzeichnisse, Inhalte für Google und die KI-Suche sowie Monitoring und Empfehlungen.' },
      { title: 'Technik in jedem Paket', body: 'Ladezeiten, mobile Darstellung und strukturierte Daten, damit Ihre Inhalte gefunden und richtig verstanden werden.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Eine Website, die in einfachen Worten erklärt, was Sie tun und wo Sie arbeiten.',
      'Eigene Seiten für Ihre Leistungen und Orte (ab Local Website).',
      'Hosting und technische Betreuung in jedem Paket.',
    ],
    whyTitle: 'Warum die Website die Basis bleibt',
    whyBody: 'Google-Profil, Bewertungen und soziale Netzwerke verweisen alle auf einen Punkt: Ihre Website. Fehlen dort klare Antworten, brechen Interessenten genau in dem Moment ab, in dem sie sich entscheiden wollten – und KI-Systeme haben keine verlässliche Quelle über Sie.',
    faq: [
      { q: 'Welches Paket passt zu mir?', a: 'One Pager, wenn Sie schnell einen professionellen Auftritt brauchen. Local Website, wenn Sie mehrere Leistungen oder Orte haben und Anfragen aus der Region bekommen wollen. AI Plus, wenn Sie zusätzlich in Verzeichnissen und in der KI-Suche sichtbar werden möchten.' },
      { q: 'Können Sie meine bestehende Website optimieren?', a: 'In den meisten Fällen ja. Wir prüfen Struktur, Inhalte und Technik Ihrer bestehenden Website und verbessern gezielt das, was Sichtbarkeit und Anfragen blockiert. Nur wenn die technische Basis eine sinnvolle Weiterentwicklung nicht zulässt, empfehlen wir einen Neuaufbau.' },
      { q: 'Brauche ich unbedingt eine Website?', a: 'Für den Start reicht ein gut gepflegtes Google-Unternehmensprofil oft aus. Sobald Sie aber mehrere Leistungen, mehrere Regionen oder erklärungsbedürftige Angebote haben, ist die Website der Ort, an dem all das verständlich zusammenkommt – auch für KI-Systeme.' },
    ],
    ctaTitle: 'Kostenloser Sichtbarkeits-Check Ihrer Website',
    ctaBody: 'Wir prüfen Struktur, Inhalte und Technik Ihrer Website und zeigen Ihnen, welche Schritte Ihre Sichtbarkeit bei Google und in der KI-Suche am stärksten verbessern.',
  },
  {
    slug: 'ai-search-optimization',
    Illust: IllustAIOptimization,
    kicker: 'KI-SUCHE',
    heroTitle: 'Lokale Suche beginnt immer öfter mit einer Frage an die KI',
    heroSubtitle: 'ChatGPT, Perplexity und die KI-Übersichten bei Google nennen nur wenige Anbieter — und zwar die, die sie eindeutig verstehen und für vertrauenswürdig halten.',
    whatTitle: 'Was heißt „in der KI-Suche sichtbar“?',
    whatBody: 'KI-Assistenten stellen ihre Antworten aus dem zusammen, was im Netz über Ihr Unternehmen steht: Website, Google-Profil, Verzeichnisse, Bewertungen und Social Media. Sichtbar wird, wer dort klar und widerspruchsfrei beschrieben ist. Einen Trick jenseits sauberer Grundlagen gibt es nicht.',
    howTitle: 'Was die KI über Sie verstehen muss',
    howItems: [
      { title: 'Was Sie anbieten', body: 'Klare Beschreibungen Ihrer Leistungen auf der Website und im Google-Profil — mit strukturierten Daten, die Maschinen lesen können.' },
      { title: 'Wo Sie tätig sind', body: 'Ort und Servicegebiet eindeutig und überall gleich angegeben.' },
      { title: 'Was Kunden über Sie sagen', body: 'Echte Bewertungen und Erwähnungen, auf die sich KI-Systeme stützen können.' },
      { title: 'Ob Ihre Angaben übereinstimmen', body: 'Einheitliche Daten auf Website, Karten, Verzeichnissen und Social Media — widersprüchliche Angaben machen die KI unsicher.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Inhalte, die die Fragen Ihrer Kunden direkt beantworten — für Google und die KI-Suche.',
      'Einheitliche Unternehmensdaten in Branchenverzeichnissen und auf Kartendiensten.',
      'Regelmäßiges Monitoring, wie KI-Assistenten Ihr Unternehmen darstellen — mit Empfehlungen.',
    ],
    whyTitle: 'Warum das jetzt wichtig wird',
    whyBody: 'Immer mehr Menschen fragen einen KI-Assistenten, bevor sie Google öffnen. Die Antwort nennt nur wenige Anbieter. Wer dort fehlt, wird gar nicht erst verglichen.',
    faq: [
      { q: 'Wie unterscheidet sich das von klassischem SEO?', a: 'Die Grundlagen sind dieselben: klare Inhalte, saubere Technik, einheitliche Angaben. Der Unterschied: Eine KI zeigt keine Trefferliste, sondern nennt wenige Anbieter — deshalb zählt, wie eindeutig und vertrauenswürdig Ihr Unternehmen beschrieben ist.' },
      { q: 'Können Sie eine Empfehlung durch ChatGPT garantieren?', a: 'Nein. Niemand kontrolliert, was eine KI antwortet. Wir sorgen dafür, dass alles, was sie über Sie finden kann, klar, aktuell und stimmig ist — und prüfen regelmäßig, wie Sie dargestellt werden.' },
      { q: 'In welchem Paket ist das enthalten?', a: 'Im Paket AI Plus für 499 € im Monat: Website, erweiterte Optimierung des Google-Profils, Verzeichnisse, Inhalte für Google und die KI-Suche sowie Monitoring und Empfehlungen.' },
    ],
    ctaTitle: 'Kostenloser Check Ihrer KI-Sichtbarkeit',
    ctaBody: 'Wir sehen nach, wie ChatGPT, Perplexity und Google Ihr Unternehmen aktuell darstellen, und zeigen, was Sie zuerst verbessern sollten.',
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
    kicker: 'SOCIAL MEDIA',
    heroTitle: 'In sozialen Netzwerken sehen Kunden Menschen',
    heroSubtitle: 'Team, Arbeitsweise und echte Ergebnisse machen Ihr Unternehmen vertraut — schon vor dem ersten Anruf. Dafür müssen Sie kein Influencer werden.',
    whatTitle: 'Was wir unter Social-Media-Betreuung verstehen',
    whatBody: 'Regelmäßige, ehrliche Beiträge auf Instagram und Facebook: wer Sie sind, wie Sie arbeiten und was dabei herauskommt. Wir planen, bereiten vor und veröffentlichen — Sie liefern Einblicke aus Ihrem Alltag.',
    howTitle: 'So läuft die Betreuung',
    howItems: [
      { title: 'Redaktionsplan', body: 'Wir planen Themen rund um Ihre Leistungen, echte Projekte und Ihre Region.' },
      { title: 'Vorbereitung der Beiträge', body: 'Wir gestalten die Beiträge und schreiben die Texte — Sie geben sie frei.' },
      { title: 'Regelmäßiges Posten', body: 'Wir veröffentlichen nach Plan, damit Ihr Profil sichtbar aktiv bleibt.' },
      { title: 'Verbindung zu Ihren Leistungen', body: 'Profil, Links und Beiträge führen zu Website, Google-Profil und Anfrage.' },
    ],
    receiveTitle: 'Was Sie erhalten',
    receiveItems: [
      'Ein aktives Profil, das zeigt: Hier arbeiten echte Menschen.',
      'Beiträge, die zu Ihren Leistungen und Ihrer Region passen.',
      'Kein eigener Aufwand für Planung und Veröffentlichung.',
    ],
    whyTitle: 'Warum Social Media Vertrauen schafft',
    whyBody: 'Viele Kunden sehen sich vor dem Anruf kurz Ihr Profil an. Ein gepflegter Feed zeigt, dass Ihr Unternehmen aktiv ist und dass hinter dem Namen Menschen stehen. Ein verwaistes Profil wirft dagegen Fragen auf.',
    faq: [
      { q: 'Wie oft wird gepostet?', a: 'Die Frequenz legen wir gemeinsam im Redaktionsplan fest — so, dass sie zu Ihrem Alltag und Ihren Themen passt.' },
      { q: 'Kann ich Social Media ohne Website buchen?', a: 'Ja. Die Social-Media-Betreuung kostet 199 € im Monat und lässt sich zu jedem Paket dazu buchen — oder ganz allein.' },
      { q: 'Muss ich selbst vor die Kamera?', a: 'Nein. Fotos von Projekten, dem Team oder der Werkstatt reichen oft völlig. Wer mag, zeigt sich — Pflicht ist das nicht.' },
    ],
    ctaTitle: 'Kostenloser Check Ihrer Social-Media-Präsenz',
    ctaBody: 'Wir sehen uns Ihre Profile an und sagen Ihnen, was fehlt und womit Sie anfangen sollten.',
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
  slug: string
  term: string
  short: string
  body: string
  sections: { h: string; p: string[] }[]
  faq: { q: string; a: string }[]
  related: string[]
  ratgeber?: string
  service?: string
}

const glossarEntries: GlossarEntry[] = [
  {
    slug: "lokale-sichtbarkeit",
    term: "Lokale Sichtbarkeit",
    short: "Wie gut Ihr Unternehmen dort auffindbar ist, wo Kunden in Ihrer Region suchen.",
    body: "Lokale Sichtbarkeit ist kein einzelner Kanal, sondern die Summe aus Google-Unternehmensprofil, Website, Bewertungen, Verzeichniseinträgen, sozialen Netzwerken und dem, was KI-Systeme über Sie wiedergeben. Sie entscheidet darüber, ob ein kaufbereiter Kunde Sie überhaupt zu Gesicht bekommt.",
    sections: [
      { h: "Was ist lokale Sichtbarkeit?", p: [
        "Lokale Sichtbarkeit ist kein einzelner Kanal, sondern die Summe aus Google-Unternehmensprofil, Website, Bewertungen, Verzeichniseinträgen, sozialen Netzwerken und dem, was KI-Systeme über Sie wiedergeben. Sie entscheidet darüber, ob ein kaufbereiter Kunde Sie überhaupt zu Gesicht bekommt.",
        "Gemessen wird sie nicht an einer einzigen Position, sondern daran, wie oft und wie überzeugend Ihr Unternehmen bei den Suchanfragen erscheint, die in Ihrem Einzugsgebiet tatsächlich gestellt werden — „Elektriker Siegen“, „Zahnarzt in der Nähe“, „wer repariert Rollläden“.",
      ] },
      { h: "Woraus lokale Sichtbarkeit besteht", p: [
        "Die wichtigsten Bausteine sind das Google-Unternehmensprofil, eine Website mit einer eigenen Seite je Leistung und Region, aktuelle Bewertungen, einheitliche Einträge in Verzeichnissen sowie Inhalte, die KI-Systeme verlässlich auslesen können.",
        "Keiner dieser Bausteine wirkt allein. Ein starkes Profil mit widersprüchlichen Adressdaten oder eine gute Website ohne Bewertungen verschenkt einen großen Teil ihrer Wirkung.",
      ] },
      { h: "Warum sie für lokale Unternehmen entscheidend ist", p: [
        "Wer einen Handwerker, eine Praxis oder einen Dienstleister vor Ort sucht, entscheidet meist schnell und zwischen wenigen Optionen. Unternehmen, die in diesem Moment nicht erscheinen, werden nicht abgelehnt — sie werden gar nicht erst in Betracht gezogen.",
      ] },
    ],
    faq: [
      { q: "Ist lokale Sichtbarkeit dasselbe wie lokales SEO?", a: "Lokales SEO ist ein Teil davon. Zur lokalen Sichtbarkeit gehören zusätzlich Bewertungen, Verzeichnisse, soziale Netzwerke, KI-Suche und auch Offline-Kontaktpunkte." },
      { q: "Wie lässt sich lokale Sichtbarkeit messen?", a: "Über Aufrufe und Aktionen im Google-Unternehmensprofil, Platzierungen für lokale Suchbegriffe an mehreren Punkten im Einzugsgebiet, Anfragen über die Website und die Frage, ob KI-Assistenten Ihr Unternehmen nennen." },
      { q: "Wie schnell verbessert sie sich?", a: "Erste Effekte, etwa durch ein vollständiges Profil, zeigen sich oft nach einigen Wochen. Stabile Positionen entstehen über Monate. Eine bestimmte Platzierung kann niemand seriös garantieren." },
    ],
    related: ["google-unternehmensprofil", "local-pack", "sichtbarkeits-check"],
    ratgeber: "wie-funktioniert-lokales-seo",
  },
  {
    slug: "google-unternehmensprofil",
    term: "Google-Unternehmensprofil",
    short: "Ihr kostenloser Eintrag bei Google, der in Maps und in der Suche erscheint.",
    body: "Das Google-Unternehmensprofil (früher Google My Business) enthält Name, Adresse, Öffnungszeiten, Leistungen, Fotos und Bewertungen. Es ist die Grundlage für jede lokale Platzierung: Ohne vollständiges, gepflegtes Profil erscheint ein Unternehmen bei lokalen Suchanfragen faktisch nicht.",
    sections: [
      { h: "Was ist das Google-Unternehmensprofil?", p: [
        "Das Google-Unternehmensprofil (früher Google My Business) enthält Name, Adresse, Öffnungszeiten, Leistungen, Fotos und Bewertungen. Es ist die Grundlage für jede lokale Platzierung: Ohne vollständiges, gepflegtes Profil erscheint ein Unternehmen bei lokalen Suchanfragen faktisch nicht.",
        "Das Profil erscheint neben den Suchergebnissen, im Local Pack und direkt in Google Maps. Viele Kunden rufen von dort aus an, lassen sich die Route anzeigen oder lesen Bewertungen, ohne jemals Ihre Website zu öffnen.",
      ] },
      { h: "Was ein gutes Profil ausmacht", p: [
        "Die richtige Hauptkategorie, vollständige Leistungen, aktuelle Öffnungszeiten, echte Fotos von Team, Betrieb und Arbeit, regelmäßige Beiträge und beantwortete Bewertungen. Jede Angabe muss mit Website und Verzeichnissen übereinstimmen.",
        "Die Hauptkategorie hat besonders großes Gewicht: Sie legt fest, bei welchen Suchanfragen Google Ihr Profil überhaupt in Betracht zieht.",
      ] },
      { h: "Häufige Fehler", p: [
        "Kategorien, die nicht zum Kerngeschäft passen, Suchbegriffe im Firmennamen, veraltete Öffnungszeiten und doppelte Profile. Suchbegriffe im Namen verstoßen gegen die Google-Richtlinien und können zur Sperrung des Profils führen.",
      ] },
    ],
    faq: [
      { q: "Was kostet ein Google-Unternehmensprofil?", a: "Der Eintrag selbst ist kostenlos. Aufwand entsteht für Einrichtung, Verifizierung und laufende Pflege." },
      { q: "Wer muss das Profil verifizieren?", a: "Die Verifizierung erfolgt durch den Inhaber oder eine berechtigte Person des Unternehmens, meist per Video, Telefon oder Post. Wir bereiten alles vor und begleiten den Schritt." },
      { q: "Brauche ich eine Adresse, um ein Profil zu haben?", a: "Nein. Betriebe ohne Kundenverkehr vor Ort können statt der Adresse ein Servicegebiet angeben." },
    ],
    related: ["local-pack", "nap-konsistenz", "bewertungen", "servicegebiet"],
    ratgeber: "google-maps-ranking-verbessern",
    service: "google-maps-business-profile",
  },
  {
    slug: "local-pack",
    term: "Local Pack",
    short: "Der Kartenblock mit drei Einträgen ganz oben in den Google-Ergebnissen.",
    body: "Bei Suchanfragen mit örtlichem Bezug zeigt Google eine Karte mit drei Unternehmen an. Dieser Block bekommt einen sehr großen Teil aller Klicks und Anrufe. Wer dort nicht auftaucht, konkurriert nur noch um die Aufmerksamkeit, die darunter übrig bleibt.",
    sections: [
      { h: "Was ist das Local Pack?", p: [
        "Bei Suchanfragen mit örtlichem Bezug zeigt Google eine Karte mit drei Unternehmen an. Dieser Block bekommt einen sehr großen Teil aller Klicks und Anrufe. Wer dort nicht auftaucht, konkurriert nur noch um die Aufmerksamkeit, die darunter übrig bleibt.",
        "Neben Name und Sternebewertung zeigt jeder Eintrag Kategorie, Öffnungszeiten und oft Schaltflächen für Anruf, Route oder Website. Über „Weitere Orte“ gelangt man zur vollständigen Kartenliste.",
      ] },
      { h: "Wie Google die drei Plätze vergibt", p: [
        "Google nennt drei Hauptfaktoren: Relevanz (passt das Profil zur Suche?), Entfernung (wie nah ist das Unternehmen am Suchenden oder am genannten Ort?) und Bekanntheit (Bewertungen, Erwähnungen, Links, Qualität der Website).",
        "Die Entfernung lässt sich nicht beeinflussen. Deshalb sieht das Local Pack je nach Standort des Suchenden unterschiedlich aus — und deshalb ist eine feste Platzierung nicht garantierbar.",
      ] },
      { h: "Wie Sie Ihre Chancen verbessern", p: [
        "Ein vollständiges Profil mit passender Kategorie, kontinuierlich neue Bewertungen, einheitliche Angaben in Verzeichnissen und eine Website, die jede Leistung und jede Region klar beschreibt.",
      ] },
    ],
    faq: [
      { q: "Kann ich mich ins Local Pack einkaufen?", a: "Es gibt Anzeigen, die über oder im Kartenblock erscheinen. Die drei organischen Plätze lassen sich nicht kaufen." },
      { q: "Warum sehe ich mein Unternehmen, meine Kunden aber nicht?", a: "Die Ergebnisse hängen vom Standort, vom Suchverlauf und vom genauen Suchbegriff ab. Aussagekräftig sind nur Messungen an mehreren Punkten im Einzugsgebiet." },
    ],
    related: ["google-unternehmensprofil", "bewertungen", "lokale-sichtbarkeit"],
    ratgeber: "google-maps-ranking-verbessern",
    service: "google-maps-business-profile",
  },
  {
    slug: "nap-konsistenz",
    term: "NAP-Konsistenz",
    short: "Name, Adresse und Telefonnummer müssen überall identisch geschrieben sein.",
    body: "NAP steht für Name, Address, Phone. Weichen diese Angaben zwischen Google, Website, Branchenverzeichnissen und sozialen Profilen voneinander ab, entstehen widersprüchliche Signale — für Suchmaschinen ebenso wie für Kunden. Konsistenz ist unspektakulär, aber eine der zuverlässigsten Grundlagen lokaler Sichtbarkeit.",
    sections: [
      { h: "Was bedeutet NAP-Konsistenz?", p: [
        "NAP steht für Name, Address, Phone. Weichen diese Angaben zwischen Google, Website, Branchenverzeichnissen und sozialen Profilen voneinander ab, entstehen widersprüchliche Signale — für Suchmaschinen ebenso wie für Kunden. Konsistenz ist unspektakulär, aber eine der zuverlässigsten Grundlagen lokaler Sichtbarkeit.",
      ] },
      { h: "Wo die Angaben stimmen müssen", p: [
        "Im Google-Unternehmensprofil, im Impressum und Footer der Website, in Branchenverzeichnissen, bei Apple Maps und Bing, in sozialen Profilen, auf Bewertungsportalen und in Kammer- oder Verbandsverzeichnissen.",
        "Schon Kleinigkeiten zählen: alte Telefonnummern, ein früherer Firmenname oder eine Adresse, die nach einem Umzug nicht überall geändert wurde.",
      ] },
      { h: "So stellen Sie Konsistenz her", p: [
        "Zuerst wird eine verbindliche Schreibweise festgelegt. Dann werden alle bestehenden Einträge gesucht, korrigiert oder zusammengeführt und Dubletten entfernt. Danach reicht eine regelmäßige Kontrolle.",
      ] },
    ],
    faq: [
      { q: "Wie schlimm sind kleine Abweichungen?", a: "Eine einzelne Abkürzung wie „Str.“ statt „Straße“ ist kein Problem. Kritisch sind unterschiedliche Telefonnummern, alte Adressen und doppelte Einträge, weil sie Kunden und Suchmaschinen in die Irre führen." },
      { q: "Was ist nach einem Umzug zu tun?", a: "Zuerst das Google-Profil und die Website aktualisieren, dann die wichtigsten Verzeichnisse. Alte Einträge sollten korrigiert und nicht nur durch neue ergänzt werden." },
    ],
    related: ["lokale-verzeichnisse", "google-unternehmensprofil", "schema-markup"],
    ratgeber: "google-maps-ranking-verbessern",
    service: "local-citations",
  },
  {
    slug: "lokale-verzeichnisse",
    term: "Lokale Verzeichnisse & Erwähnungen",
    short: "Einträge und Nennungen Ihres Unternehmens auf Portalen außerhalb Ihrer eigenen Kanäle.",
    body: "Branchenportale, Kammer- und Verbandsverzeichnisse, Kartendienste, lokale Presse: Jede korrekte Nennung bestätigt, dass es Ihr Unternehmen gibt und dass die Angaben stimmen. Solche Erwähnungen sind auch die Quellen, aus denen KI-Systeme ihr Bild von einem Unternehmen zusammensetzen.",
    sections: [
      { h: "Was sind lokale Verzeichnisse und Erwähnungen?", p: [
        "Branchenportale, Kammer- und Verbandsverzeichnisse, Kartendienste, lokale Presse: Jede korrekte Nennung bestätigt, dass es Ihr Unternehmen gibt und dass die Angaben stimmen. Solche Erwähnungen sind auch die Quellen, aus denen KI-Systeme ihr Bild von einem Unternehmen zusammensetzen.",
      ] },
      { h: "Welche Verzeichnisse zählen", p: [
        "Wichtiger als die Menge ist die Relevanz: große allgemeine Verzeichnisse, Kartendienste wie Apple Maps und Bing Places, Branchenportale Ihres Gewerks, Kammern und Verbände sowie regionale Portale und Medien.",
        "Hunderte automatisch erzeugte Einträge auf unbekannten Seiten bringen dagegen wenig und erzeugen schnell veraltete Daten.",
      ] },
      { h: "Die Rolle für die KI-Suche", p: [
        "Sprachmodelle stützen ihre Antworten auf Quellen, die sie im Netz finden. Je häufiger ein Unternehmen an vertrauenswürdigen Stellen mit denselben Angaben genannt wird, desto sicherer kann ein KI-Assistent es empfehlen.",
      ] },
    ],
    faq: [
      { q: "Wie viele Einträge braucht ein lokales Unternehmen?", a: "Es gibt keine feste Zahl. Meist genügt eine überschaubare Liste relevanter Verzeichnisse, die vollständig und korrekt gepflegt ist." },
      { q: "Sind kostenpflichtige Einträge nötig?", a: "In der Regel nicht. Die meisten wichtigen Verzeichnisse bieten kostenlose Basiseinträge." },
    ],
    related: ["nap-konsistenz", "ki-suche-ai-overviews", "geo"],
    ratgeber: "in-chatgpt-und-perplexity-gefunden-werden",
    service: "local-citations",
  },
  {
    slug: "bewertungen",
    term: "Bewertungen",
    short: "Öffentliches Kundenfeedback auf Google, Trustpilot und Branchenportalen.",
    body: "Bewertungen wirken doppelt: Sie beeinflussen, ob ein Interessent anruft, und sie gehören zu den Signalen, die Google für die Einordnung lokaler Ergebnisse heranzieht. Entscheidend ist nicht nur die Sternebewertung, sondern Aktualität, Anzahl, Inhalt und ob auf Bewertungen geantwortet wird.",
    sections: [
      { h: "Was bei Bewertungen zählt", p: [
        "Bewertungen wirken doppelt: Sie beeinflussen, ob ein Interessent anruft, und sie gehören zu den Signalen, die Google für die Einordnung lokaler Ergebnisse heranzieht. Entscheidend ist nicht nur die Sternebewertung, sondern Aktualität, Anzahl, Inhalt und ob auf Bewertungen geantwortet wird.",
      ] },
      { h: "Wie Sie mehr echte Bewertungen erhalten", p: [
        "Der wirksamste Weg ist, zufriedene Kunden direkt nach dem Auftrag zu fragen — mit einem kurzen Link oder QR-Code, der ohne Umwege zur Bewertungsseite führt.",
        "Gekaufte oder selbst geschriebene Bewertungen sind verboten. Google löscht sie und kann das Profil einschränken; in Deutschland drohen zusätzlich Abmahnungen.",
      ] },
      { h: "Richtig auf Bewertungen antworten", p: [
        "Jede Bewertung verdient eine Antwort, auch die positiven. Auf Kritik antworten Sie sachlich, ohne Kundendaten preiszugeben, und bieten eine Lösung an. Viele Interessenten lesen gerade diese Antworten.",
      ] },
    ],
    faq: [
      { q: "Kann ich negative Bewertungen löschen lassen?", a: "Nur wenn sie gegen Richtlinien verstoßen oder rechtswidrig sind, etwa bei Beleidigungen oder wenn nie ein Kundenkontakt bestand. Unangenehme, aber berechtigte Kritik bleibt stehen." },
      { q: "Wie viele Bewertungen sind genug?", a: "Maßgeblich ist der Vergleich mit Ihren direkten Mitbewerbern und ein stetiger Zufluss neuer Bewertungen, nicht eine absolute Zahl." },
      { q: "Zählen Trustpilot-Bewertungen für Google?", a: "Im Local Pack zählen vor allem Google-Bewertungen. Andere Plattformen stärken das Vertrauen und werden von KI-Systemen als Quelle genutzt." },
    ],
    related: ["google-unternehmensprofil", "local-pack", "lokale-sichtbarkeit"],
    service: "reviews",
  },
  {
    slug: "suchintention",
    term: "Suchintention",
    short: "Die Absicht hinter einer Suchanfrage — Information, Vergleich oder Kauf.",
    body: "„Was kostet eine Heizungswartung\" und „Heizungsnotdienst in meiner Nähe\" sind zwei völlig verschiedene Situationen. Inhalte funktionieren dann, wenn sie zur Absicht passen: Ratgeber und Glossar bedienen die Recherche, Leistungs- und Regionenseiten die Entscheidung.",
    sections: [
      { h: "Was ist Suchintention?", p: [
        "„Was kostet eine Heizungswartung\" und „Heizungsnotdienst in meiner Nähe\" sind zwei völlig verschiedene Situationen. Inhalte funktionieren dann, wenn sie zur Absicht passen: Ratgeber und Glossar bedienen die Recherche, Leistungs- und Regionenseiten die Entscheidung.",
      ] },
      { h: "Die drei typischen Absichten", p: [
        "Informieren: Der Kunde will ein Problem verstehen („warum tropft der Heizkörper“). Vergleichen: Er sucht Optionen und Preise („Heizungswartung Kosten Siegen“). Handeln: Er will jetzt einen Anbieter („Heizungsnotdienst in meiner Nähe“).",
      ] },
      { h: "Was das für Ihre Website bedeutet", p: [
        "Jede Absicht braucht eine passende Seite: Ratgeber-Inhalte für Fragen, Leistungs- und Preisseiten für den Vergleich und klare Regionen- und Kontaktseiten mit Telefonnummer für die Entscheidung.",
      ] },
    ],
    faq: [
      { q: "Woran erkenne ich die Suchintention?", a: "Am einfachsten an den Ergebnissen, die Google heute für den Begriff zeigt: Karten und Anbieter deuten auf eine Handlungsabsicht, Artikel und Fragen auf Informationsbedarf." },
    ],
    related: ["lokale-sichtbarkeit", "servicegebiet", "ki-suche-ai-overviews"],
    ratgeber: "wie-funktioniert-lokales-seo",
    service: "website-google-search",
  },
  {
    slug: "schema-markup",
    term: "Strukturierte Daten (Schema-Markup)",
    short: "Maschinenlesbare Zusatzangaben im Quelltext Ihrer Website.",
    body: "Mit Schema-Markup wird aus einer Textseite eine eindeutige Aussage: Das hier ist ein Unternehmen, das sind die Öffnungszeiten, das ist eine Leistung, das ist eine Bewertung. Suchmaschinen und KI-Systeme müssen dann nicht raten, was auf der Seite steht.",
    sections: [
      { h: "Was sind strukturierte Daten?", p: [
        "Mit Schema-Markup wird aus einer Textseite eine eindeutige Aussage: Das hier ist ein Unternehmen, das sind die Öffnungszeiten, das ist eine Leistung, das ist eine Bewertung. Suchmaschinen und KI-Systeme müssen dann nicht raten, was auf der Seite steht.",
        "Technisch handelt es sich meist um einen JSON-LD-Block nach dem Standard von schema.org, der für Besucher unsichtbar im Quelltext steht.",
      ] },
      { h: "Welche Angaben für lokale Unternehmen wichtig sind", p: [
        "LocalBusiness oder die passende Unterart mit Name, Adresse, Telefon, Öffnungszeiten und Servicegebiet, dazu Service für Leistungen, FAQPage für häufige Fragen und BreadcrumbList für die Seitenstruktur.",
      ] },
      { h: "Was strukturierte Daten bewirken — und was nicht", p: [
        "Sie können zu erweiterten Suchergebnissen führen und helfen Suchmaschinen und KI-Systemen, Angaben eindeutig zuzuordnen. Eine Garantie für bessere Platzierungen sind sie nicht, und die Angaben müssen mit dem sichtbaren Seiteninhalt übereinstimmen.",
      ] },
    ],
    faq: [
      { q: "Wie prüfe ich, ob meine Website strukturierte Daten hat?", a: "Mit dem Test für Rich-Suchergebnisse von Google oder dem Schema Markup Validator von schema.org." },
      { q: "Brauche ich dafür ein neues Website-System?", a: "Nein. Strukturierte Daten lassen sich in nahezu jede bestehende Website einbauen." },
    ],
    related: ["ki-suche-ai-overviews", "geo", "nap-konsistenz"],
    ratgeber: "in-chatgpt-und-perplexity-gefunden-werden",
    service: "website-google-search",
  },
  {
    slug: "ki-suche-ai-overviews",
    term: "KI-Suche & AI Overviews",
    short: "Antworten, die ein KI-System zusammenfasst, statt eine Linkliste auszugeben.",
    body: "ChatGPT, Perplexity und die KI-Übersichten in der Google-Suche beantworten Fragen direkt und nennen dabei einige wenige Quellen und Unternehmen. Wer in diesen Antworten nicht vorkommt, ist für diesen Teil der Kundschaft nicht vorhanden — auch bei guter klassischer Platzierung.",
    sections: [
      { h: "Was ist KI-Suche?", p: [
        "ChatGPT, Perplexity und die KI-Übersichten in der Google-Suche beantworten Fragen direkt und nennen dabei einige wenige Quellen und Unternehmen. Wer in diesen Antworten nicht vorkommt, ist für diesen Teil der Kundschaft nicht vorhanden — auch bei guter klassischer Platzierung.",
      ] },
      { h: "Woher KI-Systeme ihre Informationen nehmen", p: [
        "Aus Websites, Verzeichnissen, Bewertungsportalen, Presseberichten und Kartendiensten. Die KI fasst zusammen, was sie an mehreren Stellen übereinstimmend findet — widersprüchliche oder fehlende Angaben führen dazu, dass ein Unternehmen nicht genannt wird.",
      ] },
      { h: "Was lokale Unternehmen tun können", p: [
        "Klare Seiten zu jeder Leistung und Region, strukturierte Daten, einheitliche Angaben im ganzen Netz, echte Bewertungen und Erwähnungen auf vertrauenswürdigen Seiten. Außerdem dürfen KI-Crawler in der robots.txt nicht ausgesperrt sein.",
      ] },
    ],
    faq: [
      { q: "Ersetzt die KI-Suche die Google-Suche?", a: "Nicht vollständig. Sie verändert aber, wie Menschen Fragen stellen, und ein wachsender Teil der Recherche beginnt in ChatGPT, Perplexity oder den AI Overviews." },
      { q: "Kann ich festlegen, was ChatGPT über mein Unternehmen sagt?", a: "Nein. Sie können nur die Quellen verbessern, aus denen die Antworten entstehen." },
    ],
    related: ["geo", "schema-markup", "lokale-verzeichnisse"],
    ratgeber: "in-chatgpt-und-perplexity-gefunden-werden",
    service: "ai-search-optimization",
  },
  {
    slug: "geo",
    term: "GEO (Generative Engine Optimization)",
    short: "Die Arbeit daran, in KI-generierten Antworten korrekt vorzukommen.",
    body: "GEO ist keine geheime zweite Disziplin neben SEO. Es geht um dieselben Grundlagen — klare Inhalte, saubere Technik, abrufbare Seiten, übereinstimmende Angaben, externe Bestätigung — nur konsequent auf die Frage ausgerichtet, ob ein Sprachmodell Ihr Unternehmen verlässlich wiedergeben kann.",
    sections: [
      { h: "Was ist GEO?", p: [
        "GEO ist keine geheime zweite Disziplin neben SEO. Es geht um dieselben Grundlagen — klare Inhalte, saubere Technik, abrufbare Seiten, übereinstimmende Angaben, externe Bestätigung — nur konsequent auf die Frage ausgerichtet, ob ein Sprachmodell Ihr Unternehmen verlässlich wiedergeben kann.",
      ] },
      { h: "Der Unterschied zwischen GEO und SEO", p: [
        "SEO zielt auf Platzierungen in einer Ergebnisliste, GEO darauf, in einer zusammengefassten Antwort genannt und richtig beschrieben zu werden. Die Maßnahmen überschneiden sich stark; neu ist vor allem der Blick auf externe Quellen und eindeutige Formulierungen.",
      ] },
      { h: "Wie GEO in der Praxis aussieht", p: [
        "Fragen, die Kunden stellen, werden auf der Website direkt beantwortet. Unternehmensangaben werden vereinheitlicht und strukturiert ausgezeichnet. Dann wird regelmäßig geprüft, ob und wie KI-Assistenten das Unternehmen bei typischen Anfragen nennen.",
      ] },
    ],
    faq: [
      { q: "Braucht ein lokales Unternehmen eine eigene GEO-Agentur?", a: "In der Regel nicht. GEO gehört zu einer sauberen Gesamtstrategie für lokale Sichtbarkeit und sollte nicht getrennt davon betrieben werden." },
      { q: "Lässt sich GEO messen?", a: "Teilweise: durch regelmäßige Testanfragen in verschiedenen KI-Assistenten und durch Besucher, die von dort auf Ihre Website kommen." },
    ],
    related: ["ki-suche-ai-overviews", "schema-markup", "lokale-verzeichnisse"],
    ratgeber: "in-chatgpt-und-perplexity-gefunden-werden",
    service: "ai-search-optimization",
  },
  {
    slug: "servicegebiet",
    term: "Servicegebiet",
    short: "Die Region, in der Sie arbeiten — auch ohne Ladengeschäft vor Ort.",
    body: "Betriebe, die zu ihren Kunden fahren, können im Google-Profil ein Servicegebiet hinterlegen, statt eine Adresse zu veröffentlichen. Auf der Website gehört dazu je eine eigene Seite pro Region, damit für jede Stadt nachvollziehbar ist, welche Leistung Sie dort anbieten.",
    sections: [
      { h: "Was ist ein Servicegebiet?", p: [
        "Betriebe, die zu ihren Kunden fahren, können im Google-Profil ein Servicegebiet hinterlegen, statt eine Adresse zu veröffentlichen. Auf der Website gehört dazu je eine eigene Seite pro Region, damit für jede Stadt nachvollziehbar ist, welche Leistung Sie dort anbieten.",
      ] },
      { h: "Das Servicegebiet im Google-Unternehmensprofil", p: [
        "Sie können Städte, Postleitzahlen oder Regionen angeben. Google empfiehlt, das Gebiet realistisch zu halten: ungefähr zwei Stunden Fahrzeit vom Betriebssitz.",
        "Ein großes Servicegebiet verbessert nicht automatisch die Platzierung in weiter entfernten Orten — dort zählt vor allem, was Ihre Website über diese Orte aussagt.",
      ] },
      { h: "Regionenseiten auf der Website", p: [
        "Für jede wichtige Stadt eine eigene Seite mit echten Informationen: welche Leistungen Sie dort anbieten, wie schnell Sie vor Ort sind, Referenzen aus dem Ort. Kopierte Seiten, in denen nur der Ortsname ausgetauscht ist, bringen wenig.",
      ] },
    ],
    faq: [
      { q: "Kann ich Adresse und Servicegebiet gleichzeitig angeben?", a: "Ja, wenn Kunden Sie auch vor Ort besuchen. Wenn nicht, sollte die Adresse ausgeblendet werden." },
    ],
    related: ["google-unternehmensprofil", "local-pack", "suchintention"],
    service: "website-google-search",
  },
  {
    slug: "sichtbarkeits-check",
    term: "Sichtbarkeits-Check",
    short: "Unsere kostenlose Bestandsaufnahme Ihrer aktuellen lokalen Präsenz.",
    body: "Wir sehen uns an, wie Ihr Unternehmen heute bei Google Maps, in der Google-Suche und in der KI-Suche dargestellt wird, vergleichen das mit Ihren lokalen Mitbewerbern und benennen die Maßnahmen, die in Ihrer Situation den größten Effekt haben. Ohne Verkaufsgespräch.",
    sections: [
      { h: "Was ist der Sichtbarkeits-Check?", p: [
        "Wir sehen uns an, wie Ihr Unternehmen heute bei Google Maps, in der Google-Suche und in der KI-Suche dargestellt wird, vergleichen das mit Ihren lokalen Mitbewerbern und benennen die Maßnahmen, die in Ihrer Situation den größten Effekt haben. Ohne Verkaufsgespräch.",
      ] },
      { h: "Was wir prüfen", p: [
        "Ihr Google-Unternehmensprofil, die Platzierung bei wichtigen lokalen Suchbegriffen, Website und Technik, Bewertungen im Vergleich zu Mitbewerbern, Einträge in Verzeichnissen und ob KI-Assistenten Ihr Unternehmen nennen.",
      ] },
      { h: "Was Sie danach erhalten", p: [
        "Eine verständliche Übersicht mit den wichtigsten Lücken und einer Reihenfolge der Maßnahmen — was zuerst, was später und was Sie selbst erledigen können. Ob Sie danach mit uns arbeiten, entscheiden Sie.",
      ] },
    ],
    faq: [
      { q: "Was kostet der Sichtbarkeits-Check?", a: "Nichts. Der Check ist kostenlos und unverbindlich." },
      { q: "Wie lange dauert der Check?", a: "Die Anfrage dauert wenige Minuten. Die Auswertung erhalten Sie in der Regel innerhalb von 24 Stunden." },
    ],
    related: ["lokale-sichtbarkeit", "google-unternehmensprofil", "bewertungen"],
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
              <a key={t.term} href={`/glossar/${t.slug}`} style={{
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

const GLOSSAR_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const glossarLetter = (term: string) => {
  const c = term.charAt(0).toUpperCase()
  return ({ 'Ä': 'A', 'Ö': 'O', 'Ü': 'U' } as Record<string, string>)[c] ?? c
}
const glossarOrigin = () => (typeof window !== 'undefined' ? window.location.origin : '')

const glossarCSS = `
.gl-az a{transition:background-color .2s,color .2s,border-color .2s}
.gl-az a:hover{background:var(--ink);color:#fff;border-color:var(--ink)}
.gl-term{transition:color .2s}
.gl-term:hover{color:var(--electric)}
.gl-term .arw{transition:transform .25s}
.gl-term:hover .arw{transform:translateX(4px)}
.gl-search:focus{outline:none;border-color:var(--electric)}
.gl-faq summary{list-style:none;cursor:pointer}
.gl-faq summary::-webkit-details-marker{display:none}
.gl-faq .gl-plus{transition:transform .25s}
.gl-faq details[open] .gl-plus{transform:rotate(45deg)}
.gl-card{transition:border-color .2s,transform .25s}
.gl-card:hover{border-color:var(--ink);transform:translateY(-2px)}
@media (min-width: 900px){.gl-aside{position:sticky;top:110px}}
`

// /glossar — A–Z-Index nach dem Vorbild agenturro.co/glossar:
// Suche, Buchstabenleiste, Begriffe nach Anfangsbuchstaben, jeder Begriff verlinkt auf seine eigene Seite.
function GlossarPage() {
  usePageMeta(
    'Glossar — Begriffe der lokalen Sichtbarkeit | RAG',
    'Local Pack, NAP-Konsistenz, GEO, strukturierte Daten: die wichtigsten Begriffe rund um Google Maps, lokale Suche und KI-Suche, kurz erklärt.',
  )
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const sorted = [...glossarEntries].sort((a, b) => a.term.localeCompare(b.term, 'de'))
  const visible = query ? sorted.filter(g => (g.term + ' ' + g.short).toLowerCase().includes(query)) : sorted
  const groups = GLOSSAR_ALPHABET
    .map(l => ({ l, items: visible.filter(g => glossarLetter(g.term) === l) }))
    .filter(x => x.items.length > 0)
  const active = new Set(groups.map(g => g.l))
  const origin = glossarOrigin()

  return (
    <>
      <style>{glossarCSS}</style>
      <Nav />
      <main id="inhalt">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: 'Glossar der lokalen Sichtbarkeit',
        inLanguage: 'de',
        url: origin + '/glossar',
        hasDefinedTerm: glossarEntries.map(g => ({
          '@type': 'DefinedTerm',
          name: g.term,
          description: g.short,
          url: origin + '/glossar/' + g.slug,
        })),
      }} />
      <ContentHero
        crumbs={[{ label: 'Start', href: '/' }, { label: 'Glossar' }]}
        kicker="GLOSSAR"
        title={<>Die Begriffe, <span className="serif italic-serif" style={{ color: 'var(--electric-2)' }}>kurz erklärt</span></>}
        sub="Alle Begriffe von A bis Z — mit Suche. Jeder Begriff hat eine eigene Seite mit Erklärung, Praxis-Tipps und häufigen Fragen."
      />
      <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(48px, 6vw, 80px) clamp(20px,4vw,48px) clamp(70px, 8vw, 110px)' }}>
        <div style={{ ...SHELL }}>
          {/* Suche */}
          <label htmlFor="glossar-suche" className="display" style={{ display: 'block', fontSize: 'clamp(18px, 1.8vw, 24px)', marginBottom: 14 }}>
            Für welchen Begriff interessieren Sie sich?
          </label>
          <input
            id="glossar-suche"
            type="search"
            className="gl-search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Begriff suchen …"
            autoComplete="off"
            style={{
              width: '100%', maxWidth: 560, height: 54, padding: '0 20px', fontSize: 16,
              border: '1px solid var(--line)', borderRadius: 999, background: 'var(--bone)', color: 'var(--ink)',
            }}
          />

          {/* Buchstabenleiste */}
          <nav aria-label="Alphabet" className="gl-az" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: 'clamp(28px, 3vw, 40px) 0 clamp(20px, 3vw, 36px)' }}>
            {GLOSSAR_ALPHABET.map(l => active.has(l)
              ? <a key={l} href={`#buchstabe-${l.toLowerCase()}`} className="display" style={{
                  width: 40, height: 40, display: 'grid', placeItems: 'center', fontSize: 15,
                  border: '1px solid var(--line)', borderRadius: 10, color: 'var(--ink)', textDecoration: 'none',
                }}>{l}</a>
              : <span key={l} aria-disabled="true" className="display" style={{
                  width: 40, height: 40, display: 'grid', placeItems: 'center', fontSize: 15,
                  borderRadius: 10, color: 'var(--ink)', opacity: 0.2,
                }}>{l}</span>)}
          </nav>

          {/* Begriffe nach Buchstaben — zwei Spalten mit Buchstabengruppen, Begriffe untereinander */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 440px), 1fr))', columnGap: 'clamp(32px, 5vw, 80px)', alignItems: 'start', borderBottom: '1px solid var(--line)' }}>
            {groups.map(({ l, items }) => (
              <section key={l} id={`buchstabe-${l.toLowerCase()}`} aria-label={l} style={{
                display: 'grid', gridTemplateColumns: 'clamp(52px, 5vw, 80px) minmax(0, 1fr)', gap: 'clamp(12px, 2vw, 28px)',
                padding: 'clamp(22px, 2.6vw, 32px) 0', borderTop: '1px solid var(--line)', scrollMarginTop: 100,
              }}>
                <h2 className="display" style={{ fontSize: 'clamp(30px, 3vw, 44px)', lineHeight: 1, margin: '4px 0 0', color: 'var(--electric)' }}>{l}</h2>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {items.map(g => (
                    <li key={g.slug}>
                      <a href={`/glossar/${g.slug}`} className="gl-term display" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                        padding: '9px 0', fontSize: 'clamp(16px, 1.4vw, 19px)', lineHeight: 1.35, color: 'var(--ink)', textDecoration: 'none',
                      }}>
                        <span>{g.term}</span>
                        <span className="arw" aria-hidden style={{ color: 'var(--electric)', flexShrink: 0 }}>→</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {groups.length === 0 && (
              <div style={{ padding: '40px 0', borderTop: '1px solid var(--line)' }}>
                <p style={{ fontSize: 15.5, color: 'var(--muted)', margin: '0 0 14px' }}>Kein Begriff gefunden.</p>
                <button type="button" onClick={() => setQ('')} className="ul" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--electric)' }}>Suche zurücksetzen</button>
              </div>
            )}
          </div>
        </div>
      </section>
      <ContentCTA />
      </main>
      <Footer />
    </>
  )
}

// /glossar/:slug — eigene Seite pro Begriff: Navigation, nummerierte Abschnitte, FAQ,
// passende Leistung und verwandte Begriffe (wie agenturro.co/glossar/wordpress).
function GlossarTermPage({ slug }: { slug: string }) {
  const g = glossarEntries.find(x => x.slug === slug)
  usePageMeta(
    g ? `${g.term} — einfach erklärt | RAG Glossar` : 'Begriff nicht gefunden | RAG',
    g ? g.short : 'Diesen Begriff gibt es im Glossar nicht.',
    'article',
  )
  if (!g) {
    return (
      <>
        <Nav />
        <main id="inhalt" style={{ padding: '180px clamp(20px,4vw,48px) 120px' }}>
          <div style={{ ...SHELL }}>
            <h1 className="display" style={{ fontSize: 30, marginBottom: 14 }}>Begriff nicht gefunden</h1>
            <a href="/glossar" className="ul" style={{ color: 'var(--electric)', fontWeight: 600 }}>← Zurück zum Glossar</a>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const service = g.service ? modules.find(m => m.slug === g.service) : undefined
  const related = g.related.map(s => glossarEntries.find(x => x.slug === s)).filter((x): x is GlossarEntry => !!x)
  const origin = glossarOrigin()
  const toc = [
    ...g.sections.map((s, i) => ({ id: `abschnitt-${i + 1}`, n: `${i + 1}.`, label: s.h })),
    ...(g.faq.length ? [{ id: 'fragen', n: '', label: 'Häufige Fragen' }] : []),
    ...(service ? [{ id: 'leistung', n: '', label: 'Passende Leistung' }] : []),
  ]

  return (
    <>
      <style>{glossarCSS}</style>
      <Nav />
      <main id="inhalt">
      <article>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: g.term,
        description: g.body,
        url: origin + '/glossar/' + g.slug,
        inLanguage: 'de',
        inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Glossar der lokalen Sichtbarkeit', url: origin + '/glossar' },
      }} />
      {g.faq.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: g.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        }} />
      )}
      <ContentHero
        crumbs={[{ label: 'Start', href: '/' }, { label: 'Glossar', href: '/glossar' }, { label: g.term }]}
        kicker="GLOSSAR"
        title={g.term}
        sub={g.short}
      />

      <section style={{ backgroundColor: 'var(--paper)', padding: 'clamp(48px, 6vw, 84px) clamp(20px,4vw,48px)' }}>
        <div style={{ ...SHELL, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 'clamp(32px, 5vw, 80px)' }}>
          {/* Navigation */}
          <aside className="gl-aside" style={{ flex: '1 1 220px', maxWidth: 300 }}>
            <Kicker>Navigation</Kicker>
            <ol style={{ listStyle: 'none', margin: '18px 0 26px', padding: 0 }}>
              {toc.map(t => (
                <li key={t.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <a href={`#${t.id}`} className="gl-term" style={{ display: 'flex', gap: 10, padding: '11px 0', fontSize: 14, lineHeight: 1.45, color: 'var(--ink)', textDecoration: 'none' }}>
                    <span style={{ color: 'var(--electric)', minWidth: 18 }}>{t.n}</span>
                    <span>{t.label}</span>
                  </a>
                </li>
              ))}
            </ol>
            <a href="/glossar" className="ul" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>← Alle Begriffe im Glossar</a>
          </aside>

          {/* Inhalt */}
          <div style={{ flex: '999 1 480px', maxWidth: 760, minWidth: 0 }}>
            {g.sections.map((s, i) => (
              <section key={s.h} id={`abschnitt-${i + 1}`} style={{ marginBottom: 'clamp(34px, 4vw, 52px)', scrollMarginTop: 100 }}>
                <h2 className="display" style={{ fontSize: 'clamp(21px, 2.1vw, 29px)', lineHeight: 1.22, margin: '0 0 14px' }}>
                  <span style={{ color: 'var(--electric)', marginRight: 10 }}>{i + 1}.</span><span>{s.h}</span>
                </h2>
                {s.p.map((t, j) => (
                  <p key={j} style={{ fontSize: 15.5, lineHeight: 1.85, color: 'var(--muted)', margin: '0 0 14px' }}>{t}</p>
                ))}
              </section>
            ))}

            {g.faq.length > 0 && (
              <section id="fragen" className="gl-faq" style={{ marginBottom: 'clamp(34px, 4vw, 52px)', scrollMarginTop: 100 }}>
                <h2 className="display" style={{ fontSize: 'clamp(21px, 2.1vw, 29px)', lineHeight: 1.22, margin: '0 0 18px' }}>Häufige Fragen</h2>
                <div style={{ borderTop: '1px solid var(--line)' }}>
                  {g.faq.map(f => (
                    <details key={f.q} style={{ borderBottom: '1px solid var(--line)' }}>
                      <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 0' }}>
                        <span className="display" style={{ fontSize: 16.5, lineHeight: 1.4 }}>{f.q}</span>
                        <span className="gl-plus" aria-hidden style={{ fontSize: 22, lineHeight: 1, color: 'var(--electric)', flexShrink: 0 }}>+</span>
                      </summary>
                      <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', margin: '0 0 20px', maxWidth: 680 }}>{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {service && (
              <section id="leistung" style={{ scrollMarginTop: 100 }}>
                <Kicker>Passende Leistung</Kicker>
                <div style={{ marginTop: 18, border: '1px solid var(--line)', borderRadius: 20, padding: 'clamp(24px, 3vw, 36px)' }}>
                  <h2 className="display" style={{ fontSize: 'clamp(20px, 2vw, 28px)', margin: '0 0 10px' }}>{service.label}</h2>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', margin: '0 0 8px' }}>{service.sentence}</p>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)', margin: '0 0 22px' }}>Wie wir das für Ihr Unternehmen umsetzen, lesen Sie auf der Leistungsseite.</p>
                  <a href={`/services/${service.slug}`} className="btn btn-md btn-ink">Zur Leistungsseite <span className="arw">→</span></a>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
      </article>

      {/* Verwandte Begriffe */}
      {related.length > 0 && (
        <section style={{ backgroundColor: 'var(--bone)', padding: 'clamp(50px, 6vw, 84px) clamp(20px,4vw,48px)' }}>
          <div style={{ ...SHELL }}>
            <Kicker>Das könnte Sie auch interessieren</Kicker>
            <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {related.map(r => (
                <a key={r.slug} href={`/glossar/${r.slug}`} className="gl-card" style={{
                  display: 'flex', flexDirection: 'column', gap: 10, padding: 'clamp(20px, 2.4vw, 28px)',
                  background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 18, textDecoration: 'none', color: 'inherit',
                }}>
                  <span className="display" style={{ fontSize: 18, lineHeight: 1.3 }}>{r.term}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)', flex: 1 }}>{r.short}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--electric)' }}>Begriff ansehen →</span>
                </a>
              ))}
            </div>
            <a href="/glossar" className="ul" style={{ display: 'inline-block', marginTop: 28, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>← Alle Begriffe im Glossar</a>
          </div>
        </section>
      )}
      <ContentCTA />
      </main>
      <Footer />
    </>
  )
}

function ServicesIndex() {
  usePageMeta(
    'Leistungen — woraus lokale Sichtbarkeit besteht | RAG',
    'KI-Suche, Google Maps, Website & Google Search und Social Media: die vier Kanäle lokaler Sichtbarkeit — einzeln erklärt, mit Preisen und Paketen.',
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
            Vier Kanäle, die zusammen darüber entscheiden, ob lokale Kunden Sie finden, verstehen und Ihnen vertrauen: KI-Suche, Google Maps, Google Search und Social Media.
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

// Pakete auf den Leistungsseiten — dieselben Preise wie auf /preise (25.09.2026).
type PriceItemId = 'profile' | PackageId | 'social'
const SERVICE_PACKAGES: Record<string, { intro: string; items: PriceItemId[]; highlight: PriceItemId; combo?: boolean }> = {
  'google-maps-business-profile': { intro: 'Das Google-Profil gibt es einzeln für einmalig 149 € — oder inklusive in einem Website-Paket.', items: ['profile', 'local', 'aiplus'], highlight: 'profile' },
  'website-google-search': { intro: 'Drei Website-Pakete, monatlich abgerechnet. Social Media können Sie zu jedem Paket dazu buchen.', items: ['onepager', 'local', 'aiplus'], highlight: 'local' },
  'ai-search-optimization': { intro: 'Die Sichtbarkeit in der KI-Suche steckt im Paket AI Plus. Local Website legt die Grundlage dafür.', items: ['local', 'aiplus'], highlight: 'aiplus' },
  'social-media': { intro: 'Social Media gibt es einzeln — oder zusammen mit dem Google-Profil oder einem Website-Paket.', items: ['social'], highlight: 'social', combo: true },
}

function priceItem(id: PriceItemId) {
  if (id === 'profile') return { name: PROFILE_PACKAGE.name, tag: PROFILE_PACKAGE.tag, price: PROFILE_PACKAGE.price, unit: 'einmalig', thesis: PROFILE_PACKAGE.thesis, includes: PROFILE_PACKAGE.includes }
  if (id === 'social') return { name: SOCIAL_ADDON.name, tag: 'Auch einzeln', price: SOCIAL_ADDON.price, unit: '/ Monat', thesis: SOCIAL_ADDON.thesis, includes: SOCIAL_ADDON.includes }
  const p = WEBSITE_PACKAGES.find(w => w.id === id)!
  return { name: p.name, tag: p.tag, price: p.price, unit: '/ Monat', thesis: p.thesis, includes: p.includes }
}

function ServicePackages({ slug }: { slug: string }) {
  const cfg = SERVICE_PACKAGES[slug]
  const [pkgOrder, setPkgOrder] = useState<PackageOrder | null>(null)
  const [profileOrder, setProfileOrder] = useState<null | { social: boolean }>(null)
  if (!cfg) return null
  const order = (id: PriceItemId) => {
    if (id === 'profile') setProfileOrder({ social: slug === 'social-media' })
    else if (id === 'social') setPkgOrder({ pkg: null, social: true })
    else setPkgOrder({ pkg: id, social: false })
  }
  const single = cfg.items.length === 1
  return (
    <>
      {pkgOrder && <PackageOrderModal initial={pkgOrder} onClose={() => setPkgOrder(null)} />}
      {profileOrder && <ProfileOrderModal initialSocial={profileOrder.social} onClose={() => setProfileOrder(null)} />}
      <section id="pakete" style={{ backgroundColor: 'var(--bone)', padding: 'clamp(60px, 7vw, 96px) clamp(20px,4vw,48px)', scrollMarginTop: 80 }}>
        <div style={{ ...SHELL }}>
          <Kicker>Pakete & Preise</Kicker>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px 40px', flexWrap: 'wrap', margin: '20px 0 clamp(24px, 3vw, 40px)' }}>
            <h2 className="display" style={{ fontSize: 'clamp(24px, 2.8vw, 38px)', lineHeight: 1.1, margin: 0 }}>Was es kostet</h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: 0, maxWidth: 520 }}>{cfg.intro}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: single ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'clamp(12px, 1.4vw, 18px)' }}>
            {cfg.items.map(id => {
              const it = priceItem(id)
              const hi = id === cfg.highlight
              const dark = hi && id === 'aiplus'
              return (
                <article key={id} style={{ display: 'flex', flexDirection: 'column', padding: 'clamp(22px, 2.4vw, 32px)', borderRadius: 24, backgroundColor: dark ? 'var(--ink)' : '#fff', color: dark ? '#fff' : 'var(--ink)', border: dark ? 'none' : `1px solid ${hi ? 'var(--electric)' : 'var(--line)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <PriceTag dark={dark}>{it.tag}</PriceTag>
                    {hi && !single && <span className="eyebrow" style={{ fontSize: 9.5, color: dark ? 'var(--electric-2)' : 'var(--electric)' }}>Passt hierzu</span>}
                  </div>
                  <h3 className="display" style={{ fontSize: 'clamp(20px, 1.8vw, 25px)', lineHeight: 1.15, margin: '0 0 10px' }}>{it.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                    <span className="display" style={{ fontSize: 'clamp(30px, 2.8vw, 38px)', lineHeight: 1 }}>{it.price} €</span>
                    <span style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,0.55)' : 'var(--muted)' }}>{it.unit}</span>
                  </div>
                  <p style={{ fontSize: 14.5, lineHeight: 1.6, color: dark ? 'rgba(255,255,255,0.7)' : 'var(--muted)', margin: '0 0 16px' }}>{it.thesis}</p>
                  <div style={{ marginBottom: 20, display: single ? 'grid' : 'block', gridTemplateColumns: single ? 'repeat(auto-fit, minmax(240px, 1fr))' : undefined, columnGap: 28 }}>
                    {it.includes.map(x => (
                      <div key={x} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderTop: `1px solid ${dark ? 'var(--line-dark)' : 'var(--line)'}` }}>
                        {checkIcon(dark)}<span style={{ fontSize: 14, lineHeight: 1.5 }}>{x}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => order(id)} className={`btn btn-md ${hi ? 'btn-electric' : 'btn-ink'}`} style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                    Paket anfragen <span className="arw">→</span>
                  </button>
                </article>
              )
            })}
          </div>
          {cfg.combo && (
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)', margin: '18px 0 0' }}>
              Kombinierbar mit: Google-Profil schlüsselfertig (149 € einmalig) · One Pager (30 €/Monat) · Local Website (299 €/Monat) · AI Plus (499 €/Monat).
            </p>
          )}
          <a href="/preise" className="ul" style={{ display: 'inline-block', marginTop: 18, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Alle Pakete und Preise <span aria-hidden style={{ color: 'var(--electric)' }}>→</span></a>
        </div>
      </section>
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
        offers: (SERVICE_PACKAGES[slug]?.items ?? []).map(id => {
          const it = priceItem(id)
          return { '@type': 'Offer', name: it.name, price: it.price, priceCurrency: 'EUR' }
        }),
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
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#get-audit" className="btn btn-lg btn-paper">{data.ctaTitle} <span className="arw">→</span></a>
            {SERVICE_PACKAGES[slug] && <a href="#pakete" className="btn btn-lg btn-outline-dark">Pakete & Preise <span className="arw">→</span></a>}
          </div>
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

      <ServicePackages slug={slug} />

      <section id="get-audit" style={{ backgroundColor: 'var(--paper)', padding: 'clamp(60px, 7vw, 96px) clamp(20px,4vw,48px)' }}>
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

/* desktop nav between tablet and wide: drop the phone, tighten the gaps */
@media (max-width: 1180px) {
  .nav-phone { display: none !important; }
  .nav-links { gap: 20px !important; }
}

:root { --sec-y: clamp(64px, 7vw, 96px); }

/* Startseite: Kanal-Karten und Kanalblöcke (21.09) */
.chan-card {
  display: flex; flex-direction: column; gap: 12px; height: 100%; box-sizing: border-box;
  padding: clamp(22px, 2.2vw, 30px); border: 1px solid var(--line); border-radius: 22px;
  background: var(--paper); color: inherit; text-decoration: none;
  transition: border-color .25s ease, transform .3s ease, box-shadow .3s ease;
}
.chan-card:hover { border-color: var(--electric); transform: translateY(-3px); box-shadow: 0 20px 40px rgba(38,0,255,0.08); }
.chan-num { font-size: 13px; color: var(--electric); letter-spacing: .08em; }
.chan-more { font-size: 13.5px; font-weight: 600; color: var(--electric); margin-top: 6px; }
.chan-arrow { display: inline-block; transition: transform .25s ease; }
.chan-card:hover .chan-arrow { transform: translateY(3px); }
.chan-article:hover .chan-arrow { transform: translateX(4px); }
@media (max-width: 900px) {
  .chan-grid, .chan-head { grid-template-columns: 1fr !important; }
  .chan-rev > :first-child { order: 0 !important; }
}
@media (max-width: 560px) {
  .bc-form { flex-direction: column; border-radius: 22px !important; }
  .bc-form input { padding: 12px 14px !important; }
}

.promo-row-head {
  all: unset; box-sizing: border-box; cursor: pointer; width: 100%;
  display: grid; grid-template-columns: 56px minmax(0, 0.85fr) minmax(0, 1.25fr) 170px;
  column-gap: clamp(16px, 2.4vw, 40px); align-items: center;
  padding: clamp(20px, 2.2vw, 28px) 0;
}
.promo-row-head:focus-visible { outline: 2px solid var(--electric); outline-offset: 4px; border-radius: 6px; }
.promo-row-num { font-size: 13px; color: var(--electric); letter-spacing: 0.08em; align-self: start; padding-top: 6px; }
.promo-row-title { align-self: start; }
.promo-row-change { font-size: 14.5px; line-height: 1.6; color: var(--muted); }
.promo-row-toggle { display: inline-flex; align-items: center; gap: 12px; justify-self: end; }
.promo-row-more { font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; }
.promo-row-icon {
  width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--line);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 20px; line-height: 1; color: var(--ink);
  transition: transform 0.35s ease, background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
}
.promo-row-head:hover .promo-row-icon { border-color: var(--electric); color: var(--electric); }
.promo-row.is-open .promo-row-icon { transform: rotate(45deg); background-color: var(--electric); border-color: var(--electric); color: #fff; }
.promo-row-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s ease; }
.promo-row.is-open .promo-row-panel { grid-template-rows: 1fr; }
.promo-row-body {
  display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.25fr);
  column-gap: clamp(16px, 2.4vw, 40px); row-gap: 18px;
  padding: 0 calc(170px + clamp(16px, 2.4vw, 40px)) clamp(24px, 2.6vw, 34px) calc(56px + clamp(16px, 2.4vw, 40px));
}
.promo-row-items { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); column-gap: 24px; }
.promo-row-items li { display: flex; gap: 10px; font-size: 14px; line-height: 1.5; color: var(--ink); padding: 8px 0; border-top: 1px solid var(--line-soft); }

.ratgeber-link { transition: border-color 0.25s ease; }
.ratgeber-link:hover { border-top-color: var(--electric) !important; }
.ratgeber-link .ratgeber-arrow { transition: transform 0.25s ease; display: inline-block; }
.ratgeber-link:hover .ratgeber-arrow { transform: translateX(4px); }

@media (min-width: 769px) {
  .res-dots { display: none !important; }
}

@media (max-width: 900px) {
  .ratgeber-row { grid-template-columns: 1fr !important; }
  .ratgeber-links { grid-template-columns: 1fr !important; gap: 0 !important; }
  .ratgeber-link { padding: 16px 0 !important; border-top-width: 1px !important; }
  .ratgeber-link .ratgeber-arrow { display: none; }
  .maps-grid { grid-template-columns: 1fr !important; }
  .promo-row-head { grid-template-columns: 36px minmax(0, 1fr) auto; column-gap: 16px; row-gap: 10px; }
  .promo-row-change { grid-column: 2 / 4; grid-row: 2; font-size: 14px; }
  .promo-row-toggle { grid-column: 3; grid-row: 1; align-self: start; }
  .promo-row-more { display: none; }
  .promo-row-body { grid-template-columns: 1fr; padding: 0 0 24px 52px; }
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
      <ChannelOverview />
      <ChannelAI />
      <ChannelMaps />
      <ChannelSearch />
      <ChannelSocial />
      <ChannelSummary />
      <BusinessCheck />
      {/* Ergebnisse vorerst ausgeblendet (16.09) — zum Einblenden wieder aktivieren: <RealResults /> */}
      <FAQ />
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
  if (serviceMatch && SERVICE_REDIRECTS[serviceMatch[1]]) {
    window.location.replace(SERVICE_REDIRECTS[serviceMatch[1]])
    return null
  }
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
  const glossarMatch = path.match(/^\/glossar\/([a-z0-9-]+)\/?$/)
  if (glossarMatch) {
    return <GlossarTermPage slug={glossarMatch[1]} />
  }
  if (/^\/preise\/?$/.test(path)) {
    return <PreisePage />
  }
  if (/^\/glossar\/?$/.test(path)) {
    return <GlossarPage />
  }
  if (path === '/' || path === '/index.html') {
    return <LandingPage />
  }
  return <NotFoundPage />
}

// Unknown URL — real "not found" instead of silently rendering the landing page.
function NotFoundPage() {
  usePageMeta('Seite nicht gefunden | RAG', 'Diese Seite existiert nicht.')
  useEffect(() => {
    let robots = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = 'noindex'
  }, [])
  return (
    <>
      <Nav />
      <main id="inhalt" style={{ backgroundColor: 'var(--ink)', color: '#fff', minHeight: '70vh', padding: '180px clamp(20px,4vw,48px) 120px' }}>
        <div style={{ ...SHELL }}>
          <p className="eyebrow" style={{ color: 'var(--electric-2)', marginBottom: 18 }}>404</p>
          <h1 className="display h-lg" style={{ margin: '0 0 18px' }}>Seite nicht gefunden</h1>
          <p className="lead" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 520, margin: '0 0 32px' }}>Diese Adresse gibt es nicht oder nicht mehr. Hier geht es weiter:</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/" className="btn btn-md btn-paper">Zur Startseite <span className="arw">→</span></a>
            <a href="/services" className="btn btn-md btn-outline-dark">Leistungen</a>
            <a href="/ratgeber" className="btn btn-md btn-outline-dark">Ratgeber</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
