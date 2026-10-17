// The nudge screen on AI chat sites. Shown when the grid is running on gas or near
// its peak; always overridable. Lives in a shadow root so the site's CSS can't touch it.
/* global GC */

const SITE_NAMES = {
  'chatgpt.com': 'ChatGPT', 'chat.openai.com': 'ChatGPT', 'claude.ai': 'Claude',
  'gemini.google.com': 'Gemini', 'www.perplexity.ai': 'Perplexity', 'copilot.microsoft.com': 'Copilot',
}
const SMALLER_TIP = {
  ChatGPT: 'Open the model picker and choose a lighter model. They’re often labeled “mini.”',
  Claude: 'Open the model picker and choose a smaller model, like Haiku.',
  Gemini: 'Open the model picker and choose a “Flash” model.',
}
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const host = location.hostname
const siteName = SITE_NAMES[host] ?? 'AI'

async function main() {
  let { summary, summaryAt } = await chrome.storage.local.get(['summary', 'summaryAt'])
  if (!summary || Date.now() - (summaryAt ?? 0) > GC.STALE_MS) {
    await chrome.runtime.sendMessage({ type: 'refresh' }).catch(() => {})
    ;({ summary } = await chrome.storage.local.get('summary'))
  }
  const settings = await GC.settings()
  if ((settings.snoozes[host] ?? 0) > Date.now()) return
  const reason = GC.reason(summary, settings)
  if (!reason) return
  bump('shown')
  show(reason, summary)
}

async function bump(key) {
  const { stats = GC.defaults.stats } = await chrome.storage.local.get('stats')
  stats[key] = (stats[key] ?? 0) + 1
  if (!stats.since) stats.since = Date.now()
  await chrome.storage.local.set({ stats })
}

async function snooze() {
  const { snoozes = {} } = await chrome.storage.local.get('snoozes')
  snoozes[host] = Date.now() + GC.SNOOZE_MS
  await chrome.storage.local.set({ snoozes })
}

// When to come back: the next clean stretch if we know it, else after the evening peak.
function laterTime(summary) {
  if (summary.phase.cleanStart) {
    const iso = summary.phase.cleanStart
    return { at: Date.parse(iso), label: GC.when(iso), atLabel: GC.at(iso) }
  }
  const d = new Date()
  if (d.getHours() < 21) d.setHours(21, 0, 0, 0)
  else d.setTime(d.getTime() + 60 * 60 * 1000)
  return { at: d.getTime(), label: GC.when(d.toISOString()), atLabel: GC.at(d.toISOString()) }
}

const COPY = {
  dirty: {
    title: 'The grid is running on gas right now',
    body: (s) => s.phase.summary,
  },
  peak: {
    title: 'The grid is near its daily peak',
    body: () => 'Lots of homes are using power at once, so California leans harder on gas plants to keep up. If this can wait a few hours, it helps.',
  },
  later: {
    title: 'Cleaner power is coming soon',
    body: (s) => s.phase.summary,
  },
}

function show(reason, summary) {
  const later = laterTime(summary)
  const copy = COPY[reason]
  const root = document.createElement('div')
  root.id = 'grid-companion-nudge'
  const shadow = root.attachShadow({ mode: 'open' })
  shadow.innerHTML = `<style>${CSS}</style><div class="backdrop"><div class="card" role="dialog" aria-modal="true" aria-labelledby="gc-title"></div></div>`
  const card = shadow.querySelector('.card')
  document.documentElement.appendChild(root)
  const prevOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'

  const close = () => {
    root.remove()
    document.documentElement.style.overflow = prevOverflow
  }

  const screens = {
    main: () => `
      <div class="brand"><span class="dot ${reason}"></span>Grid Companion</div>
      <h1 id="gc-title">${copy.title}</h1>
      <p>${esc(copy.body(summary))}</p>
      <p class="q">Can this ${siteName} task wait?</p>
      <button class="primary" data-go="save">Save it for ${later.label}</button>
      <button data-go="smaller">Use a smaller model</button>
      <button class="ghost" data-go="continue">Continue anyway</button>
      <p class="note">Grid Companion can’t see how much energy ${siteName} uses. This is only about <em>when</em> you use it.</p>
      <button class="link" data-go="pause">Pause nudges for today</button>`,
    saved: () => `
      <div class="brand"><span class="dot clean"></span>Saved for later</div>
      <h1 id="gc-title">We’ll remind you ${later.atLabel}</h1>
      <p>You’ll get a notification when power is cleaner. Clicking it brings you right back here.</p>
      <button class="primary" data-go="closeTab">Close this tab</button>
      <button class="ghost" data-go="keep">Keep it open for now</button>`,
    smaller: () => `
      <div class="brand"><span class="dot ${reason}"></span>Right-size it</div>
      <h1 id="gc-title">Try a smaller model</h1>
      <p>${SMALLER_TIP[siteName] ?? 'Look for a lighter or faster model in the model menu.'} For quick questions, summaries and rewrites, a smaller model is usually plenty.</p>
      <p class="note">A general rule, not a measurement. AI companies rarely publish energy per request.</p>
      <button class="primary" data-go="smallerOk">Got it, continue</button>
      <button class="ghost" data-go="main">Back</button>`,
    continue: () => `
      <div class="brand"><span class="dot ${reason}"></span>One quick check</div>
      <h1 id="gc-title">What’s it for?</h1>
      <p>No wrong answers. We’ll leave ${siteName} alone for the next hour.</p>
      <div class="chips">
        <button data-go="go">Work that can’t wait</button>
        <button data-go="go">A quick question</button>
        <button data-go="go">Just exploring</button>
      </div>
      <button class="ghost" data-go="main">Back</button>`,
  }

  const render = (name) => {
    card.innerHTML = screens[name]()
    card.querySelector('button')?.focus()
  }

  card.addEventListener('click', async (e) => {
    const go = e.target.closest('button')?.dataset.go
    if (!go) return
    if (go === 'save') {
      await chrome.runtime.sendMessage({ type: 'remind', when: later.at, url: location.href, site: siteName })
      bump('deferred')
      render('saved')
    } else if (go === 'closeTab') {
      chrome.runtime.sendMessage({ type: 'closeTab' })
    } else if (go === 'keep') {
      close()
    } else if (go === 'smallerOk') {
      bump('smaller')
      await snooze()
      close()
    } else if (go === 'go') {
      bump('continued')
      await snooze()
      close()
    } else if (go === 'pause') {
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      await chrome.storage.local.set({ pausedUntil: end.getTime() })
      close()
    } else {
      render(go)
    }
  })

  // Keep Tab inside the card while it's open.
  shadow.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return
    const items = [...card.querySelectorAll('button')]
    const i = items.indexOf(shadow.activeElement)
    if (e.shiftKey && i <= 0) { items.at(-1).focus(); e.preventDefault() }
    else if (!e.shiftKey && i === items.length - 1) { items[0].focus(); e.preventDefault() }
  })

  render('main')
}

const CSS = `
  :host { all: initial; }
  .backdrop {
    position: fixed; inset: 0; z-index: 2147483647;
    display: grid; place-items: center; padding: 16px;
    background: rgba(12, 18, 16, 0.55);
    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
    font-family: -apple-system, 'SF Pro Text', Inter, system-ui, sans-serif;
  }
  .card {
    width: min(380px, 100%); box-sizing: border-box; padding: 22px;
    border-radius: 24px; background: #1c1c1e; color: #fff;
    box-shadow: 0 24px 60px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.08);
  }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,.55); }
  .dot { width: 8px; height: 8px; border-radius: 4px; background: #aeaeb2; }
  .dot.dirty { background: #e5534b; } .dot.peak { background: #f2c14e; }
  .dot.later { background: #4f8ff7; } .dot.clean { background: #44a861; }
  h1 { margin: 10px 0 0; font-size: 20px; line-height: 1.25; font-weight: 650; letter-spacing: -0.01em; }
  p { margin: 10px 0 0; font-size: 14px; line-height: 1.5; color: rgba(255,255,255,.78); }
  .q { margin-top: 16px; font-weight: 600; color: #fff; }
  button {
    display: block; width: 100%; margin-top: 8px; padding: 11px 14px; box-sizing: border-box;
    border: 0; border-radius: 14px; font: inherit; font-size: 14px; font-weight: 600;
    background: #2c2c2e; color: rgba(255,255,255,.92); cursor: pointer; text-align: center;
  }
  button:hover { background: #3a3a3c; }
  button:focus-visible { outline: 2px solid #44a861; outline-offset: 2px; }
  button.primary { margin-top: 12px; background: #44a861; color: #1c1c1e; }
  button.primary:hover { filter: brightness(1.08); background: #44a861; }
  button.ghost { background: transparent; color: rgba(255,255,255,.7); font-weight: 500; }
  button.ghost:hover { background: rgba(255,255,255,.08); }
  button.link {
    width: auto; margin: 12px auto 0; padding: 4px 6px; background: transparent;
    font-size: 12px; font-weight: 500; color: rgba(255,255,255,.45); text-decoration: underline;
  }
  .note { font-size: 12px; color: rgba(255,255,255,.45); }
  .chips { margin-top: 12px; }
  .chips button { margin-top: 6px; font-weight: 500; }
`

main()
