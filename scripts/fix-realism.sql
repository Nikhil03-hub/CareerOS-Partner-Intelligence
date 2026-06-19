-- =============================================================
-- CareerOS Partner Intelligence — Data Realism Fix
-- =============================================================
-- Run in Supabase SQL Editor (or via /api/admin/fix-realism)
-- Fixes: readiness_score (was all 100%), risk_level (was all 'low'),
--        cohort completion rates (was 0% for many)
-- =============================================================

-- 1. Fix student readiness scores (35–98, CGPA-weighted)
UPDATE students SET
  readiness_score = GREATEST(35, LEAST(98,
    ((cgpa - 6.0) / (9.8 - 6.0) * 63.0 + 35.0 + (random() * 14.0 - 7.0))::int
  ));

-- 2. Fix risk levels (15% high / 30% medium / 55% low based on CGPA + noise)
UPDATE students SET
  risk_level = CASE
    WHEN cgpa < 7.0                                       THEN 'high'::risk_level
    WHEN cgpa < 7.4 AND random() < 0.5                   THEN 'high'::risk_level
    WHEN cgpa < 8.0                                       THEN 'medium'::risk_level
    WHEN cgpa >= 8.0 AND cgpa < 8.3 AND random() < 0.25  THEN 'medium'::risk_level
    ELSE 'low'::risk_level
  END;

-- 3. Fix cohort completion rates (many stuck at 0%)
UPDATE cohorts SET
  completion_pct = CASE
    WHEN status = 'completed'   THEN GREATEST(88, LEAST(100, (88 + random() * 12)::int))
    WHEN status = 'in_progress' THEN GREATEST(20, LEAST(85,  (25 + random() * 60)::int))
    ELSE                              GREATEST(0,  LEAST(20,  (random() * 20)::int))
  END
WHERE completion_pct = 0 OR completion_pct IS NULL;

-- 4. Fix placement dates spread (all shouldn't be the same day)
UPDATE placements SET
  placed_date = NOW() - (random() * 365)::int * INTERVAL '1 day'
WHERE placed_date IS NOT NULL
  AND placed_date::date = (SELECT MIN(placed_date::date) FROM placements);

-- 5. Verify results
SELECT
  risk_level,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) AS pct,
  ROUND(AVG(readiness_score), 1) AS avg_readiness,
  ROUND(MIN(readiness_score)::numeric, 0) AS min_readiness,
  ROUND(MAX(readiness_score)::numeric, 0) AS max_readiness
FROM students
GROUP BY risk_level
ORDER BY risk_level;
