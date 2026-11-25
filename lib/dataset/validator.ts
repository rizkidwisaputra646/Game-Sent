export interface ColumnMapping {
  reviewColumn: string;
  gameColumn: string | null;
  dateColumn: string | null;
  sentimentColumn: string | null;
}

export interface ParsedDatasetResult {
  fileName: string;
  fileSizeBytes: number;
  fileType: "csv" | "xlsx";
  columns: string[];
  rows: Record<string, string>[];
  encodingNote?: string;
}

export interface ValidationIssue {
  level: "error" | "warning" | "info";
  message: string;
}

export interface ValidatedRow {
  rowIndex: number;
  review: string;
  game?: string;
  date?: string;
  actualLabel?: string;
  isDuplicate: boolean;
}

export interface DatasetValidationReport {
  isValidToAnalyze: boolean;
  totalRows: number;
  validRowsCount: number;
  emptyRowsCount: number;
  duplicateRowsCount: number;
  invalidRowsCount: number;
  invalidDateCount: number;
  invalidLabelCount: number;
  fileSizeBytes: number;
  issues: ValidationIssue[];
  validRows: ValidatedRow[];
}

export const MAX_IMPORT_FILE_BYTES = 15 * 1024 * 1024; // 15 MB safety limit

export function inferDefaultMapping(columns: string[]): ColumnMapping {
  const normalized = columns.map((c) => ({
    orig: c,
    low: c.trim().toLowerCase(),
    clean: c.trim().toLowerCase().replace(/[^a-z0-9]/g, ""),
  }));

  // Exclude ID columns from being selected as review text
  const isIdColumn = (name: string) => {
    const l = name.toLowerCase().trim();
    return (
      l.endsWith("id") ||
      l.endsWith("_id") ||
      l.startsWith("id_") ||
      l === "id" ||
      l.includes("review id") ||
      l.includes("review_id") ||
      l.includes("user id") ||
      l.includes("userid")
    );
  };

  const isPredictionOrScore = (name: string) => {
    const l = name.toLowerCase().trim();
    return (
      l.startsWith("pred") ||
      l.includes("predicted") ||
      l.includes("score") ||
      l.includes("prob")
    );
  };

  // High-priority exact candidates for Review
  const highPriorityReview = [
    "review text",
    "review_text",
    "reviewtext",
    "ulasan",
    "review",
    "text",
    "komentar",
    "comment",
    "content",
    "body",
    "teks",
  ];

  let reviewCol: string | null = null;
  // First check exact matches for review candidates
  for (const cand of highPriorityReview) {
    const match = normalized.find(
      (c) =>
        !isIdColumn(c.low) &&
        !isPredictionOrScore(c.low) &&
        (c.low === cand || c.clean === cand.replace(/[^a-z0-9]/g, ""))
    );
    if (match) {
      reviewCol = match.orig;
      break;
    }
  }

  // Next check substring for review, ensuring ID / prediction columns are ignored
  if (!reviewCol) {
    for (const cand of ["review", "ulasan", "text", "komentar", "comment", "content", "body"]) {
      const match = normalized.find(
        (c) => !isIdColumn(c.low) && !isPredictionOrScore(c.low) && c.low.includes(cand)
      );
      if (match) {
        reviewCol = match.orig;
        break;
      }
    }
  }

  // Fallback: first non-ID, non-prediction column, or first column
  if (!reviewCol) {
    reviewCol =
      normalized.find((c) => !isIdColumn(c.low) && !isPredictionOrScore(c.low))?.orig ??
      columns[0] ??
      "";
  }

  // 2. Game Column
  let gameCol: string | null = null;
  const gameCandidates = [
    "game",
    "game_name",
    "gamename",
    "nama_game",
    "title",
    "judul",
    "app",
    "app_name",
  ];
  for (const cand of gameCandidates) {
    const match = normalized.find(
      (c) =>
        c.orig !== reviewCol &&
        (c.low === cand || c.clean === cand.replace(/[^a-z0-9]/g, ""))
    );
    if (match) {
      gameCol = match.orig;
      break;
    }
  }
  if (!gameCol) {
    const match = normalized.find(
      (c) =>
        c.orig !== reviewCol &&
        (c.low.includes("game") || c.low.includes("app")) &&
        !isIdColumn(c.low)
    );
    if (match) gameCol = match.orig;
  }

  // 3. Date Column
  let dateCol: string | null = null;
  const dateCandidates = [
    "date",
    "tanggal",
    "created_at",
    "timestamp",
    "time",
    "tgl",
    "datetime",
  ];
  for (const cand of dateCandidates) {
    const match = normalized.find(
      (c) =>
        c.orig !== reviewCol &&
        c.orig !== gameCol &&
        (c.low === cand || c.clean === cand.replace(/[^a-z0-9]/g, ""))
    );
    if (match) {
      dateCol = match.orig;
      break;
    }
  }
  if (!dateCol) {
    const match = normalized.find(
      (c) =>
        c.orig !== reviewCol &&
        c.orig !== gameCol &&
        (c.low.includes("date") ||
          c.low.includes("tanggal") ||
          c.low.includes("timestamp") ||
          c.low.includes("time"))
    );
    if (match) dateCol = match.orig;
  }

  // 4. Sentiment / Actual Label Column
  let sentimentCol: string | null = null;
  const labelCandidates = [
    "actual_label",
    "actual label",
    "actuallabel",
    "label",
    "sentiment",
    "sentimen",
    "polarity",
    "kelas",
    "ground_truth",
  ];
  for (const cand of labelCandidates) {
    const match = normalized.find(
      (c) =>
        c.orig !== reviewCol &&
        c.orig !== gameCol &&
        c.orig !== dateCol &&
        (c.low === cand || c.clean === cand.replace(/[^a-z0-9]/g, ""))
    );
    if (match) {
      sentimentCol = match.orig;
      break;
    }
  }
  if (!sentimentCol) {
    // If not found yet, check substring but prioritize actual over predicted
    const match = normalized.find(
      (c) =>
        c.orig !== reviewCol &&
        c.orig !== gameCol &&
        c.orig !== dateCol &&
        (c.low.includes("label") || c.low.includes("sentiment") || c.low.includes("sentimen"))
    );
    if (match) sentimentCol = match.orig;
  }

  return {
    reviewColumn: reviewCol,
    gameColumn: gameCol !== reviewCol ? gameCol : null,
    dateColumn: dateCol !== reviewCol ? dateCol : null,
    sentimentColumn: sentimentCol !== reviewCol ? sentimentCol : null,
  };
}

export function validateMappedDataset(
  parsed: ParsedDatasetResult,
  mapping: ColumnMapping
): DatasetValidationReport {
  const issues: ValidationIssue[] = [];

  if (parsed.rows.length === 0) {
    issues.push({
      level: "error",
      message: "File tidak memiliki baris data (kosong).",
    });
    return {
      isValidToAnalyze: false,
      totalRows: 0,
      validRowsCount: 0,
      emptyRowsCount: 0,
      duplicateRowsCount: 0,
      invalidRowsCount: 0,
      invalidDateCount: 0,
      invalidLabelCount: 0,
      fileSizeBytes: parsed.fileSizeBytes,
      issues,
      validRows: [],
    };
  }

  if (!mapping.reviewColumn || !parsed.columns.includes(mapping.reviewColumn)) {
    issues.push({
      level: "error",
      message: "Kolom ulasan (Review/Text) wajib dipilih dan harus ada pada dataset.",
    });
    return {
      isValidToAnalyze: false,
      totalRows: parsed.rows.length,
      validRowsCount: 0,
      emptyRowsCount: 0,
      duplicateRowsCount: 0,
      invalidRowsCount: parsed.rows.length,
      invalidDateCount: 0,
      invalidLabelCount: 0,
      fileSizeBytes: parsed.fileSizeBytes,
      issues,
      validRows: [],
    };
  }

  let emptyRowsCount = 0;
  let duplicateRowsCount = 0;
  let invalidRowsCount = 0;
  let invalidDateCount = 0;
  let invalidLabelCount = 0;

  const seenKeys = new Set<string>();
  const validRows: ValidatedRow[] = [];

  for (let i = 0; i < parsed.rows.length; i++) {
    const rawRow = parsed.rows[i];
    const allValuesEmpty = Object.values(rawRow).every((v) => !v || v.trim() === "");
    if (allValuesEmpty) {
      emptyRowsCount++;
      continue;
    }

    const reviewText = (rawRow[mapping.reviewColumn] ?? "").trim();
    if (!reviewText) {
      invalidRowsCount++;
      continue;
    }

    const gameVal = mapping.gameColumn
      ? (rawRow[mapping.gameColumn] ?? "").trim() || undefined
      : undefined;

    let dateVal: string | undefined;
    if (mapping.dateColumn) {
      const rawDate = (rawRow[mapping.dateColumn] ?? "").trim();
      if (rawDate) {
        const parsedTime = Date.parse(rawDate);
        if (Number.isNaN(parsedTime)) {
          invalidDateCount++;
          dateVal = rawDate;
        } else {
          dateVal = new Date(parsedTime).toISOString().slice(0, 10);
        }
      }
    }

    let actualLabel: string | undefined;
    if (mapping.sentimentColumn) {
      const rawLbl = (rawRow[mapping.sentimentColumn] ?? "").trim().toLowerCase();
      if (rawLbl) {
        if (rawLbl === "positive" || rawLbl === "negative") {
          actualLabel = rawLbl;
        } else {
          invalidLabelCount++;
          actualLabel = rawLbl;
        }
      }
    }

    const dedupKey = `${(gameVal ?? "").toLowerCase()}::${reviewText.toLowerCase()}`;
    const isDuplicate = seenKeys.has(dedupKey);
    if (isDuplicate) {
      duplicateRowsCount++;
    } else {
      seenKeys.add(dedupKey);
    }

    validRows.push({
      rowIndex: i + 1,
      review: reviewText,
      game: gameVal,
      date: dateVal,
      actualLabel,
      isDuplicate,
    });
  }

  if (emptyRowsCount > 0) {
    issues.push({
      level: "warning",
      message: `Ditemukan ${emptyRowsCount} baris kosong seluruhnya yang akan dilewati saat inferensi.`,
    });
  }
  if (invalidRowsCount > 0) {
    issues.push({
      level: "warning",
      message: `Ditemukan ${invalidRowsCount} baris dengan kolom ulasan kosong (tidak valid).`,
    });
  }
  if (duplicateRowsCount > 0) {
    issues.push({
      level: "info",
      message: `Terdeteksi ${duplicateRowsCount} baris duplikat (ulasan + game identik). Sesuai aturan integritas data, duplikat TIDAK dihapus otomatis kecuali Anda memilih mengabaikannya.`,
    });
  }
  if (invalidDateCount > 0) {
    issues.push({
      level: "warning",
      message: `${invalidDateCount} nilai pada kolom tanggal tidak dapat diparsing sebagai tanggal standar.`,
    });
  }
  if (invalidLabelCount > 0) {
    issues.push({
      level: "warning",
      message: `${invalidLabelCount} nilai pada kolom sentimen aktual bukan 'positive' atau 'negative'.`,
    });
  }
  if (validRows.length === 0) {
    issues.push({
      level: "error",
      message: "Tidak ada baris ulasan valid yang dapat dianalisis.",
    });
  }

  return {
    isValidToAnalyze: validRows.length > 0,
    totalRows: parsed.rows.length,
    validRowsCount: validRows.length,
    emptyRowsCount,
    duplicateRowsCount,
    invalidRowsCount,
    invalidDateCount,
    invalidLabelCount,
    fileSizeBytes: parsed.fileSizeBytes,
    issues,
    validRows,
  };
}
