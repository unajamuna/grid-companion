import { House, Moon, Sun, Wind } from 'lucide-react'
import { useState } from 'react'
import type { Reason } from '../logic/explain'
import { explainDay } from '../logic/explain'
import { CLEAN_BAND, fmtTime } from '../logic/phase'
import type { ForecastPoint, Phase } from '../types'

const W = 600
const H = 150
const PAD = { l: 8, r: 8, t: 16, b: 8 }
const GREEN = '#7fd67f'

const REASON_ICON: Record<Reason['kind'], { icon: typeof Sun; color: string }> = {
  sun: { icon: Sun, color: '#f2c14e' },
  wind: { icon: Wind, color: '#4f8ff7' },
  evening: { icon: House, color: '#e5534b' },
  night: { icon: Moon, color: '#c7c7ff' },
}

type Props = {
  phase: Phase
  points: ForecastPoint[]
  current: number | null // today's reading; null for a past day
  pastDay?: string // "Yesterday" etc. when showing delayed data as a pattern
  stat: string // the numbers line under the summary
  how: string // the technical "how we decide" text
}

// Right now, the next 24 hours, and why the day looks the way it does, in one card.
export function DayCard({ phase, points, current, pastDay, stat, how }: Props) {
  const [showHow, setShowHow] = useState(false)
  const past = !!pastDay
  const reasons = explainDay(points, past)

  const chart = points.length >= 2 ? chartParts(points) : null

  return (
    <section className="widget p-4 sm:p-5">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
        {past ? `${pastDay} on your grid` : 'Today on your grid'}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-white/90">{phase.summary}</p>
      <p className="mt-1.5 text-xs text-white/55">{stat}</p>

      {chart && (
        <>
          <div className="mt-5 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-white/90">{past ? `${pastDay}, hour by hour` : 'The next 24 hours'}</h3>
            <p className="text-[11px] text-white/45">{past ? 'est. ' : ''}g CO₂ per kWh</p>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img"
            aria-label={`Carbon per unit of electricity ${past ? 'on a past day' : 'over the next 24 hours'}, from ${chart.min} to ${chart.max} grams per kilowatt-hour; lowest around ${fmtTime(new Date(chart.best.at))}.`}>
            {chart.runs.map(([a, b]) => (
              <rect key={a} x={chart.x(a)} y={PAD.t} width={chart.x(b) - chart.x(a)} height={H - PAD.t - PAD.b}
                fill={GREEN} fillOpacity={0.14} />
            ))}
            <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="white" strokeOpacity={0.15} />
            <path d={chart.area} fill="white" fillOpacity={0.06} />
            <path d={chart.line} fill="none" stroke="white" strokeOpacity={0.85} strokeWidth={2.5} strokeLinejoin="round" />
            {current != null && (
              <>
                <line x1={chart.x(0)} x2={chart.x(0)} y1={PAD.t - 6} y2={H - PAD.b} stroke="white" strokeOpacity={0.4} strokeDasharray="3 3" />
                <circle cx={chart.x(0)} cy={chart.y(current)} r={5} fill="white" />
              </>
            )}
          </svg>
          <div className="relative mt-1 h-4 text-[10px] text-white/50 sm:text-xs">
            {points.map((p, i) =>
              i % 6 === 0 ? (
                <span key={p.at} className="absolute whitespace-nowrap"
                  style={{
                    left: `${(chart.x(i) / W) * 100}%`,
                    transform: i === 0 ? undefined : i === points.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                  }}>
                  {i === 0 && !past ? 'Now' : fmtTime(new Date(p.at))}
                </span>
              ) : null,
            )}
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-white/60">
            <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: GREEN, opacity: 0.5 }} aria-hidden />
            <span>
              <strong className="font-medium text-white/85">Cleaner hours</strong> are when more of the grid’s power comes
              from solar, wind and other low-carbon sources, so using electricity then causes less pollution.
            </span>
          </p>
        </>
      )}

      {reasons.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <h3 className="text-sm font-semibold text-white/90">Why {past ? 'the day looked' : 'today looks'} like this</h3>
          {reasons.map((r) => {
            const R = REASON_ICON[r.kind]
            return (
              <p key={r.kind} className="flex items-start gap-3 text-[13px] leading-relaxed text-white/75">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-[#2c2c2e]">
                  <R.icon size={15} color={R.color} aria-hidden />
                </span>
                {r.text}
              </p>
            )
          })}
        </div>
      )}

      <button onClick={() => setShowHow((v) => !v)} aria-expanded={showHow}
        className="mt-4 text-xs text-white/50 underline decoration-dotted underline-offset-4 hover:text-white">
        {showHow ? 'Hide the details' : 'How we work this out'}
      </button>
      {showHow && <p className="mt-2 text-xs leading-relaxed text-white/60">{how}</p>}
    </section>
  )
}

function chartParts(points: ForecastPoint[]) {
  const values = points.map((p) => p.carbonIntensity)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const threshold = min + (max - min) * CLEAN_BAND
  const lo = min * 0.85
  const hi = max * 1.05
  const x = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.carbonIntensity)}`).join(' ')
  const area = `${line} L${x(points.length - 1)},${H - PAD.b} L${x(0)},${H - PAD.b} Z`
  const best = points.reduce((b, p) => (p.carbonIntensity < b.carbonIntensity ? p : b))
  // Merge consecutive clean hours into single bands so overlapping pieces don't show seams.
  const runs: [number, number][] = []
  points.forEach((p, i) => {
    if (p.carbonIntensity > threshold || i === points.length - 1) return
    const last = runs.at(-1)
    if (last && last[1] === i) last[1] = i + 1
    else runs.push([i, i + 1])
  })
  return { min, max, x, y, line, area, best, runs }
}
