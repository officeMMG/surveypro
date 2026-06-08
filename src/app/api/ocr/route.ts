import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadFileToDify, runOcr } from "@/lib/dify"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const imageFile = formData.get("image") as File | null

    if (!imageFile) {
      return NextResponse.json({ error: "画像ファイルが必要です" }, { status: 400 })
    }

    const fileId = await uploadFileToDify(imageFile, session.user.id)
    const { rows, warnings } = await runOcr(fileId, session.user.id)

    if (rows.length === 0) {
      return NextResponse.json({ error: "野帳データが見つかりませんでした" }, { status: 422 })
    }

    return NextResponse.json({ rows, warnings })
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR処理に失敗しました"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
