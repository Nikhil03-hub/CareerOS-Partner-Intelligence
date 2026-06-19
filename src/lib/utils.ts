import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  if (currency === 'INR') {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount.toFixed(0)}`
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount)
}

export function formatLPA(lpa: number): string {
  return `₹${lpa.toFixed(2)} LPA`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatRelative(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return formatDate(d)
}

export function formatDaysUntil(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diff = d.getTime() - now.getTime()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return `Expired ${Math.abs(days)}d ago`
  if (days === 0) return 'Expires today'
  if (days < 30) return `${days} days left`
  if (days < 365) return `${Math.floor(days / 30)} months left`
  return `${Math.floor(days / 365)} year${days > 730 ? 's' : ''} left`
}

export function getStatusBadge(status: string): string {
  const map: Record<string, string> = {
    active: 'badge-green', approved: 'badge-green', placed: 'badge-green', ready: 'badge-green', paid: 'badge-green', low: 'badge-green',
    pending: 'badge-yellow', expiring: 'badge-yellow', processing: 'badge-yellow', unpaid: 'badge-yellow', medium: 'badge-yellow',
    suspended: 'badge-red', expired: 'badge-red', overdue: 'badge-red', deactivated: 'badge-red', failed: 'badge-red', high: 'badge-red',
    in_process: 'badge-blue', in_progress: 'badge-blue', promtal: 'badge-blue',
    unplaced: 'badge-gray', direct: 'badge-gray',
    enrolled: 'badge-purple',
  }
  return map[status] || 'badge-gray'
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function calcHealthColor(score: number): string {
  if (score >= 75) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-500'
}

export function calcHealthLabel(score: number): string {
  if (score >= 75) return 'Healthy'
  if (score >= 50) return 'Needs Attention'
  return 'At Risk'
}
