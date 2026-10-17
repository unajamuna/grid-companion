# Chrome Web Store submission

Everything needed to publish **Grid Companion: AI Nudge**, in the order the Developer Dashboard asks for it. Copy each block into the matching field.

## Before you start (one time)

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) and sign in with the Google account you want to publish under.
2. Accept the developer agreement and pay the **one-time $5 registration fee**.
3. In **Account**, set a publisher name (for example "Grid Companion") and verify a contact email. The contact email isn't shown publicly by default.

## 1. Build and upload the package

```bash
./scripts/package-extension.sh
```

In the dashboard, click **New item** and upload **`releases/grid-companion-extension-store.zip`**. It has `manifest.json` at the top level, as the store requires, and leaves out the test files.

Each later update: bump `version` in `extension/manifest.json`, run the script again, and upload the new store zip on the item's **Package** tab.

## 2. Store listing tab

**Name** (from the manifest)
> Grid Companion: AI Nudge

**Summary** (from the manifest, 128 of 132 characters)
> A gentle pause before AI chats when California's grid runs on gas or nears its peak, plus small energy tips. Always overridable.

**Description**
> California's electricity is much cleaner at some hours than others. At midday, solar farms supply a big share of the grid. In the evening, as solar fades and people get home, gas plants fill the gap.
>
> Grid Companion: AI Nudge helps you notice the difference, without guilt or nagging.
>
> A GENTLE PAUSE BEFORE AI CHATS
> When the grid is running on gas or is near its daily peak, a short pause appears on ChatGPT, Claude, Gemini, Perplexity and Copilot. You choose:
> • Save it for later: get a reminder when cleaner power arrives (often the next morning).
> • Use a smaller model: a quick tip, then you're through.
> • Continue anyway: one quick question, then no more pauses on that site for an hour.
>
> TINY ENERGY TIPS (OPTIONAL)
> Small, seconds-long tips as desktop notifications, every 1 to 3 hours or only when the grid gets busy, plus a heads-up when the evening peak starts. Quiet from 9 PM to 8 AM. Each has "Done it" and "No more today" buttons.
>
> YOUR GRID IN THE TOOLBAR
> See what the grid is doing now, set your ZIP code, pause nudges for the day, and keep a tally of tasks you moved to cleaner hours.
>
> HONEST BY DESIGN
> • It never reads what you type or what the AI replies. It only checks which site you're on.
> • It can't see how much energy a particular AI uses. It's only about when you use it.
> • It never nudges on day-old data. For Los Angeles (LADWP) and Sacramento (SMUD), public data runs about a day behind, so it skips timing advice there.
> • No accounts, no ads, no analytics.
>
> Live grid data comes from the California ISO (CAISO) and the U.S. Energy Information Administration. Works across California.
>
> Grid Companion is an independent project and isn't affiliated with OpenAI, Anthropic, Google, Perplexity, Microsoft or any utility.

**Category:** Productivity (Lifestyle also fits)

**Language:** English

**Store icon (128×128):** `store/images/store-icon-128.png`

**Screenshots (1280×800, in this order)**
1. `store/images/1-pause-before-ai-chats.png`
2. `store/images/2-toolbar-popup.png`
3. `store/images/3-micro-tips.png`

**Small promo tile (440×280):** `store/images/promo-tile-440x280.png`

**Official URL / homepage:** https://gridcompanion.netlify.app

**Support URL:** https://github.com/unajamuna/grid-companion/issues

## 3. Privacy practices tab

**Single purpose**
> Helps people time their AI chats and everyday energy use to cleaner hours on California's electricity grid. It shows a short, overridable pause on AI chat sites when the grid is carbon-heavy or near its peak, and optional energy-tip notifications.

**Permission justifications**

- **storage:** Saves the user's settings on their device: ZIP code, whether pauses and tips are on, tip frequency, small counters, per-site snoozes, and reminders the user chose to set.
- **alarms:** Refreshes grid conditions every 15 minutes, schedules the reminders the user asks for ("Save it for later"), and spaces out optional energy tips.
- **notifications:** Shows the reminder when cleaner power arrives, and the optional energy-tip notifications the user turned on.
- **Host permission (gridcompanion.netlify.app):** Fetches current grid conditions for the user's ZIP code from the extension's own website.
- **Content scripts on chatgpt.com, chat.openai.com, claude.ai, gemini.google.com, www.perplexity.ai and copilot.microsoft.com:** Shows the pause screen on these AI chat sites when the grid is carbon-heavy or near its peak. The script only checks which site is open. It does not read or change page content, and it doesn't send anything from the page.

**Are you using remote code?** No. All JavaScript is included in the package.

**Data usage.** Check only:
- **Location**, because the user's ZIP code is sent to gridcompanion.netlify.app to look up local grid conditions and weather.

Leave everything else unchecked: no personal identity, health, financial, authentication, personal communications, web history (the saved chat address stays on the device) or user activity data is collected.

Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://gridcompanion.netlify.app/privacy.html

## 4. Distribution tab

- **Payments:** Free.
- **Visibility:** **Public**, or **Unlisted** to share by link only (good for a portfolio piece; you can switch later).
- **Regions:** United States is enough, since it only covers California grids.

## 5. Submit

Click **Submit for review**. Review usually takes a few days, sometimes up to a few weeks. Extensions that run on other sites get a closer look. You'll get an email when it's approved or if Google has questions.

After approval, add the store link to the README and the site's "Get the Chrome extension" card.

## Regenerating the images

The images in `store/images/` come from the pages in `store/scenes/`, which run the extension's real code with stand-in Chrome APIs. With the dev server running (`npm run dev -- --port 5174`):

```bash
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$C" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1280,800 \
  --virtual-time-budget=4000 --screenshot="$PWD/store/images/1-pause-before-ai-chats.png" \
  http://localhost:5174/store/scenes/chat-nudge.html
```

(Same for `popup.html` and `tip.html` at 1280,800, and `promo-tile.html` at 440,280.)
