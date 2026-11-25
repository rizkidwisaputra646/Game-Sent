import type { ResearchRecord } from "./types";

export interface IndexedResearchRecord extends ResearchRecord {
  _search: string;
}

let cachedRows: IndexedResearchRecord[] | null = null;
let inflightPromise: Promise<IndexedResearchRecord[]> | null = null;

/**
 * Fetches and caches the 4,997-row research dataset once per browser session
 * so navigating back to /datasets is instantaneous.
 */
export async function getCachedResearchDataset(): Promise<IndexedResearchRecord[]> {
  if (cachedRows) {
    return cachedRows;
  }
  if (!inflightPromise) {
    inflightPromise = fetch("/data/research-dataset.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Gagal memuat dataset penelitian.");
        }
        return res.json() as Promise<ResearchRecord[]>;
      })
      .then((records) => {
        cachedRows = records.map((r) => ({
          ...r,
          _search: `${r.id} ${r.review}`.toLowerCase(),
        }));
        return cachedRows;
      })
      .catch((err) => {
        inflightPromise = null;
        throw err;
      });
  }
  return inflightPromise;
}
