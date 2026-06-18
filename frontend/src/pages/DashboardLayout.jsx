import React from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, Building2, Users, Layers, BarChart3, GraduationCap, FileText, Shield, LogOut, ArrowUpRight } from "lucide-react";
import { useAuth } from "../App";
import { api } from "../lib/api";

const NAV = [
  { to: "/app/overview", label: "Overview", icon: LayoutDashboard, key: "overview" },
  { to: "/app/college", label: "College profile", icon: Building2, key: "college" },
  { to: "/app/roster", label: "Student roster", icon: Users, key: "roster" },
  { to: "/app/cohorts", label: "Programs · cohorts", icon: Layers, key: "cohorts" },
  { to: "/app/outcomes", label: "Placement outcomes", icon: BarChart3, key: "outcomes" },
  { to: "/app/training", label: "Training completion", icon: GraduationCap, key: "training" },
  { to: "/app/mou", label: "MOU · partnership", icon: FileText, key: "mou" },
];

export default function DashboardLayout() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-bone-100 text-ink-900 flex">
      {/* SIDEBAR */}
      <aside className="w-[280px] shrink-0 border-r border-line bg-bone-50 hidden lg:flex flex-col">
        <div className="p-7 border-b border-line">
          <Link to="/" className="flex items-center gap-3" data-testid="dash-brand">
            <div className="w-7 h-7 bg-ink-900 grid place-items-center"><div className="w-2 h-2 bg-accent" /></div>
            <div>
              <div className="font-display font-bold tracking-tight text-[15px]">CareerOS</div>
              <div className="num-mono text-[9px] tracking-[0.28em] text-ink-400">CAMPUS · INTELLIGENCE</div>
            </div>
          </Link>
        </div>

        <div className="px-7 pt-8 pb-3 num-mono text-[10px] tracking-[0.28em] text-ink-400">WORKSPACE</div>
        <nav className="px-3 space-y-px">
          {NAV.map(({ to, label, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`nav-${key}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-2 ${
                  isActive ? "border-accent bg-bone-100 text-ink-900 font-medium" : "border-transparent text-ink-500 hover:text-ink-900 hover:bg-bone-100"
                }`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {user?.role === "super_admin" && (
          <>
            <div className="px-7 pt-8 pb-3 num-mono text-[10px] tracking-[0.28em] text-ink-400">CONTROL</div>
            <nav className="px-3 space-y-px">
              <NavLink
                to="/app/admin"
                data-testid="nav-admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-2 ${
                    isActive ? "border-accent bg-bone-100 text-ink-900 font-medium" : "border-transparent text-ink-500 hover:text-ink-900 hover:bg-bone-100"
                  }`
                }
              >
                <Shield size={16} /> Super admin
              </NavLink>
            </nav>
          </>
        )}

        <div className="mt-auto p-5 border-t border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent text-bone-100 grid place-items-center font-display font-bold">
              {(user?.name || "?").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" data-testid="user-name">{user?.name}</div>
              <div className="num-mono text-[10px] tracking-[0.16em] text-ink-400 uppercase">{user?.role}</div>
            </div>
            <button onClick={logout} data-testid="logout-btn" title="Sign out" className="text-ink-400 hover:text-accent">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 min-w-0">
        {/* TOP BAR */}
        <header className="h-16 border-b border-line bg-bone-50 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-4 num-mono text-[11px] tracking-[0.2em] text-ink-400" data-testid="breadcrumb">
            <span>CAREEROS</span><span>·</span><span className="text-ink-900">DASHBOARD</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="pill" data-testid="env-badge">Live · Production data</span>
            <Link to="/" className="text-sm text-ink-500 ink-link hidden md:inline-flex items-center gap-1">View site <ArrowUpRight size={12} /></Link>
          </div>
        </header>

        <div className="p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
