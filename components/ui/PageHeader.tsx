"use client";

import React from "react";
import { AnimeHeroPortrait, MangaSparkle } from "@/components/ui/AnimeDecoration";
import { AnimatedSparkle, ComicSpeechBubble } from "@/components/motion/AnimeComicMotion";

export function PageHeader({
  title,
  description,
  badge,
  actions,
  tag,
  speechText,
  showMascot = true,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  tag?: string;
  speechText?: string;
  showMascot?: boolean;
}) {
  return (
    <div className="relative pt-1">
      <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {/* Left: Tag, Title & Description */}
        <div className="flex-1 min-w-0 pb-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {tag && (
              <span className="rounded-md border-1.5 border-[#202020] bg-[#DDD6FE] px-2 py-0.5 font-mono-num text-[10px] font-bold tracking-wider text-[#171717] uppercase shadow-[1.5px_1.5px_0px_#202020]">
                {tag}
              </span>
            )}
            {badge}
            <MangaSparkle className="h-4 w-4 text-[#A78BFA]" />
          </div>

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#171717] sm:text-3xl leading-tight">
            {title}
          </h1>

          {description && (
            <p className="mt-1 text-xs sm:text-sm font-medium text-[#555555] leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Right: Actions or Compact Anime Mascot + Contextual Speech Bubble */}
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0 pb-1">{actions}</div>
        ) : (
          showMascot && (
            <div className="hidden lg:flex relative z-10 shrink-0 items-end justify-end w-[340px] h-[126px] -mb-6 pointer-events-none">
              {/* Subtle Editorial Geometric Shards behind character */}
              <div
                aria-hidden="true"
                className="absolute bottom-6 right-20 h-8 w-20 -skew-x-12 rounded-sm border-2 border-[#202020] bg-[#F5C85B]"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-3.5 right-10 h-7 w-22 -skew-x-12 rounded-sm border-2 border-[#202020] bg-[#DDD6FE]"
              />
              <AnimatedSparkle className="absolute top-1 left-8 h-3.5 w-3.5 text-[#F5C85B]" delay={0.7} />

              {/* Contextual Speech Bubble */}
              {speechText && (
                <div className="relative z-30 mr-1.5 mb-11 max-w-[175px]">
                  <ComicSpeechBubble tailPosition="right">
                    <span className="font-mono text-[10px] uppercase tracking-tight text-[#171717]">
                      {speechText}
                    </span>
                  </ComicSpeechBubble>
                </div>
              )}

              {/* Compact Anime Mascot Portrait */}
              <div className="relative z-20 w-[132px] h-[126px] shrink-0">
                <AnimeHeroPortrait
                  variant="all"
                  className="w-full h-full object-contain object-bottom"
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
