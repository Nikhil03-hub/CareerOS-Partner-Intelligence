'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Zap, CheckCircle } from 'lucide-react'

export function DigestButton({ collegeId }: { collegeId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [summary, setSummary] = useState('')
  const router = useRouter()

  async function sendDigest() {
    setState('loading')
    try {
      const res = await fetch('/api/digest/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSummary(data.summary || '')
      setState('done')
      router.refresh()
    } catch (err: any) {
      alert('Failed: ' + err.message)
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">Digest Generated & Delivered</p>
        </div>
        {summary && (
          <div className="rounded-lg bg-white dark:bg-background border p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">AI Executive Summary</p>
            <p className="text-sm leading-relaxed">{summary}</p>
          </div>
        )}
        <button
          onClick={() => setState('idle')}
          className="text-xs text-green-700 hover:underline"
        >
          Generate another →
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={sendDigest}
      disabled={state === 'loading'}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
    >
      {state === 'loading' ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Generating Digest…</>
      ) : (
        <><Zap className="h-4 w-4" /> Generate & Send Digest Now</>
      )}
    </button>
  )
}
