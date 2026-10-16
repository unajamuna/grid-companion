// Where the viewer is, from a ZIP code (Zippopotam.us: free, no key, allows browser
// requests). Used for local weather and tips. Every California ZIP shows CAISO data;
// we flag ZIPs that are probably on a separate grid instead of guessing silently.

export type Place = {
  zip: string
  place: string
  lat: number
  lon: number
  otherGrid: 'LADWP' | 'SMUD' | null // probably on a grid we don't support yet
}

export const DEFAULT_PLACE: Place = { zip: '94612', place: 'Oakland', lat: 37.81, lon: -122.27, otherGrid: null }

// Names Zippopotam returns for ZIPs inside the City of Los Angeles (LADWP territory).
const LADWP = new Set([
  'Los Angeles', 'Van Nuys', 'North Hollywood', 'Sherman Oaks', 'Encino', 'Tarzana', 'Woodland Hills',
  'Canoga Park', 'Reseda', 'Northridge', 'Chatsworth', 'Granada Hills', 'Sylmar', 'Pacoima', 'Sun Valley',
  'San Pedro', 'Wilmington', 'Harbor City', 'Studio City', 'Tujunga', 'Sunland', 'Panorama City', 'Arleta',
  'Mission Hills', 'North Hills', 'Porter Ranch', 'West Hills', 'Winnetka', 'Playa Del Rey', 'Playa Vista',
  'Venice', 'Valley Village', 'Toluca Lake', 'Lake View Terrace',
])
// Places largely inside SMUD's service area (Sacramento County).
const SMUD = new Set([
  'Sacramento', 'Elk Grove', 'Rancho Cordova', 'Citrus Heights', 'Carmichael', 'Fair Oaks', 'Orangevale',
  'Rio Linda', 'North Highlands', 'Antelope', 'Mather', 'Galt', 'Mcclellan', 'Elverta', 'Wilton',
])

export async function lookupZip(zip: string): Promise<Place> {
  if (!/^\d{5}$/.test(zip)) throw new Error('Enter a 5-digit ZIP code.')
  const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
  if (res.status === 404) throw new Error('We couldn’t find that ZIP code.')
  if (!res.ok) throw new Error('ZIP lookup isn’t working right now. Try again soon.')
  const p = (await res.json()).places?.[0]
  if (!p) throw new Error('We couldn’t find that ZIP code.')
  if (p['state abbreviation'] !== 'CA') throw new Error(`That’s in ${p.state}. Grid Companion only covers California for now.`)
  const place: string = p['place name']
  return {
    zip,
    place,
    lat: Number(p.latitude),
    lon: Number(p.longitude),
    otherGrid: LADWP.has(place) ? 'LADWP' : SMUD.has(place) ? 'SMUD' : null,
  }
}

const KEY = 'place'

export function loadPlace(): Place {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Place
      if (/^\d{5}$/.test(p.zip) && Number.isFinite(p.lat) && Number.isFinite(p.lon)) return p
    }
  } catch {
    /* storage blocked or bad value: fall back to the default */
  }
  return DEFAULT_PLACE
}

export function savePlace(p: Place) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}
