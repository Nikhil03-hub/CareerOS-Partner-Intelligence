'use client'

import { useEffect, useState } from 'react'
import { Volume2, Square, Loader2 } from 'lucide-react'

/**
 * AI voice narration using the browser's built-in Speech Synthesis API.
 * Zero dependency, zero cost, works offline. Reads a summary aloud.
 */
export function VoiceSummary({ text, label = 'Narrate' }: { text: string; label?: string }) {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) setSupported(false)
    return () => { try { window.speechSynthesis?.cancel() } catch { /* noop */ } }
  }, [])

  function toggle() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.02
    u.pitch = 1
    u.lang = 'en-IN'
    // Prefer an English voice if available
    const voices = window.speechSynthesis.getVoices()
    const enVoice = voices.find(v => /en[-_]?(IN|GB|US)/i.test(v.lang)) || voices.find(v => v.lang?.startsWith('en'))
    if (enVoice) u.voice = enVoice
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
    setSpeaking(true)
  }

  if (!supported) return null

  return (
    <button
      onClick={toggle}
      type="button"
      title={speaking ? 'Stop narration' : 'Listen to AI summary'}
      className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg border px-2.5 py-1.5 transition-colors ${
        speaking ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
      }`}
    >
      {speaking ? <><Square className="h-3.5 w-3.5" /> Stop</> : <><Volume2 className="h-3.5 w-3.5" /> {label}</>}
    </button>
  )
}
