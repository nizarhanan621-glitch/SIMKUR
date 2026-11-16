
import { useEffect, useMemo, useState } from "react";
import {
  getSekolahAktifWakasek,
  getDataGuruSekolah,
  simpanDataGuruSekolah,
  migrasikanDataGuruSekolah,
} from "../services/guruRepository";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Pencil,
  Eye,
  X,
  Save,
  GraduationCap,
  UserCheck,
  UserX,
  Database,
  Plus,
  RotateCcw,
} from "lucide-react";
import ImportDataGuruModal from "./ImportDataGuruModal";
import "../styles/DataGuruPage.css";

const STORAGE_KEY = "simkur_data_guru";

const initialForm = {
  nama: "",
  nip: "",
  nuptk: "",
  jenisKelamin: "",
  statusKepegawaian: "",
  jenisPTK: "",
  pendidikan: "",
  mataPelajaran: "",
};

const normalizeText = (value) =>
  String(value ?? "").trim();

const normalizeIdentity = (value) =>
  normalizeText(value).replace(/\s+/g, "").toUpperCase();

const getTeacherSource = (teacher) =>
  teacher.sumber || "Manual";

const getTeacherStatus = (teacher) =>
  teacher.status === "Nonaktif" ? "Nonaktif" : "Aktif";

function generateTeacherId(existingTeachers) {
  let id;

  do {
    const uniquePart =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

    id = `guru-${uniquePart}`;
  } while (existingTeachers.some((teacher) => teacher.id === id));

  return id;
}

function loadTeachers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      console.error("Format penyimpanan Data Guru tidak valid.");
      return [];
    }

    return parsed.filter(
      (teacher) =>
        teacher &&
        typeof teacher === "object" &&
        !Array.isArray(teacher)
    );
  } catch (error) {
    console.error("Gagal membaca Data Guru:", error);
    return [];
  }
}


function DataGuruPage({ userId }) {
  const [teachers, setTeachers] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [sourceFilter, setSourceFilter] = useState("Semua");

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const [sekolahId, setSekolahId] = useState("");
  const [memuatCloud, setMemuatCloud] = useState(true);
  const [cloudReady, setCloudReady] = useState(false);
  const [pesanCloud, setPesanCloud] = useState("");

  // Mengambil data Guru dari sekolah aktif.
  useEffect(() => {
    let masihAktif = true;

    async function muatDataGuruCloud() {
      setMemuatCloud(true);
      setCloudReady(false);
      setPesanCloud("");
      setTeachers([]);

      if (!userId) {
        setPesanCloud("Identitas akun tidak ditemukan.");
        setMemuatCloud(false);
        return;
      }

      try {
        const sid = await getSekolahAktifWakasek(userId);
        if (!masihAktif) return;

        setSekolahId(sid);

        const dataCloud = await getDataGuruSekolah(sid);
        if (!masihAktif) return;

        // Data lokal dicadangkan sebelum proses migrasi.
        const dataLokal = loadTeachers();

        if (dataLokal.length > 0) {
          try {
            const backupKey = "simkur_data_guru_backup_legacy";

            if (!localStorage.getItem(backupKey)) {
              localStorage.setItem(
                backupKey,
                JSON.stringify(dataLokal)
              );
            }
          } catch (backupError) {
            console.error("Pencadangan lokal gagal:", backupError);
          }
        }

        const idCloud = new Set(
          dataCloud.map((guru) => String(guru.id))
        );

        const idLokal = new Set();
        const dataBelumAda = [];

        for (const guru of dataLokal) {
          const id = String(guru?.id || "").trim();
          const nama = String(guru?.nama || "").trim();

          if (!id || !nama || idCloud.has(id) || idLokal.has(id)) {
            continue;
          }

          idLokal.add(id);
          dataBelumAda.push(guru);
        }

        if (dataBelumAda.length > 0) {
          const setuju = window.confirm(
            `Ditemukan ${dataBelumAda.length} data Guru lokal yang belum ada di database sekolah aktif.\n\n` +
            `Pastikan seluruh data lokal tersebut benar-benar milik sekolah ini sebelum migrasi.\n\n` +
            `Data cloud yang sudah ada tidak akan ditimpa. Data lokal juga tidak dihapus.\n\n` +
            `Migrasikan sekarang?`
          );

          if (setuju) {
            const hasil = await migrasikanDataGuruSekolah({
              sekolahId: sid,
              userId,
              guruLokal: dataLokal,
            });

            if (!masihAktif) return;

            setTeachers(hasil.data);

            setPesanCloud(
              `Migrasi selesai: ${hasil.berhasil} data ditambahkan, ` +
              `${hasil.dilewati} dilewati, ${hasil.tidakValid} tidak valid, ` +
              `${hasil.gagal.length} gagal.`
            );
          } else {
            setTeachers(dataCloud);
            setPesanCloud(
              "Data lokal tetap disimpan sebagai cadangan. Data yang ditampilkan berasal dari cloud."
            );
          }
        } else {
          setTeachers(dataCloud);
        }

        setCloudReady(true);
      } catch (error) {
        console.error("Gagal memuat Data Guru cloud:", error);
        if (masihAktif) {
          setTeachers([]);
          setPesanCloud(error.message);
          setCloudReady(false);
        }
      } finally {
        if (masihAktif) {
          setMemuatCloud(false);
        }
      }
    }

    muatDataGuruCloud();

    return () => {
      masihAktif = false;
    };
  }, [userId]);

  const selectedTeacher = useMemo(
    () =>
      teachers.find(
        (teacher) => teacher.id === selectedTeacherId
      ) || null,
    [teachers, selectedTeacherId]
  );

  // Perubahan hanya dianggap berhasil setelah tersimpan di cloud.
  const persistTeachers = async (updated) => {
    if (!cloudReady || !sekolahId || !userId) {
      alert("Data cloud belum siap. Perubahan belum disimpan.");
      return false;
    }

    const dataSebelumnya = new Map(
      teachers.map((guru) => [
        String(guru.id),
        JSON.stringify(guru),
      ])
    );

    const dataBerubah = updated.filter(
      (guru) =>
        dataSebelumnya.get(String(guru.id)) !==
        JSON.stringify(guru)
    );

    try {
      for (const guru of dataBerubah) {
        await simpanDataGuruSekolah({
          sekolahId,
          userId,
          guru,
        });
      }

      setTeachers(updated);

      // LocalStorage hanya menjadi cache kompatibilitas.
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(updated)
        );
      } catch (cacheError) {
        console.warn("Cache lokal tidak berhasil diperbarui:", cacheError);
      }

      window.dispatchEvent(
        new Event("simkur_guru_updated")
      );

      return true;
    } catch (error) {
      console.error("Gagal menyimpan Data Guru:", error);

      // Muat ulang kondisi sebenarnya dari cloud.
      try {
        const dataTerbaru = await getDataGuruSekolah(sekolahId);
        setTeachers(dataTerbaru);
      } catch (reloadError) {
        console.error("Gagal memuat ulang data cloud:", reloadError);
      }

      alert(
        "Penyimpanan Data Guru gagal atau belum seluruhnya selesai. " +
        "Data terbaru telah dimuat ulang dari cloud. Periksa koneksi dan coba kembali.\n\n" +
        error.message
      );

      return false;
    }
  };

  const handleImportTeachers = async (rows) => {
    if (!cloudReady || !sekolahId || !userId) {
      throw new Error(
        "Data sekolah belum siap. Muat ulang halaman dan coba kembali."
      );
    }

    const imported = [];
    const now = new Date().toISOString();

    for (const row of rows) {
      imported.push({
        ...row,
        id: generateTeacherId([...teachers, ...imported]),
        status: "Aktif",
        sumber: "Impor",
        createdAt: now,
        updatedAt: now,
      });
    }

    const success = await persistTeachers([
      ...teachers,
      ...imported,
    ]);

    if (!success) {
      throw new Error(
        "Penyimpanan data Guru gagal. Periksa koneksi dan coba kembali."
      );
    }
  };

  const filteredTeachers = useMemo(() => {
    const keyword = normalizeText(search).toLowerCase();

    return teachers.filter((teacher) => {
      const nama = normalizeText(teacher.nama).toLowerCase();
      const nip = normalizeText(teacher.nip).toLowerCase();
      const nuptk = normalizeText(teacher.nuptk).toLowerCase();
      const mapel = normalizeText(teacher.mataPelajaran).toLowerCase();

      const matchesSearch =
        nama.includes(keyword) ||
        nip.includes(keyword) ||
        nuptk.includes(keyword) ||
        mapel.includes(keyword);

      const matchesStatus =
        statusFilter === "Semua" ||
        getTeacherStatus(teacher) === statusFilter;

      const matchesSource =
        sourceFilter === "Semua" ||
        getTeacherSource(teacher) === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [teachers, search, statusFilter, sourceFilter]);

  const activeCount = teachers.filter(
    (teacher) => getTeacherStatus(teacher) === "Aktif"
  ).length;

  const inactiveCount = teachers.length - activeCount;

  const manualCount = teachers.filter(
    (teacher) => getTeacherSource(teacher) === "Manual"
  ).length;

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...initialForm });
    setModalOpen(true);
  };

  const openEditModal = (teacher) => {
    if (!teacher?.id) {
      alert("Identitas guru tidak valid. Data tidak dapat diedit.");
      return;
    }

    setEditingId(teacher.id);

    setForm({
      nama: teacher.nama || "",
      nip: teacher.nip || "",
      nuptk: teacher.nuptk || "",
      jenisKelamin: teacher.jenisKelamin || "",
      statusKepegawaian: teacher.statusKepegawaian || "",
      jenisPTK: teacher.jenisPTK || "",
      pendidikan: teacher.pendidikan || "",
      mataPelajaran: teacher.mataPelajaran || "",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...initialForm });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const cleanForm = {
      nama: normalizeText(form.nama),
      nip: normalizeText(form.nip),
      nuptk: normalizeText(form.nuptk),
      jenisKelamin: normalizeText(form.jenisKelamin),
      statusKepegawaian: normalizeText(form.statusKepegawaian),
      jenisPTK: normalizeText(form.jenisPTK),
      pendidikan: normalizeText(form.pendidikan),
      mataPelajaran: normalizeText(form.mataPelajaran),
    };

    if (!cleanForm.nama) {
      alert("Nama lengkap guru wajib diisi.");
      return;
    }

    const duplicateNip =
      cleanForm.nip &&
      teachers.some(
        (teacher) =>
          normalizeIdentity(teacher.nip) ===
            normalizeIdentity(cleanForm.nip) &&
          teacher.id !== editingId
      );

    if (duplicateNip) {
      alert("NIP tersebut sudah terdaftar pada guru lain.");
      return;
    }

    const duplicateNuptk =
      cleanForm.nuptk &&
      teachers.some(
        (teacher) =>
          normalizeIdentity(teacher.nuptk) ===
            normalizeIdentity(cleanForm.nuptk) &&
          teacher.id !== editingId
      );

    if (duplicateNuptk) {
      alert("NUPTK tersebut sudah terdaftar pada guru lain.");
      return;
    }

    setSaving(true);

    try {
      let updated;

      if (editingId) {
        const existingTeacher = teachers.find(
          (teacher) => teacher.id === editingId
        );

        if (!existingTeacher) {
          alert(
            "Data guru yang akan diedit tidak ditemukan. Silakan muat ulang halaman."
          );
          return;
        }

        updated = teachers.map((teacher) =>
          teacher.id === editingId
            ? {
                ...teacher,
                ...cleanForm,
                id: teacher.id,
                sumber: getTeacherSource(teacher),
                status: getTeacherStatus(teacher),
                createdAt: teacher.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : teacher
        );
      } else {
        const newTeacher = {
          id: generateTeacherId(teachers),
          ...cleanForm,
          status: "Aktif",
          sumber: "Manual",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        updated = [...teachers, newTeacher];
      }

      const success = await persistTeachers(updated);

      if (success) {
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (teacher) => {
    if (!teacher?.id) {
      alert("Identitas guru tidak valid.");
      return;
    }

    const currentStatus = getTeacherStatus(teacher);
    const nextStatus =
      currentStatus === "Aktif" ? "Nonaktif" : "Aktif";

    const message =
      nextStatus === "Nonaktif"
        ? `Nonaktifkan guru ${teacher.nama}?\n\nData guru tidak akan dihapus. Riwayat dan ID guru tetap disimpan.`
        : `Aktifkan kembali guru ${teacher.nama}?\n\nData dan ID guru akan tetap menggunakan data sebelumnya.`;

    if (!window.confirm(message)) return;

    const updated = teachers.map((item) =>
      item.id === teacher.id
        ? {
            ...item,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    await persistTeachers(updated);
  };

  const openDetail = (teacher) => {
    if (!teacher?.id) {
      alert("Identitas guru tidak valid.");
      return;
    }

    setSelectedTeacherId(teacher.id);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedTeacherId(null);
  };

  const handleEditFromDetail = () => {
    if (!selectedTeacher) return;

    const teacher = selectedTeacher;

    closeDetail();
    openEditModal(teacher);
  };

  return (
    <div className="data-guru-page">
      <div className="data-guru-heading">
        <div>
          <div className="data-guru-breadcrumb">
            Operator Sekolah <span>/</span> Data Guru
          </div>

          <h1>Data Guru</h1>

          <p>
            Kelola identitas dan informasi kepegawaian guru di sekolah.
          </p>
        </div>

        <button
  type="button"
  className="dg-secondary-button"
  onClick={() => setImportOpen(true)}
  disabled={!cloudReady}
>
  <Database size={17} />
  Impor Excel/CSV
</button>

<button
  type="button"
  className="dg-primary-button"
  onClick={openAddModal}
>
  <UserPlus size={18} />
  Tambah Guru
</button>
      </div>

      <div className="dg-info-banner">
        <Database size={20} />

        <div>
          <strong>Pengelolaan Data Guru</strong>

          <p>
            Data saat ini tersimpan di perangkat ini. Data guru yang
            dinonaktifkan tetap dipertahankan agar riwayat dan relasi
            antarmodul tidak hilang. Integrasi Dapodik disiapkan pada
            tahap berikutnya.
          </p>
        </div>
      </div>

      <div className="dg-stat-grid">
        <div className="dg-stat-card">
          <div className="dg-stat-icon blue">
            <Users size={22} />
          </div>

          <div>
            <span>Total Guru</span>
            <strong>{teachers.length}</strong>
            <small>Seluruh data guru</small>
          </div>
        </div>

        <div className="dg-stat-card">
          <div className="dg-stat-icon green">
            <UserCheck size={22} />
          </div>

          <div>
            <span>Guru Aktif</span>
            <strong>{activeCount}</strong>
            <small>Berstatus aktif</small>
          </div>
        </div>

        <div className="dg-stat-card">
          <div className="dg-stat-icon orange">
            <UserX size={22} />
          </div>

          <div>
            <span>Guru Nonaktif</span>
            <strong>{inactiveCount}</strong>
            <small>Tidak dihapus dari sistem</small>
          </div>
        </div>

        <div className="dg-stat-card">
          <div className="dg-stat-icon purple">
            <GraduationCap size={22} />
          </div>

          <div>
            <span>Data Manual</span>
            <strong>{manualCount}</strong>
            <small>Input operator</small>
          </div>
        </div>
      </div>

      <div className="dg-table-card">
        <div className="dg-table-heading">
          <div>
            <h2>Daftar Guru</h2>
            <p>Daftar identitas guru yang tercatat dalam sistem.</p>
          </div>

          <span className="dg-total-label">
            {filteredTeachers.length} data ditampilkan
          </span>
        </div>

        <div className="dg-toolbar">
          <div className="dg-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Cari nama, NIP, NUPTK, atau mata pelajaran..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Hapus pencarian"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="dg-filter">
            <Filter size={17} />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="Impor">Impor</option>
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          <div className="dg-filter">
            <Database size={17} />

            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
            >
              <option value="Semua">Semua Sumber</option>
              <option value="Manual">Manual</option>
              <option value="Dapodik">Dapodik</option>
            </select>
          </div>
        </div>

        <div className="dg-table-wrapper">
          <table className="dg-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Guru</th>
                <th>NIP / NUPTK</th>
                <th>Jenis PTK</th>
                <th>Mata Pelajaran</th>
                <th>Status</th>
                <th>Sumber Data</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => (
                  <tr key={teacher.id || `guru-legacy-${index}`}>
                    <td>{index + 1}</td>

                    <td>
                      <div className="dg-teacher-name">
                        <div className="dg-avatar">
                          {teacher.nama?.charAt(0)?.toUpperCase() || "G"}
                        </div>

                        <div>
                          <strong>{teacher.nama || "Nama belum diisi"}</strong>

                          <small>
                            {teacher.jenisKelamin ||
                              "Jenis kelamin belum diisi"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="dg-identity">
                        <span>{teacher.nip || "-"}</span>
                        <small>NUPTK: {teacher.nuptk || "-"}</small>
                      </div>
                    </td>

                    <td>{teacher.jenisPTK || "-"}</td>

                    <td>{teacher.mataPelajaran || "-"}</td>

                    <td>
                      <span
                        className={`dg-status ${
                          getTeacherStatus(teacher) === "Aktif"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {getTeacherStatus(teacher)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`dg-source ${
                          getTeacherSource(teacher) === "Dapodik"
                            ? "dapodik"
                            : "manual"
                        }`}
                      >
                        {getTeacherSource(teacher)}
                      </span>
                    </td>

                    <td>
                      <div className="dg-actions">
                        <button
                          type="button"
                          title="Lihat detail"
                          aria-label={`Lihat detail ${teacher.nama || "guru"}`}
                          onClick={() => openDetail(teacher)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          title="Edit data"
                          aria-label={`Edit ${teacher.nama || "guru"}`}
                          onClick={() => openEditModal(teacher)}
                        >
                          <Pencil size={17} />
                        </button>

                        {getTeacherStatus(teacher) === "Aktif" ? (
                          <button
                            type="button"
                            className="delete"
                            title="Nonaktifkan guru"
                            aria-label={`Nonaktifkan ${teacher.nama || "guru"}`}
                            onClick={() => handleToggleStatus(teacher)}
                          >
                            <UserX size={17} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Aktifkan kembali guru"
                            aria-label={`Aktifkan ${teacher.nama || "guru"}`}
                            onClick={() => handleToggleStatus(teacher)}
                          >
                            <RotateCcw size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    <div className="dg-empty-state">
                      <div>
                        <Users size={30} />
                      </div>

                      <strong>
                        {teachers.length === 0
                          ? "Belum ada data guru"
                          : "Data guru tidak ditemukan"}
                      </strong>

                      <p>
                        {teachers.length === 0
                          ? "Silakan tambahkan data guru untuk mulai mengisi daftar."
                          : "Coba ubah kata kunci pencarian atau filter."}
                      </p>

                      {teachers.length === 0 && (
                        <button
                          type="button"
                          className="dg-primary-button"
                          onClick={openAddModal}
                        >
                          <Plus size={17} />
                          Tambah Guru Pertama
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="dg-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="dg-modal" role="dialog" aria-modal="true">
            <div className="dg-modal-header">
              <div>
                <h2>{editingId ? "Edit Data Guru" : "Tambah Data Guru"}</h2>
                <p>
                  Lengkapi informasi identitas dan kepegawaian guru.
                </p>
              </div>

              <button
                type="button"
                className="dg-close-button"
                onClick={closeModal}
                aria-label="Tutup formulir"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="dg-form-section">
                <h3>Identitas Guru</h3>

                <div className="dg-form-grid">
                  <label className="dg-field full">
                    Nama Lengkap <span>*</span>

                    <input
                      name="nama"
                      value={form.nama}
                      onChange={handleChange}
                      placeholder="Masukkan nama lengkap dan gelar"
                      required
                      maxLength={150}
                    />
                  </label>

                  <label className="dg-field">
                    NIP

                    <input
                      name="nip"
                      value={form.nip}
                      onChange={handleChange}
                      placeholder="Masukkan NIP"
                      maxLength={30}
                    />
                  </label>

                  <label className="dg-field">
                    NUPTK

                    <input
                      name="nuptk"
                      value={form.nuptk}
                      onChange={handleChange}
                      placeholder="Masukkan NUPTK"
                      maxLength={30}
                    />
                  </label>

                  <label className="dg-field">
                    Jenis Kelamin

                    <select
                      name="jenisKelamin"
                      value={form.jenisKelamin}
                      onChange={handleChange}
                    >
                      <option value="">Pilih jenis kelamin</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </label>

                  <label className="dg-field">
                    Status Kepegawaian

                    <select
                      name="statusKepegawaian"
                      value={form.statusKepegawaian}
                      onChange={handleChange}
                    >
                      <option value="">Pilih status kepegawaian</option>
                      <option value="PNS">PNS</option>
                      <option value="PPPK">PPPK</option>
                      <option value="PPPK Paruh Waktu">PPPK Paruh Waktu</option>
                      <option value="Guru Tetap Yayasan">
                        Guru Tetap Yayasan
                      </option>
                      <option value="Guru Tidak Tetap">
                        Guru Tidak Tetap
                      </option>
                      <option value="Honorer">Honorer</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </label>

                  <label className="dg-field">
                    Jenis PTK

                    <select
                      name="jenisPTK"
                      value={form.jenisPTK}
                      onChange={handleChange}
                    >
                      <option value="">Pilih jenis PTK</option>
                      <option value="Guru Mapel">Guru Mapel</option>
                      <option value="Guru Kelas">Guru Kelas</option>
                      <option value="Guru BK">Guru BK</option>
                      <option value="Kepala Sekolah">Kepala Sekolah</option>
                      <option value="Wakil Kepala Sekolah">
                        Wakil Kepala Sekolah
                      </option>
                      <option value="Tenaga Kependidikan">
                        Tenaga Kependidikan
                      </option>
                    </select>
                  </label>

                  <label className="dg-field">
                    Pendidikan Terakhir

                    <select
                      name="pendidikan"
                      value={form.pendidikan}
                      onChange={handleChange}
                    >
                      <option value="">Pilih pendidikan</option>
                      <option value="SMA / SMK">SMA / SMK</option>
                      <option value="D1">D1</option>
                      <option value="D2">D2</option>
                      <option value="D3">D3</option>
                      <option value="D4">D4</option>
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                    </select>
                  </label>

                  <label className="dg-field">
                    Mata Pelajaran

                    <input
                      name="mataPelajaran"
                      value={form.mataPelajaran}
                      onChange={handleChange}
                      placeholder="Contoh: Matematika"
                      maxLength={100}
                    />
                  </label>
                </div>
              </div>

              <div className="dg-form-note">
                <strong>Catatan:</strong> Data baru akan diberi sumber
                Manual. Sumber data guru yang sudah ada, termasuk Dapodik,
                tidak akan berubah ketika diedit. Status aktif/nonaktif
                dikelola melalui daftar guru agar perubahan status lebih
                terkontrol.
              </div>

              <div className="dg-modal-footer">
                <button
                  type="button"
                  className="dg-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="dg-primary-button"
                  disabled={saving}
                >
                  <Save size={17} />
                  {saving
                    ? "Menyimpan..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Simpan Data Guru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importOpen && (
  <ImportDataGuruModal
    existingTeachers={teachers}
    onImport={handleImportTeachers}
    onClose={() => setImportOpen(false)}
  />
)}

      {detailOpen && selectedTeacher && (
        <div
          className="dg-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetail();
          }}
        >
          <div
            className="dg-modal dg-detail-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="dg-modal-header">
              <div>
                <h2>Detail Data Guru</h2>
                <p>Informasi lengkap guru yang dipilih.</p>
              </div>

              <button
                type="button"
                className="dg-close-button"
                onClick={closeDetail}
                aria-label="Tutup detail"
              >
                <X size={20} />
              </button>
            </div>

            <div className="dg-detail-profile">
              <div className="dg-detail-avatar">
                {selectedTeacher.nama?.charAt(0)?.toUpperCase() || "G"}
              </div>

              <div>
                <h3>{selectedTeacher.nama || "Nama belum diisi"}</h3>
                <span>
                  {selectedTeacher.jenisPTK || "Jenis PTK belum diisi"}
                </span>
              </div>
            </div>

            <div className="dg-detail-grid">
              {[
                ["ID SIMKUR", selectedTeacher.id],
                ["NIP", selectedTeacher.nip],
                ["NUPTK", selectedTeacher.nuptk],
                ["Jenis Kelamin", selectedTeacher.jenisKelamin],
                ["Status Kepegawaian", selectedTeacher.statusKepegawaian],
                ["Pendidikan Terakhir", selectedTeacher.pendidikan],
                ["Mata Pelajaran", selectedTeacher.mataPelajaran],
                ["Status Guru", getTeacherStatus(selectedTeacher)],
                ["Sumber Data", getTeacherSource(selectedTeacher)],
                ["Dibuat Pada", selectedTeacher.createdAt],
                ["Diperbarui Pada", selectedTeacher.updatedAt],
              ].map(([label, value]) => (
                <div className="dg-detail-item" key={label}>
                  <span>{label}</span>
                  <strong>{value || "-"}</strong>
                </div>
              ))}
            </div>

            <div className="dg-modal-footer">
              <button
                type="button"
                className="dg-secondary-button"
                onClick={closeDetail}
              >
                Tutup
              </button>

              <button
                type="button"
                className="dg-primary-button"
                onClick={handleEditFromDetail}
              >
                <Pencil size={17} />
                Edit Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataGuruPage;
