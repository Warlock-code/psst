import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"

export async function POST(req: Request) {
  try {
    const { reference, uid } = await req.json()

    if (!reference || !uid) {
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

    await adminDb.collection("payments").add({
      uid,
      type: "streakRestore",
      reference,
      amount: data.data.amount,
      currency: data.data.currency,
      status: data.data.status,
      paidAt: now,
    })

    await adminDb.collection("users").doc(uid).update({
      streakCount: 1,
      lastPostDate: now.toDateString(),
      streakRestoredAt: now,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}