import type { GradeLevel, RouteDirection, BenchmarkType, MemberRole } from "@prisma/client"

export type { GradeLevel, RouteDirection, BenchmarkType, MemberRole }

export const GRADE_LABELS: Record<GradeLevel, string> = {
  LEVEL_1: "1級水準測量",
  LEVEL_2: "2級水準測量",
  LEVEL_3: "3級水準測量",
  LEVEL_4: "4級水準測量",
}

export const DIRECTION_LABELS: Record<RouteDirection, string> = {
  FORWARD: "往路",
  BACKWARD: "復路",
  LOOP: "閉合",
  JUNCTION: "結合",
}

export const BENCHMARK_TYPE_LABELS: Record<BenchmarkType, string> = {
  FIRST_ORDER: "一等水準点",
  SECOND_ORDER: "二等水準点",
  THIRD_ORDER: "三等水準点",
  FOUR_ORDER: "四等水準点",
  ELECTRONIC: "電子基準点",
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: "オーナー",
  EDITOR: "編集者",
  VIEWER: "閲覧者",
}

// 水準測量 野帳1行の型（UIで使用）
export interface LevelingRow {
  id?: string
  sequence: number
  stationName: string
  bs: string
  fs: string
  is_: string
  ih: string
  gh: string
  rise: string
  fall: string
  distance: string
  note: string
  isKnown: boolean
  knownElevation: string
}

// 計算結果
export interface LevelingCalculationResult {
  rows: LevelingRow[]
  totalBs: number
  totalFs: number
  closureError: number
  totalDistance: number
  allowableError: number
  isPassed: boolean
  problemRows: number[]  // 問題のある行インデックス
}

// 許容閉合差の計算パラメータ（公共測量作業規程 第34条）
export interface AllowableErrorParams {
  grade: GradeLevel
  distanceKm: number
}
