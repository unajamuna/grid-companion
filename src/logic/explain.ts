import type { ForecastPoint } from '../types'
import { CLEAN_BAND, fmtTime, HIGH_BAND } from './phase'

// Plain-language reasons for the shape of the day: which hours are cleanest or most
// carbon-heavy, and the likely cause, in the words a neighbour would use.

export type Reason = { kind: 'sun' | 'evening' | 'night' | 'wind'; text: string }

type Run = { start: Date; end: Date }

// Consecutive hours that pass the test, merged into stretches.
function runs(points: ForecastPoint[], test: (v: number) => boolean): Run[] {
  const out: Run[] = []
  points.forEach((p, i) => {
    if (!test(p.carbonIntensity) || i === points.length - 1) return
    const start = new Date(p.at)
    const end = new Date(points[i + 1].at)
    const last = out.at(-1)
    if (last && last.end.getTime() === start.getTime()) last.end = end
    else out.push({ start, end })
  })
  return out
}

// The longest stretch is the one worth talking about.
const longest = (rs: Run[]) =>
  rs.reduce<Run | undefined>((b, r) => (!b || +r.end - +r.start > +b.end - +b.start ? r : b), undefined)

const midHour = (r: Run) => new Date((+r.start + +r.end) / 2).getHours()

const onHour = (d: Date) => {
  const h = new Date(d)
  h.setMinutes(0, 0, 0)
  return h
}

// "9 AM–4 PM", dropping a repeated AM/PM: "5–10 PM". Times round to the hour, since
// a stretch that starts "now" would otherwise read "9:20 AM".
function span(r: Run) {
  const a = fmtTime(onHour(r.start))
  const b = fmtTime(onHour(r.end))
  if (a === '12 AM') return `midnight–${b}`
  const [aT, aM] = a.split(' ')
  const [bT, bM] = b.split(' ')
  return aM === bM ? `${aT}–${bT} ${bM}` : `${a}–${b}`
}

export function explainDay(points: ForecastPoint[], past = false): Reason[] {
  if (points.length < 6) return []
  const values = points.map((p) => p.carbonIntensity)
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max - min < 20) return [] // a flat day has no story to tell
  const clean = longest(runs(points, (v) => v <= min + (max - min) * CLEAN_BAND))
  const dirty = longest(runs(points, (v) => v >= min + (max - min) * HIGH_BAND))
  const are = past ? 'were' : 'are'
  const is = past ? 'was' : 'is'

  const reasons: Reason[] = []
  if (clean) {
    const h = midHour(clean)
    reasons.push(
      h >= 8 && h < 17
        ? { kind: 'sun', text: `During the day, solar farms supply a big share of California’s electricity, and solar makes almost no carbon. That’s why about ${span(clean)} ${are} the cleanest hours to use power.` }
        : { kind: 'wind', text: `Around ${span(clean)}, more of the power comes from wind, hydro and other low-carbon sources, so those ${are} the cleanest hours to use power.` },
    )
  }
  if (dirty) {
    // Classify by when it starts: an evening stretch often runs on through the night.
    const h = dirty.start.getHours()
    const throughNight = dirty.end.getDate() !== dirty.start.getDate() && dirty.end.getHours() >= 4
    const until = fmtTime(onHour(dirty.end))
    if (h >= 15 && h < 23) {
      reasons.push({
        kind: 'evening',
        text: throughNight
          ? `As the sun sets, solar fades just as people get home and switch on ACs, heaters, TVs and dishwashers. Gas plants and imported power fill the gap, and with no solar overnight they keep doing so. ${past ? "That made" : "That makes"} ${fmtTime(onHour(dirty.start))} until about ${until} the most carbon-heavy stretch.`
          : `As the sun sets, solar fades just as people get home and switch on ACs, heaters, TVs and dishwashers. Gas plants and imported power fill the gap, so about ${span(dirty)} ${is} the most carbon-heavy stretch.`,
      })
    } else {
      reasons.push({ kind: 'night', text: `Overnight there’s no solar, so gas plants and imported power carry more of the load. Fewer people are using power, but each unit of it is dirtier, so about ${span(dirty)} ${is} the most carbon-heavy stretch.` })
    }
  }
  return reasons
}
