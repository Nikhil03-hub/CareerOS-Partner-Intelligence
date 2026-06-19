'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    const role = data.user?.user_metadata?.role as string | undefined
    const dest = getDashboardPath(role)
    router.push(dest)
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xl">C</div>
          <span className="text-2xl font-bold text-white">CareerOS</span>
        </div>
        <p className="text-blue-200 text-sm">Partner Intelligence Platform</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-8 shadow-2xl">
        <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3.5 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3.5 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 rounded-lg bg-white/5 border border-white/10 p-4">
          <p className="text-xs font-semibold text-blue-200 mb-2">Demo accounts (password: careeros2026)</p>
          <div className="space-y-1">
            {[
              { role: 'Super Admin', email: 'admin@careeros.app' },
              { role: 'TPO – KMIT', email: 'tpo@kmit.edu' },
              { role: 'Account Manager', email: 'am@careeros.app' },
            ].map(d => (
              <button
                key={d.email}
                type="button"
                onClick={() => { setEmail(d.email); setPassword('careeros2026') }}
                className="w-full text-left rounded px-2 py-1 hover:bg-white/10 transition-colors group"
              >
                <span className="text-xs text-blue-300 group-hover:text-white">{d.role}</span>
                <span className="text-xs text-blue-400 ml-2">{d.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-blue-300">
          New college?{' '}
          <Link href="/signup" className="text-blue-200 underline hover:text-white">
            Request partnership
          </Link>
        </p>
      </div>
    </div>
  )
}

function getDashboardPath(role?: string) {
  switch (role) {
    case 'super_admin': return '/admin'
    case 'account_manager': return '/admin/colleges'
    default: return '/college/dashboard'
  }
}
