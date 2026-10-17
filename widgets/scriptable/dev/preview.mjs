// Runs the Scriptable widget in Node with a stand-in for Scriptable's API, for every
// widget size, and writes preview.html that draws each layout at its real size.
// Usage: node widgets/scriptable/dev/preview.mjs [zip] [site]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const code = fs.readFileSync(path.join(here, '..', 'grid-companion.js'), 'utf8')
const zip = process.argv[2] ?? '94612'
const site = process.argv[3] ?? 'http://localhost:5174'

class Color { constructor(hex, a = 1) { this.hex = hex; this.a = a } css() { const n = parseInt(this.hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${this.a})` } }
class Size { constructor(w, h) { this.width = w; this.height = h } }
class Rect { constructor(x, y, w, h) { Object.assign(this, { x, y, w, h }) } }
const Font = { systemFont: (s) => ({ s, w: 400 }), mediumSystemFont: (s) => ({ s, w: 500 }), semiboldSystemFont: (s) => ({ s, w: 600 }), boldSystemFont: (s) => ({ s, w: 700 }) }
class DrawContext {
  constructor() { this.ops = []; this.fill = null }
  setFillColor(c) { this.fill = c }
  fillRect(r) { this.ops.push(`<rect x="${r.x}" y="${r.y}" width="${Math.max(0, r.w)}" height="${Math.max(0, r.h)}" fill="${this.fill.css()}"/>`) }
  getImage() { return { svg: `<svg width="${this.size.width}" height="${this.size.height}">${this.ops.join('')}</svg>` } }
}
class Node {
  constructor(kind) { this.kind = kind; this.children = []; this.spacing = 0; this.dir = 'col'; this.align = 'center' }
  layoutHorizontally() { this.dir = 'row' } layoutVertically() { this.dir = 'col' }
  centerAlignContent() { this.align = 'center' } topAlignContent() { this.align = 'flex-start' } bottomAlignContent() { this.align = 'flex-end' }
  addStack() { const s = new Node('stack'); this.children.push(s); return s }
  addText(t) { const n = new Node('text'); n.text = t; this.children.push(n); return n }
  addImage(img) { const n = new Node('image'); n.img = img; this.children.push(n); return n }
  addSpacer(n) { const s = new Node('spacer'); s.len = n; this.children.push(s); return s }
  setPadding(t, l, b, r) { this.pad = [t, r, b, l] }
}
class ListWidget extends Node { constructor() { super('widget') } }
const html = (n, parentDir) => {
  if (n.kind === 'text') {
    const f = n.font ?? { s: 12, w: 400 }
    return `<div style="font-size:${f.s}px;font-weight:${f.w};color:${n.textColor?.css() ?? '#fff'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;${n.lineLimit > 1 ? 'white-space:normal;' : ''}">${n.text}</div>`
  }
  if (n.kind === 'image') return `<div style="flex-shrink:0;width:${n.imageSize?.width}px;height:${n.imageSize?.height}px">${n.img.svg}</div>`
  if (n.kind === 'spacer') return n.len == null ? '<div style="flex:1"></div>' : `<div style="flex:0 0 ${n.len}px"></div>`
  const size = n.size ? `${n.size.width ? `width:${n.size.width}px;flex-shrink:0;` : ''}` : ''
  return `<div style="display:flex;flex-direction:${n.dir === 'row' ? 'row' : 'column'};align-items:${n.dir === 'row' ? n.align : 'stretch'};gap:${n.spacing}px;min-width:0;${size}">${n.children.map((c) => html(c, n.dir)).join('')}</div>`
}

const sizes = { small: [158, 158], medium: [338, 158], large: [338, 354], accessoryRectangular: [172, 76], accessoryInline: [240, 24] }
const out = []
for (const [family, [w, h]] of Object.entries(sizes)) {
  const g = {
    args: { widgetParameter: zip }, config: { runsInWidget: true, widgetFamily: family },
    Color, Size, Rect, Font, DrawContext, ListWidget,
    DateFormatter: class { string(d) { return d.toLocaleString('en-US', this.dateFormat.includes('MMM') ? { month: 'short', day: 'numeric', hour: 'numeric' } : { hour: 'numeric', minute: '2-digit' }) } },
    Request: class { constructor(u) { this.u = u.replace('https://gridcompanion.netlify.app', site) } async loadJSON() { return (await fetch(this.u)).json() } },
    FileManager: { local: () => ({ joinPath: (a, b) => `${a}/${b}`, cacheDirectory: () => '/tmp', writeString() {}, readString() {}, fileExists: () => false }) },
    Timer: { schedule: (ms, _repeat, fn) => setTimeout(fn, ms) },
    Script: { setWidget: (wd) => { g.result = wd }, complete() {} },
  }
  const run = new (Object.getPrototypeOf(async function () {}).constructor)(...Object.keys(g), code)
  await run(...Object.values(g))
  const wd = g.result
  const pad = (wd.pad ?? [0, 0, 0, 0]).map((p) => `${p}px`).join(' ')
  out.push(`<figure><figcaption>${family} (${w}×${h})</figcaption><div style="width:${w}px;height:${h}px;box-sizing:border-box;padding:${pad};border-radius:${family.startsWith('accessory') ? 12 : 22}px;background:${wd.backgroundColor.css()};overflow:hidden;display:flex;flex-direction:column;gap:0;color:#fff;font-family:-apple-system,system-ui,sans-serif">${wd.children.map((c) => html(c, 'col')).join('')}</div></figure>`)
  console.log('ok', family)
}
fs.writeFileSync(path.join(here, 'preview.html'), `<!doctype html><meta charset="utf-8"><title>Scriptable preview</title><body style="margin:0;padding:24px;background:#6a8fb3;display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start;font:12px -apple-system,system-ui">${out.join('')}</body>`)
console.log('wrote preview.html')
