/**
 * create-demo-users.ts
 *
 * Creates demo Supabase Auth accounts for all 6 roles.
 * Run AFTER seed.ts and AFTER Supabase is set up.
 *
 * Usage: npm run create:users
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const DEMO_USERS = [
  { email: 'admin@careeros.app', password: 'careeros2026', name: 'Admin User', role: 'super_admin', college_code: null },
  { email: 'am@careeros.app', password: 'careeros2026', name: 'Priya Sharma (AM)', role: 'account_manager', college_code: null },
  { email: 'tpo@kmit.edu', password: 'careeros2026', name: 'Dr. Ravi Kumar', role: 'tpo', college_code: 'KMIT' },
  { email: 'hod@kmit.edu', password: 'careeros2026', name: 'Prof. Ananya Reddy', role: 'hod', college_code: 'KMIT' },
  { email: 'faculty@kmit.edu', password: 'careeros2026', name: 'Karthik Naidu', role: 'faculty_coord', college_code: 'KMIT' },
  { email: 'club@kmit.edu', password: 'careeros2026', name: 'Sai Chaitanya', role: 'club_coord', college_code: 'KMIT' },
  { email: 'tpo@vnrvjiet.edu', password: 'careeros2026', name: 'Dr. Lavanya Rao', role: 'tpo', college_code: 'VNRVJIET' },
]

async function createUsers() {
  console.log('👤 Creating demo users...')

  // First get college IDs
  const { data: colleges } = await supabase.from('colleges').select('id, code')
  const collegeMap: Record<string, string> = {}
  for (const c of colleges || []) {
    collegeMap[c.code] = c.id
  }

  for (const u of DEMO_USERS) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          name: u.name,
          role: u.role,
          college_id: u.college_code ? collegeMap[u.college_code] || null : null,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`  ⚠️  ${u.email} already exists, skipping`)
          continue
        }
        throw authError
      }

      // Create users table record
      if (authData.user) {
        await supabase.from('users').upsert({
          auth_id: authData.user.id,
          name: u.name,
          email: u.email,
          role: u.role,
          college_id: u.college_code ? collegeMap[u.college_code] || null : null,
          status: 'active',
        }, { onConflict: 'auth_id' })
      }

      console.log(`  ✓ Created: ${u.email} (${u.role})`)
    } catch (err: any) {
      console.error(`  ✗ Failed ${u.email}:`, err.message)
    }
  }

  console.log('\n✅ Demo users ready!')
  console.log('─────────────────────────────────────────')
  console.log('Login at: your-app.vercel.app/login')
  console.log('Password for all accounts: careeros2026')
  console.log('─────────────────────────────────────────')
  console.log('admin@careeros.app       → Super Admin')
  console.log('am@careeros.app          → Account Manager')
  console.log('tpo@kmit.edu             → TPO at KMIT')
  console.log('hod@kmit.edu             → HOD at KMIT')
  console.log('faculty@kmit.edu         → Faculty Coord at KMIT')
  console.log('club@kmit.edu            → Club Coord at KMIT')
  console.log('tpo@vnrvjiet.edu         → TPO at VNRVJIET')
}

createUsers().catch(console.error)
