// Builds src/data/typical.json: each grid's average demand for every hour of the day,
// month by month, from three years of EIA-930 hourly demand (2023–2025).
// The chart draws it as the "typical day" line. Run once a year or so:
//   node scripts/make-typical.mjs        (needs EIA_API_KEY in .env)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const key = fs.readFileSync(path.join(root, '.env'), 'utf8').match(/^EIA_API_KEY=(.*)$/m)?.[1]?.trim()
if (!key) throw new Error('EIA_API_KEY missing from .env')

const AREAS = { CAISO: 'CISO', LADWP: 'LDWP', SMUD: 'BANC' }
const FROM = '2023-01-01T08' // midnight Pacific
const TO = '2026-01-01T08'
const YEARS = '2023–2025'
const hourOf = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23', month: 'numeric' })

async function page(ba, offset) {
  const u = new URL('https://api.eia.gov/v2/electricity/rto/region-data/data/')
  const p = u.searchParams
  p.set('api_key', key)
  p.set('frequency', 'hourly')
  p.append('data[0]', 'value')
  p.append('facets[respondent][]', ba)
  p.append('facets[type][]', 'D')
  p.set('start', FROM)
  p.set('end', TO)
  p.set('offset', String(offset))
  p.set('length', '5000')
  for (let i = 0; i < 4; i++) {
    const r = await fetch(u, { signal: AbortSignal.timeout(90_000) }).catch(() => null)
    if (r?.ok) return (await r.json()).response
    console.log(`  retry ${ba} @${offset} (${r?.status ?? 'timeout'})`)
    await new Promise((s) => setTimeout(s, 3000))
  }
  throw new Error(`EIA failed for ${ba}`)
}

const out = { source: `EIA-930 hourly demand, ${YEARS}`, unit: 'MW', grids: {} }
for (const [grid, ba] of Object.entries(AREAS)) {
  const sum = Array.from({ length: 12 }, () => Array(24).fill(0))
  const n = Array.from({ length: 12 }, () => Array(24).fill(0))
  let offset = 0, total = Infinity
  while (offset < total) {
    const res = await page(ba, offset)
    total = Number(res.total)
    for (const row of res.data) {
      const v = Number(row.value)
      if (!Number.isFinite(v) || v <= 0) continue
      // EIA hours are UTC and "hour ending"; use the hour's start, in California time.
      const t = new Date(`${row.period}:00:00Z`).getTime() - 3600_000
      const parts = Object.fromEntries(hourOf.formatToParts(t).map((x) => [x.type, x.value]))
      const m = Number(parts.month) - 1, h = Number(parts.hour)
      sum[m][h] += v
      n[m][h] += 1
    }
    offset += res.data.length
    if (!res.data.length) break
  }
  out.grids[grid] = sum.map((row, m) => row.map((s, h) => (n[m][h] ? Math.round(s / n[m][h]) : null)))
  console.log(grid, `${total} hours`, 'Oct 5 PM avg', out.grids[grid][9][17], 'MW')
}
fs.writeFileSync(path.join(root, 'src', 'data', 'typical.json'), JSON.stringify(out))
console.log('wrote src/data/typical.json')
