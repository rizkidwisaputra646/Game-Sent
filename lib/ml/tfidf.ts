import type { SparseVector, TfidfNbArtifact } from "./types";

export class TfidfVectorizerTS {
  private readonly stopWords: Set<string>;
  private readonly vocabulary: Map<string, number>;
  private readonly inverseVocabulary: string[];
  private readonly idf: Float64Array;
  private readonly ngramMin: number;
  private readonly ngramMax: number;

  constructor(config: TfidfNbArtifact["tfidf"]) {
    this.stopWords = new Set(config.stopWords);
    this.vocabulary = new Map<string, number>();
    this.inverseVocabulary = new Array<string>(config.vocabularySize);
    for (const [term, idx] of Object.entries(config.vocabulary)) {
      this.vocabulary.set(term, idx);
      this.inverseVocabulary[idx] = term;
    }
    this.idf = Float64Array.from(config.idf);
    this.ngramMin = config.ngramRange[0];
    this.ngramMax = config.ngramRange[1];
  }

  /**
   * Tokenize and filter stop words in the exact order used by scikit-learn's
   * CountVectorizer / TfidfVectorizer `_word_ngrams`.
   */
  tokenize(cleanedText: string): string[] {
    if (!cleanedText) return [];
    const rawTokens = cleanedText.match(/[a-z]{2,}/g);
    if (!rawTokens) return [];
    const filtered: string[] = [];
    for (let i = 0; i < rawTokens.length; i++) {
      const tok = rawTokens[i];
      if (!this.stopWords.has(tok)) {
        filtered.push(tok);
      }
    }
    return filtered;
  }

  transform(cleanedText: string): SparseVector {
    const tokens = this.tokenize(cleanedText);
    if (tokens.length === 0) {
      return { indices: [], values: [] };
    }

    const termCounts = new Map<number, number>();
    const nTokens = tokens.length;

    // Unigrams (n = 1)
    if (this.ngramMin <= 1 && this.ngramMax >= 1) {
      for (let i = 0; i < nTokens; i++) {
        const idx = this.vocabulary.get(tokens[i]);
        if (idx !== undefined) {
          termCounts.set(idx, (termCounts.get(idx) ?? 0) + 1);
        }
      }
    }

    // Bigrams (n = 2)
    if (this.ngramMin <= 2 && this.ngramMax >= 2 && nTokens >= 2) {
      for (let i = 0; i < nTokens - 1; i++) {
        const bigram = `${tokens[i]} ${tokens[i + 1]}`;
        const idx = this.vocabulary.get(bigram);
        if (idx !== undefined) {
          termCounts.set(idx, (termCounts.get(idx) ?? 0) + 1);
        }
      }
    }

    if (termCounts.size === 0) {
      return { indices: [], values: [] };
    }

    // Sort indices ascending to mirror CSR ordering
    const sortedIndices = Array.from(termCounts.keys()).sort((a, b) => a - b);
    const values = new Array<number>(sortedIndices.length);
    let normSq = 0;

    for (let i = 0; i < sortedIndices.length; i++) {
      const colIdx = sortedIndices[i];
      const tf = termCounts.get(colIdx)!;
      const weighted = tf * this.idf[colIdx];
      values[i] = weighted;
      normSq += weighted * weighted;
    }

    if (normSq > 0) {
      const norm = Math.sqrt(normSq);
      for (let i = 0; i < values.length; i++) {
        values[i] = values[i] / norm;
      }
    }

    return { indices: sortedIndices, values };
  }

  getTopTerms(vec: SparseVector, limit = 8): Array<{ term: string; weight: number }> {
    const items: Array<{ term: string; weight: number }> = [];
    for (let i = 0; i < vec.indices.length; i++) {
      const idx = vec.indices[i];
      items.push({
        term: this.inverseVocabulary[idx] ?? `#${idx}`,
        weight: vec.values[i],
      });
    }
    items.sort((a, b) => b.weight - a.weight);
    return items.slice(0, limit);
  }
}
