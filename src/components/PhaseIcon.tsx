import type { LucideProps } from 'lucide-react'
import { CircleHelp, Clock, Flame, Leaf } from 'lucide-react'
import type { PhaseId } from '../types'

// Lucide has no plain spiral, so draw one in the same style (24 grid, round strokes).
function Spiral({ size = 24, strokeWidth = 2, ...rest }: LucideProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M12 12a1.5 1.5 0 0 1 3 0a3 3 0 0 1-6 0a4.5 4.5 0 0 1 9 0a6 6 0 0 1-12 0" />
    </svg>
  )
}

// Red is shared with "Gas & imports" in the chart on purpose: both mean fossil.
export const PHASE_STYLE: Record<PhaseId, { icon: (p: LucideProps) => React.ReactNode; color: string }> = {
  clean: { icon: Leaf, color: '#6cc070' },
  'cleaner-later': { icon: Clock, color: '#4f8ff7' },
  mixed: { icon: Spiral, color: '#f2c14e' },
  'higher-carbon': { icon: Flame, color: '#e5534b' },
  unavailable: { icon: CircleHelp, color: '#aeaeb2' },
}
