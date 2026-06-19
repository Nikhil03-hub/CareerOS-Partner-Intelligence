/**
 * CareerOS Scoring Engine — ported from CareerOS-AI/guidance/scoring-engine.js
 *
 * Pattern: weighted inputs → normalize 0-100 → clamp → transparent breakdown
 * Used for: College Health Score, Student Placement Predictor, Risk Engine
 */

export interface ScoreFactor {
  label: string
  value: number      // 0-100 normalised sub-score
  weight: number     // 0-1
  contribution: number // value * weight
  detail: string     // human-readable explanation
}

export interface ScoringResult {
  score: number         // final 0-100 clamped
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  label: 'Excellent' | 'Good' | 'Average' | 'Below Average' | 'Poor'
  factors: ScoreFactor[]
  computedAt: string
}

/**
 * Core: weighted-sum → clamp 0-100
 */
export function computeWeightedScore(factors: ScoreFactor[]): number {
  const totalWeight = factors.reduce((a, f) => a + f.weight, 0)
  const raw = factors.reduce((a, f) => a + (f.value * f.weight) / totalWeight, 0)
  return Math.max(0, Math.min(100, Math.round(raw)))
}

export function gradeFromScore(score: number): ScoringResult['grade'] {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

export function labelFromScore(score: number): ScoringResult['label'] {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Average'
  if (score >= 40) return 'Below Average'
  return 'Poor'
}

// ---------------------------------------------------------------------------
// College Health Score
// ---------------------------------------------------------------------------

interface CollegeHealthInputs {
  // Placement
  totalStudents: number
  placedStudents: number
  // Training
  cohorts: { completion_pct: number; status: string }[]
  // Communication
  commLogsLast30Days: number
  // MOU
  mouStatus: 'active' | 'expiring' | 'expired' | 'none'
  // FDP
  fdpSessionsLast12Months: number
  // Revenue
  revenueThisYear: number    // ₹ actual
  revenueExpected: number    // ₹ seats_purchased * avg_fee
}

export function computeCollegeHealthScore(inputs: CollegeHealthInputs): ScoringResult {
  const factors: ScoreFactor[] = []

  // 1. Placement Rate (30%)
  const placementRate = inputs.totalStudents > 0
    ? Math.min(100, Math.round((inputs.placedStudents / inputs.totalStudents) * 100))
    : 0
  factors.push({
    label: 'Placement Rate',
    value: placementRate,
    weight: 0.30,
    contribution: placementRate * 0.30,
    detail: `${inputs.placedStudents} placed of ${inputs.totalStudents} students (${placementRate}%)`,
  })

  // 2. Training Completion (25%)
  const activeCohorts = inputs.cohorts.filter(c => c.status !== 'upcoming')
  const avgCompletion = activeCohorts.length > 0
    ? Math.round(activeCohorts.reduce((a, c) => a + (c.completion_pct || 0), 0) / activeCohorts.length)
    : 0
  factors.push({
    label: 'Training Completion',
    value: avgCompletion,
    weight: 0.25,
    contribution: avgCompletion * 0.25,
    detail: `Avg ${avgCompletion}% across ${activeCohorts.length} training cohort${activeCohorts.length !== 1 ? 's' : ''}`,
  })

  // 3. Communication Activity (15%) — normalised: 0 logs = 0, 10+ logs = 100
  const commScore = Math.min(100, Math.round((inputs.commLogsLast30Days / 10) * 100))
  factors.push({
    label: 'Communication Activity',
    value: commScore,
    weight: 0.15,
    contribution: commScore * 0.15,
    detail: `${inputs.commLogsLast30Days} touchpoints in the last 30 days`,
  })

  // 4. MOU Status (15%)
  const mouScore = inputs.mouStatus === 'active'
    ? 100 : inputs.mouStatus === 'expiring' ? 50 : 0
  const mouDetail = {
    active: 'MOU active and current',
    expiring: 'MOU expiring soon — renewal needed',
    expired: 'MOU expired — critical',
    none: 'No MOU on file',
  }[inputs.mouStatus]
  factors.push({
    label: 'MOU Status',
    value: mouScore,
    weight: 0.15,
    contribution: mouScore * 0.15,
    detail: mouDetail,
  })

  // 5. FDP Participation (10%) — normalised: 0 sessions = 0, 5+ = 100
  const fdpScore = Math.min(100, Math.round((inputs.fdpSessionsLast12Months / 5) * 100))
  factors.push({
    label: 'FDP Participation',
    value: fdpScore,
    weight: 0.10,
    contribution: fdpScore * 0.10,
    detail: `${inputs.fdpSessionsLast12Months} FDP session${inputs.fdpSessionsLast12Months !== 1 ? 's' : ''} in the past 12 months`,
  })

  // 6. Revenue Contribution (5%) — actualised / expected
  const revenueScore = inputs.revenueExpected > 0
    ? Math.min(100, Math.round((inputs.revenueThisYear / inputs.revenueExpected) * 100))
    : inputs.revenueThisYear > 0 ? 80 : 0
  factors.push({
    label: 'Revenue Contribution',
    value: revenueScore,
    weight: 0.05,
    contribution: revenueScore * 0.05,
    detail: `₹${(inputs.revenueThisYear / 100000).toFixed(2)}L collected vs ₹${(inputs.revenueExpected / 100000).toFixed(2)}L expected (${revenueScore}%)`,
  })

  const score = computeWeightedScore(factors)
  return {
    score,
    grade: gradeFromScore(score),
    label: labelFromScore(score),
    factors,
    computedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Student Placement Predictor
// ---------------------------------------------------------------------------

interface StudentPredictorInputs {
  attendancePct: number        // 0-100
  trainingCompletionPct: number // 0-100
  assessmentScore: number      // 0-100
  dsaOrMockScore: number       // 0-100
  cgpa: number                 // 0-10 → normalise to 0-100
}

export interface PlacementPrediction {
  probability: number  // 0-100 %
  expectedPackageLPA: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendedSkills: string[]
  breakdown: ScoreFactor[]
}

const KMIT_PACKAGE_BANDS = [
  { minProb: 80, avgLPA: 12.4 },
  { minProb: 60, avgLPA: 8.6 },
  { minProb: 40, avgLPA: 6.2 },
  { minProb: 0,  avgLPA: 4.8 },
]

export function predictPlacement(inputs: StudentPredictorInputs): PlacementPrediction {
  const cgpaNorm = Math.min(100, Math.round((inputs.cgpa / 10) * 100))

  const factors: ScoreFactor[] = [
    { label: 'Attendance', value: inputs.attendancePct, weight: 0.25, contribution: inputs.attendancePct * 0.25, detail: `${inputs.attendancePct}%` },
    { label: 'Training Completion', value: inputs.trainingCompletionPct, weight: 0.25, contribution: inputs.trainingCompletionPct * 0.25, detail: `${inputs.trainingCompletionPct}%` },
    { label: 'Assessment Score', value: inputs.assessmentScore, weight: 0.20, contribution: inputs.assessmentScore * 0.20, detail: `${inputs.assessmentScore}/100` },
    { label: 'DSA / Mock Interviews', value: inputs.dsaOrMockScore, weight: 0.15, contribution: inputs.dsaOrMockScore * 0.15, detail: `${inputs.dsaOrMockScore}/100` },
    { label: 'CGPA (Normalised)', value: cgpaNorm, weight: 0.15, contribution: cgpaNorm * 0.15, detail: `${inputs.cgpa} CGPA → ${cgpaNorm}/100` },
  ]

  const probability = computeWeightedScore(factors)
  const band = KMIT_PACKAGE_BANDS.find(b => probability >= b.minProb) || KMIT_PACKAGE_BANDS[KMIT_PACKAGE_BANDS.length - 1]
  const noise = (Math.random() * 2 - 1) * 0.5
  const expectedPackageLPA = Math.round((band.avgLPA + noise) * 10) / 10

  const riskLevel: 'low' | 'medium' | 'high' =
    probability >= 70 ? 'low' : probability >= 40 ? 'medium' : 'high'

  const recommendedSkills = probability < 70
    ? ['Data Structures & Algorithms', 'System Design', 'SQL', 'Communication Skills']
    : ['Cloud (AWS/GCP)', 'Machine Learning Basics', 'REST APIs', 'Leadership']

  return { probability, expectedPackageLPA, riskLevel, recommendedSkills, breakdown: factors }
}
