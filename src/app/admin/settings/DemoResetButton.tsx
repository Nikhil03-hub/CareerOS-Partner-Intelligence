'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Loader2, CheckCircle } from 'lucide-react'

export function DemoResetButton() {
  const [step, setStep] = useState<'idle' | 'realism' | 'health' | 'done'>('idle')
  const router = useRouter()

  async function reset() {
    if (!confirm('This will reset all demo data to the ideal showcase state. Continue?')) return

    setStep('realism')
    try {
      const r1 = await fetch('/api/admin/fix-realism', { method: 'POST' })
      if (!r1.ok) throw new Error('Fix realism failed')

      setStep('health')
      const r2 = await fetch('/api/admin/recompute-health', { method: 'POST' })
      if (!r2.ok) throw new Error('Recompute health failed')

      setStep('done')
      setTimeout(() => {
        setStep('idle')
        router.refresh()
      }, 3000)
    } catch (err: any) {
      alert('Reset failed: ' + err.message)
      setStep('idle')
    }
  }

  const labels = {
    idle: 'Reset Demo Data',
    realism: 'Fixing student scores…',
    health: 'Recomputing health…',
    done: 'Reset Complete!',
  }

  return (
    <button
      onClick={reset}
      disabled={step !== 'idle'}
      className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-white font-semibold text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
    >
      {step === 'done' ? (
        <><CheckCircle className="h-4 w-4" /> {labels[step]}</>
      ) : step !== 'idle' ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> {labels[step]}</>
      ) : (
        <><RefreshCw className="h-4 w-4" /> {labels[step]}</>
      )}
    </button>
  )
}
