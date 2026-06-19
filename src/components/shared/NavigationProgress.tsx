'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Renders a thin animated progress bar at the very top of the page.
 * Fires immediately on any internal link click and hides once the new
 * route has finished loading — giving instant visual feedback before the
 * loading.tsx skeleton even mounts.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)

  // Hide bar whenever the route settles
  useEffect(() => {
    setVisible(false)
    setWidth(0)
  }, [pathname, searchParams])

  // Show bar immediately on any internal anchor click
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''
      // Only trigger for same-origin, non-hash, non-external links
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      setVisible(true)
      setWidth(0)
      // Animate: quickly to 70%, then slowly to 92%
      requestAnimationFrame(() => {
        setWidth(70)
        setTimeout(() => setWidth(92), 400)
      })
    }
    document.addEventListener('click', onLinkClick, true)
    return () => document.removeEventListener('click', onLinkClick, true)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${width}%`,
        height: '3px',
        background: 'hsl(var(--primary))',
        zIndex: 99999,
        transition: width === 0 ? 'none' : 'width 0.4s ease',
        boxShadow: '0 0 8px hsl(var(--primary) / 0.5)',
        borderRadius: '0 2px 2px 0',
      }}
    />
  )
}
