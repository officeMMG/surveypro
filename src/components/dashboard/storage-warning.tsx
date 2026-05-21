import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface StorageWarningProps {
  current: number
  max: number
  className?: string
}

export function StorageWarning({ current, max, className }: StorageWarningProps) {
  const pct = Math.round((current / max) * 100)
  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        現場数が上限の{pct}%に達しています（{current}/{max}件）。
        古い現場を削除するか、CSVエクスポートしてデータを保管してください。
        上限を超えると古い現場から自動削除されます。
      </AlertDescription>
    </Alert>
  )
}
