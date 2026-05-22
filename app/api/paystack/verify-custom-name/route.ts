import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"

export async function POST(req: Request) {
  try {
    const { reference, uid, newName } = await req.json()

    if (!reference || !uid || !newName) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    if (newName.length < 3 || newName.length > 18) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 })
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
      type: "customName",
      newName,
      reference,
      amount: data.data.amount,
      currency: data.data.currency,
      status: data.data.status,
      paidAt: new Date(),
    })

    await adminDb.collection("users").doc(uid).update({
      ghostId: newName,
      customNameBought: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}