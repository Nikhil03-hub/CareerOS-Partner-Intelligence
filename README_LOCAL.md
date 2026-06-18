# Skill Tank Partner Intelligence Platform

> **SummerSaaS Hackathon 2026 — Finale Round | Track 5B (Skill Tank: College/TPO Partner Dashboard)**
> A production-grade B2B EdTech portal where college Training & Placement Officers manage their Skill Tank partnership — enrollment, training, placements, FDP, MOU, revenue share and AI-powered insights — *powered by the CareerOS AI intelligence layer carried over from Module 2.*

---

## 1. The one-line pitch

> **"The operating system Skill Tank uses to run, grow and renew every college partnership — and the intelligence layer that tells them which colleges to act on next."**

We are **not** building a "College Dashboard." We are building the **Skill Tank Partner Intelligence Platform** — an event-driven, multi-tenant B2B SaaS that any startup account-management team would actually log into tomorrow. The CareerOS AI engine from Module 2 becomes the **Student & College Intelligence Layer**, giving us a differentiator no other Track 5B team can replicate: *an existing AI product naturally plugged into the portal.*

This continuity is the strategic core of our submission: judges should feel **"these people didn't build another hackathon project — they evolved a product."**

---

## 2. Why this wins (the strategy in 5 points)

1. **Continuity story.** Module 2 (CareerOS AI) → Module 3 (Partner Intelligence Platform). One product narrative across the hackathon.
2. **B2B SaaS feel, not CRUD.** Event-driven architecture, role-specific dashboards, audit trails, and a health-score "digital twin" of each college.
3. **All 25 features are first-class.** 15 must-have + 10 good-to-have, fully working with seeded data — because the PDF states incomplete submissions are *not evaluated*.
4. **An AI layer that does work, not a chatbot.** A **TPO Copilot** that executes workflows ("show students at risk", "generate the placement report"), a **Placement Prediction Engine**, and **AI Executive Summaries** on every report.
5. **Wow in 10 seconds.** The **Executive Command Center** landing surfaces 25 colleges, thousands of students, placements, revenue share and active MOUs the moment a judge logs in. No empty tables, anywhere.

---

## 3. Final tech stack (and why)

| Layer | Choice | Why (under a ~48-hour, 3-member, remote constraint) |
|---|---|---|
| **Frontend** | **Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui** | Reuses the team's existing React/Tailwind skills (Module 2 is React+Tailwind). SSR/SSG covers the PDF's *SEO-friendly + mobile-friendly* rule for the public landing. shadcn/ui = enterprise look with zero design time. |
| **Backend + DB** | **Supabase (managed PostgreSQL + Auth + Storage + Edge Functions + Row-Level Security)** | The PDF requires a **real persistent database** (no localStorage / mock arrays). Supabase *is* real PostgreSQL — judges see exactly that. It also gives us **Auth (JWT under the hood), file Storage, and serverless functions** out of the box, removing the single biggest 48-hour risk: hand-building + deploying a second API service. |
| **Communication triggers** | **Resend (Email) + Telegram Bot API** | PDF mandates Email **plus** one of WhatsApp/Telegram. Telegram is the free, reliable, live option (PDF's own recommended fallback). Both fire from a central, event-driven Communication Hub — *live*, not simulated. |
| **Charts / viz** | **Recharts** (+ a lightweight heatmap) | Funnels, health gauges, benchmarking bars, hiring insights. |
| **PDF reports** | **@react-pdf/renderer** (client) / Edge Function (server) | Placement / training / department / MOU reports, co-branded with college logo. |
| **CSV** | **PapaParse** | Bulk import + every-table export. |
| **Hosting** | **Vercel (frontend) + Supabase Cloud (backend)** | One-click public URL, auto HTTPS, instant deploys. Satisfies "live working application." |
| **AI layer** | **LLM API (Gemini / Claude / OpenAI) via Edge Functions, with rule-based fallback** | Same approach Module 2 already wired (`aiExplain()`). Rule-based first so it always works in the demo; LLM enriches narratives. |

### Reconciliation note vs. ChatGPT's m3 plan
ChatGPT proposed **Next.js + FastAPI + Postgres** on a 7-day plan. We keep **Next.js, PostgreSQL, JWT auth, shadcn, Vercel, Resend, Telegram** exactly as proposed, and **replace standalone FastAPI with Supabase**. Reason: with ~48 hours and 3 remote members, building, securing, *and deploying* a separate Python API + hand-rolled auth + CRUD endpoints for ~14 modules is the highest-risk path, and the PDF penalizes incompleteness more than it rewards a separate service. Supabase delivers the same *production-grade PostgreSQL B2B SaaS* outcome with a fraction of the build risk. A thin **Python FastAPI "AI microservice"** remains an optional stretch goal for the AI layer only (see `docs/04_AI_INTELLIGENCE_LAYER.md`).

---

## 4. Document index

| Doc | What's inside |
|---|---|
| **`docs/01_ARCHITECTURE.md`** | End-to-end system architecture, full PostgreSQL data model (all tables), the event-driven `activity_events` backbone, RBAC + 6 roles, communication-trigger architecture, deployment topology, RLS multi-tenancy, seeding strategy, repo structure. |
| **`docs/02_MANDATORY_FEATURES.md`** | Deep design of **all 15 must-have features** — PDF requirement, data, UI/pages, logic, my add-ons, acceptance criteria, CareerOS reuse. *(Layer 1 — build first.)* |
| **`docs/03_GOOD_TO_HAVE_FEATURES.md`** | Deep design of **all 10 good-to-have features**, same structure. *(Layer 2.)* |
| **`docs/04_AI_INTELLIGENCE_LAYER.md`** | The CareerOS AI layer + **standout "wow" features** + the **winning judge demo flow**. *(Layer 3 — the differentiator.)* |
| **`docs/05_PREMIUM_ENHANCEMENTS.md`** | Prioritized **future-architecture guidance**: enterprise/premium enhancements (ChatGPT's + my additions), tiered, "build only after mandatory is 100%." *(Layer 4.)* |
| **`docs/06_WORK_DIVISION.md`** | 3-member ownership split, git branching/PR workflow, conflict-avoidance rules, and an hour-by-hour 48-hour timeline (Thu → Sat 6pm) with merge checkpoints. |

> **Build order is strict:** Layer 1 (15 must-have) → Layer 2 (10 good-to-have) → Layer 3 (AI) → Layer 4 (premium). **Do not start a later layer until the previous is deployed, seeded, and demoable.**

---

## 5. The 6 user roles (multi-user access — Mandatory #12)

| Role | Scope | Sees |
|---|---|---|
| **Super Admin** (Skill Tank) | Platform-wide | Everything — all colleges, the admin panel, audit logs, dataset/seed controls |
| **Skill Tank Account Manager** | Assigned colleges | Cross-college portfolio, communication logs, renewal pipeline, AI Copilot |
| **TPO** (college) | Own college | Full college dashboard: roster, placements, training, FDP, MOU, revenue, reports |
| **HOD** (college) | Own department | Department-scoped analytics, roster, placements |
| **Faculty Coordinator** (college) | Own FDP/training | FDP sessions, attendance, training analytics |
| **Club Coordinator** (college) | Own events/workshops | Workshop requests, event participation |

Enforced by **PostgreSQL Row-Level Security** keyed on `college_id` + `role` — true multi-tenancy, not UI hiding.

---

## 6. Submission-requirements checklist (PDF §14)

> This README doubles as the required submission README. Fill the bracketed items once deployed.

- [ ] **1. Live application URL** — public homepage, login only for app features → `[VERCEL_URL]`
- [ ] **2. Admin panel URL + admin credentials** → `[VERCEL_URL]/admin` · `superadmin@skilltank.dev` / `[pwd]`
- [ ] **3. Source code repo** (accessible to organisers) → `https://github.com/Nikhil03-hub/CareerOS-AI` (Module-3 folder)
- [ ] **4. README** — tech stack ✔ · setup/run instructions ✔ · env vars ✔ · **feature checklist mapping each feature to where it lives** (see §7)
- [ ] **5. Test logins, one per role** (6 roles — see seed accounts table in `docs/01_ARCHITECTURE.md` §Seeding)
- [ ] **6. Sample/dummy data preloaded** — confirmed via seed script; 25 colleges, ~2,500 students, ~1,200 placements, FDP, MOU, revenue, comms logs
- [ ] **7. Demo video (5–7 min)** walking every must-have feature → `[VIDEO_URL]`
- [ ] **8. List of good-to-have features implemented**, separated from must-have → see `docs/03_GOOD_TO_HAVE_FEATURES.md` "Implemented" tracker

### General-rules compliance (PDF §1, all 13)
Production-ready/deployable ✔ · live public URL ✔ · real DB (Postgres) with persistence ✔ · every feature demoable with seeded data ✔ · realistic preloaded data ✔ · forms persist ✔ · payment **not required** for 5B (revenue-share is *view-only* — no gateway bolted on, per Rule 7) ✔ · **live** Email + Telegram triggers ✔ · one central admin panel ✔ · auth end-to-end for all 6 roles ✔ · responsive desktop+mobile ✔ · no broken links / no Lorem ipsum ✔ · mobile + SEO friendly (Next.js SSR) ✔

---

## 7. Feature checklist → where it lives (to be completed during build)

> Required by submission item #4. Template — fill `route` + `component` columns as you build. Full per-feature spec in `docs/02` and `docs/03`.

| # | Must-Have Feature | Route | Owner |
|---|---|---|---|
| 1 | College/TPO signup + admin approval | `/signup`, `/admin/colleges` | — |
| 2 | College profile (university, depts, partnership type) | `/college/profile` | — |
| 3 | Student roster management | `/college/students` | — |
| 4 | Program/cohort tracking | `/college/programs` | — |
| 5 | Placement outcomes dashboard | `/college/placements` | — |
| 6 | Training completion tracking | `/college/training` | — |
| 7 | MOU/partnership document management | `/college/mou` | — |
| 8 | FDP scheduling + attendance | `/college/fdp` | — |
| 9 | Downloadable reports (PDF/CSV) | `/college/reports` | — |
| 10 | Revenue-share visibility | `/college/revenue` | — |
| 11 | Communication log w/ account manager | `/college/comms` | — |
| 12 | Multi-user access per college (RBAC) | `/college/team` | — |
| 13 | Renewal/expiry alerts | (cross-cutting) | — |
| 14 | Automated comms triggers (Email+Telegram) | (cross-cutting) | — |
| 15 | Central admin panel | `/admin/*` | — |

*(Good-to-have mapping table lives in `docs/03_GOOD_TO_HAVE_FEATURES.md`.)*

---

## 8. Reusable assets from CareerOS AI (Module 2)

The Module-2 project (`../10th`, `../12th`, `../graduate`) is React + Tailwind, CDN-loaded, with template-based "AI". These assets carry directly into Module 3:

| CareerOS Module-2 asset | Reused in Module 3 as |
|---|---|
| **Weighted scoring algorithm** (interest 45% + academics 55%, normalized) | The math pattern behind **College Health Score**, **Placement Prediction**, **Student Risk** scoring (see `docs/04`) |
| **`aiExplain()` template system** + LLM hook (Gemini/Claude/OpenAI) | **AI Executive Summary** + **TPO Copilot** narrative generation |
| **Animated "AI processing" screen** | Reused for AI report generation / prediction UX (the "it's actually thinking" trust cue) |
| **Design system** — Inter font, blue `#3B82F6` primary, 12px cards, color-coded identity, mobile-first | Direct visual continuity → ported into the shadcn/Tailwind theme |
| **Phase-by-phase roadmap UI** | **Placement Journey timeline** + **Activity Timeline** components |
| **Result-page multi-tab layout** | **Student 360°** and **College Health** detail pages |

> Practical note: Module 2 runs from in-browser Babel/CDN with no backend. Module 3 graduates the *patterns and content* (scoring weights, copy, palette, UX) into a real Next.js + Supabase app. We port the **logic and look**, not the file format.

---

## 9. Local setup (to fill in once code exists)

```bash
# Prereqs: Node 18+, a Supabase project, Resend API key, a Telegram bot token
git clone https://github.com/Nikhil03-hub/CareerOS-AI
cd CareerOS-AI/skill-tank-partner-platform
npm install
cp .env.example .env.local   # fill the vars below
npm run db:seed              # loads 25 colleges + students + placements + ...
npm run dev                  # http://localhost:3000
```

### Environment variables (`.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never exposed
RESEND_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_DEFAULT_CHAT_ID=         # for demo notifications
LLM_API_KEY=                      # Gemini/Claude/OpenAI for AI layer
NEXT_PUBLIC_APP_URL=
```

---

## 10. Team

3-member remote team, shared GitHub repo. Ownership split + 48-hour timeline in **`docs/06_WORK_DIVISION.md`**.
Built on the foundation of **CareerOS AI** (Module 2). Contact: rtrprojectai@gmail.com
