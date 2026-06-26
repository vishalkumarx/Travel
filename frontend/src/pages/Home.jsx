import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    Search, MapPin, Calendar, Users, Wallet, Compass, Star, Clock, ArrowRight, Quote,
    ShieldCheck, Headphones, BadgeCheck, Globe2, PenTool, Lock, Sparkles, Plane, Award,
} from "lucide-react";
import api from "@/lib/api";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { Counter } from "@/components/Counter";
import { MagneticButton } from "@/components/MagneticButton";

const CATEGORIES = ["All", "Honeymoon", "Luxury", "Adventure", "Culture", "Family"];

export default function Home() {
    const [destinations, setDestinations] = useState([]);
    const [packages, setPackages] = useState([]);
    const [cat, setCat] = useState("All");
    const [search, setSearch] = useState({ destination: "", dates: "", guests: "2", budget: "Premium", style: "Luxury" });
    const heroRef = useRef(null);
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 800], [0, 180]);

    useEffect(() => {
        api.get("/destinations").then((r) => setDestinations(r.data));
        api.get("/packages").then((r) => setPackages(r.data));
    }, []);

    const filtered = cat === "All" ? packages : packages.filter((p) => p.category === cat);

    return (
        <>
            {/* HERO */}
            <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-brand-midnight" data-testid="hero-section">
                <motion.div style={{ y: heroY }} className="absolute inset-0">
                    {/* Poster image (visible instantly while video buffers) */}
                    <img
                        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80"
                        alt=""
                        loading="eager"
                        className="absolute inset-0 w-full h-full object-cover hero-bg"
                    />
                    {/* Autoplay video background */}
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        poster="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80"
                        className="absolute inset-0 w-full h-full object-cover"
                    >
                        <source
                            src="https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4"
                            type="video/mp4"
                        />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/80" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                </motion.div>

                <div className="relative max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 w-full text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
                        className="max-w-3xl"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-xs uppercase tracking-[0.25em]">
                            <span className="w-2 h-2 rounded-full bg-brand-gold pulse-dot" />
                            <span className="text-white/90">Curated since 2008 · 28k+ travelers</span>
                        </div>
                        <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] mb-6">
                            Discover<br />
                            <span className="italic font-light text-brand-gold">Extraordinary</span><br />
                            Journeys.
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 max-w-xl mb-10 leading-relaxed">
                            Explore breathtaking destinations around the world with handcrafted travel experiences designed for the discerning few.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/packages">
                                <MagneticButton data-testid="hero-explore-btn" className="bg-brand-gold text-brand-midnight rounded-full px-7 py-4 text-sm shadow-xl">
                                    Explore Tours <ArrowRight className="w-4 h-4" />
                                </MagneticButton>
                            </Link>
                            <Link to="/ai-planner">
                                <MagneticButton data-testid="hero-plan-btn" className="glass-strong text-foreground rounded-full px-7 py-4 text-sm">
                                    <Sparkles className="w-4 h-4" /> Plan My Trip
                                </MagneticButton>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Search Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                        className="mt-14 lg:mt-20"
                    >
                        <div data-testid="hero-search-widget" className="glass-strong rounded-3xl p-3 lg:p-4 grid grid-cols-2 lg:grid-cols-6 gap-2 lg:gap-1 shadow-2xl text-foreground">
                            <SearchField icon={MapPin} label="Destination" testId="search-destination">
                                <input value={search.destination} onChange={(e) => setSearch({ ...search, destination: e.target.value })}
                                    placeholder="Where to?" className="w-full bg-transparent outline-none text-sm font-medium placeholder:text-muted-foreground" />
                            </SearchField>
                            <SearchField icon={Calendar} label="Travel Dates" testId="search-dates">
                                <input type="date" value={search.dates} onChange={(e) => setSearch({ ...search, dates: e.target.value })}
                                    className="w-full bg-transparent outline-none text-sm font-medium" />
                            </SearchField>
                            <SearchField icon={Users} label="Guests" testId="search-guests">
                                <select value={search.guests} onChange={(e) => setSearch({ ...search, guests: e.target.value })}
                                    className="w-full bg-transparent outline-none text-sm font-medium">
                                    {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
                                </select>
                            </SearchField>
                            <SearchField icon={Wallet} label="Budget" testId="search-budget">
                                <select value={search.budget} onChange={(e) => setSearch({ ...search, budget: e.target.value })}
                                    className="w-full bg-transparent outline-none text-sm font-medium">
                                    <option>Comfort</option><option>Premium</option><option>Luxury</option><option>Ultra-Luxe</option>
                                </select>
                            </SearchField>
                            <SearchField icon={Compass} label="Travel Style" testId="search-style">
                                <select value={search.style} onChange={(e) => setSearch({ ...search, style: e.target.value })}
                                    className="w-full bg-transparent outline-none text-sm font-medium">
                                    <option>Luxury</option><option>Adventure</option><option>Honeymoon</option><option>Family</option><option>Solo</option>
                                </select>
                            </SearchField>
                            <Link to="/packages" data-testid="hero-search-submit"
                                className="col-span-2 lg:col-span-1 inline-flex items-center justify-center gap-2 bg-brand-deep text-white rounded-2xl px-6 py-4 font-medium hover:bg-brand-deep/90 transition shadow-lg">
                                <Search className="w-4 h-4" /> Search
                            </Link>
                        </div>
                    </motion.div>

                    {/* Stat strip */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-white/90"
                    >
                        {[
                            { v: 28000, suf: "+", label: "Happy travelers" },
                            { v: 142, suf: "", label: "Destinations" },
                            { v: 4.9, suf: "/5", label: "Avg. review", decimal: true },
                            { v: 17, suf: " yrs", label: "Curating journeys" },
                        ].map((s, i) => (
                            <div key={i} className="border-l border-white/20 pl-4">
                                <div className="font-display text-3xl md:text-4xl">
                                    {s.decimal ? "4.9" : <Counter to={s.v} suffix={s.suf} />}
                                    {s.decimal && s.suf}
                                </div>
                                <div className="text-xs uppercase tracking-widest text-white/60 mt-1">{s.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* TRUST LOGOS MARQUEE */}
            <section className="py-12 border-y border-border overflow-hidden">
                <div className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground mb-8">As featured in</div>
                <div className="flex overflow-hidden">
                    <div className="flex gap-16 animate-marquee whitespace-nowrap items-center font-display text-2xl text-muted-foreground/70">
                        {["Condé Nast Traveler", "Travel + Leisure", "Forbes", "The Times", "Vogue", "National Geographic", "Bloomberg", "Robb Report"].concat(["Condé Nast Traveler", "Travel + Leisure", "Forbes", "The Times", "Vogue", "National Geographic", "Bloomberg", "Robb Report"]).map((t, i) => (
                            <span key={i} className="italic">{t}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* POPULAR DESTINATIONS */}
            <section className="py-24 lg:py-32 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20" data-testid="destinations-section">
                <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
                    <div>
                        <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium">Wanderlust collection</div>
                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl max-w-2xl leading-[1.05]">
                            Popular <em className="font-light">destinations</em><br />for 2026.
                        </h2>
                    </div>
                    <Link to="/destinations" data-testid="view-all-destinations" className="text-sm font-medium link-underline">
                        View all destinations →
                    </Link>
                </Reveal>

                <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {destinations.slice(0, 8).map((d, i) => (
                        <StaggerItem key={d.id}>
                            <Link to={`/destinations/${d.id}`} data-testid={`dest-card-${d.id}`}>
                                <DestinationCard d={d} featured={i === 0} />
                            </Link>
                        </StaggerItem>
                    ))}
                </Stagger>
            </section>

            {/* FEATURED PACKAGES */}
            <section className="py-24 lg:py-32 bg-muted/40" data-testid="packages-section">
                <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                    <Reveal>
                        <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium">Hand-crafted</div>
                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-3 max-w-3xl">
                            Featured tour <em className="font-light">packages</em>.
                        </h2>
                        <p className="text-muted-foreground max-w-xl mb-10">Every itinerary is curated by our in-house travel designers and tested by our concierge team.</p>
                    </Reveal>

                    <div className="flex flex-wrap gap-2 mb-10">
                        {CATEGORIES.map((c) => (
                            <button
                                key={c}
                                data-testid={`category-${c.toLowerCase()}`}
                                onClick={() => setCat(c)}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                                    cat === c ? "bg-foreground text-background shadow-lg" : "bg-background text-foreground border border-border hover:border-foreground/50"
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.slice(0, 6).map((p) => (
                            <StaggerItem key={p.id}>
                                <PackageCard p={p} />
                            </StaggerItem>
                        ))}
                    </Stagger>
                </div>
            </section>

            {/* WHY CHOOSE US */}
            <section className="py-24 lg:py-32 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal className="text-center mb-16">
                    <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium">Why LuxeVoyage</div>
                    <h2 className="font-display text-4xl md:text-5xl lg:text-6xl">
                        The art of <em className="font-light">effortless</em> travel.
                    </h2>
                </Reveal>
                <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { Icon: ShieldCheck, t: "Best Price Guarantee", d: "Find it cheaper, we'll match it & give 5% off." },
                        { Icon: Headphones, t: "24/7 Concierge", d: "Real humans on call, anywhere in the world." },
                        { Icon: BadgeCheck, t: "Verified Hotels", d: "Personally inspected by our travel designers." },
                        { Icon: Globe2, t: "Local Experts", d: "On-the-ground partners in 142 destinations." },
                        { Icon: PenTool, t: "Custom Trips", d: "Bespoke itineraries built around you." },
                        { Icon: Lock, t: "Secure Payments", d: "256-bit encryption, flexible payment plans." },
                        { Icon: Award, t: "Award Winning", d: "Condé Nast Traveler Top 50 since 2019." },
                        { Icon: Sparkles, t: "Surprise Moments", d: "Hidden upgrades on every journey." },
                    ].map((f, i) => (
                        <StaggerItem key={i}>
                            <div className="group p-7 rounded-3xl border border-border bg-card hover:bg-foreground hover:text-background hover:-translate-y-2 transition-all duration-500 h-full">
                                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 group-hover:bg-brand-gold text-brand-gold group-hover:text-brand-midnight flex items-center justify-center mb-5 transition-colors">
                                    <f.Icon className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                                <div className="font-display text-xl mb-2">{f.t}</div>
                                <div className="text-sm opacity-70 leading-relaxed">{f.d}</div>
                            </div>
                        </StaggerItem>
                    ))}
                </Stagger>
            </section>

            {/* SPECIAL OFFER */}
            <section className="py-24 lg:py-32 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal>
                    <div className="relative overflow-hidden rounded-[36px] grid lg:grid-cols-2 items-center bg-brand-midnight text-white">
                        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at right, rgba(255,183,3,0.3), transparent 60%)" }} />
                        <div className="relative p-10 lg:p-16 z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-gold/15 text-brand-gold text-xs uppercase tracking-widest font-semibold mb-6">
                                <Sparkles className="w-3.5 h-3.5" /> Flash Offer
                            </div>
                            <h3 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-5">
                                Save up to <span className="text-brand-gold">35%</span><br />on summer escapes.
                            </h3>
                            <p className="text-slate-300 mb-8 max-w-md">Book by midnight Friday. Maldives, Santorini & Bali — overwater villas, cliffside suites, jungle retreats.</p>
                            <Countdown />
                            <Link to="/packages" className="inline-flex items-center gap-2 mt-8 bg-brand-gold text-brand-midnight px-7 py-4 rounded-full font-semibold hover:bg-brand-gold/90 transition" data-testid="special-offer-cta">
                                Claim my voucher <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="relative h-72 lg:h-full min-h-[400px] overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1400&q=80" alt="Luxury escape"
                                className="absolute inset-0 w-full h-full object-cover hover:scale-110 transition-transform duration-[1500ms]" />
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* TESTIMONIALS */}
            <Testimonials />

            {/* CTA */}
            <section className="py-24 lg:py-32 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal>
                    <div className="relative rounded-[36px] overflow-hidden text-center px-6 py-20 lg:py-28 noise"
                        style={{ background: "linear-gradient(135deg, #0B3D91 0%, #1e3a8a 50%, #0F172A 100%)" }}>
                        <div className="relative max-w-3xl mx-auto text-white">
                            <Plane className="w-10 h-10 text-brand-gold mx-auto mb-6" strokeWidth={1.25} />
                            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-5 leading-[1.05]">
                                Where shall we<br /><em className="font-light text-brand-gold">take you</em> next?
                            </h2>
                            <p className="text-white/70 mb-10 max-w-xl mx-auto">Our travel designers will craft a one-of-a-kind itinerary in 24 hours. Free, no obligation.</p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <Link to="/ai-planner" data-testid="cta-ai-planner"
                                    className="bg-brand-gold text-brand-midnight rounded-full px-8 py-4 font-semibold inline-flex items-center gap-2 hover:bg-brand-gold/90 transition">
                                    <Sparkles className="w-4 h-4" /> Try AI Trip Planner
                                </Link>
                                <Link to="/contact" data-testid="cta-quote"
                                    className="glass-strong text-white rounded-full px-8 py-4 font-medium inline-flex items-center gap-2 border border-white/20">
                                    Get a Quote
                                </Link>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </section>
        </>
    );
}

function SearchField({ icon: Icon, label, children, testId }) {
    return (
        <div data-testid={testId} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-foreground/5 transition-colors">
            <Icon className="w-4 h-4 text-brand-deep dark:text-brand-gold shrink-0" strokeWidth={1.75} />
            <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</div>
                {children}
            </div>
        </div>
    );
}

function DestinationCard({ d, featured }) {
    return (
        <motion.div
            whileHover={{ y: -8 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className={`group relative overflow-hidden rounded-[28px] cursor-pointer ${featured ? "sm:col-span-2 lg:col-span-2 lg:row-span-2 aspect-[3/4] lg:aspect-auto" : "aspect-[3/4]"}`}
        >
            <img src={d.image} alt={d.name} loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1200ms] ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute top-5 right-5 glass px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1">
                <Star className="w-3 h-3 fill-brand-gold text-brand-gold" /> {d.rating}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="text-xs uppercase tracking-widest text-brand-gold mb-1">{d.country}</div>
                <div className="font-display text-2xl md:text-3xl mb-2">{d.name}</div>
                <div className="text-sm text-white/70 mb-4 line-clamp-1">{d.tagline}</div>
                <div className="flex items-center justify-between text-sm">
                    <div className="text-white/60">From <span className="text-white font-semibold">${d.price_from}</span></div>
                    <div className="text-white/60">{d.best_season}</div>
                </div>
            </div>
        </motion.div>
    );
}

function PackageCard({ p }) {
    return (
        <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.4 }} className="group bg-card rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(11,61,145,0.12)] transition-shadow border border-border">
            <Link to={`/packages/${p.id}`} data-testid={`pkg-card-${p.id}`}>
                <div className="relative aspect-[16/11] overflow-hidden">
                    <img src={p.image} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1200ms]" />
                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 rounded-full glass-strong text-xs font-medium">{p.category}</span>
                        {p.discount > 0 && <span className="px-3 py-1 rounded-full bg-brand-gold text-brand-midnight text-xs font-bold">-{p.discount}%</span>}
                    </div>
                    <div className="absolute top-4 right-4 glass px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1">
                        <Star className="w-3 h-3 fill-brand-gold text-brand-gold" /> {p.rating}
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" /> {p.destination}
                    </div>
                    <div className="font-display text-2xl mb-3 leading-tight group-hover:text-brand-gold transition-colors">{p.title}</div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{p.duration}</span>
                        <span>{p.reviews} reviews</span>
                        <span className="text-emerald-600 dark:text-emerald-400">● {p.availability}</span>
                    </div>
                    <div className="flex items-end justify-between pt-4 border-t border-border">
                        <div>
                            <div className="text-xs text-muted-foreground">from</div>
                            <div className="font-display text-2xl">${p.price.toLocaleString()}<span className="text-sm text-muted-foreground font-sans">/pp</span></div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-deep dark:text-brand-gold">View details <ArrowRight className="w-4 h-4" /></span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

function Countdown() {
    const [time, setTime] = useState({ d: 2, h: 14, m: 23, s: 56 });
    useEffect(() => {
        const target = new Date(Date.now() + 2 * 86400000 + 14 * 3600000).getTime();
        const tick = () => {
            const diff = Math.max(0, target - Date.now());
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTime({ d, h, m, s });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex gap-3" data-testid="countdown">
            {[
                { v: time.d, l: "Days" }, { v: time.h, l: "Hours" }, { v: time.m, l: "Mins" }, { v: time.s, l: "Secs" }
            ].map((t, i) => (
                <div key={i} className="text-center">
                    <div className="w-16 h-16 rounded-2xl glass-strong text-foreground font-display text-2xl flex items-center justify-center">{String(t.v).padStart(2, "0")}</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/60 mt-2">{t.l}</div>
                </div>
            ))}
        </div>
    );
}

function Testimonials() {
    const items = [
        { name: "Sophia & James", trip: "Maldives · Honeymoon", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
          quote: "Every detail was anticipated before we even thought of it. The overwater villa, the candlelit dinner under the stars — pure magic." },
        { name: "Marcus Chen", trip: "Iceland · Solo", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
          quote: "I chased the aurora across glaciers and never once worried about logistics. LuxeVoyage handled it all with surgical precision." },
        { name: "Priya Mehra", trip: "Kyoto · Family", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
          quote: "Our children still talk about the cherry blossoms. A trip we'll treasure for the rest of our lives." },
    ];
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setIdx((i) => (i + 1) % items.length), 6000);
        return () => clearInterval(id);
    }, [items.length]);

    return (
        <section className="py-24 lg:py-32 bg-muted/40" data-testid="testimonials-section">
            <div className="max-w-[1100px] mx-auto px-6 md:px-12 lg:px-20 text-center">
                <Reveal>
                    <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium">Travelers' tales</div>
                    <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-16">Loved by <em className="font-light">wanderers.</em></h2>
                </Reveal>
                <div className="relative min-h-[280px]">
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <Quote className="w-10 h-10 text-brand-gold mx-auto mb-6" strokeWidth={1} />
                        <p className="font-display text-2xl md:text-3xl lg:text-4xl leading-snug mb-8 italic max-w-3xl mx-auto">
                            "{items[idx].quote}"
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <img src={items[idx].img} alt={items[idx].name} className="w-14 h-14 rounded-full object-cover" />
                            <div className="text-left">
                                <div className="font-semibold">{items[idx].name}</div>
                                <div className="text-sm text-muted-foreground">{items[idx].trip}</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="flex justify-center gap-2 mt-8">
                    {items.map((_, i) => (
                        <button key={i} data-testid={`testimonial-dot-${i}`} onClick={() => setIdx(i)}
                            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-brand-deep dark:bg-brand-gold" : "w-1.5 bg-muted-foreground/40"}`} />
                    ))}
                </div>
            </div>
        </section>
    );
}
