import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, Check, LoaderCircle } from 'lucide-react'
import { CONTACT, DOCTORS, SPECIALTIES, specialtyById, type SpecialtyId } from '../data/content'
import { useBooking } from '../lib/booking'
import { scrollToY } from '../lib/scroll'

type Values = { name: string; phone: string; specialty: SpecialtyId | ''; doctor: string; date: string }
type Errors = Partial<Record<keyof Values, string>>

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dayOffset = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}

export function validate(v: Values): Errors {
  const e: Errors = {}
  const name = v.name.trim()
  if (!name) e.name = 'Enter the patient’s full name.'
  else if (name.length < 2 || !/^[\p{L}][\p{L}\s.'-]*$/u.test(name)) e.name = 'Use letters, spaces, apostrophes or hyphens only.'
  const digits = v.phone.replace(/\D/g, '')
  if (!v.phone.trim()) e.phone = 'Enter a contact number.'
  else if (!/^\+?[\d\s()-]+$/.test(v.phone.trim()) || digits.length < 7 || digits.length > 15) e.phone = 'Enter a phone number with 7 to 15 digits.'
  if (!v.specialty) e.specialty = 'Choose a specialty.'
  if (!v.date) e.date = 'Choose a preferred date.'
  else if (v.date < dayOffset(1)) e.date = 'Choose a date from tomorrow onwards.'
  else if (v.date > dayOffset(180)) e.date = 'Choose a date within the next six months.'
  return e
}

const LABELS: Record<keyof Values, string> = { name: 'Patient name', phone: 'Contact number', specialty: 'Preferred specialty', doctor: 'Preferred doctor', date: 'Preferred date' }

export function Appointment() {
  const { prefill } = useBooking()
  const [v, setV] = useState<Values>({ name: '', phone: '', specialty: '', doctor: '', date: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const summary = useRef<HTMLDivElement>(null)
  const doneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!prefill.nonce) return
    setV((x) => ({ ...x, specialty: prefill.specialty, doctor: prefill.doctorId }))
    setStatus('idle')
  }, [prefill])

  const doctors = useMemo(() => DOCTORS.filter((d) => d.specialty === v.specialty), [v.specialty])

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    const next = { ...v, [k]: val }
    if (k === 'specialty') next.doctor = ''
    setV(next)
    if (touched[k] || errors[k]) setErrors((e) => ({ ...e, [k]: validate(next)[k] }))
  }
  const blur = (k: keyof Values) => {
    setTouched((t) => ({ ...t, [k]: true }))
    setErrors((e) => ({ ...e, [k]: validate(v)[k] }))
  }

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate(v)
    setErrors(e)
    setTouched({ name: true, phone: true, specialty: true, date: true })
    if (Object.keys(e).length) {
      requestAnimationFrame(() => {
        const el = summary.current
        if (!el) return
        el.focus({ preventScroll: true })
        scrollToY(el.getBoundingClientRect().top + window.scrollY - 120)
      })
      return
    }
    setStatus('sending')
    // demo only: nothing leaves the browser
    window.setTimeout(() => {
      setStatus('done')
      requestAnimationFrame(() => doneRef.current?.focus())
    }, 900)
  }

  const errorList = Object.entries(errors).filter(([, m]) => m) as [keyof Values, string][]
  const field = (k: keyof Values) => ({
    id: `f-${k}`,
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `e-${k}` : undefined,
    onBlur: () => blur(k),
  })
  const Err = ({ k }: { k: keyof Values }) =>
    errors[k] ? (
      <p id={`e-${k}`} className="mt-1.5 flex items-center gap-1.5 text-[0.82rem] text-[#ffa3a3]">
        <CircleAlert size={14} aria-hidden /> {errors[k]}
      </p>
    ) : null

  const doc = DOCTORS.find((d) => d.id === v.doctor)

  return (
    <section id="appointment" aria-labelledby="appt-title" className="relative min-h-[140vh]">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 pb-32 pt-[22vh] sm:px-8 lg:grid-cols-[1fr_minmax(0,36rem)] lg:gap-20 lg:px-12">
        <div className="lg:pt-6">
          <h2 id="appt-title" className="display-md">
            Request an appointment.
            <span className="answer block">We’ll help you find the right care.</span>
          </h2>
          <p className="lede mt-6 text-ice/70">Tell us who the visit is for, which specialty you need and when suits you. A care coordinator would normally call to confirm.</p>
          <div className="mt-8 inline-flex items-start gap-3 rounded-2xl border border-mint/30 bg-mint/[0.06] p-4 text-sm text-ice/85">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-mint" aria-hidden />
            <p>
              <strong className="font-medium">Demo booking flow.</strong> Requests made here are not sent anywhere and no appointment is booked.
            </p>
          </div>
        </div>

        <div className="glass rounded-[1.75rem] p-6 sm:p-9">
          <AnimatePresence mode="wait" initial={false}>
            {status !== 'done' ? (
              <motion.form key="form" noValidate onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                {errorList.length > 0 && (
                  <div ref={summary} tabIndex={-1} role="alert" className="rounded-xl border border-[#ff8a8a]/40 bg-[#ff8a8a]/10 p-4 text-sm">
                    <p className="font-medium">Check {errorList.length === 1 ? 'one field' : `${errorList.length} fields`} before sending:</p>
                    <ul className="mt-2 space-y-1">
                      {errorList.map(([k, m]) => (
                        <li key={k}>
                          <a href={`#f-${k}`} className="underline underline-offset-4" onClick={(e) => (e.preventDefault(), document.getElementById(`f-${k}`)?.focus())}>
                            {LABELS[k]}: {m}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <label htmlFor="f-name" className="mb-2 block text-sm text-ice/75">
                    {LABELS.name}
                  </label>
                  <input {...field('name')} className="field" autoComplete="name" value={v.name} onChange={(e) => set('name', e.target.value)} />
                  <Err k="name" />
                </div>
                <div>
                  <label htmlFor="f-phone" className="mb-2 block text-sm text-ice/75">
                    {LABELS.phone}
                  </label>
                  <input {...field('phone')} className="field" type="tel" inputMode="tel" autoComplete="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} />
                  <Err k="phone" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="f-specialty" className="mb-2 block text-sm text-ice/75">
                      {LABELS.specialty}
                    </label>
                    <select {...field('specialty')} className="field" value={v.specialty} onChange={(e) => set('specialty', e.target.value as SpecialtyId)}>
                      <option value="">Select a specialty</option>
                      {SPECIALTIES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <Err k="specialty" />
                  </div>
                  <div>
                    <label htmlFor="f-doctor" className="mb-2 block text-sm text-ice/75">
                      {LABELS.doctor} <span className="text-ice/45">(optional)</span>
                    </label>
                    <select id="f-doctor" className="field disabled:opacity-50" value={v.doctor} disabled={!v.specialty} onChange={(e) => set('doctor', e.target.value)}>
                      <option value="">{v.specialty ? 'Any available specialist' : 'Choose a specialty first'}</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} (sample)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="f-date" className="mb-2 block text-sm text-ice/75">
                    {LABELS.date}
                  </label>
                  <input {...field('date')} className="field" type="date" min={dayOffset(1)} max={dayOffset(180)} value={v.date} onChange={(e) => set('date', e.target.value)} />
                  <Err k="date" />
                </div>
                <button type="submit" disabled={status === 'sending'} className="btn btn-primary w-full justify-center disabled:opacity-70">
                  {status === 'sending' ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" /> Preparing demo request
                    </>
                  ) : (
                    'Submit request (demo)'
                  )}
                </button>
                <p className="text-center text-xs text-ice/45">Nothing you type here is stored or transmitted.</p>
              </motion.form>
            ) : (
              <motion.div key="done" ref={doneRef} tabIndex={-1} role="status" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="outline-none">
                <span className="grid size-12 place-items-center rounded-full bg-mint/15 text-mint">
                  <Check size={22} aria-hidden />
                </span>
                <h3 className="display-sm mt-6">Demo request ready.</h3>
                <p className="mt-3 text-ice/70">This is what VITALIS would receive. Because this is a demonstration, no appointment has been booked.</p>
                <dl className="mt-6 divide-y divide-ice/10 rounded-2xl border border-ice/10 text-sm">
                  {[
                    ['Patient', v.name.trim()],
                    ['Contact', v.phone.trim()],
                    ['Specialty', v.specialty ? specialtyById(v.specialty).name : ''],
                    ['Doctor', doc ? `${doc.name} (sample profile)` : 'Any available specialist'],
                    ['Preferred date', new Date(v.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
                  ].map(([k, val]) => (
                    <div key={k} className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-ice/55">{k}</dt>
                      <dd className="text-right">{val}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 text-sm text-ice/60">To book a real appointment, contact the hospital directly: {CONTACT.enquiries}.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="btn btn-ghost" onClick={() => setStatus('idle')}>
                    Edit details
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setV({ name: '', phone: '', specialty: '', doctor: '', date: '' })
                      setErrors({})
                      setTouched({})
                      setStatus('idle')
                    }}
                  >
                    Start a new request
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
