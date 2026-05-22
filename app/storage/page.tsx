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

function loadPaystackScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.PaystackPop) {
      resolve()
      return
    }

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

    try {
      await loadPaystackScript()
    } catch {
      setError("Paystack failed to load. Check your internet/ad blocker.")
      return
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

    if (!publicKey) {
      setError("Paystack public key is missing.")
      return
    }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: user.email,
      amount: pricePesewas,
      currency: "GHS",
      ref: `psst_storage_${amountMb}_${user.uid}_${Date.now()}`,

      callback: (response: any) => {
  setLoading(true)

  fetch("/api/paystack/verify-storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: response.reference,
      uid: user.uid,
      amountMb,
    }),
  })
    .then((verifyRes) => {
      if (!verifyRes.ok) throw new Error("Verification failed")
      router.push("/lair")
    })
    .catch(() => {
      setError("Payment made but verification failed. Contact support.")
    })
    .finally(() => {
      setLoading(false)
    })
},

      onClose: () => {
        setError("Payment cancelled.")
      },
    })

    handler.openIframe()
  }

  return (
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
            type="button"
            disabled={loading}
            onClick={() => buyStorage(10, 100)}
            className="w-full rounded-2xl bg-white p-4 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Processing..." : "Buy 10MB — GH₵1"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => buyStorage(150, 1000)}
            className="w-full rounded-2xl bg-white/10 p-4 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Processing..." : "Buy 150MB — GH₵10"}
          </button>
        </div>
      </section>
    </main>
  )
}