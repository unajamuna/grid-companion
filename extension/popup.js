/* global GC */
const $ = (id) => document.getElementById(id)
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const PHASE_COLOR = {
  clean: '#6cc070', 'cleaner-later': '#4f8ff7', mixed: '#f2c14e', 'higher-carbon': '#e5534b', unavailable: '#aeaeb2',
}

async function renderStatus() {
  const { summary, summaryAt } = await chrome.storage.local.get(['summary', 'summaryAt'])
  const settings = await GC.settings()
  const el = $('status')
  if (!summary || summary.error) {
    el.innerHTML = `<p class="muted">${esc(summary?.error ?? 'No grid data yet. It refreshes every 15 minutes.')}</p>`
    return
  }
  const reason = GC.reason(summary, { ...settings, enabled: true, pausedUntil: 0 })
  const verdict = summary.grid.delayed
    ? `${esc(summary.grid.label)}’s data is a day old, so no nudges here.`
    : reason
      ? 'AI chats get a short pause right now.'
      : 'No pause needed right now. Chat away.'
  el.innerHTML = `
    <span class="pill"><span class="dot" style="background:${PHASE_COLOR[summary.phase.id] ?? '#aeaeb2'}"></span>${esc(summary.phase.label)}</span>
    <p class="summary">${esc(summary.phase.summary)}</p>
    <p class="verdict muted">${verdict}</p>`
  $('fresh').textContent = summaryAt ? `${esc(summary.place.name)} · ${GC.time(new Date(summaryAt).toISOString())}` : ''
}

async function renderSettings() {
  const s = await GC.settings()
  $('enabled').checked = s.enabled
  $('alsoLater').checked = s.alsoCleanerLater
  $('zip').value = s.zip
  const paused = Date.now() < s.pausedUntil
  $('pauseText').textContent = !s.enabled ? 'Nudges are off' : paused ? 'Paused until tomorrow' : 'Nudges are on'
  $('pause').textContent = paused ? 'Resume' : 'Pause for today'
  const st = s.stats ?? {}
  $('deferred').textContent = st.deferred ?? 0
  $('smaller').textContent = st.smaller ?? 0
  $('continued').textContent = st.continued ?? 0
}

$('enabled').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ enabled: e.target.checked })
  renderSettings()
})
$('alsoLater').addEventListener('change', (e) => chrome.storage.local.set({ alsoCleanerLater: e.target.checked }))
$('pause').addEventListener('click', async () => {
  const s = await GC.settings()
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  await chrome.storage.local.set({ pausedUntil: Date.now() < s.pausedUntil ? 0 : end.getTime() })
  renderSettings()
})
$('zipForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const zip = $('zip').value.trim()
  $('zipError').textContent = ''
  if (!/^\d{5}$/.test(zip)) {
    $('zipError').textContent = 'Enter a 5-digit California ZIP code.'
    return
  }
  await chrome.storage.local.set({ zip })
  $('status').innerHTML = '<p class="muted">Checking the grid…</p>'
  await chrome.runtime.sendMessage({ type: 'refresh' })
  const { summary } = await chrome.storage.local.get('summary')
  if (summary?.error) $('zipError').textContent = summary.error
  renderStatus()
})
$('open').addEventListener('click', (e) => {
  e.preventDefault()
  chrome.tabs.create({ url: GC.SITE })
})

renderSettings()
renderStatus()
