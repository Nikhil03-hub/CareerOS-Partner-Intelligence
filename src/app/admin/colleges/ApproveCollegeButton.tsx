'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, XCircle, PauseCircle, Loader2, ChevronDown } from 'lucide-react'

interface Props {
  collegeId: string
  collegeName: string
  currentStatus: string
}

export function ApproveCollegeButton({ collegeId, collegeName, currentStatus }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function act(action: 'approve' | 'reject' | 'suspend') {
    setLoading(action)
    setOpen(false)
    try {
      const res = await fetch('/api/college/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId, collegeName, action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      const labels = { approve: 'approved', reject: 'rejected', suspend: 'suspended' }
      toast.success(`${collegeName} ${labels[action]}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  const actions = [
    { key: 'approve' as const, label: 'Approve', icon: CheckCircle, color: 'text-green-600 hover:bg-green-50', show: currentStatus !== 'active' },
    { key: 'suspend' as const, label: 'Suspend', icon: PauseCircle, color: 'text-yellow-600 hover:bg-yellow-50', show: currentStatus === 'active' },
    { key: 'reject' as const, label: 'Reject', icon: XCircle, color: 'text-red-600 hover:bg-red-50', show: currentStatus !== 'rejected' },
  ].filter(a => a.show)

  if (loading) {
    return (
      <button disabled className="text-xs px-2.5 py-1 rounded border opacity-60 flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> {loading}…
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs px-2.5 py-1 rounded border hover:bg-muted/50 transition-colors flex items-center gap-1 font-medium"
      >
        Actions <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-50 bg-card border rounded-lg shadow-lg py-1 min-w-[120px]">
            {actions.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => act(key)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${color}`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
