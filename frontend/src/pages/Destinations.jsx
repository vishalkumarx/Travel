import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Search } from "lucide-react";
import api from "@/lib/api";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { motion } from "framer-motion";

const REGIONS = ["All", "Asia", "Europe", "Middle East", "Americas", "Africa", "Oceania"];

export default function Destinations() {
    const [items, setItems] = useState([]);
    const [region, setRegion] = useState("All");
    const [q, setQ] = useState("");

    useEffect(() => { api.get("/destinations").then((r) => setItems(r.data)); }, []);

    const filtered = items.filter((d) =>
        (region === "All" || d.region === region) &&
        (!q || d.name.toLowerCase().includes(q.toLowerCase()) || d.country.toLowerCase().includes(q.toLowerCase()))
    );

    return (
        <div className="pt-32 pb-24" data-testid="destinations-page">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal>
                    <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium">142 destinations · 7 continents</div>
                    <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-5 max-w-3xl">
                        The world, <em className="font-light">curated.</em>
                    </h1>
                    <p className="text-muted-foreground max-w-2xl text-lg mb-12">From sunlit Mediterranean cliffs to lantern-lit Japanese gardens — every destination personally inspected by our travel designers.</p>
                </Reveal>

                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-10">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input data-testid="destinations-search" value={q} onChange={(e) => setQ(e.target.value)}
                            placeholder="Search countries, cities..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-full bg-card border border-border focus:outline-none focus:border-brand-deep dark:focus:border-brand-gold transition-colors" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {REGIONS.map((r) => (
                            <button key={r} data-testid={`region-${r.toLowerCase().replace(" ", "-")}`} onClick={() => setRegion(r)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    region === r ? "bg-foreground text-background" : "bg-card border border-border hover:border-foreground/50"
                                }`}>{r}</button>
                        ))}
                    </div>
                </div>

                <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((d) => (
                        <StaggerItem key={d.id}>
                            <Link to={`/destinations/${d.id}`} data-testid={`destpage-card-${d.id}`}>
                                <motion.div whileHover={{ y: -8 }} className="group relative overflow-hidden rounded-[28px] aspect-[4/5] cursor-pointer">
                                    <img src={d.image} alt={d.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1200ms]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                    <div className="absolute top-5 right-5 glass px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-brand-gold text-brand-gold" /> {d.rating}
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                                        <div className="text-xs uppercase tracking-widest text-brand-gold mb-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {d.country}
                                        </div>
                                        <div className="font-display text-3xl mb-2">{d.name}</div>
                                        <div className="text-sm text-white/70 mb-4">{d.tagline}</div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span>From <strong>${d.price_from}</strong></span>
                                            <span className="text-white/60">{d.weather}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        </StaggerItem>
                    ))}
                </Stagger>

                {filtered.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">No destinations found. Try a different filter.</div>
                )}
            </div>
        </div>
    );
}
