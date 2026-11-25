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
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/ScrollPrimitives";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { HudCard } from "@/components/ui/HudCard";

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
import { AlgorithmBadge, SentimentBadge } from "@/components/ui/StatusBadge";
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
    historyLoading,
    historyError,
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

  // Import additional dataset state (strictly isolated from research dataset)
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

  // Load cached 4,997-row research dataset (fetched once per browser session)
  useEffect(() => {
    if (researchRows.length > 0) return;
    let cancelled = false;
    setResearchLoading(true);
    setResearchError(null);
    getCachedResearchDataset()
      .then((data) => {
        if (!cancelled) {
          setResearchRows(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResearchError(
            err instanceof Error ? err.message : "Gagal memuat dataset."
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
        "Format file tidak didukung. Gunakan file dengan ekstensi .csv atau .xlsx."
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
      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#263149] bg-[#0D1224]/90 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("research")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "research"
                ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F1F5F9]"
                : "border-[#263149] bg-[#080B18] text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Database className="h-4 w-4 text-[#A78BFA]" />
            Dataset Penelitian ({metadata.dataset.totalReviews.toLocaleString("id-ID")})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "import"
                ? "border-[#22D3EE] bg-[#22D3EE]/18 text-[#F1F5F9]"
                : "border-[#263149] bg-[#080B18] text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <UploadCloud className="h-4 w-4 text-[#22D3EE]" />
            Import Dataset Tambahan (CSV / XLSX)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "history"
                ? "border-[#3B82F6] bg-[#3B82F6]/20 text-[#F1F5F9]"
                : "border-[#263149] bg-[#080B18] text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <History className="h-4 w-4 text-[#60A5FA]" />
            Riwayat Sesi Lokal ({history.length})
          </button>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#22C55E]" />
          Sesi import terisolasi dari Dataset Penelitian
        </span>
      </div>

      {/* TAB 1: RESEARCH DATASET (READ-ONLY) */}
      {activeTab === "research" && (
        <ScrollReveal variant="fade-up" className="space-y-6">
          <HudCard tone="violet" hudTag="Research Dataset (Read-Only)">
            <StaggerGroup staggerMs={65} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                {
                  label: "Total Baris",
                  val: metadata.dataset.totalReviews.toLocaleString("id-ID"),
                },
                {
                  label: "Mobile Legends",
                  val: metadata.dataset.games["Mobile Legends"].total.toLocaleString("id-ID"),
                },
                {
                  label: "Dota 2",
                  val: metadata.dataset.games["Dota 2"].total.toLocaleString("id-ID"),
                },
                {
                  label: "Positif",
                  val: `${metadata.dataset.positiveReviews.toLocaleString("id-ID")} (${metadata.dataset.positivePct}%)`,
                },
                {
                  label: "Negatif",
                  val: `${metadata.dataset.negativeReviews.toLocaleString("id-ID")} (${metadata.dataset.negativePct}%)`,
                },
                {
                  label: "Kolom",
                  val: metadata.dataset.columns.join(", "),
                },
              ].map((stat) => (
                <StaggerItem key={stat.label} variant="slide-up">
                  <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                    <div className="text-[11px] text-[#94A3B8]">{stat.label}</div>
                    <div className="font-mono-num mt-1 truncate text-xs font-semibold text-[#F1F5F9]">
                      {stat.val}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>

            {/* Filters */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-[#64748B]" />
                <input
                  type="text"
                  value={researchSearch}
                  onChange={(e) => {
                    setResearchSearch(e.target.value);
                    setResearchPage(1);
                  }}
                  placeholder="Cari teks ulasan atau ID..."
                  className="w-full rounded-lg border border-[#263149] bg-[#080B18] py-2 pr-3 pl-9 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={researchGameFilter}
                  onChange={(e) => {
                    setResearchGameFilter(e.target.value);
                    setResearchPage(1);
                  }}
                  className="rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2 text-xs text-[#F1F5F9]"
                  aria-label="Filter game dataset penelitian"
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
                  className="rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2 text-xs text-[#F1F5F9]"
                  aria-label="Filter label sentimen dataset penelitian"
                >
                  <option value="all">Semua Sentimen</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
              {researchLoading ? (
                <div className="space-y-2 py-6">
                  <div className="h-10 animate-pulse rounded bg-[#080B18]" />
                  <div className="h-10 animate-pulse rounded bg-[#080B18]" />
                  <div className="h-10 animate-pulse rounded bg-[#080B18]" />
                </div>
              ) : researchError ? (
                <div className="rounded-lg border border-[#F43F5E]/40 bg-[#F43F5E]/10 p-4 text-xs text-[#FDA4AF]">
                  {researchError}
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#263149] text-[#94A3B8]">
                      <th className="py-2.5 pr-3">ID</th>
                      <th className="py-2.5 pr-3">Game</th>
                      <th className="py-2.5 pr-4">Ulasan</th>
                      <th className="py-2.5 pr-3">Label</th>
                      <th className="py-2.5">Label Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#263149]/60">
                    {pagedResearchRows.map((row) => (
                      <tr key={`${row.game}-${row.id}`} className="hover:bg-[#11182B]/50">
                        <td className="font-mono-num py-2.5 pr-3 text-[11px] text-[#94A3B8]">
                          {row.id}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-3 font-medium text-[#CBD5E1]">
                          {row.game}
                        </td>
                        <td className="max-w-xl py-2.5 pr-4 text-[#E2E8F0]">
                          <p className="line-clamp-2">{row.review}</p>
                        </td>
                        <td className="py-2.5 pr-3">
                          <SentimentBadge sentiment={row.label} size="xs" />
                        </td>
                        <td className="font-mono-num whitespace-nowrap py-2.5 text-[11px] text-[#94A3B8]">
                          {row.label_source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#263149] pt-3 text-xs text-[#94A3B8]">
              <span className="font-mono-num">
                Menampilkan {pagedResearchRows.length} dari{" "}
                {filteredResearchRows.length.toLocaleString("id-ID")} baris cocok
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={researchPage <= 1}
                  onClick={() => setResearchPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-[#263149] bg-[#080B18] px-3 py-1 text-[#F1F5F9] disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="font-mono-num">
                  Hal {researchPage} / {totalResearchPages}
                </span>
                <button
                  type="button"
                  disabled={researchPage >= totalResearchPages}
                  onClick={() =>
                    setResearchPage((p) => Math.min(totalResearchPages, p + 1))
                  }
                  className="rounded border border-[#263149] bg-[#080B18] px-3 py-1 text-[#F1F5F9] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </HudCard>
        </ScrollReveal>
      )}

      {/* TAB 2: IMPORT ADDITIONAL DATASET */}
      {activeTab === "import" && (
        <div className="space-y-6">
          <ScrollReveal variant="fade-up">
          <HudCard tone="cyan" hudTag="Upload Dataset Eksternal (Terpisah)">
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
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                isDragging
                  ? "border-[#22D3EE] bg-[#22D3EE]/10"
                  : "border-[#263149] bg-[#080B18]/70 hover:border-[#3B82F6]/60"
              }`}
            >
              <UploadCloud className="h-10 w-10 text-[#22D3EE]" />
              <p className="mt-3 font-display text-base font-semibold text-[#F1F5F9]">
                Seret &amp; Lepas File CSV atau XLSX di Sini
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Maksimal 15 MB • Diproses sepenuhnya di browser • Tidak mengubah
                dataset penelitian
              </p>
              <label className="mt-4 cursor-pointer rounded-lg border border-[#22D3EE]/45 bg-[#22D3EE]/15 px-4 py-2 text-xs font-semibold text-[#F1F5F9] transition hover:bg-[#22D3EE]/25">
                {parseLoading ? "Membaca File..." : "Pilih File CSV / XLSX"}
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
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#F43F5E]/40 bg-[#F43F5E]/10 p-3 text-xs text-[#FDA4AF]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </HudCard>
          </ScrollReveal>

          {parsedDataset && validationReport && (
            <>
              {/* Column Mapping + Preview */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <ScrollReveal variant="slide-left" className="lg:col-span-5">
                <HudCard tone="blue" hudTag="Pemetaan Kolom" className="h-full">
                  <h3 className="font-display text-base font-semibold text-[#F1F5F9]">
                    Pemetaan Kolom ({parsedDataset.fileName})
                  </h3>
                  <p className="font-mono-num mt-1 text-[11px] text-[#94A3B8]">
                    {(parsedDataset.fileSizeBytes / 1024).toFixed(1)} KB •{" "}
                    {parsedDataset.encodingNote} • {parsedDataset.rows.length} baris
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <label className="block font-medium text-[#F1F5F9]">
                        Kolom Review / Teks <span className="text-[#F43F5E]">*</span>
                      </label>
                      <select
                        value={mapping.reviewColumn}
                        onChange={(e) =>
                          setMapping((m) => ({ ...m, reviewColumn: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2 text-[#F1F5F9]"
                      >
                        <option value="">-- Pilih Kolom --</option>
                        {parsedDataset.columns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-[#94A3B8]">
                        Kolom Game (Opsional)
                      </label>
                      <select
                        value={mapping.gameColumn ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({
                            ...m,
                            gameColumn: e.target.value || null,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2 text-[#F1F5F9]"
                      >
                        <option value="">-- Tidak Ada --</option>
                        {parsedDataset.columns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-[#94A3B8]">
                        Kolom Tanggal (Opsional)
                      </label>
                      <select
                        value={mapping.dateColumn ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({
                            ...m,
                            dateColumn: e.target.value || null,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2 text-[#F1F5F9]"
                      >
                        <option value="">-- Tidak Ada --</option>
                        {parsedDataset.columns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-[#94A3B8]">
                        Kolom Sentimen Aktual (Opsional)
                      </label>
                      <select
                        value={mapping.sentimentColumn ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({
                            ...m,
                            sentimentColumn: e.target.value || null,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2 text-[#F1F5F9]"
                      >
                        <option value="">-- Tidak Ada --</option>
                        {parsedDataset.columns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </HudCard>
                </ScrollReveal>

                {/* Validation Report & Execution */}
                <ScrollReveal variant="slide-right" className="lg:col-span-7">
                <HudCard
                  className="h-full"
                  tone={validationReport.isValidToAnalyze ? "positive" : "negative"}
                  hudTag="Laporan Validasi Dataset"
                >
                  <StaggerGroup staggerMs={70} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <StaggerItem variant="slide-up">
                    <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-2.5">
                      <div className="text-[10px] text-[#94A3B8]">Total Baris</div>
                      <div className="font-mono-num text-base font-bold text-[#F1F5F9]">
                        {validationReport.totalRows}
                      </div>
                    </div>
                    </StaggerItem>
                    <StaggerItem variant="slide-up">
                    <div className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 p-2.5">
                      <div className="text-[10px] text-[#86EFAC]">Baris Valid</div>
                      <div className="font-mono-num text-base font-bold text-[#22C55E]">
                        {validationReport.validRowsCount}
                      </div>
                    </div>
                    </StaggerItem>
                    <StaggerItem variant="slide-up">
                    <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-2.5">
                      <div className="text-[10px] text-[#94A3B8]">
                        Kosong / Invalid
                      </div>
                      <div className="font-mono-num text-base font-bold text-[#F1F5F9]">
                        {validationReport.emptyRowsCount +
                          validationReport.invalidRowsCount}
                      </div>
                    </div>
                    </StaggerItem>
                    <StaggerItem variant="slide-up">
                    <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-2.5">
                      <div className="text-[10px] text-[#94A3B8]">Duplikat</div>
                      <div className="font-mono-num text-base font-bold text-[#22D3EE]">
                        {validationReport.duplicateRowsCount}
                      </div>
                    </div>
                    </StaggerItem>
                  </StaggerGroup>

                  {/* Validation Issues */}
                  <div className="mt-3 space-y-2">
                    {validationReport.issues.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 p-2.5 text-xs text-[#86EFAC]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>
                          Seluruh baris lolos pemeriksaan validasi tanpa kendala.
                        </span>
                      </div>
                    ) : (
                      validationReport.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
                            issue.level === "error"
                              ? "border-[#F43F5E]/40 bg-[#F43F5E]/10 text-[#FDA4AF]"
                              : issue.level === "warning"
                              ? "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FDE68A]"
                              : "border-[#3B82F6]/35 bg-[#3B82F6]/10 text-[#BFDBFE]"
                          }`}
                        >
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{issue.message}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {validationReport.duplicateRowsCount > 0 && (
                    <label className="mt-3 flex items-center gap-2 text-xs text-[#CBD5E1]">
                      <input
                        type="checkbox"
                        checked={excludeDuplicates}
                        onChange={(e) => setExcludeDuplicates(e.target.checked)}
                        className="rounded border-[#263149] bg-[#080B18]"
                      />
                      <span>
                        Lewati {validationReport.duplicateRowsCount} baris duplikat saat
                        inferensi (opsional)
                      </span>
                    </label>
                  )}

                  {/* Analysis Launch Controls */}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] text-[#94A3B8]">
                        Nama Sesi Analisis
                      </label>
                      <input
                        type="text"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2 text-xs text-[#F1F5F9]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#94A3B8]">
                        Algoritma Prediksi
                      </label>
                      <select
                        value={selectedAlgo}
                        onChange={(e) =>
                          setSelectedAlgo(e.target.value as AlgorithmId)
                        }
                        className="mt-1 w-full rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2 text-xs text-[#F1F5F9]"
                      >
                        <option value="naive_bayes">
                          Multinomial Naive Bayes
                        </option>
                        <option value="knn">K-Nearest Neighbors (k=5, cosine)</option>
                      </select>
                    </div>
                  </div>

                  {analyzeProgress && analyzing && (
                    <div className="mt-4 rounded-lg border border-[#22D3EE]/35 bg-[#080B18] p-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#22D3EE]">
                          Tahap: {analyzeProgress.stage.toUpperCase()}
                        </span>
                        <span className="font-mono-num text-[#F1F5F9]">
                          {analyzeProgress.processed} / {analyzeProgress.total}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#11182B]">
                        <div
                          className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] transition-all"
                          style={{
                            width: `${
                              analyzeProgress.total > 0
                                ? (analyzeProgress.processed / analyzeProgress.total) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={!validationReport.isValidToAnalyze || analyzing}
                      onClick={() => void handleRunDatasetAnalysis()}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-45"
                    >
                      <Play className="h-4 w-4" />
                      {analyzing
                        ? "Menjalankan Inferensi..."
                        : `Analisis ${
                            excludeDuplicates
                              ? validationReport.validRows.filter(
                                  (r) => !r.isDuplicate
                                ).length
                              : validationReport.validRowsCount
                          } Baris`}
                    </button>
                  </div>
                </HudCard>
                </ScrollReveal>
              </div>

              {/* Raw Data Preview (first 8 rows) */}
              <ScrollReveal variant="fade-up">
              <HudCard tone="default" hudTag="Preview Data Mentah (8 Baris Pertama)">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#263149] text-[#94A3B8]">
                        {parsedDataset.columns.map((col) => (
                          <th key={col} className="py-2 pr-4 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#263149]/60">
                      {parsedDataset.rows.slice(0, 8).map((row, idx) => (
                        <tr key={idx}>
                          {parsedDataset.columns.map((col) => (
                            <td
                              key={col}
                              className="max-w-xs truncate py-2 pr-4 text-[#CBD5E1]"
                            >
                              {row[col] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </HudCard>
              </ScrollReveal>
            </>
          )}

          {/* Active Analyzed Session Results */}
          {activeSession && (
            <ScrollReveal
              id="sec-session-results"
              variant="fade-scale"
              immediateOnMount
              className="scroll-mt-20"
            >
            <HudCard tone="violet" hudTag="Hasil Analisis Sesi Tambahan">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-[#F1F5F9]">
                      {activeSession.sessionName}
                    </h3>
                    <AlgorithmBadge algorithm={activeSession.algorithm} />
                  </div>
                  <p className="font-mono-num mt-1 text-xs text-[#94A3B8]">
                    {activeSession.fileName ? `${activeSession.fileName} • ` : ""}
                    {activeSession.totalRows.toLocaleString("id-ID")} baris dianalisis •{" "}
                    {activeSession.durationMs} ms
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleExportActiveSession("csv")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#263149] bg-[#080B18] px-3 py-1.5 text-xs text-[#F1F5F9] hover:border-[#22D3EE]"
                  >
                    <Download className="h-3.5 w-3.5 text-[#22D3EE]" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExportActiveSession("xlsx")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#263149] bg-[#080B18] px-3 py-1.5 text-xs text-[#F1F5F9] hover:border-[#22C55E]"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#22C55E]" />
                    XLSX
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExportActiveSession("pdf")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#263149] bg-[#080B18] px-3 py-1.5 text-xs text-[#F1F5F9] hover:border-[#8B5CF6]"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#A78BFA]" />
                    PDF
                  </button>
                </div>
              </div>

              {/* Summary KPIs + Sentiment Donut Chart */}
              <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-5 rounded-xl border border-[#263149] bg-[#080B18]/75 p-4">
                  <h4 className="font-display text-sm font-semibold text-[#F1F5F9]">
                    Distribusi Prediksi Sentimen
                  </h4>
                  <p className="text-[11px] text-[#94A3B8]">
                    Hasil prediksi model pada dataset tambahan (terpisah dari dataset penelitian)
                  </p>
                  <SentimentDonutChart
                    positive={activeSession.positiveCount}
                    negative={activeSession.negativeCount}
                    totalLabel="Total Prediksi"
                  />
                </div>

                <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                      <div className="text-[11px] text-[#94A3B8]">Total Dianalisis</div>
                      <div className="font-mono-num mt-1 text-xl font-bold text-[#F1F5F9]">
                        <CountUpNumber value={activeSession.totalRows} />
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 p-3">
                      <div className="text-[11px] text-[#86EFAC]">Prediksi Positif</div>
                      <div className="font-mono-num mt-1 text-xl font-bold text-[#22C55E]">
                        <CountUpNumber value={activeSession.positiveCount} />
                      </div>
                      <div className="font-mono-num text-[11px] text-[#86EFAC]">
                        {activeSession.totalRows > 0
                          ? ((activeSession.positiveCount / activeSession.totalRows) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 p-3">
                      <div className="text-[11px] text-[#FDA4AF]">Prediksi Negatif</div>
                      <div className="font-mono-num mt-1 text-xl font-bold text-[#F43F5E]">
                        <CountUpNumber value={activeSession.negativeCount} />
                      </div>
                      <div className="font-mono-num text-[11px] text-[#FDA4AF]">
                        {activeSession.totalRows > 0
                          ? ((activeSession.negativeCount / activeSession.totalRows) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                      <div className="text-[11px] text-[#94A3B8]">Durasi Worker</div>
                      <div className="font-mono-num mt-1 text-xl font-bold text-[#22D3EE]">
                        {activeSession.durationMs} ms
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        Failed: {activeSession.failedCount}
                      </div>
                    </div>
                  </div>

                  {activeSession.gameBreakdown &&
                    Object.keys(activeSession.gameBreakdown).length > 0 && (
                      <div className="rounded-xl border border-[#263149] bg-[#080B18]/75 p-3">
                        <div className="mb-2 text-xs font-semibold text-[#CBD5E1]">
                          Distribusi Per Game (Kolom Terpetakan)
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {Object.entries(activeSession.gameBreakdown).map(([gName, st]) => (
                            <div
                              key={gName}
                              className="flex items-center justify-between rounded-lg border border-[#263149] bg-[#11182B]/70 px-3 py-2 text-xs"
                            >
                              <span className="font-medium text-[#F1F5F9]">{gName}</span>
                              <span className="font-mono-num text-[11px]">
                                <span className="text-[#22C55E]">+{st.positive}</span>{" "}
                                /{" "}
                                <span className="text-[#F43F5E]">-{st.negative}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Search & Filter Results */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-[#64748B]" />
                      <input
                        type="text"
                        value={sessionSearch}
                        onChange={(e) => {
                          setSessionSearch(e.target.value);
                          setSessionPage(1);
                        }}
                        placeholder="Cari ulasan hasil analisis..."
                        className="w-full rounded-lg border border-[#263149] bg-[#080B18] py-2 pr-3 pl-8 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:border-[#8B5CF6] focus:outline-none"
                      />
                    </div>
                    <select
                      value={sessionFilter}
                      onChange={(e) => {
                        setSessionFilter(e.target.value as "all" | "positive" | "negative");
                        setSessionPage(1);
                      }}
                      className="rounded-lg border border-[#263149] bg-[#080B18] px-3 py-2 text-xs text-[#F1F5F9]"
                      aria-label="Filter sentimen hasil sesi"
                    >
                      <option value="all">Semua Prediksi</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#263149] text-[#94A3B8]">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Game</th>
                      <th className="py-2 pr-4">Ulasan</th>
                      <th className="py-2 pr-3">Label Aktual</th>
                      <th className="py-2 pr-3">Prediksi Model</th>
                      <th className="py-2">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#263149]/60">
                    {pagedSessionRows.map((r) => (
                      <tr key={r.rowIndex} className="hover:bg-[#11182B]/50">
                        <td className="font-mono-num py-2 pr-3 text-[#94A3B8]">
                          {r.rowIndex}
                        </td>
                        <td className="py-2 pr-3 text-[#CBD5E1]">
                          {r.game ?? "-"}
                        </td>
                        <td className="max-w-md py-2 pr-4 text-[#E2E8F0]">
                          <p className="line-clamp-2">{r.review}</p>
                        </td>
                        <td className="py-2 pr-3">
                          {r.actualLabel ? (
                            <SentimentBadge sentiment={r.actualLabel} size="xs" />
                          ) : (
                            <span className="text-[#64748B]">-</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <SentimentBadge sentiment={r.predictedLabel} size="xs" />
                        </td>
                        <td className="font-mono-num py-2 text-[#F1F5F9]">
                          {(r.score * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#263149] pt-3 text-xs text-[#94A3B8]">
                <span className="font-mono-num">
                  Menampilkan {pagedSessionRows.length} dari{" "}
                  {filteredSessionRows.length.toLocaleString("id-ID")} baris hasil
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={sessionPage <= 1}
                    onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                    className="rounded border border-[#263149] bg-[#080B18] px-3 py-1 text-[#F1F5F9] disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="font-mono-num">
                    Hal {sessionPage} / {totalSessionPages}
                  </span>
                  <button
                    type="button"
                    disabled={sessionPage >= totalSessionPages}
                    onClick={() =>
                      setSessionPage((p) => Math.min(totalSessionPages, p + 1))
                    }
                    className="rounded border border-[#263149] bg-[#080B18] px-3 py-1 text-[#F1F5F9] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </HudCard>
            </ScrollReveal>
          )}
        </div>
      )}

      {/* TAB 3: LOCAL ANALYSIS HISTORY (INDEXEDDB) */}
      {activeTab === "history" && (
        <ScrollReveal variant="fade-up">
        <HudCard tone="blue" hudTag="Local IndexedDB History">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
                Riwayat Sesi Analisis Lokal
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Disimpan secara lokal di IndexedDB browser perangkat ini. Tidak
                dikirim ke server atau database eksternal.
              </p>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => void clearHistory()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#F43F5E]/40 bg-[#F43F5E]/10 px-3 py-1.5 text-xs font-medium text-[#FDA4AF] hover:bg-[#F43F5E]/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Semua Riwayat
              </button>
            )}
          </div>

          {historyError && (
            <div className="mt-4 rounded-lg border border-[#F43F5E]/40 bg-[#F43F5E]/10 p-3 text-xs text-[#FDA4AF]">
              {historyError}
            </div>
          )}

          {historyLoading ? (
            <div className="mt-4 space-y-2">
              <div className="h-14 animate-pulse rounded bg-[#080B18]" />
              <div className="h-14 animate-pulse rounded bg-[#080B18]" />
            </div>
          ) : history.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#263149] bg-[#080B18]/60 p-10 text-center text-xs text-[#94A3B8]">
              Belum ada sesi tersimpan. Impor dataset atau jalankan analisis di
              Sentiment Analyzer.
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {history.map((session) => (
                <div
                  key={session.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition ${
                    activeSession?.id === session.id
                      ? "border-[#22D3EE]/50 bg-[#22D3EE]/8"
                      : "border-[#263149] bg-[#080B18]/80"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[#F1F5F9]">
                        {session.sessionName}
                      </span>
                      <AlgorithmBadge algorithm={session.algorithm} />
                      <span className="rounded border border-[#263149] bg-[#11182B] px-2 py-0.5 font-mono-num text-[10px] text-[#94A3B8]">
                        {session.sourceType}
                      </span>
                    </div>
                    <p className="font-mono-num mt-1.5 text-xs text-[#94A3B8]">
                      {new Date(session.createdAt).toLocaleString("id-ID")} •{" "}
                      {session.fileName ? `${session.fileName} • ` : ""}
                      {session.totalRows} baris •{" "}
                      <span className="text-[#22C55E]">
                        Pos {session.positiveCount}
                      </span>{" "}
                      /{" "}
                      <span className="text-[#F43F5E]">
                        Neg {session.negativeCount}
                      </span>{" "}
                      • Status: {session.status}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await openSessionById(session.id);
                        setSessionFilter("all");
                        setSessionSearch("");
                        setSessionPage(1);
                        setActiveTab("import");
                        setTimeout(() => {
                          document
                            .getElementById("sec-session-results")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 80);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B82F6]/40 bg-[#3B82F6]/15 px-3 py-1.5 text-xs font-medium text-[#93C5FD] hover:bg-[#3B82F6]/25"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      Buka Sesi
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeSession(session.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#263149] bg-[#11182B] px-2.5 py-1.5 text-xs text-[#94A3B8] hover:border-[#F43F5E]/50 hover:text-[#F43F5E]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </HudCard>
        </ScrollReveal>
      )}
    </div>
  );
}
