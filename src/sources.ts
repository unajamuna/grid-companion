import type { LucideIcon } from 'lucide-react'
import { ArrowLeftRight, Atom, BatteryCharging, Droplets, Ellipsis, Flame, Mountain, Sun, Wind } from 'lucide-react'
import type { Source } from './types'

// Stack order in the usage chart, bottom to top: clean sources at the base,
// gas on top so fossil use reads as the "cap" of each bar.
export const SOURCE_ORDER: Source[] = ['solar', 'wind', 'hydro', 'geothermal', 'nuclear', 'batteries', 'imports', 'other', 'gas']

export const SOURCES: Record<Source, { label: string; color: string; icon: LucideIcon }> = {
  solar: { label: 'Solar', color: '#f2c14e', icon: Sun },
  wind: { label: 'Wind', color: '#7fd1c7', icon: Wind },
  hydro: { label: 'Hydro', color: '#4f8ff7', icon: Droplets },
  geothermal: { label: 'Geothermal', color: '#d98ba4', icon: Mountain },
  nuclear: { label: 'Nuclear', color: '#a78bfa', icon: Atom },
  batteries: { label: 'Batteries', color: '#6cc070', icon: BatteryCharging },
  imports: { label: 'Imports', color: '#8e8e93', icon: ArrowLeftRight },
  gas: { label: 'Gas', color: '#f08a4b', icon: Flame },
  other: { label: 'Other', color: '#5c5c60', icon: Ellipsis }, // biomass, biogas, coal, misc
}
