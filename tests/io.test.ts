import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseCsvFile } from "@/lib/dataset/csv-parser";
import { parseExcelFile } from "@/lib/dataset/excel-parser";

describe("CSV & XLSX Parsing Integration", () => {
  it("parses UTF-8 CSV files including BOM", async () => {
    const csvContent = "\uFEFFreview,game,label\n\"Fun moba game!\",Dota 2,positive\n\"Laggy servers\",Mobile Legends,negative\n";
    const file = new File([csvContent], "test.csv", { type: "text/csv" });
    const parsed = await parseCsvFile(file);

    expect(parsed.fileType).toBe("csv");
    expect(parsed.encodingNote).toBe("UTF-8 (BOM)");
    expect(parsed.columns).toEqual(["review", "game", "label"]);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].review).toBe("Fun moba game!");
    expect(parsed.rows[1].game).toBe("Mobile Legends");
  });

  it("rejects empty CSV files", async () => {
    const file = new File([""], "empty.csv", { type: "text/csv" });
    await expect(parseCsvFile(file)).rejects.toThrow(/kosong/i);
  });

  it("parses real XLSX workbooks created with ExcelJS", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Reviews");
    ws.addRow(["review", "game", "date", "sentiment"]);
    ws.addRow(["Great team fight mechanics", "Dota 2", "2026-02-10", "positive"]);
    ws.addRow(["Toxic matchmaking", "Mobile Legends", "2026-02-11", "negative"]);

    const buf = await wb.xlsx.writeBuffer();
    const file = new File([buf], "reviews.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const parsed = await parseExcelFile(file);
    expect(parsed.fileType).toBe("xlsx");
    expect(parsed.columns).toEqual(["review", "game", "date", "sentiment"]);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].review).toBe("Great team fight mechanics");
    expect(parsed.rows[1].sentiment).toBe("negative");
  });
});
