# Grid Companion

A small companion for the California power grid. It shows how much electricity the grid is using and what it's made of, then suggests flexible, low-effort ways to use energy at cleaner times.

Built as a climate-tech portfolio project. The design takes cues from the iOS Screen Time widget and Lively's Do / Move / Eat widget.

## What it does

- **Usage widget:** live grid demand, an hourly chart of today split by energy source, and the top sources right now.
- **Actions widget:** Home / Tech / Save suggestions that change with grid conditions. Tap one to see why.
- **Phases:** *Clean window*, *Cleaner later*, *Mixed supply* or *Data unavailable*, judged against the next 24 hours on this grid rather than an absolute standard.

## Location and weather

Viewers enter a California ZIP code (looked up with [Zippopotam.us](https://www.zippopotam.us/)). A small widget shows local weather from [Open-Meteo](https://open-meteo.com/), and the tips follow that weather. ZIPs outside California are declined.

Most ZIPs get live CAISO data, which covers its whole footprint as one grid. ZIPs that are probably served by LADWP (City of Los Angeles) or SMUD (Sacramento, on the BANC balancing authority) get their own grid instead, from the U.S. EIA's [Hourly Electric Grid Monitor](https://www.eia.gov/electricity/gridmonitor/) (EIA-930, respondents `LDWP` and `BANC`). EIA publishes generation by fuel about a day late, so for those grids the app:

- labels everything "Delayed · as of <time>" instead of "Live", with a banner saying so
- shows the most recent full day EIA has (usually yesterday) as hourly bars and a "Yesterday's pattern" carbon curve
- gives no real-time timing advice: the phase is always "Data unavailable"
- estimates carbon intensity from the mix (gas ≈ 450 g/kWh, oil ≈ 650, coal ≈ 1000, unspecified "other" ≈ 300, the rest ≈ 0), and labels it as an estimate. EIA doesn't report imports, so the mix covers power made inside the area.

## Data

Live data comes from CAISO's public [Today's Outlook](https://www.caiso.com/todays-outlook) files (5-minute updates, no API key). Carbon intensity is CAISO's reported CO₂ divided by total supply. CAISO publishes no carbon forecast, so the app estimates one from CAISO's net-demand forecast, and for hours after midnight assumes a day like today. Import emissions are CAISO estimates.

If CAISO can't be reached, the app falls back to clearly labeled sample data. Add `?demo` to the URL to view the sample day on purpose.

Advice is hand-written and rule-based. No model generates energy claims.

## Run locally

```bash
npm install
npm run dev
```

Deployed on Netlify. `netlify.toml` proxies `/caiso/*` to CAISO, because CAISO's files don't allow cross-origin requests.

LADWP and SMUD data needs a free [EIA API key](https://www.eia.gov/opendata/register.php). `netlify/functions/eia.ts` (served at `/api/eia`) adds the key on the server so it never reaches the browser. Set `EIA_API_KEY` in Netlify's environment variables, and for local dev put `EIA_API_KEY=...` in a `.env` file (gitignored); `vite.config.ts` runs the same function in the dev server.

## Chrome extension: a gentle pause before AI chats

When California's grid is running on gas or near its daily peak, the extension shows a short pause on ChatGPT, Claude, Gemini, Perplexity and Copilot: save the task for cleaner hours (with a reminder), switch to a smaller model, or continue anyway. It can also send small energy tips as desktop notifications. You can always override it, and it only ever contacts this site.

### Install it (about 2 minutes)

It isn't in the Chrome Web Store yet, so it installs as a "developer" extension:

1. **[Download the extension](https://github.com/unajamuna/grid-companion/releases/latest/download/grid-companion-extension.zip)** and double-click the zip to unzip it. You'll get a folder called **grid-companion-extension**. Move it somewhere you'll keep it, like Documents, since Chrome runs it from that folder.
2. In Chrome, go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose the **grid-companion-extension** folder.
5. Pin it from the puzzle-piece menu, click the leaf icon, and enter your California ZIP code.

Chrome may remind you that a developer-mode extension is on. That's expected. To update later, download the new zip, replace the folder, and click the reload arrow on the extension in `chrome://extensions`.

Works in other Chromium browsers too (Edge, Brave, Arc). More detail is in [extension/README.md](extension/README.md).

## Desktop widget (Übersicht)

`widgets/uebersicht/grid-companion.jsx` is a desktop widget for [Übersicht](https://tracesof.net/uebersicht/) on macOS. Copy it into Übersicht's widgets folder (menu bar icon → Open Widgets Folder) and set your ZIP at the top of the file. It refreshes every 15 minutes from `/api/summary`, a Netlify function that runs the app's own loaders and rules and returns the phase, demand, energy mix, weather and one tip per row as JSON.
