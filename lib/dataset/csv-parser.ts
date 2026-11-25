import Papa from "papaparse";
import { MAX_IMPORT_FILE_BYTES, type ParsedDatasetResult } from "./validator";

export async function parseCsvFile(file: File): Promise<ParsedDatasetResult> {
  if (file.size === 0) {
    throw new Error("File CSV kosong (0 byte).");
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error("Ukuran file melebihi batas maksimal 15 MB.");
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // Basic encoding detection: strip UTF-8 BOM if present, decode UTF-8
  let encodingNote = "UTF-8";
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    encodingNote = "UTF-8 (BOM)";
  }

  const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  // Strip single trailing EOF newline so standard CSV files don't report a phantom empty row
  const text = rawText.replace(/(?:\r\n|\r|\n)$/, "");
  if (!text.trim()) {
    throw new Error("Isi file CSV kosong.");
  }

  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: false,
    dynamicTyping: false,
  });

  if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(`Gagal memparsing CSV: ${parsed.errors[0].message}`);
  }

  const columns = (parsed.meta.fields ?? []).filter((f) => f && f.trim() !== "");
  if (columns.length === 0) {
    throw new Error("Header kolom CSV tidak ditemukan.");
  }

  const rows: Record<string, string>[] = parsed.data.map((raw) => {
    const row: Record<string, string> = {};
    for (const col of columns) {
      const val = raw[col];
      row[col] = val === undefined || val === null ? "" : String(val);
    }
    return row;
  });

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    fileType: "csv",
    columns,
    rows,
    encodingNote,
  };
}
