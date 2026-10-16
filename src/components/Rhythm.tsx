import type { ForecastPoint } from '../types'
import { CLEAN_BAND, fmtTime } from '../logic/phase'

const W = 600
const H = 160
const PAD = { l: 8, r: 8, t: 16, b: 8 }
const GREEN = '#7fd67f'

// Carbon intensity over the next 24h, cleaner stretches shaded green.
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
  // Merge consecutive clean hours into single bands so overlapping pieces don't show seams.
  const runs: [number, number][] = []
  forecast.forEach((p, i) => {
    if (p.carbonIntensity > threshold || i === forecast.length - 1) return
    const last = runs.at(-1)
    if (last && last[1] === i) last[1] = i + 1
    else runs.push([i, i + 1])
  })

  return (
    <section className="widget p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">The next 24 hours</h2>
        <p className="text-[11px] text-white/45 sm:text-xs">g CO₂/kWh</p>
      </div>
      <p className="mt-1 text-xs text-white/55">
        Cleanest around <strong className="font-medium text-white">{fmtTime(new Date(best.at))}</strong> at{' '}
        {best.carbonIntensity} g/kWh.{' '}
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: GREEN, opacity: 0.5 }} /> cleaner windows
        </span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img"
        aria-label={`Carbon intensity forecast ranging from ${min} to ${max} grams per kilowatt-hour; lowest around ${fmtTime(new Date(best.at))}.`}>
        {runs.map(([a, b]) => (
          <rect key={a} x={x(a)} y={PAD.t} width={x(b) - x(a)} height={H - PAD.t - PAD.b}
            fill={GREEN} fillOpacity={0.14} />
        ))}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="white" strokeOpacity={0.15} />
        <path d={area} fill="white" fillOpacity={0.06} />
        <path d={line} fill="none" stroke="white" strokeOpacity={0.85} strokeWidth={2.5} strokeLinejoin="round" />
        {current != null && (
          <>
            <line x1={x(0)} x2={x(0)} y1={PAD.t - 6} y2={H - PAD.b} stroke="white" strokeOpacity={0.4} strokeDasharray="3 3" />
            <circle cx={x(0)} cy={y(current)} r={5} fill="white" />
          </>
        )}
      </svg>
      <div className="relative mt-1 h-4 text-[10px] text-white/50 sm:text-xs">
        {forecast.map((p, i) =>
          i % 6 === 0 ? (
            <span key={p.at} className="absolute whitespace-nowrap"
              style={{
                left: `${(x(i) / W) * 100}%`,
                transform: i === 0 ? undefined : i === forecast.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
              }}>
              {i === 0 ? 'Now' : fmtTime(new Date(p.at))}
            </span>
          ) : null,
        )}
      </div>
    </section>
  )
}
