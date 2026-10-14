import { useRef } from 'react'
import { Line, reveal, useScrub } from './anim'

export function Journey() {
  const ref = useRef<HTMLElement>(null)
  useScrub(ref, (tl, q, reduced) => {
    reveal(tl, q, '[data-s1]', reduced, [0.06, 0.18], [0.34, 0.42])
    reveal(tl, q, '[data-s2]', reduced, [0.56, 0.68], [0.88, 0.97])
  })
  return (
    <section id="journey" ref={ref} aria-label="Journey through the heart" className="relative h-[460vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1600px] px-5 sm:px-8 lg:px-12 [&>*]:col-start-1 [&>*]:row-start-1">
          <h2 data-s1 className="display-md max-w-[13ch]">
            <Line>Medicine is more</Line>
            <Line>than science.</Line>
          </h2>
          <p data-s2 className="display-md max-w-[15ch] self-end justify-self-end text-right">
            <Line>It is the science of</Line>
            <Line className="answer">keeping life moving.</Line>
          </p>
        </div>
      </div>
    </section>
  )
}
