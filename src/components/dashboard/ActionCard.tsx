export function ActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="glass rounded-2xl p-5 hover:bg-white/10 transition text-left w-full"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-violet-400/20 flex items-center justify-center text-emerald-300 shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs text-white/55">{description}</p>
        </div>
      </div>
    </button>
  )
}
