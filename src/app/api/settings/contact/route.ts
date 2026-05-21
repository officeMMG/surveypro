import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  type: z.enum(["API_KEY_CHANGE", "ACCOUNT_ISSUE", "OTHER"]),
  message: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    await db.contactRequest.create({
      data: {
        userId: session.user.id,
        type: data.type,
        message: data.message,
        status: "PENDING",
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "送信に失敗しました" }, { status: 500 })
  }
}
