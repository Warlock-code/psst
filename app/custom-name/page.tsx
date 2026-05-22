"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function CustomNamePage() {
  const router = useRouter()
  const { profile } = useUserProfile()

  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function buyName() {
    setError("")

    if (profile?.customNameBought) {
      setError("You’ve already changed your Ghost Name once.")
      return
    }

    const cleanName = name.trim()

    if (cleanName.length < 3) {
      setError("Name must be at least 3 characters.")
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanName)) {
      setError("Use only letters, numbers, and underscores.")
      return
    }

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
      amount: 2000,
      currency: "GHS",
      ref: `psst_name_${user.uid}_${Date.now()}`,

      callback: (response: any) => {
        setLoading(true)

        fetch("/api/paystack/verify-custom-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: response.reference,
            uid: user.uid,
            newName: cleanName,
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Verification failed")
            router.push("/lair")
          })
          .catch(() => setError("Payment made but name change failed."))
          .finally(() => setLoading(false))
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

        <h1 className="mt-8 text-4xl font-black">Custom Ghost Name</h1>

        <p className="mt-3 text-white/60">
          Rename your ghost once. This becomes your public anonymous identity.
        </p>

        {profile?.customNameBought && (
          <p className="mt-6 rounded-2xl bg-yellow-300/10 p-4 text-sm text-yellow-100">
            You’ve already changed your Ghost Name once.
          </p>
        )}

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={18}
          placeholder="e.g. ShadowKing_21"
          className="mt-8 w-full rounded-2xl border border-white/10 bg-white/10 p-4 outline-none"
        />

        <p className="mt-2 text-xs text-white/40">
          3–18 characters. Letters, numbers and underscores only.
        </p>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <button
          onClick={buyName}
          disabled={loading || !name.trim() || profile?.customNameBought}
          className="mt-4 w-full rounded-2xl bg-white p-4 font-black text-black disabled:opacity-50"
        >
          {loading ? "Changing..." : "Buy Name — GH₵20"}
        </button>
      </section>
    </main>
  )
}