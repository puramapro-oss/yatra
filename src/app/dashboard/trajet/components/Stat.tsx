interface StatProps {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}

export function Stat({ icon, label, value, highlight }: StatProps) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 ${highlight ? 'bg-emerald-400/10 border border-emerald-400/30' : 'bg-white/3 border border-white/5'}`}>
      <div className="flex items-center gap-1 text-white/50 text-[10px] uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-emerald-300' : 'text-white/85'}`}>
        {value}
      </div>
    </div>
  )
}
