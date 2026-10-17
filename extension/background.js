// Keeps a fresh grid summary in storage, and handles reminders and tab closing
// for the nudge screen.
importScripts('nudge-rules.js')

const REFRESH_MIN = 15

async function refresh() {
  const { zip } = await GC.settings()
  try {
    const res = await fetch(`${GC.SITE}/api/summary?zip=${encodeURIComponent(zip)}`)
    const summary = await res.json()
    await chrome.storage.local.set({ summary, summaryAt: Date.now() })
  } catch (e) {
    console.warn('Grid Companion: summary unavailable', e)
  }
}

// ---- Micro-tip reminders ----
async function sendTip(kind, summary, s) {
  const tip = GC.pickTip(summary, s.recentTips)
  if (!tip) return false
  const { title, message } = GC.tipNotice(tip, summary, kind)
  chrome.notifications.create(`tip:${tip.id}:${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    buttons: [{ title: 'Done it' }, { title: 'No more today' }],
    priority: 0,
  })
  const now = new Date()
  const stretch = summary.phase?.id === 'higher-carbon' ? 'dirty' : summary.busy ? 'peak' : null
  await chrome.storage.local.set({
    lastTipAt: now.getTime(),
    recentTips: [tip.id, ...s.recentTips].slice(0, 8),
    // Remember the stretch we alerted for, so each one alerts once.
    ...(kind === 'alert' && stretch ? { lastAlert: `${stretch}:${now.toDateString()}` } : {}),
  })
  return true
}

async function maybeTip() {
  const { summary } = await chrome.storage.local.get('summary')
  const s = await GC.settings()
  const kind = GC.tipDue(summary, s)
  if (kind) await sendTip(kind, summary, s)
}

const endOfToday = () => {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(null)
  const fill = {}
  for (const [k, v] of Object.entries(GC.defaults)) if (!(k in current)) fill[k] = v
  if (!current.stats) fill.stats = { ...GC.defaults.stats, since: Date.now() }
  await chrome.storage.local.set(fill)
  chrome.alarms.create('refresh', { periodInMinutes: REFRESH_MIN })
  refresh()
})
chrome.runtime.onStartup.addListener(refresh)

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refresh') {
    await refresh()
    return maybeTip()
  }
  if (alarm.name.startsWith('remind:')) {
    const { reminders = {} } = await chrome.storage.local.get('reminders')
    const r = reminders[alarm.name]
    if (!r) return
    chrome.notifications.create(alarm.name, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Cleaner power now',
      message: `Good time for that AI task you saved on ${r.site}.`,
      priority: 1,
    })
  }
})

chrome.notifications.onButtonClicked.addListener(async (id, button) => {
  if (!id.startsWith('tip:')) return
  if (button === 0) {
    const { stats = GC.defaults.stats } = await chrome.storage.local.get('stats')
    stats.tipsDone = (stats.tipsDone ?? 0) + 1
    await chrome.storage.local.set({ stats })
  } else {
    await chrome.storage.local.set({ tipsPausedUntil: endOfToday() })
  }
  chrome.notifications.clear(id)
})

chrome.notifications.onClicked.addListener(async (id) => {
  if (id.startsWith('tip:')) {
    chrome.tabs.create({ url: GC.SITE })
    chrome.notifications.clear(id)
    return
  }
  const { reminders = {} } = await chrome.storage.local.get('reminders')
  const r = reminders[id]
  if (r) chrome.tabs.create({ url: r.url })
  delete reminders[id]
  await chrome.storage.local.set({ reminders })
  chrome.notifications.clear(id)
})

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  ;(async () => {
    if (msg.type === 'remind') {
      const name = `remind:${Date.now()}`
      const { reminders = {} } = await chrome.storage.local.get('reminders')
      reminders[name] = { url: msg.url, site: msg.site }
      await chrome.storage.local.set({ reminders })
      chrome.alarms.create(name, { when: msg.when })
      reply({ ok: true })
    } else if (msg.type === 'closeTab' && sender.tab?.id) {
      chrome.tabs.remove(sender.tab.id)
    } else if (msg.type === 'tipNow') {
      // "Send one now" from the popup: skips the schedule and quiet hours.
      const { summary } = await chrome.storage.local.get('summary')
      const ok = summary && !summary.error ? await sendTip('regular', summary, await GC.settings()) : false
      reply({ ok })
    } else if (msg.type === 'refresh') {
      await refresh()
      reply({ ok: true })
    }
  })()
  return true // keep the channel open for the async reply
})
