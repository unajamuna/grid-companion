// Runs the Scriptable widget in Node with a stand-in for Scriptable's API, for every
// widget size and both views, and writes preview.html that draws each layout at its real size.
// SF Symbols show as small labelled dots, since they only exist on Apple devices.
// Usage: node widgets/scriptable/dev/preview.mjs [zip] [site] [--old]
//   --old  strips the fields older live summaries don't send, to check the fallbacks.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const code = fs.readFileSync(path.join(here, '..', 'grid-companion.js'), 'utf8')
const flags = process.argv.slice(2).filter((a) => a.startsWith('--'))
const [zip = '94612', site = 'http://localhost:5174'] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const old = flags.includes('--old')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

class Color { constructor(hex, a = 1) { this.hex = hex; this.a = a } css() { const n = parseInt(this.hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${this.a})` } }
class Size { constructor(w, h) { this.width = w; this.height = h } }
class Rect { constructor(x, y, w, h) { Object.assign(this, { x, y, w, h }) } }
const Font = { systemFont: (s) => ({ s, w: 400 }), mediumSystemFont: (s) => ({ s, w: 500 }), semiboldSystemFont: (s) => ({ s, w: 600 }), boldSystemFont: (s) => ({ s, w: 700 }) }
class DrawContext {
  constructor() { this.ops = []; this.fill = null; this.align = 'start' }
  setFillColor(c) { this.fill = c }
  setFont(f) { this.font = f }
  setTextColor(c) { this.tc = c }
  setTextAlignedLeft() { this.align = 'start' }
  setTextAlignedRight() { this.align = 'end' }
  fillRect(r) { this.ops.push(`<rect x="${r.x}" y="${r.y}" width="${Math.max(0, r.w)}" height="${Math.max(0, r.h)}" fill="${this.fill.css()}"/>`) }
  drawTextInRect(t, r) {
    const x = this.align === 'end' ? r.x + r.w : r.x
    this.ops.push(`<text x="${x}" y="${r.y + this.font.s}" font-size="${this.font.s}" fill="${this.tc.css()}" text-anchor="${this.align}">${esc(t)}</text>`)
  }
  getImage() { return { svg: `<svg width="${this.size.width}" height="${this.size.height}" style="display:block;overflow:visible">${this.ops.join('')}</svg>` } }
}
const SFSymbol = { named: (name) => ({ name, image: { symbol: name }, applyFont() {} }) }
class Node {
  constructor(kind) { this.kind = kind; this.children = []; this.spacing = 0; this.dir = 'col'; this.align = 'center' }
  layoutHorizontally() { this.dir = 'row' } layoutVertically() { this.dir = 'col' }
  centerAlignContent() { this.align = 'center' } topAlignContent() { this.align = 'flex-start' } bottomAlignContent() { this.align = 'baseline' }
  addStack() { const s = new Node('stack'); this.children.push(s); return s }
  addText(t) { const n = new Node('text'); n.text = t; this.children.push(n); return n }
  addImage(img) { const n = new Node('image'); n.img = img; this.children.push(n); return n }
  addSpacer(n) { const s = new Node('spacer'); s.len = n; this.children.push(s); return s }
  setPadding(t, l, b, r) { this.pad = [t, r, b, l] }
}
class ListWidget extends Node { constructor() { super('widget') } }
const html = (n) => {
  if (n.kind === 'text') {
    const f = n.font ?? { s: 12, w: 400 }
    return `<div style="font-size:${f.s}px;line-height:1.2;font-weight:${f.w};color:${n.textColor?.css() ?? '#fff'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex-shrink:1;${n.lineLimit > 1 ? 'white-space:normal;' : ''}">${esc(n.text)}</div>`
  }
  if (n.kind === 'image') {
    const { width: w, height: h } = n.imageSize ?? {}
    if (n.img.symbol) return `<div title="${n.img.symbol}" style="flex-shrink:0;width:${w}px;height:${h}px;border-radius:50%;border:1.5px solid ${n.tintColor?.css() ?? '#fff'};box-sizing:border-box;font-size:${Math.max(6, h * 0.45)}px;line-height:${h - 3}px;text-align:center;color:${n.tintColor?.css() ?? '#fff'}">${esc(n.img.symbol[0])}</div>`
    return `<div style="flex-shrink:0;width:${w}px;height:${h}px">${n.img.svg}</div>`
  }
  if (n.kind === 'spacer') return n.len == null ? '<div style="flex:1 1 0"></div>' : `<div style="flex:0 0 ${n.len}px"></div>`
  const st = [
    `display:flex;flex-direction:${n.dir === 'row' ? 'row' : 'column'};gap:${n.spacing}px;min-width:0;box-sizing:border-box`,
    n.dir === 'row' ? `align-items:${n.align}` : 'align-items:flex-start',
    n.size?.width ? `width:${n.size.width}px;flex-shrink:0` : '',
    n.size?.height ? `height:${n.size.height}px` : '',
    n.backgroundColor ? `background:${n.backgroundColor.css()}` : '',
    n.cornerRadius ? `border-radius:${n.cornerRadius}px` : '',
    n.pad ? `padding:${n.pad.map((p) => `${p}px`).join(' ')}` : '',
    n.children.some((c) => c.kind === 'spacer' && c.len == null) ? (n.dir === 'row' || n.size?.width ? 'align-self:stretch' : 'align-self:stretch;flex:1 1 0') : '',
  ].filter(Boolean).join(';')
  return `<div style="${st}">${n.children.map(html).join('')}</div>`
}

async function getJSON(u) {
  const d = await (await fetch(u)).json()
  if (old && u.includes('/api/summary')) { delete d.hours; delete d.rows; delete d.demandLevel; for (const t of [...d.tips, ...d.quickTips]) delete t.rowId }
  return d
}

const sizes = { small: [158, 158], medium: [338, 158], large: [338, 354], accessoryRectangular: [172, 76], accessoryInline: [240, 24] }
const out = []
for (const view of ['usage', 'actions']) {
  out.push(`<h2 style="width:100%;margin:8px 0 0;color:#fff">${view}${old ? ' (old summary)' : ''}</h2>`)
  for (const [family, [w, h]] of Object.entries(sizes)) {
    if (view === 'actions' && family.startsWith('accessory')) continue
    const g = {
      args: { widgetParameter: `${zip} ${view}` }, config: { runsInWidget: true, widgetFamily: family },
      Color, Size, Rect, Font, DrawContext, ListWidget, SFSymbol,
      DateFormatter: class { string(d) { return d.toLocaleString('en-US', this.dateFormat.includes('MMM') ? { month: 'short', day: 'numeric', hour: 'numeric' } : { hour: 'numeric', minute: '2-digit' }) } },
      Request: class {
        constructor(u) { this.u = u.replace('https://grid-companion.vercel.app', site).replace('https://www.caiso.com/outlook/current', `${site}/caiso`) }
        async loadJSON() { return getJSON(this.u) }
        async loadString() { return (await fetch(this.u)).text() }
      },
      FileManager: { local: () => ({ joinPath: (a, b) => `${a}/${b}`, cacheDirectory: () => '/tmp', writeString() {}, readString() {}, fileExists: () => false }) },
      Timer: { schedule: (ms, _repeat, fn) => setTimeout(fn, ms) },
      Script: { setWidget: (wd) => { g.result = wd }, complete() {} },
    }
    const run = new (Object.getPrototypeOf(async function () {}).constructor)(...Object.keys(g), code)
    await run(...Object.values(g))
    const wd = g.result
    const pad = (wd.pad ?? [0, 0, 0, 0]).map((p) => `${p}px`).join(' ')
    out.push(`<figure style="margin:0"><figcaption style="color:#fff;margin-bottom:4px">${family} (${w}×${h})</figcaption><div style="width:${w}px;height:${h}px;box-sizing:border-box;padding:${pad};border-radius:${family.startsWith('accessory') ? 12 : 22}px;background:${wd.backgroundColor.css()};overflow:hidden;display:flex;flex-direction:column;align-items:flex-start;color:#fff;font-family:-apple-system,system-ui,sans-serif">${wd.children.map(html).join('')}</div></figure>`)
    console.log('ok', view, family)
  }
}
const file = old ? 'preview-old.html' : 'preview.html'
fs.writeFileSync(path.join(here, file), `<!doctype html><meta charset="utf-8"><title>Scriptable preview</title><body style="margin:0;padding:24px;background:#6a8fb3;display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start;font:12px -apple-system,system-ui">${out.join('')}</body>`)
console.log('wrote', file)
