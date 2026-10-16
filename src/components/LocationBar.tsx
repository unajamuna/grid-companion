import { ChevronDown, MapPin, Pencil, Zap } from 'lucide-react'
import { useState } from 'react'
import type { GridId, Place } from '../location'
import { GRID_INFO, gridFor, lookupZip } from '../location'

// Top-of-page location: the ZIP decides the weather and, by default, the grid.
// The grid picker lets people correct our guess.
export function LocationBar({ place, onPlace }: { place: Place; onPlace: (p: Place) => void }) {
  const [editing, setEditing] = useState(false)
  const [zip, setZip] = useState(place.zip)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const grid = gridFor(place)
  const guessed: GridId = place.otherGrid ?? 'CAISO'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onPlace(await lookupZip(zip.trim())) // a new ZIP clears any manual grid choice
      setEditing(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const note = place.gridOverride && place.gridOverride !== guessed
    ? `You picked ${GRID_INFO[grid].label}. Your ZIP suggested ${GRID_INFO[guessed].label}.`
    : grid === 'CAISO'
      ? 'Live for most of California. Picked from your ZIP; if your bill is from LADWP or SMUD, switch the grid.'
      : `Picked from your ZIP. ${GRID_INFO[grid].label}'s data arrives about a day late. If your bill is from someone else, switch to CAISO.`

  return (
    <section className="widget mt-4 rounded-2xl p-3 sm:p-3.5" aria-label="Your location and grid">
      <div className="flex flex-wrap items-center gap-2">
        {!editing && (
          <button onClick={() => { setZip(place.zip); setEditing(true) }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1.5 pr-3 pl-2.5 text-xs text-white/90 transition hover:bg-white/20"
            aria-label={`Change ZIP code, currently ${place.place} ${place.zip}`}>
            <MapPin size={14} className="text-[#7fd67f]" aria-hidden />
            {place.place} · {place.zip}
            <Pencil size={11} className="text-white/50" aria-hidden />
          </button>
        )}
        {/* The visible pill shows the short name; a transparent native select on top gives
            the full list (and phone-friendly picking) with longer descriptions. */}
        <label className="relative inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1.5 pr-7 pl-2.5 text-xs text-white/90 transition hover:bg-white/20">
          <Zap size={14} className="text-[#f2c14e]" aria-hidden />
          <span className="text-white/60">Grid</span>
          <span className="font-medium text-white">{GRID_INFO[grid].label}</span>
          {!GRID_INFO[grid].live && <span className="text-[#f2c14e]/90">· delayed</span>}
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 text-white/60" aria-hidden />
          <select value={grid} aria-label="Your electricity grid"
            onChange={(e) => onPlace({ ...place, gridOverride: e.target.value as GridId })}
            className="absolute inset-0 cursor-pointer opacity-0">
            {(Object.keys(GRID_INFO) as GridId[]).map((id) => (
              <option key={id} value={id}>
                {GRID_INFO[id].label} · {GRID_INFO[id].who}{GRID_INFO[id].live ? '' : ' (day-old data)'}
              </option>
            ))}
          </select>
        </label>
      </div>

      {editing && (
        <form onSubmit={submit} className="mt-3">
          <label htmlFor="zip" className="text-xs font-medium text-white/70">Your ZIP code</label>
          <div className="mt-1.5 flex gap-2">
            <input id="zip" inputMode="numeric" autoComplete="postal-code" maxLength={5} autoFocus
              value={zip} onChange={(e) => { setZip(e.target.value.replace(/\D/g, '')); setError(null) }}
              placeholder="94612"
              className="w-28 rounded-xl bg-[#2c2c2e] px-3 py-2 text-base tabular-nums text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-[#7fd67f]" />
            <button type="submit" disabled={busy}
              className="rounded-xl bg-[#7fd67f] px-4 py-2 text-sm font-semibold text-[#1c1c1e] transition hover:brightness-110">
              {busy ? 'Checking…' : 'Update'}
            </button>
            <button type="button" onClick={() => { setEditing(false); setError(null) }}
              className="rounded-xl px-3 py-2 text-sm text-white/60 hover:text-white">
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-[#ff8a80]" role="alert">{error}</p>}
          <p className="mt-2 text-[11px] text-white/45">California only for now.</p>
        </form>
      )}

      {!editing && <p className="mt-2 px-1 text-[11px] leading-relaxed text-white/50">{note}</p>}
    </section>
  )
}
