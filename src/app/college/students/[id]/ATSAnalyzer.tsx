'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, Brain, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

interface ATSResult {
  ats_score: number
  keywords_found: string[]
  tech_skills: string[]
  soft_skills: string[]
  skill_gaps: string[]
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  word_count: number
  breakdown: {
    technical_keywords: number
    section_completeness: number
    content_length: number
    soft_skills: number
    academic: number
  }
}

export function ATSAnalyzer({ studentId, cgpa }: { studentId: string; cgpa: number }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ATSResult | null>(null)
  const [showPaste, setShowPaste] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const router = useRouter()

  async function analyze() {
    if (!resumeText.trim() || resumeText.trim().split(' ').length < 30) {
      return toast.error('Please paste at least 30 words from your resume')
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('resumeText', resumeText)
      fd.append('studentId', studentId)
      fd.append('cgpa', String(cgpa))

      const res = await fetch('/api/ats/analyze', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Analysis failed')
      setResult(json.result)
      toast.success(`ATS Score: ${json.result.ats_score}/100 — profile updated`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const name = file.name.toLowerCase()
    try {
      if (name.endsWith('.txt')) {
        const text = await file.text()
        setResumeText(text); setShowPaste(true)
        toast.success('Resume loaded — review and click Analyze')
      } else if (name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        const mammoth: any = await import('mammoth/mammoth.browser')
        const { value } = await mammoth.extractRawText({ arrayBuffer })
        if (!value || value.trim().split(/\s+/).length < 30) throw new Error('Not enough readable text in this .docx')
        setResumeText(value); setShowPaste(true)
        toast.success('Resume loaded from .docx — review and click Analyze')
      } else {
        toast.error('Upload a .txt or .docx file (PDF coming soon), or paste text.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not read that file — try pasting the text instead.')
    }
    e.target.value = ''
  }

  const scoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 50 ? 'text-yellow-600' : 'text-red-600'
  const barColor = (s: number) => s >= 70 ? 'bg-green-500' : s >= 50 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-600" /> ATS Resume Analyzer
        </h3>
        <span className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">CareerOS Engine</span>
      </div>

      {!result ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Paste your resume text below. Our AI engine scores ATS compatibility and identifies skill gaps — no file upload needed.</p>

          {!showPaste ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-lg py-5 flex flex-col items-center gap-2 transition-colors group">
                <Upload className="h-6 w-6 text-primary/50 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Upload Resume</span>
                <span className="text-xs text-muted-foreground">.txt or .docx</span>
                <input type="file" accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleFile} />
              </label>
              <button
                onClick={() => setShowPaste(true)}
                className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-lg py-5 flex flex-col items-center gap-2 transition-colors group"
              >
                <Brain className="h-6 w-6 text-primary/50 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Paste Text</span>
                <span className="text-xs text-muted-foreground">Copy from your resume</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume text here — name, education, skills, experience, projects, achievements..."
                rows={8}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-xs"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowPaste(false); setResumeText('') }}
                  className="flex-1 border rounded-lg py-2 text-xs hover:bg-muted/50 transition-colors">
                  Cancel
                </button>
                <button onClick={analyze} disabled={loading}
                  className="flex-[3] bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-1.5">
                  {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing...</> : <><Brain className="h-3.5 w-3.5" /> Analyze with CareerOS AI</>}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Score */}
          <div className="flex items-center gap-4 rounded-lg bg-muted/30 p-4">
            <div className="text-center">
              <p className={`text-4xl font-bold ${scoreColor(result.ats_score)}`}>{result.ats_score}</p>
              <p className="text-xs text-muted-foreground mt-0.5">ATS Score</p>
            </div>
            <div className="flex-1">
              <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
                <div className={`h-full rounded-full ${barColor(result.ats_score)} transition-all`} style={{ width: `${result.ats_score}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {result.ats_score >= 70 ? '✅ Strong resume — ready for top placements' : result.ats_score >= 50 ? '⚠️ Good base — needs targeted improvement' : '🔴 Needs significant work before applications'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{result.keywords_found.length} keywords found · {result.word_count} words</p>
            </div>
          </div>

          {/* Score breakdown toggle */}
          <button onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground py-1">
            Score Breakdown {showBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showBreakdown && (
            <div className="space-y-2">
              {Object.entries(result.breakdown).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-semibold">{val}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Skill gaps */}
          {result.skill_gaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 mb-2">⚠️ Skill Gaps (add these)</p>
              <div className="flex flex-wrap gap-1.5">
                {result.skill_gaps.map(s => (
                  <span key={s} className="text-xs bg-red-50 dark:bg-red-950/30 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths + Improvements */}
          <div className="grid grid-cols-1 gap-3">
            {result.strengths.length > 0 && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 p-3">
                <p className="text-xs font-semibold text-green-700 mb-1.5">✅ Strengths</p>
                {result.strengths.map((s, i) => <p key={i} className="text-xs text-green-600">• {s}</p>)}
              </div>
            )}
            {result.improvements.length > 0 && (
              <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 p-3">
                <p className="text-xs font-semibold text-orange-700 mb-1.5">📈 Improvements</p>
                {result.improvements.map((s, i) => <p key={i} className="text-xs text-orange-600">• {s}</p>)}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-primary mb-2">🎯 Recommended Programs</p>
              {result.recommendations.map((r, i) => (
                <p key={i} className="text-xs text-primary/80 flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" /> {r}
                </p>
              ))}
            </div>
          )}

          <button onClick={() => { setResult(null); setResumeText(''); setShowPaste(false) }}
            className="w-full border rounded-lg py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
            Analyze Another Resume
          </button>
        </div>
      )}
    </div>
  )
}
