
/* ==========================================
   SIMKUR SMP
   CALENDAR DATA EXTRACTOR
   Mengenali tanggal dan kegiatan Kaldik
   ========================================== */

const MONTHS = {
  januari: 1,
  februari: 2,
  pebruari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  nopember: 11,
  november: 11,
  desember: 12,
};

const MONTH_PATTERN = Object.keys(MONTHS).join("|");

function toIsoDate(day, month, year) {
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

/* Mengenali tanggal dalam satu baris teks */

function extractDateRange(text) {
  let match;

  // Contoh: 1–3 Juli 2026
  const sharedMonthPattern = new RegExp(
    `(\\d{1,2})\\s*(?:-|–|sampai|s\\.d\\.?|sd)\\s*(\\d{1,2})\\s+(${MONTH_PATTERN})\\s+(\\d{4})`,
    "i"
  );

  match = text.match(sharedMonthPattern);

  if (match) {
    const month = MONTHS[match[3].toLowerCase()];
    const startDate = toIsoDate(match[1], month, match[4]);
    const endDate = toIsoDate(match[2], month, match[4]);

    if (startDate && endDate && startDate <= endDate) {
      return { startDate, endDate };
    }
  }

  // Contoh: 01/07/2026 sampai 03/07/2026
  const numericRangePattern =
    /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\s*(?:-|–|sampai|s\.d\.?|sd)\s*(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/i;

  match = text.match(numericRangePattern);

  if (match) {
    const startDate = toIsoDate(match[1], match[2], match[3]);
    const endDate = toIsoDate(match[4], match[5], match[6]);

    if (startDate && endDate && startDate <= endDate) {
      return { startDate, endDate };
    }
  }

  // Contoh: 13 Juli 2026
  const namedDatePattern = new RegExp(
    `(\\d{1,2})\\s+(${MONTH_PATTERN})\\s+(\\d{4})`,
    "i"
  );

  match = text.match(namedDatePattern);

  if (match) {
    const month = MONTHS[match[2].toLowerCase()];
    const date = toIsoDate(match[1], month, match[3]);

    if (date) {
      return { startDate: date, endDate: date };
    }
  }

  // Contoh: 13/07/2026 atau 13-07-2026
  const numericDatePattern =
    /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/;

  match = text.match(numericDatePattern);

  if (match) {
    const date = toIsoDate(match[1], match[2], match[3]);

    if (date) {
      return { startDate: date, endDate: date };
    }
  }

  // Contoh: 2026-07-13
  const isoDatePattern =
    /(\d{4})-(\d{1,2})-(\d{1,2})/;

  match = text.match(isoDatePattern);

  if (match) {
    const date = toIsoDate(match[3], match[2], match[1]);

    if (date) {
      return { startDate: date, endDate: date };
    }
  }

  return null;
}

/* Mengenali kategori kegiatan */

function detectCalendarCategory(text) {
  const value = text.toLowerCase();

  if (/cuti bersama/.test(value)) {
    return "Cuti Bersama";
  }

  if (/libur nasional/.test(value)) {
    return "Libur Nasional";
  }

  if (/libur daerah/.test(value)) {
    return "Libur Daerah";
  }

  if (/libur sekolah|libur semester|libur akhir tahun/.test(value)) {
    return "Libur Sekolah";
  }

  if (/asesmen|ujian|penilaian/.test(value)) {
    return "Asesmen";
  }

  if (
    /awal tahun pelajaran|akhir tahun pelajaran|awal semester|akhir semester/.test(value)
  ) {
    return "Awal/Akhir Semester";
  }

  if (/hari efektif|minggu efektif|pembelajaran efektif/.test(value)) {
    return "Pembelajaran Efektif";
  }

  if (/rapor|raport|rapat|supervisi|kegiatan sekolah/.test(value)) {
    return "Kegiatan Sekolah";
  }

  if (/kegiatan dinas|peringatan|hari pendidikan/.test(value)) {
    return "Hari Penting Pendidikan";
  }

  return "Lainnya";
}

/* Membuat kandidat kegiatan dari baris dokumen */


function isDocumentMetadataLine(text) {
  const metadataPattern =
    /^\s*(nomor(?:\s+surat|\s+keputusan)?|no\.?\s*surat|lampiran|perihal|kepada|yth\.?|ditetapkan\s+di|tanggal\s+surat|tembusan|mengetahui|penandatangan)\s*[:.]?/i;

  return metadataPattern.test(text);
}


function createCandidate(line, source) {
  const dates = extractDateRange(line);

  if (!dates) return null;

  const title = line
    .replace(/\s+/g, " ")
    .trim();

  if (title.length < 4) return null;

  return {
    id: `extract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    category: detectCalendarCategory(line),
    startDate: dates.startDate,
    endDate: dates.endDate,
    description: "Hasil pembacaan otomatis, perlu verifikasi Wakasek.",
    sourcePage: source.pageNumber ?? null,
    sourceRow: source.rowNumber ?? null,
    verificationStatus: "needs_review",
    source: "Kalender Pendidikan Dinas",
  };
}

/* Fungsi utama ekstraksi */

export function extractCalendarActivities(documentResult) {
  if (!documentResult) return [];

  let sourceLines = [];

  if (documentResult.pages?.length) {
    documentResult.pages.forEach((page) => {
      page.text.split(/\r?\n/).forEach((line) => {
        sourceLines.push({
          text: line,
          pageNumber: page.pageNumber,
        });
      });
    });
  } else if (documentResult.rows?.length) {
    documentResult.rows.forEach((row, index) => {
      sourceLines.push({
        text: row.join(" | "),
        rowNumber: index + 1,
      });
    });
  } else if (documentResult.fullText) {
    documentResult.fullText.split(/\r?\n/).forEach((line) => {
      sourceLines.push({ text: line });
    });
  }

  const candidates = [];
  const seen = new Set();

  sourceLines.forEach((source) => {
    const line = String(source.text || "").trim();

    if (!line) return;
    if (isDocumentMetadataLine(line)) return;

    const candidate = createCandidate(line, source);

    if (!candidate) return;

    const uniqueKey = [
      candidate.title,
      candidate.startDate,
      candidate.endDate,
    ].join("|");

    if (seen.has(uniqueKey)) return;

    seen.add(uniqueKey);
    candidates.push(candidate);
  });

  return candidates;
}
