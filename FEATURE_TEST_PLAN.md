# FEATURE_TEST_PLAN.md
## CareerOS Partner Intelligence Platform — Feature Test Plan
**Generated:** 2026-06-19 | **Deadline:** 2026-06-20 18:00 IST  
**Demo Password:** `careeros2026` (all accounts)

> **How to use this:** After `npm run dev` is running on localhost:3000, follow each test sequence in order. Mark pass/fail as you go. The "Observable Evidence" column describes what a judge would see.

---

## Pre-Test Setup Checklist

Before testing any feature, complete:
```
□ npm install — no errors
□ Create Supabase project (ap-south-1 recommended)
□ Create .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
□ Run 001_initial_schema.sql in SQL Editor
□ Run 002_rls_policies.sql in SQL Editor
□ Create 4 Storage buckets: mou-docs (private), college-logos (public), reports (private), certificates (private)
□ npm run db:seed — no errors
□ npm run create:users — no errors
□ npm run dev — app starts at localhost:3000
```

---

## Demo Accounts

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@careeros.ai` | careeros2026 | super_admin | All features |
| `am@careeros.ai` | careeros2026 | account_manager | College data |
| `tpo@kmit.ac.in` | careeros2026 | TPO (KMIT) | KMIT portal |
| `hod@kmit.ac.in` | careeros2026 | HOD (KMIT) | Students, Training |
| `tpo@vnrvjiet.ac.in` | careeros2026 | TPO (VNRVJIET) | VNRVJIET portal |

---

## M1 — College Partnership Management

**What it tests:** Colleges can register, admin can approve, college profile shows full data.

### Test Steps

1. Go to `localhost:3000` → click "Get Started" or navigate to `/signup`
2. Fill Step 1: College Name = "Test College", Code = "TC001", University = "Osmania", City = "Hyderabad", State = "Telangana", Type = "Engineering", check "CRT" partnership
3. Click "Continue →"
4. Fill Step 2: Name = "Dr. Test", Email = `test@tc001.edu`, Phone = `+91 9876543210`, Password = `testpass123`
5. Click "Submit Application"
6. Login as `admin@careeros.ai` / `careeros2026`
7. Go to `/admin/colleges?status=pending`
8. Find "Test College" → click "Approve"
9. Verify status changes to "approved"
10. Click into KMIT → verify full college profile page loads with stats

### Expected Result
- Signup form shows 2-step flow; Step 2 has back button
- Submission shows toast "Application submitted! You'll receive an email once approved."
- Admin sees pending college in `/admin/colleges?status=pending`
- "Approve" button turns college status to "approved" immediately (router.refresh)
- KMIT college detail shows: health score, placement rate, revenue history, activity timeline

### Observable Evidence
- URL: `/admin/colleges` shows table with status badges (green=approved, yellow=pending)
- KMIT page: `/admin/colleges/{kmit-id}` — health score ≥70 in green, placement rate %, MOU details card

**PASS / FAIL:**

---

## M2 — Student Roster Management

**What it tests:** TPO sees paginated student list, can filter by status and risk, can view student 360° profile.

### Test Steps

1. Login as `tpo@kmit.ac.in` / `careeros2026`
2. Navigate to `/college/students`
3. Observe: paginated table with 50 students per page, total count in header
4. Click "High Risk" filter — table updates to show only high-risk students
5. Click "Placed" filter — table updates to placed students
6. Click on any student name → goes to `/college/students/{id}`
7. Verify Student 360° page shows: header with scores, skills, training programs with progress bars, AI recommendation, activity timeline

### Expected Result
- Student table shows: Name, Roll No, Dept, Batch, CGPA, Readiness %, ATS Score, Placement Status, Risk badge, Skills
- Filters work via URL params: `/college/students?risk=high` shows only high-risk students
- Student 360° page has 4 AI score panels (Readiness, ATS Compatibility, Risk Signal, Profile Strength)
- AI Recommendation shows context-appropriate text based on student's data

### Observable Evidence
- Risk badges: red for high, yellow for medium, green for low
- Readiness progress bars fill proportionally to score
- Student detail URL: `/college/students/{uuid}`

**PASS / FAIL:**

---

## M3 — Training & Cohort Tracking

**What it tests:** Training programs displayed, cohort progress tracked, programs catalog visible.

### Test Steps

1. Login as `tpo@kmit.ac.in` / `careeros2026`
2. Navigate to `/college/training`
3. Observe: stats row (active cohorts, enrollments, completed, programs available)
4. Scroll to cohort table — verify progress bars show completion %
5. Scroll to "Programs Catalog" — cards with program name, code, duration, module count
6. Login as `admin@careeros.ai` → `/admin/training`
7. Verify cross-college cohort view with program code badges

### Expected Result
- `/college/training`: At least 3 cohorts for KMIT (CRT Batch 1, CRT Batch 2, FDP Integration)
- Progress bars show % completion for each cohort
- Programs Catalog: 5+ program cards (CRT-ADV, PLACEMENT-BOOST, etc.)
- Admin view: college code column shows "KMIT", "VNRVJIET" in table

### Observable Evidence
- Progress bars render inline in table
- Program codes shown as blue pill badges
- Completion % displayed next to each progress bar

**PASS / FAIL:**

---

## M4 — Placement Records & Analytics

**What it tests:** Year-wise placement data, company breakdown, cross-college leaderboard.

### Test Steps

1. Login as `tpo@kmit.ac.in` → `/college/placements`
2. Verify year summary stats row (Companies, Offers, Avg Package, Top Package, Top Company)
3. Click "Recruiters" tab — verify company aggregation view appears
4. Check "Repeat recruiter" badge appears for companies hiring 3+ years
5. Use year dropdown to switch to "2024-25" — data updates
6. Login as admin → `/admin/placements`
7. Verify college leaderboard (ranked by offers) and top companies table

### Expected Result
- KMIT placements 2025-26: Microsoft, Google, Infosys, TCS visible
- Recruiter tab: companies sorted by total hires; promtal-sourced companies show blue "promtal" badge
- Year selector navigates without full page reload
- Admin leaderboard: table with rank, college, offers, avg LPA, top LPA

### Observable Evidence
- `promtal` badge on Promtal-sourced placements
- `🥇🥈🥉` medals in top 3 of admin leaderboard
- Year stat cards update when year changes

**PASS / FAIL:**

---

## M5 — MOU Management

**What it tests:** Active MOU displayed with full details, document upload works, admin sees all MOUs.

### Test Steps

1. Login as `tpo@kmit.ac.in` → `/college/mou`
2. Verify active MOU card shows status, expiry, seats, revenue share %, accrued amount
3. Check the VNRVJIET MOU should show "expiring" status with yellow banner
4. Click "Upload MOU" → modal opens → select a PDF file → click Upload → toast appears
5. Login as admin → `/admin/mous`
6. Verify alert banner for expiring MOUs
7. Filter by "expiring" — table shows only expiring MOUs

### Expected Result
- KMIT MOU card: green border (active), shows expiry date, 20% revenue share
- VNRVJIET MOU card: yellow border with alert icon (expiring status)
- Upload modal accepts PDF/DOCX; shows filename after selection
- Admin MOU table: shows "Time Left" column with color-coded days (red if <7 days)

### Observable Evidence
- Green border on active MOU, yellow on expiring
- `formatDaysUntil()` output in "Time Left" column (e.g., "45 days left" in green)
- Seats column shows "X/Y" format

**PASS / FAIL:**

---

## M6 — FDP Session Management

**What it tests:** TPO can schedule FDP sessions, sessions appear in list with attendance tracking.

### Test Steps

1. Login as `tpo@kmit.ac.in` → `/college/fdp`
2. Verify stats row: total sessions, completed, upcoming, faculty count
3. Click "Schedule FDP" → modal opens
4. Fill: Title = "AI for Educators", Speaker = "Dr. Ravi", Topic (dropdown), Date = tomorrow, Mode = "online", Capacity = 30
5. Click "Schedule" → toast "FDP session scheduled"
6. Verify new session appears in table with status "scheduled"
7. Login as admin → `/admin/fdp` — verify cross-college FDP view

### Expected Result
- Seeded sessions visible (at least 4 per college from seed)
- New session appears immediately after scheduling
- Progress bar shows registered/capacity ratio
- Mode shown as colored badge (blue=online, green=offline, purple=hybrid)
- Admin view shows all colleges with their FDP sessions

### Observable Evidence
- Activity event logged: "FDP scheduled: AI for Educators" appears in dashboard activity
- Capacity bar: `0/30` shows empty progress bar
- College code column in admin view

**PASS / FAIL:**

---

## M7 — Report Generation

**What it tests:** 4 report types can be generated, reports appear in history table with AI summary.

### Test Steps

1. Login as `tpo@kmit.ac.in` → `/college/reports`
2. Click "Generate" under "Placement Report"
3. Observe button shows "Generating…" while loading
4. Toast appears "Placement Report generated! Refreshing…"
5. Report appears in "Generated Reports" table with status "ready"
6. Repeat for "Executive Summary" report
7. Login as admin → `/admin/reports` — verify reports appear in cross-college view

### Expected Result
- 4 report type cards visible: Placement, Training, Revenue, Executive Summary
- Generate button shows loading state
- Report appears with: title, type badge (e.g., "placement"), date, status "ready"
- Download column shows "Processing…" (PDF not implemented — known)
- API route `/api/reports/generate` called; `ai_summary` field populated in DB

### Observable Evidence
- Reports table shows generated report with current date
- Type shown as primary-colored pill badge
- Status badge: green "ready" after generation

**PASS / FAIL:**

---

## M8 — Revenue Share Tracking

**What it tests:** Revenue share by quarter visible, payout approval workflow works.

### Test Steps

1. Login as `tpo@kmit.ac.in` → `/college/revenue`
2. Verify 4 stat cards: Accrued Total, Pending Payout, Paid Out, Gross Revenue
3. Check quarterly table: periods, gross, share %, share amount, status
4. Check payout history table below
5. Check seat utilization bar at bottom
6. Login as admin → `/admin/revenue`
7. Find a payout with status "pending" → click "Approve"
8. Status changes to "paid" with approval date

### Expected Result
- KMIT: Accrued total ~₹2-5L visible; multiple quarter rows in table
- Share amounts correctly calculated (gross × share_pct / 100)
- Seat utilization: progress bar shows seats_used / seats_purchased
- Admin: payout approval changes status to "paid" and sets `approved_at` timestamp

### Observable Evidence
- Green badge on "paid" rows, yellow on "pending"
- `Approve` button disappears after approval (status updated)
- Amount in ₹ Lakhs format (₹X.XXL)

**PASS / FAIL:**

---

## M9 — Communication Logging

**What it tests:** TPO can log communications (notes/meetings/calls), admin sees all comms.

### Test Steps

1. Login as `tpo@kmit.ac.in` → `/college/comms`
2. Verify existing logs in timeline (notes, meetings, calls from seed)
3. Click "Log Communication" → modal opens
4. Select Type = "meeting", fill Subject = "Q2 Review", Notes = "Discussed placement targets"
5. Set Next Meeting to tomorrow's date
6. Click "Log" → toast appears, entry added to timeline
7. Login as admin → `/admin/comms` → verify KMIT entry visible

### Expected Result
- Existing timeline shows icon (note/meeting/call), subject, body, "By [name]", relative time
- New entry appears immediately with correct icon color (blue for meeting)
- "Next: [date]" shown in blue below the log entry
- Admin view shows college code badge before each entry

### Observable Evidence
- Timeline icons: StickyNote for note, Video for meeting, Phone for call
- Color coding: yellow=note, blue=meeting, green=call
- `formatRelative()` output: "Today", "Yesterday", "3 days ago"

**PASS / FAIL:**

---

## M10 — Notification System

**What it tests:** Notifications delivered to users, mark-as-read works, admin broadcast sends to all.

### Test Steps

1. Login as `tpo@kmit.ac.in` → `/college/notifications`
2. Verify notifications list: title, body, type, timestamp
3. Unread notifications show blue background + primary dot indicator
4. Click "Mark all read" → unread count in header disappears → blue backgrounds gone
5. Login as admin → `/admin/notifications`
6. Click "Broadcast" → modal opens
7. Fill: Title = "Platform Update", Message = "New features available", Type = general.announcement, Target = tpo
8. Click "Send" → toast "Notification sent to X users"
9. Login as TPO → check notifications → new notification appears at top

### Expected Result
- Unread notifications: `bg-primary/5` background, blue dot in header count
- Mark all read: updates `read: true` in DB for all user's notifications
- Broadcast: inserts notification rows for all users matching role filter
- New notification appears immediately on TPO's notifications page

### Observable Evidence
- Notification count badge in header (e.g., "3")
- Blue dot indicator next to unread notifications
- Broadcast sends to the count of matching users (shown in toast)

**PASS / FAIL:**

---

## M11 — Renewal Alerts & Automated Triggers

**What it tests:** Expiring MOUs flagged in dashboard, alerts visible, system triggers documented.

### Test Steps

1. Login as admin → `/admin` (dashboard)
2. Check "Expiring MOUs" widget in right sidebar
3. Verify VNRVJIET MOU appears with days-left countdown
4. Go to `/admin/mous?status=expiring`
5. Yellow banner: "X MOU(s) expiring within 30 days"
6. Days column shows red if <7 days, yellow if <30 days
7. Login as `tpo@vnrvjiet.ac.in` → `/college/mou`
8. Verify yellow border on active/expiring MOU card with "Request Renewal" button

### Expected Result
- Admin dashboard: expiring MOUs sidebar shows college code + expiry date + days left
- MOU table: "Time Left" column uses `formatDaysUntil()` with color coding
- VNRVJIET MOU card: yellow border, AlertTriangle icon, `status: 'expiring'`
- "Request Renewal" button is visible (action placeholder)

### Observable Evidence
- Yellow/red text on days-left column
- `⚠️` icon in admin MOU alert banner
- VNRVJIET MOU: yellow-bordered card vs KMIT's green-bordered card

**PASS / FAIL:**

---

## M12 — RBAC (Role-Based Access Control)

**What it tests:** Each role sees only their permitted pages; admin can manage users and roles.

### Test Steps

1. Login as `hod@kmit.ac.in` → verify sidebar ONLY shows: Dashboard, Students, Training (no FDP, MOU, Revenue, Comms)
2. Try accessing `/college/mou` directly → should redirect to `/college/dashboard` (403 via layout)
3. Login as admin → `/admin/users`
4. Verify users table with role badges
5. Click "Suspend" on a non-admin user → status changes to "deactivated"
6. Click "Activate" → status changes back to "active"
7. Click "Invite User" → modal opens → select role + college → "Send Invite"

### Expected Result
- HOD sidebar: 4 items max (Dashboard, Students, Training, possibly Benchmarking + Reports)
- Direct URL access to role-restricted pages redirects to dashboard
- Users table: role shown as primary badge (`TPO`, `HOD`, etc.)
- ToggleStatus: changes user status in DB; button label switches between "Suspend"/"Activate"
- Invite modal: calls `/api/users/invite` → admin invite email sent via Supabase

### Observable Evidence
- HOD cannot see `Revenue`, `MOU`, `Comms` in sidebar
- User status badge changes from `active` (green) → `deactivated` (red) after suspend
- Invite: toast "Invite sent to [email]"

**PASS / FAIL:**

---

## M13 — Analytics & Reporting Dashboard

**What it tests:** Admin analytics leaderboard with health scores, metrics, performance bands.

### Test Steps

1. Login as admin → `/admin/analytics`
2. Verify 4 summary stats: Partner Colleges, Avg Health Score, Total Placements 25-26, Platform Revenue
3. Verify leaderboard table sorted by health score descending
4. Top 3 have 🥇🥈🥉 medals; others show rank numbers
5. Health score progress bar fills to score %
6. Check 3 performance bands at bottom: High/Average/Needs Attention with counts

### Expected Result
- Leaderboard: 25 colleges sorted by health_score descending
- KMIT (health 82) should appear near top; low-performing colleges at bottom
- Medals for top 3; `#4`, `#5` etc. for others
- Green bars for health ≥70, yellow for 45-69, red for <45
- Performance bands: counts per band (e.g., 8 High, 12 Average, 5 Needs Attention)

### Observable Evidence
- `bg-green-500`, `bg-yellow-500`, `bg-red-500` bar colors match health score
- Placement rate shown in parentheses after offer count
- Revenue shown as ₹X.XL

**PASS / FAIL:**

---

## M14 — Admin Control Panel

**What it tests:** Admin has full visibility across all colleges, settings page shows platform config.

### Test Steps

1. Login as admin → verify 14-item sidebar (all admin modules)
2. `/admin` dashboard: stats grid (Partner Colleges, Total Students, Placement Rate, Colleges At Risk)
3. College health table: lowest 6 health scores listed with colored bars
4. Recent activity feed: last 8 events across all colleges
5. Pending college approval banner (if Test College from M1 is still pending)
6. Navigate to `/admin/settings` — verify notification integrations and scheduled jobs listed

### Expected Result
- Admin dashboard shows aggregate counts across all 25 seeded colleges
- Health table: 6 lowest-scoring colleges listed (ordered ascending by health_score)
- Activity feed shows events with college code + date
- Yellow banner appears when colleges are in `pending` status
- Settings page: Telegram, Email listed as integrations; 3 scheduled jobs documented

### Observable Evidence
- Stats cards: "Partner Colleges" count = ~25, "Colleges At Risk" = colleges with health <50
- Health progress bars in table (width = health_score %)
- Pending banner: "X college(s) awaiting approval" → "Review Now" button links to `/admin/colleges?status=pending`

**PASS / FAIL:**

---

## M15 — College Health Score & Intelligence

**What it tests:** Health scores computed, history tracked, scores drive dashboard visuals.

### Test Steps

1. Login as admin → `/admin/colleges`
2. Health column shows score with color (green/yellow/red) and `calcHealthLabel()`
3. Click KMIT → `/admin/colleges/{id}` → large health score display (top right corner)
4. Login as `tpo@kmit.ac.in` → `/college/benchmarking`
5. Verify percentile banner (top X% of partner colleges)
6. 4 metric comparison bars: Health Score, Placement Offers, Avg CTC, Training Completion
7. Each bar shows: My college (colored), Partner Average (gray), Top 10% (light blue)

### Expected Result
- KMIT health score: ≥80 (seeded)
- Percentile calculation: based on how many colleges have higher health_score
- Benchmarking bars are proportional (my score vs avg vs top10%)
- "Above average" or "Below average" badge per metric
- Gap note shown for below-average metrics: "Gap to average: X.X"

### Observable Evidence
- Health score 82 → green text, "Healthy" label
- Percentile banner: green (≥75th), yellow (50-75th), red (<50th)
- Progress bars: 3 parallel bars per metric in different colors/shades

**PASS / FAIL:**

---

## Good-to-Have Features

### G1 — Benchmarking (implemented as M15 college view)
**Test:** `/college/benchmarking` — covered in M15 above. ✅

### G4 — Student 360° Dashboard
**Test:** `/college/students/{id}` — covered in M2 above. ✅  
**Extra check:** AI Recommendation section shows personalized text based on risk level and readiness score.

### G7 — Promtal Recruiter Integration
**Test steps:**
1. Login as TPO → `/college/placements`
2. Click "Recruiters" tab
3. Look for companies with "promtal" source
4. Verify "promtal" badge (blue) vs "direct" badge (gray)
5. Verify Promtal-sourced companies have company data

**Expected:** At least some companies show `source: 'promtal'` (seeded in placement_records).

**PASS / FAIL:**

### G8 — Analytics Leaderboard
**Test:** `/admin/analytics` — covered in M13 above. ✅

---

## Critical Happy Path (Minimum Demo Flow)

For a condensed judge demo (10 minutes), follow this path:

```
1. Login as admin → dashboard (M14)
2. Show college health leaderboard → click KMIT → full profile (M15, M1)
3. Admin → /admin/students → filter "high risk" (M2)
4. Admin → /admin/placements → leaderboard (M4)
5. Login as TPO (KMIT) → dashboard
6. TPO → /college/students/{id} → Student 360° (M2, M4)
7. TPO → /college/training → cohort progress (M3)
8. TPO → /college/reports → generate Executive Summary (M7)
9. TPO → /college/benchmarking → percentile view (G1, M15)
10. Admin → /admin/notifications → Broadcast (M10)
```

---

## Known Test Limitations

| Feature | Limitation | Demo Workaround |
|---------|-----------|-----------------|
| PDF Download | Always "Processing…" (no PDF renderer) | Show AI summary content; explain PDF requires Supabase Storage setup |
| Student "Add Student" | Button has no action | Explain CSV import; show existing seeded roster |
| College search input | Cosmetic (server component) | Use status filter links which work correctly |
| Email notifications | No Resend key configured | In-app notification center works; show broadcast |
| Telegram alerts | No bot token configured | Show UI notification; explain real-time alert design |
| MOU "Request Renewal" | Button is a placeholder | Show expiring MOU alert banner + days countdown |
