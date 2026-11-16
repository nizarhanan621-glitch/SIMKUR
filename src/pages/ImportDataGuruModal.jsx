import { useMemo, useState } from "react";
import readXlsxFile from "read-excel-file/browser";
import { FileSpreadsheet, Upload, X, AlertTriangle, Download } from "lucide-react";
import * as XLSX from "xlsx";

const clean = (value) => String(value ?? "").trim();
const cleanIdentifier = (value) => {
  const result = clean(value).toUpperCase();
  return ["-", "–", "—"].includes(result) ? "" : result;
};
const keyOf = (value) => clean(value).toLowerCase().replace(/[\s_.-]+/g, "");

const HEADER_ALIASES = {
  nama: ["nama", "namaguru", "namalengkap", "nama lengkap", "ptk"],
  nip: ["nip", "nipbaru", "nip pns"],
  nuptk: ["nuptk"],
  jenisKelamin: ["jeniskelamin", "jk", "gender"],
  statusKepegawaian: ["statuskepegawaian", "statuspegawai", "statuspeg"],
  jenisPTK: ["jenisptk", "jenis ptk", "jabatanptk"],
  pendidikan: ["pendidikan", "pendidikanterakhir", "ijazahterakhir"],
  mataPelajaran: ["matapelajaran", "mapel", "bidangstudi"],
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text ?? "").replace(/^\uFEFF/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"' && quoted && source[i + 1] === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some((item) => clean(item))) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((item) => clean(item))) rows.push(row);
  return rows;
}

function normalizeRows(matrix) {
  if (!Array.isArray(matrix) || matrix.length < 2) {
    throw new Error("File harus memiliki baris judul kolom dan minimal satu baris data.");
  }

  const headers = matrix[0].map(keyOf);
  const indexes = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    indexes[field] = headers.findIndex((header) => aliases.map(keyOf).includes(header));
  }

  if (indexes.nama < 0) {
    throw new Error("Kolom Nama wajib tersedia. Gunakan judul kolom Nama atau Nama Lengkap.");
  }

  return matrix.slice(1).map((cells, index) => {
    const result = {};
    for (const field of Object.keys(HEADER_ALIASES)) {
      const column = indexes[field];
const value = column >= 0 ? clean(cells[column]) : "";

result[field] =
  field === "nip" || field === "nuptk"
    ? cleanIdentifier(value)
    : value;
    }
    return { ...result, _rowNumber: index + 2 };
  }).filter((item) => Object.values(item).some((value) => clean(value)));
}
const TEMPLATE_GURU_HEADERS = [
  "Nama",
  "NIP",
  "NUPTK",
  "Jenis Kelamin",
  "Status Kepegawaian",
  "Jenis PTK",
  "Pendidikan",
  "Mata Pelajaran",
];

function downloadTemplateExcel() {
  const worksheet = XLSX.utils.aoa_to_sheet([
  TEMPLATE_GURU_HEADERS,
  [
    "CONTOH - Ganti dengan nama guru",
    "198501012010011001",
    "1234567890123456",
    "Laki-laki",
    "PNS",
    "Guru Mata Pelajaran",
    "S1",
    "Matematika",
  ],
]);
  worksheet["!cols"] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 22 },
    { wch: 22 },
    { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Guru");
  XLSX.writeFile(workbook, "Template_Import_Data_Guru.xlsx");
}

function downloadTemplateCsv() {
  const csv = "\uFEFF" + [
  TEMPLATE_GURU_HEADERS,
  [
    "CONTOH - Ganti dengan nama guru",
    "198501012010011001",
    "1234567890123456",
    "Laki-laki",
    "PNS",
    "Guru Mata Pelajaran",
    "S1",
    "Matematika",
  ],
].map((row) =>
  row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
).join("\r\n") + "\r\n";
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Template_Import_Data_Guru.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ImportDataGuruModal({ existingTeachers = [], onImport, onClose }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const analysis = useMemo(() => {
    const existingNip = new Set(
  existingTeachers.map((item) => cleanIdentifier(item.nip)).filter(Boolean)
);
const existingNuptk = new Set(
  existingTeachers.map((item) => cleanIdentifier(item.nuptk)).filter(Boolean)
);
    const seenNip = new Set();
    const seenNuptk = new Set();

    return rows.map((item) => {
      const nip = cleanIdentifier(item.nip);
      const nuptk = cleanIdentifier(item.nuptk);
      let reason = "";
      if (!clean(item.nama)) reason = "Nama wajib diisi";
      else if (nip && (existingNip.has(nip) || seenNip.has(nip))) reason = "NIP sudah terdaftar/duplikat dalam file";
      else if (nuptk && (existingNuptk.has(nuptk) || seenNuptk.has(nuptk))) reason = "NUPTK sudah terdaftar/duplikat dalam file";
      if (!reason) {
        if (nip) seenNip.add(nip);
        if (nuptk) seenNuptk.add(nuptk);
      }
      return { ...item, _error: reason };
    });
  }, [rows, existingTeachers]);

  const validRows = analysis.filter((item) => !item._error);
  const invalidRows = analysis.filter((item) => item._error);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setRows([]);
    setFileName(file.name);
    setBusy(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      let matrix;

if (extension === "csv") {
  matrix = parseCsv(await file.text());
} else if (extension === "xlsx") {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: false,
  });

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  matrix = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
  });
} else {
  throw new Error("Format file harus XLSX atau CSV.");
}

console.log("HASIL PEMBACAAN FILE GURU:", matrix);
setRows(normalizeRows(matrix));
      setRows(normalizeRows(matrix));
    } catch (err) {
      setError(err?.message || "File tidak dapat dibaca.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const submit = async () => {
    if (!validRows.length || busy) return;
    setBusy(true);
    setError("");
    try {
      await onImport(validRows.map(({ _rowNumber, _error, ...item }) => item));
      onClose();
    } catch (err) {
      setError(err?.message || "Impor gagal disimpan. Periksa koneksi lalu coba kembali.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="import-guru-title">
        <header style={styles.header}>
          <div><h2 id="import-guru-title" style={{ margin: 0 }}>Impor Data Guru</h2><p style={styles.sub}>Unggah Excel (.xlsx) atau CSV. Data cloud yang sudah ada tidak akan ditimpa.</p></div>
          <button type="button" onClick={onClose} disabled={busy} style={styles.close} aria-label="Tutup"><X size={20} /></button>
        </header>

        <div style={styles.instructions}>
          <strong>Kolom yang dikenali</strong>
          <p style={{ margin: "5px 0 0" }}>Nama (wajib), NIP, NUPTK, Jenis Kelamin, Status Kepegawaian, Jenis PTK, Pendidikan, Mata Pelajaran.</p>
          <p style={{ margin: "5px 0 0" }}>Baris pertama harus berisi judul kolom. NIP/NUPTK digunakan untuk mendeteksi duplikasi.</p>
        </div>

        <div style={styles.templateActions}>
          <button
            type="button"
            style={styles.templateButton}
            onClick={downloadTemplateExcel}
          >
            <Download size={16} />
            Unduh Template Excel
          </button>

          <button
            type="button"
            style={styles.templateButton}
            onClick={downloadTemplateCsv}
          >
            <Download size={16} />
            Unduh Template CSV
          </button>
        </div>

        <label style={styles.upload}>
          <FileSpreadsheet size={22} />
          <span>{busy ? "Memproses file..." : fileName || "Pilih file Excel atau CSV"}</span>
          <input type="file" accept=".xlsx,.csv" onChange={handleFile} disabled={busy} style={{ display: "none" }} />
        </label>

        {error && <div style={styles.error}><AlertTriangle size={17} />{error}</div>}
        {analysis.length > 0 && <>
          <div style={styles.summary}>
            <span><strong>{analysis.length}</strong> baris</span>
            <span style={{ color: "#15803d" }}><strong>{validRows.length}</strong> siap diimpor</span>
            <span style={{ color: "#b45309" }}><strong>{invalidRows.length}</strong> dilewati</span>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr><th>Baris</th><th>Nama</th><th>NIP</th><th>NUPTK</th><th>Status validasi</th></tr></thead>
              <tbody>{analysis.slice(0, 100).map((item) => <tr key={item._rowNumber}>
                <td>{item._rowNumber}</td><td>{item.nama}</td><td>{item.nip || "—"}</td><td>{item.nuptk || "—"}</td>
                <td style={{ color: item._error ? "#b45309" : "#15803d" }}>{item._error || "Siap"}</td>
              </tr>)}</tbody>
            </table>
            {analysis.length > 100 && <p style={styles.sub}>Pratinjau menampilkan 100 baris pertama. Seluruh {analysis.length} baris tetap divalidasi.</p>}
          </div>
        </>}

        <footer style={styles.footer}>
          <button type="button" style={styles.secondary} onClick={onClose} disabled={busy}>Batal</button>
          <button type="button" style={styles.primary} onClick={submit} disabled={busy || !validRows.length}><Upload size={16} />{busy ? "Menyimpan..." : `Impor ${validRows.length} Guru`}</button>
        </footer>
      </section>
    </div>
  );
}

const styles = {

    templateActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  templateButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #bfdbfe",
    borderRadius: 8,
    padding: "9px 13px",
    background: "#eff6ff",
    color: "#1d4ed8",
    cursor: "pointer",
    fontWeight: 600,
  },

  backdrop: { position: "fixed", inset: 0, zIndex: 1500, background: "rgba(15,23,42,.55)", display: "grid", placeItems: "center", padding: 16 },
  modal: { width: "min(900px, 100%)", maxHeight: "90vh", overflow: "auto", background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,.25)", color: "#243247" },
  header: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 16 },
  sub: { color: "#64748b", fontSize: 13, margin: "6px 0 0" },
  close: { border: 0, background: "transparent", cursor: "pointer", padding: 5 },
  instructions: { background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 9, padding: 13, fontSize: 13, marginBottom: 14 },
  upload: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "1px dashed #93c5fd", borderRadius: 10, padding: 18, cursor: "pointer", color: "#1d4ed8", fontWeight: 650, marginBottom: 14 },
  error: { display: "flex", gap: 8, alignItems: "center", color: "#b91c1c", background: "#fef2f2", padding: 11, borderRadius: 8, marginBottom: 12, fontSize: 13 },
  summary: { display: "flex", flexWrap: "wrap", gap: 18, fontSize: 13, padding: "10px 0" },
  tableWrap: { maxHeight: 340, overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 8 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 },
  secondary: { border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 16px", background: "#fff", cursor: "pointer" },
  primary: { display: "inline-flex", alignItems: "center", gap: 8, border: 0, borderRadius: 8, padding: "10px 16px", background: "#2878c8", color: "#fff", cursor: "pointer", fontWeight: 650 },
};
