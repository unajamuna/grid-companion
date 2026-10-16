// Proxies EIA's hourly grid data (EIA-930) so the API key stays on the server.
// Only the two datasets and two balancing areas the app uses are allowed through.
// Netlify serves this at /api/eia; vite.config.ts runs the same handler in dev.
//
//   /api/eia?data=fuel&ba=LDWP&start=2026-10-14T00   generation by fuel type, MWh per hour
//   /api/eia?data=demand&ba=BANC&start=2026-10-14T00 demand, MWh per hour
//
// Set EIA_API_KEY in Netlify's environment variables (and in .env for local dev).

const ROUTES = { fuel: 'fuel-type-data', demand: 'region-data' } as const
const AREAS = new Set(['LDWP', 'BANC'])

export default async function handler(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams
  const data = q.get('data') as keyof typeof ROUTES | null
  const ba = q.get('ba') ?? ''
  const start = q.get('start') ?? ''
  if (!data || !(data in ROUTES) || !AREAS.has(ba) || !/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(start)) {
    return json({ error: 'Bad request' }, 400)
  }
  const key = process.env.EIA_API_KEY
  if (!key) return json({ error: 'EIA_API_KEY is not set' }, 500)

  const url = new URL(`https://api.eia.gov/v2/electricity/rto/${ROUTES[data]}/data/`)
  const p = url.searchParams
  p.set('api_key', key)
  p.set('frequency', 'hourly') // UTC, hour ending
  p.append('data[0]', 'value')
  p.append('facets[respondent][]', ba)
  if (data === 'demand') p.append('facets[type][]', 'D')
  p.set('start', start)
  p.set('length', '1000') // ~2 days is a few hundred rows. Unsorted on purpose: sorting takes EIA ~30s.

  let body: { response?: { data?: unknown[] }; error?: unknown }
  try {
    // Netlify stops functions at 10 seconds.
    const res = await fetch(url, { signal: AbortSignal.timeout(9_000) })
    if (!res.ok) return json({ error: `EIA: HTTP ${res.status}` }, 502)
    body = (await res.json()) as typeof body
  } catch {
    return json({ error: 'EIA did not respond' }, 504)
  }
  // EIA reports some failures (like going over the rate limit) inside a 200 response.
  if (body.error || !Array.isArray(body.response?.data)) return json({ error: 'EIA returned an error' }, 502)
  // EIA updates hourly and runs about a day behind, so a short shared cache is plenty
  // and keeps every viewer from spending the key's hourly request budget.
  return json(body.response?.data ?? [], 200, {
    'Cache-Control': 'public, max-age=600',
    // `durable` keeps one copy for every edge node, so a slow EIA fetch is shared site-wide.
    'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=900, stale-while-revalidate=3600',
  })
}

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}

export const config = { path: '/api/eia' }
