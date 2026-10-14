import * as THREE from 'three'

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** The vascular tunnel: starts inside the heart and winds away from the camera */
export const TUNNEL = (() => {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < 15; i++) {
    const k = i === 0 ? 0 : 1
    pts.push(v(Math.sin(i * 0.72) * 3.4 * k, (Math.cos(i * 0.5) - 1) * 2.4 * k, 0.9 - i * 9))
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const samples = 480
  const frames = curve.computeFrenetFrames(samples, false)
  const points = curve.getSpacedPoints(samples)
  return { curve, samples, frames, points, length: curve.getLength(), radius: 2.1 }
})()

/** Hospital fly-through: aerial approach → canopy → doors → lobby */
export const HOSPITAL_CAM = new THREE.CatmullRomCurve3(
  [v(95, 55, 150), v(60, 32, 100), v(26, 14, 60), v(7, 5.5, 36), v(0, 3.2, 22), v(0, 2.6, 13), v(0.6, 2.3, 6.5), v(-2.4, 2.1, 3.2)],
  false,
  'centripetal',
)
export const HOSPITAL_LOOK = new THREE.CatmullRomCurve3(
  [v(0, 16, -8), v(0, 14, -8), v(0, 9, -4), v(0, 5, 0), v(0, 3.6, 0), v(0, 3.6, -6), v(0, 4.6, -6), v(1.5, 4.8, -6)],
  false,
  'centripetal',
)
