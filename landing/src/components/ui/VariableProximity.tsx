"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";

type FalloffMode = "linear" | "exponential" | "gaussian";

type VariableProximityProps = {
    label: string;
    fromFontVariationSettings: string;
    toFontVariationSettings: string;
    containerRef?: React.RefObject<HTMLElement | null>;
    radius?: number;
    falloff?: FalloffMode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler<HTMLSpanElement>;
};

function useAnimationFrame(callback: () => void) {
    useEffect(() => {
        let frameId = 0;
        const loop = () => {
            callback();
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [callback]);
}

function useMousePositionRef(containerRef?: React.RefObject<HTMLElement | null>) {
    const positionRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const updatePosition = (x: number, y: number) => {
            if (containerRef?.current) {
                const rect = containerRef.current.getBoundingClientRect();
                positionRef.current = { x: x - rect.left, y: y - rect.top };
            } else {
                positionRef.current = { x, y };
            }
        };

        const handleMouseMove = (ev: MouseEvent) => updatePosition(ev.clientX, ev.clientY);
        const handleTouchMove = (ev: TouchEvent) => {
            const touch = ev.touches[0];
            if (!touch) return;
            updatePosition(touch.clientX, touch.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("touchmove", handleTouchMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleTouchMove);
        };
    }, [containerRef]);

    return positionRef;
}

const VariableProximity = forwardRef<HTMLSpanElement, VariableProximityProps>((props, ref) => {
    const {
        label,
        fromFontVariationSettings,
        toFontVariationSettings,
        containerRef,
        radius = 120,
        falloff = "linear",
        className = "",
        onClick,
        style,
    } = props;

    const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const interpolatedSettingsRef = useRef<string[]>([]);
    const mousePositionRef = useMousePositionRef(containerRef);
    const lastPositionRef = useRef({ x: Number.NaN, y: Number.NaN });

    const parsedSettings = useMemo(() => {
        const parseSettings = (settingsStr: string) =>
            new Map(
                settingsStr
                    .split(",")
                    .map((s) => s.trim())
                    .map((s) => {
                        const [name, value] = s.split(" ");
                        return [name.replace(/['"]/g, ""), parseFloat(value)];
                    })
            );

        const fromSettings = parseSettings(fromFontVariationSettings);
        const toSettings = parseSettings(toFontVariationSettings);

        return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
            axis,
            fromValue,
            toValue: toSettings.get(axis) ?? fromValue,
        }));
    }, [fromFontVariationSettings, toFontVariationSettings]);

    useAnimationFrame(() => {
        if (!containerRef?.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const { x, y } = mousePositionRef.current;
        if (lastPositionRef.current.x === x && lastPositionRef.current.y === y) return;
        lastPositionRef.current = { x, y };

        const calculateFalloff = (distance: number) => {
            const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
            if (falloff === "exponential") return norm ** 2;
            if (falloff === "gaussian") return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
            return norm;
        };

        letterRefs.current.forEach((letterRef, index) => {
            if (!letterRef) return;

            const rect = letterRef.getBoundingClientRect();
            const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
            const letterCenterY = rect.top + rect.height / 2 - containerRect.top;
            const distance = Math.hypot(x - letterCenterX, y - letterCenterY);

            if (distance >= radius) {
                letterRef.style.fontVariationSettings = fromFontVariationSettings;
                return;
            }

            const falloffValue = calculateFalloff(distance);
            const newSettings = parsedSettings
                .map(({ axis, fromValue, toValue }) => {
                    const interpolatedValue = fromValue + (toValue - fromValue) * falloffValue;
                    return `'${axis}' ${interpolatedValue}`;
                })
                .join(", ");

            interpolatedSettingsRef.current[index] = newSettings;
            letterRef.style.fontVariationSettings = newSettings;
        });
    });

    const words = label.split(" ");
    let letterIndex = 0;

    return (
        <span
            ref={ref}
            className={`${className} variable-proximity`}
            onClick={onClick}
            style={{ display: "inline", ...style }}
        >
            {words.map((word, wordIndex) => (
                <span key={`${word}-${wordIndex}`} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                    {word.split("").map((letter) => {
                        const currentLetterIndex = letterIndex++;
                        return (
                            <motion.span
                                key={`${letter}-${currentLetterIndex}`}
                                ref={(el) => {
                                    letterRefs.current[currentLetterIndex] = el;
                                }}
                                style={{
                                    display: "inline-block",
                                    fontVariationSettings: interpolatedSettingsRef.current[currentLetterIndex],
                                }}
                                aria-hidden="true"
                            >
                                {letter}
                            </motion.span>
                        );
                    })}
                    {wordIndex < words.length - 1 && <span style={{ display: "inline-block" }}>&nbsp;</span>}
                </span>
            ))}
            <span className="sr-only">{label}</span>
        </span>
    );
});

VariableProximity.displayName = "VariableProximity";

export default VariableProximity;
