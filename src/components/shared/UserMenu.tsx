'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, ChevronDown } from 'lucide-react'

interface UserMenuProps {
  name: string
  email: string
  role: string
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  account_manager: 'Account Manager',
  tpo: 'TPO',
  hod: 'HOD',
  faculty_coord: 'Faculty Coordinator',
  club_coord: 'Club Coordinator',
}

export function UserMenu({ name, email, role }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium leading-none">{name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[role] || role}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-1 z-40 w-52 rounded-lg border bg-card shadow-lg py-1">
            <div className="px-3 py-2 border-b">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
