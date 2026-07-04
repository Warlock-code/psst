"use client"

import Link from "next/link"
import Script from "next/script"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { arrayUnion, doc, runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { useUserProfile } from "@/lib/firebase/use-user-profile"

const cosmetics = [
  {
    id: "skull",
    emoji: "💀",
    name: "Skull Ghost",
    cashAmount: 500,
    coinCost: 100,
  },
  {
    id: "zombie",
    emoji: "🧟",
    name: "Zombie Ghost",
    cashAmount: 500,
    coinCost: 100,
  },
  {
    id: "gold",
    emoji: "👑",
    name: "Gold Ghost",
    cashAmount: 1000,
    coinCost: 200,
  },
]

const coinRewards = [
  {
    id: "free-boost",
    emoji: "🚀",
    name: "1 Free Boost",
    coinCost: 50,
  },
]

export default function ShopPage() {
  const router = useRouter()
  const { user, profile, loading } = useUserProfile()
  const [workingId, setWorkingId] = useState<string | null>(null)

  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
  const ownedCosmetics = profile?.ownedCosmetics || []
  const ghostCoins = profile?.ghostCoins || 0

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.push("/")
    }
  }, [user, profile, loading, router])

  async function buyCosmeticWithCoins(item: (typeof cosmetics)[number]) {
    if (!user) return

    setWorkingId(`coins-${item.id}`)

    try {
      const userRef = doc(db, "users", user.uid)

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef)

        if (!userSnap.exists()) {
          throw new Error("Profile not found")
        }

        const data = userSnap.data()
        const currentCoins = data.ghostCoins || 0
        const currentOwned = data.ownedCosmetics || []

        if (currentOwned.includes(item.id)) {
          throw new Error("Already owned")
        }

        if (currentCoins < item.coinCost) {
          throw new Error("Not enough coins")
        }

        transaction.update(userRef, {
          ghostCoins: currentCoins - item.coinCost,
          ownedCosmetics: arrayUnion(item.id),
        })
      })

      alert(`${item.name} unlocked with Ghost Coins 👻`)
    } catch (error: any) {
      alert(error.message || "Could not unlock item.")
    } finally {
      setWorkingId(null)
    }
  }

  async function buyFreeBoostWithCoins(item: (typeof coinRewards)[number]) {
    if (!user) return

    setWorkingId(`coins-${item.id}`)

    try {
      const userRef = doc(db, "users", user.uid)

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef)

        if (!userSnap.exists()) {
          throw new Error("Profile not found")
        }

        const data = userSnap.data()
        const currentCoins = data.ghostCoins || 0
        const currentFreeBoosts = data.freeBoosts || 0

        if (currentCoins < item.coinCost) {
          throw new Error("Not enough coins")
        }

        transaction.update(userRef, {
          ghostCoins: currentCoins - item.coinCost,
          freeBoosts: currentFreeBoosts + 1,
        })
      })

      alert("Free Boost added 🚀")
    } catch (error: any) {
      alert(error.message || "Could not unlock reward.")
    } finally {
      setWorkingId(null)
    }
  }

  async function buyCosmeticWithCash(item: (typeof cosmetics)[number]) {
    if (!user) return

    if (!paystackKey) {
      alert("Missing Paystack public key.")
      return
    }

    const PaystackPop = (window as any).PaystackPop

    if (!PaystackPop) {
      alert("Paystack is still loading. Try again.")
      return
    }

    setWorkingId(`cash-${item.id}`)

    const handler = PaystackPop.setup({
      key: paystackKey,
      email: user.email || "user@psst.app",
      amount: item.cashAmount,
      currency: "GHS",
      metadata: {
        uid: user.uid,
        userId: user.uid,
        cosmeticId: item.id,
      },
      callback: async (response: any) => {
        try {
          const res = await fetch("/api/paystack/verify-cosmetic", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference: response.reference,
              uid: user.uid,
              userId: user.uid,
              cosmeticId: item.id,
            }),
          })

          if (!res.ok) {
            throw new Error("Payment verification failed")
          }

          alert(`${item.name} unlocked 👻`)
        } catch (error: any) {
          alert(error.message || "Could not verify payment.")
        } finally {
          setWorkingId(null)
        }
      },
      onClose: () => {
        setWorkingId(null)
      },
    })

    handler.openIframe()
  }

  if (loading || !profile) {
    return <main className="min-h-screen p-6 text-white">Loading...</main>
  }

  return (
    <>
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
      />

      <main className="min-h-screen px-5 pb-24 pt-6 text-white">
        <section className="mx-auto max-w-md">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">Ghost Shop 👻</h1>
              <p className="text-sm text-white/50">
                Unlock cosmetics and rewards
              </p>
            </div>

            <Link
              href="/lair"
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black"
            >
              Lair
            </Link>
          </header>

          <div className="mt-6 rounded-[2rem] border border-yellow-300/20 bg-yellow-300/10 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-200/70">
              Your balance
            </p>

            <p className="mt-2 text-4xl font-black">{ghostCoins} 🪙</p>

            <p className="mt-2 text-sm text-white/50">
              Earn 1 coin when you post and 1 coin when someone Yeahs your post.
            </p>
          </div>

          <h2 className="mt-8 text-xl font-black">Ghost Faces</h2>

          <div className="mt-4 space-y-4">
            {cosmetics.map((item) => {
              const owned = ownedCosmetics.includes(item.id)
              const notEnoughCoins = ghostCoins < item.coinCost

              return (
                <div
                  key={item.id}
                  className="rounded-[2rem] border border-white/10 bg-white/10 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-black/30 text-4xl">
                        {item.emoji}
                      </div>

                      <div>
                        <h3 className="text-lg font-black">{item.name}</h3>
                        <p className="text-sm text-white/50">
                          {owned ? "Already unlocked" : "Unlock this ghost face"}
                        </p>
                      </div>
                    </div>

                    {owned && (
                      <span className="rounded-full bg-green-400 px-3 py-1 text-xs font-black text-black">
                        OWNED
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => buyCosmeticWithCoins(item)}
                      disabled={
                        owned ||
                        notEnoughCoins ||
                        workingId === `coins-${item.id}`
                      }
                      className="rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-black text-black disabled:opacity-40"
                    >
                      {workingId === `coins-${item.id}`
                        ? "Unlocking..."
                        : `${item.coinCost} coins`}
                    </button>

                    <button
                      onClick={() => buyCosmeticWithCash(item)}
                      disabled={owned || workingId === `cash-${item.id}`}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-40"
                    >
                      {workingId === `cash-${item.id}`
                        ? "Loading..."
                        : `GH₵${item.cashAmount / 100}`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <h2 className="mt-8 text-xl font-black">Coin Rewards</h2>

          <div className="mt-4 space-y-4">
            {coinRewards.map((item) => {
              const notEnoughCoins = ghostCoins < item.coinCost

              return (
                <div
                  key={item.id}
                  className="rounded-[2rem] border border-white/10 bg-white/10 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-black/30 text-4xl">
                      {item.emoji}
                    </div>

                    <div>
                      <h3 className="text-lg font-black">{item.name}</h3>
                      <p className="text-sm text-white/50">
                        Use it to boost any post.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => buyFreeBoostWithCoins(item)}
                    disabled={notEnoughCoins || workingId === `coins-${item.id}`}
                    className="mt-5 w-full rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-black text-black disabled:opacity-40"
                  >
                    {workingId === `coins-${item.id}`
                      ? "Unlocking..."
                      : `${item.coinCost} coins`}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="mt-6 rounded-2xl bg-white/5 p-4 text-xs leading-5 text-white/40">
            Ghost Coins are only for in-app rewards. They cannot be withdrawn,
            sold, transferred, or converted to cash.
          </p>
        </section>
      </main>
    </>
  )
}