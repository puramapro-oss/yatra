'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function OceanScene() {
  const meshRef = useRef<THREE.Mesh>(null)
  const geomRef = useRef<THREE.PlaneGeometry>(null)

  const initial = useMemo(() => {
    const g = new THREE.PlaneGeometry(40, 40, 96, 96)
    return g
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const time = clock.elapsedTime
    const geom = meshRef.current.geometry as THREE.PlaneGeometry
    const pos = geom.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i]
      const y = arr[i + 1]
      arr[i + 2] = Math.sin(x * 0.3 + time * 0.6) * 0.4 + Math.cos(y * 0.4 + time * 0.4) * 0.4
    }
    pos.needsUpdate = true
    geom.computeVertexNormals()
  })

  return (
    <>
      <ambientLight intensity={0.4} color="#67e8f9" />
      <directionalLight position={[2, 4, 3]} intensity={0.7} color="#0ea5e9" />
      <fog attach="fog" args={['#082f49', 5, 25]} />
      <mesh ref={meshRef} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -1, 0]} geometry={initial}>
        <planeGeometry ref={geomRef} args={[40, 40, 96, 96]} />
        <meshStandardMaterial
          color="#0c4a6e"
          metalness={0.6}
          roughness={0.25}
          flatShading
          transparent
          opacity={0.92}
        />
      </mesh>
    </>
  )
}
