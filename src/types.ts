// The one internal shape every data source gets normalized into.
// Nulls are intentional: the app should never invent a reading to fill a card.
export type GridSnapshot = {
  region: string
  observedAt: string
  carbonIntensity: number | null // gCO₂e per kWh
  renewableShare: number | null // 0–1
  carbonFreeShare: number | null // 0–1
  demandMW: number | null
  mix: Partial<Record<Source, number>> | null // share of supply, 0–1
  isEstimated: boolean | null
  source: string
}

export type Source =
  | 'solar' | 'wind' | 'hydro' | 'geothermal' | 'nuclear' | 'batteries' | 'imports' | 'gas' | 'other'

export type ForecastPoint = {
  at: string
  carbonIntensity: number
}

// One bar in the usage chart: how much power, and what kind.
export type HourUsage = {
  at: string
  demandMW: number
  mix: Record<Source, number> | null // share of supply, 0–1; null for forecast hours
  isForecast: boolean
}

export type GridData = {
  snapshot: GridSnapshot
  forecast: ForecastPoint[] // next ~24h, hourly
  today: HourUsage[] // midnight to midnight, local time
  isDemo: boolean
  forecastNote?: string
}

export type PhaseId = 'clean' | 'cleaner-later' | 'mixed' | 'unavailable'

export type Phase = {
  id: PhaseId
  label: string
  summary: string
  why: string
  windowStart?: Date
  windowEnd?: Date
}

export type TipCategory = 'household' | 'computing' | 'evergreen'
