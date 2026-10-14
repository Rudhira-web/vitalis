import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { rng } from '../lib/math'
import { taperedTube, withGlow } from './glow'

/*
 * A procedural, anatomically-inspired heart:
 * four chambers as a smooth union of rotated ellipsoids (SDF), the surface found by
 * marching rays out from the centre, plus great vessels, coronary arteries and an
 * outward vascular network for the glow pass.
 */

type Ell = { c: [number, number, number]; r: [number, number, number]; a: number }
const CHAMBERS: Ell[] = [
  { c: [0.12, -0.14, -0.05], r: [0.62, 0.98, 0.6], a: 0.5 }, // left ventricle → apex
  { c: [-0.24, -0.05, 0.24], r: [0.6, 0.8, 0.48], a: 0.38 }, // right ventricle (anterior)
  { c: [0.3, 0.55, -0.32], r: [0.42, 0.32, 0.38], a: 0 }, // left atrium
  { c: [-0.56, 0.42, 0.0], r: [0.42, 0.46, 0.4], a: -0.2 }, // right atrium
  { c: [0.56, 0.5, 0.12], r: [0.2, 0.12, 0.15], a: -0.6 }, // left auricle
]

function sdEll(px: number, py: number, pz: number, e: Ell) {
  const qx = px - e.c[0]
  const qy = py - e.c[1]
  const qz = pz - e.c[2]
  const ca = Math.cos(e.a)
  const sa = Math.sin(e.a)
  const x = qx * ca + qy * sa
  const y = -qx * sa + qy * ca
  const [a, b, c] = e.r
  const k0 = Math.hypot(x / a, y / b, qz / c)
  const k1 = Math.hypot(x / (a * a), y / (b * b), qz / (c * c))
  return k1 === 0 ? -Math.min(a, b, c) : (k0 * (k0 - 1)) / k1
}

const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}

function sdf(x: number, y: number, z: number) {
  let d = sdEll(x, y, z, CHAMBERS[0])
  for (let i = 1; i < CHAMBERS.length; i++) d = smin(d, sdEll(x, y, z, CHAMBERS[i]), 0.24)
  return d
}

/** distance from the centre to the surface along a unit direction */
function radiusAt(d: THREE.Vector3) {
  let lo = 0
  let hi = 2.6
  for (let i = 0; i < 26; i++) {
    const m = (lo + hi) / 2
    if (sdf(d.x * m, d.y * m, d.z * m) < 0) lo = m
    else hi = m
  }
  return lo
}

const surfacePoint = (dir: THREE.Vector3, lift = 0.014) => {
  const d = dir.clone().normalize()
  return d.multiplyScalar(radiusAt(d) + lift)
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const curve = (pts: number[][]) => new THREE.CatmullRomCurve3(pts.map((p) => V(p[0], p[1], p[2])), false, 'centripetal')

// great vessels (share the muscle material)
const GREAT = [
  { pts: [[0.02, 0.3, 0], [0, 0.95, 0.05], [0.08, 1.35, 0], [0.38, 1.58, -0.18], [0.7, 1.42, -0.42], [0.82, 0.9, -0.6], [0.84, 0, -0.72], [0.84, -1.05, -0.75]], r: 0.17 }, // aorta
  { pts: [[0.12, 1.42, -0.02], [0.03, 1.85, 0], [-0.08, 2.2, 0]], r: 0.066 }, // brachiocephalic
  { pts: [[0.36, 1.55, -0.16], [0.36, 1.95, -0.18], [0.35, 2.3, -0.2]], r: 0.056 }, // left carotid
  { pts: [[0.58, 1.5, -0.32], [0.72, 1.9, -0.38], [0.95, 2.15, -0.42]], r: 0.06 }, // left subclavian
  { pts: [[-0.3, 0.3, 0.3], [-0.25, 0.85, 0.38], [-0.05, 1.12, 0.3]], r: 0.15 }, // pulmonary trunk
  { pts: [[-0.05, 1.1, 0.3], [0.35, 1.16, 0.18], [0.8, 1.08, -0.02], [1.2, 1.0, -0.12]], r: 0.1 }, // left pulmonary artery
  { pts: [[-0.12, 1.1, 0.28], [-0.5, 1.12, 0.12], [-0.95, 1.04, -0.02], [-1.3, 0.98, -0.08]], r: 0.1 }, // right pulmonary artery
  { pts: [[-0.6, 0.55, -0.05], [-0.62, 1.2, -0.1], [-0.62, 1.8, -0.12]], r: 0.12 }, // superior vena cava
  { pts: [[-0.55, -0.05, -0.2], [-0.55, -0.7, -0.28], [-0.52, -1.3, -0.3]], r: 0.13 }, // inferior vena cava
  { pts: [[0.18, 0.55, -0.45], [-0.02, 0.62, -0.85], [-0.2, 0.68, -1.15]], r: 0.07 }, // pulmonary veins
  { pts: [[0.45, 0.52, -0.45], [0.72, 0.56, -0.85], [0.95, 0.6, -1.15]], r: 0.07 },
]

// coronary arteries as direction keyframes over the surface
const CORONARY = [
  [[-0.05, 0.45, 0.9], [0.1, 0, 1], [0.3, -0.5, 0.8], [0.5, -0.85, 0.2]],
  [[0.05, 0.2, 1], [0.4, 0, 0.9], [0.65, -0.2, 0.7]],
  [[0.15, -0.2, 1], [0.45, -0.42, 0.8]],
  [[-0.3, 0.4, 0.85], [-0.75, 0.2, 0.6], [-0.95, -0.1, 0.2], [-0.8, -0.4, -0.4]],
  [[-0.85, 0, 0.5], [-0.6, -0.6, 0.5], [-0.2, -0.85, 0.45]],
  [[0.35, 0.35, 0.8], [0.8, 0.3, 0.4], [0.95, 0.1, -0.2], [0.6, 0, -0.8]],
  [[0.85, 0.25, 0.3], [0.85, -0.3, 0.35], [0.6, -0.7, 0.3]],
  [[-0.2, -0.2, -0.95], [0.1, -0.6, -0.7], [0.35, -0.85, -0.3]],
]

const taper = (u: number) => (u < 0.82 ? 1 : 1 - ((u - 0.82) / 0.18) * 0.72)

export type HeartGeometry = { body: THREE.BufferGeometry; glow: THREE.BufferGeometry }

const cache = new Map<string, HeartGeometry>()

export function buildHeart(quality: 'high' | 'low'): HeartGeometry {
  const hit = cache.get(quality)
  if (hit) return hit
  const hi = quality === 'high'

  // --- muscle body
  let body: THREE.BufferGeometry = new THREE.SphereGeometry(1, hi ? 180 : 96, hi ? 130 : 72)
  body.deleteAttribute('uv')
  body.deleteAttribute('normal')
  body = mergeVertices(body)
  const pos = body.attributes.position as THREE.BufferAttribute
  const d = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize()
    d.multiplyScalar(radiusAt(d))
    pos.setXYZ(i, d.x, d.y, d.z)
  }
  body.computeVertexNormals()

  const vessels = GREAT.map((g) => {
    const c = curve(g.pts)
    const t = taperedTube(c, 48, g.r, hi ? 20 : 12, taper)
    t.deleteAttribute('uv')
    return t
  })
  const muscle = mergeGeometries([body, ...vessels])!

  // --- glowing network
  const glows: THREE.BufferGeometry[] = []
  CORONARY.forEach((keys, i) => {
    const pts: THREE.Vector3[] = []
    for (let k = 0; k < keys.length - 1; k++) {
      const a = V(keys[k][0], keys[k][1], keys[k][2]).normalize()
      const b = V(keys[k + 1][0], keys[k + 1][1], keys[k + 1][2]).normalize()
      for (let s = 0; s < 8; s++) pts.push(surfacePoint(a.clone().lerp(b, s / 8)))
    }
    const last = keys[keys.length - 1]
    pts.push(surfacePoint(V(last[0], last[1], last[2])))
    const c = new THREE.CatmullRomCurve3(pts)
    const len = c.getLength()
    glows.push(withGlow(taperedTube(c, 64, 0.009, 5, (u) => 1 - u * 0.5), len, i * 0.02, 0))
  })

  const rand = rng(7)
  const grow = (start: THREE.Vector3, dir: THREE.Vector3, length: number, radius: number, seq: number, offset: number, depth: number) => {
    const step = 0.3
    const n = Math.max(4, Math.round(length / step))
    const pts = [start.clone()]
    const p = start.clone()
    const dd = dir.clone().normalize()
    const jitter = new THREE.Vector3()
    for (let i = 0; i < n; i++) {
      jitter.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.5)
      dd.add(jitter).normalize().lerp(p.clone().normalize(), 0.07).normalize()
      p.addScaledVector(dd, step)
      pts.push(p.clone())
    }
    const c = new THREE.CatmullRomCurve3(pts)
    const len = c.getLength()
    glows.push(withGlow(taperedTube(c, n * 3, radius, 5, (u) => 1 - 0.78 * u), len, seq, offset))
    if (depth >= (hi ? 2 : 1)) return
    const branches = depth === 0 ? 3 : 2
    for (let b = 0; b < branches; b++) {
      const u = 0.22 + rand() * 0.6
      const bp = c.getPointAt(u)
      const bd = c.getTangentAt(u).add(V(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(1.6)).normalize()
      grow(bp, bd, length * (0.42 + rand() * 0.22), radius * 0.6, seq + 0.06, offset + len * u, depth + 1)
    }
  }

  GREAT.slice(1).concat(GREAT[0]).forEach((g, i) => {
    const c = curve(g.pts)
    grow(c.getPointAt(0.97), c.getTangentAt(1), 7 + rand() * 4, 0.018 + g.r * 0.08, i * 0.09, 1.4, 0)
  })

  const result = { body: muscle, glow: mergeGeometries(glows)! }
  cache.set(quality, result)
  return result
}
