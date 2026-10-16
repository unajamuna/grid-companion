import type { PhaseId } from '../types'

const FACTS: { id: string; q: string; a: string; phases: PhaseId[] }[] = [
  { id: 'duck', phases: ['clean'],
    q: 'Why is midday so clean in California?',
    a: "California has a lot of solar. Around midday it can supply a large share of the grid's power, so gas plants ramp down. After sunset they ramp back up. Grid people call this shape the \"duck curve\"." },
  { id: 'evening', phases: ['higher-carbon'],
    q: 'Why does the grid get dirtier in the evening?',
    a: 'As the sun sets, solar drops off just as people get home and switch things on. Batteries cover part of the gap, and gas plants and imports cover most of the rest. That is why the cleanest hours in California are usually around midday.' },
  { id: 'shift', phases: ['cleaner-later'],
    q: 'Does shifting really help, or only cutting back?',
    a: 'Both help. Running the same load at a cleaner hour can cut its emissions a lot without giving anything up. Over time, flexible demand also makes it easier for the grid to use solar and wind instead of wasting them.' },
  { id: 'intensity-vs-renewable', phases: ['mixed', 'unavailable'],
    q: 'Carbon intensity vs. renewable share: what\'s the difference?',
    a: 'Renewable share tells you what fraction of power comes from solar, wind and hydro. Carbon intensity tells you how much CO₂ is emitted per kWh. Nuclear is carbon-free but not "renewable", and imports can move intensity either way, so the two numbers can tell different stories.' },
  { id: 'demand', phases: ['mixed', 'clean', 'cleaner-later'],
    q: 'Does high demand mean dirty electricity?',
    a: 'Not always. On a hot, sunny afternoon demand can be high while solar keeps the grid quite clean. Demand tells you how much strain the grid is under. Carbon intensity tells you how clean the power is. They are separate signals.' },
]

export function Learn({ phaseId }: { phaseId: PhaseId }) {
  const fact = FACTS.find((f) => f.phases.includes(phaseId)) ?? FACTS[0]
  return (
    <section className="widget p-4 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">Learn</p>
      <details className="group mt-2">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-lg font-semibold leading-snug tracking-tight marker:hidden">
          {fact.q}
          <span className="mt-0.5 text-white/45 transition group-open:rotate-45">+</span>
        </summary>
        <p className="mt-3 text-[15px] leading-relaxed text-white/75">{fact.a}</p>
      </details>
    </section>
  )
}
