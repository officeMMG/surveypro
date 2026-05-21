import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import type { LevelingRow } from "@/types"

export async function GET(req: NextRequest, { params }: { params: { routeId: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const route = await db.levelingRoute.findUnique({
    where: { id: params.routeId },
    include: {
      project: { select: { gradeLevel: true } },
      readings: { orderBy: { sequence: "asc" } },
      result: true,
    },
  })

  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const readings: LevelingRow[] = route.readings.map((r) => ({
    id: r.id,
    sequence: r.sequence,
    stationName: r.stationName,
    bs: r.bs?.toString() ?? "",
    fs: r.fs?.toString() ?? "",
    is_: r.is_?.toString() ?? "",
    ih: r.ih?.toString() ?? "",
    gh: r.gh?.toString() ?? "",
    rise: r.rise?.toString() ?? "",
    fall: r.fall?.toString() ?? "",
    distance: r.distance?.toString() ?? "",
    note: r.note ?? "",
    isKnown: r.isKnown,
    knownElevation: r.knownElevation?.toString() ?? "",
  }))

  return NextResponse.json({ route, readings, result: route.result })
}

const putSchema = z.object({
  routeInfo: z.object({
    name: z.string(),
    surveyDate: z.string().optional(),
    weather: z.string().optional(),
    instrument: z.string().optional(),
    observer: z.string().optional(),
    recorder: z.string().optional(),
  }),
  rows: z.array(z.any()),
  result: z.any().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { routeId: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { routeInfo, rows, result } = putSchema.parse(body)

    await db.levelingRoute.update({
      where: { id: params.routeId },
      data: {
        name: routeInfo.name,
        surveyDate: routeInfo.surveyDate ? new Date(routeInfo.surveyDate) : null,
        weather: routeInfo.weather,
        instrument: routeInfo.instrument,
        observer: routeInfo.observer,
        recorder: routeInfo.recorder,
      },
    })

    // 既存の読み取りデータを削除して再作成
    await db.levelingReading.deleteMany({ where: { routeId: params.routeId } })
    await db.levelingReading.createMany({
      data: rows.map((r: LevelingRow, i: number) => ({
        routeId: params.routeId,
        sequence: i,
        stationName: r.stationName || `No.${i + 1}`,
        bs: r.bs ? parseFloat(r.bs) : null,
        fs: r.fs ? parseFloat(r.fs) : null,
        is_: r.is_ ? parseFloat(r.is_) : null,
        ih: r.ih ? parseFloat(r.ih) : null,
        gh: r.gh ? parseFloat(r.gh) : null,
        rise: r.rise ? parseFloat(r.rise) : null,
        fall: r.fall ? parseFloat(r.fall) : null,
        distance: r.distance ? parseFloat(r.distance) : null,
        note: r.note,
        isKnown: r.isKnown,
        knownElevation: r.knownElevation ? parseFloat(r.knownElevation) : null,
      })),
    })

    // 計算結果を更新
    if (result) {
      await db.levelingResult.upsert({
        where: { routeId: params.routeId },
        create: {
          routeId: params.routeId,
          totalBs: result.totalBs,
          totalFs: result.totalFs,
          closureError: result.closureError,
          totalDistance: result.totalDistance,
          allowableError: result.allowableError,
          isPassed: result.isPassed,
        },
        update: {
          totalBs: result.totalBs,
          totalFs: result.totalFs,
          closureError: result.closureError,
          totalDistance: result.totalDistance,
          allowableError: result.allowableError,
          isPassed: result.isPassed,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}
