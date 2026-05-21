import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({ name: z.string().min(1) })

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { name } = schema.parse(await req.json())
    await db.user.update({ where: { id: session.user.id }, data: { name } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 })
  }
}
