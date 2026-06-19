import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  delta?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
  iconColor?: string
  subtitle?: string
  className?: string
}

export function StatsCard({ title, value, delta, trend = 'neutral', icon: Icon, iconColor = 'text-primary', subtitle, className }: StatsCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-1">{value}</p>
          {delta && (
            <p className={cn('stat-delta mt-1', trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'text-muted-foreground')}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {delta}
            </p>
          )}
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg bg-primary/10', iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
