"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type CountParts = {
    prefix: string;
    end: number;
    suffix: string;
};

const parseCountValue = (raw: string): CountParts | null => {
    const match = raw.trim().match(/^([^0-9]*)(\d+)([^0-9]*)$/);
    if (!match) return null;
    return {
        prefix: match[1] ?? "",
        end: Number(match[2]),
        suffix: match[3] ?? "",
    };
};

function CountUp({ end, prefix = "", suffix = "" }: { end: number; prefix?: string; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        if (end <= 0) {
            setCount(0);
            return;
        }

        const duration = 2100;
        let frame = 0;
        const startAt = performance.now();

        const animate = (now: number) => {
            const progress = Math.min((now - startAt) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(end * eased));
            if (progress < 1) {
                frame = requestAnimationFrame(animate);
            }
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [inView, end]);

    return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

export default function Stats() {
    const t = useTranslations("stats");

    const items: Array<{ label: string; value: string }> = [
        { label: t("sources"), value: t("sources_val") },
        { label: t("zero_ads"), value: t("zero_ads_val") },
        { label: t("size"), value: t("size_val") },
        { label: t("open_source"), value: t("open_source_val") },
    ];

    return (
        <section style={{ position: "relative", zIndex: 1, padding: "4rem 0" }}>
            <div className="container">
                <div className="divider" style={{ marginBottom: "3rem" }} />
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "2rem",
                    }}
                >
                    {items.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            style={{ textAlign: "center" }}
                        >
                            <div
                                style={{
                                    fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                                    fontWeight: 900,
                                    letterSpacing: "-0.04em",
                                    color: "var(--text)",
                                    lineHeight: 1,
                                    marginBottom: "0.4rem",
                                }}
                            >
                                {(() => {
                                    const parsed = parseCountValue(item.value);
                                    if (!parsed) return item.value;
                                    return (
                                        <CountUp
                                            end={parsed.end}
                                            prefix={parsed.prefix}
                                            suffix={parsed.suffix}
                                        />
                                    );
                                })()}
                            </div>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                                {item.label}
                            </p>
                        </motion.div>
                    ))}
                </div>
                <div className="divider" style={{ marginTop: "3rem" }} />
            </div>
        </section>
    );
}
