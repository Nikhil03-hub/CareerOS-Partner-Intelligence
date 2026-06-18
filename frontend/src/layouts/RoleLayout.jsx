import React, { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, ArrowUpRight, Menu, X } from "lucide-react";
import { useAuth } from "../App";
import { api } from "../lib/api";

function SidebarBody({ label, role, accent, sections, user, onLogout, isMobile, onClose }) {
  return (
    <div className="h-full w-[280px] bg-bone-50 border-r border-line flex flex-col">
      <div className="p-6 border-b border-line flex items-start justify-between">
        <Link to="/" className="flex items-center gap-3" data-testid="dash-brand">
          <div className="w-7 h-7 bg-ink-900 grid place-items-center"><div className="w-2 h-2" style={{ background: accent }} /></div>
          <div>
            <div className="font-display font-bold tracking-tight text-[15px]">CareerOS</div>
            <div className="font-mono text-[9px] tracking-[0.28em] text-ink-400 uppercase">{label}</div>
          </div>
        </Link>
        {isMobile && (
          <button className="p-1" onClick={onClose} data-testid="drawer-close" aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {sections.map((s) => (
          <div key={s.title} className="mb-6">
            <div className="px-7 pb-2 font-mono text-[10px] tracking-[0.28em] text-ink-400">{s.title}</div>
            <nav className="px-3 space-y-px">
              {s.items.map(({ to, label: ll, icon: Icon, key }) => (
                <NavLink
                  key={to} to={to} end={key === "command" || key === "overview" || key === "home"}
                  data-testid={`nav-${key}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2 ${
                      isActive ? "border-l-[3px] bg-bone-100 text-ink-900 font-medium" : "border-transparent text-ink-500 hover:text-ink-900 hover:bg-bone-100"
                    }`
                  }
                  style={({ isActive }) => isActive ? { borderColor: accent } : {}}
                >
                  <Icon size={16} />
                  <span>{ll}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className="p-5 border-t border-line">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 grid place-items-center font-display font-bold text-bone-50" style={{ background: accent }}>
            {(user?.name || "?").charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" data-testid="user-name">{user?.name}</div>
            <div className="font-mono text-[10px] tracking-[0.16em] text-ink-400 uppercase">{role.replace("_", " ")}</div>
          </div>
          <button onClick={onLogout} data-testid="logout-btn" title="Sign out" className="text-ink-400 hover:text-accent transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoleLayout({ label, role, accent, sections }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
    navigate("/");
  };

  const shared = { label, role, accent, sections, user, onLogout: logout };

  return (
    <div className="min-h-screen bg-bone-100 text-ink-900 flex">
      <aside className="hidden lg:flex shrink-0">
        <SidebarBody {...shared} isMobile={false} />
      </aside>

      {open && (
        <>
          <div className="fixed inset-0 bg-ink-900/40 z-40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
          <aside className="fixed inset-y-0 left-0 z-50 lg:hidden shadow-2xl animate-[slidein_.25s_ease-out]" data-testid="mobile-drawer">
            <SidebarBody {...shared} isMobile={true} onClose={() => setOpen(false)} />
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 relative">
        <header className="h-12 border-b border-line bg-bone-50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 glass">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 -ml-1 hover:bg-bone-200 transition-colors" onClick={() => setOpen(true)} data-testid="mobile-menu-btn" aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div className="ticker text-ink-400 flex items-center gap-3" data-testid="topbar-ticker">
              <span>CAREEROS</span>
              <span className="w-1 h-1 bg-accent rounded-full" />
              <span className="text-ink-900">{label}</span>
              <span className="hidden md:inline text-ink-400">·</span>
              <span className="hidden md:inline">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="pill hidden md:inline-flex" data-testid="env-badge">Live · Production data</span>
            <Link to="/" className="text-sm text-ink-500 ink-link hidden md:inline-flex items-center gap-1">careeros.app <ArrowUpRight size={12} /></Link>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
