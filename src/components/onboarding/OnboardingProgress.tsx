export function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 px-6 pt-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
            i < step
              ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
              : i === step
                ? 'bg-white/30'
                : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  )
}
