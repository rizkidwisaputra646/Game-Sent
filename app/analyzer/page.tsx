"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ComicPanelReveal,
  ComicPopCallout,
  ComicScanningEffect,
  ImpactBurst,
  MangaShake,
} from "@/components/motion/AnimeComicMotion";
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
} from "lucide-react";
import { useGameSent } from "@/components/providers/GameSentProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
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
      <PageHeader
        title="Sentiment Analyzer"
        tag="INFERENCE ENGINE"
        speechText="SIAP KLASIFIKASI!"
        description="Uji prediksi klasifikasi sentimen ulasan game MOBA menggunakan model Multinomial Naive Bayes dan KNN secara langsung di browser lokal."
        badge={
          <span className="rounded-md border border-[#202020] bg-[#65C98A] px-2.5 py-0.5 font-mono-num text-[11px] font-bold text-[#171717] shadow-[1.5px_1.5px_0px_#202020]">
            Web Worker Aktif
          </span>
        }
      />

      {/* Mode & Algorithm Configuration Card */}
      <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[3px_3px_0px_#202020]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#666666] uppercase font-mono mr-1">Mode:</span>
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`inline-flex items-center gap-2 rounded-xl border-2 border-[#202020] px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                mode === "single"
                  ? "bg-[#A78BFA] text-[#171717] shadow-[2px_2px_0px_#202020]"
                  : "bg-[#FFFDFC] text-[#666666] hover:bg-[#F7F4EC]"
              }`}
            >
              <Radar className="h-4 w-4" />
              Ulasan Tunggal
            </button>
            <button
              type="button"
              onClick={() => setMode("batch")}
              className={`inline-flex items-center gap-2 rounded-xl border-2 border-[#202020] px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                mode === "batch"
                  ? "bg-[#3479D4] text-white shadow-[2px_2px_0px_#202020]"
                  : "bg-[#FFFDFC] text-[#666666] hover:bg-[#F7F4EC]"
              }`}
            >
              <Layers className="h-4 w-4" />
              Analisis Batch (Multi-Baris)
            </button>
          </div>

          {/* Algorithm Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#666666] uppercase font-mono mr-1">Algoritma:</span>
            <button
              type="button"
              onClick={() => handleAlgorithmChange("naive_bayes")}
              className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-[#202020] px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                algorithm === "naive_bayes"
                  ? "bg-[#A78BFA] text-[#171717] shadow-[2px_2px_0px_#202020]"
                  : "bg-[#FFFDFC] text-[#666666] hover:bg-[#F7F4EC]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#171717]" />
              Multinomial Naive Bayes
            </button>
            <button
              type="button"
              onClick={() => handleAlgorithmChange("knn")}
              className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-[#202020] px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                algorithm === "knn"
                  ? "bg-[#E8BC55] text-[#171717] shadow-[2px_2px_0px_#202020]"
                  : "bg-[#FFFDFC] text-[#666666] hover:bg-[#F7F4EC]"
              }`}
            >
              <Cpu className="h-3.5 w-3.5 text-[#171717]" />
              KNN (k=5, cosine)
            </button>
          </div>
        </div>
      </div>

      {mode === "single" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Input Form Panel */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
              <form onSubmit={handleAnalyzeSingle} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="single-review-input"
                      className="block font-display text-base font-bold text-[#171717]"
                    >
                      Input Teks Ulasan Pemain
                    </label>
                    <span className="font-mono text-xs text-[#666666]">
                      {singleText.length} karakter
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#666666]">
                    Model dilatih menggunakan ulasan berbahasa Inggris (Dota 2 &amp; Mobile Legends).
                  </p>
                  <textarea
                    id="single-review-input"
                    rows={6}
                    value={singleText}
                    onChange={(e) => setSingleText(e.target.value)}
                    placeholder="Contoh: Great MOBA mechanics, fun ranked matches with friends, though matchmaking takes time..."
                    className="mt-3 w-full rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-3.5 text-sm text-[#171717] placeholder:text-[#666666] focus:bg-[#FFFDFC] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                  />
                </div>

                {/* Example Chips */}
                <div>
                  <span className="block text-[11px] font-mono font-bold text-[#666666] uppercase mb-1.5">
                    Contoh Ulasan Riset:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {EXAMPLE_REVIEWS.map((ex) => (
                      <button
                        key={ex.label}
                        type="button"
                        onClick={() => setSingleText(ex.text)}
                        className="rounded-lg border border-[#202020] bg-[#FFFDFC] px-2.5 py-1 text-xs font-semibold text-[#171717] shadow-[1px_1px_0px_#202020] hover:bg-[#A78BFA] transition-colors cursor-pointer"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>

                {singleError && (
                  <MangaShake shakeKey={singleError}>
                    <div className="flex items-start gap-2 rounded-lg border-2 border-[#202020] bg-[#FA7777]/25 p-3 text-xs text-[#BA2A2A] font-bold">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{singleError}</span>
                    </div>
                  </MangaShake>
                )}

                {singleLoading && (
                  <ComicScanningEffect label="ANALYZING SENTIMENT & TF-IDF..." />
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <PrimaryButton
                    type="submit"
                    disabled={singleLoading || (!modelStatus.ready && modelStatus.loading)}
                    isLoading={singleLoading}
                    icon={<Play className="h-4 w-4" />}
                  >
                    Mulai Analisis
                  </PrimaryButton>

                  <SecondaryButton
                    type="button"
                    onClick={handleClearSingle}
                    icon={<RotateCcw className="h-4 w-4" />}
                  >
                    Bersihkan
                  </SecondaryButton>
                </div>
              </form>
            </div>
          </div>

          {/* Single Prediction Output */}
          <div className="lg:col-span-6">
            <div
              className={`rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3.5px_3.5px_0px_#202020] min-h-[360px] flex flex-col justify-between ${
                singleResult
                  ? singleResult.predictedLabel === "positive"
                    ? "ring-2 ring-[#65C98A]"
                    : "ring-2 ring-[#FA7777]"
                  : ""
              }`}
            >
              {!singleResult ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#202020] bg-[#F7F4EC] shadow-[2px_2px_0px_#202020] mb-3">
                    <Radar className="h-7 w-7 text-[#8060D8]" />
                  </div>
                  <h3 className="font-display text-base font-bold text-[#171717]">
                    Siap Menjalankan Klasifikasi
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-[#666666] leading-relaxed">
                    Masukkan ulasan game di samping lalu tekan <strong>Mulai Analisis</strong> untuk mengekstrak fitur TF-IDF dan memprediksi sentimen secara instan.
                  </p>
                </div>
              ) : (
                <motion.div
                  key={`${singleResult.algorithm}-${singleResult.predictedLabel}-${singleResult.processingTimeMs}`}
                  initial={shouldReduceMotion ? false : { opacity: 0.6, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 360, damping: 24 }
                  }
                  className="relative space-y-4"
                >
                  <ImpactBurst
                    color={singleResult.predictedLabel === "positive" ? "#65C98A" : "#FA7777"}
                    className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 opacity-25"
                  />
                  {/* Result Header Badge */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#202020]/10">
                    <div className="flex flex-wrap items-center gap-2">
                      <ComicPopCallout
                        text="ANALYZED!"
                        tone={singleResult.predictedLabel === "positive" ? "positive" : "negative"}
                        tilt={-3}
                      />
                      <SentimentBadge sentiment={singleResult.predictedLabel} size="md" />
                      <AlgorithmBadge algorithm={singleResult.algorithm} />
                    </div>
                    <div className="font-mono flex items-center gap-1.5 text-xs font-bold text-[#666666]">
                      <Clock className="h-3.5 w-3.5 text-[#8060D8]" />
                      {singleResult.processingTimeMs.toFixed(2)} ms
                    </div>
                  </div>

                  {/* Confidence / Vote Score Card */}
                  <div
                    className={`rounded-xl border-2 border-[#202020] p-4 shadow-[2px_2px_0px_#202020] ${
                      singleResult.predictedLabel === "positive"
                        ? "bg-[#65C98A]/20"
                        : "bg-[#FA7777]/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#171717] font-mono uppercase">
                        {singleResult.scoreType === "posterior_probability"
                          ? "Posterior Probability (Naive Bayes)"
                          : "Skor Voting Tetangga (KNN, k=5)"}
                      </span>
                      <span className="font-display text-2xl font-bold text-[#171717]">
                        {(singleResult.score * 100).toFixed(2)}%
                      </span>
                    </div>

                    <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full border-2 border-[#202020] bg-white">
                      <div
                        className={`h-full transition-all duration-500 ${
                          singleResult.predictedLabel === "positive"
                            ? "bg-[#65C98A]"
                            : "bg-[#FA7777]"
                        }`}
                        style={{ width: `${Math.min(100, singleResult.score * 100)}%` }}
                      />
                    </div>

                    {singleResult.classProbabilities && (
                      <div className="font-mono mt-3 flex justify-between text-xs text-[#171717] font-bold">
                        <span>P(Positif): {(singleResult.classProbabilities.positive * 100).toFixed(2)}%</span>
                        <span>P(Negatif): {(singleResult.classProbabilities.negative * 100).toFixed(2)}%</span>
                      </div>
                    )}

                    {singleResult.knnDetails && (
                      <div className="mt-2.5 space-y-1 text-xs text-[#171717]">
                        <div className="font-mono flex justify-between font-bold">
                          <span>Vote Positif: {singleResult.knnDetails.positiveVotes}/5</span>
                          <span>Vote Negatif: {singleResult.knnDetails.negativeVotes}/5</span>
                        </div>
                        <p className="text-[11px] text-[#666666]">
                          *Catatan: Nilai ini merupakan konsensus voting dari 5 tetangga terdekat, bukan probabilitas terkalibrasi.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Cleaned text preview */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#666666] uppercase text-[10px]">
                        Hasil Preprocessing Teks:
                      </span>
                      <p className="mt-1 rounded-lg border border-[#202020] bg-[#F7F4EC] p-2.5 font-mono text-[#171717] leading-relaxed">
                        {singleResult.cleanedText || "(kosong setelah pembersihan teks)"}
                      </p>
                    </div>

                    {/* Matched Keywords */}
                    <div>
                      <span className="font-mono font-bold text-[#666666] uppercase text-[10px]">
                        Kata Kunci TF-IDF Cocok ({singleResult.matchedTermsCount} fitur):
                      </span>
                      {singleResult.topMatchedTerms.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {singleResult.topMatchedTerms.map((item) => (
                            <span
                              key={item.term}
                              className="font-mono rounded-md border border-[#202020] bg-white px-2 py-0.5 text-xs text-[#171717] shadow-[1px_1px_0px_#202020]"
                            >
                              {item.term}{" "}
                              <strong className="text-[#8060D8]">{item.weight.toFixed(3)}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-[#C89B2B]">
                          Tidak ada kata yang cocok dengan 1.000 vocabulary TF-IDF. Prediksi didasarkan pada prior probability.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Batch Analysis Mode */
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
            <form onSubmit={handleAnalyzeBatch} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#202020]/10">
                <div>
                  <h3 className="font-display text-base font-bold text-[#171717]">
                    Analisis Batch Multi-Ulasan
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Tempel daftar ulasan game (satu baris untuk setiap ulasan ulasan).
                  </p>
                </div>
                <SecondaryButton
                  size="sm"
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
                >
                  Muat 5 Contoh Ulasan
                </SecondaryButton>
              </div>

              <textarea
                rows={7}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={"Baris 1: Great gameplay and fun ranked matches\nBaris 2: Terrible lag and unfair matchmaking"}
                className="w-full rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-3.5 font-mono text-xs text-[#171717] placeholder:text-[#666666] focus:bg-[#FFFDFC] focus:outline-none"
              />

              {batchProgress && batchRunning && (
                <div className="space-y-2">
                  <ComicScanningEffect label={`BATCH STAGE: ${batchProgress.stage.toUpperCase()}`} />
                  <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
                      <span>Progres Inferensi Web Worker</span>
                      <span className="font-mono">
                        {batchProgress.processed} / {batchProgress.total} ulasan
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border border-[#202020] bg-white">
                      <div
                        className="h-full bg-[#A78BFA] transition-all"
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
                </div>
              )}

              {batchError && (
                <MangaShake shakeKey={batchError}>
                  <div className="flex items-start gap-2 rounded-lg border-2 border-[#202020] bg-[#FA7777]/25 p-3 text-xs text-[#BA2A2A] font-bold">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{batchError}</span>
                  </div>
                </MangaShake>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <PrimaryButton
                  type="submit"
                  disabled={batchRunning}
                  isLoading={batchRunning}
                  icon={<Play className="h-4 w-4" />}
                >
                  Proses Seluruh Baris
                </PrimaryButton>

                <SecondaryButton
                  type="button"
                  onClick={() => {
                    setBatchText("");
                    setBatchSummary(null);
                    setBatchError(null);
                  }}
                  icon={<RotateCcw className="h-4 w-4" />}
                >
                  Reset Form
                </SecondaryButton>
              </div>
            </form>
          </div>

          {/* Batch Results Table */}
          {batchSummary && (
            <ComicPanelReveal direction="pop">
              <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3.5px_3.5px_0px_#202020]">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-[#202020]/10">
                  <div className="flex flex-wrap items-center gap-2">
                    <ComicPopCallout text="ANALYZED!" tone="primary" tilt={-2} />
                    <h3 className="font-display text-lg font-bold text-[#171717]">
                      Hasil Analisis Batch
                    </h3>
                    <AlgorithmBadge algorithm={batchSummary.algorithm} />
                  </div>

                <div className="flex items-center gap-2">
                  <SecondaryButton
                    size="sm"
                    onClick={() => void handleBatchExport("csv")}
                    icon={<Download className="h-3.5 w-3.5" />}
                  >
                    CSV
                  </SecondaryButton>
                  <SecondaryButton
                    size="sm"
                    onClick={() => void handleBatchExport("xlsx")}
                    icon={<Download className="h-3.5 w-3.5" />}
                  >
                    XLSX
                  </SecondaryButton>
                  <SecondaryButton
                    size="sm"
                    onClick={() => void handleBatchExport("pdf")}
                    icon={<FileText className="h-3.5 w-3.5" />}
                  >
                    PDF
                  </SecondaryButton>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-3 shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">
                    Total Baris
                  </span>
                  <span className="font-display text-xl font-bold text-[#171717]">
                    {batchSummary.total}
                  </span>
                </div>
                <div className="rounded-lg border-2 border-[#202020] bg-[#65C98A]/25 p-3 shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#228448] uppercase">
                    Prediksi Positif
                  </span>
                  <span className="font-display text-xl font-bold text-[#228448]">
                    {batchSummary.positive}
                  </span>
                </div>
                <div className="rounded-lg border-2 border-[#202020] bg-[#FA7777]/25 p-3 shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#BA2A2A] uppercase">
                    Prediksi Negatif
                  </span>
                  <span className="font-display text-xl font-bold text-[#BA2A2A]">
                    {batchSummary.negative}
                  </span>
                </div>
                <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-3 shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">
                    Waktu Komputasi
                  </span>
                  <span className="font-display text-xl font-bold text-[#171717]">
                    {batchSummary.durationMs} ms
                  </span>
                </div>
              </div>

              {/* Table Preview */}
              <div className="mt-4 overflow-x-auto rounded-lg border-2 border-[#202020]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-[#202020] bg-[#F7F4EC] font-mono font-bold text-[#171717]">
                      <th className="py-2.5 px-3 w-14">#</th>
                      <th className="py-2.5 px-4">Teks Ulasan</th>
                      <th className="py-2.5 px-4 w-32">Prediksi</th>
                      <th className="py-2.5 px-4 w-28">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-[#202020]/20 bg-[#FFFDFC]">
                    {batchSummary.rows.slice(0, 100).map((row) => (
                      <tr key={row.rowIndex} className="hover:bg-[#F7F4EC]">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#666666]">
                          #{row.rowIndex}
                        </td>
                        <td className="py-2.5 px-4 text-[#171717]">{row.review}</td>
                        <td className="py-2.5 px-4">
                          <SentimentBadge sentiment={row.predictedLabel} size="xs" />
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#171717]">
                          {(row.score * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </ComicPanelReveal>
          )}
        </div>
      )}
    </div>
  );
}
