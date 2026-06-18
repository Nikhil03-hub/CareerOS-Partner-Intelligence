import { LayoutDashboard, Building2, Users, Layers, BarChart3, GraduationCap, FileText, Briefcase, Megaphone, Code2, Brain, FileSearch, MessageSquare, Send, Target, Network, FileBarChart, CalendarPlus, UserPlus, FileSpreadsheet } from "lucide-react";

const item = (to, label, icon, key) => ({ to, label, icon, key });

export const roleConfig = {
  super_admin: {
    label: "Platform Control",
    role: "super_admin",
    accent: "#0a0a0a",
    sections: [
      { title: "Platform", items: [
        item("/platform", "Command", LayoutDashboard, "command"),
        item("/platform/institutions", "Institutions", Building2, "institutions"),
        item("/platform/recruiters", "Recruiter network", Network, "recruiters"),
      ]},
      { title: "Intelligence", items: [
        item("/platform/placements", "Placement layer", BarChart3, "placements"),
        item("/platform/announcements", "Broadcasts", Megaphone, "announcements"),
      ]},
    ],
  },
  institution_admin: {
    label: "Institution Console",
    role: "institution_admin",
    accent: "#0a0a0a",
    sections: [
      { title: "Institution", items: [
        item("/institution", "Overview", LayoutDashboard, "overview"),
        item("/institution/profile", "Profile", Building2, "profile"),
        item("/institution/departments", "Departments", Users, "departments"),
        item("/institution/programs", "Training programs", Layers, "programs"),
      ]},
      { title: "Operations", items: [
        item("/institution/team", "Team & invites", UserPlus, "team"),
        item("/institution/mou", "MOU vault", FileText, "mou"),
        item("/institution/reports", "Reports · exports", FileBarChart, "reports"),
        item("/institution/announcements", "Announcements", Megaphone, "ann"),
      ]},
    ],
  },
  tpo: {
    label: "Placement Command",
    role: "tpo",
    accent: "#ff3b00",
    sections: [
      { title: "Command", items: [
        item("/tpo", "Mission control", LayoutDashboard, "overview"),
        item("/tpo/outcomes", "Placement outcomes", BarChart3, "outcomes"),
        item("/tpo/applications", "Application pipeline", Send, "applications"),
        item("/tpo/jobs", "Active drives", Briefcase, "jobs"),
        item("/tpo/schedule", "Interview schedule", CalendarPlus, "schedule"),
      ]},
      { title: "Talent", items: [
        item("/tpo/roster", "Student roster", Users, "roster"),
        item("/tpo/cohorts", "Cohorts", Layers, "cohorts"),
        item("/tpo/training", "Training", GraduationCap, "training"),
      ]},
      { title: "Intelligence", items: [
        item("/tpo/dsa", "DSA intelligence", Code2, "dsa"),
        item("/tpo/aptitude", "Aptitude", Brain, "aptitude"),
        item("/tpo/ats", "Resume ATS", FileSearch, "ats"),
        item("/tpo/interviews", "Interview AI", MessageSquare, "interviews"),
      ]},
      { title: "Partnerships", items: [
        item("/tpo/recruiters", "Recruiter network", Network, "rec"),
        item("/tpo/team", "Team & invites", UserPlus, "team"),
        item("/tpo/mou", "MOU · partnership", FileText, "mou"),
        item("/tpo/reports", "Reports · exports", FileBarChart, "reports"),
        item("/tpo/announcements", "Broadcasts", Megaphone, "ann"),
      ]},
    ],
  },
  faculty: {
    label: "Faculty Console",
    role: "faculty",
    accent: "#4a5d3a",
    sections: [
      { title: "Teaching", items: [
        item("/faculty", "My batches", LayoutDashboard, "overview"),
        item("/faculty/roster", "Students", Users, "roster"),
        item("/faculty/training", "Training completion", GraduationCap, "training"),
      ]},
      { title: "Analytics", items: [
        item("/faculty/dsa", "DSA analytics", Code2, "dsa"),
        item("/faculty/aptitude", "Aptitude analytics", Brain, "aptitude"),
        item("/faculty/interviews", "Interview reports", MessageSquare, "interviews"),
      ]},
    ],
  },
  student: {
    label: "Your Workspace",
    role: "student",
    accent: "#c1440e",
    sections: [
      { title: "Readiness", items: [
        item("/student", "Home", LayoutDashboard, "home"),
        item("/student/dsa", "DSA tracker", Code2, "dsa"),
      ]},
      { title: "Opportunities", items: [
        item("/student/jobs", "Open drives", Briefcase, "jobs"),
        item("/student/applications", "My applications", Send, "apps"),
        item("/student/schedule", "Interview slots", CalendarPlus, "schedule"),
        item("/student/announcements", "Announcements", Megaphone, "ann"),
      ]},
    ],
  },
  recruiter: {
    label: "Recruiter Console",
    role: "recruiter",
    accent: "#1a1a1a",
    sections: [
      { title: "Hiring", items: [
        item("/recruiter", "Overview", LayoutDashboard, "overview"),
        item("/recruiter/jobs", "Open roles", Briefcase, "jobs"),
        item("/recruiter/talent", "Talent pool", Target, "talent"),
        item("/recruiter/schedule", "Interview schedule", CalendarPlus, "schedule"),
        item("/recruiter/applications", "Pipeline", Send, "apps"),
      ]},
    ],
  },
};
