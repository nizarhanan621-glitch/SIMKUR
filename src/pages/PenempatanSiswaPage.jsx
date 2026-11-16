
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  School,
  Search,
  UserPlus,
  ArrowRightLeft,
  History,
  X,
  CheckCircle2,
} from "lucide-react";
import "../styles/PenempatanSiswaPage.css";

const KEYS = {
  siswa: "simkur_data_siswa",
  rombel: "simkur_data_rombel",
  penempatan: "simkur_penempatan_siswa",
  riwayat: "simkur_riwayat_penempatan_siswa",
};

const readJSON = (key, fallback = []) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const createId = () =>
  `PEN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function PenempatanSiswaPage() {
  const [students] = useState(() => readJSON(KEYS.siswa));
  const [rombels] = useState(() => readJSON(KEYS.rombel));

  const [placements, setPlacements] = useState(() =>
    readJSON(KEYS.penempatan)
  );

  const [history, setHistory] = useState(() =>
    readJSON(KEYS.riwayat)
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [selectedYear, setSelectedYear] = useState(() => {
    const activeRombel = readJSON(KEYS.rombel).find(
      (item) => item.status === "Aktif"
    );
    return activeRombel?.tahunAjaran || "2026/2027";
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedRombelId, setSelectedRombelId] = useState("");

  useEffect(() => {
    localStorage.setItem(KEYS.penempatan, JSON.stringify(placements));
  }, [placements]);

  useEffect(() => {
    localStorage.setItem(KEYS.riwayat, JSON.stringify(history));
  }, [history]);

  const activeStudents = useMemo(
    () => students.filter((student) => student.status === "Aktif"),
    [students]
  );

  const activeRombels = useMemo(
    () =>
      rombels.filter(
        (rombel) =>
          rombel.status === "Aktif" &&
          rombel.tahunAjaran === selectedYear
      ),
    [rombels, selectedYear]
  );

  const getRombel = (rombelId) =>
    activeRombels.find(
      (rombel) => String(rombel.id) === String(rombelId)
    );

  const getStudent = (studentId) =>
    students.find(
      (student) => String(student.id) === String(studentId)
    );

  // Penempatan yang masih mengarah ke rombel aktif.
  const validPlacements = useMemo(
    () =>
      placements.filter(
        (item) =>
          item.tahunAjaran === selectedYear &&
          activeRombels.some(
            (rombel) => String(rombel.id) === String(item.rombelId)
          ) &&
          activeStudents.some(
            (student) => String(student.id) === String(item.siswaId)
          )
      ),
    [placements, selectedYear, activeRombels, activeStudents]
  );

  const getPlacement = (studentId) =>
    validPlacements.find(
      (item) => String(item.siswaId) === String(studentId)
    );

  const unplacedCount = activeStudents.filter(
    (student) => !getPlacement(student.id)
  ).length;

  const placedCount = activeStudents.length - unplacedCount;

  const filteredStudents = activeStudents.filter((student) => {
    const keyword = search.trim().toLowerCase();
    const placement = getPlacement(student.id);

    const rombel = placement
      ? getRombel(placement.rombelId)
      : null;

    const matchesSearch =
      !keyword ||
      [student.nama, student.nis, student.nisn, rombel?.namaRombel]
        .some((value) =>
          String(value || "").toLowerCase().includes(keyword)
        );

    const matchesFilter =
      filter === "Semua" ||
      (filter === "Sudah Ditempatkan" && Boolean(placement)) ||
      (filter === "Belum Ditempatkan" && !placement);

    return matchesSearch && matchesFilter;
  });

  const openPlacement = (student) => {
    const current = getPlacement(student.id);

    setSelectedStudentId(String(student.id));
    setSelectedRombelId(
      current ? String(current.rombelId) : ""
    );
    setModalOpen(true);
  };

  const savePlacement = (event) => {
    event.preventDefault();

    const student = getStudent(selectedStudentId);
    const targetRombel = activeRombels.find(
      (rombel) => String(rombel.id) === selectedRombelId
    );

    if (!student || !targetRombel) {
      alert("Pilih siswa dan rombongan belajar yang valid.");
      return;
    }

    const current = getPlacement(student.id);

    if (
      current &&
      String(current.rombelId) === String(targetRombel.id)
    ) {
      alert("Siswa sudah berada di rombongan belajar tersebut.");
      return;
    }

    const now = new Date().toISOString();

    const historyItem = {
      id: createId(),
      siswaId: student.id,
      namaSiswa: student.nama,
      tahunAjaran: selectedYear,
      rombelAsalId: current?.rombelId || null,
      rombelAsalNama: current
        ? getRombel(current.rombelId)?.namaRombel || "-"
        : "-",
      rombelTujuanId: targetRombel.id,
      rombelTujuanNama: targetRombel.namaRombel,
      tindakan: current ? "Pemindahan" : "Penempatan",
      tanggal: now,
      pelaksana: "Operator Sekolah",
    };

    setPlacements((previous) => [
      ...previous.filter(
        (item) =>
          !(
            String(item.siswaId) === String(student.id) &&
            item.tahunAjaran === selectedYear
          )
      ),
      {
        id: current?.id || createId(),
        siswaId: student.id,
        rombelId: targetRombel.id,
        tahunAjaran: selectedYear,
        status: "Aktif",
        updatedAt: now,
      },
    ]);

    setHistory((previous) => [historyItem, ...previous]);

    setModalOpen(false);
    setSelectedStudentId("");
    setSelectedRombelId("");
  };

  const yearOptions = [
    ...new Set(
      rombels
        .map((rombel) => rombel.tahunAjaran)
        .filter(Boolean)
    ),
  ];

  const currentHistory = history.filter(
    (item) => item.tahunAjaran === selectedYear
  );

  return (
    <div className="ps-page">
      <div className="ps-header">
        <div>
          <div className="ps-breadcrumb">
            Operator <span>/</span> Data Sekolah <span>/</span> Penempatan Siswa
          </div>
          <h1>Penempatan Siswa</h1>
          <p>
            Atur penempatan dan perpindahan peserta didik ke rombongan belajar.
          </p>
        </div>
      </div>

      <div className="ps-summary">
        <div className="ps-summary-card">
          <div className="ps-summary-icon blue">
            <Users size={21} />
          </div>
          <div>
            <span>Total Siswa Aktif</span>
            <strong>{activeStudents.length}</strong>
          </div>
        </div>

        <div className="ps-summary-card">
          <div className="ps-summary-icon green">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Sudah Ditempatkan</span>
            <strong>{placedCount}</strong>
          </div>
        </div>

        <div className="ps-summary-card">
          <div className="ps-summary-icon orange">
            <GraduationCap size={21} />
          </div>
          <div>
            <span>Belum Ditempatkan</span>
            <strong>{unplacedCount}</strong>
          </div>
        </div>

        <div className="ps-summary-card">
          <div className="ps-summary-icon purple">
            <School size={21} />
          </div>
          <div>
            <span>Rombel Aktif</span>
            <strong>{activeRombels.length}</strong>
          </div>
        </div>
      </div>

      <div className="ps-panel">
        <div className="ps-panel-heading">
          <div>
            <h2>Daftar Penempatan Peserta Didik</h2>
            <p>
              Penempatan siswa berdasarkan tahun ajaran yang dipilih.
            </p>
          </div>

          <select
            className="ps-year-select"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            {yearOptions.length === 0 ? (
              <option value={selectedYear}>{selectedYear}</option>
            ) : (
              yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="ps-toolbar">
          <div className="ps-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, NIS, NISN, atau rombel..."
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>Semua</option>
            <option>Sudah Ditempatkan</option>
            <option>Belum Ditempatkan</option>
          </select>
        </div>

        <div className="ps-table-wrap">
          <table className="ps-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Siswa</th>
                <th>NIS</th>
                <th>NISN</th>
                <th>Rombongan Belajar</th>
                <th>Status Penempatan</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="ps-empty">
                    <GraduationCap size={34} />
                    <strong>Belum ada siswa untuk ditampilkan</strong>
                    <span>
                      Pastikan data siswa aktif sudah tersedia di menu Data Siswa.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const placement = getPlacement(student.id);
                  const rombel = placement
                    ? getRombel(placement.rombelId)
                    : null;

                  return (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td className="ps-student-name">{student.nama}</td>
                      <td>{student.nis || "-"}</td>
                      <td>{student.nisn || "-"}</td>
                      <td>
                        {rombel ? (
                          <span className="ps-rombel-label">
                            {rombel.namaRombel}
                          </span>
                        ) : (
                          <span className="ps-no-rombel">Belum ada rombel</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`ps-status ${
                            placement ? "placed" : "unplaced"
                          }`}
                        >
                          {placement ? "Sudah Ditempatkan" : "Belum Ditempatkan"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="ps-action-btn"
                          onClick={() => openPlacement(student)}
                        >
                          {placement ? (
                            <>
                              <ArrowRightLeft size={15} />
                              Pindahkan
                            </>
                          ) : (
                            <>
                              <UserPlus size={15} />
                              Tempatkan
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ps-table-footer">
          Menampilkan {filteredStudents.length} dari {activeStudents.length} siswa aktif
        </div>
      </div>

      <div className="ps-panel ps-history-panel">
        <div className="ps-panel-heading">
          <div>
            <h2>
              <History size={18} />
              Riwayat Penempatan dan Perpindahan
            </h2>
            <p>Catatan perubahan rombongan belajar siswa.</p>
          </div>
        </div>

        {currentHistory.length === 0 ? (
          <div className="ps-history-empty">
            Belum ada riwayat penempatan untuk tahun ajaran ini.
          </div>
        ) : (
          <div className="ps-history-list">
            {currentHistory.map((item) => (
              <div className="ps-history-item" key={item.id}>
                <div className="ps-history-marker">
                  <ArrowRightLeft size={16} />
                </div>
                <div className="ps-history-content">
                  <strong>{item.namaSiswa}</strong>
                  <span>
                    {item.tindakan}: {item.rombelAsalNama} → {item.rombelTujuanNama}
                  </span>
                  <small>
                    {formatDate(item.tanggal)} · {item.pelaksana}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="ps-modal-backdrop"
          onMouseDown={() => setModalOpen(false)}
        >
          <div
            className="ps-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ps-modal-header">
              <div>
                <h2>Penempatan Siswa</h2>
                <p>Pilih rombongan belajar tujuan.</p>
              </div>
              <button
                className="ps-close-btn"
                onClick={() => setModalOpen(false)}
                type="button"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={savePlacement}>
              <div className="ps-modal-body">
                <label className="ps-field">
                  Nama Siswa
                  <select
                    value={selectedStudentId}
                    onChange={(event) =>
                      setSelectedStudentId(event.target.value)
                    }
                    required
                  >
                    <option value="">Pilih siswa</option>
                    {activeStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.nama} {student.nis ? `— ${student.nis}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="ps-field">
                  Tahun Ajaran
                  <input value={selectedYear} readOnly />
                </label>

                <label className="ps-field">
                  Rombongan Belajar Tujuan
                  <select
                    value={selectedRombelId}
                    onChange={(event) =>
                      setSelectedRombelId(event.target.value)
                    }
                    required
                  >
                    <option value="">Pilih rombongan belajar</option>
                    {activeRombels.map((rombel) => (
                      <option key={rombel.id} value={rombel.id}>
                        {rombel.namaRombel} — Kelas {rombel.tingkat}
                      </option>
                    ))}
                  </select>
                </label>

                {activeRombels.length === 0 && (
                  <p className="ps-warning">
                    Belum ada rombongan belajar aktif untuk tahun ajaran ini.
                    Silakan buat atau aktifkan rombel terlebih dahulu.
                  </p>
                )}
              </div>

              <div className="ps-modal-footer">
                <button
                  type="button"
                  className="ps-secondary-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="ps-primary-btn"
                  disabled={activeRombels.length === 0}
                >
                  Simpan Penempatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
