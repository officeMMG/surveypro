import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { runLevelingCalc } from "@/lib/dify"
import { z } from "zod"
import type { LevelingRow } from "@/types"
import type { GradeLevel } from "@prisma/client"

const schema = z.object({
  rows: z.array(z.any()),
  grade: z.enum(["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4"]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { rows, grade } = schema.parse(body)

    const result = await runLevelingCalc(rows as LevelingRow[], grade as GradeLevel, session.user.id)

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "計算に失敗しました"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
