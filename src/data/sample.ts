import type { ForecastPoint, GridData, HourUsage, Source } from '../types'

// Demonstration data shaped like a typical autumn day on the CAISO grid:
// solar floods the middle of the day, gas fills in after sunset.
// The numbers are plausible, not measured. The UI labels them as sample data.

// Rough lifecycle emission factors, gCO₂e/kWh.
const FACTORS: Record<Source, number> = {
  solar: 30,
  wind: 12,
  hydro: 20,
  geothermal: 38,
  nuclear: 12,
  batteries: 150, // stores a blend of earlier (mostly solar) power
  imports: 330,
  gas: 450,
  other: 400,
}

function mixAt(hour: number, wobble: number): Record<Source, number> {
  const sun = Math.max(0, Math.sin((Math.PI * (hour - 6.8)) / 11.4))
  const evening = hour >= 17.5 && hour <= 22.5 ? Math.sin((Math.PI * (hour - 17.5)) / 5) : 0
  const nightWind = hour < 6 || hour > 19 ? 0.04 : 0
  const parts = {
    solar: 0.56 * sun,
    wind: 0.08 + nightWind + 0.02 * wobble,
    hydro: 0.07,
    geothermal: 0.03,
    other: 0.01,
    nuclear: 0.08,
    batteries: 0.11 * evening,
    imports: 0.13 - 0.05 * sun,
  }
  const used = Object.values(parts).reduce((a, b) => a + b, 0)
  return { ...parts, gas: Math.max(0.03, 1 - used) }
}

function intensityOf(mix: Record<Source, number>): number {
  const total = Object.values(mix).reduce((a, b) => a + b, 0)
  let sum = 0
  for (const k of Object.keys(mix) as Source[]) sum += (mix[k] / total) * FACTORS[k]
  return Math.round(sum)
}

// CAISO-wide demand, MW: overnight trough, small morning bump, evening peak.
function demandAt(hour: number, wobble: number): number {
  const morning = Math.exp(-((hour - 8) ** 2) / 6)
  const evening = Math.exp(-((hour - 18.5) ** 2) / 8)
  return Math.round(21500 + 3000 * morning + 7500 * evening + 600 * wobble)
}

// Small deterministic wobble so each day looks a little different.
function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280
  return x - Math.floor(x) - 0.5
}

export function sampleGridData(now: Date): GridData {
  const daySeed = now.getFullYear() * 400 + now.getMonth() * 32 + now.getDate()
  const hourOf = (d: Date) => d.getHours() + d.getMinutes() / 60

  const nowMix = mixAt(hourOf(now), seeded(daySeed + now.getHours()))
  const total = Object.values(nowMix).reduce((a, b) => a + b, 0)
  const share = (keys: Source[]) => keys.reduce((s, k) => s + nowMix[k], 0) / total

  const forecast: ForecastPoint[] = []
  const start = new Date(now)
  start.setMinutes(0, 0, 0)
  for (let i = 0; i <= 24; i++) {
    const at = new Date(start.getTime() + i * 3600_000)
    const m = mixAt(at.getHours(), seeded(daySeed + i))
    forecast.push({ at: at.toISOString(), carbonIntensity: intensityOf(m) })
  }

  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  const today: HourUsage[] = []
  for (let h = 0; h < 24; h++) {
    const at = new Date(midnight.getTime() + h * 3600_000)
    const w = seeded(daySeed + h)
    const m = mixAt(h + 0.5, w)
    const t = Object.values(m).reduce((a, b) => a + b, 0)
    for (const k of Object.keys(m) as Source[]) m[k] /= t
    today.push({ at: at.toISOString(), demandMW: demandAt(h + 0.5, w), mix: h > now.getHours() ? null : m, isForecast: h > now.getHours() })
  }

  return {
    isDemo: true,
    forecast,
    today,
    snapshot: {
      region: 'Bay Area · CAISO',
      observedAt: new Date(now.getTime() - 12 * 60_000).toISOString(),
      carbonIntensity: intensityOf(nowMix),
      renewableShare: share(['solar', 'wind', 'hydro']),
      carbonFreeShare: share(['solar', 'wind', 'hydro', 'nuclear']),
      demandMW: demandAt(hourOf(now), seeded(daySeed + now.getHours())),
      mix: nowMix,
      isEstimated: true,
      source: 'Sample data',
    },
  }
}
