import type { AlgorithmId, SentimentLabel } from "@/lib/ml/types";

export interface AnalyzedRowResult {
  rowIndex: number;
  review: string;
  cleanedText: string;
  game?: string;
  date?: string;
  actualLabel?: string;
  predictedLabel: SentimentLabel;
  score: number;
  scoreType: "posterior_probability" | "neighbor_voting_score";
  processingTimeMs?: number;
}

export interface AnalysisSessionSummary {
  id: string;
  sessionName: string;
  sourceType: "single" | "batch" | "dataset_import";
  fileName?: string;
  fileSizeBytes?: number;
  createdAt: string;
  algorithm: AlgorithmId;
  totalRows: number;
  positiveCount: number;
  negativeCount: number;
  failedCount: number;
  status: "completed" | "partial" | "error";
  durationMs: number;
  truncatedRows?: boolean;
  gameBreakdown?: Record<string, { total: number; positive: number; negative: number }>;
}

export interface AnalysisSessionRecord extends AnalysisSessionSummary {
  /** Stored rows for reopening & export (bounded to avoid browser quota exhaustion) */
  rows: AnalyzedRowResult[];
}

const DB_NAME = "gamesent-local-db";
const DB_VERSION = 2;
const STORE_SESSIONS = "analysis_sessions";
const STORE_SESSION_ROWS = "session_rows";
const MAX_STORED_ROWS_PER_SESSION = 5000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB tidak tersedia di browser ini."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const store = db.createObjectStore(STORE_SESSIONS, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SESSION_ROWS)) {
        db.createObjectStore(STORE_SESSION_ROWS, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Gagal membuka IndexedDB."));
  });
}

function toSummary(record: AnalysisSessionSummary | AnalysisSessionRecord): AnalysisSessionSummary {
  const {
    id,
    sessionName,
    sourceType,
    fileName,
    fileSizeBytes,
    createdAt,
    algorithm,
    totalRows,
    positiveCount,
    negativeCount,
    failedCount,
    status,
    durationMs,
    truncatedRows,
    gameBreakdown,
  } = record;
  return {
    id,
    sessionName,
    sourceType,
    fileName,
    fileSizeBytes,
    createdAt,
    algorithm,
    totalRows,
    positiveCount,
    negativeCount,
    failedCount,
    status,
    durationMs,
    truncatedRows,
    gameBreakdown,
  };
}

export async function saveAnalysisSession(
  session: AnalysisSessionRecord
): Promise<AnalysisSessionRecord> {
  const db = await openDb();
  const truncated = session.rows.length > MAX_STORED_ROWS_PER_SESSION;
  const boundedRows = truncated
    ? session.rows.slice(0, MAX_STORED_ROWS_PER_SESSION)
    : session.rows;

  const summary: AnalysisSessionSummary = toSummary({
    ...session,
    truncatedRows: truncated,
  });
  const fullRecord: AnalysisSessionRecord = {
    ...summary,
    rows: boundedRows,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS, STORE_SESSION_ROWS], "readwrite");
    tx.objectStore(STORE_SESSIONS).put(summary);
    tx.objectStore(STORE_SESSION_ROWS).put({ id: session.id, rows: boundedRows });
    tx.oncomplete = () => {
      db.close();
      resolve(fullRecord);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Gagal menyimpan sesi analisis."));
    };
  });
}

export async function listAnalysisSessions(): Promise<AnalysisSessionSummary[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SESSIONS, "readonly");
    const store = tx.objectStore(STORE_SESSIONS);
    const req = store.getAll();
    req.onsuccess = () => {
      const rawItems = (req.result as Array<AnalysisSessionSummary | AnalysisSessionRecord>) ?? [];
      // Strip any legacy v1 inline rows so history state stays tiny in memory
      const summaries = rawItems.map(toSummary);
      summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      resolve(summaries);
    };
    req.onerror = () => reject(req.error ?? new Error("Gagal membaca riwayat sesi."));
    tx.oncomplete = () => db.close();
  });
}

export async function getAnalysisSession(id: string): Promise<AnalysisSessionRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS, STORE_SESSION_ROWS], "readonly");
    const summaryReq = tx.objectStore(STORE_SESSIONS).get(id);
    const rowsReq = tx.objectStore(STORE_SESSION_ROWS).get(id);

    let summaryRes: (AnalysisSessionSummary & { rows?: AnalyzedRowResult[] }) | undefined;
    let rowsRes: { id: string; rows: AnalyzedRowResult[] } | undefined;

    summaryReq.onsuccess = () => {
      summaryRes = summaryReq.result as
        | (AnalysisSessionSummary & { rows?: AnalyzedRowResult[] })
        | undefined;
    };
    rowsReq.onsuccess = () => {
      rowsRes = rowsReq.result as { id: string; rows: AnalyzedRowResult[] } | undefined;
    };

    tx.oncomplete = () => {
      db.close();
      if (!summaryRes) {
        resolve(null);
        return;
      }
      const rows = rowsRes?.rows ?? summaryRes.rows ?? [];
      resolve({
        ...toSummary(summaryRes),
        rows,
      });
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Gagal mengambil sesi analisis."));
    };
  });
}

export async function deleteAnalysisSession(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS, STORE_SESSION_ROWS], "readwrite");
    tx.objectStore(STORE_SESSIONS).delete(id);
    tx.objectStore(STORE_SESSION_ROWS).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Gagal menghapus sesi analisis."));
    };
  });
}

export async function clearAllAnalysisSessions(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS, STORE_SESSION_ROWS], "readwrite");
    tx.objectStore(STORE_SESSIONS).clear();
    tx.objectStore(STORE_SESSION_ROWS).clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Gagal menghapus seluruh riwayat."));
    };
  });
}
