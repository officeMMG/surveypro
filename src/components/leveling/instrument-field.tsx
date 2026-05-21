"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Instrument {
  id: string
  name: string
  number: string
}

interface InstrumentFieldProps {
  value: string
  onChange: (v: string) => void
}

export function InstrumentField({ value, onChange }: InstrumentFieldProps) {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [selectedName, setSelectedName] = useState("")
  const [selectedNo, setSelectedNo] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newNo, setNewNo] = useState("")
  const [registering, setRegistering] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/instruments")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setInstruments(data))
      .catch(() => {})
  }, [])

  // value から name/no を復元
  useEffect(() => {
    const match = value.match(/^(.+)\s+No\.(.+)$/)
    if (match) {
      setSelectedName(match[1])
      setSelectedNo(match[2])
    } else {
      setSelectedName(value)
      setSelectedNo("")
    }
  }, [])

  // name + no → value に変換
  const buildValue = (name: string, no: string) => {
    if (no) return `${name} No.${no}`
    return name
  }

  const handleNameChange = (name: string) => {
    setSelectedName(name)
    setSelectedNo("")
    onChange(name)

    // サジェスト：登録済みの名称でフィルタ
    const uniqueNames = [...new Set(instruments.map((i) => i.name))]
    const filtered = name ? uniqueNames.filter((n) => n.toLowerCase().includes(name.toLowerCase())) : uniqueNames
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  const handleSelectName = (name: string) => {
    setSelectedName(name)
    setShowSuggestions(false)

    const nos = instruments.filter((i) => i.name === name).map((i) => i.number)
    if (nos.length === 1) {
      setSelectedNo(nos[0])
      onChange(buildValue(name, nos[0]))
    } else {
      setSelectedNo("")
      onChange(name)
    }
  }

  const handleNoChange = (no: string) => {
    setSelectedNo(no)
    onChange(buildValue(selectedName, no))
  }

  const nosForName = instruments.filter((i) => i.name === selectedName).map((i) => i.number)

  const handleRegister = async () => {
    if (!newName.trim() || !newNo.trim()) return
    setRegistering(true)
    try {
      const res = await fetch("/api/instruments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), number: newNo.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "登録に失敗しました")
        return
      }
      const instrument = await res.json()
      setInstruments((prev) => [...prev, instrument])
      toast.success("機器を登録しました")
      setNewName("")
      setNewNo("")
      setRegisterOpen(false)
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/instruments/${id}`, { method: "DELETE" })
    setInstruments((prev) => prev.filter((i) => i.id !== id))
    toast.success("削除しました")
  }

  // 外クリックでサジェスト非表示
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">使用機器</Label>
        <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
          <DialogTrigger render={
            <button className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
              <Plus className="w-3 h-3" />機器を登録
            </button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>使用機器の登録</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* 新規登録フォーム */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">機器名</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="例: Leica NA730"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">No.</Label>
                  <Input
                    value={newNo}
                    onChange={(e) => setNewNo(e.target.value)}
                    placeholder="例: 001"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <Button
                onClick={handleRegister}
                disabled={registering || !newName.trim() || !newNo.trim()}
                size="sm"
                className="w-full"
              >
                {registering ? "登録中..." : "登録する"}
              </Button>

              {/* 登録済み一覧 */}
              {instruments.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted px-3 py-1.5 text-xs font-medium">登録済み機器</div>
                  <div className="divide-y max-h-48 overflow-y-auto">
                    {instruments.map((inst) => (
                      <div key={inst.id} className="flex items-center justify-between px-3 py-1.5">
                        <span className="text-xs">{inst.name} <span className="text-muted-foreground">No.{inst.number}</span></span>
                        <button
                          onClick={() => handleDelete(inst.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-1.5" ref={wrapperRef}>
        {/* 機器名入力 + サジェスト */}
        <div className="relative flex-1">
          <Input
            value={selectedName}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => {
              const uniqueNames = [...new Set(instruments.map((i) => i.name))]
              if (uniqueNames.length > 0) {
                setSuggestions(uniqueNames)
                setShowSuggestions(true)
              }
            }}
            placeholder="機器名"
            className="h-8 text-xs"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full top-full mt-0.5 bg-popover border border-border rounded-md shadow-md overflow-hidden">
              {suggestions.map((name) => (
                <button
                  key={name}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent"
                  onMouseDown={(e) => { e.preventDefault(); handleSelectName(name) }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* No. 選択（複数ある場合はプルダウン、1つなら表示のみ） */}
        {nosForName.length > 1 ? (
          <Select value={selectedNo} onValueChange={handleNoChange}>
            <SelectTrigger className="h-8 text-xs w-28">
              <SelectValue placeholder="No." />
            </SelectTrigger>
            <SelectContent>
              {nosForName.map((no) => (
                <SelectItem key={no} value={no} className="text-xs">No.{no}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : nosForName.length === 1 ? (
          <div className="h-8 px-2 flex items-center text-xs text-muted-foreground border border-border rounded-md bg-muted w-28">
            No.{nosForName[0]}
          </div>
        ) : selectedName ? (
          <Input
            value={selectedNo}
            onChange={(e) => handleNoChange(e.target.value)}
            placeholder="No."
            className="h-8 text-xs w-28"
          />
        ) : null}
      </div>
    </div>
  )
}
