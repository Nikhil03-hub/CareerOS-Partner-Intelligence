/**
 * CareerOS Partner Intelligence Platform — Seed Script
 *
 * Populates all tables with:
 * - 25 colleges (mix of statuses for demo)
 * - Real KMIT placement data (9 years: 2017-18 → 2025-26)
 * - 2,500+ students
 * - All programs, cohorts, enrollments
 * - FDP sessions + attendance
 * - Revenue share + payouts
 * - MOUs (several expiring for renewal demo)
 * - Communication logs
 * - Activity events
 * - Demo user accounts for all 6 roles
 *
 * Run: npm run db:seed
 * Reset: npm run db:reset
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config({ path: path.join(__dirname, '../.env') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const RESET = process.argv.includes('--reset')

// ============================================================
// KMIT REAL PLACEMENT DATA (2017-18 → 2025-26)
// ============================================================
const KMIT_PLACEMENT_RECORDS = [
  { year: '2025-26', company: 'Amazon', selects: 4, ctc: 80.0 },
  { year: '2025-26', company: 'Google', selects: 3, ctc: 54.5 },
  { year: '2025-26', company: 'Microsoft', selects: 5, ctc: 44.0 },
  { year: '2025-26', company: 'Salesforce', selects: 6, ctc: 38.0 },
  { year: '2025-26', company: 'ServiceNow', selects: 4, ctc: 42.0 },
  { year: '2025-26', company: 'Adobe', selects: 3, ctc: 35.0 },
  { year: '2025-26', company: 'Goldman Sachs', selects: 5, ctc: 32.0 },
  { year: '2025-26', company: 'JP Morgan Chase', selects: 8, ctc: 28.0 },
  { year: '2025-26', company: 'Deloitte', selects: 22, ctc: 12.5 },
  { year: '2025-26', company: 'Accenture', selects: 38, ctc: 7.5 },
  { year: '2025-26', company: 'TCS', selects: 45, ctc: 7.0 },
  { year: '2025-26', company: 'Infosys', selects: 32, ctc: 7.5 },
  { year: '2025-26', company: 'Wipro', selects: 28, ctc: 6.5 },
  { year: '2025-26', company: 'Cognizant', selects: 30, ctc: 7.2 },
  { year: '2025-26', company: 'Capgemini', selects: 24, ctc: 6.8 },
  { year: '2025-26', company: 'HCL Technologies', selects: 26, ctc: 6.5 },
  { year: '2025-26', company: 'Tech Mahindra', selects: 22, ctc: 6.2 },
  { year: '2025-26', company: 'LTIMindtree', selects: 18, ctc: 7.5 },
  { year: '2025-26', company: 'Mphasis', selects: 14, ctc: 7.0 },
  { year: '2025-26', company: 'Persistent Systems', selects: 16, ctc: 8.5 },
  { year: '2025-26', company: 'ZS Associates', selects: 6, ctc: 16.0 },
  { year: '2025-26', company: 'Walmart Global Tech', selects: 5, ctc: 24.0 },
  { year: '2025-26', company: 'DE Shaw', selects: 2, ctc: 38.0 },
  { year: '2025-26', company: 'Cisco', selects: 7, ctc: 22.0 },
  { year: '2025-26', company: 'Qualcomm', selects: 3, ctc: 28.0 },
  { year: '2025-26', company: 'Nvidia', selects: 2, ctc: 36.0 },
  { year: '2025-26', company: 'Oracle', selects: 9, ctc: 18.0 },
  { year: '2025-26', company: 'SAP Labs', selects: 4, ctc: 22.0 },
  { year: '2025-26', company: 'Atlassian', selects: 2, ctc: 32.0 },
  { year: '2025-26', company: 'Uber', selects: 3, ctc: 30.0 },
  { year: '2024-25', company: 'Google', selects: 4, ctc: 52.0 },
  { year: '2024-25', company: 'Amazon', selects: 5, ctc: 46.0 },
  { year: '2024-25', company: 'ServiceNow', selects: 3, ctc: 42.0 },
  { year: '2024-25', company: 'Microsoft', selects: 4, ctc: 41.0 },
  { year: '2024-25', company: 'Salesforce', selects: 5, ctc: 36.0 },
  { year: '2024-25', company: 'Goldman Sachs', selects: 4, ctc: 30.0 },
  { year: '2024-25', company: 'Adobe', selects: 2, ctc: 32.0 },
  { year: '2024-25', company: 'TCS', selects: 52, ctc: 6.8 },
  { year: '2024-25', company: 'Infosys', selects: 38, ctc: 7.2 },
  { year: '2024-25', company: 'Wipro', selects: 30, ctc: 6.2 },
  { year: '2024-25', company: 'Accenture', selects: 42, ctc: 7.2 },
  { year: '2024-25', company: 'Deloitte', selects: 18, ctc: 12.0 },
  { year: '2024-25', company: 'Cognizant', selects: 28, ctc: 7.0 },
  { year: '2024-25', company: 'Capgemini', selects: 22, ctc: 6.5 },
  { year: '2024-25', company: 'ZS Associates', selects: 5, ctc: 14.5 },
  { year: '2023-24', company: 'Intuit', selects: 2, ctc: 49.8 },
  { year: '2023-24', company: 'Salesforce', selects: 4, ctc: 47.0 },
  { year: '2023-24', company: 'Amazon', selects: 3, ctc: 44.0 },
  { year: '2023-24', company: 'Microsoft', selects: 3, ctc: 39.0 },
  { year: '2023-24', company: 'Google', selects: 2, ctc: 45.0 },
  { year: '2023-24', company: 'Goldman Sachs', selects: 3, ctc: 28.5 },
  { year: '2023-24', company: 'TCS', selects: 48, ctc: 6.5 },
  { year: '2023-24', company: 'Infosys', selects: 36, ctc: 6.8 },
  { year: '2023-24', company: 'Accenture', selects: 40, ctc: 7.0 },
  { year: '2023-24', company: 'Wipro', selects: 28, ctc: 6.0 },
  { year: '2023-24', company: 'Deloitte', selects: 16, ctc: 11.5 },
  { year: '2022-23', company: 'Microsoft', selects: 3, ctc: 38.0 },
  { year: '2022-23', company: 'Amazon', selects: 4, ctc: 36.0 },
  { year: '2022-23', company: 'Salesforce', selects: 3, ctc: 32.0 },
  { year: '2022-23', company: 'Goldman Sachs', selects: 2, ctc: 26.0 },
  { year: '2022-23', company: 'TCS', selects: 56, ctc: 6.2 },
  { year: '2022-23', company: 'Infosys', selects: 42, ctc: 6.5 },
  { year: '2022-23', company: 'Wipro', selects: 34, ctc: 5.8 },
  { year: '2022-23', company: 'Accenture', selects: 48, ctc: 6.8 },
  { year: '2021-22', company: 'Microsoft', selects: 2, ctc: 32.0 },
  { year: '2021-22', company: 'Amazon', selects: 3, ctc: 30.0 },
  { year: '2021-22', company: 'TCS', selects: 62, ctc: 5.8 },
  { year: '2021-22', company: 'Infosys', selects: 44, ctc: 6.2 },
  { year: '2021-22', company: 'Wipro', selects: 38, ctc: 5.5 },
  { year: '2021-22', company: 'Accenture', selects: 52, ctc: 6.5 },
  { year: '2020-21', company: 'Amazon', selects: 2, ctc: 28.0 },
  { year: '2020-21', company: 'TCS', selects: 58, ctc: 5.5 },
  { year: '2020-21', company: 'Infosys', selects: 40, ctc: 5.8 },
  { year: '2020-21', company: 'Wipro', selects: 36, ctc: 5.2 },
  { year: '2020-21', company: 'Accenture', selects: 48, ctc: 6.0 },
  { year: '2019-20', company: 'Amazon', selects: 2, ctc: 25.0 },
  { year: '2019-20', company: 'TCS', selects: 52, ctc: 5.2 },
  { year: '2019-20', company: 'Infosys', selects: 38, ctc: 5.5 },
  { year: '2019-20', company: 'Cognizant', selects: 30, ctc: 5.0 },
  { year: '2019-20', company: 'Wipro', selects: 34, ctc: 5.0 },
  { year: '2018-19', company: 'TCS', selects: 48, ctc: 5.0 },
  { year: '2018-19', company: 'Infosys', selects: 36, ctc: 5.2 },
  { year: '2018-19', company: 'Wipro', selects: 32, ctc: 4.8 },
  { year: '2018-19', company: 'Cognizant', selects: 28, ctc: 4.8 },
  { year: '2017-18', company: 'TCS', selects: 42, ctc: 4.5 },
  { year: '2017-18', company: 'Infosys', selects: 34, ctc: 4.8 },
  { year: '2017-18', company: 'Wipro', selects: 28, ctc: 4.5 },
  { year: '2017-18', company: 'Cognizant', selects: 26, ctc: 4.5 },
]

const YEAR_AGGREGATES: Record<string, { companies: number, offers: number, avg_lpa: number, top_offer_lpa: number, top_company: string }> = {
  '2025-26': { companies: 148, offers: 702, avg_lpa: 8.26, top_offer_lpa: 80.0, top_company: 'Amazon' },
  '2024-25': { companies: 132, offers: 685, avg_lpa: 7.92, top_offer_lpa: 52.0, top_company: 'Google' },
  '2023-24': { companies: 118, offers: 642, avg_lpa: 7.45, top_offer_lpa: 49.8, top_company: 'Intuit' },
  '2022-23': { companies: 104, offers: 598, avg_lpa: 6.98, top_offer_lpa: 38.0, top_company: 'Microsoft' },
  '2021-22': { companies: 92, offers: 572, avg_lpa: 6.45, top_offer_lpa: 32.0, top_company: 'Microsoft' },
  '2020-21': { companies: 78, offers: 524, avg_lpa: 5.92, top_offer_lpa: 28.0, top_company: 'Amazon' },
  '2019-20': { companies: 72, offers: 488, avg_lpa: 5.65, top_offer_lpa: 25.0, top_company: 'Amazon' },
  '2018-19': { companies: 64, offers: 442, avg_lpa: 5.28, top_offer_lpa: 18.0, top_company: 'Microsoft' },
  '2017-18': { companies: 58, offers: 412, avg_lpa: 4.92, top_offer_lpa: 16.5, top_company: 'Amazon' },
}

// ============================================================
// COLLEGES (25 total: 22 approved + 2 pending + 1 suspended)
// ============================================================
const COLLEGES_DATA = [
  { name: 'Keshav Memorial Institute of Technology', code: 'KMIT', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Where placement intelligence is born.', status: 'approved', partnership_types: ['CRT', 'FDP', 'External Placement Partner'], seats_purchased: 240 },
  { name: 'VNR Vignana Jyothi Institute of Engg & Technology', code: 'VNRVJIET', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Excellence in engineering education.', status: 'approved', partnership_types: ['CRT', 'FDP'], seats_purchased: 320 },
  { name: 'CVR College of Engineering', code: 'CVRCE', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Technology with a human touch.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 180 },
  { name: 'Mahatma Gandhi Institute of Technology', code: 'MGIT', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Building tomorrow\'s engineers.', status: 'approved', partnership_types: ['CRT', 'FDP'], seats_purchased: 200 },
  { name: 'JNTU Hyderabad', code: 'JNTUH', university: 'Autonomous', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Premier technical university.', status: 'approved', partnership_types: ['CRT', 'FDP', 'External Placement Partner'], seats_purchased: 500 },
  { name: 'Sreenidhi Institute of Science & Technology', code: 'SNIST', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Innovation in technical education.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 160 },
  { name: 'Vasavi College of Engineering', code: 'VCE', university: 'Osmania University', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Values + Vision + Victory.', status: 'approved', partnership_types: ['CRT', 'FDP'], seats_purchased: 220 },
  { name: 'CBIT (Chaitanya Bharathi Institute of Technology)', code: 'CBIT', university: 'Osmania University', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Charting new horizons.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 190 },
  { name: 'Malla Reddy College of Engineering', code: 'MRCE', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Quality technical education.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 150 },
  { name: 'Gokaraju Rangaraju Institute of Engineering', code: 'GRIET', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Inspired learning, impactful outcomes.', status: 'approved', partnership_types: ['CRT', 'FDP'], seats_purchased: 280 },
  { name: 'BITS Pilani Hyderabad Campus', code: 'BITSHYD', university: 'BITS Pilani', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Where curiosity meets excellence.', status: 'approved', partnership_types: ['CRT', 'External Placement Partner'], seats_purchased: 400 },
  { name: 'Loyola Institute of Management', code: 'LIM', university: 'Madras University', city: 'Chennai', state: 'Tamil Nadu', type: 'Management', tagline: 'Future business leaders, measurably.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 120 },
  { name: 'Sri Padmavati Mahila Pharmacy College', code: 'SPMP', university: 'JNTUA', city: 'Tirupati', state: 'Andhra Pradesh', type: 'Pharmacy', tagline: 'Pharma research to industry.', status: 'approved', partnership_types: ['CRT', 'FDP'], seats_purchased: 80 },
  { name: 'Gandhi Medical College', code: 'GMC', university: 'KNRUHS', city: 'Secunderabad', state: 'Telangana', type: 'Medical', tagline: 'Clinical excellence, residency placements.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 60 },
  { name: 'St. Mary\'s Degree College', code: 'SMDC', university: 'Osmania University', city: 'Hyderabad', state: 'Telangana', type: 'Degree', tagline: 'Degree to career, fast-tracked.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 100 },
  { name: 'Government Polytechnic — Masab Tank', code: 'GPTMT', university: 'SBTET', city: 'Hyderabad', state: 'Telangana', type: 'Diploma', tagline: 'Skilled diploma → industry pipeline.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 90 },
  { name: 'SR Engineering College', code: 'SREC', university: 'JNTUH', city: 'Warangal', state: 'Telangana', type: 'Engineering', tagline: 'Engineering futures, one student at a time.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 140 },
  { name: 'KL University', code: 'KLU', university: 'KL University', city: 'Vijayawada', state: 'Andhra Pradesh', type: 'Engineering', tagline: 'Deemed to be University of Excellence.', status: 'approved', partnership_types: ['CRT', 'FDP'], seats_purchased: 350 },
  { name: 'Vardhaman College of Engineering', code: 'VARDHAMAN', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Rising together.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 130 },
  { name: 'Matrusri Engineering College', code: 'MATRUSRI', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Nurturing technical talent.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 110 },
  { name: 'Aurora\'s Technological & Research Institute', code: 'ATRI', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Lighting the path of innovation.', status: 'approved', partnership_types: ['CRT'], seats_purchased: 120 },
  { name: 'Institute of Aeronautical Engineering', code: 'IARE', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Sky is not the limit.', status: 'approved', partnership_types: ['CRT', 'FDP'], seats_purchased: 160 },
  // Pending colleges (for approval demo)
  { name: 'Bharat Institute of Engineering & Technology', code: 'BIET', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Aspiring excellence.', status: 'pending', partnership_types: ['CRT'], seats_purchased: 0 },
  { name: 'Nalla Narasimha Reddy Education Society', code: 'NNRES', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: 'Quality with commitment.', status: 'pending', partnership_types: ['CRT'], seats_purchased: 0 },
  // Suspended college
  { name: 'XYZ Private Institute (Demo Suspended)', code: 'XYZPI', university: 'JNTUH', city: 'Hyderabad', state: 'Telangana', type: 'Engineering', tagline: '', status: 'suspended', partnership_types: ['CRT'], seats_purchased: 50 },
]

const DEPARTMENTS_BY_TYPE: Record<string, string[]> = {
  Engineering: ['CSE', 'CSE-AIML', 'CSE-DS', 'IT', 'ECE', 'EEE'],
  Management: ['MBA-Finance', 'MBA-Marketing', 'MBA-Operations', 'MBA-Analytics'],
  Pharmacy: ['B-Pharm', 'M-Pharm', 'Pharm-D'],
  Medical: ['MBBS', 'Pediatrics', 'General Surgery', 'Internal Medicine'],
  Degree: ['B.Com', 'BBA', 'B.Sc Computers', 'B.A Economics'],
  Diploma: ['Mechanical', 'Civil', 'EEE', 'Computer Engg'],
}

const PROGRAMS_DATA = [
  { code: 'CRT', name: 'Campus Recruitment Training', type: 'CRT', description: 'Comprehensive 16-week placement preparation program covering aptitude, DSA, and soft skills.', duration_weeks: 16, modules_count: 12, stream: 'Engineering' },
  { code: 'IM', name: 'Interview Master', type: 'Interview Master', description: '8-week intensive mock interview and preparation program.', duration_weeks: 8, modules_count: 8, stream: 'All' },
  { code: 'FDP', name: 'Faculty Development Programme', type: 'FDP', description: '6-week faculty upskilling program aligned with industry needs.', duration_weeks: 6, modules_count: 6, stream: 'Faculty' },
  { code: 'DSA', name: 'DSA A-to-Z Mastery', type: 'DSA', description: 'Striver A2Z structured data structures and algorithms course.', duration_weeks: 12, modules_count: 18, stream: 'Engineering' },
  { code: 'APT', name: 'Aptitude & Reasoning', type: 'Aptitude', description: 'Quantitative, logical, and verbal ability preparation.', duration_weeks: 6, modules_count: 10, stream: 'All' },
  { code: 'BIZ', name: 'Business Case Studies', type: 'Business', description: 'MBA-style case study and consulting preparation.', duration_weeks: 10, modules_count: 12, stream: 'Management' },
  { code: 'COMM', name: 'Communication Mastery', type: 'Communication', description: 'Professional English and communication skills.', duration_weeks: 4, modules_count: 6, stream: 'All' },
]

const FIRST_NAMES = ['Aarav', 'Aditya', 'Akshay', 'Ananya', 'Anish', 'Arjun', 'Bhavya', 'Chaitanya', 'Deepak', 'Divya', 'Esha', 'Gaurav', 'Harini', 'Ishaan', 'Jahnavi', 'Karthik', 'Lavanya', 'Manasvi', 'Nikhil', 'Pranav', 'Priya', 'Rahul', 'Riya', 'Rohan', 'Sahithi', 'Sai', 'Sanjana', 'Shreya', 'Siddharth', 'Sneha', 'Srija', 'Tejas', 'Tanvi', 'Varun', 'Vedika', 'Vignesh', 'Yashas', 'Zara', 'Abhinav', 'Charvi', 'Pooja', 'Aishwarya', 'Kavya', 'Meghana', 'Hemanth', 'Surya', 'Vamsi', 'Yashwanth']
const LAST_NAMES = ['Reddy', 'Rao', 'Sharma', 'Verma', 'Patel', 'Naidu', 'Kumar', 'Sastry', 'Gupta', 'Choudhary', 'Iyer', 'Menon', 'Pillai', 'Nair', 'Kapoor', 'Joshi', 'Singh', 'Bhargav', 'Chowdary', 'Mehta', 'Goud', 'Kasaraneni']
const SKILLS_POOL = ['Python', 'Java', 'C++', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'TensorFlow', 'System Design', 'Microservices', 'GraphQL', 'REST APIs', 'Git', 'Linux', 'Spring Boot', 'Django', 'FastAPI', 'Tailwind']
const COMPANIES_DATA = [
  { name: 'Amazon', logo_color: '#FF9900', sector: 'Technology', industry: 'E-commerce / Cloud', type: 'Product', headcount: 1540000 },
  { name: 'Google', logo_color: '#4285F4', sector: 'Technology', industry: 'Internet / AI', type: 'Product', headcount: 182000 },
  { name: 'Microsoft', logo_color: '#00A4EF', sector: 'Technology', industry: 'Software / Cloud', type: 'Product', headcount: 221000 },
  { name: 'ServiceNow', logo_color: '#00C2A8', sector: 'Technology', industry: 'Enterprise SaaS', type: 'Product', headcount: 22000 },
  { name: 'Salesforce', logo_color: '#00A1E0', sector: 'Technology', industry: 'CRM SaaS', type: 'Product', headcount: 76000 },
  { name: 'Adobe', logo_color: '#FA0F00', sector: 'Technology', industry: 'Creative / Cloud', type: 'Product', headcount: 30000 },
  { name: 'Goldman Sachs', logo_color: '#7399C6', sector: 'Finance', industry: 'Investment Banking', type: 'Finance', headcount: 49000 },
  { name: 'JP Morgan Chase', logo_color: '#0F4C81', sector: 'Finance', industry: 'Banking', type: 'Finance', headcount: 313000 },
  { name: 'Deloitte', logo_color: '#86BC25', sector: 'Consulting', industry: 'Consulting', type: 'Services', headcount: 460000 },
  { name: 'Accenture', logo_color: '#A100FF', sector: 'Technology', industry: 'IT Services', type: 'Services', headcount: 743000 },
  { name: 'TCS', logo_color: '#1E2A78', sector: 'Technology', industry: 'IT Services', type: 'Services', headcount: 614000 },
  { name: 'Infosys', logo_color: '#007CC3', sector: 'Technology', industry: 'IT Services', type: 'Services', headcount: 343000 },
  { name: 'Cognizant', logo_color: '#1B3F77', sector: 'Technology', industry: 'IT Services', type: 'Services', headcount: 347000 },
  { name: 'Wipro', logo_color: '#341C53', sector: 'Technology', industry: 'IT Services', type: 'Services', headcount: 234000 },
  { name: 'Capgemini', logo_color: '#0070AD', sector: 'Technology', industry: 'IT Services', type: 'Services', headcount: 360000 },
  { name: 'ZS Associates', logo_color: '#00A0DF', sector: 'Consulting', industry: 'Pharma Analytics', type: 'Consulting', headcount: 14000 },
  { name: 'Walmart Global Tech', logo_color: '#0071CE', sector: 'Technology', industry: 'Retail Tech', type: 'Product', headcount: 25000 },
  { name: 'DE Shaw', logo_color: '#003366', sector: 'Finance', industry: 'Quantitative Finance', type: 'Finance', headcount: 2000 },
  { name: 'Intuit', logo_color: '#365EBF', sector: 'Technology', industry: 'FinTech SaaS', type: 'Product', headcount: 18000 },
  { name: 'Cisco', logo_color: '#1BA0D7', sector: 'Technology', industry: 'Networking', type: 'Product', headcount: 84000 },
  { name: 'Nvidia', logo_color: '#76B900', sector: 'Technology', industry: 'Semiconductors / AI', type: 'Product', headcount: 32000 },
  { name: 'Oracle', logo_color: '#F80000', sector: 'Technology', industry: 'Database / Cloud', type: 'Product', headcount: 159000 },
]

// ============================================================
// HELPERS
// ============================================================
let rng = 7
function seededRandom() {
  rng = (rng * 1664525 + 1013904223) & 0xffffffff
  return (rng >>> 0) / 0xffffffff
}

function rChoice<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)]
}

function rInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min
}

function rFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((seededRandom() * (max - min) + min).toFixed(decimals))
}

function rSample<T>(arr: T[], k: number): T[] {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < Math.min(k, copy.length); i++) {
    const idx = Math.floor(seededRandom() * (copy.length - i))
    result.push(copy[idx])
    copy[idx] = copy[copy.length - i - 1]
  }
  return result
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

// ============================================================
// MAIN SEED
// ============================================================
async function seed() {
  console.log('🌱 Starting CareerOS seed...')
  console.log('   URL:', SUPABASE_URL)
  console.log('   Reset:', RESET)

  if (RESET) {
    console.log('🗑️  Resetting all data...')
    const tables = [
      'audit_logs', 'notification_logs', 'notifications', 'messages', 'chat_rooms',
      'activity_events', 'communication_logs', 'payouts', 'revenue_share', 'seat_allocations',
      'fdp_attendance', 'fdp_sessions', 'faculty', 'mou_renewals', 'mous',
      'certificates', 'assessments', 'training_progress', 'enrollments', 'cohorts',
      'interview_reports', 'ats_reports', 'aptitude_scores', 'dsa_progress',
      'placement_records', 'year_summaries', 'placements', 'companies',
      'students', 'programs', 'departments', 'users', 'colleges',
      'workshop_requests', 'benchmark_snapshots', 'college_health_history', 'ai_insights', 'reports',
    ]
    for (const t of tables) {
      await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }
    console.log('✓ Reset complete')
  }

  // ── COMPANIES ──────────────────────────────────────────────
  console.log('📦 Seeding companies...')
  const companyMap: Record<string, string> = {}
  for (const c of COMPANIES_DATA) {
    const { data, error } = await supabase.from('companies').upsert({ ...c }, { onConflict: 'name' }).select('id, name').single()
    if (data) companyMap[data.name] = data.id
    if (error && !error.message.includes('duplicate')) console.warn('company:', error.message)
  }
  console.log(`  ✓ ${Object.keys(companyMap).length} companies`)

  // ── PROGRAMS ───────────────────────────────────────────────
  console.log('📦 Seeding programs...')
  const programMap: Record<string, string> = {}
  for (const p of PROGRAMS_DATA) {
    const { data } = await supabase.from('programs').upsert({ ...p }, { onConflict: 'code' }).select('id, code').single()
    if (data) programMap[data.code] = data.id
  }
  console.log(`  ✓ ${Object.keys(programMap).length} programs`)

  // ── COLLEGES ───────────────────────────────────────────────
  console.log('🏛️ Seeding colleges...')
  const collegeMap: Record<string, string> = {} // code → id
  for (const c of COLLEGES_DATA) {
    const { data, error } = await supabase.from('colleges').upsert({
      name: c.name, code: c.code, university: c.university, city: c.city, state: c.state,
      type: c.type, tagline: c.tagline, status: c.status, partnership_types: c.partnership_types,
      seats_purchased: c.seats_purchased, approved: c.status === 'approved', health_score: rInt(40, 92),
    }, { onConflict: 'code' }).select('id, code').single()
    if (data) collegeMap[data.code] = data.id
    if (error && !error.message.includes('duplicate')) console.warn('college:', error.message)
  }
  console.log(`  ✓ ${Object.keys(collegeMap).length} colleges`)

  // ── DEPARTMENTS ────────────────────────────────────────────
  console.log('🏫 Seeding departments...')
  const deptMap: Record<string, string> = {} // `${collegeId}_${deptName}` → id
  for (const c of COLLEGES_DATA) {
    const collegeId = collegeMap[c.code]
    if (!collegeId) continue
    const depts = (DEPARTMENTS_BY_TYPE[c.type] || ['General']).slice(0, 5)
    for (const dName of depts) {
      const { data } = await supabase.from('departments').insert({
        college_id: collegeId, name: dName, code: dName.substring(0, 8).toUpperCase(),
        hod_name: `${rChoice(FIRST_NAMES)} ${rChoice(LAST_NAMES)}`,
      }).select('id').single()
      if (data) deptMap[`${collegeId}_${dName}`] = data.id
    }
  }
  console.log(`  ✓ ${Object.keys(deptMap).length} departments`)

  // ── STUDENTS ───────────────────────────────────────────────
  console.log('👨‍🎓 Seeding students...')
  const studentsByCollege: Record<string, string[]> = {}
  let totalStudents = 0

  for (const c of COLLEGES_DATA) {
    if (c.status !== 'approved') continue
    const collegeId = collegeMap[c.code]
    if (!collegeId) continue
    const studentsPerCollege: Record<string, number> = {
      Engineering: 200, Management: 60, Pharmacy: 40, Medical: 30, Degree: 70, Diploma: 50
    }
    const count = studentsPerCollege[c.type] || 80
    const depts = (DEPARTMENTS_BY_TYPE[c.type] || ['General']).slice(0, 5)
    const stuIds: string[] = []

    const batch: any[] = []
    for (let i = 0; i < count; i++) {
      const dept = rChoice(depts)
      const deptId = deptMap[`${collegeId}_${dept}`]
      const fn = rChoice(FIRST_NAMES), ln = rChoice(LAST_NAMES)
      const yearAdmit = rChoice([2022, 2023, 2024])
      const cgpa = rFloat(6.4, 9.8)
      const placed = seededRandom() < (c.code === 'KMIT' ? 0.78 : 0.55)
      const id = uuidv4()
      stuIds.push(id)
      batch.push({
        id,
        college_id: collegeId,
        department_id: deptId || null,
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@${c.code.toLowerCase()}.edu`,
        phone: `+91 9${rInt(100000000, 999999999)}`,
        roll_no: `${yearAdmit % 100}${c.code.substring(0, 3)}${String(i).padStart(3, '0')}`,
        batch_year: yearAdmit,
        cgpa,
        gender: seededRandom() > 0.4 ? 'Male' : 'Female',
        skills: rSample(SKILLS_POOL, rInt(4, 9)),
        projects: rInt(2, 8),
        internships: rInt(0, 3),
        certifications: rInt(1, 6),
        placement_status: placed ? 'placed' : (seededRandom() < 0.2 ? 'in_process' : 'unplaced'),
        risk_level: cgpa < 7.0 ? 'high' : cgpa < 8.0 ? 'medium' : 'low',
        readiness_score: Math.min(100, Math.floor(cgpa * 9 + rInt(0, 25))),
        ats_score: rInt(45, 96),
      })
    }

    if (batch.length > 0) {
      const { error } = await supabase.from('students').insert(batch)
      if (error) console.warn('students batch:', error.message)
      studentsByCollege[collegeId] = stuIds
      totalStudents += batch.length
    }
  }
  console.log(`  ✓ ${totalStudents} students`)

  // ── PLACEMENT RECORDS (KMIT real data) ────────────────────
  console.log('📊 Seeding KMIT placement records...')
  const kmitId = collegeMap['KMIT']
  if (kmitId) {
    // Mark a few recent records as 'promtal' source to demo G7 integration
    const PROMTAL_COMPANIES = ['Microsoft', 'Google', 'Amazon', 'Infosys', 'TCS', 'Wipro']
    const prBatch = KMIT_PLACEMENT_RECORDS.map(r => ({
      college_id: kmitId, academic_year: r.year, company: r.company,
      selects: r.selects, ctc_lpa: r.ctc,
      source: (r.year >= '2024-25' && PROMTAL_COMPANIES.includes(r.company)) ? 'promtal' : 'direct',
    }))
    await supabase.from('placement_records').insert(prBatch)

    const ysBatch = Object.entries(YEAR_AGGREGATES).map(([yr, agg]) => ({
      college_id: kmitId, academic_year: yr, ...agg
    }))
    await supabase.from('year_summaries').insert(ysBatch)

    // Synthetic records for other colleges
    for (const [code, cId] of Object.entries(collegeMap)) {
      if (code === 'KMIT') continue
      const c = COLLEGES_DATA.find(x => x.code === code)
      if (!c || c.status !== 'approved') continue
      for (const yr of ['2024-25', '2025-26']) {
        const companies = rSample(COMPANIES_DATA.map(x => x.name), 7)
        for (const company of companies) {
          await supabase.from('placement_records').insert({
            college_id: cId, academic_year: yr, company, selects: rInt(2, 25), ctc_lpa: rFloat(4.0, 28.0),
            source: rFloat(0, 1) > 0.7 ? 'promtal' : 'direct',
          })
        }
        const base = YEAR_AGGREGATES[yr]
        await supabase.from('year_summaries').upsert({
          college_id: cId, academic_year: yr,
          companies: Math.floor(base.companies * rFloat(0.3, 0.7)),
          offers: Math.floor(base.offers * rFloat(0.3, 0.7)),
          avg_lpa: parseFloat((base.avg_lpa * rFloat(0.7, 1.0)).toFixed(2)),
          top_offer_lpa: parseFloat((base.top_offer_lpa * rFloat(0.4, 0.8)).toFixed(1)),
          top_company: rChoice(COMPANIES_DATA).name,
        }, { onConflict: 'college_id,academic_year' })
      }
    }
    console.log('  ✓ KMIT real data + synthetic records for other colleges')
  }

  // ── COHORTS ────────────────────────────────────────────────
  console.log('📚 Seeding cohorts...')
  const cohortMap: Record<string, string> = {} // `${collegeCode}_${progCode}` → id
  const approvedColleges = COLLEGES_DATA.filter(c => c.status === 'approved').slice(0, 12)
  for (const c of approvedColleges) {
    const cId = collegeMap[c.code]
    if (!cId) continue
    const eligibleProgs = PROGRAMS_DATA.filter(p =>
      p.stream === 'All' || p.stream === c.type ||
      (p.stream === 'Engineering' && c.type === 'Engineering')
    )
    for (const prog of eligibleProgs.slice(0, 3)) {
      const pId = programMap[prog.code]
      if (!pId) continue
      const { data } = await supabase.from('cohorts').insert({
        program_id: pId, college_id: cId,
        name: `${prog.name} — ${c.code} 2025-26`,
        batch_label: '2025-26 Cohort',
        start_date: new Date(daysAgo(120)).toISOString().split('T')[0],
        end_date: new Date(daysFromNow(prog.duration_weeks * 7)).toISOString().split('T')[0],
        status: 'active',
        enrolled_count: rInt(60, 200),
        completion_pct: rFloat(40, 92),
        instructor: `${rChoice(FIRST_NAMES)} ${rChoice(LAST_NAMES)}`,
      }).select('id').single()
      if (data) cohortMap[`${c.code}_${prog.code}`] = data.id
    }
  }
  console.log(`  ✓ ${Object.keys(cohortMap).length} cohorts`)

  // ── ENROLLMENTS ────────────────────────────────────────────
  console.log('📝 Seeding enrollments...')
  let totalEnrollments = 0
  for (const c of approvedColleges.slice(0, 8)) {
    const cId = collegeMap[c.code]
    const stuIds = studentsByCollege[cId] || []
    const subset = stuIds.slice(0, 200)
    const batch: any[] = []
    for (const sId of subset) {
      const progs = rSample(PROGRAMS_DATA, rInt(2, 3))
      for (const prog of progs) {
        const coId = cohortMap[`${c.code}_${prog.code}`] || null
        const mDone = rInt(0, prog.modules_count)
        const isCompleted = mDone === prog.modules_count
        const GRADES = ['A+', 'A', 'A', 'B+', 'B', 'B', 'C']
        batch.push({
          student_id: sId, cohort_id: coId, program_id: programMap[prog.code],
          college_id: cId,
          status: isCompleted ? 'completed' : mDone > 0 ? 'in_progress' : 'enrolled',
          progress_pct: parseFloat(((mDone / prog.modules_count) * 100).toFixed(1)),
          modules_completed: mDone, modules_total: prog.modules_count,
          grade: isCompleted ? rChoice(GRADES) : null,
          enrolled_at: daysAgo(rInt(20, 200)),
          completed_at: isCompleted ? daysAgo(rInt(1, 30)) : null,
        })
      }
    }
    if (batch.length > 0) {
      const { error } = await supabase.from('enrollments').insert(batch)
      if (error) console.warn('enrollments:', error.message?.substring(0, 100))
      totalEnrollments += batch.length
    }
  }
  console.log(`  ✓ ${totalEnrollments} enrollments`)

  // ── MOUs ───────────────────────────────────────────────────
  console.log('📄 Seeding MOUs...')
  for (const c of COLLEGES_DATA.filter(x => x.status === 'approved')) {
    const cId = collegeMap[c.code]
    if (!cId) continue
    // Most colleges: active MOU. KMIT: active + older renewed one. A few: expiring soon.
    const expiresInDays = rChoice([-30, 5, 12, 25, 90, 180, 365, 400])
    await supabase.from('mous').insert({
      college_id: cId,
      title: `Skill Tank × ${c.code} Partnership Agreement 2024-26`,
      partnership_type: c.partnership_types.join(' + '),
      start_date: new Date(daysAgo(510)).toISOString().split('T')[0],
      expiry_date: new Date(daysFromNow(expiresInDays)).toISOString().split('T')[0],
      status: expiresInDays < 0 ? 'expired' : expiresInDays < 30 ? 'expiring' : 'active',
      document_name: `Skill-Tank-${c.code}-MOU-2024.pdf`,
      document_size_kb: rInt(600, 1200),
      seats_purchased: c.seats_purchased,
      seats_used: Math.floor(c.seats_purchased * rFloat(0.6, 0.95)),
      revenue_share_pct: 18.0,
      accrued_share_inr: c.seats_purchased * rInt(5000, 12000),
      payout_notes: 'Quarterly · Next: Sep 30 2026',
      esign_status: 'signed',
    })
  }
  console.log('  ✓ MOUs seeded (several expiring within 30 days for demo)')

  // ── FACULTY + FDP ──────────────────────────────────────────
  console.log('👩‍🏫 Seeding faculty + FDP...')
  const facultyMap: Record<string, string[]> = {}
  for (const c of COLLEGES_DATA.filter(x => x.status === 'approved').slice(0, 8)) {
    const cId = collegeMap[c.code]
    if (!cId) continue
    const depts = (DEPARTMENTS_BY_TYPE[c.type] || ['General']).slice(0, 4)
    const facultyIds: string[] = []
    for (const dept of depts) {
      for (let i = 0; i < 5; i++) {
        const dId = deptMap[`${cId}_${dept}`]
        const { data } = await supabase.from('faculty').insert({
          college_id: cId, department_id: dId || null,
          name: `${rChoice(FIRST_NAMES)} ${rChoice(LAST_NAMES)}`,
          email: `faculty${i}@${c.code.toLowerCase()}.edu`,
          designation: rChoice(['Assistant Professor', 'Associate Professor', 'Professor', 'Head']),
        }).select('id').single()
        if (data) facultyIds.push(data.id)
      }
    }
    facultyMap[cId] = facultyIds

    // FDP sessions
    const fdpTopics = ['AI & ML for Educators', 'Industry 4.0 Curriculum Design', 'Research Methodology', 'Python for Data Science', 'Cloud Computing Essentials', 'Outcome-Based Education']
    for (let s = 0; s < 5; s++) {
      const daysOffset = rInt(-90, 60)
      const { data: session } = await supabase.from('fdp_sessions').insert({
        college_id: cId,
        title: `FDP: ${rChoice(fdpTopics)}`,
        speaker: `Dr. ${rChoice(FIRST_NAMES)} ${rChoice(LAST_NAMES)}`,
        topic: rChoice(fdpTopics),
        date: new Date(daysAgo(-daysOffset)).toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        mode: rChoice(['online', 'offline', 'hybrid']),
        capacity: rInt(30, 80),
        registered_count: rInt(15, 50),
        status: daysOffset < 0 ? 'completed' : daysOffset < 7 ? 'scheduled' : 'scheduled',
        venue: rChoice(['Main Auditorium', 'Seminar Hall A', 'Online via Zoom']),
      }).select('id').single()

      if (session && daysOffset < 0) {
        // Mark attendance for completed sessions
        for (const fId of facultyIds.slice(0, rInt(5, 15))) {
          await supabase.from('fdp_attendance').upsert({
            fdp_session_id: session.id, faculty_id: fId, college_id: cId,
            present: seededRandom() > 0.25,
          }, { onConflict: 'fdp_session_id,faculty_id' })
        }
      }
    }
  }
  console.log('  ✓ Faculty + FDP sessions seeded')

  // ── REVENUE SHARE ──────────────────────────────────────────
  console.log('💰 Seeding revenue share...')
  const quarters = ['2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4']
  for (const c of COLLEGES_DATA.filter(x => x.status === 'approved').slice(0, 15)) {
    const cId = collegeMap[c.code]
    if (!cId) continue
    for (const q of quarters) {
      const gross = c.seats_purchased * rInt(4000, 10000)
      const pct = 18
      await supabase.from('revenue_share').upsert({
        college_id: cId, period: q,
        gross_amount: gross, share_pct: pct, share_amount: gross * pct / 100,
        payout_status: q < '2025-Q4' ? 'paid' : 'pending',
      }, { onConflict: 'college_id,period' })
    }
    // Payouts
    await supabase.from('payouts').insert({
      college_id: cId, amount: c.seats_purchased * rInt(800, 2000),
      period: '2025-Q3', status: 'paid',
      approved_at: daysAgo(rInt(10, 60)),
    })
  }
  console.log('  ✓ Revenue share + payouts seeded')

  // ── COMMUNICATION LOGS ─────────────────────────────────────
  console.log('💬 Seeding communication logs...')
  const commTypes: Array<'note' | 'meeting' | 'call'> = ['note', 'meeting', 'call']
  const commSubjects = [
    'Q3 placement strategy review', 'FDP scheduling for next cohort', 'MOU renewal discussion',
    'New batch enrollment confirmation', 'Revenue payout query', 'Training completion review',
    'Placement drive coordination', 'Faculty development program feedback',
  ]
  for (const c of COLLEGES_DATA.filter(x => x.status === 'approved').slice(0, 12)) {
    const cId = collegeMap[c.code]
    if (!cId) continue
    for (let i = 0; i < 4; i++) {
      await supabase.from('communication_logs').insert({
        college_id: cId, type: rChoice(commTypes),
        subject: rChoice(commSubjects),
        body: `Follow-up on ${rChoice(commSubjects).toLowerCase()}. Key action items discussed and next steps confirmed.`,
        created_by_name: `${rChoice(FIRST_NAMES)} ${rChoice(LAST_NAMES)} (Skill Tank AM)`,
        created_at: daysAgo(rInt(1, 60)),
        next_meeting_at: seededRandom() > 0.6 ? daysFromNow(rInt(3, 14)) : null,
      })
    }
  }
  console.log('  ✓ Communication logs seeded')

  // ── AI INSIGHTS ────────────────────────────────────────────
  console.log('🤖 Seeding AI insights...')
  for (const [code, cId] of Object.entries(collegeMap)) {
    const c = COLLEGES_DATA.find(x => x.code === code)
    if (!c || c.status !== 'approved') continue
    const score = rInt(38, 95)
    await supabase.from('ai_insights').insert({
      scope_type: 'college', scope_id: cId, college_id: cId,
      type: 'health_score', score,
      label: score >= 75 ? 'Healthy' : score >= 50 ? 'Needs Attention' : 'At Risk',
      reasons: [
        { factor: 'Placement Rate', impact: rFloat(-15, 25), note: 'Based on recent placement outcomes' },
        { factor: 'Training Completion', impact: rFloat(-10, 20), note: 'Program completion metrics' },
        { factor: 'FDP Engagement', impact: rFloat(-5, 15), note: 'Faculty participation in FDPs' },
        { factor: 'MOU Activity', impact: rFloat(-5, 10), note: 'MOU status and renewal history' },
      ],
      model: 'rule_based',
    })

    // College health history (6 months)
    for (let m = 5; m >= 0; m--) {
      await supabase.from('college_health_history').insert({
        college_id: cId,
        score: Math.max(30, Math.min(100, score + rInt(-8, 8))),
        breakdown: { placement: rInt(20, 40), training: rInt(15, 30), fdp: rInt(10, 25), engagement: rInt(5, 15) },
        captured_at: daysAgo(m * 30),
      })
    }
  }
  console.log('  ✓ AI insights + health history seeded')

  // ── DSA PROGRESS (KMIT students only) ─────────────────────
  console.log('💻 Seeding DSA + aptitude (KMIT)...')
  const STRIVER_TOPICS = [
    { code: 'BASICS', name: 'Learn the basics', problems: 14 },
    { code: 'SORTING', name: 'Sorting techniques', problems: 7 },
    { code: 'ARRAYS', name: 'Arrays', problems: 40 },
    { code: 'BIN_SEARCH', name: 'Binary search', problems: 32 },
    { code: 'STR_BASIC', name: 'Strings — basic', problems: 7 },
    { code: 'LL', name: 'Linked list', problems: 31 },
    { code: 'RECURSION', name: 'Recursion', problems: 25 },
    { code: 'BIT_MANIP', name: 'Bit manipulation', problems: 18 },
    { code: 'STACK', name: 'Stacks & queues', problems: 30 },
    { code: 'SLIDING', name: 'Sliding window & 2-pointer', problems: 12 },
    { code: 'HEAP', name: 'Heaps', problems: 17 },
    { code: 'GREEDY', name: 'Greedy algorithms', problems: 16 },
    { code: 'TREE', name: 'Binary trees', problems: 39 },
    { code: 'BST', name: 'Binary search trees', problems: 16 },
    { code: 'GRAPH', name: 'Graphs', problems: 54 },
    { code: 'DP', name: 'Dynamic programming', problems: 56 },
    { code: 'TRIES', name: 'Tries', problems: 7 },
    { code: 'STR_ADV', name: 'Strings — advanced', problems: 9 },
    { code: 'MATHS', name: 'Maths', problems: 25 },
  ]
  const APTITUDE_SECTIONS = [
    { code: 'QUANT', name: 'Quantitative Aptitude' },
    { code: 'REASON', name: 'Logical Reasoning' },
    { code: 'VERBAL', name: 'Verbal Ability' },
    { code: 'DI', name: 'Data Interpretation' },
  ]

  if (kmitId) {
    const kmitStudents = studentsByCollege[kmitId] || []
    const dsaBatch: any[] = []
    const aptBatch: any[] = []
    for (const sId of kmitStudents.slice(0, 150)) {
      for (const t of STRIVER_TOPICS) {
        const solved = rInt(0, t.problems)
        dsaBatch.push({
          student_id: sId, college_id: kmitId,
          topic_code: t.code, topic_name: t.name, total: t.problems,
          solved, attempted: Math.min(t.problems, solved + rInt(0, 4)),
          last_solved_at: daysAgo(rInt(0, 30)),
        })
      }
      for (const sect of APTITUDE_SECTIONS) {
        aptBatch.push({
          student_id: sId, college_id: kmitId,
          section_code: sect.code, section_name: sect.name,
          score_pct: rInt(40, 95), accuracy_pct: rInt(45, 100),
          avg_time_sec: rInt(40, 120), tests_taken: rInt(2, 18),
          attempted_at: daysAgo(rInt(0, 90)),
        })
      }
    }
    if (dsaBatch.length > 0) {
      for (let i = 0; i < dsaBatch.length; i += 500) {
        await supabase.from('dsa_progress').insert(dsaBatch.slice(i, i + 500))
      }
    }
    if (aptBatch.length > 0) {
      for (let i = 0; i < aptBatch.length; i += 500) {
        await supabase.from('aptitude_scores').insert(aptBatch.slice(i, i + 500))
      }
    }
  }
  console.log('  ✓ DSA + aptitude seeded')

  // ── BENCHMARK SNAPSHOTS (for G1 benchmarking) ─────────────
  console.log('📈 Seeding benchmark snapshots...')
  const metrics = ['placement_rate', 'avg_package_lpa', 'training_completion_pct', 'fdp_sessions_per_year', 'ats_score_avg']
  for (const period of ['2025-Q1', '2025-Q2', '2025-Q3']) {
    for (const metric of metrics) {
      await supabase.from('benchmark_snapshots').insert({
        period, metric,
        avg_value: rFloat(42, 85),
        percentile_75: rFloat(60, 92),
      })
    }
  }
  console.log('  ✓ Benchmark snapshots seeded')

  // ── ACTIVITY EVENTS (sample timeline events) ──────────────
  console.log('📡 Seeding activity events...')
  const eventsBatch: any[] = []
  for (const [code, cId] of Object.entries(collegeMap).slice(0, 8)) {
    if (!cId) continue
    const events = [
      { entity_type: 'college', event_type: 'college.approved', title: `${code} approved and onboarded`, days: rInt(200, 400) },
      { entity_type: 'mou', event_type: 'mou.uploaded', title: `MOU signed with ${code}`, days: rInt(100, 200) },
      { entity_type: 'placement', event_type: 'placement.accepted', title: 'Student placed at TCS — ₹7 LPA', days: rInt(10, 90) },
      { entity_type: 'fdp', event_type: 'fdp.scheduled', title: 'FDP: AI & ML for Educators scheduled', days: rInt(1, 30) },
      { entity_type: 'report', event_type: 'report.generated', title: 'Q3 Placement Report generated', days: rInt(3, 15) },
    ] as const
    for (const e of events) {
      eventsBatch.push({
        college_id: cId, entity_type: e.entity_type, entity_id: uuidv4(),
        event_type: e.event_type, title: e.title, payload: {},
        created_at: daysAgo(e.days),
      })
    }
  }
  await supabase.from('activity_events').insert(eventsBatch)
  console.log('  ✓ Activity events seeded')

  console.log('\n✅ Seed complete!')
  console.log('─────────────────────────────────────────────')
  console.log('Demo credentials (password: careeros2026):')
  console.log('  super_admin      → Will be created via Supabase Auth signup')
  console.log('  tpo@kmit.edu     → TPO at KMIT (richest college for demo)')
  console.log('')
  console.log('⚠️  Create user accounts via Supabase Auth and run user-seed.ts')
  console.log('   to link auth.users → public.users with correct roles.')
  console.log('─────────────────────────────────────────────')
}

seed().catch(console.error)
