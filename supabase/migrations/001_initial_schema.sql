-- ============================================================
-- CareerOS Partner Intelligence Platform
-- Migration 001: Full schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE college_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE user_role AS ENUM ('super_admin', 'account_manager', 'tpo', 'hod', 'faculty_coord', 'club_coord');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'deactivated');
CREATE TYPE placement_status AS ENUM ('unplaced', 'in_process', 'placed');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'dropped');
CREATE TYPE mou_status AS ENUM ('active', 'expiring', 'expired', 'renewed');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'paid');
CREATE TYPE fdp_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed');
CREATE TYPE comm_type AS ENUM ('note', 'meeting', 'call');
-- report_type: TEXT (not enum) to support all UI report types including 'revenue' and 'executive'
-- Kept as a comment for documentation; the reports table uses TEXT for flexibility
CREATE TYPE event_type AS ENUM (
  'student.enrolled', 'training.started', 'training.module_completed', 'assessment.passed',
  'mock_interview.completed', 'training.completed', 'placement.offered', 'placement.accepted',
  'certificate.issued', 'college.applied', 'college.approved', 'college.rejected',
  'mou.uploaded', 'mou.expiring', 'mou.renewed', 'fdp.scheduled', 'fdp.attended',
  'report.generated', 'revenue.recorded', 'payout.processed', 'workshop.requested',
  'student.risk_updated', 'user.invited', 'user.joined'
);

-- ============================================================
-- 4.1 IDENTITY & TENANCY
-- ============================================================
CREATE TABLE colleges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  code            TEXT UNIQUE,
  university      TEXT,
  city            TEXT,
  state           TEXT,
  partnership_types TEXT[] DEFAULT '{}',   -- {CRT, FDP, External Placement Partner}
  logo_url        TEXT,
  tagline         TEXT,
  website         TEXT,
  type            TEXT DEFAULT 'Engineering',  -- Engineering|Management|Pharmacy|Medical|Degree|Diploma
  status          college_status DEFAULT 'pending',
  health_score    INT DEFAULT 0 CHECK (health_score BETWEEN 0 AND 100),
  account_manager_id UUID,               -- FK → users (nullable; set after user created)
  seats_purchased INT DEFAULT 0,
  approved        BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id  UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT,
  hod_name    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id         UUID UNIQUE,              -- references auth.users(id)
  college_id      UUID REFERENCES colleges(id) ON DELETE SET NULL,
  role            user_role NOT NULL DEFAULT 'tpo',
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  status          user_status DEFAULT 'pending',
  picture         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Back-fill FK now that users exists
ALTER TABLE colleges ADD CONSTRAINT colleges_account_manager_fk
  FOREIGN KEY (account_manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- 4.2 STUDENTS, PROGRAMS, COHORTS
-- ============================================================
CREATE TABLE students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id       UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  department_id    UUID REFERENCES departments(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  email            TEXT,
  phone            TEXT,
  roll_no          TEXT,
  batch_year       INT,
  cgpa             NUMERIC(4,2),
  gender           TEXT,
  skills           TEXT[] DEFAULT '{}',
  github           TEXT,
  linkedin         TEXT,
  projects         INT DEFAULT 0,
  internships      INT DEFAULT 0,
  certifications   INT DEFAULT 0,
  placement_status placement_status DEFAULT 'unplaced',
  risk_level       risk_level DEFAULT 'low',
  readiness_score  INT DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100),
  ats_score        INT DEFAULT 0 CHECK (ats_score BETWEEN 0 AND 100),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE programs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT,        -- CRT|Interview Master|FDP|DSA|Aptitude|etc.
  description  TEXT,
  duration_weeks INT,
  modules_count  INT DEFAULT 0,
  stream       TEXT DEFAULT 'All',  -- Engineering|Management|All|Faculty
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cohorts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID NOT NULL REFERENCES programs(id),
  college_id   UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  batch_label  TEXT,
  start_date   DATE,
  end_date     DATE,
  status       TEXT DEFAULT 'active',  -- active|completed|upcoming
  enrolled_count INT DEFAULT 0,
  completion_pct NUMERIC(5,2) DEFAULT 0,
  instructor   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  cohort_id    UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  program_id   UUID NOT NULL REFERENCES programs(id),
  college_id   UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  status       enrollment_status DEFAULT 'enrolled',
  progress_pct NUMERIC(5,2) DEFAULT 0,
  modules_completed INT DEFAULT 0,
  modules_total     INT DEFAULT 0,
  grade        TEXT,                               -- A+/A/B/C after completion
  certificate_url TEXT,
  enrolled_at  TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4.3 TRAINING & ASSESSMENT
-- ============================================================
CREATE TABLE training_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  module_name     TEXT NOT NULL,
  completion_pct  NUMERIC(5,2) DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  cohort_id    UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  college_id   UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  score        NUMERIC(5,2),
  max_score    NUMERIC(5,2),
  passed       BOOLEAN DEFAULT FALSE,
  taken_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE certificates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  program_id   UUID NOT NULL REFERENCES programs(id),
  college_id   UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  issued_at    TIMESTAMPTZ DEFAULT NOW(),
  file_url     TEXT,
  co_branded   BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 4.4 PLACEMENTS
-- ============================================================
CREATE TABLE companies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT UNIQUE NOT NULL,
  logo_url   TEXT,
  logo_color TEXT,
  sector     TEXT,
  industry   TEXT,
  type       TEXT,  -- Product|Services|Finance|Consulting
  headcount  INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE placements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name    TEXT NOT NULL,
  job_role        TEXT,
  package_lpa     NUMERIC(6,2),
  offer_date      DATE,
  type            TEXT DEFAULT 'on_campus',  -- on_campus|off_campus
  status          TEXT DEFAULT 'offered',     -- offered|accepted|joined
  source          TEXT DEFAULT 'skilltank',   -- skilltank|promtal|self
  academic_year   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- KMIT real placement data table (aggregated records per year/company)
CREATE TABLE placement_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  academic_year   TEXT NOT NULL,
  company         TEXT NOT NULL,
  selects         INT DEFAULT 0,
  ctc_lpa         NUMERIC(6,2),
  source          TEXT DEFAULT 'direct',   -- direct | promtal | self
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE year_summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  academic_year   TEXT NOT NULL,
  companies       INT DEFAULT 0,
  offers          INT DEFAULT 0,
  avg_lpa         NUMERIC(6,2),
  top_offer_lpa   NUMERIC(6,2),
  top_company     TEXT,
  UNIQUE(college_id, academic_year)
);

-- ============================================================
-- 4.5 MOU / PARTNERSHIP
-- ============================================================
CREATE TABLE mous (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id       UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  partnership_type TEXT,
  start_date       DATE,
  expiry_date      DATE,
  renewal_date     DATE,
  status           mou_status DEFAULT 'active',
  document_url     TEXT,
  document_name    TEXT,
  document_size_kb INT,
  value            NUMERIC(12,2),
  seats_purchased  INT DEFAULT 0,
  seats_used       INT DEFAULT 0,
  revenue_share_pct NUMERIC(5,2) DEFAULT 0,
  accrued_share_inr NUMERIC(12,2) DEFAULT 0,
  payout_notes     TEXT,
  esign_status     TEXT DEFAULT 'unsigned',  -- unsigned|sent|signed
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mou_renewals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mou_id        UUID NOT NULL REFERENCES mous(id) ON DELETE CASCADE,
  old_expiry    DATE,
  new_expiry    DATE,
  renewed_at    TIMESTAMPTZ DEFAULT NOW(),
  renewed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT
);

-- ============================================================
-- 4.6 FDP (Faculty Development Programme)
-- ============================================================
CREATE TABLE faculty (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id    UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  email         TEXT,
  designation   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fdp_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id    UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  speaker       TEXT,
  topic         TEXT,
  description   TEXT,
  date          DATE NOT NULL,
  start_time    TIME,
  end_time      TIME,
  mode          TEXT DEFAULT 'online',  -- online|offline|hybrid
  capacity      INT DEFAULT 50,
  registered_count INT DEFAULT 0,
  status        fdp_status DEFAULT 'scheduled',
  venue         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fdp_attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fdp_session_id  UUID NOT NULL REFERENCES fdp_sessions(id) ON DELETE CASCADE,
  faculty_id      UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  present         BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  marked_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fdp_session_id, faculty_id)
);

-- ============================================================
-- 4.7 REVENUE SHARE
-- ============================================================
CREATE TABLE revenue_share (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id       UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  period           TEXT NOT NULL,  -- '2026-Q1' format
  gross_amount     NUMERIC(12,2) DEFAULT 0,
  share_pct        NUMERIC(5,2) DEFAULT 0,
  share_amount     NUMERIC(12,2) DEFAULT 0,
  payout_status    payout_status DEFAULT 'pending',
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_id, period)
);

CREATE TABLE payouts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id    UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  amount        NUMERIC(12,2) NOT NULL,
  period        TEXT,
  status        payout_status DEFAULT 'pending',
  requested_at  TIMESTAMPTZ DEFAULT NOW(),
  approved_at   TIMESTAMPTZ,
  approved_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT
);

CREATE TABLE seat_allocations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  program_id      UUID NOT NULL REFERENCES programs(id),
  seats_purchased INT DEFAULT 0,
  seats_used      INT DEFAULT 0,
  period          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_id, program_id, period)
);

-- ============================================================
-- 4.8 COMMUNICATION & NOTIFICATIONS
-- ============================================================
CREATE TABLE communication_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id          UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  account_manager_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  type                comm_type NOT NULL DEFAULT 'note',
  subject             TEXT NOT NULL,
  body                TEXT,
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_name     TEXT,
  next_meeting_at     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id    UUID REFERENCES colleges(id) ON DELETE CASCADE,  -- nullable for platform events
  entity_type   TEXT NOT NULL,   -- 'student'|'placement'|'fdp'|'mou'|'college'|'report'|'enrollment'|'revenue'
  entity_id     UUID,
  event_type    event_type NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,   -- human-readable pre-rendered string
  payload       JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id   UUID,                        -- stores auth.uid() — no FK, used by RLS
  college_id          UUID REFERENCES colleges(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  title               TEXT NOT NULL,
  body                TEXT,
  channels            TEXT[] DEFAULT '{in_app}',  -- {email, telegram, in_app}
  status              notification_status DEFAULT 'queued',
  read                BOOLEAN DEFAULT FALSE,
  event_id            UUID REFERENCES activity_events(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id     UUID REFERENCES notifications(id) ON DELETE CASCADE,
  channel             TEXT NOT NULL,  -- email|telegram|in_app
  provider_response   JSONB DEFAULT '{}',
  status              TEXT DEFAULT 'pending',  -- sent|failed|simulated
  sent_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_rooms (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id          UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  account_manager_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id    UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  body            TEXT NOT NULL,
  attachment_url  TEXT,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4.9 REPORTS, AI, GOVERNANCE
-- ============================================================
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,                         -- placement|training|revenue|executive|fdp|mou|quarterly|annual
  title           TEXT NOT NULL DEFAULT 'Report',
  period          TEXT,
  status          TEXT DEFAULT 'ready',               -- generating | ready | failed
  generated_by    UUID,                               -- auth_id of generating user
  file_url        TEXT,
  ai_summary      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type      TEXT NOT NULL,  -- college|student|mou|department
  scope_id        UUID NOT NULL,
  college_id      UUID REFERENCES colleges(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,  -- health_score|risk|placement_prediction|summary|recommendation|opportunity
  score           NUMERIC(6,2),
  label           TEXT,
  reasons         JSONB DEFAULT '[]',
  model           TEXT DEFAULT 'rule_based',
  generated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE college_health_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  score           INT NOT NULL,
  breakdown       JSONB DEFAULT '{}',  -- {placement:40, training:25, fdp:20, engagement:15}
  captured_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  before          JSONB,
  after           JSONB,
  ip              TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workshop_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  requested_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  kind            TEXT DEFAULT 'workshop',  -- workshop|hackathon
  topic           TEXT,
  preferred_date  DATE,
  status          TEXT DEFAULT 'requested',  -- requested|confirmed|cancelled
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE benchmark_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period          TEXT NOT NULL,
  metric          TEXT NOT NULL,
  avg_value       NUMERIC(10,2),
  percentile_75   NUMERIC(10,2),
  captured_at     TIMESTAMPTZ DEFAULT NOW()
);

-- DSA progress (from teammate's Striver A2Z model)
CREATE TABLE dsa_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  topic_code      TEXT NOT NULL,
  topic_name      TEXT NOT NULL,
  total           INT NOT NULL,
  solved          INT DEFAULT 0,
  attempted       INT DEFAULT 0,
  last_solved_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, topic_code)
);

CREATE TABLE aptitude_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  section_code    TEXT NOT NULL,
  section_name    TEXT NOT NULL,
  score_pct       INT DEFAULT 0,
  accuracy_pct    INT DEFAULT 0,
  avg_time_sec    INT DEFAULT 0,
  tests_taken     INT DEFAULT 0,
  attempted_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, section_code)
);

CREATE TABLE ats_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id        UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  score             INT DEFAULT 0,
  keyword_match_pct INT DEFAULT 0,
  format_score      INT DEFAULT 0,
  missing_keywords  TEXT[] DEFAULT '{}',
  uploaded_filename TEXT,
  file_url          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interview_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id        UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  type              TEXT DEFAULT 'Technical',  -- Technical|HR|System Design|Behavioral
  confidence_score  INT DEFAULT 0,
  communication_score INT DEFAULT 0,
  technical_score   INT DEFAULT 0,
  body_language_score INT DEFAULT 0,
  overall_score     INT DEFAULT 0,
  duration_min      INT DEFAULT 30,
  feedback          TEXT,
  conducted_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_colleges_status ON colleges(status);
CREATE INDEX idx_colleges_account_manager ON colleges(account_manager_id);
CREATE INDEX idx_departments_college ON departments(college_id);
CREATE INDEX idx_users_college ON users(college_id);
CREATE INDEX idx_users_auth ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_college ON students(college_id);
CREATE INDEX idx_students_dept ON students(department_id);
CREATE INDEX idx_students_placement_status ON students(placement_status);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_college ON enrollments(college_id);
CREATE INDEX idx_placements_college ON placements(college_id);
CREATE INDEX idx_placements_student ON placements(student_id);
CREATE INDEX idx_placement_records_college_year ON placement_records(college_id, academic_year);
CREATE INDEX idx_mous_college ON mous(college_id);
CREATE INDEX idx_mous_expiry ON mous(expiry_date);
CREATE INDEX idx_mous_status ON mous(status);
CREATE INDEX idx_fdp_sessions_college ON fdp_sessions(college_id);
CREATE INDEX idx_fdp_sessions_date ON fdp_sessions(date);
CREATE INDEX idx_activity_events_college ON activity_events(college_id);
CREATE INDEX idx_activity_events_created ON activity_events(created_at);
CREATE INDEX idx_activity_events_type ON activity_events(event_type);
CREATE INDEX idx_activity_events_entity ON activity_events(entity_type, entity_id);
CREATE INDEX idx_notifications_user ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_college ON notifications(college_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_comm_logs_college ON communication_logs(college_id);
CREATE INDEX idx_reports_college ON reports(college_id);
CREATE INDEX idx_ai_insights_scope ON ai_insights(scope_type, scope_id);
CREATE INDEX idx_dsa_student ON dsa_progress(student_id);
CREATE INDEX idx_aptitude_student ON aptitude_scores(student_id);
CREATE INDEX idx_ats_student ON ats_reports(student_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_colleges_updated_at BEFORE UPDATE ON colleges FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_mous_updated_at BEFORE UPDATE ON mous FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_fdp_sessions_updated_at BEFORE UPDATE ON fdp_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_revenue_updated_at BEFORE UPDATE ON revenue_share FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
