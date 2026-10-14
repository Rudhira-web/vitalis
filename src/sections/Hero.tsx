import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { scrollToSection, useUI } from '../lib/scroll'
import { useBooking } from '../lib/booking'
import { useScrub } from './anim'

const EASE = [0.22, 1, 0.36, 1] as const

function Rise({ children, delay, className = '' }: { children: React.ReactNode; delay: number; className?: string }) {
  const ready = useUI((u) => u.ready)
  return (
    <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
      <motion.span className={`block ${className}`} initial={{ y: '110%' }} animate={ready ? { y: '0%' } : undefined} transition={{ duration: 1.3, delay, ease: EASE }}>
        {children}
      </motion.span>
    </span>
  )
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const ready = useUI((u) => u.ready)
  const { book } = useBooking()

  useScrub(ref, (tl, q, reduced) => {
    tl.to(q('[data-hero-content]'), { opacity: 0, y: reduced ? 0 : -80, duration: 0.7, ease: 'power1.in' }, 0.05)
    tl.to(q('[data-cue]'), { opacity: 0, duration: 0.2 }, 0)
  })

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 1, delay, ease: EASE },
  })

  return (
    <section id="hero" ref={ref} aria-label="Introduction" className="relative h-[165vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div data-hero-content className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-5 pb-10 sm:px-8 sm:pb-14 lg:px-12 lg:pb-16">
          <motion.p {...fade(0.9)} className="text-[0.78rem] tracking-[0.34em] text-ice/70">
            VITALIS MEDICAL INSTITUTE
          </motion.p>
          <h1 className="display mt-5 max-w-[11ch] sm:mt-6">
            <Rise delay={1.0}>Every Beat.</Rise>
            <Rise delay={1.15} className="answer">
              Every Possibility.
            </Rise>
          </h1>
          <div className="mt-8 flex flex-col gap-8 sm:mt-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <motion.p {...fade(1.5)} className="lede text-ice/75">
                Advanced medicine. Exceptional people. Care that moves life forward.
              </motion.p>
              <motion.div {...fade(1.65)} className="mt-7 flex flex-wrap gap-3">
                <button className="btn btn-primary" onClick={() => scrollToSection('specialties', 0.02)}>
                  Explore Our Care <ArrowRight size={18} />
                </button>
                <button className="btn btn-ghost" onClick={() => book()}>
                  Book an Appointment
                </button>
              </motion.div>
            </div>
            <motion.button
              {...fade(2.1)}
              data-cue
              onClick={() => scrollToSection('journey', 0.25)}
              className="group hidden items-center gap-4 text-sm text-ice/60 transition-colors hover:text-ice lg:flex"
            >
              Scroll to follow the heartbeat
              <span className="relative block h-12 w-px overflow-hidden bg-ice/20">
                <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_2.2s_cubic-bezier(.22,1,.36,1)_infinite] bg-signal" />
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
