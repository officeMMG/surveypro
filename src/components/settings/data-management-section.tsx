"use client"

import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { Info } from "lucide-react"

export function DataManagementSection() {
  const autoDeleteDays = parseInt(process.env.NEXT_PUBLIC_AUTO_DELETE_DAYS ?? "180")
  const maxProjects = parseInt(process.env.NEXT_PUBLIC_MAX_PROJECTS ?? "500")

  return (
    <section>
      <h2 className="text-base font-semibold mb-4">データ管理</h2>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p><span className="font-medium text-foreground">自動削除ポリシー</span></p>
              <p>・現場作成から <span className="text-foreground font-medium">{autoDeleteDays}日後</span>（約{Math.round(autoDeleteDays / 30)}ヶ月）に自動削除されます</p>
              <p>・削除7日前に画面とメールで通知します</p>
              <p>・現場数が <span className="text-foreground font-medium">{maxProjects}件</span> を超えると古い順に自動削除されます</p>
              <p>・削除は <span className="text-destructive">取り消しできません</span>。事前にCSVエクスポートを推奨します</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
