import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, MapPin, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Reveal } from "@/components/Reveal";

export default function DestinationDetail() {
    const { id } = useParams();
    const [dest, setDest] = useState(null);
    const [pkgs, setPkgs] = useState([]);

    useEffect(() => {
        api.get(`/destinations/${id}`).then((r) => setDest(r.data));
        api.get(`/packages?destination_id=${id}`).then((r) => setPkgs(r.data));
    }, [id]);

    if (!dest) return <div className="pt-32 text-center text-muted-foreground">Loading...</div>;

    return (
        <div data-testid="destination-detail">
            <section className="relative h-[80vh] overflow-hidden">
                <motion.div initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.5 }} className="absolute inset-0">
                    <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-black/40" />
                </motion.div>
                <div className="relative max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 h-full flex items-end pb-20 text-white">
                    <div>
                        <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {dest.country} · {dest.region}
                        </div>
                        <h1 className="font-display text-6xl md:text-7xl lg:text-8xl mb-4">{dest.name}</h1>
                        <p className="text-xl text-white/80 max-w-2xl">{dest.tagline}</p>
                        <div className="flex flex-wrap gap-6 mt-8 text-sm">
                            <Stat label="Rating" value={<><Star className="w-4 h-4 fill-brand-gold text-brand-gold inline mr-1" />{dest.rating}/5</>} />
                            <Stat label="From" value={`$${dest.price_from}`} />
                            <Stat label="Weather" value={dest.weather} />
                            <Stat label="Best season" value={dest.best_season} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal>
                    <h2 className="font-display text-4xl md:text-5xl mb-3">Tours in {dest.name}</h2>
                    <p className="text-muted-foreground mb-12">Curated experiences crafted by our designers.</p>
                </Reveal>
                {pkgs.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        No tours yet — <Link to="/ai-planner" className="text-brand-gold underline">design a custom itinerary</Link>.
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pkgs.map((p) => (
                            <Link key={p.id} to={`/packages/${p.id}`} data-testid={`destpkg-${p.id}`}>
                                <motion.div whileHover={{ y: -8 }} className="bg-card rounded-[28px] overflow-hidden border border-border">
                                    <div className="aspect-[16/11] overflow-hidden">
                                        <img src={p.image} alt={p.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div className="p-6">
                                        <div className="font-display text-2xl mb-2">{p.title}</div>
                                        <div className="text-sm text-muted-foreground mb-4 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{p.duration}</div>
                                        <div className="flex items-end justify-between pt-4 border-t border-border">
                                            <div className="font-display text-2xl">${p.price.toLocaleString()}</div>
                                            <ArrowRight className="w-5 h-5 text-brand-gold" />
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="glass px-5 py-3 rounded-2xl">
            <div className="text-[10px] uppercase tracking-widest text-white/60">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}
