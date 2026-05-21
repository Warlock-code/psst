"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { reload, sendEmailVerification } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/client"

export default function VerifyEmailPage() {
  const router = useRouter()
  const [message, setMessage] = useState("")

  async function resendEmail() {
  const user = auth.currentUser

  if (!user) {
    router.push("/")
    return
  }

  try {
    await sendEmailVerification(user)
    setMessage("Verification email sent again. Check inbox/spam.")
  } catch {
    setMessage("Too many requests. Wait a few minutes before resending.")
  }
}

  async function checkVerification() {
    const user = auth.currentUser

    if (!user) {
      router.push("/")
      return
    }

    await reload(user)

    if (user.emailVerified) {
      await updateDoc(doc(db, "users", user.uid), {
        emailVerified: true,
      })

      router.push("/feed")
      return
    }

    setMessage("Still not verified. Open the email link first.")
  }

  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-between">
        <div>
          <div className="text-6xl">📩</div>

          <h1 className="mt-6 text-4xl font-black">
            Verify your school email
          </h1>

          <p className="mt-5 leading-7 text-white/70">
            Open the verification email, tap the link, then come back here.
          </p>

          {message && (
            <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-white/70">
              {message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={checkVerification}
            className="w-full rounded-2xl bg-white px-5 py-4 font-bold text-black"
          >
            I’ve verified
          </button>

          <button
            onClick={resendEmail}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold"
          >
            Resend email
          </button>
        </div>
      </section>
    </main>
  )
}