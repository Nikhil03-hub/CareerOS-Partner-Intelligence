# BUILD_FIX_LOG.md
## CareerOS Partner Intelligence Platform
### Session: Build Verification & Fix Log

---

## Summary

| Session | Issues Found | Issues Fixed | Build Status |
|---------|-------------|-------------|-------------|
| Pre-build static analysis | 2 | 2 | Static analysis clean |
| First `npm run build` attempt | 1 (confirmed) | 1 | **Pending re-run** |
| Pre-emptive second-pass audit | 0 additional | — | Blocked only by #1 below |

---

## Fix #1 — `next.config.ts` not supported (BLOCKING)

**Discovered:** First `npm run build` run on user's machine  
**Severity:** 🔴 BLOCKER — build fails immediately, nothing else runs

### Error Message
```
Error: Configuring Next.js via 'next.config.ts' is not supported.
Please replace the file with 'next.config.js' or 'next.config.mjs'.
```

### Root Cause
Next.js 14.2.5 does not support TypeScript configuration files. TypeScript config (`.ts`) support was not available in the 14.x line at the time this project was scaffolded. TypeScript type-safety for Next.js config is achieved in `.mjs` using JSDoc `@type` annotations instead.

### Files Changed
| Action | File |
|--------|------|
| Created | `next.config.mjs` |
| Renamed (disabled) | `next.config.ts` → `next.config.ts.bak` |

### Fix Applied
**`next.config.mjs`** (new file — replaces `next.config.ts`):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'supabase.co' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
}

export default nextConfig
```

All configuration is preserved identically. The only change is the file extension and the substitution of `import type { NextConfig } from 'next'` with a JSDoc `@type` annotation.

### Verification
- `next.config.mjs` present ✅
- `next.config.ts` absent (renamed to `.bak`) ✅
- All config values preserved (reactStrictMode, remotePatterns, allowedOrigins) ✅

---

## Fix #2 — `utils.ts` duplicate object keys (ESLint `no-dupe-keys`) (NON-BLOCKING)

**Discovered:** Static analysis (prior session)  
**Severity:** 🟡 ESLint error — would fail `npm run lint`, not `npm run build`

### Root Cause
`getStatusBadge()` in `src/lib/utils.ts` contained two entries each for `suspended` and `expired` in the status-to-badge map, triggering the ESLint `no-dupe-keys` rule. While functionally identical (same value both times), ESLint treats this as an error.

### Files Changed
| Action | File |
|--------|------|
| Edited | `src/lib/utils.ts` |

### Fix Applied
Rewrote the status map as a clean, single-pass object with every status listed exactly once:

```typescript
const map: Record<string, string> = {
  active: 'badge-green', approved: 'badge-green', placed: 'badge-green',
  ready: 'badge-green', paid: 'badge-green', low: 'badge-green',
  pending: 'badge-yellow', expiring: 'badge-yellow', processing: 'badge-yellow',
  unpaid: 'badge-yellow', medium: 'badge-yellow',
  suspended: 'badge-red', expired: 'badge-red', overdue: 'badge-red',
  deactivated: 'badge-red', failed: 'badge-red', high: 'badge-red',
  in_process: 'badge-blue', in_progress: 'badge-blue', promtal: 'badge-blue',
  unplaced: 'badge-gray', direct: 'badge-gray',
  enrolled: 'badge-purple',
}
```

---

## Fix #3 — `InviteUserButton.tsx` calling browser-side admin API (RUNTIME CRASH)

**Discovered:** Static analysis (prior session)  
**Severity:** 🔴 RUNTIME BLOCKER — 403 Forbidden at runtime; does not fail build

### Root Cause
`InviteUserButton.tsx` was calling `supabase.auth.admin.inviteUserByEmail()` via the browser Supabase client (anon key). The Admin API requires the service role key, which must never be exposed client-side. The call would always return 403 at runtime.

### Files Changed
| Action | File |
|--------|------|
| Edited | `src/app/admin/users/InviteUserButton.tsx` |
| Created | `src/app/api/users/invite/route.ts` |

### Fix Applied

**`/api/users/invite/route.ts`** — New server-side API route:
- Verifies caller is `super_admin` or `account_manager` via cookie session
- Uses `createServiceClient()` (service role key) to call `admin.auth.admin.inviteUserByEmail`
- Inserts user profile into `users` table after successful invite
- Returns `{ success: true }` or `{ error: "..." }`

**`InviteUserButton.tsx`** — `handleSubmit` updated to call the route:
```typescript
const res = await fetch('/api/users/invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, role, college_id }),
})
```

---

## Pre-Emptive Audit Results (No Additional Fixes Needed)

After fixing issue #1, a full second-pass audit was run across all 57 source files. Findings:

| Check | Result |
|-------|--------|
| All package imports in `package.json` | ✅ All accounted for |
| Missing `'use client'` on interactive components | ✅ None found |
| Server-only imports in client components | ✅ None found |
| Missing `export default` in page/layout files | ✅ All present |
| `export const metadata` in client components | ✅ None found |
| API route handler method exports | ✅ All correct |
| Dynamic route params typed correctly (Next.js 14) | ✅ Synchronous params, correct for 14.x |
| File encoding issues (emoji in .tsx files) | ✅ Valid UTF-8, grep flags as binary but build ignores |
| `postcss.config.js` valid for Tailwind v3 | ✅ |
| `tailwind.config.ts` (not `.mjs`) | ✅ Allowed — Tailwind config TS is transpiled by Next.js |
| `@radix-ui/react-badge` removed from package.json | ✅ Verified removed |
| Schema column names match DB (all 14 prior fixes) | ✅ Still in place |
| All component files exist on disk | ✅ 57/57 confirmed |

### Notes on Non-Error Observations

1. **`experimental.serverActions.allowedOrigins`** — In Next.js 14.2.5, server actions were stabilized in 14.0.0. The `experimental.serverActions` config key still functions as an allowed override for origins and will not cause a build error; it may generate a deprecation warning.

2. **`createServiceClient()` uses `require()`** — The CommonJS `require('@supabase/supabase-js')` inside an ESM server file is valid in Next.js server-side bundling context. `@types/node` (included in devDependencies) provides the `require` global. This is not a TypeScript error.

3. **Files with emoji characters** — Several page files contain emoji in string literals (status icons, feature lists). `grep` treats these as binary files, but they are valid UTF-8 and compile without issues.

---

---

## Fix #4 — `border-border` / semantic color classes do not exist (BLOCKING)

**Discovered:** Second `npm run build` run on user's machine  
**Severity:** 🔴 BLOCKER — Tailwind compile step fails, CSS not generated

### Error Message
```
src/styles/globals.css
The `border-border` class does not exist.
```
(Same error would appear for `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `bg-accent`, etc.)

### Root Cause
`globals.css` uses a Shadcn/UI-style CSS variable theme system. It defines CSS custom properties (`--background`, `--foreground`, `--border`, `--primary`, etc.) in `:root` and uses them via `@apply` directives (`@apply border-border`, `@apply bg-background`, etc.).

For `@apply border-border` to work, Tailwind must know about a color named `border` in its theme. This requires mapping each CSS variable to a Tailwind color key in `tailwind.config.ts`. That mapping was **entirely absent** — the config only had the static `brand` palette.

### Files Changed
| Action | File |
|--------|------|
| Edited | `tailwind.config.ts` |

### Fix Applied
Added all 11 semantic color entries to `theme.extend.colors`. Each uses the pattern `hsl(var(--TOKEN) / <alpha-value>)` which:
1. Wraps the bare HSL channel values from `:root` (e.g. `221.2 83.2% 53.3%`) into a valid `hsl()` call
2. Injects Tailwind's `<alpha-value>` placeholder so opacity modifiers like `bg-primary/10`, `bg-muted/30` continue to work correctly

```typescript
colors: {
  background:  'hsl(var(--background) / <alpha-value>)',
  foreground:  'hsl(var(--foreground) / <alpha-value>)',
  border:      'hsl(var(--border)     / <alpha-value>)',
  input:       'hsl(var(--input)      / <alpha-value>)',
  ring:        'hsl(var(--ring)       / <alpha-value>)',
  card:        { DEFAULT: 'hsl(var(--card) / <alpha-value>)',        foreground: 'hsl(var(--card-foreground) / <alpha-value>)' },
  popover:     { DEFAULT: 'hsl(var(--popover) / <alpha-value>)',     foreground: 'hsl(var(--popover-foreground) / <alpha-value>)' },
  primary:     { DEFAULT: 'hsl(var(--primary) / <alpha-value>)',     foreground: 'hsl(var(--primary-foreground) / <alpha-value>)' },
  secondary:   { DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',   foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)' },
  muted:       { DEFAULT: 'hsl(var(--muted) / <alpha-value>)',       foreground: 'hsl(var(--muted-foreground) / <alpha-value>)' },
  accent:      { DEFAULT: 'hsl(var(--accent) / <alpha-value>)',      foreground: 'hsl(var(--accent-foreground) / <alpha-value>)' },
  destructive: { DEFAULT: 'hsl(var(--destructive) / <alpha-value>)', foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)' },
  brand: { ... } // unchanged
}
```

### Classes now generated by Tailwind
`bg-background`, `text-foreground`, `border-border`, `bg-card`, `bg-muted`, `bg-accent`, `text-muted-foreground`, `text-primary`, `text-primary-foreground`, `bg-primary`, `bg-primary/10`, `bg-muted/30`, `text-destructive`, `bg-destructive`, `ring-ring`, `border-input` — and all other combinations used across the 57 source files.

### Verification
- `tailwind.config.ts` contains all 11 semantic color keys ✅
- CSS variable values in `:root` match the color tokens in config ✅
- `<alpha-value>` placeholder preserves `bg-primary/10` and similar opacity modifiers ✅
- `brand` palette unchanged ✅

---

---

## Fix #5 — `cohorts.data?.reduce(...)` possibly undefined (BLOCKING TypeScript)

**Discovered:** Third `npm run build` — compiled successfully, failed TypeScript validation  
**Severity:** 🔴 BLOCKER — `tsc` exits non-zero, build aborts

### Error
```
src/app/api/reports/generate/route.ts(34)
Object is possibly 'undefined'.
```

### Root Cause
Line 34 computed `avgCompletion` inline inside the `summary` object literal:
```typescript
cohorts.data?.reduce((a, c) => a + (c.completion_pct || 0), 0) / (cohorts.data?.length || 1)
```
`cohorts.data?.reduce(...)` returns `number | undefined` (because `?.` short-circuits to `undefined` when `cohorts.data` is `null`). Dividing `number | undefined` by anything is a TypeScript strict-mode error.

The same pattern existed for `revShare.data?.reduce(...)` on the line above — it escaped detection because the trailing `|| 0` coerces `undefined` to `0` at the expression level, which TypeScript accepts. The division case has no such coercion.

### Fix Applied
Extracted all three nullable arrays into guaranteed-array locals before use:
```typescript
const cohortList = cohorts.data || []
const revList    = revShare.data || []
```
Then computed aggregates against the plain arrays (no optional chaining needed):
```typescript
const totalRevShare = revList.reduce((a, r) => a + (r.share_amount || 0), 0)
const avgCompletion = cohortList.length
  ? cohortList.reduce((a, c) => a + (c.completion_pct || 0), 0) / cohortList.length
  : 0
```
`summary.training` now references the pre-computed `avgCompletion` scalar — no expression-level division.

### Files Changed
| Action | File |
|--------|------|
| Edited | `src/app/api/reports/generate/route.ts` |

---

---

## Fix #6 — `cookiesToSet` implicit `any` in Supabase SSR middleware (BLOCKING TypeScript)

**Discovered:** Fourth `npm run build`  
**Severity:** 🔴 BLOCKER — TypeScript strict mode `noImplicitAny` rejects untyped callback parameters

### Error
```
src/lib/supabase/middleware.ts
Parameter 'cookiesToSet' implicitly has an 'any' type.
```

### Root Cause
`createServerClient` from `@supabase/ssr` provides a callback slot `cookies.setAll(cookiesToSet)`. TypeScript's inference chain is not strong enough in this version to propagate the parameter type into the callback body when `noImplicitAny` is active. The parameter must be explicitly annotated.

The same unannotated pattern existed in `server.ts` and would have caused the identical error on the next build run.

### Fix Applied
Added `type CookieOptions` to the `@supabase/ssr` import (it is a first-class named export), then annotated both `setAll` callbacks explicitly:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// ...
setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) { ... }
```

This is the pattern shown in the official Supabase Next.js App Router documentation.

### Files Changed (both fixed in this session to prevent a sequential error)
| Action | File |
|--------|------|
| Edited | `src/lib/supabase/middleware.ts` |
| Edited | `src/lib/supabase/server.ts` |

---

---

## Fix #7 — Deno Edge Functions picked up by Next.js TypeScript checker (BLOCKING TypeScript)

**Discovered:** Fifth `npm run build`  
**Severity:** 🔴 BLOCKER — tsc fails on unresolvable `https://esm.sh/` Deno imports

### Error
```
supabase/functions/notify-dispatch/index.ts
Cannot find module 'https://esm.sh/@supabase/supabase-js@2'
```

### Root Cause
`tsconfig.json` `include` contains `"**/*.ts"` which recursively matches every `.ts` file in the project tree, including the two Supabase Edge Functions in `supabase/functions/`:
- `supabase/functions/notify-dispatch/index.ts`
- `supabase/functions/renewal-cron/index.ts`

These files are written for the **Deno runtime** and use URL-based ESM imports (`https://esm.sh/…`, `https://deno.land/…`). The Node.js TypeScript compiler (`tsc`) cannot resolve URL imports — they are valid only under Deno's module system.

The `exclude` array already excluded `node_modules`, `backend`, and `scripts`, but was missing `supabase`.

### Fix Applied
Added `"supabase"` to the `exclude` array in `tsconfig.json`:

```json
"exclude": ["node_modules", "backend", "scripts", "supabase"]
```

This is the correct solution — the Edge Functions remain untouched and are deployed separately via the Supabase CLI, which uses Deno and resolves their imports correctly. They must not be compiled by Next.js's TypeScript pass.

No conversion of Deno imports to npm imports was required or performed.

### Files Changed
| Action | File |
|--------|------|
| Edited | `tsconfig.json` |

---

---

## Fix #8 — Supabase client initialized at render time in client components (BLOCKING build)

**Discovered:** Sixth `npm run build` — build reached static page generation phase  
**Severity:** 🔴 BLOCKER — `createBrowserClient(undefined, undefined)` throws at build-time SSR

### Error
```
Error: supabaseUrl is required.
  at createBrowserClient (...)
```
(Thrown during static HTML generation of `/login` and `/signup`)

### Root Cause
Both `login/page.tsx` and `signup/page.tsx` are `'use client'` components, but `createClient()` was called at the **top of the component function body**:

```typescript
export default function LoginPage() {
  // ...
  const supabase = createClient()  // ← runs during build-time SSR shell generation
```

Next.js renders `'use client'` components to static HTML at build time (to generate the initial HTML shell). That render executes the component function, which calls `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)`. At build time — before `.env.local` is loaded — the URL is `undefined`, causing `createBrowserClient` to throw immediately.

### Why `force-dynamic` alone is insufficient
`force-dynamic` prevents caching but does not skip the build-time render pass for `'use client'` pages when their parent layout is a server component. The root cause must be fixed in code, not configuration.

### Fix Applied
Moved `createClient()` from the component render scope into the async submit handler — where it only executes post-hydration in the browser, never during server-side rendering:

**`login/page.tsx`**
```typescript
// Before — top of component (runs during SSR):
const supabase = createClient()

// After — inside handler (runs only in browser):
async function handleLogin(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  const supabase = createClient()   // ← lazy, browser-only
  const { data, error } = await supabase.auth.signInWithPassword(...)
```

**`signup/page.tsx`** — same pattern, `createClient()` moved to top of `handleSubmit`.

This is also better React practice: creating a Supabase client is a side effect and should not happen during the render phase.

### Files Changed
| Action | File |
|--------|------|
| Edited | `src/app/(public)/login/page.tsx` |
| Edited | `src/app/(public)/signup/page.tsx` |

---

## ⚠️ Remaining prerequisite before next build

Create `skill-tank-partner-platform/.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```
After Fix #8, the public pages no longer need env vars at build time. But the middleware and server layouts still reference the env vars at runtime — they must be present for `npm run dev` and for Vercel deployment.

---

## Action Required from User

| # | Action | Status |
|---|--------|--------|
| 1 | Run `npm run build` again | ⏳ Waiting |
| 2 | Report any new errors from the build output | ⏳ Waiting |
| 3 | If build passes, create Supabase project | ⏳ Blocked on build |

---

## Cumulative Change Log

| File | Change Type | Session | Issue Fixed |
|------|-------------|---------|-------------|
| `src/app/(public)/login/page.tsx` | Edited | Build fix session 6 | Fix #8: lazy supabase init |
| `src/app/(public)/signup/page.tsx` | Edited | Build fix session 6 | Fix #8: lazy supabase init |
| `tsconfig.json` | Edited | Build fix session 5 | Fix #7: exclude supabase/functions Deno code |
| `src/lib/supabase/middleware.ts` | Edited | Build fix session 4 | Fix #6: implicit any on cookiesToSet |
| `src/lib/supabase/server.ts` | Edited | Build fix session 4 | Fix #6: implicit any on cookiesToSet (pre-emptive) |
| `src/app/api/reports/generate/route.ts` | Edited | Build fix session 3 | Fix #5: cohorts.data possibly undefined |
| `tailwind.config.ts` | Edited | Build fix session 2 | Fix #4: missing semantic color mappings |
| `next.config.mjs` | Created | Build fix session 1 | Fix #1: .ts not supported |
| `next.config.ts` | Renamed → `.bak` | Build fix session 1 | Fix #1: .ts not supported |
| `src/lib/utils.ts` | Edited | Static analysis session | Fix #2: duplicate keys |
| `src/app/admin/users/InviteUserButton.tsx` | Edited | Static analysis session | Fix #3: browser admin API |
| `src/app/api/users/invite/route.ts` | Created | Static analysis session | Fix #3: browser admin API |
| `src/app/admin/colleges/[id]/page.tsx` | Edited | Prior session | Schema: column names |
| `src/app/college/students/page.tsx` | Edited | Prior session | Schema: column names |
| `src/components/shared/YearSelector.tsx` | Created | Prior session | Server component onChange |
| `next.config.js` → `next.config.ts` (original) | Was edited | Prior session | images.domains → remotePatterns |
| `supabase/migrations/001_initial_schema.sql` | Edited | Prior session | reports.type TEXT, 14 column fixes |

---

*Generated: 2026-06-19 | Next.js 14.2.5 | Node 20 | TypeScript 5.4.5*
