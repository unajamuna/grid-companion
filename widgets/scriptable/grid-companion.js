// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: leaf;

// Grid Companion widgets for Scriptable (iPhone, iPad, and Mac via iPhone widgets).
// Replicas of the website's two widgets:
//   usage    – grid demand, today's hourly chart by source, and the source panel (default)
//   actions  – "What you can do": four rows of tips with icons
//
// Set each widget with its Parameter (long-press → Edit Widget → Parameter), e.g.
//   94612 usage      94612 actions      90012 LADWP usage
// Best sizes: usage → Medium or Large; actions → Large (Medium shows one tip per row).

const DEFAULT_ZIP = '94612'
const SITE = 'https://grid-companion.vercel.app'
const CAISO = 'https://www.caiso.com/outlook/current'
const REFRESH_MIN = 15

// ---- Colours (same as the website) ----
const hex = (h, a = 1) => new Color(h, a)
const C = {
  bg: hex('#1c1c1e'), panel: hex('#2c2c2e'), tile: hex('#2c2c2e'),
  white: (a = 1) => hex('#ffffff', a),
  green: hex('#44a861'), red: hex('#e5534b'), yellow: hex('#f2c14e'), blue: hex('#4f8ff7'), purple: hex('#a78bfa'), grey: hex('#aeaeb2'),
}
const PHASE_COLOR = { clean: C.green, 'cleaner-later': C.blue, mixed: C.yellow, 'higher-carbon': C.red, unavailable: C.grey }
const PHASE_ICON = { clean: 'leaf.fill', 'cleaner-later': 'clock.fill', mixed: 'hurricane', 'higher-carbon': 'flame.fill', unavailable: 'questionmark.circle' }
const LEVEL = { peak: C.red, low: C.green }
const GROUP = {
  solar: { color: C.yellow, icon: 'sun.max.fill', label: 'Solar' },
  water: { color: C.blue, icon: 'wind', label: 'Wind & water' },
  nuclear: { color: C.purple, icon: 'atom', label: 'Nuclear & other' },
  batteries: { color: C.green, icon: 'battery.100.bolt', label: 'Batteries' },
  fossil: { color: C.red, icon: 'flame.fill', label: 'Gas & imports' },
}
const STACK = ['solar', 'water', 'nuclear', 'batteries', 'fossil'] // clean at the base, fossil on top
const ROWS = [
  { id: 'home', label: 'AROUND THE HOUSE', icon: 'house.fill' },
  { id: 'tech', label: 'COMPUTERS, SCREENS & AI', icon: 'desktopcomputer' },
  { id: 'save', label: 'EVERYDAY HABITS', icon: 'leaf.fill' },
  { id: 'unwind', label: 'UNPLUG & UNWIND', icon: 'figure.walk' },
]
const ROW_BY_LABEL = { 'Around the house': 'home', 'Computers, screens & AI': 'tech', 'Everyday habits': 'save', 'Unplug & unwind': 'unwind' }

// SF Symbols for each tip (closest match to the website's icons). Unknown names fall back to the row's icon.
const TIP_ICON = {
  dishwasher: 'dishwasher', laundry: 'washer', ev: 'bolt.car', devices: 'battery.100.bolt', pool: 'figure.pool.swim',
  'home-battery': 'minus.plus.batteryblock', 'delay-start': 'timer', 'pre-cool': 'snowflake', 'peak-hours': 'gauge.with.dots.needle.67percent',
  'one-at-a-time': 'square.stack.3d.up', 'line-dry': 'tshirt', 'high-spin': 'arrow.clockwise', 'auto-dry': 'humidity', 'no-cook': 'carrot',
  'batch-bake': 'oven', 'lid-on': 'frying.pan', kettle: 'cup.and.saucer', toaster: 'fork.knife',
  'ai-batch': 'sparkles', backups: 'icloud.and.arrow.up', updates: 'arrow.triangle.2.circlepath', renders: 'film', 'pause-big': 'pause.circle',
  'small-model': 'cpu', 'ask-once': 'text.bubble', 'edit-not-redo': 'pencil.line', 'text-for-text': 'textformat', 'crop-first': 'crop',
  'draft-small': 'photo', 'idle-cloud': 'server.rack', sleep: 'moon.zzz', screensaver: 'display', dim: 'sun.min', 'monitor-off': 'display',
  'charge-limit': 'battery.75percent', 'balanced-mode': 'bolt', 'startup-apps': 'power', autoplay: 'play.slash', 'tv-timer': 'timer',
  'gaming-pc': 'gamecontroller', 'download-once': 'arrow.down.circle', headphones: 'headphones',
  'heat-68': 'thermometer.medium', 'ac-78': 'thermometer.snowflake', fan: 'fan', blinds: 'blinds.horizontal.closed', 'night-air': 'wind',
  daylight: 'sun.max', curtains: 'sunset', 'close-doors': 'door.left.hand.closed', 'space-heater': 'heater.vertical', dehumidifier: 'dehumidifier',
  'thermostat-spot': 'thermometer.sun', drafts: 'door.left.hand.open', damper: 'fireplace', 'heater-wrap': 'shippingbox', 'light-timers': 'tree',
  'air-filter': 'air.purifier', 'glass-dish': 'oven', 'lights-off': 'lightbulb.slash', 'task-lamp': 'lamp.desk', 'exhaust-fan': 'fan.ceiling',
  overnight: 'moon.stars', thaw: 'snowflake', microwave: 'microwave', 'one-trip': 'map', 'cold-wash': 'drop', showers: 'shower', 'tap-off': 'spigot',
  standby: 'powerplug', unplug: 'powerplug', fridge: 'refrigerator', 'second-fridge': 'refrigerator', lint: 'line.3.horizontal.decrease.circle',
  leds: 'lightbulb.led', 'eco-mode': 'laptopcomputer', measure: 'waveform.path.ecg', vents: 'air.conditioner.vertical', 'water-heater': 'bathtub',
  schedule: 'calendar.badge.clock', 'low-flow': 'wrench.adjustable', tires: 'car',
  socks: 'shoeprints.fill', blanket: 'sofa', outside: 'tree', 'sunset-walk': 'figure.walk', bike: 'bicycle', garden: 'leaf', picnic: 'basket',
  'cool-spot': 'building.columns', nap: 'bed.double', read: 'book', puzzle: 'puzzlepiece', 'game-night': 'dice', music: 'guitars',
  sketch: 'paintbrush', journal: 'book.closed', 'call-friend': 'phone', stargaze: 'sparkles',
}

// ---- Parameter: "<zip> [CAISO|LADWP|SMUD] [usage|actions]" in any order ----
const words = String(args.widgetParameter ?? '').trim().split(/\s+/).filter(Boolean)
const ZIP = words.find((x) => /^\d{5}$/.test(x)) ?? DEFAULT_ZIP
const GRID = (words.find((x) => /^(caiso|ladwp|smud)$/i.test(x)) ?? '').toUpperCase()
const VIEW = /^(actions|tips|todo)$/i.test(words.find((x) => /^(usage|chart|graph|actions|tips|todo)$/i.test(x)) ?? '') ? 'actions' : 'usage'

// ---- Data ----
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
    throw new Error(d?.error ?? 'No data')
  } catch (e) {
    if (fm.fileExists(cachePath)) return { d: JSON.parse(fm.readString(cachePath)), stale: true }
    return { d: null, stale: true, error: String(e.message ?? e) }
  }
}

// If the site doesn't send hourly bars yet, build them from CAISO's own files (CAISO grid only).
async function caisoHours() {
  const csv = async (f) => {
    const r = new Request(`${CAISO}/${f}.csv`)
    r.timeoutInterval = 20
    const lines = (await r.loadString()).trim().split(/\r?\n/)
    const head = lines[0].split(',').map((s) => s.trim())
    const rows = []
    for (const line of lines.slice(1)) {
      const c = line.split(',')
      const [hh, mm] = c[0].split(':').map(Number)
      const min = hh * 60 + mm
      if (rows.length && min <= rows[rows.length - 1].min) break // the files end with the next day's 00:00
      rows.push({ min, v: Object.fromEntries(head.slice(1).map((k, i) => [k, c[i + 1] === '' ? NaN : Number(c[i + 1])])) })
    }
    return rows
  }
  const [fuel, demand] = await Promise.all([csv('fuelsource'), csv('demand')])
  const pos = (n) => (Number.isFinite(n) && n > 0 ? n : 0)
  const groupsOf = (v) => ({
    solar: pos(v['Solar']),
    water: pos(v['Wind']) + pos(v['Small hydro']) + pos(v['Large Hydro']) + pos(v['Geothermal']),
    nuclear: pos(v['Nuclear']) + pos(v['Biomass']) + pos(v['Biogas']) + pos(v['Coal']) + pos(v['Other']),
    batteries: pos(v['Batteries']),
    fossil: pos(v['Natural Gas']) + pos(v['Imports']),
  })
  const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)
  const hours = []
  for (let h = 0; h < 24; h++) {
    const f = fuel.filter((r) => Math.floor(r.min / 60) === h)
    const dm = demand.filter((r) => Math.floor(r.min / 60) === h)
    const actual = avg(dm.map((r) => r.v['Current demand']).filter(Number.isFinite))
    const ahead = avg(dm.map((r) => r.v['Day ahead forecast']).filter(Number.isFinite))
    const mw = Number.isFinite(actual) ? actual : ahead
    if (!Number.isFinite(mw)) continue
    let mix = null
    const filled = f.filter((r) => Number.isFinite(r.v['Solar']))
    if (filled.length && Number.isFinite(actual)) {
      const sum = { solar: 0, water: 0, nuclear: 0, batteries: 0, fossil: 0 }
      for (const r of filled) { const g = groupsOf(r.v); for (const k of STACK) sum[k] += g[k] }
      const total = STACK.reduce((a, k) => a + sum[k], 0) || 1
      mix = Object.fromEntries(STACK.map((k) => [k, sum[k] / total]))
    }
    hours.push({ h, gw: mw / 1000, mix })
  }
  return hours
}

// Tips grouped by row: the site's `rows` if it has them, otherwise rebuilt from its tip lists.
function tipRows(d) {
  if (d.rows?.length) return d.rows.map((r) => ({ id: r.id, tips: r.tips }))
  const seen = new Set()
  const by = { home: [], tech: [], save: [], unwind: [] }
  for (const t of [...(d.tips ?? []), ...(d.quickTips ?? [])]) {
    const id = t.rowId ?? ROW_BY_LABEL[t.row]
    if (!by[id] || seen.has(t.id) || by[id].length >= 4) continue
    seen.add(t.id)
    by[id].push(t)
  }
  return ROWS.map((r) => ({ id: r.id, tips: by[r.id] }))
}

// Older summaries don't say how busy the grid is; work it out from today's bars like the site does.
function levelOf(d, hours) {
  if (d.demandLevel) return d.demandLevel
  const gws = hours.map((h) => h.gw)
  if (!gws.length || d.demandGW == null) return null
  const lo = Math.min(...gws), hi = Math.max(...gws)
  const pos = hi > lo ? (d.demandGW - lo) / (hi - lo) : 0.5
  const day = d.grid?.delayed ? 'that day' : 'today'
  if (pos >= 0.85) return { tone: 'peak', text: `Near ${day}’s peak` }
  if (pos <= 0.25) return { tone: 'low', text: `Low for ${day}` }
  return { tone: 'moderate', text: `Moderate for ${day}` }
}

// ---- Small helpers ----
const fmt = (pattern, d) => { const f = new DateFormatter(); f.dateFormat = pattern; return f.string(d) }

function text(stack, str, size, color = C.white(), weight = 'regular') {
  const t = stack.addText(String(str))
  t.font = { bold: Font.boldSystemFont, semibold: Font.semiboldSystemFont, medium: Font.mediumSystemFont }[weight]?.(size) ?? Font.systemFont(size)
  t.textColor = color
  t.lineLimit = 1
  t.minimumScaleFactor = 0.7
  return t
}
const hstack = (p, gap = 0) => { const s = p.addStack(); s.layoutHorizontally(); s.centerAlignContent(); s.spacing = gap; return s }
const vstack = (p, gap = 0) => { const s = p.addStack(); s.layoutVertically(); s.spacing = gap; return s }
const centred = (p, build) => { const r = hstack(p); r.addSpacer(); build(r); r.addSpacer(); return r }

function symbol(name, fallback) {
  for (const n of [name, fallback, 'circle.fill']) {
    if (!n) continue
    const s = SFSymbol.named(n)
    if (s && s.image) return s
  }
  return null
}
function addSymbol(p, name, size, color, fallback) {
  const s = symbol(name, fallback)
  if (!s) return null
  s.applyFont(Font.mediumSystemFont(size))
  const img = p.addImage(s.image)
  img.imageSize = new Size(size, size)
  img.tintColor = color
  img.resizable = true
  return img
}

// A coloured rounded square with a dark symbol, like the website's source tiles.
function sourceTile(p, id, size) {
  const t = hstack(p)
  t.size = new Size(size, size)
  t.cornerRadius = size * 0.28
  t.backgroundColor = GROUP[id]?.color ?? C.grey
  t.addSpacer()
  addSymbol(t, GROUP[id]?.icon, size * 0.55, C.bg)
  t.addSpacer()
  return t
}

// ---- The chart: today's hourly demand stacked by source, like the website ----
function chart(hours, recordGW, width, height, showLabels = true) {
  const dc = new DrawContext()
  dc.size = new Size(width, height)
  dc.opaque = false
  dc.respectScreenScale = true
  const labelH = showLabels ? 13 : 0
  const plotH = height - labelH
  const top = Math.max(recordGW ? recordGW * 1.12 : 0, ...hours.map((h) => h.gw * 1.1))
  const slot = width / 24
  const bw = Math.max(1, slot - 2)
  // Dotted guides at 12 AM, 6 AM, 12 PM, 6 PM
  dc.setFillColor(C.white(0.15))
  for (const hr of [0, 6, 12, 18]) for (let y = 0; y < plotH; y += 4) dc.fillRect(new Rect(hr * slot, y, 1, 2))
  for (const h of hours) {
    const x = h.h * slot + 1
    const bh = (h.gw / top) * plotH
    if (!h.mix) {
      // Forecast hours: a faint bar, as on the website
      dc.setFillColor(C.white(0.18))
      dc.fillRect(new Rect(x, plotH - bh, bw, bh))
      continue
    }
    let y = plotH
    for (const g of STACK) {
      const sh = (h.mix[g] ?? 0) * bh
      if (sh <= 0) continue
      dc.setFillColor(GROUP[g].color)
      dc.fillRect(new Rect(x, y - sh, bw, sh))
      y -= sh
    }
  }
  dc.setFillColor(C.white(0.15))
  dc.fillRect(new Rect(0, plotH - 1, width, 1))
  if (recordGW) {
    const ry = plotH - (recordGW / top) * plotH
    dc.setFillColor(C.white(0.4))
    for (let x = 0; x < width; x += 6) dc.fillRect(new Rect(x, ry, 3, 1))
    dc.setFont(Font.systemFont(8))
    dc.setTextColor(C.white(0.55))
    dc.setTextAlignedRight()
    dc.drawTextInRect(`Record ${recordGW} GW`, new Rect(width - 90, ry - 11, 90, 10))
  }
  if (showLabels) {
    dc.setFont(Font.systemFont(9))
    dc.setTextColor(C.white(0.5))
    dc.setTextAlignedLeft()
    ;['12 AM', '6 AM', '12 PM', '6 PM'].forEach((l, i) => dc.drawTextInRect(l, new Rect(i * 6 * slot + 2, plotH + 2, 60, 11)))
  }
  return dc.getImage()
}

function addChart(p, hours, recordGW, width, height, labels = true) {
  if (!hours.length) return
  const img = p.addImage(chart(hours, recordGW, width, height, labels))
  img.imageSize = new Size(width, height)
}

// ---- Pieces of the usage widget ----
function phasePill(p, d) {
  const pill = hstack(p, 4)
  pill.backgroundColor = C.white(0.12)
  pill.cornerRadius = 10
  pill.setPadding(3, 7, 3, 9)
  addSymbol(pill, PHASE_ICON[d.phase.id], 10, PHASE_COLOR[d.phase.id] ?? C.grey, 'circle.fill')
  text(pill, d.phase.label, 11, C.white(0.92), 'medium')
}

function bigNumber(p, d, size) {
  const row = hstack(p, 3)
  row.bottomAlignContent()
  text(row, d.demandGW ?? '—', size, C.white(), 'semibold')
  text(row, 'GW', size * 0.5, C.white(0.6), 'medium')
}

function levelLine(p, level, size = 11) {
  if (!level) return
  text(p, level.text, size, LEVEL[level.tone] ?? C.white(0.85), level.tone === 'moderate' ? 'regular' : 'semibold')
}

function footer(p, d, stale) {
  const at = new Date(d.observedAt)
  const f = stale ? 'Offline · last reading' : d.grid.delayed ? `Delayed · as of ${fmt('MMM d, h a', at)}` : `Live from ${d.grid.label} · ${fmt('h:mm a', at)}`
  text(p, f, 9, stale || d.grid.delayed ? C.yellow : C.white(0.45))
}

// ---- Usage layouts ----
function usageMedium(w, d, stale, hours) {
  const level = levelOf(d, hours)
  const body = hstack(w, 10)
  body.topAlignContent()
  const left = vstack(body, 2)
  left.size = new Size(192, 0)
  phasePill(left, d)
  left.addSpacer(3)
  bigNumber(left, d, 24)
  levelLine(left, level)
  left.addSpacer()
  addChart(left, hours, d.recordGW ?? 52, 190, 50)
  const right = vstack(body, 6)
  right.backgroundColor = C.panel
  right.cornerRadius = 12
  right.setPadding(8, 8, 8, 6)
  right.size = new Size(100, 0)
  for (const m of (d.mix ?? []).slice(0, 4)) {
    const row = hstack(right, 6)
    sourceTile(row, m.id, 22)
    const v = vstack(row, 0)
    text(v, `${Math.round(m.share * 100)}%`, 12, C.white(0.85), 'semibold')
    text(v, GROUP[m.id]?.label ?? m.label, 8, C.white(0.5))
  }
  right.addSpacer()
}

function usageLarge(w, d, stale, hours) {
  const level = levelOf(d, hours)
  const head = hstack(w)
  phasePill(head, d)
  head.addSpacer()
  footer(head, d, stale)
  w.addSpacer(10)
  bigNumber(w, d, 40)
  const sub = hstack(w, 6)
  text(sub, `${d.grid.label} grid demand ${d.grid.delayed ? 'then' : 'now'}`, 11, C.white(0.55))
  w.addSpacer(1)
  levelLine(w, level, 12)
  w.addSpacer()
  addChart(w, hours, d.recordGW ?? 52, 310, 112)
  w.addSpacer()
  const panel = hstack(w)
  panel.backgroundColor = C.panel
  panel.cornerRadius = 14
  panel.setPadding(9, 8, 9, 8)
  const mix = (d.mix ?? []).slice(0, 5)
  mix.forEach((m, i) => {
    const cell = vstack(panel, 3)
    centred(cell, (r) => sourceTile(r, m.id, 26))
    centred(cell, (r) => text(r, `${Math.round(m.share * 100)}%`, 12, C.white(0.85), 'semibold'))
    centred(cell, (r) => text(r, GROUP[m.id]?.label ?? m.label, 8, C.white(0.5)))
    cell.size = new Size(58, 0)
    if (i < mix.length - 1) panel.addSpacer()
  })
}

function usageSmall(w, d, stale, hours) {
  const level = levelOf(d, hours)
  phasePill(w, d)
  w.addSpacer(6)
  bigNumber(w, d, 26)
  levelLine(w, level)
  w.addSpacer()
  addChart(w, hours, null, 128, 44, false)
}

// ---- "What you can do" layouts ----
function tipTile(p, t, width, height, iconSize) {
  const tile = vstack(p, 3)
  tile.size = new Size(width, height)
  tile.backgroundColor = C.tile
  tile.cornerRadius = 12
  tile.setPadding(4, 3, 4, 3)
  tile.addSpacer()
  const rowIcon = ROWS.find((r) => r.id === (t.rowId ?? ROW_BY_LABEL[t.row]))?.icon
  centred(tile, (r) => addSymbol(r, TIP_ICON[t.id], iconSize, C.white(0.9), rowIcon))
  centred(tile, (r) => text(r, t.label, 10, C.white(0.9), 'medium'))
  centred(tile, (r) => text(r, t.when, 9, t.timed ? C.green : C.white(0.45), t.timed ? 'medium' : 'regular'))
  tile.addSpacer()
}

function actionsLarge(w, d) {
  text(w, 'What you can do', 15, C.white(), 'semibold')
  w.addSpacer(1)
  text(w, d.mood, 10, C.white(0.6))
  w.addSpacer(8)
  for (const row of tipRows(d)) {
    text(w, ROWS.find((r) => r.id === row.id).label, 8, C.white(0.45), 'semibold')
    w.addSpacer(3)
    const tiles = hstack(w, 5)
    for (const t of row.tips.slice(0, 4)) tipTile(tiles, t, 74, 54, 16)
    w.addSpacer(7)
  }
}

function actionsMedium(w, d) {
  text(w, 'What you can do', 13, C.white(), 'semibold')
  w.addSpacer(1)
  text(w, d.mood, 9, C.white(0.6))
  w.addSpacer()
  const tiles = hstack(w, 5)
  for (const row of tipRows(d)) if (row.tips[0]) tipTile(tiles, row.tips[0], 74, 90, 20)
}

function actionsSmall(w, d) {
  text(w, 'What you can do', 12, C.white(), 'semibold')
  w.addSpacer(6)
  for (const row of tipRows(d)) {
    const t = row.tips[0]
    if (!t) continue
    const r = hstack(w, 6)
    const rowIcon = ROWS.find((x) => x.id === row.id)?.icon
    addSymbol(r, TIP_ICON[t.id], 12, C.white(0.85), rowIcon)
    const v = vstack(r, 0)
    text(v, t.label, 10, C.white(0.9), 'medium')
    text(v, t.when, 8, t.timed ? C.green : C.white(0.45))
    w.addSpacer(4)
  }
}

// Lock Screen: iOS tints these, so they rely on words, not colour.
function lockRect(w, d) {
  text(w, `${d.phase.label} · ${d.demandGW ?? '—'} GW`, 13, C.white(), 'semibold')
  if (d.demandLevel) text(w, d.demandLevel.text, 12, C.white(0.8))
  const t = tipRows(d)[0]?.tips[0]
  if (t) text(w, `${t.label} · ${t.when}`, 12, C.white(0.8))
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
    text(w, 'Grid Companion', 13, C.white(), 'semibold')
    const t = text(w, error || 'Can’t reach the grid right now.', 11, C.white(0.6))
    t.lineLimit = 3
    return w
  }

  if (family === 'accessoryInline') { text(w, `Grid: ${d.phase.label} · ${d.demandGW ?? '—'} GW`, 12); return w }
  if (lock) { lockRect(w, d); return w }

  const big = family === 'large' || family === 'extraLarge'
  if (VIEW === 'actions') {
    if (big) actionsLarge(w, d)
    else if (family === 'small') actionsSmall(w, d)
    else actionsMedium(w, d)
    return w
  }

  // Hourly bars: from the site when it has them, otherwise straight from CAISO.
  let hours = (d.hours ?? []).map((h) => ({ h: new Date(h.at).getHours(), gw: h.gw, mix: h.mix }))
  if (!hours.length && d.grid.id === 'CAISO') hours = await caisoHours().catch(() => [])

  if (family === 'small') usageSmall(w, d, stale, hours)
  else if (big) usageLarge(w, d, stale, hours)
  else usageMedium(w, d, stale, hours)
  return w
}

if (config.runsInWidget) {
  Script.setWidget(await build(config.widgetFamily))
} else {
  // Running inside the Scriptable app: preview the chosen view.
  const w = await build(VIEW === 'actions' ? 'large' : 'medium')
  if (VIEW === 'actions') await w.presentLarge()
  else await w.presentMedium()
}
Script.complete()
