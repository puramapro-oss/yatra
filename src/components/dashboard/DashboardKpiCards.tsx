import Link from 'next/link'

export function KpiCard({
  icon,
  label,
  value,
  hint,
  color,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  color: 'emerald' | 'cyan' | 'violet'
  href?: string
}) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-300',
    violet: 'from-violet-500/20 to-violet-500/5 text-violet-300',
  }

  const content = (
    <div className={`glass rounded-2xl p-5 bg-gradient-to-br ${colorClasses[color]} hover:scale-[1.02] transition`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`${color === 'emerald' ? 'text-emerald-300' : color === 'cyan' ? 'text-cyan-300' : 'text-violet-300'}`}>
          {icon}
        </div>
        <p className="text-xs uppercase tracking-wider text-white/55">{label}</p>
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      {hint && <p className="text-[11px] text-white/40 mt-1.5">{hint}</p>}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
