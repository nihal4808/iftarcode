import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                navy: {
                    DEFAULT: "#0f172a",
                    light: "#1e293b",
                    lighter: "#334155",
                },
                "purple-accent": {
                    DEFAULT: "#7c3aed",
                },
                "purple-light": {
                    DEFAULT: "#a78bfa",
                },
                "purple-dark": {
                    DEFAULT: "#5b21b6",
                },
                gold: {
                    DEFAULT: "#facc15",
                    light: "#fde68a",
                },
                surface: {
                    DEFAULT: "rgba(30, 41, 59, 0.6)",
                    light: "rgba(51, 65, 85, 0.4)",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
            },
        },
    },
    plugins: [],
};

export default config;
