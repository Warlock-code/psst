import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"

export async function POST(req: Request) {
  try {
    const { reference, uid, plan } = await req.json()

    if (!reference || !uid || !plan) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    if (plan !== "monthly" && plan !== "yearly") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
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
    const expiresAt = new Date(now)

    if (plan === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1)
    if (plan === "yearly") expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    await adminDb.collection("payments").add({
      uid,
      type: "prime",
      plan,
      reference,
      amount: data.data.amount,
      currency: data.data.currency,
      status: data.data.status,
      paidAt: now,
      expiresAt,
    })

    await adminDb.collection("users").doc(uid).update({
      isPrime: true,
      primePlan: plan,
      primeStartedAt: now,
      primeExpiresAt: expiresAt,
      primeReference: reference,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}