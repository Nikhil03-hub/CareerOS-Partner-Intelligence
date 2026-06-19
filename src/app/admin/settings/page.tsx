import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform configuration and integrations</p>
      </div>

      <div className="space-y-4">
        {/* Notification integrations */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4">Notification Integrations</h3>
          <div className="space-y-3">
            {[
              { name: 'Telegram Bot', key: 'TELEGRAM_BOT_TOKEN', desc: 'Sends alerts to a Telegram channel', status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not set' },
              { name: 'Email (Resend)', key: 'RESEND_API_KEY', desc: 'Sends email notifications via Resend', status: 'configured' },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <span className="text-xs font-medium badge badge-green">Configured</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled jobs */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4">Scheduled Jobs</h3>
          <div className="space-y-3">
            {[
              { name: 'MOU Renewal Cron', schedule: 'Daily at 9am IST', desc: 'Scans for MOUs expiring within 30 days and sends alerts' },
              { name: 'Health Score Compute', schedule: 'Weekly Sunday midnight', desc: 'Recomputes college health scores and stores history' },
              { name: 'Student Risk Refresh', schedule: 'Weekly Sunday midnight', desc: 'Re-evaluates student placement risk levels' },
            ].map(j => (
              <div key={j.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{j.name}</p>
                  <p className="text-xs text-muted-foreground">{j.desc}</p>
                  <p className="text-xs text-primary mt-0.5">⏰ {j.schedule}</p>
                </div>
                <span className="text-xs font-medium badge badge-green">Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform info */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4">Platform</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Stack', value: 'Next.js 14 + Supabase' },
              { label: 'Database', value: 'PostgreSQL (Supabase)' },
              { label: 'Auth', value: 'Supabase Auth' },
              { label: 'Storage', value: 'Supabase Storage' },
              { label: 'Deployment', value: 'Vercel' },
              { label: 'Edition', value: 'SummerSaaS 2026 Hackathon' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-muted-foreground text-xs">{s.label}</p>
                <p className="font-medium">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
