# 08 · Continuation Build Guidance for Sonnet 4.6

> **Author:** Opus (planning/audit). **Builder:** Sonnet 4.6. **Status date:** 2026-06-19. **Deadline:** 2026-06-20 18:00.
> **What this is:** the single prioritized worklist to take the current **Next.js 14 + Supabase** build from "19/25 features, ~8.4/10, runs locally" to "deployed, operational, judge-winning." Pair this with `01–05` (architecture + feature specs) and `09_UI_UX_GUIDANCE.md` (design). Doc `07` (continue-on-FastAPI) is **obsolete** — we rebuilt on Next.js+Supabase, which is the correct, final stack.

---

## 0. Where we are (verified 2026-06-19)

- **Stack:** Next.js 14 App Router + Supabase (Postgres + Auth + RLS + Storage) + Tailwind. ✅ correct target stack.
- **Built:** all **15 mandatory + 4 good-to-have** (G1 benchmarking, G4 Student 360°, G7 recruiters, G8 leaderboard) = **19/25**. 33 routes, 2 migrations, RLS for 6 roles, 2 edge functions, seed + demo-user scripts.
- **DB:** live Supabase project, seeded — 25 colleges, 119 departments, **3,650 students**, 22 companies, 7 programs, 36 cohorts, 4,002 enrollments, KMIT real placements (2017→2026), MOUs (several expiring), revenue, FDP, comms, AI insights, benchmark snapshots, activity events. Auth users for all 6 roles created.
- **Runs:** `npm run dev` works (localhost:3000, all routes compile). Build was iteratively fixed (config, tailwind theme, TS strict, env-guards).
- **External verdict (ChatGPT):** 8.4/10. Strong architecture/DB/business relevance; weak on AI depth, empty/read-only pages, and PDF/notifications.

**Two framing rules for the whole push:**
1. **Operational > informational.** Judges reward *actions that change data*, not just dashboards. Every "view" page needs at least one real action.
2. **Believable > big.** The data volume is already plenty. Now make it *realistic* (see §3) and *interactive*.

---

## 1. 🔴 P0 — Blockers & bugs (fix first, today)

These break the demo or the PDF's hard rules. Nothing else matters until these are green.

| # | Issue | Evidence | Fix |
|---|---|---|---|
| P0-1 | **Confirm `npm run build` passes clean** | Build was fixed error-by-error; last blocker was static-gen env guard | Run `npm run build` locally; fix any remaining TS/lint; do **not** ship with build errors. |
| P0-2 | **Deploy the NEW app to Vercel** | `pacio-two.vercel.app` is the *teammate's old FastAPI app*, NOT this one. New repo: `CareerOS-Partner-Intelligence`. The Next.js app appears local-only | Deploy to Vercel; set the 3 Supabase env vars in Vercel; get a **public URL** (PDF Rule #2). This is the #1 submission requirement. |
| P0-3 | **`/admin/colleges` shows "No colleges found"** while 25 exist | ChatGPT verdict + admin dashboard *does* list colleges, so the colleges *page* query/filter is the bug | Likely a status filter excluding all, a broken `defaultValue` search input, or anon-vs-service-role client. Make the page render all 25 with working status filters. |
| P0-4 | **Student Readiness = 100% for everyone; Risk = "low" for everyone ("0 high-risk")** | `/admin/students` screenshot — every row 100% / low | **Seed + compute fix.** Readiness must vary (≈30–98), risk must spread (e.g., ~15% high, ~30% medium, ~55% low). An all-ready, zero-risk roster makes the AI look fake — judges *will* notice. See §3 + §4. |
| P0-5 | **Storage buckets missing** | KNOWN_ISSUES | Create `mou-docs` (private), `college-logos` (public), `reports` (private), `certificates` (private) in Supabase → else MOU/logo/report uploads fail. |
| P0-6 | **Empty pages: Reports, Notifications, Users** | ChatGPT scored 4/10, 4/10, 5/10 | These must show real records + work (see §2). A visibly empty page reads as "broken" to judges. |
| P0-7 | **Data persists after refresh** (PDF Rule #3) | — | Verify: create a record (MOU/FDP/comm), refresh, redeploy — it survives. (Supabase guarantees this; just confirm no mock state.) |

> **Definition of "demo-ready":** public Vercel URL, all 6 roles log in, every nav page shows seeded data (no empty/▢), at least one working write action per major module, and the data looks believable.

---

## 2. 🟠 P1 — Make it operational (convert read-only → real workflows)

ChatGPT's sharpest point: *"many pages display data; add actions so the platform becomes operational instead of informational."* Wire these real actions (most have a button stub already):

| Module | Action to make real | Notes |
|---|---|---|
| Colleges (admin) | **Approve / Reject / Suspend** | Approve exists (M1) — verify it flips status + sends notification + writes activity_event. Add Reject (with reason) + Suspend. |
| Students | **Add Student** (modal → insert) | Button is currently a no-op. Wire a real insert form (name, roll, dept, batch, CGPA) → persists → appears in roster. Also a **CSV bulk import** if time (high "real-world" signal). |
| MOU | **Renew MOU** | Sets new expiry, writes `mou_renewals` + `mou.renewed` event + notification. Pairs with renewal alerts (M13). |
| FDP | **Schedule FDP** (exists) + **Mark Attendance** | Verify schedule persists + fires `fdp.scheduled` notification; add attendance marking. |
| Reports | **Generate → real downloadable PDF** | Currently `file_url=null` ("Processing…"). PDF lib was removed from deps. **Re-add a generator** (e.g. `@react-pdf/renderer`, or server route with `pdf-lib`/HTML-to-PDF) → upload to `reports` bucket → set `file_url` → download works. Keep the AI summary header. |
| Notifications | **Real send + populated list** | Broadcast inserts in-app notifications (works). Add **live Email (Resend) + Telegram** sends so the 4 mandated events (placement confirmed, FDP scheduled, report ready, MOU renewal due) actually deliver. Show every send in the list with channel + status. |
| Revenue | **Approve Payout** (exists) | Verify it flips status → paid + event + notification. |
| Comms | **Log Communication** (exists) | Verify insert persists + shows in timeline both sides. |
| Users (RBAC) | **Populate + Invite + Toggle** | Page looked empty — ensure it lists all app users (join `users` table) with role + college + status; Invite via the service-role API route (already added); Toggle active/deactivated. |

**M14 live triggers (do once, reuse everywhere):** get one channel working end-to-end first — **Telegram bot** is the fastest free live channel (create bot via @BotFather, set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`), then **Resend** for email (verify a sender). Deploy the `notify-dispatch` + `renewal-cron` edge functions via `supabase functions deploy`. If a live key truly can't be set, keep the in-app + logged "simulated" path (clearly labeled in the admin notifications list) — but live scores higher.

---

## 3. 🟠 P1 — Data realism pass (cheap, high credibility)

The seed volume is great; the *distributions* betray it. Fix these in `scripts/seed.ts` (and recompute), then re-seed:

- **Readiness score:** currently 100% for all → make it a realistic spread (e.g., normal-ish 35–98, mean ~68). Derive from CGPA + DSA + aptitude + training (see §4 formula) so it's *consistent* with other fields.
- **Risk level:** currently all "low" → derive from readiness (`<40 high`, `40–69 medium`, `≥70 low`); aim ~15% high / 30% medium / 55% low.
- **Completion %:** ChatGPT saw some `0%` cohorts → ensure every cohort has a believable 40–95% and per-student progress varies.
- **Health scores:** spread 55–95 with a few genuine "at-risk" (<50) — not a cluster. (Dashboard sorts worst-first, which is fine, but the pool should vary.)
- **Cohort start dates / placement dates:** vary them (not all `19 Feb 2026`) for believable timelines.
- **Admin students list:** showed only 150 of 3,650 — add pagination or a clear "showing N of 3,650" with search, so it doesn't look truncated.

> Add a **`scripts/refresh-demo-data.ts`** (ChatGPT's idea) that recomputes readiness, risk, completion %, health scores and benchmark snapshots from the raw data in one command — also doubles as your **one-click demo reset** before judging.

---

## 4. 🟡 P2 — Real AI (the single biggest score lever)

ChatGPT and our `04_AI_INTELLIGENCE_LAYER.md` agree: the AI is currently mostly seeded labels. Make 3 engines *compute* live from the data (rule-based; deterministic; reuse Module-2 math — see §6). Each writes to `ai_insights` and renders with a "How this was computed" tooltip (transparency = credibility).

1. **Placement Predictor (per student)** — the marquee feature.
   ```
   probability = 0.25·attendance + 0.25·training_completion + 0.20·assessment
               + 0.15·dsa_or_mock + 0.15·cgpa_norm           // 0–100%
   risk: <40 High · 40–69 Medium · ≥70 Low
   expected_package ≈ map(probability, dept, recruiter_bands from KMIT data)
   recommended_skills = top gaps (e.g., DSA, SQL, Aptitude)
   ```
   Surface on Student 360° + a "students likely to remain unplaced" admin list. Output: *"Placement probability 84% · Expected ₹8.5 LPA · Improve: DSA, Aptitude."*
2. **College Health Score (compute, not seed)** — recompute the 0–100 from placement %, training completion, FDP, engagement, revenue, renewal (weights in `01`/`04`). Store history → trend line + benchmarking.
3. **Renewal Risk (per MOU/college)** — from placements delivered + engagement + revenue + days-to-expiry → Green/Amber/Red verdict on the MOU card.
4. **AI Executive Summary** — rule-based narrative on each report + dashboard ("insight of the week"). Optionally enrich with an LLM later (Gemini/Claude/OpenAI), gated behind a flag with the rule-based result as fallback so the demo never breaks.
5. **(Stretch) TPO Copilot** — NL box that runs a few canned intents ("show at-risk AIML students", "generate placement report"). High wow; build only if 1–4 are done.

> Keep all AI **deterministic + cached in `ai_insights`** so the demo is instant and never depends on a live API call.

---

## 5. 🟡 P2 — Finish the good-to-have (6 remaining)

From `03_GOOD_TO_HAVE_FEATURES.md`; schema/tables already exist for most. Priority order for judging impact:

1. **G6 Automated digest** — weekly/monthly summary email via `digest-cron` (reuses report + AI summary). Demo by triggering the cron manually.
2. **G2 TPO ↔ Account-Manager chat** — `chat_rooms`/`messages` tables exist; add a simple realtime thread (Supabase Realtime).
3. **G9 MOU e-signature** — `mous.esign_status` exists; add a click-to-accept flow (typed name + timestamp) → regenerate MOU PDF with a signature block.
4. **G3 Workshop request** — `workshop_requests` exists; add request form (TPO/club) + admin approve → notification.
5. **G10 Seat tracking** — `seat_allocations`; show purchased/used/remaining on programs; decrement on enroll.
6. **G5 Co-branded reports** — inject college logo (from `college-logos`) into the report PDF header. (Depends on P1 PDF generator.)

---

## 6. 🟡 P2 — Reuse from Module 2 (CareerOS AI) — VERIFIED ENGINE MAP

> ✅ **Folder connected + inspected by Opus:** `C:\Users\NIKHIL\OneDrive\ドキュメント\Claude Projects\CareerOS AI\CareerOS-AI` (bash: `/sessions/.../mnt/CareerOS-AI`). It's a real multi-service repo (Node/Express backends + an optional Python ML microservice + a JS client) with **production-quality engines to PORT, not rebuild.**
>
> **Your friend's "rough estimate" table IS the reuse inventory** — those 9 engines (70-90% done) map 1:1 to our AI gap (§4). Porting them is how we turn "AI = seeded labels" into "AI = real, computed, explainable." Don't copy files wholesale; lift the logic into the Next.js app (`lib/ai/*` + a couple of API routes).

| Engine (friend's %) | Module-2 source (verified path) | Purpose in Module 3 (5B) | How to port |
|---|---|---|---|
| **ATS Intelligence** (70-80%) ⭐ | `resume-server/controllers/atsController.js` + `utils/extractResumeText.js` + `eng.traineddata` — **100% local, no API keys**: PDF/DOCX/TXT + image **OCR** text extract; rule-based 0-100 score; ~150-skill DB; section/contact detection; **strengths / weaknesses / suggestions (skill-gap)** | **Student 360° real ATS score + skill-gap → "recommended skills"**; an input to Placement Predictor. Converts the seeded `ats_score` into a real, explainable feature. | Port `analyzeResumeText()` + `extractResumeText()` into `POST /api/ats/analyze` (or `lib/ai/ats.ts`); drop the Express `req/res` wrapper. The Python ML job-match call is optional/non-blocking — skip for demo. **Highest-value, lowest-risk port.** |
| **Readiness Engine** (80-90%) | `guidance/scoring-engine.js` — `calcScores()`: weighted inputs → normalize → clamp (46-96) with transparent per-factor contribution | The math **pattern** for **Student Readiness**, **Placement Predictor**, **College Health Score** (§4) | Copy the weight→normalize→clamp pattern into `lib/ai/score.ts`; swap inputs to attendance/training/DSA/aptitude/CGPA. Keep the "why" breakdown (judges love transparency). |
| **Placement Intelligence** (75-85%) | scoring-engine pattern + `server/controllers/dashboardController.js` | **Placement Predictor** — probability % + expected package + recommended skills (the marquee AI, §4.1) | Apply the readiness pattern; map probability→package using the **real KMIT recruiter bands** already seeded in Supabase. |
| **DSA** (80%) / **Aptitude** (70-80%) | `skill-test/` + client DSA logic | Inputs to readiness/prediction + the bonus DSA/aptitude dashboards | Reuse scoring-per-topic logic; data already seeded. |
| **Interview Intelligence** (70-80%) | `interview-prep/` | Student 360° "interview readiness" + a **"View AI Interview" bridge** (continuity standout) | Surface a readiness sub-score; optionally link/embed the Module-2 interview flow if time. |
| **Recruiter Intelligence** (70-80%) | `jobs/`, `api/jobs/*` (Jooble API), `client/src/components/find-jobs.js`, server match-jobs routes | **G7 recruiters / Promtal view** + "companies hiring" matching | Mostly covered by G7; reuse match logic only if time. |
| **Analytics Engine** (85%) | `server/controllers/dashboardController.js` | Cross-college analytics/leaderboard (already strong) | Reference for aggregation patterns; largely done. |
| **Reports Engine** (80%) | resume/report-history logic | M9 PDF reports (§2) | Reference; real gap is the PDF binary — re-add a PDF lib. |

**Do these two ports (biggest score lever, lowest risk):**
1. **ATS engine → `POST /api/ats/analyze`** — real resume upload → score + skill gap on Student 360°. Already 100% local + rule-based, so no keys/latency risk.
2. **Scoring-engine pattern → Placement Predictor + College Health Score** — genuine *computed* AI that kills the "AI is just seeded labels" critique (§4).

> Also reusable: `docs/design-system.md` + `DESIGN.md` (Inter + blue `#3B82F6` — aligns with `09_UI_UX`) and the roadmap/timeline UI for the **Placement Journey**. Note provenance in code comments — it reinforces the "we evolved CareerOS, not built a one-off" judging story.

---

## 7. 🟢 P3 — Premium / additional features (full confirmed catalog)

> ✅ **Confirmed — this is the complete premium set** (consolidated from `05_PREMIUM_ENHANCEMENTS.md`). Build only after P0–P2 are green; order = judging ROI. Many are partially enabled by tables already in the schema.

**Tier 1 — highest ROI, do first if time allows**
1. **Global Search (⌘K)** — search students/colleges/placements/MOUs/FDP/reports from one bar. Instantly "enterprise."
2. **Account-Manager portfolio cockpit** — cross-college view for the `account_manager` role: renewal pipeline (days-to-expiry × health), at-risk accounts, revenue, "who to contact this week." The B2B operator's screen.
3. **CSV bulk import** — students/placements/enrollments via upload → validate → commit. Real-world usability signal.
4. **Workflow Engine** — the flagship: trigger → condition → ordered actions (e.g., *MOU expiring → notify TPO+AM → generate renewal report → create task*). 2-3 prebuilt rules demoed live = automation maturity.
5. **Anomaly detection** — auto-flag metric drops ("CRT completion dropped 11% this month") as Opportunity-Radar cards + notifications.

**Tier 2 — strong polish**
6. **Data Quality Engine** — flag missing email/dept, duplicates, MOUs without docs; admin "data health" page.
7. **Department Analytics (full)** — CSE/AIML/ECE/EEE compare on placement %, completion %, attendance, package (HOD's primary screen).
8. **Report Scheduler (full)** — choose report type + cadence + recipients + channel (extends G6 digest).
9. **Dashboard customization** — per-user card show/hide, persisted.
10. **Partnership Review Deck export** — one-click branded quarterly review (health trend, placements, training, FDP, revenue, AI summary) formatted like a board doc.

**Tier 3 — fast wins / future**
11. **Quick Actions panel** (Add Student / Generate Report / Schedule FDP / Add Placement shortcuts).
12. **Saved views / filter persistence.**
13. **Public REST API + inbound webhooks** (Promtal pushes placements, Saasum CRM pushes leads) — the cross-track "ecosystem" story.
14. **What-if scenario simulator** (+2 FDPs / +10% completion → projected health & placements).
15. **Google SSO + optional 2FA** (Supabase supports OAuth out of the box).
16. **Hindi (i18n) + PWA install** (inclusive + mobile, matches CareerOS roadmap).
17. **Notification template editor** (admin edits Email/Telegram templates with variables).
18. **SLA / responsiveness metric** for account managers (time-to-first-response on TPO messages).

> These push the product from "great hackathon project" toward "real SaaS." **None of these is mandatory** — never let a premium item delay deploy, the 15 mandatory, the data-realism fix, or real AI.

---

## 8. Submission checklist (PDF §14 — must all be true)

- [ ] Public **Vercel URL** (new app), homepage loads without login
- [ ] **Admin URL + credentials** documented (`admin@careeros.app` / `careeros2026`)
- [ ] **Repo** accessible to organisers (`CareerOS-Partner-Intelligence`)
- [ ] **README**: stack, setup, env vars, **feature→file map** (use `FEATURE_STATUS.md`)
- [ ] **One login per role** (6 roles) listed
- [ ] **Seeded data confirmed** (re-run seed; no empty pages)
- [ ] **Demo video 5–7 min** (script in `04 §10`, adapted to real routes)
- [ ] **Good-to-have list** stated separately (currently G1, G4, G7, G8 + whatever you add)
- [ ] **Live Email + Telegram** triggers demonstrated (or labeled-simulated fallback in admin)
- [ ] Responsive + no Lorem ipsum + no dead links + no empty states

---

## 9. Recommended sequence for the remaining time

```
NOW → P0: build passes → deploy to Vercel → buckets → fix /admin/colleges empty → fix readiness/risk seed → verify persistence
THEN → P1: real actions (Add Student, Renew MOU, Reports PDF, live notifications, Users page) + data-realism pass
THEN → P2: Placement Predictor + Health Score compute + Renewal Risk + AI Exec Summary  (reuse Module 2)
THEN → P2: G6, G2, G9 (then G3, G10, G5 if time)
FREEZE (~3h before deadline) → QA all 6 roles + every page → record demo video → finalize README → re-test public URL → submit
P3 premium only if everything above is green.
```

> **If you must cut:** cut P3 and lower good-to-have — never a mandatory, never the deploy, never the data-realism fix. A believable, operational 19–21 feature app beats a sprawling half-real one.

---

## 10. Rules of engagement
- **Additive, not destructive** — 19 features work; fix bugs, don't refactor working pages.
- **Match existing patterns** (server components for reads, client `*Button.tsx` for writes, `(r as any)` for joins, the shadcn-style tokens). Generate `database.types.ts` (`supabase gen types`) to kill `as any` if time.
- **Every new write** → also write an `activity_events` row (timeline/audit) and fire a notification if it's a trigger event.
- **Keep build green** after every change (`npm run build`).
- **Cache AI in `ai_insights`**; never block a page on a live LLM call.
- **Pause and ask the user** before spending time on real-world data collection — the seeded data is already sufficient (ChatGPT: data layer ~92% complete).

→ Design/UI upgrades: see `09_UI_UX_GUIDANCE.md`.
