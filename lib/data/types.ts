export type GameName = "Mobile Legends" | "Dota 2";

export interface ResearchRecord {
  id: string;
  game: GameName;
  review: string;
  label: "positive" | "negative";
  label_source: string;
}

export interface GameStats {
  total: number;
  positive: number;
  negative: number;
  positivePct: number;
  negativePct: number;
  labelSources: Record<string, number>;
  avgCharLength: number;
  avgWordCount: number;
}

export interface ClassificationClassReport {
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

export interface ModelEvaluationMetrics {
  accuracy: number;
  precisionPositive: number;
  recallPositive: number;
  f1Positive: number;
  confusionMatrix: {
    labels: ["negative", "positive"];
    matrix: [[number, number], [number, number]];
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  classificationReport: {
    negative: ClassificationClassReport;
    positive: ClassificationClassReport;
    macroAvg: ClassificationClassReport;
    weightedAvg: ClassificationClassReport;
  };
}

export interface ResearchMetadata {
  sourceFile: string;
  notebookFile: string;
  dataset: {
    totalReviews: number;
    positiveReviews: number;
    negativeReviews: number;
    positivePct: number;
    negativePct: number;
    nullCount: number;
    duplicateCount: number;
    columns: string[];
    games: {
      "Mobile Legends": GameStats;
      "Dota 2": GameStats;
    };
    split: {
      trainSize: number;
      testSize: number;
      testRatio: number;
      randomState: number;
      stratified: boolean;
      trainDistribution: { negative: number; positive: number };
      testDistribution: { negative: number; positive: number };
    };
    topTerms: {
      positive: Array<{ term: string; meanTfidf: number }>;
      negative: Array<{ term: string; meanTfidf: number }>;
    };
  };
  models: {
    tfidf: {
      vocabularySize: number;
      ngramRange: [number, number];
      minDf: number;
      maxFeatures: number;
      stopWords: string;
      norm: string;
      smoothIdf: boolean;
      sublinearTf: boolean;
      tokenPattern: string;
      trainNnz: number;
    };
    naiveBayes: {
      name: string;
      params: {
        alpha: number;
        fitPrior: boolean;
        classes: string[];
        classCount: number[];
        classLogPrior: number[];
        classPriorProb: number[];
        nFeatures: number;
      };
      evaluation: ModelEvaluationMetrics;
    };
    knn: {
      name: string;
      params: {
        nNeighbors: number;
        metric: string;
        algorithm: string;
        weights: string;
        trainingVectors: number;
        nFeatures: number;
        sparseNnz: number;
      };
      evaluation: ModelEvaluationMetrics;
    };
  };
}
