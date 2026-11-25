/**
 * Exact TypeScript equivalent of the notebook's `preprocessing(teks)` function (Cell 9).
 */
export function preprocessText(rawText: string): string {
  if (!rawText) return "";

  let text = String(rawText).toLowerCase();
  // Remove URLs
  text = text.replace(/http\S+|www\S+/g, "");
  // Remove HTML tags (single-line match, matching Python's re.sub(r'<.*?>', '', teks))
  text = text.replace(/<.*?>/g, "");
  // Remove digits
  text = text.replace(/\d+/g, "");
  // Replace characters other than lowercase ASCII letters or whitespace with space
  text = text.replace(/[^a-z\s]/g, " ");
  // Collapse whitespace and trim
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
