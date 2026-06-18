# 03 · Good-to-Have Features (10) — Deep Design · LAYER 2

> Build after **all 15 must-have are deployed + seeded + demoable**. These are still PDF-listed features (part of the 25), so they are first-class, not optional fluff. Same template as `02`. The PDF (submission item #8) requires we **list which good-to-have we actually implemented, separated from must-have** — keep the tracker at the bottom updated.

---

## G1 · Benchmarking (anonymized vs all partner colleges)

- **Requirement:** A college sees anonymized comparison of its placement/completion rates against the average across all partner colleges.
- **Data:** aggregate over `placements`/`enrollments`; optional `benchmark_snapshots` for performance.
- **Pages/UI:** `/college/benchmarking` — "You vs Partner Average" bars (placement %, completion %, avg package, attendance), percentile badge ("top 18%").
- **Logic & flow:** averages computed across all colleges **without revealing other colleges' identities** (anonymized — only the mean/median + your value). Cache nightly via snapshot to keep it fast.
- **Add-ons:** (a) "You vs Top 10 (anonymized)" band; (b) trend ("you moved from avg to top-quartile this quarter"); (c) ties into **Opportunity Radar** (AI) — "below average on placement → recommend Interview Master."
- **Done when:** bars render from real cross-college aggregates; no other college is identifiable.

---

## G2 · Direct messaging / chat (TPO ↔ account manager)

- **Requirement:** In-portal direct messaging between TPO and Skill Tank account manager.
- **Data:** `chat_rooms`, `messages`.
- **Pages/UI:** `/college/comms` chat tab — thread view, composer, attachments, unread badges; account manager has a multi-college inbox.
- **Logic & flow:** **Supabase Realtime** on `messages` for live updates; attachments to Storage; new message → in-app notification (+ optional Telegram).
- **Add-ons:** (a) read receipts; (b) "convert message to communication-log entry"; (c) typing indicator (cheap polish). Distinguish from M11 (M11 = formal notes/meeting log; G2 = live chat).
- **Done when:** TPO and account manager exchange messages live across two sessions, with history persisted.

---

## G3 · Event / workshop request flow

- **Requirement:** TPO requests a new workshop or hackathon through the portal.
- **Data:** `workshop_requests`.
- **Pages/UI:** `/college/workshops` — request form (kind: workshop/hackathon, topic, preferred date, notes), status tracker (requested → reviewing → approved/declined → scheduled). Admin side at `/admin` reviews + acts.
- **Logic & flow:** Submit → `workshop.requested` event → notifies account manager. Admin status changes notify the TPO.
- **Add-ons:** (a) topic suggestions from the program catalog; (b) approved request can auto-create a cohort/FDP session; (c) Club Coordinator role primarily owns this surface.
- **Done when:** request persists, admin can act, status + notifications flow both ways.

---

## G4 · Student-level drill-down (Student 360°)

- **Requirement:** TPO clicks a student name to see individual progress and placement journey.
- **Data:** `students` + `enrollments` + `training_progress` + `assessments` + `placements` + `activity_events`.
- **Pages/UI:** `/college/students/[id]` — header (photo/initials, dept, batch, CGPA, **readiness + risk badges**), tabs: Profile · Programs/Progress · Assessments · Certificates · **Placement Journey timeline** (from events).
- **Logic & flow:** the **Placement Journey** is rendered straight from `activity_events` for that student (Enrolled → CRT → Mock Interview → Assessment → Placed → Certificate).
- **Add-ons:** (a) **CareerOS AI scores** panel (skill/readiness/interview/placement) — the Module-2 continuity in one glance; (b) AI "recommended next action" (e.g., "enroll in Interview Master"); (c) quick actions (mark placed, add note).
- **Done when:** clicking a student opens a full 360° with a real timeline + AI scores; this is a centerpiece of the demo.
- **Reuse:** CareerOS result-page multi-tab layout + roadmap timeline — almost directly portable.

---

## G5 · Co-branded certificate / report templates

- **Requirement:** Certificate/report templates with the college's own logo alongside Skill Tank's.
- **Data:** `certificates.co_branded`, `reports`, `college-logos` bucket.
- **Pages/UI:** toggle on report/certificate generation: "Co-brand with college logo."
- **Logic & flow:** PDF template (`lib/pdf`) places both logos; uses the logo uploaded in M2.
- **Add-ons:** (a) template gallery (1–2 layouts); (b) signature line for TPO/principal; (c) auto-co-brand all certificates for that college.
- **Done when:** a generated certificate/report PDF shows both logos and downloads correctly.
- **Reuse:** CareerOS "Save as PDF" path.

---

## G6 · Automated digest report (weekly/monthly to TPO)

- **Requirement:** Weekly/monthly summary emailed to the TPO without manual request.
- **Data:** `reports`, `notifications`; driven by `digest-cron`.
- **Pages/UI:** `/college/reports` settings — cadence selector (off/weekly/monthly), preview of last digest.
- **Logic & flow:** `digest-cron` (scheduled) generates the period summary + **AI Executive Summary**, saves to Download Center, emails+Telegrams the TPO.
- **Add-ons:** (a) per-recipient cadence; (b) "what changed since last digest" delta; (c) extends naturally into the Report Scheduler (premium).
- **Done when:** enabling weekly digest produces a scheduled, AI-summarized report delivered automatically (demo by triggering the cron manually).

---

## G7 · Promtal hiring-integration view (companies that hired from this college)

- **Requirement:** View showing which companies (via Promtal) have hired from this specific college historically.
- **Data:** `placements` filtered by `college_id`, grouped by `company_id`; `placements.source` distinguishes `promtal`.
- **Pages/UI:** `/college/placements` → "Recruiters" tab — company logos, hires count, roles, years, package bands.
- **Logic & flow:** designed **cross-track-ready**: a clean `POST /api/placements` accepts external (Promtal) placement pushes via webhook; seeded `source='promtal'` rows demonstrate it today.
- **Add-ons:** (a) "new recruiter this year" highlight; (b) repeat-recruiter loyalty metric; (c) this is the concrete "design for cross-track integration" point judges reward.
- **Done when:** the recruiters view lists companies + hire counts for the college, including `promtal`-sourced records.

---

## G8 · College leaderboard (admin)

- **Requirement:** Leaderboard (most placements, highest completion rate) visible to admin for account prioritization.
- **Data:** aggregates over `placements`/`enrollments`/`health_scores`.
- **Pages/UI:** `/admin/analytics` — sortable leaderboard (placements, completion %, **health score**, revenue), medals for top 3.
- **Logic & flow:** server-side ranking with pagination; ties into health score + renewal pipeline for "which accounts to focus on."
- **Add-ons:** (a) movement arrows (up/down vs last period); (b) filter by region/partnership type; (c) one-click jump from a low-ranked college to its Opportunity Radar.
- **Done when:** admin sees a ranked, sortable leaderboard across seeded colleges.

---

## G9 · Document e-signature for MOU renewal

- **Requirement:** E-signature for MOU renewal directly in the portal.
- **Data:** `mous.esign_status` (unsigned→sent→signed), `mou_renewals`.
- **Pages/UI:** MOU detail → "Send for e-sign" → simple typed-name + checkbox **click-to-accept** flow (PDF allows simple click-to-accept); signed stamp + timestamp on the document record.
- **Logic & flow:** signing flips `esign_status=signed`, writes `mou.renewed` event + audit, regenerates the MOU PDF with a signature block.
- **Add-ons:** (a) signer identity capture (name/role/timestamp/IP); (b) both-party sign (TPO + Skill Tank); (c) notification on completion.
- **Done when:** a renewal can be e-signed in-portal and the signed status + stamp persist.

---

## G10 · Budget / seat tracking

- **Requirement:** Track seats if the college purchased a fixed number of program seats in advance.
- **Data:** `seat_allocations` (purchased vs used per program).
- **Pages/UI:** `/college/programs` → "Seats" panel — purchased / used / remaining per program, utilization bar.
- **Logic & flow:** enrolling a student decrements remaining seats; over-allocation is blocked/flagged.
- **Add-ons:** (a) low-seat warning + "request more" (links to workshop/seat request); (b) utilization % feeds revenue/renewal intelligence; (c) admin can top up seats.
- **Done when:** seat counts reflect enrollments live; remaining seats decrease as students are enrolled.

---

## Good-to-have implemented tracker (fill during build — submission item #8)

| # | Feature | Implemented? | Route |
|---|---|:--:|---|
| 1 | Benchmarking | ☐ | `/college/benchmarking` |
| 2 | TPO↔manager chat | ☐ | `/college/comms` |
| 3 | Workshop request | ☐ | `/college/workshops` |
| 4 | Student 360° drill-down | ☐ | `/college/students/[id]` |
| 5 | Co-branded templates | ☐ | (report/cert gen) |
| 6 | Automated digest | ☐ | `digest-cron` |
| 7 | Promtal hiring view | ☐ | `/college/placements#recruiters` |
| 8 | College leaderboard | ☐ | `/admin/analytics` |
| 9 | MOU e-signature | ☐ | `/college/mou` |
| 10 | Seat tracking | ☐ | `/college/programs#seats` |

> **Priority within Layer 2 if time is tight:** G4 (Student 360°) → G1 (Benchmarking) → G7 (Promtal view) → G8 (Leaderboard) → G6 (Digest) → G2 (Chat) → G3 (Workshop) → G10 (Seats) → G5 (Co-brand) → G9 (E-sign). G4/G1/G7 carry the most judge impact and reuse the most existing assets.

### → Next: `04_AI_INTELLIGENCE_LAYER.md`
