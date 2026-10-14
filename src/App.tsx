import { useEffect, useState } from 'react'
import { BookingProvider } from './lib/booking'
import { hasWebGL, isSmallOrTouch, prefersReducedMotion } from './lib/device'
import { initScroll, setUI } from './lib/scroll'
import { Experience, SceneBoundary } from './three/Experience'
import { stage } from './three/stage'
import { Cursor, Nav, Preloader, Progress } from './components/Chrome'
import { Hero } from './sections/Hero'
import { Journey } from './sections/Journey'
import { HospitalSection } from './sections/HospitalSection'
import { SpecialtiesSection, SpecialtyDialog } from './sections/SpecialtiesSection'
import { TechnologySection } from './sections/TechnologySection'
import { DoctorDialog, Doctors } from './sections/Doctors'
import { Appointment } from './sections/Appointment'
import { Finale } from './sections/Finale'

/** Shown when WebGL is unavailable or the scene fails: the story still reads, just without 3D */
function StaticBackdrop() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_40%,#1a0a18_0%,#050a16_60%)]">
      <svg className="absolute right-[8%] top-1/2 w-[46vw] max-w-[640px] -translate-y-1/2 opacity-40" viewBox="0 0 400 120" fill="none" aria-hidden>
        <path d="M0 64h140l14-30 22 62 18-48 12 16h194" stroke="#5fe3ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default function App() {
  const [webgl] = useState(hasWebGL)
  const [quality] = useState<'high' | 'low'>(() => (isSmallOrTouch() || (navigator.hardwareConcurrency ?? 8) < 4 ? 'low' : 'high'))

  useEffect(() => {
    const cleanup = initScroll(prefersReducedMotion())
    if (!webgl) setUI({ ready: true })
    // never hold the page hostage to a slow GPU
    const safety = window.setTimeout(() => setUI({ ready: true }), 6000)
    return () => {
      cleanup()
      window.clearTimeout(safety)
    }
  }, [webgl])

  return (
    <BookingProvider>
      <a href="#appointment" className="sr-only z-[100] rounded-full bg-ice px-4 py-2 text-midnight focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to appointment form
      </a>
      <Preloader />
      <div className="fixed inset-0 z-0" aria-hidden>
        {webgl ? (
          <SceneBoundary fallback={<StaticBackdrop />}>
            <Experience quality={quality} />
          </SceneBoundary>
        ) : (
          <StaticBackdrop />
        )}
      </div>
      <div ref={(el) => void (stage.veilEl = el)} className="pointer-events-none fixed inset-0 z-[1] opacity-0" aria-hidden />
      <Cursor />
      <Progress />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Journey />
        <HospitalSection />
        <SpecialtiesSection />
        <TechnologySection />
        <Doctors />
        <Appointment />
        <Finale />
      </main>
      <SpecialtyDialog />
      <DoctorDialog />
    </BookingProvider>
  )
}
