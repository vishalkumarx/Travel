import { useState } from "react";
import { Link } from "react-router-dom";
import { Plane, Mail, Instagram, Twitter, Facebook, Youtube, MapPin, Phone } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function Footer() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const subscribe = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/newsletter", { email });
            toast.success("Welcome aboard! Check your inbox for a £100 voucher.");
            setEmail("");
        } catch {
            toast.error("Please enter a valid email.");
        } finally { setLoading(false); }
    };

    return (
        <footer className="relative mt-32 bg-brand-midnight text-slate-200 overflow-hidden">
            <div className="absolute inset-0 opacity-30 pointer-events-none"
                 style={{ background: "radial-gradient(ellipse at top, rgba(11,61,145,0.4), transparent 60%)" }} />
            <div className="relative max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 py-20">
                {/* Newsletter */}
                <div className="grid lg:grid-cols-2 gap-10 pb-12 border-b border-white/10">
                    <div>
                        <h3 className="font-display text-3xl md:text-4xl mb-3 text-white">Join the journey</h3>
                        <p className="text-slate-400 max-w-md">Get curated escapes, member-only fares, and travel inspiration. £100 voucher for new subscribers.</p>
                    </div>
                    <form onSubmit={subscribe} className="flex gap-2 items-start">
                        <div className="flex-1 relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="email"
                                required
                                data-testid="newsletter-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full pl-11 pr-4 py-4 rounded-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-gold transition-colors"
                            />
                        </div>
                        <button
                            data-testid="newsletter-submit"
                            disabled={loading}
                            className="px-7 py-4 rounded-full bg-brand-gold text-brand-midnight font-semibold hover:bg-brand-gold/90 transition disabled:opacity-50"
                        >
                            {loading ? "..." : "Subscribe"}
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-10 py-12">
                    <div className="col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-5">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-deep to-brand-gold flex items-center justify-center">
                                <Plane className="w-5 h-5 text-white" strokeWidth={1.75} />
                            </div>
                            <div className="font-display text-xl text-white">LuxeVoyage</div>
                        </Link>
                        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                            Crafting extraordinary journeys since 2008. Hand-picked stays, private guides, and unforgettable moments.
                        </p>
                        <div className="flex items-center gap-3 mt-6">
                            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-gold hover:text-brand-midnight hover:border-brand-gold transition-all">
                                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-widest text-brand-gold mb-4 font-semibold">Explore</div>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><Link to="/destinations" className="hover:text-white">Destinations</Link></li>
                            <li><Link to="/packages" className="hover:text-white">Tour Packages</Link></li>
                            <li><Link to="/ai-planner" className="hover:text-white">AI Trip Planner</Link></li>
                            <li><Link to="/gallery" className="hover:text-white">Gallery</Link></li>
                        </ul>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-widest text-brand-gold mb-4 font-semibold">Company</div>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                            <li><a href="#" className="hover:text-white">Careers</a></li>
                            <li><a href="#" className="hover:text-white">Press</a></li>
                        </ul>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-widest text-brand-gold mb-4 font-semibold">Contact</div>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /><span>27 Bond Street, London W1S 2QQ</span></li>
                            <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /><span>+44 20 7946 0500</span></li>
                            <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /><span>hello@luxevoyage.com</span></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-4 pt-8 border-t border-white/10 text-xs text-slate-500">
                    <div>© {new Date().getFullYear()} LuxeVoyage. All rights reserved.</div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white">Privacy</a>
                        <a href="#" className="hover:text-white">Terms</a>
                        <a href="#" className="hover:text-white">Refund Policy</a>
                        <a href="#" className="hover:text-white">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
