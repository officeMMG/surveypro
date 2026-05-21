"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Header } from "@/components/layout/header"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Ruler, ChevronRight, CheckCircle2, AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

interface Route {
  id: string
  name: string
  direction: string
  surveyDate: string | null
  observer: string | null
  updatedAt: string
  result: {
    isPassed: boolean | null
  } | null
}

export default function ProjectPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [newRouteName, setNewRouteName] = useState("")
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/routes`)
      .then((r) => r.json())
      .then(setRoutes)
      .catch(() => toast.error("データの読み込みに失敗しました"))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleCreate = async () => {
    if (!newRouteName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRouteName }),
      })
      if (!res.ok) throw new Error()
      const { id } = await res.json()
      toast.success("路線を作成しました")
      router.push(`/leveling/${id}`)
    } catch {
      toast.error("路線の作成に失敗しました")
    } finally {
      setCreating(false)
      setDialogOpen(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="水準測量 路線一覧" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">路線一覧</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                新規路線作成
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規路線作成</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>路線名</Label>
                  <Input
                    value={newRouteName}
                    onChange={(e) => setNewRouteName(e.target.value)}
                    placeholder="例: BM-1〜BM-2"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    autoFocus
                  />
                </div>
                <Button onClick={handleCreate} disabled={creating || !newRouteName.trim()} className="w-full">
                  {creating ? "作成中..." : "作成して開く"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Ruler className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">路線がまだ登録されていません</p>
            <p className="text-muted-foreground text-xs mt-1">「新規路線作成」から追加してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <Card key={route.id} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{route.name}</CardTitle>
                    {route.result ? (
                      route.result.isPassed ? (
                        <Badge className="gap-1 bg-primary text-primary-foreground shrink-0">
                          <CheckCircle2 className="w-3 h-3" />問題なし
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3" />要再測
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="gap-1 shrink-0">
                        <Clock className="w-3 h-3" />未計算
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-xs text-muted-foreground">
                    {route.surveyDate ? new Date(route.surveyDate).toLocaleDateString("ja-JP") : "測量日未設定"}
                    {route.observer && ` · ${route.observer}`}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-0">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(route.updatedAt), { addSuffix: true, locale: ja })}
                  </p>
                  <Link
                    href={`/leveling/${route.id}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2 text-xs")}
                  >
                    開く <ChevronRight className="ml-1 w-3 h-3" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
