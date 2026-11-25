export type SentimentLabel = "positive" | "negative";
export type AlgorithmId = "naive_bayes" | "knn";

export interface SparseVector {
  indices: number[];
  values: number[];
}

export interface TfidfNbArtifact {
  version: number;
  preprocessing: {
    steps: string[];
  };
  tfidf: {
    stopWords: string[];
    maxFeatures: number;
    ngramRange: [number, number];
    minDf: number;
    maxDf: number;
    norm: "l2";
    useIdf: boolean;
    smoothIdf: boolean;
    sublinearTf: boolean;
    tokenPattern: string;
    vocabularySize: number;
    vocabulary: Record<string, number>;
    idf: number[];
  };
  naiveBayes: {
    alpha: number;
    fitPrior: boolean;
    classes: SentimentLabel[];
    classCount: number[];
    classLogPrior: number[];
    featureLogProb: number[][];
  };
}

export interface KnnMetaArtifact {
  version: number;
  k: number;
  metric: "cosine";
  algorithm: "brute";
  weights: "uniform";
  classes: SentimentLabel[];
  nDocs: number;
  nFeatures: number;
  nnz: number;
  binaryFile: string;
}

export interface KnnTrainingIndex {
  k: number;
  nDocs: number;
  nFeatures: number;
  nnz: number;
  classes: SentimentLabel[];
  indptr: Uint32Array;
  indices: Uint16Array;
  data: Float32Array;
  labels: Uint8Array;
}

export interface SinglePredictionResult {
  originalText: string;
  cleanedText: string;
  algorithm: AlgorithmId;
  predictedLabel: SentimentLabel;
  /** For NB: calibrated posterior probability in [0, 1]. For KNN: neighbor vote proportion in [0, 1]. */
  score: number;
  scoreType: "posterior_probability" | "neighbor_voting_score";
  classProbabilities?: {
    negative: number;
    positive: number;
  };
  knnDetails?: {
    k: number;
    positiveVotes: number;
    negativeVotes: number;
    nearestDistances: number[];
    nearestIndices: number[];
  };
  matchedTermsCount: number;
  topMatchedTerms: Array<{ term: string; weight: number }>;
  processingTimeMs: number;
}
