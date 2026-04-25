'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { ScoreBreakdown } from '@/types/vida'

const CRITERIA: { key: keyof ScoreBreakdown; label: string; max: number }[] = [
  { key: 'trajets_propres', label: 'Trajets propres', max: 3 },
  { key: 'missions', label: 'Missions', max: 2 },
  { key: 'entraide', label: 'Entraide', max: 2 },
  { key: 'regularite', label: 'Régularité', max: 1.5 },
  { key: 'anciennete', label: 'Ancienneté', max: 1.5 },
]

export function ADNMobiliteRadar({ breakdown }: { breakdown: ScoreBreakdown }) {
  const data = CRITERIA.map((c) => ({
    axis: c.label,
    value: (breakdown[c.key] / c.max) * 100,
  }))

  return (
    <div className="w-full" style={{ height: 280 }}>
      <ResponsiveContainer>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }}
          />
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
          <Radar
            name="Toi"
            dataKey="value"
            stroke="#22C55E"
            fill="#22C55E"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
