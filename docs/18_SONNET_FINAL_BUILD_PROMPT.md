# 18 · Sonnet Final-Build Master Prompt (paste into the build chat)

> Paste everything below the line into the Sonnet 4.6 build chat. Full reasoning: `docs/17_NEXT_ARCHITECTURE_ROADMAP.md`. UI track: `docs/19`. Do the phases **in order**, **additively**, keep `npm run build` green, confirm each phase before the next. Each step lists the **mistake to avoid** — heed them; these exact mistakes have happened before.

=== PASTE FROM HERE ===

You are finishing the **CareerOS Partner Intelligence Platform** (Next.js 14 + Supabase, Track 5B). **Submission is tomorrow morning.** CRUD + persistence are already fixed. Your job now: harden correctness, finish the real user/auth system, integrate the CareerOS intelligence (ATS + mock interviewer), deploy, and inspect. Work in order; don't refactor working code; verify each write persists after reload.

## PHASE 0 — Deploy + audit + realistic data (do FIRST)
1. Deploy THIS app to Vercel (not pacio-two): set env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; create Storage buckets `mou-docs`, `college-logos`, `reports`, `certificates`; deploy edge functions. Get the public URL.
2. On prod, run `POST /api/admin/fix-realism` + the health recompute for all 25 colleges. Verify readiness/risk/health are varied and **persist on reload**.
3. Smoke-test 6 roles on the public URL (incognito + mobile): `admin@careeros.app`, `am@careeros.app`, `tpo@kmit.edu`, `hod@kmit.edu`, `faculty@kmit.edu`, `club@kmit.edu` (pwd `careeros2026`) → each lands on the right portal, one write persists, forbidden URLs blocked.
**GATE 0:** public URL works, all 6 roles pass, data looks realistic. *Mistake to avoid: testing only on localhost — always re-verify on the deployed URL in incognito (stale cache hides bugs).*

## PHASE 1 — Correctness & data-freshness hardening
1. **MOU renew bug:** `RenewMOUButton` hardcodes `seats='100'`, `share='10'`, so every renew overwrites the real values. Pass the MOU's **current** `seats_purchased`, `revenue_share_pct`, `expiry_date` from the server page into the modal and use them as the defaults; on submit only change edited fields. *Mistake to avoid: hardcoded modal defaults that clobber real data.*
2. **Sweep EVERY edit modal** (FDP, college, revenue, student, etc.) for the same hardcoded-default problem — all must **pre-fill current DB values as props**.
3. **Validation + DB CHECK constraints:** `seats_purchased ≥ seats_used` (fix the 71/64), `expiry_date > today`, `revenue_share_pct 0–100`, `cgpa 0–10`. Fix any existing data that violates these.
4. **Data freshness:** confirm every list/detail page is `force-dynamic`, router cache disabled (`staleTimes:{dynamic:0}` — already set), every write API calls `revalidatePath` and the button `router.refresh()`. **Verify cold-load freshness:** open the deployed site in incognito → recent changes/history show with NO manual refresh.
5. **Writes:** every mutation through a service-role API route; check `error` AND affected row count; never toast success on a 0-row update.
**GATE 1:** edit a MOU/FDP/student → reload (and incognito) → correct values persist; no over-capacity seats.

## PHASE 2 — Real per-user auth + dynamic Create-User
> Portals are role-based (no per-user pages). A new user with a role automatically gets the matching portal. The task is a REAL create-user that can log in.
1. **Create-User flow** (admin → RBAC/Users → "Add User"): form = name, email, password (or auto-generate a temp shown to admin), role, college → `POST /api/users/create` (service client):
   - `supabase.auth.admin.createUser({ email, password, email_confirm:true, user_metadata:{ name, role, college_id } })` → insert `users` row with the **same `auth_id`**. Handle "already registered"; return real errors; show the temp password. *Mistake to avoid: inserting only the `users` row without `auth.admin.createUser` — the user then can't log in.*
2. **Verify live:** create a test user → log in as them in incognito → they land on their role's portal and see only their data.
3. **Login page:** accept any valid email+password (it already does); keep a small collapsible "Demo logins" list for judges. Confirm **Sign Out** works (UserMenu dropdown visible/opens upward).
**GATE 2:** you can create a user from the admin UI and immediately log in as them.

## PHASE 3 — CareerOS reuse: ATS → Student 360° (flagship)
> Study `C:\Users\NIKHIL\OneDrive\ドキュメント\Claude Projects\CareerOS AI\CareerOS-AI`: `resume-server/controllers/atsController.js`, `resume-server/utils/extractResumeText.js`, `guidance/scoring-engine.js`.
1. Port `analyzeResumeText()` + `extractResumeText()` → `POST /api/ats/analyze` (PDF/DOCX/TXT/OCR → score + skills + strengths/weaknesses/skill-gap). It's 100% local/rule-based — no API keys.
2. On **Student 360°**: real **resume upload → ATS score + recommended skills**; compute a **CareerOS Readiness Score** from ATS + CGPA + training + assessments so readiness/risk are *derived, not seeded*. Add the rich sections: badges, CareerOS scores, strengths/needs-improvement, training timeline, placement journey, AI recommendation.
**GATE 3:** uploading a resume on Student 360° returns a real ATS score + skill gap.

## PHASE 4 — Mock Interviewer (standout, honest) + AI polish
1. **AI Mock Interview:** add an "AI Interview Readiness" page / a "Launch Mock Interview" button on Student 360° that embeds `https://embed.liveavatar.com/v1/6bb399fb-fc3c-4e1a-893e-5c4a2de11988?orientation=horizontal` (same as CareerOS). **Label it honestly** ("powered by LiveAvatar"). **Test it loads on the deployed URL**; keep it a clearly-bonus feature (don't let the demo depend on it).
2. **Polish:** Health Score 6-factor breakdown + verdict; Placement Prediction "expected placements" card + probability lists; rule-based **AI Executive Summary** atop reports.
3. **Good-to-have quick wins** (by effort): G5 co-branded report logo, G10 seat tracking, G6 digest, G3 workshop request, G2 chat, G9 e-sign.

## PHASE 5 — Final inspection + submission
Run the checklist in `docs/17` (public URL incognito+mobile; 6 roles; create-user; per-module write persists; MOU seats/share correct; report PDFs clean; Student 360°/Health/Predictor real; no empty pages). Update README feature→file map + 6 role logins. Record the 5–7 min demo video. **Submit.**

## Rules
Additive only; pre-fill every edit modal from current DB values; every mutation via a service-role API route (check error + row count); `force-dynamic` + revalidate so views are always fresh; create real auth users (not just `users` rows); label third-party AI honestly; keep `npm run build` green; redeploy + incognito-test after each phase; report blockers with exact errors and STOP at each GATE for confirmation.

## UI/animations
Do NOT spend time here until Phases 0–4 are solid. The full UI + animation playbook (count-up-on-scroll, GSAP ScrollTrigger, premium components) is in `docs/19` — that's the parallel/after track.

=== END OF PROMPT ===
