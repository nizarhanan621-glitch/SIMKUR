
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  CalendarDays,
  Users,
  CheckCircle2,
  Clock3,
  Target,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle,
  FileText,
} from "lucide-react";

const STORAGE_KEY = "simkur_program_kerja_kurikulum";
const DEFAULT_YEAR = "2026/2027";

const PROGRAM_FIELDS = [
  "Perencanaan Kurikulum",
  "Pelaksanaan Pembelajaran",
  "Evaluasi Pembelajaran",
  "Pengembangan Guru",
  "Administrasi Kurikulum",
  "Kegiatan Akademik Sekolah",
];

const STATUSES = ["Direncanakan", "Berjalan", "Selesai", "Ditunda"];

const styles = `
.pk-page{display:flex;flex-direction:column;gap:18px;color:#26384d}
.pk-header,.pk-panel-head,.pk-modal-head,.pk-toolbar,.pk-modal-foot{display:flex;align-items:center;justify-content:space-between;gap:12px}
.pk-header h2{margin:5px 0;color:#173b68;font-size:26px}.pk-header p,.pk-panel-head p,.pk-modal-head p{margin:5px 0 0;color:#718096;font-size:13px;line-height:1.5}
.pk-eyebrow{color:#3977b5;font-size:10px;font-weight:800;letter-spacing:1.1px}
.pk-header-icon,.pk-stat-icon{display:grid;place-items:center;flex-shrink:0;border-radius:12px;background:#eaf2ff;color:#2c69a8}
.pk-header-icon{width:52px;height:52px}
.pk-filter,.pk-stats,.pk-panel{border:1px solid #e2e8f0;border-radius:12px;background:#fff;box-shadow:0 3px 12px rgba(25,48,75,.035)}
.pk-filter{display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:12px;padding:15px}
.pk-filter label,.pk-form-grid label{display:flex;flex-direction:column;gap:6px;color:#52657b;font-size:12px;font-weight:700}
.pk-filter select,.pk-filter input,.pk-form-grid input,.pk-form-grid select,.pk-form-grid textarea{width:100%;min-width:0;padding:10px 11px;border:1px solid #dce4ed;border-radius:8px;background:#fff;color:#26384d;font:inherit;font-size:12px;outline:none}
.pk-filter select:focus,.pk-filter input:focus,.pk-form-grid input:focus,.pk-form-grid select:focus,.pk-form-grid textarea:focus{border-color:#4386cc;box-shadow:0 0 0 3px rgba(67,134,204,.1)}
.pk-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));overflow:hidden}
.pk-stat{display:flex;align-items:center;gap:11px;padding:16px;border-right:1px solid #edf1f5}.pk-stat:last-child{border:0}
.pk-stat-icon{width:39px;height:39px}.pk-stat-icon.green{background:#e8f7ef;color:#278657}.pk-stat-icon.orange{background:#fff3e6;color:#c47727}.pk-stat-icon.purple{background:#f1edff;color:#7959bb}
.pk-stat span{display:block;color:#718096;font-size:11px}.pk-stat strong{display:block;margin-top:4px;color:#1c3553;font-size:22px}
.pk-panel{padding:17px}.pk-panel-head{margin-bottom:14px}.pk-panel-head h3{margin:0;color:#1d3d62;font-size:16px}
.pk-primary,.pk-secondary,.pk-action,.pk-danger{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 12px;border:0;border-radius:7px;cursor:pointer;font-size:11px;font-weight:750}
.pk-primary{background:#245b94;color:white}.pk-primary:hover{background:#194777}.pk-secondary{border:1px solid #dce4ed;background:white;color:#52657b}.pk-action{background:#eaf2ff;color:#245b94}.pk-danger{background:#fff0ef;color:#ae4942}
.pk-toolbar{margin-bottom:12px}.pk-search{display:flex;align-items:center;gap:8px;width:min(100%,360px);padding:0 10px;border:1px solid #dce4ed;border-radius:8px;color:#7c8ca0}.pk-search input{width:100%;padding:9px 0;border:0;outline:none;font-size:12px}
.pk-table-wrap{width:100%;overflow-x:auto}.pk-table{width:100%;border-collapse:collapse;white-space:nowrap;font-size:12px}.pk-table th{padding:11px;background:#f5f8fc;color:#52657b;text-align:left;font-size:10px}.pk-table td{padding:11px;border-bottom:1px solid #edf1f5;color:#52657b;vertical-align:middle}.pk-table td strong{color:#263e5b}
.pk-status{display:inline-flex;padding:5px 8px;border-radius:20px;background:#edf2f7;color:#5d6c7e;font-size:10px;font-weight:800}.pk-status.running{background:#eaf2ff;color:#2863a5}.pk-status.done{background:#e8f7ef;color:#278657}.pk-status.delayed{background:#fff0ef;color:#ae4942}
.pk-progress{display:flex;align-items:center;gap:8px;min-width:105px}.pk-progress-track{width:72px;height:7px;overflow:hidden;border-radius:20px;background:#e9eef4}.pk-progress-fill{height:100%;border-radius:20px;background:#4386cc}.pk-progress span{font-size:10px;color:#65778b}
.pk-row-actions{display:flex;align-items:center;gap:6px}.pk-icon-button{display:grid;width:30px;height:30px;place-items:center;border:1px solid #e1e8f0;border-radius:7px;background:#fff;color:#61758c;cursor:pointer}.pk-icon-button:hover{background:#f3f7fb}
.pk-empty{padding:34px 12px!important;text-align:center;color:#8392a4!important}.pk-empty svg,.pk-empty strong,.pk-empty span{display:block;margin:5px auto}.pk-empty span{white-space:normal}
.pk-footer{margin-top:11px;color:#8391a2;font-size:11px}.pk-modal-backdrop{position:fixed;z-index:1100;inset:0;display:grid;place-items:center;padding:16px;background:rgba(18,33,52,.52)}.pk-modal{width:min(100%,720px);max-height:90vh;overflow:auto;border-radius:13px;background:#fff;box-shadow:0 18px 55px rgba(0,0,0,.2)}
.pk-modal-head{padding:17px 19px;border-bottom:1px solid #edf1f5}.pk-modal-head h3{margin:0;color:#1d3d62;font-size:17px}.pk-icon-close{display:grid;width:34px;height:34px;place-items:center;border:1px solid #e0e7ef;border-radius:8px;background:#fff;color:#64748b;cursor:pointer}
.pk-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;padding:18px}.pk-full{grid-column:1/-1}.pk-form-grid textarea{resize:vertical;min-height:78px}.pk-hint{margin:0 18px 14px;padding:10px 12px;border-radius:8px;background:#f4f8fc;color:#5f7185;font-size:11px;line-height:1.5}.pk-modal-foot{justify-content:flex-end;padding:13px 18px;border-top:1px solid #edf1f5}
.pk-alert{display:flex;align-items:flex-start;gap:9px;padding:11px 13px;border:1px solid #f0d5a5;border-radius:9px;background:#fffaf0;color:#95651a;font-size:12px;line-height:1.5}
.pk-access-denied{padding:42px 20px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;color:#65778b;text-align:center}.pk-access-denied strong{display:block;margin:8px 0;color:#263e5b}
@media(max-width:850px){.pk-filter{grid-template-columns:repeat(2,minmax(0,1fr))}.pk-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.pk-stat:nth-child(2){border-right:0}.pk-stat:nth-child(-n+2){border-bottom:1px solid #edf1f5}}
@media(max-width:560px){.pk-filter,.pk-stats,.pk-form-grid{grid-template-columns:1fr}.pk-stat{border-right:0;border-bottom:1px solid #edf1f5}.pk-stat:last-child{border-bottom:0}.pk-full{grid-column:auto}.pk-header{align-items:flex-start}.pk-panel-head{align-items:flex-start;flex-direction:column}.pk-toolbar{align-items:stretch;flex-direction:column}.pk-search{width:100%}}
`;

function readPrograms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gagal membaca Program Kerja Kurikulum:", error);
    return [];
  }
}

function makeId() {
  return `PKK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const initialForm = {
  namaProgram: "",
  bidang: PROGRAM_FIELDS[0],
  tahunAjaran: DEFAULT_YEAR,
  semester: "Ganjil",
  tanggalMulai: todayKey(),
  tanggalSelesai: todayKey(),
  sasaran: "",
  penanggungJawab: "Wakasek Kurikulum",
  indikator: "",
  status: "Direncanakan",
  progres: "0",
  realisasi: "",
  kendala: "",
  tindakLanjut: "",
};

function statusClass(status) {
  if (status === "Selesai") return "done";
  if (status === "Berjalan") return "running";
  if (status === "Ditunda") return "delayed";
  return "";
}

export default function ProgramKerjaPage({ role = "wakasek" }) {
  const [programs, setPrograms] = useState(readPrograms);
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR);
  const [selectedSemester, setSelectedSemester] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const refresh = () => setPrograms(readPrograms());

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("simkur-program-kerja-updated", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("simkur-program-kerja-updated", refresh);
    };
  }, []);

  const years = useMemo(() => {
    const values = programs.map((item) => item.tahunAjaran).filter(Boolean);
    return [...new Set([DEFAULT_YEAR, ...values])].sort((a, b) => b.localeCompare(a));
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return programs
      .filter((item) => {
        if (item.tahunAjaran !== selectedYear) return false;
        if (selectedSemester !== "Semua" && item.semester !== selectedSemester) return false;
        if (selectedStatus !== "Semua" && item.status !== selectedStatus) return false;
        if (!keyword) return true;

        return [
          item.namaProgram,
          item.bidang,
          item.sasaran,
          item.penanggungJawab,
        ].some((value) =>
          String(value || "").toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) =>
        String(a.tanggalMulai).localeCompare(String(b.tanggalMulai))
      );
  }, [programs, selectedYear, selectedSemester, selectedStatus, search]);

  const summary = useMemo(
    () => ({
      total: filteredPrograms.length,
      planned: filteredPrograms.filter((item) => item.status === "Direncanakan").length,
      running: filteredPrograms.filter((item) => item.status === "Berjalan").length,
      completed: filteredPrograms.filter((item) => item.status === "Selesai").length,
    }),
    [filteredPrograms]
  );

  const averageProgress = filteredPrograms.length
    ? Math.round(
        filteredPrograms.reduce(
          (sum, item) => sum + (Number(item.progres) || 0),
          0
        ) / filteredPrograms.length
      )
    : 0;

  function openAdd() {
    setEditingId(null);
    setForm({
      ...initialForm,
      tahunAjaran: selectedYear,
      semester:
        selectedSemester === "Semua" ? "Ganjil" : selectedSemester,
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      ...initialForm,
      ...item,
      progres: String(item.progres ?? 0),
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormError("");
  }

  function saveProgram(event) {
    event.preventDefault();

    const name = form.namaProgram.trim();
    const progress = Number(form.progres);

    if (!name) {
      setFormError("Nama program kerja wajib diisi.");
      return;
    }

    if (!form.tanggalMulai || !form.tanggalSelesai) {
      setFormError("Tanggal mulai dan tanggal selesai wajib diisi.");
      return;
    }

    if (form.tanggalSelesai < form.tanggalMulai) {
      setFormError(
        "Tanggal selesai tidak boleh lebih awal dari tanggal mulai."
      );
      return;
    }

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setFormError("Progres harus berada pada rentang 0 sampai 100 persen.");
      return;
    }

    const now = new Date().toISOString();

    const record = {
      ...form,
      id: editingId || makeId(),
      namaProgram: name,
      progres: form.status === "Selesai" ? 100 : Math.round(progress),
      createdAt: editingId
        ? programs.find(
            (item) => String(item.id) === String(editingId)
          )?.createdAt || now
        : now,
      updatedAt: now,
    };

    const next = editingId
      ? programs.map((item) =>
          String(item.id) === String(editingId) ? record : item
        )
      : [record, ...programs];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setPrograms(next);
      window.dispatchEvent(new Event("simkur-program-kerja-updated"));
      closeModal();
    } catch (error) {
      console.error("Gagal menyimpan Program Kerja:", error);
      setFormError(
        "Program gagal disimpan. Periksa kapasitas penyimpanan browser."
      );
    }
  }

  function deleteProgram(item) {
    const confirmed = window.confirm(
      `Hapus program kerja "${item.namaProgram}"? Data yang dihapus tidak dapat dikembalikan.`
    );

    if (!confirmed) return;

    const next = programs.filter(
      (program) => String(program.id) !== String(item.id)
    );

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setPrograms(next);
      window.dispatchEvent(new Event("simkur-program-kerja-updated"));
    } catch (error) {
      console.error("Gagal menghapus Program Kerja:", error);
      window.alert("Program gagal dihapus.");
    }
  }

  if (role !== "wakasek") {
    return (
      <div className="pk-page">
        <style>{styles}</style>
        <div className="pk-access-denied">
          <AlertTriangle size={30} />
          <strong>Akses terbatas</strong>
          Program Kerja Kurikulum dikelola oleh Wakasek Kurikulum.
        </div>
      </div>
    );
  }

  return (
    <div className="pk-page">
      <style>{styles}</style>

      <header className="pk-header">
        <div>
          <span className="pk-eyebrow">MONITORING &amp; EVALUASI</span>
          <h2>Program Kerja Kurikulum</h2>
          <p>
            Rencanakan, catat, dan pantau pelaksanaan program kerja bidang
            kurikulum.
          </p>
        </div>
        <div className="pk-header-icon">
          <ClipboardList size={25} />
        </div>
      </header>

      <section className="pk-filter">
        <label>
          Tahun Ajaran
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label>
          Semester
          <select
            value={selectedSemester}
            onChange={(event) => setSelectedSemester(event.target.value)}
          >
            <option value="Semua">Semua Semester</option>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </label>

        <label>
          Status Program
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            <option value="Semua">Semua Status</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="pk-stats">
        <article className="pk-stat">
          <div className="pk-stat-icon">
            <ClipboardList size={20} />
          </div>
          <div>
            <span>Total Program</span>
            <strong>{summary.total}</strong>
          </div>
        </article>

        <article className="pk-stat">
          <div className="pk-stat-icon orange">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Direncanakan</span>
            <strong>{summary.planned}</strong>
          </div>
        </article>

        <article className="pk-stat">
          <div className="pk-stat-icon purple">
            <Target size={20} />
          </div>
          <div>
            <span>Sedang Berjalan</span>
            <strong>{summary.running}</strong>
          </div>
        </article>

        <article className="pk-stat">
          <div className="pk-stat-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Selesai</span>
            <strong>{summary.completed}</strong>
          </div>
        </article>
      </section>

      <section className="pk-panel">
        <div className="pk-panel-head">
          <div>
            <h3>Daftar Program Kerja</h3>
            <p>
              Rekap kegiatan kurikulum berdasarkan tahun ajaran dan semester
              terpilih.
            </p>
          </div>

          <button type="button" className="pk-primary" onClick={openAdd}>
            <Plus size={16} />
            Tambah Program
          </button>
        </div>

        <div className="pk-toolbar">
          <div className="pk-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama program, bidang, sasaran..."
            />
          </div>
        </div>

        <div className="pk-table-wrap">
          <table className="pk-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Program / Bidang</th>
                <th>Waktu Pelaksanaan</th>
                <th>Sasaran</th>
                <th>Penanggung Jawab</th>
                <th>Status</th>
                <th>Progres</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan="8" className="pk-empty">
                    <ClipboardList size={32} />
                    <strong>Belum ada program kerja</strong>
                    <span>
                      Tambahkan program kerja kurikulum untuk tahun ajaran dan
                      semester yang dipilih.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{item.namaProgram}</strong>
                      <div
                        style={{
                          marginTop: 4,
                          color: "#8493a5",
                          fontSize: 10,
                        }}
                      >
                        {item.bidang} · Semester {item.semester}
                      </div>
                    </td>
                    <td>
                      {formatDate(item.tanggalMulai)} –{" "}
                      {formatDate(item.tanggalSelesai)}
                    </td>
                    <td>{item.sasaran || "-"}</td>
                    <td>{item.penanggungJawab || "-"}</td>
                    <td>
                      <span
                        className={`pk-status ${statusClass(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="pk-progress">
                        <div className="pk-progress-track">
                          <div
                            className="pk-progress-fill"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, Number(item.progres) || 0)
                              )}%`,
                            }}
                          />
                        </div>
                        <span>{Number(item.progres) || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="pk-row-actions">
                        <button
                          type="button"
                          className="pk-icon-button"
                          title="Edit program"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="pk-icon-button"
                          title="Hapus program"
                          onClick={() => deleteProgram(item)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pk-footer">
          Menampilkan {filteredPrograms.length} program · Rata-rata progres{" "}
          {averageProgress}%
        </div>
      </section>

      {modalOpen && (
        <div
          className="pk-modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && closeModal()
          }
        >
          <section
            className="pk-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pk-modal-title"
          >
            <div className="pk-modal-head">
              <div>
                <h3 id="pk-modal-title">
                  {editingId ? "Edit Program Kerja" : "Tambah Program Kerja"}
                </h3>
                <p>Lengkapi rencana dan indikator pelaksanaan program.</p>
              </div>
              <button
                type="button"
                className="pk-icon-close"
                onClick={closeModal}
                aria-label="Tutup"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveProgram}>
              <div className="pk-form-grid">
                <label className="pk-full">
                  Nama Program Kerja *
                  <input
                    required
                    value={form.namaProgram}
                    onChange={(event) =>
                      setForm({ ...form, namaProgram: event.target.value })
                    }
                    placeholder="Contoh: Evaluasi Pelaksanaan Pembelajaran Semester Ganjil"
                  />
                </label>

                <label>
                  Bidang Program *
                  <select
                    value={form.bidang}
                    onChange={(event) =>
                      setForm({ ...form, bidang: event.target.value })
                    }
                  >
                    {PROGRAM_FIELDS.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Tahun Ajaran *
                  <input
                    required
                    value={form.tahunAjaran}
                    onChange={(event) =>
                      setForm({ ...form, tahunAjaran: event.target.value })
                    }
                    placeholder="2026/2027"
                  />
                </label>

                <label>
                  Semester *
                  <select
                    value={form.semester}
                    onChange={(event) =>
                      setForm({ ...form, semester: event.target.value })
                    }
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </label>

                <label>
                  Penanggung Jawab *
                  <input
                    required
                    value={form.penanggungJawab}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        penanggungJawab: event.target.value,
                      })
                    }
                    placeholder="Nama penanggung jawab"
                  />
                </label>

                <label>
                  Tanggal Mulai *
                  <input
                    type="date"
                    required
                    value={form.tanggalMulai}
                    onChange={(event) =>
                      setForm({ ...form, tanggalMulai: event.target.value })
                    }
                  />
                </label>

                <label>
                  Tanggal Selesai *
                  <input
                    type="date"
                    required
                    value={form.tanggalSelesai}
                    onChange={(event) =>
                      setForm({ ...form, tanggalSelesai: event.target.value })
                    }
                  />
                </label>

                <label>
                  Status Pelaksanaan
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value,
                        progres:
                          event.target.value === "Selesai"
                            ? "100"
                            : form.progres,
                      })
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Progres (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progres}
                    onChange={(event) =>
                      setForm({ ...form, progres: event.target.value })
                    }
                  />
                </label>

                <label className="pk-full">
                  Sasaran Program
                  <input
                    value={form.sasaran}
                    onChange={(event) =>
                      setForm({ ...form, sasaran: event.target.value })
                    }
                    placeholder="Contoh: Seluruh guru mata pelajaran kelas VII–IX"
                  />
                </label>

                <label className="pk-full">
                  Indikator Keberhasilan
                  <textarea
                    rows="2"
                    value={form.indikator}
                    onChange={(event) =>
                      setForm({ ...form, indikator: event.target.value })
                    }
                    placeholder="Hasil atau ukuran keberhasilan yang ingin dicapai"
                  />
                </label>

                <label className="pk-full">
                  Realisasi / Hasil Pelaksanaan
                  <textarea
                    rows="2"
                    value={form.realisasi}
                    onChange={(event) =>
                      setForm({ ...form, realisasi: event.target.value })
                    }
                    placeholder="Catat hasil pelaksanaan program"
                  />
                </label>

                <label>
                  Kendala
                  <textarea
                    rows="2"
                    value={form.kendala}
                    onChange={(event) =>
                      setForm({ ...form, kendala: event.target.value })
                    }
                    placeholder="Kendala yang ditemukan"
                  />
                </label>

                <label>
                  Tindak Lanjut
                  <textarea
                    rows="2"
                    value={form.tindakLanjut}
                    onChange={(event) =>
                      setForm({ ...form, tindakLanjut: event.target.value })
                    }
                    placeholder="Langkah tindak lanjut"
                  />
                </label>
              </div>

              {formError && (
                <div
                  style={{
                    margin: "0 18px 14px",
                    color: "#ae4942",
                    fontSize: 12,
                  }}
                >
                  {formError}
                </div>
              )}

              <div className="pk-modal-foot">
                <button
                  type="button"
                  className="pk-secondary"
                  onClick={closeModal}
                >
                  Batal
                </button>
                <button type="submit" className="pk-primary">
                  <Save size={15} />
                  Simpan Program
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          color: "#8391a2",
          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
        <FileText size={14} />
        <span>
          Program kerja tersimpan pada browser ini menggunakan localStorage.
          Sinkronisasi database dan akses multi-perangkat belum diaktifkan.
        </span>
      </div>
    </div>
  );
}
