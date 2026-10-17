import type { HourUsage } from '../types'

// Where a demand reading sits in the day's range, in plain words, with a tone the
// UI colours: red near the day's peak, green near its low, plain in between.
// Shared by the website's usage widget and the summary that feeds desktop widgets.
export type DemandTone = 'peak' | 'low' | 'moderate'

export const DEMAND_COLOR: Record<DemandTone, string | undefined> = { peak: '#e5534b', low: '#44a861', moderate: undefined }

export function demandLevel(nowMW: number, today: HourUsage[], delayed = false): { tone: DemandTone; text: string } {
  const values = today.map((h) => h.demandMW)
  const [min, max] = [Math.min(...values, nowMW), Math.max(...values, nowMW)]
  const pos = max > min ? (nowMW - min) / (max - min) : 0.5
  const day = delayed ? 'that day' : 'today'
  if (pos >= 0.85) return { tone: 'peak', text: `Near ${day}’s peak` }
  if (pos <= 0.25) return { tone: 'low', text: `Low for ${day}` }
  return { tone: 'moderate', text: `Moderate for ${day}` }
}
