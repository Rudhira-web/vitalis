import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rng } from '../lib/math'
import { stage } from './stage'

/** Slow, twinkling motes that give the dark scenes depth */
export function Particles({ count }: { count: number }) {
  const geo = useMemo(() => {
    const r = rng(3)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const rad = 3 + Math.pow(r(), 0.7) * 22
      const th = r() * Math.PI * 2
      const ph = Math.acos(2 * r() - 1)
      pos[i * 3] = rad * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = rad * Math.cos(ph) * 0.7
      pos[i * 3 + 2] = rad * Math.sin(ph) * Math.sin(th)
      seed[i] = r()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [count])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uPx: { value: 1 } },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime, uPx;
          varying float vA;
          void main(){
            vec3 p = position;
            p.y += sin(uTime * 0.15 + aSeed * 40.0) * 0.4;
            p.x += cos(uTime * 0.1 + aSeed * 23.0) * 0.3;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vA = (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 90.0))) * smoothstep(0.5, 3.0, -mv.z);
            gl_PointSize = (1.0 + aSeed * 2.4) * uPx * 14.0 / -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uOpacity;
          varying float vA;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(vec3(0.7, 0.93, 1.0), a * vA * uOpacity * 0.8);
          }`,
      }),
    [],
  )
  const ref = useRef<THREE.Points>(null)
  useFrame((state) => {
    const p = ref.current!
    p.visible = stage.world !== 'hospital' && stage.world !== 'tunnel'
    mat.uniforms.uTime.value = stage.time
    mat.uniforms.uPx.value = state.gl.getPixelRatio()
    p.rotation.y = stage.time * 0.01
  })
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />
}
