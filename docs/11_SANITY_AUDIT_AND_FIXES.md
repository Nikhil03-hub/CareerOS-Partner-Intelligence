# 11 · Production Sanity Audit + Fix List

> **Auditor:** Opus (no code written — verification only, against the real files on disk). **For:** Sonnet 4.6 to action. **Date:** 2026-06-19. **Deadline:** 2026-06-20 18:00.
> **Method:** read the actual source (middleware, layouts, `lib/ai/score.ts`, API routes, package.json, seed/user scripts) + Sonnet's build log + the live screenshots.

## Headline verdict
The build is **strong and the AI is genuinely computed** (not hardcoded) — but it is **blocked by ONE critical bug and is not deployed.** Fix the redirect loop + deploy, and this is a legitimate finalist.

**Submission readiness: 7.5/10 right now → ~9/10 after the 2 critical fixes + running 2 scripts + deploy.**

| Area | Score | Note |
|---|--:|---|
| Architecture | 9.5 | Clean Next.js+Supabase+RLS |
| Database/seed | 9.0 | Real KMIT data; realism fix exists (must run) |
| Feature coverage | 9.0 | 15 mandatory + G1/G4/G7/G8 + Copilot/Predictor/Health |
| AI layer | 8.0 | **Real compute** (`computeCollegeHealthScore`, predictor) — verified |
| UI/UX | 8.5 | Landing now premium; dashboards clean |
| **Deployment** | **2.0** | ❌ **Not deployed — #1 risk** |
| **Admin access** | **0** | ❌ **Redirect loop — admin panel unreachable** |

---

## 🔴 CRITICAL FIX #1 — Admin redirect loop (do this FIRST, ~30 seconds)

**Symptom:** `/admin` → `GET /admin 307` forever → `ERR_TOO_MANY_REDIRECTS`. The admin panel (a required submission deliverable) is completely unreachable.

**Root cause (confirmed):** `src/app/admin/layout.tsx` authenticates with **`createServiceClient()`** — the service-role client has **no cookies / no session**, so `supabase.auth.getUser()` there **always returns `null`** → `redirect('/login')`. Middleware then sees the valid session at `/login` and redirects back to `/admin` (role=super_admin) → infinite loop. (The `college` layout does it correctly with the cookie-aware `createClient()`.)

**Exact fix** — in `src/app/admin/layout.tsx`:

```diff
- import { createServiceClient } from '@/lib/supabase/server'
+ import { createClient } from '@/lib/supabase/server'
  ...
  export default async function AdminLayout({ children }: { children: React.ReactNode }) {
-   const supabase = createServiceClient()
+   const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const role = user.user_metadata?.role
    if (role !== 'super_admin' && role !== 'account_manager') redirect('/college/dashboard')
    const { data: profile } = await supabase.from('users').select('name, email').eq('auth_id', user.id).single()
```

- **Leave the admin *data* pages on `createServiceClient()`** — that's correct (admin must bypass RLS to read all colleges; middleware+layout already gate auth). Only the **layout's auth check** must use the cookie client.
- **RLS dependency:** the `profile` select runs under the user's JWT now, so ensure a `users` self-read policy exists: `using (auth_id = auth.uid())`. If it's missing, `profile` is `null` (non-fatal — name falls back to email), but add the policy so the name shows.
- **Verify after fix:** log in as `admin@careeros.app` / `careeros2026` → lands on `/admin` (no loop) → sidebar + KPIs render → `/admin/colleges` shows **25 colleges** (the earlier "No colleges found" was the loop blocking access + is now served via the service client).

---

## 🔴 CRITICAL FIX #2 — Deploy to Vercel (the #1 submission requirement)

Still localhost-only. Judges must open a public URL. `DEPLOYMENT.md` + `vercel.json` are written — execute them:
1. `npm install` (picks up jspdf, jspdf-autotable, recharts — already in package.json ✓).
2. `npm run build` locally → confirm clean (catches any leftover truncation from the build session).
3. Push to GitHub → import to Vercel → set 3 env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. In Supabase: confirm migrations applied, create the 4 Storage buckets (`mou-docs`, `college-logos`, `reports`, `certificates`).
5. Open the public URL, re-run the 6-role smoke test (below).

---

## A) Actually working (verified in code) ✅
- **Auth (college side)** — `college/layout.tsx` uses `createClient()` correctly; TPO/HOD/Faculty/Club logins work today.
- **Real AI compute** — `src/lib/ai/score.ts` `computeWeightedScore()`/`computeCollegeHealthScore()` is a true weighted-sum with transparent per-factor breakdown. `/api/health-score/[collegeId]` computes from live DB, caches to `ai_insights`, **and writes back to `colleges.health_score`** (line 129). **Not hardcoded.** ✓
- **Placement Predictor** — `/api/students/predict` + `PlacementPredictorModal.tsx` (probability + factors).
- **Data-realism fix** — `/api/admin/fix-realism` recomputes readiness (35–98) + risk spread (the all-100%/all-low bug fix). Triggered by `FixRealismButton` in `/admin/settings`.
- **Reports** — jspdf client-side generation (`/api/reports/create`, reports pages) — no Vercel binary risk.
- **Notifications** — alert API scans live DB (MOU expiry, low completion, health drops) + rich page (in-app works without keys).
- **CRUD actions** — AddStudent, LogComm, RenewMOU, Approve/Reject, Approve Payout, Schedule FDP, Broadcast, Invite, Toggle status.
- **TPO Copilot** — `/college/copilot` rule-based Q&A from real data.
- **15 mandatory + G1, G4, G7, G8**, multi-role RBAC, premium landing, charts (recharts).

## B) Partially working — needs an ACTION (not a rebuild) 🟡
1. **Run `fix-realism` once** (admin → Settings → the button, or POST `/api/admin/fix-realism`). Until run, students still show Readiness 100% / Risk low. **Do this before recording the demo.**
2. **Recompute health for ALL colleges.** `/api/health-score` updates one college on visit. The leaderboard/dashboard read `colleges.health_score`, which stays at the seeded value until each college is computed. **Add/run a batch:** loop all `colleges` → call the compute → write back. Otherwise the "real health score" only shows on colleges you've opened.
3. **Live Email + Telegram (M14).** In-app notifications work; real sends need `RESEND_API_KEY` + `TELEGRAM_BOT_TOKEN`/`CHAT_ID` and the `notify-dispatch`/`renewal-cron` edge functions deployed (`supabase functions deploy`). Get Telegram live (free) for at least the demo; otherwise the admin log shows the queued/simulated record (acceptable, scores lower).
4. **MOU e-sign (G9)** — only a status field is *displayed* (`esign_status`); no click-to-accept workflow. Either build the flow or don't claim G9.

## C) Not implemented 🔻
1. **ATS resume engine (HIGH-VALUE) — not ported.** No `/api/ats`, no `pdf-parse`/`tesseract`/`mammoth`. Sonnet built the *scoring pattern* but skipped the resume analyzer because the CareerOS folder wasn't mounted in its session. **It's mounted now.** Port `CareerOS AI/CareerOS-AI/resume-server/controllers/atsController.js` (`analyzeResumeText()` + `extractResumeText()`) → `POST /api/ats/analyze`; wire real resume upload → score + skill-gap on Student 360°. ChatGPT calls this *"the single highest-ROI remaining enhancement."* Do it only after the 2 critical fixes + deploy.
2. **Good-to-have still missing:** G2 chat (`/college/chat` missing), G3 workshop request (`/college/workshops` missing), G5 co-branded report logo, G6 automated digest cron, G10 seat tracking UI. (You have G1/G4/G7/G8.)

## D) Critical bugs 🐞
- **#1 Admin redirect loop** (fix above) — blocks the whole admin panel.
- **Not deployed** (fix above) — blocks judging.
- *(No other crash-level bugs found in static review. Truncation during the build session was self-repaired; `npm run build` will confirm.)*

---

## Ordered action plan (remaining time)
```
1. Fix admin layout auth (createClient)            ← 30 sec, unblocks everything
2. npm install → npm run build                     ← confirm clean (truncation check)
3. Run /api/admin/fix-realism                      ← realistic readiness/risk
4. Batch-recompute health for all 25 colleges      ← real scores on leaderboard
5. Deploy to Vercel + env vars + 4 storage buckets ← PUBLIC URL (critical)
6. Smoke-test all 6 roles on the live URL (below)
7. (High ROI) Port the ATS engine → Student 360°
8. (If time) Telegram live + G2/G3/G6/G9/G10
9. README feature→file map + 5–7 min demo video    ← submission items
FREEZE ~3h before 6pm; no new features after.
```

## Per-role smoke test (run on the deployed URL before submitting)
For each: log in → land on the right dashboard → do one write → refresh → confirm it persisted.
- `admin@careeros.app` → `/admin` loads (no loop), colleges=25, approve a pending college (notification fires), generate a report PDF, run fix-realism, open a college → health breakdown shows.
- `am@careeros.app` → `/admin/colleges`.
- `tpo@kmit.edu` → `/college/dashboard`, Student 360° (readiness/risk vary), Copilot answers, log a communication.
- `hod@kmit.edu`, `faculty@kmit.edu`, `club@kmit.edu` → scoped dashboards load, no access to others' data.
- Mobile viewport: sidebar/drawer + tables usable. No empty pages, no Lorem ipsum, no dead links.

## Bottom line
Don't rebuild anything — the foundation and AI are real. **Fix the 6-line redirect bug, run 2 scripts, deploy, smoke-test 6 roles.** That converts a strong local codebase into a strong *submission*. Then the ATS port is the highest-value polish if time remains.
