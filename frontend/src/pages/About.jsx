import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { Counter } from "@/components/Counter";
import { motion } from "framer-motion";
import { Award, Globe2, Heart, Compass } from "lucide-react";

const TEAM = [
    { name: "Aria Halston", role: "Founder & Chief Curator", img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80" },
    { name: "Theodore Park", role: "Head of Experience", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
    { name: "Mira Okafor", role: "Director of Destinations", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80" },
    { name: "Felix Brennan", role: "Concierge Lead", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
];

const TIMELINE = [
    { year: "2008", t: "Founded in London", d: "Aria Halston started LuxeVoyage with a single Maldives itinerary." },
    { year: "2013", t: "100th journey", d: "Hit our first 100 hand-crafted itineraries milestone." },
    { year: "2018", t: "Condé Nast Top 50", d: "Recognized among the world's best travel specialists." },
    { year: "2022", t: "Global expansion", d: "Opened offices in Tokyo, Dubai, and New York." },
    { year: "2026", t: "AI Concierge launch", d: "Pioneering AI-assisted bespoke trip design." },
];

export default function About() {
    return (
        <div data-testid="about-page">
            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 -z-10 opacity-30" style={{ background: "radial-gradient(ellipse at top, rgba(11,61,145,0.3), transparent 60%)" }} />
                <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                    <Reveal>
                        <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium">Our story</div>
                        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mb-8 max-w-4xl leading-[0.95]">
                            Travel, the way it was <em className="font-light">meant to be.</em>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
                            Born in London in 2008, LuxeVoyage was founded on a simple belief: that travel should leave you transformed, not exhausted. We design journeys for the curious, the discerning, and the time-poor.
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 border-t border-border">
                <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { v: 28000, suf: "+", l: "Happy travelers" },
                        { v: 142, suf: "", l: "Destinations" },
                        { v: 17, suf: "", l: "Years curating" },
                        { v: 49, suf: "", l: "Awards won" },
                    ].map((s, i) => (
                        <StaggerItem key={i}>
                            <div className="font-display text-5xl md:text-6xl gradient-text mb-2">
                                <Counter to={s.v} suffix={s.suf} />
                            </div>
                            <div className="text-sm uppercase tracking-widest text-muted-foreground">{s.l}</div>
                        </StaggerItem>
                    ))}
                </Stagger>
            </section>

            {/* Values */}
            <section className="py-24 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal>
                    <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-12 max-w-2xl">What guides us.</h2>
                </Reveal>
                <Stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { Icon: Heart, t: "Hospitality", d: "Treat every traveler like a beloved guest." },
                        { Icon: Compass, t: "Curiosity", d: "Seek the road less mapped, the meal less photographed." },
                        { Icon: Globe2, t: "Stewardship", d: "Leave each destination better than we found it." },
                        { Icon: Award, t: "Craft", d: "Obsess over the smallest detail. Then sweat it again." },
                    ].map((v, i) => (
                        <StaggerItem key={i}>
                            <div className="p-7 rounded-3xl border border-border bg-card h-full">
                                <v.Icon className="w-7 h-7 text-brand-gold mb-5" strokeWidth={1.5} />
                                <div className="font-display text-2xl mb-2">{v.t}</div>
                                <div className="text-sm text-muted-foreground leading-relaxed">{v.d}</div>
                            </div>
                        </StaggerItem>
                    ))}
                </Stagger>
            </section>

            {/* Timeline */}
            <section className="py-24 bg-muted/40">
                <div className="max-w-[1100px] mx-auto px-6 md:px-12">
                    <Reveal>
                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-16 text-center">Our <em className="font-light">journey.</em></h2>
                    </Reveal>
                    <div className="relative">
                        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border" />
                        {TIMELINE.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
                                className={`relative mb-12 md:mb-16 md:flex ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                                <div className="md:w-1/2 pl-20 md:pl-0 md:px-12">
                                    <div className="bg-card border border-border rounded-3xl p-6">
                                        <div className="font-display text-3xl text-brand-gold mb-2">{t.year}</div>
                                        <div className="font-display text-xl mb-2">{t.t}</div>
                                        <div className="text-sm text-muted-foreground">{t.d}</div>
                                    </div>
                                </div>
                                <div className="absolute left-8 md:left-1/2 top-6 w-4 h-4 -translate-x-1/2 rounded-full bg-brand-gold ring-4 ring-background" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-24 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal>
                    <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-12">Meet the <em className="font-light">crew.</em></h2>
                </Reveal>
                <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {TEAM.map((m, i) => (
                        <StaggerItem key={i}>
                            <div className="group">
                                <div className="aspect-[4/5] rounded-3xl overflow-hidden mb-4">
                                    <img src={m.img} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                                <div className="font-display text-xl">{m.name}</div>
                                <div className="text-sm text-muted-foreground">{m.role}</div>
                            </div>
                        </StaggerItem>
                    ))}
                </Stagger>
            </section>
        </div>
    );
}
