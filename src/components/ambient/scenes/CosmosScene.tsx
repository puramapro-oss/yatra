'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

export function CosmosScene() {
  const galaxyRef = useRef<THREE.Group>(null)
  const nebulaRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }, delta) => {
    if (galaxyRef.current) galaxyRef.current.rotation.z += delta * 0.05
    if (nebulaRef.current) {
      const t = clock.elapsedTime
      const s = 1 + Math.sin(t * 0.4) * 0.08
      nebulaRef.current.scale.set(s, s, s)
      const mat = nebulaRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.25 + Math.sin(t * 0.6) * 0.08
    }
  })

  return (
    <>
      <ambientLight intensity={0.15} color="#312e81" />
      <Stars radius={80} depth={60} count={4000} factor={5} saturation={0.7} fade speed={0.4} />
      <group ref={galaxyRef}>
        <Stars radius={20} depth={10} count={1500} factor={2} saturation={0.9} fade speed={1} />
      </group>
      <mesh ref={nebulaRef} position={[0, 0, -8]}>
        <sphereGeometry args={[6, 32, 32]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.3} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  )
}
