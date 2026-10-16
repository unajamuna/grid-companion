import { useState } from 'react'
import type { Context } from '../logic/actions'
import { ACTIONS, pickRow, ROWS } from '../logic/actions'

// Lively-style widget: a row label, then four actions with icons.
// The tag under each icon changes with grid conditions; tap one for the reason.
export function ActionsWidget({ context }: { context: Context }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = ACTIONS.find((a) => a.id === openId)

  return (
    <section className="overflow-hidden rounded-[28px] bg-gradient-to-b from-[#24180c] via-[#120d07] to-black px-2 py-5 text-[#efe4d0] shadow-2xl shadow-black/30 ring-1 ring-white/10 sm:px-5">
      <h2 className="sr-only">What to do with your energy right now</h2>
      <p className="mb-4 px-2 text-[11px] text-[#a8957a] sm:text-xs">
        {context.weather
          ? `Tips for today · ${context.weather.place} ${context.weather.nowF}°F · ${context.weather.summary}, high ${context.weather.highF}°F`
          : 'Tips for today'}
      </p>
      <div className="grid grid-cols-[4.4rem_repeat(4,minmax(0,1fr))] items-start gap-y-4 sm:grid-cols-[7rem_repeat(4,minmax(0,1fr))]">
        {ROWS.map((row) => (
          <Row key={row.id} label={row.label} tone={row.tone}>
            {pickRow(row.id, context).map((a) => {
              const selected = a.id === openId
              return (
                <button key={a.id} onClick={() => setOpenId(selected ? null : a.id)} aria-expanded={selected}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-0.5 py-1.5 text-center transition ${selected ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                  <a.icon strokeWidth={1.5} className="h-7 w-7 text-[#f3e3c3] sm:h-8 sm:w-8" aria-hidden />
                  <span className="text-[11px] font-medium leading-tight text-[#e8dcc6] sm:text-[13px]">{a.label}</span>
                  <span className="text-[10px] leading-tight text-[#a8957a] sm:text-[11px]">{a.when(context)}</span>
                </button>
              )
            })}
          </Row>
        ))}
      </div>

      {open && (
        <div className="mx-1 mt-4 rounded-2xl bg-white/[0.07] p-4" aria-live="polite">
          <p className="font-display text-lg leading-snug text-[#f6ecda]">{open.detail(context)}</p>
          {open.note && <p className="mt-2 text-xs text-[#a8957a]">{open.note}</p>}
        </div>
      )}
      {!open && <p className="mt-4 text-center text-[11px] text-[#a8957a]">Tap any action to see why</p>}
    </section>
  )
}

function Row({ label, tone, children }: { label: string; tone: string; children: React.ReactNode }) {
  return (
    <>
      <p className={`self-center pl-1 font-display text-[21px] leading-none sm:text-[38px] ${tone}`}>{label}</p>
      {children}
    </>
  )
}
