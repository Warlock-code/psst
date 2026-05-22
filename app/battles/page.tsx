"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase/client"

type BattleEntry = {
  id: string
  text: string
  prompt: string
  campus: string
  ghostId: string
  avatarEmoji?: string
  isPrime?: boolean
  promptId: string
  uid: string
  votes: number
}

export default function BattlesPage() {
  const router = useRouter()

  const [entry, setEntry] = useState("")
  const [entries, setEntries] = useState<BattleEntry[]>([])
  const [campus, setCampus] = useState("")
  const [battlePrompt, setBattlePrompt] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [voting, setVoting] = useState<string | null>(null)

  useEffect(() => {
    const user = auth.currentUser

    if (!user) {
      router.push("/login")
      return
    }

    async function loadEntries(currentUser: any) {
      const profileSnap = await getDoc(doc(db, "users", currentUser.uid))
      if (!profileSnap.exists()) return

      const profile = profileSnap.data()
      setCampus(profile.campus)
      const promptId =
  profile.campus === "GCTU"
    ? "gctu_current"
    : "gctu_current"

const promptSnap = await getDoc(
  doc(db, "battlePrompts", promptId)
)

if (promptSnap.exists()) {
  setBattlePrompt(promptSnap.data())
}

      const q = query(
  collection(db, "battleEntries"),
  where("campus", "==", profile.campus)
)

      return onSnapshot(q, (snapshot) => {
        const loadedEntries = snapshot.docs.map((item) => ({
  id: item.id,
  ...item.data(),
})) as BattleEntry[]

setEntries(
  loadedEntries.sort((a, b) => (b.votes || 0) - (a.votes || 0))
)
      })
    }

    let unsub: undefined | (() => void)

    loadEntries(user).then((res) => {
      unsub = res
    })

    return () => {
      if (unsub) unsub()
    }
  }, [router])

  async function enterBattle() {
    if (!entry.trim()) return

    setLoading(true)
    setError("")

    try {
      const user = auth.currentUser

      if (!user) {
        router.push("/login")
        return
      }

      const profileSnap = await getDoc(doc(db, "users", user.uid))

      if (!profileSnap.exists()) {
        setError("Ghost profile not found.")
        return
      }

      const profile = profileSnap.data()

      await addDoc(collection(db, "battleEntries"), {
        text: entry.trim(),
        prompt: battlePrompt?.text || "",
promptId:
  profile.campus === "GCTU"
    ? "gctu_current"
    : "gctu_current",
        campus: profile.campus,
        ghostId: profile.ghostId,
        avatarEmoji: profile.avatarEmoji || "👻",
        isPrime: profile.isPrime || false,
        uid: user.uid,
        votes: 0,
        createdAt: serverTimestamp(),
      })

      setEntry("")
    } catch {
      setError("Battle entry failed.")
    } finally {
      setLoading(false)
    }
  }

  async function voteBattle(entryId: string) {
    setVoting(entryId)
    setError("")

    try {
      const user = auth.currentUser
      if (!user) {
        router.push("/login")
        return
      }

      const entrySnap = await getDoc(doc(db, "battleEntries", entryId))
      if (!entrySnap.exists()) return

      const entryData = entrySnap.data()

      if (entryData.uid === user.uid) {
        setError("You can’t vote your own battle entry.")
        return
      }

      const voteRef = doc(db, "battleEntries", entryId, "votesBy", user.uid)
      const voteSnap = await getDoc(voteRef)

      if (voteSnap.exists()) {
        setError("You already voted on this entry.")
        return
      }

      const profileSnap = await getDoc(doc(db, "users", user.uid))
      if (!profileSnap.exists()) return

      const profile = profileSnap.data()
      const votePower = profile.isPrime ? 2 : 1

      await setDoc(voteRef, {
        uid: user.uid,
        votePower,
        createdAt: new Date(),
      })

      await updateDoc(doc(db, "battleEntries", entryId), {
        votes: increment(votePower),
      })
    } finally {
      setVoting(null)
    }
  }

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/feed" className="text-sm text-white/60">
          ← Back to feed
        </Link>

        <h1 className="mt-8 text-4xl font-black">Ghost Battles ⚔️</h1>

        <p className="mt-3 text-white/60">
          Weekly campus battles. Enter anonymously and let ghosts vote.
        </p>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/10 p-6">
          <p className="text-sm font-bold text-purple-200">This week’s prompt</p>

          <h2 className="mt-3 text-2xl font-black">
  {battlePrompt?.text || "Loading prompt..."}
</h2>
          <p className="mt-2 text-sm text-white/50">
  Winner gets campus clout + future cosmetic unlocks.
</p>

          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            maxLength={220}
            placeholder="Drop your battle entry..."
            className="mt-5 min-h-32 w-full rounded-2xl bg-black/20 p-4 outline-none"
          />

          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

          <button
            onClick={enterBattle}
            disabled={loading || !entry.trim()}
            className="mt-4 w-full rounded-2xl bg-white p-4 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Entering..." : "Enter Battle"}
          </button>
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="text-2xl font-black">
            Entries {campus && `— ${campus}`}
          </h2>

          {entries.length === 0 && (
            <p className="rounded-2xl bg-white/10 p-4 text-white/60">
              No battle entries yet.
            </p>
          )}

          {entries.map((item) => {
            const isWinner = entries[0]?.id === item.id

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 ${
                  item.votes >= 10 || isWinner
                    ? "border-yellow-300/30 bg-yellow-300/10"
                    : "border-white/10 bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.avatarEmoji || "👻"}</span>

                  <p className="font-bold text-purple-200">
                    {item.ghostId}

                    {isWinner && (
                      <span className="ml-2 text-yellow-300">👑</span>
                    )}

                    {item.isPrime && (
                      <span className="ml-2 rounded-full bg-yellow-300 px-2 py-1 text-[10px] font-black text-black">
                        PRIME
                      </span>
                    )}
                  </p>
                </div>

                <p className="mt-3">{item.text}</p>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-white/50">
                    ⚔️ {item.votes || 0} votes
                  </p>

                  <button
                    onClick={() => voteBattle(item.id)}
                    disabled={voting === item.id}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                  >
                    {voting === item.id ? "Voting..." : "Vote ⚔️"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
      <nav className="fixed bottom-4 left-1/2 flex w-[92%] max-w-md -translate-x-1/2 items-center justify-between rounded-3xl border border-white/10 bg-black/80 p-2 backdrop-blur">
  <Link href="/feed" className="rounded-2xl px-3 py-3 text-xs font-bold text-white/70">
    Feed
  </Link>

  <Link href="/leaderboard" className="rounded-2xl px-3 py-3 text-xs font-bold text-white/70">
    Board
  </Link>

  <Link href="/create" className="rounded-2xl px-3 py-3 text-xs font-bold text-white/70">
    Post
  </Link>

  <Link href="/battles" className="rounded-2xl bg-white px-3 py-3 text-xs font-bold text-black">
    Battle
  </Link>

  <Link href="/lair" className="rounded-2xl px-3 py-3 text-xs font-bold text-white/70">
    Lair
  </Link>
</nav>
    </main>
  )
}