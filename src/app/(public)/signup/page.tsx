'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const COLLEGE_TYPES = ['Engineering', 'Management', 'Medical', 'Pharmacy', 'Degree', 'Diploma', 'Other']
const PARTNERSHIP_TYPES = ['CRT (Campus Recruitment Training)', 'FDP (Faculty Development Programme)', 'External Placement Partner']

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)

  // Step 1: College info
  const [collegeName, setCollegeName] = useState('')
  const [collegeCode, setCollegeCode] = useState('')
  const [university, setUniversity] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [collegeType, setCollegeType] = useState('Engineering')
  const [partnerships, setPartnerships] = useState<string[]>(['CRT (Campus Recruitment Training)'])

  // Step 2: TPO account
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  function togglePartnership(p: string) {
    setPartnerships(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { name, phone, role: 'tpo', college_code: collegeCode }
        }
      })
      if (authError) throw authError

      // 2. Create college record (status: pending — awaits super_admin approval)
      const { data: college, error: collegeError } = await supabase.from('colleges').insert({
        name: collegeName, code: collegeCode.toUpperCase(), university,
        city, state, type: collegeType,
        partnership_types: partnerships.map(p => p.split(' (')[0]),
        status: 'pending', approved: false,
      }).select('id').single()
      if (collegeError) throw collegeError

      // 3. Create user profile linked to college
      if (authData.user) {
        await supabase.from('users').insert({
          auth_id: authData.user.id, college_id: college.id,
          name, email, phone, role: 'tpo', status: 'active',
        })
        // Update auth metadata with college_id
        await supabase.auth.updateUser({
          data: { role: 'tpo', college_id: college.id }
        })
      }

      toast.success("Application submitted! You'll receive an email once approved.")
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xl">C</div>
          <span className="text-2xl font-bold text-white">CareerOS</span>
        </div>
        <p className="text-blue-200 text-sm">College Partnership Application</p>
      </div>

      <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-8 shadow-2xl">
        {/* Step indicator */}
        <div className="flex items-center mb-7">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-300'}`}>{s}</div>
              {s < 2 && <div className={`h-0.5 w-16 mx-2 ${step > s ? 'bg-blue-500' : 'bg-white/10'}`} />}
            </div>
          ))}
          <span className="ml-4 text-sm text-blue-200">{step === 1 ? 'College Details' : 'Your Account'}</span>
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <InputField label="College Name" value={collegeName} onChange={setCollegeName} placeholder="Keshav Memorial Institute of Technology" required />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="College Code" value={collegeCode} onChange={setCollegeCode} placeholder="KMIT" required />
                <InputField label="University" value={university} onChange={setUniversity} placeholder="JNTUH" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="City" value={city} onChange={setCity} placeholder="Hyderabad" required />
                <InputField label="State" value={state} onChange={setState} placeholder="Telangana" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">College Type</label>
                <select value={collegeType} onChange={e => setCollegeType(e.target.value)} className="w-full rounded-lg bg-white/10 border border-white/20 px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm">
                  {COLLEGE_TYPES.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Partnership Types</label>
                <div className="space-y-2">
                  {PARTNERSHIP_TYPES.map(p => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={partnerships.includes(p)} onChange={() => togglePartnership(p)} className="rounded border-white/20 bg-white/10" />
                      <span className="text-sm text-blue-100">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors mt-2">
                Continue →
              </button>
            </>
          ) : (
            <>
              <InputField label="Your Name" value={name} onChange={setName} placeholder="Dr. Ravi Kumar" required />
              <InputField label="Work Email" value={email} onChange={setEmail} placeholder="tpo@college.edu" type="email" required />
              <InputField label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
              <InputField label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" required />
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors">
                  ← Back
                </button>
                <button type="submit" disabled={loading} className="flex-[2] rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
                  {loading ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="mt-4 text-center text-xs text-blue-300">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-200 underline hover:text-white">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string, value: string, onChange: (v: string) => void
  placeholder?: string, type?: string, required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-blue-100 mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full rounded-lg bg-white/10 border border-white/20 px-3.5 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
      />
    </div>
  )
}
