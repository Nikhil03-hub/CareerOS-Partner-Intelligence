'use client'

import { useState } from 'react'

interface Result {
  id: string
  name: string
  score: number
  grade: string
}

export function RecomputeHealthButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [results, setResults] = useState<Result[]>([])
  const [computed, setComputed] = useState(0)

  async function handleClick() {
    setStatus('loading')
    setResults([])
    try {
      const res = await fetch('/api/admin/recompute-health', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setComputed(json.computed)
      setResults(json.results?.slice(0, 5) || [])
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Computing...' : status === 'done' ? `✅ Done (${computed})` : '🔄 Recompute All Health Scores'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-600">Failed — check console</p>
      )}

      {status === 'done' && results.length > 0 && (
        <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Top colleges by health score:</p>
          {results.map(r => (
            <div key={r.id} className="flex items-center justify-between text-xs">
              <span className="font-medium">{r.name}</span>
              <span className="text-purple-600 font-bold">{r.score}/100 ({r.grade})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
