"use client";

import { useLayoutEffect, useRef, useCallback } from "react";

type ScrollStackProps = {
    children: React.ReactNode;
    className?: string;
    itemDistance?: number;
    itemScale?: number;
    itemStackDistance?: number;
    stackPosition?: string;
    scaleEndPosition?: string;
    baseScale?: number;
    rotationAmount?: number;
    blurAmount?: number;
    useWindowScroll?: boolean;
    onStackComplete?: () => void;
};

type ScrollStackItemProps = {
    children: React.ReactNode;
    itemClassName?: string;
};

type LenisLike = {
    on: (event: string, cb: () => void) => void;
    raf: (time: number) => void;
    destroy: () => void;
};

export const ScrollStackItem = ({ children, itemClassName = "" }: ScrollStackItemProps) => (
    <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
);

const ScrollStack = ({
    children,
    className = "",
    itemDistance = 100,
    itemScale = 0.03,
    itemStackDistance = 30,
    stackPosition = "20%",
    scaleEndPosition = "10%",
    baseScale = 0.85,
    rotationAmount = 0,
    blurAmount = 0,
    useWindowScroll = true,
    onStackComplete,
}: ScrollStackProps) => {
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const stackCompletedRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);
    const lenisRef = useRef<LenisLike | null>(null);
    const cardsRef = useRef<HTMLDivElement[]>([]);
    const lastTransformsRef = useRef<Map<number, { translateY: number; scale: number; rotation: number; blur: number }>>(
        new Map()
    );
    const isUpdatingRef = useRef(false);

    const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
        if (scrollTop < start) return 0;
        if (scrollTop > end) return 1;
        return (scrollTop - start) / (end - start);
    }, []);

    const parsePercentage = useCallback((value: string, containerHeight: number) => {
        if (value.includes("%")) return (parseFloat(value) / 100) * containerHeight;
        return parseFloat(value);
    }, []);

    const getScrollData = useCallback(() => {
        if (useWindowScroll) {
            return {
                scrollTop: window.scrollY,
                containerHeight: window.innerHeight,
            };
        }

        const scroller = scrollerRef.current;
        return {
            scrollTop: scroller?.scrollTop ?? 0,
            containerHeight: scroller?.clientHeight ?? window.innerHeight,
        };
    }, [useWindowScroll]);

    const getElementOffset = useCallback(
        (element: HTMLElement) => {
            if (useWindowScroll) {
                const rect = element.getBoundingClientRect();
                return rect.top + window.scrollY;
            }
            return element.offsetTop;
        },
        [useWindowScroll]
    );

    const updateCardTransforms = useCallback(() => {
        if (!cardsRef.current.length || isUpdatingRef.current) return;
        isUpdatingRef.current = true;

        const { scrollTop, containerHeight } = getScrollData();
        const stackPositionPx = parsePercentage(stackPosition, containerHeight);
        const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);

        const root = scrollerRef.current;
        const endElement = root?.querySelector(".scroll-stack-end") as HTMLElement | null;
        const endElementTop = endElement ? getElementOffset(endElement) : 0;

        cardsRef.current.forEach((card, i) => {
            const cardTop = getElementOffset(card);
            const triggerStart = cardTop - stackPositionPx - itemStackDistance * i;
            const triggerEnd = cardTop - scaleEndPositionPx;
            const pinStart = cardTop - stackPositionPx - itemStackDistance * i;
            const pinEnd = endElementTop - containerHeight / 2;

            const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
            const targetScale = baseScale + i * itemScale;
            const scale = 1 - scaleProgress * (1 - targetScale);
            const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;

            let blur = 0;
            if (blurAmount) {
                let topCardIndex = 0;
                for (let j = 0; j < cardsRef.current.length; j += 1) {
                    const jCardTop = getElementOffset(cardsRef.current[j]);
                    const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance * j;
                    if (scrollTop >= jTriggerStart) topCardIndex = j;
                }
                if (i < topCardIndex) blur = Math.max(0, (topCardIndex - i) * blurAmount);
            }

            let translateY = 0;
            const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;
            if (isPinned) {
                translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
            } else if (scrollTop > pinEnd) {
                translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i;
            }

            const newTransform = {
                translateY: Math.round(translateY * 100) / 100,
                scale: Math.round(scale * 1000) / 1000,
                rotation: Math.round(rotation * 100) / 100,
                blur: Math.round(blur * 100) / 100,
            };

            const lastTransform = lastTransformsRef.current.get(i);
            const hasChanged =
                !lastTransform ||
                Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
                Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
                Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
                Math.abs(lastTransform.blur - newTransform.blur) > 0.1;

            if (hasChanged) {
                card.style.transform =
                    `translate3d(0, ${newTransform.translateY}px, 0) ` +
                    `scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
                card.style.filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : "";
                lastTransformsRef.current.set(i, newTransform);
            }

            if (i === cardsRef.current.length - 1) {
                const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
                if (isInView && !stackCompletedRef.current) {
                    stackCompletedRef.current = true;
                    onStackComplete?.();
                } else if (!isInView && stackCompletedRef.current) {
                    stackCompletedRef.current = false;
                }
            }
        });

        isUpdatingRef.current = false;
    }, [
        baseScale,
        blurAmount,
        calculateProgress,
        getElementOffset,
        getScrollData,
        itemScale,
        itemStackDistance,
        onStackComplete,
        parsePercentage,
        rotationAmount,
        scaleEndPosition,
        stackPosition,
    ]);

    const setupLenis = useCallback(() => {
        const onScroll = () => updateCardTransforms();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        lenisRef.current = {
            on: () => {},
            raf: () => {},
            destroy: () => {
                window.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", onScroll);
            },
        };
    }, [updateCardTransforms]);

    useLayoutEffect(() => {
        const root = scrollerRef.current;
        if (!root) return;

        const cards = Array.from(root.querySelectorAll<HTMLDivElement>(".scroll-stack-card"));
        cardsRef.current = cards;
        lastTransformsRef.current.clear();

        cards.forEach((card, i) => {
            if (i < cards.length - 1) card.style.marginBottom = `${itemDistance}px`;
            card.style.willChange = "transform, filter";
            card.style.transformOrigin = "top center";
            card.style.backfaceVisibility = "hidden";
        });

        setupLenis();
        updateCardTransforms();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (lenisRef.current) lenisRef.current.destroy();
            stackCompletedRef.current = false;
            cardsRef.current = [];
            lastTransformsRef.current.clear();
            isUpdatingRef.current = false;
        };
    }, [itemDistance, setupLenis, updateCardTransforms]);

    return (
        <div
            className={`scroll-stack-scroller ${useWindowScroll ? "is-window-scroll" : ""} ${className}`.trim()}
            ref={scrollerRef}
        >
            <div className="scroll-stack-inner">
                {children}
                <div className="scroll-stack-end" />
            </div>
        </div>
    );
};

export default ScrollStack;
