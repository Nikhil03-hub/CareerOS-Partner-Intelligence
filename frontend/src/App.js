import React, { createContext, useContext, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { api } from "./lib/api";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import OnboardingPending from "./pages/OnboardingPending";

// Role layouts + homes
import RoleLayout from "./layouts/RoleLayout";
import { roleConfig } from "./layouts/roleConfig";

// Shared / module pages
import Overview from "./pages/Overview";
import Roster from "./pages/StudentRoster";
import Cohorts from "./pages/Cohorts";
import Outcomes from "./pages/Outcomes";
import Training from "./pages/Training";
import MOU from "./pages/MOU";
import CollegeProfile from "./pages/CollegeProfile";
import AdminPanel from "./pages/AdminPanel";
import DSAIntelligence from "./pages/DSAIntelligence";
import AptitudeIntelligence from "./pages/AptitudeIntelligence";
import ATSIntelligence from "./pages/ATSIntelligence";
import InterviewIntelligence from "./pages/InterviewIntelligence";
import Applications from "./pages/Applications";
import Jobs from "./pages/Jobs";
import Recruiters from "./pages/Recruiters";
import Announcements from "./pages/Announcements";
import PlatformControl from "./pages/PlatformControl";
import Reports from "./pages/Reports";
import InterviewSchedule from "./pages/InterviewSchedule";
import TeamInvites from "./pages/TeamInvites";
import RecruiterHome from "./pages/RecruiterHome";
import TalentPool from "./pages/TalentPool";
import StudentHome from "./pages/StudentHome";
import StudentDSA from "./pages/StudentDSA";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    try { const { data } = await api.get("/auth/me"); setUser(data); }
    catch { setUser(null); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (window.location.hash?.includes("session_id=")) { setLoading(false); return; }
    refresh();
    // eslint-disable-next-line
  }, []);
  return <AuthCtx.Provider value={{ user, setUser, loading, refresh }}>{children}</AuthCtx.Provider>;
}

const ROLE_HOME = {
  super_admin: "/platform",
  institution_admin: "/institution",
  tpo: "/tpo",
  faculty: "/faculty",
  student: "/student",
  recruiter: "/recruiter",
};

function Protected({ children, allow }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono text-xs tracking-[0.3em] text-ink-400">LOADING ·</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (!user.approved && user.role !== "super_admin") return <Navigate to="/pending" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.approved && user.role !== "super_admin") return <Navigate to="/pending" replace />;
  return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pending" element={<OnboardingPending />} />
      <Route path="/app" element={<RoleRedirect />} />

      {/* ===== PLATFORM (super admin) ===== */}
      <Route path="/platform" element={<Protected allow={["super_admin"]}><RoleLayout {...roleConfig.super_admin} /></Protected>}>
        <Route index element={<PlatformControl />} />
        <Route path="institutions" element={<AdminPanel />} />
        <Route path="recruiters" element={<Recruiters />} />
        <Route path="placements" element={<Outcomes />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>

      {/* ===== INSTITUTION ADMIN ===== */}
      <Route path="/institution" element={<Protected allow={["institution_admin", "super_admin"]}><RoleLayout {...roleConfig.institution_admin} /></Protected>}>
        <Route index element={<Overview />} />
        <Route path="profile" element={<CollegeProfile />} />
        <Route path="departments" element={<Roster />} />
        <Route path="programs" element={<Cohorts />} />
        <Route path="team" element={<TeamInvites />} />
        <Route path="mou" element={<MOU />} />
        <Route path="reports" element={<Reports />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>

      {/* ===== TPO ===== */}
      <Route path="/tpo" element={<Protected allow={["tpo", "super_admin"]}><RoleLayout {...roleConfig.tpo} /></Protected>}>
        <Route index element={<Overview />} />
        <Route path="roster" element={<Roster />} />
        <Route path="cohorts" element={<Cohorts />} />
        <Route path="outcomes" element={<Outcomes />} />
        <Route path="training" element={<Training />} />
        <Route path="dsa" element={<DSAIntelligence />} />
        <Route path="aptitude" element={<AptitudeIntelligence />} />
        <Route path="ats" element={<ATSIntelligence />} />
        <Route path="interviews" element={<InterviewIntelligence />} />
        <Route path="schedule" element={<InterviewSchedule />} />
        <Route path="applications" element={<Applications />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="recruiters" element={<Recruiters />} />
        <Route path="team" element={<TeamInvites />} />
        <Route path="reports" element={<Reports />} />
        <Route path="mou" element={<MOU />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>

      {/* ===== FACULTY ===== */}
      <Route path="/faculty" element={<Protected allow={["faculty", "super_admin"]}><RoleLayout {...roleConfig.faculty} /></Protected>}>
        <Route index element={<Overview />} />
        <Route path="roster" element={<Roster />} />
        <Route path="dsa" element={<DSAIntelligence />} />
        <Route path="aptitude" element={<AptitudeIntelligence />} />
        <Route path="training" element={<Training />} />
        <Route path="interviews" element={<InterviewIntelligence />} />
      </Route>

      {/* ===== STUDENT ===== */}
      <Route path="/student" element={<Protected allow={["student"]}><RoleLayout {...roleConfig.student} /></Protected>}>
        <Route index element={<StudentHome />} />
        <Route path="dsa" element={<StudentDSA />} />
        <Route path="applications" element={<Applications />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="schedule" element={<InterviewSchedule />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>

      {/* ===== RECRUITER ===== */}
      <Route path="/recruiter" element={<Protected allow={["recruiter", "super_admin"]}><RoleLayout {...roleConfig.recruiter} /></Protected>}>
        <Route index element={<RecruiterHome />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="talent" element={<TalentPool />} />
        <Route path="schedule" element={<InterviewSchedule />} />
        <Route path="applications" element={<Applications />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" theme="light" toastOptions={{ style: { borderRadius: 0, border: "1px solid rgba(10,10,10,0.18)", fontFamily: "Satoshi, system-ui" } }} />
      <AppRouter />
    </AuthProvider>
  );
}
