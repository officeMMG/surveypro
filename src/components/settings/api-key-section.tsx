"use client"

import { useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Key, TestTube, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface ApiKeySectionProps {
  apiKey: { keyHint: string; lastTestedAt: Date | null; isActive: boolean } | null
}

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
const keySchema = z.object({
  apiKey: z.string().startsWith("sk-ant-", "有効なAnthropicのAPIキー（sk-ant-で始まる）を入力してください"),
})
type CredForm = z.infer<typeof credSchema>
type KeyForm = z.infer<typeof keySchema>

export function ApiKeySection({ apiKey }: ApiKeySectionProps) {
  const { data: session } = useSession()
  const [authOpen, setAuthOpen] = useState(false)
  const [keyOpen, setKeyOpen] = useState(false)
  const [authMethod, setAuthMethod] = useState<"google" | "credentials" | "admin" | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  const credForm = useForm<CredForm>({ resolver: zodResolver(credSchema) })
  const keyForm = useForm<KeyForm>({ resolver: zodResolver(keySchema) })

  const isGoogle = session?.user?.image?.includes("google")

  // Step1: 本人確認
  const handleGoogleAuth = async () => {
    setAuthLoading(true)
    try {
      await signIn("google", { redirect: false })
      setAuthOpen(false)
      setKeyOpen(true)
    } catch {
      toast.error("Google認証に失敗しました")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleCredAuth = async (data: CredForm) => {
    setAuthLoading(true)
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setAuthOpen(false)
      setKeyOpen(true)
    } catch {
      toast.error("メールアドレスまたはパスワードが正しくありません")
    } finally {
      setAuthLoading(false)
    }
  }

  // Step2: APIキー更新
  const handleSaveKey = async (data: KeyForm) => {
    try {
      const res = await fetch("/api/settings/api-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: data.apiKey }),
      })
      if (!res.ok) throw new Error()
      toast.success("APIキーを更新しました")
      setKeyOpen(false)
      keyForm.reset()
      window.location.reload()
    } catch {
      toast.error("APIキーの更新に失敗しました")
    }
  }

  const handleTestKey = async () => {
    setTesting(true)
    try {
      const res = await fetch("/api/settings/api-key/test", { method: "POST" })
      const data = await res.json()
      if (data.ok) toast.success("APIキーの接続テストが成功しました")
      else toast.error("APIキーの接続テストに失敗しました: " + data.error)
    } catch {
      toast.error("接続テストに失敗しました")
    } finally {
      setTesting(false)
    }
  }

  const handleAdminContact = async () => {
    try {
      await fetch("/api/settings/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "API_KEY_CHANGE",
          message: `ユーザー ${session?.user?.email} からAPIキー変更依頼が届きました。`,
        }),
      })
      toast.success("管理者に問い合わせを送信しました。対応まで今しばらくお待ちください。")
      setAuthOpen(false)
    } catch {
      toast.error("送信に失敗しました")
    }
  }

  return (
    <section>
      <h2 className="text-base font-semibold mb-4">API設定</h2>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm">Anthropic APIキー</CardTitle>
            </div>
            {apiKey?.isActive ? (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                設定済み
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                未設定
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            写真OCR機能（野帳の自動読み取り）に使用します。
            キーはサーバー上で暗号化されて保存され、クライアントには送信されません。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {apiKey && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 text-xs font-mono-nums">
              <Key className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{apiKey.keyHint}</span>
              {apiKey.lastTestedAt && (
                <span className="ml-auto text-muted-foreground">
                  最終確認: {new Date(apiKey.lastTestedAt).toLocaleDateString("ja-JP")}
                </span>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setAuthOpen(true)}
            >
              <Key className="w-3.5 h-3.5 mr-1.5" />
              {apiKey ? "APIキーを変更する" : "APIキーを設定する"}
            </Button>
            {apiKey && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleTestKey}
                disabled={testing}
              >
                <TestTube className="w-3.5 h-3.5 mr-1.5" />
                {testing ? "テスト中..." : "接続テスト"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 本人確認ダイアログ */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              本人確認が必要です
            </DialogTitle>
            <DialogDescription className="text-xs">
              APIキーを変更するには本人確認が必要です。以下のいずれかの方法で確認してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Google認証 */}
            {isGoogle && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={handleGoogleAuth}
                disabled={authLoading}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Googleアカウントで確認する
              </Button>
            )}

            <Separator />

            {/* メール+PW認証 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                メールアドレスとパスワードで確認
              </p>
              <form onSubmit={credForm.handleSubmit(handleCredAuth)} className="space-y-2">
                <Input
                  {...credForm.register("email")}
                  type="email"
                  placeholder="登録メールアドレス"
                  className="h-9 text-sm"
                  defaultValue={session?.user?.email ?? ""}
                />
                <Input
                  {...credForm.register("password")}
                  type="password"
                  placeholder="パスワード"
                  className="h-9 text-sm"
                />
                {credForm.formState.errors.password && (
                  <p className="text-xs text-destructive">パスワードを入力してください</p>
                )}
                <Button type="submit" size="sm" className="w-full" disabled={authLoading}>
                  {authLoading ? "確認中..." : "確認する"}
                </Button>
              </form>
            </div>

            <Separator />

            {/* 管理者問い合わせ */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={handleAdminContact}
            >
              サーバー管理者に問い合わせる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* APIキー入力ダイアログ */}
      <Dialog open={keyOpen} onOpenChange={setKeyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新しいAPIキーを入力</DialogTitle>
            <DialogDescription className="text-xs">
              Anthropic Console から取得したAPIキーを入力してください。
              キーはサーバー上で暗号化されて保存されます。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={keyForm.handleSubmit(handleSaveKey)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Anthropic APIキー</Label>
              <div className="relative">
                <Input
                  {...keyForm.register("apiKey")}
                  type={showKey ? "text" : "password"}
                  placeholder="sk-ant-api03-..."
                  className="h-9 text-xs font-mono pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
              {keyForm.formState.errors.apiKey && (
                <p className="text-xs text-destructive">{keyForm.formState.errors.apiKey.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { setKeyOpen(false); keyForm.reset() }}>
                キャンセル
              </Button>
              <Button type="submit" size="sm">保存する</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
