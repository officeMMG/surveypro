import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { addDays } from "date-fns"

const schema = z.object({
  name: z.string().min(1),
  client: z.string().optional(),
  routeName: z.string().optional(),
  gradeLevel: z.enum(["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4"]).default("LEVEL_3"),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await db.project.findMany({
    where: {
      deletedAt: null,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { name: true } },
      _count: { select: { levelingRoutes: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)
    const autoDeleteDays = parseInt(process.env.PROJECT_AUTO_DELETE_DAYS ?? "180")

    // 容量チェック
    const maxProjects = parseInt(process.env.MAX_PROJECTS_PER_USER ?? "500")
    const count = await db.project.count({
      where: { ownerId: session.user.id, deletedAt: null },
    })
    if (count >= maxProjects) {
      // 最も古い現場を1件削除
      const oldest = await db.project.findFirst({
        where: { ownerId: session.user.id, deletedAt: null },
        orderBy: { createdAt: "asc" },
      })
      if (oldest) {
        await db.project.update({
          where: { id: oldest.id },
          data: { deletedAt: new Date() },
        })
      }
    }

    const project = await db.project.create({
      data: {
        ...data,
        ownerId: session.user.id,
        autoDeleteAt: addDays(new Date(), autoDeleteDays),
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    })

    return NextResponse.json({ id: project.id })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "入力値エラー" }, { status: 400 })
    }
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 })
  }
}
