'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

export function AuroraScene() {
  const groupRef = useRef<THREE.Group>(null)

  const ribbons = useMemo(() => [
    { color: '#a855f7', y: 1.2, phase: 0 },
    { color: '#0ea5e9', y: 0.5, phase: 1.2 },
    { color: '#10b981', y: -0.4, phase: 2.4 },
  ], [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.children.forEach((child, idx) => {
      const mesh = child as THREE.Mesh
      const geom = mesh.geometry as THREE.PlaneGeometry
      const pos = geom.attributes.position as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      const phase = ribbons[idx]?.phase ?? 0
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i]
        arr[i + 2] = Math.sin(x * 0.3 + t * 0.5 + phase) * 1.2
      }
      pos.needsUpdate = true
      geom.computeVertexNormals()
    })
  })

  return (
    <>
      <ambientLight intensity={0.25} color="#312e81" />
      <Stars radius={60} depth={50} count={2500} factor={4} saturation={0.6} fade speed={0.5} />
      <group ref={groupRef}>
        {ribbons.map((r, idx) => (
          <mesh key={idx} position={[0, r.y, -3]} rotation={[0, 0, 0]}>
            <planeGeometry args={[16, 2.5, 60, 8]} />
            <meshBasicMaterial color={r.color} transparent opacity={0.5} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </>
  )
}
