import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// ─── Rule-based ATS scoring engine ────────────────────────────────────────────
// Ported concept from CareerOS ATS controller — keyword scoring + section detection

const TECHNICAL_SKILLS = [
  'python','java','javascript','typescript','react','node','sql','mongodb','postgresql',
  'aws','gcp','azure','docker','kubernetes','git','linux','c++','c#','go','rust',
  'machine learning','deep learning','tensorflow','pytorch','scikit','pandas','numpy',
  'html','css','tailwind','next','express','spring','django','flask','angular','vue',
  'redis','kafka','elasticsearch','graphql','rest','api','microservices',
  'data structures','algorithms','dsa','system design','oops','agile','scrum',
]

const SOFT_SKILLS = [
  'communication','leadership','teamwork','problem solving','critical thinking',
  'time management','adaptability','creativity','collaboration','analytical',
  'presentation','project management','research',
]

const SECTIONS = {
  education: ['education','qualification','academic','degree','university','college','school','gpa','cgpa','marks'],
  experience: ['experience','internship','intern','work','job','project','role','position','employment','company'],
  skills: ['skill','technology','tools','programming','technical','languages','framework','software'],
  achievements: ['achievement','award','certification','certificate','honor','prize','scholarship','rank','winner'],
  projects: ['project','built','developed','created','implemented','designed','deployed','architecture'],
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const skill of [...TECHNICAL_SKILLS, ...SOFT_SKILLS]) {
    if (lower.includes(skill)) found.push(skill)
  }
  return [...new Set(found)]
}

function detectSections(text: string): Record<string, boolean> {
  const lower = text.toLowerCase()
  const result: Record<string, boolean> = {}
  for (const [section, keywords] of Object.entries(SECTIONS)) {
    result[section] = keywords.some(kw => lower.includes(kw))
  }
  return result
}

function scoreResume(text: string, studentCgpa: number = 0) {
  const words = text.split(/\s+/).length
  const keywords = extractKeywords(text)
  const sections = detectSections(text)

  // Technical keyword score (0-40)
  const techFound = keywords.filter(k => TECHNICAL_SKILLS.includes(k))
  const techScore = Math.min(40, Math.round((techFound.length / 12) * 40))

  // Section completeness score (0-25)
  const sectionCount = Object.values(sections).filter(Boolean).length
  const sectionScore = Math.round((sectionCount / Object.keys(sections).length) * 25)

  // Length & detail score (0-15)
  const lengthScore = words < 150 ? 5 : words < 300 ? 10 : words < 600 ? 15 : 12

  // Soft skills score (0-10)
  const softFound = keywords.filter(k => SOFT_SKILLS.includes(k))
  const softScore = Math.min(10, softFound.length * 3)

  // CGPA bonus (0-10)
  const cgpaScore = Math.round((Math.min(10, studentCgpa) / 10) * 10)

  const total = Math.min(100, techScore + sectionScore + lengthScore + softScore + cgpaScore)

  // Skill gap analysis
  const commonJobSkills = ['python', 'java', 'javascript', 'sql', 'react', 'node', 'git', 'aws', 'data structures', 'system design']
  const missing = commonJobSkills.filter(s => !keywords.includes(s)).slice(0, 5)

  // Strengths and weaknesses
  const strengths: string[] = []
  const improvements: string[] = []

  if (techFound.length >= 6) strengths.push('Strong technical skill set')
  if (sections.projects) strengths.push('Project experience demonstrated')
  if (sections.achievements) strengths.push('Awards and certifications present')
  if (softFound.length >= 3) strengths.push('Good soft skills coverage')
  if (words >= 300) strengths.push('Well-detailed resume content')

  if (!sections.experience) improvements.push('Add internship or work experience')
  if (!sections.achievements) improvements.push('Highlight certifications or awards')
  if (techFound.length < 4) improvements.push('List more technical skills')
  if (missing.length > 0) improvements.push(`Add in-demand skills: ${missing.slice(0, 3).join(', ')}`)
  if (words < 200) improvements.push('Expand resume with more details')
  if (!sections.projects) improvements.push('Add project descriptions with impact')

  // Recommended programs
  const recommendations: string[] = []
  if (total < 50) recommendations.push('CRT Bootcamp — Resume & Interview Prep')
  if (missing.includes('python') || missing.includes('data structures')) recommendations.push('DSA + Python Mastery Cohort')
  if (!sections.projects) recommendations.push('Industry Project Program')
  if (total >= 70) recommendations.push('Interview Master — Advanced Placement Prep')

  return {
    ats_score: total,
    keywords_found: keywords,
    keywords_count: keywords.length,
    tech_skills: techFound,
    soft_skills: softFound,
    sections_detected: sections,
    skill_gaps: missing,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
    word_count: words,
    breakdown: {
      technical_keywords: techScore,
      section_completeness: sectionScore,
      content_length: lengthScore,
      soft_skills: softScore,
      academic: cgpaScore,
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const text = formData.get('resumeText') as string
    const studentId = formData.get('studentId') as string
    const cgpa = parseFloat(formData.get('cgpa') as string || '0')

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Resume text too short. Please paste at least 50 words.' }, { status: 400 })
    }

    const result = scoreResume(text, cgpa)

    // Save to DB if studentId provided
    if (studentId) {
      const supabase = createServiceClient()
      await supabase.from('students').update({
        ats_score: result.ats_score,
        skills: result.tech_skills.slice(0, 10),
      }).eq('id', studentId)

      await supabase.from('activity_events').insert({
        entity_type: 'student',
        entity_id: studentId,
        event_type: 'assessment.completed',
        title: `ATS Resume Analysis — Score: ${result.ats_score}/100`,
        payload: { ats_score: result.ats_score, keywords_count: result.keywords_count },
      })
    }

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Analysis failed' }, { status: 500 })
  }
}
