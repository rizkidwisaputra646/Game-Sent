"use client";

import React from "react";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { DotaArtworkBadge, MLBBArtworkBadge, MangaSparkle } from "@/components/ui/AnimeDecoration";
import { Database, ThumbsDown, ThumbsUp } from "lucide-react";

type CardTone = "default" | "violet" | "blue" | "cyan" | "positive" | "negative" | "warning" | "dota" | "mlbb";

export interface HudCardProps {
  children: React.ReactNode;
  className?: string;
  tone?: CardTone;
  delay?: number;
  interactive?: boolean;
  hudTag?: string;
  id?: string;
}

/**
 * Reusable Neo-Brutalist Surface Card
 * Serves as the base card component across GameSent.
 */
export function HudCard({
  children,
  className = "",
  tone = "default",
  interactive = false,
  hudTag,
  id,
}: HudCardProps) {
  const toneBorder = {
    default: "border-[#202020]",
    violet: "border-[#202020]",
    blue: "border-[#202020]",
    cyan: "border-[#202020]",
    positive: "border-[#202020]",
    negative: "border-[#202020]",
    warning: "border-[#202020]",
    dota: "border-[#202020]",
    mlbb: "border-[#202020]",
  }[tone];

  const tagColor = {
    default: "bg-[#202020] text-[#FFFDFC]",
    violet: "bg-[#A78BFA] text-[#171717]",
    blue: "bg-[#3479D4] text-white",
    cyan: "bg-[#A78BFA] text-[#171717]",
    positive: "bg-[#65C98A] text-[#171717]",
    negative: "bg-[#FA7777] text-[#171717]",
    warning: "bg-[#F5C85B] text-[#171717]",
    dota: "bg-[#D94B43] text-white",
    mlbb: "bg-[#3479D4] text-white",
  }[tone];

  return (
    <section
      id={id}
      className={`relative scroll-mt-20 rounded-xl border-2 ${toneBorder} bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020] ${
        interactive
          ? "transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#202020]"
          : ""
      } ${className}`}
    >
      {hudTag && (
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`inline-block font-mono-num text-[10px] font-bold tracking-[0.14em] uppercase px-2 py-0.5 rounded border border-[#202020] shadow-[1px_1px_0px_#202020] ${tagColor}`}
          >
            {hudTag}
          </span>
          <MangaSparkle className="h-3 w-3 text-[#202020]/25" />
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Stat Card for KPI summaries
 */
export function StatCard({
  title,
  value,
  isNumeric = true,
  decimals = 0,
  suffix = "",
  prefix = "",
  description,
  icon,
  badgeText,
  accentColor = "#A78BFA",
}: {
  title: string;
  value: number | string;
  isNumeric?: boolean;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badgeText?: string;
  accentColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020] transition-transform hover:-translate-y-0.5">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 border-b-2 border-[#202020]"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono-num text-[11px] font-bold tracking-wider text-[#666666] uppercase">
            {title}
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            {isNumeric && typeof value === "number" ? (
              <span className="font-display text-3xl font-bold tracking-tight text-[#171717]">
                <CountUpNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
              </span>
            ) : (
              <span className="font-display text-2xl font-bold tracking-tight text-[#171717]">
                {value}
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#202020] bg-[#F7F4EC] shadow-[2px_2px_0px_#202020]">
            {icon}
          </div>
        )}
      </div>

      {(description || badgeText) && (
        <div className="mt-3 flex items-center justify-between border-t border-[#202020]/15 pt-2.5 text-xs text-[#666666]">
          <div>{description}</div>
          {badgeText && (
            <span className="font-mono-num font-bold text-[10px] uppercase px-1.5 py-0.5 rounded border border-[#202020] bg-[#F7F4EC]">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Game Profile Card (Dota 2 vs Mobile Legends)
 */
export function GameProfileCard({
  game,
  totalReviews,
  positiveReviews,
  negativeReviews,
  positivePct,
  negativePct,
  sourceLabel = "Steam Reviews",
  avgWordCount,
}: {
  game: "Dota 2" | "Mobile Legends";
  totalReviews: number;
  positiveReviews: number;
  negativeReviews: number;
  positivePct: number;
  negativePct: number;
  sourceLabel?: string;
  avgWordCount?: number;
}) {
  const isDota = game === "Dota 2";
  const headerBg = isDota ? "bg-[#D94B43]" : "bg-[#3479D4]";
  const headerText = "text-white";
  const accentBorder = "border-[#202020]";

  return (
    <div className={`overflow-hidden rounded-xl border-2 ${accentBorder} bg-[#FFFDFC] shadow-[3.5px_3.5px_0px_#202020]`}>
      {/* Game Card Header with Artwork & Badge */}
      <div className={`flex items-center justify-between border-b-2 border-[#202020] ${headerBg} p-4 ${headerText}`}>
        <div className="flex items-center gap-3">
          {isDota ? <DotaArtworkBadge /> : <MLBBArtworkBadge />}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-bold tracking-tight text-white">{game}</h3>
              <span className="rounded border border-black/40 bg-black/25 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-white">
                {isDota ? "PC MOBA" : "Mobile MOBA"}
              </span>
            </div>
            <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
              <Database className="h-3 w-3" />
              Sumber: {sourceLabel}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="block text-[11px] font-mono text-white/80 uppercase">Total Ulasan</span>
          <span className="font-display text-xl font-bold text-white">
            {totalReviews.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="p-4 space-y-4">
        {/* Progress Bar Sentimen */}
        <div>
          <div className="mb-1.5 flex justify-between text-xs font-bold text-[#171717]">
            <span className="flex items-center gap-1 text-[#228448]">
              <ThumbsUp className="h-3.5 w-3.5 text-[#65C98A]" />
              Positif: {positivePct.toFixed(1)}% ({positiveReviews.toLocaleString("id-ID")})
            </span>
            <span className="flex items-center gap-1 text-[#BA2A2A]">
              <ThumbsDown className="h-3.5 w-3.5 text-[#FA7777]" />
              Negatif: {negativePct.toFixed(1)}% ({negativeReviews.toLocaleString("id-ID")})
            </span>
          </div>

          <div className="h-4 w-full overflow-hidden rounded-lg border-2 border-[#202020] bg-[#FA7777] flex shadow-[1.5px_1.5px_0px_#202020]">
            <div
              className="h-full bg-[#65C98A] border-r-2 border-[#202020] transition-all duration-500"
              style={{ width: `${positivePct}%` }}
              title={`Positif: ${positivePct.toFixed(1)}%`}
            />
          </div>
        </div>

        {/* Quick Meta Stats */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#202020]/15">
          <div className="rounded-lg border border-[#202020] bg-[#F7F4EC] p-2.5">
            <span className="block text-[10px] font-mono font-semibold text-[#666666] uppercase">
              Rasio Sentimen (P : N)
            </span>
            <span className="font-display text-sm font-bold text-[#171717]">
              {(positiveReviews / Math.max(1, negativeReviews)).toFixed(2)} : 1
            </span>
          </div>

          <div className="rounded-lg border border-[#202020] bg-[#F7F4EC] p-2.5">
            <span className="block text-[10px] font-mono font-semibold text-[#666666] uppercase">
              Rata-rata Panjang Kata
            </span>
            <span className="font-display text-sm font-bold text-[#171717]">
              {avgWordCount ? `${avgWordCount.toFixed(1)} kata` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Model Metric Card (Accuracy, Precision, Recall, F1)
 */
export function ModelMetricCard({
  name,
  value,
  description,
  badge,
  isChampion = false,
}: {
  name: string;
  value: number; // 0 to 1 or 0 to 100
  description?: string;
  badge?: string;
  isChampion?: boolean;
}) {
  const pct = value <= 1 ? value * 100 : value;

  return (
    <div
      className={`relative rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[3px_3px_0px_#202020] ${
        isChampion ? "ring-2 ring-[#A78BFA]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono-num text-[11px] font-bold text-[#666666] uppercase">
          {name}
        </span>
        {badge && (
          <span className="rounded border border-[#202020] bg-[#A78BFA] px-1.5 py-0.5 text-[10px] font-bold text-[#171717]">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tracking-tight text-[#171717]">
          {pct.toFixed(2)}%
        </span>
      </div>

      {/* Progress pill */}
      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full border border-[#202020] bg-[#F7F4EC]">
        <div
          className="h-full bg-[#A78BFA] transition-all duration-500"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      {description && (
        <p className="mt-2 text-xs text-[#666666] leading-relaxed">{description}</p>
      )}
    </div>
  );
}

/**
 * Chart Container Card
 */
export function ChartCard({
  title,
  subtitle,
  children,
  badge,
  actions,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020] ${className}`}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#202020]/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-[#171717]">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-[#666666]">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/**
 * Section Header
 */
export function SectionHeader({
  title,
  subtitle,
  tag,
  action,
}: {
  title: string;
  subtitle?: string;
  tag?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
      <div>
        <div className="flex items-center gap-2">
          {tag && (
            <span className="rounded border border-[#202020] bg-[#A78BFA] px-2 py-0.5 font-mono-num text-[10px] font-bold tracking-wider text-[#171717] uppercase shadow-[1.5px_1.5px_0px_#202020]">
              {tag}
            </span>
          )}
          <h2 className="font-display text-xl font-bold tracking-tight text-[#171717]">{title}</h2>
        </div>
        {subtitle && <p className="mt-1 text-xs text-[#666666]">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
