
import { useMemo, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Pencil,
  Eye,
  X,
  Save,
  GraduationCap,
  UserCheck,
  UserX,
  School,
  RefreshCw,
} from "lucide-react";

import "../styles/RombelPage.css";

const ROMBEL_KEY = "simkur_data_rombel";
const GURU_KEY = "simkur_data_guru";

const initialForm = {
  namaRombel: "",
  tingkat: "VII",
  tahunAjaran: "2026/2027",
  kurikulum: "Merdeka",
  waliKelasId: "",
};

function loadData(key) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function RombelPage() {
  const [rombels, setRombels] = useState(loadData(ROMBEL_KEY));
  const [teachers] = useState(loadData(GURU_KEY));

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Aktif");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRombel, setSelectedRombel] = useState(null);
  const [form, setForm] = useState(initialForm);

  const persistRombels = (updated) => {
    setRombels(updated);
    localStorage.setItem(ROMBEL_KEY, JSON.stringify(updated));
  };

  const activeRombels = rombels.filter(
    (item) => item.status === "Aktif"
  );

  const inactiveRombels = rombels.filter(
    (item) => item.status === "Nonaktif"
  );

  const filteredRombels = useMemo(() => {
    return rombels.filter((item) => {
      const keyword = search.toLowerCase();

      const teacher = teachers.find(
        (guru) => guru.id === item.waliKelasId
      );

      const matchesSearch =
        item.namaRombel?.toLowerCase().includes(keyword) ||
        item.tingkat?.toLowerCase().includes(keyword) ||
        teacher?.nama?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "Semua" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rombels, teachers, search, statusFilter]);

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find((item) => item.id === teacherId);
    return teacher?.nama || "Belum ditentukan";
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (rombel) => {
    setEditingId(rombel.id);
    setForm({
      namaRombel: rombel.namaRombel || "",
      tingkat: rombel.tingkat || "VII",
      tahunAjaran: rombel.tahunAjaran || "2026/2027",
      kurikulum: rombel.kurikulum || "Merdeka",
      waliKelasId: rombel.waliKelasId || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const duplicate = rombels.some(
      (item) =>
        item.namaRombel.toLowerCase() ===
          form.namaRombel.trim().toLowerCase() &&
        item.tingkat === form.tingkat &&
        item.tahunAjaran === form.tahunAjaran &&
        item.id !== editingId
    );

    if (duplicate) {
      alert("Nama rombongan belajar tersebut sudah terdaftar pada tingkat dan tahun ajaran yang sama.");
      return;
    }

    if (editingId) {
      const updated = rombels.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ...form,
              namaRombel: form.namaRombel.trim(),
              sumber: item.sumber || "Manual",
              perubahanManual: true,
              updatedAt: new Date().toISOString(),
            }
          : item
      );

      persistRombels(updated);
    } else {
      const newRombel = {
        id: `rombel-${Date.now()}`,
        ...form,
        namaRombel: form.namaRombel.trim(),
        status: "Aktif",
        sumber: "Manual",
        perubahanManual: true,
        createdAt: new Date().toISOString(),
      };

      persistRombels([...rombels, newRombel]);
    }

    closeModal();
  };

  const handleDeactivate = (rombel) => {
    const confirmed = window.confirm(
      `Nonaktifkan rombel ${rombel.namaRombel}?\n\nData rombel tidak akan dihapus permanen.`
    );

    if (!confirmed) return;

    persistRombels(
      rombels.map((item) =>
        item.id === rombel.id
          ? {
              ...item,
              status: "Nonaktif",
              perubahanManual: true,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleActivate = (rombel) => {
    const confirmed = window.confirm(
      `Aktifkan kembali rombel ${rombel.namaRombel}?`
    );

    if (!confirmed) return;

    persistRombels(
      rombels.map((item) =>
        item.id === rombel.id
          ? {
              ...item,
              status: "Aktif",
              perubahanManual: true,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const openDetail = (rombel) => {
    setSelectedRombel(rombel);
    setDetailOpen(true);
  };

  return (
    <div className="rombel-page">
      <div className="rombel-heading">
        <div>
          <div className="rombel-breadcrumb">
            Operator Sekolah <span>/</span> Rombongan Belajar
          </div>
          <h1>Rombongan Belajar</h1>
          <p>
            Kelola data kelas, tingkat pendidikan, tahun ajaran, dan wali kelas.
          </p>
        </div>

        <button className="rb-primary-button" onClick={openAddModal}>
          <Plus size={18} />
          Tambah Rombel
        </button>
      </div>

      <div className="rb-info-banner">
        <School size={21} />
        <div>
          <strong>Pengelolaan Rombongan Belajar</strong>
          <p>
            Rombel dapat ditambahkan secara manual. Integrasi Dapodik akan
            disiapkan agar data hasil sinkronisasi dan perubahan manual dapat
            dikelola tanpa saling menimpa.
          </p>
        </div>
      </div>

      <div className="rb-stat-grid">
        <div className="rb-stat-card">
          <div className="rb-stat-icon blue">
            <Users size={22} />
          </div>
          <div>
            <span>Total Rombel</span>
            <strong>{rombels.length}</strong>
            <small>Seluruh data rombel</small>
          </div>
        </div>

        <div className="rb-stat-card">
          <div className="rb-stat-icon green">
            <UserCheck size={22} />
          </div>
          <div>
            <span>Rombel Aktif</span>
            <strong>{activeRombels.length}</strong>
            <small>Rombel berjalan</small>
          </div>
        </div>

        <div className="rb-stat-card">
          <div className="rb-stat-icon orange">
            <UserX size={22} />
          </div>
          <div>
            <span>Rombel Nonaktif</span>
            <strong>{inactiveRombels.length}</strong>
            <small>Riwayat rombel</small>
          </div>
        </div>

        <div className="rb-stat-card">
          <div className="rb-stat-icon purple">
            <GraduationCap size={22} />
          </div>
          <div>
            <span>Wali Kelas Terisi</span>
            <strong>
              {activeRombels.filter((item) => item.waliKelasId).length}
            </strong>
            <small>Rombel dengan wali kelas</small>
          </div>
        </div>
      </div>

      <div className="rb-table-card">
        <div className="rb-table-heading">
          <div>
            <h2>Daftar Rombongan Belajar</h2>
            <p>Data kelas berdasarkan tahun ajaran.</p>
          </div>

          <span className="rb-total-label">
            {filteredRombels.length} data ditampilkan
          </span>
        </div>

        <div className="rb-toolbar">
          <div className="rb-search">
            <Search size={18} />
            <input
              placeholder="Cari nama rombel atau wali kelas..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="rb-filter">
            <Filter size={17} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="Aktif">Rombel Aktif</option>
              <option value="Nonaktif">Rombel Nonaktif</option>
              <option value="Semua">Semua Rombel</option>
            </select>
          </div>
        </div>

        <div className="rb-table-wrapper">
          <table className="rb-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Rombel</th>
                <th>Tingkat</th>
                <th>Tahun Ajaran</th>
                <th>Kurikulum</th>
                <th>Wali Kelas</th>
                <th>Sumber Data</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredRombels.length > 0 ? (
                filteredRombels.map((rombel, index) => (
                  <tr key={rombel.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="rb-name">
                        <div className="rb-class-icon">
                          <School size={17} />
                        </div>
                        <strong>{rombel.namaRombel}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="rb-grade">{rombel.tingkat}</span>
                    </td>
                    <td>{rombel.tahunAjaran}</td>
                    <td>{rombel.kurikulum}</td>
                    <td>{getTeacherName(rombel.waliKelasId)}</td>
                    <td>
                      <span
                        className={`rb-source ${
                          rombel.sumber === "Dapodik" ? "dapodik" : "manual"
                        }`}
                      >
                        {rombel.sumber || "Manual"}
                      </span>
                      {rombel.perubahanManual && (
                        <small className="rb-manual-note">
                          Ada perubahan manual
                        </small>
                      )}
                    </td>
                    <td>
                      <span
                        className={`rb-status ${
                          rombel.status === "Aktif" ? "active" : "inactive"
                        }`}
                      >
                        {rombel.status}
                      </span>
                    </td>
                    <td>
                      <div className="rb-actions">
                        <button
                          title="Lihat detail"
                          onClick={() => openDetail(rombel)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          title="Edit rombel"
                          onClick={() => openEditModal(rombel)}
                        >
                          <Pencil size={16} />
                        </button>

                        {rombel.status === "Aktif" ? (
                          <button
                            className="deactivate"
                            title="Nonaktifkan rombel"
                            onClick={() => handleDeactivate(rombel)}
                          >
                            <UserX size={16} />
                          </button>
                        ) : (
                          <button
                            className="activate"
                            title="Aktifkan kembali"
                            onClick={() => handleActivate(rombel)}
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">
                    <div className="rb-empty-state">
                      <div>
                        <School size={30} />
                      </div>
                      <strong>
                        {rombels.length === 0
                          ? "Belum ada data rombongan belajar"
                          : "Data rombel tidak ditemukan"}
                      </strong>
                      <p>
                        {rombels.length === 0
                          ? "Tambahkan rombel pertama untuk mulai mengelola kelas."
                          : "Silakan ubah pencarian atau filter status."}
                      </p>
                      {rombels.length === 0 && (
                        <button
                          className="rb-primary-button"
                          onClick={openAddModal}
                        >
                          <Plus size={17} />
                          Tambah Rombel Pertama
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
          className="rb-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="rb-modal" role="dialog" aria-modal="true">
            <div className="rb-modal-header">
              <div>
                <h2>{editingId ? "Edit Rombongan Belajar" : "Tambah Rombongan Belajar"}</h2>
                <p>Lengkapi identitas rombel dan penanggung jawab kelas.</p>
              </div>
              <button className="rb-close-button" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="rb-form-section">
                <h3>Identitas Rombongan Belajar</h3>

                <div className="rb-form-grid">
                  <label className="rb-field full">
                    Nama Rombel <span>*</span>
                    <input
                      name="namaRombel"
                      value={form.namaRombel}
                      onChange={handleChange}
                      placeholder="Contoh: VII A"
                      required
                    />
                  </label>

                  <label className="rb-field">
                    Tingkat Pendidikan <span>*</span>
                    <select
                      name="tingkat"
                      value={form.tingkat}
                      onChange={handleChange}
                      required
                    >
                      <option value="VII">Kelas VII</option>
                      <option value="VIII">Kelas VIII</option>
                      <option value="IX">Kelas IX</option>
                    </select>
                  </label>

                  <label className="rb-field">
                    Tahun Ajaran <span>*</span>
                    <input
                      name="tahunAjaran"
                      value={form.tahunAjaran}
                      onChange={handleChange}
                      placeholder="Contoh: 2026/2027"
                      required
                    />
                  </label>

                  <label className="rb-field">
                    Kurikulum
                    <select
                      name="kurikulum"
                      value={form.kurikulum}
                      onChange={handleChange}
                    >
                      <option value="Merdeka">Kurikulum Merdeka</option>
                      <option value="K13">Kurikulum 2013</option>
                    </select>
                  </label>

                  <label className="rb-field">
                    Wali Kelas
                    <select
                      name="waliKelasId"
                      value={form.waliKelasId}
                      onChange={handleChange}
                    >
                      <option value="">Belum ditentukan</option>
                      {teachers
                        .filter((teacher) => teacher.status === "Aktif")
                        .map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.nama}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              </div>

              {teachers.length === 0 && (
                <div className="rb-form-warning">
                  Belum ada data guru. Silakan isi Data Guru terlebih dahulu
                  agar dapat memilih wali kelas.
                </div>
              )}

              <div className="rb-form-note">
                <strong>Catatan:</strong> Rombel yang ditambahkan manual akan
                ditandai sebagai data Manual. Perubahan manual juga dicatat
                sebagai penanda agar dapat dilindungi saat integrasi Dapodik
                dikembangkan.
              </div>

              <div className="rb-modal-footer">
                <button
                  type="button"
                  className="rb-secondary-button"
                  onClick={closeModal}
                >
                  Batal
                </button>
                <button type="submit" className="rb-primary-button">
                  <Save size={17} />
                  {editingId ? "Simpan Perubahan" : "Simpan Rombel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailOpen && selectedRombel && (
        <div
          className="rb-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailOpen(false);
          }}
        >
          <div className="rb-modal rb-detail-modal" role="dialog" aria-modal="true">
            <div className="rb-modal-header">
              <div>
                <h2>Detail Rombongan Belajar</h2>
                <p>Informasi lengkap rombongan belajar.</p>
              </div>
              <button
                className="rb-close-button"
                onClick={() => setDetailOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="rb-detail-profile">
              <div className="rb-detail-icon">
                <School size={25} />
              </div>
              <div>
                <h3>{selectedRombel.namaRombel}</h3>
                <span>Kelas {selectedRombel.tingkat}</span>
              </div>
            </div>

            <div className="rb-detail-grid">
              {[
                ["Nama Rombel", selectedRombel.namaRombel],
                ["Tingkat", selectedRombel.tingkat],
                ["Tahun Ajaran", selectedRombel.tahunAjaran],
                ["Kurikulum", selectedRombel.kurikulum],
                ["Wali Kelas", getTeacherName(selectedRombel.waliKelasId)],
                ["Sumber Data", selectedRombel.sumber],
                ["Status", selectedRombel.status],
                [
                  "Perubahan Manual",
                  selectedRombel.perubahanManual ? "Ada" : "Belum ada",
                ],
              ].map(([label, value]) => (
                <div className="rb-detail-item" key={label}>
                  <span>{label}</span>
                  <strong>{value || "-"}</strong>
                </div>
              ))}
            </div>

            <div className="rb-modal-footer">
              <button
                className="rb-secondary-button"
                onClick={() => setDetailOpen(false)}
              >
                Tutup
              </button>
              <button
                className="rb-primary-button"
                onClick={() => {
                  setDetailOpen(false);
                  openEditModal(selectedRombel);
                }}
              >
                <Pencil size={17} />
                Edit Rombel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RombelPage;
    