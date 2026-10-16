import type { LucideProps } from 'lucide-react'

// Hand-drawn icons for things Lucide doesn't have, in the same style:
// 24-unit grid, round caps and joins, stroke follows currentColor.
function Icon({ size = 24, strokeWidth = 2, children, ...rest }: LucideProps & { children: React.ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {children}
    </svg>
  )
}

export function Spiral(props: LucideProps) {
  return <Icon {...props}><path d="M12 12a1.5 1.5 0 0 1 3 0a3 3 0 0 1-6 0a4.5 4.5 0 0 1 9 0a6 6 0 0 1-12 0" /></Icon>
}

export function Sock(props: LucideProps) {
  return (
    <Icon {...props}>
      <path d="M8 2.5h6.5v9.2l4.1 3.1a3.2 3.2 0 0 1-3.9 5.1l-5.9-4.4A3 3 0 0 1 8 13.1Z" />
      <path d="M8 6h6.5" />
    </Icon>
  )
}
