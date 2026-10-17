// The GRID wordmark plus "Companion". Screen readers hear "Grid Companion".
export function Brand({ className = '' }: { className?: string }) {
  return (
    <h1 className={`flex items-center gap-2 text-charcoal ${className}`}>
      <img src="/logo-grid.png" alt="Grid" width={95} height={28} className="h-7 w-auto sm:h-8" />
      <span className="text-2xl font-semibold tracking-tight">Companion</span>
    </h1>
  )
}
