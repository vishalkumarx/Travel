import { useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function Counter({ to, duration = 2000, prefix = "", suffix = "", className = "" }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-50px" });
    const [val, setVal] = useState(0);

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const startTime = performance.now();
        const step = (t) => {
            const p = Math.min((t - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.floor(eased * to));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [inView, to, duration]);

    return (
        <span ref={ref} className={className}>
            {prefix}{val.toLocaleString()}{suffix}
        </span>
    );
}
