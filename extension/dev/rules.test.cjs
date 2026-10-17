// Checks the reminder rules in nudge-rules.js. Run: node extension/dev/rules.test.cjs
const fs = require('fs'), vm = require('vm')
const ctx = {}; vm.createContext(ctx)
vm.runInContext(fs.readFileSync(require("path").join(__dirname, "..", "nudge-rules.js"), 'utf8') + '\nthis.GC = GC', ctx)
const GC = ctx.GC
const base = { ...GC.defaults }
const at = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d }
const sum = (o = {}) => ({ generatedAt: new Date().toISOString(), grid: { delayed: false }, phase: { id: 'mixed', label: 'Mixed supply' }, busy: false,
  quickTips: [{ id: 'a', label: 'Lid on', headline: 'H', detail: 'D', timed: false }, { id: 'b', label: 'Delay', detail: 'X', timed: true }], ...o })
const check = (name, got, want) => console.log((JSON.stringify(got) === JSON.stringify(want) ? 'PASS' : 'FAIL'), name, JSON.stringify(got))
check('quiet at 10 PM', GC.tipDue(sum({ busy: true }), base, at(22)), null)
check('quiet at 7 AM', GC.tipDue(sum(), base, at(7)), null)
check('regular when never shown', GC.tipDue(sum(), base, at(12)), 'regular')
check('not due 1h after last (every 2h)', GC.tipDue(sum(), { ...base, lastTipAt: +at(11) }, at(12)), null)
check('alert when peak starts', GC.tipDue(sum({ busy: true, generatedAt: at(16, 55).toISOString() }), { ...base, lastTipAt: +at(16, 50) }, at(17)), 'alert')
check('no second alert same stretch', GC.tipDue(sum({ busy: true }), { ...base, lastTipAt: +at(17), lastAlert: `peak:${at(17).toDateString()}` }, at(17, 30)), null)
check('dirty after peak alerts again', GC.tipDue(sum({ phase: { id: 'higher-carbon' }, generatedAt: at(18, 10).toISOString() }), { ...base, lastTipAt: +at(18), lastAlert: `peak:${at(17).toDateString()}` }, at(18, 15)), 'alert')
check('alert-only mode skips regular', GC.tipDue(sum(), { ...base, tipsEvery: 0 }, at(12)), null)
check('delayed data never alerts', GC.tipDue(sum({ busy: true, grid: { delayed: true } }), { ...base, tipsEvery: 0 }, at(17)), null)
check('paused for today', GC.tipDue(sum(), { ...base, tipsPausedUntil: +at(23, 59) }, at(12)), null)
check('skips recent tip', GC.pickTip(sum(), ['a'])?.id, 'b')
check('no timed tips on delayed data', GC.pickTip(sum({ grid: { delayed: true } }), ['a'])?.id, 'a')
check('alert title', GC.tipNotice(sum().quickTips[0], sum({ busy: true }), 'alert').title, 'The evening peak is here · Lid on')
check('stale data does not alert', GC.tipDue(sum({ busy: true, generatedAt: at(15).toISOString() }), { ...base, tipsEvery: 0 }, at(17)), null)
