import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { stage } from './stage'

export function useRobotMaterials() {
  return useMemo(
    () => ({
      shell: new THREE.MeshPhysicalMaterial({ color: '#f1f4f6', roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.15 }),
      joint: new THREE.MeshStandardMaterial({ color: '#1a2330', roughness: 0.35, metalness: 0.7 }),
      steel: new THREE.MeshStandardMaterial({ color: '#c8d2da', roughness: 0.2, metalness: 1 }),
      accent: new THREE.MeshBasicMaterial({ color: new THREE.Color('#5fe3ff').multiplyScalar(2.6), toneMapped: false }),
    }),
    [],
  )
}

/**
 * A surgical robot arm: yaw base → shoulder → elbow → wrist → instrument.
 * Moves in small, slow, deliberate arcs.
 */
export function RobotArm({ phase = 0, reach = 1 }: { phase?: number; reach?: number }) {
  const m = useRobotMaterials()
  const yaw = useRef<THREE.Group>(null)
  const shoulder = useRef<THREE.Group>(null)
  const elbow = useRef<THREE.Group>(null)
  const wrist = useRef<THREE.Group>(null)
  useFrame(() => {
    const t = stage.time
    yaw.current!.rotation.y = Math.sin(t * 0.32 + phase) * 0.28
    shoulder.current!.rotation.x = 0.75 * reach + Math.sin(t * 0.45 + phase) * 0.1
    elbow.current!.rotation.x = 1.55 + Math.sin(t * 0.55 + phase + 1.3) * 0.12
    wrist.current!.rotation.x = 0.55 + Math.sin(t * 0.7 + phase + 2.1) * 0.15
  })
  return (
    <group>
      <mesh position={[0, 0.15, 0]} material={m.joint} castShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.3, 40]} />
      </mesh>
      <mesh position={[0, 0.85, 0]} material={m.shell} castShadow>
        <cylinderGeometry args={[0.2, 0.26, 1.2, 32]} />
      </mesh>
      <mesh position={[0, 0.32, 0]} rotation-x={Math.PI / 2} material={m.accent}>
        <torusGeometry args={[0.43, 0.012, 6, 64]} />
      </mesh>
      <group ref={yaw} position={[0, 1.5, 0]}>
        <mesh material={m.joint} castShadow>
          <sphereGeometry args={[0.22, 32, 16]} />
        </mesh>
        <group ref={shoulder}>
          <mesh position={[0, 0.62, 0]} material={m.shell} castShadow>
            <boxGeometry args={[0.2, 1.24, 0.22]} />
          </mesh>
          <group ref={elbow} position={[0, 1.24, 0]}>
            <mesh rotation-z={Math.PI / 2} material={m.joint} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.3, 24]} />
            </mesh>
            <mesh rotation-z={Math.PI / 2} material={m.accent}>
              <torusGeometry args={[0.155, 0.01, 6, 40]} />
            </mesh>
            <mesh position={[0, 0.52, 0]} material={m.shell} castShadow>
              <boxGeometry args={[0.15, 1.04, 0.17]} />
            </mesh>
            <group ref={wrist} position={[0, 1.04, 0]}>
              <mesh material={m.joint}>
                <sphereGeometry args={[0.11, 24, 12]} />
              </mesh>
              <mesh position={[0, 0.34, 0]} material={m.steel}>
                <cylinderGeometry args={[0.018, 0.018, 0.68, 12]} />
              </mesh>
              <mesh position={[0, 0.69, 0]} material={m.accent}>
                <sphereGeometry args={[0.028, 12, 8]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
