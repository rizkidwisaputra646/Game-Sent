"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  CheckCircle2,
  Gauge,
  Layers,
  Play,
  Sliders,
} from "lucide-react";
import {
  SectionNavigationBar,
  type SectionAnchor,
} from "@/components/motion/ScrollPrimitives";
import {
  ComicPanelReveal,
  ComicPopCallout,
  ComicStaggerGroup,
  ComicStaggerItem,
  MangaShake,
} from "@/components/motion/AnimeComicMotion";
import { useGameSent } from "@/components/providers/GameSentProvider";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton } from "@/components/ui/Buttons";
import { AlgorithmBadge } from "@/components/ui/StatusBadge";
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
      <div className="h-[290px] animate-pulse rounded-xl border-2 border-[#202020] bg-[#FFFDFC]" />
    ),
  }
);

const TopTermsBarChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then((m) => m.TopTermsBarChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-xl border-2 border-[#202020] bg-[#FFFDFC]" />
    ),
  }
);

const MODEL_SECTIONS: SectionAnchor[] = [
  { id: "sec-tfidf", code: "01", label: "Pipeline TF-IDF" },
  { id: "sec-classifiers", code: "02", label: "Naive Bayes & KNN" },
  { id: "sec-comparison", code: "03", label: "Komparasi & Latensi" },
];

function ConfusionMatrixGrid({
  title,
  evaluation,
}: {
  title: string;
  evaluation: ModelEvaluationMetrics;
}) {
  const { tn, fp, fn, tp } = evaluation.confusionMatrix;
  const total = tn + fp + fn + tp;

  return (
    <div className="rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-4 shadow-[2px_2px_0px_#202020]">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-display text-sm font-bold text-[#171717]">{title}</h4>
        <span className="font-mono-num text-[11px] font-bold text-[#666666]">
          n = {total} (Test Set)
        </span>
      </div>

      <ComicStaggerGroup staggerMs={55} className="grid grid-cols-[auto_1fr_1fr] gap-2 text-center text-xs">
        <div />
        <div className="pb-1 font-mono-num text-[11px] font-bold text-[#171717]">
          Prediksi: Negatif
        </div>
        <div className="pb-1 font-mono-num text-[11px] font-bold text-[#171717]">
          Prediksi: Positif
        </div>

        {/* Actual Negative Row */}
        <div className="flex items-center justify-end pr-2 font-mono-num text-[11px] font-bold text-[#171717]">
          Aktual Negatif
        </div>
        <ComicStaggerItem>
          <div className="rounded-lg border-2 border-[#202020] bg-[#FFFDFC] p-3 shadow-[1.5px_1.5px_0px_#202020]">
            <div className="font-mono-num text-xl font-bold text-[#171717]">
              <CountUpNumber value={tn} durationMs={650} />
            </div>
            <div className="text-[10px] font-bold text-[#666666] uppercase mt-0.5">True Negative (TN)</div>
          </div>
        </ComicStaggerItem>
        <ComicStaggerItem>
          <div className="rounded-lg border-2 border-[#202020] bg-[#FA7777]/25 p-3 shadow-[1.5px_1.5px_0px_#202020]">
            <div className="font-mono-num text-xl font-bold text-[#BA2A2A]">
              <CountUpNumber value={fp} durationMs={650} />
            </div>
            <div className="text-[10px] font-bold text-[#BA2A2A] uppercase mt-0.5">False Positive (FP)</div>
          </div>
        </ComicStaggerItem>

        {/* Actual Positive Row */}
        <div className="flex items-center justify-end pr-2 font-mono-num text-[11px] font-bold text-[#171717]">
          Aktual Positif
        </div>
        <ComicStaggerItem>
          <div className="rounded-lg border-2 border-[#202020] bg-[#FA7777]/25 p-3 shadow-[1.5px_1.5px_0px_#202020]">
            <div className="font-mono-num text-xl font-bold text-[#BA2A2A]">
              <CountUpNumber value={fn} durationMs={650} />
            </div>
            <div className="text-[10px] font-bold text-[#BA2A2A] uppercase mt-0.5">False Negative (FN)</div>
          </div>
        </ComicStaggerItem>
        <ComicStaggerItem>
          <div className="rounded-lg border-2 border-[#202020] bg-[#65C98A]/35 p-3 shadow-[1.5px_1.5px_0px_#202020]">
            <div className="font-mono-num text-xl font-bold text-[#228448]">
              <CountUpNumber value={tp} durationMs={650} />
            </div>
            <div className="text-[10px] font-bold text-[#228448] uppercase mt-0.5">True Positive (TP)</div>
          </div>
        </ComicStaggerItem>
      </ComicStaggerGroup>
    </div>
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
      <PageHeader
        title="Evaluasi Model &amp; Ekstraksi Fitur"
        tag="METODOLOGI ML"
        speechText="CEK PERFORMA MODEL!"
        description="Detail arsitektur ekstraksi fitur TF-IDF serta perbandingan metrik ilmiah antara Multinomial Naive Bayes dan K-Nearest Neighbors pada hold-out test set."
        badge={
          <span className="rounded-md border border-[#202020] bg-[#65C98A] px-2.5 py-0.5 font-mono-num text-[11px] font-bold text-[#171717] shadow-[1.5px_1.5px_0px_#202020]">
            {modelStatus.ready ? "Model Engine Siap" : "Memuat..."}
          </span>
        }
      />

      <SectionNavigationBar sections={MODEL_SECTIONS} />

      {/* 1. TF-IDF Panel */}
      <div id="sec-tfidf" className="scroll-mt-20">
        <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b-2 border-[#202020]/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded border border-[#202020] bg-[#A78BFA] px-2 py-0.5 text-[10px] font-bold uppercase font-mono text-[#171717]">
                  Tahap 1
                </span>
                <h2 className="font-display text-xl font-bold text-[#171717]">
                  TF-IDF Vectorizer &amp; Text Preprocessing
                </h2>
              </div>
              <p className="mt-1 text-xs text-[#666666] leading-relaxed">
                Diekstrak dari notebook penelitian{" "}
                <code className="break-all rounded border border-[#202020] bg-[#F7F4EC] px-1.5 py-0.5 text-[#171717] font-mono">
                  {metadata.notebookFile}
                </code>{" "}
                (fit hanya pada {metadata.dataset.split.trainSize.toLocaleString("id-ID")} data training).
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Parameters Grid */}
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
                  className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-3 shadow-[1.5px_1.5px_0px_#202020]"
                >
                  <div className="text-[10px] font-mono font-bold text-[#666666] uppercase">{item.label}</div>
                  <div className="font-mono-num mt-1 text-sm font-bold text-[#171717]">
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Preprocessing Steps */}
            <div className="lg:col-span-5 rounded-lg border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[2px_2px_0px_#202020]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#171717] pb-2 border-b border-[#202020]/15">
                <Sliders className="h-4 w-4 text-[#8060D8]" />
                Urutan Preprocessing Teks (Cell 9)
              </div>
              <ol className="mt-3 space-y-1.5 text-xs text-[#171717]">
                {[
                  "1. Case folding: mengubah seluruh teks menjadi huruf kecil",
                  "2. Hapus URL (pola regex http\\S+ dan www\\S+)",
                  "3. Hapus tag HTML (<.*?>)",
                  "4. Hapus seluruh angka numerik (\\d+)",
                  "5. Hapus tanda baca & non-alfabet ([^a-z\\s] -> spasi)",
                  "6. Normalisasi spasi berlebih dan pemangkasan (trim)",
                ].map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#228448]" />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 rounded border border-[#202020] bg-[#F7F4EC] p-2 text-[11px] text-[#666666]">
                <strong>Catatan metodologis:</strong> Tidak menggunakan stemming/lemmatization sesuai pipeline asli penelitian.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Naive Bayes & KNN Side-by-Side */}
      <div id="sec-classifiers" className="scroll-mt-20 space-y-3">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Naive Bayes Card */}
          <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3.5px_3.5px_0px_#202020]">
            <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#202020]/10">
              <div>
                <div className="flex items-center gap-2">
                  <AlgorithmBadge algorithm="naive_bayes" />
                  <span className="rounded border border-[#202020] bg-[#65C98A] px-2 py-0.5 text-[10px] font-bold text-[#171717]">
                    Akurasi 80.50%
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#666666] leading-relaxed">
                  Model probabilistik berbasis teorema Bayes dengan asumsi independensi fitur multinomial pada bobot TF-IDF. Menghitung posterior probability melalui normalisasi log-sum-exp.
                </p>
              </div>
            </div>

            {/* Params */}
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
                  className="rounded-lg border border-[#202020] bg-[#F7F4EC] p-2.5"
                >
                  <div className="text-[10px] font-mono text-[#666666]">{p.label}</div>
                  <div className="font-mono-num mt-0.5 text-xs font-bold text-[#171717]">
                    {p.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Metrics */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-lg border-2 border-[#202020] bg-[#A78BFA]/20 p-2.5 shadow-[1.5px_1.5px_0px_#202020]">
                <div className="text-[10px] font-mono font-bold text-[#171717] uppercase">Accuracy</div>
                <div className="font-mono-num mt-0.5 text-lg font-bold text-[#171717]">
                  {(nb.evaluation.accuracy * 100).toFixed(2)}%
                </div>
              </div>
              <div className="rounded-lg border-2 border-[#202020] bg-[#A78BFA]/20 p-2.5 shadow-[1.5px_1.5px_0px_#202020]">
                <div className="text-[10px] font-mono font-bold text-[#171717] uppercase">Precision (+)</div>
                <div className="font-mono-num mt-0.5 text-lg font-bold text-[#171717]">
                  {nb.evaluation.precisionPositive.toFixed(4)}
                </div>
              </div>
              <div className="rounded-lg border-2 border-[#202020] bg-[#A78BFA]/20 p-2.5 shadow-[1.5px_1.5px_0px_#202020]">
                <div className="text-[10px] font-mono font-bold text-[#171717] uppercase">Recall (+)</div>
                <div className="font-mono-num mt-0.5 text-lg font-bold text-[#171717]">
                  {nb.evaluation.recallPositive.toFixed(4)}
                </div>
              </div>
              <div className="rounded-lg border-2 border-[#202020] bg-[#A78BFA]/20 p-2.5 shadow-[1.5px_1.5px_0px_#202020]">
                <div className="text-[10px] font-mono font-bold text-[#171717] uppercase">F1-Score (+)</div>
                <div className="font-mono-num mt-0.5 text-lg font-bold text-[#171717]">
                  {nb.evaluation.f1Positive.toFixed(4)}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <ConfusionMatrixGrid
                title="Confusion Matrix — Naive Bayes"
                evaluation={nb.evaluation}
              />
            </div>
          </div>

          {/* KNN Card */}
          <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3.5px_3.5px_0px_#202020]">
            <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#202020]/10">
              <div>
                <div className="flex items-center gap-2">
                  <AlgorithmBadge algorithm="knn" />
                  <span className="rounded border border-[#202020] bg-[#FFFDFC] px-2 py-0.5 text-[10px] font-bold text-[#171717]">
                    Akurasi 74.12%
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#666666] leading-relaxed">
                  Algoritma berbasis kedekatan vektor yang mencari 5 tetangga terdekat pada ruang vektor TF-IDF menggunakan cosine distance. Menghasilkan skor voting proporsi tetangga (bukan calibrated probability).
                </p>
              </div>
            </div>

            {/* Params */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: "Nilai K", val: String(knn.params.nNeighbors) },
                { label: "Metrik Jarak", val: knn.params.metric },
                { label: "Weights", val: knn.params.weights },
                {
                  label: "Train Vectors",
                  val: knn.params.trainingVectors.toLocaleString("id-ID"),
                },
              ].map((p) => (
                <div
                  key={p.label}
                  className="rounded-lg border border-[#202020] bg-[#F7F4EC] p-2.5"
                >
                  <div className="text-[10px] font-mono text-[#666666]">{p.label}</div>
                  <div className="font-mono-num mt-0.5 text-xs font-bold text-[#171717]">
                    {p.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Metrics */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-lg border-2 border-[#202020] bg-[#E8BC55]/25 p-2.5 shadow-[1.5px_1.5px_0px_#202020]">
                <div className="text-[10px] font-mono font-bold text-[#171717] uppercase">Accuracy</div>
                <div className="font-mono-num mt-0.5 text-lg font-bold text-[#171717]">
                  {(knn.evaluation.accuracy * 100).toFixed(2)}%
                </div>
              </div>
              <div className="rounded-lg border-2 border-[#202020] bg-[#E8BC55]/25 p-2.5 shadow-[1.5px_1.5px_0px_#202020]">
                <div className="text-[10px] font-mono font-bold text-[#171717] uppercase">Precision (+)</div>
                <div className="font-mono-num mt-0.5 text-lg font-bold text-[#171717]">
                  {knn.evaluation.precisionPositive.toFixed(4)}
                </div>
              </div>
              <div className="rounded-lg border-2 border-[#202020] bg-[#E8BC55]/25 p-2.5 shadow-[1.5px_1.5px_0px_#202020]">
                <div className="text-[10px] font-mono font-bold text-[#171717] uppercase">Recall (+)</div>
                <div className="font-mono-num mt-0.5 text-lg font-bold text-[#171717]">
                  {knn.evaluation.recallPositive.toFixed(4)}
                </div>
              </div>
              <div className="rounded-lg border-2 border-[#202020] bg-[#E8BC55]/25 p-2.5 shadow-[1.5px_1.5px_0px_#202020]">
                <div className="text-[10px] font-mono font-bold text-[#171717] uppercase">F1-Score (+)</div>
                <div className="font-mono-num mt-0.5 text-lg font-bold text-[#171717]">
                  {knn.evaluation.f1Positive.toFixed(4)}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <ConfusionMatrixGrid
                title="Confusion Matrix — KNN"
                evaluation={knn.evaluation}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Comparison & Browser Latency */}
      <div id="sec-comparison" className="scroll-mt-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Comparison Chart & Table */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
              <div className="pb-3 border-b-2 border-[#202020]/10">
                <h3 className="font-display text-lg font-bold text-[#171717]">
                  Perbandingan Komparatif NB vs KNN
                </h3>
                <p className="text-xs text-[#666666]">
                  Multinomial Naive Bayes unggul pada seluruh metrik klasifikasi test set
                </p>
              </div>

              <div className="mt-4">
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

              <div className="mt-4 overflow-x-auto rounded-lg border-2 border-[#202020]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-[#202020] bg-[#F7F4EC] text-[#171717] font-bold font-mono">
                      <th className="py-2.5 px-3">Algoritma</th>
                      <th className="py-2.5 px-3">Accuracy</th>
                      <th className="py-2.5 px-3">Precision (+)</th>
                      <th className="py-2.5 px-3">Recall (+)</th>
                      <th className="py-2.5 px-3">F1-Score (+)</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-num divide-y border-[#202020]/20 bg-[#FFFDFC]">
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-bold text-[#8060D8]">
                        Multinomial Naive Bayes
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#228448]">
                        {(nb.evaluation.accuracy * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3">{nb.evaluation.precisionPositive.toFixed(4)}</td>
                      <td className="py-2.5 px-3">{nb.evaluation.recallPositive.toFixed(4)}</td>
                      <td className="py-2.5 px-3 font-bold">{nb.evaluation.f1Positive.toFixed(4)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-bold text-[#C89B2B]">
                        K-Nearest Neighbors (k=5)
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#171717]">
                        {(knn.evaluation.accuracy * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3">{knn.evaluation.precisionPositive.toFixed(4)}</td>
                      <td className="py-2.5 px-3">{knn.evaluation.recallPositive.toFixed(4)}</td>
                      <td className="py-2.5 px-3 font-bold">{knn.evaluation.f1Positive.toFixed(4)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Latency Benchmark & Top Terms */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Latency Card */}
            <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
              <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-[#202020]/10">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-[#8060D8]" />
                  <h3 className="font-display text-base font-bold text-[#171717]">
                    Uji Kecepatan Inferensi Nyata
                  </h3>
                </div>
                <PrimaryButton
                  size="sm"
                  disabled={benchmarkRunning}
                  onClick={() => void runLiveLatencyBenchmark()}
                  isLoading={benchmarkRunning}
                  icon={<Play className="h-3.5 w-3.5" />}
                >
                  Uji 5 Teks
                </PrimaryButton>
              </div>

              <p className="mt-2 text-xs text-[#666666]">
                Mengukur durasi inferensi Web Worker langsung di CPU browser Anda saat ini.
              </p>

              {benchmarkError && (
                <MangaShake shakeKey={benchmarkError}>
                  <p className="mt-2 text-xs text-[#BA2A2A] font-bold">{benchmarkError}</p>
                </MangaShake>
              )}

              {benchmarkResult ? (
                <ComicPanelReveal direction="pop" className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <ComicPopCallout text="BENCHMARKED!" tone="positive" tilt={-2} />
                    <span className="font-mono text-[10px] text-[#666666]">Web Worker Live</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border-2 border-[#202020] bg-[#A78BFA]/20 p-3 shadow-[1.5px_1.5px_0px_#202020]">
                      <div className="text-[10px] font-mono font-bold text-[#171717] uppercase">
                        Naive Bayes ({benchmarkResult.sampleCount} ulasan)
                      </div>
                      <div className="font-mono-num mt-1 text-lg font-bold text-[#171717]">
                        {benchmarkResult.nbMs.toFixed(2)} ms
                      </div>
                    </div>
                    <div className="rounded-lg border-2 border-[#202020] bg-[#E8BC55]/25 p-3 shadow-[1.5px_1.5px_0px_#202020]">
                      <div className="text-[10px] font-mono font-bold text-[#171717] uppercase">
                        KNN Cosine ({benchmarkResult.sampleCount} ulasan)
                      </div>
                      <div className="font-mono-num mt-1 text-lg font-bold text-[#171717]">
                        {benchmarkResult.knnMs.toFixed(2)} ms
                      </div>
                    </div>
                  </div>
                </ComicPanelReveal>
              ) : (
                <div className="mt-3 rounded-lg border-2 border-dashed border-[#202020]/40 bg-[#F7F4EC] p-3 text-xs text-[#666666]">
                  Klik <strong>Uji 5 Teks</strong> untuk menjalankan simulasi inferensi real-time di browser.
                </div>
              )}
            </div>

            {/* Top Terms Card */}
            <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
              <div className="flex items-center gap-2 pb-3 border-b-2 border-[#202020]/10">
                <Layers className="h-4 w-4 text-[#228448]" />
                <h3 className="font-display text-base font-bold text-[#171717]">
                  Top Term TF-IDF — Sentimen Positif
                </h3>
              </div>
              <p className="mt-1 text-xs text-[#666666]">
                Bobot kata rata-rata tertinggi pada korpus pelatihan berlabel positif
              </p>
              <div className="mt-3">
                <TopTermsBarChart
                  terms={metadata.dataset.topTerms.positive}
                  accent="#65C98A"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
