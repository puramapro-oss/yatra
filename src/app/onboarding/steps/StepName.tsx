'use client'

export function StepName({ name, setName }: { name: string; setName: (v: string) => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">Étape 1 / 5</p>
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Comment on t&apos;appelle&nbsp;?
        </h1>
        <p className="text-sm text-white/55">
          Pour qu&apos;Aria et toi puissiez parler simplement.
        </p>
      </div>

      <div className="glass rounded-2xl p-2">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Camille"
          className="w-full bg-transparent text-center text-2xl font-semibold py-4 outline-none placeholder:text-white/25"
          style={{ fontFamily: 'var(--font-display)' }}
        />
      </div>

      <p className="text-xs text-white/35">
        Tu pourras le changer à tout moment dans tes paramètres.
      </p>
    </div>
  )
}
