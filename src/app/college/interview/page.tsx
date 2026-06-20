'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, ExternalLink, Info } from 'lucide-react'

const INTERVIEW_URL = 'https://embed.liveavatar.com/v1/6bb399fb-fc3c-4e1a-893e-5c4a2de11988?orientation=horizontal'

function InterviewContent() {
  const sp = useSearchParams()
  const studentName = sp.get('name') || 'Student'
  const studentId = sp.get('student')

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={studentId ? `/college/students/${studentId}` : '/college/students'}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to {studentName}
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2">
            <Video className="h-6 w-6 text-violet-600" />
            AI Mock Interview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conducting session for <strong>{studentName}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800 px-3 py-2">
          <Info className="h-4 w-4 text-violet-600 shrink-0" />
          <p className="text-xs text-violet-700 dark:text-violet-400">
            Powered by <a href="https://liveavatar.com" target="_blank" rel="noopener" className="font-semibold underline">LiveAvatar AI</a> — honest AI integration
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: '🎤', label: 'Speak clearly', desc: 'The AI evaluates your verbal communication and confidence' },
          { icon: '👁️', label: 'Maintain eye contact', desc: 'Look at the interviewer avatar, not the screen edges' },
          { icon: '⏱️', label: 'Take your time', desc: 'Pause to think before answering. Quality > speed' },
        ].map(tip => (
          <div key={tip.label} className="rounded-lg border bg-card p-3 flex gap-3 items-start">
            <span className="text-xl">{tip.icon}</span>
            <div>
              <p className="text-xs font-semibold">{tip.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Interview Embed */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Live Interview Session</span>
          </div>
          <a href={INTERVIEW_URL} target="_blank" rel="noopener"
            className="text-xs text-primary hover:underline flex items-center gap-1">
            Open fullscreen <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <iframe
          src={INTERVIEW_URL}
          className="w-full"
          style={{ height: '600px', border: 'none' }}
          allow="camera; microphone; fullscreen; autoplay"
          title="AI Mock Interview — LiveAvatar"
        />
      </div>

      {/* Post-session note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4">
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">After the session</p>
        <p className="text-xs text-blue-600 dark:text-blue-300">
          Return to the student profile to update their interview score and readiness assessment.
          AI interview results are incorporated into the CareerOS Readiness Score automatically.
        </p>
      </div>
    </div>
  )
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <Video className="h-10 w-10 text-violet-500 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading interview session...</p>
        </div>
      </div>
    }>
      <InterviewContent />
    </Suspense>
  )
}
