"use client"

import { cn } from "@/lib/utils"
import type { LevelingCalculationResult } from "@/types"
import type { GradeLevel } from "@prisma/client"
import { GRADE_LABELS } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, Info } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ResultSummaryProps {
  result: LevelingCalculationResult
  grade: GradeLevel
  rows: import("@/types").LevelingRow[]
}

export function ResultSummary({ result, grade, rows }: ResultSummaryProps) {
  const closureErrorMm = Math.abs(result.closureError) * 1000
  const allowableErrorMm = result.allowableError * 1000
  const pct = allowableErrorMm > 0 ? (closureErrorMm / allowableErrorMm) * 100 : 0

  return (
    <Card className={cn(
      "border-2 transition-colors",
      result.isPassed ? "border-primary/50" : "border-destructive/60"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">計算結果</CardTitle>
          <Badge
            variant={result.isPassed ? "default" : "destructive"}
            className={cn(
              "gap-1.5",
              result.isPassed && "bg-primary text-primary-foreground"
            )}
          >
            {result.isPassed
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> 問題なし</>
              : <><AlertTriangle className="w-3.5 h-3.5" /> 要再測</>
            }
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{GRADE_LABELS[grade]}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <StatRow label="Σ後視" value={`${result.totalBs.toFixed(3)} m`} />
          <StatRow label="Σ前視" value={`${result.totalFs.toFixed(3)} m`} />
          <StatRow
            label="閉合差"
            value={`${closureErrorMm.toFixed(2)} mm`}
            highlight={!result.isPassed}
          />
          <StatRow label="許容閉合差" value={`${allowableErrorMm.toFixed(2)} mm`} />
          <StatRow label="総距離" value={`${result.totalDistance.toFixed(3)} km`} />
          <StatRow
            label="超過率"
            value={`${pct.toFixed(1)} %`}
            highlight={!result.isPassed}
          />
        </div>

        {!result.isPassed && result.problemRows.length > 0 && (
          <div className="pt-2 border-t border-border">
            <Dialog>
              <DialogTrigger render={
                <Button variant="destructive" size="sm" className="w-full gap-2 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  要再測箇所を確認する（{result.problemRows.length}箇所）
                </Button>
              } />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    要再測箇所
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-2">
                  <p className="text-xs text-muted-foreground">
                    以下の測点付近で異常な昇降差が検出されました。再測を実施してください。
                  </p>
                  <div className="rounded-md border border-destructive/40 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-destructive/10 border-b border-destructive/20">
                          <th className="px-3 py-2 text-left font-medium">行</th>
                          <th className="px-3 py-2 text-left font-medium">測点名</th>
                          <th className="px-3 py-2 text-right font-medium">地盤高 (m)</th>
                          <th className="px-3 py-2 text-right font-medium">昇/降 (m)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.problemRows.map((idx) => {
                          const r = rows[idx]
                          if (!r) return null
                          return (
                            <tr key={idx} className="border-b border-destructive/10 text-destructive">
                              <td className="px-3 py-1.5">{idx + 1}</td>
                              <td className="px-3 py-1.5 font-medium">{r.stationName}</td>
                              <td className="px-3 py-1.5 text-right font-mono-nums">{r.gh}</td>
                              <td className="px-3 py-1.5 text-right font-mono-nums">
                                {r.rise ? `+${r.rise}` : r.fall ? `-${r.fall}` : "-"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    昇降差の標準偏差（2σ）を超える測点を抽出しています。
                    実際の再測範囲は前後の測点も含めて判断してください。
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatRow({
  label, value, highlight,
}: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn(
        "text-xs font-mono-nums font-medium",
        highlight ? "text-destructive" : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  )
}
