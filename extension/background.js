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
  if (alarm.name === 'refresh') return refresh()
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

chrome.notifications.onClicked.addListener(async (id) => {
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
    } else if (msg.type === 'refresh') {
      await refresh()
      reply({ ok: true })
    }
  })()
  return true // keep the channel open for the async reply
})
