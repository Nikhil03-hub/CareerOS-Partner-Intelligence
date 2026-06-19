# 14 · Sonnet Production-Push Prompt (paste into the build chat)

> Paste everything below the line into the Sonnet 4.6 build chat. Full detail lives in `docs/13_PRODUCTION_PUSH_GUIDANCE.md` — this is the ordered, surgical execution version. Do the phases **in order**; a gate marks "submission-ready."

=== PASTE FROM HERE ===

You are continuing the **CareerOS Partner Intelligence Platform** (Next.js 14 + Supabase, Track 5B, deadline tomorrow 6 PM). The app is feature-rich and the AI is real, but it is **not production-grade yet** (jury will inspect seriously). Make it production-grade. Work **in the order below**, **additively** (don't refactor working code), keep `npm run build` green, and **confirm each phase before the next**. Full reference: `docs/13_PRODUCTION_PUSH_GUIDANCE.md`. Do **not** start Phases 6–8 until I confirm the GATE.

## PHASE 1 — Unblock + make data real (first)
1. **Admin redirect loop:** in `src/app/admin/layout.tsx` change `import { createServiceClient }` → `import { createClient }` and `const supabase = createServiceClient()` → `const supabase = await createClient()`. Leave the rest. (Keep `createServiceClient()` on admin **data** pages.) Add RLS if missing: `create policy "users_self_read" on public.users for select using (auth_id = auth.uid());`
2. `npm install && npm run build` → must pass (watch for files truncated in earlier sessions).
3. **Run** `POST /api/admin/fix-realism` (admin → Settings) → students get realistic readiness (35–98) + risk spread.
4. **Recompute health for all 25 colleges:** add `POST /api/admin/recompute-health` that loops every college through the existing health computation and writes back `colleges.health_score`. Run it.
**GATE 1:** log in as `admin@careeros.app`/`careeros2026` → `/admin` loads (no loop) → students show varied readiness/risk → health scores varied.

## PHASE 2 — Fix the empty-data bugs + remove meta-text + number consistency
5. **Empty pages ("0 colleges", "0 users"):** the root cause is queries ignoring errors. In **every** server page, destructure and handle the error: `const { data, error } = await query; if (error) console.error(...)`. 
   - **Users page** (`/admin/users`): the `colleges(name, code)` embedded join fails if the FK isn't detected. Either confirm/add FK `users.college_id references colleges(id)`, **or** split into two queries (fetch users, fetch colleges, map in JS). Verify all 7 demo users render.
   - **Colleges page:** after Phase 1 + reload it should show 25; if not, the now-surfaced `error` tells you why.
6. **Pagination:** students list shows only 150 of 3,650 — add real pagination + server-side search/sort/filter (don't silently `.limit()`).
7. **Remove ALL hackathon/deployment meta-text** (jury must see a product). Edit exactly:
   - `src/app/page.tsx:31` badge "SummerSaaS Hackathon 2026 — Track 5B Finalist" → product tagline.
   - `src/app/page.tsx:72` stat "15 / Core Features / Fully implemented" → real metric.
   - `src/app/page.tsx:89` "15 mandatory features, 10 good-to-have…" → product copy.
   - `src/app/page.tsx:200` footer "Built for SummerSaaS Hackathon 2026 — Track 5B" → "© 2026 Skill Tank · CareerOS".
   - `src/app/admin/settings/page.tsx:99-100` "Deployment: Vercel" / "Edition: SummerSaaS 2026 Hackathon" → remove/replace.
   - `src/app/admin/settings/page.tsx:39-42` "Demo Data Tools" → "Data Management".
   - **`src/app/admin/reports/GenerateReportButton.tsx:144`** report PDF footer "Track 5B — SummerSaaS Hackathon 2026" → "CareerOS Partner Intelligence · Confidential". (Jurors download these — critical.)
   - Then run `grep -rniE "hackathon|summersaas|vercel|mandatory|fully implemented|demo data" src/` → expect **zero** jury-visible hits.
8. **Number consistency:** make colleges count, revenue, placements, health agree across landing/dashboard/analytics (one source of truth). Fix the 22-vs-25 and ₹12.4L-vs-₹161.5L mismatches.
**GATE 2:** colleges page shows 25, users page shows all demo users, no meta-text anywhere (incl. a downloaded report PDF), numbers match across pages.

## PHASE 3 — Production hardening ("can 100 colleges use this?")
9. **RBAC enforcement:** verify (don't assume) a TPO/HOD/Faculty/Club visiting `/admin`, `/admin/revenue`, `/admin/users` is blocked, and that one college cannot read another's data (RLS on `college_id`). Test live as `tpo@kmit.edu`.
10. **DB integrity:** FKs on all `*_id`; deliberate cascade/restrict on college delete/suspend; CHECK constraints (`seats_used<=seats_purchased`, `revenue_share_pct 0–100`, `cgpa 0–10`, `readiness 0–100`, MOU `expiry_date>start_date`); indexes on `college_id`,`status`,`created_at`.
11. **CRUD gaps:** Colleges reject+suspend+edit; Students edit+archive+CSV import; Training add/edit/mark-complete; MOU real PDF upload+download (`mou-docs` bucket); FDP certificate + attendance export; Revenue approve-payout/mark-paid/download-invoice.
12. **Errors/empty/loading states:** real empty states (illustration + action, never bare "0"), skeletons, toasts on every write.
13. **Edge cases:** test past expiry, negative/over seats, share>100%, duplicates, deleting a college with children, a college with 0 placements (health must compute, not NaN). Fix breakers.
**GATE 3:** each role behaves correctly; constraints reject bad input; CRUD actions persist after reload.

## PHASE 4 — Modal/panel production pass
14. For **every** action panel (Add Student, Predict, Renew MOU, Log Comm, Schedule FDP, Broadcast, Invite, Approve Payout): client+server validation, disable-on-submit, persist → toast → close → `router.refresh()`, survives reload, writes `activity_events`, fires notification if a trigger event, handles errors. Mobile-friendly.

## PHASE 5 — Per-feature polish
15. Placement Predictor: show **"83% probability · Expected ₹8.7 LPA"** + recommended skills prominently. Reports: confirm the PDF is really dynamic (real numbers). Analytics: fill the "—" completion fields. Dashboard: show the recomputed varied health.
**🚩 GATE (SUBMISSION-READY): redeploy to Vercel, then run the 6-role smoke test on the PUBLIC URL in incognito — every role logs in, lands correctly, one write persists, no empty/meta pages. Tell me the URL + which roles passed. STOP and confirm with me before Phases 6–8.**

## After the gate (only when I say go): Phases 6–8
- **6:** remaining good-to-have G6 digest, G2 chat, G9 e-sign, G3 workshop, G10 seats, G5 co-brand (see `docs/03`).
- **7:** standout AI — **port the ATS engine first**: study `C:\Users\NIKHIL\OneDrive\ドキュメント\Claude Projects\CareerOS AI\CareerOS-AI\resume-server\controllers\atsController.js` (+ `utils/extractResumeText.js`, `guidance/scoring-engine.js`, `docs/careeros-code-map.md`) and port `analyzeResumeText()`/`extractResumeText()` → `POST /api/ats/analyze` for Student 360°; then College Health Copilot, Renewal Risk, Forecasts, Executive Summary (see `docs/04`/`05`). Cache AI in `ai_insights`; never hardcode.
- **8:** UI polish to Linear/Vercel/Stripe/Relume (see `docs/09`) — empty states, table filters/sort/export, interactive charts, mobile.

## Rules
Additive only; match existing patterns (server components read, client `*Button.tsx` write, `createServiceClient` on admin data pages, cookie `createClient` for auth); destructure `error` on every Supabase call; keep `npm run build` green; **run** any data-fixing script after writing it and re-verify; redeploy + incognito-test after fixes; no meta/dev text anywhere a customer can see. Report blockers with the exact error.

=== END OF PROMPT ===
