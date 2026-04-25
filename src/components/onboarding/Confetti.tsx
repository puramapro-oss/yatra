'use client'

import { useEffect, useState } from 'react'

const COLORS = ['#22C55E', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B']

type Piece = {
  id: number
  left: number
  delay: number
  duration: number
  color: string
  size: number
  rotate: number
}

export function Confetti({ count = 60 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    const next: Piece[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2 + Math.random() * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    }))
    setPieces(next)
  }, [count])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-toast" aria-hidden>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20vh) rotate(var(--r)); opacity: 0 }
          10%  { opacity: 1 }
          100% { transform: translateY(110vh) rotate(calc(var(--r) + 720deg)); opacity: 0 }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 2,
            ['--r' as string]: `${p.rotate}deg`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
