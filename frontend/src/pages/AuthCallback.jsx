import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const ran = React.useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      navigate("/login", { replace: true });
      return;
    }
    const sessionId = decodeURIComponent(match[1]);
    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id: sessionId });
        // Strip the fragment & route based on approval state
        window.history.replaceState({}, "", window.location.pathname);
        if (!data.user?.approved && data.user?.role !== "super_admin") {
          navigate("/pending", { replace: true, state: { user: data.user } });
        } else {
          navigate("/app/overview", { replace: true, state: { user: data.user } });
        }
      } catch (e) {
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bone-100">
      <div className="num-mono text-xs tracking-[0.3em] text-ink-400">AUTHENTICATING ·</div>
    </div>
  );
}
