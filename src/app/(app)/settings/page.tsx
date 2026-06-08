import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { ProfileSection } from "@/components/settings/profile-section"
import { DataManagementSection } from "@/components/settings/data-management-section"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
  const session = await auth()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="設定" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <ProfileSection user={{ name: session!.user.name, email: session!.user.email, image: session!.user.image }} />
          <Separator />
          <DataManagementSection />
        </div>
      </main>
    </div>
  )
}
