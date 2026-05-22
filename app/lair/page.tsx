"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/client"
import { useUserProfile } from "@/lib/firebase/use-user-profile"

function formatPrimeExpiry(value: any) {
  if (!value) return ""

  const date = value.toDate ? value.toDate() : new Date(value)

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function LairPage() {
  const router = useRouter()
  const { profile, loading } = useUserProfile()

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/")
    }
  }, [loading, profile, router])

  async function handleLogout() {
    await signOut(auth)
    router.push("/")
  }

  async function changeAvatar(emoji: string, locked: boolean) {
    if (!profile || locked) return

    await updateDoc(doc(db, "users", profile.uid), {
      avatarEmoji: emoji,
    })
  }

  if (loading) {
    return <main className="min-h-screen px-5 py-8 text-white">Loading...</main>
  }

  if (!profile) return null

  const ownedCosmetics = profile.ownedCosmetics || []

  const avatars = [
    { emoji: "👻", name: "Classic", locked: false },
    { emoji: "😈", name: "Devil", locked: !profile.isPrime },
    { emoji: "🦉", name: "Owl", locked: !profile.isPrime },
    { emoji: "💀", name: "Skull", locked: !ownedCosmetics.includes("skull") },
    { emoji: "🧟", name: "Zombie", locked: !ownedCosmetics.includes("zombie") },
    { emoji: "👑", name: "Gold", locked: !ownedCosmetics.includes("gold") },
  ]

  return (
    <main className="min-h-screen px-5 pb-32 pt-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/feed" className="text-sm text-white/60">
          ← Back to feed
        </Link>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6">
          <div className="text-7xl">{profile.avatarEmoji || "👻"}</div>

          <div className="mt-5 grid grid-cols-6 gap-2">
            {avatars.map((avatar) => (
              <button
                key={avatar.name}
                onClick={() => changeAvatar(avatar.emoji, avatar.locked)}
                className={`rounded-2xl p-3 text-2xl ${
                  avatar.locked ? "bg-black/30 opacity-60" : "bg-black/20"
                }`}
                title={avatar.name}
              >
                {avatar.locked ? "🔒" : avatar.emoji}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-white/40">
            Premium avatars unlock through Prime, battles, or cosmetics.
          </p>

          <h1 className="mt-5 text-3xl font-black">{profile.ghostId}</h1>
          <p className="mt-2 text-white/60">{profile.campus}</p>

          {profile.isPrime && (
            <p className="mt-3 inline-block rounded-full bg-yellow-300 px-4 py-2 text-sm font-bold text-black">
              👑 Prime Ghost
            </p>
          )}

          {profile.isPrime && profile.primeExpiresAt && (
            <p className="mt-2 text-xs text-white/40">
              Prime expires {formatPrimeExpiry(profile.primeExpiresAt)}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-white/40">Streak</p>
              <p className="mt-1 text-2xl font-black">
                {profile.streakCount || 0} 🔥
              </p>
              <p className="mt-1 text-xs text-white/40">Post daily to grow it</p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-white/40">Storage</p>
              <p className="mt-1 text-2xl font-black">
                {profile.storageUsed || 0}MB / {profile.storageLimit || 50}MB
              </p>

              <Link
                href="/storage"
                className="mt-3 block rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-bold text-white"
              >
                Upgrade storage
              </Link>
            </div>
          </div>

          <Link
            href="/prime"
            className="mt-6 block w-full rounded-2xl bg-yellow-300 p-4 text-center font-bold text-black"
          >
            Upgrade to Prime 👑
          </Link>

          <Link
            href="/shop"
            className="mt-4 block w-full rounded-2xl bg-white/10 p-4 text-center font-black text-white"
          >
            Cosmetic Shop ✨
          </Link>
<div className="mt-4 grid grid-cols-2 gap-3">
  <Link
    href="/privacy-policy"
    className="rounded-2xl bg-white/10 p-4 text-center text-sm font-bold text-white"
  >
    Privacy
  </Link>

  <Link
    href="/terms"
    className="rounded-2xl bg-white/10 p-4 text-center text-sm font-bold text-white"
  >
    Terms
  </Link>
</div>
          <button
            onClick={handleLogout}
            className="mb-24 mt-4 w-full rounded-2xl bg-red-400/90 p-4 font-bold text-black"
          >
            Logout
          </button>
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

        <Link href="/battles" className="rounded-2xl px-3 py-3 text-xs font-bold text-white/70">
          Battle
        </Link>

        <Link href="/lair" className="rounded-2xl bg-white px-3 py-3 text-xs font-bold text-black">
          Lair
        </Link>
      </nav>
    </main>
  )
}