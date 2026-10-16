# Grid Companion

A small companion for the California power grid. It shows how much electricity the grid is using and what it's made of, then suggests flexible, low-effort ways to use energy at cleaner times.

Built as a climate-tech portfolio project. The design takes cues from the iOS Screen Time widget and Lively's Do / Move / Eat widget.

## What it does

- **Usage widget:** live grid demand, an hourly chart of today split by energy source, and the top sources right now.
- **Actions widget:** Home / Tech / Save suggestions that change with grid conditions. Tap one to see why.
- **Phases:** *Clean window*, *Cleaner later*, *Mixed supply* or *Data unavailable*, judged against the next 24 hours on this grid rather than an absolute standard.

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
