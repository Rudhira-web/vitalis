import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BEAT_VERTEX, NOISE } from './glsl'
import { makeGlowMaterial } from './glow'
import { buildHeart } from './heartGeometry'
import { stage } from './stage'

export function makeHeartMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBeatA: { value: 0 },
      uBeatV: { value: 0 },
      uAmp: { value: 1 },
      uOpacity: { value: 1 },
      uDeep: { value: new THREE.Color('#1c040b') },
      uMid: { value: new THREE.Color('#8a1429') },
      uRim: { value: new THREE.Color('#5fe3ff') },
    },
    vertexShader:
      BEAT_VERTEX +
      /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vObj;
      void main(){
        vec3 p = beat(position, 1.0);
        vObj = position;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader:
      NOISE +
      /* glsl */ `
      uniform float uTime, uBeatV, uOpacity;
      uniform vec3 uDeep, uMid, uRim;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vObj;
      void main(){
        vec3 V = normalize(vV);
        // muscle fibres: stretched noise wrapping around the long axis
        float fib = snoise(vObj * vec3(2.2, 4.2, 2.2) + vec3(0.0, uTime * 0.04, 0.0));
        float fine = snoise(vObj * 11.0);
        vec3 N = normalize(normalize(vN) + 0.05 * vec3(fib, fine, fib * fine));
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        vec3 L1 = normalize(vec3(-0.55, 0.75, 0.6));
        vec3 L2 = normalize(vec3(0.8, -0.1, -0.6));
        float dif = max(dot(N, L1), 0.0);
        float spec = pow(max(dot(N, normalize(L1 + V)), 0.0), 38.0) * 0.55;
        float spec2 = pow(max(dot(N, normalize(vec3(0.6, 0.3, 0.8) + V)), 0.0), 120.0) * 0.8;
        float back = pow(max(dot(N, L2), 0.0), 2.0);
        float fres = pow(1.0 - ndv, 3.0);
        vec3 base = mix(uDeep, uMid, 0.55 + 0.22 * fib + 0.08 * fine);
        vec3 col = base * (0.18 + 0.95 * dif);
        col += (spec + spec2) * vec3(1.0, 0.9, 0.93);
        col += uRim * (fres * 1.25 + back * 0.35);
        col += uMid * 0.45 * (1.0 - fres) * uBeatV; // inner flush on contraction
        gl_FragColor = vec4(col, uOpacity);
      }`,
  })
}

/** Shared beat clock helper: atrial kick then ventricular contraction */
export function beatAt(phase: number) {
  const p = phase - Math.floor(phase)
  const a = Math.exp(-Math.pow((p - 0.06) / 0.045, 2))
  const v = p < 0.2 ? THREE.MathUtils.smoothstep(p, 0.11, 0.2) : Math.exp(-(p - 0.2) * 8.5)
  return { a, v }
}

const TILT = new THREE.Euler(0.12, 0, -0.18)

/** The story's heart: opening, journey and finale. Driven entirely by `stage.heart`. */
export function HeartWorld({ quality }: { quality: 'high' | 'low' }) {
  const geo = useMemo(() => buildHeart(quality), [quality])
  const mat = useMemo(makeHeartMaterial, [])
  const glow = useMemo(() => makeGlowMaterial(), [])
  const group = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)

  useFrame(() => {
    const h = stage.heart
    const g = group.current!
    g.visible = (stage.world === 'heart' || stage.world === 'tunnel') && h.opacity > 0.01
    if (!g.visible) return
    g.scale.setScalar(h.scale)
    spin.current!.rotation.y = h.rotY
    const transparent = h.opacity < 0.999
    if (mat.transparent !== transparent) {
      mat.transparent = transparent
      mat.needsUpdate = true
    }
    const u = mat.uniforms
    u.uTime.value = stage.time
    u.uBeatA.value = glow.uniforms.uBeatA.value = h.beatA
    u.uBeatV.value = glow.uniforms.uBeatV.value = h.beatV
    u.uAmp.value = glow.uniforms.uAmp.value = h.amp
    u.uOpacity.value = h.opacity
    glow.uniforms.uTime.value = stage.time
    glow.uniforms.uReveal.value = h.reveal
    glow.uniforms.uBeat.value = h.beatV
    glow.uniforms.uOpacity.value = Math.min(1, h.opacity * 1.2)
  })

  return (
    <group ref={group}>
      <group ref={spin}>
        <group rotation={TILT}>
          <mesh geometry={geo.body} material={mat} />
          <mesh geometry={geo.glow} material={glow} frustumCulled={false} />
        </group>
      </group>
    </group>
  )
}

/** A self-beating heart for the cardiology stage */
export function MiniHeart({ quality }: { quality: 'high' | 'low' }) {
  const geo = useMemo(() => buildHeart(quality), [quality])
  const mat = useMemo(makeHeartMaterial, [])
  const glow = useMemo(() => {
    const m = makeGlowMaterial('#ff8da0', '#fff1f3')
    m.uniforms.uFade.value.set(2.5, 6)
    m.uniforms.uBase.value = 0.35
    return m
  }, [])
  const phase = useRef(0)
  useFrame((_, dt) => {
    phase.current += Math.min(dt, 0.05) * 1.05
    const b = beatAt(phase.current)
    for (const m of [mat, glow]) {
      m.uniforms.uBeatA.value = b.a
      m.uniforms.uBeatV.value = b.v
      m.uniforms.uTime.value = stage.time
    }
    glow.uniforms.uBeat.value = b.v
  })
  return (
    <group rotation={TILT}>
      <mesh geometry={geo.body} material={mat} />
      <mesh geometry={geo.glow} material={glow} frustumCulled={false} />
    </group>
  )
}
