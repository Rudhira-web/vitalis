import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NOISE } from './glsl'
import { TUNNEL } from './paths'
import { stage } from './stage'
import { rng } from '../lib/math'

/** Stylised vessel interior: organic wall, flowing light rings, spiral light paths, drifting cells. */
export function Tunnel({ quality }: { quality: 'high' | 'low' }) {
  const hi = quality === 'high'
  const geo = useMemo(() => new THREE.TubeGeometry(TUNNEL.curve, hi ? 900 : 500, TUNNEL.radius, hi ? 48 : 28, false), [hi])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: true,
        toneMapped: false,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uExit: { value: 0 }, uLen: { value: TUNNEL.length } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying float vDepth;
          void main(){
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vDepth = -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader:
          NOISE +
          /* glsl */ `
          uniform float uTime, uOpacity, uExit, uLen;
          varying vec2 vUv;
          varying float vDepth;
          void main(){
            float along = vUv.x * uLen;
            float ang = vUv.y * 6.28318;
            vec3 q = vec3(along * 0.16, cos(ang) * 1.4, sin(ang) * 1.4);
            float n = snoise(q + vec3(0.0, 0.0, uTime * 0.08));
            float n2 = snoise(q * 3.0 - vec3(uTime * 0.05));
            vec3 wall = mix(vec3(0.02, 0.003, 0.008), vec3(0.11, 0.012, 0.03), smoothstep(-0.7, 0.9, n + n2 * 0.35));
            float ring = pow(0.5 + 0.5 * sin(along * 0.85 - uTime * 3.2), 240.0);
            float spiral = pow(0.5 + 0.5 * sin(ang * 3.0 + along * 0.32 - uTime * 1.4), 700.0);
            float spiral2 = pow(0.5 + 0.5 * sin(-ang * 2.0 + along * 0.21 - uTime * 1.1 + 1.7), 900.0);
            vec3 cyan = vec3(0.37, 0.89, 1.0);
            vec3 col = wall + cyan * (ring * 0.3 + spiral * 0.9) + vec3(0.53, 0.89, 0.78) * spiral2 * 0.7;
            float dist = smoothstep(22.0, 1.5, vDepth);
            col *= 0.06 + 0.94 * dist * dist;
            float exitGlow = smoothstep(0.78, 1.0, vUv.x) * uExit;
            col = mix(col, vec3(1.6, 1.75, 1.85), exitGlow);
            gl_FragColor = vec4(col, uOpacity);
          }`,
      }),
    [],
  )

  // red blood cells drifting with the flow
  const count = hi ? 520 : 220
  const cells = useMemo(() => {
    const r = rng(21)
    const u0 = new Float32Array(count)
    const ang = new Float32Array(count)
    const rad = new Float32Array(count)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      u0[i] = r()
      ang[i] = r() * Math.PI * 2
      rad[i] = 0.35 + r() * 1.45
      spd[i] = 0.004 + r() * 0.007
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    const size = new Float32Array(count)
    for (let i = 0; i < count; i++) size[i] = 0.5 + r() * 0.9
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    return { u0, ang, rad, spd, g }
  }, [count])

  const cellMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: { uOpacity: { value: 0 }, uPx: { value: 1 } },
        vertexShader: /* glsl */ `
          attribute float aSize;
          uniform float uPx;
          varying float vFade;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vFade = smoothstep(24.0, 3.0, -mv.z);
            gl_PointSize = aSize * 48.0 * uPx / -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uOpacity;
          varying float vFade;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            float disc = smoothstep(0.5, 0.36, d) * (0.55 + 0.45 * smoothstep(0.08, 0.3, d));
            gl_FragColor = vec4(vec3(0.62, 0.07, 0.13), disc * vFade * uOpacity * 0.55);
          }`,
      }),
    [],
  )

  // the light at the end of the vessel
  const exit = useMemo(() => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(TUNNEL.radius * 1.05, 48),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#f2f8fb').multiplyScalar(1.6), toneMapped: false, transparent: true, depthWrite: false, fog: false }),
    )
    const end = TUNNEL.points[TUNNEL.samples]
    m.position.copy(end)
    m.lookAt(TUNNEL.points[TUNNEL.samples - 4])
    return m
  }, [])

  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    const o = stage.tunnel.opacity
    group.current!.visible = o > 0.01 && (stage.world === 'heart' || stage.world === 'tunnel')
    if (!group.current!.visible) return
    mat.uniforms.uTime.value = stage.time
    mat.uniforms.uOpacity.value = o
    mat.uniforms.uExit.value = stage.tunnel.exit
    ;(exit.material as THREE.MeshBasicMaterial).opacity = Math.min(1, 0.25 + stage.tunnel.exit) * o
    cellMat.uniforms.uOpacity.value = o
    cellMat.uniforms.uPx.value = state.gl.getPixelRatio()

    const { points, frames, samples } = TUNNEL
    const pos = cells.g.attributes.position as THREE.BufferAttribute
    const t = stage.time
    for (let i = 0; i < count; i++) {
      const u = (cells.u0[i] + t * cells.spd[i]) % 1
      const k = Math.min(samples, Math.round(u * samples))
      const p = points[k]
      const n = frames.normals[k]
      const b = frames.binormals[k]
      const a = cells.ang[i] + t * 0.2
      const r = cells.rad[i]
      const c = Math.cos(a) * r
      const s = Math.sin(a) * r
      pos.setXYZ(i, p.x + n.x * c + b.x * s, p.y + n.y * c + b.y * s, p.z + n.z * c + b.z * s)
    }
    pos.needsUpdate = true
  })

  return (
    <group ref={group}>
      <mesh geometry={geo} material={mat} frustumCulled={false} />
      <points geometry={cells.g} material={cellMat} frustumCulled={false} />
      <primitive object={exit} />
    </group>
  )
}
