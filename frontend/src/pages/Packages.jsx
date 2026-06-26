import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Clock, MapPin, ArrowRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";

const CATEGORIES = ["All", "Honeymoon", "Luxury", "Adventure", "Culture", "Family", "Solo"];

export default function Packages() {
    const [items, setItems] = useState([]);
    const [cat, setCat] = useState("All");
    const [q, setQ] = useState("");
    const [sort, setSort] = useState("featured");

    useEffect(() => { api.get("/packages").then((r) => setItems(r.data)); }, []);

    let list = cat === "All" ? items : items.filter((p) => p.category === cat);
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()) || p.destination.toLowerCase().includes(q.toLowerCase()));
    if (sort === "price-low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);

    return (
        <div className="pt-32 pb-24" data-testid="packages-page">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal>
                    <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium">Tour packages</div>
                    <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-5 max-w-3xl">Journeys <em className="font-light">designed</em><br />for you.</h1>
                    <p className="text-muted-foreground max-w-2xl text-lg mb-12">Every itinerary hand-curated and personally tested by our concierge.</p>
                </Reveal>

                <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-10">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input data-testid="pkg-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tours, destinations..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-full bg-card border border-border focus:outline-none focus:border-brand-deep dark:focus:border-brand-gold" />
                    </div>
                    <select data-testid="pkg-sort" value={sort} onChange={(e) => setSort(e.target.value)}
                        className="px-5 py-3.5 rounded-full bg-card border border-border focus:outline-none">
                        <option value="featured">Sort: Featured</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                    </select>
                </div>

                <div className="flex flex-wrap gap-2 mb-12">
                    {CATEGORIES.map((c) => (
                        <button key={c} data-testid={`pkgcat-${c.toLowerCase()}`} onClick={() => setCat(c)}
                            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                                cat === c ? "bg-foreground text-background shadow-lg" : "bg-card border border-border hover:border-foreground/50"
                            }`}>{c}</button>
                    ))}
                </div>

                <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {list.map((p) => (
                        <StaggerItem key={p.id}>
                            <motion.div whileHover={{ y: -6 }} className="group bg-card rounded-[28px] overflow-hidden border border-border shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(11,61,145,0.12)] transition-shadow">
                                <Link to={`/packages/${p.id}`} data-testid={`pkgs-card-${p.id}`}>
                                    <div className="relative aspect-[16/11] overflow-hidden">
                                        <img src={p.image} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1200ms]" />
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <span className="px-3 py-1 rounded-full glass-strong text-xs font-medium">{p.category}</span>
                                            {p.discount > 0 && <span className="px-3 py-1 rounded-full bg-brand-gold text-brand-midnight text-xs font-bold">-{p.discount}%</span>}
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2"><MapPin className="w-3 h-3" /> {p.destination}</div>
                                        <div className="font-display text-2xl mb-3 leading-tight">{p.title}</div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{p.duration}</span>
                                            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />{p.rating} ({p.reviews})</span>
                                        </div>
                                        <div className="flex items-end justify-between pt-4 border-t border-border">
                                            <div>
                                                <div className="text-xs text-muted-foreground">from</div>
                                                <div className="font-display text-2xl">${p.price.toLocaleString()}</div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-brand-gold group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </Stagger>
                {list.length === 0 && <div className="text-center py-20 text-muted-foreground">No tours match your filters.</div>}
            </div>
        </div>
    );
}
