import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Plane, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { MagneticButton } from "@/components/MagneticButton";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AuthPage({ mode = "login" }) {
    const { login, signup } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "login") await login(form.email, form.password);
            else await signup(form.name, form.email, form.password);
            toast.success("Welcome aboard!");
            nav(loc.state?.from || "/dashboard");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Authentication failed");
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 flex items-center" data-testid={`${mode}-page`}>
            <div className="max-w-[1200px] w-full mx-auto px-6 grid lg:grid-cols-2 gap-10">
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                    className="hidden lg:block relative overflow-hidden rounded-[36px] aspect-[4/5]">
                    <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10 text-white">
                        <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3">Welcome to LuxeVoyage</div>
                        <div className="font-display text-4xl leading-tight">"Once a year, go someplace you've never been before."</div>
                        <div className="text-sm text-white/60 mt-4">— Dalai Lama</div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex flex-col justify-center">
                    <Link to="/" className="flex items-center gap-2 mb-10">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-deep to-brand-gold flex items-center justify-center">
                            <Plane className="w-5 h-5 text-white" />
                        </div>
                        <div className="font-display text-xl">LuxeVoyage</div>
                    </Link>
                    <h1 className="font-display text-4xl md:text-5xl mb-2">{mode === "login" ? "Welcome back" : "Begin your journey"}</h1>
                    <p className="text-muted-foreground mb-8">{mode === "login" ? "Sign in to manage your bookings and wishlist." : "Create an account to save trips and earn rewards."}</p>

                    <form onSubmit={submit} className="space-y-4">
                        {mode === "signup" && (
                            <Field icon={User} label="Full name">
                                <input data-testid="auth-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-transparent outline-none font-medium" />
                            </Field>
                        )}
                        <Field icon={Mail} label="Email">
                            <input data-testid="auth-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-transparent outline-none font-medium" />
                        </Field>
                        <Field icon={Lock} label="Password">
                            <input data-testid="auth-password" required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-transparent outline-none font-medium" />
                        </Field>
                        <MagneticButton type="submit" data-testid="auth-submit" className="w-full bg-brand-deep text-white rounded-full py-4 font-semibold">
                            {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
                        </MagneticButton>
                    </form>

                    <div className="text-sm text-muted-foreground text-center mt-6">
                        {mode === "login" ? (
                            <>New here? <Link to="/signup" data-testid="switch-signup" className="text-brand-gold font-medium">Create an account</Link></>
                        ) : (
                            <>Already a traveler? <Link to="/login" data-testid="switch-login" className="text-brand-gold font-medium">Sign in</Link></>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function Field({ icon: Icon, label, children }) {
    return (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-muted/50 border border-border focus-within:border-brand-deep transition-colors">
            <Icon className="w-4 h-4 text-brand-deep dark:text-brand-gold shrink-0" />
            <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                {children}
            </div>
        </div>
    );
}
