import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Cycles through an array of video URLs.
 * - Autoplays muted (inline) for mobile compatibility
 * - When the current clip ends, advances to the next; loops to first after the last
 * - Cross-fades between clips
 * - Shows poster image instantly while first clip buffers
 */
export default function VideoCarousel({ videos, poster, className = "" }) {
    const [index, setIndex] = useState(0);
    const videoRefs = useRef([]);

    // Preload next video for smoother cuts
    useEffect(() => {
        const next = (index + 1) % videos.length;
        const v = videoRefs.current[next];
        if (v) {
            try { v.load(); } catch (e) {}
        }
    }, [index, videos.length]);

    const handleEnded = () => {
        setIndex((i) => (i + 1) % videos.length);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Poster image always visible behind videos as ultimate fallback */}
            {poster && (
                <img
                    src={poster}
                    alt=""
                    loading="eager"
                    className="absolute inset-0 w-full h-full object-cover hero-bg"
                />
            )}

            <AnimatePresence>
                {videos.map((src, i) =>
                    i === index ? (
                        <motion.video
                            key={src}
                            ref={(el) => (videoRefs.current[i] = el)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                            autoPlay
                            muted
                            playsInline
                            preload="auto"
                            poster={poster}
                            onEnded={handleEnded}
                            className="absolute inset-0 w-full h-full object-cover"
                        >
                            <source src={src} type="video/mp4" />
                        </motion.video>
                    ) : null
                )}
            </AnimatePresence>
        </div>
    );
}
