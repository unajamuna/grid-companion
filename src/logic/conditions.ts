import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import type { Weather } from '../data/weather'
import type { Phase } from '../types'
import { fmtTag, fmtTime, fmtWhen } from './phase'

// Shared vocabulary for the tip library: what a tip looks like, and the
// conditions (grid, weather, season, time of day) tips use to decide when to show.

export type Row = 'home' | 'tech' | 'save' | 'unwind'
export type Context = { phase: Phase; busy: boolean; now: Date; weather: Weather | null }

export type Effort = 'seconds' | 'minutes' | 'project'
// What a tip actually does. Saving, shifting to cleaner hours and easing the
// peak are different things, so the app says which one each tip is.
export type Goal = 'save' | 'shift' | 'peak'

export type Action = {
  id: string
  row: Row
  label: string
  icon: ComponentType<LucideProps>
  when: (c: Context) => string // the short tag under the icon
  detail: (c: Context) => string // the full suggestion when tapped
  headline?: string | ((c: Context) => string) // a line of personality above the detail
  note?: string
  effort?: Effort // default: seconds (minutes for timed loads)
  goal?: Goal // default: save (shift for timed loads)
  timed?: boolean // its best moment depends on the grid
  fits?: (c: Context) => boolean // hidden when false (wrong season, weather, hour)
  boost?: (c: Context) => number // 0–3: how much right now makes it relevant
}

export type Project = {
  id: string
  label: string
  icon: ComponentType<LucideProps>
  detail: string
  impact: 'medium' | 'big'
  goal: Goal
  note?: string
  fits?: (c: Context) => boolean
}

// ---- When is a flexible load best run? ----
export function timed(c: Context): { when: string; phrase: string } {
  const { phase, busy, now } = c
  if (phase.id === 'clean') {
    return {
      when: phase.windowEnd ? `Till ${fmtTime(phase.windowEnd)}` : 'Now',
      phrase: phase.windowEnd ? `now, before about ${fmtTime(phase.windowEnd)}` : 'now',
    }
  }
  if (phase.id === 'cleaner-later' && phase.windowStart) {
    return { when: fmtTag(phase.windowStart, now), phrase: `${fmtWhen(phase.windowStart, now)}, when the grid is cleaner` }
  }
  if (phase.id === 'higher-carbon') {
    return phase.windowStart
      ? { when: fmtTag(phase.windowStart, now), phrase: `${fmtWhen(phase.windowStart, now)} if it can wait. That's when the grid is next clean` }
      : { when: 'If needed', phrase: "only if it can't wait. Nothing much cleaner is expected soon" }
  }
  if (busy) return { when: 'After peak', phrase: 'after the evening peak, once demand eases' }
  return { when: 'Anytime', phrase: "whenever suits you. Timing doesn't matter much right now" }
}

export const busyNote = (c: Context) =>
  c.busy && c.phase.id !== 'clean' ? ' Demand is near its daily peak, so waiting also takes some strain off the grid.' : ''

// ---- Conditions. With no weather, weather-only tips stay hidden. ----
export const w = (c: Context) => c.weather
export const month = (c: Context) => c.now.getMonth() + 1
export const hour = (c: Context) => c.now.getHours()
export const inMonths = (c: Context, ...ms: number[]) => ms.includes(month(c))
export const weekend = (c: Context) => c.now.getDay() === 0 || c.now.getDay() === 6

export const morning = (c: Context) => hour(c) >= 6 && hour(c) < 10
export const daytime = (c: Context) => hour(c) >= 10 && hour(c) < 19
export const evening = (c: Context) => hour(c) >= 16 && hour(c) < 21
export const night = (c: Context) => hour(c) >= 21 || hour(c) < 5

export const hot = (c: Context) => (w(c)?.highF ?? 0) >= 85
export const warm = (c: Context) => (w(c)?.highF ?? 0) >= 78
export const heatWave = (c: Context) => (w(c)?.highF ?? 0) >= 90
export const cold = (c: Context) => !!w(c) && (w(c)!.highF < 60 || w(c)!.lowF < 42)
export const chilly = (c: Context) => !!w(c) && (w(c)!.lowF <= 55 || w(c)!.highF < 65)
export const sunny = (c: Context) => !!w(c)?.sunny
export const rainy = (c: Context) => (w(c)?.rainChance ?? 0) >= 50
export const dry = (c: Context) => !!w(c) && !rainy(c)
export const sunnyDry = (c: Context) => sunny(c) && (w(c)?.rainChance ?? 100) < 30
export const coolNight = (c: Context) => warm(c) && (w(c)?.lowF ?? 99) <= 62
export const holidays = (c: Context) =>
  (month(c) === 11 && c.now.getDate() >= 20) || month(c) === 12 || (month(c) === 1 && c.now.getDate() <= 6)

// Grid moods
export const solarRich = (c: Context) => c.phase.id === 'clean'
export const dirty = (c: Context) => c.phase.id === 'higher-carbon'
export const cleanerLater = (c: Context) => c.phase.id === 'cleaner-later'
// The moments when using a little less matters most.
export const peakish = (c: Context) => evening(c) || c.busy || dirty(c)

// ---- Notes ----
export const AI_NOTE = "We can't see how much energy a specific model or provider uses. This is about grid timing only."
export const AI_RULE = 'A general rule, not a measurement. Providers rarely publish per-request energy use.'
export const PGE = "Adapted from PG&E's energy-saving tips."
export const SHAKER = "Adapted from the Shaker Heights Energy Subcommittee's tips."
export const SMALL = 'A small saving on its own, but small habits add up, and they help most during the 4–9 PM peak.'
export const COMFORT = 'Only if it’s comfortable and safe for everyone at home, health permitting.'
