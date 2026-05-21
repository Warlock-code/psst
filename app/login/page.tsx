"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/client"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setError("")

    try {
      const res = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      

      router.push("/feed")
    } catch {
      setError("Invalid login details.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 text-white">
      <section className="mx-auto max-w-md">
        <h1 className="text-4xl font-black">Welcome back 👻</h1>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="School email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 p-4 outline-none"
          />

          {error && (
            <p className="text-sm text-red-300">{error}</p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-white p-4 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Entering..." : "Enter Psst"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          New ghost?{" "}
          <Link href="/privacy" className="font-bold text-white">
            Create account
          </Link>
        </p>
      </section>
    </main>
  )
}