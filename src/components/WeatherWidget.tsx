import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, MapPin, Moon, Pencil, Snowflake, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { Weather } from '../data/weather'
import type { Place } from '../location'
import { lookupZip } from '../location'

function iconFor(w: Weather): { icon: LucideIcon; color: string } {
  const s = w.nowSummary
  if (s === 'Clear') return w.isDay ? { icon: Sun, color: '#f2c14e' } : { icon: Moon, color: '#c7c7ff' }
  if (s === 'Partly cloudy') return { icon: CloudSun, color: '#f2c14e' }
  if (s === 'Foggy') return { icon: CloudFog, color: '#aeaeb2' }
  if (s === 'Rain') return { icon: CloudRain, color: '#4f8ff7' }
  if (s === 'Thunderstorms') return { icon: CloudLightning, color: '#a78bfa' }
  if (s === 'Snow') return { icon: Snowflake, color: '#ffffff' }
  return { icon: Cloud, color: '#aeaeb2' }
}

const OTHER_GRID = {
  LADWP: 'This ZIP is probably served by LADWP, the City of LA’s own grid. Its numbers come from the U.S. EIA and run about a day behind, so the grid widgets show a past day, not right now.',
  SMUD: 'This ZIP is probably served by SMUD, Sacramento’s utility, on the BANC grid. Its numbers come from the U.S. EIA and run about a day behind, so the grid widgets show a past day, not right now.',
}

// Small widget: local weather for the viewer's ZIP, and where they change it.
export function WeatherWidget({ place, weather, onPlace }: { place: Place; weather: Weather | null; onPlace: (p: Place) => void }) {
  const [editing, setEditing] = useState(false)
  const [zip, setZip] = useState(place.zip)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const W = weather ? iconFor(weather) : null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onPlace(await lookupZip(zip.trim()))
      setEditing(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="widget p-4 sm:p-5" aria-label="Local weather">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {W ? (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-[#2c2c2e]">
              <W.icon size={22} color={W.color} aria-hidden />
            </span>
          ) : (
            <span className="h-10 w-10 shrink-0 animate-pulse rounded-[11px] bg-[#2c2c2e]" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-2xl font-semibold leading-none tracking-tight sm:text-3xl">
              {weather ? `${weather.nowF}°` : '—'}
            </p>
            <p className="mt-1 truncate text-xs text-white/55">
              {weather
                ? `${weather.nowSummary} · H ${weather.highF}° L ${weather.lowF}°${weather.rainChance >= 20 ? ` · ${weather.rainChance}% rain` : ''}`
                : 'Loading weather…'}
            </p>
          </div>
        </div>
        {!editing && (
          <button onClick={() => { setZip(place.zip); setEditing(true) }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 py-1 pr-2.5 pl-2 text-xs text-white/90 transition hover:bg-white/20"
            aria-label={`Change location, currently ${place.place} ${place.zip}`}>
            <MapPin size={13} className="text-[#7fd67f]" aria-hidden />
            {place.place} · {place.zip}
            <Pencil size={11} className="text-white/50" aria-hidden />
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={submit} className="mt-4">
          <label htmlFor="zip" className="text-xs font-medium text-white/70">Your ZIP code</label>
          <div className="mt-1.5 flex gap-2">
            <input id="zip" inputMode="numeric" autoComplete="postal-code" maxLength={5} autoFocus
              value={zip} onChange={(e) => { setZip(e.target.value.replace(/\D/g, '')); setError(null) }}
              placeholder="94612"
              className="w-28 rounded-xl bg-[#2c2c2e] px-3 py-2 text-base tabular-nums text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-[#7fd67f]" />
            <button type="submit" disabled={busy}
              className="rounded-xl bg-[#7fd67f] px-4 py-2 text-sm font-semibold text-[#1c1c1e] transition hover:brightness-110">
              {busy ? 'Checking…' : 'Update'}
            </button>
            <button type="button" onClick={() => { setEditing(false); setError(null) }}
              className="rounded-xl px-3 py-2 text-sm text-white/60 hover:text-white">
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-[#ff8a80]" role="alert">{error}</p>}
        </form>
      )}

      {place.otherGrid ? (
        <p className="mt-3 text-[11px] leading-relaxed text-[#f2c14e]/90">{OTHER_GRID[place.otherGrid]}</p>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-white/45">
          Live for most of California. The City of Los Angeles (LADWP) and Sacramento (SMUD) run their own grids, and their data arrives about a day late.
        </p>
      )}
    </section>
  )
}
