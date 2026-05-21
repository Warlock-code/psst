"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/client"

type Profile = {
  uid: string
  email: string
  campus: string
  ghostId: string

  avatarEmoji?: string
  avatarTheme?: string
  ownedCosmetics?: string[]
  storageLimit?: number

  isPrime?: boolean
  primePlan?: "monthly" | "yearly"
  primeStartedAt?: any
  primeExpiresAt?: any
  storageUsed?: number

  lastPostDate?: string
  streakCount?: number
}

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (!currentUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      const snap = await getDoc(doc(db, "users", currentUser.uid))

      if (snap.exists()) {
        const data = snap.data() as Profile

        if (data.isPrime && data.primeExpiresAt) {
          const expiry = data.primeExpiresAt.toDate
            ? data.primeExpiresAt.toDate()
            : new Date(data.primeExpiresAt)

          if (expiry < new Date()) {
            data.isPrime = false
          }
        }

        setProfile(data)
      }

      setLoading(false)
    })

    return () => unsub()
  }, [])

  return { user, profile, loading }
}