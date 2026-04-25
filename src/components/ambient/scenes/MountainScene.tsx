'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function MountainScene() {
  const snowRef = useRef<THREE.Points>(null)

  const snow = useMemo(() => {
    const count = 800
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30
      positions[i * 3 + 1] = Math.random() * 12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return positions
  }, [])

  const peaks = useMemo(() => {
    return [
      { pos: [-4, 0.5, -2] as [number, number, number], h: 4 },
      { pos: [-1, 0.5, -3] as [number, number, number], h: 5.5 },
      { pos: [2, 0.5, -2] as [number, number, number], h: 4.6 },
      { pos: [4.5, 0.5, -3] as [number, number, number], h: 5 },
    ]
  }, [])

  useFrame((_, delta) => {
    if (!snowRef.current) return
    const pos = snowRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] -= delta * 0.6
      if (arr[i] < 0) arr[i] = 12
    }
    pos.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.55} color="#cbd5e1" />
      <directionalLight position={[4, 6, 2]} intensity={0.9} color="#e2e8f0" />
      <fog attach="fog" args={['#0f172a', 6, 22]} />
      {peaks.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <coneGeometry args={[2, p.h, 6]} />
          <meshStandardMaterial color="#475569" flatShading roughness={0.8} />
        </mesh>
      ))}
      <points ref={snowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[snow, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color="#f1f5f9" transparent opacity={0.85} sizeAttenuation depthWrite={false} />
      </points>
    </>
  )
}
