import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const IMAGES = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
    "https://images.pexels.com/photos/161342/greece-santorini-architecture-island-161342.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520681504224-093d46124820?auto=format&fit=crop&w=1200&q=80",
    "https://images.pexels.com/photos/26946364/pexels-photo-26946364.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200",
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531168556467-80aace0d0144?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1604999333679-b86d54738315?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80",
];

const HEIGHTS = ["h-72", "h-96", "h-80", "h-64", "h-96", "h-72", "h-80", "h-96", "h-72", "h-80", "h-64", "h-96"];

export default function Gallery() {
    const [open, setOpen] = useState(null);

    return (
        <div className="pt-32 pb-24" data-testid="gallery-page">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                <Reveal>
                    <div className="text-xs uppercase tracking-[0.3em] text-brand-gold mb-3 font-medium">Visual diary</div>
                    <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-5 max-w-3xl">Moments, <em className="font-light">framed.</em></h1>
                    <p className="text-muted-foreground max-w-2xl text-lg mb-14">A glimpse of journeys we've designed and the memories our travelers brought home.</p>
                </Reveal>

                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                    {IMAGES.map((src, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.05 }}
                            className={`break-inside-avoid relative overflow-hidden rounded-2xl cursor-zoom-in group ${HEIGHTS[i]}`}
                            onClick={() => setOpen(src)} data-testid={`gallery-${i}`}>
                            <img src={src} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1200ms]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setOpen(null)}
                        className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6 cursor-zoom-out" data-testid="lightbox">
                        <button onClick={() => setOpen(null)} className="absolute top-6 right-6 w-12 h-12 rounded-full glass-strong flex items-center justify-center text-white"><X /></button>
                        <motion.img src={open} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
