import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { SPECIALTIES } from '../data/content'
import { clamp, easeOut, rng } from '../lib/math'
import { scrollState } from '../lib/scroll'
import { ecg } from './ecg'
import { makeGlowMaterial, withGlow } from './glow'
import { NOISE } from './glsl'
import { MiniHeart } from './Heart'
import { RobotArm } from './Robot'
import { stage } from './stage'

/* ---------- shared bits ---------- */

function glowLine(points: THREE.Vector3[], radius: number, color: string, closed = false) {
  const c = new THREE.CatmullRomCurve3(points, closed)
  const len = c.getLength()
  const geo = withGlow(new THREE.TubeGeometry(c, Math.max(64, points.length * 2), radius, 6, closed), len, 0, 0)
  const mat = makeGlowMaterial(color)
  mat.uniforms.uFade.value.set(999, 1000)
  mat.uniforms.uBase.value = 0.35
  return { geo, mat }
}

/** ECG trace bent into a ring around the cardiology heart */
function EcgRing() {
  const { geo, mat } = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const N = 360
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      const r = 2.3 + ecg((i / N) * 3) * 0.32
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0))
    }
    return glowLine(pts, 0.012, '#ff8da0', true)
  }, [])
  useFrame(() => (mat.uniforms.uTime.value = stage.time * 1.6))
  return <mesh geometry={geo} material={mat} rotation-x={-0.25} />
}

/* ---------- neurology: a brain-shaped neural network ---------- */
function NeuralNet({ hi }: { hi: boolean }) {
  const data = useMemo(() => {
    const r = rng(42)
    const N = hi ? 1500 : 800
    const pts: THREE.Vector3[] = []
    while (pts.length < N) {
      const d = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5)
      if (d.lengthSq() > 0.25 || d.lengthSq() < 0.001) continue
      d.normalize()
      const side = d.x >= 0 ? 1 : -1
      const fold = 1 + 0.06 * Math.sin(d.y * 13 + d.z * 9) * Math.cos(d.z * 11 - d.y * 4)
      const shell = r() < 0.82 ? 1 : 0.55 + r() * 0.4
      const p = new THREE.Vector3(d.x * 0.85, d.y * 1.0, d.z * 1.3).multiplyScalar(fold * shell * 1.25)
      p.x += side * 0.1
      if (p.y < -0.55 && Math.abs(p.z) < 0.6 && r() < 0.7) continue
      pts.push(p)
    }
    // brain stem
    for (let i = 0; i < 40; i++) pts.push(new THREE.Vector3((r() - 0.5) * 0.25, -0.9 - i * 0.025, -0.3 - i * 0.012 + (r() - 0.5) * 0.2))

    const pos = new Float32Array(pts.length * 3)
    const seed = new Float32Array(pts.length)
    pts.forEach((p, i) => {
      p.toArray(pos, i * 3)
      seed[i] = r()
    })
    const lines: number[] = []
    const lseed: number[] = []
    for (let i = 0; i < pts.length; i++) {
      let links = 0
      for (let j = i + 1; j < pts.length && links < 3; j++) {
        if (pts[i].distanceToSquared(pts[j]) < 0.075) {
          lines.push(...pts[i].toArray(), ...pts[j].toArray())
          const s = r()
          lseed.push(s, s)
          links++
        }
      }
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    pg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const lg = new THREE.BufferGeometry()
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
    lg.setAttribute('aSeed', new THREE.Float32BufferAttribute(lseed, 1))
    return { pg, lg }
  }, [hi])

  const mats = useMemo(() => {
    const common = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }
    const points = new THREE.ShaderMaterial({
      ...common,
      uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uScale: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime, uPx, uScale; varying float vA;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float fire = pow(0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 60.0), 18.0);
          vA = 0.35 + fire * 1.6;
          gl_PointSize = (2.0 + fire * 3.0) * uPx * uScale * 9.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.65, 0.75, 1.0) * vA * 1.4, smoothstep(0.5, 0.0, d)); }`,
    })
    const lines = new THREE.ShaderMaterial({
      ...common,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime; varying float vA;
        void main(){
          float sig = pow(fract(aSeed * 7.0 - uTime * 0.25), 40.0);
          vA = 0.07 + sig * 1.4;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){ gl_FragColor = vec4(vec3(0.58, 0.68, 1.0) * (1.0 + vA), vA); }`,
    })
    return { points, lines }
  }, [])
  useFrame((state) => {
    mats.points.uniforms.uTime.value = stage.time
    mats.points.uniforms.uPx.value = state.gl.getPixelRatio()
    mats.lines.uniforms.uTime.value = stage.time
  })
  return (
    <group rotation={[0.1, -0.6, 0]}>
      <lineSegments geometry={data.lg} material={mats.lines} />
      <points geometry={data.pg} material={mats.points} />
    </group>
  )
}

/* ---------- oncology: a calm cellular environment ---------- */
function makeCellMaterial(color: string, intensity: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uI: { value: intensity } },
    vertexShader:
      NOISE +
      /* glsl */ `
      uniform float uTime; varying vec3 vN; varying vec3 vV;
      void main(){
        vec3 p = position;
        #ifdef USE_INSTANCING
          vec4 ip = instanceMatrix * vec4(p, 1.0);
          vec3 c = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          p = ip.xyz;
          vN = normalize(mat3(instanceMatrix) * normal);
        #else
          vec3 c = vec3(0.0);
          vN = normal;
        #endif
        p += normalize(p - c + 1e-4) * snoise(p * 1.6 + uTime * 0.25) * 0.06;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vN = normalize(mat3(modelMatrix) * vN);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uI; varying vec3 vN; varying vec3 vV;
      void main(){
        float f = pow(1.0 - abs(dot(normalize(vN), vV)), 2.2);
        gl_FragColor = vec4(uColor * (0.08 + f * 1.4) * uI, 1.0);
      }`,
  })
}

function Cells({ hi }: { hi: boolean }) {
  const main = useMemo(() => makeCellMaterial('#86e3c8', 1.2), [])
  const nucleus = useMemo(() => makeCellMaterial('#c9fff0', 0.9), [])
  const small = useMemo(() => makeCellMaterial('#5fe3ff', 0.8), [])
  const count = hi ? 38 : 20
  const inst = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => {
    const r = rng(8)
    return Array.from({ length: count }, () => ({ r: 1.9 + r() * 1.6, a: r() * 6.28, y: (r() - 0.5) * 2.6, s: 0.12 + r() * 0.22, w: 0.05 + r() * 0.12 }))
  }, [count])
  const m4 = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    const t = stage.time
    for (const mm of [main, nucleus, small]) mm.uniforms.uTime.value = t
    seeds.forEach((s, i) => {
      const a = s.a + t * s.w
      m4.position.set(Math.cos(a) * s.r, s.y + Math.sin(t * 0.3 + i) * 0.15, Math.sin(a) * s.r)
      m4.scale.setScalar(s.s)
      m4.updateMatrix()
      inst.current!.setMatrixAt(i, m4.matrix)
    })
    inst.current!.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      <mesh material={main}>
        <sphereGeometry args={[1.15, 96, 64]} />
      </mesh>
      <mesh material={nucleus} position={[0.15, 0.1, 0.1]}>
        <sphereGeometry args={[0.42, 48, 32]} />
      </mesh>
      <instancedMesh ref={inst} args={[undefined, undefined, count]} material={small} frustumCulled={false}>
        <sphereGeometry args={[1, 32, 24]} />
      </instancedMesh>
    </group>
  )
}

/* ---------- orthopaedics: a stylised spine ---------- */
function Spine() {
  const { vert, disc, mats, n } = useMemo(() => {
    const body = new THREE.CylinderGeometry(0.27, 0.29, 0.17, 28)
    const spinous = new THREE.BoxGeometry(0.07, 0.09, 0.42).translate(0, -0.03, -0.38)
    const tl = new THREE.BoxGeometry(0.34, 0.06, 0.08).translate(-0.34, 0, -0.18)
    const tr = new THREE.BoxGeometry(0.34, 0.06, 0.08).translate(0.34, 0, -0.18)
    const arch = new THREE.TorusGeometry(0.14, 0.04, 8, 20, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI).translate(0, 0, -0.22)
    ;[body, spinous, tl, tr, arch].forEach((g) => g.deleteAttribute('uv'))
    const vert = mergeGeometries([body, spinous, tl, tr, arch])!
    const disc = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 28)
    const mats = {
      bone: new THREE.MeshPhysicalMaterial({ color: '#efe9de', roughness: 0.45, clearcoat: 0.4, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') }),
      disc: new THREE.MeshBasicMaterial({ color: new THREE.Color('#5fe3ff').multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0.85 }),
    }
    return { vert, disc, mats, n: 22 }
  }, [])
  const vRef = useRef<THREE.InstancedMesh>(null)
  const dRef = useRef<THREE.InstancedMesh>(null)
  const scan = useRef<THREE.Mesh>(null)
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [[0, -2.3, -0.1], [0, -1.5, 0.22], [0, -0.6, 0.02], [0, 0.4, -0.3], [0, 1.3, -0.05], [0, 2.1, 0.25]].map((p) => new THREE.Vector3(...(p as [number, number, number]))),
      ),
    [],
  )
  const placed = useRef(false)
  useFrame(() => {
    if (!placed.current && vRef.current && dRef.current) {
      const o = new THREE.Object3D()
      const up = new THREE.Vector3(0, 1, 0)
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1)
        const p = curve.getPointAt(u)
        const tng = curve.getTangentAt(u)
        const s = 1.15 - u * 0.5
        o.position.copy(p)
        o.quaternion.setFromUnitVectors(up, tng)
        o.scale.set(s, s, s)
        o.updateMatrix()
        vRef.current.setMatrixAt(i, o.matrix)
        if (i < n - 1) {
          const u2 = (i + 0.5) / (n - 1)
          o.position.copy(curve.getPointAt(u2))
          o.quaternion.setFromUnitVectors(up, curve.getTangentAt(u2))
          o.updateMatrix()
          dRef.current.setMatrixAt(i, o.matrix)
        }
      }
      vRef.current.instanceMatrix.needsUpdate = true
      dRef.current.instanceMatrix.needsUpdate = true
      placed.current = true
    }
    scan.current!.position.y = Math.sin(stage.time * 0.6) * 2.1
  })
  return (
    <group rotation={[0, 0.9, 0]} scale={0.95}>
      <instancedMesh ref={vRef} args={[vert, mats.bone, n]} castShadow />
      <instancedMesh ref={dRef} args={[disc, mats.disc, n - 1]} />
      <mesh ref={scan} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.95, 0.008, 6, 96]} />
        <meshBasicMaterial color={new THREE.Color('#5fe3ff').multiplyScalar(3)} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------- emergency: a calm signal of help, with expanding pulses ---------- */
function Emergency() {
  const cross = useMemo(() => {
    const s = new THREE.Shape()
    const a = 0.32
    const b = 1.0
    const r = 0.12
    const pts: [number, number][] = [
      [-a, b], [a, b], [a, a], [b, a], [b, -a], [a, -a], [a, -b], [-a, -b], [-a, -a], [-b, -a], [-b, a], [-a, a],
    ]
    s.moveTo(pts[0][0], pts[0][1])
    pts.slice(1).forEach(([x, y]) => s.lineTo(x, y))
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 6 })
    g.center()
    return g
  }, [])
  const mats = useMemo(
    () => ({
      shell: new THREE.MeshPhysicalMaterial({ color: '#f5f7f8', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 }),
      ring: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff9a8a').multiplyScalar(2), toneMapped: false, transparent: true }),
    }),
    [],
  )
  const ecgLine = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 240; i++) {
      const x = -3.4 + (i / 240) * 6.8
      pts.push(new THREE.Vector3(x, ecg(i / 120 + 0.12) * 0.75 - 1.75, 0.6))
    }
    return glowLine(pts, 0.014, '#ff9a8a')
  }, [])
  const rings = useRef<THREE.Group>(null)
  const crossRef = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const t = stage.time
    ecgLine.mat.uniforms.uTime.value = t * 1.4
    rings.current!.children.forEach((c, i) => {
      const k = (t * 0.35 + i / 3) % 1
      c.scale.setScalar(1.1 + k * 2.6)
      ;((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.8
    })
    crossRef.current!.rotation.y = Math.sin(t * 0.4) * 0.35
  })
  return (
    <group>
      <mesh ref={crossRef} geometry={cross} material={mats.shell} scale={0.72} castShadow />
      <group ref={rings}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} material={mats.ring.clone()}>
            <torusGeometry args={[1, 0.006, 6, 120]} />
          </mesh>
        ))}
      </group>
      <mesh geometry={ecgLine.geo} material={ecgLine.mat} />
    </group>
  )
}

/* ---------- robotic surgery ---------- */
function Robotic() {
  const target = useRef<THREE.Mesh>(null)
  useFrame(() => {
    target.current!.scale.setScalar(1 + Math.sin(stage.time * 3) * 0.08)
  })
  return (
    <group position={[0, -1.6, 0]} scale={1.1}>
      <group position={[-0.9, 0, -0.4]} rotation-y={0.9}>
        <RobotArm phase={0.4} />
      </group>
      <group position={[0.95, 0, -0.5]} rotation-y={-0.9}>
        <RobotArm phase={2.1} />
      </group>
      <RoundedBox args={[1.6, 0.5, 0.9]} radius={0.08} position={[0, 0.25, 0.75]}>
        <meshPhysicalMaterial color="#e9eef2" roughness={0.3} clearcoat={1} />
      </RoundedBox>
      <mesh ref={target} position={[0, 0.52, 0.75]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.14, 0.17, 48]} />
        <meshBasicMaterial color={new THREE.Color('#5fe3ff').multiplyScalar(3)} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------- the stage ---------- */
function Slot({ index, children }: { index: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    const d = Math.abs(scrollState.specFloat - index)
    const w = easeOut(clamp(1 - d * 1.5))
    const g = ref.current!
    g.visible = w > 0.01
    if (!g.visible) return
    g.scale.setScalar(0.55 + 0.45 * w)
    g.position.y = (scrollState.specFloat - index) * 1.4
    g.rotation.y = (scrollState.specFloat - index) * 1.2 + Math.sin(stage.time * 0.2 + index) * 0.15
  })
  return <group ref={ref}>{children}</group>
}

export default function Specialties3D({ quality }: { quality: 'high' | 'low' }) {
  const hi = quality === 'high'
  const group = useRef<THREE.Group>(null)
  const key = useRef<THREE.PointLight>(null)
  const col = useMemo(() => new THREE.Color(), [])
  useFrame(() => {
    const g = group.current!
    g.visible = stage.world === 'specialties'
    if (!g.visible) return
    g.position.set(stage.mobile ? 0 : 2.15, stage.mobile ? 0.9 : 0, 0)
    g.scale.setScalar(stage.mobile ? 0.8 : 1)
    const f = scrollState.specFloat
    const i = Math.min(4, Math.floor(f))
    col.set(SPECIALTIES[i].accent).lerp(new THREE.Color(SPECIALTIES[i + 1].accent), f - i)
    key.current!.color.copy(col)
  })
  return (
    <group ref={group} visible={false}>
      <ambientLight intensity={0.35} />
      <pointLight ref={key} position={[3, 3, 4]} intensity={40} distance={20} />
      <directionalLight position={[-4, 5, 3]} intensity={1.6} />
      <Slot index={0}>
        <group scale={1.05}>
          <MiniHeart quality={quality} />
          <EcgRing />
        </group>
      </Slot>
      <Slot index={1}>
        <NeuralNet hi={hi} />
      </Slot>
      <Slot index={2}>
        <Cells hi={hi} />
      </Slot>
      <Slot index={3}>
        <Spine />
      </Slot>
      <Slot index={4}>
        <Emergency />
      </Slot>
      <Slot index={5}>
        <Robotic />
      </Slot>
    </group>
  )
}
