'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, Building2, TrendingUp, FileText, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  type: string
  id: string
  title: string
  subtitle?: string
  href: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  student: <Users className="h-3.5 w-3.5 text-blue-500" />,
  college: <Building2 className="h-3.5 w-3.5 text-purple-500" />,
  placement: <TrendingUp className="h-3.5 w-3.5 text-green-500" />,
  mou: <FileText className="h-3.5 w-3.5 text-orange-500" />,
}

const TYPE_LABEL: Record<string, string> = {
  student: 'Student',
  college: 'College',
  placement: 'Placement',
  mou: 'MOU',
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<NodeJS.Timeout>()

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelected(0)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results || [])
      setSelected(0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 250)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) { navigate(results[selected].href) }
  }

  return (
    <>
      {/* Trigger button in sidebar */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 text-muted-foreground hover:bg-muted transition-colors text-xs"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-xl bg-card border rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              {loading ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
              ) : (
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search students, colleges, placements, MOUs..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]) }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="text-[10px] text-muted-foreground border rounded px-1.5 py-0.5 font-mono">ESC</kbd>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <ul className="max-h-80 overflow-y-auto py-2">
                {results.map((r, i) => (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      onClick={() => navigate(r.href)}
                      onMouseEnter={() => setSelected(i)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        selected === i ? 'bg-primary/5' : 'hover:bg-muted/50'
                      )}
                    >
                      <span className="shrink-0">{TYPE_ICON[r.type]}</span>
                      <span className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">{r.title}</span>
                        {r.subtitle && (
                          <span className="text-xs text-muted-foreground truncate block">{r.subtitle}</span>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {TYPE_LABEL[r.type]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results for "{query}"
              </div>
            )}

            {query.length < 2 && (
              <div className="px-4 py-5 text-center text-xs text-muted-foreground">
                Type at least 2 characters to search students, colleges, placements and MOUs
              </div>
            )}

            {/* Footer */}
            <div className="border-t px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span><kbd className="border rounded px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="border rounded px-1 py-0.5 font-mono">↵</kbd> open</span>
              <span><kbd className="border rounded px-1 py-0.5 font-mono">ESC</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
