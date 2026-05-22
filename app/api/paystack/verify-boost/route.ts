import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"

export async function POST(req: Request) {
  try {
    const { reference, uid, postId } = await req.json()

    if (!reference || !uid || !postId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const data = await res.json()

    if (!data.status || data.data?.status !== "success") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 })
    }

    const now = new Date()
    const boostedUntil = new Date(now)
    boostedUntil.setHours(boostedUntil.getHours() + 24)

    await adminDb.collection("payments").add({
      uid,
      type: "boost",
      postId,
      reference,
      amount: data.data.amount,
      currency: data.data.currency,
      status: data.data.status,
      paidAt: now,
      boostedUntil,
    })

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