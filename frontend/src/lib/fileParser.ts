import * as XLSX from "xlsx";
import type { ParsedTableData, ColumnMappingConfig } from "@/types/flashcard.types.ts";

/**
 * Parse a raw File (.xlsx, .xls, .csv, .txt) into a 2D matrix of strings
 */
export async function parseFlashcardFile(file: File): Promise<ParsedTableData> {
  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (ext === "xlsx" || ext === "xls") {
    return parseExcelFile(file);
  } else {
    return parseTextOrCsvFile(file);
  }
}

async function parseExcelFile(file: File): Promise<ParsedTableData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("File Excel không có trang tính (sheet) nào.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  // Convert sheet to 2D array of strings
  const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });

  const rawRows = jsonData
    .map((row) => (Array.isArray(row) ? row.map((cell) => String(cell || "").trim()) : []))
    .filter((row) => row.some((c) => c !== "")); // Bỏ dòng trống

  if (rawRows.length === 0) {
    throw new Error("File Excel trống hoặc không có nội dung.");
  }

  // Tiêu đề dòng đầu tiên
  const headers = rawRows[0];
  const dataRows = rawRows.slice(1);

  return {
    headers,
    rows: dataRows,
    hasHeader: true,
    fileName: file.name,
  };
}

async function parseTextOrCsvFile(file: File): Promise<ParsedTableData> {
  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error("File văn bản trống hoặc không có dữ liệu.");
  }

  // Tự động đoán delimiter: tab '\t', pipe '|', chấm phẩy ';', hoặc dấu phẩy ','
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  let delimiter = ",";
  if (tabCount >= 1 && tabCount >= commaCount) delimiter = "\t";
  else if (pipeCount >= 1 && pipeCount >= commaCount) delimiter = "|";
  else if (semiCount >= 1 && semiCount >= commaCount) delimiter = ";";

  const rawRows: string[][] = [];

  for (const line of lines) {
    const row = splitCsvLine(line, delimiter);
    if (row.some((cell) => cell.length > 0)) {
      rawRows.push(row);
    }
  }

  if (rawRows.length === 0) {
    throw new Error("Không thể phân tích dữ liệu trong file.");
  }

  const headers = rawRows[0];
  const dataRows = rawRows.slice(1);

  return {
    headers,
    rows: dataRows,
    hasHeader: true,
    fileName: file.name,
  };
}

/**
 * Tách từng dòng CSV tôn trọng dấu ngoặc kép "..."
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  if (delimiter !== ",") {
    return line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
  }

  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ""));
  return result;
}

/**
 * Đoán tự động cột nào ứng với trường Tiếng Việt / English / 日本語 / Romaji
 */
export function guessColumnMapping(headers: string[]): ColumnMappingConfig {
  let vietnameseCol = -1;
  let englishCol = -1;
  let japaneseCol = -1;
  let romajiCol = -1;

  headers.forEach((h, index) => {
    const headerLower = h.toLowerCase().trim();

    // 1. Tiếng Việt
    if (
      vietnameseCol === -1 &&
      /^(vi|vn|viet|vietnamese|nghĩa|tieng viet|tiếng việt|dịch|meaning)/i.test(headerLower)
    ) {
      vietnameseCol = index;
      return;
    }

    // 2. English
    if (
      englishCol === -1 &&
      /^(en|eng|english|tieng anh|tiếng anh)/i.test(headerLower)
    ) {
      englishCol = index;
      return;
    }

    // 3. 日本語
    if (
      japaneseCol === -1 &&
      /^(ja|jp|japanese|nihon|tiếng nhật|tieng nhat|kanji|hán tự|từ vựng|cau|câu|tu vung)/i.test(headerLower)
    ) {
      japaneseCol = index;
      return;
    }

    // 4. Romaji / Phiên âm
    if (
      romajiCol === -1 &&
      /^(romaji|roma|reading|kana|hiragana|phien am|phiên âm|phát âm)/i.test(headerLower)
    ) {
      romajiCol = index;
      return;
    }
  });

  // Gán mặc định theo thứ tự nếu chưa đoán được
  const availableIndices = [0, 1, 2, 3];
  if (vietnameseCol === -1) vietnameseCol = 0;
  if (englishCol === -1) englishCol = headers.length > 1 ? 1 : 0;
  if (japaneseCol === -1) japaneseCol = headers.length > 2 ? 2 : (headers.length > 1 ? 1 : 0);
  if (romajiCol === -1) romajiCol = headers.length > 3 ? 3 : -1;

  return {
    vietnameseColIndex: Math.min(vietnameseCol, Math.max(0, headers.length - 1)),
    englishColIndex: Math.min(englishCol, Math.max(0, headers.length - 1)),
    japaneseColIndex: Math.min(japaneseCol, Math.max(0, headers.length - 1)),
    romajiColIndex: romajiCol >= 0 ? Math.min(romajiCol, Math.max(0, headers.length - 1)) : undefined,
  };
}
