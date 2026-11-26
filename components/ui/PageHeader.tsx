"use client";

import React from "react";
import { MangaSparkle } from "@/components/ui/AnimeDecoration";

export function PageHeader({
  title,
  description,
  badge,
  actions,
  tag,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  tag?: string;
}) {
  return (
    <div className="relative mb-5 pt-1 pb-2">
      {/* Subtle Editorial Geometric Accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1 right-12 hidden md:block h-7 w-16 -skew-x-12 rounded-sm border-2 border-[#202020] bg-[#F5C85B]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-4 right-4 hidden md:block h-7 w-16 -skew-x-12 rounded-sm border-2 border-[#202020] bg-[#DDD6FE]"
      />

      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
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
            <p className="mt-1 text-xs sm:text-sm font-medium text-[#555555] leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
