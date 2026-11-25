"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  Database,
  Filter,
  History,
  MessageSquareText,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import {
  ScrollReveal,
  SectionNavigationBar,
  StaggerGroup,
  StaggerItem,
  type SectionAnchor,
} from "@/components/motion/ScrollPrimitives";
import { useGameSent } from "@/components/providers/GameSentProvider";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { HudCard } from "@/components/ui/HudCard";
import { AlgorithmBadge } from "@/components/ui/StatusBadge";
import type { GameFilter } from "@/lib/storage/local-storage";

const SentimentDonutChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then(
      (m) => m.SentimentDonutChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-lg bg-[#0D1224]" />
    ),
  }
);

const GameSentimentBarChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then(
      (m) => m.GameSentimentBarChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[270px] animate-pulse rounded-lg bg-[#0D1224]" />
    ),
  }
);

const DASHBOARD_SECTIONS: SectionAnchor[] = [
  { id: "sec-summary", code: "01", label: "Ringkasan" },
  { id: "sec-charts", code: "02", label: "Visualisasi Sentimen" },
  { id: "sec-models", code: "03", label: "Model & Aktivitas" },
];

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
      label: "All Games (Penelitian)",
      total: metadata.dataset.totalReviews,
      positive: metadata.dataset.positiveReviews,
      negative: metadata.dataset.negativeReviews,
      positivePct: metadata.dataset.positivePct,
      negativePct: metadata.dataset.negativePct,
    };
  }, [gameFilter, metadata.dataset, mlStats, dotaStats]);

  const gameComparisonChartData = useMemo(() => {
    const items = [
      {
        game: "Mobile Legends",
        positive: mlStats.positive,
        negative: mlStats.negative,
        positivePct: mlStats.positivePct,
        negativePct: mlStats.negativePct,
      },
      {
        game: "Dota 2",
        positive: dotaStats.positive,
        negative: dotaStats.negative,
        positivePct: dotaStats.positivePct,
        negativePct: dotaStats.negativePct,
      },
    ];
    if (gameFilter === "all") return items;
    return items.filter((i) => i.game === gameFilter);
  }, [gameFilter, mlStats, dotaStats]);

  const nbEval = metadata.models.naiveBayes.evaluation;
  const knnEval = metadata.models.knn.evaluation;

  return (
    <div className="space-y-6">
      <SectionNavigationBar sections={DASHBOARD_SECTIONS} />

      {/* Command Filter Banner */}
      <ScrollReveal variant="fade-up">
        <div className="flex flex-col gap-4 rounded-xl border border-[#263149] bg-[#0D1224]/90 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#22D3EE]" />
              <span className="font-mono-num text-[11px] font-semibold tracking-[0.16em] text-[#22D3EE] uppercase">
                Dataset Penelitian Aktif
              </span>
            </div>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Sumber:{" "}
              <code className="rounded bg-[#11182B] px-1.5 py-0.5 font-mono-num text-xs text-[#F1F5F9]">
                {metadata.sourceFile}
              </code>{" "}
              ({metadata.dataset.totalReviews.toLocaleString("id-ID")} ulasan berlabel, 0 nilai kosong)
            </p>
          </div>

          {/* Game Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
              <Filter className="h-3.5 w-3.5 text-[#8B5CF6]" />
              Filter Game:
            </span>
            {(["all", "Mobile Legends", "Dota 2"] as GameFilter[]).map((opt) => {
              const active = gameFilter === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updatePreferences({ dashboardGameFilter: opt })}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F1F5F9] shadow-[0_0_16px_-6px_rgba(139,92,246,0.7)]"
                      : "border-[#263149] bg-[#11182B] text-[#94A3B8] hover:border-[#3B82F6]/60 hover:text-[#F1F5F9]"
                  }`}
                >
                  {opt === "all" ? "All Games" : opt}
                </button>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* 5 Summary Cards with Stagger Animation */}
      <StaggerGroup
        id="sec-summary"
        staggerMs={75}
        staggerOnMount
        className="grid grid-cols-1 gap-4 scroll-mt-20 sm:grid-cols-2 xl:grid-cols-5"
      >
        <StaggerItem variant="slide-up">
          <HudCard tone="violet" interactive hudTag="Total Reviews">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#94A3B8]">
                  {gameFilter === "all" ? "Total Dataset Penelitian" : `Total (${gameFilter})`}
                </p>
                <p className="mt-1.5 text-3xl font-bold text-[#F1F5F9]">
                  <CountUpNumber value={filteredOverview.total} />
                </p>
                <p className="mt-2 font-mono-num text-[11px] text-[#94A3B8]">
                  Train {metadata.dataset.split.trainSize.toLocaleString("id-ID")} / Test{" "}
                  {metadata.dataset.split.testSize.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/12 p-2.5 text-[#A78BFA]">
                <MessageSquareText className="h-5 w-5" />
              </div>
            </div>
          </HudCard>
        </StaggerItem>

        <StaggerItem variant="slide-up">
          <HudCard tone="blue" interactive hudTag="Mobile Legends">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#94A3B8]">Review Mobile Legends</p>
                <p className="mt-1.5 text-3xl font-bold text-[#F1F5F9]">
                  <CountUpNumber value={mlStats.total} />
                </p>
                <p className="mt-2 font-mono-num text-[11px] text-[#93C5FD]">
                  {mlStats.positivePct}% Pos • {mlStats.negativePct}% Neg
                </p>
              </div>
              <div className="rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/12 p-2.5 text-[#60A5FA]">
                <Database className="h-5 w-5" />
              </div>
            </div>
          </HudCard>
        </StaggerItem>

        <StaggerItem variant="slide-up">
          <HudCard tone="cyan" interactive hudTag="Dota 2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#94A3B8]">Review Dota 2</p>
                <p className="mt-1.5 text-3xl font-bold text-[#F1F5F9]">
                  <CountUpNumber value={dotaStats.total} />
                </p>
                <p className="mt-2 font-mono-num text-[11px] text-[#67E8F9]">
                  {dotaStats.positivePct}% Pos • {dotaStats.negativePct}% Neg
                </p>
              </div>
              <div className="rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/12 p-2.5 text-[#22D3EE]">
                <Database className="h-5 w-5" />
              </div>
            </div>
          </HudCard>
        </StaggerItem>

        <StaggerItem variant="slide-up">
          <HudCard tone="positive" interactive hudTag="Positive Class">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#94A3B8]">Sentimen Positif</p>
                <p className="mt-1.5 text-3xl font-bold text-[#22C55E]">
                  <CountUpNumber value={filteredOverview.positive} />
                </p>
                <p className="mt-2 font-mono-num text-[11px] text-[#86EFAC]">
                  {filteredOverview.positivePct}% dari {filteredOverview.label}
                </p>
              </div>
              <div className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/12 p-2.5 text-[#22C55E]">
                <ThumbsUp className="h-5 w-5" />
              </div>
            </div>
          </HudCard>
        </StaggerItem>

        <StaggerItem variant="slide-up">
          <HudCard tone="negative" interactive hudTag="Negative Class">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#94A3B8]">Sentimen Negatif</p>
                <p className="mt-1.5 text-3xl font-bold text-[#F43F5E]">
                  <CountUpNumber value={filteredOverview.negative} />
                </p>
                <p className="mt-2 font-mono-num text-[11px] text-[#FDA4AF]">
                  {filteredOverview.negativePct}% dari {filteredOverview.label}
                </p>
              </div>
              <div className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/12 p-2.5 text-[#F43F5E]">
                <ThumbsDown className="h-5 w-5" />
              </div>
            </div>
          </HudCard>
        </StaggerItem>
      </StaggerGroup>

      {/* Main Charts Row: Fade & Scale for Chart + Slide Reveal for Game Stats */}
      <div
        id="sec-charts"
        className="grid grid-cols-1 gap-6 scroll-mt-20 lg:grid-cols-12"
      >
        <ScrollReveal variant="fade-scale" className="lg:col-span-5">
          <HudCard tone="violet" hudTag="Sentiment Overview" className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
                  Distribusi Sentimen
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Cakupan: {filteredOverview.label}
                </p>
              </div>
              <span className="font-mono-num rounded border border-[#263149] bg-[#080B18] px-2 py-1 text-xs text-[#94A3B8]">
                2 Kelas
              </span>
            </div>

            <SentimentDonutChart
              positive={filteredOverview.positive}
              negative={filteredOverview.negative}
              totalLabel={gameFilter === "all" ? "Total Ulasan" : gameFilter}
            />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#22C55E]/25 bg-[#22C55E]/8 p-3">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>Positive</span>
                  <span className="font-mono-num font-semibold text-[#22C55E]">
                    {filteredOverview.positivePct}%
                  </span>
                </div>
                <p className="font-mono-num mt-1 text-lg font-bold text-[#F1F5F9]">
                  {filteredOverview.positive.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="rounded-lg border border-[#F43F5E]/25 bg-[#F43F5E]/8 p-3">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>Negative</span>
                  <span className="font-mono-num font-semibold text-[#F43F5E]">
                    {filteredOverview.negativePct}%
                  </span>
                </div>
                <p className="font-mono-num mt-1 text-lg font-bold text-[#F1F5F9]">
                  {filteredOverview.negative.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </HudCard>
        </ScrollReveal>

        <ScrollReveal variant="slide-right" delay={0.08} className="lg:col-span-7">
          <HudCard tone="cyan" hudTag="Game Statistics" className="h-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
                  Perbandingan Sentimen Per Game
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Mobile Legends vs Dota 2 berdasarkan dataset berlabel penelitian
                </p>
              </div>
              <Link
                href="/comparison"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#22D3EE]/35 bg-[#22D3EE]/10 px-3 py-1.5 text-xs font-medium text-[#22D3EE] transition hover:bg-[#22D3EE]/20"
              >
                Detail Perbandingan
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-3">
              <GameSentimentBarChart data={gameComparisonChartData} mode="count" />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#F1F5F9]">
                    Mobile Legends
                  </span>
                  <span className="font-mono-num text-xs text-[#94A3B8]">
                    {mlStats.total.toLocaleString("id-ID")} ulasan
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F43F5E]/35">
                  <div
                    className="h-full bg-[#22C55E]"
                    style={{ width: `${mlStats.positivePct}%` }}
                  />
                </div>
                <p className="font-mono-num mt-1.5 text-[11px] text-[#94A3B8]">
                  Positif {mlStats.positive} ({mlStats.positivePct}%) • Negatif{" "}
                  {mlStats.negative} ({mlStats.negativePct}%)
                </p>
              </div>

              <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#F1F5F9]">Dota 2</span>
                  <span className="font-mono-num text-xs text-[#94A3B8]">
                    {dotaStats.total.toLocaleString("id-ID")} ulasan
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F43F5E]/35">
                  <div
                    className="h-full bg-[#22C55E]"
                    style={{ width: `${dotaStats.positivePct}%` }}
                  />
                </div>
                <p className="font-mono-num mt-1.5 text-[11px] text-[#94A3B8]">
                  Positif {dotaStats.positive} ({dotaStats.positivePct}%) • Negatif{" "}
                  {dotaStats.negative} ({dotaStats.negativePct}%)
                </p>
              </div>
            </div>
          </HudCard>
        </ScrollReveal>
      </div>

      {/* Bottom Row: Progressive Model Overview + Subtle Fade-Up Recent Activity */}
      <div
        id="sec-models"
        className="grid grid-cols-1 gap-6 scroll-mt-20 lg:grid-cols-12"
      >
        <ScrollReveal variant="fade-up" className="lg:col-span-6">
          <HudCard tone="blue" hudTag="Model Overview" className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
                  Arsitektur &amp; Performa Model
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Dievaluasi pada hold-out test set ({metadata.dataset.split.testSize} ulasan)
                </p>
              </div>
              <Link
                href="/models"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B82F6]/35 bg-[#3B82F6]/12 px-3 py-1.5 text-xs font-medium text-[#93C5FD] transition hover:bg-[#3B82F6]/20"
              >
                Evaluasi Lengkap
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <StaggerGroup staggerMs={85} className="mt-4 space-y-3">
              <StaggerItem variant="fade-up">
                <div className="rounded-lg border border-[#263149] bg-[#080B18]/75 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#22D3EE]" />
                      <span className="text-sm font-semibold text-[#F1F5F9]">
                        TF-IDF Vectorizer
                      </span>
                    </div>
                    <span className="font-mono-num rounded border border-[#22C55E]/35 bg-[#22C55E]/10 px-2 py-0.5 text-[11px] text-[#22C55E]">
                      {modelStatus.ready ? "Artefak Aktif" : "Memuat..."}
                    </span>
                  </div>
                  <p className="font-mono-num mt-1.5 text-xs text-[#94A3B8]">
                    Vocab: {metadata.models.tfidf.vocabularySize.toLocaleString("id-ID")} •
                    N-gram: (1, 2) • min_df: {metadata.models.tfidf.minDf} • Stopwords: English
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem variant="fade-up">
                <div className="rounded-lg border border-[#8B5CF6]/35 bg-[#8B5CF6]/8 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-[#A78BFA]" />
                      <span className="text-sm font-semibold text-[#F1F5F9]">
                        Multinomial Naive Bayes
                      </span>
                    </div>
                    <span className="font-mono-num text-xs font-semibold text-[#22C55E]">
                      Accuracy{" "}
                      <CountUpNumber
                        value={nbEval.accuracy * 100}
                        decimals={2}
                        suffix="%"
                      />
                    </span>
                  </div>
                  <div className="font-mono-num mt-2 grid grid-cols-3 gap-2 text-xs text-[#94A3B8]">
                    <div>
                      Precision (+):{" "}
                      <span className="text-[#F1F5F9]">
                        {(nbEval.precisionPositive * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      Recall (+):{" "}
                      <span className="text-[#F1F5F9]">
                        {(nbEval.recallPositive * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      F1 (+):{" "}
                      <span className="text-[#F1F5F9]">
                        {(nbEval.f1Positive * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </StaggerItem>

              <StaggerItem variant="fade-up">
                <div className="rounded-lg border border-[#22D3EE]/35 bg-[#22D3EE]/8 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-[#22D3EE]" />
                      <span className="text-sm font-semibold text-[#F1F5F9]">
                        K-Nearest Neighbors (k=5, cosine)
                      </span>
                    </div>
                    <span className="font-mono-num text-xs font-semibold text-[#22D3EE]">
                      Accuracy{" "}
                      <CountUpNumber
                        value={knnEval.accuracy * 100}
                        decimals={2}
                        suffix="%"
                      />
                    </span>
                  </div>
                  <div className="font-mono-num mt-2 grid grid-cols-3 gap-2 text-xs text-[#94A3B8]">
                    <div>
                      Precision (+):{" "}
                      <span className="text-[#F1F5F9]">
                        {(knnEval.precisionPositive * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      Recall (+):{" "}
                      <span className="text-[#F1F5F9]">
                        {(knnEval.recallPositive * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      F1 (+):{" "}
                      <span className="text-[#F1F5F9]">
                        {(knnEval.f1Positive * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            </StaggerGroup>
          </HudCard>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={0.08} className="lg:col-span-6">
          <HudCard
            tone="default"
            hudTag="Recent Local Activity"
            className="h-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
                  Riwayat Analisis Lokal (IndexedDB)
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Tersimpan di browser Anda secara lokal tanpa database eksternal
                </p>
              </div>
              <Link
                href="/analyzer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-3 py-1.5 text-xs font-medium text-[#C4B5FD] transition hover:bg-[#8B5CF6]/25"
              >
                Analisis Baru
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4">
              {historyLoading ? (
                <div className="space-y-2">
                  <div className="h-14 animate-pulse rounded-lg bg-[#080B18]" />
                  <div className="h-14 animate-pulse rounded-lg bg-[#080B18]" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#263149] bg-[#080B18]/60 px-6 py-10 text-center">
                  <History className="h-8 w-8 text-[#64748B]" />
                  <p className="mt-3 text-sm font-medium text-[#F1F5F9]">
                    Belum ada riwayat analisis lokal
                  </p>
                  <p className="mt-1 max-w-sm text-xs text-[#94A3B8]">
                    Jalankan prediksi teks di{" "}
                    <Link href="/analyzer" className="text-[#22D3EE] underline">
                      Sentiment Analyzer
                    </Link>{" "}
                    atau impor dataset tambahan di{" "}
                    <Link href="/datasets" className="text-[#22D3EE] underline">
                      Dataset Explorer
                    </Link>{" "}
                    untuk menyimpan sesi analisis lokal.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {history.slice(0, 6).map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#263149] bg-[#080B18]/80 p-3 transition hover:border-[#3B82F6]/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium text-[#F1F5F9]">
                            {session.sessionName}
                          </span>
                          <AlgorithmBadge algorithm={session.algorithm} />
                        </div>
                        <p className="font-mono-num mt-1 text-[11px] text-[#94A3B8]">
                          {new Date(session.createdAt).toLocaleString("id-ID")} •{" "}
                          {session.totalRows} baris •{" "}
                          <span className="text-[#22C55E]">
                            +{session.positiveCount}
                          </span>{" "}
                          /{" "}
                          <span className="text-[#F43F5E]">
                            -{session.negativeCount}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href="/reports"
                          className="rounded-md border border-[#263149] bg-[#11182B] px-2.5 py-1 text-xs text-[#94A3B8] hover:text-[#F1F5F9]"
                        >
                          Ekspor
                        </Link>
                        <button
                          type="button"
                          onClick={() => void removeSession(session.id)}
                          className="rounded-md border border-[#263149] bg-[#11182B] p-1.5 text-[#94A3B8] hover:border-[#F43F5E]/50 hover:text-[#F43F5E]"
                          title="Hapus sesi"
                          aria-label={`Hapus sesi ${session.sessionName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </HudCard>
        </ScrollReveal>
      </div>
    </div>
  );
}
