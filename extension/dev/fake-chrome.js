// Test stand-in for the chrome.* extension APIs, so the nudge screen and popup can be
// tried in a normal browser tab. Not part of the extension package.
;(() => {
  const tomorrow8 = new Date()
  tomorrow8.setDate(tomorrow8.getDate() + 1)
  tomorrow8.setHours(8, 0, 0, 0)
  const scenario = new URLSearchParams(location.search).get('phase') ?? 'higher-carbon'
  const store = {
    zip: '94612', enabled: true, alsoCleanerLater: false, pausedUntil: 0, snoozes: {},
    stats: { shown: 4, deferred: 2, smaller: 1, continued: 1, since: Date.now() },
    summaryAt: Date.now(),
    summary: {
      place: { zip: '94612', name: 'Oakland' },
      grid: { id: 'CAISO', label: 'CAISO', live: true, delayed: false },
      phase: {
        id: scenario,
        label: { 'higher-carbon': 'Higher-carbon', mixed: 'Mixed supply', clean: 'Clean now' }[scenario] ?? scenario,
        summary: 'Gas plants are doing much of the work right now, so this is one of the most carbon-heavy times of the day. It gets cleaner tomorrow around 8 AM, once solar is back.',
        cleanStart: tomorrow8.toISOString(), cleanEnd: null,
      },
      busy: scenario === 'mixed',
      generatedAt: new Date().toISOString(),
    },
  }
  const pick = (keys) => {
    if (keys == null) return { ...store }
    const list = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys)
    return Object.fromEntries(list.filter((k) => k in store).map((k) => [k, store[k]]))
  }
  window.__log = []
  window.chrome = {
    storage: { local: { get: async (k) => pick(k), set: async (o) => { Object.assign(store, o) } } },
    runtime: { sendMessage: async (m) => { window.__log.push(m); return { ok: true } } },
    tabs: { create: (o) => window.__log.push({ open: o.url }) },
  }
  window.__store = store
})()
