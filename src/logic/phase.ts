import type { GridData, Phase } from '../types'

// Phases are relative to the next 24 hours for this region, not an absolute
// environmental standard. The "why" text says so, every time.
export const CLEAN_BAND = 0.3 // bottom 30% of the day's range counts as "clean"
export const MEANINGFULLY_LOWER = 0.8 // a later window must be ≥20% cleaner to suggest waiting
const STALE_AFTER_MS = 2 * 3600_000

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: 'numeric', minute: d.getMinutes() ? '2-digit' : undefined })

export function classify(data: GridData, now: Date): Phase {
  const { snapshot, forecast } = data
  const current = snapshot.carbonIntensity
  const age = now.getTime() - new Date(snapshot.observedAt).getTime()

  if (current == null || forecast.length < 6 || age > STALE_AFTER_MS) {
    return {
      id: 'unavailable',
      label: 'Data unavailable',
      summary: "We can't see your grid clearly right now, so we're not making a call.",
      why: current == null ? 'The latest reading is missing.' : 'The latest reading is too old to trust.',
    }
  }

  const values = forecast.map((p) => p.carbonIntensity)
  const min = Math.min(...values, current)
  const max = Math.max(...values, current)
  const threshold = min + (max - min) * CLEAN_BAND
  const relative = 'Compared with the next 24 hours on your grid, not an absolute standard.'

  if (current <= threshold) {
    const end = forecast.find((p) => new Date(p.at) > now && p.carbonIntensity > threshold)
    return {
      id: 'clean',
      label: 'Clean window',
      summary: end
        ? `Your grid is in one of its cleanest stretches of the day, likely until about ${fmtTime(new Date(end.at))}.`
        : 'Your grid is in one of its cleanest stretches of the day.',
      why: `${current} g/kWh is in the lowest ${CLEAN_BAND * 100}% of today's range (${min}–${max}). ${relative}`,
      windowEnd: end ? new Date(end.at) : undefined,
    }
  }

  const next12 = forecast.filter((p) => {
    const t = new Date(p.at).getTime()
    return t > now.getTime() && t <= now.getTime() + 12 * 3600_000
  })
  const start = next12.find((p) => p.carbonIntensity <= threshold)
  const best = next12.reduce<(typeof next12)[number] | undefined>(
    (b, p) => (!b || p.carbonIntensity < b.carbonIntensity ? p : b),
    undefined,
  )

  if (start && best && best.carbonIntensity <= current * MEANINGFULLY_LOWER) {
    const at = new Date(start.at)
    const drop = Math.round((1 - best.carbonIntensity / current) * 100)
    return {
      id: 'cleaner-later',
      label: 'Cleaner later',
      summary: `A cleaner window is expected around ${fmtTime(at)}, about ${drop}% lower than now.`,
      why: `Forecast drops to ${best.carbonIntensity} g/kWh from ${current} now. ${relative}`,
      windowStart: at,
    }
  }

  return {
    id: 'mixed',
    label: 'Mixed supply',
    summary: "Conditions don't strongly favor now or later. Do what's convenient.",
    why: `${current} g/kWh, and nothing in the next 12 hours is meaningfully cleaner. ${relative}`,
  }
}
