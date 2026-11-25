import type {
  AlgorithmId,
  SinglePredictionResult,
} from "@/lib/ml/types";
import type {
  WorkerBatchItem,
  WorkerRequest,
  WorkerResponse,
} from "@/workers/inference.worker";

export interface ModelStatusInfo {
  ready: boolean;
  loading: boolean;
  error: string | null;
  vocabSize: number;
  trainingDocs: number;
}

type BatchProgressHandler = (info: {
  stage: "preprocessing" | "tfidf" | "inference";
  processed: number;
  total: number;
}) => void;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type WorkerRequestPayload = DistributiveOmit<WorkerRequest, "id">;

class InferenceWorkerClient {
  private worker: Worker | null = null;
  private initPromise: Promise<{ vocabSize: number; trainingDocs: number }> | null = null;
  private pending = new Map<
    string,
    {
      resolve: (val: unknown) => void;
      reject: (err: Error) => void;
      onProgress?: BatchProgressHandler;
    }
  >();

  private ensureWorker(): Worker {
    if (typeof window === "undefined") {
      throw new Error("Inference worker hanya dapat dijalankan di browser.");
    }
    if (!this.worker) {
      this.worker = new Worker(
        new URL("../../workers/inference.worker.ts", import.meta.url),
        { type: "module" }
      );
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const data = event.data;
        const entry = this.pending.get(data.id);
        if (!entry) return;

        if (data.type === "batch_progress") {
          entry.onProgress?.({
            stage: data.stage,
            processed: data.processed,
            total: data.total,
          });
          return;
        }

        this.pending.delete(data.id);
        if (data.type === "error") {
          entry.reject(new Error(data.message));
        } else {
          entry.resolve(data);
        }
      };
      this.worker.onerror = (err) => {
        for (const entry of this.pending.values()) {
          entry.reject(new Error(err.message || "Worker error"));
        }
        this.pending.clear();
        this.worker = null;
        this.initPromise = null;
      };
    }
    return this.worker;
  }

  private send<T>(
    payload: WorkerRequestPayload,
    onProgress?: BatchProgressHandler
  ): Promise<T> {
    const worker = this.ensureWorker();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (val: unknown) => void,
        reject,
        onProgress,
      });
      worker.postMessage({ ...payload, id } as WorkerRequest);
    });
  }

  async init(): Promise<{ vocabSize: number; trainingDocs: number }> {
    if (!this.initPromise) {
      this.initPromise = this.send<Extract<WorkerResponse, { type: "init_done" }>>({
        type: "init",
      }).then((res) => ({
        vocabSize: res.vocabSize,
        trainingDocs: res.trainingDocs,
      }));
    }
    return this.initPromise;
  }

  async predictSingle(
    text: string,
    algorithm: AlgorithmId
  ): Promise<SinglePredictionResult> {
    await this.init();
    const res = await this.send<Extract<WorkerResponse, { type: "single_done" }>>({
      type: "predict_single",
      text,
      algorithm,
    });
    return res.result;
  }

  async predictBatch(
    items: WorkerBatchItem[],
    algorithm: AlgorithmId,
    onProgress?: BatchProgressHandler
  ): Promise<Extract<WorkerResponse, { type: "batch_done" }>> {
    await this.init();
    return this.send<Extract<WorkerResponse, { type: "batch_done" }>>(
      {
        type: "predict_batch",
        items,
        algorithm,
      },
      onProgress
    );
  }
}

export const inferenceClient = new InferenceWorkerClient();
