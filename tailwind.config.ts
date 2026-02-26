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
                navy: '#022C22', // Emerald 900 (Deep Kerala Night)
                'purple-dark': '#064E3B', // Emerald 800
                'purple-accent': '#10B981', // Emerald 500
                'purple-light': '#34D399', // Emerald 400
                gold: '#F59E0B', // Amber 500
                'gold-light': '#FDE68A', // Amber 200
                surface: 'rgba(6, 78, 59, 0.4)', // Slightly transparent emerald
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
            },
        },
    },
    plugins: [],
};

export default config;
