import { motion } from "framer-motion";
import { useRef, useState } from "react";

export function MagneticButton({ children, className = "", onClick, "data-testid": testId, type = "button" }) {
    const ref = useRef(null);
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const onMouseMove = (e) => {
        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
        setPos({ x, y });
    };

    const handleClick = (e) => {
        // ripple position
        const rect = ref.current.getBoundingClientRect();
        ref.current.style.setProperty("--rx", `${e.clientX - rect.left}px`);
        ref.current.style.setProperty("--ry", `${e.clientY - rect.top}px`);
        onClick && onClick(e);
    };

    return (
        <motion.button
            ref={ref}
            type={type}
            data-testid={testId}
            onMouseMove={onMouseMove}
            onMouseLeave={() => setPos({ x: 0, y: 0 })}
            onClick={handleClick}
            animate={{ x: pos.x, y: pos.y }}
            transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.3 }}
            className={`magnetic ripple inline-flex items-center justify-center gap-2 font-medium ${className}`}
        >
            {children}
        </motion.button>
    );
}
