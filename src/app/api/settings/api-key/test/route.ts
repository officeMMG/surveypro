import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { decryptApiKey } from "@/lib/crypto"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const userApiKey = await db.userApiKey.findUnique({
      where: { userId_provider: { userId: session.user.id, provider: "anthropic" } },
    })

    if (!userApiKey) {
      return NextResponse.json({ ok: false, error: "APIキーが設定されていません" })
    }

    const apiKey = await decryptApiKey(userApiKey.encryptedKey)
    const client = new Anthropic({ apiKey })

    // 最小限のリクエストで疎通確認
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 5,
      messages: [{ role: "user", content: "OK?" }],
    })

    await db.userApiKey.update({
      where: { userId_provider: { userId: session.user.id, provider: "anthropic" } },
      data: { lastTestedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "接続テストに失敗しました"
    return NextResponse.json({ ok: false, error: message })
  }
}
