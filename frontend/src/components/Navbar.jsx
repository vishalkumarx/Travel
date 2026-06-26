import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, Plane, User, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { MagneticButton } from "@/components/MagneticButton";

const NAV = [
    { to: "/", label: "Home" },
    { to: "/destinations", label: "Destinations" },
    { to: "/packages", label: "Tour Packages" },
    { to: "/ai-planner", label: "AI Planner" },
    { to: "/gallery", label: "Gallery" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
];

export default function Navbar() {
    const { theme, toggle } = useTheme();
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const [userMenu, setUserMenu] = useState(false);
    const loc = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => { setOpen(false); setUserMenu(false); }, [loc]);

    return (
        <header
            data-testid="navbar"
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
                scrolled ? "glass-nav shadow-[0_8px_30px_rgba(0,0,0,0.06)]" : "bg-transparent"
            }`}
        >
            <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16 h-20 flex items-center justify-between">
                <Link to="/" data-testid="logo-link" className="flex items-center gap-2 group">
                    <motion.div
                        whileHover={{ rotate: -15 }}
                        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-deep to-brand-gold flex items-center justify-center shadow-lg"
                    >
                        <Plane className="w-5 h-5 text-white" strokeWidth={1.75} />
                    </motion.div>
                    <div className="leading-tight">
                        <div className="font-display text-xl font-semibold tracking-tight">LuxeVoyage</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground -mt-0.5">Curated Journeys</div>
                    </div>
                </Link>

                <nav className="hidden lg:flex items-center gap-7">
                    {NAV.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            data-testid={`nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
                            className={({ isActive }) =>
                                `text-sm font-medium tracking-wide link-underline transition-colors ${
                                    isActive ? "text-brand-gold" : "text-foreground/80 hover:text-foreground"
                                }`
                            }
                        >
                            {n.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <button
                        data-testid="theme-toggle"
                        onClick={toggle}
                        className="p-2.5 rounded-full hover:bg-foreground/5 transition-colors"
                        aria-label="Toggle theme"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={theme}
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {theme === "dark" ? <Sun className="w-5 h-5" strokeWidth={1.5} /> : <Moon className="w-5 h-5" strokeWidth={1.5} />}
                            </motion.div>
                        </AnimatePresence>
                    </button>

                    {user ? (
                        <div className="relative hidden md:block">
                            <button
                                data-testid="user-menu-btn"
                                onClick={() => setUserMenu((v) => !v)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-foreground/5"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-deep to-brand-gold flex items-center justify-center text-white text-sm font-medium">
                                    {user.name?.[0]?.toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{user.name.split(" ")[0]}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <AnimatePresence>
                                {userMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl p-2 shadow-xl"
                                    >
                                        <Link to="/dashboard" data-testid="user-menu-dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-foreground/5 text-sm">
                                            <User className="w-4 h-4" /> My Dashboard
                                        </Link>
                                        <button onClick={logout} data-testid="user-menu-logout" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-foreground/5 text-sm text-left">
                                            <LogOut className="w-4 h-4" /> Sign out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link to="/login" data-testid="nav-login" className="hidden md:inline-block text-sm font-medium px-4 py-2 hover:text-brand-gold transition-colors">
                            Sign in
                        </Link>
                    )}

                    <MagneticButton
                        data-testid="nav-book-now"
                        onClick={() => (window.location.href = "/packages")}
                        className="hidden md:inline-flex bg-foreground text-background rounded-full px-5 py-2.5 text-sm shadow-lg"
                    >
                        Book Now
                    </MagneticButton>

                    <button
                        data-testid="mobile-menu-btn"
                        className="lg:hidden p-2.5 rounded-full hover:bg-foreground/5"
                        onClick={() => setOpen((v) => !v)}
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="lg:hidden overflow-hidden glass-nav border-t border-border"
                    >
                        <div className="px-6 py-6 flex flex-col gap-3">
                            {NAV.map((n) => (
                                <NavLink key={n.to} to={n.to} data-testid={`mobile-nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
                                    className="text-base font-medium py-2">{n.label}</NavLink>
                            ))}
                            {user ? (
                                <>
                                    <Link to="/dashboard" data-testid="mobile-nav-dashboard" className="text-base font-medium py-2">My Dashboard</Link>
                                    <button onClick={logout} data-testid="mobile-nav-logout" className="text-left text-base font-medium py-2">Sign out</button>
                                </>
                            ) : (
                                <Link to="/login" data-testid="mobile-nav-login" className="text-base font-medium py-2">Sign in</Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
