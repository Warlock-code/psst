"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { auth } from "@/lib/firebase/client"
import { useUserProfile } from "@/lib/firebase/use-user-profile"

declare global {
  interface Window {
    PaystackPop?: any
  }
}

function loadPaystackScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.PaystackPop) return resolve()

    const existingScript = document.querySelector(
      'script[src="https://js.paystack.co/v1/inline.js"]'
    )

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve())
      existingScript.addEventListener("error", () => reject())
      return
    }

    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject()

    document.body.appendChild(script)
  })
}

export default function BoostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const { profile } = useUserProfile()

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function useFreeBoost() {
    setError("")
    setLoading(true)

    try {
      const user = auth.currentUser

      if (!user) {
        router.push("/login")
        return
      }

      const res = await fetch("/api/use-free-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          postId,
        }),
      })

      if (!res.ok) throw new Error("Free boost failed")

      router.push("/feed")
    } catch {
      setError("Free boost failed.")
    } finally {
      setLoading(false)
    }
  }

  async function payForBoost() {
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

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

    if (!publicKey) {
      setError("Paystack public key missing.")
      return
    }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: user.email,
      amount: 200,
      currency: "GHS",
      ref: `psst_boost_${postId}_${user.uid}_${Date.now()}`,

      callback: (response: any) => {
        setLoading(true)

        fetch("/api/paystack/verify-boost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: response.reference,
            uid: user.uid,
            postId,
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Verification failed")
            router.push("/feed")
          })
          .catch(() => setError("Payment made but boost failed."))
          .finally(() => setLoading(false))
      },

      onClose: () => setError("Payment cancelled."),
    })

    handler.openIframe()
  }

  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/feed" className="text-sm text-white/60">
          ← Back to feed
        </Link>

        <h1 className="mt-8 text-4xl font-black">Boost Post 🚀</h1>

        <p className="mt-3 text-white/60">
          Push this post higher in the feed for 24 hours.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5">
          <p className="text-sm text-white/50">Your free boosts</p>
          <p className="mt-1 text-3xl font-black">{profile?.freeBoosts || 0}</p>
        </div>

        {error && <p className="mt-5 text-sm text-red-300">{error}</p>}

        {(profile?.freeBoosts || 0) > 0 && (
          <button
            onClick={useFreeBoost}
            disabled={loading}
            className="mt-8 w-full rounded-2xl bg-yellow-300 p-4 font-black text-black disabled:opacity-50"
          >
            {loading ? "Boosting..." : "Use Free Boost"}
          </button>
        )}

        <button
          onClick={payForBoost}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-white p-4 font-black text-black disabled:opacity-50"
        >
          {loading ? "Boosting..." : "Boost for GH₵2"}
        </button>
      </section>
    </main>
  )
}