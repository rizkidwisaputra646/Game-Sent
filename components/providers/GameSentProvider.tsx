"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ResearchMetadata } from "@/lib/data/types";
import { inferenceClient, type ModelStatusInfo } from "@/lib/ml/client";
import {
  clearAllAnalysisSessions,
  deleteAnalysisSession,
  getAnalysisSession,
  listAnalysisSessions,
  saveAnalysisSession,
  type AnalysisSessionRecord,
  type AnalysisSessionSummary,
} from "@/lib/storage/indexed-db";
import {
  loadPreferences,
  savePreferences,
  type UserPreferences,
} from "@/lib/storage/local-storage";
import metadataJson from "@/public/data/research-metadata.json";

const RESEARCH_METADATA = metadataJson as unknown as ResearchMetadata;

interface GameSentContextValue {
  metadata: ResearchMetadata;
  modelStatus: ModelStatusInfo;
  ensureModelsLoaded: () => Promise<void>;
  history: AnalysisSessionSummary[];
  historyLoading: boolean;
  historyError: string | null;
  activeSession: AnalysisSessionRecord | null;
  setActiveSession: (session: AnalysisSessionRecord | null) => void;
  openSessionById: (id: string) => Promise<AnalysisSessionRecord | null>;
  saveSession: (session: AnalysisSessionRecord) => Promise<AnalysisSessionRecord>;
  removeSession: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  preferences: UserPreferences;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
}

const GameSentContext = createContext<GameSentContextValue | null>(null);

export function GameSentProvider({ children }: { children: React.ReactNode }) {
  const [modelStatus, setModelStatus] = useState<ModelStatusInfo>({
    ready: false,
    loading: true,
    error: null,
    vocabSize: RESEARCH_METADATA.models.tfidf.vocabularySize,
    trainingDocs: RESEARCH_METADATA.models.knn.params.trainingVectors,
  });

  const [history, setHistory] = useState<AnalysisSessionSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<AnalysisSessionRecord | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    loadPreferences()
  );

  const ensureModelsLoaded = useCallback(async () => {
    setModelStatus((prev) => (prev.ready ? prev : { ...prev, loading: true, error: null }));
    try {
      const info = await inferenceClient.init();
      setModelStatus({
        ready: true,
        loading: false,
        error: null,
        vocabSize: info.vocabSize,
        trainingDocs: info.trainingDocs,
      });
    } catch (err) {
      setModelStatus((prev) => ({
        ...prev,
        ready: false,
        loading: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal memuat model machine learning.",
      }));
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const items = await listAnalysisSessions();
      setHistory(items);
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : "Tidak dapat mengakses IndexedDB di browser ini."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    setPreferences(loadPreferences());
    void ensureModelsLoaded();
    void refreshHistory();
  }, [ensureModelsLoaded, refreshHistory]);

  const openSessionById = useCallback(
    async (id: string) => {
      if (activeSession?.id === id) {
        return activeSession;
      }
      const loaded = await getAnalysisSession(id);
      if (loaded) {
        setActiveSession(loaded);
      }
      return loaded;
    },
    [activeSession]
  );

  const saveSession = useCallback(async (session: AnalysisSessionRecord) => {
    const saved = await saveAnalysisSession(session);
    const summary: AnalysisSessionSummary = {
      id: saved.id,
      sessionName: saved.sessionName,
      sourceType: saved.sourceType,
      fileName: saved.fileName,
      fileSizeBytes: saved.fileSizeBytes,
      createdAt: saved.createdAt,
      algorithm: saved.algorithm,
      totalRows: saved.totalRows,
      positiveCount: saved.positiveCount,
      negativeCount: saved.negativeCount,
      failedCount: saved.failedCount,
      status: saved.status,
      durationMs: saved.durationMs,
      truncatedRows: saved.truncatedRows,
      gameBreakdown: saved.gameBreakdown,
    };
    setHistory((prev) => [summary, ...prev.filter((s) => s.id !== saved.id)]);
    setActiveSession(saved);
    return saved;
  }, []);

  const removeSession = useCallback(
    async (id: string) => {
      await deleteAnalysisSession(id);
      setHistory((prev) => prev.filter((s) => s.id !== id));
      if (activeSession?.id === id) {
        setActiveSession(null);
      }
    },
    [activeSession]
  );

  const clearHistory = useCallback(async () => {
    await clearAllAnalysisSessions();
    setHistory([]);
    setActiveSession(null);
  }, []);

  const updatePreferences = useCallback((partial: Partial<UserPreferences>) => {
    const next = savePreferences(partial);
    setPreferences(next);
  }, []);

  const value = useMemo<GameSentContextValue>(
    () => ({
      metadata: RESEARCH_METADATA,
      modelStatus,
      ensureModelsLoaded,
      history,
      historyLoading,
      historyError,
      activeSession,
      setActiveSession,
      openSessionById,
      saveSession,
      removeSession,
      clearHistory,
      refreshHistory,
      preferences,
      updatePreferences,
    }),
    [
      modelStatus,
      ensureModelsLoaded,
      history,
      historyLoading,
      historyError,
      activeSession,
      openSessionById,
      saveSession,
      removeSession,
      clearHistory,
      refreshHistory,
      preferences,
      updatePreferences,
    ]
  );

  return (
    <GameSentContext.Provider value={value}>
      {children}
    </GameSentContext.Provider>
  );
}

export function useGameSent(): GameSentContextValue {
  const ctx = useContext(GameSentContext);
  if (!ctx) {
    throw new Error("useGameSent must be used inside GameSentProvider");
  }
  return ctx;
}
