import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"
import type { LevelingRow } from "@/types"
import { db } from "@/lib/db"
import { decryptApiKey } from "@/lib/crypto"

// APIキーをサーバーサイドで取得（クライアントには絶対に公開しない）
async function getAnthropicClient(userId: string): Promise<Anthropic> {
  // まずユーザーの個別APIキーを確認
  const userApiKey = await db.userApiKey.findUnique({
    where: { userId_provider: { userId, provider: "anthropic" } },
  })

  let apiKey: string

  if (userApiKey?.encryptedKey) {
    apiKey = await decryptApiKey(userApiKey.encryptedKey)
  } else if (process.env.ANTHROPIC_API_KEY) {
    // フォールバック: 環境変数のAPIキーを使用
    apiKey = process.env.ANTHROPIC_API_KEY
  } else {
    throw new Error("APIキーが設定されていません。設定画面でAnthropicのAPIキーを登録してください。")
  }

  return new Anthropic({ apiKey })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const imageFile = formData.get("image") as File | null

    if (!imageFile) {
      return NextResponse.json({ error: "画像ファイルが必要です" }, { status: 400 })
    }

    const bytes = await imageFile.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const mediaType = imageFile.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif"

    const client = await getAnthropicClient(session.user.id)

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `この画像は水準測量の野帳（観測手簿）です。
以下のJSON形式でデータを抽出してください。

各行のデータをJSON配列として返してください：
[
  {
    "sequence": 行番号(0始まり),
    "stationName": "測点番号（BM-1, No.5など）",
    "bs": "後視読定値（単位:m、小数3桁）または空文字",
    "fs": "前視読定値（単位:m、小数3桁）または空文字",
    "is_": "中間視読定値（単位:m、小数3桁）または空文字",
    "ih": "",
    "gh": "",
    "rise": "",
    "fall": "",
    "distance": "測点間距離（単位:m）または空文字",
    "note": "備考または空文字",
    "isKnown": 既知点の場合true,
    "knownElevation": "既知標高（単位:m、小数4桁）または空文字"
  }
]

注意事項:
- 数値は文字列として返してください
- 読み取れない場合は空文字""を返してください
- ih, gh, rise, fallは空文字で返してください（計算は別途行います）
- JSON配列のみを返してください。説明文は不要です`,
            },
          ],
        },
      ],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""

    // JSON部分のみ抽出
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "野帳データの解析に失敗しました" }, { status: 422 })
    }

    const rows: LevelingRow[] = JSON.parse(jsonMatch[0])

    return NextResponse.json({ rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR処理に失敗しました"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
