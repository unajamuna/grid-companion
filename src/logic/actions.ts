import type { Action, Context, Project, Row } from './conditions'
import { chilly, cleanerLater, dirty, evening, heatWave, hot, morning, night, rainy, solarRich, weekend } from './conditions'
import { HOME } from './tips/home'
import { PROJECTS } from './tips/projects'
import { SAVE } from './tips/save'
import { TECH } from './tips/tech'
import { UNWIND } from './tips/unwind'

export type { Action, Context, Effort, Goal, Project, Row } from './conditions'

export const ROWS: { id: Row; label: string }[] = [
  { id: 'home', label: 'Around the house' },
  { id: 'tech', label: 'Computers, screens & AI' },
  { id: 'save', label: 'Everyday habits' },
  { id: 'unwind', label: 'Unplug & unwind' },
]
export const PER_ROW = 4
// Leave room for habits even when timing matters, so rows don't all say "Tmrw 8 AM".
const MAX_TIMED: Partial<Record<Row, number>> = { home: 3, tech: 2 }

// Hand-written on purpose: no model is making up energy advice.
// Comfort, health and safety always win over grid timing.
export const ACTIONS: Action[] = [...HOME, ...TECH, ...SAVE, ...UNWIND]

export const effortOf = (a: Action) => a.effort ?? (a.timed ? 'minutes' : 'seconds')
export const goalOf = (a: Action) => a.goal ?? (a.timed ? 'shift' : 'save')

// Stable 0–1 hash, so the picks only change when the slot (or shuffle) changes.
function hash01(key: string) {
  let h = 2166136261 // FNV-1a, then a final mix so nearby keys land far apart
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  h ^= h >>> 16
  h = Math.imul(h, 0x45d9f3b)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

// Picks refresh every two hours. `shuffle` bumps the slot when someone asks for new ideas.
const slotOf = (now: Date, shuffle: number) => `${now.toDateString()}-${Math.floor(now.getHours() / 2)}-${shuffle}`

// Four per row: what fits right now (weather, season, grid) first, grid-timed
// loads when the timing matters, then everything else in rotation.
export function pickRow(row: Row, c: Context, shuffle = 0): Action[] {
  const timingMatters = c.phase.id !== 'mixed' && c.phase.id !== 'unavailable'
  const slot = slotOf(c.now, shuffle)
  // On a shuffle, randomness outweighs small boosts so new ideas actually surface.
  const spread = shuffle ? 30 : 1
  return ACTIONS.filter((a) => a.row === row && (a.fits?.(c) ?? true))
    .map((a) => ({
      a,
      score: (a.boost?.(c) ?? 0) * 10 + (a.timed && timingMatters ? 5 : 0) + hash01(a.id + slot) * spread,
    }))
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a)
    .filter((a, _i, all) => {
      if (!a.timed) return true
      const cap = MAX_TIMED[row] ?? PER_ROW
      return all.filter((b) => b.timed).indexOf(a) < cap
    })
    .slice(0, PER_ROW)
}

// One featured project per week, from those that suit the season.
export function pickProject(c: Context): Project {
  const fit = PROJECTS.filter((p) => p.fits?.(c) ?? true)
  const jan1 = new Date(c.now.getFullYear(), 0, 1)
  const week = Math.floor((c.now.getTime() - jan1.getTime()) / (7 * 86400_000))
  return fit[week % fit.length]
}

// A line of personality for the top of the widget, from the grid, weather and hour.
export function mood(c: Context): string {
  if (heatWave(c) && evening(c)) return 'Everyone’s AC is on. Small moves count double right now.'
  if (solarRich(c)) return 'The sun is doing the heavy lifting. Good time to get things done.'
  if (cleanerLater(c)) return 'Cleaner power is on the way. Line things up for later.'
  if (dirty(c)) return 'Gas is covering the evening shift. Go easy where you can.'
  if (hot(c)) return 'Hot one today. Keep the heat out and the oven off.'
  if (rainy(c)) return 'Rainy day. Cozy up, and skip the line-drying.'
  if (chilly(c) && (evening(c) || night(c))) return 'Chilly night. Layers before the thermostat.'
  if (night(c)) return 'The house is winding down. Check what’s still running.'
  if (morning(c)) return 'Fresh start. A few easy wins before the day gets busy.'
  if (weekend(c)) return 'Weekend mode. Maybe tackle a little project?'
  return 'Nothing to time right now, so here are some easy habits.'
}
