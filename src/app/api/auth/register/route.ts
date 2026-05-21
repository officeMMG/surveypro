import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = schema.parse(body)

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const autoDeleteAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)

    await db.user.create({
      data: { name, email, password: hashed },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 })
    }
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
