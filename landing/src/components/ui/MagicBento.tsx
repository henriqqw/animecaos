"use client";

import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 360;
const DEFAULT_GLOW_COLOR = "230, 63, 63";
const MOBILE_BREAKPOINT = 768;

type MagicBentoItem = {
    title: string;
    description: string;
    label: string;
    icon?: ReactNode;
};

type MagicBentoProps = {
    items: MagicBentoItem[];
    textAutoHide?: boolean;
    enableStars?: boolean;
    enableSpotlight?: boolean;
    enableBorderGlow?: boolean;
    enableTilt?: boolean;
    enableMagnetism?: boolean;
    clickEffect?: boolean;
    spotlightRadius?: number;
    particleCount?: number;
    glowColor?: string;
    disableAnimations?: boolean;
};

const createParticleElement = (x: number, y: number, color = DEFAULT_GLOW_COLOR) => {
    const el = document.createElement("div");
    el.className = "magic-bento-particle";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.background = `rgba(${color}, 1)`;
    el.style.boxShadow = `0 0 9px rgba(${color}, 0.65)`;
    return el;
};

const calculateSpotlightValues = (radius: number) => ({
    proximity: radius * 0.52,
    fadeDistance: radius * 0.86,
});

const updateCardGlowProperties = (card: HTMLElement, mouseX: number, mouseY: number, glow: number, radius: number) => {
    const rect = card.getBoundingClientRect();
    const relativeX = ((mouseX - rect.left) / rect.width) * 100;
    const relativeY = ((mouseY - rect.top) / rect.height) * 100;

    card.style.setProperty("--glow-x", `${relativeX}%`);
    card.style.setProperty("--glow-y", `${relativeY}%`);
    card.style.setProperty("--glow-intensity", glow.toString());
    card.style.setProperty("--glow-radius", `${radius}px`);
};

const useMobileDetection = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return isMobile;
};

const ParticleCard = ({
    children,
    className = "",
    disableAnimations = false,
    style,
    particleCount = DEFAULT_PARTICLE_COUNT,
    glowColor = DEFAULT_GLOW_COLOR,
    enableTilt = false,
    clickEffect = true,
    enableMagnetism = true,
}: {
    children: ReactNode;
    className?: string;
    disableAnimations?: boolean;
    style?: CSSProperties;
    particleCount?: number;
    glowColor?: string;
    enableTilt?: boolean;
    clickEffect?: boolean;
    enableMagnetism?: boolean;
}) => {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const particlesRef = useRef<HTMLDivElement[]>([]);
    const timeoutsRef = useRef<number[]>([]);
    const isHoveredRef = useRef(false);
    const memoizedParticles = useRef<HTMLDivElement[]>([]);
    const particlesInitialized = useRef(false);
    const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

    const initializeParticles = useCallback(() => {
        if (particlesInitialized.current || !cardRef.current) return;
        const { width, height } = cardRef.current.getBoundingClientRect();
        memoizedParticles.current = Array.from({ length: particleCount }, () =>
            createParticleElement(Math.random() * width, Math.random() * height, glowColor),
        );
        particlesInitialized.current = true;
    }, [glowColor, particleCount]);

    const clearAllParticles = useCallback(() => {
        timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
        timeoutsRef.current = [];
        magnetismAnimationRef.current?.kill();

        particlesRef.current.forEach((particle) => {
            gsap.to(particle, {
                scale: 0,
                opacity: 0,
                duration: 0.24,
                ease: "back.in(1.7)",
                onComplete: () => {
                    particle.parentNode?.removeChild(particle);
                },
            });
        });
        particlesRef.current = [];
    }, []);

    const animateParticles = useCallback(() => {
        if (!cardRef.current || !isHoveredRef.current) return;
        if (!particlesInitialized.current) initializeParticles();

        memoizedParticles.current.forEach((particle, index) => {
            const timeoutId = window.setTimeout(() => {
                if (!isHoveredRef.current || !cardRef.current) return;

                const clone = particle.cloneNode(true) as HTMLDivElement;
                cardRef.current.appendChild(clone);
                particlesRef.current.push(clone);

                gsap.fromTo(
                    clone,
                    { scale: 0, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.28, ease: "back.out(1.7)" },
                );

                gsap.to(clone, {
                    x: (Math.random() - 0.5) * 90,
                    y: (Math.random() - 0.5) * 90,
                    rotation: Math.random() * 360,
                    duration: 2 + Math.random() * 1.8,
                    ease: "none",
                    repeat: -1,
                    yoyo: true,
                });

                gsap.to(clone, {
                    opacity: 0.24,
                    duration: 1.4,
                    ease: "power2.inOut",
                    repeat: -1,
                    yoyo: true,
                });
            }, index * 70);

            timeoutsRef.current.push(timeoutId);
        });
    }, [initializeParticles]);

    useEffect(() => {
        const element = cardRef.current;
        if (disableAnimations || !element) return;

        const handleMouseEnter = () => {
            isHoveredRef.current = true;
            animateParticles();
            if (enableTilt) {
                gsap.to(element, {
                    rotateX: 4,
                    rotateY: 4,
                    duration: 0.25,
                    ease: "power2.out",
                    transformPerspective: 1000,
                });
            }
        };

        const handleMouseLeave = () => {
            isHoveredRef.current = false;
            clearAllParticles();

            if (enableTilt) {
                gsap.to(element, { rotateX: 0, rotateY: 0, duration: 0.24, ease: "power2.out" });
            }
            if (enableMagnetism) {
                gsap.to(element, { x: 0, y: 0, duration: 0.24, ease: "power2.out" });
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!enableTilt && !enableMagnetism) return;

            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            if (enableTilt) {
                const rotateX = ((y - centerY) / centerY) * -7;
                const rotateY = ((x - centerX) / centerX) * 7;
                gsap.to(element, {
                    rotateX,
                    rotateY,
                    duration: 0.11,
                    ease: "power2.out",
                    transformPerspective: 1000,
                });
            }

            if (enableMagnetism) {
                const magnetX = (x - centerX) * 0.04;
                const magnetY = (y - centerY) * 0.04;
                magnetismAnimationRef.current?.kill();
                magnetismAnimationRef.current = gsap.to(element, {
                    x: magnetX,
                    y: magnetY,
                    duration: 0.22,
                    ease: "power2.out",
                });
            }
        };

        const handleClick = (e: MouseEvent) => {
            if (!clickEffect) return;

            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const maxDistance = Math.max(
                Math.hypot(x, y),
                Math.hypot(x - rect.width, y),
                Math.hypot(x, y - rect.height),
                Math.hypot(x - rect.width, y - rect.height),
            );

            const ripple = document.createElement("div");
            ripple.className = "magic-bento-ripple";
            ripple.style.width = `${maxDistance * 2}px`;
            ripple.style.height = `${maxDistance * 2}px`;
            ripple.style.left = `${x - maxDistance}px`;
            ripple.style.top = `${y - maxDistance}px`;
            ripple.style.background = `radial-gradient(circle, rgba(${glowColor}, 0.35) 0%, rgba(${glowColor}, 0.18) 34%, transparent 70%)`;

            element.appendChild(ripple);
            gsap.fromTo(
                ripple,
                { scale: 0, opacity: 1 },
                { scale: 1, opacity: 0, duration: 0.72, ease: "power2.out", onComplete: () => ripple.remove() },
            );
        };

        element.addEventListener("mouseenter", handleMouseEnter);
        element.addEventListener("mouseleave", handleMouseLeave);
        element.addEventListener("mousemove", handleMouseMove);
        element.addEventListener("click", handleClick);

        return () => {
            isHoveredRef.current = false;
            element.removeEventListener("mouseenter", handleMouseEnter);
            element.removeEventListener("mouseleave", handleMouseLeave);
            element.removeEventListener("mousemove", handleMouseMove);
            element.removeEventListener("click", handleClick);
            clearAllParticles();
        };
    }, [animateParticles, clearAllParticles, clickEffect, disableAnimations, enableMagnetism, enableTilt, glowColor]);

    return (
        <div ref={cardRef} className={`${className} magic-bento-particle-container`.trim()} style={style}>
            {children}
        </div>
    );
};

const GlobalSpotlight = ({
    gridRef,
    disableAnimations = false,
    enabled = true,
    spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
    glowColor = DEFAULT_GLOW_COLOR,
}: {
    gridRef: React.RefObject<HTMLDivElement | null>;
    disableAnimations?: boolean;
    enabled?: boolean;
    spotlightRadius?: number;
    glowColor?: string;
}) => {
    const spotlightRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (disableAnimations || !gridRef.current || !enabled) return;

        const spotlight = document.createElement("div");
        spotlight.className = "magic-bento-global-spotlight";
        spotlight.style.background = `radial-gradient(circle, rgba(${glowColor}, 0.15) 0%, rgba(${glowColor}, 0.08) 18%, rgba(${glowColor}, 0.03) 45%, transparent 72%)`;
        document.body.appendChild(spotlight);
        spotlightRef.current = spotlight;

        const handleMouseMove = (e: MouseEvent) => {
            if (!spotlightRef.current || !gridRef.current) return;
            const section = gridRef.current.closest(".bento-section");
            const rect = section?.getBoundingClientRect();
            const mouseInside =
                !!rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

            const cards = gridRef.current.querySelectorAll<HTMLElement>(".magic-bento-card");
            if (!mouseInside) {
                gsap.to(spotlightRef.current, { opacity: 0, duration: 0.28, ease: "power2.out" });
                cards.forEach((card) => card.style.setProperty("--glow-intensity", "0"));
                return;
            }

            const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
            let minDistance = Infinity;

            cards.forEach((card) => {
                const cardRect = card.getBoundingClientRect();
                const centerX = cardRect.left + cardRect.width / 2;
                const centerY = cardRect.top + cardRect.height / 2;
                const distance =
                    Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
                const effectiveDistance = Math.max(0, distance);
                minDistance = Math.min(minDistance, effectiveDistance);

                let glowIntensity = 0;
                if (effectiveDistance <= proximity) glowIntensity = 1;
                else if (effectiveDistance <= fadeDistance) {
                    glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
                }

                updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius);
            });

            gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.09, ease: "power2.out" });

            const targetOpacity =
                minDistance <= proximity
                    ? 0.74
                    : minDistance <= fadeDistance
                      ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.74
                      : 0;
            gsap.to(spotlightRef.current, {
                opacity: targetOpacity,
                duration: targetOpacity > 0 ? 0.18 : 0.45,
                ease: "power2.out",
            });
        };

        const handleMouseLeave = () => {
            if (!spotlightRef.current || !gridRef.current) return;
            gridRef.current.querySelectorAll<HTMLElement>(".magic-bento-card").forEach((card) => {
                card.style.setProperty("--glow-intensity", "0");
            });
            gsap.to(spotlightRef.current, { opacity: 0, duration: 0.24, ease: "power2.out" });
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
            spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
        };
    }, [disableAnimations, enabled, glowColor, gridRef, spotlightRadius]);

    return null;
};

export default function MagicBento({
    items,
    textAutoHide = true,
    enableStars = true,
    enableSpotlight = true,
    enableBorderGlow = true,
    enableTilt = false,
    enableMagnetism = true,
    clickEffect = true,
    spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
    particleCount = DEFAULT_PARTICLE_COUNT,
    glowColor = DEFAULT_GLOW_COLOR,
    disableAnimations = false,
}: MagicBentoProps) {
    const gridRef = useRef<HTMLDivElement | null>(null);
    const isMobile = useMobileDetection();
    const shouldDisableAnimations = disableAnimations || isMobile;

    const safeItems = useMemo(() => items.slice(0, 6), [items]);

    return (
        <>
            {enableSpotlight && (
                <GlobalSpotlight
                    gridRef={gridRef}
                    disableAnimations={shouldDisableAnimations}
                    enabled={enableSpotlight}
                    spotlightRadius={spotlightRadius}
                    glowColor={glowColor}
                />
            )}

            <div className="magic-bento-grid bento-section" ref={gridRef}>
                {safeItems.map((item, index) => {
                    const baseClassName = `magic-bento-card ${textAutoHide ? "magic-bento-card--text-autohide" : ""} ${enableBorderGlow ? "magic-bento-card--border-glow" : ""}`;
                    const cardStyle = {
                        "--glow-color": glowColor,
                    } as CSSProperties;

                    return (
                        <ParticleCard
                            key={`${item.title}-${index}`}
                            className={baseClassName}
                            style={cardStyle}
                            disableAnimations={shouldDisableAnimations || !enableStars}
                            particleCount={particleCount}
                            glowColor={glowColor}
                            enableTilt={enableTilt}
                            enableMagnetism={enableMagnetism}
                            clickEffect={clickEffect}
                        >
                            <div className="magic-bento-card__header">
                                <div className="magic-bento-card__label">{item.label}</div>
                                {item.icon ? <div className="magic-bento-card__icon">{item.icon}</div> : null}
                            </div>
                            <div className="magic-bento-card__content">
                                <h3 className="magic-bento-card__title">{item.title}</h3>
                                <p className="magic-bento-card__description">{item.description}</p>
                            </div>
                        </ParticleCard>
                    );
                })}
            </div>
        </>
    );
}
