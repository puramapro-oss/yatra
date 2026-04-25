'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

export function ForestScene() {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const particles = useMemo(() => {
    const count = 600
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = Math.random() * 8 - 1
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return positions
  }, [])

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.04
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= delta * 0.3
        if (arr[i] < -1) arr[i] = 7
      }
      pos.needsUpdate = true
    }
  })

  return (
    <>
      <ambientLight intensity={0.35} color="#a7f3d0" />
      <directionalLight position={[3, 5, 2]} intensity={0.5} color="#10b981" />
      <fog attach="fog" args={['#022c22', 4, 18]} />
      <group ref={groupRef}>
        <Stars radius={50} depth={40} count={1500} factor={3} saturation={0.4} fade speed={0.3} />
      </group>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#a7f3d0"
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </>
  )
}
