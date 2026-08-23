interface GroupProps {
  label: string
  children: React.ReactNode
}

export function Group({ label, children }: GroupProps) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}
