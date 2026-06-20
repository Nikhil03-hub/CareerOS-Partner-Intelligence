# 19 · UI & Animation Playbook (the "later / parallel" track)

> **Priority:** AFTER features + correctness + deploy (Phases 0–4 of `docs/18`). This is the polish that turns a strong app into a *premium-feeling* one. Built from the updated reference list (Linear, Stripe, Vercel, Relume, Aceternity, Magic UI, React Bits, Tremor, GSAP, Framer Motion). Apply globally first (tokens), then add motion only where it signals state or tells a story.

## 0. Mindset
Premium = **restraint + consistency + tasteful motion**. One accent, hairline borders, generous spacing, refined type, and a *few* great animations beat many flashy ones. Match the calm density of Linear/Stripe/Vercel; reserve big motion for the landing.

## 1. Install (only what you'll use)
- **framer-motion** — component reveals, count-up, layout/hover micro-interactions (React-native, easy).
- **gsap** + **ScrollTrigger** — scroll-driven storytelling on the landing (the count-up-on-scroll, section reveals, pinned sections).
- **tremor** (or keep recharts) — premium dashboard charts/KPI cards with minimal effort.
- Copy-paste components (no install, just paste): **Aceternity UI**, **Magic UI**, **React Bits**, **Origin UI**, **21st.dev**, **shadcn/ui** + **shadcn blocks**. Use these for hero, bento grid, animated number, marquee of recruiter logos, sparklines, data-table.

## 2. The animation you asked for — count-up-on-scroll (landing stats)
The landing's "1.62 Cr / 25+ / ₹8.26L / 1,203" should **start at 0 and animate to the value when scrolled into view.**
- Easiest: **Magic UI `NumberTicker`** or **React Bits "Count Up"** (paste the component), trigger on `whileInView` (Framer Motion) or an IntersectionObserver.
- Or Framer Motion: `useInView()` + `animate(0 → target)` with `useMotionValue`/`useTransform`, formatting with `Intl.NumberFormat('en-IN')` (so it reads ₹/Cr/L correctly), respecting `prefers-reduced-motion`.
- Apply to: landing stat band, dashboard KPI cards (count-up on first load), Health Score gauge (animate the arc + number), benchmarking bars (grow on view).

## 3. Global polish (do once — lifts every page)
- **Tokens:** one neutral ramp + one accent (keep blue `#3B82F6`), hairline `--border`, soft shadow only on hover/elevated, radius 10–12, Inter type scale with `tracking-tight` headings, `tabular-nums` for all numbers.
- **Primitives (shadcn/ui):** Button, Card, Badge (status tints), Table (sticky header, hover rows, right-aligned numbers), Tabs, Dialog/Sheet (modals), Skeleton, Toast (sonner — already in). Replace ad-hoc markup with these.
- **Empty states:** illustration + one line + a primary action (never bare "0").
- **Micro-interactions:** 150ms transitions, hover lift on cards, `:active` scale 0.98, focus-visible ring, skeletons (already added) + the nav progress bar (already added).

## 4. Per-surface recommendations
| Surface | Use | From |
|---|---|---|
| **Landing hero** | big tight headline, gradient/aurora or grid backdrop, product screenshot, scroll reveals | Aceternity (Aurora/Spotlight/Hero), Magic UI, GSAP ScrollTrigger |
| **Landing stats** | count-up-on-scroll | Magic UI NumberTicker / React Bits |
| **Feature/AI sections** | **Bento grid** | Aceternity / Magic UI bento-grid |
| **Recruiter logos** | marquee | Magic UI Marquee |
| **Dashboards (KPIs)** | StatCard with delta chip + sparkline, count-up | Tremor / shadcn |
| **Charts** | placement trend (area), health distribution (bar), revenue (bar), funnel | Tremor (cleanest) or recharts |
| **Health Score** | animated radial gauge + 6-factor breakdown bars | custom + Framer Motion |
| **Tables** | filter/sort/search/export, row hover | shadcn data-table |
| **Student 360°** | timeline (training + placement journey), score rings | Aceternity timeline / custom + Framer Motion |
| **Modals** | shadcn Dialog (focus trap, mobile) | shadcn/ui |

## 5. Motion discipline (don't overdo it)
- Landing: scroll reveals + count-up + one hero effect. App: instant + subtle (skeletons, hover, count-up on first load only). No animation on every re-render. Always honor `prefers-reduced-motion`. Keep durations 150–400ms.

## 6. Mobile + a11y (required by the PDF anyway)
Sidebar → drawer; tables → horizontal scroll or stacked cards; KPI grid → 1–2 cols; test at 375px. Contrast ≥ 4.5:1; keyboard-navigable; visible focus.

## 7. Suggested order (when you reach this track)
```
1. Global tokens + shadcn primitives + empty states        (biggest lift, all pages)
2. Count-up on landing stats + dashboard KPIs              (the requested animation)
3. Tremor charts (trend, health, revenue, funnel)
4. Landing: bento sections + hero effect + scroll reveals
5. Health gauge + Student 360° timelines
6. Mobile + reduced-motion pass
```
> Rule: ~70% of UI time on §3 global + §2 count-up (every-page wins), ~30% on the landing showcase. Don't hand-restyle pages before tokens/primitives are set.
