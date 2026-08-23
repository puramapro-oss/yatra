export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">{label}</label>
      {children}
    </div>
  )
}
