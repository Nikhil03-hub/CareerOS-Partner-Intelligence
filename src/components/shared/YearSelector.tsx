'use client'

import { useRouter } from 'next/navigation'

interface YearSelectorProps {
  years: string[]
  selectedYear: string
  basePath: string
  /** Extra query params to preserve (e.g. tab=recruiters) */
  extraParams?: Record<string, string>
  className?: string
}

export function YearSelector({ years, selectedYear, basePath, extraParams = {}, className }: YearSelectorProps) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams({ year: e.target.value, ...extraParams })
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <select
      value={selectedYear}
      className={className ?? 'rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary'}
      onChange={handleChange}
    >
      {years.map(y => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  )
}
