import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  Users,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Eye,
  X,
  Save,
} from "lucide-react";

const KEY = {
  teachers: "simkur_data_guru",
  rombels: "simkur_data_rombel",
  subjects: "simkur_data_mata_pelajaran",
  assignments: "simkur_data_tugas_mengajar",
  schedules: "simkur_data_supervisi",
};

const styles = `
.sv-page{display:flex;flex-direction:column;gap:18px;color:#26384d}
.sv-header,.sv-panel-head,.sv-modal-head,.sv-actions,.sv-toolbar,.sv-modal-foot{display:flex;align-items:center;justify-content:space-between;gap:12px}
.sv-header h2{margin:5px 0;color:#173b68;font-size:26px}.sv-header p,.sv-panel-head p,.sv-modal-head p{margin:5px 0 0;color:#718096;font-size:13px}
.sv-eyebrow{color:#3977b5;font-size:10px;font-weight:800;letter-spacing:1.1px}
.sv-header-icon,.sv-stat-icon{display:grid;place-items:center;flex-shrink:0;border-radius:12px;background:#eaf2ff;color:#2c69a8}
.sv-header-icon{width:52px;height:52px}
.sv-notice{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border:1px solid #ead6a6;border-radius:10px;background:#fffaf0;color:#94671e;font-size:12px}
.sv-notice div{display:flex;flex-direction:column;gap:3px}.sv-notice span{color:#806b49}
.sv-filter,.sv-stats,.sv-panel{border:1px solid #e2e8f0;border-radius:12px;background:#fff;box-shadow:0 3px 12px rgba(25,48,75,.035)}
.sv-filter{display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:12px;padding:15px}
.sv-filter label,.sv-form-grid label{display:flex;flex-direction:column;gap:6px;color:#52657b;font-size:12px;font-weight:700}
.sv-filter select,.sv-form-grid input,.sv-form-grid select,.sv-form-grid textarea{width:100%;min-width:0;padding:10px 11px;border:1px solid #dce4ed;border-radius:8px;background:#fff;color:#26384d;font:inherit;font-size:12px;outline:none}
.sv-filter select:focus,.sv-form-grid input:focus,.sv-form-grid select:focus,.sv-form-grid textarea:focus{border-color:#4386cc;box-shadow:0 0 0 3px rgba(67,134,204,.1)}
.sv-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));overflow:hidden}
.sv-stat{display:flex;align-items:center;gap:11px;padding:16px;border-right:1px solid #edf1f5}.sv-stat:last-child{border:0}
.sv-stat-icon{width:39px;height:39px}.sv-stat-icon.green{background:#e8f7ef;color:#278657}.sv-stat-icon.orange{background:#fff3e6;color:#c47727}.sv-stat-icon.purple{background:#f1edff;color:#7959bb}
.sv-stat span{display:block;color:#718096;font-size:11px}.sv-stat strong{display:block;margin-top:4px;color:#1c3553;font-size:22px}
.sv-panel{padding:17px}.sv-panel-head{margin-bottom:14px}.sv-panel-head h3{margin:0;color:#1d3d62;font-size:16px}
.sv-primary,.sv-secondary,.sv-action,.sv-danger{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 12px;border:0;border-radius:7px;cursor:pointer;font-size:11px;font-weight:750}
.sv-primary{background:#245b94;color:white}.sv-primary:hover{background:#194777}.sv-secondary{border:1px solid #dce4ed;background:white;color:#52657b}.sv-action{background:#eaf2ff;color:#245b94}.sv-danger{background:#fff0ef;color:#ae4942}
.sv-toolbar{margin-bottom:12px}.sv-search{display:flex;align-items:center;gap:8px;width:min(100%,340px);padding:0 10px;border:1px solid #dce4ed;border-radius:8px;color:#7c8ca0}.sv-search input{width:100%;padding:9px 0;border:0;outline:none;font-size:12px}
.sv-table-wrap{width:100%;overflow-x:auto}.sv-table{width:100%;border-collapse:collapse;white-space:nowrap;font-size:12px}.sv-table th{padding:11px;background:#f5f8fc;color:#52657b;text-align:left;font-size:10px}.sv-table td{padding:11px;border-bottom:1px solid #edf1f5;color:#52657b}.sv-table td strong{color:#263e5b}
.sv-status{display:inline-flex;padding:5px 8px;border-radius:20px;background:#edf2f7;color:#5d6c7e;font-size:10px;font-weight:800}.sv-status.wait{background:#fff4dd;color:#95661c}.sv-status.done{background:#e8f7ef;color:#278657}.sv-status.scheduled{background:#eaf2ff;color:#2863a5}
.sv-empty{padding:32px 12px!important;text-align:center;color:#8392a4!important}.sv-empty svg,.sv-empty strong,.sv-empty span{display:block;margin:5px auto}.sv-empty span{white-space:normal}
.sv-footnote{margin-top:11px;color:#8391a2;font-size:11px;line-height:1.5}.sv-row-actions{display:flex;gap:6px;align-items:center}
.sv-modal-backdrop{position:fixed;z-index:1100;inset:0;display:grid;place-items:center;padding:16px;background:rgba(18,33,52,.52)}.sv-modal{width:min(100%,680px);max-height:90vh;overflow:auto;border-radius:13px;background:#fff;box-shadow:0 18px 55px rgba(0,0,0,.2)}
.sv-modal-head{padding:17px 19px;border-bottom:1px solid #edf1f5}.sv-modal-head h3{margin:0;color:#1d3d62;font-size:17px}.sv-icon-button{display:grid;width:34px;height:34px;place-items:center;border:1px solid #e0e7ef;border-radius:8px;background:#fff;color:#64748b;cursor:pointer}
.sv-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;padding:18px}.sv-full{grid-column:1/-1}.sv-form-grid textarea{resize:vertical}.sv-modal-foot{justify-content:flex-end;padding:13px 18px;border-top:1px solid #edf1f5}
.sv-report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:18px}.sv-report-item{display:flex;flex-direction:column;gap:5px}.sv-report-item span{color:#758499;font-size:10px;font-weight:700}.sv-report-item strong{color:#2c415a;font-size:12px}.sv-report-note{grid-column:1/-1;padding:12px;border-radius:8px;background:#f5f8fc;color:#53657a;font-size:12px;line-height:1.6;white-space:pre-wrap}
@media(max-width:850px){.sv-filter{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-stat:nth-child(2){border-right:0}.sv-stat:nth-child(-n+2){border-bottom:1px solid #edf1f5}}
@media(max-width:560px){.sv-filter,.sv-stats,.sv-form-grid,.sv-report-grid{grid-template-columns:1fr}.sv-stat{border-right:0;border-bottom:1px solid #edf1f5}.sv-stat:last-child{border-bottom:0}.sv-full,.sv-report-note{grid-column:auto}.sv-header{align-items:flex-start}.sv-panel-head{align-items:flex-start;flex-direction:column}.sv-toolbar{align-items:stretch;flex-direction:column}.sv-search{width:100%}}
`;

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error(`Gagal membaca ${key}:`, error);
    return [];
  }
}

function makeId() {
  return `SUP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getName(item, fields) {
  for (const field of fields) if (item?.[field]) return item[field];
  return "Data tidak ditemukan";
}

function dateToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function currentYear() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

function isActive(item) {
  return Boolean(item) && item.status !== "Nonaktif";
}

const emptyObservation = {
  perencanaan: "",
  pelaksanaan: "",
  asesmen: "",
  kekuatan: "",
  perbaikan: "",
  umpanBalik: "",
  tindakLanjut: "",
  programBk: "",
  asesmenKebutuhanBk: "",
  layananDasarBk: "",
  layananResponsifBk: "",
  perencanaanIndividualBk: "",
  dukunganSistemBk: "",
  evaluasiBk: "",
  etikaKerahasiaanBk: "",
};

export default function SupervisiPage({ role = "wakasek" }) {
  const [master, setMaster] = useState(() => ({
    teachers: readArray(KEY.teachers),
    rombels: readArray(KEY.rombels),
    subjects: readArray(KEY.subjects),
    assignments: readArray(KEY.assignments),
  }));
  const [records, setRecords] = useState(() => readArray(KEY.schedules));
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedSemester, setSelectedSemester] = useState("Semua");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [resultRecord, setResultRecord] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    jenisSupervisi: "Guru Mata Pelajaran",
    tugasMengajarId: "",
    guruBkId: "",
    tanggal: dateToday(),
    waktu: "08:00",
    semester: "Ganjil",
    fokus: "Pelaksanaan pembelajaran",
    keterangan: "",
  });
  const [observation, setObservation] = useState(emptyObservation);

  const isPrincipal = role === "kepsek";
  const isDeputy = role === "wakasek";
  const isTeacher = role === "guru";

  useEffect(() => {
    const refresh = () => {
      setMaster({
        teachers: readArray(KEY.teachers),
        rombels: readArray(KEY.rombels),
        subjects: readArray(KEY.subjects),
        assignments: readArray(KEY.assignments),
      });
      setRecords(readArray(KEY.schedules));
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const activeTeachers = useMemo(() => master.teachers.filter(isActive), [master.teachers]);
  const activeAssignments = useMemo(() => master.assignments.filter((assignment) => {
    if (!isActive(assignment)) return false;
    const teacher = master.teachers.find((item) => String(item.id) === String(assignment.guruId));
    const rombel = master.rombels.find((item) => String(item.id) === String(assignment.rombelId));
    const subject = master.subjects.find((item) => String(item.id) === String(assignment.mapelId));
    return isActive(teacher) && isActive(rombel) && isActive(subject) && rombel.tahunAjaran === selectedYear;
  }), [master, selectedYear]);

  useEffect(() => {
    if (isTeacher && !activeTeachers.some((item) => String(item.id) === String(selectedTeacherId))) {
      setSelectedTeacherId(activeTeachers[0] ? String(activeTeachers[0].id) : "");
    }
  }, [isTeacher, activeTeachers, selectedTeacherId]);

  const teacherRecords = useMemo(() => {
    if (!isTeacher) return records;
    return records.filter((item) =>
      String(item.guruId) === String(selectedTeacherId) &&
      ["Terjadwal", "Selesai"].includes(item.status)
    );
  }, [records, isTeacher, selectedTeacherId]);

  const visibleRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return teacherRecords.filter((item) => {
      if (item.tahunAjaran !== selectedYear) return false;
      if (selectedSemester !== "Semua" && item.semester !== selectedSemester) return false;
      const matchesSearch = !keyword || [item.guruNama, item.rombelNama, item.mapelNama, item.fokus]
        .some((value) => String(value || "").toLowerCase().includes(keyword));
      return matchesSearch;
    }).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
  }, [teacherRecords, selectedYear, selectedSemester, search]);

  const waitingCount = visibleRecords.filter((item) => item.status === "Menunggu Persetujuan").length;
  const scheduledCount = visibleRecords.filter((item) => item.status === "Terjadwal").length;
  const completedCount = visibleRecords.filter((item) => item.status === "Selesai").length;

  const yearOptions = [...new Set([
    currentYear(),
    ...records.map((item) => item.tahunAjaran).filter(Boolean),
  ])].sort();

  const assignmentOptions = activeAssignments.filter((item) => {
    if (isTeacher && String(item.guruId) !== String(selectedTeacherId)) return false;
    return true;
  });

  function saveRecords(next) {
    try {
      localStorage.setItem(KEY.schedules, JSON.stringify(next));
      setRecords(next);
      return true;
    } catch (storageError) {
      console.error("Gagal menyimpan supervisi:", storageError);
      setError("Data gagal disimpan. Periksa kapasitas penyimpanan browser.");
      return false;
    }
  }

  function openCreate() {
    setEditingRecord(null);
    setForm({
      jenisSupervisi: "Guru Mata Pelajaran",
      tugasMengajarId: "",
      guruBkId: "",
      tanggal: dateToday(),
      waktu: "08:00",
      semester: "Ganjil",
      fokus: "Pelaksanaan pembelajaran",
      keterangan: "",
    });
    setError("");
    setShowForm(true);
  }

  function openEdit(record) {
    setEditingRecord(record);
    setForm({
      jenisSupervisi: record.jenisSupervisi || "Guru Mata Pelajaran",
      tugasMengajarId: String(record.tugasMengajarId || ""),
      guruBkId: String(record.jenisSupervisi === "Guru BK" ? record.guruId || "" : ""),
      tanggal: record.tanggal || dateToday(),
      waktu: record.waktu || "08:00",
      semester: record.semester || "Ganjil",
      fokus: record.fokus || "Pelaksanaan pembelajaran",
      keterangan: record.keterangan || "",
    });
    setError("");
    setShowForm(true);
  }

  function handleSaveSchedule(event) {
    event.preventDefault();

    const isBkSchedule = form.jenisSupervisi === "Guru BK";
    let assignment = null;
    let teacher = null;
    let rombel = null;
    let subject = null;

    if (isBkSchedule) {
      teacher = master.teachers.find(
        (item) => String(item.id) === String(form.guruBkId)
      );

      if (!isActive(teacher)) {
        setError("Pilih Guru BK yang valid dari Data Guru.");
        return;
      }
    } else {
      assignment = activeAssignments.find(
        (item) => String(item.id) === String(form.tugasMengajarId)
      );

      if (!assignment) {
        setError("Pilih penugasan mengajar yang valid.");
        return;
      }

      teacher = master.teachers.find(
        (item) => String(item.id) === String(assignment.guruId)
      );
      rombel = master.rombels.find(
        (item) => String(item.id) === String(assignment.rombelId)
      );
      subject = master.subjects.find(
        (item) => String(item.id) === String(assignment.mapelId)
      );
    }

    const previous = editingRecord;
    const now = new Date().toISOString();

    const record = {
      id: previous?.id || makeId(),
      jenisSupervisi: isBkSchedule ? "Guru BK" : "Guru Mata Pelajaran",
      tahunAjaran: selectedYear,
      semester: form.semester,
      tugasMengajarId: isBkSchedule ? null : assignment.id,
      guruId: teacher.id,
      guruNama: getName(teacher, ["nama", "namaGuru"]),
      rombelId: isBkSchedule ? null : assignment.rombelId,
      rombelNama: isBkSchedule ? "Lintas Rombel" : getName(rombel, ["namaRombel"]),
      mapelId: isBkSchedule ? null : assignment.mapelId,
      mapelNama: isBkSchedule
        ? "Layanan Bimbingan dan Konseling"
        : getName(subject, ["nama", "namaMapel"]),
      tanggal: form.tanggal,
      waktu: form.waktu,
      fokus: form.fokus.trim(),
      keterangan: form.keterangan.trim(),
      status: previous?.status || (isDeputy ? "Menunggu Persetujuan" : "Terjadwal"),
      dibuatOleh: previous?.dibuatOleh || role,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
      hasil: previous?.hasil || null,
      umpanBalikDipublikasikan: previous?.umpanBalikDipublikasikan || false,
    };

    const next = previous
      ? records.map((item) =>
          String(item.id) === String(previous.id) ? record : item
        )
      : [record, ...records];

    if (saveRecords(next)) setShowForm(false);
  }

  function approveSchedule(record, approve) {
    if (!isPrincipal) return;
    const next = records.map((item) => String(item.id) === String(record.id)
      ? {
          ...item,
          status: approve ? "Terjadwal" : "Ditolak",
          disetujuiOleh: "Kepala Sekolah",
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : item);
    saveRecords(next);
  }

  function startObservation(record) {
    setResultRecord(record);
    setObservation({
      ...emptyObservation,
      ...(record.hasil || {}),
    });
    setError("");
  }

  function saveObservation(event) {
    event.preventDefault();
    if (!isPrincipal || !resultRecord) return;
    if (!observation.umpanBalik.trim()) {
      setError("Umpan balik kepada guru wajib diisi.");
      return;
    }
    const now = new Date().toISOString();
    const next = records.map((item) => String(item.id) === String(resultRecord.id)
      ? {
          ...item,
          status: "Selesai",
          hasil: observation,
          umpanBalikDipublikasikan: true,
          diselesaikanOleh: "Kepala Sekolah",
          completedAt: now,
          updatedAt: now,
        }
      : item);
    if (saveRecords(next)) setResultRecord(null);
  }

  function cancelProposal(record) {
    if (!isDeputy || record.status !== "Menunggu Persetujuan") return;
    if (!window.confirm("Batalkan usulan jadwal supervisi ini?")) return;
    saveRecords(records.filter((item) => String(item.id) !== String(record.id)));
  }

  return (
    <div className="sv-page">
      <style>{styles}</style>
      <header className="sv-header">
        <div>
          <span className="sv-eyebrow">PENGAWASAN DAN PEMBINAAN PEMBELAJARAN</span>
          <h2>Supervisi Akademik</h2>
          <p>Administrasi program, jadwal, pengamatan, dan tindak lanjut supervisi pembelajaran.</p>
        </div>
        <div className="sv-header-icon"><ClipboardCheck size={25} /></div>
      </header>

      {isTeacher && (
        <div className="sv-notice">
          <AlertTriangle size={18} />
          <div>
            <strong>Mode Preview Guru</strong>
            <span>Identitas guru dipilih secara manual untuk pengujian. Penguncian berdasarkan akun belum aktif.</span>
          </div>
        </div>
      )}
      {isDeputy && (
        <div className="sv-notice">
          <AlertTriangle size={18} />
          <div>
            <strong>Peran pendukung administrasi</strong>
            <span>Wakasek dapat mengusulkan jadwal. Usulan baru berlaku setelah disetujui Kepala Sekolah. Hasil dan umpan balik supervisi menjadi tanggung jawab Kepala Sekolah.</span>
          </div>
        </div>
      )}

      <section className="sv-filter">
        {isTeacher && (
          <label>Profil Guru
            <select value={selectedTeacherId} onChange={(event) => setSelectedTeacherId(event.target.value)}>
              <option value="">Pilih profil guru</option>
              {activeTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{getName(teacher, ["nama", "namaGuru"])}</option>)}
            </select>
          </label>
        )}
        <label>Tahun Ajaran
          <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
            {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label>Semester
          <select value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)}>
            <option value="Semua">Semua Semester</option>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </label>
      </section>

      <section className="sv-stats">
        <article className="sv-stat"><div className="sv-stat-icon"><CalendarDays size={19} /></div><div><span>Total Jadwal</span><strong>{visibleRecords.length}</strong></div></article>
        <article className="sv-stat"><div className="sv-stat-icon orange"><Clock3 size={19} /></div><div><span>{isDeputy ? "Menunggu Persetujuan" : "Terjadwal"}</span><strong>{isDeputy ? waitingCount : scheduledCount}</strong></div></article>
        <article className="sv-stat"><div className="sv-stat-icon green"><CheckCircle2 size={19} /></div><div><span>Sudah Dilaksanakan</span><strong>{completedCount}</strong></div></article>
        <article className="sv-stat"><div className="sv-stat-icon purple"><Users size={19} /></div><div><span>Guru Terpantau</span><strong>{new Set(visibleRecords.map((item) => item.guruId)).size}</strong></div></article>
      </section>

      <section className="sv-panel">
        <div className="sv-panel-head">
          <div>
            <h3>{isTeacher ? "Jadwal Supervisi Saya" : "Program dan Jadwal Supervisi"}</h3>
            <p>{isPrincipal ? "Kepala Sekolah mengelola pelaksanaan dan hasil supervisi." : isDeputy ? "Siapkan administrasi dan usulkan jadwal untuk persetujuan Kepala Sekolah." : "Lihat jadwal supervisi dan umpan balik yang telah diberikan."}</p>
          </div>
          {(isPrincipal || isDeputy) && (
            <button className="sv-primary" onClick={openCreate}><Plus size={16} />{isDeputy ? "Usulkan Jadwal" : "Buat Jadwal"}</button>
          )}
        </div>
        <div className="sv-toolbar">
          <div className="sv-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari guru, rombel, mapel, atau fokus..." /></div>
        </div>
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead><tr><th>No.</th><th>Tanggal / Waktu</th><th>Guru</th><th>Rombel / Mapel</th><th>Fokus</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {visibleRecords.length === 0 ? (
                <tr><td colSpan="7" className="sv-empty"><ClipboardCheck size={31} /><strong>Belum ada jadwal supervisi</strong><span>{isTeacher ? "Jadwal supervisi untuk profil guru ini belum tersedia." : "Buat jadwal supervisi atau tunggu usulan dan penetapan jadwal."}</span></td></tr>
              ) : visibleRecords.map((item, index) => {
                const statusClass = item.status === "Selesai" ? "done" : item.status === "Terjadwal" ? "scheduled" : "wait";
                return (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td><strong>{formatDate(item.tanggal)}</strong><br />{item.waktu || "-"}</td>
                    <td>{item.guruNama || "-"}</td>
                    <td>{item.rombelNama || "-"}<br />{item.mapelNama || "-"}</td>
                    <td>{item.fokus || "-"}</td>
                    <td><span className={`sv-status ${statusClass}`}>{item.status}</span></td>
                    <td>
                      <div className="sv-row-actions">
                        <button className="sv-action" title="Lihat detail" onClick={() => setViewRecord(item)}><Eye size={15} />Detail</button>
                        {isPrincipal && item.status === "Menunggu Persetujuan" && <><button className="sv-action" onClick={() => approveSchedule(item, true)}>Setujui</button><button className="sv-danger" onClick={() => approveSchedule(item, false)}>Tolak</button></>}
                        {isPrincipal && item.status === "Terjadwal" && <button className="sv-primary" onClick={() => startObservation(item)}>Catat Hasil</button>}
                        {isPrincipal && item.status === "Selesai" && <button className="sv-action" onClick={() => startObservation(item)}>Ubah Hasil</button>}
                        {isDeputy && item.status === "Menunggu Persetujuan" && <button className="sv-danger" onClick={() => cancelProposal(item)}>Batalkan</button>}
                        {(isPrincipal || isDeputy) && item.status === "Menunggu Persetujuan" && isPrincipal && <button className="sv-secondary" onClick={() => openEdit(item)}>Ubah</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="sv-footnote">Data supervisi tersimpan pada browser ini. Untuk penggunaan multi-perangkat dan akun resmi, integrasi database serta autentikasi akan disiapkan pada tahap pengembangan berikutnya.</div>
      </section>

      {showForm && (
        <div className="sv-modal-backdrop" onMouseDown={() => setShowForm(false)}>
          <section className="sv-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sv-modal-head"><div><h3>{editingRecord ? "Ubah Usulan Jadwal" : isDeputy ? "Usulan Jadwal Supervisi" : "Buat Jadwal Supervisi"}</h3><p>Penugasan guru diambil dari data Tugas Mengajar.</p></div><button className="sv-icon-button" type="button" onClick={() => setShowForm(false)}><X size={18} /></button></div>
            <form onSubmit={handleSaveSchedule}>
              <div className="sv-form-grid">
                <label className="sv-full">Jenis Supervisi *
                  <select
                    value={form.jenisSupervisi}
                    onChange={(event) => {
                      const nextType = event.target.value;
                      setForm({
                        ...form,
                        jenisSupervisi: nextType,
                        tugasMengajarId: "",
                        guruBkId: "",
                        fokus: nextType === "Guru BK"
                          ? "Program BK dan asesmen kebutuhan peserta didik"
                          : "Pelaksanaan pembelajaran",
                      });
                    }}
                  >
                    <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
                    <option value="Guru BK">Guru Bimbingan dan Konseling (BK)</option>
                  </select>
                </label>

                {form.jenisSupervisi === "Guru BK" ? (
                  <label className="sv-full">Pilih Guru BK dari Data Guru *
                    <select
                      required
                      value={form.guruBkId}
                      onChange={(event) => setForm({ ...form, guruBkId: event.target.value })}
                    >
                      <option value="">Pilih Guru BK</option>
                      {activeTeachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {getName(teacher, ["nama", "namaGuru"])}
                        </option>
                      ))}
                    </select>
                    <small>Daftar diambil dari Data Guru aktif. Pastikan memilih guru yang memang bertugas sebagai Guru BK.</small>
                  </label>
                ) : (
                  <label className="sv-full">Guru, Rombel, dan Mata Pelajaran *
                    <select required value={form.tugasMengajarId} onChange={(event) => setForm({ ...form, tugasMengajarId: event.target.value })}>
                      <option value="">Pilih penugasan mengajar</option>
                      {assignmentOptions.map((assignment) => {
                        const teacher = master.teachers.find((item) => String(item.id) === String(assignment.guruId));
                        const rombel = master.rombels.find((item) => String(item.id) === String(assignment.rombelId));
                        const subject = master.subjects.find((item) => String(item.id) === String(assignment.mapelId));
                        return <option key={assignment.id} value={assignment.id}>{getName(teacher, ["nama", "namaGuru"])} — {getName(subject, ["nama", "namaMapel"])} — {getName(rombel, ["namaRombel"])}</option>;
                      })}
                    </select>
                  </label>
                )}

                <label>Tanggal Supervisi *<input type="date" required value={form.tanggal} onChange={(event) => setForm({ ...form, tanggal: event.target.value })} /></label>
                <label>Waktu *<input type="time" required value={form.waktu} onChange={(event) => setForm({ ...form, waktu: event.target.value })} /></label>
                <label>Semester *<select value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })}><option value="Ganjil">Ganjil</option><option value="Genap">Genap</option></select></label>

                <label>Fokus Supervisi *
                  <select value={form.fokus} onChange={(event) => setForm({ ...form, fokus: event.target.value })}>
                    {form.jenisSupervisi === "Guru BK" ? (
                      <>
                        <option>Program BK dan asesmen kebutuhan peserta didik</option>
                        <option>Layanan dasar</option>
                        <option>Layanan responsif</option>
                        <option>Peminatan dan perencanaan individual</option>
                        <option>Dukungan sistem dan kolaborasi</option>
                        <option>Evaluasi dan tindak lanjut layanan BK</option>
                        <option>Etika profesi dan kerahasiaan</option>
                      </>
                    ) : (
                      <>
                        <option>Perencanaan pembelajaran</option>
                        <option>Pelaksanaan pembelajaran</option>
                        <option>Asesmen pembelajaran</option>
                        <option>Pengelolaan kelas</option>
                        <option>Refleksi dan tindak lanjut</option>
                      </>
                    )}
                  </select>
                </label>

                <label className="sv-full">Keterangan Tambahan<textarea rows="3" value={form.keterangan} onChange={(event) => setForm({ ...form, keterangan: event.target.value })} placeholder={form.jenisSupervisi === "Guru BK" ? "Catatan administratif supervisi. Jangan cantumkan identitas atau rincian kasus konseling peserta didik." : "Informasi tambahan (opsional)"} /></label>

                {form.jenisSupervisi === "Guru BK" && (
                  <div className="sv-report-note sv-full">
                    Supervisi BK menilai mutu program dan layanan Bimbingan dan Konseling. Jangan memasukkan nama konseli, diagnosis, atau rincian kasus pribadi ke catatan supervisi umum.
                  </div>
                )}
              </div>
              {error && <div className="sv-notice"><AlertTriangle size={17} />{error}</div>}
              <div className="sv-modal-foot"><button type="button" className="sv-secondary" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="sv-primary"><Save size={15} />{isDeputy ? "Kirim Usulan" : "Simpan Jadwal"}</button></div>
            </form>
          </section>
        </div>
      )}

      {resultRecord && (
        <div className="sv-modal-backdrop" onMouseDown={() => setResultRecord(null)}>
          <section className="sv-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sv-modal-head"><div><h3>Hasil Pengamatan Supervisi</h3><p>{resultRecord.guruNama} · {resultRecord.rombelNama} · {formatDate(resultRecord.tanggal)}</p></div><button className="sv-icon-button" type="button" onClick={() => setResultRecord(null)}><X size={18} /></button></div>
            <form onSubmit={saveObservation}>
              <div className="sv-form-grid">
                {resultRecord.jenisSupervisi === "Guru BK" ? (
                  <>
                    <div className="sv-report-note sv-full">
                      Instrumen supervisi Guru BK berfokus pada mutu program dan layanan BK, bukan penilaian mengajar mata pelajaran. Catat proses dan mutu layanan tanpa menuliskan identitas konseli, diagnosis, atau rincian kasus pribadi.
                    </div>
                    <label className="sv-full">Program BK dan Perencanaan Layanan<textarea rows="2" value={observation.programBk} onChange={(event) => setObservation({ ...observation, programBk: event.target.value })} placeholder="Kesesuaian program tahunan/semester, tujuan layanan, dan perencanaan kegiatan." /></label>
                    <label className="sv-full">Asesmen Kebutuhan Peserta Didik<textarea rows="2" value={observation.asesmenKebutuhanBk} onChange={(event) => setObservation({ ...observation, asesmenKebutuhanBk: event.target.value })} placeholder="Kesesuaian cara mengidentifikasi kebutuhan dan penggunaan hasil asesmen secara agregat." /></label>
                    <label className="sv-full">Pelaksanaan Layanan Dasar<textarea rows="2" value={observation.layananDasarBk} onChange={(event) => setObservation({ ...observation, layananDasarBk: event.target.value })} placeholder="Kualitas bimbingan klasikal, bimbingan kelompok, atau layanan dasar lainnya." /></label>
                    <label className="sv-full">Pelaksanaan Layanan Responsif<textarea rows="2" value={observation.layananResponsifBk} onChange={(event) => setObservation({ ...observation, layananResponsifBk: event.target.value })} placeholder="Ketepatan respons, prosedur layanan, rujukan, dan koordinasi tanpa membuka identitas kasus." /></label>
                    <label className="sv-full">Peminatan dan Perencanaan Individual<textarea rows="2" value={observation.perencanaanIndividualBk} onChange={(event) => setObservation({ ...observation, perencanaanIndividualBk: event.target.value })} placeholder="Pendampingan perkembangan, pilihan belajar, dan perencanaan masa depan peserta didik." /></label>
                    <label className="sv-full">Dukungan Sistem dan Kolaborasi<textarea rows="2" value={observation.dukunganSistemBk} onChange={(event) => setObservation({ ...observation, dukunganSistemBk: event.target.value })} placeholder="Kolaborasi dengan wali kelas, guru, orang tua, dan pihak terkait sesuai kebutuhan." /></label>
                    <label className="sv-full">Evaluasi dan Tindak Lanjut Layanan<textarea rows="2" value={observation.evaluasiBk} onChange={(event) => setObservation({ ...observation, evaluasiBk: event.target.value })} placeholder="Evaluasi proses/hasil layanan dan tindak lanjut program." /></label>
                    <label className="sv-full">Etika Profesi dan Kerahasiaan<textarea rows="2" value={observation.etikaKerahasiaanBk} onChange={(event) => setObservation({ ...observation, etikaKerahasiaanBk: event.target.value })} placeholder="Penerapan etika, perlindungan data, batas kerahasiaan, dan prosedur rujukan." /></label>
                  </>
                ) : (
                  <>
                    <label className="sv-full">Catatan Perencanaan Pembelajaran<textarea rows="2" value={observation.perencanaan} onChange={(event) => setObservation({ ...observation, perencanaan: event.target.value })} /></label>
                    <label className="sv-full">Catatan Pelaksanaan Pembelajaran<textarea rows="2" value={observation.pelaksanaan} onChange={(event) => setObservation({ ...observation, pelaksanaan: event.target.value })} /></label>
                    <label className="sv-full">Catatan Asesmen Pembelajaran<textarea rows="2" value={observation.asesmen} onChange={(event) => setObservation({ ...observation, asesmen: event.target.value })} /></label>
                  </>
                )}
                <label className="sv-full">Kekuatan / Praktik Baik<textarea rows="2" value={observation.kekuatan} onChange={(event) => setObservation({ ...observation, kekuatan: event.target.value })} /></label>
                <label className="sv-full">Area yang Perlu Ditingkatkan<textarea rows="2" value={observation.perbaikan} onChange={(event) => setObservation({ ...observation, perbaikan: event.target.value })} /></label>
                <label className="sv-full">Umpan Balik untuk Guru *<textarea rows="3" required value={observation.umpanBalik} onChange={(event) => setObservation({ ...observation, umpanBalik: event.target.value })} /></label>
                <label className="sv-full">Tindak Lanjut yang Disepakati<textarea rows="3" value={observation.tindakLanjut} onChange={(event) => setObservation({ ...observation, tindakLanjut: event.target.value })} /></label>
              </div>
              {error && <div className="sv-notice"><AlertTriangle size={17} />{error}</div>}
              <div className="sv-modal-foot"><button type="button" className="sv-secondary" onClick={() => setResultRecord(null)}>Batal</button><button type="submit" className="sv-primary"><Save size={15} />Simpan dan Publikasikan Umpan Balik</button></div>
            </form>
          </section>
        </div>
      )}

      {viewRecord && (
        <div className="sv-modal-backdrop" onMouseDown={() => setViewRecord(null)}>
          <section className="sv-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sv-modal-head"><div><h3>Detail Supervisi</h3><p>{viewRecord.guruNama} · {viewRecord.rombelNama} · {viewRecord.mapelNama}</p></div><button className="sv-icon-button" type="button" onClick={() => setViewRecord(null)}><X size={18} /></button></div>
            <div className="sv-report-grid">
              <div className="sv-report-item"><span>TANGGAL</span><strong>{formatDate(viewRecord.tanggal)} · {viewRecord.waktu}</strong></div>
              <div className="sv-report-item"><span>TAHUN AJARAN / SEMESTER</span><strong>{viewRecord.tahunAjaran} · {viewRecord.semester}</strong></div>
              <div className="sv-report-item"><span>JENIS SUPERVISI</span><strong>{viewRecord.jenisSupervisi || "Guru Mata Pelajaran"}</strong></div>
              <div className="sv-report-item"><span>FOKUS</span><strong>{viewRecord.fokus}</strong></div>
              <div className="sv-report-item"><span>STATUS</span><strong>{viewRecord.status}</strong></div>
              {viewRecord.keterangan && <div className="sv-report-note"><strong>Keterangan:</strong><br />{viewRecord.keterangan}</div>}
              {isTeacher && viewRecord.status === "Selesai" && viewRecord.umpanBalikDipublikasikan && viewRecord.hasil && (
                <>
                  <div className="sv-report-note"><strong>Umpan Balik Kepala Sekolah</strong><br />{viewRecord.hasil.umpanBalik || "-"}</div>
                  {viewRecord.hasil.kekuatan && <div className="sv-report-note"><strong>Praktik Baik</strong><br />{viewRecord.hasil.kekuatan}</div>}
                  {viewRecord.hasil.perbaikan && <div className="sv-report-note"><strong>Area Peningkatan</strong><br />{viewRecord.hasil.perbaikan}</div>}
                  {viewRecord.hasil.tindakLanjut && <div className="sv-report-note"><strong>Tindak Lanjut</strong><br />{viewRecord.hasil.tindakLanjut}</div>}
                </>
              )}
              {!isTeacher && viewRecord.hasil && (
                <>
                  {Object.entries({
                    "Perencanaan": viewRecord.hasil.perencanaan,
                    "Pelaksanaan": viewRecord.hasil.pelaksanaan,
                    "Asesmen": viewRecord.hasil.asesmen,
                    "Kekuatan": viewRecord.hasil.kekuatan,
                    "Area perbaikan": viewRecord.hasil.perbaikan,
                    "Umpan balik": viewRecord.hasil.umpanBalik,
                    "Tindak lanjut": viewRecord.hasil.tindakLanjut,
                    "Program BK dan perencanaan layanan": viewRecord.hasil.programBk,
                    "Asesmen kebutuhan peserta didik": viewRecord.hasil.asesmenKebutuhanBk,
                    "Layanan dasar": viewRecord.hasil.layananDasarBk,
                    "Layanan responsif": viewRecord.hasil.layananResponsifBk,
                    "Peminatan dan perencanaan individual": viewRecord.hasil.perencanaanIndividualBk,
                    "Dukungan sistem dan kolaborasi": viewRecord.hasil.dukunganSistemBk,
                    "Evaluasi layanan BK": viewRecord.hasil.evaluasiBk,
                    "Etika profesi dan kerahasiaan": viewRecord.hasil.etikaKerahasiaanBk,
                  }).filter(([, value]) => value).map(([label, value]) => <div className="sv-report-note" key={label}><strong>{label}</strong><br />{value}</div>)}
                </>
              )}
              {isTeacher && (!viewRecord.hasil || !viewRecord.umpanBalikDipublikasikan) && <div className="sv-report-note">Hasil pengamatan dan umpan balik belum dipublikasikan oleh Kepala Sekolah.</div>}
            </div>
            <div className="sv-modal-foot"><button className="sv-secondary" onClick={() => setViewRecord(null)}>Tutup</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
