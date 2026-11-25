import Papa from "papaparse";
import type { ResearchMetadata } from "@/lib/data/types";
import type { AlgorithmId } from "@/lib/ml/types";
import type { AnalyzedRowResult } from "@/lib/storage/indexed-db";

export interface ExportReportPayload {
  title: string;
  createdAt: string;
  datasetSource: string;
  algorithm: AlgorithmId | "research_dataset";
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  gameDistribution?: Array<{
    game: string;
    total: number;
    positive: number;
    negative: number;
  }>;
  rows: Array<{
    rowIndex: number;
    game?: string;
    date?: string;
    review: string;
    actualLabel?: string;
    predictedLabel?: string;
    score?: number;
    scoreType?: string;
    labelSource?: string;
  }>;
  evaluationMetrics?: {
    accuracy: number;
    precisionPositive: number;
    recallPositive: number;
    f1Positive: number;
  };
  includeRows?: boolean;
}

function sanitizeFileSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "gamesent-report"
  );
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatAlgorithmName(algo: ExportReportPayload["algorithm"]): string {
  if (algo === "naive_bayes") return "Multinomial Naive Bayes";
  if (algo === "knn") return "K-Nearest Neighbors (k=5, cosine)";
  return "Dataset Penelitian (Ground Truth / Source Label)";
}

export function buildReportPayloadFromSession(args: {
  title: string;
  datasetSource: string;
  algorithm: AlgorithmId;
  rows: AnalyzedRowResult[];
  metadata?: ResearchMetadata | null;
}): ExportReportPayload {
  const pos = args.rows.filter((r) => r.predictedLabel === "positive").length;
  const neg = args.rows.filter((r) => r.predictedLabel === "negative").length;

  const gameMap = new Map<string, { total: number; positive: number; negative: number }>();
  for (const r of args.rows) {
    if (r.game) {
      const cur = gameMap.get(r.game) ?? { total: 0, positive: 0, negative: 0 };
      cur.total++;
      if (r.predictedLabel === "positive") cur.positive++;
      else cur.negative++;
      gameMap.set(r.game, cur);
    }
  }

  const gameDistribution = Array.from(gameMap.entries()).map(([game, stats]) => ({
    game,
    ...stats,
  }));

  let evaluationMetrics: ExportReportPayload["evaluationMetrics"];
  if (args.metadata) {
    const evalObj =
      args.algorithm === "naive_bayes"
        ? args.metadata.models.naiveBayes.evaluation
        : args.metadata.models.knn.evaluation;
    evaluationMetrics = {
      accuracy: evalObj.accuracy,
      precisionPositive: evalObj.precisionPositive,
      recallPositive: evalObj.recallPositive,
      f1Positive: evalObj.f1Positive,
    };
  }

  return {
    title: args.title,
    createdAt: new Date().toISOString(),
    datasetSource: args.datasetSource,
    algorithm: args.algorithm,
    totalReviews: args.rows.length,
    positiveCount: pos,
    negativeCount: neg,
    gameDistribution: gameDistribution.length > 0 ? gameDistribution : undefined,
    rows: args.rows.map((r) => ({
      rowIndex: r.rowIndex,
      game: r.game,
      date: r.date,
      review: r.review,
      actualLabel: r.actualLabel,
      predictedLabel: r.predictedLabel,
      score: r.score,
      scoreType: r.scoreType,
    })),
    evaluationMetrics,
    includeRows: true,
  };
}

export function exportReportCsv(payload: ExportReportPayload): string {
  const dateStamp = payload.createdAt.slice(0, 10);
  const filename = `${sanitizeFileSlug(payload.title)}_${dateStamp}.csv`;

  const csvRows = payload.rows.map((r) => ({
    row_index: r.rowIndex,
    game: r.game ?? "",
    date: r.date ?? "",
    review: r.review,
    actual_label: r.actualLabel ?? "",
    predicted_sentiment: r.predictedLabel ?? "",
    score: r.score !== undefined ? Number(r.score.toFixed(4)) : "",
    score_type: r.scoreType ?? "",
    label_source: r.labelSource ?? "",
    algorithm: formatAlgorithmName(payload.algorithm),
    dataset_source: payload.datasetSource,
  }));

  const csv = Papa.unparse(csvRows, { quotes: true });
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csv], { type: "text/csv;charset=utf-8;" });
  triggerBlobDownload(blob, filename);
  return filename;
}

export async function exportReportXlsx(payload: ExportReportPayload): Promise<string> {
  const ExcelJS = (await import("exceljs")).default;
  const dateStamp = payload.createdAt.slice(0, 10);
  const filename = `${sanitizeFileSlug(payload.title)}_${dateStamp}.xlsx`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GameSent Analytics";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [
    { header: "Parameter", key: "param", width: 32 },
    { header: "Nilai", key: "value", width: 52 },
  ];

  const posPct = payload.totalReviews
    ? ((payload.positiveCount / payload.totalReviews) * 100).toFixed(2)
    : "0.00";
  const negPct = payload.totalReviews
    ? ((payload.negativeCount / payload.totalReviews) * 100).toFixed(2)
    : "0.00";

  summarySheet.addRows([
    { param: "Judul Analisis", value: payload.title },
    { param: "Tanggal Pembuatan", value: payload.createdAt },
    { param: "Sumber Dataset", value: payload.datasetSource },
    { param: "Algoritma", value: formatAlgorithmName(payload.algorithm) },
    { param: "Total Review", value: payload.totalReviews },
    { param: "Sentimen Positif", value: `${payload.positiveCount} (${posPct}%)` },
    { param: "Sentimen Negatif", value: `${payload.negativeCount} (${negPct}%)` },
  ]);

  if (payload.evaluationMetrics) {
    summarySheet.addRow({ param: "", value: "" });
    summarySheet.addRow({
      param: "Metrik Uji Penelitian (Hold-out Test Set n=1000)",
      value: formatAlgorithmName(payload.algorithm),
    });
    summarySheet.addRow({
      param: "Accuracy",
      value: Number(payload.evaluationMetrics.accuracy.toFixed(4)),
    });
    summarySheet.addRow({
      param: "Precision (Positive)",
      value: Number(payload.evaluationMetrics.precisionPositive.toFixed(4)),
    });
    summarySheet.addRow({
      param: "Recall (Positive)",
      value: Number(payload.evaluationMetrics.recallPositive.toFixed(4)),
    });
    summarySheet.addRow({
      param: "F1-Score (Positive)",
      value: Number(payload.evaluationMetrics.f1Positive.toFixed(4)),
    });
  }

  if (payload.gameDistribution && payload.gameDistribution.length > 0) {
    const gameSheet = workbook.addWorksheet("Distribusi Game");
    gameSheet.columns = [
      { header: "Game", key: "game", width: 24 },
      { header: "Total", key: "total", width: 12 },
      { header: "Positif", key: "positive", width: 12 },
      { header: "Negatif", key: "negative", width: 12 },
      { header: "Positif (%)", key: "posPct", width: 14 },
    ];
    for (const g of payload.gameDistribution) {
      gameSheet.addRow({
        game: g.game,
        total: g.total,
        positive: g.positive,
        negative: g.negative,
        posPct: g.total ? `${((g.positive / g.total) * 100).toFixed(2)}%` : "0%",
      });
    }
  }

  const dataSheet = workbook.addWorksheet("Detail Data");
  dataSheet.columns = [
    { header: "No", key: "rowIndex", width: 8 },
    { header: "Game", key: "game", width: 18 },
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Ulasan", key: "review", width: 64 },
    { header: "Label Aktual (Source)", key: "actualLabel", width: 20 },
    { header: "Prediksi Model", key: "predictedLabel", width: 18 },
    { header: "Skor", key: "score", width: 12 },
    { header: "Tipe Skor", key: "scoreType", width: 24 },
  ];

  for (const r of payload.rows) {
    dataSheet.addRow({
      rowIndex: r.rowIndex,
      game: r.game ?? "-",
      date: r.date ?? "-",
      review: r.review,
      actualLabel: r.actualLabel ?? "-",
      predictedLabel: r.predictedLabel ?? "-",
      score: r.score !== undefined ? Number(r.score.toFixed(4)) : "-",
      scoreType: r.scoreType ?? r.labelSource ?? "-",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerBlobDownload(blob, filename);
  return filename;
}

export async function exportReportPdf(payload: ExportReportPayload): Promise<string> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const dateStamp = payload.createdAt.slice(0, 10);
  const filename = `${sanitizeFileSlug(payload.title)}_${dateStamp}.pdf`;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFillColor(8, 11, 24);
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(241, 245, 249);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("GAMESENT — SENTIMENT RESEARCH REPORT", 14, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(34, 211, 238);
  doc.text(`Judul: ${payload.title}`, 14, 21);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dibuat: ${new Date(payload.createdAt).toLocaleString("id-ID")} | Sumber: ${payload.datasetSource}`,
    14,
    27
  );

  let yPos = 40;
  const posPct = payload.totalReviews
    ? ((payload.positiveCount / payload.totalReviews) * 100).toFixed(2)
    : "0.00";
  const negPct = payload.totalReviews
    ? ((payload.negativeCount / payload.totalReviews) * 100).toFixed(2)
    : "0.00";

  autoTable(doc, {
    startY: yPos,
    head: [["Metrik Ringkasan", "Nilai"]],
    body: [
      ["Algoritma / Sumber", formatAlgorithmName(payload.algorithm)],
      ["Total Ulasan", String(payload.totalReviews)],
      ["Sentimen Positif", `${payload.positiveCount} (${posPct}%)`],
      ["Sentimen Negatif", `${payload.negativeCount} (${negPct}%)`],
    ],
    theme: "grid",
    headStyles: { fillColor: [17, 24, 43], textColor: [241, 245, 249] },
    styles: { fontSize: 9 },
  });

  const docWithAuto = doc as unknown as { lastAutoTable?: { finalY: number } };
  yPos = (docWithAuto.lastAutoTable?.finalY ?? yPos + 30) + 8;

  if (payload.evaluationMetrics) {
    autoTable(doc, {
      startY: yPos,
      head: [["Metrik Evaluasi Uji Penelitian (n=1000)", "Skor"]],
      body: [
        ["Accuracy", `${(payload.evaluationMetrics.accuracy * 100).toFixed(2)}%`],
        ["Precision (Positive)", payload.evaluationMetrics.precisionPositive.toFixed(4)],
        ["Recall (Positive)", payload.evaluationMetrics.recallPositive.toFixed(4)],
        ["F1-Score (Positive)", payload.evaluationMetrics.f1Positive.toFixed(4)],
      ],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
    });
    yPos = (docWithAuto.lastAutoTable?.finalY ?? yPos + 30) + 8;
  }

  if (payload.gameDistribution && payload.gameDistribution.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [["Game", "Total", "Positif", "Negatif", "Positif (%)"]],
      body: payload.gameDistribution.map((g) => [
        g.game,
        String(g.total),
        String(g.positive),
        String(g.negative),
        g.total ? `${((g.positive / g.total) * 100).toFixed(2)}%` : "0%",
      ]),
      theme: "grid",
      headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
    });
    yPos = (docWithAuto.lastAutoTable?.finalY ?? yPos + 30) + 8;
  }

  const sampleRows = payload.rows.slice(0, 100);
  if (sampleRows.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [
        [
          "No",
          "Game",
          "Ulasan (Ringkas)",
          "Label Aktual",
          "Prediksi Model",
          "Skor",
        ],
      ],
      body: sampleRows.map((r) => [
        String(r.rowIndex),
        r.game ?? "-",
        r.review.length > 90 ? `${r.review.slice(0, 87)}...` : r.review,
        r.actualLabel ?? "-",
        r.predictedLabel ?? "-",
        r.score !== undefined ? `${(r.score * 100).toFixed(1)}%` : "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [17, 24, 43], textColor: [241, 245, 249] },
      styles: { fontSize: 8 },
      columnStyles: { 2: { cellWidth: 72 } },
    });
  }

  if (payload.rows.length > 100) {
    const finalY = (docWithAuto.lastAutoTable?.finalY ?? 260) + 6;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Catatan: PDF menampilkan 100 baris pertama dari ${payload.rows.length} baris. Gunakan ekspor CSV/XLSX untuk seluruh baris.`,
      14,
      Math.min(finalY, 285)
    );
  }

  doc.save(filename);
  return filename;
}
