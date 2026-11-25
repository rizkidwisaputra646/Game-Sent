"use client";

import React from "react";

type AccentTone = "default" | "violet" | "blue" | "cyan" | "positive" | "negative";

const TONE_GLOW: Record<AccentTone, string> = {
  default: "hover:border-[#3b4b6e]",
  violet: "border-[#8B5CF6]/30 hover:border-[#8B5CF6]/65",
  blue: "border-[#3B82F6]/30 hover:border-[#3B82F6]/65",
  cyan: "border-[#22D3EE]/30 hover:border-[#22D3EE]/65",
  positive: "border-[#22C55E]/30 hover:border-[#22C55E]/65",
  negative: "border-[#F43F5E]/30 hover:border-[#F43F5E]/65",
};

const CORNER_COLOR: Record<AccentTone, string> = {
  default: "bg-[#22D3EE]/50",
  violet: "bg-[#8B5CF6]",
  blue: "bg-[#3B82F6]",
  cyan: "bg-[#22D3EE]",
  positive: "bg-[#22C55E]",
  negative: "bg-[#F43F5E]",
};

interface HudCardProps {
  children: React.ReactNode;
  className?: string;
  tone?: AccentTone;
  delay?: number;
  interactive?: boolean;
  hudTag?: string;
  id?: string;
}

export function HudCard({
  children,
  className = "",
  tone = "default",
  interactive = false,
  hudTag,
  id,
}: HudCardProps) {
  return (
    <section
      id={id}
      className={`hud-card relative scroll-mt-20 rounded-xl p-5 ${TONE_GLOW[tone]} ${
        interactive ? "hud-card-interactive" : ""
      } ${className}`}
    >
      {/* Subtle HUD corner ticks */}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 h-2.5 w-[2px] rounded-tl ${CORNER_COLOR[tone]} opacity-70`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 h-[2px] w-2.5 rounded-tl ${CORNER_COLOR[tone]} opacity-70`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute right-0 bottom-0 h-2.5 w-[2px] rounded-br ${CORNER_COLOR[tone]} opacity-50`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute right-0 bottom-0 h-[2px] w-2.5 rounded-br ${CORNER_COLOR[tone]} opacity-50`}
      />

      {hudTag && (
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${CORNER_COLOR[tone]}`}
          />
          <span className="font-mono-num text-[10px] font-semibold tracking-[0.16em] text-[#94A3B8] uppercase">
            {hudTag}
          </span>
        </div>
      )}

      {children}
    </section>
  );
}
