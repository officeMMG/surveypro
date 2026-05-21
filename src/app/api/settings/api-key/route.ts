import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { encryptApiKey, maskApiKey } from "@/lib/crypto"
import { z } from "zod"

const schema = z.object({
  apiKey: z.string().startsWith("sk-ant-"),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { apiKey } = schema.parse(body)

    const encryptedKey = await encryptApiKey(apiKey)
    const keyHint = maskApiKey(apiKey)

    await db.userApiKey.upsert({
      where: { userId_provider: { userId: session.user.id, provider: "anthropic" } },
      create: {
        userId: session.user.id,
        provider: "anthropic",
        encryptedKey,
        keyHint,
        isActive: true,
      },
      update: {
        encryptedKey,
        keyHint,
        isActive: true,
        lastTestedAt: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "有効なAPIキーを入力してください" }, { status: 400 })
    }
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}
