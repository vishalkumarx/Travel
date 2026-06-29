import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Home, PlusCircle, Inbox, MessageCircle, User, Loader2 } from "lucide-react";
import DepartmentPrompt from "@/components/DepartmentPrompt";

const NAV = [
  { to: "/", icon: Home, label: "Home", testid: "nav-home" },
  { to: "/requests", icon: Inbox, label: "Requests", testid: "nav-requests" },
  { to: "/post", icon: PlusCircle, label: "Post", testid: "nav-post", center: true },
  { to: "/messages", icon: MessageCircle, label: "Chats", testid: "nav-messages" },
  { to: "/profile", icon: User, label: "Profile", testid: "nav-profile" },
];

export default function MobileLayout({ children, hideNav = false }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-volt animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const isActive = (to) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <div className="app-shell font-body pb-24">
      <DepartmentPrompt />
      {children}
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-black/60 backdrop-blur-2xl border-t border-white/10 pt-2 pb-4 px-5 flex justify-between items-center z-50"
          data-testid="bottom-nav"
        >
          {NAV.map((n) => {
            const active = isActive(n.to);
            if (n.center) {
              return (
                <button
                  key={n.to}
                  onClick={() => navigate(n.to)}
                  data-testid={n.testid}
                  className="-mt-7 bg-volt text-black rounded-2xl w-14 h-14 flex items-center justify-center glow active:scale-90 transition-transform"
                >
                  <n.icon className="w-7 h-7" />
                </button>
              );
            }
            return (
              <button
                key={n.to}
                onClick={() => navigate(n.to)}
                data-testid={n.testid}
                className="flex flex-col items-center gap-1 px-2 py-1 transition-colors"
              >
                <n.icon className={`w-6 h-6 ${active ? "text-volt" : "text-zinc-500"}`} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] ${active ? "text-volt" : "text-zinc-500"}`}>{n.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
