import { Shuffle } from 'lucide-react'
import { useState } from 'react'
import type { Action, Context, Effort, Goal } from '../logic/actions'
import { effortOf, goalOf, mood, pickProject, pickRow, ROWS } from '../logic/actions'

// Same visual system as the usage widget: dark card, sans type, rounded icon tiles.
// Tags on grid-timed actions are green: "this is the best time to do it".
const TIMED_GREEN = '#44a861'

const EFFORT: Record<Effort, string> = { seconds: 'Takes seconds', minutes: 'A few minutes', project: 'A project' }
const GOAL: Record<Goal, { label: string; color: string }> = {
  save: { label: 'Uses less energy', color: '#4f8ff7' },
  shift: { label: 'Uses cleaner power', color: TIMED_GREEN },
  peak: { label: 'Eases the peak', color: '#f2c14e' },
}

function Chip({ children, dot }: { children: React.ReactNode; dot?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/75">
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} aria-hidden />}
      {children}
    </span>
  )
}

function Detail({ a, c }: { a: Action; c: Context }) {
  const headline = typeof a.headline === 'function' ? a.headline(c) : a.headline
  const goal = GOAL[goalOf(a)]
  return (
    <div className="mt-2 rounded-2xl bg-white/[0.07] p-4" aria-live="polite">
      {headline && <p className="text-[15px] font-semibold leading-snug text-white">{headline}</p>}
      <p className={`text-[15px] leading-relaxed text-white/85 ${headline ? 'mt-1' : ''}`}>{a.detail(c)}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip dot={goal.color}>{goal.label}</Chip>
        <Chip>{EFFORT[effortOf(a)]}</Chip>
      </div>
      {a.note && <p className="mt-3 text-xs text-white/45">{a.note}</p>}
    </div>
  )
}

export function ActionsWidget({ context }: { context: Context }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [shuffle, setShuffle] = useState(0)
  const [projectOpen, setProjectOpen] = useState(false)
  const project = pickProject(context)
  const projectGoal = GOAL[project.goal]

  return (
    <section className="widget overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">What you can do</h2>
          <p className="mt-0.5 text-xs text-white/60">{mood(context)}</p>
        </div>
        <button onClick={() => { setShuffle((n) => n + 1); setOpenId(null) }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/85 transition hover:bg-white/20">
          <Shuffle size={13} aria-hidden /> Shuffle
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {ROWS.map((row) => {
          const picks = pickRow(row.id, context, shuffle)
          const open = picks.find((a) => a.id === openId)
          return (
            <div key={row.id}>
              <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/45">{row.label}</h3>
              <div className="grid grid-cols-4 gap-2">
                {picks.map((a) => {
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
              {open && <Detail a={open} c={context} />}
            </div>
          )
        })}
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/45">This week’s project</h3>
        <button onClick={() => setProjectOpen((v) => !v)} aria-expanded={projectOpen}
          className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${projectOpen ? 'bg-white/15' : 'bg-[#2c2c2e] hover:bg-[#3a3a3c]'}`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-white/10">
            <project.icon size={20} strokeWidth={1.75} className="text-white/90" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-white/90">{project.label}</span>
            <span className="text-[11px] text-white/45">{project.impact === 'big' ? 'Big move · worth planning' : 'Weekend-sized'}</span>
          </span>
        </button>
        {projectOpen && (
          <div className="mt-2 rounded-2xl bg-white/[0.07] p-4">
            <p className="text-[15px] leading-relaxed text-white/85">{project.detail}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip dot={projectGoal.color}>{projectGoal.label}</Chip>
              <Chip>{project.impact === 'big' ? 'Big impact' : 'Medium impact'}</Chip>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-[11px] text-white/45">Tap any action to see why · new ideas every couple of hours</p>
    </section>
  )
}
