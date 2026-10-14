import { useRef } from 'react'
import { Activity, BedDouble, HandHeart, Scan, Siren, Stethoscope } from 'lucide-react'
import { FACILITIES } from '../data/content'
import { Line, reveal, useScrub } from './anim'

const ICONS = [Siren, Activity, Scan, Stethoscope, BedDouble, HandHeart]

export function HospitalSection() {
  const ref = useRef<HTMLElement>(null)
  useScrub(ref, (tl, q, reduced) => {
    reveal(tl, q, '[data-h1]', reduced, [0.06, 0.18], [0.44, 0.52])
    tl.fromTo(q('[data-fac-panel]'), { opacity: 0, y: reduced ? 0 : 40 }, { opacity: 1, y: 0, duration: 0.08 }, 0.72)
    tl.fromTo(q('[data-fac]'), { opacity: 0, y: reduced ? 0 : 24 }, { opacity: 1, y: 0, duration: 0.06, stagger: 0.025 }, 0.75)
  })
  return (
    <section id="hospital" ref={ref} aria-label="The hospital" className="relative h-[460vh] text-ink">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="mx-auto flex h-full max-w-[1600px] flex-col justify-between px-5 pb-8 pt-28 sm:px-8 lg:px-12 lg:pb-12 lg:pt-32">
          <h2 data-h1 className="display-md max-w-[18ch]">
            <Line>Designed around you.</Line>
            <Line className="answer">Driven by discovery.</Line>
          </h2>

          <div data-fac-panel className="glass-light rounded-[1.5rem] p-5 opacity-0 sm:p-7">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-normal tracking-tight sm:text-xl">Inside VITALIS</h3>
              <p className="text-xs text-slate">Facilities shown are illustrative placeholders.</p>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-6">
              {FACILITIES.map((f, i) => {
                const Icon = ICONS[i]
                return (
                  <li key={f.name} data-fac className="opacity-0">
                    <Icon size={20} strokeWidth={1.5} className="text-[#0b6f8a]" aria-hidden />
                    <p className="mt-2.5 text-[0.95rem] font-medium leading-snug">{f.name}</p>
                    <p className="mt-1 text-[0.82rem] leading-snug text-slate">{f.line}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
