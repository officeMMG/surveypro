"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { GRADE_LABELS } from "@/types"
import type { GradeLevel, MemberRole } from "@prisma/client"
import { Ruler, MapPin, ChevronRight, AlertCircle } from "lucide-react"
import { DeleteProjectButton } from "./delete-project-button"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    client: string | null
    gradeLevel: GradeLevel
    autoDeleteAt: Date
    updatedAt: Date
    owner: { name: string | null }
    members: { userId: string; role: MemberRole }[]
    _count: { levelingRoutes: number; benchmarks: number }
  }
  userId: string
}

export function ProjectCard({ project, userId }: ProjectCardProps) {
  const isOwner = project.members.find((m) => m.userId === userId)?.role === "OWNER" ||
    project.owner.name !== null

  const daysUntilDelete = Math.ceil(
    (project.autoDeleteAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const isExpiringSoon = daysUntilDelete <= 7

  return (
    <Card className="group flex flex-col hover:border-primary/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug line-clamp-2">{project.name}</CardTitle>
          <Badge variant="outline" className="shrink-0 text-xs">
            {GRADE_LABELS[project.gradeLevel].replace("水準測量", "")}
          </Badge>
        </div>
        {project.client && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {project.client}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Ruler className="w-3 h-3" />
            路線 {project._count.levelingRoutes}件
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            基準点 {project._count.benchmarks}件
          </span>
        </div>

        {isExpiringSoon && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />
            {daysUntilDelete}日後に自動削除
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(project.updatedAt, { addSuffix: true, locale: ja })}
        </p>
        <div className="flex items-center gap-1">
          {isOwner && <DeleteProjectButton projectId={project.id} />}
          <Link
            href={`/projects/${project.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2 text-xs")}
          >
            開く
            <ChevronRight className="ml-1 w-3 h-3" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
