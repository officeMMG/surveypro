import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "機器名を入力してください"),
  number: z.string().min(1, "No.を入力してください"),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const instruments = await db.instrument.findMany({
    where: { userId: session.user.id },
    orderBy: [{ name: "asc" }, { number: "asc" }],
  })

  return NextResponse.json(instruments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { name, number } = schema.parse(body)

    const instrument = await db.instrument.create({
      data: { userId: session.user.id, name, number },
    })

    return NextResponse.json(instrument)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "既に同じ機器No.が登録されています" }, { status: 409 })
  }
}
