/**
 * 水準測量データのCSVエクスポート
 * エンコーディング: UTF-8 BOM付き（Excel対応）
 * 改行: CRLF
 */

import type { LevelingRow, LevelingCalculationResult } from "@/types"
import { GRADE_LABELS } from "@/types"
import type { GradeLevel } from "@prisma/client"

interface CsvExportOptions {
  projectName: string
  routeName: string
  surveyDate?: string
  observer?: string
  recorder?: string
  instrument?: string
  grade: GradeLevel
  rows: LevelingRow[]
  result: LevelingCalculationResult
}

function escape(value: string | number | undefined | null): string {
  const str = value === undefined || value === null ? "" : String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(...cells: (string | number | undefined | null)[]): string {
  return cells.map(escape).join(",")
}

export function buildLevelingCsv(opts: CsvExportOptions): string {
  const lines: string[] = []
  const CRLF = "\r\n"

  // BOM
  const BOM = "﻿"

  // ── ヘッダー情報 ──
  lines.push(row("【水準測量野帳】"))
  lines.push(row("現場名", opts.projectName))
  lines.push(row("路線名", opts.routeName))
  lines.push(row("作業規程区分", GRADE_LABELS[opts.grade]))
  lines.push(row("測量年月日", opts.surveyDate ?? ""))
  lines.push(row("使用機器", opts.instrument ?? ""))
  lines.push(row("観測者", opts.observer ?? ""))
  lines.push(row("記録者", opts.recorder ?? ""))
  lines.push(row("出力日時", new Date().toLocaleString("ja-JP")))
  lines.push(row(""))

  // ── 野帳データ ──
  lines.push(row(
    "測点",
    "後視 BS(m)",
    "中間視 IS(m)",
    "前視 FS(m)",
    "器械高 IH(m)",
    "地盤高 GH(m)",
    "昇(m)",
    "降(m)",
    "距離(m)",
    "備考",
  ))

  for (const r of opts.rows) {
    lines.push(row(
      r.stationName,
      r.bs || "",
      r.is_ || "",
      r.fs || "",
      r.ih || "",
      r.gh || "",
      r.rise || "",
      r.fall || "",
      r.distance || "",
      r.note || "",
    ))
  }

  lines.push(row(""))

  // ── 集計 ──
  lines.push(row("【計算結果】"))
  lines.push(row("後視合計 Σ(BS)", opts.result.totalBs.toFixed(3), "m"))
  lines.push(row("前視合計 Σ(FS)", opts.result.totalFs.toFixed(3), "m"))
  lines.push(row("閉合差", (opts.result.closureError * 1000).toFixed(2), "mm"))
  lines.push(row("総距離", opts.result.totalDistance.toFixed(3), "km"))
  lines.push(row("許容閉合差", (opts.result.allowableError * 1000).toFixed(2), "mm"))
  lines.push(row("判定", opts.result.isPassed ? "問題なし" : "要再測"))

  if (!opts.result.isPassed && opts.result.problemRows.length > 0) {
    lines.push(row(""))
    lines.push(row("【要再測箇所】"))
    lines.push(row("行番号", "測点名"))
    for (const idx of opts.result.problemRows) {
      const r = opts.rows[idx]
      if (r) lines.push(row(idx + 1, r.stationName))
    }
  }

  return BOM + lines.join(CRLF)
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
