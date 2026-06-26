import { motion } from "framer-motion";

export function Reveal({ children, delay = 0, y = 24, className = "" }) {
    return (
        <motion.div
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function Stagger({ children, className = "", staggerChildren = 0.08 }) {
    return (
        <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
                hidden: {},
                show: { transition: { staggerChildren } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export const StaggerItem = ({ children, className = "" }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 28 },
            show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] } },
        }}
        className={className}
    >
        {children}
    </motion.div>
);
