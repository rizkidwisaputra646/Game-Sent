"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  Clock,
  Cpu,
  Database,
  FileText,
  Frown,
  MessageSquareText,
  Scale,
  Search,
  Smile,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";
import { useGameSent } from "@/components/providers/GameSentProvider";
import {
  AnimeHeroPortrait,
  DotaArtworkBadge,
  MLBBArtworkBadge,
  MangaBurstTicks,
} from "@/components/ui/AnimeDecoration";
import {
  AnimatedSparkle,
  ComicPanelReveal,
  ComicPopCallout,
  ComicSpeechBubble,
  ComicStaggerGroup,
  ComicStaggerItem,
  ImpactBurst,
} from "@/components/motion/AnimeComicMotion";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import type { GameFilter } from "@/lib/storage/local-storage";

const SentimentDonutChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then(
      (m) => m.SentimentDonutChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] animate-pulse rounded-xl bg-[#F7F4EC]" />
    ),
  }
);

const DashboardModelPerfChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then(
      (m) => m.DashboardModelPerfChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] animate-pulse rounded-xl bg-[#F7F4EC]" />
    ),
  }
);

function MiniSparkline({
  color,
  fillId,
  points,
}: {
  color: string;
  fillId: string;
  points: string;
}) {
  return (
    <svg viewBox="0 0 110 38" className="h-9 w-24 shrink-0 overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`${points} L 108 36 L 2 36 Z`} fill={`url(#${fillId})`} />
      <path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const {
    metadata,
    modelStatus,
    history,
    historyLoading,
    removeSession,
    preferences,
    updatePreferences,
  } = useGameSent();

  const [modelView, setModelView] = useState<"summary" | "naive_bayes" | "knn">("summary");
  const [heroBubbleHovered, setHeroBubbleHovered] = useState(false);

  const gameFilter = preferences.dashboardGameFilter;
  const mlStats = metadata.dataset.games["Mobile Legends"];
  const dotaStats = metadata.dataset.games["Dota 2"];

  const filteredOverview = useMemo(() => {
    if (gameFilter === "Mobile Legends") {
      return {
        label: "Mobile Legends",
        total: mlStats.total,
        positive: mlStats.positive,
        negative: mlStats.negative,
        positivePct: mlStats.positivePct,
        negativePct: mlStats.negativePct,
      };
    }
    if (gameFilter === "Dota 2") {
      return {
        label: "Dota 2",
        total: dotaStats.total,
        positive: dotaStats.positive,
        negative: dotaStats.negative,
        positivePct: dotaStats.positivePct,
        negativePct: dotaStats.negativePct,
      };
    }
    return {
      label: "All Games",
      total: metadata.dataset.totalReviews,
      positive: metadata.dataset.positiveReviews,
      negative: metadata.dataset.negativeReviews,
      positivePct: metadata.dataset.positivePct,
      negativePct: metadata.dataset.negativePct,
    };
  }, [gameFilter, metadata.dataset, mlStats, dotaStats]);

  const nbEval = metadata.models.naiveBayes.evaluation;
  const knnEval = metadata.models.knn.evaluation;

  const modelChartItems = useMemo(() => {
    if (modelView === "naive_bayes") {
      return [
        { name: "Accuracy", value: nbEval.accuracy * 100, color: "#A78BFA" },
        { name: "Precision", value: nbEval.precisionPositive * 100, color: "#65C98A" },
        { name: "Recall", value: nbEval.recallPositive * 100, color: "#F5C85B" },
        { name: "F1-Score", value: nbEval.f1Positive * 100, color: "#3479D4" },
      ];
    }
    if (modelView === "knn") {
      return [
        { name: "Accuracy", value: knnEval.accuracy * 100, color: "#E8BC55" },
        { name: "Precision", value: knnEval.precisionPositive * 100, color: "#65C98A" },
        { name: "Recall", value: knnEval.recallPositive * 100, color: "#FA7777" },
        { name: "F1-Score", value: knnEval.f1Positive * 100, color: "#3479D4" },
      ];
    }
    return [
      { name: "Naive Bayes (Acc)", value: nbEval.accuracy * 100, color: "#A78BFA" },
      { name: "Naive Bayes (F1)", value: nbEval.f1Positive * 100, color: "#F5C85B" },
      { name: "KNN k=5 (Acc)", value: knnEval.accuracy * 100, color: "#FA7777" },
    ];
  }, [modelView, nbEval, knnEval]);

  return (
    <div className="space-y-4">
      {/* HERO SECTION WITH EDITORIAL SHAPES, SPARKLES & ANIME CHARACTER */}
      <div className="relative pt-1 pb-2">
        {/* Geometric Editorial Shards behind hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 left-0 hidden sm:block h-10 w-10 border-t-2 border-l-2 border-[#202020]/30 -skew-x-12"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-4 right-[28%] hidden md:block h-10 w-24 -skew-x-12 rounded-sm border-2 border-[#202020] bg-[#F5C85B]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-7 right-[22%] hidden md:block h-9 w-28 -skew-x-12 rounded-sm border-2 border-[#202020] bg-[#DDD6FE]"
        />
        <AnimatedSparkle className="hidden md:block absolute top-0 left-[46%] h-6 w-6 text-[#A78BFA]" />
        <AnimatedSparkle className="hidden md:block absolute top-9 left-[49%] h-3.5 w-3.5 text-[#F5C85B]" delay={1.2} />

        {/* Anime Character with Idle Float + Interactive Comic Speech Bubble */}
        <div
          className="hidden lg:block absolute -top-12 right-12 z-10 w-[195px] h-[205px]"
          onMouseEnter={() => setHeroBubbleHovered(true)}
          onMouseLeave={() => setHeroBubbleHovered(false)}
        >
          <div className="pointer-events-none w-full h-full">
            <AnimeHeroPortrait className="w-full h-full object-contain object-top" />
          </div>
          {(heroBubbleHovered || modelStatus.ready) && (
            <div className="pointer-events-none absolute -left-24 top-3 z-30">
              <ComicSpeechBubble tailPosition="bottom-right">
                {heroBubbleHovered ? (
                  <span className="text-[#8060D8]">SIAP ANALISIS!</span>
                ) : (
                  <span className="font-mono text-[10px]">
                    {gameFilter === "all" ? "DATA READY!" : `FILTER: ${gameFilter.toUpperCase()}`}
                  </span>
                )}
              </ComicSpeechBubble>
            </div>
          )}
        </div>

        <div className="relative z-20 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:pr-[220px]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#171717] sm:text-[38px] leading-none">
                Dashboard Overview
              </h1>
              {modelStatus.ready && (
                <ComicPopCallout text="DATA READY!" tone="primary" tilt={-2} />
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-[#555555]">
              Gaming sentiment insights at a glance — TF-IDF, Naive Bayes &amp; KNN ({metadata.dataset.totalReviews.toLocaleString("id-ID")} ulasan).
            </p>
          </div>

          {/* Compact Game Filter Pills */}
          <div className="inline-flex items-center gap-1 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-1 shadow-[2px_2px_0px_#202020] self-start">
            {(["all", "Dota 2", "Mobile Legends"] as GameFilter[]).map((opt) => {
              const active = gameFilter === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updatePreferences({ dashboardGameFilter: opt })}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#A78BFA] text-[#171717] border border-[#202020]"
                      : "text-[#666666] hover:text-[#171717]"
                  }`}
                >
                  {opt === "all" ? "All Games" : opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 1: STAGGERED GAME PROFILE CARDS + 3-IN-1 SUMMARY CARD */}
      <ComicStaggerGroup staggerMs={70} className="relative z-20 grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Card 1: Dota 2 */}
        <ComicStaggerItem className="md:col-span-6 lg:col-span-3">
          <Link
            href="/comparison"
            className="block h-full group rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[3px_3px_0px_#202020] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_#202020] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#202020]"
          >
            <div className="flex items-center gap-3">
              <DotaArtworkBadge className="h-11 w-11" />
              <div className="min-w-0">
                <h2 className="font-display text-base font-extrabold text-[#171717] truncate">
                  Dota 2
                </h2>
                <p className="text-xs font-medium text-[#666666]">Steam Reviews</p>
              </div>
            </div>

            <div className="mt-3.5 flex items-end justify-between gap-2">
              <div>
                <div className="font-display text-2xl font-extrabold tracking-tight text-[#171717] leading-none">
                  <CountUpNumber value={dotaStats.total} durationMs={700} />
                </div>
                <div className="mt-1 text-[11px] font-semibold text-[#666666]">
                  Total Reviews
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="font-mono-num text-xs font-bold text-[#D94B43]">
                  {dotaStats.positivePct.toFixed(1)}% Pos
                </span>
                <MiniSparkline
                  color="#D94B43"
                  fillId="dotaSpark"
                  points="M 2 28 C 18 27, 24 20, 38 22 C 52 24, 62 12, 76 14 C 90 16, 98 8, 108 6"
                />
              </div>
            </div>
          </Link>
        </ComicStaggerItem>

        {/* Card 2: Mobile Legends */}
        <ComicStaggerItem className="md:col-span-6 lg:col-span-4">
          <Link
            href="/comparison"
            className="block h-full group rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[3px_3px_0px_#202020] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_#202020] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#202020]"
          >
            <div className="flex items-center gap-3">
              <MLBBArtworkBadge className="h-11 w-11" />
              <div className="min-w-0">
                <h2 className="font-display text-base font-extrabold text-[#171717] truncate">
                  Mobile Legends
                </h2>
                <p className="text-xs font-medium text-[#666666]">Play Store Reviews</p>
              </div>
            </div>

            <div className="mt-3.5 flex items-end justify-between gap-2">
              <div>
                <div className="font-display text-2xl font-extrabold tracking-tight text-[#171717] leading-none">
                  <CountUpNumber value={mlStats.total} durationMs={700} />
                </div>
                <div className="mt-1 text-[11px] font-semibold text-[#666666]">
                  Total Reviews
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="font-mono-num text-xs font-bold text-[#3479D4]">
                  {mlStats.positivePct.toFixed(1)}% Pos
                </span>
                <MiniSparkline
                  color="#3479D4"
                  fillId="mlbbSpark"
                  points="M 2 30 C 16 26, 26 24, 42 20 C 56 16, 68 22, 82 14 C 94 7, 102 10, 108 6"
                />
              </div>
            </div>
          </Link>
        </ComicStaggerItem>

        {/* Card 3: 3-in-1 Summary Card with Subtle Impact Burst */}
        <ComicStaggerItem className="md:col-span-12 lg:col-span-5">
          <div
            key={gameFilter}
            className="relative h-full overflow-hidden rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[3px_3px_0px_#202020]"
          >
            <ImpactBurst
              color="#A78BFA"
              className="absolute -top-8 -right-8 w-28 h-28 opacity-25"
            />

            <div className="relative z-10 grid h-full grid-cols-3 divide-x-2 divide-[#202020]/10">
              {/* Total Dataset */}
              <div className="flex flex-col justify-between pr-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-1.5 border-[#202020] bg-[#DDD6FE]">
                    <MessageSquareText className="h-3.5 w-3.5 text-[#171717]" />
                  </span>
                  <span className="text-xs font-bold text-[#171717] leading-tight">
                    Total Dataset
                  </span>
                </div>
                <div className="mt-3">
                  <div className="font-display text-2xl font-extrabold text-[#171717] leading-none">
                    <CountUpNumber value={filteredOverview.total} durationMs={650} />
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-[#666666]">
                    {gameFilter === "all" ? "Reviews" : gameFilter}
                  </div>
                </div>
              </div>

              {/* Positive */}
              <div className="flex flex-col justify-between px-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-1.5 border-[#202020] bg-[#65C98A]">
                    <Smile className="h-4 w-4 text-[#171717]" />
                  </span>
                  <span className="text-xs font-bold text-[#171717] leading-tight">
                    Positive
                  </span>
                </div>
                <div className="mt-3">
                  <div className="font-display text-2xl font-extrabold text-[#171717] leading-none">
                    <CountUpNumber value={filteredOverview.positive} durationMs={650} />
                  </div>
                  <div className="mt-1 font-mono-num text-[11px] font-bold text-[#228448]">
                    {filteredOverview.positivePct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Negative */}
              <div className="flex flex-col justify-between pl-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-1.5 border-[#202020] bg-[#FA7777]">
                    <Frown className="h-4 w-4 text-[#171717]" />
                  </span>
                  <span className="text-xs font-bold text-[#171717] leading-tight">
                    Negative
                  </span>
                </div>
                <div className="mt-3">
                  <div className="font-display text-2xl font-extrabold text-[#171717] leading-none">
                    <CountUpNumber value={filteredOverview.negative} durationMs={650} />
                  </div>
                  <div className="mt-1 font-mono-num text-[11px] font-bold text-[#BA2A2A]">
                    {filteredOverview.negativePct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ComicStaggerItem>
      </ComicStaggerGroup>

      {/* ROW 2: SENTIMENT DISTRIBUTION + MODEL PERFORMANCE + QUICK ACCESS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Card 4: Sentiment Distribution */}
        <ComicPanelReveal direction="up" delay={0.05} className="lg:col-span-4">
          <div className="h-full rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[3px_3px_0px_#202020]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border-1.5 border-[#202020] bg-[#DDD6FE]">
                  <BarChart2 className="h-3.5 w-3.5 text-[#171717]" />
                </span>
                <h2 className="font-display text-sm font-extrabold text-[#171717]">
                  Sentiment Distribution
                </h2>
              </div>
              <MangaBurstTicks className="h-4 w-4 text-[#202020]/70" />
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
              <div className="sm:col-span-7">
                <SentimentDonutChart
                  positive={filteredOverview.positive}
                  negative={filteredOverview.negative}
                  totalLabel="Positive"
                  centerHighlight="positivePct"
                />
              </div>

              <div className="sm:col-span-5 space-y-3 pl-1">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#65C98A] border border-[#202020]" />
                  <div>
                    <div className="text-xs font-bold text-[#171717]">Positive</div>
                    <div className="font-mono-num text-xs font-semibold text-[#666666]">
                      {filteredOverview.positive.toLocaleString("id-ID")} ({filteredOverview.positivePct.toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#FA7777] border border-[#202020]" />
                  <div>
                    <div className="text-xs font-bold text-[#171717]">Negative</div>
                    <div className="font-mono-num text-xs font-semibold text-[#666666]">
                      {filteredOverview.negative.toLocaleString("id-ID")} ({filteredOverview.negativePct.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ComicPanelReveal>

        {/* Card 5: Model Performance */}
        <ComicPanelReveal direction="up" delay={0.1} className="lg:col-span-5">
          <div className="h-full rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[3px_3px_0px_#202020]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border-1.5 border-[#202020] bg-[#DDD6FE]">
                  <Trophy className="h-3.5 w-3.5 text-[#171717]" />
                </span>
                <h2 className="font-display text-sm font-extrabold text-[#171717]">
                  Model Performance
                </h2>
              </div>

              <select
                value={modelView}
                onChange={(e) => setModelView(e.target.value as "summary" | "naive_bayes" | "knn")}
                aria-label="Pilih tampilan metrik model"
                className="rounded-lg border-1.5 border-[#202020] bg-[#FFFDFC] px-2.5 py-1 text-xs font-bold text-[#171717] cursor-pointer"
              >
                <option value="summary">All Models (Test)</option>
                <option value="naive_bayes">Naive Bayes</option>
                <option value="knn">KNN (k=5)</option>
              </select>
            </div>

            <div className="mt-2">
              <DashboardModelPerfChart items={modelChartItems} />
            </div>
          </div>
        </ComicPanelReveal>

        {/* Card 6: Quick Access */}
        <ComicPanelReveal direction="up" delay={0.15} className="lg:col-span-3">
          <div className="h-full rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[3px_3px_0px_#202020] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#171717]" />
                <h2 className="font-display text-sm font-extrabold text-[#171717]">
                  Quick Access
                </h2>
              </div>
              <MangaBurstTicks className="h-4 w-4 text-[#202020]/70" />
            </div>

            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {[
                {
                  href: "/analyzer",
                  label: "Sentiment Analyzer",
                  icon: Search,
                  bg: "bg-[#DDD6FE]",
                },
                {
                  href: "/comparison",
                  label: "Comparison",
                  icon: Scale,
                  bg: "bg-[#F5C85B]/60",
                },
                {
                  href: "/reports",
                  label: "Reports",
                  icon: FileText,
                  bg: "bg-[#65C98A]/50",
                },
                {
                  href: "/datasets",
                  label: "Datasets",
                  icon: Database,
                  bg: "bg-[#FA7777]/45",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl border-1.5 border-[#202020]/35 bg-[#F7F4EC]/55 px-3 py-2 text-xs font-bold text-[#171717] transition-all hover:border-[#202020] hover:bg-[#DDD6FE]/45 hover:translate-x-0.5 active:translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[#202020] ${item.bg}`}
                      >
                        <Icon className="h-3.5 w-3.5 text-[#171717]" />
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#666666]" />
                  </Link>
                );
              })}
            </div>
          </div>
        </ComicPanelReveal>
      </div>

      {/* ROW 3: RECENT ACTIVITY + EXPLORE MORE BANNER */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Card 7: Recent Activity */}
        <ComicPanelReveal direction="left" delay={0.08} className="lg:col-span-5">
          <div className="h-full rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[3px_3px_0px_#202020] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#202020]/15">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#171717]" />
                <h2 className="font-display text-sm font-extrabold text-[#171717]">
                  Recent Activity
                </h2>
              </div>
              <Link
                href="/datasets"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#171717] hover:text-[#8060D8]"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-2.5 flex-1">
              {historyLoading ? (
                <div className="space-y-2 py-2">
                  <div className="h-7 animate-pulse rounded bg-[#F7F4EC]" />
                  <div className="h-7 animate-pulse rounded bg-[#F7F4EC]" />
                  <div className="h-7 animate-pulse rounded bg-[#F7F4EC]" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex h-full min-h-[108px] flex-col items-center justify-center rounded-lg border border-dashed border-[#202020]/25 bg-[#F7F4EC]/50 p-4 text-center">
                  <p className="text-xs font-bold text-[#171717]">
                    Belum ada aktivitas analisis lokal
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#666666]">
                    Hasil uji ulasan &amp; impor dataset akan tercatat otomatis di IndexedDB.
                  </p>
                  <Link
                    href="/analyzer"
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border-1.5 border-[#202020] bg-[#A78BFA] px-3 py-1 text-[11px] font-bold text-[#171717] shadow-[1.5px_1.5px_0px_#202020] hover:bg-[#906CF7]"
                  >
                    Coba Analyzer <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-[#202020]/10">
                  {history.slice(0, 4).map((session, i) => {
                    const dotColor =
                      i === 0
                        ? "bg-[#65C98A]"
                        : i === 1
                        ? "bg-[#F5C85B]"
                        : "bg-[#A78BFA]";
                    return (
                      <li
                        key={session.id}
                        className="flex items-center justify-between gap-2 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
                          <span className="truncate font-semibold text-[#171717]">
                            {session.sessionName}
                          </span>
                          <span className="hidden sm:inline shrink-0 rounded border border-[#202020]/20 bg-[#F7F4EC] px-1.5 py-0.2 font-mono text-[10px] text-[#666666]">
                            {session.algorithm === "naive_bayes" ? "NB" : "KNN"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[11px] text-[#666666]">
                            {session.totalRows} row
                          </span>
                          <button
                            type="button"
                            onClick={() => void removeSession(session.id)}
                            aria-label={`Hapus sesi ${session.sessionName}`}
                            className="text-[#666666] hover:text-[#BA2A2A] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </ComicPanelReveal>

        {/* Card 8: Explore More with GameSent (Lavender + Halftone Drift + Reference Artworks) */}
        <ComicPanelReveal direction="right" delay={0.12} className="lg:col-span-7">
          <div className="relative h-full overflow-hidden rounded-xl border-2 border-[#202020] bg-[#DDD6FE] p-5 shadow-[3px_3px_0px_#202020] flex flex-col justify-center min-h-[164px]">
            {/* Slow subtle halftone drift */}
            <div
              aria-hidden="true"
              className="manga-halftone-drift pointer-events-none absolute top-0 left-0 h-full w-56 opacity-15"
            />

            {/* Slanted Artwork Panels on Right using Reference Dota 2 & MLBB Art */}
            <div
              aria-hidden="true"
              className="hidden sm:flex absolute top-0 right-0 bottom-0 w-[49%] items-stretch pointer-events-none"
            >
              {/* Dota 2 Reference Panel */}
              <div className="relative flex-1 overflow-hidden border-l-2 border-[#202020] bg-[#171717] -skew-x-12 translate-x-4">
                <Image
                  src="/images/dota-art.jpg"
                  alt="Dota 2 Reference Artwork"
                  fill
                  className="object-cover object-top opacity-90 skew-x-12 scale-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-2 text-center skew-x-12">
                  <span className="rounded bg-[#D94B43] border border-[#202020] px-2 py-0.5 font-display text-[10px] font-extrabold tracking-wider text-white uppercase shadow-[1.5px_1.5px_0px_#202020]">
                    DOTA 2
                  </span>
                </div>
              </div>

              {/* Mobile Legends Reference Panel */}
              <div className="relative flex-1 overflow-hidden border-l-2 border-[#202020] bg-[#1E3A8A] -skew-x-12 translate-x-3">
                <Image
                  src="/images/mlbb-art.jpg"
                  alt="Mobile Legends Reference Artwork"
                  fill
                  className="object-cover object-top opacity-95 skew-x-12 scale-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-2 text-center skew-x-12">
                  <span className="rounded bg-[#3479D4] border border-[#202020] px-2 py-0.5 font-display text-[10px] font-extrabold tracking-wider text-[#E8BC55] uppercase shadow-[1.5px_1.5px_0px_#202020]">
                    MLBB
                  </span>
                </div>
              </div>
            </div>

            {/* Left Text Content */}
            <div className="relative z-10 max-w-full sm:max-w-[53%]">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold leading-tight text-[#171717]">
                Explore More
                <br />
                with GameSent
              </h2>
              <p className="mt-1.5 text-xs font-medium text-[#333333] leading-snug">
                Uji ulasan pemain secara langsung atau selami evaluasi mendalam antar-algoritma.
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <Link
                  href="/analyzer"
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#202020] bg-[#171717] px-4 py-2 text-xs font-bold text-[#FFFDFC] shadow-[2px_2px_0px_#FFFDFC] transition-all hover:-translate-y-0.5 hover:bg-[#333333] active:translate-y-0.5"
                >
                  Go to Analysis <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/models"
                  className="inline-flex items-center gap-1 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] px-3 py-2 text-xs font-bold text-[#171717] shadow-[2px_2px_0px_#202020] hover:bg-[#F7F4EC] active:translate-y-0.5"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  Models
                </Link>
              </div>
            </div>
          </div>
        </ComicPanelReveal>
      </div>
    </div>
  );
}
