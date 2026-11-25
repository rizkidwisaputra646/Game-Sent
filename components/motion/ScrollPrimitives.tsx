"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "motion/react";

export type RevealVariant =
  | "fade-up"
  | "slide-up"
  | "fade-scale"
  | "slide-left"
  | "slide-right"
  | "scale-reveal"
  | "clip-reveal";

const EASE_HUD: [number, number, number, number] = [0.22, 1, 0.36, 1];

const VARIANT_CONFIG: Record<
  RevealVariant,
  { hidden: Record<string, unknown>; visible: Record<string, unknown>; duration: number }
> = {
  "fade-up": {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
    duration: 0.48,
  },
  "slide-up": {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
    duration: 0.42,
  },
  "fade-scale": {
    hidden: { opacity: 0, scale: 0.96, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    duration: 0.68,
  },
  "slide-left": {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0 },
    duration: 0.5,
  },
  "slide-right": {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0 },
    duration: 0.5,
  },
  "scale-reveal": {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
    duration: 0.54,
  },
  "clip-reveal": {
    hidden: { opacity: 0, clipPath: "inset(0 0 18% 0)" },
    visible: { opacity: 1, clipPath: "inset(0 0 0% 0)" },
    duration: 0.65,
  },
};

/**
 * Tracks whether an element was below the fold at hydration time.
 * Ensures SSR & initial above-the-fold content is NEVER hidden before JS runs,
 * while elements entering on scroll play smooth reveal animations once.
 */
function useSafeScrollTrigger(
  ref: React.RefObject<HTMLDivElement | null>,
  immediateOnMount = false
) {
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: "some" });
  const [belowFoldOnMount, setBelowFoldOnMount] = useState(false);

  useEffect(() => {
    if (immediateOnMount) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Only defer reveal if element starts completely below the viewport fold
    if (rect.top > window.innerHeight * 0.96) {
      setBelowFoldOnMount(true);
    }
  }, [ref, immediateOnMount]);

  const animateState =
    shouldReduceMotion || immediateOnMount || !belowFoldOnMount || isInView
      ? "visible"
      : "hidden";

  return { shouldReduceMotion, animateState, isInView };
}

export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  immediateOnMount = false,
  className = "",
  id,
}: {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  immediateOnMount?: boolean;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { shouldReduceMotion, animateState } = useSafeScrollTrigger(
    ref,
    immediateOnMount
  );
  const cfg = VARIANT_CONFIG[variant];

  const variants: Variants = {
    hidden: cfg.hidden as Variants["hidden"],
    visible: cfg.visible as Variants["visible"],
  };

  return (
    <motion.div
      ref={ref}
      id={id}
      initial={
        immediateOnMount && !shouldReduceMotion
          ? ({ opacity: 0.75, scale: 0.985, y: 8 } as never)
          : false
      }
      animate={animateState}
      variants={variants}
      transition={{
        duration: shouldReduceMotion ? 0 : cfg.duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: EASE_HUD,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({
  children,
  className = "",
  staggerMs = 75,
  staggerOnMount = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  staggerMs?: number;
  staggerOnMount?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { shouldReduceMotion, animateState } = useSafeScrollTrigger(ref);
  const [mountSettled, setMountSettled] = useState(!staggerOnMount);

  useEffect(() => {
    if (!staggerOnMount || shouldReduceMotion) {
      setMountSettled(true);
      return;
    }
    const raf = requestAnimationFrame(() => setMountSettled(true));
    return () => cancelAnimationFrame(raf);
  }, [staggerOnMount, shouldReduceMotion]);

  const containerVariants: Variants = {
    hidden: {},
    mountStart: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerMs / 1000,
      },
    },
  };

  const resolvedState =
    shouldReduceMotion
      ? "visible"
      : staggerOnMount && !mountSettled
      ? "mountStart"
      : animateState;

  return (
    <motion.div
      ref={ref}
      id={id}
      initial={false}
      animate={resolvedState}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
  variant = "slide-up",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "slide-up" | "fade-up" | "fade-scale";
}) {
  const shouldReduceMotion = useReducedMotion();
  const cfg = VARIANT_CONFIG[variant];

  const itemVariants: Variants = {
    hidden: cfg.hidden as Variants["hidden"],
    mountStart: { opacity: 0.86, y: 14 },
    visible: {
      ...(cfg.visible as Record<string, unknown>),
      transition: {
        duration: shouldReduceMotion ? 0 : cfg.duration,
        ease: EASE_HUD,
      },
    } as Variants["visible"],
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export interface SectionAnchor {
  id: string;
  label: string;
  code: string;
}

/**
 * Sticky HUD Section Jump Bar with live scroll-spy active section tracking
 * and accessible smooth scrolling.
 */
export function SectionNavigationBar({
  sections,
}: {
  sections: SectionAnchor[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    if (sections.length === 0) return;

    const handleScroll = () => {
      const offset = 150;
      let current = sections[0].id;
      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= offset) {
          current = sec.id;
        }
      }
      setActiveId(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveId(id);
    el.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <nav
      aria-label="Navigasi section halaman"
      className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#263149] bg-[#0D1224]/85 px-3 py-2 backdrop-blur-md"
    >
      <span className="mr-1 hidden sm:inline font-mono-num text-[10px] font-semibold tracking-[0.16em] text-[#64748B] uppercase">
        Sections:
      </span>
      {sections.map((sec) => {
        const active = activeId === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollToSection(sec.id)}
            className={`relative rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
              active
                ? "text-[#F1F5F9]"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            {active && (
              <motion.span
                layoutId="section-spy-pill"
                transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: EASE_HUD }}
                className="absolute inset-0 rounded-lg border border-[#22D3EE]/45 bg-[#22D3EE]/12"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span className="font-mono-num text-[10px] text-[#22D3EE]">
                {sec.code}
              </span>
              <span>{sec.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
