import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import { lockScroll, scrollState, scrollToSection, scrollToY, SECTIONS, useUI, type SectionId } from '../lib/scroll'
import { useBooking } from '../lib/booking'
import { isSmallOrTouch, prefersReducedMotion } from '../lib/device'

export function Logo({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeOpacity="0.35" />
        <path d="M5 17h5.5l2.4-5.6 3.8 10.2 2.9-7.4 1.4 2.8H27" fill="none" stroke={tone === 'light' ? '#5fe3ff' : '#0b6f8a'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[0.95rem] font-medium tracking-[0.32em]">VITALIS</span>
    </span>
  )
}

const LINKS: { label: string; id: SectionId; at: number; fraction: number }[] = [
  { label: 'Specialties', id: 'specialties', at: 3, fraction: 0.02 },
  { label: 'Our Technology', id: 'technology', at: 4, fraction: 0.05 },
  { label: 'Our Doctors', id: 'doctors', at: 5, fraction: 0 },
  { label: 'Contact', id: 'finale', at: 7, fraction: 1 },
]

export function Nav() {
  const active = useUI((u) => u.active)
  const light = useUI((u) => u.lightNav)
  const { book } = useBooking()
  const [open, setOpen] = useState(false)
  const first = useRef<HTMLButtonElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    lockScroll(true)
    first.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      window.removeEventListener('keydown', onKey)
      toggle.current?.focus()
    }
  }, [open])

  const go = (l: (typeof LINKS)[number]) => {
    setOpen(false)
    // wait for the menu to release scroll before travelling
    window.setTimeout(() => scrollToSection(l.id, l.fraction), open ? 60 : 0)
  }

  const ink = light && !open
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ${ink ? 'text-ink' : 'text-ice'}`}>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b transition-opacity duration-700 ${ink ? 'from-white/55' : 'from-midnight/75'} to-transparent`}
      />
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <button onClick={() => scrollToY(0)} aria-label="VITALIS, back to the beginning" className="rounded-md">
          <Logo tone={ink ? 'dark' : 'light'} />
        </button>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l)}
              aria-current={active === l.at ? 'location' : undefined}
              className={`relative px-4 py-2 text-[0.92rem] transition-opacity hover:opacity-100 ${active === l.at ? 'opacity-100' : 'opacity-75'}`}
            >
              {l.label}
              {active === l.at && (
                <motion.span layoutId="nav-dot" className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-signal" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
            </button>
          ))}
          <button onClick={() => book()} className={`btn ml-4 !h-11 ${ink ? 'btn-ink' : 'btn-ghost'}`}>
            Book an appointment
          </button>
        </nav>
        <button
          ref={toggle}
          className="grid size-11 place-items-center rounded-full md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 top-20 z-40 flex flex-col justify-between bg-midnight/96 px-6 pb-10 pt-6 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul className="space-y-1">
              {LINKS.map((l, i) => (
                <motion.li key={l.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }}>
                  <button ref={i === 0 ? first : undefined} onClick={() => go(l)} className="w-full py-3 text-left text-4xl font-light tracking-tight">
                    {l.label}
                  </button>
                </motion.li>
              ))}
            </ul>
            <button
              onClick={() => {
                setOpen(false)
                window.setTimeout(() => book(), 60)
              }}
              className="btn btn-primary w-full justify-center"
            >
              Book an appointment <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/** Thin progress line + chapter rail. The story is a real sequence, so chapters are numbered. */
export function Progress() {
  const bar = useRef<HTMLDivElement>(null)
  const active = useUI((u) => u.active)
  const light = useUI((u) => u.lightNav)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (bar.current) bar.current.style.transform = `scaleX(${scrollState.progress})`
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[60] h-[2px]" aria-hidden>
        <div ref={bar} className="h-full origin-left bg-signal" style={{ transform: 'scaleX(0)' }} />
      </div>
      <nav aria-label="Chapters" className={`fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 lg:block ${light ? 'text-ink' : 'text-ice'}`}>
        <ol className="flex flex-col items-end gap-3">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <button
                onClick={() => scrollToSection(s.id, s.id === 'finale' ? 0.5 : 0)}
                className="group flex items-center gap-3 py-0.5"
                aria-label={`Chapter ${i + 1}: ${s.label}`}
                aria-current={active === i ? 'step' : undefined}
              >
                <span
                  className={`text-xs tabular-nums transition-all duration-500 ${
                    active === i ? 'opacity-90' : 'translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-70 group-focus-visible:translate-x-0 group-focus-visible:opacity-70'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')} {s.label}
                </span>
                <span className={`block h-px transition-all duration-500 ${active === i ? 'w-8 bg-signal' : 'w-4 bg-current opacity-40 group-hover:opacity-80'}`} />
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}

/** A soft ring that trails the pointer and opens over interactive elements (fine pointers only) */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null)
  const [enabled] = useState(() => !isSmallOrTouch() && !prefersReducedMotion())
  useEffect(() => {
    if (!enabled) return
    const target = { x: -100, y: -100 }
    const cur = { x: -100, y: -100, s: 1 }
    let hover = false
    let raf = 0
    const move = (e: PointerEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      hover = !!(e.target as HTMLElement).closest?.('a, button, input, select, textarea, [role="tab"]')
    }
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.2
      cur.y += (target.y - cur.y) * 0.2
      cur.s += ((hover ? 1.9 : 1) - cur.s) * 0.15
      if (ring.current) ring.current.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0) translate(-50%, -50%) scale(${cur.s})`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', move, { passive: true })
    tick()
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [enabled])
  if (!enabled) return null
  return <div ref={ring} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[80] size-8 rounded-full border border-white/70 mix-blend-difference" />
}

export function Preloader() {
  const ready = useUI((u) => u.ready)
  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-midnight"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <div className="flex flex-col items-center gap-6 text-ice">
            <svg width="220" height="48" viewBox="0 0 220 48" fill="none">
              <motion.path
                d="M0 26h70l8-14 12 30 10-24 6 8h114"
                stroke="#5fe3ff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop', repeatDelay: 0.2 }}
              />
            </svg>
            <span className="text-sm tracking-[0.42em] opacity-70">VITALIS</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
