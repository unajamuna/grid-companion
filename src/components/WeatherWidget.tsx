import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, MapPin, Moon, Snowflake, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Weather } from '../data/weather'
import type { Place } from '../location'

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

// Small widget: local weather for the viewer's ZIP (set in the location bar up top).
export function WeatherWidget({ place, weather }: { place: Place; weather: Weather | null }) {
  const W = weather ? iconFor(weather) : null

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
        <p className="shrink-0 text-right text-xs text-white/55">
          <MapPin size={12} className="mr-1 inline align-[-1px] text-[#44a861]" aria-hidden />
          {place.place}
        </p>
      </div>
    </section>
  )
}
