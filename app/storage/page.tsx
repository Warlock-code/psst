"use client"

import Link from "next/link"
import Script from "next/script"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/client"

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: any) => {
        openIframe: () => void
      }
    }
  }
}

export default function StoragePage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function buyStorage(amountMb: 10 | 150, pricePesewas: number) {
    setError("")

    const user = auth.currentUser
    if (!user || !user.email) {
      router.push("/login")
      return
    }

    if (!window.PaystackPop) {
      setError("Payment system is loading. Try again.")
      return
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: pricePesewas,
      currency: "GHS",
      ref: `psst_storage_${amountMb}_${user.uid}_${Date.now()}`,

      callback: async (response: any) => {
        setLoading(true)

        try {
          const verifyRes = await fetch("/api/paystack/verify-storage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: response.reference,
              uid: user.uid,
              amountMb,
            }),
          })

          if (!verifyRes.ok) throw new Error("Verification failed")

          router.push("/lair")
        } catch {
          setError("Payment made but verification failed. Contact support.")
        } finally {
          setLoading(false)
        }
      },

      onClose: () => setError("Payment cancelled."),
    })

    handler.openIframe()
  }

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      <main className="min-h-screen px-5 py-8 text-white">
        <section className="mx-auto max-w-md">
          <Link href="/lair" className="text-sm text-white/60">
            ← Back to Lair
          </Link>

          <h1 className="mt-8 text-4xl font-black">Storage</h1>
          <p className="mt-3 text-white/60">
            Free ghosts get 50MB. Buy more when full.
          </p>

          {error && <p className="mt-5 text-sm text-red-300">{error}</p>}

          <div className="mt-8 space-y-3">
            <button
              disabled={loading}
              onClick={() => buyStorage(10, 100 * 100)}
              className="w-full rounded-2xl bg-white p-4 font-bold text-black disabled:opacity-50"
            >
              Buy 10MB — GH₵1
            </button>

            <button
              disabled={loading}
              onClick={() => buyStorage(150, 1000 * 100)}
              className="w-full rounded-2xl bg-white/10 p-4 font-bold text-white disabled:opacity-50"
            >
              Buy 150MB — GH₵10
            </button>
          </div>
        </section>
      </main>
    </>
  )
}