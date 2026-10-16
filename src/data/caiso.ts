import type { ForecastPoint, GridData, HourUsage, Source } from '../types'

// Live data from CAISO's public "Today's Outlook" files: 5-minute rows for the
// current day, Pacific time. Proxied through /caiso (see vite.config.ts, netlify.toml).
//   fuelsource.csv  MW by source          demand.csv     actual + forecast demand, MW
//   co2.csv         tons CO₂/hour by source   netdemand.csv  demand minus wind & solar, MW

// CAISO's all-time peak demand: 52,061 MW on Sept 6, 2022 (heat wave).
export const CAISO_RECORD_MW = 52_061

type Table = { time: string; minutes: number; v: Record<string, number> }[]

function parseCsv(text: string): Table {
  const [head, ...lines] = text.trim().split(/\r?\n/)
  const cols = head.split(',').map((c) => c.trim())
  const rows: Table = []
  for (const line of lines) {
    const cells = line.split(',')
    const [hh, mm] = cells[0].split(':').map(Number)
    const minutes = hh * 60 + mm
    // Files end with a "00:00" row for the next day; stop when time wraps.
    if (rows.length && minutes <= rows[rows.length - 1].minutes) break
    const v: Record<string, number> = {}
    cols.slice(1).forEach((c, i) => {
      const cell = cells[i + 1]?.trim()
      v[c] = cell ? Number(cell) : NaN
    })
    rows.push({ time: cells[0], minutes, v })
  }
  return rows
}

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)

function mixOf(v: Record<string, number>): Record<Source, number> {
  return {
    solar: pos(v['Solar']),
    wind: pos(v['Wind']),
    hydro: pos(v['Small hydro']) + pos(v['Large Hydro']),
    geothermal: pos(v['Geothermal']),
    nuclear: pos(v['Nuclear']),
    batteries: pos(v['Batteries']), // negative = charging; that's load, not supply
    imports: pos(v['Imports']),
    gas: pos(v['Natural Gas']),
    other: pos(v['Biomass']) + pos(v['Biogas']) + pos(v['Coal']) + pos(v['Other']),
  }
}

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)

// CAISO times are Pacific. Turn "HH:MM" on CAISO's current day into a real instant.
function pacificClock(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', timeZoneName: 'longOffset',
    }).formatToParts(now).map((p) => [p.type, p.value]),
  )
  const offset = parts.timeZoneName.replace('GMT', '') || '+00:00'
  return (minutes: number) => {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
    const mm = String(minutes % 60).padStart(2, '0')
    return new Date(`${parts.year}-${parts.month}-${parts.day}T${hh}:${mm}:00${offset}`)
  }
}

async function getCsv(file: string) {
  const res = await fetch(`/caiso/${file}.csv`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`CAISO ${file}: HTTP ${res.status}`)
  return parseCsv(await res.text())
}

export async function loadCaiso(now = new Date()): Promise<GridData> {
  const [fuel, co2, demand, net] = await Promise.all(
    ['fuelsource', 'co2', 'demand', 'netdemand'].map(getCsv),
  )
  const at = pacificClock(now)

  // Carbon intensity per 5-minute row: total tons/hour ÷ total MW supplied.
  // 1 t/MWh = 1000 g/kWh. CAISO's import emissions are its own estimate.
  const co2ByTime = new Map(co2.map((r) => [r.time, sum(r.v)]))
  const observed = fuel
    .map((r) => {
      const mix = mixOf(r.v)
      const supply = sum(mix)
      const tons = co2ByTime.get(r.time)
      return { ...r, mix, supply, ci: tons != null && supply > 0 ? Math.round((tons / supply) * 1000) : null }
    })
    .filter((r) => r.supply > 0)
  if (observed.length < 3) throw new Error('CAISO has too little data for today yet')

  // CAISO sometimes posts the newest mix row before its CO₂ row; use the newest complete one.
  const latest = [...observed].reverse().find((r) => r.ci != null) ?? observed[observed.length - 1]
  const latestDemand = [...demand].reverse().find((r) => Number.isFinite(r.v['Current demand']))
  // Renewable: solar, wind, hydro, geothermal, biomass/biogas. Carbon-free adds nuclear.
  // Batteries and imports are left out of both, since we can't see what they carry.
  const m = latest.mix
  const renewableMW = m.solar + m.wind + m.hydro + m.geothermal + pos(latest.v['Biomass']) + pos(latest.v['Biogas'])

  // Hourly bars: observed hours get the real mix; later hours show CAISO's demand forecast.
  const today: HourUsage[] = []
  const hourlyCi: (number | null)[] = []
  for (let h = 0; h < 24; h++) {
    const inHour = <T extends { minutes: number }>(rows: T[]) => rows.filter((r) => Math.floor(r.minutes / 60) === h)
    const obs = inHour(observed)
    const dem = inHour(demand)
    const actual = avg(dem.map((r) => r.v['Current demand']).filter(Number.isFinite))
    const forecast = avg(dem.map((r) => r.v['Day ahead forecast']).filter(Number.isFinite))
    let mix: Record<Source, number> | null = null
    if (obs.length) {
      const m = mixOf({})
      for (const r of obs) for (const k of Object.keys(m) as Source[]) m[k] += r.mix[k] / obs.length
      const total = sum(m)
      for (const k of Object.keys(m) as Source[]) m[k] /= total
      mix = m
    }
    const cis = obs.map((r) => r.ci).filter((c): c is number => c != null)
    hourlyCi.push(cis.length ? Math.round(avg(cis)) : null)
    const demandMW = Number.isFinite(actual) ? actual : forecast
    if (Number.isFinite(demandMW)) {
      today.push({ at: at(h * 60).toISOString(), demandMW: Math.round(demandMW), mix, isForecast: !obs.length })
    }
  }

  return {
    isDemo: false,
    recordMW: CAISO_RECORD_MW,
    today,
    forecast: buildForecast(observed, net, hourlyCi, at, now, latest.ci),
    forecastNote:
      "Later today is estimated from CAISO's forecast of how much demand wind and solar won't cover. After midnight it assumes a day like today.",
    snapshot: {
      region: 'CAISO grid',
      observedAt: at(latest.minutes).toISOString(),
      carbonIntensity: latest.ci,
      renewableShare: renewableMW / latest.supply,
      carbonFreeShare: (renewableMW + m.nuclear) / latest.supply,
      demandMW: latestDemand ? latestDemand.v['Current demand'] : null,
      mix: latest.mix,
      isEstimated: true, // CAISO estimates import emissions
      source: 'California ISO, Today’s Outlook',
    },
  }
}

// CAISO doesn't publish a carbon forecast, so we estimate one:
// 1. Today, fit carbon intensity against the share of demand that wind and solar
//    don't cover (net demand ÷ demand), then apply CAISO's forecast of that share.
// 2. After midnight, assume the same hour as today (a "persistence" forecast).
function buildForecast(
  observed: { time: string; ci: number | null }[],
  net: Table,
  hourlyCi: (number | null)[],
  at: (minutes: number) => Date,
  now: Date,
  currentCi: number | null,
): ForecastPoint[] {
  const ciByTime = new Map(observed.map((r) => [r.time, r.ci]))
  const pairs = net
    .map((r) => ({ x: r.v['Net demand'] / r.v['Current demand'], y: ciByTime.get(r.time) }))
    .filter((p): p is { x: number; y: number } => Number.isFinite(p.x) && p.y != null)

  let predict: ((x: number) => number) | null = null
  if (pairs.length >= 12) {
    const mx = avg(pairs.map((p) => p.x))
    const my = avg(pairs.map((p) => p.y))
    const sxx = pairs.reduce((s, p) => s + (p.x - mx) ** 2, 0)
    const slope = sxx > 0 ? pairs.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx : 0
    const ys = pairs.map((p) => p.y)
    const [lo, hi] = [Math.min(...ys), Math.max(...ys)]
    predict = (x) => Math.round(Math.min(hi, Math.max(lo, my + slope * (x - mx))))
  }

  const points: ForecastPoint[] = []
  if (currentCi != null) points.push({ at: now.toISOString(), carbonIntensity: currentCi })
  const startHour = new Date(now)
  startHour.setMinutes(0, 0, 0)
  for (let i = 1; i <= 24; i++) {
    const t = new Date(startHour.getTime() + i * 3600_000)
    const minutesFromMidnight = Math.round((t.getTime() - at(0).getTime()) / 60_000)
    let ci: number | null = null
    if (minutesFromMidnight < 24 * 60 && predict) {
      const rows = net.filter((r) => Math.floor(r.minutes / 60) === Math.floor(minutesFromMidnight / 60))
      const x = avg(rows.map((r) => r.v['Net demand forecast'] / r.v['Hour ahead forecast']).filter(Number.isFinite))
      if (Number.isFinite(x)) ci = predict(x)
    } else {
      ci = hourlyCi[Math.floor(minutesFromMidnight / 60) % 24]
    }
    if (ci != null) points.push({ at: t.toISOString(), carbonIntensity: ci })
  }
  return points
}
