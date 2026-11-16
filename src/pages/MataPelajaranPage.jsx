
import { useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Pencil,
  Eye,
  Trash2,
  X,
  Save,
  Layers3,
  CheckCircle2,
  XCircle,
  GraduationCap,
  BookMarked,
} from "lucide-react";

import "../styles/MataPelajaranPage.css";

const STORAGE_KEY = "simkur_data_mata_pelajaran";

const initialForm = {
  kode: "",
  nama: "",
  kelompok: "Umum",
  tingkat: ["VII", "VIII", "IX"],
  kurikulum: "Merdeka",
  status: "Aktif",
  keterangan: "",
};

const kelompokOptions = [
  "Umum",
  "Muatan Lokal",
  "Pilihan",
  "Kekhasan Sekolah",
];

const tingkatOptions = ["VII", "VIII", "IX"];

const loadData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

function MataPelajaranPage() {
  const [subjects, setSubjects] = useState(loadData);
  const [search, setSearch] = useState("");
  const [filterKelompok, setFilterKelompok] = useState("Semua");
  const [filterTingkat, setFilterTingkat] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSubjects(data);
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter((item) => {
      const keyword = search.toLowerCase();

      const matchSearch =
        (item.nama || "").toLowerCase().includes(keyword) ||
        (item.kode || "").toLowerCase().includes(keyword) ||
        (item.kelompok || "").toLowerCase().includes(keyword);

      const matchKelompok =
        filterKelompok === "Semua" ||
        item.kelompok === filterKelompok;

      const matchTingkat =
        filterTingkat === "Semua" ||
        (item.tingkat || []).includes(filterTingkat);

      const matchStatus =
        filterStatus === "Semua" ||
        item.status === filterStatus;

      return (
        matchSearch &&
        matchKelompok &&
        matchTingkat &&
        matchStatus
      );
    });
  }, [
    subjects,
    search,
    filterKelompok,
    filterTingkat,
    filterStatus,
  ]);

  const stats = useMemo(() => {
    return {
      total: subjects.length,
      aktif: subjects.filter((item) => item.status === "Aktif").length,
      nonaktif: subjects.filter((item) => item.status === "Nonaktif").length,
      manual: subjects.filter((item) => item.perubahanManual).length,
    };
  }, [subjects]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setForm({
      kode: item.kode || "",
      nama: item.nama || "",
      kelompok: item.kelompok || "Umum",
      tingkat: item.tingkat || ["VII", "VIII", "IX"],
      kurikulum: item.kurikulum || "Merdeka",
      status: item.status || "Aktif",
      keterangan: item.keterangan || "",
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
    setError("");
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleTingkat = (tingkat) => {
    setForm((prev) => {
      const selected = prev.tingkat.includes(tingkat);

      return {
        ...prev,
        tingkat: selected
          ? prev.tingkat.filter((item) => item !== tingkat)
          : [...prev.tingkat, tingkat].sort(
              (a, b) =>
                tingkatOptions.indexOf(a) -
                tingkatOptions.indexOf(b)
            ),
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const kode = form.kode.trim().toUpperCase();
    const nama = form.nama.trim();

    if (!kode || !nama) {
      setError("Kode dan nama mata pelajaran wajib diisi.");
      return;
    }

    if (form.tingkat.length === 0) {
      setError("Pilih minimal satu tingkat kelas.");
      return;
    }

    const duplicate = subjects.some(
      (item) =>
        item.id !== editingId &&
        (
          (item.kode || "").toLowerCase() === kode.toLowerCase() ||
          (
            (item.nama || "").toLowerCase() === nama.toLowerCase() &&
            item.kurikulum === form.kurikulum
          )
        )
    );

    if (duplicate) {
      setError(
        "Kode atau nama mata pelajaran sudah terdaftar pada kurikulum tersebut."
      );
      return;
    }

    if (editingId) {
      const updated = subjects.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ...form,
              kode,
              nama,
              sumber: item.sumber || "Manual",
              perubahanManual: true,
              updatedAt: new Date().toISOString(),
            }
          : item
      );

      saveData(updated);
    } else {
      const newSubject = {
        id: `mapel-${Date.now()}`,
        ...form,
        kode,
        nama,
        sumber: "Manual",
        perubahanManual: true,
        createdAt: new Date().toISOString(),
      };

      saveData([...subjects, newSubject]);
    }

    closeForm();
  };

  const openDetail = (item) => {
    setSelectedSubject(item);
    setShowDetail(true);
  };

  const handleDelete = (item) => {
    const confirmed = window.confirm(
      `Hapus mata pelajaran "${item.nama}"? Data yang dihapus tidak dapat dikembalikan.`
    );

    if (!confirmed) return;

    saveData(subjects.filter((subject) => subject.id !== item.id));
  };

  const toggleStatus = (item) => {
    const newStatus =
      item.status === "Aktif" ? "Nonaktif" : "Aktif";

    const updated = subjects.map((subject) =>
      subject.id === item.id
        ? {
            ...subject,
            status: newStatus,
            perubahanManual: true,
            updatedAt: new Date().toISOString(),
          }
        : subject
    );

    saveData(updated);
  };

  const formatTanggal = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="mp-page">
      <div className="mp-page-header">
        <div>
          <div className="mp-breadcrumb">
            Operator Sekolah <span>/</span> Data Akademik <span>/</span> Mata Pelajaran
          </div>

          <h1>Data Mata Pelajaran</h1>

          <p>
            Kelola daftar mata pelajaran yang digunakan dalam kegiatan
            pembelajaran sekolah.
          </p>
        </div>

        <button className="mp-primary-button" onClick={openAddForm}>
          <Plus size={18} />
          Tambah Mata Pelajaran
        </button>
      </div>

      <div className="mp-stats-grid">
        <div className="mp-stat-card">
          <div className="mp-stat-icon blue">
            <BookOpen size={22} />
          </div>
          <div>
            <span>Total Mata Pelajaran</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="mp-stat-card">
          <div className="mp-stat-icon green">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span>Mata Pelajaran Aktif</span>
            <strong>{stats.aktif}</strong>
          </div>
        </div>

        <div className="mp-stat-card">
          <div className="mp-stat-icon orange">
            <XCircle size={22} />
          </div>
          <div>
            <span>Mata Pelajaran Nonaktif</span>
            <strong>{stats.nonaktif}</strong>
          </div>
        </div>

        <div className="mp-stat-card">
          <div className="mp-stat-icon purple">
            <Layers3 size={22} />
          </div>
          <div>
            <span>Perubahan Manual</span>
            <strong>{stats.manual}</strong>
          </div>
        </div>
      </div>

      <div className="mp-content-card">
        <div className="mp-toolbar">
          <div className="mp-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari kode atau nama mata pelajaran..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} title="Hapus pencarian">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mp-filter-label">
            <Filter size={17} />
            Filter Data
          </div>

          <select
            value={filterKelompok}
            onChange={(event) => setFilterKelompok(event.target.value)}
          >
            <option value="Semua">Semua Kelompok</option>
            {kelompokOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={filterTingkat}
            onChange={(event) => setFilterTingkat(event.target.value)}
          >
            <option value="Semua">Semua Tingkat</option>
            {tingkatOptions.map((item) => (
              <option key={item} value={item}>
                Kelas {item}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        <div className="mp-table-info">
          <div>
            <BookMarked size={17} />
            <strong>Daftar Mata Pelajaran</strong>
          </div>
          <span>
            Menampilkan {filteredSubjects.length} dari {subjects.length} data
          </span>
        </div>

        <div className="mp-table-wrapper">
          <table className="mp-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Kode</th>
                <th>Nama Mata Pelajaran</th>
                <th>Kelompok</th>
                <th>Tingkat</th>
                <th>Kurikulum</th>
                <th>Sumber</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="mp-code">{item.kode}</span>
                    </td>
                    <td>
                      <strong className="mp-subject-name">
                        {item.nama}
                      </strong>
                    </td>
                    <td>{item.kelompok}</td>
                    <td>
                      <div className="mp-grade-list">
                        {(item.tingkat || []).map((grade) => (
                          <span key={grade}>{grade}</span>
                        ))}
                      </div>
                    </td>
                    <td>{item.kurikulum}</td>
                    <td>
                      <span className="mp-source">
                        {item.sumber || "Manual"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`mp-status ${
                          item.status === "Aktif" ? "active" : "inactive"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="mp-action-buttons">
                        <button
                          title="Lihat detail"
                          onClick={() => openDetail(item)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          title="Edit"
                          onClick={() => openEditForm(item)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          title={
                            item.status === "Aktif"
                              ? "Nonaktifkan"
                              : "Aktifkan"
                          }
                          onClick={() => toggleStatus(item)}
                        >
                          {item.status === "Aktif" ? (
                            <XCircle size={17} />
                          ) : (
                            <CheckCircle2 size={17} />
                          )}
                        </button>

                        <button
                          className="delete"
                          title="Hapus"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">
                    <div className="mp-empty-state">
                      <BookOpen size={38} />
                      <strong>Belum ada data mata pelajaran</strong>
                      <span>
                        Tambahkan mata pelajaran atau ubah filter pencarian.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mp-table-footer">
          <span>
            <GraduationCap size={17} />
            Data mata pelajaran sekolah
          </span>
          <span>SIMKUR SMP</span>
        </div>
      </div>

      {showForm && (
        <div className="mp-modal-backdrop" onMouseDown={closeForm}>
          <div
            className="mp-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mp-modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit Mata Pelajaran"
                    : "Tambah Mata Pelajaran"}
                </h2>
                <p>Lengkapi informasi mata pelajaran berikut.</p>
              </div>

              <button onClick={closeForm} title="Tutup">
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mp-modal-body">
                {error && (
                  <div className="mp-error-message">
                    {error}
                  </div>
                )}

                <div className="mp-form-grid">
                  <div className="mp-form-group">
                    <label>
                      Kode Mata Pelajaran <span>*</span>
                    </label>
                    <input
                      value={form.kode}
                      onChange={(event) =>
                        handleChange("kode", event.target.value)
                      }
                      placeholder="Contoh: IPA"
                      required
                    />
                  </div>

                  <div className="mp-form-group">
                    <label>
                      Nama Mata Pelajaran <span>*</span>
                    </label>
                    <input
                      value={form.nama}
                      onChange={(event) =>
                        handleChange("nama", event.target.value)
                      }
                      placeholder="Contoh: Ilmu Pengetahuan Alam"
                      required
                    />
                  </div>

                  <div className="mp-form-group">
                    <label>Kelompok Mata Pelajaran</label>
                    <select
                      value={form.kelompok}
                      onChange={(event) =>
                        handleChange("kelompok", event.target.value)
                      }
                    >
                      {kelompokOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mp-form-group">
                    <label>Kurikulum</label>
                    <select
                      value={form.kurikulum}
                      onChange={(event) =>
                        handleChange("kurikulum", event.target.value)
                      }
                    >
                      <option value="Merdeka">Kurikulum Merdeka</option>
                      <option value="K13">Kurikulum 2013</option>
                    </select>
                  </div>

                  <div className="mp-form-group mp-full-width">
                    <label>
                      Tingkat Kelas <span>*</span>
                    </label>
                    <div className="mp-grade-options">
                      {tingkatOptions.map((item) => (
                        <label key={item}>
                          <input
                            type="checkbox"
                            checked={form.tingkat.includes(item)}
                            onChange={() => toggleTingkat(item)}
                          />
                          <span>Kelas {item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mp-form-group">
                    <label>Status</label>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        handleChange("status", event.target.value)
                      }
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>

                  <div className="mp-form-group mp-full-width">
                    <label>Keterangan</label>
                    <textarea
                      value={form.keterangan}
                      onChange={(event) =>
                        handleChange("keterangan", event.target.value)
                      }
                      placeholder="Tambahkan keterangan jika diperlukan..."
                      rows="3"
                    />
                  </div>
                </div>

                <div className="mp-form-note">
                  <strong>Informasi:</strong> Data yang ditambahkan atau
                  diubah secara manual akan diberi penanda perubahan manual
                  untuk persiapan sinkronisasi Dapodik.
                </div>
              </div>

              <div className="mp-modal-footer">
                <button
                  type="button"
                  className="mp-secondary-button"
                  onClick={closeForm}
                >
                  Batal
                </button>

                <button type="submit" className="mp-primary-button">
                  <Save size={17} />
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && selectedSubject && (
        <div
          className="mp-modal-backdrop"
          onMouseDown={() => setShowDetail(false)}
        >
          <div
            className="mp-detail-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mp-modal-header">
              <div>
                <h2>Detail Mata Pelajaran</h2>
                <p>Informasi lengkap data mata pelajaran.</p>
              </div>

              <button onClick={() => setShowDetail(false)}>
                <X size={21} />
              </button>
            </div>

            <div className="mp-detail-body">
              <div className="mp-detail-title">
                <div className="mp-detail-icon">
                  <BookOpen size={26} />
                </div>
                <div>
                  <h3>{selectedSubject.nama}</h3>
                  <span>{selectedSubject.kode}</span>
                </div>
              </div>

              <div className="mp-detail-grid">
                <div>
                  <span>Kelompok</span>
                  <strong>{selectedSubject.kelompok}</strong>
                </div>

                <div>
                  <span>Kurikulum</span>
                  <strong>{selectedSubject.kurikulum}</strong>
                </div>

                <div>
                  <span>Tingkat Kelas</span>
                  <strong>
                    {(selectedSubject.tingkat || []).join(", ") || "-"}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{selectedSubject.status}</strong>
                </div>

                <div>
                  <span>Sumber Data</span>
                  <strong>{selectedSubject.sumber || "Manual"}</strong>
                </div>

                <div>
                  <span>Tanggal Dibuat</span>
                  <strong>
                    {formatTanggal(selectedSubject.createdAt)}
                  </strong>
                </div>

                <div className="mp-detail-full">
                  <span>Keterangan</span>
                  <strong>
                    {selectedSubject.keterangan || "-"}
                  </strong>
                </div>
              </div>

              {selectedSubject.perubahanManual && (
                <div className="mp-form-note">
                  Data ini memiliki penanda perubahan manual.
                </div>
              )}
            </div>

            <div className="mp-modal-footer">
              <button
                className="mp-secondary-button"
                onClick={() => setShowDetail(false)}
              >
                Tutup
              </button>

              <button
                className="mp-primary-button"
                onClick={() => {
                  setShowDetail(false);
                  openEditForm(selectedSubject);
                }}
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

export default MataPelajaranPage;
