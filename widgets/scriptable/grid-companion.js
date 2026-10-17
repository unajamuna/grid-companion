// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: leaf;

// Grid Companion widget for Scriptable (iPhone, iPad, and Mac via iPhone widgets).
// Shows what California's grid is doing and small ways to adapt, from the same
// summary the website and desktop widget use.
//
// Set your ZIP per widget: long-press the widget → Edit Widget → Parameter → e.g. 90012
// (optionally add a grid: "90012 CAISO"). With no parameter it uses DEFAULT_ZIP.

const DEFAULT_ZIP = '94612'
const SITE = 'https://gridcompanion.netlify.app'
const REFRESH_MIN = 15

// ---- Colours (same as the website) ----
const C = {
  bg: new Color('#1c1c1e'),
  tile: new Color('#2c2c2e'),
  white: (a = 1) => new Color('#ffffff', a),
  green: new Color('#44a861'),
  red: new Color('#e5534b'),
  yellow: new Color('#f2c14e'),
  blue: new Color('#4f8ff7'),
  purple: new Color('#a78bfa'),
  grey: new Color('#aeaeb2'),
}
const PHASE = { clean: C.green, 'cleaner-later': C.blue, mixed: C.yellow, 'higher-carbon': C.red, unavailable: C.grey }
const LEVEL = { peak: C.red, low: C.green }
const GROUP = { solar: C.yellow, water: C.blue, nuclear: C.purple, batteries: C.green, fossil: C.red }
const STACK = ['solar', 'water', 'nuclear', 'batteries', 'fossil'] // clean at the base, fossil on top
const ROW = { home: 'HOUSE', tech: 'TECH', save: 'HABITS', unwind: 'UNWIND' }
const SHORT = { solar: 'Solar', water: 'Wind+water', nuclear: 'Nuclear', batteries: 'Batteries', fossil: 'Gas+imports' }

// ---- Data ----
const [zipArg, gridArg] = String(args.widgetParameter ?? '').trim().split(/\s+/)
const ZIP = /^\d{5}$/.test(zipArg ?? '') ? zipArg : DEFAULT_ZIP
const GRID = /^(CAISO|LADWP|SMUD)$/i.test(gridArg ?? '') ? gridArg.toUpperCase() : ''

const fm = FileManager.local()
const cachePath = fm.joinPath(fm.cacheDirectory(), `grid-companion-${ZIP}${GRID}.json`)

async function fetchSummary() {
  const req = new Request(`${SITE}/api/summary?zip=${ZIP}${GRID ? `&grid=${GRID}` : ''}`)
  req.timeoutInterval = 25
  return req.loadJSON()
}

async function loadSummary() {
  try {
    let d = await fetchSummary()
    // A cold LADWP/SMUD lookup can time out once; the server keeps working, so retry.
    if (d?.error) {
      await new Promise((r) => Timer.schedule(3000, false, r))
      d = await fetchSummary()
    }
    if (d && !d.error) {
      fm.writeString(cachePath, JSON.stringify(d))
      return { d, stale: false }
    }
    if (d?.error) throw new Error(d.error)
  } catch (e) {
    // Fall back to the last good reading, marked as stale.
    if (fm.fileExists(cachePath)) return { d: JSON.parse(fm.readString(cachePath)), stale: true, error: String(e.message ?? e) }
    return { d: null, stale: true, error: String(e.message ?? e) }
  }
  return { d: null, stale: true, error: 'No data yet' }
}

const time = (iso) => {
  const f = new DateFormatter()
  f.dateFormat = 'h:mm a'
  return f.string(new Date(iso))
}
const dayTime = (iso) => {
  const f = new DateFormatter()
  f.dateFormat = 'MMM d, h a'
  return f.string(new Date(iso))
}

// ---- Drawing helpers ----
function text(stack, str, size, color = C.white(), weight = 'regular') {
  const t = stack.addText(String(str))
  t.font = weight === 'bold' ? Font.boldSystemFont(size) : weight === 'semibold' ? Font.semiboldSystemFont(size) : weight === 'medium' ? Font.mediumSystemFont(size) : Font.systemFont(size)
  t.textColor = color
  t.lineLimit = 1
  t.minimumScaleFactor = 0.75
  return t
}

function hstack(parent, spacing = 0) {
  const s = parent.addStack()
  s.layoutHorizontally()
  s.centerAlignContent()
  s.spacing = spacing
  return s
}

function vstack(parent, spacing = 0) {
  const s = parent.addStack()
  s.layoutVertically()
  s.spacing = spacing
  return s
}

// A thin bar of the energy mix right now.
function mixBar(mix, width, height = 6) {
  const dc = new DrawContext()
  dc.size = new Size(width, height)
  dc.opaque = false
  dc.respectScreenScale = true
  let x = 0
  for (const m of mix) {
    const w = m.share * width
    dc.setFillColor(GROUP[m.id] ?? C.grey)
    dc.fillRect(new Rect(x, 0, w, height))
    x += w
  }
  return dc.getImage()
}

// Today's hourly demand stacked by source, like the website. Grey = forecast.
function barsChart(hours, recordGW, width, height) {
  // Pass recordGW = null to scale to the day itself (better for small charts).
  const dc = new DrawContext()
  dc.size = new Size(width, height)
  dc.opaque = false
  dc.respectScreenScale = true
  const top = Math.max(recordGW ? recordGW * 1.15 : 0, ...hours.map((h) => h.gw * 1.1))
  const gap = 2
  const bw = (width - gap * (hours.length - 1)) / hours.length
  hours.forEach((h, i) => {
    const x = i * (bw + gap)
    const bh = (h.gw / top) * height
    if (!h.mix) {
      dc.setFillColor(C.white(0.2))
      dc.fillRect(new Rect(x, height - bh, bw, bh))
      return
    }
    let y = height
    for (const g of STACK) {
      const sh = (h.mix[g] ?? 0) * bh
      dc.setFillColor(GROUP[g])
      dc.fillRect(new Rect(x, y - sh, bw, sh))
      y -= sh
    }
  })
  if (recordGW) {
    const ry = height - (recordGW / top) * height
    dc.setFillColor(C.white(0.4))
    for (let x = 0; x < width; x += 6) dc.fillRect(new Rect(x, ry, 3, 1))
  }
  return dc.getImage()
}

// ---- Pieces ----
function header(parent, d, stale, showTime = true) {
  const row = hstack(parent, 5)
  const dot = row.addText('●')
  dot.font = Font.systemFont(9)
  // Small widgets have no room for "Data unavailable · Delayed", so say it once.
  const tight = !showTime && d.grid.delayed
  dot.textColor = tight ? C.yellow : PHASE[d.phase.id] ?? C.grey
  text(row, tight ? 'Day-old data' : d.phase.label, 12, C.white(), 'semibold')
  if (tight) return
  row.addSpacer()
  // Small widgets only show the time when it matters: stale or day-old data.
  if (!showTime && !stale && !d.grid.delayed) return
  const status = stale ? 'Offline' : d.grid.delayed ? (showTime ? `Delayed · ${dayTime(d.observedAt)}` : 'Delayed') : time(d.observedAt)
  text(row, status, 10, d.grid.delayed || stale ? C.yellow : C.white(0.5))
}

function demand(parent, d, size = 30) {
  const row = hstack(parent, 3)
  row.bottomAlignContent()
  text(row, d.demandGW ?? '—', size, C.white(), 'bold')
  text(row, 'GW', size * 0.5, C.white(0.6), 'medium')
  if (d.demandLevel) {
    const tone = d.demandLevel.tone
    text(parent, d.demandLevel.text, 11, LEVEL[tone] ?? C.white(0.85), tone === 'moderate' ? 'regular' : 'semibold')
  }
}

function tipRow(parent, t, compact = false) {
  const row = hstack(parent, 6)
  if (!compact) {
    const label = text(row, ROW[t.rowId] ?? t.row.toUpperCase(), 9, C.white(0.45), 'semibold')
    label.minimumScaleFactor = 1
  }
  text(row, t.label, compact ? 12 : 13, C.white(0.92), 'medium')
  row.addSpacer()
  text(row, t.when, 11, t.timed ? C.green : C.white(0.5))
}

function mixLegend(parent, mix) {
  const row = hstack(parent, 8)
  for (const m of mix.filter((x) => x.share >= 0.05).slice(0, 3)) {
    const item = hstack(row, 3)
    const dot = item.addText('●')
    dot.font = Font.systemFont(7)
    dot.textColor = GROUP[m.id] ?? C.grey
    text(item, `${Math.round(m.share * 100)}% ${SHORT[m.id] ?? m.label}`, 10, C.white(0.6))
  }
}

// ---- Layouts ----
function small(w, d, stale) {
  header(w, d, stale, false)
  w.addSpacer(6)
  demand(w, d, 28)
  w.addSpacer(6)
  if (d.mix) w.addImage(mixBar(d.mix, 130)).imageSize = new Size(130, 6)
  w.addSpacer()
  const t = d.tips[0]
  if (t) {
    text(w, ROW[t.rowId] ?? t.row.toUpperCase(), 9, C.white(0.45), 'semibold')
    const row = hstack(w, 4)
    text(row, t.label, 13, C.white(0.92), 'medium')
    row.addSpacer()
    text(w, t.when, 11, t.timed ? C.green : C.white(0.5))
  }
}

function medium(w, d, stale) {
  header(w, d, stale)
  w.addSpacer(6)
  const body = hstack(w, 14)
  body.topAlignContent()
  const left = vstack(body, 4)
  left.size = new Size(120, 0)
  demand(left, d, 28)
  left.addSpacer(4)
  if (d.mix) left.addImage(mixBar(d.mix, 120)).imageSize = new Size(120, 6)
  if (d.hours?.length > 1) {
    left.addSpacer(6)
    left.addImage(barsChart(d.hours, null, 120, 34)).imageSize = new Size(120, 34)
  }
  const right = vstack(body, 7)
  for (const t of d.tips.slice(0, 3)) tipRow(right, t, true)
}

function large(w, d, stale) {
  header(w, d, stale)
  w.addSpacer(8)
  const top = hstack(w)
  const dem = vstack(top, 2)
  demand(dem, d, 34)
  top.addSpacer()
  text(top, `${d.grid.label} grid`, 11, C.white(0.5))
  w.addSpacer(8)
  if (d.hours?.length > 1) {
    w.addImage(barsChart(d.hours, d.recordGW, 306, 64)).imageSize = new Size(306, 64)
    w.addSpacer(6)
  }
  if (d.mix) mixLegend(w, d.mix)
  w.addSpacer(10)
  const mood = text(w, d.mood, 12, C.white(0.75))
  mood.lineLimit = 2
  w.addSpacer(6)
  const tips = vstack(w, 7)
  for (const t of d.tips.slice(0, 4)) tipRow(tips, t)
  w.addSpacer()
  if (d.weather) text(w, `${d.weather.place} ${d.weather.nowF}° · ${d.weather.summary} · H ${d.weather.highF}° L ${d.weather.lowF}°`, 10, C.white(0.5))
}

// Lock Screen: iOS tints these, so they rely on words and weight, not colour.
function lockRect(w, d) {
  text(w, `${d.phase.label} · ${d.demandGW ?? '—'} GW`, 13, C.white(), 'semibold')
  if (d.demandLevel) text(w, d.demandLevel.text, 12, C.white(0.8))
  const t = d.tips[0]
  if (t) text(w, `${t.label} · ${t.when}`, 12, C.white(0.8))
}

function lockInline(w, d) {
  text(w, `Grid: ${d.phase.label} · ${d.demandGW ?? '—'} GW`, 12)
}

function errorWidget(w, message) {
  text(w, 'Grid Companion', 13, C.white(), 'semibold')
  w.addSpacer(4)
  const t = text(w, message || 'Can’t reach the grid right now.', 11, C.white(0.6))
  t.lineLimit = 3
}

// ---- Build ----
async function build(family) {
  const w = new ListWidget()
  w.backgroundColor = C.bg
  w.url = SITE
  w.refreshAfterDate = new Date(Date.now() + REFRESH_MIN * 60 * 1000)
  const lock = family?.startsWith('accessory')
  if (!lock) w.setPadding(14, 14, 14, 14)

  const { d, stale, error } = await loadSummary()
  if (!d) {
    errorWidget(w, error)
    return w
  }
  if (family === 'accessoryInline') lockInline(w, d)
  else if (lock) lockRect(w, d)
  else if (family === 'small') small(w, d, stale)
  else if (family === 'large' || family === 'extraLarge') large(w, d, stale)
  else medium(w, d, stale)
  return w
}

if (config.runsInWidget) {
  Script.setWidget(await build(config.widgetFamily))
} else {
  // Running inside the Scriptable app: show a preview. Change to presentSmall / presentLarge to try other sizes.
  const w = await build('medium')
  await w.presentMedium()
}
Script.complete()
