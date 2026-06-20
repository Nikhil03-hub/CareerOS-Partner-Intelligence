# 17 · Next Architecture & Roadmap — Final Stretch to Submission

> **Author:** Opus. **For:** the team + Sonnet 4.6. **Time left:** tonight + tomorrow morning (online submission). **Build prompt:** `docs/18`. **UI track:** `docs/19`.
> CRUD + persistence are now fixed (Sonnet). This doc is the **final roadmap**: harden correctness, finish the real auth/user system, bring in the CareerOS intelligence (incl. the mock interviewer), deploy, and inspect — in deadline-priority order, with per-item detail and the mistakes to avoid.

## Where we are (reconciled, honest)
Built + working: 15 mandatory, persistence/CRUD, College Health Score engine, Placement Predictor, Student 360° (G4), Benchmarking (G1), Leaderboard (G8), TPO Copilot, PDF reports, notifications, role-based portals, premium landing. **Production ~7.8/10.** Not done: deploy, a correctness/freshness hardening pass (the MOU-style bugs), real create-user, CareerOS ATS + mock-interviewer reuse, 6 good-to-have, realistic dataset, UI/animation polish.

## Priority order for the remaining hours (the spine — do in this order)
```
P0  Deploy + 6-role audit + realistic dataset        ← nothing matters without a live URL
P1  Correctness & data-freshness hardening + real Create-User/auth
P2  CareerOS reuse: ATS → Student 360 (flagship) + Mock-Interviewer embed
P3  Finish good-to-have (G5,G8✓,G10,G6,G3,G2,G9) + polish the AI features
P4  UI + animations (parallel/later — docs/19)
```
> Reality check: with the time left, **P0 + P1 + the ATS reuse + 2–3 good-to-have + deploy = a genuinely strong, production-feeling submission.** Treat the rest as bonus. Don't risk the working build for a shiny extra.

---

## P0 · Deploy + audit + realistic dataset (do first)
1. **Deploy to Vercel** (the new app, not pacio-two): env vars (`NEXT_PUBLIC_SUPABASE_URL`, `_ANON_KEY`, `SERVICE_ROLE_KEY`), 4 Storage buckets, edge functions. Get a **public URL**.
2. **Run the data scripts on prod:** `/api/admin/fix-realism` + recompute-health (all 25). Verify readiness/risk/health are varied and **persist**.
3. **Realistic dataset (judges notice):** ensure colleges differ — strong vs weak placement, high vs low revenue, varied FDP activity, varied MOU expiry. (fix-realism + recompute-health largely do this; spot-check a few colleges look distinct.)
4. **6-role smoke test on the public URL (incognito + mobile):** each of admin/AM/TPO/HOD/Faculty/Club → log in → land on correct portal → do one write → reload → it persisted → forbidden URLs blocked. Download a report PDF → no meta-text.

---

## P1 · Correctness & data-freshness hardening (the "fix the MOU case everywhere" pass)

### The universal rules (apply to EVERY edit/action on EVERY page)
1. **Edit modals MUST pre-fill the current DB values** (passed as props from the server page). The MOU bug: `RenewMOUButton` defaults `seats='100'`, `share='10'` → every renew overwrites the real numbers. **Fix:** pass the MOU's current `seats_purchased` + `revenue_share_pct` + `expiry_date` into the modal and use them as defaults. Repeat this audit for every edit modal (FDP, college edit, revenue, student edit) — never hardcode a value an edit could clobber.
2. **Validate before write:** `seats_purchased ≥ seats_used` (kills the 71/64), `expiry_date > today` (or > start), `revenue_share_pct 0–100`, `cgpa 0–10`. Enforce in the form AND as Postgres `CHECK` constraints (defense-in-depth).
3. **Always-fresh reads:** every list/detail page is `export const dynamic = 'force-dynamic'`; the router cache is disabled (`staleTimes:{dynamic:0}` already added). After any write, the API route calls `revalidatePath(...)` and the button calls `router.refresh()`. **Verify:** make a change → reload (and open fresh in incognito) → the new value shows with no manual hard-refresh.
4. **Writes go through service-role API routes** (already the pattern) and **check `error` AND row count** — never toast success on a 0-row update.

### Concrete fixes to make now
- **MOU renew modal:** pre-fill current seats/share/expiry; validate seats ≥ used; on renew, only change what the user edited.
- **MOU seats display:** if `seats_used > seats_purchased` exists in data, it's a seed/constraint bug — fix the data + add the constraint.
- **Sweep every `*Button` edit modal** for hardcoded defaults that overwrite real data; pre-fill from props.
- **Verify "fresh on first load":** open the deployed site cold (incognito) → recent changes/history show without clicking refresh.

---

## P1 · Real per-user auth + dynamic user creation (important to you — detailed)

**Clarification first:** real auth already works — **any of the 7 users can sign in with their own email + password**; the 3 buttons on the login page are just demo shortcuts. And **portals are role-based, not per-user** — you don't build a new page per user; a user's `role` decides their portal automatically. So "add a new user and create their page" = **create a real login with a role; the matching portal already exists.**

### What to build/confirm
1. **Create-User flow (admin → RBAC/Users → "Add User"):** form = name, email, **password** (or auto-generate a temp one shown to admin), role, college. → `POST /api/users/create` using the **service** client:
   - `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, role, college_id } })` → then insert the `users` row with the **same `auth_id`**.
   - Handle "already registered" gracefully; return a real error; show/copy the temp password.
   - **Gotcha to avoid:** do NOT only insert into the `users` table — without `auth.admin.createUser` the person cannot log in. Both must happen, with matching `auth_id`.
2. **The new user can immediately sign in** with those credentials → middleware routes them by `role` → their portal (TPO→college portal scoped to their college; HOD→dept scope; admin→admin). **Verify** by creating a test user live and logging in as them.
3. **Login page for production:** keep a clean real email/password form; the "demo accounts" block can stay as a small collapsible "Judge demo logins" list (helpful for evaluation) but the system must accept any valid user — not just the 3.
4. **Role → portal map (confirm each is complete + scoped):** super_admin → all admin; account_manager → admin (assigned colleges); tpo → full college portal; hod → dept-scoped; faculty_coord → training/FDP; club_coord → events. Each role's nav is already filtered — verify each lands correctly and sees only its data (RLS + layout checks).
5. **Real-world touches:** working Sign Out (UserMenu — ensure the dropdown opens upward/visible), suspend/reactivate (suspend exists), optional password reset. Supabase handles hashing/sessions/JWT — don't reinvent.

---

## P2 · CareerOS AI reuse (the differentiator — paths included)
> Repo: `C:\Users\NIKHIL\OneDrive\ドキュメント\Claude Projects\CareerOS AI\CareerOS-AI` (connected). **Study the files, port logic, don't rebuild.**

1. **⭐ ATS engine → Student 360° (flagship reuse).** Port `resume-server/controllers/atsController.js` (`analyzeResumeText`) + `utils/extractResumeText.js` (PDF/DOCX/OCR) → `POST /api/ats/analyze`. On Student 360°: real resume upload → ATS score + **skill-gap → recommended skills**. Feed ATS + CGPA + training + assessments into a **CareerOS Readiness Score** so readiness/risk are *derived, not seeded*. This is the single highest-value remaining feature.
2. **AI Mock Interviewer (standout) — it's a live iframe embed.** In CareerOS `client/src/components/mock-interview.js` it embeds `https://embed.liveavatar.com/v1/6bb399fb-fc3c-4e1a-893e-5c4a2de11988?orientation=horizontal`. Reuse = add an **"AI Interview Readiness"** page (or a "Launch Mock Interview" button on Student 360°) that embeds the same iframe — live and working. **See the honesty note below.**
3. **Career-intelligence model pattern** (`client/src/components/career-intelligence.js` uses a ridge-regression scorer) — reuse the *approach* for Placement Prediction if useful; the rule-based scorer you already have is fine.

### 🟨 Honest recommendation on the Mock Interviewer (you asked)
Use it — **live, integrated, and honestly labeled** (e.g., "AI Mock Interview — powered by LiveAvatar"). Do **not** hide that it's a third-party/ready-made tool. Reasons: (a) using open-source/third-party AI is completely standard and accepted — real products and winning hackathon teams do it constantly; judges reward good *integration*, not from-scratch model training; (b) hiding it is the bigger risk — if a judge asks and it looks concealed, that damages trust far more than honestly saying "we integrated an existing model." Frame it as engineering: "we integrated a live AI interviewer into the student journey and tie its output into our readiness score." Build it **after** the 5B core + ATS reuse, and **test it on the deployed URL** (third-party embeds can be flaky/rate-limited) — keep it a clearly-bonus feature so the demo never depends on it. If it's unreliable on the day, show a recorded readiness report instead. Net: **honesty + live integration beats faux-originality every time.**

---

## P3 · Polish the intelligence features (verify they're "wow", not just present)
- **Student 360° (flagship):** header + badges (placement/training/risk); **CareerOS scores** (Readiness/Interview/Skill/Placement) from the ATS reuse; strengths + needs-improvement; **training timeline**; **placement journey** timeline; **AI recommendations**; ATS upload + "Launch Mock Interview". (Detailed spec in `chatgpt next features.txt` / `docs/04`.)
- **College Health Score:** gauge + **6-factor breakdown** + AI verdict on the dashboard and college detail (not just a number).
- **Placement Prediction:** "Expected placements this semester = N" card → drill into High/Medium/Needs-intervention probability lists.
- **Executive Reports:** a rule-based **AI Executive Summary** at the top of each report ("Placement up 12%, AIML best, FDP attendance down 8% → recommend faculty refresher").
- **Benchmarking (G1), Leaderboard (G8), Promtal hiring view (G7):** confirm real + visual.

## P3 · Remaining good-to-have (quick wins, by effort)
Easy first: **G5 co-branded report logo**, **G10 seat tracking** (purchased/used/remaining; pairs with the seats constraint), **G6 automated digest** (cron), **G3 workshop request**, **G2 TPO↔AM chat** (Realtime), **G9 MOU e-sign** (click-to-accept). Mark each in the README good-to-have list as done.

---

## P4 · UI + animations (parallel/later) → `docs/19`
Don't block submission on this. When ready: count-up-on-scroll for the landing stats (the "1.62 Cr" starts at 0 and animates when scrolled into view), GSAP ScrollTrigger reveals, premium components (Aceternity/Magic UI/Tremor), per-page polish. Full playbook in `docs/19`.

---

## Final inspection checklist (before submitting)
☐ Public Vercel URL loads in incognito + mobile · ☐ all 6 roles log in + land correctly · ☐ create a new user live → they can log in → correct portal · ☐ one write per module persists after reload (no manual refresh) · ☐ MOU renew keeps correct seats/share · ☐ no `seats_used > seats_purchased` · ☐ report PDFs download, real numbers, no meta-text · ☐ Student 360° + Health Score + Predictor look real · ☐ ATS upload works (if shipped) · ☐ mock interview embed loads (if shipped) · ☐ no empty/"0" pages · ☐ README feature→file map + 6 role logins · ☐ 5–7 min demo video.

## What's next (so you know the plan)
1. **Tonight:** P0 deploy + audit + dataset → P1 hardening (MOU + edit-modal sweep) + Create-User → P2 ATS reuse into Student 360°.
2. **Tomorrow morning:** P2 mock-interviewer embed (if stable) → P3 quick good-to-have + AI polish → final inspection → README + demo video → **submit**.
3. **After submission / if time:** P4 UI + animation polish (`docs/19`).
