import { useRef } from 'react'
import { Activity, Bot, Microscope, ScanLine } from 'lucide-react'
import { TECHNOLOGY } from '../data/content'
import { Line, reveal, useArrival, useScrub } from './anim'

const ICONS = [Bot, ScanLine, Activity, Microscope]

export function TechnologySection() {
  const ref = useRef<HTMLElement>(null)
  const content = useRef<HTMLDivElement>(null)
  useArrival(ref, content)
  useScrub(ref, (tl, q, reduced) => {
    reveal(tl, q, '[data-t1]', reduced, [0, 0.1])
    tl.fromTo(q('[data-t-lede]'), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.08)
    tl.fromTo(q('[data-tech]'), { opacity: 0.12, x: reduced ? 0 : -16 }, { opacity: 1, x: 0, duration: 0.1, stagger: 0.14 }, 0.2)
  })
  return (
    <section id="technology" ref={ref} aria-label="Technology" className="relative h-[340vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[60%] bg-gradient-to-r from-midnight/75 via-midnight/30 to-transparent md:block" aria-hidden />
        <div ref={content} className="mx-auto flex h-full max-w-[1600px] flex-col justify-end px-5 pb-8 pt-24 sm:px-8 md:justify-center lg:px-12">
          <div className="max-w-lg rounded-[1.5rem] bg-gradient-to-t from-midnight/85 via-midnight/60 to-transparent pt-8 md:bg-none md:pt-0">
            <h2 data-t1 className="display-md">
              <Line>Precision</Line>
              <Line className="answer">at every step.</Line>
            </h2>
            <p data-t-lede className="lede mt-6 text-ice/75">
              Bringing advanced technology, experienced specialists, and coordinated care together.
            </p>
            <ul className="mt-8 space-y-5">
              {TECHNOLOGY.map((t, i) => {
                const Icon = ICONS[i]
                return (
                  <li key={t.name} data-tech className="flex gap-4">
                    <Icon size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-signal" aria-hidden />
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="mt-0.5 hidden text-sm leading-relaxed text-ice/60 sm:block">{t.line}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="mt-7 text-xs text-ice/40">Equipment shown is illustrative. The hospital's actual technology list is a placeholder pending confirmation.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
