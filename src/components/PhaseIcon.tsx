import type { LucideProps } from 'lucide-react'
import { CircleHelp, Clock, Flame, Leaf } from 'lucide-react'
import { Spiral } from '../icons'
import type { PhaseId } from '../types'

// Red is shared with "Gas & imports" in the chart on purpose: both mean fossil.
export const PHASE_STYLE: Record<PhaseId, { icon: (p: LucideProps) => React.ReactNode; color: string }> = {
  clean: { icon: Leaf, color: '#6cc070' },
  'cleaner-later': { icon: Clock, color: '#4f8ff7' },
  mixed: { icon: Spiral, color: '#f2c14e' },
  'higher-carbon': { icon: Flame, color: '#e5534b' },
  unavailable: { icon: CircleHelp, color: '#aeaeb2' },
}
