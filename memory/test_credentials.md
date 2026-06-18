# CareerOS Campus Intelligence v2 — Test Credentials

All demo users seeded automatically on backend startup. Use email + password via `/api/auth/login` (or the demo buttons on `/login`).

## Pre-seeded accounts

All passwords are `careeros2026` unless noted.

| Email | Password | Role | Home route | Workspace |
| --- | --- | --- | --- | --- |
| admin@careeros.app | careeros2026 | super_admin | /platform | Platform control + institutions + notifications + revenue proxy |
| institution@kmit.in | careeros2026 | institution_admin | /institution | Institution overview, profile, programs, MOU |
| tpo@kmit.in | careeros2026 | tpo | /tpo | Placement command center: outcomes, roster, training, DSA, aptitude, ATS, interviews, applications, jobs, recruiters, MOU, announcements |
| faculty@kmit.in | careeros2026 | faculty | /faculty | Department-scoped roster + analytics |
| student@kmit.in | careeros2026 | student | /student | Personal readiness, DSA tracker, applications, jobs, announcements |
| recruiter@amazon.com | careeros2026 | recruiter | /recruiter | Hiring console: jobs, talent pool, pipeline |
| tpo@vasavi.ac.in | careeros2026 | tpo (NOT approved) | /pending | Tests the approval-gate flow |

## API testing
```bash
URL=https://career-os-nexus.preview.emergentagent.com
curl -i -c /tmp/c.txt -X POST "$URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tpo@kmit.in","password":"careeros2026"}'
curl -b /tmp/c.txt "$URL/api/auth/me"
```

## Key endpoints
- Auth: `/api/auth/login` (POST), `/api/auth/me` (GET), `/api/auth/session` (Google OAuth)
- Public: `/api/public/landing-stats`
- Institutions: `/api/institutions`, `/api/institutions/{id}` (GET, PATCH), `/api/institutions/{id}/departments`
- Students: `/api/students` (GET, POST), `/api/students/{id}`, `/api/me/dashboard` (student only)
- DSA: `/api/dsa/topics`, `/api/dsa/intelligence`, `/api/me/dsa/toggle` (POST)
- Aptitude: `/api/aptitude/intelligence`
- ATS: `/api/ats/intelligence`
- Interviews: `/api/interviews/intelligence`
- Placements: `/api/placements/overview`
- Training: `/api/cohorts`, `/api/training/completion`
- Jobs/Applications: `/api/jobs`, `/api/applications` (filter by ?stage=), PATCH `/api/applications/{id}`
- Recruiters: `/api/recruiters`, `/api/recruiters/{id}/talent-pool`
- Announcements: `/api/announcements` (GET, POST)
- MOU: `/api/mou` (GET), `/api/mou/upload` (POST multipart)
- Admin: `/api/admin/platform-stats`, `/api/admin/pending-signups`, `/api/admin/approve/{user_id}`, `/api/admin/reject/{user_id}`, `/api/admin/colleges`, `/api/admin/notifications`, `/api/admin/test-notification`

## Notes
- 6 institutions seeded (KMIT engineering, LIM management, SPMP pharmacy, GMC medical, SMDC degree, GPT-MT diploma)
- 470 students with full profiles (CGPA, skills, projects, ATS, readiness)
- 19 Striver A2Z DSA topics (455 problems total) with per-student progress
- 4 aptitude sections × per-student scores
- 22 recruiters, ~70 jobs, ~880 applications across all stages
- KMIT real placement records 2017-18 → 2025-26 (148 cos / 702 offers / ₹8.26L avg / ₹80L Amazon top)
- Notifications fan out to email + telegram on key events; `simulated` when keys absent (acceptable per problem statement rule #8)
