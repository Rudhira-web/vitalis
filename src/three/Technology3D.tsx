import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Grid, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { makeGlowMaterial, withGlow } from './glow'
import { ECG } from './glsl'
import { RobotArm, useRobotMaterials } from './Robot'
import { stage } from './stage'

/** Live-looking patient monitor drawn entirely in a shader (illustrative waveforms) */
function Monitor() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        toneMapped: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader:
          ECG +
          /* glsl */ `
          uniform float uTime; varying vec2 vUv;
          float trace(float y, float target, float w){ return smoothstep(w, 0.0, abs(y - target)); }
          void main(){
            vec2 uv = vUv;
            vec3 col = vec3(0.012, 0.03, 0.05);
            vec2 gr = abs(fract(uv * vec2(24.0, 14.0)) - 0.5);
            col += vec3(0.03, 0.08, 0.1) * step(0.46, max(gr.x, gr.y));
            float head = fract(uTime * 0.22);
            float behind = fract(head - uv.x);
            float fade = smoothstep(1.0, 0.0, behind) * step(0.015, behind);
            float e = trace(uv.y, 0.72 + ecg(uv.x * 3.0) * 0.18, 0.012);
            float s = trace(uv.y, 0.42 + sin(uv.x * 28.0) * 0.045 + sin(uv.x * 56.0) * 0.012, 0.01);
            float r = trace(uv.y, 0.17 + sin(uv.x * 9.0) * 0.05, 0.01);
            col += vec3(0.37, 0.89, 1.0) * e * fade * 2.4;
            col += vec3(0.53, 0.89, 0.78) * s * fade * 1.8;
            col += vec3(0.85, 0.9, 1.0) * r * fade * 1.2;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  )
  useFrame(() => (mat.uniforms.uTime.value = stage.time))
  return (
    <group position={[4.2, 2.1, -2.6]} rotation-y={-0.5}>
      <RoundedBox args={[2.7, 1.65, 0.08]} radius={0.04}>
        <meshStandardMaterial color="#0d141e" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0, 0.045]} material={mat}>
        <planeGeometry args={[2.55, 1.5]} />
      </mesh>
      <mesh position={[0, -1.45, -0.1]}>
        <cylinderGeometry args={[0.04, 0.04, 1.3, 12]} />
        <meshStandardMaterial color="#9aa6b0" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  )
}

/** CT / MRI-style gantry */
function Gantry() {
  const m = useRobotMaterials()
  const ring = useRef<THREE.Mesh>(null)
  useFrame(() => (ring.current!.rotation.z = stage.time * 0.6))
  return (
    <group position={[-3.9, 0, -3.6]} rotation-y={0.45}>
      <mesh position={[0, 1.75, 0]} material={m.shell} castShadow>
        <torusGeometry args={[1.35, 0.42, 32, 96]} />
      </mesh>
      <mesh ref={ring} position={[0, 1.75, 0.02]}>
        <torusGeometry args={[0.96, 0.02, 8, 120, Math.PI * 1.4]} />
        <meshBasicMaterial color={new THREE.Color('#5fe3ff').multiplyScalar(3)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.25, 0]} material={m.shell} castShadow>
        <boxGeometry args={[2.2, 0.5, 1.1]} />
      </mesh>
      <RoundedBox args={[0.6, 0.12, 3.2]} radius={0.05} position={[0, 1.05, 1.4]} material={m.shell} />
      <mesh position={[0, 0.55, 2.2]} material={m.joint}>
        <boxGeometry args={[0.4, 0.9, 0.5]} />
      </mesh>
    </group>
  )
}

function DataPaths() {
  const { geo, mat } = useMemo(() => {
    const paths = [
      [[-4.2, 0.02, -1.2], [-2.5, 0.02, -0.4], [-1.2, 0.02, 0.9]],
      [[3.8, 0.02, -2.2], [2.6, 0.02, -0.8], [1.3, 0.02, 1]],
      [[0, 0.02, -2.3], [0.6, 0.02, -3.6], [3.4, 0.02, -3.2]],
      [[-4.0, 0.02, -3.2], [-1.0, 0.02, -4.4], [3.6, 0.02, -3.0]],
    ]
    const geos = paths.map((p, i) => {
      const c = new THREE.CatmullRomCurve3(p.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
      return withGlow(new THREE.TubeGeometry(c, 80, 0.012, 5, false), c.getLength(), i * 0.3, 0)
    })
    const mat = makeGlowMaterial('#5fe3ff')
    mat.uniforms.uFade.value.set(999, 1000)
    mat.uniforms.uBase.value = 0.12
    return { geo: geos, mat }
  }, [])
  useFrame(() => (mat.uniforms.uTime.value = stage.time * 2))
  return (
    <group>
      {geo.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} />
      ))}
    </group>
  )
}

export default function Technology3D() {
  const group = useRef<THREE.Group>(null)
  const m = useRobotMaterials()
  useFrame(() => {
    group.current!.visible = stage.world === 'technology'
  })
  return (
    <group ref={group} visible={false}>
      <ambientLight intensity={0.25} />
      <spotLight position={[0, 7, 0.5]} angle={0.5} penumbra={0.8} intensity={120} distance={20} color="#eaf8ff" castShadow />
      <pointLight position={[-5, 3, 3]} intensity={18} color="#5fe3ff" distance={14} />
      <pointLight position={[5, 2.5, -4]} intensity={12} color="#86e3c8" distance={12} />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[16, 64]} />
        <meshStandardMaterial color="#0a1019" metalness={0.75} roughness={0.32} />
      </mesh>
      <Grid
        position={[0, 0.005, 0]}
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#16283a"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#215672"
        fadeDistance={22}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* operating table */}
      <group>
        <mesh position={[0, 0.45, 0]} material={m.joint} castShadow>
          <cylinderGeometry args={[0.22, 0.32, 0.9, 32]} />
        </mesh>
        <RoundedBox args={[0.9, 0.16, 2.4]} radius={0.06} position={[0, 0.98, 0]} castShadow receiveShadow material={m.shell} />
        <mesh position={[0, 1.07, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.7, 2.1]} />
          <meshStandardMaterial color="#9fc4d3" roughness={0.9} />
        </mesh>
      </group>

      {/* surgical light */}
      <group position={[0, 4.2, 0]}>
        <mesh position={[0, 0.9, 0]} material={m.steel}>
          <cylinderGeometry args={[0.04, 0.04, 1.8, 12]} />
        </mesh>
        <mesh material={m.shell}>
          <cylinderGeometry args={[0.85, 0.7, 0.16, 48]} />
        </mesh>
        <mesh position={[0, -0.085, 0]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.66, 48]} />
          <meshBasicMaterial color={new THREE.Color('#ffffff').multiplyScalar(2.5)} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* three arms around the table, each facing it */}
      {[
        [1.9, 0.9],
        [-1.9, 0.9],
        [0, -2.2],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation-y={Math.atan2(-x, -z)}>
          <RobotArm phase={i * 2.1} reach={0.9} />
        </group>
      ))}

      <Gantry />
      <Monitor />
      <DataPaths />
    </group>
  )
}
