import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Preload } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode, type BloomEffect } from 'postprocessing'
import * as THREE from 'three'
import { scrollState, setUI, useUI } from '../lib/scroll'
import { Director } from './Director'
import { HeartWorld } from './Heart'
import { Particles } from './Particles'
import { Tunnel } from './Tunnel'
import { stage } from './stage'

// later scenes are split out and only fetched once the visitor starts the journey
const Hospital = lazy(() => import('./Hospital'))
const Specialties3D = lazy(() => import('./Specialties3D'))
const Technology3D = lazy(() => import('./Technology3D'))

/** Image-based lighting built from soft light panels: reflections without downloading an HDRI */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={3} position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} color="#ffffff" />
      <Lightformer form="rect" intensity={1.6} position={[-14, 4, 6]} rotation-y={Math.PI / 2} scale={[20, 4, 1]} color="#dff3ff" />
      <Lightformer form="rect" intensity={1.2} position={[14, 3, -6]} rotation-y={-Math.PI / 2} scale={[20, 3, 1]} color="#eaf4fa" />
      <Lightformer form="ring" intensity={2} position={[0, 4, 14]} scale={6} color="#5fe3ff" />
      <Lightformer form="rect" intensity={0.8} position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[40, 40, 1]} color="#9fb4c2" />
    </Environment>
  )
}

function Post() {
  const bloom = useRef<BloomEffect>(null)
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = THREE.MathUtils.lerp(bloom.current.intensity, stage.bloom, 0.15)
  })
  return (
    <EffectComposer multisampling={4}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={1} radius={0.7} />
      <Vignette darkness={0.42} offset={0.32} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    requestAnimationFrame(onReady)
  })
  return null
}

export function Experience({ quality }: { quality: 'high' | 'low' }) {
  const hi = quality === 'high'
  const covered = useUI((u) => u.covered)
  const [later, setLater] = useState(false)

  useEffect(() => {
    // mount the later worlds once the visitor scrolls, or when the browser is idle
    const mount = () => setLater(true)
    const onScroll = () => scrollState.y > 40 && mount()
    window.addEventListener('scroll', onScroll, { passive: true })
    const idle = window.setTimeout(mount, 5000)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(idle)
    }
  }, [])

  return (
    <Canvas
      dpr={hi ? [1, 1.75] : [1, 1.25]}
      shadows={hi ? { type: THREE.PCFShadowMap } : false}
      frameloop={covered ? 'never' : 'always'}
      camera={{ fov: 40, near: 0.05, far: 1200, position: [0, 0.12, 6.4] }}
      gl={{ antialias: !hi, powerPreference: 'high-performance', alpha: false, stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
      aria-hidden
    >
      <Director />
      <StudioEnvironment />
      <Particles count={hi ? 1600 : 600} />
      <HeartWorld quality={quality} />
      <Tunnel quality={quality} />
      {later && (
        <Suspense fallback={null}>
          <Hospital />
          <Specialties3D quality={quality} />
          <Technology3D />
          {/* compile hidden worlds' shaders now, not mid-scroll */}
          <Preload all />
        </Suspense>
      )}
      {hi && <Post />}
      <FirstFrame onReady={() => setUI({ ready: true })} />
    </Canvas>
  )
}

/** Keeps the site usable if WebGL throws at runtime */
export class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('[VITALIS] 3D scene disabled:', error)
    setUI({ ready: true })
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
