import { useEffect, useMemo, useState } from 'react'
import { ActionsWidget } from './components/ActionsWidget'
import { Brand } from './components/Brand'
import { DayCard } from './components/DayCard'
import { Landscape } from './components/Landscape'
import { LocationBar } from './components/LocationBar'
import { UsageWidget } from './components/UsageWidget'
import { WeatherWidget } from './components/WeatherWidget'
import { loadCaiso } from './data/caiso'
import { loadEia } from './data/eia'
import type { Weather } from './data/weather'
import { loadWeather } from './data/weather'
import { sampleGridData } from './data/sample'
import { classify, fmtDayTime, fmtTime } from './logic/phase'
import type { Place } from './location'
import { gridFor, loadPlace, savePlace } from './location'
import type { GridData } from './types'

const BUSY_SHARE = 0.9 // demand within 10% of today's peak counts as "busy"
const REFRESH_MS = 5 * 60_000 // CAISO publishes every 5 minutes
const DELAYED_REFRESH_MS = 30 * 60_000 // EIA updates hourly, about a day behind

// CAISO covers most of California live. LADWP and SMUD (on the BANC grid) run their
// own grids, which we only get from EIA, about a day late.
const GRIDS = {
  CAISO: { name: 'CAISO', load: () => loadCaiso(), refreshMs: REFRESH_MS },
  LADWP: { name: 'LADWP', load: () => loadEia('LDWP'), refreshMs: DELAYED_REFRESH_MS },
  SMUD: { name: 'SMUD', load: () => loadEia('BANC'), refreshMs: DELAYED_REFRESH_MS },
}
const forceDemo = new URLSearchParams(location.search).has('demo')

type Live = { status: 'loading' } | { status: 'live'; data: GridData } | { status: 'failed'; error: string }

export default function App() {
  const [realNow, setRealNow] = useState(() => new Date())
  const [offsetH, setOffsetH] = useState(0)
  const [place, setPlace] = useState<Place>(loadPlace)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [live, setLive] = useState<Live>({ status: forceDemo ? 'failed' : 'loading', error: 'demo mode' })

  useEffect(() => {
    const t = setInterval(() => setRealNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const grid = GRIDS[gridFor(place)]
  useEffect(() => {
    if (forceDemo) return
    let cancelled = false
    // A different grid's last reading isn't a fallback for this one.
    setLive((prev) => (prev.status === 'loading' ? prev : { status: 'loading' }))
    const load = () =>
      grid.load()
        .then((data) => !cancelled && setLive({ status: 'live', data }))
        .catch((e: Error) => {
          console.warn('Live grid data unavailable:', e)
          // Keep showing the last good reading if we have one; classify() flags it once stale.
          if (!cancelled) setLive((prev) => (prev.status === 'live' ? prev : { status: 'failed', error: e.message }))
        })
    load()
    const t = setInterval(load, grid.refreshMs)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [grid])

  // Weather only picks which tips fit the day; tips still work without it.
  useEffect(() => {
    let cancelled = false
    setWeather(null)
    savePlace(place)
    const load = () =>
      loadWeather(place)
        .then((w) => !cancelled && setWeather(w))
        .catch((e) => console.warn('Weather unavailable:', e))
    load()
    const t = setInterval(load, 60 * 60_000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [place])

  const isDemo = live.status !== 'live'
  const now = useMemo(
    () => new Date(realNow.getTime() + (isDemo ? offsetH : 0) * 3600_000),
    [realNow, offsetH, isDemo],
  )
  const data = useMemo(() => (live.status === 'live' ? live.data : sampleGridData(now)), [live, now])

  if (live.status === 'loading') {
    return (
      <div className="relative min-h-screen">
        <Landscape />
        <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
          <Brand className="px-1" />
          <LocationBar place={place} onPlace={setPlace} />
          <p className="mt-16 text-center text-lg text-charcoal/70">Checking the {grid.name} grid…</p>
        </div>
      </div>
    )
  }

  const phase = classify(data, now)
  const { snapshot } = data
  const delayed = !!data.delayed
  const peakMW = Math.max(...data.today.map((h) => h.demandMW))
  // A day-old reading says nothing about whether demand is near its peak now.
  const busy = !delayed && snapshot.demandMW != null && snapshot.demandMW >= peakMW * BUSY_SHARE
  const observedAt = new Date(snapshot.observedAt)

  return (
    <div className="relative min-h-screen">
      <Landscape />
      <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        <header className="flex items-center justify-between gap-4 px-1 text-charcoal">
          <Brand />
          <p className="text-right text-xs text-charcoal/70">
            {isDemo ? (
              `Sample · ${fmtTime(observedAt)}`
            ) : delayed ? (
              <><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#c98a1b] align-middle" />Delayed · as of {fmtDayTime(observedAt)}</>
            ) : (
              <><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#3f9b4a] align-middle" />Live · {fmtTime(observedAt)}</>
            )}
          </p>
        </header>

        <LocationBar place={place} onPlace={setPlace} />

        {isDemo && (
          <p className="widget mt-4 rounded-2xl px-4 py-2.5 text-xs text-white/75">
            <strong className="font-semibold text-white">Sample data.</strong>{' '}
            {forceDemo
              ? 'Demo mode: plausible numbers for a typical day, not live readings.'
              : `We couldn't reach ${grid.name}'s data just now, so these are plausible numbers for a typical CAISO day, not real readings.`}
          </p>
        )}

        {delayed && (
          <p className="widget mt-4 rounded-2xl px-4 py-2.5 text-xs text-white/75">
            <strong className="font-semibold text-white">Delayed data.</strong> {grid.name}'s numbers reach the public
            through the U.S. EIA about a day late. You're seeing {data.pattern?.day === 'Yesterday' ? 'yesterday' : (data.pattern?.day ?? 'a past day')}, not
            right now, so we won't suggest timing from it.
          </p>
        )}

        <main className="mt-5 space-y-5">
          <UsageWidget today={data.today} snapshot={snapshot} phase={phase} isDemo={isDemo}
            delayed={delayed} recordMW={data.recordMW} />
          <ActionsWidget context={{ phase, busy, now, weather }} />
          <WeatherWidget place={place} weather={weather} />

          <DayCard
            phase={phase}
            points={delayed && data.pattern ? data.pattern.points : data.forecast}
            current={delayed ? null : snapshot.carbonIntensity}
            pastDay={delayed ? (data.pattern?.day ?? 'A past day') : undefined}
            stat={
              (delayed
                ? `About ${snapshot.carbonIntensity ?? '—'} g CO₂ per kWh at ${fmtDayTime(observedAt)} (our estimate)`
                : `Right now: ${snapshot.carbonIntensity ?? '—'} g CO₂ per kWh`) +
              (busy ? ' · demand is near today’s peak' : '')
            }
            how={`${phase.why} ${data.forecastNote ?? ''}`.trim()}
          />
        </main>

        {isDemo && (
          <section className="widget mt-5 p-4 sm:p-5">
            <label htmlFor="preview" className="flex items-baseline justify-between text-sm">
              <span className="font-medium">Preview another time</span>
              <span className="tabular-nums text-white/55">
                {offsetH === 0 ? 'Now' : `${fmtTime(now)} (+${offsetH}h)`}
              </span>
            </label>
            <input id="preview" type="range" min={0} max={23} value={offsetH}
              onChange={(e) => setOffsetH(Number(e.target.value))}
              className="mt-3 w-full accent-[#7fd67f]" />
            <p className="mt-1 text-xs text-white/55">Demo only. Drag to see how the widgets change through the day.</p>
          </section>
        )}

        <footer className="mt-8 space-y-1 text-center text-xs text-charcoal/80">
          {delayed ? (
            <p>
              Source: {snapshot.source} (EIA-930), which runs about a day behind. Carbon intensity is our estimate
              from the power-plant mix, and power imported into the area isn't reported. Weather and tips are local
              to {place.place}. Weather: Open-Meteo.
            </p>
          ) : (
            <p>
              Source: {snapshot.source}
              {snapshot.isEstimated && ' (import emissions are CAISO estimates)'}. Phases compare the next 24 hours
              on your grid, not an absolute standard. CAISO reports its whole grid as one, so the grid chart is the same
              across most of California; weather and tips are local to {place.place}. Weather: Open-Meteo.
            </p>
          )}
          <p>
            {isDemo ? (
              <a className="underline" href="./">Try live data</a>
            ) : (
              <a className="underline" href="?demo">View the sample day</a>
            )}
          </p>
        </footer>
      </div>
    </div>
  )
}
