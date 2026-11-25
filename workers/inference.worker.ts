/// <reference lib="webworker" />
import { SentimentInferenceEngine } from "../lib/ml/inference";
import type {
  AlgorithmId,
  KnnMetaArtifact,
  SinglePredictionResult,
  TfidfNbArtifact,
} from "../lib/ml/types";

export interface WorkerBatchItem {
  rowIndex: number;
  review: string;
  game?: string;
  date?: string;
  actualLabel?: string;
}

export type WorkerRequest =
  | { id: string; type: "init" }
  | { id: string; type: "predict_single"; text: string; algorithm: AlgorithmId }
  | {
      id: string;
      type: "predict_batch";
      items: WorkerBatchItem[];
      algorithm: AlgorithmId;
    };

export type WorkerResponse =
  | { id: string; type: "init_done"; hasKnn: boolean; vocabSize: number; trainingDocs: number }
  | { id: string; type: "single_done"; result: SinglePredictionResult }
  | {
      id: string;
      type: "batch_progress";
      stage: "preprocessing" | "tfidf" | "inference";
      processed: number;
      total: number;
    }
  | {
      id: string;
      type: "batch_done";
      results: Array<{
        rowIndex: number;
        review: string;
        cleanedText: string;
        game?: string;
        date?: string;
        actualLabel?: string;
        predictedLabel: "positive" | "negative";
        score: number;
        scoreType: "posterior_probability" | "neighbor_voting_score";
        processingTimeMs: number;
      }>;
      failedCount: number;
      durationMs: number;
    }
  | { id: string; type: "error"; message: string };

let enginePromise: Promise<SentimentInferenceEngine> | null = null;

async function getEngine(): Promise<SentimentInferenceEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const [tfidfNbRes, knnMetaRes, knnBinRes] = await Promise.all([
        fetch("/models/tfidf-nb.json"),
        fetch("/models/knn-meta.json"),
        fetch("/models/knn-train.bin"),
      ]);
      if (!tfidfNbRes.ok || !knnMetaRes.ok || !knnBinRes.ok) {
        throw new Error("Gagal memuat artefak model TF-IDF / NB / KNN.");
      }
      const tfidfNb = (await tfidfNbRes.json()) as TfidfNbArtifact;
      const knnMeta = (await knnMetaRes.json()) as KnnMetaArtifact;
      const knnBuffer = await knnBinRes.arrayBuffer();
      return new SentimentInferenceEngine(tfidfNb, knnMeta, knnBuffer);
    })();
  }
  return enginePromise;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    const engine = await getEngine();

    if (msg.type === "init") {
      const reply: WorkerResponse = {
        id: msg.id,
        type: "init_done",
        hasKnn: engine.hasKnn(),
        vocabSize: 5000,
        trainingDocs: 3997,
      };
      self.postMessage(reply);
      return;
    }

    if (msg.type === "predict_single") {
      const result = engine.predictSingle(msg.text, msg.algorithm);
      const reply: WorkerResponse = {
        id: msg.id,
        type: "single_done",
        result,
      };
      self.postMessage(reply);
      return;
    }

    if (msg.type === "predict_batch") {
      const tStart = performance.now();
      const total = msg.items.length;
      const results: Extract<WorkerResponse, { type: "batch_done" }>["results"] = [];
      let failedCount = 0;

      const chunkSize = msg.algorithm === "knn" ? 50 : 250;

      for (let i = 0; i < total; i++) {
        const item = msg.items[i];
        try {
          if (!item.review || !item.review.trim()) {
            failedCount++;
            continue;
          }
          const pred = engine.predictSingle(item.review, msg.algorithm);
          results.push({
            rowIndex: item.rowIndex,
            review: item.review,
            cleanedText: pred.cleanedText,
            game: item.game,
            date: item.date,
            actualLabel: item.actualLabel,
            predictedLabel: pred.predictedLabel,
            score: pred.score,
            scoreType: pred.scoreType,
            processingTimeMs: pred.processingTimeMs,
          });
        } catch {
          failedCount++;
        }

        if ((i + 1) % chunkSize === 0 || i + 1 === total) {
          const stage =
            i + 1 < total * 0.25
              ? "preprocessing"
              : i + 1 < total * 0.55
              ? "tfidf"
              : "inference";
          const prog: WorkerResponse = {
            id: msg.id,
            type: "batch_progress",
            stage,
            processed: i + 1,
            total,
          };
          self.postMessage(prog);
        }
      }

      const done: WorkerResponse = {
        id: msg.id,
        type: "batch_done",
        results,
        failedCount,
        durationMs: Number((performance.now() - tStart).toFixed(2)),
      };
      self.postMessage(done);
    }
  } catch (err) {
    const reply: WorkerResponse = {
      id: msg.id,
      type: "error",
      message: err instanceof Error ? err.message : "Terjadi kesalahan pada worker inferensi.",
    };
    self.postMessage(reply);
  }
};
