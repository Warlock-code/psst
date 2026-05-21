"use client"

import Link from "next/link"
import Script from "next/script"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/client"
import { useUserProfile } from "@/lib/firebase/use-user-profile"

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: any) => {
        openIframe: () => void
      }
    }
  }
}

export default function PrimePage() {
  const router = useRouter()
  const { profile } = useUserProfile()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function upgradePrime(plan: "monthly" | "yearly") {
    setError("")

    const user = auth.currentUser

    if (!user || !user.email) {
      router.push("/login")
      return
    }

    if (!window.PaystackPop) {
      setError("Payment system is still loading. Try again.")
      return
    }

    const amount = plan === "monthly" ? 800 * 100 : 8000 * 100

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount,
      currency: "GHS",
      ref: `psst_prime_${plan}_${user.uid}_${Date.now()}`,

      callback: async (response: any) => {
        setLoading(true)
        setError("")

        try {
          const verifyRes = await fetch("/api/paystack/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference: response.reference,
              uid: user.uid,
              plan,
            }),
          })

          if (!verifyRes.ok) {
            throw new Error("Payment verification failed.")
          }

          router.push("/lair")
        } catch {
          setError("Payment was made but verification failed. Contact support.")
        } finally {
          setLoading(false)
        }
      },

      onClose: () => {
        setError("Payment cancelled.")
      },
    })

    handler.openIframe()
  }

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      <main className="min-h-screen px-5 pb-28 pt-8 text-white">
        <section className="mx-auto max-w-md">
          <Link href="/lair" className="text-sm text-white/60">
            ← Back to Lair
          </Link>

          <div className="mt-8 rounded-[2rem] border border-yellow-300/20 bg-yellow-300/10 p-6">
            <p className="text-5xl">👑</p>

            <h1 className="mt-4 text-4xl font-black">Psst Prime</h1>

            <p className="mt-3 text-white/70">
              Unlock premium avatars, cosmetics, boosts and future Prime features.
            </p>

            <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
              Payments are live. You’ll be charged real money.
            </p>

            {profile?.isPrime && (
              <p className="mt-4 rounded-2xl bg-green-400/10 p-4 text-sm text-green-200">
                You already have Prime active.
              </p>
            )}

            <div className="mt-6 space-y-3 text-sm text-white/80">
              <p>✅ Premium avatars</p>
              <p>✅ Prime badge</p>
              <p>✅ Future cosmetics</p>
              <p>✅ Weekly boost later</p>
            </div>

            {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

            <div className="mt-8 space-y-3">
              <button
                onClick={() => upgradePrime("monthly")}
                disabled={loading || profile?.isPrime}
                className="w-full rounded-2xl bg-white p-4 font-black text-black disabled:opacity-50"
              >
                {loading ? "Upgrading..." : "Monthly — GH₵8"}
              </button>

              <button
                onClick={() => upgradePrime("yearly")}
                disabled={loading || profile?.isPrime}
                className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 font-black text-white disabled:opacity-50"
              >
                Yearly — GH₵80
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}