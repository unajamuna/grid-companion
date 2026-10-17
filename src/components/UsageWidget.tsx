import { useState } from 'react'
import { fmtDayTime, fmtTime } from '../logic/phase'
import { GROUP_ORDER, GROUPS, groupMix } from '../sources'
import type { GridSnapshot, HourUsage, Phase } from '../types'
import { PHASE_STYLE } from './PhaseIcon'

const hourLabel = (h: number) => (h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`)

// Where the reading sits in the day's range, in plain words, with a colour to match:
// red near the day's peak, green near its low, the usual white in between.
// (The record shows as the dashed line on the chart, so it isn't repeated here.)
const LEVEL_COLOR = { peak: '#e5534b', low: '#44a861', moderate: undefined }

function demandLevel(now: number, today: HourUsage[], delayed: boolean) {
  const values = today.map((h) => h.demandMW)
  const [min, max] = [Math.min(...values, now), Math.max(...values, now)]
  const pos = max > min ? (now - min) / (max - min) : 0.5
  const day = delayed ? 'that day' : 'today'
  if (pos >= 0.85) return { tone: 'peak' as const, text: `Near ${day}’s peak` }
  if (pos <= 0.25) return { tone: 'low' as const, text: `Low for ${day}` }
  return { tone: 'moderate' as const, text: `Moderate for ${day}` }
}

type Props = {
  today: HourUsage[]
  snapshot: GridSnapshot
  phase: Phase
  isDemo: boolean
  delayed?: boolean
  recordMW?: number // drawn as a reference line so bars read against the grid's real high-water mark
}

// Screen Time–style widget: how much power the grid is using today, and what kind.
export function UsageWidget({ today, snapshot, phase, isDemo, delayed = false, recordMW }: Props) {
  const gw = snapshot.demandMW == null ? '—' : (snapshot.demandMW / 1000).toFixed(1)
  const [showWhy, setShowWhy] = useState(false)
  const P = PHASE_STYLE[phase.id]
  const nowGroups = snapshot.mix ? groupMix(snapshot.mix) : null
  const ranked = nowGroups ? [...GROUP_ORDER].sort((a, b) => nowGroups[b] - nowGroups[a]) : []
  const peak = today.reduce((b, h) => (h.demandMW > b.demandMW ? h : b), today[0])
  const scaleMW = Math.max((recordMW ?? 0) * 1.15, peak.demandMW * 1.1)
  const recordPct = recordMW ? (recordMW / scaleMW) * 100 : null
  const observedAt = new Date(snapshot.observedAt)
  const hasForecast = today.some((h) => h.isForecast)

  return (
    <section className="widget grid grid-cols-[1fr_auto] overflow-hidden">
      <div className="min-w-0 p-4 sm:p-5">
        <button
          onClick={() => setShowWhy((v) => !v)}
          aria-expanded={showWhy}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/12 py-1 pr-3 pl-2 text-xs font-medium text-white/90 transition hover:bg-white/20"
        >
          <P.icon size={15} strokeWidth={2.2} color={P.color} aria-hidden />
          {phase.label}
        </button>
        {showWhy && <p className="mt-2 text-xs leading-relaxed text-white/70">{phase.summary} {phase.why}</p>}
        <p className="mt-3 text-[34px] font-semibold leading-none tracking-tight sm:text-5xl">
          {gw}
          <span className="ml-1 text-lg font-medium text-white/60 sm:text-2xl">GW</span>
        </p>
        <p className="mt-2 text-xs text-white/55">{delayed ? `Grid demand at ${fmtDayTime(observedAt)}` : 'Grid demand now'}</p>
        {snapshot.demandMW != null && (() => {
          const level = demandLevel(snapshot.demandMW, today, delayed)
          return (
            <p className={`mt-0.5 text-xs ${level.tone === 'moderate' ? 'text-white/85' : 'font-medium'}`}
              style={{ color: LEVEL_COLOR[level.tone] }}>
              {level.text}
            </p>
          )
        })()}

        <div className="relative mt-4 h-28 sm:h-32">
          <div className="absolute inset-x-0 bottom-0 border-t border-white/15" />
          {[0, 6, 12, 18].map((h) => (
            <div key={h} className="absolute inset-y-0 border-l border-dashed border-white/10"
              style={{ left: `${(h / 24) * 100}%` }} />
          ))}
          {recordPct != null && (
            <div className="absolute inset-x-0 border-t border-dashed border-white/40" style={{ bottom: `${recordPct}%` }}>
              <span className="absolute right-0 -translate-y-full pb-0.5 text-[10px] text-white/60 sm:text-[11px]">
                Record {Math.round(recordMW! / 1000)} GW
              </span>
            </div>
          )}
          <div className="absolute inset-0 flex items-end gap-[2px] px-[1px]" role="img"
            aria-label={`Hourly grid demand ${delayed ? `on ${observedAt.toLocaleDateString([], { weekday: 'long' })}` : 'today'}, peaking around ${hourLabel(new Date(peak.at).getHours())} at ${(peak.demandMW / 1000).toFixed(1)} gigawatts${recordMW ? `, against a record of ${Math.round(recordMW / 1000)} gigawatts` : ''}. Bars are split by energy source${hasForecast ? '; grey bars are forecast' : ''}.`}>
            {today.map((h) => {
              const g = h.mix ? groupMix(h.mix) : null
              return (
                <div key={h.at} className="flex flex-1 flex-col-reverse overflow-hidden rounded-t-[3px]"
                  style={{ height: `${(h.demandMW / scaleMW) * 100}%` }}>
                  {g ? (
                    GROUP_ORDER.map((k) => (
                      <div key={k} style={{ height: `${g[k] * 100}%`, background: GROUPS[k].color }} />
                    ))
                  ) : (
                    <div className="h-full bg-white/20" title="Forecast demand" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-1.5 flex text-[10px] text-white/50 sm:text-xs">
          {[0, 6, 12, 18].map((h) => (
            <span key={h} className="flex-1">{hourLabel(h)}</span>
          ))}
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-[10px] text-white/45 sm:text-[11px]">
          <span>
            {delayed
              ? `Delayed · as of ${fmtDayTime(observedAt)}`
              : `${isDemo ? 'Sample data' : 'Live from CAISO'} · ${fmtTime(observedAt)}`}
          </span>
          {hasForecast && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-sm bg-white/25" /> forecast
              </span>
            </>
          )}
        </p>
      </div>

      <ul className="flex flex-col justify-around gap-1.5 bg-[#2c2c2e] px-3 py-4 sm:px-4" aria-label="Where power comes from right now">
        {ranked.map((k) => {
          const G = GROUPS[k]
          return (
            <li key={k} className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] sm:h-8 sm:w-8" style={{ background: G.color }}>
                <G.icon size={16} strokeWidth={2.2} color="#1c1c1e" aria-hidden />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-base font-medium tabular-nums text-white/80 sm:text-lg">
                  {Math.round(nowGroups![k] * 100)}%
                </span>
                <span className="mt-0.5 whitespace-nowrap text-[10px] text-white/50">{G.label}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
