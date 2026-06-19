'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import type { ScoringResult } from '@/lib/ai/score'

interface Props { collegeId: string; initialScore?: number }

const FACTOR_COLORS: Record<string, string> = {
  'Placement Rate': 'bg-blue-500',
  'Training Completion': 'bg-indigo-500',
  'Communication Activity': 'bg-violet-500',
  'MOU Status': 'bg-emerald-500',
  'FDP Participation': 'bg-amber-500',
  'Revenue Contribution': 'bg-green-500',
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-xs font-semibold text-muted-foreground">{grade}</span>
      </div>
    </div>
  )
}

export function HealthScoreBreakdown({ collegeId, initialScore }: Props) {
  const [data, setData] = useState<(ScoringResult & { college_name?: string; cached?: boolean }) | null>(null)
  const [loading, setLoading] = useState(true)

  async function load(bust = false) {
    setLoading(true)
    try {
      const url = `/api/health-score/${collegeId}${bust ? '?bust=1' : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) setData(await res.json())
    } catch (_) { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [collegeId])

  return (
    <div className="rounded-xl border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">AI Health Score</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Computed from live data · 6 weighted factors
            {data?.cached && <span className="ml-1">(cached)</span>}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="p-2 rounded-lg border hover:bg-muted/50 transition-colors disabled:opacity-50"
          title="Recompute"
        >
          <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Computing score…</span>
        </div>
      ) : data ? (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <ScoreRing score={data.score} grade={data.grade} />
            <span className="text-xs font-medium text-muted-foreground">{data.label}</span>
          </div>

          {/* Factor breakdown */}
          <div className="flex-1 space-y-3 w-full">
            {data.factors.map(f => (
              <div key={f.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{f.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {f.value}/100 · wt {Math.round(f.weight * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${FACTOR_COLORS[f.label] || 'bg-primary'}`}
                    style={{ width: `${f.value}%`, transition: 'width 0.8s ease' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {initialScore ? `Seeded score: ${initialScore}` : 'Score unavailable'}
          <button onClick={() => load()} className="ml-2 text-primary hover:underline text-xs">Compute now</button>
        </div>
      )}

      {data && (
        <p className="text-xs text-muted-foreground border-t pt-3">
          Last computed: {new Date(data.computedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </p>
      )}
    </div>
  )
}
