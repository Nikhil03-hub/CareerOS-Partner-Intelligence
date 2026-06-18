# 04 · AI Intelligence Layer + Standout Features + Winning Demo · LAYER 3

> This is **where the finale is won.** No other Track 5B team has an existing AI product to plug in — we do (CareerOS AI, Module 2). This doc turns that into a defensible intelligence layer, names the standout "wow" features, and scripts the judge demo.
> **Golden rule:** every AI engine is **rule-based first (always works live in the demo)**, with an **optional LLM upgrade** behind the same interface. Never let the demo depend on a flaky API call.

---

## 1. How the intelligence layer fits (swappable by design)

```
            activity_events  +  domain tables  (the only inputs)
                          │
                          ▼
                ┌───────────────────────┐
                │   Insights Engine      │   lib/ai/
                │   ┌─────────────────┐  │
   features ───▶│   │ Rule-based core │  │──▶  ai_insights (score,label,reasons,model)
                │   └─────────────────┘  │
                │   ┌─────────────────┐  │
                │   │ LLM enrichment  │  │   (Gemini/Claude/OpenAI; optional)
                │   └─────────────────┘  │
                └───────────────────────┘
                          │
                          ▼
        surfaced in:  College Health gauge · Student 360° · Placement dashboard ·
                      Renewal card · Opportunity Radar · Reports (Exec Summary) · TPO Copilot
```

**Reuse from CareerOS Module 2:** the exact weighted-scoring pattern (`interest×0.45 + academics×0.55`, normalized, with transparent per-factor breakdown) and the `aiExplain()` template→LLM hook are ported into `lib/ai/`. We are not inventing scoring from scratch — we are re-pointing a proven engine at college/student data.

**Inputs are computed once** (from the event stream) and cached to `ai_insights`, recomputed on relevant events (e.g., a new placement recomputes that college's health). This keeps reads instant and the demo snappy.

---

## 2. AI Module 1 — College Health Score (the "digital twin")

A single 0–100 score that makes every college instantly legible (green/amber/red). Composite of six sub-scores:

| Sub-score | Weight | Computed from |
|---|---|---|
| Placement Health | 30% | placement % vs target (seeded target ~70%) |
| Training Health | 25% | avg `enrollments.progress_pct` + completion rate |
| Engagement Health | 15% | attendance %, recency of activity events |
| FDP Health | 10% | FDP sessions held + faculty attendance % |
| Revenue Health | 10% | realized vs potential share + payout health |
| Renewal Health | 10% | MOU status + days-to-expiry |

```
health = Σ(subscore_i × weight_i)        // each subscore normalized 0..100
band:  ≥85 → "Excellent" (green) · 70–84 → "Healthy" (amber) · <70 → "Needs Attention" (red)
```
- **Output:** `ai_insights(type='health_score', score, label, reasons=[{factor, value, contribution}])` + `college_health_history` for the trend line.
- **Surfaces:** college dashboard gauge, admin leaderboard, renewal pipeline, Opportunity Radar.
- **Why judges love it:** turns a table into a verdict. "VNR: 92/100 — Healthy Partner."

---

## 3. AI Module 2 — Student Risk Engine + AI Module 3 — Placement Prediction

One engine, two outputs (reuses the CareerOS academic-scoring math directly).

```
inputs (per student): attendance%, training_completion%, assessment_avg%,
                      mock_interview_score%, cgpa(normalized 0..100), readiness_score

placement_probability =
      0.25·attendance + 0.25·training_completion + 0.20·assessment
    + 0.15·mock_interview + 0.15·cgpa_norm                          // → 0..100%

risk_level:  P ≥ 70 → "Ready" (low) · 40–69 → "Needs Training" (medium) · < 40 → "High Risk"
```
- **Transparency (key):** like CareerOS's score breakdown, surface the **top 2 positive and top 1 negative contributors** ("Strong attendance, high interview score; weak assessment scores"). Judges distrust black boxes; this reads as real.
- **Recommended action** (rule map): low mock-interview → *Interview Master*; low training → *CRT booster*; low CGPA but high effort → *aptitude track*.
- **Output:** `students.risk_level` + `students.readiness_score` + `ai_insights(type='placement_prediction'/'risk')`.
- **Surfaces:** Student 360° badge, placement dashboard "expected placements this semester = Σ probabilities", admin "students likely to remain unplaced" list.
- **AI Module 3 aggregate:** Expected Placements This Semester = `round(Σ placement_probability/100)` across eligible students — a single advanced-looking number on the dashboard.

---

## 4. AI Module 4 — AI Executive Summary Generator

Auto-written narrative prepended to **every report** and **every digest**.
- **Rule-based core:** compute period deltas (placement rate Δ, best/worst department, FDP attendance Δ, completion Δ) → fill a natural-language template.
  > *"Placement rate increased 12% vs last quarter. AIML performed best (84% placed). FDP attendance dropped 8% — recommend a faculty re-engagement session."*
- **LLM enrichment (optional):** pass the computed facts to the LLM to rewrite fluently (never to invent numbers — facts come from the rule layer).
- **Output:** `reports.ai_summary`. **Surfaces:** top of every PDF report, dashboard "insight of the week" card.
- **Reuse:** direct descendant of CareerOS `aiExplain()`.

---

## 5. AI Module 5 — TPO Copilot (the marquee standout — "AI that does work, not a chatbot")

A natural-language assistant that **executes portal workflows**, not just answers questions.

```
user: "Show me students likely to remain unplaced in AIML"
  → intent: risk_query{ dept:AIML, risk:high }
  → runs query over students+ai_insights  → renders a filtered table inline

user: "Generate this month's placement report"
  → intent: generate_report{ type:placement, period:this_month }
  → calls report-generate  → returns a download link + AI summary

user: "Which department needs attention?"
  → intent: dept_analytics  → returns ranked departments by risk/low-completion

user: "Find all AIML students who completed CRT but are still unplaced"
  → intent: knowledge_query  → joins enrollments+placements  → table (the "wow" query)
```
- **Architecture:** rule-based intent matcher (keyword/slot patterns) handles the demo set reliably; LLM does flexible parsing + result summarization when available. Each executed action writes an `audit_log` (the AI is a first-class actor).
- **Why it wins:** it's the 5B-appropriate analog of your **AI Live Interviewer** standout from Module 2 — an AI that *takes action inside the product*. Judges remember "I typed a sentence and it generated a report + sent a Telegram."
- **Surfaces:** persistent "Copilot" panel in the TPO + admin shell.

---

## 6. AI Module 6 — Smart Renewal Prediction

```
renewal_score = f(placements_delivered, students_trained, engagement, revenue_realized, days_to_expiry)
verdict:  "Renewal Recommended" (green) · "Monitor" (amber) · "At Risk" (red)
tag:      "High-Value Partner" if revenue + placements both top-quartile
```
- **Output:** `ai_insights(type='recommendation', scope=mou/college)`. **Surfaces:** MOU Renewal Intelligence card (days left · revenue generated · students trained · placements delivered · **AI verdict**), admin renewal pipeline.

---

## 7. AI Module 7 — Opportunity Radar + Recommendation Engine

Turns analytics into **executive recommendations** (executives prefer recommendations to dashboards).
```
if college.placement% > benchmark_avg + 10  → "High performer: expand AI Interview Program (upsell)"
if college.completion% < benchmark_avg - 10 → "Run a CRT re-engagement / resume workshop"
if dept.risk_high_count > threshold         → "Targeted intervention for <dept>"
if MOU expiring & health high               → "Proactive renewal outreach — high-value"
```
- **Surfaces:** dashboard "Opportunity Radar" card list; admin uses it to prioritize accounts. Built on the benchmarking aggregates (G1).

---

## 8. AI Module 8 — CareerOS AI Student Scores (the Module-2 bridge)

For every student, a `career_os_score` JSON `{ skill, readiness, interview, placement }` — the literal Module-2 output surfaced in the B2B portal.
- **Surfaces:** Student 360° "CareerOS AI" panel; aggregated into college Training Health.
- **Continuity payoff:** in the pitch, "these scores come from our Module-2 CareerOS engine" is the line that lands the evolution narrative.

---

## 9. Standout / "wow" features (the things judges remember)

Ranked by impact-to-effort. Build the top 3 within Layer 3; the rest as time permits (overlaps Layer 4).

1. **Executive Command Center** *(10-second wow on login)* — animated KPI tiles: 25 Colleges · 2,500 Students · 1,200 Placements · 78% Completion · ₹12L Revenue Share · 12 Active MOUs. First thing judges see → instant "this is a real product."
2. **TPO Copilot** *(AI that executes)* — §5. The single most memorable interaction.
3. **College Health Score "Digital Twin"** *(verdict, not data)* — §2. Green/amber/red across the portfolio.
4. **AI Live Interview bridge** *(direct CareerOS continuity)* — from Student 360°, "View AI Interview Report" / "Launch AI Mock Interview" links to your existing **Module-2 AI Live Interviewer**. This explicitly reuses the standout you already built and proves the ecosystem story. Even a recorded readiness report counts.
5. **Placement Funnel + Expected-Placements prediction** — §3, visual + a bold predicted number.
6. **Opportunity Radar** — §7. Analytics → recommendations.
7. **One-Click Demo Reset** — lets judges test freely and instantly restore the seeded showcase (also de-risks your live demo).
8. **Knowledge query** ("AIML students who completed CRT but remain unplaced") — via Copilot; feels like a graph database.

---

## 10. The winning judge demo flow (≈6 minutes, maps to the 5–7 min video)

> Rehearse this exact path; it covers nearly all 15 must-have features while feeling like enterprise SaaS.

1. **Land on Executive Command Center** (admin) — the 10-second wow tiles. *(M15, command center)*
2. **Approve a pending college** → TPO instantly gets a **real email + Telegram** welcome. *(M1, M14)*
3. **Log in as TPO (VNR)** → role-specific dashboard + College Health gauge **92/100**. *(M12, AI-1)*
4. **Open Placements** → KPIs + **Placement Funnel** + top recruiters. *(M5, G7)*
5. **Open a Student 360°** → progress, **Placement Journey timeline**, **CareerOS AI scores**, "View AI Interview Report." *(G4, AI-8, standout #4)*
6. **Ask the TPO Copilot:** "Show AIML students likely to remain unplaced" → filtered table → "Generate the placement report" → PDF with **AI Executive Summary** downloads + **report-ready Telegram** fires. *(AI-5, M9, AI-4, M14)*
7. **MOU page** → an MOU **expiring in 9 days** → Renewal Intelligence card "Renewal Recommended" → expiry **alert** already sent. *(M7, M13, AI-6)*
8. **Benchmarking** → "You vs partner average," top-quartile. *(G1)*
9. **Back to Admin** → Communication Center showing every **live** Email/Telegram send, **Audit Log** of actions, **Leaderboard**. *(M14, M15, G8)*
10. **One-Click Demo Reset** → "judges, explore freely — reset anytime." *(standout #7)*

---

## 11. Build notes for the AI layer (keep it shippable)
- Implement **rule-based versions of AI-1, AI-2/3, AI-4, AI-5 first** — they require no external API and always work.
- Gate LLM calls behind a feature flag + try/catch with rule-based fallback, so a dead API key never breaks the demo.
- All AI outputs persist to `ai_insights` so the UI reads cached values (fast + deterministic in the demo).
- Keep prompts/templates in `lib/ai/` next to the ported CareerOS logic.

### → Next: `05_PREMIUM_ENHANCEMENTS.md` (Layer 4 — build only after 1–3 are solid).
