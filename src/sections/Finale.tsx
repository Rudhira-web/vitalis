import { useRef } from 'react'
import { gsap } from 'gsap'
import { ArrowRight, ArrowUp } from 'lucide-react'
import { CONTACT } from '../data/content'
import { scrollToSection, scrollToY, scrollState, type SectionId } from '../lib/scroll'
import { useBooking } from '../lib/booking'
import { stage } from '../three/stage'
import { Logo } from '../components/Chrome'
import { Line, reveal, useScrub } from './anim'

/** Fade to black, cut to the opening frame, fade back in: the story loops on the same heartbeat */
function rewind() {
  if (scrollState.reduced) return scrollToY(0, true)
  gsap.to(stage, {
    manualVeil: 1,
    duration: 0.7,
    ease: 'power2.inOut',
    onComplete: () => {
      scrollToY(0, true)
      gsap.to(stage, { manualVeil: 0, duration: 1.4, delay: 0.25, ease: 'power2.out' })
    },
  })
}

const FOOT: { label: string; id: SectionId; f: number }[] = [
  { label: 'Specialties', id: 'specialties', f: 0.02 },
  { label: 'Our Technology', id: 'technology', f: 0.05 },
  { label: 'Our Doctors', id: 'doctors', f: 0 },
  { label: 'Book an Appointment', id: 'appointment', f: 0.4 },
]

export function Finale() {
  const pinned = useRef<HTMLDivElement>(null)
  const { book } = useBooking()
  useScrub(pinned, (tl, q, reduced) => {
    reveal(tl, q, '[data-f1]', reduced, [0.18, 0.4])
    tl.fromTo(q('[data-f2]'), { opacity: 0, y: reduced ? 0 : 20 }, { opacity: 1, y: 0, duration: 0.15 }, 0.42)
  })

  return (
    <section id="finale" aria-labelledby="finale-title" className="relative">
      <div ref={pinned} className="relative h-[200vh]">
        <div className="sticky top-0 flex h-[100svh] items-end overflow-hidden">
          <div className="mx-auto w-full max-w-[1600px] px-5 pb-12 sm:px-8 lg:px-12 lg:pb-16">
            <h2 id="finale-title" data-f1 className="display-md max-w-[22ch]">
              <Line>Behind every heartbeat</Line>
              <Line className="answer">is a life worth caring for.</Line>
            </h2>
            <div data-f2 className="mt-8 flex flex-col gap-7 opacity-0 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-2xl font-light tracking-tight sm:text-3xl">Your health. Our purpose.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="btn btn-primary" onClick={() => book()}>
                    Book an Appointment <ArrowRight size={18} />
                  </button>
                  <button className="btn btn-ghost" onClick={rewind}>
                    Return to the first beat <ArrowUp size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative border-t border-ice/10 bg-midnight/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-12">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ice/55">Every Beat. Every Possibility.</p>
          </div>
          <div>
            <h3 className="text-sm text-ice/50">Emergency</h3>
            <p className="mt-3 text-lg">{CONTACT.emergency}</p>
            <p className="mt-2 text-sm leading-relaxed text-ice/55">In a medical emergency, call your local emergency number straight away.</p>
          </div>
          <div>
            <h3 className="text-sm text-ice/50">Visit</h3>
            <address className="mt-3 not-italic leading-relaxed">
              VITALIS Medical Institute
              <br />
              {CONTACT.address[0]}
              <br />
              {CONTACT.address[1]}
            </address>
            <p className="mt-3 text-sm text-ice/55">
              {CONTACT.enquiries}
              <br />
              {CONTACT.email}
            </p>
          </div>
          <nav aria-label="Footer">
            <h3 className="text-sm text-ice/50">Explore</h3>
            <ul className="mt-3 space-y-2">
              {FOOT.map((l) => (
                <li key={l.id}>
                  <button onClick={() => scrollToSection(l.id, l.f)} className="text-ice/80 transition-colors hover:text-signal">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 border-t border-ice/10 px-5 py-6 text-xs text-ice/40 sm:flex-row sm:justify-between sm:px-8 lg:px-12">
          <p>VITALIS Medical Institute is a fictional hospital concept. It is not a real healthcare provider.</p>
          <p>All names, profiles, facilities and contact details are illustrative placeholders.</p>
        </div>
      </footer>
    </section>
  )
}
