import { useState } from 'react'
import type { Context } from '../logic/actions'
import { ACTIONS, pickRow, ROWS } from '../logic/actions'

// Same visual system as the usage widget: dark card, sans type, rounded icon tiles.
// Tags on grid-timed actions are green: "this is the best time to do it".
const TIMED_GREEN = '#7fd67f'
export function ActionsWidget({ context }: { context: Context }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = ACTIONS.find((a) => a.id === openId)
  const wx = context.weather

  return (
    <section className="widget overflow-hidden p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">What you can do</h2>
        {wx && (
          <p className="text-right text-[11px] text-white/55 sm:text-xs">
            {wx.place} {wx.nowF}°F · {wx.summary}, high {wx.highF}°
          </p>
        )}
      </div>

      <div className="mt-3 space-y-4">
        {ROWS.map((row) => (
          <div key={row.id}>
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/45">{row.label}</h3>
            <div className="grid grid-cols-4 gap-2">
              {pickRow(row.id, context).map((a) => {
                const selected = a.id === openId
                return (
                  <button key={a.id} onClick={() => setOpenId(selected ? null : a.id)} aria-expanded={selected}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 text-center transition ${selected ? 'bg-white/15' : 'bg-[#2c2c2e] hover:bg-[#3a3a3c]'}`}>
                    <a.icon strokeWidth={1.75} className="h-6 w-6 text-white/90 sm:h-7 sm:w-7" aria-hidden />
                    <span className="text-[11px] font-medium leading-tight text-white/90 sm:text-[13px]">{a.label}</span>
                    <span className="text-[10px] leading-tight sm:text-[11px]"
                      style={{ color: a.timed ? TIMED_GREEN : 'rgba(255,255,255,0.45)' }}>
                      {a.when(context)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {open ? (
        <div className="mt-4 rounded-2xl bg-white/[0.07] p-4" aria-live="polite">
          <p className="text-[15px] leading-relaxed text-white/90">{open.detail(context)}</p>
          {open.note && <p className="mt-2 text-xs text-white/45">{open.note}</p>}
        </div>
      ) : (
        <p className="mt-4 text-center text-[11px] text-white/45">Tap any action to see why</p>
      )}
    </section>
  )
}
