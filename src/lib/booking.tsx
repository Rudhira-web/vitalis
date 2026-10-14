import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { SpecialtyId } from '../data/content'
import { scrollToSection } from './scroll'

type Prefill = { specialty: SpecialtyId | ''; doctorId: string; nonce: number }

type BookingCtx = {
  prefill: Prefill
  doctorFilter: SpecialtyId | 'all'
  setDoctorFilter: (f: SpecialtyId | 'all') => void
  openSpecialty: SpecialtyId | null
  setOpenSpecialty: (id: SpecialtyId | null) => void
  openDoctor: string | null
  setOpenDoctor: (id: string | null) => void
  /** prefill the appointment form and travel to it */
  book: (specialty?: SpecialtyId, doctorId?: string) => void
  /** filter the specialists list and travel to it */
  showDoctors: (specialty: SpecialtyId | 'all') => void
}

const Ctx = createContext<BookingCtx | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefill] = useState<Prefill>({ specialty: '', doctorId: '', nonce: 0 })
  const [doctorFilter, setDoctorFilter] = useState<SpecialtyId | 'all'>('all')
  const [openSpecialty, setOpenSpecialty] = useState<SpecialtyId | null>(null)
  const [openDoctor, setOpenDoctor] = useState<string | null>(null)

  const book = useCallback((specialty?: SpecialtyId, doctorId?: string) => {
    if (specialty) setPrefill((p) => ({ specialty, doctorId: doctorId ?? '', nonce: p.nonce + 1 }))
    setOpenSpecialty(null)
    setOpenDoctor(null)
    scrollToSection('appointment', 0.4)
  }, [])

  const showDoctors = useCallback((specialty: SpecialtyId | 'all') => {
    setDoctorFilter(specialty)
    setOpenSpecialty(null)
    scrollToSection('doctors')
  }, [])

  const value = useMemo(
    () => ({ prefill, doctorFilter, setDoctorFilter, openSpecialty, setOpenSpecialty, openDoctor, setOpenDoctor, book, showDoctors }),
    [prefill, doctorFilter, openSpecialty, openDoctor, book, showDoctors],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useBooking() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useBooking must be used inside <BookingProvider>')
  return c
}
