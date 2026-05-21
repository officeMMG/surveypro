"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { GRADE_LABELS } from "@/types"
import type { GradeLevel } from "@prisma/client"

interface RouteInfo {
  name: string
  surveyDate: string
  weather: string
  instrument: string
  observer: string
  recorder: string
  grade: GradeLevel
}

interface RouteInfoFormProps {
  value: RouteInfo
  onChange: (v: RouteInfo) => void
}

export function RouteInfoForm({ value, onChange }: RouteInfoFormProps) {
  const set = (field: keyof RouteInfo, val: string) => onChange({ ...value, [field]: val })

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">路線名</Label>
            <Input
              value={value.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="例: BM-1〜BM-2"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">測量年月日</Label>
            <Input
              type="date"
              value={value.surveyDate}
              onChange={(e) => set("surveyDate", e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">天候</Label>
            <Input
              value={value.weather}
              onChange={(e) => set("weather", e.target.value)}
              placeholder="晴・曇・雨"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">作業規程区分</Label>
            <Select value={value.grade} onValueChange={(v) => v && set("grade", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GRADE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">使用機器</Label>
            <Input
              value={value.instrument}
              onChange={(e) => set("instrument", e.target.value)}
              placeholder="例: Leica NA730"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">観測者</Label>
            <Input
              value={value.observer}
              onChange={(e) => set("observer", e.target.value)}
              placeholder="氏名"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">記録者</Label>
            <Input
              value={value.recorder}
              onChange={(e) => set("recorder", e.target.value)}
              placeholder="氏名"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
