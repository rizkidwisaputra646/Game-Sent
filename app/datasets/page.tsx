"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  History,
  Info,
  Play,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useGameSent } from "@/components/providers/GameSentProvider";
import {
  ComicPopCallout,
  ComicScanningEffect,
  MangaShake,
} from "@/components/motion/AnimeComicMotion";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { AlgorithmBadge, GameBadge, SentimentBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/States";

const SentimentDonutChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then(
      (m) => m.SentimentDonutChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-xl border-2 border-[#202020] bg-[#FFFDFC]" />
    ),
  }
);

import {
  getCachedResearchDataset,
  type IndexedResearchRecord,
} from "@/lib/data/research-cache";
import { parseCsvFile } from "@/lib/dataset/csv-parser";
import { parseExcelFile } from "@/lib/dataset/excel-parser";
import {
  inferDefaultMapping,
  validateMappedDataset,
  type ColumnMapping,
  type DatasetValidationReport,
  type ParsedDatasetResult,
} from "@/lib/dataset/validator";
import {
  buildReportPayloadFromSession,
  exportReportCsv,
  exportReportPdf,
  exportReportXlsx,
} from "@/lib/export/exporters";
import { inferenceClient } from "@/lib/ml/client";
import type { AlgorithmId } from "@/lib/ml/types";
import type { AnalysisSessionRecord } from "@/lib/storage/indexed-db";

const PAGE_SIZE = 20;

export default function DatasetsPage() {
  const {
    metadata,
    history,
    activeSession,
    setActiveSession,
    openSessionById,
    saveSession,
    removeSession,
    clearHistory,
    preferences,
  } = useGameSent();

  const [activeTab, setActiveTab] = useState<"research" | "import" | "history">(
    "research"
  );

  // Research dataset state (read-only, cached in memory after first load)
  const [researchRows, setResearchRows] = useState<IndexedResearchRecord[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [researchSearch, setResearchSearch] = useState("");
  const [researchGameFilter, setResearchGameFilter] = useState<string>("all");
  const [researchSentimentFilter, setResearchSentimentFilter] =
    useState<string>("all");
  const [researchPage, setResearchPage] = useState(1);

  // Import additional dataset state
  const [isDragging, setIsDragging] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedDataset, setParsedDataset] =
    useState<ParsedDatasetResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    reviewColumn: "",
    gameColumn: null,
    dateColumn: null,
    sentimentColumn: null,
  });
  const [excludeDuplicates, setExcludeDuplicates] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmId>(
    preferences.preferredAlgorithm
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState<{
    stage: "validation" | "preprocessing" | "tfidf" | "inference" | "result";
    processed: number;
    total: number;
  } | null>(null);
  const [sessionFilter, setSessionFilter] = useState<"all" | "positive" | "negative">("all");
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionPage, setSessionPage] = useState(1);

  // Load research dataset
  useEffect(() => {
    if (researchRows.length > 0) return;
    let cancelled = false;
    setResearchLoading(true);
    setResearchError(null);
    getCachedResearchDataset()
      .then((data) => {
        if (!cancelled) setResearchRows(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setResearchError(
            err instanceof Error ? err.message : "Gagal memuat dataset penelitian."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setResearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [researchRows.length]);

  const filteredResearchRows = useMemo(() => {
    const q = researchSearch.trim().toLowerCase();
    return researchRows.filter((r) => {
      if (researchGameFilter !== "all" && r.game !== researchGameFilter) {
        return false;
      }
      if (
        researchSentimentFilter !== "all" &&
        r.label !== researchSentimentFilter
      ) {
        return false;
      }
      if (q && !r._search.includes(q)) {
        return false;
      }
      return true;
    });
  }, [
    researchRows,
    researchSearch,
    researchGameFilter,
    researchSentimentFilter,
  ]);

  const totalResearchPages = Math.max(
    1,
    Math.ceil(filteredResearchRows.length / PAGE_SIZE)
  );
  const pagedResearchRows = filteredResearchRows.slice(
    (researchPage - 1) * PAGE_SIZE,
    researchPage * PAGE_SIZE
  );

  const validationReport: DatasetValidationReport | null = useMemo(() => {
    if (!parsedDataset) return null;
    return validateMappedDataset(parsedDataset, mapping);
  }, [parsedDataset, mapping]);

  const filteredSessionRows = useMemo(() => {
    if (!activeSession) return [];
    const q = sessionSearch.trim().toLowerCase();
    return activeSession.rows.filter((r) => {
      if (sessionFilter !== "all" && r.predictedLabel !== sessionFilter) {
        return false;
      }
      if (
        q &&
        !r.review.toLowerCase().includes(q) &&
        !(r.game ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [activeSession, sessionFilter, sessionSearch]);

  const totalSessionPages = Math.max(
    1,
    Math.ceil(filteredSessionRows.length / PAGE_SIZE)
  );
  const pagedSessionRows = filteredSessionRows.slice(
    (sessionPage - 1) * PAGE_SIZE,
    sessionPage * PAGE_SIZE
  );

  const handleFileSelected = async (file: File) => {
    setImportError(null);
    setParsedDataset(null);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") {
      setImportError(
        "Format file tidak didukung. Gunakan file dengan format .csv atau .xlsx."
      );
      return;
    }

    setParseLoading(true);
    try {
      const parsed =
        ext === "csv" ? await parseCsvFile(file) : await parseExcelFile(file);
      const defaultMap = inferDefaultMapping(parsed.columns);
      setParsedDataset(parsed);
      setMapping(defaultMap);
      setSessionName(file.name.replace(/\.(csv|xlsx)$/i, ""));
      setExcludeDuplicates(false);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Gagal membaca file dataset."
      );
    } finally {
      setParseLoading(false);
    }
  };

  const handleRunDatasetAnalysis = async () => {
    if (!parsedDataset || !validationReport || !validationReport.isValidToAnalyze) {
      return;
    }

    setImportError(null);
    setAnalyzing(true);
    setAnalyzeProgress({
      stage: "validation",
      processed: 0,
      total: validationReport.validRowsCount,
    });

    try {
      const rowsToProcess = excludeDuplicates
        ? validationReport.validRows.filter((r) => !r.isDuplicate)
        : validationReport.validRows;

      if (rowsToProcess.length === 0) {
        throw new Error("Tidak ada baris tersisa setelah memfilter duplikat.");
      }

      const workerItems = rowsToProcess.map((r) => ({
        rowIndex: r.rowIndex,
        review: r.review,
        game: r.game,
        date: r.date,
        actualLabel: r.actualLabel,
      }));

      const res = await inferenceClient.predictBatch(
        workerItems,
        selectedAlgo,
        (prog) => {
          setAnalyzeProgress({
            stage: prog.stage,
            processed: prog.processed,
            total: prog.total,
          });
        }
      );

      setAnalyzeProgress({
        stage: "result",
        processed: res.results.length,
        total: rowsToProcess.length,
      });

      const posCount = res.results.filter(
        (r) => r.predictedLabel === "positive"
      ).length;
      const negCount = res.results.filter(
        (r) => r.predictedLabel === "negative"
      ).length;

      const gameBreakdown: Record<
        string,
        { total: number; positive: number; negative: number }
      > = {};
      for (const r of res.results) {
        if (r.game) {
          if (!gameBreakdown[r.game]) {
            gameBreakdown[r.game] = { total: 0, positive: 0, negative: 0 };
          }
          gameBreakdown[r.game].total++;
          if (r.predictedLabel === "positive") gameBreakdown[r.game].positive++;
          else gameBreakdown[r.game].negative++;
        }
      }

      const savedSession: AnalysisSessionRecord = {
        id: `dataset-${Date.now()}`,
        sessionName:
          sessionName.trim() || parsedDataset.fileName.replace(/\.(csv|xlsx)$/i, ""),
        sourceType: "dataset_import",
        fileName: parsedDataset.fileName,
        fileSizeBytes: parsedDataset.fileSizeBytes,
        createdAt: new Date().toISOString(),
        algorithm: selectedAlgo,
        totalRows: res.results.length,
        positiveCount: posCount,
        negativeCount: negCount,
        failedCount: res.failedCount,
        status: res.failedCount > 0 ? "partial" : "completed",
        durationMs: res.durationMs,
        rows: res.results,
        gameBreakdown:
          Object.keys(gameBreakdown).length > 0 ? gameBreakdown : undefined,
      };

      await saveSession(savedSession);
      setActiveSession(savedSession);
      setSessionFilter("all");
      setSessionSearch("");
      setSessionPage(1);
      setTimeout(() => {
        document
          .getElementById("sec-session-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Gagal menjalankan analisis dataset."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportActiveSession = async (fmt: "csv" | "xlsx" | "pdf") => {
    if (!activeSession) return;
    const payload = buildReportPayloadFromSession({
      title: activeSession.sessionName,
      datasetSource: activeSession.fileName ?? "Sesi Dataset Tambahan",
      algorithm: activeSession.algorithm,
      rows: activeSession.rows,
      metadata,
    });
    if (fmt === "csv") exportReportCsv(payload);
    if (fmt === "xlsx") await exportReportXlsx(payload);
    if (fmt === "pdf") await exportReportPdf(payload);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dataset Explorer"
        tag="DATASET PENELITIAN &amp; IMPORT"
        speechText="JELAJAHI ULASAN!"
        description="Jelajahi 4.997 ulasan berlabel pada dataset penelitian (Mobile Legends &amp; Dota 2), atau unggah file CSV/XLSX eksternal untuk analisis sentimen terpisah."
      />

      {/* Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-3 shadow-[3px_3px_0px_#202020]">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("research")}
            className={`inline-flex items-center gap-2 rounded-xl border-2 border-[#202020] px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "research"
                ? "bg-[#A78BFA] text-[#171717] shadow-[2px_2px_0px_#202020]"
                : "bg-[#FFFDFC] text-[#666666] hover:bg-[#F7F4EC]"
            }`}
          >
            <Database className="h-4 w-4" />
            Dataset Penelitian ({metadata.dataset.totalReviews.toLocaleString("id-ID")})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`inline-flex items-center gap-2 rounded-xl border-2 border-[#202020] px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "import"
                ? "bg-[#3479D4] text-white shadow-[2px_2px_0px_#202020]"
                : "bg-[#FFFDFC] text-[#666666] hover:bg-[#F7F4EC]"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            Import CSV / Excel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-2 rounded-xl border-2 border-[#202020] px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-[#E8BC55] text-[#171717] shadow-[2px_2px_0px_#202020]"
                : "bg-[#FFFDFC] text-[#666666] hover:bg-[#F7F4EC]"
            }`}
          >
            <History className="h-4 w-4" />
            Riwayat Sesi Lokal ({history.length})
          </button>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs text-[#666666] font-medium">
          <ShieldCheck className="h-4 w-4 text-[#228448]" />
          Data diproses secara lokal
        </span>
      </div>

      {/* TAB 1: RESEARCH DATASET (READ-ONLY) */}
      {activeTab === "research" && (
        <div className="space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Total Ulasan", val: metadata.dataset.totalReviews.toLocaleString("id-ID"), color: "#A78BFA" },
              { label: "Mobile Legends", val: metadata.dataset.games["Mobile Legends"].total.toLocaleString("id-ID"), color: "#3479D4" },
              { label: "Dota 2", val: metadata.dataset.games["Dota 2"].total.toLocaleString("id-ID"), color: "#D94B43" },
              { label: "Positif", val: `${metadata.dataset.positiveReviews.toLocaleString("id-ID")} (${metadata.dataset.positivePct}%)`, color: "#65C98A" },
              { label: "Negatif", val: `${metadata.dataset.negativeReviews.toLocaleString("id-ID")} (${metadata.dataset.negativePct}%)`, color: "#FA7777" },
              { label: "Duplikat / Null", val: "0 (Bersih)", color: "#E8BC55" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-3 shadow-[2px_2px_0px_#202020]"
              >
                <div className="text-[10px] font-mono font-bold text-[#666666] uppercase">{stat.label}</div>
                <div className="font-display mt-1 text-base font-bold text-[#171717]">
                  {stat.val}
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-4 shadow-[3px_3px_0px_#202020]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
                <input
                  type="text"
                  value={researchSearch}
                  onChange={(e) => {
                    setResearchSearch(e.target.value);
                    setResearchPage(1);
                  }}
                  placeholder="Cari teks ulasan atau kata kunci..."
                  className="w-full rounded-xl border-2 border-[#202020] bg-[#F7F4EC] py-2 pl-10 pr-4 text-xs font-medium text-[#171717] placeholder:text-[#666666] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={researchGameFilter}
                  onChange={(e) => {
                    setResearchGameFilter(e.target.value);
                    setResearchPage(1);
                  }}
                  className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] px-3 py-2 text-xs font-bold text-[#171717] shadow-[1.5px_1.5px_0px_#202020]"
                >
                  <option value="all">Semua Game</option>
                  <option value="Mobile Legends">Mobile Legends</option>
                  <option value="Dota 2">Dota 2</option>
                </select>

                <select
                  value={researchSentimentFilter}
                  onChange={(e) => {
                    setResearchSentimentFilter(e.target.value);
                    setResearchPage(1);
                  }}
                  className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] px-3 py-2 text-xs font-bold text-[#171717] shadow-[1.5px_1.5px_0px_#202020]"
                >
                  <option value="all">Semua Sentimen</option>
                  <option value="positive">Positif</option>
                  <option value="negative">Negatif</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border-2 border-[#202020]">
              {researchLoading ? (
                <div className="space-y-2 p-6">
                  <div className="h-10 animate-pulse rounded bg-[#F7F4EC]" />
                  <div className="h-10 animate-pulse rounded bg-[#F7F4EC]" />
                  <div className="h-10 animate-pulse rounded bg-[#F7F4EC]" />
                </div>
              ) : researchError ? (
                <div className="p-4 text-xs font-bold text-[#BA2A2A]">{researchError}</div>
              ) : (
                <table className="w-full text-left text-xs text-[#171717]">
                  <thead>
                    <tr className="border-b-2 border-[#202020] bg-[#F7F4EC] font-mono font-bold text-[#171717]">
                      <th className="py-3 px-3 w-16">ID</th>
                      <th className="py-3 px-3 w-36">Game</th>
                      <th className="py-3 px-4">Teks Ulasan</th>
                      <th className="py-3 px-3 w-32">Label Sentimen</th>
                      <th className="py-3 px-3 w-36">Sumber Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-[#202020]/20 bg-[#FFFDFC]">
                    {pagedResearchRows.map((row) => (
                      <tr key={`${row.game}-${row.id}`} className="hover:bg-[#F7F4EC]/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#666666] align-top">
                          #{row.id}
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <GameBadge game={row.game} size="xs" />
                        </td>
                        <td className="py-2.5 px-4 leading-relaxed text-[#171717] max-w-xl">
                          {row.review}
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <SentimentBadge sentiment={row.label} size="xs" />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#666666] align-top">
                          {row.label_source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#666666] pt-1">
              <span>
                Menampilkan <strong>{pagedResearchRows.length}</strong> dari{" "}
                <strong>{filteredResearchRows.length.toLocaleString("id-ID")}</strong> ulasan
              </span>
              <div className="flex items-center gap-2">
                <SecondaryButton
                  size="sm"
                  disabled={researchPage <= 1}
                  onClick={() => setResearchPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </SecondaryButton>
                <span className="font-mono font-bold text-xs text-[#171717] px-2">
                  {researchPage} / {totalResearchPages}
                </span>
                <SecondaryButton
                  size="sm"
                  disabled={researchPage >= totalResearchPages}
                  onClick={() => setResearchPage((p) => Math.min(totalResearchPages, p + 1))}
                >
                  Berikutnya
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IMPORT DATASET */}
      {activeTab === "import" && (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-6 shadow-[3px_3px_0px_#202020]">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void handleFileSelected(file);
              }}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-[#3479D4] bg-[#3479D4]/10"
                  : "border-[#202020]/40 bg-[#F7F4EC] hover:border-[#202020]"
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#202020] bg-white shadow-[2px_2px_0px_#202020] mb-3">
                <UploadCloud className="h-7 w-7 text-[#3479D4]" />
              </div>
              <h3 className="font-display text-base font-bold text-[#171717]">
                Tarik &amp; Lepas File CSV atau Excel (.xlsx) di Sini
              </h3>
              <p className="mt-1 max-w-sm text-xs text-[#666666]">
                File diproses 100% di browser Anda tanpa diunggah ke server eksternal mana pun.
              </p>

              <label className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#202020] bg-[#A78BFA] px-4 py-2 text-xs font-bold text-[#171717] shadow-[3px_3px_0px_#202020] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#906CF7] hover:shadow-[4px_4px_0px_#202020] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#202020] transition-all cursor-pointer">
                <span>{parseLoading ? "Membaca..." : "Pilih File dari Komputer"}</span>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFileSelected(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {importError && (
              <MangaShake shakeKey={importError}>
                <div className="mt-4 flex items-start gap-2 rounded-lg border-2 border-[#202020] bg-[#FA7777]/25 p-3 text-xs text-[#BA2A2A] font-bold">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              </MangaShake>
            )}
          </div>

          {parsedDataset && validationReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Column Mapping Card */}
                <div className="lg:col-span-5 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
                  <h3 className="font-display text-base font-bold text-[#171717]">
                    Pemetaan Kolom Dataset
                  </h3>
                  <p className="font-mono text-xs text-[#666666] mt-0.5">
                    {parsedDataset.fileName} • {parsedDataset.rows.length} baris
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-[#171717] mb-1">
                        Kolom Teks Ulasan <span className="text-[#BA2A2A]">*</span>
                      </label>
                      <select
                        value={mapping.reviewColumn}
                        onChange={(e) =>
                          setMapping((m) => ({ ...m, reviewColumn: e.target.value }))
                        }
                        className="w-full rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-2 font-medium text-[#171717]"
                      >
                        <option value="">-- Pilih Kolom Teks --</option>
                        {parsedDataset.columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#666666] mb-1">
                        Kolom Game (Opsional)
                      </label>
                      <select
                        value={mapping.gameColumn ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({ ...m, gameColumn: e.target.value || null }))
                        }
                        className="w-full rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-2 text-[#171717]"
                      >
                        <option value="">-- Tidak Ada --</option>
                        {parsedDataset.columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#666666] mb-1">
                        Kolom Tanggal (Opsional)
                      </label>
                      <select
                        value={mapping.dateColumn ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({ ...m, dateColumn: e.target.value || null }))
                        }
                        className="w-full rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-2 text-[#171717]"
                      >
                        <option value="">-- Tidak Ada --</option>
                        {parsedDataset.columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#666666] mb-1">
                        Kolom Sentimen Asli / Ground Truth (Opsional)
                      </label>
                      <select
                        value={mapping.sentimentColumn ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({ ...m, sentimentColumn: e.target.value || null }))
                        }
                        className="w-full rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-2 text-[#171717]"
                      >
                        <option value="">-- Tidak Ada --</option>
                        {parsedDataset.columns.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Validation & Launch Card */}
                <div className="lg:col-span-7 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
                  <h3 className="font-display text-base font-bold text-[#171717]">
                    Hasil Pemeriksaan Integritas Data
                  </h3>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-2.5">
                      <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">Total Baris</span>
                      <span className="font-display text-base font-bold text-[#171717]">
                        {validationReport.totalRows}
                      </span>
                    </div>
                    <div className="rounded-lg border-2 border-[#202020] bg-[#65C98A]/25 p-2.5">
                      <span className="block text-[10px] font-mono font-bold text-[#228448] uppercase">Baris Valid</span>
                      <span className="font-display text-base font-bold text-[#228448]">
                        {validationReport.validRowsCount}
                      </span>
                    </div>
                    <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-2.5">
                      <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">Kosong / Rusak</span>
                      <span className="font-display text-base font-bold text-[#171717]">
                        {validationReport.emptyRowsCount + validationReport.invalidRowsCount}
                      </span>
                    </div>
                    <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-2.5">
                      <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">Duplikat</span>
                      <span className="font-display text-base font-bold text-[#171717]">
                        {validationReport.duplicateRowsCount}
                      </span>
                    </div>
                  </div>

                  {/* Issues */}
                  <div className="mt-3 space-y-1.5">
                    {validationReport.issues.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg border border-[#202020] bg-[#65C98A]/20 p-2 text-xs font-bold text-[#228448]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Format dan konten dataset siap dianalisis.</span>
                      </div>
                    ) : (
                      validationReport.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 rounded-lg border border-[#202020] bg-[#F7F4EC] p-2 text-xs text-[#171717]"
                        >
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8060D8]" />
                          <span>{issue.message}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Controls */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#666666] mb-1">
                        Nama Sesi
                      </label>
                      <input
                        type="text"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        className="w-full rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-2 text-xs font-bold text-[#171717]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#666666] mb-1">
                        Algoritma
                      </label>
                      <select
                        value={selectedAlgo}
                        onChange={(e) => setSelectedAlgo(e.target.value as AlgorithmId)}
                        className="w-full rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-2 text-xs font-bold text-[#171717]"
                      >
                        <option value="naive_bayes">Multinomial Naive Bayes</option>
                        <option value="knn">KNN (k=5, cosine)</option>
                      </select>
                    </div>
                  </div>

                  {analyzeProgress && analyzing && (
                    <div className="mt-3 space-y-2">
                      <ComicScanningEffect label={`STAGE: ${analyzeProgress.stage.toUpperCase()}`} />
                      <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-2.5 text-xs">
                        <div className="flex justify-between font-bold text-[#171717]">
                          <span>Memproses baris...</span>
                          <span className="font-mono">{analyzeProgress.processed} / {analyzeProgress.total}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <PrimaryButton
                      type="button"
                      disabled={!validationReport.isValidToAnalyze || analyzing}
                      onClick={() => void handleRunDatasetAnalysis()}
                      isLoading={analyzing}
                      icon={<Play className="h-4 w-4" />}
                    >
                      {analyzing ? "Menjalankan Inferensi..." : "Mulai Analisis Dataset"}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Session Results */}
          {activeSession && (
            <div id="sec-session-results" className="scroll-mt-20 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3.5px_3.5px_0px_#202020]">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-[#202020]/10">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ComicPopCallout text="SESSION READY!" tone="primary" tilt={-2} />
                    <h3 className="font-display text-lg font-bold text-[#171717]">
                      {activeSession.sessionName}
                    </h3>
                    <AlgorithmBadge algorithm={activeSession.algorithm} />
                  </div>
                  <p className="font-mono text-xs text-[#666666] mt-0.5">
                    {activeSession.totalRows} baris dianalisis • Durasi: {activeSession.durationMs} ms
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <SecondaryButton
                    size="sm"
                    onClick={() => void handleExportActiveSession("csv")}
                    icon={<Download className="h-3.5 w-3.5" />}
                  >
                    CSV
                  </SecondaryButton>
                  <SecondaryButton
                    size="sm"
                    onClick={() => void handleExportActiveSession("xlsx")}
                    icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
                  >
                    XLSX
                  </SecondaryButton>
                  <SecondaryButton
                    size="sm"
                    onClick={() => void handleExportActiveSession("pdf")}
                    icon={<FileText className="h-3.5 w-3.5" />}
                  >
                    PDF
                  </SecondaryButton>
                </div>
              </div>

              {/* Session Donut & Stats */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-4">
                  <h4 className="font-display text-sm font-bold text-[#171717] mb-2">
                    Distribusi Sentimen Sesi
                  </h4>
                  <SentimentDonutChart
                    positive={activeSession.positiveCount}
                    negative={activeSession.negativeCount}
                    totalLabel="Total Baris"
                  />
                </div>

                <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border-2 border-[#202020] bg-[#FFFDFC] p-3 shadow-[1.5px_1.5px_0px_#202020]">
                      <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">Total</span>
                      <span className="font-display text-xl font-bold text-[#171717]">{activeSession.totalRows}</span>
                    </div>
                    <div className="rounded-lg border-2 border-[#202020] bg-[#65C98A]/25 p-3 shadow-[1.5px_1.5px_0px_#202020]">
                      <span className="block text-[10px] font-mono font-bold text-[#228448] uppercase">Positif</span>
                      <span className="font-display text-xl font-bold text-[#228448]">{activeSession.positiveCount}</span>
                    </div>
                    <div className="rounded-lg border-2 border-[#202020] bg-[#FA7777]/25 p-3 shadow-[1.5px_1.5px_0px_#202020]">
                      <span className="block text-[10px] font-mono font-bold text-[#BA2A2A] uppercase">Negatif</span>
                      <span className="font-display text-xl font-bold text-[#BA2A2A]">{activeSession.negativeCount}</span>
                    </div>
                  </div>

                  {/* Search inside session */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sessionSearch}
                      onChange={(e) => {
                        setSessionSearch(e.target.value);
                        setSessionPage(1);
                      }}
                      placeholder="Cari ulasan dalam hasil sesi..."
                      className="flex-1 rounded-xl border-2 border-[#202020] bg-[#F7F4EC] px-3 py-2 text-xs text-[#171717]"
                    />
                    <select
                      value={sessionFilter}
                      onChange={(e) => {
                        setSessionFilter(e.target.value as "all" | "positive" | "negative");
                        setSessionPage(1);
                      }}
                      className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] px-3 py-2 text-xs font-bold text-[#171717]"
                    >
                      <option value="all">Semua Sentimen</option>
                      <option value="positive">Positif</option>
                      <option value="negative">Negatif</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="mt-4 overflow-x-auto rounded-xl border-2 border-[#202020]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-[#202020] bg-[#F7F4EC] font-mono font-bold text-[#171717]">
                      <th className="py-2.5 px-3 w-14">#</th>
                      <th className="py-2.5 px-3 w-32">Game</th>
                      <th className="py-2.5 px-4">Teks Ulasan</th>
                      <th className="py-2.5 px-3 w-32">Prediksi</th>
                      <th className="py-2.5 px-3 w-28">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-[#202020]/20 bg-[#FFFDFC]">
                    {pagedSessionRows.map((r) => (
                      <tr key={r.rowIndex} className="hover:bg-[#F7F4EC]/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#666666]">#{r.rowIndex}</td>
                        <td className="py-2.5 px-3">{r.game ? <GameBadge game={r.game} size="xs" /> : "-"}</td>
                        <td className="py-2.5 px-4 text-[#171717]">{r.review}</td>
                        <td className="py-2.5 px-3">
                          <SentimentBadge sentiment={r.predictedLabel} size="xs" />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#171717]">
                          {(r.score * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Session Table Pagination */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#666666] pt-1">
                <span>
                  Menampilkan <strong>{pagedSessionRows.length}</strong> dari{" "}
                  <strong>{filteredSessionRows.length}</strong> ulasan hasil sesi
                </span>
                <div className="flex items-center gap-2">
                  <SecondaryButton
                    size="sm"
                    disabled={sessionPage <= 1}
                    onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </SecondaryButton>
                  <span className="font-mono font-bold text-xs text-[#171717] px-2">
                    {sessionPage} / {totalSessionPages}
                  </span>
                  <SecondaryButton
                    size="sm"
                    disabled={sessionPage >= totalSessionPages}
                    onClick={() => setSessionPage((p) => Math.min(totalSessionPages, p + 1))}
                  >
                    Berikutnya
                  </SecondaryButton>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LOCAL HISTORY */}
      {activeTab === "history" && (
        <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-[#202020]/10">
            <div>
              <h3 className="font-display text-base font-bold text-[#171717]">
                Riwayat Sesi Analisis Lokal (IndexedDB)
              </h3>
              <p className="text-xs text-[#666666]">
                Data sesi tersimpan di browser Anda dan dapat dibuka kembali kapan saja.
              </p>
            </div>
            {history.length > 0 && (
              <SecondaryButton
                size="sm"
                onClick={() => void clearHistory()}
                icon={<Trash2 className="h-3.5 w-3.5 text-[#BA2A2A]" />}
              >
                Hapus Seluruh Riwayat
              </SecondaryButton>
            )}
          </div>

          <div className="mt-4">
            {history.length === 0 ? (
              <EmptyState
                title="Belum Ada Riwayat Sesi"
                description="Lakukan analisis di Sentiment Analyzer atau unggah file CSV/Excel untuk membuat sesi lokal."
                actionLabel="Import File Sekarang"
                onAction={() => setActiveTab("import")}
              />
            ) : (
              <div className="space-y-3">
                {history.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-3.5 shadow-[2px_2px_0px_#202020]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#171717]">{session.sessionName}</span>
                        <AlgorithmBadge algorithm={session.algorithm} size="xs" />
                      </div>
                      <p className="font-mono text-xs text-[#666666] mt-1">
                        {new Date(session.createdAt).toLocaleString("id-ID")} • {session.totalRows} baris •{" "}
                        <span className="text-[#228448] font-bold">+{session.positiveCount}</span> /{" "}
                        <span className="text-[#BA2A2A] font-bold">-{session.negativeCount}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <PrimaryButton
                        size="sm"
                        onClick={async () => {
                          await openSessionById(session.id);
                          setActiveTab("import");
                        }}
                        icon={<FolderOpen className="h-3.5 w-3.5" />}
                      >
                        Buka Sesi
                      </PrimaryButton>
                      <SecondaryButton
                        size="sm"
                        onClick={() => void removeSession(session.id)}
                        icon={<Trash2 className="h-3.5 w-3.5 text-[#BA2A2A]" />}
                      >
                        Hapus
                      </SecondaryButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
