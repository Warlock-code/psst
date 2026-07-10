"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/client"
import { CAMPUS_PROGRAMS, makeProgramKey } from "@/lib/programs"

function makeGhostId() {
  const names = ["SilentOwl", "CampusGhost", "TeaWalker", "ShadowPal", "AnonVibe"]
  const name = names[Math.floor(Math.random() * names.length)]
  const num = Math.floor(10 + Math.random() * 90)

  return `${name}_${num}`
}

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const campus = searchParams.get("campus") || ""
  const programsForCampus = CAMPUS_PROGRAMS[campus] || {}

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [programLevel, setProgramLevel] = useState("")
const [program, setProgram] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setError("")

    const allowedDomains = [
      "st.ug.edu.gh",
      "ug.edu.gh",
      "st.knust.edu.gh",
      "ucc.edu.gh",
      "live.gctu.edu.gh",
      "upsamail.edu.gh",
    ]

    const emailDomain = email.split("@")[1]

    if (!allowedDomains.includes(emailDomain)) {
      setError("Use a valid school email.")
      setLoading(false)
      return
    }
if (!programLevel || !program) {
  setError("Select your level and program.")
  setLoading(false)
  return
}

const programKey = makeProgramKey(programLevel, program)
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      const ghostId = makeGhostId()

      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        email,
        campus,
        program,
programLevel,
programKey,
        ghostId,
        avatarEmoji: "👻",
        avatarTheme: "default",
        ownedCosmetics: [],
        emailVerified: true,
        isPrime: false,
        storageUsed: 0,
        storageLimit: 50,
        streakCount: 0,
        createdAt: serverTimestamp(),
      })

      router.push("/feed")
    } catch {
      setError("Signup failed. Check your email/password and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <h1 className="text-4xl font-black">Become a ghost 👻</h1>
        <p className="mt-3 text-white/60">{campus}</p>

        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 outline-none"
            placeholder="School email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <select
  value={programLevel}
  onChange={(e) => {
    setProgramLevel(e.target.value)
    setProgram("")
  }}
  required
  className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 outline-none"
>
  <option value="" className="text-black">
    Select level
  </option>

  {Object.keys(programsForCampus).map((level) => (
    <option key={level} value={level} className="text-black">
      {level}
    </option>
  ))}
</select>

<select
  value={program}
  onChange={(e) => setProgram(e.target.value)}
  required
  disabled={!programLevel}
  className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 outline-none disabled:opacity-50"
>
  <option value="" className="text-black">
    Select program
  </option>

  {programLevel &&
    (programsForCampus[programLevel] || []).map((item) => (
      <option key={item} value={item} className="text-black">
        {item}
      </option>
    ))}
</select>

          <input
            className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 outline-none"
            placeholder="Password"
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-white p-4 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Creating ghost..." : "Enter Psst"}
          </button>
        </form>
      </section>
    </main>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-5 text-white">Loading...</main>}>
      <SignupContent />
    </Suspense>
  )
}