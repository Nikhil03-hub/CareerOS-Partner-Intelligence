# 02 · Mandatory Features (15) — Deep Design · LAYER 1

> **Build these first, fully, before anything else.** The PDF: *"incomplete submissions will not be evaluated."* Each feature below is locked to the PDF requirement — the **Add-ons** only *strengthen* it, never replace it. Tables/events refer to `01_ARCHITECTURE.md`.

**Reading key per feature:** *Requirement* (PDF) · *Data* · *Pages/UI* · *Logic & flow* · *Add-ons (mine)* · *Done when* (acceptance) · *Reuse* (from CareerOS).

---

## M1 · College/TPO signup & onboarding with admin approval

- **Requirement:** TPO signs up; account stays inactive until a Skill Tank admin approves it, so only verified institutional partners get access.
- **Data:** `users` (role=`tpo`, status=`pending`), `colleges` (status=`pending`), Storage for any verification doc.
- **Pages/UI:** `/signup` (multi-step: account → college details → submit) → "pending approval" holding screen. Admin sees queue at `/admin/colleges`.
- **Logic & flow:** Supabase Auth creates the user but a DB flag `status=pending` blocks dashboard access (enforced in middleware + RLS). Admin **Approve** flips `colleges.status` + `users.status` to `approved`, writes `college.approved` event → `notify-dispatch` emails+Telegrams the TPO a welcome/activation message. **Reject** sets `rejected` with a reason.
- **Add-ons:** (a) email-domain hint check (warn if personal Gmail vs institutional domain) as a soft data-quality nudge; (b) onboarding checklist on first login ("add departments → import students → upload MOU"); (c) auto-create the 4 default departments on approval to avoid an empty profile.
- **Done when:** a brand-new signup cannot see any college data until approved; approval triggers a real email + Telegram; rejected users see the reason.
- **Reuse:** CareerOS role-selection UX pattern (Student/Parent) → adapted to role-aware signup.

---

## M2 · College profile (institution details, university, departments, partnership type)

- **Requirement:** Store institution details, affiliated university, departments, and partnership types (CRT, FDP, External Placement Partner, etc.).
- **Data:** `colleges`, `departments`.
- **Pages/UI:** `/college/profile` — editable cards: Institution (name, code, city, state, logo upload), Affiliation (university), Departments (add/edit/remove chips), Partnership Types (multi-select chips), Account Manager (read-only, assigned by Skill Tank).
- **Logic & flow:** Logo upload → `college-logos` bucket (reused later for co-branded reports). `partnership_types` is a text[] enabling the profile to drive which modules show.
- **Add-ons:** (a) **profile completeness meter** (CareerOS-style) nudging missing fields — feeds the Data-Quality engine later; (b) public-style "college card" preview showing how the college appears in admin's portfolio; (c) editing writes an `audit_log` + `college.updated` event.
- **Done when:** TPO edits profile, refresh persists, logo shows on generated reports, admin sees the same profile.
- **Reuse:** CareerOS card design system + completeness-meter pattern.

---

## M3 · Student roster management

- **Requirement:** TPO can view/add the list of students from their college enrolled in Skill Tank programs.
- **Data:** `students` (+ `departments`).
- **Pages/UI:** `/college/students` — the **reusable DataTable** (search + sort + filter + export, see Add-ons), columns: name, roll, dept, batch, CGPA, placement status, risk badge. "Add Student" modal; row → Student 360° (`/college/students/[id]`).
- **Logic & flow:** CRUD via Supabase client under RLS (TPO sees only own college; HOD only own dept). Each add writes `student.enrolled` event.
- **Add-ons:** (a) the shared **DataTable component is built once here** and reused on every list page — search, multi-column sort, faceted filters (dept/batch/status), CSV export, pagination; (b) **risk badge** (low/amber/high) wired to the AI layer; (c) inline validation (duplicate roll/email) feeding Data-Quality alerts.
- **Done when:** add/edit/delete persists; filters + export work; HOD sees only their department's students.
- **Reuse:** CareerOS academic-input UI patterns for the add-student form.

---

## M4 · Program / cohort tracking

- **Requirement:** Track which Skill Tank program (CRT, Interview Master, FDP, etc.) each student/faculty is enrolled in, and their status.
- **Data:** `programs`, `cohorts`, `enrollments`.
- **Pages/UI:** `/college/programs` — list of cohorts the college participates in, each expandable to enrolled members + status; enroll students into a cohort (single or bulk).
- **Logic & flow:** `enrollments.status` lifecycle: enrolled → in_progress → completed → dropped, each transition logged as an event (powers timelines + funnels).
- **Add-ons:** (a) **cohort progress bar** (avg `progress_pct` across enrollees); (b) **enroll-a-batch** action (ties into Bulk Actions later); (c) program-mix donut on the college dashboard.
- **Done when:** a student appears under the correct cohort with a live status; status changes persist and show on the student timeline.
- **Reuse:** CareerOS roadmap/phase UI → cohort progress visualization.

---

## M5 · Placement outcomes dashboard

- **Requirement:** For students from this college — how many placed, through which company, and when (linking conceptually to the Promtal placement flow).
- **Data:** `placements`, `companies`, `students`.
- **Pages/UI:** `/college/placements` — KPI cards (total placed, placement %, avg package, highest package), placements table (student, company, role, package, date, type), trend chart, top-recruiters bar.
- **Logic & flow:** Add placement → updates `students.placement_status=placed` + writes `placement.accepted` event → triggers notification (M14). `source` field allows `promtal` records (cross-track-ready).
- **Add-ons:** (a) **Placement Funnel** (Eligible → Applied → Interviewed → Selected) — judges love it; (b) **Company Hiring Insights** (top recruiters with counts); (c) department-wise placement % comparison; (d) "expected placements this semester" hook for the AI prediction layer.
- **Done when:** adding a placement updates KPIs + funnel live, fires a real Email/Telegram, and appears on the student's 360° journey.
- **Reuse:** CareerOS salary/career-data presentation → package range visuals.

---

## M6 · Training completion tracking per student

- **Requirement:** Progress and completion status per student, pulled from Skill Tank program records.
- **Data:** `enrollments.progress_pct`, `training_progress`, `assessments`, `certificates`.
- **Pages/UI:** `/college/training` — completion overview (avg %, completed vs in-progress), per-program breakdown, table of students with progress bars; drill to a student's module-level progress.
- **Logic & flow:** `training_progress` rolls up to `enrollments.progress_pct`; reaching 100% + passing assessments → `training.completed` + `certificate.issued` events.
- **Add-ons:** (a) **attendance heatmap** (month-wise, premium look); (b) completion-rate trend; (c) "at-risk on training" flag (low progress + low attendance) feeding the risk engine; (d) certificate auto-issue toggle.
- **Done when:** progress numbers match seeded data, charts render, completing a course issues a certificate + event.
- **Reuse:** CareerOS progress-bar + animated states.

---

## M7 · MOU / partnership document management

- **Requirement:** Upload, store, and view the partnership agreement and its term/renewal date.
- **Data:** `mous`, `mou_renewals`, Storage `mou-docs`.
- **Pages/UI:** `/college/mou` — list of MOUs (title, type, start, expiry, status badge), upload (PDF → signed URL), detail drawer with document preview + renewal history + countdown to expiry.
- **Logic & flow:** Upload writes `mou.uploaded` event; status auto-managed (active/expiring/expired) by `renewal-cron`.
- **Add-ons:** (a) **expiry countdown** + traffic-light status; (b) **Renewal Risk indicator** (green/amber/red from placements+engagement+days-left, AI layer); (c) MOU timeline (uploaded → renewed → ...); (d) e-sign status field surfaced (good-to-have #9 ready).
- **Done when:** upload persists + previews, expiry date drives status, renewal updates history.
- **Reuse:** —

---

## M8 · FDP scheduling & attendance tracking

- **Requirement:** Schedule Faculty Development Programme sessions and track attendance for faculty members from the college.
- **Data:** `faculty`, `fdp_sessions`, `fdp_attendance`.
- **Pages/UI:** `/college/fdp` — calendar/list of sessions (speaker, topic, date, capacity, status), "Schedule FDP" form, attendance marker (check faculty present), per-session attendance %.
- **Logic & flow:** Scheduling writes `fdp.scheduled` → notification (M14). Marking attendance writes `fdp.attended` per faculty.
- **Add-ons:** (a) **FDP analytics**: sessions/attendance/certificates KPIs + **attendance heatmap**; (b) auto-issue FDP certificate on attendance; (c) capacity/waitlist guard.
- **Done when:** scheduling fires a real notification, attendance persists, analytics + heatmap render from seeded sessions.
- **Reuse:** CareerOS card/scheduling visual patterns.

---

## M9 · Downloadable reports (PDF / CSV)

- **Requirement:** Placement summary, training completion summary, cohort performance — downloadable for the TPO's internal use.
- **Data:** reads across tables; writes `reports` (+ Storage `reports`).
- **Pages/UI:** `/college/reports` — pick report type + period → generate → preview → download PDF/CSV. Generated reports saved to the **Download Center**.
- **Logic & flow:** `report-generate` Edge Function assembles data → renders branded PDF (@react-pdf with college logo) → uploads to Storage → writes `reports` row + `report.generated` event → notification (M14). CSV path uses PapaParse.
- **Add-ons:** (a) **AI Executive Summary** auto-prepended to each report (AI layer); (b) **enterprise report templates** (Placement Review, Quarterly Review, NAAC/NBA-style) — TPOs actually use these; (c) **co-branded** logo (good-to-have #5); (d) **Report Scheduler** weekly/monthly (good-to-have #6 / digest-cron).
- **Done when:** a generated PDF downloads with real seeded numbers + logo, is listed in Download Center, and fires a "report ready" notification.
- **Reuse:** CareerOS "Save as PDF" + animated processing screen during generation.

---

## M10 · Revenue-share / commission visibility

- **Requirement:** If the college is in a revenue-sharing arrangement, the TPO sees their accrued share and payout status.
- **Data:** `revenue_share`, `payouts`.
- **Pages/UI:** `/college/revenue` — accrued share total, by-period breakdown table, payout status badges, simple trend chart.
- **Logic & flow:** **View-only for the TPO** — no payment gateway (PDF Rule 7: payment only where required; 5B doesn't process money). Skill Tank admin records/updates revenue + payout status; `payout.processed` event → notification.
- **Add-ons:** (a) projected next-period share; (b) payout history timeline; (c) admin-side payout approval workflow (premium).
- **Done when:** TPO sees accrued share + payout status from seeded data; admin marking a payout "paid" updates the TPO view + notifies.
- **Reuse:** CareerOS ROI-section presentation (parent ROI module) → revenue cards.

---

## M11 · Communication log with Skill Tank account manager

- **Requirement:** Notes/meeting records between the college and Skill Tank's account manager.
- **Data:** `communication_logs`.
- **Pages/UI:** `/college/comms` — chronological log (type chip: note/meeting/call, subject, body, author, date), "Add entry" form. Account manager sees the same log for their colleges.
- **Logic & flow:** Both TPO and account manager can append; entries are immutable history (edits create audit trail).
- **Add-ons:** (a) filter by type/date; (b) "next meeting" reminder that can fire a notification; (c) this log seeds context for the AI Account Manager copilot.
- **Done when:** entries persist, both sides see them, filterable.
- **Reuse:** —

---

## M12 · Multi-user access per college (RBAC)

- **Requirement:** TPO, a department HOD, and a club coordinator can each have their own logins under the same college account, with appropriate permission scoping.
- **Data:** `users` (role + department_id + college_id), RLS policies.
- **Pages/UI:** `/college/team` — TPO invites/creates HOD, Faculty Coordinator, Club Coordinator logins (scoped); list of college users + roles.
- **Logic & flow:** Invitation creates a scoped user; RLS + middleware enforce role/department scope (see access matrix in `01`). HOD sees only their department; Club Coordinator only events/workshops.
- **Add-ons:** (a) **role-specific landing dashboards** (each role's home differs); (b) resend-invite + deactivate; (c) per-action permission checks logged to audit.
- **Done when:** logging in as each role shows a correctly scoped view; an HOD cannot see another department's students (RLS-proven, not UI-hidden).
- **Reuse:** CareerOS role-adaptive tone idea → role-adaptive dashboards.

---

## M13 · Renewal / expiry alerts

- **Requirement:** Alerts as the MOU or partnership term approaches its end date.
- **Data:** `mous`, `notifications`, `activity_events`.
- **Pages/UI:** dashboard banner + Notification Center entries + MOU page badges ("expires in 12 days").
- **Logic & flow:** `renewal-cron` (daily) scans `mous` for expiry within 30/15/7 days → flips status to `expiring` → writes `mou.expiring` events → `notify-dispatch` emails/Telegrams TPO + account manager.
- **Add-ons:** (a) **Renewal Intelligence card** (days left + revenue generated + students trained + placements delivered + AI "Renewal recommended"); (b) escalating cadence (30→15→7→expired); (c) admin-wide "renewals due" pipeline view.
- **Done when:** seeded MOUs expiring within 30 days produce live alerts + dashboard banners on demo day.
- **Reuse:** —

---

## M14 · Automated communication triggers (Email + Telegram)

- **Requirement:** Trigger to the TPO on key events — new placement confirmed, FDP session scheduled, report ready, MOU renewal due — via Email **and** at least one of WhatsApp/Telegram.
- **Data:** `activity_events` → `notifications`, `notification_logs`.
- **Pages/UI:** admin **Communication Center** (`/admin/comms`) lists every send with channel + status + live/simulated flag; in-app bell for recipients.
- **Logic & flow:** see `01 §7`. DB webhook on the 4 trigger event types → `notify-dispatch` → Resend (Email) + Telegram Bot (live) + in-app insert; each send logged.
- **Add-ons:** (a) **Notification Center** bell with unread count (in-app channel); (b) per-event templates with college branding; (c) retry + failure surfacing in admin; (d) optional WhatsApp later (Telegram is primary live channel).
- **Done when:** adding a placement / scheduling FDP / generating a report / hitting MOU expiry each sends a **real** email + Telegram message and shows in the Communication Center.
- **Reuse:** —

---

## M15 · Central admin panel

- **Requirement:** Approve/manage all college accounts, view all colleges' data in one place, manage MOU records platform-wide, and override/correct any college's roster or outcome data.
- **Data:** all tables via service-role; `audit_logs`.
- **Pages/UI:** `/admin/*` — Colleges (approve/reject/suspend), Students, Placements, MOU, FDP, Revenue/Payouts, Communication Center, Users, Analytics, **Audit Logs**, **Demo Reset**.
- **Logic & flow:** Super Admin uses service-role-backed Server Actions to act on any record; every mutation writes `audit_logs` (who/what/when/before/after). This is a *management* panel (act on data), not a read-only dashboard — the PDF is explicit.
- **Add-ons:** (a) **Executive Command Center** as the admin home (the 10-second wow: 25 colleges / 2,500 students / 1,200 placements / 78% / ₹12L / 12 MOUs); (b) **One-Click Demo Reset** (re-seed) so judges can test freely; (c) **College Health leaderboard** for account prioritization; (d) global override with reason + audit.
- **Done when:** admin can approve a pending college (TPO gets activated + emailed), edit any college's roster/placement, manage MOUs platform-wide, and every action is in the audit log.
- **Reuse:** CareerOS dashboard/result layout → command-center cards.

---

## Layer-1 completion gate
Before touching Layer 2/3/4: all 15 above are **deployed, seeded, responsive, and demoable end-to-end**, with **live** Email+Telegram on the 4 trigger events, working auth for all 6 roles, and a functioning admin panel. Only then proceed.

### → Next: `03_GOOD_TO_HAVE_FEATURES.md`
