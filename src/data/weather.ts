// Today's weather from Open-Meteo (free, no key, allows browser requests).
// Used only to pick which tips fit the day; never shown as a forecast product.

export type Weather = {
  place: string
  nowF: number
  highF: number
  lowF: number
  rainChance: number // 0–100
  sunny: boolean
  summary: string // "Clear", "Cloudy", "Rain"…
}

// WMO weather codes, collapsed to the few words the tips care about.
function describe(code: number): { summary: string; sunny: boolean } {
  if (code <= 1) return { summary: 'Clear', sunny: true }
  if (code === 2) return { summary: 'Partly cloudy', sunny: true }
  if (code === 3) return { summary: 'Cloudy', sunny: false }
  if (code === 45 || code === 48) return { summary: 'Foggy', sunny: false }
  if (code >= 95) return { summary: 'Thunderstorms', sunny: false }
  if (code >= 71 && code <= 86) return { summary: 'Snow', sunny: false }
  return { summary: 'Rain', sunny: false }
}

export async function loadWeather(where: { place: string; lat: number; lon: number }): Promise<Weather> {
  const { place: name, lat, lon } = where
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code' +
    '&current=temperature_2m,weather_code&temperature_unit=fahrenheit' +
    '&timezone=America%2FLos_Angeles&forecast_days=1'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather: HTTP ${res.status}`)
  const j = await res.json()
  const { summary, sunny } = describe(j.daily.weather_code[0])
  return {
    place: name,
    nowF: Math.round(j.current.temperature_2m),
    highF: Math.round(j.daily.temperature_2m_max[0]),
    lowF: Math.round(j.daily.temperature_2m_min[0]),
    rainChance: j.daily.precipitation_probability_max[0] ?? 0,
    sunny,
    summary,
  }
}
