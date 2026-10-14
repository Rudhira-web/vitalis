import { useLayoutEffect, type ReactNode, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollState } from '../lib/scroll'

gsap.registerPlugin(ScrollTrigger)

type Q = (selector: string) => Element[]

/**
 * A scroll-scrubbed timeline normalised to 0 → 1 across the section's pinned travel
 * ('top top' → 'bottom bottom'), so positions read as fractions of the scene.
 */
export function useScrub(section: RefObject<HTMLElement | null>, build: (tl: gsap.core.Timeline, q: Q, reduced: boolean) => void, start = 'top top', end = 'bottom bottom') {
  useLayoutEffect(() => {
    const el = section.current
    if (!el) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: el, start, end, scrub: scrollState.reduced ? true : 1 } })
      build(tl, gsap.utils.selector(el), scrollState.reduced)
      tl.set({}, {}, 1)
    }, el)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Masked line reveal in, hold, and (optionally) out */
export function reveal(tl: gsap.core.Timeline, q: Q, sel: string, reduced: boolean, at: [number, number], out?: [number, number]) {
  const lines = q(`${sel} [data-line]`)
  const wrap = q(sel)
  if (reduced) {
    tl.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: at[1] - at[0] }, at[0])
    if (out) tl.to(wrap, { opacity: 0, duration: out[1] - out[0] }, out[0])
    return
  }
  tl.fromTo(lines, { yPercent: 112 }, { yPercent: 0, duration: at[1] - at[0], stagger: (at[1] - at[0]) * 0.25, ease: 'power3.out' }, at[0])
  if (out) tl.to(lines, { yPercent: -112, duration: out[1] - out[0], stagger: (out[1] - out[0]) * 0.2, ease: 'power2.in' }, out[0])
}

/** One line of display type inside a mask */
export function Line({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
      <span data-line className={`block will-change-transform ${className}`}>
        {children}
      </span>
    </span>
  )
}

/** Fades a pinned scene's content in while the section is still arriving, so text never sits over the previous world */
export function useArrival(section: RefObject<HTMLElement | null>, target: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!section.current || !target.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(target.current, { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top 40%', end: 'top top', scrub: true } })
    })
    return () => ctx.revert()
  }, [section, target])
}
