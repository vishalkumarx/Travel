import { useState } from "react";
import { Sparkles, MapPin, Wallet, Calendar, Compass, BedDouble, Coffee, Sun, Moon, Utensils, Lightbulb } from "lucide-react";
import api from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const INTERESTS = ["Food & Wine", "Adventure", "Culture", "Wellness", "Photography", "Beach", "History", "Nature"];

export default function AIPlanner() {
    const [form, setForm] = useState({
        destination: "Bali", days: 5, budget: "Premium", travel_type: "Honeymoon", interests: ["Food & Wine", "Beach"], hotel_category: "5-star"
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const toggleInterest = (i) => setForm({ ...form, interests: form.interests.includes(i) ? form.interests.filter((x) => x !== i) : [...form.interests, i] });

    const generate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        try {
            const { data } = await api.post("/ai/plan-trip", form);
            setResult(data.itinerary);
            setTimeout(() => document.getElementById("result-anchor")?.scrollIntoView({ behavior: "smooth" }), 200);
        } catch (err) {
            toast.error(err?.response?.data?.detail || "AI generation failed. Please try again.");
        } finally { setLoading(false); }
    };

    return (
        <div className="pt-32 pb-24" data-testid="ai-planner-page">
            <div className="max-w-[1100px] mx-auto px-6 md:px-12">
                <Reveal>
                    <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium flex items-center gap-2 justify-center">
                        <Sparkles className="w-3 h-3" /> AI Concierge · Powered by Claude
                    </div>
                    <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-center mb-5 leading-[1.05]">
                        Your dream trip, <em className="font-light">designed</em><br />in 30 seconds.
                    </h1>
                    <p className="text-muted-foreground text-center max-w-2xl mx-auto text-lg mb-14">Tell us where, when, and what you love — we'll handcraft a luxury day-by-day itinerary with insider tips.</p>
                </Reveal>

                <Reveal>
                    <form onSubmit={generate} className="bg-card border border-border rounded-[36px] p-8 lg:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
                        <div className="grid md:grid-cols-2 gap-5">
                            <Field icon={MapPin} label="Destination">
                                <input data-testid="ai-destination" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                    placeholder="e.g. Bali, Santorini" className="w-full bg-transparent outline-none font-medium" />
                            </Field>
                            <Field icon={Calendar} label="Days">
                                <input data-testid="ai-days" type="number" min={1} max={30} required value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
                                    className="w-full bg-transparent outline-none font-medium" />
                            </Field>
                            <Field icon={Wallet} label="Budget">
                                <select data-testid="ai-budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="w-full bg-transparent outline-none font-medium">
                                    <option>Comfort</option><option>Premium</option><option>Luxury</option><option>Ultra-Luxe</option>
                                </select>
                            </Field>
                            <Field icon={Compass} label="Travel type">
                                <select data-testid="ai-travel-type" value={form.travel_type} onChange={(e) => setForm({ ...form, travel_type: e.target.value })} className="w-full bg-transparent outline-none font-medium">
                                    <option>Honeymoon</option><option>Solo</option><option>Family</option><option>Friends</option><option>Adventure</option><option>Culture</option>
                                </select>
                            </Field>
                            <Field icon={BedDouble} label="Hotel category" full>
                                <select data-testid="ai-hotel" value={form.hotel_category} onChange={(e) => setForm({ ...form, hotel_category: e.target.value })} className="w-full bg-transparent outline-none font-medium">
                                    <option>3-star</option><option>4-star</option><option>5-star</option><option>Boutique</option><option>Resort</option>
                                </select>
                            </Field>
                        </div>

                        <div className="mt-6">
                            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">Interests</div>
                            <div className="flex flex-wrap gap-2">
                                {INTERESTS.map((i) => (
                                    <button key={i} type="button" data-testid={`interest-${i.toLowerCase().replace(/\s|&/g, "-")}`} onClick={() => toggleInterest(i)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                            form.interests.includes(i) ? "bg-brand-deep text-white" : "bg-muted hover:bg-muted/70"
                                        }`}>{i}</button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <MagneticButton type="submit" data-testid="ai-generate-btn"
                                onClick={() => {}}
                                className="bg-brand-gold text-brand-midnight rounded-full px-10 py-4 font-semibold shadow-xl">
                                {loading ? (<><span className="w-4 h-4 rounded-full border-2 border-brand-midnight border-t-transparent animate-spin" /> Crafting your journey...</>)
                                : (<><Sparkles className="w-4 h-4" /> Generate my itinerary</>)}
                            </MagneticButton>
                        </div>
                    </form>
                </Reveal>

                <div id="result-anchor" />

                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mt-12" data-testid="ai-result">
                            <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium">Your bespoke itinerary</div>
                            <h2 className="font-display text-4xl md:text-5xl mb-3">{result.destination}</h2>
                            <p className="text-lg text-muted-foreground italic mb-6">{result.summary}</p>

                            <div className="grid md:grid-cols-3 gap-4 mb-10">
                                <Stat label="Estimated cost" value={`$${(result.estimated_cost_usd || 0).toLocaleString()}`} />
                                <Stat label="Best time to visit" value={result.best_time_to_visit} />
                                <Stat label="Hotel" value={result.hotel_recommendation?.name} />
                            </div>

                            {result.hotel_recommendation?.why && (
                                <div className="p-6 rounded-3xl bg-brand-gold/10 border border-brand-gold/30 mb-10">
                                    <div className="font-display text-xl mb-2">Why this hotel?</div>
                                    <p className="text-muted-foreground">{result.hotel_recommendation.why}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {(result.days || []).map((d, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                        className="bg-card border border-border rounded-[24px] p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-brand-deep text-white font-display text-xl flex items-center justify-center">{d.day}</div>
                                            <div>
                                                <div className="text-xs uppercase tracking-widest text-muted-foreground">Day {d.day}</div>
                                                <div className="font-display text-2xl">{d.title}</div>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <TimeBlock icon={Coffee} time="Morning" text={d.morning} />
                                            <TimeBlock icon={Sun} time="Afternoon" text={d.afternoon} />
                                            <TimeBlock icon={Moon} time="Evening" text={d.evening} />
                                            <TimeBlock icon={Utensils} time="Dining" text={d.dining} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {result.packing_tips && (
                                <div className="mt-10 p-6 rounded-3xl bg-card border border-border">
                                    <div className="font-display text-2xl mb-4">Packing tips</div>
                                    <ul className="space-y-2">
                                        {result.packing_tips.map((t, i) => <li key={i} className="flex gap-2 text-sm"><span className="text-brand-gold">→</span>{t}</li>)}
                                    </ul>
                                </div>
                            )}
                            {result.insider_tip && (
                                <div className="mt-6 p-6 rounded-3xl bg-brand-midnight text-white">
                                    <div className="font-display text-xl mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-brand-gold" /> Insider tip</div>
                                    <p className="text-slate-300">{result.insider_tip}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function Field({ icon: Icon, label, children, full }) {
    return (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl bg-muted/50 border border-border ${full ? "md:col-span-2" : ""}`}>
            <Icon className="w-4 h-4 text-brand-deep dark:text-brand-gold shrink-0" />
            <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                {children}
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
            <div className="font-display text-xl">{value || "—"}</div>
        </div>
    );
}

function TimeBlock({ icon: Icon, time, text }) {
    return (
        <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-brand-gold" />
            </div>
            <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{time}</div>
                <div className="leading-relaxed">{text || "—"}</div>
            </div>
        </div>
    );
}
