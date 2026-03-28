import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <div className="md:ml-[60px]">
        <ErrorBoundary>
          <TopBar />
        </ErrorBoundary>
        <main className="p-6 pb-24 md:pb-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
