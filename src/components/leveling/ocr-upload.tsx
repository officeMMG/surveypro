"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import type { LevelingRow } from "@/types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, Scan, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface OcrUploadProps {
  onResult: (rows: LevelingRow[]) => void
}

export function OcrUpload({ onResult }: OcrUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください")
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append("image", file)

      setProgress(30)
      const res = await fetch("/api/ocr", { method: "POST", body: formData })
      setProgress(80)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "OCR解析に失敗しました")
      }

      const { rows } = await res.json()
      setProgress(100)

      if (!rows || rows.length === 0) {
        toast.warning("野帳データが見つかりませんでした。写真を確認してください。")
        return
      }

      onResult(rows)
      toast.success(`${rows.length}行のデータを読み取りました。内容を確認・修正してください。`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OCR解析に失敗しました")
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const clear = () => {
    setFile(null)
    setPreview(null)
    setProgress(0)
  }

  return (
    <div className="space-y-4">
      {/* ドロップゾーン */}
      {!preview ? (
        <label
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/20"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">写真をドロップ、またはクリックして選択</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG・PNG・HEIC 対応。野帳・観測手簿の写真を撮影してください。
            </p>
          </div>
        </label>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img src={preview} alt="プレビュー" className="w-full max-h-64 object-contain bg-black/20" />
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 h-7 w-7 p-0"
            onClick={clear}
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5 text-white/70" />
            <span className="text-xs text-white/80 truncate">{file?.name}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Claude AIが野帳を解析中...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      <Button
        onClick={analyze}
        disabled={!file || loading}
        className="w-full gap-2"
      >
        <Scan className="w-4 h-4" />
        {loading ? "解析中..." : "AIで野帳を読み取る"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        読み取り結果は「直接入力」タブに反映されます。内容を確認・修正してから保存してください。
      </p>
    </div>
  )
}
