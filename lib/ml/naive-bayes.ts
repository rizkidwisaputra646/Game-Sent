import type { SentimentLabel, SparseVector, TfidfNbArtifact } from "./types";

export class MultinomialNaiveBayesTS {
  private readonly classes: SentimentLabel[];
  private readonly classLogPrior: Float64Array;
  private readonly featureLogProb: Float64Array[];

  constructor(config: TfidfNbArtifact["naiveBayes"]) {
    this.classes = config.classes;
    this.classLogPrior = Float64Array.from(config.classLogPrior);
    this.featureLogProb = config.featureLogProb.map((row) => Float64Array.from(row));
  }

  predict(vec: SparseVector): {
    label: SentimentLabel;
    probabilities: { negative: number; positive: number };
    confidence: number;
  } {
    const nClasses = this.classes.length;
    const jll = new Float64Array(nClasses);

    for (let c = 0; c < nClasses; c++) {
      let score = this.classLogPrior[c];
      const logProbs = this.featureLogProb[c];
      for (let i = 0; i < vec.indices.length; i++) {
        score += vec.values[i] * logProbs[vec.indices[i]];
      }
      jll[c] = score;
    }

    // Stable log-sum-exp normalization matching scikit-learn predict_proba
    let maxJll = -Infinity;
    let bestIdx = 0;
    for (let c = 0; c < nClasses; c++) {
      if (jll[c] > maxJll) {
        maxJll = jll[c];
        bestIdx = c;
      }
    }

    let sumExp = 0;
    const probs = new Float64Array(nClasses);
    for (let c = 0; c < nClasses; c++) {
      const e = Math.exp(jll[c] - maxJll);
      probs[c] = e;
      sumExp += e;
    }

    for (let c = 0; c < nClasses; c++) {
      probs[c] = probs[c] / sumExp;
    }

    const negIdx = this.classes.indexOf("negative");
    const posIdx = this.classes.indexOf("positive");

    return {
      label: this.classes[bestIdx],
      probabilities: {
        negative: probs[negIdx],
        positive: probs[posIdx],
      },
      confidence: probs[bestIdx],
    };
  }
}
