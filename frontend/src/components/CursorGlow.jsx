import { useEffect, useState } from "react";

// Custom cursor glow that follows mouse
export default function CursorGlow() {
    const [pos, setPos] = useState({ x: -400, y: -400 });

    useEffect(() => {
        const move = (e) => setPos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    return (
        <div
            className="mouse-glow hidden md:block"
            style={{ transform: `translate(${pos.x - 300}px, ${pos.y - 300}px)` }}
            aria-hidden="true"
        />
    );
}
