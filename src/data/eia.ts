import type { ForecastPoint, GridData, HourUsage, Source } from '../types'

// Day-old data for grids CAISO doesn't cover, from the U.S. EIA's Hourly Electric
// Grid Monitor (EIA-930), through /api/eia (netlify/functions/eia.ts keeps the key).
// EIA publishes generation by fuel about a day late, so this is never shown as live:
// the chart is the most recent full day, and the app gives no real-time timing advice.
//   LDWP  Los Angeles Department of Water and Power
//   BANC  Balancing Authority of Northern California, which includes SMUD

export type EiaArea = 'LDWP' | 'BANC'

const AREAS: Record<EiaArea, { region: string }> = {
  LDWP: { region: 'LADWP grid' },
  BANC: { region: 'BANC grid (SMUD)' },
}

// EIA fuel codes → the app's sources. Imports aren't reported, so they're left out.
const SOURCE: Record<string, Source> = {
  SUN: 'solar', SNB: 'solar', // SNB: solar with integrated battery storage
  WND: 'wind', WAT: 'hydro', GEO: 'geothermal', NUC: 'nuclear',
  BAT: 'batteries', PS: 'batteries', // pumped storage
  NG: 'gas', OIL: 'other', COL: 'other', OTH: 'other',
}

// Rough grams CO₂ per kWh generated. EIA reports no emissions by the hour, so carbon
// intensity is an estimate from the mix. "Other" is unspecified, so it gets a middling
// value. Storage is left out: it re-releases power made earlier.
const EMISSIONS: Record<string, number> = { NG: 450, OIL: 650, COL: 1000, OTH: 300 }
const STORAGE = new Set(['BAT', 'PS'])

type Row = { period: string; fueltype?: string; value: string | number | null }

const pacific = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
})
function pacificParts(d: Date) {
  const p = Object.fromEntries(pacific.formatToParts(d).map((x) => [x.type, x.value]))
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) }
}

async function get(data: 'fuel' | 'demand', ba: EiaArea, start: string, retry = true): Promise<Row[]> {
  const res = await fetch(`/api/eia?data=${data}&ba=${ba}&start=${start}`)
  // A cold EIA query can outlast Netlify's 10-second function limit. EIA keeps working
  // on it, so one retry a moment later usually finds it ready.
  if ((res.status === 502 || res.status === 504) && retry) {
    await new Promise((r) => setTimeout(r, 2000))
    return get(data, ba, start, false)
  }
  if (!res.ok) throw new Error(`EIA ${data}: HTTP ${res.status}`)
  return res.json()
}

// EIA's hourly periods are UTC and "hour ending": "2026-10-14T23" covers 22:00–23:00 UTC.
const hourStart = (period: string) => new Date(Date.parse(`${period}:00:00Z`) - 3600_000)
const num = (v: Row['value']) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

type Hour = { start: Date; day: string; hour: number; fuel: Record<string, number>; demand: number | null }

export async function loadEia(ba: EiaArea, now = new Date()): Promise<GridData> {
  // Ask from midnight UTC two days back. The start only changes once a day, so every
  // visitor makes the same request and the shared cache (and EIA's own) stays warm.
  const start = `${new Date(now.getTime() - 54 * 3600_000).toISOString().slice(0, 10)}T00`
  const [fuel, demand] = await Promise.all([get('fuel', ba, start), get('demand', ba, start)])

  const hours = new Map<number, Hour>()
  const hourAt = (period: string) => {
    const s = hourStart(period)
    let h = hours.get(s.getTime())
    if (!h) hours.set(s.getTime(), (h = { start: s, ...pacificParts(s), fuel: {}, demand: null }))
    return h
  }
  for (const r of fuel) if (r.fueltype) hourAt(r.period).fuel[r.fueltype] = num(r.value)
  for (const r of demand) hourAt(r.period).demand = num(r.value) || null

  const generation = (h: Hour) =>
    Object.entries(h.fuel).reduce((s, [k, v]) => s + (STORAGE.has(k) ? 0 : v), 0)
  const withMix = [...hours.values()].filter((h) => generation(h) > 0).sort((a, b) => +a.start - +b.start)
  if (!withMix.length) throw new Error(`EIA has no recent generation data for ${ba}`)

  // Show the most recent day EIA has; if it has only just begun, the day before.
  let day = withMix.at(-1)!.day
  if (withMix.filter((h) => h.day === day).length < 6) day = withMix.findLast((h) => h.day !== day)?.day ?? day
  const dayHours = withMix.filter((h) => h.day === day)
  if (dayHours.length < 3) throw new Error(`EIA has too little data for ${ba}`)

  const mixOf = (h: Hour) => {
    const m: Record<Source, number> = {
      solar: 0, wind: 0, hydro: 0, geothermal: 0, nuclear: 0, batteries: 0, imports: 0, gas: 0, other: 0,
    }
    for (const [k, v] of Object.entries(h.fuel)) if (SOURCE[k]) m[SOURCE[k]] += v
    return m
  }
  const carbon = (h: Hour) =>
    Math.round(Object.entries(h.fuel).reduce((s, [k, v]) => s + v * (EMISSIONS[k] ?? 0), 0) / generation(h))

  const today: HourUsage[] = dayHours.map((h) => ({
    at: h.start.toISOString(),
    demandMW: Math.round(h.demand ?? generation(h)),
    mix: normalize(mixOf(h)),
    isForecast: false,
  }))
  const points: ForecastPoint[] = dayHours.map((h) => ({ at: h.start.toISOString(), carbonIntensity: carbon(h) }))

  const last = dayHours.at(-1)!
  const m = mixOf(last)
  const gen = generation(last)
  const renewable = m.solar + m.wind + m.hydro + m.geothermal
  const yesterday = pacificParts(new Date(now.getTime() - 24 * 3600_000)).day
  const weekday = new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })

  return {
    isDemo: false,
    delayed: true,
    today,
    forecast: [],
    pattern: { day: day === yesterday ? 'Yesterday' : weekday, points },
    forecastNote:
      'Carbon intensity here is our estimate from the mix of power plants (gas about 450 g/kWh, oil 650), not a reported figure. It covers power made inside the area; imports aren’t reported.',
    snapshot: {
      region: AREAS[ba].region,
      observedAt: new Date(last.start.getTime() + 3600_000).toISOString(), // end of the hour
      carbonIntensity: carbon(last),
      renewableShare: renewable / gen,
      carbonFreeShare: (renewable + m.nuclear) / gen,
      demandMW: last.demand,
      mix: m,
      isEstimated: true,
      source: 'U.S. EIA Hourly Electric Grid Monitor',
    },
  }
}

function normalize(m: Record<Source, number>) {
  const total = Object.values(m).reduce((a, b) => a + b, 0) || 1
  for (const k of Object.keys(m) as Source[]) m[k] /= total
  return m
}
