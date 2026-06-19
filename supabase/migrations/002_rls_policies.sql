-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- Helper functions that read from JWT claims
CREATE OR REPLACE FUNCTION auth_college_id() RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'college_id')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'role';
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_skilltank_staff() RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('super_admin', 'account_manager');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth_department_id() RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'department_id')::UUID;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- Enable RLS on all tenant tables
-- ============================================================
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mous ENABLE ROW LEVEL SECURITY;
ALTER TABLE mou_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdp_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_share ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsa_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COLLEGES
-- ============================================================
-- Super admin: all colleges
CREATE POLICY "super_admin_all_colleges" ON colleges
  FOR ALL TO authenticated
  USING (current_user_role() = 'super_admin');

-- Account manager: their assigned colleges
CREATE POLICY "account_manager_colleges" ON colleges
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'account_manager'
    AND account_manager_id = auth.uid()
  );

-- College staff: their own college only
CREATE POLICY "college_staff_own_college" ON colleges
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('tpo', 'hod', 'faculty_coord', 'club_coord')
    AND id = auth_college_id()
  );

-- TPO can update their own college profile
CREATE POLICY "tpo_update_own_college" ON colleges
  FOR UPDATE TO authenticated
  USING (
    current_user_role() IN ('tpo', 'hod')
    AND id = auth_college_id()
  );

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE POLICY "staff_view_own_college_depts" ON departments
  FOR SELECT TO authenticated
  USING (
    is_skilltank_staff()
    OR college_id = auth_college_id()
  );

CREATE POLICY "tpo_manage_departments" ON departments
  FOR ALL TO authenticated
  USING (
    current_user_role() IN ('tpo', 'super_admin')
    AND (is_skilltank_staff() OR college_id = auth_college_id())
  );

-- ============================================================
-- USERS
-- ============================================================
-- Users can see their own record
CREATE POLICY "users_see_own" ON users
  FOR SELECT TO authenticated
  USING (auth_id = auth.uid());

-- Super admin sees all users
CREATE POLICY "super_admin_all_users" ON users
  FOR ALL TO authenticated
  USING (current_user_role() = 'super_admin');

-- Account manager sees users in their colleges
CREATE POLICY "account_manager_college_users" ON users
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'account_manager'
    AND college_id IN (
      SELECT id FROM colleges WHERE account_manager_id = auth.uid()
    )
  );

-- TPO/HOD see users in their own college
CREATE POLICY "college_staff_see_team" ON users
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('tpo', 'hod', 'faculty_coord', 'club_coord')
    AND college_id = auth_college_id()
  );

-- TPO can invite users to their college
CREATE POLICY "tpo_manage_college_users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    current_user_role() IN ('tpo', 'super_admin')
    AND (college_id = auth_college_id() OR current_user_role() = 'super_admin')
  );

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE POLICY "skilltank_all_students" ON students
  FOR ALL TO authenticated
  USING (is_skilltank_staff());

CREATE POLICY "tpo_college_students" ON students
  FOR ALL TO authenticated
  USING (
    current_user_role() = 'tpo'
    AND college_id = auth_college_id()
  );

-- HOD sees only their department
CREATE POLICY "hod_dept_students" ON students
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'hod'
    AND college_id = auth_college_id()
    AND department_id = auth_department_id()
  );

-- Faculty coord: same as HOD scope
CREATE POLICY "faculty_coord_dept_students" ON students
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'faculty_coord'
    AND college_id = auth_college_id()
    AND department_id = auth_department_id()
  );

-- ============================================================
-- PLACEMENTS
-- ============================================================
CREATE POLICY "skilltank_all_placements" ON placements
  FOR ALL TO authenticated USING (is_skilltank_staff());

CREATE POLICY "tpo_college_placements" ON placements
  FOR ALL TO authenticated
  USING (
    current_user_role() = 'tpo'
    AND college_id = auth_college_id()
  );

CREATE POLICY "hod_dept_placements" ON placements
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('hod', 'faculty_coord', 'club_coord')
    AND college_id = auth_college_id()
  );

-- ============================================================
-- PLACEMENT RECORDS & YEAR SUMMARIES
-- ============================================================
CREATE POLICY "all_see_placement_records" ON placement_records
  FOR SELECT TO authenticated
  USING (
    is_skilltank_staff()
    OR college_id = auth_college_id()
  );

CREATE POLICY "all_see_year_summaries" ON year_summaries
  FOR SELECT TO authenticated
  USING (
    is_skilltank_staff()
    OR college_id = auth_college_id()
  );

-- ============================================================
-- COHORTS & ENROLLMENTS
-- ============================================================
CREATE POLICY "college_staff_cohorts" ON cohorts
  FOR SELECT TO authenticated
  USING (is_skilltank_staff() OR college_id = auth_college_id());

CREATE POLICY "tpo_manage_cohorts" ON cohorts
  FOR ALL TO authenticated
  USING (
    current_user_role() IN ('tpo', 'super_admin')
    AND (is_skilltank_staff() OR college_id = auth_college_id())
  );

CREATE POLICY "college_staff_enrollments" ON enrollments
  FOR SELECT TO authenticated
  USING (is_skilltank_staff() OR college_id = auth_college_id());

CREATE POLICY "tpo_manage_enrollments" ON enrollments
  FOR ALL TO authenticated
  USING (
    current_user_role() IN ('tpo', 'super_admin')
    AND (is_skilltank_staff() OR college_id = auth_college_id())
  );

-- ============================================================
-- MOU
-- ============================================================
CREATE POLICY "skilltank_all_mous" ON mous
  FOR ALL TO authenticated USING (is_skilltank_staff());

CREATE POLICY "tpo_college_mous" ON mous
  FOR ALL TO authenticated
  USING (
    current_user_role() = 'tpo'
    AND college_id = auth_college_id()
  );

CREATE POLICY "college_staff_view_mous" ON mous
  FOR SELECT TO authenticated
  USING (college_id = auth_college_id());

-- ============================================================
-- FDP
-- ============================================================
CREATE POLICY "college_staff_fdp" ON fdp_sessions
  FOR SELECT TO authenticated
  USING (is_skilltank_staff() OR college_id = auth_college_id());

CREATE POLICY "tpo_manage_fdp" ON fdp_sessions
  FOR ALL TO authenticated
  USING (
    current_user_role() IN ('tpo', 'faculty_coord', 'super_admin')
    AND (is_skilltank_staff() OR college_id = auth_college_id())
  );

CREATE POLICY "faculty_fdp" ON faculty
  FOR SELECT TO authenticated
  USING (is_skilltank_staff() OR college_id = auth_college_id());

CREATE POLICY "fdp_attendance_college" ON fdp_attendance
  FOR ALL TO authenticated
  USING (is_skilltank_staff() OR college_id = auth_college_id());

-- ============================================================
-- REVENUE SHARE
-- ============================================================
CREATE POLICY "skilltank_all_revenue" ON revenue_share
  FOR ALL TO authenticated USING (is_skilltank_staff());

CREATE POLICY "tpo_view_revenue" ON revenue_share
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'tpo'
    AND college_id = auth_college_id()
  );

CREATE POLICY "skilltank_all_payouts" ON payouts
  FOR ALL TO authenticated USING (is_skilltank_staff());

CREATE POLICY "tpo_view_payouts" ON payouts
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'tpo'
    AND college_id = auth_college_id()
  );

-- ============================================================
-- COMMUNICATION LOGS
-- ============================================================
CREATE POLICY "skilltank_all_comms" ON communication_logs
  FOR ALL TO authenticated USING (is_skilltank_staff());

CREATE POLICY "tpo_college_comms" ON communication_logs
  FOR ALL TO authenticated
  USING (
    current_user_role() = 'tpo'
    AND college_id = auth_college_id()
  );

-- ============================================================
-- ACTIVITY EVENTS
-- ============================================================
CREATE POLICY "skilltank_all_events" ON activity_events
  FOR ALL TO authenticated USING (is_skilltank_staff());

CREATE POLICY "college_staff_events" ON activity_events
  FOR SELECT TO authenticated
  USING (college_id = auth_college_id());

-- Anyone authenticated can insert (logEvent calls)
CREATE POLICY "authenticated_insert_events" ON activity_events
  FOR INSERT TO authenticated
  WITH CHECK (
    is_skilltank_staff()
    OR college_id = auth_college_id()
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "users_own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE POLICY "users_mark_read" ON notifications
  FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE POLICY "super_admin_all_notifications" ON notifications
  FOR ALL TO authenticated
  USING (current_user_role() = 'super_admin');

-- ============================================================
-- REPORTS
-- ============================================================
CREATE POLICY "skilltank_all_reports" ON reports
  FOR ALL TO authenticated USING (is_skilltank_staff());

CREATE POLICY "college_staff_reports" ON reports
  FOR SELECT TO authenticated
  USING (college_id = auth_college_id());

CREATE POLICY "tpo_generate_reports" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (
    current_user_role() IN ('tpo', 'super_admin')
    AND (is_skilltank_staff() OR college_id = auth_college_id())
  );

-- ============================================================
-- AI INSIGHTS
-- ============================================================
CREATE POLICY "skilltank_all_insights" ON ai_insights
  FOR ALL TO authenticated USING (is_skilltank_staff());

CREATE POLICY "college_staff_insights" ON ai_insights
  FOR SELECT TO authenticated
  USING (college_id = auth_college_id());

-- ============================================================
-- AUDIT LOGS (super_admin only)
-- ============================================================
CREATE POLICY "super_admin_audit_logs" ON audit_logs
  FOR ALL TO authenticated
  USING (current_user_role() = 'super_admin');

-- ============================================================
-- WORKSHOP REQUESTS
-- ============================================================
CREATE POLICY "college_staff_workshops" ON workshop_requests
  FOR ALL TO authenticated
  USING (is_skilltank_staff() OR college_id = auth_college_id());

-- ============================================================
-- DSA / APTITUDE / ATS / INTERVIEW
-- ============================================================
CREATE POLICY "college_staff_dsa" ON dsa_progress
  FOR SELECT TO authenticated
  USING (is_skilltank_staff() OR college_id = auth_college_id());

CREATE POLICY "college_staff_aptitude" ON aptitude_scores
  FOR SELECT TO authenticated
  USING (is_skilltank_staff() OR college_id = auth_college_id());

CREATE POLICY "college_staff_ats" ON ats_reports
  FOR SELECT TO authenticated
  USING (is_skilltank_staff() OR college_id = auth_college_id());

CREATE POLICY "college_staff_interview" ON interview_reports
  FOR SELECT TO authenticated
  USING (is_skilltank_staff() OR college_id = auth_college_id());

-- ============================================================
-- SERVICE ROLE BYPASS (for seed, server actions, edge functions)
-- The service_role key bypasses ALL RLS automatically in Supabase.
-- No extra policy needed - it's the default Supabase behavior.
-- ============================================================
