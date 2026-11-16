import { useEffect, useMemo, useState } from "react";
import {
  FileChartColumn,
  Users,
  GraduationCap,
  School,
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Search,
} from "lucide-react";
import { getDataSekolah } from "../utils/dataSekolahStorage";

const KEY = {
  teachers: "simkur_data_guru",
  students: "simkur_data_siswa",
  rombels: "simkur_data_rombel",
  placements: "simkur_penempatan_siswa",
  subjects: "simkur_data_mata_pelajaran",
  assignments: "simkur_data_tugas_mengajar",
  schedules: "simkur_data_jadwal_pelajaran",
  journals: "simkur_data_jurnal_mengajar",
  programs: "simkur_program_kerja_kurikulum",
};

const DEFAULT_YEAR = "2026/2027";

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error(`Gagal membaca ${key}:`, error);
    return [];
  }
}

function readAllData() {
  return Object.fromEntries(
    Object.entries(KEY).map(([name, key]) => [
      name,
      readArray(key),
    ])
  );
}

function todayKey() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function firstDayOfMonth() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-01`;
}

function formatDate(value) {
  if (!value) return "-";

  const [year, month, day] = String(value)
    .slice(0, 10)
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getName(item, fields) {
  for (const field of fields) {
    if (item?.[field]) return item[field];
  }

  return "Tidak diketahui";
}

function isActive(item) {
  return Boolean(item) && item.status !== "Nonaktif";
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

const pageStyles = `
.lr-page{display:flex;flex-direction:column;gap:18px;color:#26384d}
.lr-header,.lr-section-head,.lr-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px}
.lr-eyebrow{color:#3977b5;font-size:10px;font-weight:800;letter-spacing:1.1px}
.lr-header h2{margin:5px 0;color:#173b68;font-size:26px}
.lr-header p,.lr-section-head p{margin:5px 0 0;color:#718096;font-size:13px;line-height:1.5}
.lr-header-icon{width:52px;height:52px;display:grid;place-items:center;border-radius:13px;background:#eaf2ff;color:#2c69a8;flex-shrink:0}
.lr-panel,.lr-filter,.lr-stat-grid{border:1px solid #e2e8f0;border-radius:12px;background:#fff;box-shadow:0 3px 12px rgba(25,48,75,.035)}
.lr-filter{display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:12px;padding:15px}
.lr-filter label{display:flex;flex-direction:column;gap:6px;color:#52657b;font-size:12px;font-weight:700}
.lr-filter input,.lr-filter select{width:100%;min-width:0;padding:10px;border:1px solid #dce4ed;border-radius:8px;background:#fff;color:#26384d;font:inherit;font-size:12px;outline:none}
.lr-filter input:focus,.lr-filter select:focus{border-color:#4386cc;box-shadow:0 0 0 3px rgba(67,134,204,.1)}
.lr-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));overflow:hidden}
.lr-stat{display:flex;align-items:center;gap:11px;padding:16px;border-right:1px solid #edf1f5}
.lr-stat:last-child{border-right:0}
.lr-stat-icon{width:39px;height:39px;display:grid;place-items:center;flex-shrink:0;border-radius:11px;background:#eaf2ff;color:#3476bd}
.lr-stat-icon.green{background:#e8f7ef;color:#278657}
.lr-stat-icon.orange{background:#fff3e6;color:#c47727}
.lr-stat-icon.purple{background:#f1edff;color:#7959bb}
.lr-stat span{display:block;color:#718096;font-size:11px}
.lr-stat strong{display:block;margin-top:4px;color:#1c3553;font-size:22px}
.lr-panel{padding:17px}
.lr-section-head{margin-bottom:13px}
.lr-section-head h3{margin:0;color:#1d3d62;font-size:16px}
.lr-subtle{color:#8391a2;font-size:11px}
.lr-print{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 13px;border:0;border-radius:8px;background:#245b94;color:#fff;cursor:pointer;font-size:11px;font-weight:750}
.lr-print:hover{background:#194777}
.lr-search{display:flex;align-items:center;gap:9px;width:min(100%,380px);padding:0 11px;border:1px solid #dce4ed;border-radius:8px;background:#fff;color:#7c8ca0;transition:border-color .2s,box-shadow .2s}
.lr-search:focus-within{border-color:#4386cc;box-shadow:0 0 0 3px rgba(67,134,204,.1)}
.lr-search input{flex:1;min-width:0;width:100%;padding:10px 0;border:0;outline:none;background:transparent;color:#26384d;font-size:12px}
.lr-search input::placeholder{color:#9aa8b7}
.lr-table-wrap{width:100%;overflow-x:auto}
.lr-table{width:100%;border-collapse:collapse;white-space:nowrap;font-size:12px}
.lr-table th{padding:11px;background:#f5f8fc;color:#52657b;text-align:left;font-size:10px}
.lr-table td{padding:11px;border-bottom:1px solid #edf1f5;color:#52657b;vertical-align:middle}
.lr-table td strong{color:#263e5b}
.lr-empty{padding:24px 12px!important;text-align:center;color:#8392a4!important;white-space:normal}
.lr-empty svg,.lr-empty strong,.lr-empty span{display:block;margin:5px auto}
.lr-empty strong{color:#52657b}
.lr-status-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.lr-status-card{padding:14px;border:1px solid #e8edf3;border-radius:9px;background:#fbfcfe}
.lr-status-card span{display:block;color:#718096;font-size:11px}
.lr-status-card strong{display:block;margin-top:5px;color:#1d3d62;font-size:21px}
.lr-progress{height:9px;overflow:hidden;border-radius:30px;background:#e9eef4}
.lr-progress>span{display:block;height:100%;border-radius:30px;background:#4386cc}
.lr-progress-label{display:flex;justify-content:space-between;gap:10px;margin-top:7px;color:#75869a;font-size:11px}
.lr-note{display:flex;align-items:flex-start;gap:9px;padding:11px 13px;border:1px solid #d7e7f7;border-radius:9px;background:#f2f8ff;color:#386b9d;font-size:11px;line-height:1.5}
.lr-access{padding:42px 20px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;color:#65778b;text-align:center}
.lr-access strong{display:block;margin:8px 0;color:#263e5b}
.lr-print-header,.lr-print-signature{display:none}

@media(max-width:850px){
  .lr-filter{grid-template-columns:repeat(2,minmax(0,1fr))}
  .lr-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .lr-stat:nth-child(2){border-right:0}
  .lr-stat:nth-child(-n+2){border-bottom:1px solid #edf1f5}
}
@media(max-width:560px){
  .lr-filter,.lr-stat-grid,.lr-status-row{grid-template-columns:1fr}
  .lr-stat{border-right:0;border-bottom:1px solid #edf1f5}
  .lr-stat:last-child{border-bottom:0}
  .lr-header{align-items:flex-start}
  .lr-section-head,.lr-toolbar{align-items:flex-start;flex-direction:column}
}

@media print {
  @page {
    size: A4 portrait;
    margin: 15mm 13mm 18mm;
  }

  html,body {
    width:100% !important;
    min-width:0 !important;
    margin:0 !important;
    padding:0 !important;
    background:#fff !important;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }

  .sidebar,
  .topbar,
  .app-footer,
  .mobile-backdrop,
  .lr-filter,
  .lr-print,
  .lr-no-print,
  .lr-header {
    display:none !important;
  }

  .app-shell,
  .app-frame,
  .app-main,
  .page-content {
    display:block !important;
    width:100% !important;
    max-width:none !important;
    min-height:0 !important;
    margin:0 !important;
    padding:0 !important;
    border:0 !important;
    box-shadow:none !important;
    background:#fff !important;
  }

  .lr-page {
    display:flex !important;
    flex-direction:column;
    gap:10px;
    width:100% !important;
    margin:0 !important;
    padding:0 !important;
    color:#111 !important;
  }

  .lr-print-header {
    display:block !important;
    text-align:center;
    margin-bottom:12px;
    color:#111;
  }

  .lr-school-identity h1 {
    margin:0 0 5px;
    font-size:18px;
    text-transform:uppercase;
  }

  .lr-school-identity p,
  .lr-print-header p {
    margin:3px 0;
    font-size:9px;
  }

  .lr-print-divider {
    border-top:3px double #111;
    margin:10px 0;
  }

  .lr-print-header h2 {
    margin:8px 0 4px;
    font-size:14px;
  }

  .lr-panel,
  .lr-stat-grid {
    box-shadow:none !important;
    border-color:#aaa !important;
  }

  .lr-panel {
    padding:10px;
    break-inside:auto;
    page-break-inside:auto;
  }

  .lr-stat-grid,
  .lr-status-card {
    break-inside:avoid;
    page-break-inside:avoid;
  }

  .lr-stat {
    padding:10px;
  }

  .lr-stat strong,
  .lr-status-card strong {
    color:#111 !important;
  }

  .lr-section-head h3 {
    color:#111 !important;
  }

  .lr-section-head p,
  .lr-subtle,
  .lr-progress-label,
  .lr-stat span,
  .lr-status-card span {
    color:#333 !important;
  }

  .lr-table-wrap {
    overflow:visible !important;
  }

  .lr-table {
    width:100%;
    white-space:normal;
    font-size:8px;
  }

  .lr-table th,
  .lr-table td {
    padding:5px;
    color:#111;
    border-color:#bbb;
  }

  .lr-table th {
    background:#eee !important;
  }

  .lr-progress {
    border:1px solid #bbb;
    background:#eee !important;
  }

  .lr-progress>span {
    background:#777 !important;
  }

  .lr-print-signature {
    display:flex !important;
    justify-content:flex-end;
    margin-top:30px;
    break-inside:avoid;
    page-break-inside:avoid;
    color:#111;
    font-size:10px;
  }

  .lr-print-signature > div {
    width:230px;
    text-align:center;
  }

  .lr-print-signature p {
    margin:4px 0;
  }

  .lr-signature-space {
    height:65px;
  }

  .lr-print-signature strong {
    display:block;
    text-decoration:underline;
  }
}
`;

export default function LaporanPage({ role = "wakasek" }) {
  const [data, setData] = useState(readAllData);
  const [school, setSchool] = useState(getDataSekolah);

  useEffect(() => {
    const refreshSchool = () => setSchool(getDataSekolah());

    window.addEventListener("simkur-data-sekolah-updated", refreshSchool);

    return () => {
      window.removeEventListener("simkur-data-sekolah-updated", refreshSchool);
    };
  }, []);

  const [selectedYear, setSelectedYear] = useState(() => {
    const activeRombel = readArray(KEY.rombels).find(isActive);
    return activeRombel?.tahunAjaran || DEFAULT_YEAR;
  });

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayKey);
  const [journalSearch, setJournalSearch] = useState("");

  useEffect(() => {
    const refresh = () => setData(readAllData());

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("simkur-calendar-updated", refresh);
    window.addEventListener("simkur-program-kerja-updated", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("simkur-calendar-updated", refresh);
      window.removeEventListener("simkur-program-kerja-updated", refresh);
    };
  }, []);

  const yearOptions = useMemo(() => {
    const years = data.rombels
      .map((item) => item.tahunAjaran)
      .filter(Boolean);

    data.programs.forEach((item) => {
      if (item.tahunAjaran) years.push(item.tahunAjaran);
    });

    return [...new Set([DEFAULT_YEAR, ...years])].sort(
      (a, b) => b.localeCompare(a)
    );
  }, [data.rombels, data.programs]);

  const activeTeachers = data.teachers.filter(isActive);
  const activeStudents = data.students.filter(isActive);

  const activeRombels = data.rombels.filter(
    (item) =>
      isActive(item) && item.tahunAjaran === selectedYear
  );

  const activeRombelIds = new Set(
    activeRombels.map((item) => String(item.id))
  );

  const activeStudentIds = new Set(
    activeStudents.map((item) => String(item.id))
  );

  const placements = data.placements.filter(
    (item) =>
      item.tahunAjaran === selectedYear &&
      activeRombelIds.has(String(item.rombelId)) &&
      activeStudentIds.has(String(item.siswaId))
  );

  const placedStudentIds = new Set(
    placements.map((item) => String(item.siswaId))
  );

  const unplacedStudents = activeStudents.filter(
    (student) =>
      !placedStudentIds.has(String(student.id))
  );

  const activeAssignments = data.assignments.filter(
    (assignment) => {
      if (!isActive(assignment)) return false;

      const teacher = data.teachers.find(
        (item) => String(item.id) === String(assignment.guruId)
      );

      const rombel = data.rombels.find(
        (item) => String(item.id) === String(assignment.rombelId)
      );

      const subject = data.subjects.find(
        (item) => String(item.id) === String(assignment.mapelId)
      );

      return (
        isActive(teacher) &&
        isActive(rombel) &&
        isActive(subject) &&
        rombel.tahunAjaran === selectedYear
      );
    }
  );

  const activeAssignmentIds = new Set(
    activeAssignments.map((item) => String(item.id))
  );

  const activeSchedules = data.schedules.filter(
    (item) =>
      item.status !== "Nonaktif" &&
      activeAssignmentIds.has(String(item.tugasMengajarId))
  );

  const periodJournals = useMemo(() => {
    return data.journals
      .filter((journal) => {
        const date = String(journal.tanggal || "").slice(0, 10);
        return Boolean(
          date && date >= startDate && date <= endDate
        );
      })
      .sort((a, b) =>
        String(b.tanggal).localeCompare(String(a.tanggal))
      );
  }, [data.journals, startDate, endDate]);

  const filteredJournals = useMemo(() => {
    const keyword = journalSearch.trim().toLowerCase();

    return periodJournals.filter((journal) => {
      if (!keyword) return true;

      const teacher = data.teachers.find(
        (item) => String(item.id) === String(journal.guruId)
      );

      const rombel = data.rombels.find(
        (item) => String(item.id) === String(journal.rombelId)
      );

      const subject = data.subjects.find(
        (item) => String(item.id) === String(journal.mapelId)
      );

      return [
        getName(teacher, ["nama", "namaGuru"]),
        getName(rombel, ["namaRombel"]),
        getName(subject, ["nama", "namaMapel"]),
        journal.snapshot?.namaGuru,
        journal.snapshot?.namaRombel,
        journal.snapshot?.namaMapel,
      ].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      );
    });
  }, [
    periodJournals,
    data.teachers,
    data.rombels,
    data.subjects,
    journalSearch,
  ]);

  const journalSummary = useMemo(() => {
    const scheduledJP = periodJournals.reduce(
      (sum, item) =>
        sum + Math.max(0, safeNumber(item.jpTerjadwal)),
      0
    );

    const actualJP = periodJournals.reduce((sum, item) => {
      const scheduled = Math.max(
        0,
        safeNumber(item.jpTerjadwal)
      );

      const actual = Math.max(
        0,
        safeNumber(item.jpTerlaksana)
      );

      return sum + Math.min(scheduled, actual);
    }, 0);

    return {
      count: periodJournals.length,
      scheduledJP,
      actualJP,
      notDoneJP: Math.max(0, scheduledJP - actualJP),
      percentage: scheduledJP
        ? Math.round((actualJP / scheduledJP) * 100)
        : 0,
      done: periodJournals.filter(
        (item) => item.statusPelaksanaan === "Terlaksana"
      ).length,
      partial: periodJournals.filter(
        (item) => item.statusPelaksanaan === "Sebagian"
      ).length,
      missed: periodJournals.filter(
        (item) =>
          item.statusPelaksanaan === "Tidak Terlaksana"
      ).length,
    };
  }, [periodJournals]);

  const programs = data.programs.filter(
    (item) => item.tahunAjaran === selectedYear
  );

  const programSummary = {
    total: programs.length,
    planned: programs.filter(
      (item) => item.status === "Direncanakan"
    ).length,
    running: programs.filter(
      (item) => item.status === "Berjalan"
    ).length,
    completed: programs.filter(
      (item) => item.status === "Selesai"
    ).length,
    delayed: programs.filter(
      (item) => item.status === "Ditunda"
    ).length,
    average: programs.length
      ? Math.round(
          programs.reduce(
            (sum, item) => sum + safeNumber(item.progres),
            0
          ) / programs.length
        )
      : 0,
  };

  const journalsByTeacher = useMemo(() => {
    const groups = new Map();

    periodJournals.forEach((journal) => {
      const teacher = data.teachers.find(
        (item) => String(item.id) === String(journal.guruId)
      );

      const id = String(
        journal.guruId ||
          journal.snapshot?.namaGuru ||
          "tanpa-identitas"
      );

      if (!groups.has(id)) {
        const teacherName = getName(
          teacher,
          ["nama", "namaGuru"]
        );

        groups.set(id, {
          id,
          name:
            teacherName === "Tidak diketahui"
              ? journal.snapshot?.namaGuru || "Guru tidak diketahui"
              : teacherName,
          count: 0,
          scheduledJP: 0,
          actualJP: 0,
        });
      }

      const row = groups.get(id);
      const scheduled = Math.max(
        0,
        safeNumber(journal.jpTerjadwal)
      );

      row.count += 1;
      row.scheduledJP += scheduled;
      row.actualJP += Math.min(
        scheduled,
        Math.max(0, safeNumber(journal.jpTerlaksana))
      );
    });

    return [...groups.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [periodJournals, data.teachers]);

  if (role !== "wakasek" && role !== "kepsek") {
    return (
      <div className="lr-page">
        <style>{pageStyles}</style>
        <style>{`
@media print {
  .lr-page {
    font-family: "Times New Roman", serif !important;
    font-size: 10pt !important;
    color: #000 !important;
    gap: 12px !important;
  }

  .lr-print-header {
    margin-bottom: 16px !important;
  }

  .lr-school-identity h1 {
    font-family: "Times New Roman", serif !important;
    font-size: 16pt !important;
    font-weight: bold !important;
  }

  .lr-print-header h2 {
    font-family: "Times New Roman", serif !important;
    font-size: 13pt !important;
    font-weight: bold !important;
  }

  .lr-print-header p {
    font-size: 9pt !important;
    line-height: 1.35 !important;
  }

  .lr-panel {
    border: 0 !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 0 10px !important;
  }

  .lr-section-head {
    margin-bottom: 7px !important;
    border-bottom: 1px solid #555;
    padding-bottom: 5px;
  }

  .lr-section-head h3 {
    font-family: "Times New Roman", serif !important;
    font-size: 11pt !important;
    font-weight: bold !important;
  }

  .lr-table-wrap {
    width: 100% !important;
    overflow: visible !important;
  }

  .lr-table {
    width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
    white-space: normal !important;
    font-family: "Times New Roman", serif !important;
    font-size: 8pt !important;
  }

  .lr-table thead {
    display: table-header-group !important;
  }

  .lr-table tr {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .lr-table th,
  .lr-table td {
    border: 1px solid #777 !important;
    padding: 5px 4px !important;
    overflow-wrap: anywhere !important;
    vertical-align: top !important;
  }

  .lr-table th {
    background: #eaeaea !important;
    color: #000 !important;
    text-align: center !important;
    font-weight: bold !important;
  }

  .lr-table td {
    color: #000 !important;
  }

  .lr-table td strong {
    color: #000 !important;
  }

  .lr-stat-grid {
    border: 1px solid #777 !important;
    border-radius: 0 !important;
  }

  .lr-stat {
    padding: 8px !important;
  }

  .lr-stat-icon {
    display: none !important;
  }

  .lr-stat strong {
    font-family: "Times New Roman", serif !important;
    font-size: 14pt !important;
  }

  .lr-status-card {
    border: 1px solid #aaa !important;
    border-radius: 0 !important;
    background: #fff !important;
  }

  .lr-progress {
    border: 1px solid #777 !important;
  }

  .lr-print-signature {
    margin-top: 25px !important;
  }
}
`}</style>
        <div className="lr-access">
          <AlertTriangle size={30} />
          <strong>Akses laporan tidak tersedia</strong>
          Halaman Laporan hanya dapat diakses oleh Wakasek
          Kurikulum dan Kepala Sekolah.
        </div>
      </div>
    );
  }

  return (
    <div className="lr-page">
      <style>{pageStyles}</style>

      <div className="lr-print-header">
        <div className="lr-school-identity">
          <h1>{school.namaSekolah || "NAMA SEKOLAH"}</h1>
          {(school.alamatJalan ||
            school.kelurahan ||
            school.kecamatan ||
            school.kabupatenKota ||
            school.provinsi ||
            school.kodePos) && (
            <p>
              {[
                school.alamatJalan,
                school.kelurahan,
                school.kecamatan,
                school.kabupatenKota,
                school.provinsi,
                school.kodePos,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {(school.npsn || school.telepon || school.email) && (
            <p>
              {[
                school.npsn ? `NPSN: ${school.npsn}` : "",
                school.telepon ? `Telepon: ${school.telepon}` : "",
                school.email || "",
              ]
                .filter(Boolean)
                .join(" | ")}
            </p>
          )}
        </div>

        <div className="lr-print-divider" />

        <h2>
          {role === "kepsek"
            ? "RINGKASAN LAPORAN SEKOLAH"
            : "LAPORAN KURIKULUM"}
        </h2>

        <p>Tahun Ajaran {selectedYear}</p>
        <p>
          Periode Jurnal: {formatDate(startDate)} s.d.{" "}
          {formatDate(endDate)}
        </p>
      </div>

      <header className="lr-header">
        <div>
          <span className="lr-eyebrow">
            LAPORAN DAN REKAPITULASI
          </span>

          <h2>
            {role === "kepsek"
              ? "Ringkasan Laporan Sekolah"
              : "Laporan Kurikulum"}
          </h2>

          <p>
            {role === "kepsek"
              ? "Ringkasan pelaksanaan kurikulum sebagai bahan pemantauan Kepala Sekolah."
              : "Rekapitulasi data dan pelaksanaan kegiatan kurikulum berdasarkan data yang tersimpan di SIMKUR."}
          </p>
        </div>

        <div className="lr-header-icon">
          <FileChartColumn size={25} />
        </div>
      </header>

      <section className="lr-filter lr-no-print">
        <label>
          Tahun Ajaran
          <select
            value={selectedYear}
            onChange={(event) =>
              setSelectedYear(event.target.value)
            }
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tanggal Jurnal Mulai
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
          />
        </label>

        <label>
          Tanggal Jurnal Sampai
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) =>
              setEndDate(event.target.value)
            }
          />
        </label>
      </section>

      {startDate > endDate && (
        <div className="lr-note lr-no-print">
          <AlertTriangle size={16} />
          Rentang tanggal tidak valid. Tanggal mulai harus sama
          dengan atau lebih awal dari tanggal akhir.
        </div>
      )}

      <div className="lr-toolbar lr-no-print">
        <span className="lr-subtle">
          Tahun ajaran {selectedYear} · Data diperbarui saat
          halaman dibuka atau jendela browser aktif.
        </span>

        <button
          type="button"
          className="lr-print"
          onClick={() => window.print()}
        >
          <Printer size={15} />
          Cetak / Simpan PDF
        </button>
      </div>

      <section className="lr-stat-grid">
        <article className="lr-stat">
          <div className="lr-stat-icon">
            <Users size={20} />
          </div>
          <div>
            <span>Guru Aktif</span>
            <strong>{activeTeachers.length}</strong>
          </div>
        </article>

        <article className="lr-stat">
          <div className="lr-stat-icon green">
            <GraduationCap size={20} />
          </div>
          <div>
            <span>Siswa Aktif</span>
            <strong>{activeStudents.length}</strong>
          </div>
        </article>

        <article className="lr-stat">
          <div className="lr-stat-icon purple">
            <School size={20} />
          </div>
          <div>
            <span>Rombel Aktif</span>
            <strong>{activeRombels.length}</strong>
          </div>
        </article>

        <article className="lr-stat">
          <div className="lr-stat-icon orange">
            <BookOpen size={20} />
          </div>
          <div>
            <span>Siswa Sudah Ditempatkan</span>
            <strong>{placements.length}</strong>
          </div>
        </article>
      </section>

      <section className="lr-panel">
        <div className="lr-section-head">
          <div>
            <h3>Rekap Data Pembelajaran</h3>
            <p>
              Ringkasan penugasan dan jadwal aktif pada tahun
              ajaran terpilih.
            </p>
          </div>
        </div>

        <div className="lr-status-row">
          <div className="lr-status-card">
            <span>Penugasan Mengajar Aktif</span>
            <strong>{activeAssignments.length}</strong>
          </div>

          <div className="lr-status-card">
            <span>Slot Jadwal Aktif</span>
            <strong>{activeSchedules.length}</strong>
          </div>

          <div className="lr-status-card">
            <span>Siswa Belum Ditempatkan</span>
            <strong>{unplacedStudents.length}</strong>
          </div>
        </div>
      </section>

      <section className="lr-panel">
        <div className="lr-section-head">
          <div>
            <h3>Rekap Jurnal dan Pelaksanaan KBM</h3>
            <p>
              Periode {formatDate(startDate)} sampai{" "}
              {formatDate(endDate)}. Perhitungan JP berasal dari
              jurnal yang sudah tersimpan, bukan seluruh JP jadwal
              sekolah.
            </p>
          </div>
        </div>

        <div className="lr-status-row">
          <div className="lr-status-card">
            <span>Jurnal Tersimpan</span>
            <strong>{journalSummary.count}</strong>
          </div>

          <div className="lr-status-card">
            <span>JP Terjadwal pada Jurnal</span>
            <strong>{journalSummary.scheduledJP}</strong>
          </div>

          <div className="lr-status-card">
            <span>JP Terlaksana</span>
            <strong>{journalSummary.actualJP}</strong>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="lr-progress">
            <span
              style={{
                width: `${journalSummary.percentage}%`,
              }}
            />
          </div>

          <div className="lr-progress-label">
            <span>
              Persentase JP terlaksana dari JP yang tercatat
              dalam jurnal
            </span>
            <strong>{journalSummary.percentage}%</strong>
          </div>
        </div>

        <div
          className="lr-status-row"
          style={{ marginTop: 14 }}
        >
          <div className="lr-status-card">
            <span>Terlaksana</span>
            <strong>{journalSummary.done}</strong>
          </div>

          <div className="lr-status-card">
            <span>Sebagian</span>
            <strong>{journalSummary.partial}</strong>
          </div>

          <div className="lr-status-card">
            <span>Tidak Terlaksana</span>
            <strong>{journalSummary.missed}</strong>
          </div>
        </div>
      </section>

      {role === "wakasek" && (
        <section className="lr-panel">
          <div className="lr-section-head">
            <div>
              <h3>Rekap Jurnal per Guru</h3>
              <p>
                Rincian jurnal yang tersimpan pada periode terpilih.
              </p>
            </div>

            <span className="lr-subtle">
              {journalsByTeacher.length} guru tercatat
            </span>
          </div>

          <div className="lr-table-wrap">
            <table className="lr-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nama Guru</th>
                  <th>Jumlah Jurnal</th>
                  <th>JP Terjadwal</th>
                  <th>JP Terlaksana</th>
                  <th>Capaian</th>
                </tr>
              </thead>

              <tbody>
                {journalsByTeacher.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="lr-empty">
                      <ClipboardCheck size={27} />
                      <strong>
                        Belum ada jurnal pada periode ini
                      </strong>
                      <span>
                        Ubah rentang tanggal atau periksa data
                        Jurnal Mengajar.
                      </span>
                    </td>
                  </tr>
                ) : (
                  journalsByTeacher.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.count}</td>
                      <td>{item.scheduledJP}</td>
                      <td>{item.actualJP}</td>
                      <td>
                        {item.scheduledJP
                          ? `${Math.round(
                              (item.actualJP /
                                item.scheduledJP) *
                                100
                            )}%`
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {role === "wakasek" && (
        <section className="lr-panel">
          <div className="lr-section-head">
            <div>
              <h3>Daftar Jurnal Mengajar</h3>
              <p>
                Catatan jurnal yang tercatat pada rentang tanggal
                terpilih.
              </p>
            </div>

            <span className="lr-subtle">
              {filteredJournals.length} catatan
            </span>
          </div>

          <div className="lr-toolbar lr-no-print">
            <div className="lr-search">
              <Search size={15} />
              <input
                value={journalSearch}
                onChange={(event) =>
                  setJournalSearch(event.target.value)
                }
                placeholder="Cari guru, rombel, atau mata pelajaran..."
              />
            </div>
          </div>

          <div className="lr-table-wrap">
            <table className="lr-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Tanggal</th>
                  <th>Guru</th>
                  <th>Rombel</th>
                  <th>Mata Pelajaran</th>
                  <th>JP Terjadwal</th>
                  <th>JP Terlaksana</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="lr-empty">
                      <ClipboardCheck size={27} />
                      <strong>
                        Tidak ada jurnal untuk ditampilkan
                      </strong>
                      <span>
                        Belum ada catatan jurnal pada periode dan
                        pencarian ini.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredJournals.map((journal, index) => {
                    const teacher = data.teachers.find(
                      (item) =>
                        String(item.id) === String(journal.guruId)
                    );

                    const rombel = data.rombels.find(
                      (item) =>
                        String(item.id) === String(journal.rombelId)
                    );

                    const subject = data.subjects.find(
                      (item) =>
                        String(item.id) === String(journal.mapelId)
                    );

                    const teacherName = getName(
                      teacher,
                      ["nama", "namaGuru"]
                    );

                    const rombelName = getName(
                      rombel,
                      ["namaRombel"]
                    );

                    const subjectName = getName(
                      subject,
                      ["nama", "namaMapel"]
                    );

                    return (
                      <tr
                        key={
                          journal.id ||
                          `${journal.tanggal}-${index}`
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{formatDate(journal.tanggal)}</td>
                        <td>
                          {teacherName === "Tidak diketahui"
                            ? journal.snapshot?.namaGuru || "-"
                            : teacherName}
                        </td>
                        <td>
                          {rombelName === "Tidak diketahui"
                            ? journal.snapshot?.namaRombel || "-"
                            : rombelName}
                        </td>
                        <td>
                          {subjectName === "Tidak diketahui"
                            ? journal.snapshot?.namaMapel || "-"
                            : subjectName}
                        </td>
                        <td>{safeNumber(journal.jpTerjadwal)}</td>
                        <td>{safeNumber(journal.jpTerlaksana)}</td>
                        <td>
                          {journal.statusPelaksanaan || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="lr-panel">
        <div className="lr-section-head">
          <div>
            <h3>Rekap Program Kerja Kurikulum</h3>
            <p>
              Program yang tercatat pada tahun ajaran{" "}
              {selectedYear}.
            </p>
          </div>
        </div>

        <div className="lr-status-row">
          <div className="lr-status-card">
            <span>Total Program</span>
            <strong>{programSummary.total}</strong>
          </div>

          <div className="lr-status-card">
            <span>Berjalan</span>
            <strong>{programSummary.running}</strong>
          </div>

          <div className="lr-status-card">
            <span>Selesai</span>
            <strong>{programSummary.completed}</strong>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="lr-progress">
            <span
              style={{
                width: `${programSummary.average}%`,
              }}
            />
          </div>

          <div className="lr-progress-label">
            <span>Rata-rata progres program kerja</span>
            <strong>{programSummary.average}%</strong>
          </div>
        </div>

        {role === "wakasek" && (
          <div
            className="lr-table-wrap"
            style={{ marginTop: 15 }}
          >
            <table className="lr-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nama Program</th>
                  <th>Bidang</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>Progres</th>
                  <th>Realisasi</th>
                </tr>
              </thead>

              <tbody>
                {programs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="lr-empty">
                      <FileChartColumn size={27} />
                      <strong>Belum ada program kerja</strong>
                      <span>
                        Program kerja akan muncul setelah dicatat
                        pada menu Program Kerja.
                      </span>
                    </td>
                  </tr>
                ) : (
                  programs.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item.namaProgram || "-"}</strong>
                      </td>
                      <td>{item.bidang || "-"}</td>
                      <td>{item.semester || "-"}</td>
                      <td>{item.status || "-"}</td>
                      <td>{safeNumber(item.progres)}%</td>
                      <td>{item.realisasi || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {role === "kepsek" && (
        <div className="lr-note lr-no-print">
          <CheckCircle2 size={16} />
          Tampilan Kepala Sekolah berisi ringkasan agregat.
          Rincian jurnal per guru dan detail catatan program
          tersedia pada ruang kerja Wakasek Kurikulum.
        </div>
      )}

      <div className="lr-subtle">
        Laporan disusun dari data yang tersimpan pada SIMKUR.
        Periksa kelengkapan data sumber sebelum mencetak atau
        menyimpan sebagai PDF.
      </div>

      <div className="lr-print-signature">
        <div>
          <p>
            {school.kabupatenKota || school.provinsi || ""},{" "}
            {formatDate(todayKey())}
          </p>
          <p>Kepala Sekolah,</p>
          <div className="lr-signature-space" />
          <strong>
            {school.namaKepalaSekolah ||
              "........................................"}
          </strong>
          <p>
            NIP.{" "}
            {school.nipKepalaSekolah || "................................"}
          </p>
        </div>
      </div>
    </div>
  );
}
