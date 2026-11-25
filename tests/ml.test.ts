import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SentimentInferenceEngine } from "@/lib/ml/inference";
import { preprocessText } from "@/lib/ml/preprocessing";
import type { KnnMetaArtifact, TfidfNbArtifact } from "@/lib/ml/types";

const root = process.cwd();
const tfidfNb: TfidfNbArtifact = JSON.parse(
  fs.readFileSync(path.join(root, "public", "models", "tfidf-nb.json"), "utf-8")
);
const knnMeta: KnnMetaArtifact = JSON.parse(
  fs.readFileSync(path.join(root, "public", "models", "knn-meta.json"), "utf-8")
);
const knnBuf = fs.readFileSync(path.join(root, "public", "models", "knn-train.bin"));
const knnArrayBuffer = knnBuf.buffer.slice(
  knnBuf.byteOffset,
  knnBuf.byteOffset + knnBuf.byteLength
);

const engine = new SentimentInferenceEngine(tfidfNb, knnMeta, knnArrayBuffer);

describe("Text Preprocessing (Notebook Cell 9 Parity)", () => {
  it("lowercases and removes URLs, HTML tags, digits, and punctuation", () => {
    const raw =
      "Check https://store.steampowered.com/app/570 <b>Dota 2</b> Patch 7.36!! Awesome game 10/10.";
    expect(preprocessText(raw)).toBe("check dota patch awesome game");
  });

  it("returns empty string for whitespace or symbols only", () => {
    expect(preprocessText("   12345 !!! ???   ")).toBe("");
  });
});

describe("TF-IDF + MultinomialNB + KNN Inference Engine", () => {
  it("predicts positive sentiment for clearly positive gaming review", () => {
    const text = "Great game, best moba out there, awesome team fights and fun with friends!";
    const nb = engine.predictSingle(text, "naive_bayes");
    const knn = engine.predictSingle(text, "knn");

    expect(nb.predictedLabel).toBe("positive");
    expect(nb.scoreType).toBe("posterior_probability");
    expect(nb.score).toBeGreaterThan(0.5);
    expect(nb.classProbabilities!.positive + nb.classProbabilities!.negative).toBeCloseTo(1, 6);

    expect(knn.predictedLabel).toBe("positive");
    expect(knn.scoreType).toBe("neighbor_voting_score");
    expect(knn.knnDetails!.positiveVotes).toBeGreaterThan(knn.knnDetails!.negativeVotes);
  });

  it("predicts negative sentiment for clearly negative gaming review", () => {
    const text = "Terrible matchmaking, constant lag, toxic players, worst ranked system.";
    const nb = engine.predictSingle(text, "naive_bayes");
    const knn = engine.predictSingle(text, "knn");

    expect(nb.predictedLabel).toBe("negative");
    expect(knn.predictedLabel).toBe("negative");
  });

  it("matches Python test split accuracies (80.5% NB, 74.1% KNN) on sample check", () => {
    const fixtures = JSON.parse(
      fs.readFileSync(path.join(root, "scripts", "validation-fixtures.json"), "utf-8")
    ) as {
      testCases: Array<{
        rawText: string;
        actualLabel: string;
        nbPred: string;
        knnPred: string;
      }>;
    };

    let nbCorrect = 0;
    let knnCorrect = 0;
    for (const tc of fixtures.testCases) {
      const nb = engine.predictSingle(tc.rawText, "naive_bayes");
      const knn = engine.predictSingle(tc.rawText, "knn");
      expect(nb.predictedLabel).toBe(tc.nbPred);
      expect(knn.predictedLabel).toBe(tc.knnPred);
      if (nb.predictedLabel === tc.actualLabel) nbCorrect++;
      if (knn.predictedLabel === tc.actualLabel) knnCorrect++;
    }

    expect(nbCorrect / fixtures.testCases.length).toBeCloseTo(0.805, 6);
    expect(knnCorrect / fixtures.testCases.length).toBeCloseTo(0.741, 6);
  });
});
