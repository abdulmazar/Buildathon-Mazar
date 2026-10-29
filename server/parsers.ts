import mammoth from "mammoth";
import * as cheerio from "cheerio";
import * as pdfParseModule from "pdf-parse";
import WordExtractor from "word-extractor";
import { ApiError } from "./envelope.js";

const wordExtractor = new WordExtractor();

export async function extractTextFromFile(buffer: Buffer, originalName: string, mimeType?: string): Promise<string> {
  const ext = originalName.toLowerCase().slice(originalName.lastIndexOf("."));

  try {
    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }

    if (ext === ".doc") {
      const doc = await wordExtractor.extract(buffer);
      return doc.getBody().trim();
    }

    if (ext === ".pdf") {
      // Support both function and class versions of pdf-parse
      const anyModule = pdfParseModule as any;
      if (typeof anyModule.default === "function") {
        const res = await anyModule.default(buffer);
        return res.text.trim();
      }
      if (typeof anyModule.PDFParse === "function") {
        const parser = new anyModule.PDFParse({ data: buffer });
        const res = await parser.getText();
        return typeof res === "string" ? res.trim() : (res?.text ?? "").trim();
      }
      if (typeof anyModule === "function") {
        const res = await anyModule(buffer);
        return res.text.trim();
      }
      throw new Error("PDF parser implementation not found");
    }

    if (ext === ".html" || ext === ".htm") {
      const html = buffer.toString("utf-8");
      const $ = cheerio.load(html);
      $("script, style").remove();
      return $("body").text().replace(/\s+/g, " ").trim();
    }

    // Fallback if extension missing but mime is text/plain or html
    if (mimeType?.includes("html")) {
      const html = buffer.toString("utf-8");
      const $ = cheerio.load(html);
      $("script, style").remove();
      return $("body").text().replace(/\s+/g, " ").trim();
    }

    if (mimeType?.includes("text") || ext === ".txt") {
      return buffer.toString("utf-8").trim();
    }

    throw new ApiError(
      400,
      "UNSUPPORTED_FORMAT",
      `Unsupported file format "${ext || originalName}". Accepted formats: .docx, .doc, .pdf, .html`
    );
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      400,
      "PARSE_FAILED",
      `Could not read "${originalName}": ${err instanceof Error ? err.message : "Invalid or corrupt file"}`
    );
  }
}
