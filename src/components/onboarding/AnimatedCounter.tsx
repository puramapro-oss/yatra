'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1.6,
  decimals = 0,
}: {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  decimals?: number
}) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) => {
    const fixed = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()
    return `${prefix}${fixed.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${suffix}`
  })
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    animate(motionValue, value, { duration, ease: [0.25, 0.46, 0.45, 0.94] })
  }, [motionValue, value, duration])

  return <motion.span>{display}</motion.span>
}
