-- Migration 003: Workshop requests + MOU e-sign + G10 seat tracking

-- G3: Workshop / event requests
CREATE TABLE IF NOT EXISTS workshop_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'workshop' CHECK (kind IN ('workshop', 'hackathon', 'seminar')),
  topic TEXT NOT NULL,
  preferred_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'reviewing', 'approved', 'declined', 'scheduled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workshop_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TPO can view own college workshop requests"
  ON workshop_requests FOR SELECT
  USING (college_id = (
    SELECT college_id FROM users WHERE auth_id = auth.uid() LIMIT 1
  ));

CREATE POLICY "Service role full access to workshop_requests"
  ON workshop_requests FOR ALL
  USING (auth.role() = 'service_role');

-- G9: MOU e-sign status columns (add if not present)
ALTER TABLE mous ADD COLUMN IF NOT EXISTS esign_status TEXT DEFAULT 'unsigned' CHECK (esign_status IN ('unsigned', 'sent', 'signed'));
ALTER TABLE mous ADD COLUMN IF NOT EXISTS signed_by TEXT;
ALTER TABLE mous ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE mous ADD COLUMN IF NOT EXISTS signed_role TEXT;

-- G10: Seat tracking — seat_allocations per program per college
CREATE TABLE IF NOT EXISTS seat_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  program_name TEXT,
  seats_purchased INT NOT NULL DEFAULT 0,
  seats_used INT NOT NULL DEFAULT 0,
  academic_year TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
