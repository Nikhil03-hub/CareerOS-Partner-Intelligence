# 01 · End-to-End System & Data Architecture

> Skill Tank Partner Intelligence Platform — Track 5B.
> This is the master architecture. Every feature doc (`02`–`05`) references the tables, events and services defined here. Read this first.

---

## 1. Design philosophy — 4 principles that separate a winner from a CRUD app

ChatGPT's strongest advice was *"design around events, not pages."* We adopt it as the architectural spine:

1. **Event-driven core.** Every meaningful thing that happens (student enrolled, training completed, placed, MOU uploaded, report generated) is written once to a single `activity_events` table. From that one stream we derive **timelines, analytics, notifications, audit context, and AI inputs** — instead of recomputing each separately. This is the single highest-leverage decision in the whole design.
2. **Multi-tenant by row, not by UI.** A college only ever sees its own data because PostgreSQL **Row-Level Security (RLS)** enforces it at the database — not because the frontend hides a button. This is what makes it feel like real enterprise SaaS and is genuinely secure.
3. **College as a "digital twin."** A college is not a name + address; it is a living entity with a **Health Score** computed from placement, training, engagement, FDP and revenue signals. Dashboards become instantly understandable (green/amber/red).
4. **Intelligence is a swappable layer.** The AI layer reads from the event stream and writes `ai_insights`. It starts **rule-based** (always works in the demo) and can be upgraded to **LLM** without touching the rest of the system.

---

## 2. System architecture (high level)

```
                          ┌──────────────────────────────────────────┐
                          │                 BROWSER                    │
                          │  Next.js 14 (App Router) · TS · Tailwind   │
                          │  shadcn/ui · Recharts · @react-pdf         │
                          │  Role-aware dashboards (6 roles)            │
                          └───────────────┬────────────────────────────┘
                                          │  HTTPS (Supabase JS client + Server Actions)
                                          ▼
        ┌───────────────────────────────────────────────────────────────────────┐
        │                              SUPABASE                                   │
        │                                                                         │
        │  ┌──────────────┐   ┌───────────────┐   ┌────────────────────────────┐ │
        │  │  PostgreSQL  │   │  Auth (JWT)   │   │  Storage (buckets)         │ │
        │  │  + RLS       │   │  6 roles      │   │  mou-docs · logos · reports│ │
        │  │  (all data)  │   │               │   │  · certificates            │ │
        │  └──────┬───────┘   └───────────────┘   └────────────────────────────┘ │
        │         │                                                               │
        │         │ DB Webhooks / triggers on activity_events                     │
        │         ▼                                                               │
        │  ┌─────────────────────────── EDGE FUNCTIONS (Deno/TS) ──────────────┐ │
        │  │  • notify-dispatch   (Email + Telegram + in-app)                   │ │
        │  │  • renewal-cron      (daily MOU/term expiry scan)                  │ │
        │  │  • digest-cron       (weekly/monthly TPO digest)                   │ │
        │  │  • report-generate   (assemble PDF + AI summary)                   │ │
        │  │  • ai-insights       (health score, risk, prediction, copilot)     │ │
        │  └───────┬───────────────────────────┬──────────────────┬────────────┘ │
        └──────────┼───────────────────────────┼──────────────────┼──────────────┘
                   │                            │                  │
                   ▼                            ▼                  ▼
            ┌─────────────┐            ┌─────────────────┐   ┌──────────────────┐
            │  Resend     │            │  Telegram Bot   │   │  LLM API         │
            │  (Email)    │            │  API            │   │  (Gemini/Claude/ │
            │             │            │                 │   │   OpenAI) + rules│
            └─────────────┘            └─────────────────┘   └──────────────────┘

   Hosting:  Frontend → Vercel   |   Backend/DB/Functions → Supabase Cloud
```

**Request patterns**
- **Reads / simple writes** → Supabase JS client directly from React (RLS guarantees safety).
- **Privileged / multi-step writes** (approve college, generate report, run seed/demo-reset, dispatch notifications) → **Next.js Server Actions / Route Handlers** using the service-role key (never exposed to the browser).
- **Background / scheduled** (renewal scan, weekly digest) → **Supabase Edge Functions on cron**.

---

## 3. The event backbone — `activity_events`

One append-only table that powers five things at once.

```
activity_events
  id            uuid PK
  college_id    uuid  FK → colleges        (tenant key; indexed)
  entity_type   text  -- 'student'|'placement'|'fdp'|'mou'|'college'|'report'|'enrollment'|'revenue'
  entity_id     uuid  -- the row it refers to
  event_type    text  -- see catalog below
  actor_user_id uuid  FK → users (nullable for system events)
  title         text  -- human-readable, pre-rendered for fast timelines
  payload       jsonb -- event-specific detail (company, package, score, etc.)
  created_at    timestamptz default now()  (indexed)
```

**Event-type catalog (the lifecycle):**
`student.enrolled` → `training.started` → `training.module_completed` → `assessment.passed` → `mock_interview.completed` → `training.completed` → `placement.offered` → `placement.accepted` → `certificate.issued`; plus `college.applied` / `college.approved`, `mou.uploaded` / `mou.expiring` / `mou.renewed`, `fdp.scheduled` / `fdp.attended`, `report.generated`, `revenue.recorded` / `payout.processed`, `workshop.requested`.

**Derived consumers (all read from this one table):**

| Consumer | How it uses events |
|---|---|
| **Activity Timeline** (per student / college / MOU / FDP) | filter by `entity_type` + `entity_id`, order by `created_at` |
| **Notifications & triggers** | a DB webhook on insert routes specific `event_type`s to `notify-dispatch` |
| **Audit context** | who (`actor_user_id`) did what (`event_type`) when (`created_at`) |
| **Analytics / funnels** | aggregate counts of event types over time |
| **AI context** | the AI layer reads a student's/college's event history as features |

> This is the "unified activity stream" idea, made concrete. Build the writer helper `logEvent(...)` on day 1 and call it everywhere.

---

## 4. Full PostgreSQL data model

Grouped by domain module. All tables use **`uuid` primary keys**, `created_at`/`updated_at` timestamps, and a `college_id` tenant key where applicable (indexed). FKs omitted from prose for brevity but implied by `_id` columns.

### 4.1 Identity & tenancy
```
colleges(id, name, code, university, city, state, partnership_types text[],   -- {CRT,FDP,External Placement Partner,...}
         logo_url, status,            -- pending|approved|rejected|suspended
         health_score int,            -- 0..100 cached; history in college_health_history
         account_manager_id → users, seats_purchased int, created_at, updated_at)

departments(id, college_id, name, code)                                       -- CSE, AIML, ECE, EEE ...

users(id, auth_id → auth.users, college_id (nullable for Skill Tank staff),
      role,                          -- super_admin|account_manager|tpo|hod|faculty_coord|club_coord
      name, email, phone, department_id (nullable), status, created_at)

-- RBAC is role enum + RLS policies (see §6). A permissions table is optional (premium).
```

### 4.2 Students, programs, cohorts
```
students(id, college_id, department_id, name, email, phone, roll_no,
         batch_year, cgpa, gender, placement_status,                          -- unplaced|in_process|placed
         risk_level,                  -- low|medium|high  (AI-written)
         readiness_score int,         -- CareerOS AI score, 0..100
         created_at)

programs(id, name, type, description)                                         -- CRT, Interview Master, AI Bootcamp, FDP, Career OS
cohorts(id, program_id, college_id, name, start_date, end_date, status)
enrollments(id, student_id, cohort_id, program_id, status,                    -- enrolled|in_progress|completed|dropped
            progress_pct int, enrolled_at)
```

### 4.3 Training & assessment
```
training_progress(id, enrollment_id, student_id, module_name, completion_pct, last_activity_at)
attendance(id, subject_type, subject_id, cohort_id, date, present bool)        -- subject = student or faculty
assessments(id, student_id, cohort_id, name, score, max_score, passed bool, taken_at)
certificates(id, student_id, program_id, issued_at, file_url, co_branded bool) -- co_branded → good-to-have #5
```

### 4.4 Placements
```
companies(id, name, logo_url, sector)                                         -- Infosys, TCS, Accenture, ...
placements(id, student_id, college_id, department_id, company_id, job_role,
           package_lpa numeric, offer_date, type,                             -- on_campus|off_campus
           status,                    -- offered|accepted|joined
           source,                    -- 'skilltank'|'promtal' (cross-track ready, good-to-have #7)
           created_at)
```

### 4.5 MOU / partnership
```
mous(id, college_id, title, partnership_type, start_date, expiry_date, renewal_date,
     status,                          -- active|expiring|expired|renewed
     document_url, value numeric, esign_status,                               -- unsigned|sent|signed (good-to-have #9)
     created_at)
mou_renewals(id, mou_id, old_expiry, new_expiry, renewed_at, renewed_by)
```

### 4.6 FDP (Faculty Development Programme)
```
faculty(id, college_id, department_id, name, email, designation)
fdp_sessions(id, college_id, title, speaker, topic, date, start_time, end_time,
             mode, capacity, status)                                          -- scheduled|completed|cancelled
fdp_attendance(id, fdp_session_id, faculty_id, present bool, certificate_url)
```

### 4.7 Revenue share
```
revenue_share(id, college_id, period,                                         -- '2026-Q1' etc.
              gross_amount numeric, share_pct numeric, share_amount numeric,
              payout_status)                                                  -- pending|processing|paid
payouts(id, college_id, amount, status, requested_at, approved_at, approved_by)
seat_allocations(id, college_id, program_id, seats_purchased, seats_used)     -- good-to-have #10
```

### 4.8 Communication & notifications
```
communication_logs(id, college_id, account_manager_id, type,                  -- note|meeting|call   (Mandatory #11)
                    subject, body, created_by, created_at)
notifications(id, recipient_user_id, college_id, type, title, body,
              channels text[],         -- {email,telegram,in_app}
              status,                  -- queued|sent|failed
              read bool, event_id → activity_events, created_at)               -- powers Notification Center
notification_logs(id, notification_id, channel, provider_response, sent_at)    -- audit of every send (live vs simulated)
chat_rooms(id, college_id, account_manager_id, created_at)                     -- good-to-have #2
messages(id, chat_room_id, sender_user_id, body, attachment_url, read bool, created_at)
```

### 4.9 Reports, AI, governance
```
reports(id, college_id, type,                                                 -- placement|training|department|fdp|mou|quarterly
        period, generated_by, file_url, ai_summary text, created_at)           -- Download Center reads this
ai_insights(id, scope_type, scope_id,                                          -- scope = college|student|mou|department
            type,                     -- health_score|risk|placement_prediction|summary|recommendation|opportunity
            score numeric, label text, reasons jsonb, model text, generated_at)
college_health_history(id, college_id, score int, breakdown jsonb, captured_at) -- trend the health score
audit_logs(id, actor_user_id, action, entity_type, entity_id, before jsonb, after jsonb, ip, created_at)
workshop_requests(id, college_id, requested_by, kind,                          -- workshop|hackathon   (good-to-have #3)
                  topic, preferred_date, status, notes, created_at)
benchmark_snapshots(id, period, metric, avg_value, captured_at)                -- good-to-have #1 (anonymized averages)
```

### 4.10 Entity-relationship summary

```
colleges ─┬─< departments ─< students ─┬─< enrollments >─ cohorts >─ programs
          │                            ├─< training_progress
          │                            ├─< assessments / attendance / certificates
          │                            └─< placements >─ companies
          ├─< mous ─< mou_renewals
          ├─< faculty ─< fdp_attendance >─ fdp_sessions
          ├─< revenue_share / payouts / seat_allocations
          ├─< communication_logs / chat_rooms ─< messages
          ├─< reports / ai_insights / college_health_history
          └─< users (TPO, HOD, Faculty Coord, Club Coord)   [+ Skill Tank staff users have college_id = NULL]

activity_events  ←  written by ALL of the above (the spine)
audit_logs       ←  written by all privileged mutations
```

### 4.11 Feature → table map (quick reference)

| Mandatory # | Primary tables |
|---|---|
| 1 signup+approval | `users`, `colleges.status` |
| 2 college profile | `colleges`, `departments` |
| 3 student roster | `students` |
| 4 program/cohort | `programs`, `cohorts`, `enrollments` |
| 5 placements | `placements`, `companies` |
| 6 training completion | `enrollments`, `training_progress`, `assessments` |
| 7 MOU mgmt | `mous`, Storage `mou-docs` |
| 8 FDP | `faculty`, `fdp_sessions`, `fdp_attendance` |
| 9 reports | `reports`, Storage `reports` |
| 10 revenue share | `revenue_share`, `payouts` |
| 11 comms log | `communication_logs` |
| 12 multi-user RBAC | `users`, RLS policies |
| 13 renewal alerts | `mous` + `renewal-cron` + `notifications` |
| 14 comms triggers | `activity_events` → `notify-dispatch` → `notifications`/`notification_logs` |
| 15 admin panel | all tables (service-role views) + `audit_logs` |

---

## 5. The 6 roles & access matrix (Mandatory #12)

| Capability | Super Admin | Account Mgr | TPO | HOD | Faculty Coord | Club Coord |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Platform-wide data | ✅ | portfolio only | ❌ | ❌ | ❌ | ❌ |
| Approve/suspend colleges | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage own college roster | ✅ | ✅(assigned) | ✅ | dept only | ❌ | ❌ |
| Placements (view/add) | ✅ | ✅ | ✅ | dept only | view | view |
| Training analytics | ✅ | ✅ | ✅ | dept | ✅ | view |
| FDP scheduling | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| MOU manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Revenue share | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ✅ | dept | training | view |
| Workshop request | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comms log / chat | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Admin panel | ✅ | partial | ❌ | ❌ | ❌ | ❌ |
| Audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> **Role-specific dashboards** (premium enhancement, but cheap here): each role lands on a different default view computed from the same data — TPO sees placements; HOD sees department analytics; Faculty Coord sees training/FDP; Club Coord sees events.

---

## 6. Security & multi-tenancy (Row-Level Security)

RLS is enabled on every tenant table. Core policy pattern (pseudo-SQL):

```sql
-- College-scoped tables (students, placements, mous, ...):
USING ( college_id = auth_college_id()  OR  is_skilltank_staff() )

-- Department-scoped read for HOD:
USING ( college_id = auth_college_id()
        AND ( current_role() <> 'hod' OR department_id = auth_department_id() ) )

-- Skill Tank staff:
--   super_admin  → all rows
--   account_manager → rows where college.account_manager_id = auth.uid()
```

Helper SQL functions (`auth_college_id()`, `current_role()`, `is_skilltank_staff()`) read from the JWT claims / `users` row. The browser uses the **anon key** (RLS-restricted); only Server Actions / Edge Functions hold the **service-role key** for privileged operations (approvals, seeding, dispatch). Secrets live in Vercel/Supabase env vars and are never shipped to the client.

---

## 7. Communication-trigger architecture (Mandatory #14 + #13)

The PDF requires **live Email + (WhatsApp or Telegram)** on key events. Architecture:

```
 mutation (e.g. placement INSERT)
      │
      ├─ writes row  +  logEvent('placement.accepted')   → activity_events
      │
      ▼
 Supabase DB Webhook on activity_events (filtered to trigger-worthy event_types)
      │
      ▼
 Edge Function: notify-dispatch
      ├─ resolve recipients (TPO + account manager for that college)
      ├─ render template (per event_type)
      ├─ send Email via Resend            → notification_logs(channel='email', provider_response)
      ├─ send Telegram via Bot API        → notification_logs(channel='telegram', provider_response)
      └─ insert notifications(in_app)     → Notification Center bell
```

**The 4 PDF-mandated trigger events for 5B:** `placement.accepted` (new placement confirmed) · `fdp.scheduled` · `report.generated` (report ready) · `mou.expiring` (renewal due). Plus welcome/`college.approved`.

**Renewal/expiry alerts (Mandatory #13):** `renewal-cron` Edge Function runs daily, finds `mous` with `expiry_date` within 30/15/7 days, flips status to `expiring`, writes `mou.expiring` events → which flow through `notify-dispatch`.

**Live-vs-simulated:** triggers are **live** (real Resend + real Telegram). Every send is recorded in `notification_logs` and shown in the admin panel's **Communication Center**, with a clear `live`/`simulated` flag — satisfying the PDF's transparency requirement and scoring higher than a simulated-only log.

---

## 8. Storage buckets (Supabase Storage — replaces Cloudinary)

| Bucket | Holds | Access |
|---|---|---|
| `mou-docs` | uploaded MOU PDFs | college-scoped (signed URLs) |
| `college-logos` | logos for co-branded reports | public read |
| `reports` | generated report PDFs | college-scoped |
| `certificates` | issued certificates | student/college-scoped |

---

## 9. Seeding strategy (Rule 5 — the make-or-break for judging)

> *"NO EMPTY TABLES."* A single idempotent seed script (`scripts/seed.ts`, run via `npm run db:seed`) populates every table with believable data. Re-running it = **One-Click Demo Reset** (admin button calls the same routine).

**Seed volumes (tuned so every chart/funnel/leaderboard looks alive):**

| Entity | Count | Notes |
|---|---|---|
| Colleges | **25** | VNR, CVR, MREC, GNIT, CBIT, VJIT, Sreenidhi, Vasavi... mix of statuses (most approved, 2 pending for the approval demo) |
| Departments | ~4 per college | CSE, AIML, ECE, EEE |
| Students | **~2,500** | spread across colleges/depts/batches, realistic CGPA + risk distribution |
| Companies | ~20 | Infosys, TCS, Accenture, Wipro, Cognizant, Amazon... |
| Placements | **~1,200** | varied packages (3–28 LPA), dates across the year |
| Programs / cohorts | 5 / ~40 | CRT, Interview Master, AI Bootcamp, FDP, Career OS |
| Enrollments + progress | ~6,000 | varied completion % so training charts vary |
| FDP sessions / attendance | ~30 / ~600 | for heatmaps |
| MOUs | **~20** | **several expiring within 7–30 days** so renewal alerts + triggers fire live in the demo |
| Revenue share | per college/quarter | ~₹12L aggregate share for the command center |
| Communication logs, notifications, activity_events, ai_insights | thousands | so timelines, bell, and AI cards are full |

**Demo numbers the Executive Command Center will show on login:** 25 Colleges · ~2,500 Students · ~1,200 Placements · ~78% Completion · ~₹12L Revenue Share · 12 Active MOUs.

### Seed login accounts (submission requirement #5 — one per role)

| Role | Email | Notes |
|---|---|---|
| Super Admin | `superadmin@skilltank.dev` | full admin panel |
| Account Manager | `manager@skilltank.dev` | owns ~8 colleges |
| TPO | `tpo@vnrvjiet.dev` | rich college (VNR) for the demo |
| HOD | `hod.cse@vnrvjiet.dev` | CSE dept scope |
| Faculty Coordinator | `faculty@vnrvjiet.dev` | FDP scope |
| Club Coordinator | `club@vnrvjiet.dev` | workshop scope |

*(Passwords set in seed; documented in the final README, not committed as real secrets.)*

---

## 10. Repository structure (Next.js App Router)

```
skill-tank-partner-platform/
├── README.md
├── docs/                         ← these design docs
├── .env.example
├── package.json
├── scripts/
│   └── seed.ts                   ← seeds all tables + demo reset
├── supabase/
│   ├── migrations/               ← SQL schema (tables, RLS, indexes, webhooks)
│   └── functions/                ← Edge Functions
│       ├── notify-dispatch/
│       ├── renewal-cron/
│       ├── digest-cron/
│       ├── report-generate/
│       └── ai-insights/
├── src/
│   ├── app/
│   │   ├── (public)/             ← landing, signup, login   (SSR for SEO)
│   │   ├── (college)/college/    ← TPO/HOD/Faculty/Club dashboards
│   │   │   ├── dashboard/  students/  programs/  placements/
│   │   │   ├── training/  fdp/  mou/  reports/  revenue/
│   │   │   ├── comms/  team/  benchmarking/  workshops/  downloads/
│   │   │   └── students/[id]/    ← Student 360°
│   │   ├── admin/                ← central admin panel (super admin)
│   │   └── api/                  ← Route Handlers (privileged ops, telegram webhook)
│   ├── components/               ← shadcn/ui + shared (charts, timeline, health gauge,
│   │                               data-table w/ search+sort+filter+export, notif bell, global search)
│   ├── lib/
│   │   ├── supabase/             ← client + server helpers
│   │   ├── events.ts             ← logEvent() writer
│   │   ├── rbac.ts               ← role guards
│   │   ├── ai/                   ← scoring (ported from CareerOS) + LLM calls + fallbacks
│   │   └── pdf/                  ← report templates
│   └── styles/                   ← Tailwind theme (CareerOS palette: Inter, #3B82F6)
└── public/
```

---

## 11. Deployment topology

| Component | Where | Notes |
|---|---|---|
| Frontend (Next.js) | **Vercel** | auto HTTPS, public URL, PR previews |
| PostgreSQL + Auth + Storage | **Supabase Cloud** | the real database judges inspect |
| Edge Functions + crons | **Supabase** | triggers, renewal scan, digests, reports, AI |
| Email | **Resend** | verified sender domain |
| Telegram | **Bot API** | bot token in env; demo chat preconfigured |
| Secrets | Vercel + Supabase env | service-role + API keys server-only |

CI: GitHub → Vercel auto-deploy on push to `main`. Migrations + seed run against Supabase via `supabase db push` + `npm run db:seed`.

---

## 12. Performance & scale (designed for 1000 colleges even if we seed 25)

UUID keys · indexes on `college_id`, `created_at`, FKs, and `status` columns · **pagination + server-side filtering** on every list (the data-table component) · materialized/cached `health_score` (recomputed on event, not on read) · background jobs for crons/digests. This is what makes the "design for scale from day one" claim real and defensible to judges.

---

### → Next: `02_MANDATORY_FEATURES.md` (the 15 we must ship first).
