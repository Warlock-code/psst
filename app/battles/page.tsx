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
  promptId: string
  campus: string
  ghostId: string
  avatarEmoji?: string
  isPrime?: boolean
  uid: string
  votes: number
}

type BattlePrompt = {
  text: string
  campus: string
  active: boolean
  startsAt?: any
  endsAt?: any
}

function getPromptId(campus: string) {
  if (campus === "GCTU") return "gctu_current"
  return "gctu_current"
}

function getBattleEndDate(value: any) {
  if (!value) return ""

  const date = value.toDate ? value.toDate() : new Date(value)

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function battleHasEnded(value: any) {
  if (!value) return false

  const date = value.toDate ? value.toDate() : new Date(value)

  return date < new Date()
}

export default function BattlesPage() {
  const router = useRouter()

  const [entry, setEntry] = useState("")
  const [entries, setEntries] = useState<BattleEntry[]>([])
  const [campus, setCampus] = useState("")
  const [battlePrompt, setBattlePrompt] = useState<BattlePrompt | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [voting, setVoting] = useState<string | null>(null)

  useEffect(() => {
    const user = auth.currentUser

    if (!user) {
      router.push("/login")
      return
    }

    async function loadBattle(currentUser: any) {
      const profileSnap = await getDoc(doc(db, "users", currentUser.uid))
      if (!profileSnap.exists()) return

      const profile = profileSnap.data()
      const userCampus = profile.campus
      const promptId = getPromptId(userCampus)

      setCampus(userCampus)

      const promptSnap = await getDoc(doc(db, "battlePrompts", promptId))

      if (promptSnap.exists()) {
        setBattlePrompt(promptSnap.data() as BattlePrompt)
      }

      const q = query(
        collection(db, "battleEntries"),
        where("campus", "==", userCampus),
        where("promptId", "==", promptId)
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

    loadBattle(user).then((res) => {
      unsub = res
    })

    return () => {
      if (unsub) unsub()
    }
  }, [router])

  async function enterBattle() {
    if (!entry.trim()) return

    if (!battlePrompt) {
      setError("Battle prompt not loaded yet.")
      return
    }

    if (battleHasEnded(battlePrompt.endsAt)) {
      setError("This battle has ended.")
      return
    }

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
      const promptId = getPromptId(profile.campus)

      await addDoc(collection(db, "battleEntries"), {
        text: entry.trim(),
        prompt: battlePrompt.text,
        promptId,
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
    if (battleHasEnded(battlePrompt?.endsAt)) {
      setError("This battle already ended.")
      return
    }

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
        createdAt: serverTimestamp(),
      })

      await updateDoc(doc(db, "battleEntries", entryId), {
        votes: increment(votePower),
      })
    } finally {
      setVoting(null)
    }
  }

  const battleEnded = battleHasEnded(battlePrompt?.endsAt)

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
          <p className="text-sm font-bold text-purple-200">
            This week’s prompt
          </p>

          <h2 className="mt-3 text-2xl font-black">
            {battlePrompt?.text || "Loading prompt..."}
          </h2>

          {battlePrompt?.endsAt && (
            <p className="mt-2 text-sm text-white/50">
              Ends {getBattleEndDate(battlePrompt.endsAt)}
            </p>
          )}

          <p className="mt-2 text-sm text-white/50">
            Winner gets campus clout + future cosmetic unlocks.
          </p>

          {battleEnded && (
            <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
              This battle has ended. Entries and votes are locked.
            </div>
          )}

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
            disabled={loading || !entry.trim() || battleEnded || !battlePrompt}
            className="mt-4 w-full rounded-2xl bg-white p-4 font-bold text-black disabled:opacity-50"
          >
            {battleEnded
              ? "Battle Ended"
              : loading
                ? "Entering..."
                : "Enter Battle"}
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
                    disabled={voting === item.id || battleEnded}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                  >
                    {battleEnded
                      ? "Locked"
                      : voting === item.id
                        ? "Voting..."
                        : "Vote ⚔️"}
                  </button>
                </div>
              </div>
            )
          })}
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