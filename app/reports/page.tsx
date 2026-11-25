"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  ShieldCheck,
} from "lucide-react";
import {
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/ScrollPrimitives";
import { useGameSent } from "@/components/providers/GameSentProvider";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { HudCard } from "@/components/ui/HudCard";
import { AlgorithmBadge, SentimentBadge } from "@/components/ui/StatusBadge";
import { getCachedResearchDataset } from "@/lib/data/research-cache";
import {
  buildReportPayloadFromSession,
  exportReportCsv,
  exportReportPdf,
  exportReportXlsx,
  type ExportReportPayload,
} from "@/lib/export/exporters";
import type { AnalysisSessionRecord } from "@/lib/storage/indexed-db";

export default function ReportsPage() {
  const shouldReduceMotion = useReducedMotion();
  const { metadata, history, activeSession, openSessionById } = useGameSent();

  const [selectedSource, setSelectedSource] = useState<string>(
    activeSession ? activeSession.id : "research"
  );
  const [loadedSession, setLoadedSession] =
    useState<AnalysisSessionRecord | null>(activeSession);
  const [customTitle, setCustomTitle] = useState(
    "Laporan Analisis Sentimen GameSent"
  );
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSource === "research") {
      setLoadedSession(null);
      return;
    }
    if (activeSession?.id === selectedSource) {
      setLoadedSession(activeSession);
      return;
    }
    let cancelled = false;
    void openSessionById(selectedSource).then((rec) => {
      if (!cancelled) setLoadedSession(rec);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSource, activeSession, openSessionById]);

  const selectedSummary = useMemo(() => {
    if (selectedSource === "research") return null;
    return history.find((s) => s.id === selectedSource) ?? null;
  }, [selectedSource, history]);

  const previewSummary = useMemo(() => {
    const src = loadedSession ?? selectedSummary;
    if (src) {
      return {
        title: customTitle.trim() || src.sessionName,
        datasetSource: src.fileName ?? `Sesi Lokal (${src.sourceType})`,
        total: src.totalRows,
        positive: src.positiveCount,
        negative: src.negativeCount,
        algorithm: src.algorithm,
        isResearch: false,
      };
    }
    return {
      title: customTitle.trim() || "Laporan Dataset Penelitian GameSent",
      datasetSource: metadata.sourceFile,
      total: metadata.dataset.totalReviews,
      positive: metadata.dataset.positiveReviews,
      negative: metadata.dataset.negativeReviews,
      algorithm: "research_dataset" as const,
      isResearch: true,
    };
  }, [loadedSession, selectedSummary, customTitle, metadata]);

  const buildCurrentPayload = async (): Promise<ExportReportPayload> => {
    if (selectedSource !== "research") {
      const full = loadedSession ?? (await openSessionById(selectedSource));
      if (!full) {
        throw new Error("Sesi analisis lokal tidak ditemukan di IndexedDB.");
      }
      return buildReportPayloadFromSession({
        title: previewSummary.title,
        datasetSource: previewSummary.datasetSource,
        algorithm: full.algorithm,
        rows: full.rows,
        metadata,
      });
    }

    // Use cached 4,997-row research dataset for export
    const records = await getCachedResearchDataset();

    const ml = metadata.dataset.games["Mobile Legends"];
    const dota = metadata.dataset.games["Dota 2"];

    return {
      title: previewSummary.title,
      createdAt: new Date().toISOString(),
      datasetSource: metadata.sourceFile,
      algorithm: "research_dataset",
      totalReviews: records.length,
      positiveCount: metadata.dataset.positiveReviews,
      negativeCount: metadata.dataset.negativeReviews,
      gameDistribution: [
        {
          game: "Mobile Legends",
          total: ml.total,
          positive: ml.positive,
          negative: ml.negative,
        },
        {
          game: "Dota 2",
          total: dota.total,
          positive: dota.positive,
          negative: dota.negative,
        },
      ],
      rows: records.map((r, i) => ({
        rowIndex: i + 1,
        game: r.game,
        review: r.review,
        actualLabel: r.label,
        labelSource: r.label_source,
      })),
    };
  };

  const handleExport = async (fmt: "csv" | "xlsx" | "pdf") => {
    setExportError(null);
    setExportFeedback(null);
    setExporting(fmt);
    try {
      const payload = await buildCurrentPayload();
      let filename = "";
      if (fmt === "csv") filename = exportReportCsv(payload);
      if (fmt === "xlsx") filename = await exportReportXlsx(payload);
      if (fmt === "pdf") filename = await exportReportPdf(payload);
      setExportFeedback(`Berhasil mengunduh laporan: ${filename}`);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Gagal mengekspor laporan."
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Configuration Panel (Fade Up) */}
        <ScrollReveal variant="fade-up" className="lg:col-span-5">
        <HudCard tone="violet" hudTag="Konfigurasi Ekspor" className="h-full">
          <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
            Buat &amp; Ekspor Laporan
          </h2>
          <p className="mt-1 text-xs text-[#94A3B8]">
            Unduh hasil analisis dalam format CSV, XLSX (Excel), atau PDF. Label
            aktual dan prediksi model selalu dipisahkan secara eksplisit.
          </p>

          <div className="mt-5 space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#F1F5F9]">
                Sumber Laporan
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2.5 text-[#F1F5F9]"
              >
                <option value="research">
                  Dataset Penelitian Utama ({metadata.dataset.totalReviews} ulasan)
                </option>
                {history.map((s) => (
                  <option key={s.id} value={s.id}>
                    [Lokal] {s.sessionName} ({s.totalRows} baris)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#F1F5F9]">
                Judul Laporan
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2.5 text-[#F1F5F9]"
              />
            </div>

            <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3 text-[11px] text-[#94A3B8] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#22C55E]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Aturan Integritas Ekspor
              </div>
              <p>
                • Dataset asli tidak dimodifikasi.<br />
                • Kolom <code>actual_label</code> dan <code>predicted_sentiment</code> dipisahkan.<br />
                • File diunduh langsung ke perangkat pengguna tanpa penyimpanan server.
              </p>
            </div>

            {exportFeedback && (
              <motion.div
                key={exportFeedback}
                initial={shouldReduceMotion ? false : { opacity: 0.7, scale: 0.97 }}
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: [0.97, 1.015, 1] }
                }
                transition={{ duration: shouldReduceMotion ? 0 : 0.38 }}
                className="flex items-center gap-2 rounded-lg border border-[#22C55E]/35 bg-[#22C55E]/10 p-3 text-xs text-[#86EFAC]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{exportFeedback}</span>
              </motion.div>
            )}

            {exportError && (
              <div className="rounded-lg border border-[#F43F5E]/40 bg-[#F43F5E]/10 p-3 text-xs text-[#FDA4AF]">
                {exportError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-1">
              <button
                type="button"
                disabled={exporting !== null}
                onClick={() => void handleExport("csv")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#22D3EE]/45 bg-[#22D3EE]/15 px-4 py-2.5 text-xs font-semibold text-[#F1F5F9] transition hover:bg-[#22D3EE]/25 disabled:opacity-50"
              >
                <Download className="h-4 w-4 text-[#22D3EE]" />
                {exporting === "csv" ? "Ekspor..." : "Ekspor CSV"}
              </button>
              <button
                type="button"
                disabled={exporting !== null}
                onClick={() => void handleExport("xlsx")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#22C55E]/45 bg-[#22C55E]/15 px-4 py-2.5 text-xs font-semibold text-[#F1F5F9] transition hover:bg-[#22C55E]/25 disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4 text-[#22C55E]" />
                {exporting === "xlsx" ? "Ekspor..." : "Ekspor XLSX"}
              </button>
              <button
                type="button"
                disabled={exporting !== null}
                onClick={() => void handleExport("pdf")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/45 bg-[#8B5CF6]/20 px-4 py-2.5 text-xs font-semibold text-[#F1F5F9] transition hover:bg-[#8B5CF6]/30 disabled:opacity-50"
              >
                <FileText className="h-4 w-4 text-[#A78BFA]" />
                {exporting === "pdf" ? "Ekspor..." : "Ekspor PDF"}
              </button>
            </div>
          </div>
        </HudCard>
        </ScrollReveal>

        {/* Preview Panel (Fade & Scale) */}
        <ScrollReveal variant="fade-scale" delay={0.08} className="lg:col-span-7">
        <HudCard tone="cyan" hudTag="Pratinjau Konten Laporan" className="h-full">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#263149] pb-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#F1F5F9]">
                {previewSummary.title}
              </h3>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Sumber:{" "}
                <code className="rounded bg-[#080B18] px-1.5 py-0.5 text-[#F1F5F9]">
                  {previewSummary.datasetSource}
                </code>
              </p>
            </div>
            {previewSummary.algorithm === "research_dataset" ? (
              <span className="rounded-md border border-[#3B82F6]/40 bg-[#3B82F6]/12 px-2.5 py-1 text-xs text-[#93C5FD]">
                Dataset Penelitian (Label Asli)
              </span>
            ) : (
              <AlgorithmBadge algorithm={previewSummary.algorithm} />
            )}
          </div>

          <StaggerGroup staggerMs={80} className="mt-4 grid grid-cols-3 gap-3">
            <StaggerItem variant="slide-up">
            <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
              <div className="text-[11px] text-[#94A3B8]">Total Review</div>
              <div className="font-mono-num mt-1 text-xl font-bold text-[#F1F5F9]">
                <CountUpNumber value={previewSummary.total} />
              </div>
            </div>
            </StaggerItem>
            <StaggerItem variant="slide-up">
            <div className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 p-3">
              <div className="text-[11px] text-[#86EFAC]">Positif</div>
              <div className="font-mono-num mt-1 text-xl font-bold text-[#22C55E]">
                <CountUpNumber value={previewSummary.positive} />
              </div>
            </div>
            </StaggerItem>
            <StaggerItem variant="slide-up">
            <div className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 p-3">
              <div className="text-[11px] text-[#FDA4AF]">Negatif</div>
              <div className="font-mono-num mt-1 text-xl font-bold text-[#F43F5E]">
                <CountUpNumber value={previewSummary.negative} />
              </div>
            </div>
            </StaggerItem>
          </StaggerGroup>

          {loadedSession ? (
            <div className="mt-5">
              <h4 className="mb-2 text-xs font-semibold text-[#94A3B8]">
                Sampel Baris Sesi (maks. 8 baris pertama)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#263149] text-[#94A3B8]">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-4">Ulasan</th>
                      <th className="py-2 pr-3">Label Aktual</th>
                      <th className="py-2">Prediksi Model</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#263149]/60">
                    {loadedSession.rows.slice(0, 8).map((r) => (
                      <tr key={r.rowIndex}>
                        <td className="font-mono-num py-2 pr-3 text-[#94A3B8]">
                          {r.rowIndex}
                        </td>
                        <td className="max-w-sm truncate py-2 pr-4 text-[#E2E8F0]">
                          {r.review}
                        </td>
                        <td className="py-2 pr-3">
                          {r.actualLabel ? (
                            <SentimentBadge sentiment={r.actualLabel} size="xs" />
                          ) : (
                            <span className="text-[#64748B]">-</span>
                          )}
                        </td>
                        <td className="py-2">
                          <SentimentBadge sentiment={r.predictedLabel} size="xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-[#263149] bg-[#080B18]/75 p-4 text-xs text-[#CBD5E1] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#22D3EE]">
                <Info className="h-4 w-4" />
                Ringkasan Dataset Penelitian yang Akan Diekspor
              </div>
              <p>
                Ekspor akan menyertakan seluruh{" "}
                <strong className="font-mono-num">
                  {metadata.dataset.totalReviews.toLocaleString("id-ID")}
                </strong>{" "}
                ulasan penelitian (Mobile Legends:{" "}
                <strong className="font-mono-num">
                  {metadata.dataset.games["Mobile Legends"].total}
                </strong>
                , Dota 2:{" "}
                <strong className="font-mono-num">
                  {metadata.dataset.games["Dota 2"].total}
                </strong>
                ) beserta kolom <code>actual_label</code> dan <code>label_source</code>{" "}
                asli tanpa mengubah data penelitian.
              </p>
            </div>
          )}
        </HudCard>
        </ScrollReveal>
      </div>
    </div>
  );
}
