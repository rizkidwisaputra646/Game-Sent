"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const COMIC_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Lightweight comic panel page transition wrapper (240ms)
 */
export function ComicPageTransition({
  children,
  routeKey,
}: {
  children: React.ReactNode;
  routeKey: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0.72, y: 10, scale: 0.992 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: COMIC_EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Comic Panel Reveal for cards & sections
 */
export function ComicPanelReveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
  id,
}: {
  children: React.ReactNode;
  direction?: "up" | "left" | "right" | "pop";
  delay?: number;
  className?: string;
  id?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  const initialMap = {
    up: { opacity: 0.65, y: 16, scale: 0.985 },
    left: { opacity: 0.65, x: -22, scale: 0.985 },
    right: { opacity: 0.65, x: 22, scale: 0.985 },
    pop: { opacity: 0.65, scale: 0.94 },
  };

  if (shouldReduceMotion) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      initial={initialMap[direction]}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: "some" }}
      transition={{ duration: 0.36, delay, ease: COMIC_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered Comic Panel Group
 */
export function ComicStaggerGroup({
  children,
  className = "",
  staggerMs = 65,
}: {
  children: React.ReactNode;
  className?: string;
  staggerMs?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerMs / 1000,
      },
    },
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? "visible" : "hidden"}
      animate="visible"
      variants={container}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ComicStaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  const item: Variants = {
    hidden: { opacity: 0.7, y: 14, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: shouldReduceMotion ? 0 : 0.32, ease: COMIC_EASE },
    },
  };

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * Pop-up Manga Typography Callout ("ANALYZED!", "DATA READY!", "LEVEL UP!")
 */
export function ComicPopCallout({
  text,
  tone = "primary",
  tilt = -3,
  className = "",
}: {
  text: string;
  tone?: "primary" | "positive" | "negative" | "warning" | "dota" | "mlbb";
  tilt?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  const bgClass = {
    primary: "bg-[#A78BFA] text-[#171717]",
    positive: "bg-[#65C98A] text-[#171717]",
    negative: "bg-[#FA7777] text-[#171717]",
    warning: "bg-[#F5C85B] text-[#171717]",
    dota: "bg-[#D94B43] text-white",
    mlbb: "bg-[#3479D4] text-[#E8BC55]",
  }[tone];

  return (
    <motion.span
      initial={shouldReduceMotion ? false : { scale: 0.65, opacity: 0, rotate: tilt - 6 }}
      animate={{ scale: 1, opacity: 1, rotate: tilt }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 420, damping: 18 }
      }
      className={`inline-flex items-center gap-1 rounded-lg border-2 border-[#202020] px-2.5 py-0.5 font-display text-[11px] font-extrabold uppercase tracking-wider shadow-[2px_2px_0px_#202020] select-none ${bgClass} ${className}`}
    >
      {text}
    </motion.span>
  );
}

/**
 * Comic Speech Bubble (for Mascot reaction or contextual tooltip)
 */
export function ComicSpeechBubble({
  children,
  tailPosition = "bottom-right",
  className = "",
}: {
  children: React.ReactNode;
  tailPosition?: "bottom-right" | "bottom-left" | "left";
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9, y: 4 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: COMIC_EASE }}
      className={`relative rounded-xl border-2 border-[#202020] bg-[#FFFDFC] px-3 py-1.5 text-[11px] font-bold text-[#171717] shadow-[2.5px_2.5px_0px_#202020] ${className}`}
    >
      {children}
      {tailPosition === "bottom-right" && (
        <span
          aria-hidden="true"
          className="absolute -bottom-2 right-5 h-3 w-3 rotate-45 border-r-2 border-b-2 border-[#202020] bg-[#FFFDFC]"
        />
      )}
      {tailPosition === "bottom-left" && (
        <span
          aria-hidden="true"
          className="absolute -bottom-2 left-5 h-3 w-3 rotate-45 border-r-2 border-b-2 border-[#202020] bg-[#FFFDFC]"
        />
      )}
      {tailPosition === "left" && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 -left-2 -translate-y-1/2 h-3 w-3 rotate-45 border-b-2 border-l-2 border-[#202020] bg-[#FFFDFC]"
        />
      )}
    </motion.div>
  );
}

/**
 * Subtle Radial Comic Impact Burst SVG
 */
export function ImpactBurst({
  color = "#A78BFA",
  className = "w-24 h-24",
}: {
  color?: string;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      initial={shouldReduceMotion ? false : { scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.35 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: COMIC_EASE }}
      className={`pointer-events-none select-none ${className}`}
    >
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 60 + Math.cos(angle) * 28;
        const y1 = 60 + Math.sin(angle) * 28;
        const x2 = 60 + Math.cos(angle) * (i % 2 === 0 ? 54 : 44);
        const y2 = 60 + Math.sin(angle) * (i % 2 === 0 ? 54 : 44);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={i % 2 === 0 ? "3" : "2"}
            strokeLinecap="round"
          />
        );
      })}
    </motion.svg>
  );
}

/**
 * Manga Speed Lines Overlay (for active scanning or hero impact headers)
 */
export function MangaSpeedLines({
  color = "#202020",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <line x1="0" y1="8" x2="120" y2="8" stroke={color} strokeWidth="2" strokeOpacity="0.18" />
      <line x1="35" y1="18" x2="195" y2="18" stroke={color} strokeWidth="1.5" strokeOpacity="0.14" />
      <line x1="12" y1="30" x2="160" y2="30" stroke={color} strokeWidth="2.5" strokeOpacity="0.16" />
      <line x1="65" y1="42" x2="200" y2="42" stroke={color} strokeWidth="1.5" strokeOpacity="0.12" />
      <line x1="20" y1="52" x2="140" y2="52" stroke={color} strokeWidth="2" strokeOpacity="0.15" />
    </svg>
  );
}

/**
 * Active Scanning Animation Bar (Sentiment Analyzer & Batch Processing)
 */
export function ComicScanningEffect({
  label = "SCANNING TF-IDF FEATURES...",
}: {
  label?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-[#202020] bg-[#DDD6FE] px-4 py-3 shadow-[2.5px_2.5px_0px_#202020]">
      <MangaSpeedLines className="absolute inset-0 h-full w-full" color="#202020" />
      <div
        aria-hidden="true"
        className="comic-scan-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-18deg]"
      />
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="font-display text-xs font-extrabold tracking-wider text-[#171717] uppercase">
          {label}
        </span>
        <span className="rounded border border-[#202020] bg-[#FFFDFC] px-2 py-0.5 font-mono text-[10px] font-bold text-[#171717]">
          ACTIVE
        </span>
      </div>
    </div>
  );
}

/**
 * Manga Shake Container for Error Feedback (brief single shake on mount/key change)
 */
export function MangaShake({
  children,
  shakeKey,
  className = "",
}: {
  children: React.ReactNode;
  shakeKey: string | number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      key={shakeKey}
      initial={{ x: 0 }}
      animate={{ x: [0, -6, 6, -4, 4, -2, 0] }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Gentle Pulsing Anime Sparkle Accent
 */
export function AnimatedSparkle({
  className = "h-5 w-5 text-[#A78BFA]",
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      animate={
        shouldReduceMotion
          ? undefined
          : {
              scale: [1, 1.18, 1],
              rotate: [0, 8, 0],
              opacity: [0.85, 1, 0.85],
            }
      }
      transition={{
        duration: 3.4,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={`pointer-events-none select-none ${className}`}
    >
      <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
    </motion.svg>
  );
}
