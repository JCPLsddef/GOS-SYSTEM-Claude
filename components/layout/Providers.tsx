'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { useGosStore } from '@/store/gos-store'
import { ToastContainer, toast } from '@/components/ui/Toast'

function DataLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const initialized = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || initialized.current) return
    initialized.current = true

    const { seedData, fetchAll } = useGosStore.getState()
    seedData().then(() => {
      fetchAll()
      toast('Welcome back, Juan.', 'hype')
    })
  }, [status])

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
