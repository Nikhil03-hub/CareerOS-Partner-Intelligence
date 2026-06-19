'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts'

interface PlacementPoint { year: string; offers: number; avgLpa: number }
interface HealthBucket { range: string; count: number; color: string }
interface RevenuePoint { code: string; revenue: number }

interface Props {
  placementTrend: PlacementPoint[]
  healthDistribution: HealthBucket[]
  revenueByCollege: RevenuePoint[]
}

export function AnalyticsCharts({ placementTrend, healthDistribution, revenueByCollege }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Placement Trend Line Chart */}
      <div className="rounded-xl border bg-card p-5 col-span-1 lg:col-span-2">
        <h3 className="text-sm font-semibold mb-4">Placement Trend (Offers & Avg LPA)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={placementTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="offers" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} name="Total Offers" />
            <Line yAxisId="right" type="monotone" dataKey="avgLpa" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 5" name="Avg LPA (₹)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Health Score Distribution */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Health Score Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={healthDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="range" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
            />
            <Bar dataKey="count" name="Colleges" radius={[4, 4, 0, 0]}>
              {healthDistribution.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by College */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Top Revenue Share by College (₹L)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueByCollege} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}L`} />
            <YAxis type="category" dataKey="code" tick={{ fontSize: 10 }} width={55} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
              formatter={(v: any) => [`₹${v}L`, 'Revenue Share']}
            />
            <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} name="Revenue (₹L)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
