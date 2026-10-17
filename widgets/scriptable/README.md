# Grid Companion widget for iPhone (and Mac)

Home-screen and Lock Screen widgets built with [Scriptable](https://scriptable.app) (free on the App Store). They are copies of the website's first two widgets, from the same data the website uses. Choose which one with the widget's **Parameter**:

- **`usage`** (the default): the energy usage chart. Phase, grid demand with its coloured level (red near the day's peak, green when low), today's hourly bars stacked by source with the record line, and the source tiles with their shares.
  - **Medium:** demand and chart on the left, top four sources on the right.
  - **Large:** the full widget: chart, freshness and all five source tiles.
  - **Small:** demand and a mini chart.
- **`actions`**: "What you can do". The mood line and four rows of tips with icons; timed tips show their time in green.
  - **Large:** all four rows, four tips each, like the website.
  - **Medium:** the top tip from each row. **Small:** a short list.
- **Lock Screen** (rectangular and inline): phase, demand and the top tip.

It refreshes about every 15 minutes (iOS decides exactly when), keeps the last good reading if a refresh fails, and opens the website when tapped.

## Install on your iPhone

1. Install **Scriptable** from the App Store and open it once.
2. Add the script, either way:
   - **Copy and paste:** on your iPhone, open [the script](https://raw.githubusercontent.com/unajamuna/grid-companion/main/widgets/scriptable/grid-companion.js), select all and copy. In Scriptable tap **+**, paste, tap the title at the top and name it **Grid Companion**, then tap **Done**.
   - **iCloud Drive:** if Scriptable uses iCloud, save `grid-companion.js` into iCloud Drive → **Scriptable** from your Mac, and it appears in the app.
3. Tap the script once in Scriptable to see a preview. The first run asks to allow network access.
4. Add the widget: long-press the Home Screen → **Edit** → **Add Widget** → **Scriptable** → pick a size → **Add Widget**.
5. Long-press the new widget → **Edit Widget**:
   - **Script:** Grid Companion
   - **Parameter:** your ZIP code and which widget, e.g. `94612 usage` or `94612 actions`. Optionally add a grid: `90012 LADWP usage` or `95814 SMUD actions`.

Add the widget twice (a Medium or Large `usage` and a Large `actions`) to get both, or stack them in a Smart Stack.

**Updating:** to get a new version, copy the script again and paste it over the old one in Scriptable (open it, select all, paste, **Done**). The widgets keep their settings.

For the Lock Screen: long-press the Lock Screen → **Customize** → **Lock Screen** → tap the widget area → **Scriptable**, then set the script and parameter the same way.

## Put it on your Mac desktop too

On macOS Sonoma or later, your iPhone's widgets can live on your Mac:

1. On the Mac: **System Settings → Desktop & Dock → Widgets** → turn on **Use iPhone widgets**.
2. Right-click the desktop → **Edit Widgets** → find **Scriptable** in the list (it's marked as from your iPhone) → drag a size onto the desktop.
3. Right-click the widget → **Edit "Scriptable"** to choose the script and ZIP.

Your Mac and iPhone need the same Apple Account, and the iPhone should be nearby or on the same Wi-Fi for widgets to update.

## Development

`dev/preview.mjs` runs the script in Node with a stand-in for Scriptable's API, for every widget size and both views, and writes `dev/preview.html`, which draws each layout at its real size:

```bash
node widgets/scriptable/dev/preview.mjs 94612          # or 90012, 95814
node widgets/scriptable/dev/preview.mjs 94612 http://localhost:5174 --old   # check fallbacks for an older live site
```

Open `/widgets/scriptable/dev/preview.html` on the dev server to look at it.
