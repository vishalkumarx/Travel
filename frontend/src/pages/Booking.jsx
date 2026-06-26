import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, User, Mail, Phone, Calendar, Users, MessageSquare, CheckCircle2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { MagneticButton } from "@/components/MagneticButton";
import { toast } from "sonner";

const STEPS = ["Traveler", "Details", "Payment", "Confirmation"];

export default function Booking() {
    const { id } = useParams();
    const nav = useNavigate();
    const [pkg, setPkg] = useState(null);
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        traveler_name: "", email: "", phone: "", travel_date: "", guests: 2, special_requests: "",
        card_name: "", card_number: "", card_expiry: "", card_cvc: "", coupon: ""
    });
    const [confirmed, setConfirmed] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { api.get(`/packages/${id}`).then((r) => setPkg(r.data)); }, [id]);

    if (!pkg) return <div className="pt-32 text-center text-muted-foreground">Loading...</div>;

    const subtotal = pkg.price * form.guests;
    const discount = subtotal * (pkg.discount / 100);
    const couponDisc = form.coupon === "LUXE10" ? subtotal * 0.1 : 0;
    const total = subtotal - discount - couponDisc;

    const next = () => {
        if (step === 0) {
            if (!form.traveler_name || !form.email || !form.phone) { toast.error("Please fill all traveler info"); return; }
        }
        if (step === 1) {
            if (!form.travel_date) { toast.error("Please select a travel date"); return; }
        }
        if (step === 2) {
            return submit();
        }
        setStep(step + 1);
    };

    const submit = async () => {
        setLoading(true);
        try {
            const { data } = await api.post("/bookings", {
                package_id: pkg.id, traveler_name: form.traveler_name, email: form.email, phone: form.phone,
                travel_date: form.travel_date, guests: form.guests, special_requests: form.special_requests,
            });
            setConfirmed(data);
            setStep(3);
            toast.success("Booking confirmed!");
        } catch (e) { toast.error("Booking failed"); }
        finally { setLoading(false); }
    };

    return (
        <div className="pt-32 pb-24" data-testid="booking-page">
            <div className="max-w-[1100px] mx-auto px-6 md:px-12">
                {/* Stepper */}
                <div className="flex items-center justify-between mb-12 max-w-2xl mx-auto">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex-1 flex items-center" data-testid={`step-${i}`}>
                            <div className={`flex flex-col items-center ${i <= step ? "" : "opacity-40"}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                                    i < step ? "bg-emerald-500 text-white" : i === step ? "bg-brand-deep text-white" : "bg-muted"
                                }`}>{i < step ? <Check className="w-4 h-4" /> : i + 1}</div>
                                <div className="text-xs mt-2 font-medium">{s}</div>
                            </div>
                            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-emerald-500" : "bg-muted"}`} />}
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-card border border-border rounded-[28px] p-8">
                        <AnimatePresence mode="wait">
                            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                                {step === 0 && (
                                    <div>
                                        <h2 className="font-display text-3xl mb-6">Lead traveler</h2>
                                        <div className="space-y-4">
                                            <Input icon={User} label="Full name" testId="b-name" value={form.traveler_name} onChange={(v) => setForm({ ...form, traveler_name: v })} />
                                            <Input icon={Mail} label="Email" type="email" testId="b-email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                                            <Input icon={Phone} label="Phone" testId="b-phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                                        </div>
                                    </div>
                                )}
                                {step === 1 && (
                                    <div>
                                        <h2 className="font-display text-3xl mb-6">Trip details</h2>
                                        <div className="space-y-4">
                                            <Input icon={Calendar} type="date" label="Travel date" testId="b-date" value={form.travel_date} onChange={(v) => setForm({ ...form, travel_date: v })} />
                                            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-muted/50 border border-border">
                                                <Users className="w-4 h-4 text-brand-deep dark:text-brand-gold shrink-0" />
                                                <div className="flex-1">
                                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Guests</div>
                                                    <select data-testid="b-guests" value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                                                        className="w-full bg-transparent outline-none font-medium">{[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}</select>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 px-5 py-4 rounded-2xl bg-muted/50 border border-border">
                                                <MessageSquare className="w-4 h-4 text-brand-deep dark:text-brand-gold shrink-0 mt-1" />
                                                <div className="flex-1">
                                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Special requests</div>
                                                    <textarea data-testid="b-requests" rows={3} value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                                                        placeholder="Anniversary, dietary needs, accessibility…" className="w-full bg-transparent outline-none resize-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {step === 2 && (
                                    <div>
                                        <h2 className="font-display text-3xl mb-2">Payment</h2>
                                        <p className="text-sm text-muted-foreground mb-6">Demo mode — no real charge. Try coupon <code className="px-1.5 py-0.5 rounded bg-muted">LUXE10</code> for 10% off.</p>
                                        <div className="space-y-4">
                                            <Input label="Cardholder name" testId="b-cardname" value={form.card_name} onChange={(v) => setForm({ ...form, card_name: v })} />
                                            <Input label="Card number" testId="b-cardnumber" value={form.card_number} onChange={(v) => setForm({ ...form, card_number: v })} placeholder="4242 4242 4242 4242" />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input label="Expiry" testId="b-expiry" value={form.card_expiry} onChange={(v) => setForm({ ...form, card_expiry: v })} placeholder="MM/YY" />
                                                <Input label="CVC" testId="b-cvc" value={form.card_cvc} onChange={(v) => setForm({ ...form, card_cvc: v })} placeholder="123" />
                                            </div>
                                            <Input label="Coupon code (optional)" testId="b-coupon" value={form.coupon} onChange={(v) => setForm({ ...form, coupon: v.toUpperCase() })} />
                                        </div>
                                    </div>
                                )}
                                {step === 3 && confirmed && (
                                    <div className="text-center py-8" data-testid="booking-confirmed">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                                            className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
                                        </motion.div>
                                        <h2 className="font-display text-4xl mb-3">Bon voyage!</h2>
                                        <p className="text-muted-foreground mb-2">Your journey is confirmed.</p>
                                        <p className="text-sm text-muted-foreground mb-8">Booking ref: <strong className="text-foreground">{confirmed.ref}</strong></p>
                                        <div className="flex flex-wrap gap-3 justify-center">
                                            <button onClick={() => window.print()} data-testid="download-invoice" className="px-6 py-3 rounded-full border border-border flex items-center gap-2 hover:bg-muted">
                                                <Download className="w-4 h-4" /> Download invoice
                                            </button>
                                            <button onClick={() => nav("/dashboard")} data-testid="go-to-dashboard" className="px-6 py-3 rounded-full bg-brand-deep text-white">
                                                View my trips
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {step < 3 && (
                            <div className="flex justify-between mt-8">
                                <button data-testid="step-back" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                                    className="px-5 py-3 rounded-full text-sm font-medium disabled:opacity-40 hover:bg-muted">← Back</button>
                                <MagneticButton data-testid="step-next" onClick={next}
                                    className="bg-brand-deep text-white rounded-full px-7 py-3 text-sm">
                                    {loading ? "Processing..." : step === 2 ? "Confirm & Pay" : "Continue →"}
                                </MagneticButton>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <aside className="bg-card border border-border rounded-[28px] p-6 h-fit lg:sticky lg:top-28">
                        <div className="aspect-[16/10] rounded-2xl overflow-hidden mb-4">
                            <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="font-display text-xl mb-1">{pkg.title}</div>
                        <div className="text-sm text-muted-foreground mb-4">{pkg.destination} · {pkg.duration}</div>
                        <div className="space-y-2 text-sm border-t border-border pt-4">
                            <Row label={`$${pkg.price} × ${form.guests}`} value={`$${subtotal.toLocaleString()}`} />
                            {pkg.discount > 0 && <Row label={`Discount (${pkg.discount}%)`} value={`-$${discount.toLocaleString()}`} cls="text-emerald-600" />}
                            {couponDisc > 0 && <Row label="LUXE10 coupon" value={`-$${couponDisc.toLocaleString()}`} cls="text-emerald-600" />}
                        </div>
                        <div className="flex justify-between pt-4 mt-4 border-t border-border">
                            <span className="font-medium">Total</span>
                            <span className="font-display text-2xl">${total.toLocaleString()}</span>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function Input({ icon: Icon, label, value, onChange, type = "text", testId, placeholder }) {
    return (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-muted/50 border border-border">
            {Icon && <Icon className="w-4 h-4 text-brand-deep dark:text-brand-gold shrink-0" />}
            <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                <input data-testid={testId} type={type} value={value} onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder} className="w-full bg-transparent outline-none font-medium" />
            </div>
        </div>
    );
}

function Row({ label, value, cls = "" }) {
    return (
        <div className={`flex justify-between ${cls}`}>
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}
