"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  ShieldCheck,
} from "lucide-react";
import { useGameSent } from "@/components/providers/GameSentProvider";
import { ComicPopCallout, MangaShake } from "@/components/motion/AnimeComicMotion";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton } from "@/components/ui/Buttons";
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
      setExportFeedback(`Laporan berhasil diunduh: ${filename}`);
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
      <PageHeader
        title="Reports &amp; Export"
        tag="PUBLIKASI LAPORAN"
        description="Hasil analisis sentimen, distribusi game MOBA, dan metrik evaluasi model dapat diekspor ke dokumen formal PDF, lembar kerja XLSX, atau file data CSV."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Configuration & Export Triggers */}
        <div className="lg:col-span-5 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3.5px_3.5px_0px_#202020]">
          <h2 className="font-display text-lg font-bold text-[#171717]">
            Konfigurasi Dokumen Laporan
          </h2>
          <p className="mt-1 text-xs text-[#666666]">
            Pilih sumber data yang akan disertakan dalam file laporan riset.
          </p>

          <div className="mt-5 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#171717] mb-1">
                Sumber Data
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-2.5 font-bold text-[#171717]"
              >
                <option value="research">
                  Dataset Penelitian Utama ({metadata.dataset.totalReviews.toLocaleString("id-ID")} ulasan)
                </option>
                {history.map((s) => (
                  <option key={s.id} value={s.id}>
                    [Sesi Lokal] {s.sessionName} ({s.totalRows} baris)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#171717] mb-1">
                Judul Laporan
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-2.5 font-bold text-[#171717]"
              />
            </div>

            <div className="rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-3.5 text-xs text-[#171717] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#228448]">
                <ShieldCheck className="h-4 w-4" />
                Integritas Ilmiah Dokumen
              </div>
              <p className="text-[11px] text-[#666666] leading-relaxed">
                • Dataset penelitian tidak dimodifikasi sama sekali.<br />
                • Kolom <code>actual_label</code> dan <code>predicted_sentiment</code> dibedakan secara tegas.<br />
                • Dokumen dihasilkan langsung di browser pengguna tanpa transfer data server.
              </p>
            </div>

            {exportFeedback && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[#202020] bg-[#65C98A]/25 p-3 text-xs font-bold text-[#228448]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{exportFeedback}</span>
                </div>
                <ComicPopCallout text="EXPORTED!" tone="positive" tilt={-2} />
              </div>
            )}

            {exportError && (
              <MangaShake shakeKey={exportError}>
                <div className="rounded-xl border-2 border-[#202020] bg-[#FA7777]/25 p-3 text-xs font-bold text-[#BA2A2A]">
                  {exportError}
                </div>
              </MangaShake>
            )}

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-2">
              <PrimaryButton
                type="button"
                disabled={exporting !== null}
                onClick={() => void handleExport("csv")}
                isLoading={exporting === "csv"}
                icon={<Download className="h-4 w-4" />}
                size="sm"
              >
                Format CSV
              </PrimaryButton>

              <PrimaryButton
                type="button"
                variant="secondary"
                disabled={exporting !== null}
                onClick={() => void handleExport("xlsx")}
                isLoading={exporting === "xlsx"}
                icon={<FileSpreadsheet className="h-4 w-4 text-[#228448]" />}
                size="sm"
              >
                Format XLSX
              </PrimaryButton>

              <PrimaryButton
                type="button"
                variant="primary"
                disabled={exporting !== null}
                onClick={() => void handleExport("pdf")}
                isLoading={exporting === "pdf"}
                icon={<FileText className="h-4 w-4 text-[#171717]" />}
                size="sm"
              >
                Format PDF
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Right: Preview Panel */}
        <div className="lg:col-span-7 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3.5px_3.5px_0px_#202020]">
          <div className="flex flex-wrap items-start justify-between gap-2 pb-4 border-b-2 border-[#202020]/10">
            <div>
              <h3 className="font-display text-lg font-bold text-[#171717]">
                {previewSummary.title}
              </h3>
              <p className="mt-0.5 text-xs text-[#666666]">
                Sumber: <strong className="text-[#171717]">{previewSummary.datasetSource}</strong>
              </p>
            </div>
            {previewSummary.algorithm === "research_dataset" ? (
              <span className="rounded-md border-2 border-[#202020] bg-[#A78BFA] px-2.5 py-1 text-xs font-bold text-[#171717] shadow-[1.5px_1.5px_0px_#202020]">
                Dataset Penelitian Asli
              </span>
            ) : (
              <AlgorithmBadge algorithm={previewSummary.algorithm} />
            )}
          </div>

          {/* Quick Metrics */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
              <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">Total Ulasan</span>
              <span className="font-display text-xl font-bold text-[#171717]">
                <CountUpNumber value={previewSummary.total} />
              </span>
            </div>
            <div className="rounded-lg border-2 border-[#202020] bg-[#65C98A]/25 p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
              <span className="block text-[10px] font-mono font-bold text-[#228448] uppercase">Positif</span>
              <span className="font-display text-xl font-bold text-[#228448]">
                <CountUpNumber value={previewSummary.positive} />
              </span>
            </div>
            <div className="rounded-lg border-2 border-[#202020] bg-[#FA7777]/25 p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
              <span className="block text-[10px] font-mono font-bold text-[#BA2A2A] uppercase">Negatif</span>
              <span className="font-display text-xl font-bold text-[#BA2A2A]">
                <CountUpNumber value={previewSummary.negative} />
              </span>
            </div>
          </div>

          {loadedSession ? (
            <div className="mt-5">
              <h4 className="mb-2 text-xs font-bold text-[#666666] uppercase font-mono">
                Pratinjau 8 Baris Pertama Sesi:
              </h4>
              <div className="overflow-x-auto rounded-lg border-2 border-[#202020]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-[#202020] bg-[#F7F4EC] font-mono font-bold text-[#171717]">
                      <th className="py-2.5 px-3 w-12">#</th>
                      <th className="py-2.5 px-3">Teks Ulasan</th>
                      <th className="py-2.5 px-3 w-28">Label Aktual</th>
                      <th className="py-2.5 px-3 w-28">Prediksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-[#202020]/20 bg-[#FFFDFC]">
                    {loadedSession.rows.slice(0, 8).map((r) => (
                      <tr key={r.rowIndex}>
                        <td className="py-2 px-3 font-mono font-bold text-[#666666]">
                          #{r.rowIndex}
                        </td>
                        <td className="max-w-sm truncate py-2 px-3 text-[#171717]">
                          {r.review}
                        </td>
                        <td className="py-2 px-3">
                          {r.actualLabel ? (
                            <SentimentBadge sentiment={r.actualLabel} size="xs" />
                          ) : (
                            <span className="text-[#666666]">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <SentimentBadge sentiment={r.predictedLabel} size="xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-4 text-xs text-[#171717] space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#8060D8]">
                <Info className="h-4 w-4" />
                Cakupan Dataset Penelitian
              </div>
              <p className="leading-relaxed">
                Ekspor mencakup seluruh{" "}
                <strong>{metadata.dataset.totalReviews.toLocaleString("id-ID")}</strong> ulasan
                (Mobile Legends: <strong>{metadata.dataset.games["Mobile Legends"].total}</strong>, Dota 2: <strong>{metadata.dataset.games["Dota 2"].total}</strong>)
                beserta kolom <code>id</code>, <code>game</code>, <code>review</code>, <code>label</code>, dan <code>label_source</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
