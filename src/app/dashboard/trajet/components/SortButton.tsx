interface SortButtonProps {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
}

export function SortButton({ active, onClick, label, icon }: SortButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition ${
        active
          ? 'bg-violet-400/15 text-violet-300 border-violet-400/40'
          : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/8'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
