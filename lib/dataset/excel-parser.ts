import type ExcelJS from "exceljs";
import { MAX_IMPORT_FILE_BYTES, type ParsedDatasetResult } from "./validator";

function cellValueToString(val: ExcelJS.CellValue): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "object") {
    if ("text" in val && typeof val.text === "string") return val.text;
    if ("richText" in val && Array.isArray(val.richText)) {
      return val.richText.map((rt) => rt.text).join("");
    }
    if ("result" in val && val.result !== undefined) {
      return String(val.result);
    }
  }
  return String(val);
}

export async function parseExcelFile(file: File): Promise<ParsedDatasetResult> {
  if (file.size === 0) {
    throw new Error("File Excel kosong (0 byte).");
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error("Ukuran file melebihi batas maksimal 15 MB.");
  }

  const ExcelJSLib = (await import("exceljs")).default;
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJSLib.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    throw new Error("Worksheet Excel kosong atau tidak ditemukan.");
  }

  const headerRow = worksheet.getRow(1);
  const columns: string[] = [];
  const colIndices: number[] = [];

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const headerText = cellValueToString(cell.value).trim();
    if (headerText) {
      columns.push(headerText);
      colIndices.push(colNumber);
    }
  });

  if (columns.length === 0) {
    throw new Error("Baris header pada sheet pertama Excel tidak ditemukan.");
  }

  const rows: Record<string, string>[] = [];
  for (let r = 2; r <= worksheet.rowCount; r++) {
    const excelRow = worksheet.getRow(r);
    const record: Record<string, string> = {};
    for (let i = 0; i < columns.length; i++) {
      const cell = excelRow.getCell(colIndices[i]);
      record[columns[i]] = cellValueToString(cell.value);
    }
    rows.push(record);
  }

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    fileType: "xlsx",
    columns,
    rows,
    encodingNote: `XLSX (Sheet: ${worksheet.name})`,
  };
}
