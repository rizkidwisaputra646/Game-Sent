import { describe, expect, it } from "vitest";
import {
  inferDefaultMapping,
  validateMappedDataset,
  type ParsedDatasetResult,
} from "@/lib/dataset/validator";
import { buildReportPayloadFromSession } from "@/lib/export/exporters";

describe("Dataset Validator & Column Mapping", () => {
  it("infers standard column mapping automatically", () => {
    const mapping = inferDefaultMapping(["id", "game", "review", "created_at", "label"]);
    expect(mapping.reviewColumn).toBe("review");
    expect(mapping.gameColumn).toBe("game");
    expect(mapping.dateColumn).toBe("created_at");
    expect(mapping.sentimentColumn).toBe("label");
  });

  it("accurately detects Review Text over Review ID from scraping datasets", () => {
    const scraperCols = ["Review ID", "Username", "Rating", "Review Text", "Date"];
    const mapping = inferDefaultMapping(scraperCols);
    expect(mapping.reviewColumn).toBe("Review Text");
    expect(mapping.gameColumn).toBeNull();
    expect(mapping.dateColumn).toBe("Date");
    expect(mapping.sentimentColumn).toBeNull();
  });

  it("accurately maps exported GameSent report CSVs without mistaking predicted_sentiment for review", () => {
    const exportCols = [
      "row_index",
      "game",
      "date",
      "review",
      "actual_label",
      "predicted_sentiment",
      "score",
      "score_type",
      "label_source",
      "algorithm",
      "dataset_source",
    ];
    const mapping = inferDefaultMapping(exportCols);
    expect(mapping.reviewColumn).toBe("review");
    expect(mapping.gameColumn).toBe("game");
    expect(mapping.dateColumn).toBe("date");
    expect(mapping.sentimentColumn).toBe("actual_label");
  });

  it("detects empty rows, invalid reviews, duplicates, and bad dates without mutating data", () => {
    const parsed: ParsedDatasetResult = {
      fileName: "sample.csv",
      fileSizeBytes: 512,
      fileType: "csv",
      columns: ["review", "game", "date", "sentiment"],
      rows: [
        { review: "Great moba game!", game: "Dota 2", date: "2026-01-15", sentiment: "positive" },
        { review: "Great moba game!", game: "Dota 2", date: "2026-01-15", sentiment: "positive" },
        { review: "", game: "", date: "", sentiment: "" },
        { review: "   ", game: "Mobile Legends", date: "not-a-date", sentiment: "neutral" },
        { review: "Laggy servers", game: "Mobile Legends", date: "invalid-date", sentiment: "neutral" },
      ],
    };

    const report = validateMappedDataset(parsed, {
      reviewColumn: "review",
      gameColumn: "game",
      dateColumn: "date",
      sentimentColumn: "sentiment",
    });

    expect(report.isValidToAnalyze).toBe(true);
    expect(report.totalRows).toBe(5);
    expect(report.emptyRowsCount).toBe(1);
    expect(report.invalidRowsCount).toBe(1);
    expect(report.duplicateRowsCount).toBe(1);
    expect(report.validRowsCount).toBe(3); // Duplicates kept unless user opts to skip
    expect(report.invalidDateCount).toBe(1);
    expect(report.invalidLabelCount).toBe(1);
  });

  it("keeps actualLabel and predictedLabel strictly separate in export payload", () => {
    const payload = buildReportPayloadFromSession({
      title: "Test Report",
      datasetSource: "user.csv",
      algorithm: "naive_bayes",
      rows: [
        {
          rowIndex: 1,
          review: "Fun game",
          cleanedText: "fun game",
          game: "Dota 2",
          actualLabel: "negative",
          predictedLabel: "positive",
          score: 0.88,
          scoreType: "posterior_probability",
        },
      ],
    });

    expect(payload.rows[0].actualLabel).toBe("negative");
    expect(payload.rows[0].predictedLabel).toBe("positive");
  });
});
