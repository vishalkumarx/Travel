import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import api from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import { toast } from "sonner";

export default function Contact() {
    const [form, setForm] = useState({ name: "", email: "", subject: "Trip enquiry", message: "" });
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/contact", form);
            toast.success("Thanks! We'll be in touch within 24 hours.");
            setForm({ name: "", email: "", subject: "Trip enquiry", message: "" });
        } catch { toast.error("Could not send. Please try again."); }
        finally { setLoading(false); }
    };

    return (
        <div className="pt-32 pb-24" data-testid="contact-page">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal>
                    <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium">Get in touch</div>
                    <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-5 max-w-3xl">Let's craft something <em className="font-light">unforgettable.</em></h1>
                    <p className="text-muted-foreground max-w-2xl text-lg mb-14">Our concierge replies within 24 hours, in your timezone, in your language.</p>
                </Reveal>

                <div className="grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-card border border-border rounded-[28px] p-8 lg:p-10">
                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Name</label>
                                    <input data-testid="contact-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full mt-2 px-5 py-4 rounded-2xl bg-muted/50 border border-border focus:outline-none focus:border-brand-deep" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
                                    <input data-testid="contact-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full mt-2 px-5 py-4 rounded-2xl bg-muted/50 border border-border focus:outline-none focus:border-brand-deep" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Subject</label>
                                <select data-testid="contact-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    className="w-full mt-2 px-5 py-4 rounded-2xl bg-muted/50 border border-border focus:outline-none">
                                    <option>Trip enquiry</option><option>Custom itinerary</option><option>Group booking</option><option>Partnership</option><option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">How can we help?</label>
                                <textarea data-testid="contact-message" required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    className="w-full mt-2 px-5 py-4 rounded-2xl bg-muted/50 border border-border focus:outline-none focus:border-brand-deep resize-none" />
                            </div>
                            <MagneticButton type="submit" data-testid="contact-submit"
                                className="bg-brand-deep text-white rounded-full px-8 py-4">
                                {loading ? "Sending..." : <><Send className="w-4 h-4" /> Send message</>}
                            </MagneticButton>
                        </form>
                    </div>

                    <div className="space-y-4">
                        <ContactCard Icon={MapPin} title="Visit us" lines={["27 Bond Street", "London W1S 2QQ", "United Kingdom"]} />
                        <ContactCard Icon={Phone} title="Call concierge" lines={["+44 20 7946 0500", "24/7 worldwide support"]} />
                        <ContactCard Icon={Mail} title="Email us" lines={["hello@luxevoyage.com", "press@luxevoyage.com"]} />
                        <a href="https://wa.me/442079460500" target="_blank" rel="noreferrer" data-testid="whatsapp-btn"
                            className="block p-5 rounded-3xl bg-emerald-500 text-white hover:bg-emerald-600 transition">
                            <MessageCircle className="w-6 h-6 mb-2" strokeWidth={1.5} />
                            <div className="font-display text-xl">WhatsApp us</div>
                            <div className="text-sm opacity-90">Instant replies, 9am-9pm GMT</div>
                        </a>
                    </div>
                </div>

                {/* Map */}
                <div className="mt-12 rounded-[28px] overflow-hidden border border-border h-[400px]">
                    <iframe title="map" src="https://maps.google.com/maps?q=Bond%20Street,%20London&t=&z=14&ie=UTF8&iwloc=&output=embed"
                        className="w-full h-full grayscale-[20%]" />
                </div>
            </div>
        </div>
    );
}

function ContactCard({ Icon, title, lines }) {
    return (
        <div className="p-5 rounded-3xl bg-card border border-border">
            <Icon className="w-6 h-6 text-brand-gold mb-2" strokeWidth={1.5} />
            <div className="font-display text-xl mb-1">{title}</div>
            {lines.map((l, i) => <div key={i} className="text-sm text-muted-foreground">{l}</div>)}
        </div>
    );
}
