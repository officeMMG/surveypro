"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Ruler,
  Map,
  TriangleRight,
  Compass,
  Calculator,
  Settings,
  Lock,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  comingSoon?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "現場一覧",
    icon: LayoutDashboard,
    active: true,
  },
  {
    href: "/leveling",
    label: "水準測量",
    icon: Ruler,
    active: true,
  },
  {
    href: "/traverse",
    label: "トラバース計算",
    icon: Compass,
    active: false,
    comingSoon: true,
  },
  {
    href: "/coordinates",
    label: "座標計算",
    icon: Map,
    active: false,
    comingSoon: true,
  },
  {
    href: "/area",
    label: "面積計算",
    icon: Calculator,
    active: false,
    comingSoon: true,
  },
  {
    href: "/setting-out",
    label: "丁張計算",
    icon: TriangleRight,
    active: false,
    comingSoon: true,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      {/* ロゴ */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <Ruler className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground tracking-wide">SurveyPro</span>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          if (!item.active) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                        "opacity-40 cursor-not-allowed select-none",
                        "text-sidebar-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <Lock className="w-3 h-3 shrink-0" />
                    </div>
                  }
                />
                <TooltipContent side="right">
                  <p className="text-xs">Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 将来機能の案内 */}
      <div className="px-3 pb-2">
        <div className="px-3 py-2 rounded-md bg-sidebar-accent/50">
          <p className="text-[11px] text-muted-foreground leading-tight">
            グレー表示の機能は順次追加予定です
          </p>
        </div>
      </div>

      {/* 設定リンク */}
      <div className="p-2 border-t border-sidebar-border">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className="w-4 h-4" />
          <span>設定</span>
        </Link>
      </div>
    </aside>
  )
}
