'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PenLine, X, Loader2, ShieldCheck } from 'lucide-react'

interface Props {
  mouId: string
  mouTitle: string
  currentEsignStatus: string
}

export function ESignButton({ mouId, mouTitle, currentEsignStatus }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signerRole, setSignerRole] = useState('TPO')
  const [agreed, setAgreed] = useState(false)
  const router = useRouter()

  if (currentEsignStatus === 'signed') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
        <ShieldCheck className="h-3.5 w-3.5" /> Signed
      </span>
    )
  }

  async function handleSign(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) return toast.error('Please confirm your agreement')
    if (!signerName.trim()) return toast.error('Please enter your name')
    setLoading(true)
    try {
      const res = await fetch('/api/mou/esign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mouId, signerName, signerRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Signing failed')
      toast.success(`MOU signed by ${signerName}. Digital signature recorded.`)
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
      >
        <PenLine className="h-3.5 w-3.5" />
        {currentEsignStatus === 'sent' ? 'Sign Now' : 'e-Sign MOU'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold flex items-center gap-2"><PenLine className="h-4 w-4 text-violet-600" /> Digital Signature</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mouTitle}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSign} className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Declaration</p>
                <p>I, the undersigned, hereby agree to the terms and conditions of this Memorandum of Understanding between my institution and Skill Tank. This electronic signature carries the same legal weight as a physical signature and is binding upon both parties.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input type="text" required value={signerName} onChange={e => setSignerName(e.target.value)}
                  placeholder="Enter your full name as it should appear on the MOU"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Your Role</label>
                <select value={signerRole} onChange={e => setSignerRole(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option>TPO</option>
                  <option>Principal</option>
                  <option>HOD</option>
                  <option>Registrar</option>
                </select>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-violet-600" />
                <span className="text-xs text-muted-foreground">
                  I have read and agree to the MOU terms. I confirm that I am authorized to sign this agreement on behalf of my institution. Timestamp: <span className="font-mono">{new Date().toISOString()}</span>
                </span>
              </label>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-muted/50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading || !agreed || !signerName.trim()}
                  className="flex-[2] bg-violet-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing...</> : <><ShieldCheck className="h-4 w-4" /> Confirm & Sign</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
