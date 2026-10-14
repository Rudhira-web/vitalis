import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { DOCTORS, SPECIALTIES, specialtyById, type Doctor } from '../data/content'
import { useBooking } from '../lib/booking'
import { Modal } from '../components/Modal'

/** Illustrated look per doctor: skin, hair colour, long hair, glasses, coat trim */
const LOOKS: Record<string, { skin: string; hair: string; long?: boolean; glasses?: boolean; turban?: string }> = {
  d1: { skin: '#c68a5e', hair: '#1c1412', long: true },
  d2: { skin: '#a8714a', hair: '#15110f', glasses: true },
  d3: { skin: '#b97d53', hair: '#1a1210', long: true },
  d4: { skin: '#d09a6e', hair: '#241915' },
  d5: { skin: '#c9946a', hair: '#2a1b14', long: true, glasses: true },
  d6: { skin: '#b57a50', hair: '#15110f', turban: '#2d4a7a' },
  d7: { skin: '#a56b45', hair: '#120d0b', long: true },
  d8: { skin: '#c08c62', hair: '#1f1713', glasses: true },
  d9: { skin: '#d4a077', hair: '#2b1c15', long: true },
  d10: { skin: '#9a6340', hair: '#110c0a' },
  d11: { skin: '#c28a5f', hair: '#1c1310', long: true, glasses: true },
  d12: { skin: '#b9835a', hair: '#221814' },
}

function Portrait({ d, large = false }: { d: Doctor; large?: boolean }) {
  const accent = specialtyById(d.specialty).accent
  const l = LOOKS[d.id] ?? LOOKS.d1
  const [noPhoto, setNoPhoto] = useState(false)
  return (
    <div
      className={`relative overflow-hidden rounded-[1.25rem] ${large ? 'aspect-[4/5] w-40 shrink-0' : 'aspect-[6/5] w-full'}`}
      style={{ background: `radial-gradient(120% 90% at 30% 10%, #ffffff 0%, #e8edf0 45%, ${accent}55 100%)` }}
      role="img"
      aria-label={`Illustrated portrait of ${d.name}`}
    >
      {!noPhoto && (
        <img src={`/doctors/${d.id}.png`} alt="" onError={() => setNoPhoto(true)} className="absolute inset-0 z-10 size-full object-cover object-top" />
      )}
      <svg viewBox="0 0 100 125" className="absolute bottom-0 left-1/2 h-[96%] -translate-x-1/2" aria-hidden>
        {l.long && <path d="M30 50c-4 22-2 38 6 46h28c8-8 10-24 6-46z" fill={l.hair} />}
        <path d="M8 125c2-26 16-36 42-36s40 10 42 36z" fill="#fbfdfe" />
        <path d="M38 89l12 16 12-16" fill="none" stroke={accent} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M50 105v20" stroke="#cfd8de" strokeWidth="1" />
        <rect x="43" y="68" width="14" height="22" rx="6" fill={l.skin} />
        <ellipse cx="50" cy="52" rx="17" ry="20" fill={l.skin} />
        {l.turban ? (
          <path d="M31 50c-2-20 8-30 19-30s21 10 19 30c-4-10-10-14-19-14s-15 4-19 14z" fill={l.turban} />
        ) : (
          <path d="M32 52c-3-22 8-31 19-31 12 0 21 9 18 31-2-9-6-15-12-17-7 4-17 4-25 0-2 3-0 10 0 17z" fill={l.hair} />
        )}
        <circle cx="43" cy="53" r="1.6" fill="#1a1210" />
        <circle cx="57" cy="53" r="1.6" fill="#1a1210" />
        <path d="M44 63q6 5 12 0" fill="none" stroke="#7a3f32" strokeWidth="1.5" strokeLinecap="round" />
        {l.glasses && (
          <g fill="none" stroke="#1a1210" strokeWidth="1.1">
            <circle cx="43" cy="53" r="4.6" />
            <circle cx="57" cy="53" r="4.6" />
            <path d="M47.6 53h4.8" />
          </g>
        )}
      </svg>
    </div>
  )
}

export function Doctors() {
  const { doctorFilter, setDoctorFilter, book, setOpenDoctor } = useBooking()
  const [query, setQuery] = useState('')
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return DOCTORS.filter((d) => (doctorFilter === 'all' || d.specialty === doctorFilter) && (!q || `${d.name} ${d.focus} ${d.role}`.toLowerCase().includes(q)))
  }, [doctorFilter, query])

  const chips: { id: (typeof SPECIALTIES)[number]['id'] | 'all'; label: string }[] = [{ id: 'all', label: 'All specialties' }, ...SPECIALTIES.map((s) => ({ id: s.id, label: s.short }))]

  return (
    <section id="doctors" aria-labelledby="doctors-title" className="relative bg-linen text-ink">
      <div className="mx-auto max-w-[1600px] px-5 pb-28 pt-32 sm:px-8 lg:px-12 lg:pb-36 lg:pt-40">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <h2 id="doctors-title" className="display-md">
            Meet the specialists.
            <span className="answer block">People first, then the expertise.</span>
          </h2>
          <p className="lede text-slate lg:justify-self-end">
            Find a consultant by specialty or name, then book directly with them. All profiles here are fictional samples: names, roles and schedules are placeholders.
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter by specialty" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
            {chips.map((c) => (
              <button
                key={c.id}
                aria-pressed={doctorFilter === c.id}
                onClick={() => setDoctorFilter(c.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
                  doctorFilter === c.id ? 'border-ink bg-ink text-ice' : 'border-ink/15 hover:border-ink/40'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <label className="relative block lg:w-80">
            <span className="sr-only">Search by name or focus</span>
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or focus"
              className="h-11 w-full rounded-full border border-ink/15 bg-white/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-slate/70 focus:border-ink/50"
            />
          </label>
        </div>
        <p className="mt-5 text-sm text-slate" aria-live="polite">
          Showing {list.length} {list.length === 1 ? 'specialist' : 'specialists'}
        </p>

        <motion.ul layout className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {list.map((d) => (
              <motion.li
                key={d.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col"
              >
                <Portrait d={d} />
                <div className="mt-4 flex items-center gap-2 text-xs text-slate">
                  <span className="size-1.5 rounded-full" style={{ background: specialtyById(d.specialty).accent }} aria-hidden />
                  {specialtyById(d.specialty).short}
                  <span className="ml-auto rounded-full border border-ink/15 px-2 py-0.5">Sample profile</span>
                </div>
                <h3 className="mt-2 text-xl font-normal tracking-tight">{d.name}</h3>
                <p className="mt-0.5 text-sm text-slate">{d.focus}</p>
                <div className="mt-4 flex gap-2">
                  <button className="btn btn-ink !h-10 !px-4 !text-[0.85rem]" onClick={() => book(d.specialty, d.id)}>
                    Book appointment
                  </button>
                  <button className="btn btn-ink-ghost !h-10 !px-4 !text-[0.85rem]" onClick={() => setOpenDoctor(d.id)} aria-label={`View profile of ${d.name}`}>
                    Profile
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {list.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-ink/20 p-10 text-center">
            <p>No specialists match “{query}”.</p>
            <button
              className="mt-4 text-sm underline underline-offset-4"
              onClick={() => {
                setQuery('')
                setDoctorFilter('all')
              }}
            >
              Clear search and filters
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export function DoctorDialog() {
  const { openDoctor, setOpenDoctor, book } = useBooking()
  const d = DOCTORS.find((x) => x.id === openDoctor)
  return (
    <Modal open={!!d} onClose={() => setOpenDoctor(null)} label={d ? `Profile of ${d.name}` : 'Doctor profile'} tone="light">
      {d && (
        <div>
          <div className="flex flex-col gap-6 sm:flex-row">
            <Portrait d={d} large />
            <div className="pr-8">
              <span className="rounded-full border border-ink/15 px-2 py-0.5 text-xs text-slate">Sample profile</span>
              <h2 className="display-sm mt-4">{d.name}</h2>
              <p className="mt-2 text-slate">{d.role}</p>
              <p className="answer mt-3 text-2xl">{d.focus}</p>
            </div>
          </div>
          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            {[
              ['Specialty', specialtyById(d.specialty).name],
              ['Clinic days (sample)', d.days.join(', ')],
              ['Qualifications', '[Qualifications placeholder]'],
              ['Languages', '[Languages placeholder]'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-ink/10 p-4">
                <dt className="text-slate">{k}</dt>
                <dd className="mt-1">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs text-slate">This is a fictional profile for demonstration. It does not describe a real clinician.</p>
          <button className="btn btn-ink mt-7" onClick={() => book(d.specialty, d.id)}>
            Book appointment with {d.name}
          </button>
        </div>
      )}
    </Modal>
  )
}
