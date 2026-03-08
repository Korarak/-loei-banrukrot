'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <>
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 to-green-600 origin-left z-[100]"
                style={{ scaleX }}
            />
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ ease: 'easeInOut', duration: 0.4 }}
            >
                {children}
            </motion.div>
        </>
    );
}
