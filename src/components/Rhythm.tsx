import type { ForecastPoint } from '../types'
import { CLEAN_BAND, fmtTime } from '../logic/phase'

const W = 600
const H = 160
const PAD = { l: 8, r: 8, t: 16, b: 28 }

// Today's rhythm: carbon intensity over the next 24h, cleaner stretches shaded.
export function Rhythm({ forecast, current }: { forecast: ForecastPoint[]; current: number | null }) {
  if (forecast.length < 2) return null
  const values = forecast.map((p) => p.carbonIntensity)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const threshold = min + (max - min) * CLEAN_BAND
  const lo = min * 0.85
  const hi = max * 1.05

  const x = (i: number) => PAD.l + (i / (forecast.length - 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b)
  const line = forecast.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.carbonIntensity)}`).join(' ')
  const area = `${line} L${x(forecast.length - 1)},${H - PAD.b} L${x(0)},${H - PAD.b} Z`

  const best = forecast.reduce((b, p) => (p.carbonIntensity < b.carbonIntensity ? p : b))
  const cleanRuns = forecast.map((p) => p.carbonIntensity <= threshold)

  return (
    <section className="rounded-3xl bg-white/60 p-6 backdrop-blur-xl">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-xl">The next 24 hours</h3>
        <p className="text-xs text-muted">g/kWh</p>
      </div>
      <p className="mt-1 text-sm text-muted">
        Cleanest around <strong className="font-medium text-charcoal">{fmtTime(new Date(best.at))}</strong> at{' '}
        {best.carbonIntensity} g/kWh. Shaded stretches are the cleaner windows.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img"
        aria-label={`Carbon intensity forecast ranging from ${min} to ${max} grams per kilowatt-hour; lowest around ${fmtTime(new Date(best.at))}.`}>
        {cleanRuns.map((clean, i) =>
          clean && i < forecast.length - 1 ? (
            <rect key={i} x={x(i)} y={PAD.t} width={x(i + 1) - x(i) + 0.5} height={H - PAD.t - PAD.b}
              className="fill-sage-soft" />
          ) : null,
        )}
        <path d={area} className="fill-dusty/10" />
        <path d={line} fill="none" className="stroke-dusty" strokeWidth={2.5} strokeLinejoin="round" />
        {current != null && (
          <>
            <line x1={x(0)} x2={x(0)} y1={PAD.t - 6} y2={H - PAD.b} className="stroke-charcoal" strokeDasharray="3 3" />
            <circle cx={x(0)} cy={y(current)} r={5} className="fill-charcoal" />
          </>
        )}
        {forecast.map((p, i) =>
          i % 6 === 0 ? (
            <text key={p.at} x={x(i)} y={H - 8}
              textAnchor={i === 0 ? 'start' : i === forecast.length - 1 ? 'end' : 'middle'}
              className="fill-muted text-[11px]">
              {i === 0 ? 'Now' : fmtTime(new Date(p.at))}
            </text>
          ) : null,
        )}
      </svg>
    </section>
  )
}
