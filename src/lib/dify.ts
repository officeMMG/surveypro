import type { LevelingRow } from "@/types"
import type { GradeLevel } from "@prisma/client"

const DIFY_API_URL = process.env.DIFY_API_URL ?? "https://api.dify.ai"

export interface DifyCalcSummary {
  totalBs: number
  totalFs: number
  closureError: number       // m
  closureErrorMm: number     // mm (表示用)
  totalDistanceKm: number    // km
  allowableError: number     // mm
  isPassed: boolean
  problemRows: number[]
}

export interface DifyCalcResult {
  rows: LevelingRow[]
  summary: DifyCalcSummary
}

export interface DifyOcrResult {
  rows: LevelingRow[]
  warnings: string[]
}

function getApiKey(): string {
  const key = process.env.DIFY_API_KEY
  if (!key) throw new Error("DIFY_API_KEY が設定されていません")
  return key
}

async function runWorkflow(
  inputs: Record<string, unknown>,
  userId: string,
): Promise<unknown> {
  const res = await fetch(`${DIFY_API_URL}/v1/workflows/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs,
      response_mode: "blocking",
      user: userId,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `Dify API error: ${res.status}`)
  }

  const data = await res.json()

  if (data.data?.status !== "succeeded") {
    throw new Error(data.data?.error ?? "Workflow failed")
  }

  const result = data.data?.outputs?.result
  return typeof result === "string" ? JSON.parse(result) : result
}

export async function uploadFileToDify(file: File, userId: string): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("user", userId)

  const res = await fetch(`${DIFY_API_URL}/v1/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getApiKey()}` },
    body: formData,
  })

  if (!res.ok) throw new Error("画像のアップロードに失敗しました")

  const data = await res.json()
  return data.id as string
}

export async function runOcr(fileId: string, userId: string): Promise<DifyOcrResult> {
  const result = (await runWorkflow(
    {
      survey: "ocr",
      files: {
        transfer_method: "local_file",
        upload_file_id: fileId,
        type: "image",
      },
    },
    userId,
  )) as { ok: boolean; rows: LevelingRow[]; warnings?: string[]; error?: string }

  if (!result.ok) throw new Error(result.error ?? "OCR解析に失敗しました")

  return { rows: result.rows, warnings: result.warnings ?? [] }
}

export async function runLevelingCalc(
  rows: LevelingRow[],
  grade: GradeLevel,
  userId: string,
): Promise<DifyCalcResult> {
  const result = (await runWorkflow(
    { survey: "leveling", query: JSON.stringify(rows), grade },
    userId,
  )) as { ok: boolean; rows: LevelingRow[]; summary: DifyCalcSummary; error?: string }

  if (!result.ok) throw new Error(result.error ?? "計算に失敗しました")

  return { rows: result.rows, summary: result.summary }
}
