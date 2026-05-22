import admin from "firebase-admin"
import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"

const allowedCosmetics = ["skull", "zombie", "gold"]

export async function POST(req: Request) {
  try {
    const { reference, uid, cosmeticId } = await req.json()

    if (!reference || !uid || !cosmeticId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    if (!allowedCosmetics.includes(cosmeticId)) {
      return NextResponse.json({ error: "Invalid cosmetic" }, { status: 400 })
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

    await adminDb.collection("payments").add({
      uid,
      type: "cosmetic",
      cosmeticId,
      reference,
      amount: data.data.amount,
      currency: data.data.currency,
      status: data.data.status,
      paidAt: new Date(),
    })

    await adminDb.collection("users").doc(uid).update({
      ownedCosmetics: admin.firestore.FieldValue.arrayUnion(cosmeticId),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}