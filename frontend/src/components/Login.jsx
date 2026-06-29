import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Zap, ArrowRight, BookOpen, Headphones, Bike } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="app-shell flex flex-col font-body" data-testid="login-page">
      <div className="relative flex-1 flex flex-col justify-end overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"
          alt="campus"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-[#050505]" />

        <div className="relative z-10 p-6 pb-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 mb-5">
            <Zap className="w-4 h-4 text-volt" fill="#CCFF00" />
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-300">Campus Rent</span>
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tighter leading-[1.05]">
            Rent anything.<br />
            <span className="text-volt">Right on campus.</span>
          </h1>
          <p className="mt-4 text-zinc-300 text-sm leading-relaxed max-w-xs">
            Borrow textbooks, scooters, cameras and dorm gear from students nearby. Lend yours, earn cash.
          </p>

          <div className="flex gap-3 mt-6">
            {[{ i: BookOpen, t: "Textbooks" }, { i: Headphones, t: "Electronics" }, { i: Bike, t: "Mobility" }].map((c, idx) => (
              <div key={idx} className="glass rounded-2xl px-3 py-2 flex items-center gap-2">
                <c.i className="w-4 h-4 text-volt" />
                <span className="text-xs text-zinc-200">{c.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 p-6 pb-10">
        <button
          onClick={handleLogin}
          data-testid="google-login-button"
          className="w-full bg-volt text-black font-heading font-bold rounded-2xl py-4 px-6 glow flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          Continue with Google
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-center text-xs text-zinc-500 mt-4">
          By continuing you agree to our campus community guidelines.
        </p>
      </div>
    </div>
  );
}
