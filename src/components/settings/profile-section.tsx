"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileSectionProps {
  user: { name: string | null | undefined; email: string | null | undefined; image: string | null | undefined }
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [name, setName] = useState(user.name ?? "")
  const [saving, setSaving] = useState(false)

  const initials = name ? name.slice(0, 2).toUpperCase() : "U"

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error()
      toast.success("プロフィールを更新しました")
    } catch {
      toast.error("更新に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <h2 className="text-base font-semibold mb-4">プロフィール</h2>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user.name ?? "未設定"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">表示名</Label>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-sm flex-1"
                  placeholder="表示名を入力"
                />
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
