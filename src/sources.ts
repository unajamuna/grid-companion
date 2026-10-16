import type { LucideIcon } from 'lucide-react'
import { Atom, BatteryCharging, Flame, Sun, Wind } from 'lucide-react'
import type { Source } from './types'

// The chart shows five groups rather than every source, so each colour gets a name.
export type Group = 'solar' | 'water' | 'nuclear' | 'batteries' | 'fossil'

// Stack order, bottom to top: clean groups at the base, gas & imports on top
// so fossil use reads as the "cap" of each bar.
export const GROUP_ORDER: Group[] = ['solar', 'water', 'nuclear', 'batteries', 'fossil']

export const GROUPS: Record<Group, { label: string; color: string; icon: LucideIcon; members: Source[] }> = {
  solar: { label: 'Solar', color: '#f2c14e', icon: Sun, members: ['solar'] },
  water: { label: 'Wind & water', color: '#4f8ff7', icon: Wind, members: ['wind', 'hydro', 'geothermal'] },
  nuclear: { label: 'Nuclear & other', color: '#a78bfa', icon: Atom, members: ['nuclear', 'other'] },
  batteries: { label: 'Batteries', color: '#6cc070', icon: BatteryCharging, members: ['batteries'] },
  fossil: { label: 'Gas & imports', color: '#e5534b', icon: Flame, members: ['gas', 'imports'] },
}

// Shares of supply (0–1) per group. Works on MW or on shares.
export function groupMix(mix: Partial<Record<Source, number>>): Record<Group, number> {
  const raw = Object.fromEntries(
    GROUP_ORDER.map((g) => [g, GROUPS[g].members.reduce((s, k) => s + (mix[k] ?? 0), 0)]),
  ) as Record<Group, number>
  const total = Object.values(raw).reduce((a, b) => a + b, 0) || 1
  for (const g of GROUP_ORDER) raw[g] /= total
  return raw
}
