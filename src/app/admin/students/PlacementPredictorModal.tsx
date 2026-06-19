'use client'

import { useState } from 'react'
import { Brain, X, Loader2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface Props {
  studentId: string
  studentName: string
}

interface Factor {
  label: string
  value: number
  weight: number
  contribution: number
  detail: string
}

interface Prediction {
  probability: number
  expectedPackageLPA: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendedSkills: string[]
  breakdown: Factor[]
}

const RISK_CONFIG = {
  low: { color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle, label: 'Low Risk' },
  medium: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: AlertTriangle, label: 'Medium Risk' },
  high: { color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle, label: 'High Risk' },
}

function ProbabilityRing({ value }: { value: number }) {
  const r = 48, cx = 56, cy = 56
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#eab308' : '#ef4444'

  return (
    <svg width={112} height={112} className="mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground" fontWeight={700} fontSize={22}>{value}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={10}>Placement Prob.</text>
    </svg>
  )
}

export function PlacementPredictorModal({ studentId, studentName }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ prediction: Prediction; student: any } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/students/predict?id=${studentId}`)
      const json = await res.json()
      if (res.ok) setData(json)
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setOpen(true)
    if (!data) load()
  }

  const p = data?.prediction

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
        title="View AI Placement Prediction"
      >
        <Brain className="h-3 w-3" /> Predict
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm">Placement Predictor</h3>
                  <p className="text-xs text-muted-foreground">{studentName}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!loading && p && (
              <div className="p-6 space-y-5">
                {/* Score ring + package */}
                <div className="flex items-center gap-6">
                  <ProbabilityRing value={p.probability} />
                  <div className="flex-1 space-y-3">
                    <div className="rounded-lg border p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">Expected Package</p>
                      <p className="text-2xl font-bold text-green-600">₹{p.expectedPackageLPA}L</p>
                      <p className="text-xs text-muted-foreground">per annum</p>
                    </div>
                    <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 text-xs font-semibold ${RISK_CONFIG[p.riskLevel].color}`}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {RISK_CONFIG[p.riskLevel].label}
                    </div>
                  </div>
                </div>

                {/* Factor breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Score Breakdown</h4>
                  <div className="space-y-2">
                    {p.breakdown.map((f, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{f.label}</span>
                          <span className="text-muted-foreground">{f.detail} · {Math.round(f.weight * 100)}% weight</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${f.value}%`,
                              background: f.value >= 70 ? '#22c55e' : f.value >= 40 ? '#eab308' : '#ef4444',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recommended Skills to Improve Odds</h4>
                  <div className="flex flex-wrap gap-2">
                    {p.recommendedSkills.map(skill => (
                      <span key={skill} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-1">
                  AI prediction based on CGPA, training completion, readiness score & ATS data.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
