
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Eye,
  UserX,
  UserCheck,
  X,
  GraduationCap,
  UserRound,
  FileSpreadsheet,
  ClipboardList,
} from "lucide-react";
import "../styles/DataSiswaPage.css";
import { getSekolahAktifWakasek } from "../services/guruRepository";
import {
  getDataSiswaSekolah,
  simpanDataSiswaSekolah,
  simpanBanyakDataSiswaSekolah,
  migrasikanDataSiswaSekolah,
} from "../services/siswaRepository";
import ImportDataSiswaModal from "./ImportDataSiswaModal";

const STORAGE_KEY = "simkur_data_siswa";

const readStudents = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const createId = () =>
  `SIS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const initialForm = {
  nama: "",
  nis: "",
  nisn: "",
  jenisKelamin: "Laki-laki",
  tempatLahir: "",
  tanggalLahir: "",
  alamat: "",
  namaOrangTua: "",
  noHpOrangTua: "",
};

export default function DataSiswaPage({ userId }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [modal, setModal] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [sekolahId, setSekolahId] = useState("");
const [cloudReady, setCloudReady] = useState(false);
const [cloudLoading, setCloudLoading] = useState(true);
const [cloudError, setCloudError] = useState("");

const [registrationForm, setRegistrationForm] = useState({
  jenis: "Mutasi",
  keterangan: "",
});
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
  let masihAktif = true;

  async function muatDataSiswaCloud() {
    setCloudLoading(true);
    setCloudReady(false);
    setCloudError("");

    if (!userId) {
      setCloudError("Identitas akun tidak ditemukan.");
      setCloudLoading(false);
      return;
    }

    try {
      const sid = await getSekolahAktifWakasek(userId);
      if (!masihAktif) return;

      const dataCloud = await getDataSiswaSekolah(sid);
      if (!masihAktif) return;

      let dataFinal = dataCloud;
      const dataLokal = readStudents();

      if (dataLokal.length > 0) {
        // Simpan cadangan sebelum migrasi atau cache diperbarui.
        const backupKey = "simkur_data_siswa_backup_legacy";

        try {
          if (!localStorage.getItem(backupKey)) {
            localStorage.setItem(
              backupKey,
              JSON.stringify(dataLokal)
            );
          }
        } catch (backupError) {
          console.error("Cadangan lokal gagal:", backupError);
        }

        const idCloud = new Set(
          dataCloud.map((item) => String(item.id))
        );

        const dataBelumAda = dataLokal.filter(
          (item) =>
            item?.id &&
            item?.nama?.trim?.() &&
            !idCloud.has(String(item.id))
        );

        if (dataBelumAda.length > 0) {
          const setuju = window.confirm(
            `Ditemukan ${dataBelumAda.length} data Siswa lokal yang belum ada di Supabase sekolah aktif.\n\n` +
            `Pastikan data tersebut benar-benar milik sekolah ini sebelum migrasi.\n\n` +
            `Data cloud tidak akan ditimpa dan cadangan lokal tetap disimpan.\n\n` +
            `Migrasikan sekarang?`
          );

          if (setuju) {
            const hasil = await migrasikanDataSiswaSekolah({
              sekolahId: sid,
              userId,
              siswaLokal: dataBelumAda,
            });

            dataFinal = hasil.data;

            window.alert(
              `Migrasi Siswa selesai.\n` +
              `Berhasil: ${hasil.berhasil}\n` +
              `Dilewati: ${hasil.dilewati}\n` +
              `Tidak valid: ${hasil.tidakValid}\n` +
              `Gagal: ${hasil.gagal.length}`
            );
          }
        }
      }

      if (!masihAktif) return;

      setSekolahId(sid);
      setStudents(dataFinal);
      setCloudReady(true);
    } catch (error) {
      console.error("Gagal memuat Data Siswa:", error);

      if (masihAktif) {
        setCloudError(
          error?.message || "Data Siswa gagal dimuat dari Supabase."
        );
      }
    } finally {
      if (masihAktif) {
        setCloudLoading(false);
      }
    }
  }

  muatDataSiswaCloud();

  return () => {
    masihAktif = false;
  };
}, [userId]);

// localStorage hanya menjadi cache/cadangan kompatibilitas.
// Sumber data utama tetap Supabase.
useEffect(() => {
  if (!cloudReady) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (error) {
    console.warn("Cache Data Siswa gagal diperbarui:", error);
  }
}, [students, cloudReady]);

const activeCount = students.filter(
  (student) => !student.status || student.status === "Aktif"
).length;

const inactiveCount = students.filter(
  (student) =>
    student.status === "Mutasi" ||
    student.status === "Keluar (Dropout)"
).length;

const filteredStudents = useMemo(() => {
  const keyword = search.trim().toLowerCase();

  return students.filter((student) => {
    const isActive = !student.status || student.status === "Aktif";

    const matchesSearch =
      !keyword ||
      [student.nama, student.nis, student.nisn].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      );

    const matchesStatus =
      statusFilter === "Semua" || student.status === statusFilter;

    return isActive && matchesSearch && matchesStatus;
  });
}, [students, search, statusFilter]);

  const openEdit = (student) => {
    setEditingId(student.id);
    setForm({ ...initialForm, ...student });
    setModal("form");
  };

  const saveStudent = async (event) => {
    
  event.preventDefault();

  if (!cloudReady || !sekolahId || !userId) {
    alert("Koneksi Data Siswa belum siap. Silakan muat ulang halaman.");
    return;
  }

  if (!form.nama.trim()) {
    alert("Nama siswa wajib diisi.");
    return;
  }

  const normalisasiNomor = (value) => {
    const result = String(value ?? "").trim();
    return ["-", "–", "—"].includes(result) ? "" : result;
  };

  const nis = normalisasiNomor(form.nis);
  const nisn = normalisasiNomor(form.nisn);

  const duplicateNis = students.some(
    (student) =>
      student.id !== editingId &&
      nis &&
      normalisasiNomor(student.nis) === nis
  );

  if (duplicateNis) {
    alert("NIS sudah digunakan oleh siswa lain.");
    return;
  }

  const duplicateNisn = students.some(
    (student) =>
      student.id !== editingId &&
      nisn &&
      normalisasiNomor(student.nisn) === nisn
  );

  if (duplicateNisn) {
    alert("NISN sudah digunakan oleh siswa lain.");
    return;
  }

  const sekarang = new Date().toISOString();
  const dataLama = students.find(
    (student) => student.id === editingId
  );

  const siswa = {
    ...(dataLama || {}),
    ...form,
    id: editingId || createId(),
    nama: form.nama.trim(),
    nis,
    nisn,
    status: dataLama?.status || "Aktif",
    sumber: dataLama?.sumber || "Manual",
    createdAt: dataLama?.createdAt || sekarang,
    updatedAt: sekarang,
  };

  try {
    await simpanDataSiswaSekolah({
      sekolahId,
      userId,
      siswa,
    });

    setStudents((current) =>
      editingId
        ? current.map((item) =>
            item.id === editingId ? siswa : item
          )
        : [siswa, ...current]
    );

    setModal("");
    setEditingId(null);
    setForm(initialForm);
  } catch (error) {
    console.error("Gagal menyimpan Siswa:", error);
    alert("Data Siswa gagal disimpan ke Supabase:\n\n" + error.message);
  }
};

const handleImportStudents = async (importedRows) => {
  if (!cloudReady || !sekolahId || !userId) {
    throw new Error("Data sekolah belum siap. Muat ulang halaman.");
  }

  const sekarang = new Date().toISOString();

  const dataBaru = importedRows.map((item) => ({
    ...item,
    id: createId(),
    status: "Aktif",
    sumber: "Impor Excel/CSV",
    perubahanManual: false,
    createdAt: sekarang,
    updatedAt: sekarang,
  }));

  const dataTerbaru = await simpanBanyakDataSiswaSekolah({
    sekolahId,
    userId,
    siswaList: dataBaru,
  });

  setStudents(dataTerbaru);
};

  const openRegistration = (student) => {
  setSelectedStudent(student);

  setRegistrationForm({
    jenis: "Mutasi",
    keterangan: "",
  });

  setModal("registration");
};

const saveRegistration = async (event) => {
  event.preventDefault();

  if (!cloudReady || !sekolahId || !userId || !selectedStudent) {
    alert("Data sekolah atau siswa belum siap.");
    return;
  }

  const keterangan = registrationForm.keterangan.trim();

  if (!keterangan) {
    alert("Alasan mutasi atau keluar wajib diisi.");
    return;
  }

  const sekarang = new Date().toISOString();
  const jenis = registrationForm.jenis;

  const riwayatLama = Array.isArray(
    selectedStudent.riwayatRegistrasi
  )
    ? selectedStudent.riwayatRegistrasi
    : [];

  const siswaDiperbarui = {
    ...selectedStudent,
    status: jenis,
    jenisRegistrasi: jenis,
    keteranganRegistrasi: keterangan,
    tanggalRegistrasi: sekarang.slice(0, 10),
    riwayatRegistrasi: [
      ...riwayatLama,
      {
        jenis,
        keterangan,
        tanggal: sekarang.slice(0, 10),
        dibuatPada: sekarang,
      },
    ],
    updatedAt: sekarang,
  };

  try {
    // Status dan riwayat disimpan dalam satu pembaruan payload.
    await simpanDataSiswaSekolah({
      sekolahId,
      userId,
      siswa: siswaDiperbarui,
    });

    setStudents((current) =>
      current.map((item) =>
        item.id === siswaDiperbarui.id
          ? siswaDiperbarui
          : item
      )
    );

    setModal("");
    setSelectedStudent(null);

    setRegistrationForm({
      jenis: "Mutasi",
      keterangan: "",
    });

    alert(
      `Registrasi ${jenis} berhasil disimpan.\n` +
      `Siswa telah dipindahkan dari daftar siswa aktif ke Daftar Siswa Keluar.`
    );
  } catch (error) {
    console.error("Gagal menyimpan registrasi:", error);
    alert("Registrasi gagal disimpan ke Supabase:\n\n" + error.message);
  }
};

  const showDetail = (student) => {
    setSelectedStudent(student);
    setModal("detail");
  };

  const closeModal = () => {
  setModal("");
  setSelectedStudent(null);
  setEditingId(null);

  setRegistrationForm({
    jenis: "Mutasi",
    keterangan: "",
  });
};

  return (
    <div className="ds-page">
      {cloudLoading && (
  <p style={{ color: "#64748b" }}>
    Memuat data siswa dari Supabase...
  </p>
)}

{cloudError && (
  <div
    style={{
      padding: 12,
      marginBottom: 14,
      color: "#b91c1c",
      background: "#fef2f2",
      borderRadius: 8,
    }}
  >
    Gagal memuat Data Siswa: {cloudError}
  </div>
)}
      <div className="ds-header">
        <div>
          <div className="ds-breadcrumb">
            Operator <span>/</span> Data Sekolah <span>/</span> Data Siswa
          </div>
          <h1>Data Siswa</h1>
          <p>Kelola identitas dan data pokok peserta didik.</p>
        </div>

  
<div
  className="ds-header-actions"
  style={{
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    flexShrink: 0,
  }}
>
  <button
    type="button"
    className="ds-secondary-btn"
    onClick={() => setImportOpen(true)}
  >
    <FileSpreadsheet size={17} />
    Import Excel/CSV
  </button>

  <button
  type="button"
  className="ds-primary-btn"
  onClick={() => {
    setSelectedStudent(null);
    setModal("form");
  }}
>
  <Plus size={17} />
  Tambah Siswa
</button>
</div>

      </div>

      <div className="ds-stats">
        <div className="ds-stat-card">
          <div className="ds-stat-icon blue">
            <Users size={21} />
          </div>
          <div>
            <span>Total Siswa</span>
            <strong>{students.length}</strong>
          </div>
        </div>

        <div className="ds-stat-card">
          <div className="ds-stat-icon green">
            <UserCheck size={21} />
          </div>
          <div>
            <span>Siswa Aktif</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="ds-stat-card">
          <div className="ds-stat-icon orange">
            <UserX size={21} />
          </div>
          <div>
            <span>Siswa Mutasi/Keluar</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>
      </div>

      <div className="ds-panel">
        <div className="ds-panel-heading">
          <div>
            <h2>Daftar Peserta Didik</h2>
            <p>Data siswa yang tercatat dalam sistem SIMKUR.</p>
          </div>
        </div>

        <div className="ds-toolbar">
          <div className="ds-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, NIS, atau NISN..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
          </select>
        </div>

        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Siswa</th>
                <th>NIS</th>
                <th>NISN</th>
                <th>Jenis Kelamin</th>
                <th>Status</th>
                <th>Sumber</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="ds-empty">
                    <GraduationCap size={34} />
                    <strong>Belum ada data siswa</strong>
                    <span>
                      Tambahkan data siswa secara manual untuk mulai mengelola
                      peserta didik.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td className="ds-student-name">{student.nama}</td>
                    <td>{student.nis || "-"}</td>
                    <td>{student.nisn || "-"}</td>
                    <td>{student.jenisKelamin || "-"}</td>
                    <td>
                      <span
                        className={`ds-status ${
                          student.status === "Aktif" ? "active" : "inactive"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td>{student.sumber || "Manual"}</td>
                    <td>
                      <div className="ds-actions">
                        <button
                          title="Detail"
                          onClick={() => showDetail(student)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => openEdit(student)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
  type="button"
  title="Registrasi"
  onClick={() => openRegistration(student)}
>
  <ClipboardList size={16} />
</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ds-table-footer">
          Menampilkan {filteredStudents.length} dari {activeCount} siswa aktif
        </div>
      </div>

      {importOpen && (
  <ImportDataSiswaModal
    existingStudents={students}
    onImport={handleImportStudents}
    onClose={() => setImportOpen(false)}
  />
)}

      {modal === "form" && (
        <div className="ds-modal-backdrop" onMouseDown={closeModal}>
          <div
            className="ds-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ds-modal-header">
              <div>
                <h2>{editingId ? "Edit Data Siswa" : "Tambah Siswa"}</h2>
                <p>Lengkapi identitas peserta didik.</p>
              </div>
              <button className="ds-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveStudent}>
              <div className="ds-form-grid">
                <label className="ds-field ds-full">
                  Nama Lengkap *
                  <input
                    required
                    value={form.nama}
                    onChange={(event) =>
                      setForm({ ...form, nama: event.target.value })
                    }
                    placeholder="Masukkan nama lengkap"
                  />
                </label>

                <label className="ds-field">
                  NIS
                  <input
                    value={form.nis}
                    onChange={(event) =>
                      setForm({ ...form, nis: event.target.value })
                    }
                    placeholder="Nomor Induk Siswa"
                  />
                </label>

                <label className="ds-field">
                  NISN
                  <input
                    value={form.nisn}
                    onChange={(event) =>
                      setForm({ ...form, nisn: event.target.value })
                    }
                    placeholder="Nomor Induk Siswa Nasional"
                  />
                </label>

                <label className="ds-field">
                  Jenis Kelamin
                  <select
                    value={form.jenisKelamin}
                    onChange={(event) =>
                      setForm({ ...form, jenisKelamin: event.target.value })
                    }
                  >
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </label>

                <label className="ds-field">
                  Tempat Lahir
                  <input
                    value={form.tempatLahir}
                    onChange={(event) =>
                      setForm({ ...form, tempatLahir: event.target.value })
                    }
                    placeholder="Kota kelahiran"
                  />
                </label>

                <label className="ds-field">
                  Tanggal Lahir
                  <input
                    type="date"
                    value={form.tanggalLahir}
                    onChange={(event) =>
                      setForm({ ...form, tanggalLahir: event.target.value })
                    }
                  />
                </label>

                <label className="ds-field ds-full">
                  Alamat
                  <textarea
                    rows="2"
                    value={form.alamat}
                    onChange={(event) =>
                      setForm({ ...form, alamat: event.target.value })
                    }
                    placeholder="Alamat tempat tinggal"
                  />
                </label>

                <label className="ds-field">
                  Nama Orang Tua/Wali
                  <input
                    value={form.namaOrangTua}
                    onChange={(event) =>
                      setForm({ ...form, namaOrangTua: event.target.value })
                    }
                    placeholder="Nama orang tua atau wali"
                  />
                </label>

                <label className="ds-field">
                  No. HP Orang Tua/Wali
                  <input
                    value={form.noHpOrangTua}
                    onChange={(event) =>
                      setForm({ ...form, noHpOrangTua: event.target.value })
                    }
                    placeholder="Nomor telepon"
                  />
                </label>
              </div>

              <div className="ds-modal-footer">
                <button
                  type="button"
                  className="ds-secondary-btn"
                  onClick={closeModal}
                >
                  Batal
                </button>
                <button type="submit" className="ds-primary-btn">
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "registration" && selectedStudent && (
  <div
    className="ds-modal-backdrop"
    onMouseDown={closeModal}
  >
    <div
      className="ds-modal"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="ds-modal-header">
        <div>
          <h2>Registrasi Siswa</h2>
          <p>Mutasi atau mengeluarkan siswa dari sekolah.</p>
        </div>

        <button
          className="ds-close-btn"
          type="button"
          onClick={closeModal}
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={saveRegistration}>
        <div className="ds-form-grid">
          <label className="ds-field ds-full">
            Nama Siswa
            <input value={selectedStudent.nama} readOnly />
          </label>

          <label className="ds-field ds-full">
            Jenis Registrasi *
            <select
              required
              value={registrationForm.jenis}
              onChange={(event) =>
                setRegistrationForm({
                  ...registrationForm,
                  jenis: event.target.value,
                })
              }
            >
              <option value="Mutasi">Mutasi</option>
              <option value="Keluar (Dropout)">
                Keluar (Dropout)
              </option>
            </select>
          </label>

          <label className="ds-field ds-full">
            Alasan/Keterangan *
            <textarea
              required
              rows="4"
              maxLength={1000}
              value={registrationForm.keterangan}
              onChange={(event) =>
                setRegistrationForm({
                  ...registrationForm,
                  keterangan: event.target.value,
                })
              }
              placeholder="Tuliskan alasan mutasi atau alasan keluar siswa..."
            />
          </label>
        </div>

        <div className="ds-modal-footer">
          <button
            type="button"
            className="ds-secondary-btn"
            onClick={closeModal}
          >
            Batal
          </button>

          <button
            type="submit"
            className="ds-primary-btn"
          >
            Simpan Registrasi
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      
      {modal === "detail" && selectedStudent && (
        <div className="ds-modal-backdrop" onMouseDown={closeModal}>
          <div
            className="ds-modal ds-detail-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ds-modal-header">
              <div>
                <h2>Detail Data Siswa</h2>
                <p>Informasi peserta didik.</p>
              </div>
              <button className="ds-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="ds-detail-profile">
              <div className="ds-avatar">
                <UserRound size={27} />
              </div>
              <div>
                <strong>{selectedStudent.nama}</strong>
                <span>{selectedStudent.nis || "NIS belum diisi"}</span>
              </div>
            </div>

            <div className="ds-detail-grid">
              <div><span>NIS</span><strong>{selectedStudent.nis || "-"}</strong></div>
              <div><span>NISN</span><strong>{selectedStudent.nisn || "-"}</strong></div>
              <div><span>Jenis Kelamin</span><strong>{selectedStudent.jenisKelamin || "-"}</strong></div>
              <div><span>Tempat Lahir</span><strong>{selectedStudent.tempatLahir || "-"}</strong></div>
              <div><span>Tanggal Lahir</span><strong>{selectedStudent.tanggalLahir || "-"}</strong></div>
              <div><span>Status</span><strong>{selectedStudent.status}</strong></div>
              <div className="ds-detail-full"><span>Alamat</span><strong>{selectedStudent.alamat || "-"}</strong></div>
              <div><span>Orang Tua/Wali</span><strong>{selectedStudent.namaOrangTua || "-"}</strong></div>
              <div><span>No. HP Orang Tua/Wali</span><strong>{selectedStudent.noHpOrangTua || "-"}</strong></div>
              <div><span>Sumber Data</span><strong>{selectedStudent.sumber || "Manual"}</strong></div>
            </div>

            <div className="ds-modal-footer">
              <button
                className="ds-secondary-btn"
                onClick={closeModal}
              >
                Tutup
              </button>
              <button
                className="ds-primary-btn"
                onClick={() => openEdit(selectedStudent)}
              >
                <Pencil size={16} />
                Edit Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
