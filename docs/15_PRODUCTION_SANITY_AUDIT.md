# 15 · Production Sanity Audit — Error Diagnosis + What's Next

> **Author:** Opus (audit). **For:** the team + Sonnet 4.6. **Deadline:** 2026-06-20 18:00.
> Based on: the error PDF (15 pages), ChatGPT's advice, your reported issues, and a read of the actual code. Fix prompt = `docs/16`. Current external scores: Architecture 9.2 · Features 9.0 · **Production 7.7** — the gap is now **persistence + CRUD reality**, exactly the issues you reported.

## 🔴 THE ONE ROOT CAUSE behind most of your bugs
Your write buttons and modals are split into two patterns:
- **Good:** some call a **server API route** that uses `createServiceClient()` (service-role, **bypasses RLS**) — e.g. `AddStudent` → `/api/students/add`. These persist.
- **Broken:** several do a **direct write with the anon `createClient()`** in the browser — e.g. `ToggleStatusButton`, `MarkAllReadButton`, `MOUUploadButton`, `BroadcastButton`, and the direct-write paths inside `LogCommButton`/`ScheduleFDPButton`. These go through **RLS policies gated on `is_skilltank_staff()` / the role JWT claim** — the *same* claim Sonnet already found unreliable (that's why it switched reads to the service client).

Why that produces your exact symptoms:
- **"Buttons work but revert after refresh":** a Postgres `UPDATE`/`DELETE` that fails the RLS `USING` check affects **0 rows and returns NO error**. The button sees no error → shows "success" → `router.refresh()` → nothing changed. Silent no-op.
- **"New user not being added" / buttons throwing errors:** an `INSERT` that fails the RLS `WITH CHECK` **does** throw → either an on-screen error or a swallowed one.
- **"Empty modal dropdowns" (the Log Communication college list is blank):** the modal *reads* colleges via the anon client → RLS returns nothing → empty `<select>` → broken form.

**The fix (production-correct, do this once, apply everywhere):**
1. **All mutations go through server API routes using `createServiceClient()`**, after verifying the caller's role server-side (cookie `createClient()` → check `user_metadata.role`). Remove every direct anon-client `.insert()/.update()/.delete()` from client components.
2. **Reference data for modals** (college lists, program lists) is **passed as props from the server component** (which uses the service client) — like `AddStudentButton` already receives `colleges`. Never fetch dropdown data with the anon client in a modal.
3. **Always check `error` AND row count** on writes; if 0 rows changed, treat as failure (don't toast success). Surface real messages.
4. **Defense-in-depth:** also fix the RLS write policies so `is_skilltank_staff()` is reliable (check the `users` table role, not only the JWT claim) — but the API-route+service pattern is the primary fix.

---

## Reported issues → diagnosis → fix
| # | You reported | Diagnosis | Fix |
|---|---|---|---|
| 1 | **Colleges not shown on Colleges page** | Query error was swallowed (`const {data}=` no `error`). Sonnet reportedly fixed it; verify. If still empty, the now-surfaced `error` reveals the cause (service-key env or a filter). | Destructure+log `error`; confirm 25 render. Real empty state, never bare "0". |
| 2 | **Some buttons error / give errors** | Direct anon `INSERT` blocked by RLS `WITH CHECK` (role claim unreliable). | Route through service API (root-cause fix #1). |
| 3 | **Working buttons revert after refresh (not persisted)** | Direct anon `UPDATE` fails RLS `USING` → 0 rows, no error → false "success". | Root-cause fix #1 + check row count (#3). |
| 4 | **New user not being added** | `/api/users/invite` inserts into `users` but (per code) does **not** create the Supabase **auth** user, and/or the button uses the anon path. Invited user has no login + possible `auth_id` mismatch; insert may fail on missing fields/duplicate. | Invite route: `auth.admin.createUser()` (service) → insert `users` row with matching `auth_id` → handle duplicates → return real error. Button calls the route only. |
| 5 | **Sign-in (bottom-left) static / does nothing** | `UserMenu` dropdown uses `absolute top-full mt-1` — it opens **downward off the bottom of the screen** (the menu sits in the sidebar footer), so it's invisible. Sign-out logic itself is fine. | Open **upward**: `bottom-full mb-1` (+ ensure it's above the sidebar's `overflow`); verify Sign Out routes to `/login`. |
| 6 | **Empty modal dropdowns** (Log Communication college list blank) | Modal reads colleges via anon client → RLS → empty. | Pass `colleges` as a prop from the server page (root-cause fix #2). |
| 7 | **Students all 100% readiness / 0 high-risk** (still) | `/api/admin/fix-realism` was **never run** (it's an endpoint, not automatic). | Run it (Settings button). Then recompute health for all 25. Verify the spread persists. |
| 8 | Modal layout glitch (Log Comm "Type/By" overlap) | CSS spacing bug in that modal. | Minor: fix the grid/spacing. |

---

## Section A — Role-by-role access audit (verify PASS/FAIL, live)
| Role | Should access | Must be BLOCKED from | Verify |
|---|---|---|---|
| super_admin | everything | — | ☐ |
| account_manager | assigned colleges, `/admin/colleges` | other AMs' colleges | ☐ |
| tpo | own college only | `/admin/*`, other colleges' data | ☐ |
| hod | own dept | other depts, `/admin/*` | ☐ |
| faculty_coord | training/FDP | revenue, MOU, `/admin/*` | ☐ |
| club_coord | events | revenue, MOU, `/admin/*` | ☐ |
Test by logging in as each and **typing forbidden URLs** + attempting cross-college reads. "Hidden in nav" ≠ blocked.

## Section B — Feature CRUD / persistence status (fill after fix)
| Feature | Create | Read | Update | Delete | Persists after reload? |
|---|--:|--:|--:|--:|--:|
| Colleges (approve/reject/suspend) | ☐ | ✅ | ☐ | ☐ | ☐ |
| Students (add/edit/archive/CSV) | ☐ | ✅ | ☐ | ☐ | ☐ |
| MOU (create/renew/upload PDF) | ☐ | ✅ | ☐ | — | ☐ |
| FDP (schedule/attendance/cert) | ☐ | ✅ | ☐ | ☐ | ☐ |
| Revenue (approve/mark paid) | — | ✅ | ☐ | — | ☐ |
| Comms (log) | ☐ | ✅ | — | — | ☐ |
| Users (invite/toggle) | ☐ | ☐ | ☐ | — | ☐ |
| Notifications (broadcast/read) | ☐ | ✅ | ☐ | — | ☐ |
Every ☐ must become ✅ with the write change. **A feature only counts if it survives a reload + shows in Supabase.**

## Section C — Database audit
FKs on every `*_id` (esp. `users.college_id → colleges.id`, which broke the Users page join); indexes on `college_id`/`status`/`created_at`; CHECK constraints (`seats_used ≤ seats_purchased`, `revenue_share_pct 0–100`, `cgpa 0–10`, `readiness 0–100`, MOU `expiry > start`); deliberate cascade/restrict on college delete. Confirm RLS write policies actually evaluate true for staff (or rely on service-route writes).

## Section D — Deployment audit (must pass before submission)
☐ Public Vercel URL · ☐ incognito loads (no stale cache) · ☐ all 6 roles log in · ☐ one write per module persists after reload · ☐ mobile layout · ☐ a downloaded report PDF has **no** hackathon/Vercel footer · ☐ no empty/"0" pages.

---

## What's next (the plan, in order)
1. **NOW — Persistence + CRUD fix (this round, `docs/16`):** route all writes through service API routes, fix modal dropdowns, fix invite (auth+users), fix UserMenu, run fix-realism + recompute-health. → This is what makes features *real*.
2. **Deploy + 6-role smoke test** on the public URL (incognito). → **This is "submission-ready."**
3. **DB hardening** (Section C) + **role audit** (Section A) — the trust layer.
4. **CareerOS AI reuse — ATS engine** (path: `C:\Users\NIKHIL\OneDrive\ドキュメント\Claude Projects\CareerOS AI\CareerOS-AI`; study `resume-server/controllers/atsController.js`, `utils/extractResumeText.js`, `guidance/scoring-engine.js`). Real resume → ATS + skill-gap on **Student 360°**; feed Risk/Placement so scores are *derived*, not seeded.
5. **Premium standout AI** (Tier 1 first): College Health Copilot → Renewal Risk → Placement Forecast → Revenue Forecast → Executive Summary.
6. **UI polish** to Linear/Vercel/Stripe/Relume (`docs/09`).

> Do **not** start step 4+ until steps 1–3 pass. ChatGPT and I agree: stop adding features; make what exists **real, persistent, and secure** first. That single move takes you from ~7.7 to ~8.8 production; the CareerOS AI + premium layer then takes you to 9.2–9.5.
