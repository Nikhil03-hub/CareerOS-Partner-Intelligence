# 16 · Sonnet Persistence & CRUD Fix Prompt (paste into the build chat)

> Paste below the line into the Sonnet 4.6 build chat. This fixes the real bugs the user found (writes don't persist, buttons error, new user not added, sign-in menu static, empty modal dropdowns, students still 100%). Full diagnosis: `docs/15_PRODUCTION_SANITY_AUDIT.md`. Do it in order; confirm each step; keep `npm run build` green; additive only.

=== PASTE FROM HERE ===

You are fixing **production-blocking persistence bugs** in the CareerOS Partner Intelligence Platform (Next.js 14 + Supabase, Track 5B, deadline tomorrow 6 PM). Symptoms reported by the user: some action buttons error; **"working" buttons revert after refresh (data not persisting); new user not added; the bottom-left user menu does nothing; modal dropdowns (e.g. Log Communication's College list) are empty; students still show 100% readiness.** Do the steps in order. Don't refactor working code; keep the build green.

## ROOT CAUSE (understand before fixing)
Mutations done with the **browser anon `createClient()`** go through RLS policies gated on `is_skilltank_staff()`/the role JWT claim — which is unreliable (that's why reads already use the service client). Result: `UPDATE`/`DELETE` silently affect **0 rows with no error** (false "success" → reverts on refresh); `INSERT` is blocked (errors / "not added"); anon reads in modals return empty (blank dropdowns). **Fix = route every write through a server API route that uses `createServiceClient()`, and pass modal reference data as props.**

## STEP 1 — Run the data scripts FIRST (and verify they persist)
- Trigger `POST /api/admin/fix-realism` (admin → Settings) → students get realistic readiness (35–98) + risk spread (~15/30/55%). Reload `/admin/students` and confirm it stuck.
- Trigger the health recompute for all 25 colleges (`/api/admin/recompute-health` or per-college). Confirm `/admin/analytics` shows varied scores.
- If either doesn't persist, it's the same write-path bug — fix Step 2 then re-run.

## STEP 2 — Make ALL writes persist (the core fix)
For **every** client action component that currently does a direct `supabase.from(...).insert/update/delete` with the anon `createClient()` — these include `ToggleStatusButton`, `MarkAllReadButton`, `MOUUploadButton`, `BroadcastButton`, and the direct-write paths in `LogCommButton`, `ScheduleFDPButton`, `GenerateReportButton`:
1. Create (or reuse) a **server API route** under `src/app/api/...` that:
   - uses `await createClient()` to get the caller and **verify role** (`user.user_metadata.role`), then
   - uses `createServiceClient()` to perform the `insert/update/delete` (bypasses RLS), and
   - returns `{ error }` with a real message; for updates, return the affected row/count.
2. Change the button to `fetch()` that route, check `if (!res.ok) throw`, **and verify the write actually changed data** (don't toast success on a 0-row update). Then `toast.success` → close → `router.refresh()`.
3. Remove the direct anon `.insert/.update/.delete` calls from the client component.
**Verify each:** click → toast → **reload the page → change is still there → confirm the row in Supabase.** Repeat for Approve/Reject/Suspend college, Toggle user status, Renew MOU, Approve Payout/Mark Paid, Log Communication, Schedule FDP, Broadcast, Mark-all-read, MOU upload.

## STEP 3 — Fix empty modal dropdowns (reference data)
Modals must NOT fetch dropdown data with the anon client. Pass it as props from the server page (which uses the service client), exactly like `AddStudentButton({ colleges })` already does. Fix `LogCommButton` (College dropdown is blank) and any other modal with empty selects: have the server page query colleges/programs (service client) and pass them in.

## STEP 4 — Fix "new user not added" (Invite)
In `/api/users/invite`: it must (a) create the **Supabase auth user** via `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, role, college_id } })` using the **service** client, then (b) insert the matching `users` row with the **same `auth_id`**, (c) handle "already registered" gracefully, (d) return a real error on failure. The `InviteUserButton` should call ONLY this route (remove any anon-client insert). Verify a newly invited user appears in `/admin/users` after reload AND can log in.

## STEP 5 — Fix the bottom-left user menu (sign-out)
In `src/components/shared/UserMenu.tsx` the dropdown uses `absolute top-full mt-1`, so at the sidebar bottom it opens **off-screen downward** (looks dead). Change it to open **upward**: `absolute bottom-full mb-1` (and make sure no parent `overflow-hidden` clips it). Verify clicking the menu shows the dropdown and **Sign out** routes to `/login`.

## STEP 6 — Minor: modal polish + error surfacing
- Fix the `Log Communication` modal layout (the "Type / By" fields overlap) — correct the grid/spacing.
- Anywhere you read Supabase data in a server page, destructure `error` and log it; render a real empty state ("No X yet" + action), never a bare "0".

## STEP 7 — Re-test everything, then redeploy
- For each of the 6 roles (`admin@careeros.app`, `am@careeros.app`, `tpo@kmit.edu`, `hod@kmit.edu`, `faculty@kmit.edu`, `club@kmit.edu`, password `careeros2026`): log in → do one write in that role's area → reload → confirm persisted. Confirm forbidden URLs are blocked per role.
- `npm run build` green → push → redeploy to Vercel → open the **public URL in incognito** and re-verify a write persists (rules out local cache).
- Report back: which writes now persist, invite working?, user menu working?, dropdowns filled?, students realistic?, deployed URL, and any remaining errors with exact messages. **Stop and confirm with me before moving to new features.**

## After this passes (don't start until I confirm) — what's next
1. DB hardening (FKs incl. `users.college_id→colleges.id`, indexes, CHECK constraints, cascade rules).
2. **CareerOS AI ATS port** — study `C:\Users\NIKHIL\OneDrive\ドキュメント\Claude Projects\CareerOS AI\CareerOS-AI\resume-server\controllers\atsController.js` (+ `utils/extractResumeText.js`, `guidance/scoring-engine.js`) → `POST /api/ats/analyze` → real ATS + skill-gap on Student 360°, feeding Risk/Placement so scores are derived not seeded.
3. Premium AI: College Health Copilot → Renewal Risk → Placement/Revenue Forecast → Executive Summary (cache in `ai_insights`).
4. UI polish to Linear/Vercel grade (`docs/09`).

## Rules
Additive only; every mutation through a service-role API route (verify role server-side); pass reference data as props (no anon reads in modals); check `error` AND row count on writes; never toast success on a no-op; keep `npm run build` green; redeploy + incognito-test after fixing; report blockers with exact errors.

=== END OF PROMPT ===
