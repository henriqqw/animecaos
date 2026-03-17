"use client";

import { motion } from "framer-motion";
import { Tv, Zap, Database, SkipForward, Download, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import MagicBento from "@/components/ui/MagicBento";

const ICONS = [Tv, Zap, Database, SkipForward, Download, Package];

type FeatureItem = { title: string; desc: string };

export default function Features() {
    const t = useTranslations("features");
    const items = t.raw("items") as FeatureItem[];
    const bentoItems = items.map((item, i) => {
        const Icon = ICONS[i];
        return {
            title: item.title,
            description: item.desc,
            label: item.title.split(" ")[0],
            icon: Icon ? <Icon size={18} /> : null,
        };
    });

    return (
        <section className="section" id="features">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: "center", marginBottom: "4rem" }}
                >
                    <h2 className="heading-lg" style={{ marginBottom: "1rem" }}>
                        {t("title")}
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>{t("sub")}</p>
                </motion.div>

                <div className="features-magic-wrap">
                    <MagicBento
                        items={bentoItems}
                        textAutoHide
                        enableStars
                        enableSpotlight
                        enableBorderGlow
                        enableTilt={false}
                        enableMagnetism
                        clickEffect
                        spotlightRadius={400}
                        particleCount={12}
                        glowColor="230, 63, 63"
                        disableAnimations={false}
                    />
                </div>
            </div>
        </section>
    );
}
