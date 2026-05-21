"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Ruler, Key, CheckCircle2, TestTube, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

const keySchema = z.object({
  apiKey: z.string().startsWith("sk-ant-", "Anthropic APIキーは sk-ant- で始まります"),
})
type KeyForm = z.infer<typeof keySchema>

const STEPS = ["アカウント確認", "APIキー設定", "接続テスト", "完了"]

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [testing, setTesting] = useState(false)
  const [testPassed, setTestPassed] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<KeyForm>({
    resolver: zodResolver(keySchema),
  })

  const handleSaveKey = async (data: KeyForm) => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/api-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: data.apiKey }),
      })
      if (!res.ok) throw new Error()
      setStep(3)
    } catch {
      toast.error("APIキーの保存に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await fetch("/api/settings/api-key/test", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        setTestPassed(true)
        toast.success("接続テスト成功！")
        setTimeout(() => setStep(4), 800)
      } else {
        toast.error("接続テスト失敗: " + data.error)
      }
    } catch {
      toast.error("接続テストに失敗しました")
    } finally {
      setTesting(false)
    }
  }

  const pct = (step / STEPS.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Ruler className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-wide">SurveyPro</span>
        </div>

        {/* ステップ表示 */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            {STEPS.map((s, i) => (
              <span key={i} className={cn(i + 1 <= step && "text-primary font-medium")}>{s}</span>
            ))}
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        {/* Step 1: アカウント確認 */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                アカウント作成完了
              </CardTitle>
              <CardDescription className="text-xs">
                アカウントが作成されました。次にAI機能（写真OCR）用のAPIキーを設定します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">APIキーが必要な理由</p>
                <p>SurveyProの写真OCR機能では、野帳の写真をAnthropicのClaude AIで解析します。
                APIキーを設定することでこの機能が使えるようになります。</p>
                <p>APIキーはサーバー上で暗号化されて保存され、お客様のブラウザには送信されません。</p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setStep(2)}>
                  <Key className="w-4 h-4 mr-2" />
                  APIキーを設定する
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-xs">
                  後で設定する
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: APIキー入力 */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Anthropic APIキーの設定
              </CardTitle>
              <CardDescription className="text-xs">
                console.anthropic.com でAPIキーを取得し、入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleSaveKey)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">APIキー</Label>
                  <div className="relative">
                    <Input
                      {...register("apiKey")}
                      type={showKey ? "text" : "password"}
                      placeholder="sk-ant-api03-..."
                      className="h-10 text-sm font-mono pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.apiKey && (
                    <p className="text-xs text-destructive">{errors.apiKey.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    入力後は画面に表示されなくなります
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "保存中..." : "保存して次へ"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: 接続テスト */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TestTube className="w-5 h-5 text-primary" />
                接続テスト
              </CardTitle>
              <CardDescription className="text-xs">
                APIキーが正しく動作するか確認します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testPassed ? (
                <div className="flex items-center gap-2 text-primary text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  接続テスト成功！
                </div>
              ) : (
                <Button className="w-full" onClick={handleTest} disabled={testing}>
                  <TestTube className="w-4 h-4 mr-2" />
                  {testing ? "テスト中..." : "接続テストを実行"}
                </Button>
              )}
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setStep(4)}>
                スキップして完了へ
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: 完了 */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                セットアップ完了！
              </CardTitle>
              <CardDescription className="text-xs">
                SurveyProをお使いいただけます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/dashboard")}>
                ダッシュボードへ
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
