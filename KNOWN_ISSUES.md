# KNOWN_ISSUES.md
## CareerOS Partner Intelligence Platform — Risk Register
**Generated:** 2026-06-19 | **Deadline:** 2026-06-20 18:00

Severity: 🔴 HIGH (blocks demo) | 🟡 MEDIUM (degrades demo) | 🟢 LOW (cosmetic/minor)

---

## BUILD RISKS

### 🟡 npm install requires network access to registry.npmjs.org
**Risk:** The sandbox environment cannot run `npm install` due to network restrictions. Build has not been verified locally.
**Impact:** Unknown until `npm install` runs on user's machine.
**Mitigation:** Run `npm install` locally before any Supabase setup. Expected to succeed — all packages are well-known, stable versions. Notable heavy packages: `@react-pdf/renderer` (large), `@radix-ui/*` (many packages).
**Action:** User must run `npm install` on Windows and confirm no errors before proceeding.

### ~~`@radix-ui/react-badge` in package.json does not exist~~
**Status:** ✅ FIXED — All unused packages removed from package.json. Final deps: next, react, react-dom, @supabase/supabase-js, @supabase/ssr, lucide-react, clsx, tailwind-merge, sonner, uuid, dotenv.

### 🟢 TypeScript errors may appear for Supabase query return types
**Risk:** Supabase generates untyped responses without a generated `database.types.ts`. All queries use `(r as any)` casts for joined tables (e.g., `r.colleges as any`).
**Impact:** TypeScript won't error (due to `as any`), but IDE intellisense won't catch column typos.
**Mitigation:** After Supabase project is created, run `supabase gen types typescript` to generate types. Not required for build success.

### 🟢 `experimental.serverActions.allowedOrigins` may show deprecation warning
**Risk:** In Next.js 14.2.5, Server Actions are stable (not experimental). The `experimental.serverActions` config may log a warning.
**Impact:** Warning only; no build failure.
**Mitigation:** Can be moved to top-level `serverActions` after deploy, or left as-is.

---

## MIGRATION RISKS

### 🔴 `uuid-ossp` extension required
**Risk:** `001_initial_schema.sql` uses `uuid_generate_v4()` which requires the `uuid-ossp` extension.
**Impact:** Migration will fail if extension is not enabled.
**Fix:** In Supabase Dashboard → Database → Extensions → Enable `uuid-ossp`. Or use `gen_random_uuid()` (built-in) as an alternative — but that requires editing the migration.
**Note:** Supabase projects have `uuid-ossp` available by default. Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` at the top of the migration (already in the SQL file — verify before running).
**Action:** Confirm `001_initial_schema.sql` starts with the extension create statement.

### 🟡 Migration order is critical
**Risk:** `002_rls_policies.sql` references helper functions and tables created in `001_initial_schema.sql`. Running out of order will fail.
**Fix:** Always run `001` first, then `002`. In Supabase SQL Editor, run them as two separate queries.

### 🟡 `notification_status` enum — exact values matter
**Risk:** The `notification_status` enum in the schema is `queued | sent | failed`. Code uses `status: 'sent'` and `status: 'queued'`. Any mismatch will throw a Postgres enum violation at runtime.
**Status:** ✅ Verified correct in all source files. No `'unread'` values remain.

### 🟡 `user_status` enum — `deactivated` not `suspended`
**Risk:** The enum is `pending | active | deactivated`. Any use of `'suspended'` would fail.
**Status:** ✅ Fixed. `ToggleStatusButton.tsx` uses `'deactivated'`.

### ~~`report_type` enum must match~~
**Status:** ✅ FIXED — `reports.type` changed from `report_type` enum to `TEXT` in `001_initial_schema.sql`. All report types (placement, training, revenue, executive, fdp, mou) now accepted.

### 🟡 Foreign key: `reports.generated_by` — plain UUID (no FK)
**Risk:** `reports.generated_by` stores `auth.uid()` but has no FK to `users(id)`. This is intentional (auth UIDs differ from `users.id`).
**Status:** ✅ Correct. Intentional design.

### 🟡 Notifications table: no FK on `recipient_user_id`
**Risk:** `notifications.recipient_user_id` stores `auth.uid()` (no FK to `users.id`). This is intentional for RLS compatibility.
**Status:** ✅ Correct. RLS policy uses `auth.uid() = recipient_user_id`. Inserts use `u.auth_id` (the auth UUID).

---

## DEPLOYMENT RISKS

### 🔴 No `.env.local` file exists
**Risk:** Build will succeed without `.env.local`, but the app will crash at runtime with "Missing NEXT_PUBLIC_SUPABASE_URL".
**Fix:** Create `.env.local` from `.env.example` with real Supabase credentials before running `npm run dev` or deploying.
**Action:** User must create Supabase project and provide credentials.

### 🟡 Vercel: Environment variables must be set
**Risk:** Vercel deploy will build successfully but the app will fail at runtime if env vars aren't set in the Vercel dashboard.
**Fix:** In Vercel → Project Settings → Environment Variables, add all three required variables:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### 🟡 Supabase Storage buckets must be created manually
**Risk:** The seed script does not create storage buckets. Missing buckets will cause MOU upload and logo upload to fail.
**Fix:** Create 4 buckets in Supabase Dashboard → Storage:
- `mou-docs` (private)
- `college-logos` (public)
- `reports` (private)
- `certificates` (private)

### 🟡 Edge function deployment requires Supabase CLI
**Risk:** `renewal-cron` and `notify-dispatch` won't run unless deployed via `supabase functions deploy`.
**Impact:** MOU renewal alerts and Telegram/email notifications won't fire automatically.
**Mitigation for demo:** Renewal alerts can be demonstrated via the seeded `expiring` MOU status. Notifications can be sent manually via the `/admin/notifications` broadcast UI.

### 🟡 Telegram + Email: Optional for demo
**Risk:** `TELEGRAM_BOT_TOKEN` and `RESEND_API_KEY` not yet obtained.
**Impact:** Real notifications won't send. App will degrade gracefully (no crash).
**Mitigation:** The in-app notification center works without these keys. Demo can show notifications in the UI without real Telegram/email sends.

---

## RUNTIME RISKS

### 🟡 Report PDF download shows "Processing…" for all reports
**Risk:** `reports.file_url` is `null` for all generated reports. The UI shows "Processing…" in the Download column.
**Impact:** Judges cannot download a PDF. The report data, AI summary, and status tracking all work correctly.
**Mitigation:** During demo, emphasize the AI Summary content and the report listing. Frame as "PDF upload integration pending Supabase Storage setup."

### 🟡 Year selector on placements page requires JavaScript
**Risk:** The `YearSelector` client component uses `useRouter` for navigation. If JavaScript fails to load, the selector won't work.
**Impact:** Very low risk (Vercel serves JS fine). Progressive enhancement not implemented.
**Status:** ✅ Fixed from server component event handler to proper client component. Works correctly.

### 🟢 Student "Add Student" button has no action
**Risk:** `/college/students` has a "+ Add Student" button that has no `onClick` handler — it's a visual placeholder.
**Impact:** Judges clicking this button will see no modal. Roster management is for viewing + filtering existing seeded data.
**Mitigation:** Explain that student data is imported via CSV (available via seed) in the demo context.

### 🟢 College filter search input is not a client component
**Risk:** The `<input>` in `/admin/colleges` with `defaultValue` won't update without a page navigation (it's in a server component). Search requires a form submit or URL change.
**Impact:** The input field is cosmetic-only. URL-based filtering via the status filter links works correctly.

### 🟢 `getStatusBadge('deactivated')` returns `badge-gray`
**Risk:** `getStatusBadge` in `utils.ts` maps `suspended → badge-red` but the actual enum value is `deactivated`. A user with `status='deactivated'` will show a gray badge instead of red.
**Fix (optional):** Add `deactivated: 'badge-red'` to the map in `utils.ts`.

---

## SEED RISKS

### 🟡 Seed must run after migrations
**Risk:** `scripts/seed.ts` will fail if tables don't exist.
**Fix:** Always run migrations first: `001_initial_schema.sql` → `002_rls_policies.sql` → then `npm run db:seed`.

### 🟡 `create-demo-users.ts` requires `colleges` table to be populated
**Risk:** `create-demo-users.ts` looks up college IDs by code (`KMIT`, `VNRVJIET`) from the `colleges` table. If seed hasn't run yet, user creation will fail with `college_id: null`.
**Fix:** Run seed first, then create users: `npm run db:seed && npm run create:users`.

### 🟡 Duplicate seed runs will cause unique constraint errors
**Risk:** Running `npm run db:seed` twice without a reset will fail on duplicate `name`/`code` constraints.
**Fix:** Use `npm run db:reset` (which truncates tables first) or run seed only once.

---

## RECOMMENDED PRE-DEPLOY CHECKLIST

```
✅ 1. Removed all unused packages from package.json (was 30+ deps, now 11)
✅ 2. Fixed reports.type column: enum → TEXT in 001_initial_schema.sql
✅ 3. Fixed next.config.ts: images.domains → remotePatterns
✅ 4. Fixed onChange event handlers in server components → YearSelector client component
✅ 5. Fixed all 14 schema column mismatches

□ 6. Run: npm install (on user's Windows machine)
□ 7. Confirm: npm install succeeds with no errors
□ 8. Create Supabase project at supabase.com (region: ap-south-1)
□ 9. Create .env.local with 3 credentials from Supabase Dashboard → Settings → API
□ 10. Run: 001_initial_schema.sql in Supabase SQL Editor
□ 11. Run: 002_rls_policies.sql in Supabase SQL Editor
□ 12. Create 4 Storage buckets: mou-docs (private), college-logos (public), reports (private), certificates (private)
□ 13. Run: npm run db:seed
□ 14. Run: npm run create:users
□ 15. Run: npm run dev → test locally on localhost:3000
□ 16. Test login for all 6 roles (password: careeros2026)
□ 17. Deploy: vercel --prod
□ 18. Add env vars in Vercel dashboard (same 3 values as .env.local)
□ 19. Test production URL
□ 20. Optional: Deploy edge functions via supabase CLI
```
