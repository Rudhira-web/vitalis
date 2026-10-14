export type SpecialtyId = 'cardiology' | 'neurology' | 'oncology' | 'orthopaedics' | 'emergency' | 'robotic'

export type Specialty = {
  id: SpecialtyId
  name: string
  short: string
  line: string
  description: string
  focus: string[]
  /** background tint of the 3D stage */
  stage: string
  /** accent light for the 3D stage + UI dot */
  accent: string
}

export const SPECIALTIES: Specialty[] = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    short: 'Cardiology',
    line: 'For the rhythm that carries everything else.',
    description:
      'Diagnosis, treatment and long-term care for conditions of the heart and blood vessels, from preventive check-ups to interventional procedures and cardiac rehabilitation.',
    focus: ['Preventive cardiology', 'Heart rhythm care', 'Interventional cardiology', 'Heart failure clinic'],
    stage: '#13060c',
    accent: '#ff6f86',
  },
  {
    id: 'neurology',
    name: 'Neurology',
    short: 'Neurology',
    line: 'Understanding the network that makes you, you.',
    description:
      'Care for the brain, spine and nervous system, bringing neurologists, neurosurgeons and rehabilitation teams around the same patient.',
    focus: ['Stroke care', 'Epilepsy', 'Movement disorders', 'Headache and migraine'],
    stage: '#070a1d',
    accent: '#93a9ff',
  },
  {
    id: 'oncology',
    name: 'Oncology',
    short: 'Oncology',
    line: 'Cancer care organised around a person, not a diagnosis.',
    description:
      'Medical, surgical and radiation oncology planned together by one team, with supportive care that continues well beyond treatment.',
    focus: ['Medical oncology', 'Radiation therapy planning', 'Surgical oncology', 'Survivorship and supportive care'],
    stage: '#04131a',
    accent: '#86e3c8',
  },
  {
    id: 'orthopaedics',
    name: 'Orthopaedics',
    short: 'Orthopaedics',
    line: 'Movement, restored with patience and precision.',
    description:
      'Treatment for bones, joints, muscles and the spine, from sports injuries to joint replacement, followed through to rehabilitation.',
    focus: ['Joint replacement', 'Sports injuries', 'Spine care', 'Physiotherapy and rehabilitation'],
    stage: '#0b0f16',
    accent: '#e6eef5',
  },
  {
    id: 'emergency',
    name: 'Emergency and Critical Care',
    short: 'Emergency',
    line: 'The first minutes matter. So does every one after.',
    description:
      'Emergency medicine and intensive care teams working as one pathway, from arrival to stabilisation to recovery. Operating hours and capacity are placeholders until confirmed.',
    focus: ['Emergency department', 'Critical care units', 'Trauma response', 'Transfer coordination'],
    stage: '#150810',
    accent: '#ff9a8a',
  },
  {
    id: 'robotic',
    name: 'Robotic and Minimally Invasive Surgery',
    short: 'Robotic surgery',
    line: 'Smaller incisions, guided by steady hands.',
    description:
      'Surgeons using robotic-assisted and laparoscopic techniques where they suit the patient, with each plan made case by case.',
    focus: ['Robotic-assisted procedures', 'Laparoscopic surgery', 'Day-care surgery', 'Surgical planning'],
    stage: '#041018',
    accent: '#5fe3ff',
  },
]

export const specialtyById = (id: SpecialtyId) => SPECIALTIES.find((s) => s.id === id)!

export type Doctor = {
  id: string
  name: string
  specialty: SpecialtyId
  role: string
  focus: string
  days: string[]
}

/** Fictional sample profiles. No real people, no real credentials. */
export const DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr. Anand Iyer', specialty: 'cardiology', role: 'Consultant, Cardiology', focus: 'Interventional cardiology', days: ['Mon', 'Wed', 'Fri'] },
  { id: 'd2', name: 'Dr. Arjun Rao', specialty: 'cardiology', role: 'Consultant, Cardiology', focus: 'Heart rhythm care', days: ['Tue', 'Thu'] },
  { id: 'd3', name: 'Dr. Karthik Menon', specialty: 'neurology', role: 'Consultant, Neurology', focus: 'Stroke and neurovascular care', days: ['Mon', 'Thu'] },
  { id: 'd4', name: 'Dr. Rohan Mehta', specialty: 'neurology', role: 'Consultant, Neurology', focus: 'Epilepsy and sleep', days: ['Tue', 'Wed', 'Sat'] },
  { id: 'd5', name: 'Dr. Suresh Kulkarni', specialty: 'oncology', role: 'Consultant, Medical Oncology', focus: 'Lung and head and neck cancers', days: ['Mon', 'Tue', 'Fri'] },
  { id: 'd6', name: 'Dr. Vikram Singh', specialty: 'oncology', role: 'Consultant, Radiation Oncology', focus: 'Radiation therapy planning', days: ['Wed', 'Thu'] },
  { id: 'd7', name: 'Dr. Prakash Natarajan', specialty: 'orthopaedics', role: 'Consultant, Orthopaedics', focus: 'Hip and knee replacement', days: ['Mon', 'Wed'] },
  { id: 'd8', name: 'Dr. Imran Qureshi', specialty: 'orthopaedics', role: 'Consultant, Orthopaedics', focus: 'Sports injuries and spine', days: ['Tue', 'Fri', 'Sat'] },
  { id: 'd9', name: 'Dr. Nikhil Gupta', specialty: 'emergency', role: 'Lead, Emergency Medicine', focus: 'Emergency and trauma care', days: ['Rotating shifts'] },
  { id: 'd10', name: 'Dr. Sandeep Reddy', specialty: 'emergency', role: 'Consultant, Critical Care', focus: 'Intensive care medicine', days: ['Rotating shifts'] },
  { id: 'd11', name: 'Dr. Debashish Banerjee', specialty: 'robotic', role: 'Consultant, General Surgery', focus: 'Robotic-assisted abdominal surgery', days: ['Mon', 'Thu'] },
  { id: 'd12', name: 'Dr. Mohan Joshi', specialty: 'robotic', role: 'Consultant, Urology', focus: 'Minimally invasive urology', days: ['Wed', 'Fri'] },
]

export const FACILITIES = [
  { name: 'Emergency and trauma', line: 'A dedicated entrance and resuscitation bays.' },
  { name: 'Critical care units', line: 'Intensive care with continuous monitoring.' },
  { name: 'Imaging and diagnostics', line: 'Scans, labs and reports in one wing.' },
  { name: 'Day-care surgery', line: 'Procedures that let you go home the same day.' },
  { name: 'Inpatient suites', line: 'Quiet rooms with space for family.' },
  { name: 'Rehabilitation', line: 'Physiotherapy and recovery programmes.' },
]

export const TECHNOLOGY = [
  { name: 'Robotic-assisted surgery', line: 'Surgeon-controlled systems for precise, minimally invasive procedures.' },
  { name: 'Advanced imaging', line: 'Cross-sectional imaging that helps teams plan before they treat.' },
  { name: 'Connected monitoring', line: 'Vital signs that follow the patient from ward to ward.' },
  { name: 'Research and clinical trials', line: 'Links with research partners, where trials are appropriate.' },
]

/** Placeholder contact details. Replace before any real use. */
export const CONTACT = {
  emergency: '[Emergency line placeholder]',
  enquiries: '[General enquiries placeholder]',
  email: '[care@placeholder]',
  address: ['[Street address placeholder]', '[City, postcode placeholder]'],
}
