'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'

export function MOUUploadButton({ collegeId }: { collegeId: string }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    const supabase = createClient()

    try {
      // Upload to Supabase Storage
      const path = `${collegeId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('mou-docs')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      toast.success('MOU document uploaded successfully')
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <Upload className="h-4 w-4" />
        Upload MOU
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl border w-full max-w-md p-6 shadow-2xl">
            <h3 className="mb-4">Upload MOU Document</h3>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">PDF or DOCX, max 10MB</p>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
              {file && <p className="text-xs text-green-600 mt-2 font-medium">✓ {file.name}</p>}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
