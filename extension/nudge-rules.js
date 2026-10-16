// Shared rules for when to nudge, used by the content script, the popup and the
// background worker. Plain script (no modules) so content scripts can load it too.

/* exported GC */
const GC = {
  SITE: 'https://gridcompanion.netlify.app',
  STALE_MS: 60 * 60 * 1000, // a summary older than this isn't trusted for timing
  SNOOZE_MS: 60 * 60 * 1000, // after "Continue anyway", leave that site alone for an hour

  defaults: {
    zip: '94612',
    enabled: true,
    alsoCleanerLater: false, // also nudge when a much cleaner time is coming soon
    pausedUntil: 0, // "pause for today"
    snoozes: {}, // host -> timestamp
    stats: { shown: 0, deferred: 0, smaller: 0, continued: 0, since: 0 },
  },

  async settings() {
    const s = await chrome.storage.local.get(Object.keys(GC.defaults))
    return { ...GC.defaults, ...s }
  },

  // Why to nudge right now, or null. Day-old data never nudges: it can't speak to now.
  reason(summary, settings, now = Date.now()) {
    if (!settings.enabled || now < settings.pausedUntil) return null
    if (!summary || summary.error || summary.grid?.delayed) return null
    if (now - Date.parse(summary.generatedAt) > GC.STALE_MS) return null
    const id = summary.phase?.id
    if (id === 'higher-carbon') return 'dirty'
    if (summary.busy) return 'peak'
    if (settings.alsoCleanerLater && id === 'cleaner-later') return 'later'
    return null
  },

  time(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(':00', '')
  },

  // "9 PM" or "tomorrow at 8 AM" (for "Save it for …")
  when(iso, now = new Date()) {
    const d = new Date(iso)
    return d.toDateString() === now.toDateString() ? GC.time(iso) : `tomorrow at ${GC.time(iso)}`
  },

  // "at 9 PM" or "tomorrow at 8 AM" (for "We'll remind you …")
  at(iso, now = new Date()) {
    const d = new Date(iso)
    return d.toDateString() === now.toDateString() ? `at ${GC.time(iso)}` : `tomorrow at ${GC.time(iso)}`
  },
}
