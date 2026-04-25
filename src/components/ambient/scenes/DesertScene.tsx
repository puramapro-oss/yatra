'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function DesertScene() {
  const meshRef = useRef<THREE.Mesh>(null)
  const sunRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    if (meshRef.current) {
      const geom = meshRef.current.geometry as THREE.PlaneGeometry
      const pos = geom.attributes.position as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i]
        const y = arr[i + 1]
        arr[i + 2] = Math.sin(x * 0.3 + time * 0.2) * 0.6 + Math.cos(y * 0.5 + time * 0.15) * 0.4
      }
      pos.needsUpdate = true
    }
    if (sunRef.current) {
      const s = 1 + Math.sin(time * 0.8) * 0.05
      sunRef.current.scale.set(s, s, s)
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} color="#fed7aa" />
      <directionalLight position={[0, 2, 5]} intensity={1} color="#fb923c" />
      <fog attach="fog" args={['#7c2d12', 5, 25]} />
      <mesh ref={sunRef} position={[0, 4, -10]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
      </mesh>
      <mesh ref={meshRef} rotation={[-Math.PI / 2.1, 0, 0]} position={[0, -1.5, 0]}>
        <planeGeometry args={[40, 40, 80, 80]} />
        <meshStandardMaterial color="#c2410c" flatShading roughness={0.95} />
      </mesh>
    </>
  )
}
