"use client";

import { motion } from "framer-motion";

export default function KeralaSilhouettes() {
    return (
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none z-0 opacity-30 mix-blend-overlay">
            {/* Lush Kerala Hills Layer 1 */}
            <svg
                viewBox="0 0 1440 320"
                className="absolute bottom-0 w-full h-auto text-purple-accent drop-shadow-[0_-5px_25px_rgba(16,185,129,0.3)]"
                preserveAspectRatio="none"
            >
                <path
                    fill="currentColor"
                    fillOpacity="0.4"
                    d="M0,160L48,154.7C96,149,192,139,288,154.7C384,171,480,213,576,213.3C672,213,768,171,864,138.7C960,107,1056,85,1152,90.7C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ></path>
            </svg>

            {/* Lush Kerala Hills Layer 2 */}
            <svg
                viewBox="0 0 1440 320"
                className="absolute bottom-0 w-full h-auto text-purple-dark pt-20"
                preserveAspectRatio="none"
            >
                <path
                    fill="currentColor"
                    fillOpacity="0.8"
                    d="M0,224L60,208C120,192,240,160,360,154.7C480,149,600,171,720,181.3C840,192,960,192,1080,170.7C1200,149,1320,107,1380,85.3L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                ></path>
            </svg>

            {/* Subtle Palm/Banana Leaf abstraction (overlapping swooshes) */}
            <svg
                viewBox="0 0 200 200"
                className="absolute bottom-0 right-[5%] w-32 h-auto text-purple-accent/40 origin-bottom"
                preserveAspectRatio="xMidYMax meet"
            >
                <path d="M100 200 Q150 100 200 50 Q120 70 80 150 Z" fill="currentColor" />
                <path d="M90 200 Q140 120 180 80 Q110 90 70 160 Z" fill="currentColor" opacity="0.8" />
                <path d="M110 200 Q160 80 190 30 Q130 50 90 140 Z" fill="currentColor" opacity="0.6" />
                <path d="M80 200 Q40 100 0 50 Q80 70 100 150 Z" fill="currentColor" />
            </svg>

            <svg
                viewBox="0 0 200 200"
                className="absolute bottom-0 left-[2%] w-48 h-auto text-purple-accent/30 origin-bottom scale-x-[-1]"
                preserveAspectRatio="xMidYMax meet"
            >
                <path d="M100 200 Q150 100 200 50 Q120 70 80 150 Z" fill="currentColor" />
                <path d="M90 200 Q140 120 180 80 Q110 90 70 160 Z" fill="currentColor" opacity="0.8" />
                <path d="M80 200 Q40 100 0 50 Q80 70 100 150 Z" fill="currentColor" />
            </svg>
        </div>
    );
}
