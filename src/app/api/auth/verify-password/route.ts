import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { email, password } = schema.parse(body)

    if (email !== session.user.email) {
      return NextResponse.json({ error: "メールアドレスが一致しません" }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user?.password) {
      return NextResponse.json({ error: "パスワード認証が設定されていません" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 500 })
  }
}
