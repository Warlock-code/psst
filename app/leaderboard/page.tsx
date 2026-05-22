"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { useUserProfile } from "@/lib/firebase/use-user-profile"

type Post = {
  id: string
  ghostId: string
  campus: string
  yeahs: number
}

type GhostScore = {
  ghostId: string
  yeahs: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { user, profile, loading } = useUserProfile()
  const [scores, setScores] = useState<GhostScore[]>([])

  useEffect(() => {
    if (loading) return

    if (!user || !profile) {
      router.push("/")
      return
    }

    const q = query(
      collection(db, "posts"),
      where("campus", "==", profile.campus),
      orderBy("yeahs", "desc"),
      limit(50)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const totals: Record<string, number> = {}

      snapshot.docs.forEach((doc) => {
        const post = { id: doc.id, ...doc.data() } as Post
        totals[post.ghostId] = (totals[post.ghostId] || 0) + (post.yeahs || 0)
      })

      const ranked = Object.entries(totals)
        .map(([ghostId, yeahs]) => ({ ghostId, yeahs }))
        .sort((a, b) => b.yeahs - a.yeahs)
        .slice(0, 10)

      setScores(ranked)
    })

    return () => unsub()
  }, [user, profile, loading, router])

  if (loading) {
    return <main className="min-h-screen px-5 py-8 text-white">Loading...</main>
  }

  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/feed" className="text-sm text-white/60">
          ← Back to feed
        </Link>

        <h1 className="mt-8 text-4xl font-black">Leaderboard 👑</h1>
        <p className="mt-2 text-white/60">{profile?.campus}</p>

        <div className="mt-8 space-y-3">
          {scores.length === 0 && (
            <p className="rounded-2xl bg-white/10 p-4 text-white/60">
              No rankings yet. Yeahs decide the top ghosts.
            </p>
          )}

          {scores.map((score, index) => (
            <div
              key={score.ghostId}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4"
            >
              <div>
                <p className="font-black">
                  #{index + 1} {score.ghostId}
                </p>
                <p className="text-sm text-white/50">Campus ghost</p>
              </div>

              <p className="font-black">🔥 {score.yeahs}</p>
            </div>
          ))}
        </div>
      </section>
      <nav className="fixed bottom-4 left-1/2 flex w-[92%] max-w-md -translate-x-1/2 items-center justify-between rounded-3xl border border-white/10 bg-black/80 p-2 backdrop-blur">
  <Link
    href="/feed"
    className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70"
  >
    Feed
  </Link>

  <Link
    href="/leaderboard"
    className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70"
  >
    Board
  </Link>

  <Link
    href="/create"
    className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70"
  >
    Post
  </Link>

  <Link
    href="/battles"
    className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black"
  >
    Battle
  </Link>

  <Link
    href="/lair"
    className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70"
  >
    Lair
  </Link>
</nav>
    </main>
  )
}