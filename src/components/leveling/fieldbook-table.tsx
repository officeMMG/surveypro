"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import type { LevelingRow } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"

interface FieldbookTableProps {
  rows: LevelingRow[]
  problemRows: number[]
  onChange: (rows: LevelingRow[]) => void
  readOnly?: boolean
}

const EMPTY_ROW = (): LevelingRow => ({
  sequence: 0,
  stationName: "",
  bs: "", fs: "", is_: "",
  ih: "", gh: "", rise: "", fall: "",
  distance: "", note: "",
  isKnown: false, knownElevation: "",
})

export function FieldbookTable({ rows, problemRows, onChange, readOnly }: FieldbookTableProps) {
  const updateRow = useCallback((index: number, field: keyof LevelingRow, value: string | boolean) => {
    const next = rows.map((r, i) => i === index ? { ...r, [field]: value } : r)
    onChange(next)
  }, [rows, onChange])

  const addRow = () => {
    onChange([...rows, { ...EMPTY_ROW(), sequence: rows.length }])
  }

  const deleteRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index).map((r, i) => ({ ...r, sequence: i })))
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-2 py-2 text-left font-medium text-muted-foreground w-8">#</th>
              <th className="px-2 py-2 text-left font-medium w-24">測点</th>
              <th className="px-2 py-2 text-center font-medium w-6">既知</th>
              <th className="px-2 py-2 text-right font-medium w-24">既知標高(m)</th>
              <th className="px-2 py-2 text-right font-medium w-24 text-blue-400">後視 BS</th>
              <th className="px-2 py-2 text-right font-medium w-24">中間視 IS</th>
              <th className="px-2 py-2 text-right font-medium w-24 text-orange-400">前視 FS</th>
              <th className="px-2 py-2 text-right font-medium w-24 bg-muted/30">器械高 IH</th>
              <th className="px-2 py-2 text-right font-medium w-28 bg-muted/30">地盤高 GH</th>
              <th className="px-2 py-2 text-right font-medium w-20 bg-muted/30">昇</th>
              <th className="px-2 py-2 text-right font-medium w-20 bg-muted/30">降</th>
              <th className="px-2 py-2 text-right font-medium w-20">距離(m)</th>
              <th className="px-2 py-2 text-left font-medium">備考</th>
              {!readOnly && <th className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isProblem = problemRows.includes(i)
              return (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    isProblem
                      ? "bg-destructive/10 text-destructive"
                      : "hover:bg-muted/20"
                  )}
                >
                  <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                  <td className="px-1 py-1">
                    <Input
                      value={row.stationName}
                      onChange={(e) => updateRow(i, "stationName", e.target.value)}
                      className="h-7 text-xs font-mono-nums border-0 bg-transparent focus-visible:ring-1"
                      placeholder="BM-1"
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <Checkbox
                      checked={row.isKnown}
                      onCheckedChange={(v) => updateRow(i, "isKnown", !!v)}
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      value={row.knownElevation}
                      onChange={(e) => updateRow(i, "knownElevation", e.target.value)}
                      className="h-7 text-xs font-mono-nums text-right border-0 bg-transparent focus-visible:ring-1"
                      placeholder="0.0000"
                      readOnly={readOnly || !row.isKnown}
                    />
                  </td>
                  {/* 後視 */}
                  <td className="px-1 py-1">
                    <Input
                      value={row.bs}
                      onChange={(e) => updateRow(i, "bs", e.target.value)}
                      className="h-7 text-xs font-mono-nums text-right border-0 bg-transparent focus-visible:ring-1 text-blue-400"
                      placeholder="0.000"
                      readOnly={readOnly}
                    />
                  </td>
                  {/* 中間視 */}
                  <td className="px-1 py-1">
                    <Input
                      value={row.is_}
                      onChange={(e) => updateRow(i, "is_", e.target.value)}
                      className="h-7 text-xs font-mono-nums text-right border-0 bg-transparent focus-visible:ring-1"
                      placeholder="0.000"
                      readOnly={readOnly}
                    />
                  </td>
                  {/* 前視 */}
                  <td className="px-1 py-1">
                    <Input
                      value={row.fs}
                      onChange={(e) => updateRow(i, "fs", e.target.value)}
                      className="h-7 text-xs font-mono-nums text-right border-0 bg-transparent focus-visible:ring-1 text-orange-400"
                      placeholder="0.000"
                      readOnly={readOnly}
                    />
                  </td>
                  {/* 計算値（読み取り専用） */}
                  <td className="px-2 py-1 text-right font-mono-nums bg-muted/20 text-muted-foreground">
                    {row.ih || ""}
                  </td>
                  <td className={cn("px-2 py-1 text-right font-mono-nums bg-muted/20", isProblem ? "text-destructive font-bold" : "text-foreground")}>
                    {row.gh || ""}
                  </td>
                  <td className="px-2 py-1 text-right font-mono-nums bg-muted/20 text-primary">
                    {row.rise || ""}
                  </td>
                  <td className="px-2 py-1 text-right font-mono-nums bg-muted/20 text-destructive">
                    {row.fall || ""}
                  </td>
                  {/* 距離 */}
                  <td className="px-1 py-1">
                    <Input
                      value={row.distance}
                      onChange={(e) => updateRow(i, "distance", e.target.value)}
                      className="h-7 text-xs font-mono-nums text-right border-0 bg-transparent focus-visible:ring-1"
                      placeholder="0.000"
                      readOnly={readOnly}
                    />
                  </td>
                  {/* 備考 */}
                  <td className="px-1 py-1">
                    <Input
                      value={row.note}
                      onChange={(e) => updateRow(i, "note", e.target.value)}
                      className="h-7 text-xs border-0 bg-transparent focus-visible:ring-1"
                      readOnly={readOnly}
                    />
                  </td>
                  {!readOnly && (
                    <td className="px-1 py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteRow(i)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
          {/* 合計行 */}
          <tfoot>
            <tr className="bg-muted/40 border-t-2 border-border font-medium">
              <td colSpan={4} className="px-2 py-1.5 text-xs text-muted-foreground">合計</td>
              <td className="px-2 py-1.5 text-right text-xs font-mono-nums text-blue-400">
                {rows.reduce((s, r) => s + (parseFloat(r.bs) || 0), 0).toFixed(3)}
              </td>
              <td />
              <td className="px-2 py-1.5 text-right text-xs font-mono-nums text-orange-400">
                {rows.reduce((s, r) => s + (parseFloat(r.fs) || 0), 0).toFixed(3)}
              </td>
              <td colSpan={6} />
              {!readOnly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {!readOnly && (
        <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
          <Plus className="w-3.5 h-3.5" />
          行を追加
        </Button>
      )}
    </div>
  )
}
