"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { auth } from "@/lib/firebase/client"

declare global {
  interface Window {
    PaystackPop?: any
  }
}

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

export default function FreezePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function buyFreeze() {
    setError("")

    const user = auth.currentUser

    if (!user || !user.email) {
      router.push("/login")
      return
    }

    await loadPaystackScript()

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: 400,
      currency: "GHS",
      ref: `psst_freeze_${user.uid}_${Date.now()}`,

      callback: (response: any) => {
        setLoading(true)

        fetch("/api/paystack/verify-freeze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: response.reference,
            uid: user.uid,
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error()
            router.push("/lair")
          })
          .catch(() => setError("Freeze activation failed."))
          .finally(() => setLoading(false))
      },

      onClose: () => setError("Payment cancelled."),
    })

    handler.openIframe()
  }

  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <Link href="/lair" className="text-sm text-white/60">
          ← Back
        </Link>

        <h1 className="mt-8 text-4xl font-black">
          Streak Freeze 🔥
        </h1>

        <p className="mt-3 text-white/60">
          Protect your streak for 3 missed days.
        </p>

        {error && (
          <p className="mt-5 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          onClick={buyFreeze}
          disabled={loading}
          className="mt-8 w-full rounded-2xl bg-white p-4 font-black text-black disabled:opacity-50"
        >
          {loading ? "Activating..." : "Buy Freeze — GH₵4"}
        </button>
      </section>
    </main>
  )
}