// Renders the real widget with live summary data, styled with its own className CSS.
// Open /widgets/uebersicht/dev/preview.html?zip=90012 on the dev server.
import { createRoot } from 'react-dom/client'
import * as widget from '../grid-companion.jsx'

const zip = new URLSearchParams(location.search).get('zip') ?? '94612'
const style = document.createElement('style')
style.textContent = `.gc-widget { position: absolute; ${widget.className} }`
document.head.appendChild(style)

fetch(`/api/summary?zip=${zip}`).then((r) => r.text()).then((output) => {
  createRoot(document.getElementById('desk')).render(<div className="gc-widget">{widget.render({ output, error: null })}</div>)
})
