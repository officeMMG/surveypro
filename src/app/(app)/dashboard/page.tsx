import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Header } from "@/components/layout/header"
import { ProjectCard } from "@/components/dashboard/project-card"
import { NewProjectButton } from "@/components/dashboard/new-project-button"
import { StorageWarning } from "@/components/dashboard/storage-warning"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user.id

  const projects = await db.project.findMany({
    where: {
      deletedAt: null,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { name: true } },
      members: { select: { userId: true, role: true } },
      _count: { select: { levelingRoutes: true, benchmarks: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const totalCount = await db.project.count({
    where: { ownerId: userId, deletedAt: null },
  })

  const maxProjects = parseInt(process.env.MAX_PROJECTS_PER_USER ?? "500")
  const nearLimit = totalCount >= maxProjects * 0.9

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="現場一覧" />
      <main className="flex-1 overflow-y-auto p-6">
        {nearLimit && (
          <StorageWarning current={totalCount} max={maxProjects} className="mb-4" />
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">現場一覧</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {projects.length}件 / 最大{maxProjects}件
            </p>
          </div>
          <NewProjectButton />
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-muted-foreground text-sm">現場がまだ登録されていません</p>
            <p className="text-muted-foreground text-xs mt-1">
              「新規現場作成」ボタンから現場を追加してください
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} userId={userId} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
