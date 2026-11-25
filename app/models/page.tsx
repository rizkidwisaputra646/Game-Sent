"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  Play,
  Sliders,
  Sparkles,
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
import type { ModelEvaluationMetrics } from "@/lib/data/types";
import { inferenceClient } from "@/lib/ml/client";

const ModelComparisonBarChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then(
      (m) => m.ModelComparisonBarChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[290px] animate-pulse rounded-lg bg-[#0D1224]" />
    ),
  }
);

const TopTermsBarChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then((m) => m.TopTermsBarChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-lg bg-[#0D1224]" />
    ),
  }
);

const MODEL_SECTIONS: SectionAnchor[] = [
  { id: "sec-tfidf", code: "01", label: "TF-IDF Pipeline" },
  { id: "sec-classifiers", code: "02", label: "NB & KNN" },
  { id: "sec-comparison", code: "03", label: "Perbandingan & Latensi" },
];

function ConfusionMatrixGrid({
  title,
  accent,
  evaluation,
}: {
  title: string;
  accent: string;
  evaluation: ModelEvaluationMetrics;
}) {
  const { tn, fp, fn, tp } = evaluation.confusionMatrix;
  const total = tn + fp + fn + tp;

  return (
    <ScrollReveal variant="scale-reveal">
      <div className="rounded-xl border border-[#263149] bg-[#080B18]/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-[#F1F5F9]">
            {title}
          </h3>
          <span className="font-mono-num text-[11px] text-[#94A3B8]">
            n = {total} (Test Set)
          </span>
        </div>

        <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-center text-xs">
          <div />
          <div className="pb-1 font-mono-num text-[11px] text-[#94A3B8]">
            Pred: Negative
          </div>
          <div className="pb-1 font-mono-num text-[11px] text-[#94A3B8]">
            Pred: Positive
          </div>

          <div className="flex items-center justify-end pr-2 font-mono-num text-[11px] text-[#94A3B8]">
            Actual: Neg
          </div>
          <div
            className="rounded-lg border p-3"
            style={{
              borderColor: `${accent}55`,
              backgroundColor: `${accent}18`,
            }}
          >
            <div className="font-mono-num text-xl font-bold text-[#F1F5F9]">
              <CountUpNumber value={tn} durationMs={850} />
            </div>
            <div className="text-[10px] text-[#94A3B8]">True Negative</div>
          </div>
          <div className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 p-3">
            <div className="font-mono-num text-xl font-bold text-[#FDA4AF]">
              <CountUpNumber value={fp} durationMs={850} />
            </div>
            <div className="text-[10px] text-[#94A3B8]">False Positive</div>
          </div>

          <div className="flex items-center justify-end pr-2 font-mono-num text-[11px] text-[#94A3B8]">
            Actual: Pos
          </div>
          <div className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 p-3">
            <div className="font-mono-num text-xl font-bold text-[#FDA4AF]">
              <CountUpNumber value={fn} durationMs={850} />
            </div>
            <div className="text-[10px] text-[#94A3B8]">False Negative</div>
          </div>
          <div className="rounded-lg border border-[#22C55E]/40 bg-[#22C55E]/15 p-3">
            <div className="font-mono-num text-xl font-bold text-[#22C55E]">
              <CountUpNumber value={tp} durationMs={850} />
            </div>
            <div className="text-[10px] text-[#94A3B8]">True Positive</div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

const BENCHMARK_SAMPLES = [
  "Great game, awesome hero balance and fun team fights with friends!",
  "Terrible matchmaking, toxic teammates and constant server lag every ranked match.",
  "Good moba gameplay, smooth graphics and responsive controls.",
  "Pay to win skin events and unfair rank system makes me uninstall.",
  "Best strategy moba on steam, deep mechanics and competitive matches.",
];

export default function ModelsPage() {
  const { metadata, modelStatus } = useGameSent();
  const tfidf = metadata.models.tfidf;
  const nb = metadata.models.naiveBayes;
  const knn = metadata.models.knn;

  const [benchmarkResult, setBenchmarkResult] = useState<{
    nbMs: number;
    knnMs: number;
    sampleCount: number;
  } | null>(null);
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);

  const runLiveLatencyBenchmark = async () => {
    setBenchmarkRunning(true);
    setBenchmarkError(null);
    try {
      const items = BENCHMARK_SAMPLES.map((review, idx) => ({
        rowIndex: idx + 1,
        review,
      }));
      const nbRes = await inferenceClient.predictBatch(items, "naive_bayes");
      const knnRes = await inferenceClient.predictBatch(items, "knn");
      setBenchmarkResult({
        nbMs: nbRes.durationMs,
        knnMs: knnRes.durationMs,
        sampleCount: items.length,
      });
    } catch (err) {
      setBenchmarkError(
        err instanceof Error ? err.message : "Gagal mengukur waktu inferensi."
      );
    } finally {
      setBenchmarkRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionNavigationBar sections={MODEL_SECTIONS} />

      {/* TF-IDF Panel (Fade Up) */}
      <ScrollReveal id="sec-tfidf" variant="fade-up" className="scroll-mt-20">
        <HudCard tone="cyan" hudTag="Feature Extraction Pipeline">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#F1F5F9]">
                TF-IDF Vectorizer &amp; Text Preprocessing
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Diekstrak langsung dari{" "}
                <code className="rounded bg-[#080B18] px-1.5 py-0.5 text-[#F1F5F9]">
                  {metadata.notebookFile}
                </code>{" "}
                (fit hanya pada {metadata.dataset.split.trainSize.toLocaleString("id-ID")} data training)
              </p>
            </div>
            <span className="font-mono-num rounded-md border border-[#22C55E]/35 bg-[#22C55E]/10 px-2.5 py-1 text-xs text-[#22C55E]">
              {modelStatus.ready ? "Engine Browser Tervalidasi" : "Memuat Engine..."}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Vocabulary Size", val: tfidf.vocabularySize.toLocaleString("id-ID") },
                { label: "N-Gram Range", val: `(${tfidf.ngramRange[0]}, ${tfidf.ngramRange[1]})` },
                { label: "min_df", val: String(tfidf.minDf) },
                { label: "max_features", val: tfidf.maxFeatures.toLocaleString("id-ID") },
                { label: "Stop Words", val: tfidf.stopWords },
                { label: "Normalization", val: tfidf.norm.toUpperCase() },
                { label: "smooth_idf", val: tfidf.smoothIdf ? "True" : "False" },
                { label: "sublinear_tf", val: tfidf.sublinearTf ? "True" : "False" },
                { label: "Train Sparse NNZ", val: tfidf.trainNnz.toLocaleString("id-ID") },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#263149] bg-[#080B18]/75 p-3"
                >
                  <div className="text-[11px] text-[#94A3B8]">{item.label}</div>
                  <div className="font-mono-num mt-1 text-sm font-semibold text-[#F1F5F9]">
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-5 rounded-lg border border-[#263149] bg-[#080B18]/75 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#22D3EE]">
                <Sliders className="h-3.5 w-3.5" />
                Urutan Preprocessing Notebook (Cell 9)
              </div>
              <ol className="mt-3 space-y-1.5 text-xs text-[#CBD5E1]">
                {[
                  "1. Case folding: mengubah seluruh teks menjadi huruf kecil",
                  "2. Hapus URL (pola http\\S+ dan www\\S+)",
                  "3. Hapus tag HTML (<.*?>)",
                  "4. Hapus seluruh angka (\\d+)",
                  "5. Hapus tanda baca & karakter non-alfabet ([^a-z\\s] -> spasi)",
                  "6. Normalisasi spasi berlebih dan trim",
                ].map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22C55E]" />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[11px] text-[#94A3B8]">
                Tidak menggunakan stemming/lemmatization sesuai pipeline asli penelitian.
              </p>
            </div>
          </div>
        </HudCard>
      </ScrollReveal>

      {/* Naive Bayes & KNN Stagger Reveal */}
      <StaggerGroup
        id="sec-classifiers"
        staggerMs={90}
        className="grid grid-cols-1 gap-6 scroll-mt-20 lg:grid-cols-2"
      >
        <StaggerItem variant="fade-up">
          <HudCard tone="violet" hudTag="Model 01 — Probabilistic" className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#A78BFA]" />
                  <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
                    {nb.name}
                  </h2>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
                  Model probabilistik berbasis teorema Bayes dengan asumsi independensi
                  fitur multinomial pada bobot TF-IDF. Menghasilkan posterior probability
                  melalui normalisasi log-sum-exp.
                </p>
              </div>
              <span className="font-mono-num shrink-0 rounded-md border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-2.5 py-1 text-xs font-semibold text-[#C4B5FD]">
                Acc {(nb.evaluation.accuracy * 100).toFixed(2)}%
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: "Alpha", val: String(nb.params.alpha) },
                { label: "fit_prior", val: nb.params.fitPrior ? "True" : "False" },
                {
                  label: "Prior Neg",
                  val: `${(nb.params.classPriorProb[0] * 100).toFixed(2)}%`,
                },
                {
                  label: "Prior Pos",
                  val: `${(nb.params.classPriorProb[1] * 100).toFixed(2)}%`,
                },
              ].map((p) => (
                <div
                  key={p.label}
                  className="rounded-lg border border-[#263149] bg-[#080B18]/75 p-2.5"
                >
                  <div className="text-[10px] text-[#94A3B8]">{p.label}</div>
                  <div className="font-mono-num mt-0.5 text-sm font-semibold text-[#F1F5F9]">
                    {p.val}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-2.5">
                <div className="text-[10px] text-[#C4B5FD]">Accuracy</div>
                <div className="font-mono-num mt-0.5 text-base font-bold text-[#F1F5F9]">
                  <CountUpNumber
                    value={nb.evaluation.accuracy * 100}
                    decimals={2}
                    suffix="%"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-2.5">
                <div className="text-[10px] text-[#C4B5FD]">Precision (+)</div>
                <div className="font-mono-num mt-0.5 text-base font-bold text-[#F1F5F9]">
                  <CountUpNumber
                    value={nb.evaluation.precisionPositive}
                    decimals={4}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-2.5">
                <div className="text-[10px] text-[#C4B5FD]">Recall (+)</div>
                <div className="font-mono-num mt-0.5 text-base font-bold text-[#F1F5F9]">
                  <CountUpNumber
                    value={nb.evaluation.recallPositive}
                    decimals={4}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-2.5">
                <div className="text-[10px] text-[#C4B5FD]">F1-Score (+)</div>
                <div className="font-mono-num mt-0.5 text-base font-bold text-[#F1F5F9]">
                  <CountUpNumber
                    value={nb.evaluation.f1Positive}
                    decimals={4}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <ConfusionMatrixGrid
                title="Confusion Matrix — Naive Bayes"
                accent="#8B5CF6"
                evaluation={nb.evaluation}
              />
            </div>
          </HudCard>
        </StaggerItem>

        <StaggerItem variant="fade-up">
          <HudCard tone="cyan" hudTag="Model 02 — Instance-Based" className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-[#22D3EE]" />
                  <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
                    {knn.name}
                  </h2>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
                  Algoritma berbasis kedekatan vektor yang mencari 5 tetangga terdekat pada
                  ruang vektor TF-IDF menggunakan cosine distance. Menghasilkan skor voting
                  proporsi tetangga (bukan probabilitas terkalibrasi).
                </p>
              </div>
              <span className="font-mono-num shrink-0 rounded-md border border-[#22D3EE]/40 bg-[#22D3EE]/12 px-2.5 py-1 text-xs font-semibold text-[#67E8F9]">
                Acc {(knn.evaluation.accuracy * 100).toFixed(2)}%
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: "Nilai K", val: String(knn.params.nNeighbors) },
                { label: "Metric", val: knn.params.metric },
                { label: "Weights", val: knn.params.weights },
                {
                  label: "Train Vectors",
                  val: knn.params.trainingVectors.toLocaleString("id-ID"),
                },
              ].map((p) => (
                <div
                  key={p.label}
                  className="rounded-lg border border-[#263149] bg-[#080B18]/75 p-2.5"
                >
                  <div className="text-[10px] text-[#94A3B8]">{p.label}</div>
                  <div className="font-mono-num mt-0.5 text-sm font-semibold text-[#F1F5F9]">
                    {p.val}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/10 p-2.5">
                <div className="text-[10px] text-[#67E8F9]">Accuracy</div>
                <div className="font-mono-num mt-0.5 text-base font-bold text-[#F1F5F9]">
                  <CountUpNumber
                    value={knn.evaluation.accuracy * 100}
                    decimals={2}
                    suffix="%"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/10 p-2.5">
                <div className="text-[10px] text-[#67E8F9]">Precision (+)</div>
                <div className="font-mono-num mt-0.5 text-base font-bold text-[#F1F5F9]">
                  <CountUpNumber
                    value={knn.evaluation.precisionPositive}
                    decimals={4}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/10 p-2.5">
                <div className="text-[10px] text-[#67E8F9]">Recall (+)</div>
                <div className="font-mono-num mt-0.5 text-base font-bold text-[#F1F5F9]">
                  <CountUpNumber
                    value={knn.evaluation.recallPositive}
                    decimals={4}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/10 p-2.5">
                <div className="text-[10px] text-[#67E8F9]">F1-Score (+)</div>
                <div className="font-mono-num mt-0.5 text-base font-bold text-[#F1F5F9]">
                  <CountUpNumber
                    value={knn.evaluation.f1Positive}
                    decimals={4}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <ConfusionMatrixGrid
                title="Confusion Matrix — KNN"
                accent="#22D3EE"
                evaluation={knn.evaluation}
              />
            </div>
          </HudCard>
        </StaggerItem>
      </StaggerGroup>

      {/* Model Comparison (Horizontal Reveal) + Top Terms & Latency */}
      <div
        id="sec-comparison"
        className="grid grid-cols-1 gap-6 scroll-mt-20 lg:grid-cols-12"
      >
        <ScrollReveal variant="slide-left" className="lg:col-span-7">
          <HudCard tone="blue" hudTag="Model Comparison" className="h-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
                  Perbandingan Performa NB vs KNN
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Multinomial Naive Bayes unggul pada Accuracy (80.50% vs 74.10%),
                  Precision, dan F1-Score
                </p>
              </div>
            </div>

            <div className="mt-3">
              <ModelComparisonBarChart
                nb={{
                  accuracy: nb.evaluation.accuracy,
                  precision: nb.evaluation.precisionPositive,
                  recall: nb.evaluation.recallPositive,
                  f1: nb.evaluation.f1Positive,
                }}
                knn={{
                  accuracy: knn.evaluation.accuracy,
                  precision: knn.evaluation.precisionPositive,
                  recall: knn.evaluation.recallPositive,
                  f1: knn.evaluation.f1Positive,
                }}
              />
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#263149] text-[#94A3B8]">
                    <th className="py-2 pr-4">Algoritma</th>
                    <th className="py-2 pr-4">Accuracy</th>
                    <th className="py-2 pr-4">Precision (+)</th>
                    <th className="py-2 pr-4">Recall (+)</th>
                    <th className="py-2">F1-Score (+)</th>
                  </tr>
                </thead>
                <tbody className="font-mono-num divide-y divide-[#263149]/60">
                  <tr>
                    <td className="py-2.5 pr-4 font-sans font-medium text-[#C4B5FD]">
                      Multinomial Naive Bayes
                    </td>
                    <td className="py-2.5 pr-4 text-[#22C55E]">
                      {(nb.evaluation.accuracy * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 pr-4">
                      {nb.evaluation.precisionPositive.toFixed(4)}
                    </td>
                    <td className="py-2.5 pr-4">
                      {nb.evaluation.recallPositive.toFixed(4)}
                    </td>
                    <td className="py-2.5">{nb.evaluation.f1Positive.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans font-medium text-[#67E8F9]">
                      K-Nearest Neighbors (k=5)
                    </td>
                    <td className="py-2.5 pr-4 text-[#22D3EE]">
                      {(knn.evaluation.accuracy * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 pr-4">
                      {knn.evaluation.precisionPositive.toFixed(4)}
                    </td>
                    <td className="py-2.5 pr-4">
                      {knn.evaluation.recallPositive.toFixed(4)}
                    </td>
                    <td className="py-2.5">{knn.evaluation.f1Positive.toFixed(4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </HudCard>
        </ScrollReveal>

        <div className="lg:col-span-5 space-y-6">
          <ScrollReveal variant="slide-right">
            <HudCard tone="default" hudTag="Live Browser Latency">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-[#22D3EE]" />
                  <h3 className="font-display text-base font-semibold text-[#F1F5F9]">
                    Pengukuran Waktu Inferensi
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={benchmarkRunning}
                  onClick={() => void runLiveLatencyBenchmark()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#8B5CF6]/45 bg-[#8B5CF6]/18 px-3 py-1.5 text-xs font-medium text-[#F1F5F9] transition hover:bg-[#8B5CF6]/30 disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" />
                  {benchmarkRunning ? "Mengukur..." : "Uji 5 Ulasan"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[#94A3B8]">
                Mengukur waktu eksekusi Web Worker aktual di browser Anda (bukan angka statis).
              </p>
              {benchmarkError && (
                <p className="mt-2 text-xs text-[#F43F5E]">{benchmarkError}</p>
              )}
              {benchmarkResult ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[#8B5CF6]/30 bg-[#080B18]/80 p-3">
                    <div className="text-[11px] text-[#94A3B8]">
                      Naive Bayes ({benchmarkResult.sampleCount} ulasan)
                    </div>
                    <div className="font-mono-num mt-1 text-lg font-bold text-[#C4B5FD]">
                      {benchmarkResult.nbMs.toFixed(2)} ms
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#22D3EE]/30 bg-[#080B18]/80 p-3">
                    <div className="text-[11px] text-[#94A3B8]">
                      KNN Brute Cosine ({benchmarkResult.sampleCount} ulasan)
                    </div>
                    <div className="font-mono-num mt-1 text-lg font-bold text-[#67E8F9]">
                      {benchmarkResult.knnMs.toFixed(2)} ms
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-[#263149] bg-[#080B18]/50 p-3 text-xs text-[#94A3B8]">
                  Status: Belum diukur. Klik <strong>Uji 5 Ulasan</strong> untuk mengukur latensi aktual Web Worker.
                </div>
              )}
            </HudCard>
          </ScrollReveal>

          <ScrollReveal variant="fade-scale" delay={0.08}>
            <HudCard tone="default" hudTag="Top TF-IDF Terms (Train)">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#22C55E]" />
                <h3 className="font-display text-base font-semibold text-[#F1F5F9]">
                  Top 10 Term TF-IDF — Kelas Positif
                </h3>
              </div>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Rata-rata bobot TF-IDF tertinggi pada data training positif
              </p>
              <div className="mt-2">
                <TopTermsBarChart
                  terms={metadata.dataset.topTerms.positive}
                  color="#22C55E"
                />
              </div>
            </HudCard>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
