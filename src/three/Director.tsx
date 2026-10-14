import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SPECIALTIES } from '../data/content'
import { bell, clamp, damp, easeInOut, lerp, remap, smoothstep } from '../lib/math'
import { getUI, scrollState } from '../lib/scroll'
import { beatAt } from './Heart'
import { HOSPITAL_CAM, HOSPITAL_LOOK, TUNNEL } from './paths'
import { stage, type World } from './stage'

const SPEC_COLORS = SPECIALTIES.map((s) => new THREE.Color(s.stage))
const BG = {
  heart: new THREE.Color('#03060d'),
  tunnel: new THREE.Color('#06020a'),
  hospital: new THREE.Color('#d3e2eb'),
  technology: new THREE.Color('#04070d'),
}
const VEIL = { crimson: '#16030a', white: '#f2f7fa', navy: '#050a16', black: '#020409' }

/**
 * The film director: turns scroll progress into one continuous camera move,
 * picks which world is on screen, and hides every world switch behind a veil.
 */
export function Director() {
  const { camera, scene, size } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const bg = useMemo(() => new THREE.Color('#03060d'), [])
  const tgt = useMemo(() => new THREE.Color(), [])
  const fog = useMemo(() => new THREE.Fog('#03060d', 8, 40), [])
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), a: new THREE.Vector3(), right: new THREE.Vector3() }), [])
  const sm = useRef({ mx: 0, my: 0, phase: 0, intro: -1, veil: -1, veilColor: '', fov: 40, init: false, vs: 0 })
  const cur = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])

  useEffect(() => {
    scene.background = bg
    scene.fog = fog
  }, [scene, bg, fog])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const t = state.clock.elapsedTime
    stage.time = t
    const S = scrollState.s
    const reduced = scrollState.reduced
    const mobile = size.width < 768
    stage.mobile = mobile
    const s = sm.current
    s.mx = damp(s.mx, reduced ? 0 : scrollState.mouse.x, 2.5, dt)
    s.my = damp(s.my, reduced ? 0 : scrollState.mouse.y, 2.5, dt)
    if (s.intro < 0 && getUI().ready) s.intro = t
    const intro = s.intro < 0 ? 0 : smoothstep(0, 1, (t - s.intro) / 3.2)

    const h = stage.heart
    const pos = tmp.pos
    const look = tmp.look
    let world: World = 'heart'
    let fov = 40
    let bpm = 56
    let envI = 0.5
    let bloom = 1.1
    let fogNear = 8
    let fogFar = 40

    h.amp = reduced ? 0.45 : 1
    h.scale = 1
    stage.tunnel.opacity = 0
    stage.tunnel.exit = 0
    const spin = reduced ? 0 : Math.sin(t * 0.16) * 0.42
    h.rotY = spin + s.mx * 0.25

    const J = S.journey.inner
    const He = S.hospital.enter
    const Hi = S.hospital.inner
    const SPe = S.specialties.enter
    const TEe = S.technology.enter
    const TEi = S.technology.inner
    const APe = S.appointment.enter
    const heroZ = mobile ? 10.8 : 8.4
    const heroLook = (v: THREE.Vector3) => v.set(mobile ? 0 : -1.25, mobile ? -1.1 : 0.15, 0)

    if (APe > 0) {
      // closing: the heart returns from the dark and lands exactly on the opening frame
      const c = easeInOut(clamp(0.25 * APe + 0.25 * S.finale.enter + 0.5 * remap(S.finale.inner, 0, 0.55)))
      heroLook(look)
      look.y += lerp(1.2, 0, c)
      pos.set(look.x + s.mx * 0.35 * c, lerp(2.6, 0.12, c) + s.my * 0.2 * c, lerp(21, heroZ, c))
      h.opacity = 1
      h.reveal = lerp(0.15, 0.46, smoothstep(0.2, 1, c))
      bpm = 54
      bloom = 1.15
    } else if (TEe >= 0.5) {
      world = 'technology'
      const k = easeInOut(TEi)
      const a = lerp(0.95, -0.7, k)
      const r = lerp(mobile ? 15 : 9.6, mobile ? 12.5 : 7.4, k)
      pos.set(Math.sin(a) * r + s.mx * 0.4, lerp(3.9, 2.7, k) + s.my * 0.2, Math.cos(a) * r)
      tmp.right.set(Math.cos(a), 0, -Math.sin(a))
      look.set(0, mobile ? -0.9 : 1.1, 0).addScaledVector(tmp.right, mobile ? 0 : -3.3)
      envI = 0.45
      bloom = 0.85
      fogNear = 10
      fogFar = 34
    } else if (SPe >= 0.5) {
      world = 'specialties'
      pos.set(s.mx * 0.45, 0.15 + s.my * 0.3, (mobile ? 10 : 7.4) - S.specialties.inner * 0.5)
      look.set(0, 0, 0)
      envI = 0.5
      bloom = 0.95
      fogNear = 7
      fogFar = 24
    } else if (He >= 0.5) {
      world = 'hospital'
      const u = easeInOut(remap(Hi, 0, 0.92))
      HOSPITAL_CAM.getPointAt(u, pos)
      HOSPITAL_LOOK.getPointAt(u, look)
      const outside = 1 - smoothstep(30, 14, pos.z)
      pos.x += s.mx * 2.2 * outside
      pos.y += s.my * 1.2 * outside
      if (mobile) {
        // portrait: step back and tilt up so the campus sits below the headline
        pos.addScaledVector(tmp.a.copy(pos).sub(look).normalize(), 34 * outside)
        look.y += 9 * outside
      }
      stage.hospital.doorOpen = smoothstep(32, 15, pos.z)
      fov = lerp(40, 54, smoothstep(14, 4, pos.z))
      envI = 0.75
      bloom = 0.22
      fogNear = 220
      fogFar = 900
    } else if (J > 0.47) {
      world = 'tunnel'
      const u = lerp(0, 0.93, easeInOut(remap(J, 0.47, 1))) + 0.07 * remap(He, 0, 0.5)
      const k = Math.min(TUNNEL.samples, Math.round(u * TUNNEL.samples))
      pos.copy(TUNNEL.points[k])
      pos.addScaledVector(TUNNEL.frames.normals[k], s.my * 0.35)
      pos.addScaledVector(TUNNEL.frames.binormals[k], s.mx * 0.35)
      TUNNEL.curve.getPointAt(Math.min(1, u + 0.02), look)
      stage.tunnel.opacity = 1
      stage.tunnel.exit = smoothstep(0.7, 1, J) + He * 2
      h.opacity = 0
      fov = lerp(40, 60, smoothstep(0.47, 0.62, J))
      bpm = 78
      bloom = 0.45
      fogNear = 2
      fogFar = 30
    } else {
      // opening heart + approach
      const a = easeInOut(remap(J, 0.04, 0.47))
      const hi = S.hero.inner
      heroLook(look).multiplyScalar(1 - a)
      const z = lerp(lerp(heroZ, heroZ - 0.8, hi), 0.9, a)
      pos.set(look.x + s.mx * 0.35 * (1 - a), lerp(0.12, 0, a) + s.my * 0.2 * (1 - a), z)
      h.scale = lerp(1, 1.6, a)
      h.opacity = intro * (1 - smoothstep(0.36, 0.46, J))
      const introReveal = smoothstep(0.15, 1, intro) * 0.46
      h.reveal = lerp(introReveal, 1, smoothstep(0.06, 0.36, J))
      bpm = lerp(56, 76, smoothstep(0.05, 0.4, J))
      h.amp *= lerp(1, 1.3, smoothstep(0.05, 0.4, J))
      stage.tunnel.opacity = smoothstep(0.38, 0.47, J)
      bloom = 1.15
    }

    // heartbeat clock
    s.phase += dt * (bpm / 60)
    const b = beatAt(s.phase)
    h.beatA = b.a
    h.beatV = b.v

    stage.world = world
    stage.bloom = bloom
    // ease the camera toward the target so world switches and scroll jumps never snap
    // first frame, or waking from a paused canvas (doctors cover / hidden tab): jump, don't sweep
    const resumed = rawDt > 0.25
    if (!s.init || resumed) {
      cur.pos.copy(pos)
      cur.look.copy(look)
      s.fov = fov
      s.init = true
    }
    // tighter follow in the tunnel so the rush stays locked to the heartbeat
    const k = reduced ? 1 : 1 - Math.exp(-(world === 'tunnel' ? 10 : 6) * dt)
    cur.pos.lerp(pos, k)
    cur.look.lerp(look, k)
    s.fov = lerp(s.fov, fov, k)
    cam.position.copy(cur.pos)
    cam.lookAt(cur.look)
    if (Math.abs(cam.fov - s.fov) > 0.01) {
      cam.fov = s.fov
      cam.updateProjectionMatrix()
    }

    // background + fog
    if (world === 'specialties') {
      const f = scrollState.specFloat
      const i = Math.min(4, Math.floor(f))
      tgt.copy(SPEC_COLORS[i]).lerp(SPEC_COLORS[i + 1], f - i)
    } else tgt.copy(world === 'heart' ? BG.heart : BG[world])
    bg.lerp(tgt, reduced || resumed ? 1 : 1 - Math.exp(-8 * dt))
    fog.color.copy(bg)
    fog.near = fogNear
    fog.far = fogFar
    scene.environmentIntensity = envI

    // veils between worlds
    let v = 0
    let vc = VEIL.navy
    const pick = (amount: number, color: string) => {
      if (amount > v) {
        v = amount
        vc = color
      }
    }
    pick(bell(remap(J, 0.36, 0.54)) * 0.9, VEIL.crimson)
    pick(bell(He, 0.02, 0.86), VEIL.white)
    pick(bell(SPe), VEIL.navy)
    pick(bell(TEe), VEIL.black)
    pick(stage.manualVeil, VEIL.black)
    const el = stage.veilEl
    if (el) {
      s.vs = reduced || resumed ? v : damp(s.vs, v, 14, dt)
      const rounded = Math.round(s.vs * 1000) / 1000
      if (rounded !== s.veil) {
        el.style.opacity = String(rounded)
        s.veil = rounded
      }
      if (vc !== s.veilColor) {
        el.style.backgroundColor = vc
        s.veilColor = vc
      }
    }
  })

  return null
}
