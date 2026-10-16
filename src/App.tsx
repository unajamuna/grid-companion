import { useEffect, useMemo, useState } from 'react'
import { ActionsWidget } from './components/ActionsWidget'
import { Landscape } from './components/Landscape'
import { Learn } from './components/Learn'
import { Rhythm } from './components/Rhythm'
import { UsageWidget } from './components/UsageWidget'
import { WeatherWidget } from './components/WeatherWidget'
import { loadCaiso } from './data/caiso'
import type { Weather } from './data/weather'
import { loadWeather } from './data/weather'
import { sampleGridData } from './data/sample'
import { classify, fmtTime } from './logic/phase'
import type { Place } from './location'
import { loadPlace, savePlace } from './location'
import type { GridData } from './types'

const BUSY_SHARE = 0.9 // demand within 10% of today's peak counts as "busy"
const REFRESH_MS = 5 * 60_000 // CAISO publishes every 5 minutes
const forceDemo = new URLSearchParams(location.search).has('demo')

type Live = { status: 'loading' } | { status: 'live'; data: GridData } | { status: 'failed'; error: string }

export default function App() {
  const [realNow, setRealNow] = useState(() => new Date())
  const [offsetH, setOffsetH] = useState(0)
  const [showWhy, setShowWhy] = useState(false)
  const [place, setPlace] = useState<Place>(loadPlace)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [live, setLive] = useState<Live>({ status: forceDemo ? 'failed' : 'loading', error: 'demo mode' })

  useEffect(() => {
    const t = setInterval(() => setRealNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (forceDemo) return
    let cancelled = false
    const load = () =>
      loadCaiso()
        .then((data) => !cancelled && setLive({ status: 'live', data }))
        .catch((e: Error) => {
          console.warn('Live grid data unavailable:', e)
          // Keep showing the last good reading if we have one; classify() flags it once stale.
          if (!cancelled) setLive((prev) => (prev.status === 'live' ? prev : { status: 'failed', error: e.message }))
        })
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

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
      <div className="grid min-h-screen place-items-center">
        <Landscape />
        <p className="font-display text-lg text-charcoal/70">Checking the grid…</p>
      </div>
    )
  }

  const phase = classify(data, now)
  const { snapshot } = data
  const peakMW = Math.max(...data.today.map((h) => h.demandMW))
  const busy = snapshot.demandMW != null && snapshot.demandMW >= peakMW * BUSY_SHARE

  return (
    <div className="relative min-h-screen">
      <Landscape />
      <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        <header className="flex items-end justify-between gap-4 px-1 text-charcoal">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Grid Companion</h1>
            <p className="text-sm text-charcoal/70">California · CAISO grid</p>
          </div>
          <p className="text-right text-xs text-charcoal/70">
            {isDemo ? 'Sample' : <><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#3f9b4a] align-middle" />Live</>}
            {' · '}
            {fmtTime(new Date(snapshot.observedAt))}
          </p>
        </header>

        {isDemo && (
          <p className="widget mt-4 rounded-2xl px-4 py-2.5 text-xs text-white/75">
            <strong className="font-semibold text-white">Sample data.</strong>{' '}
            {forceDemo
              ? 'Demo mode: plausible numbers for a typical day, not live readings.'
              : "We couldn't reach CAISO just now, so these are plausible numbers for a typical day, not live readings."}
          </p>
        )}

        <main className="mt-5 space-y-5">
          <WeatherWidget place={place} weather={weather} onPlace={setPlace} />
          <UsageWidget today={data.today} snapshot={snapshot} phase={phase} isDemo={isDemo} />
          <ActionsWidget context={{ phase, busy, now, weather }} />

          <section className="widget p-4 sm:p-5">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Right now</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/90">{phase.summary}</p>
            <p className="mt-2 text-xs text-white/55">
              {snapshot.carbonIntensity ?? '—'} g/kWh carbon intensity
              {busy && ' · demand is near today’s peak'}
            </p>
            <button onClick={() => setShowWhy((v) => !v)} aria-expanded={showWhy}
              className="mt-3 text-xs text-white/55 underline decoration-dotted underline-offset-4 hover:text-white">
              {showWhy ? 'Hide why' : `Why “${phase.label}”?`}
            </button>
            {showWhy && (
              <p className="mt-2 text-xs leading-relaxed text-white/70">
                {phase.why} {data.forecastNote}
              </p>
            )}
          </section>

          <Rhythm forecast={data.forecast} current={snapshot.carbonIntensity} />
          <Learn phaseId={phase.id} />
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
          <p>
            Source: {snapshot.source}
            {snapshot.isEstimated && ' (import emissions are CAISO estimates)'}. Phases compare the next 24 hours
            on your grid, not an absolute standard. CAISO reports its whole grid as one, so the grid chart is the same
            across California; weather and tips are local to {place.place}. Weather: Open-Meteo.
          </p>
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
