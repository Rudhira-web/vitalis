import { useSyncExternalStore } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { clamp, smoothstep } from './math'

gsap.registerPlugin(ScrollTrigger)

export const SECTIONS = [
  { id: 'hero', label: 'Heartbeat' },
  { id: 'journey', label: 'Journey' },
  { id: 'hospital', label: 'The hospital' },
  { id: 'specialties', label: 'Specialties' },
  { id: 'technology', label: 'Technology' },
  { id: 'doctors', label: 'Specialists' },
  { id: 'appointment', label: 'Appointment' },
  { id: 'finale', label: 'Final beat' },
] as const
export type SectionId = (typeof SECTIONS)[number]['id']

type SectionProgress = {
  /** 0 → 1 while the section's top travels from the viewport bottom to the viewport top */
  enter: number
  /** 0 → 1 while the section scrolls "pinned" (top at viewport top → bottom at viewport bottom) */
  inner: number
}

/**
 * Mutable, render-loop friendly scroll state. The WebGL director reads it every frame;
 * React only subscribes to the coarse `ui` store below.
 */
export const scrollState = {
  y: 0,
  progress: 0,
  reduced: false,
  specFloat: 0,
  mouse: { x: 0, y: 0 },
  s: Object.fromEntries(SECTIONS.map((s) => [s.id, { enter: 0, inner: 0 }])) as Record<SectionId, SectionProgress>,
}

/* ---------- coarse UI store (React) ---------- */
type UI = { active: number; covered: boolean; ready: boolean; specIndex: number; lightNav: boolean }
let ui: UI = { active: 0, covered: false, ready: false, specIndex: 0, lightNav: false }
const listeners = new Set<() => void>()
export function setUI(patch: Partial<UI>) {
  const changed = (Object.keys(patch) as (keyof UI)[]).some((k) => ui[k] !== patch[k])
  if (!changed) return
  ui = { ...ui, ...patch }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l))
export const useUI = <T,>(select: (u: UI) => T): T => useSyncExternalStore(subscribe, () => select(ui))
export const getUI = () => ui

/* ---------- measurement ---------- */
let metrics: { id: SectionId; top: number; h: number }[] = []
let lenis: Lenis | null = null

function measure() {
  metrics = SECTIONS.map(({ id }) => {
    const el = document.getElementById(id)
    if (!el) return { id, top: 0, h: 1 }
    return { id, top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight }
  })
  compute(window.scrollY)
}

function compute(y: number) {
  const vh = window.innerHeight
  const max = Math.max(1, document.documentElement.scrollHeight - vh)
  scrollState.y = y
  scrollState.progress = clamp(y / max)
  let active = 0
  let covered = false
  metrics.forEach((m, i) => {
    const s = scrollState.s[m.id]
    s.enter = m.top <= 0 ? 1 : clamp((y + vh - m.top) / vh)
    s.inner = m.h <= vh ? (y >= m.top ? 1 : 0) : clamp((y - m.top) / (m.h - vh))
    if (m.top <= y + vh * 0.5) active = i
    if (m.id === 'doctors' && m.top <= y + 1 && m.top + m.h >= y + vh - 1) covered = true
  })

  // specialties: hold on each item, then ease into the next one
  const raw = scrollState.s.specialties.inner * 6
  const i = Math.min(5, Math.floor(raw))
  scrollState.specFloat = i === 5 ? 5 : i + smoothstep(0.7, 1, raw - i)

  const S = scrollState.s
  setUI({
    active,
    covered,
    specIndex: Math.round(scrollState.specFloat),
    lightNav: (active === 2 && S.hospital.enter > 0.6 && S.specialties.enter < 0.5) || active === 5,
  })
}

export function initScroll(reduced: boolean) {
  scrollState.reduced = reduced
  const onScroll = () => compute(window.scrollY)
  const onPointer = (e: PointerEvent) => {
    scrollState.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    scrollState.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  const raf = (time: number) => lenis?.raf(time * 1000)

  if (!reduced) {
    lenis = new Lenis({ lerp: 0.065, wheelMultiplier: 0.9, touchMultiplier: 1.1 })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('pointermove', onPointer, { passive: true })
  ScrollTrigger.addEventListener('refresh', measure)
  const ro = new ResizeObserver(() => ScrollTrigger.refresh())
  ro.observe(document.body)
  measure()

  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('pointermove', onPointer)
    ScrollTrigger.removeEventListener('refresh', measure)
    ro.disconnect()
    gsap.ticker.remove(raf)
    lenis?.destroy()
    lenis = null
  }
}

/* ---------- navigation helpers ---------- */
export function scrollToY(y: number, immediate = false) {
  if (lenis) lenis.scrollTo(y, { immediate, duration: clamp(Math.abs(y - window.scrollY) / 4000, 1, 1.9), easing: (t) => 1 - Math.pow(1 - t, 4) })
  else window.scrollTo({ top: y, behavior: 'auto' })
}

/** fraction: 0 = section top, 1 = last pinned position of the section */
export function scrollToSection(id: SectionId, fraction = 0) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  const travel = Math.max(0, el.offsetHeight - window.innerHeight)
  scrollToY(top + travel * fraction)
}

export function scrollToSpecialty(index: number) {
  scrollToSection('specialties', (index + 0.35) / 6)
}

export const lockScroll = (locked: boolean) => {
  if (locked) lenis?.stop()
  else lenis?.start()
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}
