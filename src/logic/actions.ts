import type { LucideIcon } from 'lucide-react'
import {
  BatteryCharging, CarFront, CloudUpload, Cpu, Laptop, Lightbulb, Power, RefreshCw,
  Shirt, Sparkles, UtensilsCrossed, WashingMachine,
} from 'lucide-react'
import type { Phase } from '../types'
import { fmtTime } from './phase'

export type Row = 'home' | 'tech' | 'save'
export const ROWS: { id: Row; label: string; tone: string }[] = [
  { id: 'home', label: 'Home', tone: 'text-[#d9a066]' },
  { id: 'tech', label: 'Tech', tone: 'text-[#f3ead9]' },
  { id: 'save', label: 'Save', tone: 'text-[#b8a98f]' },
]

export type Context = { phase: Phase; busy: boolean }

export type Action = {
  id: string
  row: Row
  label: string
  icon: LucideIcon
  when: (c: Context) => string // the short tag under the icon
  detail: (c: Context) => string // the full suggestion when tapped
  note?: string
}

// "Timed" actions are flexible loads whose best moment depends on the grid.
// Hand-written on purpose: no model is making up energy advice, and comfort,
// health and safety always win over grid timing.
function timed(c: Context): { when: string; phrase: string } {
  const { phase, busy } = c
  if (phase.id === 'clean') {
    return {
      when: phase.windowEnd ? `Till ${fmtTime(phase.windowEnd)}` : 'Now',
      phrase: phase.windowEnd ? `now, before about ${fmtTime(phase.windowEnd)}` : 'now',
    }
  }
  if (phase.id === 'cleaner-later' && phase.windowStart) {
    const t = fmtTime(phase.windowStart)
    return { when: `At ${t}`, phrase: `around ${t}, when the grid is cleaner` }
  }
  if (busy) return { when: 'After peak', phrase: 'after the evening peak, once demand eases' }
  return { when: 'Anytime', phrase: "whenever suits you. Timing doesn't matter much right now" }
}

const busyNote = (c: Context) =>
  c.busy && c.phase.id !== 'clean' ? ' Demand is near its daily peak, so waiting also takes some strain off the grid.' : ''

const AI_NOTE = "We can't see how much energy a specific model or provider uses. This is about grid timing only."

export const ACTIONS: Action[] = [
  { id: 'dishwasher', row: 'home', label: 'Dishwasher', icon: UtensilsCrossed,
    when: (c) => timed(c).when,
    detail: (c) => `Run the dishwasher ${timed(c).phrase}. Delay-start makes this easy.${busyNote(c)}` },
  { id: 'laundry', row: 'home', label: 'Laundry', icon: WashingMachine,
    when: (c) => timed(c).when,
    detail: (c) => `If a load can wait, start it ${timed(c).phrase}.${busyNote(c)}` },
  { id: 'ev', row: 'home', label: 'EV charge', icon: CarFront,
    when: (c) => timed(c).when,
    detail: (c) => `Charge the EV or e-bike ${timed(c).phrase}. Most cars and chargers let you set a start time.${busyNote(c)}` },
  { id: 'devices', row: 'home', label: 'Devices', icon: BatteryCharging,
    when: (c) => timed(c).when,
    detail: (c) => `Top up laptops and power banks ${timed(c).phrase}. Small loads, but it's a good habit to build.` },

  { id: 'ai-batch', row: 'tech', label: 'AI batch', icon: Sparkles, note: AI_NOTE,
    when: (c) => timed(c).when,
    detail: (c) => `Got a pile of non-urgent AI tasks? Run them as a batch ${timed(c).phrase}.` },
  { id: 'backups', row: 'tech', label: 'Backups', icon: CloudUpload,
    when: (c) => timed(c).when,
    detail: (c) => `Schedule big backups, uploads and exports ${timed(c).phrase}.` },
  { id: 'updates', row: 'tech', label: 'Updates', icon: RefreshCw,
    when: (c) => timed(c).when,
    detail: (c) => `Let big software updates install ${timed(c).phrase}.` },
  { id: 'small-model', row: 'tech', label: 'Small AI', icon: Cpu, note: 'A general rule, not a measurement. Providers rarely publish per-request energy use.',
    when: () => 'Always',
    detail: () => 'For quick questions a smaller AI model is often enough, and fewer regenerations means less compute.' },

  { id: 'cold-wash', row: 'save', label: 'Cold wash', icon: Shirt,
    when: () => 'Anytime',
    detail: () => "Wash in cold water. Most of a washer's energy goes into heating water." },
  { id: 'standby', row: 'save', label: 'Standby', icon: Power,
    when: () => 'Anytime',
    detail: () => 'Standby power adds up. A switched power strip on the TV or desk corner is an easy win.' },
  { id: 'leds', row: 'save', label: 'LEDs', icon: Lightbulb,
    when: () => 'Anytime',
    detail: () => 'LED bulbs use roughly a quarter of the energy of incandescents and last years longer.' },
  { id: 'power-saving', row: 'save', label: 'Eco mode', icon: Laptop,
    when: () => 'Anytime',
    detail: () => "Turn on your laptop's power-saving mode. It helps the battery as well." },
]
