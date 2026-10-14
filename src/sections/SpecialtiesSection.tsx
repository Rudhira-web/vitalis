import { useEffect, useRef, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { SPECIALTIES, specialtyById } from '../data/content'
import { scrollState, scrollToSpecialty, useUI } from '../lib/scroll'
import { useBooking } from '../lib/booking'
import { Modal } from '../components/Modal'
import { useArrival } from './anim'

const EASE = [0.22, 1, 0.36, 1] as const

export function SpecialtiesSection() {
  const ref = useRef<HTMLElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  const index = useUI((u) => u.specIndex)
  const { setOpenSpecialty, book } = useBooking()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  useArrival(ref, content)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (fill.current) fill.current.style.transform = `scaleY(${scrollState.specFloat / 5})`
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  const onKey = (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = (index + dir + SPECIALTIES.length) % SPECIALTIES.length
    tabs.current[next]?.focus()
    scrollToSpecialty(next)
  }

  const s = SPECIALTIES[index]
  return (
    <section id="specialties" ref={ref} aria-label="Specialties" className="relative h-[640vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[60%] bg-gradient-to-r from-midnight/75 via-midnight/30 to-transparent md:block" aria-hidden />
        <div ref={content} className="mx-auto flex h-full max-w-[1600px] flex-col justify-end px-5 pb-8 pt-24 sm:px-8 md:justify-center lg:px-12 lg:pb-0">
          <div className="relative max-w-xl rounded-[1.5rem] bg-gradient-to-t from-midnight/80 via-midnight/50 to-transparent pt-10 md:bg-none md:pt-0">
            <div role="tablist" aria-label="Choose a specialty" aria-orientation="vertical" onKeyDown={onKey} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0">
              {SPECIALTIES.map((sp, i) => (
                <button
                  key={sp.id}
                  ref={(el) => {
                    tabs.current[i] = el
                  }}
                  role="tab"
                  id={`tab-${sp.id}`}
                  aria-selected={i === index}
                  aria-controls="specialty-panel"
                  tabIndex={i === index ? 0 : -1}
                  onClick={() => scrollToSpecialty(i)}
                  className={`flex shrink-0 items-center gap-3 rounded-full border px-4 py-2 text-left text-sm transition-all duration-500 md:rounded-none md:border-0 md:px-0 md:py-1 ${
                    i === index ? 'border-ice/40 text-ice' : 'border-ice/10 text-ice/45 hover:text-ice/80'
                  }`}
                >
                  <span className="hidden h-px transition-all duration-500 md:block" style={{ width: i === index ? 28 : 10, background: i === index ? sp.accent : 'currentColor' }} />
                  {sp.short}
                </button>
              ))}
            </div>

            <div id="specialty-panel" role="tabpanel" aria-labelledby={`tab-${s.id}`} className="mt-7 md:mt-12" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div key={s.id} initial="in" animate="show" exit="out">
                  <motion.h2
                    className="display-md"
                    variants={{ in: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 }, out: { opacity: 0, y: -20 } }}
                    transition={{ duration: 0.7, ease: EASE }}
                  >
                    {s.name}
                  </motion.h2>
                  <motion.p
                    className="answer mt-3 text-2xl text-ice/85 sm:text-3xl"
                    variants={{ in: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 }, out: { opacity: 0 } }}
                    transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
                  >
                    {s.line}
                  </motion.p>
                  <motion.p
                    className="mt-5 hidden max-w-lg leading-relaxed text-ice/70 sm:block"
                    variants={{ in: { opacity: 0 }, show: { opacity: 1 }, out: { opacity: 0 } }}
                    transition={{ duration: 0.7, delay: 0.16 }}
                  >
                    {s.description}
                  </motion.p>
                  <motion.div
                    className="mt-7 flex flex-wrap gap-3"
                    variants={{ in: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 }, out: { opacity: 0 } }}
                    transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
                  >
                    <button className="btn btn-primary" onClick={() => setOpenSpecialty(s.id)}>
                      Explore {s.short.toLowerCase()} <ArrowRight size={18} />
                    </button>
                    <button className="btn btn-ghost" onClick={() => book(s.id)}>
                      Book in {s.short.toLowerCase()}
                    </button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 right-8 hidden h-40 w-px bg-ice/15 lg:block" aria-hidden>
          <span ref={fill} className="block h-full origin-top bg-signal" style={{ transform: 'scaleY(0)' }} />
        </div>
      </div>
    </section>
  )
}

export function SpecialtyDialog() {
  const { openSpecialty, setOpenSpecialty, book, showDoctors } = useBooking()
  const s = openSpecialty ? specialtyById(openSpecialty) : null
  return (
    <Modal open={!!s} onClose={() => setOpenSpecialty(null)} label={s ? `${s.name} details` : 'Specialty details'}>
      {s && (
        <div>
          <span className="block h-px w-10" style={{ background: s.accent }} aria-hidden />
          <h2 className="display-sm mt-6 pr-10">{s.name}</h2>
          <p className="answer mt-2 text-2xl text-ice/80">{s.line}</p>
          <p className="mt-6 leading-relaxed text-ice/75">{s.description}</p>
          <h3 className="mt-8 text-sm text-ice/55">Areas of care</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {s.focus.map((f) => (
              <li key={f} className="rounded-xl border border-ice/10 px-4 py-3 text-[0.95rem]">
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-ice/45">Service details are placeholders. Confirm treatments, hours and availability with the hospital.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn btn-primary" onClick={() => book(s.id)}>
              Book in {s.short.toLowerCase()} <ArrowRight size={18} />
            </button>
            <button className="btn btn-ghost" onClick={() => showDoctors(s.id)}>
              See {s.short.toLowerCase()} specialists
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
