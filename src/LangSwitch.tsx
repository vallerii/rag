import { getLang, setLang, type Lang } from './i18n'

// DE / RU switch — see src/i18n. Labels are language codes, never translated.
export default function LangSwitch({ fg = 'var(--ink)', border = 'var(--border)' }: { fg?: string; border?: string }) {
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
