import admin from "firebase-admin"
import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"

export async function POST(req: Request) {
  try {
    const { uid, postId } = await req.json()

    if (!uid || !postId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    const userRef = adminDb.collection("users").doc(uid)
    const userSnap = await userRef.get()

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userSnap.data()
    const freeBoosts = userData?.freeBoosts || 0

    if (freeBoosts <= 0) {
      return NextResponse.json({ error: "No free boosts" }, { status: 400 })
    }

    const now = new Date()
    const boostedUntil = new Date(now)
    boostedUntil.setHours(boostedUntil.getHours() + 24)

    const postRef = adminDb.collection("posts").doc(postId)
const postSnap = await postRef.get()

if (!postSnap.exists) {
  return NextResponse.json({ error: "Post not found" }, { status: 404 })
}

const postData = postSnap.data()

const currentBoost = postData?.boostedUntil

const currentBoostDate = currentBoost?.toDate
  ? currentBoost.toDate()
  : currentBoost
    ? new Date(currentBoost)
    : null

if (currentBoostDate && currentBoostDate > new Date()) {
  return NextResponse.json(
    { error: "Post already boosted" },
    { status: 400 }
  )
}

    await userRef.update({
      freeBoosts: admin.firestore.FieldValue.increment(-1),
    })

    await adminDb.collection("posts").doc(postId).update({
      boosted: true,
      boostedBy: uid,
      boostedAt: now,
      boostedUntil,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}