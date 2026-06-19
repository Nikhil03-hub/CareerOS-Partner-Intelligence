# DATABASE_AUDIT.md
## CareerOS Partner Intelligence Platform — Database Schema Audit
**Generated:** 2026-06-19 | **Source:** `supabase/migrations/001_initial_schema.sql` + `002_rls_policies.sql`

---

## Overview

| Category | Count | Status |
|----------|-------|--------|
| Tables | 37 | ✅ All created |
| Enums | 12 | ✅ All defined |
| Foreign Keys | 40+ | ✅ Correct cascade rules |
| RLS Policies | 54 | ✅ Comprehensive |
| Triggers | 3+ | ✅ `updated_at` automation |
| Helper Functions | 4 | ✅ JWT-based role helpers |
| Storage Buckets | 4 | ⚠️ Must be created manually |
| Extensions | 2 | `uuid-ossp`, `pgcrypto` |

---

## 1. ENUMS

All 12 enum types defined in `001_initial_schema.sql`:

| Enum | Values | Used In | Code Verified |
|------|--------|---------|---------------|
| `college_status` | `pending, approved, rejected, suspended` | `colleges.status` | ✅ `'approved'`, `'pending'`, `'suspended'` in source |
| `user_role` | `super_admin, account_manager, tpo, hod, faculty_coord, club_coord` | `users.role` | ✅ All 6 roles used in middleware + layout |
| `user_status` | `pending, active, deactivated` | `users.status` | ✅ `'deactivated'` in ToggleStatusButton |
| `placement_status` | `unplaced, in_process, placed` | `students.placement_status` | ✅ Filters use these exact values |
| `risk_level` | `low, medium, high` | `students.risk_level` | ✅ Risk badges use these values |
| `enrollment_status` | `enrolled, in_progress, completed, dropped` | `enrollments.status` | ✅ Count queries use `'in_progress'`, `'completed'` |
| `mou_status` | `active, expiring, expired, renewed` | `mous.status` | ✅ All 4 used in filters and alerts |
| `payout_status` | `pending, processing, paid` | `payouts.status`, `revenue_share.payout_status` | ✅ `'pending'`, `'paid'` in code |
| `fdp_status` | `scheduled, completed, cancelled` | `fdp_sessions.status` | ✅ `'scheduled'`, `'completed'` in code |
| `notification_status` | `queued, sent, failed` | `notifications.status` | ✅ `status: 'sent'` in BroadcastButton |
| `comm_type` | `note, meeting, call` | `communication_logs.type` | ✅ All 3 used in LogCommButton |
| `event_type` (multi-value) | `student.enrolled`, `student.placed`, etc. | `activity_events.event_type` | ✅ All event types as TEXT variants |

---

## 2. TABLES (37 total)

### Core Tenant Tables

#### `colleges`
| Column | Type | Constraints | Code Usage |
|--------|------|-------------|------------|
| `id` | UUID PK | `uuid_generate_v4()` | All FK references |
| `name` | TEXT | NOT NULL | College name display |
| `code` | TEXT | UNIQUE NOT NULL | Short code (KMIT, VNRVJIET) |
| `university` | TEXT | | Signup + detail page |
| `city`, `state` | TEXT | | Location display |
| `type` | TEXT | | Engineering/Management/etc. |
| `partnership_types` | TEXT[] | | Signup checkboxes |
| `status` | `college_status` | DEFAULT `pending` | Approval workflow |
| `approved` | BOOLEAN | DEFAULT false | Redundant with status but used |
| `health_score` | NUMERIC(5,2) | DEFAULT 0 | College health display |
| `seats_purchased` | INT | DEFAULT 0 | MOU tracking |
| `seats_used` | INT | DEFAULT 0 | MOU tracking |
| `account_manager_id` | UUID | FK → users | RLS policy uses this |
| `created_at`, `updated_at` | TIMESTAMPTZ | | Trigger-managed |

#### `departments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `college_id` | UUID FK | → colleges(id) CASCADE |
| `name` | TEXT | "Computer Science Engineering" |
| `code` | TEXT | "CSE" |
| `hod_id` | UUID | Optional FK → users |

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Internal user ID |
| `auth_id` | UUID UNIQUE | Supabase Auth UID — used in JWT claims |
| `college_id` | UUID FK | → colleges(id) SET NULL |
| `name`, `email`, `phone` | TEXT | Profile data |
| `role` | `user_role` | RBAC role |
| `status` | `user_status` | DEFAULT `active` |
| `created_at`, `updated_at` | TIMESTAMPTZ | Trigger-managed |

#### `students`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `college_id` | UUID FK | → colleges CASCADE |
| `department_id` | UUID FK | → departments SET NULL |
| `name`, `email`, `phone` | TEXT | |
| `roll_no` | TEXT | |
| `batch_year` | TEXT | "2025-26" |
| `cgpa` | NUMERIC(4,2) | |
| `placement_status` | `placement_status` | `unplaced/in_process/placed` |
| `risk_level` | `risk_level` | `low/medium/high` |
| `readiness_score` | NUMERIC(5,2) | 0-100 AI score |
| `ats_score` | NUMERIC(5,2) | ATS compatibility |
| `skills` | TEXT[] | Tag array |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

### Training Tables

#### `programs`
| Column | Notes |
|--------|-------|
| `id`, `name`, `code`, `type` | Program catalog |
| `duration_weeks`, `modules_count` | Duration metadata |

#### `cohorts`
| Column | Notes |
|--------|-------|
| `college_id`, `program_id` | FK references |
| `name`, `batch_label` | `batch_label` used in Student 360° (was `cohort_type` — FIXED) |
| `enrolled_count`, `completion_pct` | Aggregate stats |
| `start_date`, `end_date`, `instructor` | Schedule |
| `status` | active/completed/upcoming |

#### `enrollments`
| Column | Notes |
|--------|-------|
| `student_id`, `cohort_id`, `college_id` | All FK |
| `status` | `enrollment_status` enum |
| `progress_pct` | NUMERIC — used in Student 360° (was `completion_percentage` — FIXED) |
| `grade`, `enrolled_at`, `completed_at` | Progress tracking |

#### `training_progress`, `assessments`, `certificates`
Support tables for module-level tracking. Not directly queried in current UI but RLS-protected.

### Placement Tables

#### `placement_records`
| Column | Notes |
|--------|-------|
| `college_id` | FK → colleges |
| `academic_year` | "2025-26" format |
| `company` | Company name |
| `selects` | Count of students |
| `ctc_lpa` | Package |
| `source` | `direct` or `promtal` |

#### `year_summaries`
| Column | Notes |
|--------|-------|
| `college_id`, `academic_year` | Composite context |
| `offers`, `companies`, `avg_lpa`, `top_offer_lpa`, `top_company` | Aggregate stats |

#### `placements`
Individual student-level placement records (company + CTC for each student). Not yet surfaced in UI.

#### `companies`
Company master table. `placement_records.company` is plain TEXT (not FK), so no constraint needed.

### MOU Tables

#### `mous`
| Column | Notes |
|--------|-------|
| `college_id` | FK → colleges |
| `title`, `partnership_type` | MOU metadata |
| `start_date`, `expiry_date` | Date range |
| `status` | `mou_status` enum |
| `seats_purchased`, `seats_used` | Quota tracking |
| `revenue_share_pct` | Default 20% |
| `accrued_share_inr` | Rupees — stored in paisa? No, raw rupees |
| `esign_status` | Text — not typed |
| `document_name` | Filename after upload |

#### `mou_renewals`
Tracks renewal history. `mou_id` FK → mous CASCADE.

### FDP Tables

#### `fdp_sessions`
| Column | Notes |
|--------|-------|
| `college_id` | FK → colleges |
| `title`, `speaker`, `topic` | Session metadata |
| `date`, `start_time`, `end_time` | Schedule |
| `mode` | online/offline/hybrid |
| `venue` | Location |
| `capacity`, `registered_count` | Attendance |
| `status` | `fdp_status` enum |

#### `faculty`
Faculty members per college. Used in FDP page faculty count.

#### `fdp_attendance`
Attendance linking `fdp_session_id` + `faculty_id`. RLS-protected.

### Revenue Tables

#### `revenue_share`
| Column | Notes |
|--------|-------|
| `college_id` | FK → colleges |
| `period` | "Q1-2025" format |
| `gross_amount`, `share_amount` | Amounts in rupees | 
| `share_pct` | Percentage |
| `payout_status` | `payout_status` enum |

> ⚠️ **Important:** Code uses `share_amount` (NOT `amount`). This was verified and is correct.

#### `payouts`
| Column | Notes |
|--------|-------|
| `college_id` | FK |
| `period` | Quarter |
| `amount` | Total payout amount (different from `revenue_share.share_amount`) |
| `status` | `payout_status` enum |
| `approved_by`, `approved_at` | Approval tracking |

> `seat_allocations` — additional support table not queried in current UI.

### Communication Tables

#### `communication_logs`
| Column | Notes |
|--------|-------|
| `college_id` | FK → colleges |
| `type` | `comm_type` enum |
| `subject`, `body` | Content |
| `created_by_name` | Denormalized — stores display name (no FK to users) |
| `next_meeting_at` | Optional follow-up date |

#### `activity_events`
| Column | Notes |
|--------|-------|
| `college_id` | FK |
| `entity_type` | 'student', 'college', 'fdp', 'report', etc. |
| `entity_id` | UUID of the related entity |
| `event_type` | TEXT (dot notation: 'student.placed') |
| `title` | Human-readable description |
| `payload` | JSONB — was `metadata` before fix |

#### `notifications`
| Column | Notes |
|--------|-------|
| `recipient_user_id` | UUID — **NO FK** intentional (stores auth.uid() not users.id) |
| `college_id` | Optional FK |
| `status` | `notification_status` enum (`queued/sent/failed`) |
| `read` | BOOLEAN DEFAULT false |
| `type`, `title`, `body` | Content |
| `channels` | TEXT[] DEFAULT `{in_app}` |

> **No FK on `recipient_user_id`** — design decision. RLS uses `auth.uid() = recipient_user_id`. All inserts use `u.auth_id` (the Supabase Auth UUID).

### Reports & Analytics

#### `reports`
| Column | Notes |
|--------|-------|
| `type` | **TEXT NOT NULL** (was enum — FIXED) accepts any string |
| `title` | TEXT NOT NULL DEFAULT 'Report' |
| `status` | TEXT DEFAULT 'ready' |
| `generated_by` | UUID — **NO FK** (stores auth.uid()) |
| `file_url` | NULL for all generated reports (no PDF renderer) |
| `ai_summary` | TEXT — stores JSON stringified summary |

#### `ai_insights`
| Column | Notes |
|--------|-------|
| `scope_type` | 'college', 'student', 'mou', 'department' |
| `scope_id` | UUID of scoped entity |
| `type` | Insight category (health_score, risk, etc.) |
| `score` | NUMERIC(6,2) |
| `label`, `content` | Display text |

#### `college_health_history`
| Column | Notes |
|--------|-------|
| `college_id` | FK → colleges |
| `score` | NUMERIC(5,2) |
| `captured_at` | TIMESTAMPTZ (was `computed_at` — FIXED in all queries) |

#### `benchmark_snapshots`
Periodic snapshots for trend analysis. Not yet queried in UI.

### Support Tables
- `audit_logs` — admin-only access logs
- `workshop_requests` — student workshop requests
- `dsa_progress`, `aptitude_scores`, `ats_reports`, `interview_reports` — detailed assessment tracking
- `chat_rooms`, `messages` — TPO-AM messaging (not yet surfaced in UI)
- `notification_logs` — delivery tracking per channel

---

## 3. FOREIGN KEYS

All FKs follow consistent cascade rules:
- `ON DELETE CASCADE` — most college-scoped tables (delete college → delete everything)
- `ON DELETE SET NULL` — soft references (department head, account manager)
- NO FK — `notifications.recipient_user_id` (intentional: auth UID ≠ users.id)
- NO FK — `reports.generated_by` (intentional: auth UID ≠ users.id)
- NO FK — `activity_events.entity_id` (polymorphic reference to different entity types)

---

## 4. RLS POLICIES (54 total)

### Pattern Summary

All policies follow a three-tier model:

**Tier 1 — Super Admin:** `FOR ALL` with `current_user_role() = 'super_admin'` — unrestricted access to everything.

**Tier 2 — Account Manager:** `FOR SELECT` scoped to their assigned colleges via `account_manager_id = auth.uid()`.

**Tier 3 — College Staff:** `FOR SELECT` scoped to their own college via `id = auth_college_id()` / `college_id = auth_college_id()`. TPOs additionally get `FOR INSERT/UPDATE/DELETE` on entities they manage.

### Policy Coverage by Table

| Table | Policies | Super Admin | Acc Mgr | TPO | HOD | Faculty |
|-------|----------|-------------|---------|-----|-----|---------|
| colleges | 4 | ALL | SELECT | SELECT+UPDATE | SELECT | SELECT |
| departments | 2 | — | — | MANAGE | SELECT | SELECT |
| users | 5 | ALL | SELECT | MANAGE team | — | — |
| students | 4 | ALL | SELECT | SELECT | SELECT (dept) | SELECT (dept) |
| placements | 3 | ALL | — | SELECT | SELECT (dept) | — |
| placement_records | 1 | — | — | ALL | ALL | ALL (read-only) |
| year_summaries | 1 | — | — | ALL | ALL | ALL |
| cohorts | 2 | — | — | MANAGE | SELECT | SELECT |
| enrollments | 2 | — | — | MANAGE | SELECT | SELECT |
| mous | 3 | ALL | — | SELECT | SELECT | — |
| fdp_sessions | 2 | — | — | MANAGE | SELECT | SELECT |
| revenue_share | 2 | ALL | — | SELECT | — | — |
| payouts | 2 | ALL | — | SELECT | — | — |
| communication_logs | 2 | ALL | — | SELECT | — | — |
| activity_events | 3 | ALL | ALL | INSERT+SELECT | SELECT | — |
| notifications | 3 | ALL | — | Own only | Own only | Own only |
| reports | 3 | ALL | — | GENERATE | SELECT | — |
| ai_insights | 2 | ALL | — | SELECT | SELECT | — |
| audit_logs | 1 | ALL | — | — | — | — |
| workshop_requests | 1 | — | — | MANAGE | SELECT | Select |
| dsa_progress | 1 | — | — | — | ALL (dept) | ALL (dept) |
| aptitude_scores | 1 | — | — | — | ALL | ALL |
| ats_reports | 1 | — | — | — | ALL | ALL |
| interview_reports | 1 | — | — | — | ALL | ALL |

### Helper Functions (002_rls_policies.sql)

```sql
-- Returns college_id from JWT user_metadata
CREATE OR REPLACE FUNCTION auth_college_id() RETURNS UUID

-- Returns role string from JWT user_metadata  
CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT

-- Returns true for super_admin or account_manager
CREATE OR REPLACE FUNCTION is_skilltank_staff() RETURNS BOOLEAN

-- Returns department_id from JWT user_metadata
CREATE OR REPLACE FUNCTION auth_department_id() RETURNS UUID
```

All functions read from `auth.jwt() -> 'user_metadata'` which is set during `signInWithPassword` / `signUp` and stored in Supabase Auth metadata.

---

## 5. TRIGGERS

| Trigger | Table | When | Function |
|---------|-------|------|---------|
| `set_colleges_updated_at` | `colleges` | BEFORE UPDATE | `set_updated_at()` |
| `set_users_updated_at` | `users` | BEFORE UPDATE | `set_updated_at()` |
| `set_students_updated_at` | `students` | BEFORE UPDATE | `set_updated_at()` |

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Additional triggers may be defined for other tables. At minimum `colleges`, `users`, `students` have `updated_at` automation.

---

## 6. STORAGE BUCKETS

These must be created manually in Supabase Dashboard → Storage:

| Bucket | Visibility | Used For | Policy |
|--------|-----------|----------|--------|
| `mou-docs` | Private | MOU PDF/DOCX uploads via `MOUUploadButton` | Auth required |
| `college-logos` | **Public** | College logo images | Public read |
| `reports` | Private | Generated report PDFs (future) | Auth required |
| `certificates` | Private | Student certificates | Auth required |

> ⚠️ **These are NOT created by the migration.** Must be created manually before running seed or demo.

---

## 7. EXTENSIONS

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- For uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- For gen_random_bytes() if needed
```

Both are available by default on Supabase projects. Must be enabled if using the SQL Editor (usually auto-enabled).

---

## 8. MIGRATION ORDER

**Critical:** Always run in this order:

```
1. supabase/migrations/001_initial_schema.sql  -- Creates extensions, enums, tables, triggers
2. supabase/migrations/002_rls_policies.sql    -- Creates helper functions + RLS policies
3. npm run db:seed                             -- Populates tables with demo data
4. npm run create:users                        -- Creates Supabase Auth users
```

Running 002 before 001 will fail (tables don't exist yet).  
Running seed before 002 is OK but rows won't be RLS-protected until 002 runs.  
Running create:users before seed will fail (college IDs referenced in user creation won't exist).

---

## 9. SCHEMA vs CODE ALIGNMENT

All mismatches from static analysis are now FIXED:

| Column | Was | Fixed To | Files Affected |
|--------|-----|----------|----------------|
| `enrollments.progress_pct` | `completion_percentage` | `progress_pct` | 3 files |
| `college_health_history.captured_at` | `computed_at` | `captured_at` | 2 files |
| `activity_events.payload` | `metadata` | `payload` | 4 files |
| `cohorts.batch_label` | `cohort_type` | `batch_label` | 2 files |
| `revenue_share.share_amount` | `amount` | `share_amount` | 3 files |
| `notifications.read` | `status === 'unread'` | `!n.read` | 3 files |
| `reports.type` | `report_type enum` | `TEXT NOT NULL` | migration + 2 files |
| `reports.ai_summary` | `summary` | `ai_summary` | 1 file |
| `users.status` | `'suspended'` | `'deactivated'` | 1 file |

**Current alignment: 100%** — no column mismatch remains between migration SQL and TypeScript source.
