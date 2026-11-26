"use client";

import React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function MangaSparkle({
  className = "h-4 w-4 text-[#A78BFA]",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
    </svg>
  );
}

/**
 * Three-line comic/manga emphasis ticks (\ | /) seen on card corners in editorial UI
 */
export function MangaBurstTicks({
  className = "h-4 w-4 text-[#202020]",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="5" y1="9" x2="10" y2="14" />
      <line x1="12" y1="4" x2="12" y2="12" />
      <line x1="19" y1="9" x2="14" y2="14" />
    </svg>
  );
}

const HERO_CHARACTERS = {
  all: {
    src: "/images/anime-hero.png",
    alt: "GameSent Anime Analyst Character",
    width: 360,
    height: 394,
  },
  "Dota 2": {
    src: "/images/hero-dota.png",
    alt: "Dota 2 Invoker Anime Editorial Character",
    width: 380,
    height: 398,
  },
  "Mobile Legends": {
    src: "/images/hero-mlbb.png",
    alt: "Mobile Legends Alucard Anime Editorial Character",
    width: 380,
    height: 292,
  },
} as const;

/**
 * Dynamic Anime Character Hero Portrait (switches smoothly between Analyst, Invoker, and Alucard)
 */
export function AnimeHeroPortrait({
  variant = "all",
  className = "",
  idleFloat = true,
}: {
  variant?: "all" | "Dota 2" | "Mobile Legends";
  className?: string;
  idleFloat?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const asset = HERO_CHARACTERS[variant] ?? HERO_CHARACTERS.all;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={variant}
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.94, y: 6 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full flex items-end justify-center"
      >
        <motion.div
          animate={
            idleFloat && !shouldReduceMotion
              ? { y: [0, -4, 0] }
              : undefined
          }
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full flex items-end justify-center"
        >
          <Image
            src={asset.src}
            alt={asset.alt}
            width={asset.width}
            height={asset.height}
            priority
            className={`select-none pointer-events-none object-contain object-bottom ${className}`}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Dota 2 Authentic Crest Badge (Neo-Brutalist Framed)
 */
export function DotaArtworkBadge({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl border-2 border-[#202020] bg-[#FFF5F4] shadow-[2px_2px_0px_#202020] p-1.5 overflow-hidden ${className}`}
      title="Dota 2 — Steam Reviews"
    >
      <Image
        src="/images/logo-dota2.png"
        alt="Dota 2 Logo"
        width={48}
        height={48}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

/**
 * Mobile Legends Authentic Crest Badge (Neo-Brutalist Framed)
 */
export function MLBBArtworkBadge({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl border-2 border-[#202020] bg-[#EFF6FF] shadow-[2px_2px_0px_#202020] p-1.5 overflow-hidden ${className}`}
      title="Mobile Legends — Google Play Store"
    >
      <Image
        src="/images/logo-mlbb.png"
        alt="Mobile Legends Logo"
        width={48}
        height={48}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

/**
 * Fallback small mascot for non-hero areas
 */
export function AnimeResearchMascot({
  size = 64,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl border-2 border-[#202020] bg-[#DDD6FE] shadow-[2.5px_2.5px_0px_#202020] overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/anime-hero.png"
        alt="GameSent Mascot"
        width={size}
        height={size}
        className="object-cover object-top w-full h-full pt-1"
      />
    </div>
  );
}
