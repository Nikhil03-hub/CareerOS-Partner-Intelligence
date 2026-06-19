# 13 · Production-Grade Push — Master Guidance for Sonnet 4.6

> **Author:** Opus (audit/architecture). **For:** Sonnet 4.6. **Deadline:** 2026-06-20 18:00.
> **Mandate from the team:** make this a **real, production-grade SaaS** a jury inspects seriously — *not* a hackathon demo with placeholder/meta text. This doc = the complete push: fix the real bugs, harden for production ("can 100 colleges use this tomorrow?"), polish every present feature, build the remaining 10 good-to-have, add standout premium AI (reusing CareerOS AI), and lift UI to Linear/Vercel/Stripe grade.
> **Use with:** `03` (good-to-have specs), `04` (AI specs), `05` (premium), `09` (UI), `11`/`12` (the critical fixes — do those first).

## 0. The mindset (why we're at Production 6.5/10, not 9)
Production-ready ≠ more features. It means: **trustworthy, scalable, and consistent.** Every number must be explainable, every write must persist and validate, every role must be enforced, and **nothing on screen may reveal it's a hackathon build.** Feature-complete is ~8.7/10; production is ~6.5/10. This doc closes that gap. **Do NOT add new features until Phase 1 + 2 are green.**

---

## PHASE 1 — Apply pending fixes + RUN the scripts, then RE-VERIFY (first hour)

Several issues in the latest PDF (students at 100% readiness, health 42–59, colleges 0) are from **before** the pending fixes/scripts ran. Before doing anything new:
1. Apply `docs/12` (admin redirect-loop fix). Confirm `npm run build` passes.
2. **Run `/api/admin/fix-realism`** (Settings button) → students get realistic readiness (35–98) + risk spread (~15% high / 30% med / 55% low).
3. **Recompute health for all 25 colleges** (batch route) so `colleges.health_score` is the *computed* value everywhere (not 42–59 seed).
4. Reload and re-screenshot. Many items below may already be resolved — verify before "fixing" again.

---

## PHASE 2 — P0 BUGS (confirmed; fix with root causes)

### 2.1 🔴 "0 colleges" + "0 users" empty pages — ROOT CAUSE: swallowed query errors
Both `/admin/colleges/page.tsx` and `/admin/users/page.tsx` do `const { data } = await query` and **never read `error`.** When a query fails it silently renders "0" instead of throwing. **This is the bug pattern behind every mysterious empty page.**
- **Fix everywhere:** destructure and handle the error:
  ```ts
  const { data: colleges, error } = await query
  if (error) { console.error('colleges query', error); /* render an error/empty state, not a silent 0 */ }
  ```
- **Users page specific cause:** the select embeds `colleges(name, code)`. PostgREST only resolves that join if a **foreign key `users.college_id → colleges.id`** exists and is detectable. If the FK is missing/renamed, the whole query errors → `users` is null → "0 users." **Fix:** (a) confirm the FK exists in `001_initial_schema.sql` (`college_id uuid references colleges(id)`); if missing, add it; **or** (b) split into two queries (fetch users, fetch colleges, map in JS) to remove the join dependency. Verify the 7 demo users now render.
- **Colleges page:** the query itself is correct (service client, no filter on `all`). After the redirect-loop fix + reload it should show 25. If still 0, the surfaced `error` will tell you why (likely env/service-key in that route, or a stale build). **Never ship a page that shows 0 where data exists.**

### 2.2 🔴 Student realism (run fix-realism) + pagination
Students still show **Readiness 100% / Risk low / "0 high-risk."** Run `fix-realism` (Phase 1). Also the page shows only **150 of 3,650** — add real **pagination + server-side search/filter** (don't `.limit(150)` silently). A jury asking "you have 3,650 students but only 150 show?" is a bad look.

### 2.3 🔴 Health score realism + cross-page consistency
- Dashboard showed health 42–59 (seed) while Analytics showed avg 66 — **inconsistent.** After the batch recompute, every page must read the **same** computed `colleges.health_score`. One source of truth.
- **Cross-page number consistency (jury will notice):** "Partner Colleges = 22" on dashboard/analytics vs **25** seeded; "Platform Revenue ₹12.4L" on the landing mock vs **₹161.5L** on Analytics. Decide the real figures and make every surface agree. The landing's mock dashboard numbers must match (or be clearly a static product mock, not contradict the live app).

### 2.4 🔴 REMOVE all hackathon / deployment / meta text from the UI
The jury should see a **product**, not a submission. Scrub these from user-facing pages:
- Landing (`src/app/page.tsx`): the badge **"SummerSaaS Hackathon 2026 — Track 5B Finalist"**, the footer **"Built for SummerSaaS Hackathon 2026 — Track 5B"**, and the stat **"15 / Core Features / Fully implemented"** (that's meta, not a product metric — replace with e.g. "98% / Avg Placement Readiness" or "₹X Cr / Placements Tracked").
- **Exact occurrences found (remove/rewrite each):**
  - `src/app/page.tsx:31` — badge "SummerSaaS Hackathon 2026 — Track 5B Finalist" → replace with a product tagline (e.g. "Trusted by 25+ partner colleges").
  - `src/app/page.tsx:72` — stat "15 / Core Features / Fully implemented" → real metric (e.g. "89% / Avg Placement Readiness").
  - `src/app/page.tsx:89` — "15 mandatory features, 10 good-to-have features, all production-ready" → product copy.
  - `src/app/page.tsx:200` — footer "Built for SummerSaaS Hackathon 2026 — Track 5B" → "© 2026 Skill Tank · CareerOS Partner Intelligence".
  - `src/app/admin/settings/page.tsx:99-100` — "Deployment: Vercel" and "Edition: SummerSaaS 2026 Hackathon" → remove or replace with product/plan info.
  - `src/app/admin/settings/page.tsx:39-42` — "Demo Data Tools" heading → rename to "Data Management" (keep the function, lose the "demo" word).
  - **⭐ `src/app/admin/reports/GenerateReportButton.tsx:144` — the generated report PDF footer prints "Track 5B — SummerSaaS Hackathon 2026". Jurors DOWNLOAD these reports — this is the worst leak. Change the footer to a neutral product line (e.g. "CareerOS Partner Intelligence · Confidential").**
- Re-run `grep -rniE "hackathon|summersaas|vercel|mandatory|fully implemented|demo data" src/` after editing → expect **zero** jury-visible hits.
- Keep the dashboard mock URL (`careeros.skill-tank.com`) — that reads as a product domain (good).

---

## PHASE 3 — PRODUCTION HARDENING ("can 100 colleges use this tomorrow?")

This is the 6.5→8.8 jump. Address each layer.

### 3.1 Auth / RBAC enforcement — test matrix (security)
Verify (not assume) every role is **enforced at the DB+route level**, not just hidden in nav:
- TPO/HOD/Faculty/Club logged in → directly visiting `/admin`, `/admin/revenue`, `/admin/users` must **redirect/403**, not render. (Layout role check handles redirect; also confirm RLS blocks their data reads.)
- TPO of College A must **never** read College B's students/MOU/revenue (RLS on `college_id`). Test by logging in as `tpo@kmit.edu` and attempting a query for VNRVJIET data.
- Account Manager scope = assigned colleges only.
- Document the result as a small matrix in the README (role × resource × allowed?).

### 3.2 Database integrity (the "trust" layer)
- **Foreign keys** on every `*_id` (students.college_id, placements.college_id, mous.college_id, users.college_id, enrollments.*). Confirm in `001_initial_schema.sql`.
- **Cascade rules:** decide what happens when a college is deleted/suspended → its students, MOUs, revenue, FDP, placements. Use `on delete cascade` or `on delete restrict` deliberately (restrict + "suspend instead of delete" is safer for a partnership platform).
- **Constraints (prevent garbage):** `seats_used <= seats_purchased`, `revenue_share_pct between 0 and 100`, `cgpa between 0 and 10`, `readiness_score between 0 and 100`, MOU `expiry_date > start_date`. Add `CHECK` constraints.
- **Indexes** on `college_id`, `status`, `created_at`, and any column used in filters/sorts — so 100 colleges × thousands of rows stay fast.

### 3.3 CRUD completeness (close ChatGPT's gaps)
Every core entity needs full lifecycle, not just read:
- **Colleges:** create/approve/**reject**/**suspend**/edit (approve exists; add reject+suspend+edit).
- **Students:** add (exists)/edit/archive + **CSV bulk import** (scale).
- **Training:** **Add Program / Edit / Mark Complete** (currently view-only).
- **MOU:** create/**renew** (exists)/edit/expire + **real PDF upload & download** to the `mou-docs` bucket (currently metadata only).
- **FDP:** schedule (exists)/edit/cancel/attendance + **certificate generation** + attendance export.
- **Revenue:** **Approve Payout / Mark Paid / Download Invoice** (currently looks static).

### 3.4 Error/empty/loading states everywhere
- Destructure `error` on **every** Supabase call; log + show a real message.
- **Empty states** = illustration + one line + a primary action (e.g., "No colleges yet → Invite College"), never a bare "0".
- Loading skeletons on async lists. Toasts on every write (success/fail).

### 3.5 Edge cases to test (Layer 3 of production)
Expiry date in the past; negative/over-capacity seats; revenue share > 100%; duplicate MOU/college/student; deleting a college with children; a student with no enrollments; a college with 0 placements (health score must still compute, not crash/NaN). Fix any that break.

### 3.6 Scale (the literal "100 colleges" answer)
Pagination + server-side search/sort/filter + CSV export on **every** large table (students, placements, users, colleges). Cap payloads; don't fetch 3,650 rows to render 150. This is what makes "100 colleges, 100k students" believable.

---

## PHASE 4 — Button panels / modals: production checklist
You added many action panels (Add Student, Predict, Renew MOU, Log Comm, Schedule FDP, Broadcast, Invite, Approve Payout). For **each** panel verify:
- Opens/closes cleanly (focus trap, ESC, click-outside); mobile-friendly width.
- **Client + server validation** (required fields, ranges, formats); disable submit while pending.
- **Persists to DB** (service/RLS-correct client) → **toast** → **panel closes** → **list refreshes** (`router.refresh()`), and the change **survives a page reload**.
- Writes an `activity_events` row; fires a notification if it's a trigger event.
- Handles errors (show the message, don't silently fail). Test the edge cases from 3.5 in each panel.

---

## PHASE 5 — Per-feature polish (from the page-by-page review)
- **Placement Predictor (9/10):** show **"83% probability · Expected ₹8.7 LPA"** prominently (not just a score) + recommended skills. Strongest feature — make it shine.
- **Reports:** verify the PDF is **really generated** (jspdf, dynamic content, real numbers) — open one and check; not a static file.
- **Analytics:** fill the completion fields showing "—" with real values.
- **MOU:** add real file upload/download (3.3).
- **FDP:** certificate generation + attendance export.
- **Revenue:** wire the actions (3.3).
- **Dashboard health list:** ensure the computed, varied scores show (post-recompute).

---

## PHASE 6 — Remaining 10 good-to-have (per `docs/03`)
You have G1/G4/G7/G8. Build the rest, priority order (schema mostly exists):
1. **G6 Automated digest** (weekly/monthly summary email via cron).
2. **G2 TPO ↔ Account-Manager chat** (`chat_rooms`/`messages`, Supabase Realtime).
3. **G9 MOU e-signature** (click-to-accept → signed stamp on PDF; currently only a status field).
4. **G3 Workshop/event request** (`workshop_requests` → admin approve → notification).
5. **G10 Seat tracking** (purchased/used/remaining on programs; decrement on enroll; ties to the seat CHECK constraint).
6. **G5 Co-branded reports** (inject college logo into report PDF header).
Mark each in the README good-to-have list as you finish (submission item #8).

---

## PHASE 7 — Standout premium AI + CareerOS AI reuse (the memorable layer)
> **Reuse repo (study it fully):** `C:\Users\NIKHIL\OneDrive\ドキュメント\Claude Projects\CareerOS AI\CareerOS-AI` (connected; bash `/sessions/.../mnt/CareerOS-AI`). **Open and study the actual files** — don't guess. Key: `resume-server/controllers/atsController.js`, `resume-server/utils/extractResumeText.js`, `guidance/scoring-engine.js`, `interview-prep/`, `skill-test/`, `docs/careeros-code-map.md`. Port logic into `lib/ai/` + API routes; note provenance in comments.

Build in this order (highest jury ROI):
1. **⭐ ATS engine port (do first — highest ROI).** Port `atsController.js` `analyzeResumeText()` + `extractResumeText()` → `POST /api/ats/analyze`. Real resume upload (PDF/DOCX/OCR) → ATS score + **skill-gap → recommended skills** on **Student 360°**. Feed it into the Risk/Placement predictor so scores are *derived*, not hardcoded.
2. **College Health Copilot** — admin asks "Why is VCE's score dropping?" → answers from data ("placement −12%, FDP attendance −18%, MOU expires in 23 days"). Extends the existing TPO Copilot. Huge demo moment.
3. **Renewal Risk AI** — predict which colleges may not renew (health + engagement + days-to-expiry + revenue) → Green/Amber/Red on MOU.
4. **Placement & Revenue Forecast** — next-quarter projections from trend data.
5. **Executive Summary Generator** — one-page AI CEO report per college (rule-based facts → narrative; LLM optional w/ fallback).
All AI: **computed + cached in `ai_insights`**, with a visible "how this was calculated" breakdown. Never hardcode.

---

## PHASE 8 — UI/UX to Linear/Vercel/Stripe/Relume (per `docs/09`)
Global tokens + shared primitives first (lifts all pages), then: real **empty states** (replace "No colleges found" with illustration + action), tables with filter/sort/search/export everywhere, interactive charts (recharts is installed), consistent spacing/typography, subtle motion, and **mobile** verification (dashboard, tables, reports, analytics). The landing is already strong — just remove the meta text (2.4).

---

## Minor advice (the "simple mistakes" — read this) ⚠️
1. **Always destructure `error`** on Supabase calls and handle it — this single habit would have surfaced the 0-colleges/0-users bugs immediately.
2. **After building, RUN the data scripts** (fix-realism, health recompute) — code that fixes data does nothing until executed; re-screenshot to confirm.
3. **No meta/dev text in the product** — no "hackathon", "Vercel", "mandatory", "demo", "fully implemented", TODOs, or Lorem ipsum anywhere a jury can see.
4. **Numbers must agree across pages** — colleges count, revenue, placements, health — one source of truth; inconsistent figures destroy trust faster than a missing feature.
5. **Never `.limit(N)` as a fake "done"** — paginate; truncated lists look broken at scale.
6. **Test every write end-to-end:** submit → toast → reload → still there. If it doesn't persist, it's UI-only.
7. **Keep `npm run build` green** after every change; verify no files were truncated mid-write.
8. **Test as each of the 6 roles**, including trying to access forbidden pages.
9. **Don't refactor working code** under deadline; make targeted changes.
10. **Re-deploy after fixes** and test the **public URL** in incognito (stale cache hides fixes).

---

## Phased order + gates
```
PHASE 1  apply doc-12 fix · run fix-realism · recompute health · build green        [GATE: admin loads, data realistic]
PHASE 2  fix 0-colleges/0-users (error handling + users FK) · pagination · remove meta text · number consistency
PHASE 3  production hardening: RBAC matrix · FK/cascade/constraints/indexes · CRUD gaps · errors/empty states · edge cases · scale
PHASE 4  modal/panel production checklist (all panels)
PHASE 5  per-feature polish
   [GATE: deploy + 6-role smoke test PASS on public URL — this is "submission-ready"]
PHASE 6  remaining 10 good-to-have
PHASE 7  ATS port + premium AI (CareerOS reuse)
PHASE 8  UI polish to Linear/Vercel grade
FREEZE ~3h before 6pm: README feature→file map · 5–7 min demo video · final deploy · incognito re-test
```
> If time runs short, **Phases 1–5 + deploy = a credible production submission.** 6–8 are the climb from 8.5 to 9.5. Never sacrifice a working, deployed, consistent app for an unfinished premium feature.
