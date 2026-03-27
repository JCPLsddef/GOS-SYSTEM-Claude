'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { useGosStore } from '@/store/gos-store'
import { ToastContainer, toast } from '@/components/ui/Toast'

function DataLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const { fetchAll, seedData, isSeeded } = useGosStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (status === 'authenticated' && !initialized.current) {
      initialized.current = true

      // Seed data if first login, then fetch all
      seedData().then(() => {
        fetchAll()
        if (!isSeeded) {
          toast('Welcome back, Juan.', 'hype')
        }
      })
    }
  }, [status, fetchAll, seedData, isSeeded])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DataLoader>
        {children}
        <ToastContainer />
      </DataLoader>
    </SessionProvider>
  )
}
