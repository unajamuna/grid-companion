// A compact snapshot of what the app shows, for desktop widgets (Übersicht today,
// maybe WidgetKit later). It reuses the app's own data loaders and rules, so the
// widget always agrees with the website.
//
//   /api/summary?zip=94612              grid picked from the ZIP, like the site
//   /api/summary?zip=90012&grid=CAISO   override the grid (CAISO, LADWP or SMUD)

// Type-checked with the app's settings (it shares the app's code), which leave out Node's types.
declare const process: { env: Record<string, string | undefined> }

// Netlify runs in UTC; the rules and their wording ("Till 4 PM") are in California time.
process.env.TZ = 'America/Los_Angeles'

import { CAISO_DIRECT, loadCaiso } from '../../src/data/caiso'
import { loadEia } from '../../src/data/eia'
import { loadWeather } from '../../src/data/weather'
import type { GridId } from '../../src/location'
import { GRID_INFO, gridFor, lookupZip } from '../../src/location'
import { effortOf, goalOf, mood, pickProject, pickRow, ROWS } from '../../src/logic/actions'
import { classify } from '../../src/logic/phase'
import { GROUP_ORDER, GROUPS, groupMix } from '../../src/sources'

const BUSY_SHARE = 0.9 // same as App.tsx

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const q = url.searchParams
  const zip = (q.get('zip') ?? '94612').trim()

  let place
  try {
    place = await lookupZip(zip)
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
  const override = q.get('grid')?.toUpperCase()
  if (override && override in GRID_INFO) place = { ...place, gridOverride: override as GridId }
  const grid = gridFor(place)

  const now = new Date()
  let data
  try {
    data = grid === 'CAISO'
      ? await loadCaiso(now, CAISO_DIRECT)
      : await loadEia(grid === 'LADWP' ? 'LDWP' : 'BANC', now, `${url.origin}/api/eia`)
  } catch (e) {
    return json({ error: `Couldn’t reach ${grid} data right now.`, detail: (e as Error).message }, 502)
  }
  const weather = await loadWeather(place).catch(() => null)

  const phase = classify(data, now)
  const { snapshot } = data
  const delayed = !!data.delayed
  const peakMW = Math.max(...data.today.map((h) => h.demandMW))
  const busy = !delayed && snapshot.demandMW != null && snapshot.demandMW >= peakMW * BUSY_SHARE
  const ctx = { phase, busy, now, weather }

  const mix = snapshot.mix ? groupMix(snapshot.mix) : null
  const tips = ROWS.map((row) => {
    const a = pickRow(row.id, ctx)[0]
    if (!a) return null
    const headline = typeof a.headline === 'function' ? a.headline(ctx) : a.headline
    return {
      row: row.label,
      id: a.id,
      label: a.label,
      when: a.when(ctx),
      timed: !!a.timed,
      headline: headline ?? null,
      detail: a.detail(ctx),
      effort: effortOf(a),
      goal: goalOf(a),
    }
  }).filter(Boolean)
  const project = pickProject(ctx)

  return json(
    {
      place: { zip: place.zip, name: place.place },
      grid: { id: grid, label: GRID_INFO[grid].label, live: !delayed && !data.isDemo, delayed },
      observedAt: snapshot.observedAt,
      phase: { id: phase.id, label: phase.label, summary: phase.summary },
      mood: mood(ctx),
      demandGW: snapshot.demandMW == null ? null : Math.round(snapshot.demandMW / 100) / 10,
      busy,
      carbonIntensity: snapshot.carbonIntensity,
      mix: mix
        ? GROUP_ORDER.map((g) => ({ id: g, label: GROUPS[g].label, color: GROUPS[g].color, share: Math.round(mix[g] * 100) / 100 }))
            .sort((a, b) => b.share - a.share)
        : null,
      weather: weather && {
        place: weather.place, nowF: weather.nowF, highF: weather.highF, lowF: weather.lowF,
        summary: weather.nowSummary, isDay: weather.isDay,
      },
      tips,
      project: { label: project.label, impact: project.impact, detail: project.detail },
      generatedAt: now.toISOString(),
    },
    200,
    // Widgets refresh every 15 minutes; CAISO publishes every 5. A short shared cache is plenty.
    { 'Cache-Control': 'public, max-age=120', 'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  )
}

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...headers },
  })
}

export const config = { path: '/api/summary' }
