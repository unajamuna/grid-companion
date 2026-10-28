import type { GridId } from '../location'
import table from './typical.json'

// Each grid's average demand for every hour of the day in a given month, from three
// years of EIA hourly data (see scripts/make-typical.mjs). Drawn as the "typical day" line.
export type TypicalDay = { label: string; mw: number[]; source: string }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function typicalDay(grid: GridId, date: Date): TypicalDay | null {
  const month = date.getMonth()
  const mw = (table.grids as Record<string, (number | null)[][]>)[grid]?.[month]
  if (!mw || mw.some((v) => v == null)) return null
  return { label: `Typical ${MONTHS[month]} day`, mw: mw as number[], source: table.source }
}
