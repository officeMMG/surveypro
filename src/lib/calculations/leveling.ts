/**
 * 水準測量計算ロジック（公共測量作業規程 第32〜34条準拠）
 * 純粋関数のみ。DB・外部IO依存なし。
 */

import type { GradeLevel } from "@prisma/client"
import type { LevelingRow, LevelingCalculationResult } from "@/types"

// ── 許容閉合差（公共測量作業規程 第34条） ──────────────────────────────────────

const ALLOWABLE_COEFFICIENTS: Record<GradeLevel, number> = {
  LEVEL_1: 2.5,  // 2.5mm√S
  LEVEL_2: 5.0,  // 5mm√S
  LEVEL_3: 10.0, // 10mm√S
  LEVEL_4: 20.0, // 20mm√S
}

/**
 * 許容閉合差を計算する (mm)
 * @param grade 測量等級
 * @param distanceKm 測量距離 (km)
 */
export function calcAllowableError(grade: GradeLevel, distanceKm: number): number {
  const coeff = ALLOWABLE_COEFFICIENTS[grade]
  return coeff * Math.sqrt(distanceKm) // mm
}

// ── 器械高式 計算 ────────────────────────────────────────────────────────────

/**
 * 野帳行を受け取り、器械高・地盤高・昇降差を計算して返す
 * 参照: 公共測量作業規程 第33条（観測方法）
 */
export function calcLevelingRows(inputRows: LevelingRow[]): LevelingRow[] {
  const rows = inputRows.map((r) => ({ ...r }))
  let currentIH = 0
  let currentGH = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const bs = parseFloat(row.bs) || 0
    const fs = parseFloat(row.fs) || 0
    const is_ = parseFloat(row.is_) || 0

    if (row.isKnown && row.knownElevation !== "") {
      // 既知点: 標高を設定
      currentGH = parseFloat(row.knownElevation) || 0
      row.gh = currentGH.toFixed(4)

      if (bs > 0) {
        currentIH = currentGH + bs
        row.ih = currentIH.toFixed(3)
      }
      row.rise = ""
      row.fall = ""
    } else if (i === 0) {
      // 始点（既知点フラグなし）
      if (bs > 0) {
        currentIH = bs // 標高0基準
        row.ih = currentIH.toFixed(3)
        currentGH = 0
        row.gh = "0.000"
      }
      row.rise = ""
      row.fall = ""
    } else {
      const prevGH = currentGH

      if (fs > 0) {
        // 前視: 地盤高を計算
        const newGH = currentIH - fs
        const diff = newGH - prevGH
        currentGH = newGH
        row.gh = newGH.toFixed(4)
        row.rise = diff >= 0 ? diff.toFixed(3) : ""
        row.fall = diff < 0 ? Math.abs(diff).toFixed(3) : ""
        row.ih = ""

        // 後視があれば次の器械高を計算
        if (bs > 0) {
          currentIH = newGH + bs
          row.ih = currentIH.toFixed(3)
        }
      } else if (is_ > 0) {
        // 中間視: 地盤高のみ計算（器械高は変わらない）
        const newGH = currentIH - is_
        row.gh = newGH.toFixed(4)
        row.rise = ""
        row.fall = ""
        row.ih = ""
      }
    }
  }

  return rows
}

// ── 閉合差計算 ───────────────────────────────────────────────────────────────

/**
 * 路線全体の集計・閉合差を計算する
 */
export function calcClosureError(rows: LevelingRow[]): {
  totalBs: number
  totalFs: number
  closureError: number
  totalDistanceKm: number
} {
  let totalBs = 0
  let totalFs = 0
  let totalDistanceM = 0

  for (const row of rows) {
    const bs = parseFloat(row.bs) || 0
    const fs = parseFloat(row.fs) || 0
    const dist = parseFloat(row.distance) || 0
    totalBs += bs
    totalFs += fs
    totalDistanceM += dist
  }

  const closureError = totalBs - totalFs // m
  const totalDistanceKm = totalDistanceM / 1000

  return {
    totalBs: round(totalBs, 3),
    totalFs: round(totalFs, 3),
    closureError: round(closureError, 4),
    totalDistanceKm: round(totalDistanceKm, 3),
  }
}

// ── 往復差計算 ───────────────────────────────────────────────────────────────

/**
 * 往路・復路の閉合差を比較する
 */
export function calcRoundTripDiff(
  forwardClosureM: number,
  backwardClosureM: number
): number {
  return Math.abs(forwardClosureM + backwardClosureM) * 1000 // mm に変換
}

// ── 総合判定 ─────────────────────────────────────────────────────────────────

export function runLevelingCalculation(
  inputRows: LevelingRow[],
  grade: GradeLevel
): LevelingCalculationResult {
  const rows = calcLevelingRows(inputRows)
  const { totalBs, totalFs, closureError, totalDistanceKm } = calcClosureError(rows)

  const allowableErrorMm = calcAllowableError(grade, totalDistanceKm)
  const allowableErrorM = allowableErrorMm / 1000
  const closureErrorMm = Math.abs(closureError) * 1000
  const isPassed = closureErrorMm <= allowableErrorMm

  // 問題行を特定: 大きな昇降差を持つ行（超過分を按分して問題箇所を推定）
  const problemRows = isPassed ? [] : identifyProblemRows(rows, closureError)

  return {
    rows,
    totalBs,
    totalFs,
    closureError,
    totalDistance: totalDistanceKm,
    allowableError: allowableErrorM,
    isPassed,
    problemRows,
  }
}

/**
 * 閉合差超過時、外れ値的な行を問題行として洗い出す
 * 昇降差の標準偏差ベースで外れ値を検出する簡易手法
 */
function identifyProblemRows(rows: LevelingRow[], closureError: number): number[] {
  const diffs: number[] = rows.map((r) => {
    const rise = parseFloat(r.rise) || 0
    const fall = parseFloat(r.fall) || 0
    return rise - fall
  })

  const nonZero = diffs.filter((d) => d !== 0)
  if (nonZero.length === 0) return []

  const mean = nonZero.reduce((a, b) => a + b, 0) / nonZero.length
  const variance = nonZero.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nonZero.length
  const std = Math.sqrt(variance)

  if (std === 0) return []

  const threshold = 2.0 // 2σ を超える行を問題行とみなす
  return rows
    .map((_, i) => i)
    .filter((i) => Math.abs(diffs[i] - mean) > threshold * std)
}

// ── 結合水準計算（最小二乗法） ──────────────────────────────────────────────

export interface JunctionRoute {
  id: string
  name: string
  startElevation: number
  endElevation: number
  measuredDiff: number  // 観測高低差 (m)
  distanceKm: number
}

export interface JunctionResult {
  routeId: string
  routeName: string
  weight: number
  residual: number
  correctedDiff: number
  adjustedEndElevation: number
}

/**
 * 結合水準の最小二乗法による補正
 */
export function calcJunctionLeveling(routes: JunctionRoute[]): JunctionResult[] {
  // 重量 = 1 / 距離
  const weights = routes.map((r) => (r.distanceKm > 0 ? 1 / r.distanceKm : 0))
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  // 閉合差
  const closureError = routes.reduce((sum, r) => sum + r.measuredDiff, 0) -
    (routes[routes.length - 1].endElevation - routes[0].startElevation)

  return routes.map((route, i) => {
    const correction = -(weights[i] / totalWeight) * closureError
    const correctedDiff = route.measuredDiff + correction
    const adjustedEndElevation = route.startElevation + correctedDiff

    return {
      routeId: route.id,
      routeName: route.name,
      weight: round(weights[i], 4),
      residual: round(correction * 1000, 2), // mm
      correctedDiff: round(correctedDiff, 4),
      adjustedEndElevation: round(adjustedEndElevation, 4),
    }
  })
}

// ── ユーティリティ ───────────────────────────────────────────────────────────

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
