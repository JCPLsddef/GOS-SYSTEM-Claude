import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:ml-64">
        <TopBar />
        <main className="p-6 pb-24 md:pb-6">{children}</main>
      </div>
    </div>
  )
}
