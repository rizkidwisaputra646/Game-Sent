import fs from "node:fs";
import path from "node:path";
import { SentimentInferenceEngine } from "../lib/ml/inference";
import type { KnnMetaArtifact, TfidfNbArtifact } from "../lib/ml/types";

interface FixtureCase {
  id?: string;
  rawText: string;
  cleanText: string;
  actualLabel?: string;
  tfidfNnz: [number, number][];
  nbPred: string;
  nbProba: [number, number];
  knnPred: string;
  knnVotePos: number;
  knnTop5Idx?: number[];
  knnTop5Dist?: number[];
}

interface ValidationFixtures {
  testCases: FixtureCase[];
  edgeCases: FixtureCase[];
}

function main(): void {
  const root = process.cwd();
  const tfidfNb: TfidfNbArtifact = JSON.parse(
    fs.readFileSync(path.join(root, "public", "models", "tfidf-nb.json"), "utf-8")
  );
  const knnMeta: KnnMetaArtifact = JSON.parse(
    fs.readFileSync(path.join(root, "public", "models", "knn-meta.json"), "utf-8")
  );
  const knnFileBuf = fs.readFileSync(path.join(root, "public", "models", "knn-train.bin"));
  const knnArrayBuffer = knnFileBuf.buffer.slice(
    knnFileBuf.byteOffset,
    knnFileBuf.byteOffset + knnFileBuf.byteLength
  );
  const fixtures: ValidationFixtures = JSON.parse(
    fs.readFileSync(path.join(root, "scripts", "validation-fixtures.json"), "utf-8")
  );

  const engine = new SentimentInferenceEngine(tfidfNb, knnMeta, knnArrayBuffer);

  let cleanMismatches = 0;
  let tfidfMismatches = 0;
  let maxTfidfDiff = 0;
  let nbPredMismatches = 0;
  let maxNbProbaDiff = 0;
  let knnPredMismatches = 0;
  let knnVoteMismatches = 0;
  let zeroVectorEdgeCases = 0;
  let maxKnnDistDiff = 0;

  const allCases = [...fixtures.testCases, ...fixtures.edgeCases];
  const tStart = performance.now();

  for (let i = 0; i < allCases.length; i++) {
    const tc = allCases[i];
    const nbRes = engine.predictSingle(tc.rawText, "naive_bayes");
    const knnRes = engine.predictSingle(tc.rawText, "knn");

    if (nbRes.cleanedText !== tc.cleanText) {
      cleanMismatches++;
      console.error(`Clean mismatch [${i}]:`, { got: nbRes.cleanedText, expected: tc.cleanText });
    }

    const vec = engine.vectorizer.transform(nbRes.cleanedText);
    if (vec.indices.length !== tc.tfidfNnz.length) {
      tfidfMismatches++;
      console.error(`TF-IDF length mismatch [${i}]:`, vec.indices.length, tc.tfidfNnz.length);
    } else {
      for (let j = 0; j < vec.indices.length; j++) {
        const [expIdx, expVal] = tc.tfidfNnz[j];
        if (vec.indices[j] !== expIdx) {
          tfidfMismatches++;
          break;
        }
        const diff = Math.abs(vec.values[j] - expVal);
        if (diff > maxTfidfDiff) maxTfidfDiff = diff;
        if (diff > 1e-5) {
          tfidfMismatches++;
          break;
        }
      }
    }

    if (nbRes.predictedLabel !== tc.nbPred) {
      nbPredMismatches++;
      console.error(`NB pred mismatch [${i}]: got=${nbRes.predictedLabel}, exp=${tc.nbPred}`);
    }
    if (nbRes.classProbabilities) {
      const diffNeg = Math.abs(nbRes.classProbabilities.negative - tc.nbProba[0]);
      const diffPos = Math.abs(nbRes.classProbabilities.positive - tc.nbProba[1]);
      maxNbProbaDiff = Math.max(maxNbProbaDiff, diffNeg, diffPos);
    }

    // Note: when query TF-IDF vector is completely empty (zero-norm), all 3,997
    // training docs have cosine distance === 1.0, so NumPy argpartition tie-breaking
    // is implementation-defined. We verify distances are all 1.0 on empty vectors,
    // and enforce strict label/vote equality on all non-zero vectors (including all 1,000 test cases).
    if (vec.indices.length === 0) {
      zeroVectorEdgeCases++;
      const allUnitDist = knnRes.knnDetails?.nearestDistances.every(
        (d) => Math.abs(d - 1.0) < 1e-6
      );
      if (!allUnitDist) {
        knnPredMismatches++;
      }
    } else {
      if (knnRes.predictedLabel !== tc.knnPred) {
        knnPredMismatches++;
        console.error(`KNN pred mismatch [${i}]: got=${knnRes.predictedLabel}, exp=${tc.knnPred}`);
      }
      if (knnRes.knnDetails) {
        const gotPosVote = knnRes.knnDetails.positiveVotes / knnRes.knnDetails.k;
        if (Math.abs(gotPosVote - tc.knnVotePos) > 1e-6) {
          knnVoteMismatches++;
        }
        if (tc.knnTop5Dist) {
          for (let d = 0; d < tc.knnTop5Dist.length; d++) {
            const dDiff = Math.abs(knnRes.knnDetails.nearestDistances[d] - tc.knnTop5Dist[d]);
            if (dDiff > maxKnnDistDiff) maxKnnDistDiff = dDiff;
          }
        }
      }
    }
  }

  const totalTimeMs = performance.now() - tStart;

  let nbCorrect = 0;
  let knnCorrect = 0;
  for (const tc of fixtures.testCases) {
    const nb = engine.predictSingle(tc.rawText, "naive_bayes");
    const knn = engine.predictSingle(tc.rawText, "knn");
    if (nb.predictedLabel === tc.actualLabel) nbCorrect++;
    if (knn.predictedLabel === tc.actualLabel) knnCorrect++;
  }

  const summary = {
    totalValidated: allCases.length,
    testCasesCount: fixtures.testCases.length,
    edgeCasesCount: fixtures.edgeCases.length,
    zeroVectorEdgeCases,
    cleanMismatches,
    tfidfMismatches,
    maxTfidfDiff,
    nbPredMismatches,
    maxNbProbaDiff,
    knnPredMismatches,
    knnVoteMismatches,
    maxKnnDistDiff,
    tsTestAccuracyNB: nbCorrect / fixtures.testCases.length,
    tsTestAccuracyKNN: knnCorrect / fixtures.testCases.length,
    totalInferenceTimeMs: Number(totalTimeMs.toFixed(2)),
  };

  console.log("VALIDATION SUMMARY:");
  console.log(JSON.stringify(summary, null, 2));

  if (
    cleanMismatches > 0 ||
    tfidfMismatches > 0 ||
    nbPredMismatches > 0 ||
    knnPredMismatches > 0 ||
    knnVoteMismatches > 0
  ) {
    process.exit(1);
  }
}

main();
