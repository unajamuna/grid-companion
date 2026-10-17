// The white GRID wordmark. The app is still "Grid Companion": that's what the
// browser tab says and what screen readers hear.
export function Brand({ className = '' }: { className?: string }) {
  return (
    <h1 className={className}>
      <img
        src="/logo-grid-white.png"
        alt="Grid Companion"
        width={74}
        height={22}
        // A faint shadow keeps the light logo readable over the bright sky.
        className="h-5 w-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] sm:h-[22px]"
      />
    </h1>
  )
}
