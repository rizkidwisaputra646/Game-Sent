import type { KnnMetaArtifact, KnnTrainingIndex, SentimentLabel, SparseVector } from "./types";

export function parseKnnBinary(buffer: ArrayBuffer, meta: KnnMetaArtifact): KnnTrainingIndex {
  const view = new DataView(buffer);
  const magic =
    String.fromCharCode(view.getUint8(0)) +
    String.fromCharCode(view.getUint8(1)) +
    String.fromCharCode(view.getUint8(2)) +
    String.fromCharCode(view.getUint8(3));
  if (magic !== "GKNN") {
    throw new Error(`Invalid KNN binary header: ${magic}`);
  }

  const version = view.getUint32(4, true);
  const nDocs = view.getUint32(8, true);
  const nFeatures = view.getUint32(12, true);
  const nnz = view.getUint32(16, true);

  if (version !== 1 || nDocs !== meta.nDocs || nFeatures !== meta.nFeatures || nnz !== meta.nnz) {
    throw new Error("KNN binary metadata mismatch");
  }

  let offset = 20;
  const indptrByteLen = (nDocs + 1) * 4;
  const indptr = new Uint32Array(buffer.slice(offset, offset + indptrByteLen));
  offset += indptrByteLen;

  const indicesByteLen = nnz * 2;
  const indices = new Uint16Array(buffer.slice(offset, offset + indicesByteLen));
  offset += indicesByteLen;

  const dataByteLen = nnz * 4;
  const data = new Float32Array(buffer.slice(offset, offset + dataByteLen));
  offset += dataByteLen;

  const labels = new Uint8Array(buffer.slice(offset, offset + nDocs));

  return {
    k: meta.k,
    nDocs,
    nFeatures,
    nnz,
    classes: meta.classes,
    indptr,
    indices,
    data,
    labels,
  };
}

export class KnnClassifierTS {
  private readonly index: KnnTrainingIndex;
  private readonly queryDense: Float32Array;

  constructor(index: KnnTrainingIndex) {
    this.index = index;
    this.queryDense = new Float32Array(index.nFeatures);
  }

  predict(vec: SparseVector): {
    label: SentimentLabel;
    votingScore: number;
    positiveVotes: number;
    negativeVotes: number;
    nearestDistances: number[];
    nearestIndices: number[];
  } {
    const { k, nDocs, indptr, indices, data, labels } = this.index;
    const qDense = this.queryDense;

    // Populate reusable dense query buffer
    for (let i = 0; i < vec.indices.length; i++) {
      qDense[vec.indices[i]] = vec.values[i];
    }

    // Track top-k smallest distances (sorted ascending by distance, tie-broken by smaller doc index)
    const topDist = new Float64Array(k).fill(Infinity);
    const topIdx = new Int32Array(k).fill(-1);
    let worstDist = Infinity;

    const hasQueryTerms = vec.indices.length > 0;

    for (let doc = 0; doc < nDocs; doc++) {
      let dot = 0;
      if (hasQueryTerms) {
        const start = indptr[doc];
        const end = indptr[doc + 1];
        for (let p = start; p < end; p++) {
          const qv = qDense[indices[p]];
          if (qv !== 0) {
            dot += data[p] * qv;
          }
        }
      }
      // Cosine distance for L2-normalized vectors is 1 - dot
      const dist = Math.max(0, 1 - dot);

      if (dist < worstDist) {
        // Insert into sorted top-k array
        let pos = k - 1;
        while (pos > 0 && dist < topDist[pos - 1]) {
          topDist[pos] = topDist[pos - 1];
          topIdx[pos] = topIdx[pos - 1];
          pos--;
        }
        topDist[pos] = dist;
        topIdx[pos] = doc;
        worstDist = topDist[k - 1];
      }
    }

    // Clear reusable dense query buffer
    for (let i = 0; i < vec.indices.length; i++) {
      qDense[vec.indices[i]] = 0;
    }

    let negVotes = 0;
    let posVotes = 0;
    const nearestDistances: number[] = [];
    const nearestIndices: number[] = [];

    for (let i = 0; i < k; i++) {
      const docIdx = topIdx[i];
      nearestDistances.push(topDist[i]);
      nearestIndices.push(docIdx);
      if (labels[docIdx] === 1) {
        posVotes++;
      } else {
        negVotes++;
      }
    }

    const predictedLabel: SentimentLabel = posVotes > negVotes ? "positive" : "negative";
    const winningVotes = predictedLabel === "positive" ? posVotes : negVotes;

    return {
      label: predictedLabel,
      votingScore: winningVotes / k,
      positiveVotes: posVotes,
      negativeVotes: negVotes,
      nearestDistances,
      nearestIndices,
    };
  }
}
