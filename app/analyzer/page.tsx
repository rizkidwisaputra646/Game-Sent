"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  Clock,
  Cpu,
  Download,
  FileText,
  Layers,
  Play,
  Radar,
  RotateCcw,
  Sparkles,
  Tag,
} from "lucide-react";
import {
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/ScrollPrimitives";
import { useGameSent } from "@/components/providers/GameSentProvider";
import { HudCard } from "@/components/ui/HudCard";
import { AlgorithmBadge, SentimentBadge } from "@/components/ui/StatusBadge";
import {
  buildReportPayloadFromSession,
  exportReportCsv,
  exportReportPdf,
  exportReportXlsx,
} from "@/lib/export/exporters";
import { inferenceClient } from "@/lib/ml/client";
import type { AlgorithmId, SinglePredictionResult } from "@/lib/ml/types";
import type { AnalyzedRowResult } from "@/lib/storage/indexed-db";

const EXAMPLE_REVIEWS = [
  {
    label: "Positif (Gameplay & Tim)",
    text: "Great game and probably the best MOBA out there. Team fights are chaotic but fun, hero balance feels rewarding with friends.",
  },
  {
    label: "Negatif (Matchmaking & Lag)",
    text: "Terrible matchmaking system, constant lag spikes, toxic teammates and greedy skin prices make ranked unplayable.",
  },
  {
    label: "Campuran / Kritis",
    text: "Gameplay mechanics are awesome and deep, however bad servers and frequent disconnects ruin the competitive experience.",
  },
];

export default function AnalyzerPage() {
  const shouldReduceMotion = useReducedMotion();
  const {
    metadata,
    modelStatus,
    preferences,
    updatePreferences,
    saveSession,
  } = useGameSent();

  const [mode, setMode] = useState<"single" | "batch">("single");
  const [algorithm, setAlgorithm] = useState<AlgorithmId>(
    preferences.preferredAlgorithm
  );

  // Single state
  const [singleText, setSingleText] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<SinglePredictionResult | null>(
    null
  );

  // Batch state
  const [batchText, setBatchText] = useState("");
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    stage: string;
    processed: number;
    total: number;
  } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchSummary, setBatchSummary] = useState<{
    total: number;
    positive: number;
    negative: number;
    failed: number;
    durationMs: number;
    algorithm: AlgorithmId;
    rows: AnalyzedRowResult[];
  } | null>(null);

  const handleAlgorithmChange = (nextAlgo: AlgorithmId) => {
    setAlgorithm(nextAlgo);
    updatePreferences({ preferredAlgorithm: nextAlgo });
  };

  const handleAnalyzeSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError(null);

    if (!singleText.trim()) {
      setSingleError("Masukkan teks ulasan game terlebih dahulu sebelum menganalisis.");
      return;
    }

    setSingleLoading(true);
    try {
      const res = await inferenceClient.predictSingle(singleText, algorithm);
      setSingleResult(res);

      // Persist single prediction to IndexedDB history
      await saveSession({
        id: `single-${Date.now()}`,
        sessionName:
          singleText.trim().slice(0, 42) +
          (singleText.trim().length > 42 ? "..." : ""),
        sourceType: "single",
        createdAt: new Date().toISOString(),
        algorithm,
        totalRows: 1,
        positiveCount: res.predictedLabel === "positive" ? 1 : 0,
        negativeCount: res.predictedLabel === "negative" ? 1 : 0,
        failedCount: 0,
        status: "completed",
        durationMs: res.processingTimeMs,
        rows: [
          {
            rowIndex: 1,
            review: res.originalText,
            cleanedText: res.cleanedText,
            predictedLabel: res.predictedLabel,
            score: res.score,
            scoreType: res.scoreType,
            processingTimeMs: res.processingTimeMs,
          },
        ],
      });
    } catch (err) {
      setSingleError(
        err instanceof Error ? err.message : "Gagal melakukan prediksi sentimen."
      );
    } finally {
      setSingleLoading(false);
    }
  };

  const handleClearSingle = () => {
    setSingleText("");
    setSingleResult(null);
    setSingleError(null);
  };

  const handleAnalyzeBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchError(null);

    const lines = batchText
      .split(/\r?\n/)
      .map((l) => l.trim());
    const nonEmptyLines = lines.filter((l) => l.length > 0);

    if (nonEmptyLines.length === 0) {
      setBatchError("Masukkan minimal satu baris ulasan (satu ulasan per baris).");
      return;
    }
    if (nonEmptyLines.length > 5000) {
      setBatchError(
        "Maksimal 5.000 baris untuk analisis teks langsung. Gunakan Dataset Explorer untuk file CSV/XLSX besar."
      );
      return;
    }

    setBatchRunning(true);
    setBatchProgress({
      stage: "preprocessing",
      processed: 0,
      total: lines.length,
    });

    try {
      const items = lines.map((review, idx) => ({
        rowIndex: idx + 1,
        review,
      }));

      const res = await inferenceClient.predictBatch(items, algorithm, (prog) => {
        setBatchProgress(prog);
      });

      const positive = res.results.filter(
        (r) => r.predictedLabel === "positive"
      ).length;
      const negative = res.results.filter(
        (r) => r.predictedLabel === "negative"
      ).length;

      const summary = {
        total: items.length,
        positive,
        negative,
        failed: res.failedCount,
        durationMs: res.durationMs,
        algorithm,
        rows: res.results,
      };
      setBatchSummary(summary);

      await saveSession({
        id: `batch-${Date.now()}`,
        sessionName: `Batch Analyzer (${res.results.length} ulasan)`,
        sourceType: "batch",
        createdAt: new Date().toISOString(),
        algorithm,
        totalRows: res.results.length,
        positiveCount: positive,
        negativeCount: negative,
        failedCount: res.failedCount,
        status: res.failedCount > 0 ? "partial" : "completed",
        durationMs: res.durationMs,
        rows: res.results,
      });
    } catch (err) {
      setBatchError(
        err instanceof Error ? err.message : "Gagal menjalankan batch analysis."
      );
    } finally {
      setBatchRunning(false);
    }
  };

  const handleBatchExport = async (fmt: "csv" | "xlsx" | "pdf") => {
    if (!batchSummary) return;
    const payload = buildReportPayloadFromSession({
      title: `Batch Sentiment Analysis (${batchSummary.rows.length} ulasan)`,
      datasetSource: "Input Batch Manual (Sentiment Analyzer)",
      algorithm: batchSummary.algorithm,
      rows: batchSummary.rows,
      metadata,
    });
    if (fmt === "csv") exportReportCsv(payload);
    if (fmt === "xlsx") await exportReportXlsx(payload);
    if (fmt === "pdf") await exportReportPdf(payload);
  };

  return (
    <div className="space-y-6">
      {/* Mode & Algorithm Selector Bar */}
      <HudCard tone="violet" hudTag="Inference Configuration">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                mode === "single"
                  ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F1F5F9]"
                  : "border-[#263149] bg-[#080B18] text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              <Radar className="h-4 w-4 text-[#A78BFA]" />
              Single Review
            </button>
            <button
              type="button"
              onClick={() => setMode("batch")}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                mode === "batch"
                  ? "border-[#22D3EE] bg-[#22D3EE]/15 text-[#F1F5F9]"
                  : "border-[#263149] bg-[#080B18] text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              <Layers className="h-4 w-4 text-[#22D3EE]" />
              Batch Analysis
            </button>
          </div>

          {/* Algorithm Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#94A3B8]">Algoritma Klasifikasi:</span>
            <button
              type="button"
              onClick={() => handleAlgorithmChange("naive_bayes")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                algorithm === "naive_bayes"
                  ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F1F5F9]"
                  : "border-[#263149] bg-[#080B18] text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#A78BFA]" />
              Multinomial Naive Bayes
            </button>
            <button
              type="button"
              onClick={() => handleAlgorithmChange("knn")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                algorithm === "knn"
                  ? "border-[#22D3EE] bg-[#22D3EE]/18 text-[#F1F5F9]"
                  : "border-[#263149] bg-[#080B18] text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              <Cpu className="h-3.5 w-3.5 text-[#22D3EE]" />
              K-Nearest Neighbors (k=5)
            </button>
          </div>
        </div>
      </HudCard>

      {mode === "single" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Input Panel (Fade Up) */}
          <ScrollReveal variant="fade-up" className="lg:col-span-6">
          <HudCard tone="blue" hudTag="Input Ulasan" className="h-full">
            <form onSubmit={handleAnalyzeSingle} className="space-y-4">
              <div>
                <label
                  htmlFor="single-review-input"
                  className="block font-display text-base font-semibold text-[#F1F5F9]"
                >
                  Teks Ulasan Game
                </label>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Model dilatih pada ulasan berbahasa Inggris (Dota 2 &amp; Mobile
                  Legends). Hasil prediksi bukan kebenaran mutlak (ground truth).
                </p>
                <textarea
                  id="single-review-input"
                  rows={6}
                  value={singleText}
                  onChange={(e) => setSingleText(e.target.value)}
                  placeholder="Contoh: Great MOBA mechanics, fun ranked matches with friends, though matchmaking takes time..."
                  className="mt-3 w-full rounded-xl border border-[#263149] bg-[#080B18] p-3.5 text-sm text-[#F1F5F9] placeholder-[#64748B] focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>

              {/* Example quick chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-[#94A3B8]">Contoh cepat:</span>
                {EXAMPLE_REVIEWS.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => setSingleText(ex.text)}
                    className="rounded-md border border-[#263149] bg-[#0D1224] px-2.5 py-1 text-[11px] text-[#CBD5E1] transition hover:border-[#3B82F6]/60 hover:text-[#F1F5F9]"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              {singleError && (
                <div className="flex items-start gap-2 rounded-lg border border-[#F43F5E]/40 bg-[#F43F5E]/10 p-3 text-xs text-[#FDA4AF]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{singleError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={singleLoading || (!modelStatus.ready && modelStatus.loading)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(139,92,246,0.9)] transition hover:opacity-95 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {singleLoading ? "Menganalisis..." : "Analyze"}
                </button>
                <button
                  type="button"
                  onClick={handleClearSingle}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#263149] bg-[#080B18] px-4 py-2.5 text-sm text-[#94A3B8] transition hover:text-[#F1F5F9]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear
                </button>
              </div>
            </form>
          </HudCard>
          </ScrollReveal>

          {/* Prediction Result Panel (Fade & Scale) */}
          <ScrollReveal variant="fade-scale" delay={0.06} className="lg:col-span-6">
          <HudCard
            className="h-full"
            tone={
              singleResult
                ? singleResult.predictedLabel === "positive"
                  ? "positive"
                  : "negative"
                : "default"
            }
            hudTag="Prediction Output"
          >
            {!singleResult ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                <Radar className="h-10 w-10 text-[#64748B]" />
                <p className="mt-3 font-display text-base font-medium text-[#F1F5F9]">
                  Siap Menjalankan Inferensi Lokal
                </p>
                <p className="mt-1 max-w-sm text-xs text-[#94A3B8]">
                  Masukkan teks ulasan lalu tekan <strong>Analyze</strong>. TF-IDF,
                  Multinomial Naive Bayes, dan KNN berjalan langsung di Web Worker browser.
                </p>
              </div>
            ) : (
              <motion.div
                key={`${singleResult.algorithm}-${singleResult.predictedLabel}-${singleResult.processingTimeMs}`}
                initial={
                  shouldReduceMotion ? false : { opacity: 0.75, scale: 0.985 }
                }
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#263149] pb-3">
                  <div className="flex items-center gap-2.5">
                    <SentimentBadge sentiment={singleResult.predictedLabel} />
                    <AlgorithmBadge algorithm={singleResult.algorithm} />
                  </div>
                  <div className="font-mono-num flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <Clock className="h-3.5 w-3.5 text-[#22D3EE]" />
                    {singleResult.processingTimeMs.toFixed(2)} ms
                  </div>
                </div>

                {/* Confidence or Neighbor Voting Score */}
                <div className="rounded-xl border border-[#263149] bg-[#080B18]/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#94A3B8]">
                      {singleResult.scoreType === "posterior_probability"
                        ? "Posterior Probability (Naive Bayes)"
                        : "Skor Voting Tetangga (KNN, k=5)"}
                    </span>
                    <span className="font-mono-num text-xl font-bold text-[#F1F5F9]">
                      {(singleResult.score * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#11182B]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        singleResult.predictedLabel === "positive"
                          ? "bg-[#22C55E]"
                          : "bg-[#F43F5E]"
                      }`}
                      style={{ width: `${Math.min(100, singleResult.score * 100)}%` }}
                    />
                  </div>

                  {singleResult.classProbabilities && (
                    <div className="font-mono-num mt-3 flex justify-between text-[11px] text-[#94A3B8]">
                      <span>
                        P(Positive):{" "}
                        <strong className="text-[#22C55E]">
                          {(singleResult.classProbabilities.positive * 100).toFixed(2)}%
                        </strong>
                      </span>
                      <span>
                        P(Negative):{" "}
                        <strong className="text-[#F43F5E]">
                          {(singleResult.classProbabilities.negative * 100).toFixed(2)}%
                        </strong>
                      </span>
                    </div>
                  )}

                  {singleResult.knnDetails && (
                    <div className="mt-3 space-y-1 text-[11px] text-[#94A3B8]">
                      <div className="font-mono-num flex justify-between">
                        <span>
                          Vote Positive:{" "}
                          <strong className="text-[#22C55E]">
                            {singleResult.knnDetails.positiveVotes}/5
                          </strong>
                        </span>
                        <span>
                          Vote Negative:{" "}
                          <strong className="text-[#F43F5E]">
                            {singleResult.knnDetails.negativeVotes}/5
                          </strong>
                        </span>
                      </div>
                      <p className="text-[#64748B]">
                        Catatan: Nilai ini adalah proporsi voting dari 5 tetangga cosine
                        terdekat, bukan probabilitas terkalibrasi.
                      </p>
                    </div>
                  )}
                </div>

                {/* Original & Preprocessed Text */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-[#94A3B8]">Ulasan Asli:</span>
                    <p className="mt-1 rounded-lg border border-[#263149] bg-[#080B18]/70 p-2.5 text-[#E2E8F0]">
                      {singleResult.originalText}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-[#94A3B8]">
                      Hasil Preprocessing:
                    </span>
                    <p className="font-mono-num mt-1 rounded-lg border border-[#263149] bg-[#080B18]/70 p-2.5 text-[11px] text-[#94A3B8]">
                      {singleResult.cleanedText || "(kosong setelah pembersihan teks)"}
                    </p>
                  </div>
                </div>

                {/* Matched TF-IDF Features */}
                <div>
                  <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Tag className="h-3.5 w-3.5 text-[#22D3EE]" />
                      Fitur TF-IDF Cocok ({singleResult.matchedTermsCount} fitur)
                    </span>
                  </div>
                  {singleResult.topMatchedTerms.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {singleResult.topMatchedTerms.map((item) => (
                        <span
                          key={item.term}
                          className="font-mono-num rounded-md border border-[#263149] bg-[#080B18] px-2 py-1 text-[11px] text-[#CBD5E1]"
                        >
                          {item.term}{" "}
                          <span className="text-[#22D3EE]">
                            {item.weight.toFixed(3)}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-xs text-[#F59E0B]">
                      Tidak ada kata/n-gram yang cocok dengan vocabulary TF-IDF (5.000
                      fitur bahasa Inggris). Prediksi mengandalkan prior kelas.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </HudCard>
          </ScrollReveal>
        </div>
      ) : (
        /* Batch Analysis */
        <div className="space-y-6">
          <ScrollReveal variant="fade-up">
          <HudCard tone="cyan" hudTag="Batch Text Inference">
            <form onSubmit={handleAnalyzeBatch} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-semibold text-[#F1F5F9]">
                    Analisis Batch (Banyak Ulasan Sekaligus)
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Tempel banyak ulasan (satu ulasan per baris). Baris kosong dihitung
                    sebagai skipped/failed row.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setBatchText(
                      [
                        "Best moba game ever! Smooth gameplay and balanced heroes.",
                        "Laggy servers, toxic players, terrible matchmaking.",
                        "Fun with friends, great graphics and teamfight mechanics.",
                        "Pay to win events ruined the ranked mode.",
                        "Playing Dota 2 for years, deep strategy and awesome tournaments.",
                      ].join("\n")
                    )
                  }
                  className="rounded-lg border border-[#263149] bg-[#080B18] px-3 py-1.5 text-xs text-[#CBD5E1] hover:border-[#22D3EE]/50"
                >
                  Muat 5 Contoh Ulasan
                </button>
              </div>

              <textarea
                rows={7}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={"Baris 1: Great gameplay and fun ranked matches\nBaris 2: Terrible lag and unfair matchmaking"}
                className="w-full rounded-xl border border-[#263149] bg-[#080B18] p-3.5 font-mono-num text-xs text-[#F1F5F9] placeholder-[#64748B] focus:border-[#22D3EE] focus:outline-none"
              />

              {batchProgress && batchRunning && (
                <div className="rounded-lg border border-[#22D3EE]/35 bg-[#080B18]/80 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#22D3EE]">
                      Tahap: {batchProgress.stage.toUpperCase()}
                    </span>
                    <span className="font-mono-num text-[#F1F5F9]">
                      {batchProgress.processed} / {batchProgress.total}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#11182B]">
                    <div
                      className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] transition-all"
                      style={{
                        width: `${
                          batchProgress.total > 0
                            ? (batchProgress.processed / batchProgress.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {batchError && (
                <div className="flex items-start gap-2 rounded-lg border border-[#F43F5E]/40 bg-[#F43F5E]/10 p-3 text-xs text-[#FDA4AF]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{batchError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={batchRunning}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {batchRunning ? "Memproses Batch..." : "Jalankan Batch Analysis"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBatchText("");
                    setBatchSummary(null);
                    setBatchError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#263149] bg-[#080B18] px-4 py-2.5 text-sm text-[#94A3B8] hover:text-[#F1F5F9]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </form>
          </HudCard>
          </ScrollReveal>

          {batchSummary && (
            <ScrollReveal variant="fade-scale" immediateOnMount>
            <HudCard tone="default" hudTag="Batch Summary & Results">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-[#F1F5F9]">
                    Ringkasan Hasil Batch
                  </h3>
                  <AlgorithmBadge algorithm={batchSummary.algorithm} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleBatchExport("csv")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#263149] bg-[#080B18] px-3 py-1.5 text-xs text-[#F1F5F9] hover:border-[#22D3EE]"
                  >
                    <Download className="h-3.5 w-3.5 text-[#22D3EE]" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBatchExport("xlsx")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#263149] bg-[#080B18] px-3 py-1.5 text-xs text-[#F1F5F9] hover:border-[#22C55E]"
                  >
                    <Download className="h-3.5 w-3.5 text-[#22C55E]" />
                    XLSX
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBatchExport("pdf")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#263149] bg-[#080B18] px-3 py-1.5 text-xs text-[#F1F5F9] hover:border-[#8B5CF6]"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#A78BFA]" />
                    PDF
                  </button>
                </div>
              </div>

              <StaggerGroup staggerMs={65} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <StaggerItem variant="slide-up">
                <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                  <div className="text-[11px] text-[#94A3B8]">Total Baris</div>
                  <div className="font-mono-num mt-1 text-xl font-bold text-[#F1F5F9]">
                    {batchSummary.total}
                  </div>
                </div>
                </StaggerItem>
                <StaggerItem variant="slide-up">
                <div className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 p-3">
                  <div className="text-[11px] text-[#86EFAC]">Prediksi Positif</div>
                  <div className="font-mono-num mt-1 text-xl font-bold text-[#22C55E]">
                    {batchSummary.positive}
                  </div>
                </div>
                </StaggerItem>
                <StaggerItem variant="slide-up">
                <div className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 p-3">
                  <div className="text-[11px] text-[#FDA4AF]">Prediksi Negatif</div>
                  <div className="font-mono-num mt-1 text-xl font-bold text-[#F43F5E]">
                    {batchSummary.negative}
                  </div>
                </div>
                </StaggerItem>
                <StaggerItem variant="slide-up">
                <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                  <div className="text-[11px] text-[#94A3B8]">Failed / Empty</div>
                  <div className="font-mono-num mt-1 text-xl font-bold text-[#F1F5F9]">
                    {batchSummary.failed}
                  </div>
                </div>
                </StaggerItem>
                <StaggerItem variant="slide-up">
                <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                  <div className="text-[11px] text-[#94A3B8]">Durasi</div>
                  <div className="font-mono-num mt-1 text-xl font-bold text-[#22D3EE]">
                    {batchSummary.durationMs} ms
                  </div>
                </div>
                </StaggerItem>
              </StaggerGroup>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#263149] text-[#94A3B8]">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-4">Ulasan</th>
                      <th className="py-2 pr-4">Prediksi Model</th>
                      <th className="py-2">
                        {batchSummary.algorithm === "naive_bayes"
                          ? "Confidence"
                          : "Skor Voting"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#263149]/60">
                    {batchSummary.rows.slice(0, 200).map((row) => (
                      <tr key={row.rowIndex} className="hover:bg-[#11182B]/50">
                        <td className="font-mono-num py-2.5 pr-3 text-[#94A3B8]">
                          {row.rowIndex}
                        </td>
                        <td className="max-w-lg py-2.5 pr-4 text-[#E2E8F0]">
                          {row.review}
                        </td>
                        <td className="py-2.5 pr-4">
                          <SentimentBadge sentiment={row.predictedLabel} size="xs" />
                        </td>
                        <td className="font-mono-num py-2.5 text-[#F1F5F9]">
                          {(row.score * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {batchSummary.rows.length > 200 && (
                  <p className="mt-2 text-xs text-[#94A3B8]">
                    Menampilkan 200 baris pertama dari {batchSummary.rows.length} hasil.
                    Ekspor ke CSV/XLSX untuk melihat seluruh baris.
                  </p>
                )}
              </div>
            </HudCard>
            </ScrollReveal>
          )}
        </div>
      )}
    </div>
  );
}
