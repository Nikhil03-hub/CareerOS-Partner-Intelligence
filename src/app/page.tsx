import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">C</div>
          <span className="text-xl font-bold text-white">CareerOS</span>
          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full ml-1">Partner Intelligence</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-blue-200 hover:text-white transition-colors">Sign In</Link>
          <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium">Request Partnership</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-8">
          🏆 SummerSaaS Hackathon 2026 — Track 5B
        </div>
        <h1 className="text-5xl font-bold text-white leading-tight mb-6">
          AI-Powered College<br />
          <span className="text-blue-400">Placement Intelligence</span>
        </h1>
        <p className="text-xl text-blue-200 mb-10 max-w-3xl mx-auto">
          The complete platform for managing college partnerships, student placements, training programs, FDP activities, revenue sharing, and AI-driven insights — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-blue-500/25">
            Join as a College
          </Link>
          <Link href="/login" className="border border-white/20 hover:bg-white/10 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors">
            Sign In
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-t border-b border-white/10 py-10">
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-4 gap-8 text-center">
          {[
            { value: '25+', label: 'Partner Colleges' },
            { value: '2,500+', label: 'Students Tracked' },
            { value: '₹8.26 LPA', label: 'Avg Package (KMIT 2025-26)' },
            { value: '9 Years', label: 'Placement Intelligence' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm text-blue-300">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-5xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Everything in one platform</h2>
        <div className="grid grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-blue-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-blue-400">
        © 2026 Skill Tank · CareerOS Partner Intelligence Platform · Built for SummerSaaS Hackathon 2026
      </footer>
    </main>
  )
}

const FEATURES = [
  { icon: '🏛️', title: 'College Management', desc: 'Onboard and manage 25+ partner colleges with approval workflows and health scores.' },
  { icon: '👨‍🎓', title: 'Student Intelligence', desc: 'Track 2,500+ students with placement readiness scores, DSA progress, and risk flags.' },
  { icon: '📊', title: 'Placement Analytics', desc: '9 years of KMIT data with year-over-year trends, company heatmaps, and benchmarks.' },
  { icon: '📚', title: 'Training Programs', desc: 'CRT, DSA, Aptitude, Interview Master — cohorts, enrollments, and completion tracking.' },
  { icon: '📄', title: 'MOU Management', desc: 'Upload, track, and auto-renew MOUs with digital signing and expiry alerts.' },
  { icon: '👩‍🏫', title: 'FDP Sessions', desc: 'Schedule, attend, and track Faculty Development Programmes with certificates.' },
  { icon: '💰', title: 'Revenue Sharing', desc: 'Automated revenue share calculations, payout tracking, and financial reporting.' },
  { icon: '🤖', title: 'AI Insights', desc: 'College Health Score, placement readiness prediction, and risk identification.' },
  { icon: '📈', title: 'Reports & Exports', desc: 'One-click PDF/Excel reports — placement, revenue, training, and executive summaries.' },
]
