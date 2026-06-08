"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { FieldbookTable } from "@/components/leveling/fieldbook-table"
import { OcrUpload } from "@/components/leveling/ocr-upload"
import { ResultSummary } from "@/components/leveling/result-summary"
import { RouteInfoForm } from "@/components/leveling/route-info-form"
import { buildLevelingCsv, downloadCsv } from "@/lib/calculations/csv"
import type { LevelingRow, LevelingCalculationResult } from "@/types"
import type { GradeLevel, RouteDirection } from "@prisma/client"
import { Save, Download, AlertTriangle, Calculator } from "lucide-react"

const INITIAL_ROWS: LevelingRow[] = Array.from({ length: 8 }, (_, i) => ({
  sequence: i,
  stationName: "", bs: "", fs: "", is_: "",
  ih: "", gh: "", rise: "", fall: "",
  distance: "", note: "",
  isKnown: i === 0,
  knownElevation: "",
}))

interface RouteInfo {
  name: string
  surveyDate: string
  weather: string
  instrument: string
  observer: string
  recorder: string
  grade: GradeLevel
  direction: RouteDirection
}

export default function LevelingRoutePage() {
  const { routeId } = useParams<{ routeId: string }>()
  const [rows, setRows] = useState<LevelingRow[]>(INITIAL_ROWS)
  const [result, setResult] = useState<LevelingCalculationResult | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({
    name: "", surveyDate: "", weather: "", instrument: "",
    observer: "", recorder: "", grade: "LEVEL_3", direction: "FORWARD",
  })
  const [saving, setSaving] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (routeId === "new") { setLoading(false); return }
    fetch(`/api/leveling/${routeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.readings?.length > 0) setRows(data.readings)
        if (data.route) setRouteInfo({
          name: data.route.name,
          surveyDate: data.route.surveyDate?.slice(0, 10) ?? "",
          weather: data.route.weather ?? "",
          instrument: data.route.instrument ?? "",
          observer: data.route.observer ?? "",
          recorder: data.route.recorder ?? "",
          grade: data.route.project?.gradeLevel ?? "LEVEL_3",
          direction: data.route.direction ?? "FORWARD",
        })
        if (data.result) {
          setResult({
            rows: data.readings ?? [],
            totalBs: Number(data.result.totalBs ?? 0),
            totalFs: Number(data.result.totalFs ?? 0),
            closureError: Number(data.result.closureError ?? 0),
            totalDistance: Number(data.result.totalDistance ?? 0),
            allowableError: Number(data.result.allowableError ?? 0),
            isPassed: data.result.isPassed ?? false,
            problemRows: [],
          })
        }
      })
      .catch(() => toast.error("データの読み込みに失敗しました"))
      .finally(() => setLoading(false))
  }, [routeId])

  const handleCalculate = async () => {
    const hasData = rows.some((r) => r.bs || r.fs)
    if (!hasData) {
      toast.warning("後視・前視を入力してから計算してください")
      return
    }
    setCalculating(true)
    try {
      const res = await fetch(`/api/leveling/${routeId}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, grade: routeInfo.grade }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "計算に失敗しました")
      }
      const data = await res.json()
      const { summary } = data

      setRows(data.rows)
      setResult({
        rows: data.rows,
        totalBs: summary.totalBs,
        totalFs: summary.totalFs,
        closureError: summary.closureError,
        totalDistance: summary.totalDistanceKm,
        allowableError: summary.allowableError / 1000,
        isPassed: summary.isPassed,
        problemRows: summary.problemRows ?? [],
      })

      if (!summary.isPassed) {
        toast.warning("閉合差が制限値を超過しています。要再測箇所を確認してください。")
      } else {
        toast.success("計算が完了しました")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "計算に失敗しました")
    } finally {
      setCalculating(false)
    }
  }

  const handleOcrResult = useCallback((ocrRows: LevelingRow[]) => {
    setRows(ocrRows)
    setResult(null)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/leveling/${routeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeInfo, rows, result }),
      })
      if (!res.ok) throw new Error()
      toast.success("保存しました")
    } catch {
      toast.error("保存に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  const handleCsvExport = () => {
    if (!result) return
    const csv = buildLevelingCsv({
      projectName: routeInfo.name || "現場名不明",
      routeName: routeInfo.name,
      surveyDate: routeInfo.surveyDate,
      observer: routeInfo.observer,
      recorder: routeInfo.recorder,
      instrument: routeInfo.instrument,
      grade: routeInfo.grade,
      rows,
      result,
    })
    const filename = `水準測量_${routeInfo.name || routeId}_${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(csv, filename)
    toast.success("CSVを出力しました")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="水準測量野帳" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-6 space-y-4">
          <RouteInfoForm value={routeInfo} onChange={setRouteInfo} />

          <Tabs defaultValue="direct">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="direct">直接入力</TabsTrigger>
                <TabsTrigger value="ocr">写真から入力</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                {result && !result.isPassed && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    閉合差超過 — 要再測
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="gap-1.5 text-xs"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  {calculating ? "計算中..." : "計算実行"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCsvExport}
                  disabled={!result}
                  className="gap-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV出力
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-1.5 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>

            <TabsContent value="direct" className="mt-3">
              <FieldbookTable
                rows={rows}
                problemRows={result?.problemRows ?? []}
                onChange={setRows}
              />
            </TabsContent>

            <TabsContent value="ocr" className="mt-3">
              <div className="max-w-xl">
                <OcrUpload onResult={handleOcrResult} />
              </div>
              {rows.some((r) => r.bs || r.fs) && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    OCRで読み取ったデータ（「直接入力」タブで編集できます）
                  </p>
                  <FieldbookTable
                    rows={rows}
                    problemRows={result?.problemRows ?? []}
                    onChange={setRows}
                    readOnly
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          {result && (
            <ResultSummary result={result} grade={routeInfo.grade} rows={rows} />
          )}
        </div>
      </div>
    </div>
  )
}
