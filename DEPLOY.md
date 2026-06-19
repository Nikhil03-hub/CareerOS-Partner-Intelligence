# CareerOS Partner Intelligence — Deployment Guide
## SummerSaaS Hackathon 2026 — Track 5B

---

## Prerequisites

- Node.js 18+ installed
- npm 9+
- Git
- Supabase account (free tier works)
- Vercel account (free tier works)

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com → New project
2. Name: `careeros-partner-intelligence`
3. Choose region: `ap-south-1` (Mumbai) for low latency
4. Copy your:
   - Project URL: `https://xxxx.supabase.co`
   - Anon Key (public)
   - Service Role Key (secret)

---

## Step 2: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=some-random-32-char-secret
# Optional but recommended for full feature demo:
RESEND_API_KEY=re_xxxx
TELEGRAM_BOT_TOKEN=xxxxx:xxxxxxxx
TELEGRAM_CHAT_ID=-1001234567890
```

---

## Step 3: Run Database Migrations

In Supabase Dashboard → SQL Editor, run each migration file in order:

1. Copy contents of `supabase/migrations/001_initial_schema.sql` → Run
2. Copy contents of `supabase/migrations/002_rls_policies.sql` → Run

OR use Supabase CLI:
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

---

## Step 4: Create Storage Buckets

In Supabase Dashboard → Storage → New bucket:
- `mou-docs` — public: false
- `college-logos` — public: true
- `reports` — public: false
- `certificates` — public: false

---

## Step 5: Install Dependencies & Seed Data

```bash
npm install
npm run db:seed        # Seeds 25 colleges, KMIT 9-year data, students, MOUs, FDP, revenue
npm run create:users   # Creates demo auth accounts for all 6 roles
```

Expected output:
```
🌱 Starting CareerOS seed...
✓ 22 companies
✓ 7 programs
✓ 25 colleges
✓ 130 departments
✓ 2500+ students
✓ KMIT real data + synthetic records
✓ 25+ cohorts
✓ Activity events seeded
✅ Seed complete!
```

---

## Step 6: Test Locally

```bash
npm run dev
```

Open http://localhost:3000

Login with demo accounts (password: `careeros2026`):
| Role | Email |
|------|-------|
| Super Admin | admin@careeros.app |
| Account Manager | am@careeros.app |
| TPO (KMIT) | tpo@kmit.edu |
| HOD (KMIT) | hod@kmit.edu |
| Faculty Coord | faculty@kmit.edu |
| Club Coord | club@kmit.edu |

---

## Step 7: Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in Vercel Dashboard → Project Settings → Environment Variables.
Copy all values from `.env.local`.

---

## Step 8: Deploy Edge Functions

```bash
supabase functions deploy renewal-cron
supabase functions deploy notify-dispatch

# Schedule renewal-cron to run daily at 3am UTC (8:30am IST)
supabase functions schedule renewal-cron --cron "0 3 * * *"
```

---

## Step 9: Verify Demo Features

After deployment, test:

1. ✅ Login as Super Admin → see all 25 colleges
2. ✅ Pending approvals banner (2 colleges await approval)
3. ✅ Login as TPO@KMIT → see KMIT dashboard with 9-year data
4. ✅ Placements → 2025-26: 148 companies, 702 offers, ₹80L top package
5. ✅ MOU page → expiry alert visible for near-expiry colleges
6. ✅ Generate report → report appears in list
7. ✅ Schedule FDP → appears in FDP list
8. ✅ Log communication → appears in timeline
9. ✅ Admin Revenue → approve a payout
10. ✅ Broadcast notification → check Telegram (if configured)

---

## Git Push

```bash
git add .
git commit -m "feat: CareerOS Partner Intelligence Platform — SummerSaaS 2026"
git remote add origin https://github.com/Nikhil03-hub/CareerOS-Partner-Intelligence.git
git push -u origin main
```

---

## Architecture Summary

```
Next.js 14 (App Router) + TypeScript
├── /admin     → Super Admin + Account Manager portal
├── /college   → TPO / HOD / Faculty / Club Coord portal  
├── /api       → Route handlers (reports, notifications)
└── /auth      → Auth callback

Supabase (PostgreSQL + Auth + Storage + Edge Functions)
├── 001_initial_schema.sql  → 35+ tables
├── 002_rls_policies.sql    → Multi-tenant RLS
├── renewal-cron/           → Daily MOU expiry check + Telegram
└── notify-dispatch/        → Real-time notification routing

Demo Data
├── 25 colleges (22 approved, 2 pending, 1 suspended)
├── 2,500+ students with readiness scores
├── KMIT 9-year real placement data (2017-18 → 2025-26)
└── MOUs with several expiring soon (for live demo)
```
