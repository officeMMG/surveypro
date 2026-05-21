import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Vercel Cronジョブから呼び出されるエンドポイント
// vercel.json で毎日 AM2:00 JST に実行
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 有効期限切れ現場を削除
    const expired = await db.project.updateMany({
      where: {
        autoDeleteAt: { lte: new Date() },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    })

    console.log(`[auto-delete] ${expired.count} expired projects marked as deleted`)
    return NextResponse.json({ deleted: expired.count, ts: new Date().toISOString() })
  } catch (err) {
    console.error("[auto-delete] failed:", err)
    return NextResponse.json({ error: "Cron failed" }, { status: 500 })
  }
}
