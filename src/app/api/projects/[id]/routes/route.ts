import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  direction: z.enum(["FORWARD", "BACKWARD", "LOOP", "JUNCTION"]).default("FORWARD"),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const member = project.members.find((m) => m.userId === session.user.id)
  if (!member || member.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const route = await db.levelingRoute.create({
      data: {
        projectId,
        name: data.name,
        direction: data.direction,
      },
    })

    return NextResponse.json({ id: route.id })
  } catch {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params

  const routes = await db.levelingRoute.findMany({
    where: { projectId },
    include: { result: true },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(routes)
}
