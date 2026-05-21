"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { GRADE_LABELS } from "@/types"
import { Plus } from "lucide-react"

const schema = z.object({
  name: z.string().min(1, "現場名を入力してください"),
  client: z.string().optional(),
  routeName: z.string().optional(),
  gradeLevel: z.enum(["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4"]),
})
type FormData = z.infer<typeof schema>

export function NewProjectButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gradeLevel: "LEVEL_3" },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const { id } = await res.json()
      toast.success("現場を作成しました")
      setOpen(false)
      router.push(`/projects/${id}`)
      router.refresh()
    } catch {
      toast.error("現場の作成に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-2"><Plus className="w-4 h-4" />新規現場作成</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新規現場作成</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">現場名 <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="例: ○○地区道路改良工事" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client">発注者</Label>
            <Input id="client" placeholder="例: ○○県○○土木事務所" {...register("client")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="routeName">路線名・地区名</Label>
            <Input id="routeName" placeholder="例: 主要地方道○○線" {...register("routeName")} />
          </div>
          <div className="space-y-1.5">
            <Label>作業規程区分</Label>
            <Select
              defaultValue="LEVEL_3"
              onValueChange={(v) => setValue("gradeLevel", v as FormData["gradeLevel"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GRADE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
