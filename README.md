# CareerOS Partner Intelligence Platform

**SummerSaaS Hackathon 2026 — Track 5B**
AI-Powered College Partnership, Training & Placement Intelligence Platform by Skill Tank Pvt. Ltd.

---

## Live Demo

> **URL:** *(Add Vercel URL after deploy)*
> **All passwords:** `careeros2026`

### 6-Role Demo Logins

| Role | Email | Access |
|------|-------|--------|
| Super Admin | `admin@careeros.app` | Full platform admin panel |
| Account Manager | `am@careeros.app` | College management + comms |
| TPO (KMIT) | `tpo@kmit.edu` | Full college portal (primary demo college) |
| HOD (KMIT) | `hod@kmit.edu` | Department analytics, students, training |
| Faculty Coordinator | `faculty@kmit.edu` | Training, FDP, workshops |
| Club Coordinator | `club@kmit.edu` | Students, workshops, placements |
| TPO (VNR VJIET) | `tpo@vnrvjiet.edu` | Second college — compare benchmarking |

---

## Quick Judge Guide

1. **Login as** `admin@careeros.app` → Executive Command Center (25 colleges, 2,500+ students)
2. **Demo Reset** → Settings → "One-Click Demo Reset" (JUDGE TOOL) — restores showcase state
3. **Switch to TPO** (`tpo@kmit.edu`) → Dashboard → Students → Student 360 → Reports → Generate PDF
4. **Try Cmd+K** (or Ctrl+K) anywhere in admin → Global Search across students/colleges/MOUs
5. **College Leaderboard** → Admin → Analytics → ranked by AI health score
6. **Live Chat** → College → Communications → Live Chat (G2) — Supabase Realtime

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router + React 18 |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| PDF | jsPDF + jspdf-autotable |
| Charts | Recharts |
| Deploy | Vercel |
| Notifications | Telegram Bot + Resend (Email) |

---

## Feature Coverage

### Mandatory (15/15 — 100%)

| # | Feature | Pages |
|---|---------|-------|
| M1 | College Signup & Admin Approval | `/signup` `/login` `/admin/colleges` |
| M2 | College Profile Management | `/admin/colleges/[id]` |
| M3 | Student Roster Management | `/college/students` `/admin/students` |
| M4 | Program / Cohort Tracking | `/college/training` `/admin/training` |
| M5 | Placement Outcomes Dashboard | `/college/placements` `/admin/placements` |
| M6 | Per-Student Training Completion | `/college/students/[id]` |
| M7 | MOU / Partnership Documents | `/college/mou` `/admin/mous` |
| M8 | FDP Scheduling & Attendance | `/college/fdp` `/admin/fdp` |
| M9 | Downloadable Reports (PDF) | `/college/reports` `/admin/reports` |
| M10 | Revenue Share Visibility | `/college/revenue` `/admin/revenue` |
| M11 | Communication Log | `/college/comms` `/admin/comms` |
| M12 | Multi-User RBAC (6 roles) | `/admin/users` |
| M13 | Renewal / Expiry Alerts | `/college/notifications` + cron |
| M14 | Automated Notifications | `/admin/notifications` |
| M15 | Central Admin Panel | `/admin` (all sub-pages) |

### Good-to-Have (10/10 — 100%)

| # | Feature | Location |
|---|---------|----------|
| G1 | Benchmarking vs Partner Colleges | `/college/benchmarking` |
| G2 | Live Chat (Supabase Realtime) | `/college/comms` → ChatPanel |
| G3 | Workshop Request Flow | `/college/workshops` `/admin/workshops` |
| G4 | Student 360° Drill-Down | `/college/students/[id]` |
| G5 | Co-branded Report Templates | `/college/reports` → checkbox in GenerateReportButton |
| G6 | Automated Digest Reports | `/college/reports` → DigestButton |
| G7 | Recruiter / Promtal Hiring View | `/college/placements` → Recruiters tab |
| G8 | College Leaderboard | `/admin/analytics` |
| G9 | Department Analytics | `/college/department-analytics` |
| G10 | Budget / Seat Tracking | `/college/programs` |

### Bonus

| Feature | Location |
|---------|----------|
| Global Search Cmd+K | `src/components/shared/GlobalSearch.tsx` |
| One-Click Demo Reset | `/admin/settings` |
| AI Copilot | `/college/copilot` |
| AI Interview Simulator | `/college/interview` |

---

## Local Setup

```bash
npm install

# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Apply migrations: 001 -> 002 -> 003 (Supabase SQL editor)
npx tsx scripts/seed.ts
npx tsx scripts/create-demo-users.ts
npm run dev
```

## Vercel Deploy

1. Push to GitHub → import in Vercel
2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. After deploy: call `POST /api/admin/fix-realism` then `POST /api/admin/recompute-health`

---

## Database

35+ PostgreSQL tables with full Row-Level Security for 6 roles.
Key tables: `colleges` `students` `placement_records` `year_summaries` `programs` `cohorts` `enrollments` `mous` `fdp_sessions` `reports` `revenue_share` `communication_logs` `chat_rooms` `messages` `notifications` `workshop_requests` `seat_allocations` `activity_events` `college_health_history`

---

## Demo Data

- 25 colleges across Hyderabad/Telangana
- 2,500+ students (realistic readiness scores, risk levels, skills)
- KMIT real 9-year placement data (2017-18 → 2025-26): 148 companies, 702 offers, Rs.80L top
- Pre-loaded: pending approvals, expiring MOUs, notifications — ready Day 1

---

*Built for SummerSaaS Hackathon 2026 — Track 5B*
