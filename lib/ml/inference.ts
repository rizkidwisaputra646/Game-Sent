import { KnnClassifierTS, parseKnnBinary } from "./knn";
import { MultinomialNaiveBayesTS } from "./naive-bayes";
import { preprocessText } from "./preprocessing";
import { TfidfVectorizerTS } from "./tfidf";
import type {
  AlgorithmId,
  KnnMetaArtifact,
  SinglePredictionResult,
  TfidfNbArtifact,
} from "./types";

export class SentimentInferenceEngine {
  readonly vectorizer: TfidfVectorizerTS;
  readonly naiveBayes: MultinomialNaiveBayesTS;
  private knn: KnnClassifierTS | null = null;

  constructor(tfidfNb: TfidfNbArtifact, knnMeta?: KnnMetaArtifact, knnBuffer?: ArrayBuffer) {
    this.vectorizer = new TfidfVectorizerTS(tfidfNb.tfidf);
    this.naiveBayes = new MultinomialNaiveBayesTS(tfidfNb.naiveBayes);
    if (knnMeta && knnBuffer) {
      this.attachKnn(knnMeta, knnBuffer);
    }
  }

  attachKnn(knnMeta: KnnMetaArtifact, knnBuffer: ArrayBuffer): void {
    const index = parseKnnBinary(knnBuffer, knnMeta);
    this.knn = new KnnClassifierTS(index);
  }

  hasKnn(): boolean {
    return this.knn !== null;
  }

  predictSingle(rawText: string, algorithm: AlgorithmId): SinglePredictionResult {
    const t0 = performance.now();
    const cleanedText = preprocessText(rawText);
    const vec = this.vectorizer.transform(cleanedText);
    const topMatchedTerms = this.vectorizer.getTopTerms(vec, 8);

    if (algorithm === "naive_bayes") {
      const res = this.naiveBayes.predict(vec);
      const t1 = performance.now();
      return {
        originalText: rawText,
        cleanedText,
        algorithm,
        predictedLabel: res.label,
        score: res.confidence,
        scoreType: "posterior_probability",
        classProbabilities: res.probabilities,
        matchedTermsCount: vec.indices.length,
        topMatchedTerms,
        processingTimeMs: Math.max(0.01, Number((t1 - t0).toFixed(3))),
      };
    }

    if (!this.knn) {
      throw new Error("Artefak KNN belum dimuat.");
    }

    const res = this.knn.predict(vec);
    const t1 = performance.now();
    return {
      originalText: rawText,
      cleanedText,
      algorithm,
      predictedLabel: res.label,
      score: res.votingScore,
      scoreType: "neighbor_voting_score",
      knnDetails: {
        k: 5,
        positiveVotes: res.positiveVotes,
        negativeVotes: res.negativeVotes,
        nearestDistances: res.nearestDistances,
        nearestIndices: res.nearestIndices,
      },
      matchedTermsCount: vec.indices.length,
      topMatchedTerms,
      processingTimeMs: Math.max(0.01, Number((t1 - t0).toFixed(3))),
    };
  }
}
