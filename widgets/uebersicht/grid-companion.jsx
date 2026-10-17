// Grid Companion desktop widget for Übersicht (https://tracesof.net/uebersicht/).
// Copy this file into Übersicht's widgets folder (menu bar icon → Open Widgets Folder).
// It reads a compact summary from the website, so it always agrees with the app.

import { run } from 'uebersicht'

// ---- Settings ----
const ZIP = '94612' // your California ZIP code
const GRID = '' // leave empty to pick from the ZIP, or set 'CAISO', 'LADWP' or 'SMUD'
const SITE = 'https://gridcompanion.netlify.app'

export const command = `curl -s --max-time 25 '${SITE}/api/summary?zip=${ZIP}${GRID ? `&grid=${GRID}` : ''}'`
export const refreshFrequency = 15 * 60 * 1000 // 15 minutes

// Top-right corner of the desktop. Change top/right to move it.
export const className = `
  top: 28px;
  right: 28px;
  width: 300px;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 22px;
  background: rgba(28, 28, 30, 0.92);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  -webkit-backdrop-filter: blur(20px);
  color: #fff;
  font-family: -apple-system, 'SF Pro Text', 'Inter', sans-serif;
  font-size: 12px;
  line-height: 1.35;
`

// Same colours as the website.
const PHASE = {
  clean: { color: '#44a861', mark: '●' },
  'cleaner-later': { color: '#4f8ff7', mark: '◷' },
  mixed: { color: '#f2c14e', mark: '◌' },
  'higher-carbon': { color: '#e5534b', mark: '▲' },
  unavailable: { color: '#aeaeb2', mark: '?' },
}
const GREEN = '#44a861'
const dim = (a) => `rgba(255,255,255,${a})`

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const dayTime = (iso) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric' })

const s = {
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 8px', borderRadius: 999, background: dim(0.12), fontWeight: 500 },
  small: { fontSize: 11, color: dim(0.55) },
  label: { fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: dim(0.45) },
}

export const render = ({ output, error }) => {
  let d
  try {
    d = JSON.parse(output)
  } catch {
    d = null
  }
  if (error || !d || d.error) {
    return (
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Grid Companion</div>
        <div style={{ ...s.small, marginTop: 6 }}>
          {d?.error ?? 'Can’t reach the grid right now. Trying again in 15 minutes.'}
        </div>
      </div>
    )
  }

  const p = PHASE[d.phase.id] ?? PHASE.unavailable
  const status = d.grid.delayed ? `Delayed · ${dayTime(d.observedAt)}` : `Live · ${time(d.observedAt)}`

  return (
    <div>
      {/* Phase and freshness */}
      <div style={s.row}>
        <span style={s.pill}>
          <span style={{ color: p.color }}>{p.mark}</span>
          {d.phase.label}
        </span>
        <span style={{ ...s.small, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: d.grid.delayed ? '#f2c14e' : GREEN }} />
          {status}
        </span>
      </div>

      {/* Demand and mix */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>{d.demandGW ?? '—'}</span>
        <span style={{ fontSize: 16, color: dim(0.6) }}>GW</span>
        <span style={{ ...s.small, marginLeft: 'auto' }}>{d.grid.label} grid demand</span>
      </div>
      {d.mix && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
            {d.mix.map((m) => (
              <div key={m.id} style={{ width: `${m.share * 100}%`, background: m.color }} />
            ))}
          </div>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
            {d.mix.filter((m) => m.share >= 0.05).map((m) => (
              <span key={m.id} style={{ ...s.small, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: m.color }} />
                {Math.round(m.share * 100)}% {m.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div style={{ marginTop: 14, color: dim(0.75) }}>{d.mood}</div>
      <div style={{ marginTop: 8 }}>
        {d.tips.map((t) => (
          <div key={t.id} style={{ ...s.row, padding: '6px 0', borderTop: `1px solid ${dim(0.08)}` }} title={t.detail}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
              <span style={{ ...s.label, width: 44, flexShrink: 0 }}>{t.row}</span>
              <span style={{ fontWeight: 500, color: dim(0.9) }}>{t.label}</span>
            </span>
            <span style={{ fontSize: 11, flexShrink: 0, color: t.timed ? GREEN : dim(0.45) }}>{t.when}</span>
          </div>
        ))}
      </div>

      {/* Weather and link */}
      <div style={{ ...s.row, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${dim(0.08)}` }}>
        <span style={s.small}>
          {d.weather
            ? `${d.weather.place} ${d.weather.nowF}° · ${d.weather.summary} · H ${d.weather.highF}° L ${d.weather.lowF}°`
            : d.place.name}
        </span>
        <span onClick={() => run(`open '${SITE}'`)} style={{ ...s.small, color: GREEN, cursor: 'pointer' }}>Open ↗</span>
      </div>
    </div>
  )
}
