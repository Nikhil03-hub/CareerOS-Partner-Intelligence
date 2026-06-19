# 07 · Build Status + Handoff to Sonnet 4.6

> **Audience:** Sonnet 4.6 (the builder) + the team. **Author:** Opus (planning/audit).
> **Purpose:** an evidence-based snapshot of what is *actually* built in the teammate's deployed app, reconciled against our `01–06` design docs, plus the exact prioritized worklist to finish a winning Track 5B submission.
> **Verified:** 2026-06-19 by reading the real code on disk (`backend/`, `frontend/src/`), the teammate's PRD + test creds, and hitting the live API (`/api/health` → ok; `/api/public/landing-stats` → 9 years of real KMIT data).

---

## 0. READ THIS FIRST — three decisions that override parts of docs 01–06

1. **STACK CHANGED. We are NOT on Next.js + Supabase.** The teammate already built and deployed a substantial app on **React 18 (CRA) + FastAPI + MongoDB** (scaffolded via Emergent). With the finale due **Sat 20 Jun 6 PM**, rebuilding on our planned stack is off the table. ✅ **Decision: continue on the existing FastAPI/Mongo/React codebase.** Docs `01–06` remain the **feature + 5B-framing + AI + demo spec**; their *Supabase/Next.js implementation details are superseded* (see §3).
2. **PERSISTENCE IS THE #1 RISK.** Production runs on an **in-memory `MemoryDB`** because `MONGO_URL` is not set in Vercel — data **reseeds on every cold start** and anything a judge creates can vanish. This violates PDF Rule #3 ("real, working database… persist after refresh"). ✅ **Decision: wiring MongoDB Atlas is P0, before any new feature.**
3. **KEEP THE EXISTING ROLES; FILL 5B CONCEPTS FUNCTIONALLY.** The app's roles are `super_admin, institution_admin, tpo, faculty, student, recruiter` — not our planned `account_manager/hod/club_coord`. Renaming now is risky and low-value. ✅ **Decision: keep them.** Treat **super_admin/platform = "Skill Tank"**; add the missing 5B *features* (revenue share, comm log, FDP, renewal alerts) onto the existing roles rather than restructuring auth.

---

## 1. What actually exists (verified)

- **Live:** `https://pacio-two.vercel.app` — confirmed up. `/api/health` → `{"status":"ok","service":"careeros-v2"}`.
- **Repo:** `Manju10092006/Pacio` (cloned into our folder; coexists with our `docs/`). App name in code: **"CareerOS – Campus Intelligence."**
- **Stack:** React 18 CRA (react-router 6, Tailwind, Recharts, lucide, sonner, GSAP, axios) · FastAPI (bcrypt sessions, RBAC, ReportLab PDFs, SendGrid+Telegram, optional Emergent LLM, in-process websockets) · MongoDB via Motor **or** `MemoryDB` fallback · single Vercel project (FastAPI serves the SPA).
- **Backend size:** `server.py` 1,278 lines, 58 API routes, `seed_data.py` 574 lines.
- **Real data, already rich (great for judging):** 9 academic years of **real KMIT placements** (2017-18→2025-26: 2025-26 = 148 companies / 702 offers / ₹8.26L avg / **₹80L top, Amazon**), real top-recruiter table (TCS 463 selects … Google ₹54.5L), 470 students, 6 institutions, 19 Striver-A2Z DSA topics (455 problems), aptitude, ATS, ~70 jobs, ~880 applications.

> Bottom line: this is **well past "7 features to some extent."** ~10 of 15 mandatory are functionally done, plus a large bonus layer. The job now is **gap-filling + hardening**, not building from zero.

---

## 2. Live status flags
| Check | Result |
|---|---|
| Site live | ✅ |
| `/api/health` | ✅ ok |
| Landing stats API | ✅ 9 years real KMIT data |
| **Data persistence** | ❌ **in-memory (resets on cold start)** — P0 fix |
| Email (SendGrid) | ⚠️ key wired, sender identity unverified → currently `failed/simulated` |
| Telegram | ⚠️ infra present, token/chat not live → `simulated` |
| OAuth (Google/Emergent) | ⚠️ optional; password login works |

---

## 3. How to read docs 01–06 now (reconciliation)

| Doc | Status under the real stack |
|---|---|
| `01_ARCHITECTURE` | **Concepts apply** (event-driven thinking, RBAC, multi-tenant scoping, seeding, triggers). **Implementation superseded:** Postgres tables → **Mongo collections** (already defined in `seed_data.py`); RLS → FastAPI `require_roles()` + institution-scoping (already present); Edge Functions → FastAPI routes + `notification_service.py`. Use it as the *data-model & flow reference*, not literal SQL. |
| `02_MANDATORY_FEATURES` | **Fully applies as the feature spec + acceptance criteria.** Map each M# to the existing routes/pages (see §4). The "add-ons" are still the bar to hit. |
| `03_GOOD_TO_HAVE` | **Applies as spec** for the 10 good-to-have. Several are in the teammate's own P2 backlog already. |
| `04_AI_INTELLIGENCE_LAYER` | **Applies as spec.** Note the app ALREADY has ATS scoring + interview AI + DSA/aptitude intelligence — strong *inputs* for our College Health Score / Placement Prediction / TPO Copilot. Build those on top. |
| `05_PREMIUM_ENHANCEMENTS` | Applies as the post-mandatory backlog. |
| `06_WORK_DIVISION` | Timeline + git workflow still useful; ownership areas re-map to the real folders. |

**One-line instruction for Sonnet:** *"Follow docs 02/03/04 for WHAT each feature must do and the 5B framing; implement everything in the existing FastAPI + React + Mongo codebase, matching its current patterns. Ignore the Next.js/Supabase specifics in doc 01."*

---

## 4. Verified inventory — 15 MANDATORY (Track 5B)

Legend: ✅ Done · 🟡 Partial · ❌ Missing. "Lives in" = real files/routes.

| # | Mandatory feature | Status | Lives in / evidence | Gap vs our spec (what Sonnet must do) |
|---|---|:--:|---|---|
| **M1** | College/TPO signup + admin approval | ✅ | `/api/signup`, `/api/admin/pending-signups`, `/api/admin/approve|reject`, `OnboardingPending.jsx`, `AdminPanel.jsx`; `account_approved` notify wired | Solid. Just confirm approval email/Telegram go **live** after P0/trigger fix. |
| **M2** | College profile (university, depts, partnership type) | ✅ | `CollegeProfile.jsx`, `/api/institutions/{id}` GET/PATCH, `/departments`; `partnership_types` seeded | Add logo upload if missing (needed for co-branded reports G5). |
| **M3** | Student roster management | ✅ | `StudentRoster.jsx`, `/api/students` GET/POST, `/students/{id}` | Confirm add-student **persists** (post-Mongo). |
| **M4** | Program/cohort tracking | ✅ | `Cohorts.jsx`, `/api/cohorts`, `/api/training/completion`, `enrollments` | Fine. |
| **M5** | Placement outcomes dashboard | ✅ | `Outcomes.jsx`, `/api/placements/overview` (year summaries, top recruiters, dept breakdown, rate) — **real KMIT data** | Strong. Add **Placement Funnel** (our M5 add-on) for wow. |
| **M6** | Training completion tracking | ✅ | `Training.jsx`, `/api/training/completion` | Fine. |
| **M7** | MOU document management | ✅ | `MOU.jsx`, `/api/mou`, `/mou/upload`, `/mou/download`, GridFS, `expires_on` + `days_until_renewal` computed | Good. Feeds M13. |
| **M8** | **FDP scheduling + attendance** | ❌ | FDP exists only as a *program type* + partnership type + announcement kind in `seed_data.py` — **no FDP session/attendance route or page** (interview scheduling is unrelated) | **BUILD:** faculty list + FDP **sessions** (speaker/topic/date/capacity) + **attendance** marking + analytics; `fdp.scheduled` notify; seed ~30 sessions. New `/api/fdp/*`, `FDP.jsx`. *Hint: reuse the existing cohort/scheduling patterns.* |
| **M9** | Reports (PDF/CSV) | ✅ | `reports.py`, `Reports.jsx` — placement/training/department PDF + students/applications/placements CSV | Add **AI Executive Summary** header (doc 04) + **co-brand logo** (G5). Wire `report.generated` notify. |
| **M10** | **Revenue-share visibility** | 🟡 | `revenue_share_pct: 18.0` seeded; "Estimated MRR" proxy on `PlatformControl.jsx`; landing/MOU copy mentions revenue — **no real accrued-share + payout module** | **BUILD:** dedicated revenue page: accrued share by period + payout status; `/api/revenue` route; seed `revenue_share` + `payouts`. |
| **M11** | **Communication log w/ account manager** | ❌ | `comm_log` collection named in arch but **no route/page**; no account-manager role | **BUILD:** TPO↔Skill Tank notes/meeting log; `/api/comm-log` GET/POST; `CommLog.jsx`; seed entries. (super_admin acts as Skill Tank AM.) |
| **M12** | Multi-user access per college (RBAC) | ✅ | `TeamInvites.jsx`, `/api/invite`, `/api/institution/users`, `require_roles()`, 6 roles, faculty dept-scoping | Solid. |
| **M13** | **Renewal/expiry alerts** | 🟡 | `days_until_renewal` shown in MOU; **no proactive alert trigger** | **BUILD:** scan (startup job or `/api/mou/check-renewals` + dashboard banner) emitting notifications at 30/15/7 days → `mou_renewal_due` event (ties to M14). |
| **M14** | **Automated triggers (Email + Telegram)** | 🟡 | `notification_service.py` real (SendGrid+Telegram); wired events = signup, announcement, **mou_uploaded**, account_approved, interview_scheduled, invite | **GAPS:** (a) make it **live** (verify SendGrid sender + real Telegram token/chat — flip simulated→sent); (b) wire the **4 PDF-mandated 5B events**: *new placement confirmed, FDP scheduled, report ready, MOU renewal due*. |
| **M15** | Central admin panel | ✅ | `PlatformControl.jsx`, `AdminPanel.jsx`, `/api/admin/*` (stats, colleges, approvals, notifications) | Add **audit log** view (doc 01) + **Executive Command Center** tiles + demo-reset button. |

**Mandatory scorecard: 10 ✅ · 3 🟡 (M10/M13/M14) · 2 ❌ (M8/M11).** Closing M8, M10, M11, M13, M14 = a complete 15/15.

---

## 5. Verified inventory — 10 GOOD-TO-HAVE (Track 5B)

| # | Feature | Status | Notes |
|---|---|:--:|---|
| **G1** | Benchmarking (anonymized cross-college) | ❌ | In teammate's P2 backlog. High judge value — build after mandatory. |
| **G2** | TPO ↔ account-manager chat | ❌ | P2 backlog. |
| **G3** | Workshop/event request flow | ❌ | Not present. |
| **G4** | Student 360° drill-down | 🟡 | `/api/students/{id}` returns enrollments+applications; student detail exists. Enrich with **Placement Journey timeline** + readiness/risk + AI scores (doc 04). |
| **G5** | Co-branded report templates | ❌ | P2 backlog; needs logo on PDFs. |
| **G6** | Automated digest (weekly/monthly) | ❌ | P2 backlog; needs a cron/scheduled call. |
| **G7** | Promtal hiring view (companies hired from college) | 🟡 | Top-recruiters + placements-by-company exist (`/placements/overview`, `Recruiters.jsx`). Add a college-scoped "Recruiters who hired from us" tab to fully satisfy. |
| **G8** | College leaderboard (admin) | 🟡 | DSA/student leaderboard exists; admin **college** ranking (placements/completion/health) not explicit. |
| **G9** | MOU e-signature | ❌ | P2 backlog (click-to-accept is acceptable). |
| **G10** | Seat/budget tracking | 🟡 | "seat utilization" referenced in copy/seed; no real module. |

**Good-to-have scorecard: 0 fully ✅ · 4 🟡 (G4/G7/G8/G10 partial) · 6 ❌.** Several are quick given existing data.

---

## 6. BONUS already built (beyond our 25 — keep, it's a strength)

The teammate added a whole intelligence/recruitment layer that overlaps Track 5 (LMS) and Track 6 (Promtal). **Frame these in the demo as "bonus intelligence modules on top of the 5B partner dashboard."**
- **DSA Intelligence** (Striver A2Z tracker, student + institution + leaderboard, `/api/dsa/*`)
- **Aptitude Intelligence** (`/api/aptitude/intelligence`)
- **Resume ATS scoring** with PDF text extraction + AI/deterministic fallback (`/api/ats/*`)
- **Interview Intelligence + AI feedback** (`/api/interviews/*`, `ai_service.py`)
- **Interview scheduling + `.ics` calendar invites** (auto-advances application stage)
- **Application pipeline** (Kanban stages) + **WebSocket live events** (`/ws/live`)
- **Jobs/drives** + **Recruiter console** + **Talent pool** (CGPA-filtered)
- **Student personal workspace** · **Announcements broadcast** · **Google/Emergent OAuth**

> These are excellent **inputs** for our AI layer: DSA + aptitude + ATS + attendance → **Placement Prediction / Student Risk / College Health Score** (doc 04) become cheap because the data already exists.

---

## 7. Sonnet's prioritized worklist (do in this order)

> Gate: don't start a tier until the previous is green **on the live URL with persistence on**.

### 🔴 P0 — submission-blocking (do first, today)
1. **MongoDB persistence.** Create a free **MongoDB Atlas M0** cluster → set `MONGO_URL` + `DB_NAME=careeros` in Vercel → redeploy. **Verify:** create a student/MOU, refresh, redeploy, data survives. *(Fixes PDF Rule #3.)*
2. **Make comms triggers LIVE + complete (M14).** Verify SendGrid sender identity (flip `failed→sent`); set real `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (flip `simulated→sent`). Then **wire the 4 mandated events**: placement confirmed, FDP scheduled, report ready, MOU renewal due. Show every send in the admin notification log with a live/simulated flag.

### 🟠 P1 — complete all 15 mandatory
3. **M8 FDP module** — routes + page + attendance + `fdp.scheduled` notify + seed.
4. **M10 Revenue-share module** — accrued share by period + payout status + route + seed.
5. **M11 Communication log** — TPO↔Skill Tank notes/meetings + route + page + seed.
6. **M13 Renewal/expiry alerts** — proactive notifications at 30/15/7 days + dashboard banner (uses existing `days_until_renewal`).
7. **M9/M15 polish** — AI Exec Summary on reports; admin **audit log** + **Executive Command Center** tiles + **one-click demo reset** endpoint.

### 🟡 P2 — good-to-have (after 15/15 green) — by judge impact
8. **G1 Benchmarking** (anonymized) · **College Health Score gauge** (doc 04 AI-1 — our standout, cheap given data) · **G7** college-scoped recruiters tab · **G8** college leaderboard.
9. **G4 Student 360°** enrichment (Placement Journey timeline + readiness/risk) · **G6** weekly digest · **G5** co-branded PDFs · **G2** TPO↔AM chat · **G9** MOU e-sign (click-to-accept) · **G3** workshop request · **G10** seat tracking.

### 🟢 P3 — AI differentiators (doc 04) if time remains
10. **TPO Copilot** (NL → run query / generate report) · **Placement Prediction / Student Risk** (reuse DSA+aptitude+ATS+attendance — data exists) · **Opportunity Radar** · **AI Exec Summary** everywhere.

### Always
11. **README for submission** — feature-checklist mapping (use §4/§5 tables), test creds (§9), env vars; **demo video** (script in doc 04 §10, adapted); confirm seed loads on Mongo; responsive + no Lorem ipsum + no dead links.

---

## 8. Rules of engagement for Sonnet (how to work on this codebase)

- **Additive, not destructive.** ~10 mandatory features already work — **do not refactor or "improve" working code** unless fixing a bug. Match existing patterns in `server.py`, `seed_data.py`, `pages/*.jsx`, `roleConfig.js`.
- **New feature = same 4 touch-points** the codebase already uses: (1) add Mongo collection + entries in `seed_data.py`; (2) add FastAPI route(s) in `server.py` with `require_roles()`/institution-scoping; (3) add a page in `frontend/src/pages/` + nav entry in `layouts/roleConfig.js`; (4) wire a `notify(...)` call if it's a trigger event.
- **Persistence-safe:** after P0, ensure new collections seed idempotently and CRUD persists.
- **Don't break the build:** `CI=true npm run build` must pass (no unused imports/lint fails — this already bit the teammate). Test FastAPI import + key routes after each change.
- **Keep notifications non-blocking** and always log (live or simulated) so the admin panel proves the trigger fired.
- **Frame everything as Track 5B** in copy/README/demo: "Skill Tank College/TPO Partner Dashboard" + bonus intelligence — so judges see a focused 5B answer, not scope drift.
- **Split `server.py`** into routers only if safe; otherwise leave it (1,278 lines works) — don't risk a big refactor near the deadline.

---

## 9. Reference — credentials, repo, env

**Test logins** (password `careeros2026`): `admin@careeros.app` (super_admin) · `institution@kmit.in` (institution_admin) · `tpo@kmit.in` (tpo) · `faculty@kmit.in` (faculty, CSE-scoped) · `student@kmit.in` (student) · `recruiter@amazon.com` (recruiter) · `tpo@vasavi.ac.in` (pending — tests approval gate).

**Env vars to set in Vercel (P0/P1):** `MONGO_URL`, `DB_NAME`, `ADMIN_PASSWORD` (rotate from default), `SENDGRID_API_KEY` + `SENDER_EMAIL` (verified sender), `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, optionally `EMERGENT_LLM_KEY`/`EMERGENT_AUTH_URL`.

**Key files:** `backend/server.py` (routes), `backend/seed_data.py` (data), `backend/notification_service.py` (triggers), `backend/reports.py` (PDF/CSV), `backend/ai_service.py` (ATS/interview AI), `frontend/src/layouts/roleConfig.js` (nav), `frontend/src/pages/*`.

---

## 10. TL;DR for the team
- Teammate's app is **strong and live** — ~10/15 mandatory done + big bonus layer + real KMIT data. Don't rebuild.
- **Fix persistence (Mongo) and make triggers live first** — these are the only true submission blockers.
- **Build the 5 mandatory gaps** (FDP, revenue share, comm log, renewal alerts, the 4 trigger events) → 15/15.
- **Then** add benchmarking + College Health Score + Student 360° + the AI Copilot for the win.
- Hand Sonnet **this doc + docs 02/03/04**; tell it: *build in the existing FastAPI/React/Mongo app, ignore doc 01's Supabase specifics.*
