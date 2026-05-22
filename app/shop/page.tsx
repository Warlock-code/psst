"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/client"

declare global {
  interface Window {
    PaystackPop?: any
  }
}

const cosmetics = [
  { id: "skull", emoji: "💀", name: "Skull Ghost", amount: 500 },
  { id: "zombie", emoji: "🧟", name: "Zombie Ghost", amount: 500 },
  { id: "gold", emoji: "👑", name: "Gold Ghost", amount: 1000 },
]

function loadPaystackScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.PaystackPop) return resolve()

    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject()

    document.body.appendChild(script)
  })
}

export default function ShopPage() {
  const router = useRouter()
  const [loading, setLoading] = useState("")
  const [error, setError] = useState("")

  async function buyCosmetic(item: (typeof cosmetics)[number]) {
    setError("")

    const user = auth.currentUser
    if (!user || !user.email) {
      router.push("/login")
      return
    }

    try {
      await loadPaystackScript()
    } catch {
      setError("Paystack failed to load.")
      return
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: item.amount,
      currency: "GHS",
      ref: `psst_cosmetic_${item.id}_${user.uid}_${Date.now()}`,

      callback: (response: any) => {
        setLoading(item.id)

        fetch("/api/paystack/verify-cosmetic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: response.reference,
            uid: user.uid,
            cosmeticId: item.id,
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Verification failed")
            router.push("/lair")
          })
          .catch(() => {
            setError("Payment made but unlock failed. Contact support.")
          })
          .finally(() => {
            setLoading("")
          })
      },

      onClose: () => setError("Payment cancelled."),
    })

    handler.openIframe()
  }

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/lair" className="text-sm text-white/60">
          ← Back to Lair
        </Link>

        <h1 className="mt-8 text-4xl font-black">Cosmetic Shop ✨</h1>

        <p className="mt-3 text-white/60">
          Limited ghost cosmetics and premium avatar drops.
        </p>

        {error && <p className="mt-5 text-sm text-red-300">{error}</p>}

        <div className="mt-8 space-y-4">
          {cosmetics.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-white/10 bg-white/10 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-5xl">{item.emoji}</p>
                  <h2 className="mt-3 text-2xl font-black">{item.name}</h2>
                  <p className="mt-1 text-white/50">
                    GH₵{item.amount / 100}
                  </p>
                </div>

                <button
                  onClick={() => buyCosmetic(item)}
                  disabled={loading === item.id}
                  className="rounded-2xl bg-white px-5 py-3 font-black text-black disabled:opacity-50"
                >
                  {loading === item.id ? "Unlocking..." : "Buy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}