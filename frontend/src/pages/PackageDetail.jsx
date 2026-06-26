import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Star, Clock, MapPin, Check, X, ChevronDown, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function PackageDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { user } = useAuth();
    const [pkg, setPkg] = useState(null);
    const [activeImg, setActiveImg] = useState(0);
    const [openDay, setOpenDay] = useState(1);
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => { api.get(`/packages/${id}`).then((r) => setPkg(r.data)); }, [id]);

    if (!pkg) return <div className="pt-32 text-center text-muted-foreground">Loading...</div>;

    const finalPrice = pkg.price - (pkg.price * (pkg.discount || 0)) / 100;

    const handleWishlist = async () => {
        if (!user) { toast.error("Please sign in to save trips"); nav("/login"); return; }
        try { await api.post("/wishlist", { package_id: pkg.id }); toast.success("Saved to wishlist"); }
        catch { toast.error("Could not save"); }
    };

    const faqs = [
        { q: "What's included in the package?", a: pkg.included.join(", ") + "." },
        { q: "Can I customize this tour?", a: "Yes — every itinerary is fully customizable. Speak to your dedicated designer." },
        { q: "What is the cancellation policy?", a: "Free cancellation up to 30 days before departure. 50% refund within 30-7 days. After 7 days, non-refundable." },
        { q: "Are flights included?", a: "International flights are not included by default, but our team can book them at competitive rates." },
    ];

    return (
        <div className="pt-24" data-testid="package-detail">
            <section className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 py-8">
                <Link to="/packages" className="text-sm text-muted-foreground hover:text-foreground">← All tours</Link>
            </section>

            {/* Gallery */}
            <section className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 grid lg:grid-cols-4 gap-3 mb-12">
                <div className="lg:col-span-3 aspect-[16/10] overflow-hidden rounded-[28px] relative">
                    <AnimatePresence mode="wait">
                        <motion.img key={activeImg} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                            src={pkg.gallery[activeImg] || pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
                    </AnimatePresence>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                    {(pkg.gallery.length ? pkg.gallery : [pkg.image]).slice(0, 3).map((g, i) => (
                        <button key={i} data-testid={`gallery-thumb-${i}`} onClick={() => setActiveImg(i)}
                            className={`aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all ${activeImg === i ? "border-brand-gold" : "border-transparent opacity-70"}`}>
                            <img src={g} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </section>

            <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 grid lg:grid-cols-3 gap-12 pb-24">
                {/* Main */}
                <div className="lg:col-span-2 space-y-12">
                    <Reveal>
                        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" /> {pkg.destination}
                            <span>·</span><Clock className="w-4 h-4" />{pkg.duration}
                            <span>·</span><Star className="w-4 h-4 fill-brand-gold text-brand-gold" /> {pkg.rating} ({pkg.reviews} reviews)
                        </div>
                        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mb-6">{pkg.title}</h1>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {pkg.highlights.map((h, i) => (
                                <span key={i} className="px-4 py-2 rounded-full bg-muted text-sm">{h}</span>
                            ))}
                        </div>
                    </Reveal>

                    {/* Itinerary */}
                    <Reveal>
                        <h2 className="font-display text-3xl md:text-4xl mb-6">Day-by-day <em className="font-light">itinerary</em></h2>
                        <div className="space-y-3">
                            {pkg.itinerary.map((d) => (
                                <div key={d.day} data-testid={`itin-day-${d.day}`} className="border border-border rounded-2xl overflow-hidden bg-card">
                                    <button onClick={() => setOpenDay(openDay === d.day ? null : d.day)}
                                        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/40 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-brand-deep/10 text-brand-deep dark:bg-brand-gold/15 dark:text-brand-gold font-display text-xl flex items-center justify-center shrink-0">{d.day}</div>
                                            <div>
                                                <div className="text-xs uppercase tracking-widest text-muted-foreground">Day {d.day}</div>
                                                <div className="font-display text-xl">{d.title}</div>
                                            </div>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 transition-transform ${openDay === d.day ? "rotate-180" : ""}`} />
                                    </button>
                                    <AnimatePresence>
                                        {openDay === d.day && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="px-5 pb-5 pl-[5.25rem] text-muted-foreground leading-relaxed">{d.desc}</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </Reveal>

                    {/* Inclusions */}
                    <Reveal>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-3xl bg-card border border-border">
                                <h3 className="font-display text-xl mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-emerald-500" /> What's included</h3>
                                <ul className="space-y-2 text-sm">
                                    {pkg.included.map((i, idx) => <li key={idx} className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{i}</li>)}
                                </ul>
                            </div>
                            <div className="p-6 rounded-3xl bg-card border border-border">
                                <h3 className="font-display text-xl mb-4 flex items-center gap-2"><X className="w-5 h-5 text-rose-500" /> Not included</h3>
                                <ul className="space-y-2 text-sm">
                                    {pkg.excluded.map((i, idx) => <li key={idx} className="flex gap-2"><X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />{i}</li>)}
                                </ul>
                            </div>
                        </div>
                    </Reveal>

                    {/* FAQs */}
                    <Reveal>
                        <h2 className="font-display text-3xl md:text-4xl mb-6">Frequently asked</h2>
                        <div className="space-y-3">
                            {faqs.map((f, i) => (
                                <div key={i} className="border border-border rounded-2xl overflow-hidden bg-card">
                                    <button data-testid={`faq-${i}`} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex justify-between items-center p-5 text-left">
                                        <span className="font-medium">{f.q}</span>
                                        <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === i && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="px-5 pb-5 text-muted-foreground">{f.a}</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>

                {/* Sticky booking card */}
                <aside className="lg:sticky lg:top-28 h-fit">
                    <div className="bg-card border border-border rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                        <div className="flex items-baseline gap-2 mb-1">
                            {pkg.discount > 0 && <span className="text-sm line-through text-muted-foreground">${pkg.price.toLocaleString()}</span>}
                            {pkg.discount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold text-brand-midnight font-bold">-{pkg.discount}%</span>}
                        </div>
                        <div className="font-display text-4xl mb-1">${finalPrice.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mb-6">per person · all-inclusive</div>

                        <div className="space-y-3 mb-6 text-sm">
                            <Row label="Duration" value={pkg.duration} />
                            <Row label="Group size" value="2-8 travelers" />
                            <Row label="Availability" value={<span className="text-emerald-600 dark:text-emerald-400">● {pkg.availability}</span>} />
                            <Row label="Category" value={pkg.category} />
                        </div>

                        <Link to={`/booking/${pkg.id}`} data-testid="book-now-btn" className="block">
                            <MagneticButton className="w-full bg-brand-deep text-white rounded-full py-4 font-semibold">
                                Book Now
                            </MagneticButton>
                        </Link>
                        <button onClick={handleWishlist} data-testid="wishlist-btn" className="w-full mt-3 py-3 rounded-full border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition">
                            <Heart className="w-4 h-4" /> Save to wishlist
                        </button>
                        <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground text-center">
                            Free cancellation up to 30 days · No hidden fees
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}
