import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { rng } from '../lib/math'
import { stage } from './stage'
import { facadeTexture, helipadTexture, livingWallTexture, signTexture } from './textures'

/*
 * VITALIS campus: a two-storey glass podium (lobby inside), a rectilinear ward tower,
 * a curved clinical tower, a sky bridge, a cantilevered entrance canopy and landscaped plaza.
 * Units are metres. The entrance faces +z at z = 10.
 */

function useMaterials() {
  return useMemo(() => {
    const towerA = facadeTexture(16, 10, 4)
    const towerB = facadeTexture(24, 8, 9)
    towerB.repeat.set(2, 1)
    return {
      concrete: new THREE.MeshStandardMaterial({ color: '#f2f3f1', roughness: 0.82 }),
      darkStone: new THREE.MeshStandardMaterial({ color: '#c9d0d4', roughness: 0.7 }),
      glassA: new THREE.MeshStandardMaterial({ map: towerA, metalness: 0.75, roughness: 0.1, envMapIntensity: 2.2 }),
      glassB: new THREE.MeshStandardMaterial({ map: towerB, metalness: 0.75, roughness: 0.08, envMapIntensity: 2.2 }),
      glassFront: new THREE.MeshStandardMaterial({ color: '#d4e8f1', metalness: 0.9, roughness: 0.04, transparent: true, opacity: 0.26, envMapIntensity: 1.3, depthWrite: false }),
      ground: new THREE.MeshStandardMaterial({ color: '#c9d2d6', roughness: 0.95 }),
      plaza: new THREE.MeshStandardMaterial({ color: '#e6eaec', roughness: 0.55 }),
      lawn: new THREE.MeshStandardMaterial({ color: '#8fae98', roughness: 1 }),
      water: new THREE.MeshStandardMaterial({ color: '#6f93a6', metalness: 1, roughness: 0.04 }),
      crown: new THREE.MeshStandardMaterial({ color: '#7f9f88', roughness: 0.9, flatShading: true }),
      trunk: new THREE.MeshStandardMaterial({ color: '#7d7468', roughness: 0.8 }),
      floor: new THREE.MeshStandardMaterial({ color: '#eef1f2', roughness: 0.16 }),
      wood: new THREE.MeshStandardMaterial({ color: '#cdb89c', roughness: 0.6 }),
      light: new THREE.MeshBasicMaterial({ color: new THREE.Color('#eaf8ff').multiplyScalar(2.2), toneMapped: false }),
      cyan: new THREE.MeshBasicMaterial({ color: new THREE.Color('#5fe3ff').multiplyScalar(2.4), toneMapped: false }),
      mint: new THREE.MeshBasicMaterial({ color: new THREE.Color('#86e3c8').multiplyScalar(2), toneMapped: false }),
      sign: new THREE.MeshBasicMaterial({ map: signTexture(), transparent: true, toneMapped: false }),
      helipad: new THREE.MeshStandardMaterial({ map: helipadTexture(), roughness: 0.8 }),
      livingWall: new THREE.MeshStandardMaterial({ map: livingWallTexture(), roughness: 1 }),
    }
  }, [])
}

type M = ReturnType<typeof useMaterials>

function Box({ p, s, m, shadow = true }: { p: [number, number, number]; s: [number, number, number]; m: THREE.Material; shadow?: boolean }) {
  return (
    <mesh position={p} material={m} castShadow={shadow} receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  )
}

function Landscape({ m }: { m: M }) {
  const trees = useMemo(() => {
    const r = rng(5)
    const out: [number, number, number, number][] = []
    for (let i = 0; i < 140 && out.length < 90; i++) {
      const x = (r() - 0.5) * 170
      const z = -40 + r() * 120
      const inBuilding = Math.abs(x) < 36 && z < 24
      const inPlaza = Math.abs(x) < 24 && z < 72
      if (inBuilding || inPlaza) continue
      out.push([x, z, 0.8 + r() * 0.6, r() * Math.PI])
    }
    return out
  }, [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} material={m.ground} receiveShadow>
        <planeGeometry args={[1400, 1400]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 40]} material={m.plaza} receiveShadow>
        <planeGeometry args={[48, 64]} />
      </mesh>
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <mesh rotation-x={-Math.PI / 2} position={[sx * 62, 0.015, 30]} material={m.lawn} receiveShadow>
            <planeGeometry args={[76, 110]} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[sx * 15, 0.04, 42]} material={m.darkStone} receiveShadow>
            <planeGeometry args={[6.4, 30.4]} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[sx * 15, 0.06, 42]} material={m.water}>
            <planeGeometry args={[5.6, 29.6]} />
          </mesh>
        </group>
      ))}
      <Instances material={m.crown} castShadow receiveShadow limit={100}>
        <icosahedronGeometry args={[1, 1]} />
        {trees.map(([x, z, s, a], i) => (
          <Instance key={i} position={[x, 5.2 * s, z]} scale={[2.6 * s, 3.2 * s, 2.6 * s]} rotation={[0, a, 0]} />
        ))}
      </Instances>
      <Instances material={m.trunk} castShadow limit={100}>
        <cylinderGeometry args={[0.12, 0.18, 1, 6]} />
        {trees.map(([x, z, s], i) => (
          <Instance key={i} position={[x, 1.6 * s, z]} scale={[s, 3.2 * s, s]} />
        ))}
      </Instances>
      {/* distant context so the campus sits in a city */}
      {[
        [-140, -160, 30, 26],
        [-90, -210, 40, 44],
        [120, -170, 34, 30],
        [175, -120, 28, 18],
        [-190, -90, 30, 16],
        [60, -240, 50, 38],
      ].map(([x, z, w, h], i) => (
        <Box key={i} p={[x, h / 2, z]} s={[w, h, w * 0.8]} m={m.darkStone} shadow={false} />
      ))}
    </group>
  )
}

function Podium({ m }: { m: M }) {
  const doorL = useRef<THREE.Mesh>(null)
  const doorR = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const o = stage.hospital.doorOpen * 3.7
    doorL.current!.position.x = -2 - o
    doorR.current!.position.x = 2 + o
  })
  const mullions = useMemo(() => {
    const xs: number[] = []
    for (let x = -32; x <= 32; x += 4) if (Math.abs(x) >= 4) xs.push(x)
    return xs
  }, [])
  return (
    <group>
      {/* shell */}
      <Box p={[0, 9.4, -5]} s={[66, 0.8, 31]} m={m.concrete} />
      <Box p={[0, 4.5, -20.25]} s={[64.5, 9, 0.5]} m={m.concrete} />
      <Box p={[-32.25, 4.5, -5]} s={[0.5, 9, 30.5]} m={m.concrete} />
      <Box p={[32.25, 4.5, -5]} s={[0.5, 9, 30.5]} m={m.concrete} />
      <Box p={[0, 9.95, 10.15]} s={[66, 0.3, 0.6]} m={m.concrete} />
      {/* glazed front with door opening */}
      <Box p={[-18, 4.5, 10]} s={[28, 9, 0.08]} m={m.glassFront} shadow={false} />
      <Box p={[18, 4.5, 10]} s={[28, 9, 0.08]} m={m.glassFront} shadow={false} />
      <Box p={[0, 6.7, 10]} s={[8, 4.6, 0.08]} m={m.glassFront} shadow={false} />
      <mesh ref={doorL} position={[-2, 2.2, 10.12]} material={m.glassFront}>
        <boxGeometry args={[4, 4.4, 0.06]} />
      </mesh>
      <mesh ref={doorR} position={[2, 2.2, 10.12]} material={m.glassFront}>
        <boxGeometry args={[4, 4.4, 0.06]} />
      </mesh>
      <Instances material={m.concrete} limit={20} castShadow>
        <boxGeometry args={[0.14, 9, 0.3]} />
        {mullions.map((x) => (
          <Instance key={x} position={[x, 4.5, 10]} />
        ))}
      </Instances>
      <Box p={[-18, 4.4, 10.02]} s={[28, 0.16, 0.32]} m={m.concrete} />
      <Box p={[18, 4.4, 10.02]} s={[28, 0.16, 0.32]} m={m.concrete} />
      <Box p={[0, 4.42, 10.02]} s={[8, 0.12, 0.32]} m={m.concrete} />

      {/* entrance canopy + signage */}
      <Box p={[0, 7.1, 16]} s={[26, 0.45, 12.5]} m={m.concrete} />
      {[-11, 11].map((x) => (
        <mesh key={x} position={[x, 3.45, 20.6]} material={m.concrete} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 6.9, 16]} />
        </mesh>
      ))}
      <mesh position={[0, 6.86, 16]} rotation-x={Math.PI / 2} material={m.light}>
        <planeGeometry args={[22, 0.12]} />
      </mesh>
      <mesh position={[0, 8.55, 21.2]} material={m.sign}>
        <planeGeometry args={[13, 2.44]} />
      </mesh>
    </group>
  )
}

function Interior({ m }: { m: M }) {
  const rings = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = rings.current!
    const t = stage.time
    g.children.forEach((c, i) => {
      c.rotation.x = Math.PI / 2 + Math.sin(t * 0.2 + i) * 0.35
      c.rotation.y = t * (0.08 + i * 0.05)
    })
  })
  const strips = [-6, -3, 0, 3, 6, 9]
  return (
    <group>
      <pointLight position={[0, 7.5, -2]} intensity={60} distance={34} decay={1.6} color="#fff3e6" />
      <pointLight position={[-14, 6, -8]} intensity={30} distance={26} decay={1.6} color="#eaf8ff" />
      <pointLight position={[14, 6, -8]} intensity={30} distance={26} decay={1.6} color="#eaf8ff" />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, -5]} material={m.floor} receiveShadow>
        <planeGeometry args={[64, 30]} />
      </mesh>
      {/* mezzanine with glass balustrade */}
      <Box p={[0, 4.6, -14.5]} s={[64, 0.4, 11]} m={m.concrete} />
      <Box p={[0, 5.3, -9]} s={[64, 1, 0.05]} m={m.glassFront} shadow={false} />
      <mesh position={[-12, 6.9, -19.98]} material={m.livingWall}>
        <planeGeometry args={[30, 3.9]} />
      </mesh>
      {/* columns */}
      {[-20, -10, 10, 20].flatMap((x) =>
        [2, -8].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 4.5, z]} material={m.concrete} castShadow receiveShadow>
            <cylinderGeometry args={[0.34, 0.34, 9, 24]} />
          </mesh>
        )),
      )}
      {/* linear ceiling light */}
      <Instances material={m.light} limit={8}>
        <boxGeometry args={[56, 0.06, 0.22]} />
        {strips.map((z) => (
          <Instance key={z} position={[0, 8.96, z]} />
        ))}
      </Instances>
      {/* reception */}
      <group position={[6, 0, -4]}>
        <mesh position={[0, 0.55, 0]} material={m.concrete} castShadow receiveShadow>
          <cylinderGeometry args={[3.2, 3.2, 1.1, 48, 1, false, -Math.PI * 0.35, Math.PI * 0.7]} />
        </mesh>
        <mesh position={[0, 1.12, 0]} rotation-x={Math.PI / 2} rotation-z={Math.PI * 0.15} material={m.cyan}>
          <torusGeometry args={[3.22, 0.025, 6, 64, Math.PI * 0.7]} />
        </mesh>
      </group>
      {/* benches */}
      {[
        [-9, 4],
        [-14, -2],
        [12, 4],
      ].map(([x, z], i) => (
        <Box key={i} p={[x, 0.24, z]} s={[3.6, 0.48, 0.9]} m={m.wood} />
      ))}
      {/* suspended light sculpture echoing the heartbeat rings */}
      <group ref={rings} position={[0, 5.2, -5]}>
        <mesh material={m.cyan}>
          <torusGeometry args={[3.1, 0.04, 8, 160]} />
        </mesh>
        <mesh material={m.mint}>
          <torusGeometry args={[2.4, 0.035, 8, 160]} />
        </mesh>
        <mesh material={m.light}>
          <torusGeometry args={[1.7, 0.03, 8, 160]} />
        </mesh>
      </group>
    </group>
  )
}

function Towers({ m }: { m: M }) {
  const finsA = useMemo(() => Array.from({ length: 11 }, (_, i) => 9.8 + i * 3.62), [])
  const finsB = useMemo(() => Array.from({ length: 9 }, (_, i) => 9.8 + i * 3.5), [])
  return (
    <group>
      {/* ward tower */}
      <Box p={[-18, 27.9, -10]} s={[24, 36.2, 16]} m={m.glassA} />
      <Instances material={m.concrete} castShadow receiveShadow limit={12}>
        <boxGeometry args={[24.8, 0.32, 16.8]} />
        {finsA.map((y) => (
          <Instance key={y} position={[-18, y, -10]} />
        ))}
      </Instances>
      <Box p={[-18, 46.4, -10]} s={[24.8, 0.8, 16.8]} m={m.concrete} />
      <mesh position={[-21, 47, -10]} material={m.helipad} receiveShadow>
        <cylinderGeometry args={[6, 6, 0.4, 48]} />
      </mesh>
      {/* clinical tower */}
      <mesh position={[17, 23.8, -8]} material={m.glassB} castShadow receiveShadow>
        <cylinderGeometry args={[12, 12, 28, 72]} />
      </mesh>
      <Instances material={m.concrete} castShadow limit={10}>
        <cylinderGeometry args={[12.45, 12.45, 0.3, 72]} />
        {finsB.map((y) => (
          <Instance key={y} position={[17, y, -8]} />
        ))}
      </Instances>
      <mesh position={[17, 38.1, -8]} material={m.concrete} castShadow>
        <cylinderGeometry args={[12.5, 12.5, 0.6, 72]} />
      </mesh>
      {/* sky bridge */}
      <Box p={[-0.5, 31, -8]} s={[11.5, 3.4, 4]} m={m.glassA} />
      <Box p={[-0.5, 32.8, -8]} s={[11.5, 0.3, 4.4]} m={m.concrete} />
      <Box p={[-0.5, 29.2, -8]} s={[11.5, 0.3, 4.4]} m={m.concrete} />
    </group>
  )
}

export default function Hospital() {
  const m = useMaterials()
  const group = useRef<THREE.Group>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  useFrame(() => {
    group.current!.visible = stage.world === 'hospital'
  })
  return (
    <group ref={group} visible={false}>
      <hemisphereLight args={['#eaf4ff', '#b7c2b9', 0.55]} />
      <directionalLight
        ref={sun}
        position={[70, 95, 60]}
        intensity={2.4}
        color="#fff6ea"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-far={300}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
      <Landscape m={m} />
      <Podium m={m} />
      <Interior m={m} />
      <Towers m={m} />
    </group>
  )
}
