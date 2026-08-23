interface TagProps {
  children: React.ReactNode
}

export function Tag({ children }: TagProps) {
  return (
    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/65 border border-white/10">
      {children}
    </span>
  )
}
