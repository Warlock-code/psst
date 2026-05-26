export const GCTU_PROGRAMS = {
  BSc: [
    "Computer Science",
    "Information Technology",
    "Cyber Security",
    "Software Engineering",
    "Telecommunication Engineering",
    "Business Administration",
    "Accounting",
    "Procurement and Logistics",
    "Banking and Finance",
    "Marketing",
  ],
  Diploma: [
    "Information Technology",
    "Business Administration",
    "Accounting",
    "Procurement and Logistics",
  ],
  MSc: [
    "Information Technology",
    "Cyber Security",
    "Telecommunications Engineering",
    "Business Administration",
  ],
  MPhil: [
    "Information Technology",
    "Telecommunications Engineering",
  ],
} as const

export function makeProgramKey(level: string, program: string) {
  return `${level}_${program}`
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}