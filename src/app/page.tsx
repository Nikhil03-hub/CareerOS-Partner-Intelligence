import Link from 'next/link'
import { CountUp } from '@/components/shared/CountUp'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#050B18] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#050B18]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="text-lg font-bold">CareerOS</span>
          <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full font-medium ml-0.5">Partner Intelligence</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-blue-200">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#roles" className="hover:text-white transition-colors">Who it&apos;s for</a>
          <a href="#ai" className="hover:text-white transition-colors">AI Engine</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-blue-300 hover:text-white transition-colors px-3 py-1.5">Sign In</Link>
          <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all font-medium">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-8 text-center">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Trusted by 25+ partner colleges across Telangana & AP
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
            The Operating System<br />
            for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">College Placement</span>
          </h1>
          <p className="text-xl text-blue-200/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Manage partnerships, predict placements with AI, track training programs,
            and generate real-time reports — all from one intelligent platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-blue-500/30">
              Start Partnership
            </Link>
            <Link href="/login" className="w-full sm:w-auto border border-white/15 hover:border-white/30 hover:bg-white/5 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all">
              Admin Login
            </Link>
          </div>
          {/* Dashboard mockup */}
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50 bg-[#0D1523] mx-auto max-w-5xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0A1120]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="mx-auto text-xs text-blue-400/60 font-mono">careeros.skill-tank.com/admin/dashboard</div>
            </div>
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-t border-b border-white/5 py-12 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-white mb-1">
                <CountUp end={25} suffix="+" duration={1200} />
              </div>
              <div className="text-sm font-semibold text-blue-200 mb-0.5">Partner Colleges</div>
              <div className="text-xs text-blue-400/60">Telangana &amp; AP</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-1">
                <CountUp end={2500} suffix="+" duration={1600} />
              </div>
              <div className="text-sm font-semibold text-blue-200 mb-0.5">Students Tracked</div>
              <div className="text-xs text-blue-400/60">Real-time insights</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-1">
                ₹<CountUp end={8.26} suffix="L" decimals={2} duration={1400} />
              </div>
              <div className="text-sm font-semibold text-blue-200 mb-0.5">Avg Package</div>
              <div className="text-xs text-blue-400/60">KMIT Batch 2025-26</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-1">
                <CountUp end={89} suffix="%" duration={1200} />
              </div>
              <div className="text-sm font-semibold text-blue-200 mb-0.5">Avg Readiness</div>
              <div className="text-xs text-blue-400/60">Platform-wide</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Complete Platform</div>
          <h2 className="text-4xl font-black mb-4">Everything placement needs</h2>
          <p className="text-blue-200/70 max-w-xl mx-auto">End-to-end partner management — from MOU signing to placement offer, powered by AI.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="group rounded-2xl border border-white/8 p-6 hover:border-white/15 transition-all hover:bg-white/[0.03]">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 ${f.bg}`}>{f.icon}</div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{f.title}</h3>
              <p className="text-sm text-blue-300/70 leading-relaxed">{f.desc}</p>
              {f.badge && (
                <span className="inline-block mt-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">{f.badge}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-t border-white/5 bg-white/[0.02] py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Multi-Role Platform</div>
            <h2 className="text-4xl font-black mb-4">Built for every stakeholder</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLES.map(r => (
              <div key={r.title} className={`rounded-2xl border p-6 ${r.style}`}>
                <div className="text-3xl mb-4">{r.icon}</div>
                <h3 className="text-xl font-bold mb-2">{r.title}</h3>
                <p className="text-sm opacity-80 mb-5 leading-relaxed">{r.desc}</p>
                <ul className="space-y-2">
                  {r.features.map(feat => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <span className="opacity-60">✓</span>
                      <span className="opacity-90">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Engine */}
      <section id="ai" className="max-w-5xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">Intelligence Layer</div>
          <h2 className="text-4xl font-black mb-4">AI that solves real problems</h2>
          <p className="text-blue-200/70 max-w-xl mx-auto">Not AI for AI&apos;s sake — every model solves a specific placement challenge.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AI_FEATURES.map(a => (
            <div key={a.title} className="rounded-2xl border border-purple-500/15 bg-purple-500/[0.04] p-6 hover:border-purple-500/25 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-xl shrink-0">{a.icon}</div>
                <div>
                  <h3 className="font-bold text-white mb-1">{a.title}</h3>
                  <p className="text-sm text-blue-300/70 leading-relaxed">{a.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.tags.map(t => (
                      <span key={t} className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/15 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 bg-white/[0.02] py-24 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Get started in minutes</h2>
          </div>
          <div className="space-y-10">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex gap-6">
                <div className="shrink-0 w-12 h-12 rounded-full border-2 border-blue-500 bg-[#050B18] flex items-center justify-center font-black text-blue-400 text-lg">{i + 1}</div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold mb-1">{s.title}</h3>
                  <p className="text-blue-300/70 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-8 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-blue-500/12 to-blue-600/8 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <h2 className="text-5xl font-black mb-6">Ready to transform<br />placement management?</h2>
          <p className="text-blue-200/70 text-lg mb-10">Join the platform trusted by 25+ engineering colleges across Telangana and Andhra Pradesh.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-blue-500/25">Request Partnership</Link>
            <Link href="/login" className="border border-white/15 hover:bg-white/5 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all">View Demo Dashboard</Link>
          </div>
          <p className="mt-6 text-xs text-blue-400/50">Skill Tank · Hyderabad · Building India&apos;s placement intelligence layer</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center text-xs font-bold">C</div>
            <span className="text-sm font-semibold">CareerOS Partner Intelligence</span>
          </div>
          <p className="text-xs text-blue-400/50 text-center">© 2026 Skill Tank · CareerOS Partner Intelligence · All rights reserved</p>
          <div className="flex gap-6 text-xs text-blue-400/50">
            <Link href="/login" className="hover:text-blue-300 transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-blue-300 transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

function DashboardPreview() {
  const cols = [
    { label: 'Partner Colleges', val: '25', delta: '+3 this month', color: 'text-blue-400' },
    { label: 'Active Students', val: '2,547', delta: '89% readiness avg', color: 'text-green-400' },
    { label: 'Platform Revenue', val: '₹1.62Cr', delta: 'this academic year', color: 'text-purple-400' },
    { label: 'Placements 25-26', val: '1,203', delta: '₹8.26 avg LPA', color: 'text-yellow-400' },
  ]
  const colleges = [
    { name: 'KMIT', health: 88, offers: 312, status: 'Healthy', sc: 'text-green-400' },
    { name: 'BVRIT', health: 76, offers: 198, status: 'Healthy', sc: 'text-green-400' },
    { name: 'JNTUH CEH', health: 64, offers: 145, status: 'Attention', sc: 'text-yellow-400' },
    { name: 'VNRVJIET', health: 91, offers: 287, status: 'Healthy', sc: 'text-green-400' },
    { name: 'CBIT', health: 58, offers: 109, status: 'Attention', sc: 'text-yellow-400' },
  ]
  return (
    <div className="p-5 bg-[#0D1523]">
      <div className="grid grid-cols-4 gap-3 mb-5">
        {cols.map(c => (
          <div key={c.label} className="rounded-xl bg-white/5 border border-white/8 p-4">
            <p className="text-xs text-blue-400/60 mb-2">{c.label}</p>
            <p className={`text-2xl font-black ${c.color}`}>{c.val}</p>
            <p className="text-xs text-blue-400/50 mt-1">{c.delta}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
          <span className="text-xs font-semibold text-blue-200">Top Partner Colleges</span>
          <span className="text-xs text-blue-400/50">Ranked by Health Score</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-2.5 text-blue-400/60 font-medium">College</th>
              <th className="text-left px-4 py-2.5 text-blue-400/60 font-medium">Health</th>
              <th className="text-left px-4 py-2.5 text-blue-400/60 font-medium">Offers</th>
              <th className="text-left px-4 py-2.5 text-blue-400/60 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {colleges.map((c, i) => (
              <tr key={c.name} className={`border-b border-white/5 last:border-0 ${i % 2 ? 'bg-white/[0.015]' : ''}`}>
                <td className="px-4 py-2.5 font-medium text-white">{c.name}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${c.health}%` }} />
                    </div>
                    <span className="text-blue-300">{c.health}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-blue-200">{c.offers}</td>
                <td className={`px-4 py-2.5 font-semibold ${c.sc}`}>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: '🏛️', bg: 'bg-blue-500/15', title: 'College Management', desc: 'Full lifecycle: onboarding, approvals, health scores, and contact tracking.', badge: 'Core' },
  { icon: '👨‍🎓', bg: 'bg-green-500/15', title: 'Student Intelligence', desc: 'Readiness scores, risk flags, DSA progress, and 360° student profiles.', badge: 'Core' },
  { icon: '📄', bg: 'bg-yellow-500/15', title: 'MOU Management', desc: 'Upload, track, and renew MOUs with expiry alerts and revenue share terms.', badge: 'Core' },
  { icon: '📚', bg: 'bg-purple-500/15', title: 'Training Programs', desc: 'CRT, DSA, Aptitude, Interview Master — cohorts, enrollments, completion.', badge: 'Core' },
  { icon: '👩‍🏫', bg: 'bg-pink-500/15', title: 'FDP Sessions', desc: 'Schedule faculty development programs, track attendance, and certificates.', badge: 'Core' },
  { icon: '💰', bg: 'bg-emerald-500/15', title: 'Revenue Sharing', desc: 'Automated revenue calculations, payout approvals, and audit trail.', badge: 'Core' },
  { icon: '💬', bg: 'bg-cyan-500/15', title: 'Communication Logs', desc: 'Log calls, meetings, and emails per college with follow-up reminders.', badge: 'Core' },
  { icon: '📊', bg: 'bg-indigo-500/15', title: 'Analytics & Reports', desc: 'One-click PDF/Excel reports, charts, leaderboards, and AI summaries.', badge: 'Core' },
  { icon: '🔔', bg: 'bg-orange-500/15', title: 'Smart Notifications', desc: 'Real-time alerts for MOU expiry, payouts, risk flags, and milestones.', badge: 'System' },
]

const ROLES = [
  {
    icon: '👔', title: 'Platform Admin',
    desc: 'Full command over all partner colleges, students, revenue, and platform health.',
    style: 'border-blue-500/20 bg-blue-500/5 text-white',
    features: ['College approval workflows', 'Revenue & payout management', 'Analytics leaderboard', 'MOU lifecycle control', 'Platform-wide reports'],
  },
  {
    icon: '🎓', title: 'TPO (College)',
    desc: 'Training & Placement Officers get a focused view of their college\'s students.',
    style: 'border-green-500/20 bg-green-500/5 text-white',
    features: ['Student progress tracking', 'Placement drive logging', 'FDP scheduling', 'Communication history', 'AI Copilot assistant'],
  },
  {
    icon: '👨‍💻', title: 'Student',
    desc: 'Students track their own readiness, enrolled programs, and placement journey.',
    style: 'border-purple-500/20 bg-purple-500/5 text-white',
    features: ['Placement readiness score', 'Training enrollment', 'Skill gap insights', 'Placement status', 'Performance benchmarks'],
  },
]

const AI_FEATURES = [
  { icon: '🏥', title: 'College Health Score', desc: 'A composite 0–100 score from 6 factors: placement rate, avg LPA, training completion, MOU status, FDP activity, and engagement. Auto-refreshes daily.', tags: ['6 Weighted Factors', 'Auto-refresh', 'Trend Tracking'] },
  { icon: '🎯', title: 'Placement Readiness Prediction', desc: 'Per-student probability (0–100%) using attendance, training, DSA, assessments, and CGPA. Includes expected package range and recommended skills.', tags: ['5 Input Factors', 'Per-Student', 'Package Prediction'] },
  { icon: '⚠️', title: 'Student Risk Identification', desc: 'Flags high-risk students based on CGPA thresholds, training completion, and scores. Enables early intervention before placement season.', tags: ['3-Level Risk', 'Early Warning', 'Intervention Ready'] },
  { icon: '🤖', title: 'TPO Copilot', desc: 'AI assistant for TPO officers — surfaces actionable insights: which students need attention, upcoming drives, training gaps, and next actions.', tags: ['Natural Language', 'Context-Aware', 'Actionable'] },
  { icon: '📝', title: 'Executive Report AI', desc: 'Auto-generates narrative summaries for placement reports — highlights wins, flags concerns, and provides context for leadership review.', tags: ['Report Generation', 'Narrative AI', 'PDF Export'] },
  { icon: '📈', title: 'Recommendation Engine', desc: 'Suggests which colleges to prioritize, which training cohorts to expand, and which students are ready for mock interviews based on platform patterns.', tags: ['Priority Ranking', 'BD Intelligence', 'Pattern Detection'] },
]

const STEPS = [
  { title: 'Admin onboards your college', desc: 'Platform admin approves your college, sets up MOU terms, revenue share %, and seats. You receive login credentials for your TPO portal.' },
  { title: 'Upload students and programs', desc: 'Import student roster (or add manually), enroll in training programs like CRT, DSA, and Aptitude. AI immediately computes placement readiness scores.' },
  { title: 'Run FDP sessions and track placements', desc: 'Schedule faculty development programs, mark attendance, log placement drives, and upload offer letters. Every milestone is tracked.' },
  { title: 'AI surfaces insights and generates reports', desc: 'College Health Score updates daily. One-click PDF/Excel reports. AI Executive Summary written automatically. Revenue sharing computed and approved.' },
]
