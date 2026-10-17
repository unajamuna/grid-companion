# Grid Companion: AI Nudge (Chrome extension)

A gentle pause before AI chats (ChatGPT, Claude, Gemini, Perplexity, Copilot) when California's grid is running on gas or near its daily peak. Always overridable: save the task for cleaner hours (with a reminder), switch to a smaller model, or continue anyway after one quick question.

It also sends **micro-tip reminders**: small, seconds-long energy tips as desktop notifications, every 1–3 hours or only when the grid gets busy or dirty, with a one-time heads-up when a busy or dirty stretch starts. Quiet from 9 PM to 8 AM, no repeats of recent tips, and **Done it** / **No more today** buttons on each one.

It reads `https://gridcompanion.netlify.app/api/summary?zip=…` every 15 minutes. It never nudges on day-old data (LADWP, SMUD), and it can't see how much energy a particular AI uses; it is only about *when*.

## Install (unpacked)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this `extension` folder.
4. Pin it from the puzzle-piece menu, open the popup, and set your ZIP.

## Files

- `manifest.json`: Manifest V3; permissions are storage, alarms and notifications, plus the Grid Companion site.
- `background.js`: refreshes the summary, schedules reminders, closes tabs on request.
- `nudge-rules.js`: when to nudge (shared by everything).
- `content.js`: the nudge screen, in a shadow root so chat sites' styles can't affect it.
- `popup.*`: status, settings and a small tally.
- `dev/`: test pages with stand-in `chrome.*` APIs (open `dev/nudge-test.html` from the dev server) and `rules.test.cjs` for the reminder rules (`node extension/dev/rules.test.cjs`). Not used by the extension.
- Icons come from `scripts/make-extension-icons.py`.
