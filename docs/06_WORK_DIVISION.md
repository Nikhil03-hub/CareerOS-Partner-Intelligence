# 06 · Work Division (3 Members) + Git Workflow + 48-Hour Plan

> 3 remote members, one shared GitHub repo (`CareerOS-AI`, Module-3 folder). The split below gives each person **distinct folders/routes** so you rarely touch the same files — the #1 way to avoid merge hell when working apart.
> Timeline anchored to: **today = Thursday 18 Jun 2026; deadline = Saturday 20 Jun, 6:00 PM.** ~48 hours.

---

## 1. Ownership split (by area → minimizes conflicts)

### 👤 Member A — Platform & Foundation Lead *(the critical path — start first)*
Owns everything the other two build on top of.
- Supabase project, **schema migrations**, **RLS policies**, Storage buckets *(sole owner of `supabase/migrations/`)*
- **Auth**: signup/login/logout/session, role middleware — **M1, M12**
- **Seed script** `scripts/seed.ts` — all tables, 25 colleges, expiring MOUs *(make-or-break)*
- **Admin panel** `/admin/*` — **M15**, Communication Center, Audit Logs
- **Communication triggers** — **M14**: Edge Functions `notify-dispatch` (Resend + Telegram), `renewal-cron` — **M13**
- **Deployment** (Vercel + Supabase), env vars, CI

### 👤 Member B — College Portal Lead *(the bulk of the 15)*
Owns `src/app/(college)/college/*` feature pages (except reports/360°/AI).
- College profile — **M2**
- Student roster — **M3**
- Program/cohort — **M4**
- Placements + funnel — **M5**
- Training tracking + heatmap — **M6**
- MOU management — **M7**
- FDP scheduling/attendance — **M8**
- Revenue share — **M10**
- Communication log — **M11**

### 👤 Member C — Intelligence, Reports & UX Lead *(the differentiators + polish)*
Owns the shared UI kit, AI, reports, and the showcase surfaces.
- **Design system port** from CareerOS (Inter, `#3B82F6`, cards) + **app shell/layout**
- **Shared UI kit** *(sole owner of `src/components/`)*: **DataTable** (search/sort/filter/export), KPI cards, chart wrappers, **Activity Timeline**, **Health Gauge**, Notification Bell, Global Search
- **Reports engine** (PDF/CSV) + Download Center — **M9**
- **AI layer** (rule-based) — **AI-1…AI-8** (`lib/ai/`, ported from CareerOS scoring)
- **Student 360°** — **G4**; **Benchmarking** — **G1**
- **Executive Command Center** + landing page
- **TPO Copilot**; **demo video** + README finalize

### Shared/coordination rules
- **Migrations are append-only and numbered.** Need a schema change? Ask A; A adds a new migration file. Never edit an existing migration.
- **C owns `src/components/`.** B/A *import* kit components, don't edit their internals — request changes in chat.
- **One owner per route folder.** If you must touch another's file, ping first.
- `lib/supabase/`, `lib/events.ts` (`logEvent`), `lib/rbac.ts` → A owns; published early as stable interfaces everyone calls.

---

## 2. Dependency order (who unblocks whom)

```
Thu evening:
  A: schema + auth + thin seed  ──unblocks──▶  B & C build against REAL tables
  C: design tokens + app shell + DataTable ──unblocks──▶  B's list pages
  B: M2 profile (low-dependency) + reserve all college route shells (empty pages)

Fri:  A → full seed + triggers + admin   |   B → M3–M8,M10,M11   |   C → M9 + AI + 360° + command center
Sat:  good-to-have by priority → freeze → QA → video → submit
```
**Critical path = Member A's schema+auth+seed.** Everything waits on it, so A goes heads-down Thursday night and ships a usable schema + seed before sleeping. B and C scaffold their areas in parallel using empty route shells + the UI kit, then fill once data is live.

---

## 3. Git workflow (shared repo, remote team)

- **`main` is always deployable** — Vercel auto-deploys it. Never push broken code to `main`.
- **Feature branches:** `feat/A-auth`, `feat/B-placements`, `feat/C-reports`, etc. One feature per branch.
- **Small, frequent PRs** (don't sit on a 2-day branch). Each PR: at least a quick review from one teammate **or**, if blocked, merge after the Vercel **preview deploy** passes a smoke test.
- **Always before you start a session:** `git pull --rebase origin main`. Rebase often to stay close to `main`.
- **Conventional commits:** `feat:`, `fix:`, `chore:`, `docs:`. Reference the feature ID (`feat(M5): placement funnel`).
- **Pinned team note** (chat/Notion): live URL, admin creds, env vars, seed logins, "who's touching what right now."
- **Daily integration checkpoints** (see timeline): everyone merges to `main`, A deploys, the team runs the demo flow end-to-end and logs breakages.
- **Conflict guard:** ownership boundaries above mean conflicts mostly only happen in `package.json` / shared `lib` — coordinate those in chat before merging.

---

## 4. The 48-hour timeline (hour-blocks)

> Adjust start times to your evening, but keep the **checkpoints** and the **Saturday feature-freeze** sacred.

### 🟦 THURSDAY (Day 0) — Foundation night (~5–6 hrs)
| Who | Tasks |
|---|---|
| **A** | Create Supabase project → write core schema migrations (identity, students, programs, enrollments, placements, companies, mous, fdp, revenue, comms, **activity_events**, ai_insights, audit) → enable RLS → seed Auth roles → deploy Next.js skeleton to Vercel (public URL live). Write **thin seed** (colleges + students + a few placements). |
| **C** | Scaffold Next.js (App Router) + Tailwind + shadcn → port CareerOS design tokens → build **app shell/layout + nav** → start **DataTable** + KPI card + chart wrappers. |
| **B** | Build **M2 College Profile** → create **empty route shells** for all college pages (reserves routing, prevents later conflicts) → start M3 roster layout. |
| **✅ Checkpoint (end of night)** | Schema live · auth works · skeleton deployed at public URL · design system + DataTable usable · routes reserved. Merge all to `main`. |

### 🟩 FRIDAY (Day 1) — Build all 15 mandatory (~12 hrs, 2 checkpoints)
| Block | A | B | C |
|---|---|---|---|
| **Morning** | Full **seed** (all tables, 25 colleges, **MOUs expiring in 7–30d**) → `notify-dispatch` Edge Fn (Resend + Telegram live) | M3 roster (full) → M4 programs/cohorts → M5 placements + funnel | M9 reports (PDF/CSV) + Download Center → AI-1 health score |
| **🔄 Midday checkpoint** | merge + deploy + smoke-test placements/roster/triggers | | |
| **Afternoon** | Admin panel core (approve/reject colleges, students, placements, MOU, users) + audit logging → `renewal-cron` (M13) | M6 training + heatmap → M7 MOU → M8 FDP | AI-2/3 risk+prediction → AI-4 exec summary → **Student 360° (G4)** |
| **Evening** | M14 triggers verified on all 4 events → Communication Center in admin | M10 revenue → M11 comms log | **Executive Command Center** (the 10-sec wow) |
| **✅ End-of-Day-1 target** | **All 15 mandatory working end-to-end on the live URL, seeded, with live Email+Telegram on the 4 trigger events, auth for all 6 roles.** Full merge + deploy + run the whole demo flow. |

### 🟨 SATURDAY (Day 2) — Good-to-have, AI polish, freeze, ship (until 6 PM)
| Time | Activity |
|---|---|
| **Morning** | Good-to-have by priority: **G1 benchmarking, G7 recruiters, G8 leaderboard**, then G2 chat / G3 workshop / G6 digest / G10 seats / G5 co-brand / G9 e-sign as time allows. AI: **TPO Copilot (AI-5)**, AI-6 renewal, AI-7 opportunity radar. |
| **~1:00 PM** | **🧊 FEATURE FREEZE.** No new features after this. Anything unfinished gets hidden, not half-shown (no broken links / empty states). |
| **1:00–3:00 PM** | **Full QA pass** (use the checklist in §5): every role login, every form persists after refresh, every trigger fires live, responsive on mobile, no Lorem ipsum, **One-Click Demo Reset** works, seed re-loads clean. |
| **3:00–4:30 PM** | **Record demo video** (5–7 min, the scripted flow from `04 §10`). Finalize **README**: feature-checklist mapping, env vars, **test credentials for all 6 roles**, confirm preloaded data. |
| **4:30–5:30 PM** | **Submission assembly + buffer:** live URL · admin URL + creds · repo link (organiser-accessible) · README · test logins · demo video · separated good-to-have list. Final deploy. Re-test the live URL from a fresh browser/incognito. |
| **6:00 PM** | **Submit.** ✅ |

> **Buffer discipline:** the last ~3 hours are for video + README + submission + deployment gremlins — **not** coding. Most hackathon losses happen here, not in the build.

---

## 5. Definition of Done + QA checklist (run Saturday)

**A feature is "done" only if:** it persists to Postgres after refresh · works for the correct role(s) and is blocked for others · shows seeded data on load (no empty state) · is responsive on mobile · its trigger/notification fires where applicable · no broken links.

**Submission QA (PDF §1 + §14):**
- [ ] Public homepage loads with no login; login works for **all 6 roles**
- [ ] Real DB persistence — create a record, refresh, it's still there
- [ ] Every screen shows seeded data (run demo-reset, verify no empty tables)
- [ ] All 4 mandatory triggers send **real** Email + Telegram (check Communication Center logs)
- [ ] Admin panel can approve a college / override a record / view audit log
- [ ] Reports generate + download (PDF + CSV) with logo + AI summary
- [ ] Mobile + desktop layouts both usable; no Lorem ipsum; no dead links
- [ ] README feature-checklist maps every must-have + lists implemented good-to-have
- [ ] Admin URL + credentials + 6 role logins documented
- [ ] Demo video covers every must-have feature (5–7 min)

---

## 6. Risk register (and the call to make)

| Risk | Mitigation |
|---|---|
| A's foundation slips → B/C blocked | A ships thin schema+seed **Thursday night** no matter what; B/C use empty shells + UI kit until then |
| Telegram/Resend integration fights back | Get **one** trigger working live early Friday; reuse the path for the other 3. Simulated-but-logged fallback exists (scores lower) only as last resort |
| Scope creep into AI/premium too early | **Layer gate:** no Layer-3/4 work until all 15 mandatory are green on the live URL |
| Merge conflicts | Strict folder ownership + append-only migrations + frequent rebase |
| Demo-day flakiness | All AI is rule-based + cached; One-Click Demo Reset restores the showcase instantly |
| Running out of time Saturday | Feature freeze at 1 PM; ship a complete 15-feature platform over a half-done 25 |

> **If you must cut:** cut **good-to-have and premium**, never a must-have. 15/15 mandatory + 3 standout AI moments + a clean demo beats a sprawling, half-working app every time.
