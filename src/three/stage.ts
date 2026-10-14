import * as THREE from 'three'

export type World = 'heart' | 'tunnel' | 'hospital' | 'specialties' | 'technology'

/**
 * Per-frame values the Director writes and each world reads.
 * Mutable on purpose: nothing here should trigger a React render.
 */
export const stage = {
  world: 'heart' as World,
  time: 0,
  mobile: false,
  heart: { opacity: 1, scale: 1, reveal: 0, amp: 1, beatA: 0, beatV: 0, rotY: 0 },
  bloom: 1,
  tunnel: { opacity: 0, exit: 0 },
  hospital: { doorOpen: 0 },
  /** extra veil requested by UI (e.g. "return to the first beat") */
  manualVeil: 0,
  veilEl: null as HTMLDivElement | null,
}

export const COLORS = {
  cyan: new THREE.Color('#5fe3ff'),
  ice: new THREE.Color('#eaf4fa'),
  mint: new THREE.Color('#86e3c8'),
  navy: new THREE.Color('#050a16'),
}
