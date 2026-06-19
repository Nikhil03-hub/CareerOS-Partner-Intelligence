# CareerOS Partner Intelligence — Deployment Guide

> **SummerSaaS Hackathon 2026 | Track 5B**  
> Stack: Next.js 14 + Supabase + Vercel

---

## Prerequisites

- Node.js 18+ installed
- Git repository (GitHub/GitLab)
- Supabase account (free tier works)
- Vercel account (free tier works)

---

## Step 1: Supabase Setup

### 1.1 Create a new Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `careeros-partner-platform`
3. Region: `South Asia (Mumbai)` — closest to India
4. Database password: save it securely

### 1.2 Get your API keys

In the Supabase dashboard → **Settings → API**:

| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (e.g. `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret!) |

### 1.3 Run the database migrations

In the Supabase dashboard → **SQL Editor**, paste and run each migration file in order:

```
supabase/migrations/20240101000001_initial_schema.sql
supabase/migrations/20240101000002_rls_policies.sql
supabase/migrations/20240101000003_seed_data.sql   ← optional, has KMIT + 25 colleges
```

Or use the Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 1.4 Create Storage Buckets

In Supabase dashboard → **Storage → New Bucket**:

| Bucket name | Public | Purpose |
|---|---|---|
| `mou-docs` | ❌ Private | MOU PDF uploads |
| `college-logos` | ✅ Public | College logo images |
| `reports` | ❌ Private | Generated PDF reports |
| `certificates` | ❌ Private | FDP certificates |

### 1.5 Fix student readiness spread (optional but recommended)

Run in SQL Editor to make demo data realistic:

```sql
-- Spread readiness scores properly based on CGPA
UPDATE students SET
  placement_readiness = CASE
    WHEN cgpa >= 9.0 THEN FLOOR(85 + RANDOM() * 13)::int
    WHEN cgpa >= 8.5 THEN FLOOR(75 + RANDOM() * 18)::int
    WHEN cgpa >= 8.0 THEN FLOOR(65 + RANDOM() * 20)::int
    WHEN cgpa >= 7.5 THEN FLOOR(55 + RANDOM() * 20)::int
    WHEN cgpa >= 7.0 THEN FLOOR(45 + RANDOM() * 20)::int
    ELSE FLOOR(30 + RANDOM() * 25)::int
  END,
  risk_level = CASE
    WHEN cgpa < 7.0 THEN 'high'
    WHEN cgpa < 8.0 THEN 'medium'
    ELSE 'low'
  END;
```

### 1.6 Set up Auth email templates (optional)

In Supabase → **Authentication → Email Templates**, customize the confirmation email with CareerOS branding.

---

## Step 2: Local Development

```bash
# Clone and install
git clone https://github.com/YOUR_ORG/skill-tank-partner-platform.git
cd skill-tank-partner-platform

# Install dependencies
npm install
npm install jspdf jspdf-autotable recharts    # required packages

# Create .env.local
cp .env.example .env.local
# Then fill in your Supabase values

# Run dev server
npm run dev
# Open http://localhost:3000
```

### .env.local template

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## Step 3: Vercel Deployment

### 3.1 Push to GitHub

```bash
git add .
git commit -m "feat: CareerOS Partner Intelligence Platform v1.0"
git push origin main
```

### 3.2 Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `.` (leave default)

### 3.3 Add Environment Variables

In Vercel → Project → **Settings → Environment Variables**, add:

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production, Preview, Development |

### 3.4 Deploy

Click **Deploy**. Vercel will:
1. Install dependencies
2. Run `npm run build`
3. Deploy to `https://your-project.vercel.app`

Build time: ~2-3 minutes.

---

## Step 4: Create the Admin User

After deployment, create the first admin account:

### Option A: Via Supabase Auth (recommended)

In Supabase → **Authentication → Users → Add User**:
- Email: `admin@skilltank.in`
- Password: set a strong password
- Auto-confirm email: ✅

Then in **SQL Editor**:
```sql
-- Get the user's auth ID first
SELECT id FROM auth.users WHERE email = 'admin@skilltank.in';

-- Insert into users table (replace AUTH_ID with the id from above)
INSERT INTO users (auth_id, email, name, role)
VALUES ('AUTH_ID', 'admin@skilltank.in', 'Platform Admin', 'admin');
```

### Option B: Via the signup page

1. Go to `/signup`
2. Sign up with your admin email
3. In Supabase SQL Editor, manually set your role:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Step 5: Verify Everything Works

Run through this checklist after deployment:

- [ ] `/` — Landing page loads with full sections
- [ ] `/login` — Can log in as admin
- [ ] `/admin/dashboard` — Shows summary cards
- [ ] `/admin/colleges` — Lists all colleges
- [ ] `/admin/students` — Lists students with AI scores
- [ ] `/admin/analytics` — Charts render correctly
- [ ] `/admin/reports` — Can generate a PDF report
- [ ] `/college/copilot` — TPO Copilot loads with AI insights
- [ ] Student 360° page — `/admin/students/[id]` — Full prediction panel

---

## Step 6: Seed Demo Data (for hackathon judges)

The `seed.ts` file contains:
- **25 colleges** (KMIT, BVRIT, JNTUH, VNRVJIET, CBIT, and 20 more Telangana colleges)
- **KMIT 9-year historical data** (2016-17 to 2025-26)
- **Students** with realistic CGPA/readiness distribution
- **Training cohorts**, FDP sessions, MOUs, revenue records

To run the seed:
```bash
# From project root (NOT sandbox — run on your actual machine)
npx ts-node --esm seed.ts
```

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server-only, bypasses RLS) |

---

## Architecture Notes for Judges

- **Server Components** for all data fetching (no useEffect waterfalls)
- **`createServiceClient()`** with service role key for admin pages (bypasses RLS safely server-side)
- **`'use client'` + API routes** for all mutations (button components call `/api/*` endpoints)
- **`activity_events` table** logs every action for full audit trail
- **AI scoring** is rule-based + weighted — deterministic, fast, no API calls needed
- **PDF generation** uses `jspdf` with dynamic import to avoid SSR issues on Vercel

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "No colleges found" | Run migrations + seed, check Supabase connection |
| Build fails with TS errors | Run `npm install jspdf jspdf-autotable recharts` |
| Auth redirect loop | Check middleware.ts, verify user role in `users` table |
| PDF download fails | Ensure `jspdf` is installed (not just type stubs) |
| Charts not rendering | `recharts` must be installed, not just `src/types/recharts.d.ts` |
| Service role errors | Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel env vars |

---

*Built for SummerSaaS Hackathon 2026 — Track 5B | Skill Tank · Hyderabad*
