'use client'

import { useState, useRef, useEffect } from 'react'

interface Ctx {
  college: string
  code: string
  totalStudents: number
  highRisk: number
  medRisk: number
  placed: number
  placementRate: number
  avgReadiness: number
  avgCGPA: string
  avgCompletion: number
  completedEnrollments: number
  notEnrolled: number
  upcomingFDP: number
  healthScore: number
  mouDaysLeft: number | null
  avgLPA: number
  offers: number
  recentCompanies: string
}

interface Message {
  role: 'user' | 'assistant'
  text: string
}

const QUICK_QUESTIONS = [
  'Which students need attention this week?',
  'How is our placement rate vs last year?',
  'What should I focus on to improve health score?',
  'Are any MOUs expiring soon?',
  'How many students completed training?',
  'What is our average package this year?',
]

export default function CopilotChat({ context: ctx }: { context: Ctx }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hi! I'm your TPO Copilot for **${ctx.college}**. I have full visibility into your ${ctx.totalStudents} students, placements, training programs, and college health. Ask me anything — I'll give you specific, data-backed answers.`,
    },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function ask(question: string) {
    if (!question.trim()) return
    const userMsg: Message = { role: 'user', text: question }
    const answer = generateAnswer(question.toLowerCase(), ctx)
    const assistantMsg: Message = { role: 'assistant', text: answer }
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
  }

  return (
    <div className="flex flex-col">
      {/* Quick questions */}
      <div className="px-5 py-3 border-b bg-muted/20">
        <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="text-xs bg-background border border-border hover:border-primary hover:text-primary px-3 py-1.5 rounded-full transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
              m.role === 'assistant'
                ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
                : 'bg-primary text-primary-foreground'
            }`}>
              {m.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'assistant'
                ? 'bg-muted text-foreground rounded-tl-none'
                : 'bg-primary text-primary-foreground rounded-tr-none'
            }`}>
              {m.text.split('\n').map((line, li) => (
                <span key={li}>
                  {line.split('**').map((part, pi) =>
                    pi % 2 === 1
                      ? <strong key={pi}>{part}</strong>
                      : <span key={pi}>{part}</span>
                  )}
                  {li < m.text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 pb-5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(input)}
            placeholder="Ask about students, placements, training, MOUs..."
            className="flex-1 px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-40 transition-all"
          >
            Ask →
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI responses are based on your real college data
        </p>
      </div>
    </div>
  )
}

/* ── Rule-based answer engine ─────────────────────────────────────────────── */
function generateAnswer(q: string, ctx: Ctx): string {
  // Student attention / risk
  if (q.includes('attention') || q.includes('priority') || q.includes('which student') || q.includes('who need')) {
    const lines: string[] = []
    if (ctx.highRisk > 0) lines.push(`**${ctx.highRisk} high-risk students** need immediate intervention — low CGPA or poor training completion.`)
    if (ctx.medRisk > 0) lines.push(`**${ctx.medRisk} medium-risk students** need coaching sessions and mock interviews.`)
    if (ctx.notEnrolled > 0) lines.push(`**${ctx.notEnrolled} students** are not enrolled in any training program — enroll them in the next CRT batch.`)
    if (lines.length === 0) return `All ${ctx.totalStudents} students are in the low-risk zone. Average readiness is ${ctx.avgReadiness}%.`
    return lines.join('\n') + `\n\nCheck the High-Risk section above for names and readiness scores.`
  }

  // Placement rate
  if (q.includes('placement rate') || q.includes('placement') && q.includes('rate')) {
    return `**${ctx.college} placement rate: ${ctx.placementRate}%** (${ctx.placed}/${ctx.totalStudents} students placed).\n\nAverage package: ₹${ctx.avgLPA.toFixed(1)}L with ${ctx.offers} total offers this academic year.${ctx.recentCompanies ? ` Recent companies include: ${ctx.recentCompanies}.` : ''}`
  }

  // Health score improvement
  if (q.includes('health score') || q.includes('improve') || q.includes('focus')) {
    const tips: string[] = []
    if (ctx.highRisk > 0) tips.push(`Reduce high-risk students (currently ${ctx.highRisk}) through targeted coaching`)
    if (ctx.avgCompletion < 70) tips.push(`Improve training completion from ${ctx.avgCompletion}% toward 80%+`)
    if (ctx.upcomingFDP === 0) tips.push('Schedule upcoming FDP sessions — FDP activity is a Health Score component')
    if (ctx.placementRate < 60) tips.push(`Drive more placements — current rate ${ctx.placementRate}% needs to reach 70%+`)
    if (tips.length === 0) return `Your Health Score is ${ctx.healthScore}/100 — already strong! Continue current cadence and maintain MOU renewal schedule.`
    return `Current Health Score: **${ctx.healthScore}/100**.\n\nTop actions to improve:\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
  }

  // MOU / expiry
  if (q.includes('mou') || q.includes('expir') || q.includes('agreement')) {
    if (ctx.mouDaysLeft === null) return 'No active MOU found on record. Contact the admin team at admin@skilltank.in to check status.'
    if (ctx.mouDaysLeft <= 0) return '**MOU has expired.** This is urgent — contact admin immediately. New student enrollments may be blocked until renewal is complete.'
    if (ctx.mouDaysLeft <= 30) return `**MOU expires in ${ctx.mouDaysLeft} days** — renew immediately. Contact admin team to avoid disruption to enrollments and revenue sharing.`
    if (ctx.mouDaysLeft <= 90) return `MOU expires in **${ctx.mouDaysLeft} days**. Start renewal process 30 days before expiry to avoid any gap.`
    return `MOU is in good standing — **${ctx.mouDaysLeft} days remaining**. No action needed at this time.`
  }

  // Training completion
  if (q.includes('training') || q.includes('complet') || q.includes('enroll')) {
    return `Training snapshot for **${ctx.college}**:\n\n- Average completion: **${ctx.avgCompletion}%**\n- Completed enrollments: **${ctx.completedEnrollments}**\n- Students not enrolled in any program: **${ctx.notEnrolled}**\n\n${ctx.notEnrolled > 0 ? `Priority: enroll the ${ctx.notEnrolled} unenrolled students in the next available CRT or DSA cohort.` : 'All students are enrolled — keep tracking completion progress weekly.'}`
  }

  // Package / LPA / salary
  if (q.includes('package') || q.includes('lpa') || q.includes('salary') || q.includes('ctc')) {
    if (ctx.avgLPA === 0) return 'No placement packages recorded yet for this academic year.'
    const benchmark = 7.2
    const comparison = ctx.avgLPA >= benchmark ? `above the platform average (₹${benchmark}L)` : `below the platform average (₹${benchmark}L)`
    return `**Average package: ₹${ctx.avgLPA.toFixed(1)}L** — ${comparison}.\n\n${ctx.offers} total offers this year.${ctx.recentCompanies ? ` Top companies: ${ctx.recentCompanies}.` : ''}\n\n${ctx.avgLPA < benchmark ? 'To improve: target product companies, mass recruiters, and service companies paying ₹6L+.' : 'Great work! Push students toward product companies for ₹12L+ packages.'}`
  }

  // FDP
  if (q.includes('fdp') || q.includes('faculty')) {
    if (ctx.upcomingFDP > 0) return `You have **${ctx.upcomingFDP} upcoming FDP session${ctx.upcomingFDP > 1 ? 's' : ''}** scheduled. Ensure maximum faculty participation as FDP activity contributes to the College Health Score.`
    return 'No upcoming FDP sessions found. Scheduling at least one FDP per semester is recommended for maintaining Health Score and faculty engagement.'
  }

  // Students count / overview
  if (q.includes('how many student') || q.includes('student count') || q.includes('total student')) {
    return `**${ctx.college} has ${ctx.totalStudents} students** on the platform.\n\n- High risk: ${ctx.highRisk}\n- Medium risk: ${ctx.medRisk}\n- Low risk: ${ctx.totalStudents - ctx.highRisk - ctx.medRisk}\n- Already placed: ${ctx.placed}\n- Average readiness: ${ctx.avgReadiness}%\n- Average CGPA: ${ctx.avgCGPA}`
  }

  // Readiness
  if (q.includes('readiness') || q.includes('ready') || q.includes('cgpa')) {
    return `**Average placement readiness: ${ctx.avgReadiness}%** | Average CGPA: ${ctx.avgCGPA}\n\n${ctx.avgReadiness >= 75 ? 'Most students are placement-ready. Focus the remaining few on skill development.' : ctx.avgReadiness >= 55 ? 'Readiness is moderate. Intensive DSA and aptitude training will move students into the 75%+ zone.' : 'Readiness needs urgent attention. Consider bootcamp-style intensive training for all batches.'}`
  }

  // Default
  return `I have data on **${ctx.totalStudents} students**, **${ctx.offers} placements**, and full health metrics for **${ctx.college}** (Health Score: ${ctx.healthScore}/100).\n\nTry asking:\n- "Which students need attention?"\n- "How do I improve our health score?"\n- "When does our MOU expire?"\n- "What is our average package?"`
}
