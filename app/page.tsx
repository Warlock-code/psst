"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase/client"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
  router.push("/feed")
}
    })

    return () => unsub()
  }, [router])

  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-between">
        <div>
          <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80">
            Anonymous campus gist 👻
          </div>

          <h1 className="text-6xl font-black tracking-tight">
            Psst<span className="text-purple-300">.</span>
          </h1>

          <p className="mt-5 text-lg leading-7 text-white/70">
            Your campus whisper network. Post confessions, memes, polls and climb the ghost leaderboard.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/privacy"
            className="block rounded-2xl bg-white px-5 py-4 text-center font-bold text-black"
          >
            Enter as Ghost
          </Link>

          <Link
            href="/login"
            className="block rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center font-bold"
          >
            I already have an account
          </Link>

          <p className="text-center text-xs text-white/45">
            School email verifies you. Your ghost identity stays separate.
          </p>
        </div>
      </section>
    </main>
  )
}