// Regions people can pick. Every live region is on the CAISO grid, which reports one
// set of numbers for its whole footprint, so the region changes the weather (and with
// it the tips), not the grid chart. Places on other grids are listed as coming soon.

export type Region = {
  id: string
  name: string
  utility: string // the main utility, to help people recognise their area
  weather: { place: string; lat: number; lon: number }
  grid: 'CAISO' | null // null = separate grid, not supported yet
}

export const REGIONS: Region[] = [
  { id: 'bay-area', name: 'Bay Area', utility: 'PG&E', grid: 'CAISO',
    weather: { place: 'Oakland', lat: 37.8, lon: -122.27 } },
  { id: 'greater-la', name: 'Greater Los Angeles', utility: 'SCE', grid: 'CAISO',
    weather: { place: 'Long Beach', lat: 33.77, lon: -118.19 } },
  { id: 'orange-county', name: 'Orange County', utility: 'SCE / SDG&E', grid: 'CAISO',
    weather: { place: 'Irvine', lat: 33.68, lon: -117.83 } },
  { id: 'inland-empire', name: 'Inland Empire', utility: 'SCE', grid: 'CAISO',
    weather: { place: 'Riverside', lat: 33.95, lon: -117.4 } },
  { id: 'san-diego', name: 'San Diego', utility: 'SDG&E', grid: 'CAISO',
    weather: { place: 'San Diego', lat: 32.72, lon: -117.16 } },
  { id: 'central-valley', name: 'Central Valley', utility: 'PG&E', grid: 'CAISO',
    weather: { place: 'Fresno', lat: 36.74, lon: -119.79 } },
  { id: 'central-coast', name: 'Central Coast', utility: 'PG&E', grid: 'CAISO',
    weather: { place: 'San Luis Obispo', lat: 35.28, lon: -120.66 } },
  { id: 'la-city', name: 'City of Los Angeles', utility: 'LADWP', grid: null,
    weather: { place: 'Los Angeles', lat: 34.05, lon: -118.24 } },
  { id: 'sacramento', name: 'Sacramento', utility: 'SMUD', grid: null,
    weather: { place: 'Sacramento', lat: 38.58, lon: -121.49 } },
]

export const DEFAULT_REGION = REGIONS[0]

const KEY = 'region'

export function loadRegion(): Region {
  try {
    const id = localStorage.getItem(KEY)
    const r = REGIONS.find((x) => x.id === id && x.grid)
    if (r) return r
  } catch {
    /* storage blocked: fall back to the default */
  }
  return DEFAULT_REGION
}

export function saveRegion(r: Region) {
  try {
    localStorage.setItem(KEY, r.id)
  } catch {
    /* ignore */
  }
}
