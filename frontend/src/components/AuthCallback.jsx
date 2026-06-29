import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.replace("#", "")).get("session_id");

    const run = async () => {
      try {
        const res = await api.post("/auth/session", null, {
          headers: { "X-Session-ID": sessionId },
        });
        setUser(res.data);
        window.history.replaceState(null, "", "/");
        navigate("/", { replace: true, state: { user: res.data } });
      } catch (e) {
        navigate("/login", { replace: true });
      }
    };
    if (sessionId) run();
    else navigate("/login", { replace: true });
  }, [navigate, setUser]);

  return (
    <div className="app-shell flex flex-col items-center justify-center" data-testid="auth-callback">
      <Loader2 className="w-8 h-8 text-volt animate-spin" />
      <p className="mt-4 text-sm text-zinc-400 font-body">Signing you in…</p>
    </div>
  );
}
