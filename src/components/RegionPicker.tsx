import { ChevronDown, MapPin } from 'lucide-react'
import type { Region } from '../regions'
import { REGIONS } from '../regions'

// A native select (good on phones, accessible by default) styled as a dark pill.
// Regions on other grids are listed but disabled until their data is supported.
export function RegionPicker({ region, onChange }: { region: Region; onChange: (r: Region) => void }) {
  const live = REGIONS.filter((r) => r.grid)
  const soon = REGIONS.filter((r) => !r.grid)
  return (
    <label className="relative mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#1c1c1e]/85 py-1 pr-7 pl-2.5 text-xs text-white ring-1 ring-white/10 shadow-lg shadow-black/20">
      <MapPin size={13} className="text-[#7fd67f]" aria-hidden />
      <span className="sr-only">Your region</span>
      <select
        value={region.id}
        onChange={(e) => {
          const r = REGIONS.find((x) => x.id === e.target.value)
          if (r?.grid) onChange(r)
        }}
        className="cursor-pointer appearance-none bg-transparent font-medium outline-none"
      >
        <optgroup label="CAISO grid · live">
          {live.map((r) => (
            <option key={r.id} value={r.id}>{r.name} ({r.utility})</option>
          ))}
        </optgroup>
        <optgroup label="Separate grids · coming soon">
          {soon.map((r) => (
            <option key={r.id} value={r.id} disabled>{r.name} ({r.utility})</option>
          ))}
        </optgroup>
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 text-white/60" aria-hidden />
    </label>
  )
}
