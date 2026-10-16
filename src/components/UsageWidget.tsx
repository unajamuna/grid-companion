import { SOURCE_ORDER, SOURCES } from '../sources'
import type { GridSnapshot, HourUsage, Phase, PhaseId, Source } from '../types'

const PHASE_DOT: Record<PhaseId, { color: string; glyph: string }> = {
  clean: { color: '#6cc070', glyph: '●' },
  'cleaner-later': { color: '#4f8ff7', glyph: '→' },
  mixed: { color: '#f08a4b', glyph: '◐' },
  unavailable: { color: '#8e8e93', glyph: '?' },
}

const hourLabel = (h: number) => (h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`)

// Screen Time–style widget: how much power the grid is using today, and what kind.
export function UsageWidget({ today, snapshot, phase }: { today: HourUsage[]; snapshot: GridSnapshot; phase: Phase }) {
  const gw = snapshot.demandMW == null ? '—' : (snapshot.demandMW / 1000).toFixed(1)
  const dot = PHASE_DOT[phase.id]
  const top = snapshot.mix
    ? (Object.entries(snapshot.mix) as [Source, number][]).sort((a, b) => b[1] - a[1]).slice(0, 4)
    : []
  const total = top.length ? Object.values(snapshot.mix!).reduce((a, b) => a + (b ?? 0), 0) : 1
  const peak = today.reduce((b, h) => (h.demandMW > b.demandMW ? h : b), today[0])
  // Round the axis up to the next 10 GW so summer peaks still fit.
  const scaleMW = Math.max(40_000, Math.ceil(peak.demandMW / 10_000) * 10_000)

  return (
    <section className="grid grid-cols-[1fr_auto] overflow-hidden rounded-[28px] bg-[#1c1c1e] text-white shadow-2xl shadow-black/30 ring-1 ring-white/10">
      <div className="min-w-0 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm text-[#1c1c1e] sm:h-11 sm:w-11"
            style={{ background: dot.color }}
          >
            {dot.glyph}
          </span>
          <p className="text-[34px] font-semibold leading-none tracking-tight sm:text-5xl">
            {gw}
            <span className="ml-1 text-lg font-medium text-white/60 sm:text-2xl">GW</span>
          </p>
        </div>
        <p className="mt-2 truncate text-xs text-white/55">
          Grid demand now · <span className="text-white/85">{phase.label}</span>
        </p>

        <div className="mt-3 flex gap-1.5">
          <div className="relative h-24 flex-1 sm:h-28">
            {[0, 0.5, 1].map((f) => (
              <div key={f} className="absolute inset-x-0 border-t border-white/15" style={{ bottom: `${f * 100}%` }} />
            ))}
            {[0, 6, 12, 18].map((h) => (
              <div key={h} className="absolute inset-y-0 border-l border-dashed border-white/15"
                style={{ left: `${(h / 24) * 100}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end gap-[2px] px-[1px]" role="img"
              aria-label={`Hourly grid demand today, peaking around ${hourLabel(new Date(peak.at).getHours())} at ${(peak.demandMW / 1000).toFixed(1)} gigawatts. Bars are split by energy source; later hours are a forecast.`}>
              {today.map((h) => (
                <div key={h.at} className="flex flex-1 flex-col-reverse overflow-hidden rounded-t-[3px]"
                  style={{ height: `${(h.demandMW / scaleMW) * 100}%` }}>
                  {h.mix ? (
                    SOURCE_ORDER.map((k) => (
                      <div key={k} style={{ height: `${h.mix![k] * 100}%`, background: SOURCES[k].color }} />
                    ))
                  ) : (
                    <div className="h-full bg-white/20" title="Forecast demand" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex h-24 flex-col justify-between text-right text-[10px] leading-none text-white/50 sm:h-28 sm:text-xs">
            <span className="-translate-y-1/2">{scaleMW / 1000} GW</span>
            <span>{scaleMW / 2000}</span>
            <span className="translate-y-1/2">0</span>
          </div>
        </div>
        <div className="mt-1.5 flex pr-8 text-[10px] text-white/50 sm:text-xs">
          {[0, 6, 12, 18].map((h) => (
            <span key={h} className="flex-1">{hourLabel(h)}</span>
          ))}
        </div>
      </div>

      <ul className="flex flex-col justify-around gap-2 bg-[#2c2c2e] px-3 py-4 sm:px-5">
        {top.map(([k, v]) => {
          const S = SOURCES[k]
          return (
            <li key={k} className="flex items-center gap-2.5" title={S.label}>
              <span className="grid h-8 w-8 place-items-center rounded-[9px] sm:h-9 sm:w-9" style={{ background: S.color }}>
                <S.icon size={18} strokeWidth={2.2} color="#1c1c1e" aria-hidden />
              </span>
              <span className="flex w-12 flex-col leading-none">
                <span className="text-lg font-medium tabular-nums text-white/70 sm:text-xl">
                  {Math.round((v / total) * 100)}%
                </span>
                <span className="mt-0.5 text-[10px] text-white/45">{S.label}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
