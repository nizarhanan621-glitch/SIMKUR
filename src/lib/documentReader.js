
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { readSheet } from "read-excel-file/browser";

// Mengatur PDF.js agar menggunakan Web Worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/* ==========================================
   PEMBACA DOKUMEN KALENDER PENDIDIKAN
   Mendukung PDF teks dan Excel XLSX
   ========================================== */

// Mengubah item teks PDF menjadi baris yang lebih mudah dibaca.
function groupPdfTextIntoLines(items) {
  const positionedItems = items
    .filter((item) => item.str && item.str.trim())
    .map((item) => ({
      text: item.str.trim(),
      x: item.transform?.[4] ?? 0,
      y: item.transform?.[5] ?? 0,
    }))
    .sort((a, b) => {
      if (Math.abs(b.y - a.y) > 3) {
        return b.y - a.y;
      }

      return a.x - b.x;
    });

  const lines = [];
  let currentLine = [];
  let lastY = null;

  for (const item of positionedItems) {
    if (lastY !== null && Math.abs(item.y - lastY) > 3) {
      if (currentLine.length) {
        lines.push(currentLine.join(" "));
      }

      currentLine = [];
    }

    currentLine.push(item.text);
    lastY = item.y;
  }

  if (currentLine.length) {
    lines.push(currentLine.join(" "));
  }

  return lines.join("\n");
}

/* ==========================================
   MEMBACA FILE PDF
   ========================================== */

async function readPdfDocument(file) {
  const buffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
  }).promise;

  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    const textContent = await page.getTextContent();

    const pageText = groupPdfTextIntoLines(
      textContent.items
    );

    pages.push({
      pageNumber,
      text: pageText,
    });
  }

  const fullText = pages
    .map((page) => `HALAMAN ${page.pageNumber}\n${page.text}`)
    .join("\n\n");

  return {
    fileName: file.name,
    fileType: "pdf",
    totalPages: pdf.numPages,
    pages,
    fullText,
  };
}

/* ==========================================
   MEMBACA FILE EXCEL XLSX
   ========================================== */

async function readExcelDocument(file) {
  const rows = await readSheet(file);

  const textRows = rows.map((row) =>
    row.map((cell) => {
      if (cell instanceof Date) {
        return cell.toLocaleDateString("id-ID");
      }

      return cell === null || cell === undefined
        ? ""
        : String(cell);
    })
  );

  return {
    fileName: file.name,
    fileType: "xlsx",
    totalRows: rows.length,
    rows: textRows,
    fullText: textRows
      .map((row) => row.join(" | "))
      .join("\n"),
  };
}

/* ==========================================
   FUNGSI UTAMA PEMBACA DOKUMEN
   ========================================== */

export async function readCalendarDocument(file) {
  if (!file) {
    throw new Error("Belum ada dokumen yang dipilih.");
  }

  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  if (extension === "pdf") {
    return await readPdfDocument(file);
  }

  if (extension === "xlsx") {
    return await readExcelDocument(file);
  }

  throw new Error(
    "Format belum didukung. Gunakan PDF atau Excel XLSX."
  );
}
