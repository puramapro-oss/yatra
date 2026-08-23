interface TagProps {
  color: 'emerald' | 'amber' | 'violet'
  children: React.ReactNode
}

export function Tag({ color, children }: TagProps) {
  const cls = {
    emerald: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
    amber: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    violet: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
  }[color]
  return (
    <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${cls}`}>
      {children}
    </span>
  )
}
