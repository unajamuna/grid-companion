import type { LucideProps } from 'lucide-react'
import type { ComponentType } from 'react'
import {
  AirVent, BatteryCharging, Blinds, CarFront, Clapperboard, CloudUpload, CookingPot, Cpu, DoorClosed, Droplet,
  Droplets, Fan, Gauge, Heater, Laptop, LampDesk, Lightbulb, Moon, Power, Refrigerator, RefreshCw, Shirt,
  ShowerHead, Snowflake, Sparkles, SunDim, Thermometer, ThermometerSnowflake, TreePine, Tv, Wrench, Filter,
  UtensilsCrossed, WashingMachine, Waves, Wind, TreeDeciduous, BookOpen, Puzzle, Dices, Sun, Sunset,
  Unplug, Microwave, Grid3x3, Bath, CalendarClock, Telescope, Sofa,
} from 'lucide-react'
import { Sock } from '../icons'
import type { Weather } from '../data/weather'
import type { Phase } from '../types'
import { fmtTag, fmtTime, fmtWhen } from './phase'

export type Row = 'home' | 'tech' | 'save' | 'unwind'
export const ROWS: { id: Row; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'tech', label: 'Tech' },
  { id: 'save', label: 'Save' },
  { id: 'unwind', label: 'Unwind' },
]
export const PER_ROW = 4

export type Context = { phase: Phase; busy: boolean; now: Date; weather: Weather | null }

export type Action = {
  id: string
  row: Row
  label: string
  icon: ComponentType<LucideProps>
  when: (c: Context) => string // the short tag under the icon
  detail: (c: Context) => string // the full suggestion when tapped
  note?: string
  timed?: boolean // its best moment depends on the grid
  fits?: (c: Context) => boolean // hidden when false (wrong season, weather, hour)
  boost?: (c: Context) => number // 0–3: how much today's weather or season makes it relevant
}

// ---- When is a flexible load best run? ----
function timed(c: Context): { when: string; phrase: string } {
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

const busyNote = (c: Context) =>
  c.busy && c.phase.id !== 'clean' ? ' Demand is near its daily peak, so waiting also takes some strain off the grid.' : ''

// ---- Weather and season helpers. With no weather, weather-only tips stay hidden. ----
const w = (c: Context) => c.weather
const month = (c: Context) => c.now.getMonth() + 1
const hour = (c: Context) => c.now.getHours()
const daytime = (c: Context) => hour(c) >= 10 && hour(c) < 19
const inMonths = (c: Context, ...ms: number[]) => ms.includes(month(c))
const hot = (c: Context) => (w(c)?.highF ?? 0) >= 85
const warm = (c: Context) => (w(c)?.highF ?? 0) >= 78
const heatWave = (c: Context) => (w(c)?.highF ?? 0) >= 90
const cold = (c: Context) => !!w(c) && (w(c)!.highF < 60 || w(c)!.lowF < 42)
const sunnyDry = (c: Context) => !!w(c) && w(c)!.sunny && w(c)!.rainChance < 30
const coolNight = (c: Context) => warm(c) && (w(c)?.lowF ?? 99) <= 62
const chilly = (c: Context) => !!w(c) && (w(c)!.lowF <= 55 || w(c)!.highF < 65)
const rainy = (c: Context) => (w(c)?.rainChance ?? 0) >= 50
const evening = (c: Context) => hour(c) >= 16 && hour(c) < 21
// The moments when using a little less matters most.
const peakish = (c: Context) => evening(c) || c.busy || c.phase.id === 'higher-carbon'
const holidays = (c: Context) =>
  (month(c) === 11 && c.now.getDate() >= 20) || month(c) === 12 || (month(c) === 1 && c.now.getDate() <= 6)

const AI_NOTE = "We can't see how much energy a specific model or provider uses. This is about grid timing only."
const PGE = "Adapted from PG&E's energy-saving tips."
const SHAKER = "Adapted from the Shaker Heights Energy Subcommittee's tips."
const SMALL = 'A small saving on its own, but small habits add up, and they help most during the 4–9 PM peak.'
const COMFORT = 'Only if it’s comfortable and safe for everyone at home, health permitting.'

// Hand-written on purpose: no model is making up energy advice.
// Comfort, health and safety always win over grid timing.
export const ACTIONS: Action[] = [
  // ---- Home: flexible loads, timed to the grid ----
  { id: 'dishwasher', row: 'home', label: 'Dishwasher', icon: UtensilsCrossed, timed: true, note: PGE,
    when: (c) => timed(c).when,
    detail: (c) => `Run a full dishwasher ${timed(c).phrase}. No need to pre-rinse, and skip the heated dry.${busyNote(c)}` },
  { id: 'laundry', row: 'home', label: 'Laundry', icon: WashingMachine, timed: true, note: PGE,
    when: (c) => timed(c).when,
    detail: (c) => `Start your next full load ${timed(c).phrase}. Dry loads back to back so the dryer is already warm.${busyNote(c)}` },
  { id: 'ev', row: 'home', label: 'EV charge', icon: CarFront, timed: true,
    when: (c) => timed(c).when,
    detail: (c) => `Charge the EV or e-bike ${timed(c).phrase}. Most cars and chargers let you set a start time.${busyNote(c)}` },
  { id: 'devices', row: 'home', label: 'Devices', icon: BatteryCharging, timed: true,
    when: (c) => timed(c).when,
    detail: (c) => `Top up laptops and power banks ${timed(c).phrase}. Small loads, but a good habit.` },
  { id: 'pre-cool', row: 'home', label: 'Pre-cool', icon: Snowflake, note: COMFORT,
    fits: (c) => hot(c) && hour(c) < 16, boost: () => 3,
    when: () => 'Before 4 PM',
    detail: (c) => `It's heading for ${w(c)!.highF}°F. Cool your home a little extra before 4 PM while solar is strong, then ease off through the evening peak.` },
  { id: 'peak-hours', row: 'home', label: 'Peak hours', icon: Gauge,
    fits: (c) => heatWave(c) && hour(c) < 21, boost: () => 3,
    when: () => 'Skip 4–9 PM',
    detail: () => 'On very hot days the grid is most strained from 4 to 9 PM. Run big appliances before or after that window if you can.' },
  { id: 'line-dry', row: 'home', label: 'Line-dry', icon: Shirt,
    fits: (c) => sunnyDry(c) && (w(c)?.highF ?? 0) >= 65 && hour(c) >= 7 && hour(c) < 16, boost: () => 2,
    when: () => 'Today',
    detail: (c) => `${w(c)!.summary} and ${w(c)!.highF}°F with little chance of rain: a good day to hang laundry instead of using the dryer.` },
  { id: 'pool', row: 'home', label: 'Pool pump', icon: Waves, timed: true,
    fits: (c) => inMonths(c, 5, 6, 7, 8, 9),
    when: (c) => timed(c).when,
    detail: (c) => `If you have a pool, run the pump ${timed(c).phrase}. It's one of the biggest flexible loads in a home.` },

  // ---- Tech: computing, timed where it can be ----
  { id: 'ai-batch', row: 'tech', label: 'AI batch', icon: Sparkles, timed: true, note: AI_NOTE,
    when: (c) => timed(c).when,
    detail: (c) => `Got a pile of non-urgent AI tasks? Run them as a batch ${timed(c).phrase}.` },
  { id: 'backups', row: 'tech', label: 'Backups', icon: CloudUpload, timed: true,
    when: (c) => timed(c).when,
    detail: (c) => `Schedule big backups, uploads and exports ${timed(c).phrase}.` },
  { id: 'updates', row: 'tech', label: 'Updates', icon: RefreshCw, timed: true,
    when: (c) => timed(c).when,
    detail: (c) => `Let big software updates install ${timed(c).phrase}.` },
  { id: 'renders', row: 'tech', label: 'Renders', icon: Clapperboard, timed: true,
    when: (c) => timed(c).when,
    detail: (c) => `Queue video renders, exports and other long jobs ${timed(c).phrase}.` },
  { id: 'small-model', row: 'tech', label: 'Small AI', icon: Cpu, note: 'A general rule, not a measurement. Providers rarely publish per-request energy use.',
    when: () => 'Always',
    detail: () => 'For quick questions a smaller AI model is often enough, and fewer regenerations means less compute.' },
  { id: 'sleep', row: 'tech', label: 'Sleep mode', icon: Moon, note: PGE,
    when: () => 'Always',
    detail: () => 'Set computers to sleep after a few idle minutes and hibernate overnight. Screen savers don’t save energy.' },
  { id: 'dim', row: 'tech', label: 'Dim screens', icon: SunDim, note: PGE,
    when: () => 'Anytime',
    detail: () => 'Turn down brightness and switch on eco or energy-saving modes on TVs and game consoles.' },
  { id: 'one-tv', row: 'tech', label: 'One TV', icon: Tv, note: PGE,
    fits: (c) => hour(c) >= 17,
    when: () => 'Tonight',
    detail: () => 'Gather around one screen tonight and switch the others off.' },

  // ---- Save: habits, weather and season first ----
  { id: 'heat-68', row: 'save', label: 'Heat 68°F', icon: Thermometer, note: COMFORT + ' ' + PGE,
    fits: cold, boost: () => 3,
    when: () => 'Today',
    detail: (c) => `It's a cold one (${w(c)!.lowF}–${w(c)!.highF}°F). Setting the heat around 68°F, and lower overnight, saves a lot. A layer helps.` },
  { id: 'ac-78', row: 'save', label: 'AC 78°F', icon: ThermometerSnowflake, note: COMFORT + ' ' + PGE,
    fits: (c) => (w(c)?.highF ?? 0) >= 80 && daytime(c), boost: () => 3,
    when: () => 'Today',
    detail: (c) => `It's heading for ${w(c)!.highF}°F. If you use AC, around 78°F is a good balance of comfort and energy.` },
  { id: 'fan', row: 'save', label: 'Fan first', icon: Fan, note: PGE,
    fits: (c) => warm(c) && daytime(c), boost: () => 2,
    when: () => 'Today',
    detail: () => 'Try a ceiling or desk fan before the AC. Moving air feels a few degrees cooler for a fraction of the energy.' },
  { id: 'blinds', row: 'save', label: 'Blinds', icon: Blinds, note: PGE,
    fits: (c) => !!w(c)?.sunny && ((warm(c) && hour(c) >= 10 && hour(c) < 17) || (cold(c) && hour(c) >= 8 && hour(c) < 16)),
    boost: () => 2,
    when: (c) => (warm(c) ? 'Afternoon' : 'Daytime'),
    detail: (c) => (warm(c)
      ? 'Close blinds and curtains on sunny windows in the afternoon to keep heat out.'
      : 'Open blinds on sunny windows during the day to let the sun warm your home, then close them at dusk to hold the heat in.') },
  { id: 'night-air', row: 'save', label: 'Night air', icon: Wind,
    fits: (c) => coolNight(c) && hour(c) >= 15, boost: () => 2,
    when: () => 'Tonight',
    detail: (c) => `Tonight drops to about ${w(c)!.lowF}°F. Open windows after sunset to cool the house for free, and close them in the morning.` },
  { id: 'drafts', row: 'save', label: 'Drafts', icon: DoorClosed,
    fits: (c) => inMonths(c, 10, 11, 12, 1, 2, 3), boost: (c) => (cold(c) ? 2 : warm(c) ? 0 : 1),
    when: () => 'This season',
    detail: () => 'Check doors and windows for drafts. A door sweep or weatherstripping is cheap and keeps heat in all winter.' },
  { id: 'heater-wrap', row: 'save', label: 'Heater wrap', icon: Heater, note: PGE,
    fits: (c) => inMonths(c, 11, 12, 1, 2), boost: () => 1,
    when: () => 'This season',
    detail: () => 'An insulating blanket on an older water heater cuts heat loss. Keep the air intake vent uncovered.' },
  { id: 'light-timers', row: 'save', label: 'Light timers', icon: TreePine,
    fits: holidays, boost: () => 2,
    when: () => 'This season',
    detail: () => 'Put holiday lights on a timer so they switch off overnight. LED strings use far less than older bulbs.' },
  { id: 'air-filter', row: 'save', label: 'Air filter', icon: Grid3x3, note: SHAKER,
    fits: (c) => inMonths(c, 4, 5, 6, 10, 11), boost: () => 1,
    when: () => 'This season',
    detail: () => 'Check your heating and AC filter every couple of months. Hold it up to a light: if light barely gets through, replace it. A clogged filter makes the system work harder.' },
  { id: 'glass-dish', row: 'save', label: 'Glass dish', icon: CookingPot, note: PGE,
    fits: (c) => inMonths(c, 10, 11, 12, 1, 2, 3, 4),
    when: () => 'When baking',
    detail: () => 'Bake in glass dishes. They hold heat well, so you can usually set the oven about 25°F lower. Run self-clean right after baking, while the oven is hot.' },
  { id: 'task-lamp', row: 'save', label: 'Task lamp', icon: LampDesk, note: PGE,
    boost: (c) => (hour(c) >= 17 ? 1 : 0),
    when: () => 'Evenings',
    detail: () => 'Light your workspace with a small lamp instead of every overhead light in the room.' },
  { id: 'cold-wash', row: 'save', label: 'Cold wash', icon: Droplet, note: PGE,
    when: () => 'Anytime',
    detail: () => "Wash full loads in cold water. About 90% of a washer's energy goes into heating water, and modern detergents work fine cold." },
  { id: 'showers', row: 'save', label: 'Showers', icon: ShowerHead, note: PGE,
    when: () => 'Anytime',
    detail: () => 'Take shorter showers. Try a five-minute song and finish before it ends.' },
  { id: 'tap-off', row: 'save', label: 'Tap off', icon: Droplets, note: PGE,
    when: () => 'Anytime',
    detail: () => 'Turn off the hot tap while brushing teeth, shaving or scrubbing dishes. Use cold water with the garbage disposal.' },
  { id: 'standby', row: 'save', label: 'Standby', icon: Power, note: PGE,
    when: () => 'Anytime',
    detail: () => 'Put chargers, TVs and consoles on a power strip and switch it off when you’re done. Standby power adds up.' },
  { id: 'fridge', row: 'save', label: 'Fridge', icon: Refrigerator, note: PGE,
    when: () => 'Anytime',
    detail: () => 'Keep the fridge at 38–42°F and the freezer at 0–5°F, leave space around it, clean the coils now and then, and switch the ice maker off when you don’t need it.' },
  { id: 'lint', row: 'save', label: 'Lint screen', icon: Filter, note: PGE,
    when: () => 'Every load',
    detail: () => 'Clean the dryer lint screen before every load. A dry towel in the drum can also shorten drying time.' },
  { id: 'leds', row: 'save', label: 'LEDs', icon: Lightbulb, note: PGE,
    when: () => 'Anytime',
    detail: () => 'LED bulbs use about a quarter of the energy of older bulbs and last many times longer. Dimmers and timers help too.' },
  { id: 'eco-mode', row: 'save', label: 'Eco mode', icon: Laptop,
    when: () => 'Anytime',
    detail: () => "Turn on your laptop's power-saving mode. It helps the battery as well." },
  { id: 'low-flow', row: 'save', label: 'Low-flow', icon: Wrench, note: PGE,
    when: () => 'One-time',
    detail: () => 'An efficient showerhead or faucet aerator uses less hot water, usually for under $20.' },
]

// ---- More small habits ----
ACTIONS.push(
  { id: 'daylight', row: 'save', label: 'Daylight', icon: Sun, note: SMALL,
    fits: (c) => hour(c) >= 8 && hour(c) < 16 && (w(c)?.sunny ?? true), boost: () => 1,
    when: () => 'Today',
    detail: () => 'Open the curtains and switch the lights off while it’s bright out.' },
  { id: 'curtains', row: 'save', label: 'Curtains', icon: Sunset, note: SMALL,
    fits: (c) => chilly(c) && hour(c) >= 15 && hour(c) < 21, boost: () => 2,
    when: () => 'At dusk',
    detail: () => 'Close curtains and blinds at dusk to keep the day’s warmth inside.' },
  { id: 'unplug', row: 'save', label: 'Unplug', icon: Unplug, note: PGE,
    when: () => 'Anytime',
    detail: () => 'Unplug small appliances you’re not using, like the coffee maker, toaster and spare chargers. Many draw power even when off.' },
  { id: 'microwave', row: 'save', label: 'Microwave', icon: Microwave, note: SHAKER,
    boost: (c) => (hour(c) >= 17 && hour(c) < 20 ? 1 : 0),
    when: () => 'At dinner',
    detail: () => 'Heating a small portion? A microwave or toaster oven uses about half the energy of the full oven.' },
  { id: 'vents', row: 'save', label: 'Vents', icon: AirVent, note: SHAKER,
    boost: (c) => (warm(c) || cold(c) ? 1 : 0),
    when: () => 'Anytime',
    detail: () => 'Make sure air vents aren’t blocked by furniture, rugs or toys. Air that moves freely takes less energy to heat or cool.' },
  { id: 'water-heater', row: 'save', label: 'Water 120°F', icon: Bath, note: SHAKER,
    when: () => 'One-time',
    detail: () => 'Set the water heater to 120°F. Hotter wastes energy, but don’t go lower: below 120°F bacteria can grow in the tank.' },
  { id: 'schedule', row: 'save', label: 'Schedule', icon: CalendarClock, note: SHAKER,
    boost: (c) => (warm(c) || cold(c) ? 1 : 0),
    when: () => 'One-time',
    detail: () => 'If you have a programmable thermostat, set it to ease off while you’re asleep or away and come back before you are.' },

  // ---- Unwind: cozy, screen-free ways to use a little less, best at peak time ----
  { id: 'socks', row: 'unwind', label: 'Socks', icon: Sock, note: SMALL,
    fits: (c) => chilly(c) && (hour(c) >= 16 || hour(c) < 10), boost: (c) => (peakish(c) ? 3 : 2),
    when: (c) => (hour(c) < 10 ? 'This morning' : 'Tonight'),
    detail: (c) => `Chilly out, down to about ${w(c)!.lowF}°F. Warm socks and a sweater before you reach for the thermostat.` },
  { id: 'blanket', row: 'unwind', label: 'Blanket', icon: Sofa, note: SMALL,
    fits: (c) => chilly(c) && hour(c) >= 17, boost: () => 1,
    when: () => 'Tonight',
    detail: () => 'Curl up under a blanket on the couch instead of warming the whole house.' },
  { id: 'outside', row: 'unwind', label: 'Go outside', icon: TreeDeciduous, note: SMALL,
    fits: (c) => !rainy(c) && hour(c) >= 7 && hour(c) < 21, boost: (c) => (peakish(c) ? 3 : 1),
    when: (c) => (evening(c) ? 'Now' : 'Today'),
    detail: (c) => (evening(c)
      ? 'The grid is busiest from about 4 to 9 PM. A walk, some gardening or a chat on the porch means fewer lights and screens on at home.'
      : 'Get outside while it’s light. Nothing to plug in.') },
  { id: 'read', row: 'unwind', label: 'Read', icon: BookOpen, note: SMALL,
    boost: (c) => (peakish(c) ? 2 : 0),
    when: (c) => (hour(c) >= 16 ? 'Tonight' : 'Anytime'),
    detail: () => 'Swap an hour of TV or scrolling for a book, by one lamp.' },
  { id: 'puzzle', row: 'unwind', label: 'Puzzle', icon: Puzzle, note: SMALL,
    boost: (c) => (peakish(c) ? 2 : 0),
    when: (c) => (hour(c) >= 16 ? 'Tonight' : 'Anytime'),
    detail: () => 'Work on a jigsaw, crossword or sudoku instead of a screen.' },
  { id: 'game-night', row: 'unwind', label: 'Game night', icon: Dices, note: SMALL,
    fits: (c) => hour(c) >= 15, boost: (c) => (peakish(c) ? 2 : 0),
    when: () => 'Tonight',
    detail: () => 'Pull out a board game or a deck of cards. One table lamp, no screens.' },
  { id: 'stargaze', row: 'unwind', label: 'Stargaze', icon: Telescope, note: SMALL,
    fits: (c) => !!w(c)?.sunny && !rainy(c) && (hour(c) >= 19 || hour(c) < 1), boost: () => 1,
    when: () => 'Tonight',
    detail: () => 'Clear skies tonight. Turn the lights off and step outside for a few minutes.' },
)

// Stable 0–1 shuffle per tip per day, so habits rotate daily but don't jump on refresh.
function daily(id: string, now: Date) {
  const key = `${id}${now.toDateString()}`
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return (h % 1000) / 1000
}

// Four per row: today's weather/season tips first, then grid-timed loads when the
// timing matters, then everything else in a daily rotation.
export function pickRow(row: Row, c: Context): Action[] {
  const timingMatters = c.phase.id !== 'mixed' && c.phase.id !== 'unavailable'
  return ACTIONS.filter((a) => a.row === row && (a.fits?.(c) ?? true))
    .map((a) => ({ a, score: (a.boost?.(c) ?? 0) * 10 + (a.timed && timingMatters ? 5 : 0) + daily(a.id, c.now) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, PER_ROW)
    .map((x) => x.a)
}
