import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Calendar, MapPin, Heart, Award, Gift, Plane, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Reveal } from "@/components/Reveal";
import { motion } from "framer-motion";

export default function Dashboard() {
    const { user, loading } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [tab, setTab] = useState("upcoming");

    useEffect(() => {
        if (!user) return;
        api.get("/bookings/me").then((r) => setBookings(r.data));
        api.get("/wishlist/me").then((r) => setWishlist(r.data));
    }, [user]);

    if (loading) return <div className="pt-32 text-center text-muted-foreground">Loading...</div>;
    if (!user) return <Navigate to="/login" state={{ from: "/dashboard" }} replace />;

    const today = new Date().toISOString().slice(0, 10);
    const upcoming = bookings.filter((b) => b.travel_date >= today);
    const past = bookings.filter((b) => b.travel_date < today);

    return (
        <div className="pt-32 pb-24" data-testid="dashboard-page">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
                        <div>
                            <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-2 font-medium">Your dashboard</div>
                            <h1 className="font-display text-4xl md:text-5xl">Welcome back, <em className="font-light">{user.name.split(" ")[0]}</em>.</h1>
                        </div>
                        <Link to="/packages" className="inline-flex items-center gap-2 bg-brand-deep text-white rounded-full px-6 py-3 font-medium hover:bg-brand-deep/90 transition">
                            <Plane className="w-4 h-4" /> Plan next trip
                        </Link>
                    </div>
                </Reveal>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard Icon={Plane} label="Upcoming trips" value={upcoming.length} />
                    <StatCard Icon={Calendar} label="Past journeys" value={past.length} />
                    <StatCard Icon={Heart} label="Wishlist" value={wishlist.length} />
                    <StatCard Icon={Award} label="Reward points" value={user.rewards_points || 0} highlight />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-border">
                    {[
                        { id: "upcoming", label: "Upcoming" },
                        { id: "past", label: "Past Trips" },
                        { id: "wishlist", label: "Wishlist" },
                        { id: "rewards", label: "Rewards" },
                    ].map((t) => (
                        <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => setTab(t.id)}
                            className={`px-5 py-3 text-sm font-medium relative ${tab === t.id ? "text-foreground" : "text-muted-foreground"}`}>
                            {t.label}
                            {tab === t.id && <motion.div layoutId="tab-line" className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-gold" />}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div>
                    {tab === "upcoming" && <BookingList items={upcoming} empty="No upcoming trips. Time to book one!" />}
                    {tab === "past" && <BookingList items={past} empty="Your past journeys will appear here." />}
                    {tab === "wishlist" && <WishlistList items={wishlist} />}
                    {tab === "rewards" && <Rewards points={user.rewards_points || 0} />}
                </div>
            </div>
        </div>
    );
}

function StatCard({ Icon, label, value, highlight }) {
    return (
        <div className={`p-6 rounded-3xl border ${highlight ? "bg-brand-gold/10 border-brand-gold/30" : "bg-card border-border"}`}>
            <Icon className={`w-5 h-5 mb-3 ${highlight ? "text-brand-gold" : "text-muted-foreground"}`} strokeWidth={1.5} />
            <div className="font-display text-3xl">{value}</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
        </div>
    );
}

function BookingList({ items, empty }) {
    if (items.length === 0) return <div className="text-center py-20 text-muted-foreground">{empty}</div>;
    return (
        <div className="space-y-4">
            {items.map((b) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="flex flex-col md:flex-row gap-5 p-5 bg-card border border-border rounded-[24px]">
                    <div className="w-full md:w-40 h-32 rounded-2xl overflow-hidden shrink-0">
                        <img src={b.package_image} alt={b.package_title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs uppercase tracking-widest text-brand-gold mb-1">Ref · {b.ref}</div>
                        <div className="font-display text-2xl mb-2">{b.package_title}</div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{b.travel_date}</span>
                            <span>{b.guests} guest{b.guests > 1 ? "s" : ""}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">● {b.status}</span>
                        </div>
                    </div>
                    <div className="text-right md:self-center">
                        <div className="font-display text-2xl">${b.total.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">paid</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function WishlistList({ items }) {
    if (items.length === 0) return <div className="text-center py-20 text-muted-foreground">Save trips to your wishlist by tapping the heart icon.</div>;
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => (
                <Link key={p.id} to={`/packages/${p.id}`}>
                    <div className="bg-card border border-border rounded-[24px] overflow-hidden">
                        <div className="aspect-[16/10] overflow-hidden"><img src={p.image} alt={p.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" /></div>
                        <div className="p-5">
                            <div className="font-display text-xl mb-1">{p.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{p.destination}</div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

function Rewards({ points }) {
    const tiers = [
        { name: "Explorer", min: 0, perk: "Welcome voucher" },
        { name: "Voyager", min: 500, perk: "Priority concierge" },
        { name: "Globetrotter", min: 1500, perk: "Free upgrades" },
        { name: "Legend", min: 5000, perk: "Private chauffeur" },
    ];
    const current = tiers.filter((t) => points >= t.min).pop() || tiers[0];
    const next = tiers.find((t) => points < t.min);

    return (
        <div className="space-y-6">
            <div className="p-8 rounded-[28px] bg-gradient-to-br from-brand-deep to-brand-midnight text-white">
                <div className="flex items-center gap-2 mb-3"><Award className="w-5 h-5 text-brand-gold" /><span className="text-xs uppercase tracking-widest text-brand-gold">{current.name} Tier</span></div>
                <div className="font-display text-5xl mb-2">{points.toLocaleString()} pts</div>
                {next && <div className="text-sm text-white/70">{(next.min - points).toLocaleString()} pts until {next.name} — {next.perk}</div>}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-card border border-border">
                    <Gift className="w-6 h-6 text-brand-gold mb-3" />
                    <div className="font-display text-xl mb-1">Refer a friend</div>
                    <div className="text-sm text-muted-foreground">Earn 500 pts when they book.</div>
                </div>
                <div className="p-6 rounded-3xl bg-card border border-border">
                    <Sparkles className="w-6 h-6 text-brand-gold mb-3" />
                    <div className="font-display text-xl mb-1">Book to earn</div>
                    <div className="text-sm text-muted-foreground">1 point per $1 spent on tours.</div>
                </div>
            </div>
        </div>
    );
}
