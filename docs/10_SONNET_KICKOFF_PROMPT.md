# 10 · Master Kickoff Prompt for the Sonnet 4.6 Build Chat

> **How to use this file:** open a fresh chat with Sonnet 4.6 in this project, attach docs `01`–`09` + `FEATURE_STATUS.md` + `KNOWN_ISSUES.md`, and **paste everything below the line** as your first message. It orients Sonnet to the full story, every source + exact path, the priority order, and the rules. Edit the bracketed bits if anything changed.

---

=== PASTE FROM HERE ===

You are **Sonnet 4.6, the lead builder** finishing a **production-grade B2B SaaS for the SummerSaaS Hackathon 2026 finale, Track 5B (Skill Tank College/TPO Partner Dashboard)**. **Deadline: Saturday 20 June 2026, 6:00 PM.** The PDF rules say *incomplete or non-deployed submissions are not evaluated* — so deploying a working, believable product matters more than adding features. Opus 4.8 did the planning/audit; you do the building. Work carefully, additively, and keep the build green.

## 1. The story so far (context)
- This is **Module 3** of our hackathon journey. Module 2 was **CareerOS AI** (an AI career-guidance product). Module 3 evolves it into the **"CareerOS Partner Intelligence Platform"** — the continuity story ("we evolved a product") is a key differentiator.
- A teammate first built a reference app ("Pacio") on React/FastAPI/MongoDB. We then **cleanly rebuilt on our target stack: Next.js 14 (App Router) + Supabase (Postgres + Auth + RLS + Storage) + Tailwind.** That rebuild is the project you're continuing. (The teammate's stack is reference-only; ignore it.)
- Current grade from two external reviews (ChatGPT): **~8.6/10**. The jump to 9.2–9.5 comes from **making the existing data generate believable intelligence** (health scores with breakdowns, benchmarks, reports, alerts) — **NOT** from adding more data.

## 2. Read these FIRST — all sources + EXACT paths

**Project root:** `C:\Users\NIKHIL\OneDrive\ドキュメント\Claude Projects\Career Guidance\skill-tank-partner-platform`

**Design + guidance docs (in `docs/`) — read in this order:**
- `docs/08_CONTINUATION_GUIDANCE.md` — **your master worklist** (P0→P3, the engine map, premium catalog). Start here.
- `docs/09_UI_UX_GUIDANCE.md` — the design system + per-screen polish (Linear/Stripe/Vercel/Relume grade).
- `docs/04_AI_INTELLIGENCE_LAYER.md` — the AI spec (health score, predictor, copilot, demo flow).
- `docs/01_ARCHITECTURE.md` — architecture + data model (concepts are source of truth; it predates the build so prefer the actual schema where they differ).
- `docs/02_MANDATORY_FEATURES.md` + `docs/03_GOOD_TO_HAVE_FEATURES.md` — feature specs + acceptance criteria.
- `docs/05_PREMIUM_ENHANCEMENTS.md` — premium/future catalog.
- `docs/07_BUILD_STATUS_AND_SONNET_HANDOFF.md` — **OBSOLETE** (it described continuing on FastAPI; we rebuilt on Next.js+Supabase). Ignore.

**Your own status docs (project root) — already written, keep them updated:**
`FEATURE_STATUS.md` (feature→file map), `KNOWN_ISSUES.md` (risk register + pre-deploy checklist), `ARCHITECTURE_COMPLIANCE.md`, `DATABASE_AUDIT.md`, `FEATURE_TEST_PLAN.md`, `BUILD_FIX_LOG.md`, `BUILD_VERIFICATION.md`, `DEPLOY.md`.

**Module 2 reuse repo (engines to PORT, not rebuild):** `C:\Users\NIKHIL\OneDrive\ドキュメント\Claude Projects\CareerOS AI\CareerOS-AI`
- ⭐ **ATS engine (100% local, no API keys):** `resume-server/controllers/atsController.js` + `resume-server/utils/extractResumeText.js` + `resume-server/eng.traineddata` (OCR). PDF/DOCX/TXT/image → rule-based 0-100 score + ~150-skill DB + strengths/weaknesses/**suggestions (skill gap)**.
- **Weighted scoring engine:** `guidance/scoring-engine.js` (`calcScores()` — weighted inputs → normalize → clamp, with transparent per-factor breakdown).
- Also: `skill-test/` (aptitude/DSA), `interview-prep/`, `jobs/` + `api/jobs/` (Jooble), `server/controllers/dashboardController.js` (analytics), `docs/design-system.md` + `DESIGN.md` (Inter + blue `#3B82F6`), `docs/careeros-code-map.md` (index of the repo).

**Live infra & accounts:**
- **Supabase:** project is live + seeded. Migrations: `supabase/migrations/001_initial_schema.sql`, `002_rls_policies.sql`. Seed: `scripts/seed.ts`, `scripts/create-demo-users.ts`. Edge functions: `supabase/functions/notify-dispatch/`, `renewal-cron/`. Storage buckets needed: `mou-docs` (private), `college-logos` (public), `reports` (private), `certificates` (private).
- **Repo:** `https://github.com/Nikhil03-hub/CareerOS-Partner-Intelligence.git`
- **Demo logins** (password `careeros2026`): `admin@careeros.app` (super_admin), `am@careeros.app` (account_manager), `tpo@kmit.edu` (TPO), `hod@kmit.edu`, `faculty@kmit.edu`, `club@kmit.edu`, `tpo@vnrvjiet.edu` (2nd college).
- ⚠️ **`https://pacio-two.vercel.app` is the teammate's OLD app — NOT this one.** This Next.js app needs its own fresh Vercel deployment.

**UI reference sites (target aesthetic — premium minimal):** Linear, Framer, Stripe, Notion, Vercel, Webflow, Raycast, **Relume (best)**, Shopify, Tailwind, Luma Labs. Translate via `docs/09`.

## 3. Verified current state (what's already done — don't rebuild it)
All **15 mandatory + 4 good-to-have (G1 benchmarking, G4 Student 360°, G7 recruiters, G8 leaderboard) = 19/25** are built. Live seeded Postgres (25 colleges, 119 depts, 3,650 students, real KMIT placements 2017-26, 36 cohorts, 4,002 enrollments, MOUs/FDP/revenue/comms/AI-insights/benchmarks). 6 roles + RLS. App runs on `npm run dev`. **Student 360° is already built** — do NOT re-prioritize it; just wire the ported ATS score into it (small effort).

## 4. PRIORITY ORDER (reconciled from Opus + ChatGPT — follow exactly)

**🔴 P0 — Deploy & integrity (today, before anything else):**
1. Confirm `npm run build` passes clean (fix any TS/lint; no `as any` band-aids beyond the existing join casts).
2. **Deploy THIS app to Vercel** + set the 3 Supabase env vars there → get a **public URL** (the #1 submission requirement).
3. Create the 4 Storage buckets (above).
4. Fix `/admin/colleges` showing "No colleges found" while 25 exist, and reconcile the **25-vs-22 college count** (status-filter logic).
5. **Fix seed realism** (judges WILL notice): every student currently shows **Readiness 100%** and **Risk = low**. Make readiness vary (~35–98) and risk spread (~15% high / 30% med / 55% low), derived from CGPA+DSA+aptitude+training; fix any 0% completion cohorts; vary cohort/placement dates.
6. Verify data **persists after refresh** (PDF Rule #3).

**🟠 P1 — The "intelligence" jump (biggest score lever — both reviewers agree):**
7. **AI College Health Score that COMPUTES + shows its BREAKDOWN** — not a seeded number. Show: Placement Rate · Training Completion · Communication Activity · MOU Status · FDP Participation · Revenue Contribution → weighted 0-100 with a visible "why" breakdown. (Reuse `guidance/scoring-engine.js` pattern.)
8. **Benchmarking** — KMIT vs Average / Top 5 / Similar colleges on placement % · avg package · completion · health (G1 exists; deepen it).
9. **Reports → real downloadable PDF** — re-add a PDF lib (it was removed from deps); generate Placement / College-Health / Quarterly-Partnership / Revenue reports with an **AI executive summary** + co-branded logo; upload to the `reports` bucket; make the download work (currently `file_url=null`).
10. **Notifications** — populate the page + real **alerts** (MOU expiring in N days, health dropped, completion <50%, new placement) + **live Email (Resend) + Telegram** (get one channel live end-to-end, reuse for the 4 mandated events). Show every send with channel + status.
11. **Real CRUD actions** on read-only pages: Add Student (modal→insert; the button is currently a no-op), Renew MOU, Approve/Reject/Suspend college, Approve Payout, Log Communication, Schedule FDP + Mark Attendance. Every write → `activity_events` row + a notification if it's a trigger event.

**🟡 P2 — Deeper AI + analytics (port the Module-2 engines):**
12. **Placement Predictor** (probability % + expected package from KMIT bands + recommended skills) — port `guidance/scoring-engine.js` pattern.
13. **Real ATS on Student 360°** — port `resume-server/controllers/atsController.js` → `POST /api/ats/analyze` (drop the Express wrapper; the Python ML call is optional). Real resume upload → score + skill-gap → recommended skills.
14. **Student Risk engine** (real), AI insight cards, **college comparison page**, **trend charts** (placement by year — you have 9 years of KMIT data), recruiter analytics.
15. Finish good-to-have by ROI: G6 digest, G2 chat, G9 MOU e-sign, G3 workshop request, G10 seat tracking, G5 co-branded reports.

**🟢 P3 — Polish & premium (only if P0–P2 green):**
16. UI polish per `docs/09` (global tokens + shared primitives FIRST, then 3 real charts, then landing), dark mode, mobile/responsive, subtle motion.
17. **Nightly refresh jobs** that recompute health scores, benchmarks, leaderboard, revenue summaries from the DB (ChatGPT's idea — also your one-click demo reset).
18. Premium features from `docs/08 §7` (Global Search ⌘K, Account-Manager cockpit, CSV bulk import, Workflow Engine, anomaly detection, …).

## 5. The two highest-value engine ports (do in P2)
- **ATS** → port `analyzeResumeText()` + `extractResumeText()` from `CareerOS-AI/resume-server/controllers/atsController.js` into a Next.js route `src/app/api/ats/analyze/route.ts`. 100% local + rule-based → no keys, no latency risk. Drives Student 360°.
- **Scoring** → port the weight→normalize→clamp pattern from `CareerOS-AI/guidance/scoring-engine.js` into `src/lib/ai/score.ts`; reuse for Health Score + Placement Predictor + Risk. Keep the transparent breakdown — it's what makes AI feel real.

## 6. DATA POLICY (important)
**Do NOT scrape or collect more data.** Both reviewers agree the data is ~92% sufficient (25 colleges, 3,650 students, real KMIT placements, 22 companies, 40 FDPs, 22 MOUs). Spend effort on **intelligence + polish**, not datasets. The only data work is: (a) fix the readiness/risk realism (P0-5), (b) add nightly refresh jobs (P3). **Pause and ask the user before any data collection.**
*Optional reference links (only for spot-checking realism — NOT required):* KMIT `https://kmit.in/placements/placement.php`, MGIT `https://mgit.ac.in/year-wise-placement/`, CVR `https://cvr.ac.in/home4/index.php/placements-2025/`, plus aggregators collegedunia.com / shiksha.com for VNRVJIET & CBIT stats.

## 7. Rules of engagement (don't break what works)
- **Additive, not destructive** — 19 features work; fix bugs, don't refactor working pages.
- **Match existing patterns:** server components for reads, client `*Button.tsx` for writes, `(r as any)` for Supabase joins, the shadcn-style CSS-variable theme. Generate `database.types.ts` (`supabase gen types`) if time.
- **Keep `npm run build` green after every change.** Report the exact error if it fails; fix one blocker at a time.
- **Every write** → also insert an `activity_events` row (timeline/audit) + fire a notification if it's a trigger event.
- **Cache AI outputs in `ai_insights`;** never block a page render on a live LLM call (rule-based first; LLM optional behind a flag with fallback).
- **No empty pages** — always render an EmptyState. **No Lorem ipsum, no dead links.** Responsive on mobile.
- **Frame everything as Track 5B** (Skill Tank College/TPO Partner Dashboard) in copy/README/demo; the extra intelligence modules are "bonus."

## 8. Submission checklist (PDF §14 — all must be true)
Public Vercel URL · admin URL + creds · repo accessible to organisers · README with stack + setup + env vars + **feature→file map** · one login per role (6) · seeded data confirmed (no empty pages) · **5–7 min demo video** · good-to-have list stated separately · **live Email + Telegram** demonstrated · responsive + no lorem/dead links.

## 9. Winning demo flow (rehearse; adapt from `docs/04 §10`)
Admin Command Center (KPIs) → approve a pending college (live email+Telegram) → login as TPO → College Health Score **with breakdown** → Placements + trend chart + funnel → Student 360° (real ATS + skill gap + journey) → Benchmarking (KMIT vs avg/top-5) → generate a Report PDF (AI summary) → MOU renewal alert → Admin notifications/audit → one-click demo reset.

## 10. How to work with me (the user)
- After **P0**, stop and confirm the build passes + the app is deployed before moving on.
- **Pause and ask me** before any data collection, any destructive change, or if a real-data source is genuinely needed.
- If a build error appears, paste the exact error and fix it before continuing.
- Bias toward **finishing + deploying + believable intelligence** over breadth. A polished, deployed 19–22 feature app beats a half-working 25.

=== END OF PROMPT ===

---

### Quick reference — priority reconciliation (Opus vs ChatGPT)
Both agree on: deploy, fix readiness/risk realism, real Health-Score breakdown, Benchmarking, Reports PDF, Notifications, don't collect more data. **Adjustment adopted from ChatGPT:** Student 360° is already built → it's *not* a priority (just wire the ported ATS score in); put the intelligence features (Health breakdown, Benchmarking, Reports, Notifications) at the top of P1. UI polish (`docs/09`) stays P3 — after the product is deployed and intelligent.
