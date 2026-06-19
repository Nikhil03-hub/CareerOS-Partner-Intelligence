# 12 · Sonnet Fix-It Prompt (surgical — paste into the build chat)

> Paste everything below the line into the Sonnet 4.6 build chat. It's intentionally narrow: unblock the admin panel, make the data look real, deploy, verify. **No new features until all of this is green.**

=== PASTE FROM HERE ===

You are continuing the **CareerOS Partner Intelligence Platform** (Next.js 14 + Supabase, Track 5B, deadline tomorrow 6 PM). The project is built and the AI is real — but it has **one critical bug and is not deployed.** Do ONLY the steps below, in order. **Do not rebuild or refactor working code. Do not add new features.** Keep `npm run build` green after every change. Confirm each step before moving to the next.

## STEP 1 — Fix the `/admin` infinite redirect loop (CRITICAL, do first)
**Cause:** `src/app/admin/layout.tsx` authenticates with `createServiceClient()` (service-role, no cookies) → `auth.getUser()` returns null → redirects to `/login` → middleware bounces back to `/admin` → loop (`ERR_TOO_MANY_REDIRECTS`).

**Fix — edit ONLY `src/app/admin/layout.tsx`:**
- Change the import from `createServiceClient` to `createClient` (from `@/lib/supabase/server`).
- Change `const supabase = createServiceClient()` to `const supabase = await createClient()`.
- Leave everything else in the file unchanged (the `getUser()`, the `role` check for `super_admin`/`account_manager`, the `users` profile select, the JSX).
- **Do NOT touch the admin *data* pages** (`/admin/colleges/page.tsx`, etc.) — they correctly use `createServiceClient()` to bypass RLS. Only the layout's auth check changes.

Then ensure a `users` self-read RLS policy exists (so the admin's name loads) — if missing, add:
```sql
create policy "users_self_read" on public.users for select using (auth_id = auth.uid());
```

**Verify:** `npm run dev` → log in as `admin@careeros.app` / `careeros2026` → you land on `/admin` with NO loop → sidebar + KPI cards render → `/admin/colleges` shows **25 colleges**. If the loop persists, check `src/middleware.ts` isn't also redirecting `/admin`, and that the session cookie is set after login.

## STEP 2 — Confirm the build is clean
Run `npm install` then `npm run build`. Fix any errors (watch for any files truncated in earlier sessions — landing page, layouts). Report the exact error if one appears and fix one at a time. Do not proceed until `npm run build` passes.

## STEP 3 — Make the seeded data realistic (run the existing endpoints)
1. Trigger `POST /api/admin/fix-realism` (admin → Settings → the Fix-Realism button). This fixes students currently showing **Readiness 100% / Risk = low** into a believable spread (readiness 35–98; ~15% high / 30% medium / 55% low risk). Verify on `/admin/students`.
2. **Batch-recompute College Health for all 25 colleges.** The leaderboard/dashboard read `colleges.health_score`, which stays at the seeded value until `/api/health-score/[collegeId]` runs per college. Add a small admin-only batch route (e.g. `POST /api/admin/recompute-health`) that loops all `colleges` and calls the existing health computation (write back to `colleges.health_score`), or run the existing single-college route for each. Verify `/admin/analytics` shows varied, computed scores.

## STEP 4 — Deploy to Vercel (the #1 submission requirement)
Follow `DEPLOYMENT.md`:
1. `git add . && git commit -m "fix: admin auth loop + realism" && git push`
2. Import the repo to Vercel → set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. In Supabase: confirm migrations `001`+`002` are applied; create the 4 Storage buckets — `mou-docs` (private), `college-logos` (public), `reports` (private), `certificates` (private).
4. Open the public URL; hard-refresh (incognito) to confirm no stale cache.

## STEP 5 — Smoke-test all 6 roles on the DEPLOYED URL
For each: log in → correct dashboard loads → do one write → refresh → confirm it persisted.
- `admin@careeros.app` (super_admin) → `/admin` (no loop), colleges=25, approve a pending college, generate a report PDF, open a college → **Health Score breakdown** shows real factors.
- `am@careeros.app` (account_manager) → `/admin/colleges`.
- `tpo@kmit.edu` → `/college/dashboard`, Student 360° (readiness/risk now vary), Copilot answers, log a communication.
- `hod@kmit.edu` / `faculty@kmit.edu` / `club@kmit.edu` → scoped dashboards load; cannot see other departments' data.
- Mobile viewport: sidebar/drawer + tables usable. Confirm: no empty pages, no Lorem ipsum, no dead links.

## STEP 6 — Report back
Tell me: (a) build passed? (b) admin loop fixed? (c) fix-realism + health recompute run? (d) deployed URL? (e) which of the 6 roles passed the smoke test? List anything that failed with the exact error. **Stop here — do not start new features until I confirm.**

(After this is all green, the next highest-value task is porting the ATS resume engine from `CareerOS AI/CareerOS-AI/resume-server/controllers/atsController.js` → `POST /api/ats/analyze` for Student 360° — but only once the above is done and verified.)

=== END OF PROMPT ===
