"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/client"

type Profile = {
  uid: string
  email: string
  campus: string
  ghostId: string

  battleChampion?: boolean
battleChampionUntil?: any
freeBoosts?: number
weeklyChampion?: boolean
weeklyChampionUntil?: any


streakFreezeUntil?: any

  avatarEmoji?: string
  avatarTheme?: string
  ownedCosmetics?: string[]

  storageUsed?: number
  streakRestoredAt?: any
  storageLimit?: number

  isPrime?: boolean
  primePlan?: "monthly" | "yearly"
  primeStartedAt?: any
  primeExpiresAt?: any
  customNameBought?: boolean

  lastPostDate?: string
  streakCount?: number
}

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubProfile: (() => void) | undefined

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)

      if (unsubProfile) {
        unsubProfile()
        unsubProfile = undefined
      }

      if (!currentUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      unsubProfile = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
        if (!snap.exists()) {
          setProfile(null)
          setLoading(false)
          return
        }

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
        setLoading(false)
      })
    })

    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  return { user, profile, loading }
}