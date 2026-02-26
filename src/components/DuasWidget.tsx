"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Dua {
    arabic: string;
    transliteration: string;
    english: string;
    purpose: string;
}

const duas: Dua[] = [
    {
        arabic: "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ",
        transliteration: "Dhahaba adh-dhama'u wabtallatil-'urooqu wa thabatal-ajru in shaa Allah",
        english: "The thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills.",
        purpose: "Dua for Breaking the Fast (Iftar)",
    },
    {
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ",
        transliteration: "Allahumma inni as'alukal-jannata wa ma qarraba ilaiha min qawlin aw 'amal",
        english: "O Allah, I ask You for Paradise and for that which brings one closer to it, of words and deeds.",
        purpose: "Asking for Paradise",
    },
    {
        arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
        transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni",
        english: "O Allah, You are the Most Forgiving, and You love forgiveness, so forgive me.",
        purpose: "Dua for Forgiveness (Laylatul Qadr)",
    },
    {
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
        english: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
        purpose: "Dua for Good in This World & Hereafter",
    },
    {
        arabic: "اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَعَافِنِي وَارْزُقْنِي",
        transliteration: "Allahumma-ghfir li, warhamni, wahdini, wa 'aafini, warzuqni",
        english: "O Allah, forgive me, have mercy on me, guide me, give me health, and provide for me.",
        purpose: "Comprehensive Dua for All Needs",
    },
    {
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
        transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan",
        english: "O Allah, I seek refuge in You from worry and grief.",
        purpose: "Dua for Relief from Anxiety",
    },
    {
        arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
        transliteration: "Rabbish-rahli sadri wa yassir li amri",
        english: "My Lord, expand for me my chest and ease for me my task.",
        purpose: "Dua of Prophet Musa (AS) for Ease",
    },
    {
        arabic: "اللَّهُمَّ بَارِكْ لَنَا فِي رَمَضَانَ",
        transliteration: "Allahumma barik lana fi Ramadan",
        english: "O Allah, bless us in Ramadan.",
        purpose: "Dua for Blessings in Ramadan",
    },
    {
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ",
        transliteration: "SubhanAllahi wa bihamdihi, SubhanAllahil-'Adheem",
        english: "Glory be to Allah and His is the praise. Glory be to Allah, the Supreme.",
        purpose: "Words Beloved to Allah — Heavy on the Scales",
    },
    {
        arabic: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
        transliteration: "La ilaha illa Anta, subhanaka inni kuntu minadh-dhalimin",
        english: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
        purpose: "Dua of Prophet Yunus (AS) — Relief from Distress",
    },
    {
        arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
        transliteration: "Rabbana taqabbal minna innaka Antas-Samee'ul-'Aleem",
        english: "Our Lord, accept from us. Indeed You are the All-Hearing, the All-Knowing.",
        purpose: "Dua for Acceptance of Deeds",
    },
    {
        arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
        transliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik",
        english: "O Allah, help me to remember You, thank You, and worship You in the best manner.",
        purpose: "Dua for Excellence in Worship",
    },
];

const ROTATION_INTERVAL = 120000; // 2 minutes

export default function DuasWidget() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        // Start with a random dua on mount only
        setCurrentIndex(Math.floor(Math.random() * duas.length));
    }, []);

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % duas.length);
        }, ROTATION_INTERVAL);

        return () => clearInterval(interval);
    }, [isPaused]);

    const handleNext = () => {
        setIsPaused(true);
        setCurrentIndex((prev) => (prev + 1) % duas.length);
    };

    const handlePrev = () => {
        setIsPaused(true);
        setCurrentIndex((prev) => (prev - 1 + duas.length) % duas.length);
    };

    const dua = duas[currentIndex];

    return (
        <div className="glass rounded-2xl p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="text-gold">☪</span>
                    Duas
                </h3>
                <span className="text-[10px] text-slate-500 bg-navy/40 px-2 py-0.5 rounded-full">
                    {currentIndex + 1}/{duas.length}
                </span>
            </div>

            {/* Purpose badge */}
            <div className="mb-3">
                <span className="text-[10px] uppercase tracking-wider text-gold bg-gold/10 px-2 py-1 rounded-md font-medium">
                    {dua.purpose}
                </span>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-3"
                >
                    {/* Arabic text */}
                    <p
                        className="text-lg leading-relaxed text-gold-light font-medium text-right"
                        dir="rtl"
                        lang="ar"
                    >
                        {dua.arabic}
                    </p>

                    {/* Transliteration */}
                    <p className="text-xs text-purple-light/70 italic">
                        {dua.transliteration}
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-accent/20 to-transparent" />

                    {/* English meaning */}
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {dua.english}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Progress dots & Manual Controls */}
            <div className="flex flex-col items-center justify-center gap-3 mt-4">
                <div className="flex items-center gap-1">
                    {duas.map((_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex
                                ? "bg-gold w-3"
                                : "bg-slate-600"
                                }`}
                        />
                    ))}
                </div>

                {/* Manual Navigation */}
                <div className="flex items-center justify-between w-full mt-2 border-t border-purple-accent/10 pt-3">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePrev}
                        className="p-1.5 rounded-lg bg-navy/50 text-slate-400 hover:text-white hover:bg-purple-accent/20 transition-colors"
                        title="Previous Dua"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </motion.button>

                    {isPaused && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setIsPaused(false)}
                            className="text-[10px] uppercase tracking-wider text-purple-light/70 hover:text-white transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Resume Auto
                        </motion.button>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNext}
                        className="p-1.5 rounded-lg bg-navy/50 text-slate-400 hover:text-white hover:bg-purple-accent/20 transition-colors"
                        title="Next Dua"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
