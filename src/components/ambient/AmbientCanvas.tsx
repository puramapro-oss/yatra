'use client'

import { Suspense, useEffect, useState, lazy } from 'react'
import { Canvas } from '@react-three/fiber'

const ForestScene = lazy(() => import('./scenes/ForestScene').then((m) => ({ default: m.ForestScene })))
const OceanScene = lazy(() => import('./scenes/OceanScene').then((m) => ({ default: m.OceanScene })))
const MountainScene = lazy(() => import('./scenes/MountainScene').then((m) => ({ default: m.MountainScene })))
const DesertScene = lazy(() => import('./scenes/DesertScene').then((m) => ({ default: m.DesertScene })))
const AuroraScene = lazy(() => import('./scenes/AuroraScene').then((m) => ({ default: m.AuroraScene })))
const CosmosScene = lazy(() => import('./scenes/CosmosScene').then((m) => ({ default: m.CosmosScene })))

export function AmbientCanvas({ slug }: { slug: string }) {
  const [hidden, setHidden] = useState(false)
  const [pixelRatio, setPixelRatio] = useState(1)

  useEffect(() => {
    setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  if (hidden) {
    // pause rendering quand tab cachée — économise CPU/batterie
    return null
  }

  return (
    <Canvas
      dpr={pixelRatio}
      camera={{ position: [0, 1.5, 6], fov: 65 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>{renderScene(slug)}</Suspense>
    </Canvas>
  )
}

function renderScene(slug: string) {
  switch (slug) {
    case 'forest':
      return <ForestScene />
    case 'ocean':
      return <OceanScene />
    case 'mountain':
      return <MountainScene />
    case 'desert':
      return <DesertScene />
    case 'aurora':
      return <AuroraScene />
    case 'cosmos':
      return <CosmosScene />
    default:
      return null
  }
}
