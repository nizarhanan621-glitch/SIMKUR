
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Plus,
  Search,
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Save,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import "../styles/AsesmenPage.css";

const KEY = {
  students: "simkur_data_siswa",
  rombels: "simkur_data_rombel",
  placements: "simkur_penempatan_siswa",
  teachers: "simkur_data_guru",
  subjects: "simkur_data_mata_pelajaran",
  assignments: "simkur_data_tugas_mengajar",
  assessments: "simkur_data_asesmen",
  scores: "simkur_nilai_asesmen",
};

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function loadData() {
  return {
    students: readArray(KEY.students),
    rombels: readArray(KEY.rombels),
    placements: readArray(KEY.placements),
    teachers: readArray(KEY.teachers),
    subjects: readArray(KEY.subjects),
    assignments: readArray(KEY.assignments),
    assessments: readArray(KEY.assessments),
    scores: readArray(KEY.scores),
  };
}

function getName(item, fields) {
  for (const field of fields) {
    if (item?.[field]) return item[field];
  }
  return "Data tidak ditemukan";
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function todayKey() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isActive(item) {
  return Boolean(item) && item.status !== "Nonaktif";
}

export default function AsesmenPage({ role = "wakasek" }) {
  const [data, setData] = useState(loadData);

  const [selectedYear, setSelectedYear] = useState(
    () =>
      readArray(KEY.rombels).find((item) => item.status === "Aktif")
        ?.tahunAjaran || "2026/2027"
  );

  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedRombelId, setSelectedRombelId] = useState("");
  const [selectedType, setSelectedType] = useState("Semua");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [scoreInputs, setScoreInputs] = useState({});

  const [form, setForm] = useState({
    judul: "",
    jenis: "Formatif",
    tanggal: todayKey(),
    rombelId: "",
    tugasMengajarId: "",
    kkm: "75",
    deskripsi: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    const refresh = () => setData(loadData());

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const activeTeachers = useMemo(
    () => data.teachers.filter(isActive),
    [data.teachers]
  );

  useEffect(() => {
    if (
      role === "guru" &&
      !activeTeachers.some(
        (item) => String(item.id) === String(selectedTeacherId)
      )
    ) {
      setSelectedTeacherId(
        activeTeachers[0] ? String(activeTeachers[0].id) : ""
      );
    }
  }, [role, activeTeachers, selectedTeacherId]);

  const activeRombels = useMemo(
    () =>
      data.rombels.filter(
        (item) =>
          isActive(item) &&
          item.tahunAjaran === selectedYear
      ),
    [data.rombels, selectedYear]
  );

  const activeAssignments = useMemo(
    () =>
      data.assignments.filter((item) => {
        if (!isActive(item)) return false;

        const teacher = data.teachers.find(
          (row) => String(row.id) === String(item.guruId)
        );
        const rombel = data.rombels.find(
          (row) => String(row.id) === String(item.rombelId)
        );
        const subject = data.subjects.find(
          (row) => String(row.id) === String(item.mapelId)
        );

        return (
          isActive(teacher) &&
          isActive(rombel) &&
          isActive(subject) &&
          rombel.tahunAjaran === selectedYear
        );
      }),
    [data.assignments, data.teachers, data.rombels, data.subjects, selectedYear]
  );

  const visibleAssignments = useMemo(
    () =>
      role === "guru"
        ? activeAssignments.filter(
            (item) =>
              String(item.guruId) === String(selectedTeacherId)
          )
        : activeAssignments,
    [role, activeAssignments, selectedTeacherId]
  );

  const visibleAssessments = useMemo(
    () =>
      data.assessments
        .filter((item) => {
          if (!isActive(item)) return false;
          if (item.tahunAjaran !== selectedYear) return false;

          if (
            role === "guru" &&
            String(item.guruId) !== String(selectedTeacherId)
          ) {
            return false;
          }

          if (
            selectedRombelId &&
            String(item.rombelId) !== String(selectedRombelId)
          ) {
            return false;
          }

          if (
            selectedType !== "Semua" &&
            item.jenis !== selectedType
          ) {
            return false;
          }

          const keyword = search.trim().toLowerCase();
          const rombel = data.rombels.find(
            (row) => String(row.id) === String(item.rombelId)
          );
          const subject = data.subjects.find(
            (row) => String(row.id) === String(item.mapelId)
          );

          return (
            !keyword ||
            [
              item.judul,
              rombel?.namaRombel,
              getName(subject, ["nama", "namaMapel"]),
            ].some((value) =>
              String(value || "").toLowerCase().includes(keyword)
            )
          );
        })
        .sort((a, b) =>
          String(b.tanggal).localeCompare(String(a.tanggal))
        ),
    [
      data.assessments,
      data.rombels,
      data.subjects,
      selectedYear,
      selectedTeacherId,
      selectedRombelId,
      selectedType,
      search,
      role,
    ]
  );

  const selectedAssessment = visibleAssessments.find(
    (item) => String(item.id) === String(selectedAssessmentId)
  );

  const studentsForAssessment = useMemo(() => {
    if (!selectedAssessment) return [];

    const placedIds = new Set(
      data.placements
        .filter(
          (item) =>
            item.tahunAjaran === selectedAssessment.tahunAjaran &&
            String(item.rombelId) === String(selectedAssessment.rombelId)
        )
        .map((item) => String(item.siswaId))
    );

    return data.students
      .filter(
        (item) =>
          isActive(item) && placedIds.has(String(item.id))
      )
      .sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
  }, [
    selectedAssessment,
    data.placements,
    data.students,
  ]);

  const assessmentScores = useMemo(
    () =>
      selectedAssessment
        ? data.scores.filter(
            (item) =>
              String(item.assessmentId) ===
              String(selectedAssessment.id)
          )
        : [],
    [data.scores, selectedAssessment]
  );

  const visibleAssessmentIds = new Set(
    visibleAssessments.map((item) => String(item.id))
  );

  const visibleScores = data.scores.filter((item) =>
    visibleAssessmentIds.has(String(item.assessmentId))
  );

  const numericScores = visibleScores.filter(
    (item) =>
      item.nilai !== null &&
      item.nilai !== "" &&
      Number.isFinite(Number(item.nilai))
  );

  const averageScore = numericScores.length
    ? numericScores.reduce(
        (sum, item) => sum + Number(item.nilai),
        0
      ) / numericScores.length
    : 0;

  const passedCount = numericScores.filter(
    (item) => Number(item.nilai) >= Number(item.kkm || 75)
  ).length;

  const passPercentage = numericScores.length
    ? Math.round((passedCount / numericScores.length) * 100)
    : 0;

  const assignmentOptions = activeAssignments.filter(
    (item) => String(item.rombelId) === String(form.rombelId)
  );

  function openCreateForm() {
    setForm({
      judul: "",
      jenis: "Formatif",
      tanggal: todayKey(),
      rombelId: "",
      tugasMengajarId: "",
      kkm: "75",
      deskripsi: "",
    });
    setError("");
    setShowForm(true);
  }

  function saveAssessment(event) {
    event.preventDefault();

    const assignment = activeAssignments.find(
      (item) =>
        String(item.id) === String(form.tugasMengajarId) &&
        String(item.rombelId) === String(form.rombelId)
    );

    if (!assignment) {
      setError("Pilih rombel dan penugasan mengajar yang valid.");
      return;
    }

    const kkm = Number(form.kkm);

    if (!Number.isFinite(kkm) || kkm < 0 || kkm > 100) {
      setError("KKM harus berupa angka antara 0 sampai 100.");
      return;
    }

    const record = {
      id: createId("ASES"),
      judul: form.judul.trim(),
      jenis: form.jenis,
      tanggal: form.tanggal,
      tahunAjaran: selectedYear,
      rombelId: assignment.rombelId,
      tugasMengajarId: assignment.id,
      guruId: assignment.guruId,
      mapelId: assignment.mapelId,
      kkm,
      deskripsi: form.deskripsi.trim(),
      status: "Aktif",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const next = [record, ...data.assessments];
      localStorage.setItem(KEY.assessments, JSON.stringify(next));
      setData((previous) => ({
        ...previous,
        assessments: next,
      }));
      setShowForm(false);
      setError("");
    } catch (storageError) {
      console.error("Gagal menyimpan asesmen:", storageError);
      setError("Asesmen gagal disimpan. Periksa kapasitas penyimpanan browser.");
    }
  }

  function openScoreEntry(assessment) {
    setSelectedAssessmentId(String(assessment.id));

    const existing = data.scores.filter(
      (item) => String(item.assessmentId) === String(assessment.id)
    );

    const values = {};

    existing.forEach((item) => {
      values[String(item.siswaId)] = {
        nilai: item.nilai == null ? "" : String(item.nilai),
        status: item.status || "Hadir",
        catatan: item.catatan || "",
      };
    });

    setScoreInputs(values);
  }

  function updateScore(studentId, field, value) {
    setScoreInputs((previous) => ({
      ...previous,
      [String(studentId)]: {
        nilai: previous[String(studentId)]?.nilai ?? "",
        status: previous[String(studentId)]?.status ?? "Hadir",
        catatan: previous[String(studentId)]?.catatan ?? "",
        [field]: value,
      },
    }));
  }

  function saveScores() {
    if (!selectedAssessment) return;

    const invalid = studentsForAssessment.find((student) => {
      const input = scoreInputs[String(student.id)];
      if (!input || input.nilai === "") return false;

      const value = Number(input.nilai);
      return !Number.isFinite(value) || value < 0 || value > 100;
    });

    if (invalid) {
      alert(`Nilai ${invalid.nama} harus berada pada rentang 0 sampai 100.`);
      return;
    }

    const studentIds = new Set(
      studentsForAssessment.map((item) => String(item.id))
    );

    const retained = data.scores.filter(
      (item) =>
        !(
          String(item.assessmentId) === String(selectedAssessment.id) &&
          studentIds.has(String(item.siswaId))
        )
    );

    const now = new Date().toISOString();

    const newScores = studentsForAssessment.flatMap((student) => {
      const input = scoreInputs[String(student.id)] || {};
      const status = input.status || "Belum Diisi";
      const hasValue = input.nilai !== "";

      if (!hasValue && status === "Belum Diisi") return [];
      if (!hasValue && status === "Hadir") return [];

      return [
        {
          id: createId("NILAI"),
          assessmentId: selectedAssessment.id,
          siswaId: student.id,
          nilai: hasValue ? Number(input.nilai) : null,
          status,
          catatan: input.catatan || "",
          kkm: Number(selectedAssessment.kkm || 75),
          updatedAt: now,
        },
      ];
    });

    try {
      const next = [...retained, ...newScores];
      localStorage.setItem(KEY.scores, JSON.stringify(next));

      setData((previous) => ({
        ...previous,
        scores: next,
      }));

      alert("Nilai asesmen berhasil disimpan.");
    } catch (storageError) {
      console.error("Gagal menyimpan nilai:", storageError);
      alert("Nilai gagal disimpan. Periksa kapasitas penyimpanan browser.");
    }
  }

  function deactivateAssessment(assessment) {
    if (
      !window.confirm(
        `Nonaktifkan asesmen "${assessment.judul}"? Data nilai yang sudah tersimpan tidak akan dihapus.`
      )
    ) {
      return;
    }

    const next = data.assessments.map((item) =>
      String(item.id) === String(assessment.id)
        ? {
            ...item,
            status: "Nonaktif",
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    try {
      localStorage.setItem(KEY.assessments, JSON.stringify(next));
      setData((previous) => ({
        ...previous,
        assessments: next,
      }));

      if (String(selectedAssessmentId) === String(assessment.id)) {
        setSelectedAssessmentId("");
      }
    } catch (storageError) {
      console.error("Gagal mengubah status asesmen:", storageError);
      alert("Status asesmen gagal diubah.");
    }
  }

  const yearOptions = [
    ...new Set(
      data.rombels.map((item) => item.tahunAjaran).filter(Boolean)
    ),
  ];

  return (
    <div className="as-page">
      <header className="as-header">
        <div>
          <span className="as-eyebrow">MONITORING & EVALUASI</span>
          <h2>Asesmen</h2>
          <p>
            Pengelolaan asesmen, pengisian nilai, dan pemantauan
            ketuntasan hasil belajar peserta didik.
          </p>
        </div>

        <div className="as-header-icon">
          <ClipboardCheck size={26} />
        </div>
      </header>

      {role === "guru" && (
        <div className="as-notice">
          <AlertTriangle size={18} />
          <div>
            <strong>Mode Preview Guru</strong>
            <span>
              Profil guru dipilih secara manual untuk pengujian.
              Penguncian berdasarkan akun guru belum aktif.
            </span>
          </div>
        </div>
      )}

      <section className="as-filter-panel">
        {role === "guru" && (
          <label>
            Profil Guru
            <select
              value={selectedTeacherId}
              onChange={(event) =>
                setSelectedTeacherId(event.target.value)
              }
            >
              <option value="">Pilih guru</option>
              {activeTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {getName(teacher, ["nama", "namaGuru"])}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Tahun Ajaran
          <select
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(event.target.value);
              setSelectedRombelId("");
              setSelectedAssessmentId("");
            }}
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
        </label>

        <label>
          Rombongan Belajar
          <select
            value={selectedRombelId}
            onChange={(event) => setSelectedRombelId(event.target.value)}
          >
            <option value="">Semua Rombel</option>
            {activeRombels.map((rombel) => (
              <option key={rombel.id} value={rombel.id}>
                {rombel.namaRombel}
              </option>
            ))}
          </select>
        </label>

        <label>
          Jenis Asesmen
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Formatif">Formatif</option>
            <option value="Sumatif">Sumatif</option>
          </select>
        </label>
      </section>

      <section className="as-summary-grid">
        <article>
          <div className="as-summary-icon blue"><ClipboardCheck size={20} /></div>
          <div><span>Asesmen Aktif</span><strong>{visibleAssessments.length}</strong></div>
        </article>
        <article>
          <div className="as-summary-icon purple"><FileText size={20} /></div>
          <div><span>Nilai Tersimpan</span><strong>{numericScores.length}</strong></div>
        </article>
        <article>
          <div className="as-summary-icon orange"><BarChart3 size={20} /></div>
          <div><span>Rata-rata Nilai</span><strong>{numericScores.length ? averageScore.toFixed(1) : "-"}</strong></div>
        </article>
        <article>
          <div className="as-summary-icon green"><CheckCircle2 size={20} /></div>
          <div><span>Ketuntasan Nilai</span><strong>{numericScores.length ? `${passPercentage}%` : "-"}</strong></div>
        </article>
      </section>

      <section className="as-panel">
        <div className="as-panel-heading">
          <div>
            <h3>Daftar Asesmen</h3>
            <p>Asesmen berdasarkan penugasan mengajar dan rombongan belajar.</p>
          </div>

          {role === "wakasek" && (
            <button className="as-primary-btn" onClick={openCreateForm}>
              <Plus size={17} />
              Buat Asesmen
            </button>
          )}
        </div>

        <div className="as-toolbar">
          <div className="as-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari judul, mata pelajaran, atau rombel..."
            />
          </div>
        </div>

        <div className="as-table-wrap">
          <table className="as-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Asesmen</th>
                <th>Jenis</th>
                <th>Tanggal</th>
                <th>Rombel</th>
                <th>Mata Pelajaran</th>
                <th>Guru</th>
                <th>KKM</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visibleAssessments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="as-empty">
                    <ClipboardCheck size={32} />
                    <strong>Belum ada asesmen</strong>
                    <span>
                      {role === "wakasek"
                        ? "Buat asesmen terlebih dahulu untuk memulai pengolahan nilai."
                        : "Belum ada asesmen untuk penugasan mengajar pada profil guru ini."}
                    </span>
                  </td>
                </tr>
              ) : (
                visibleAssessments.map((item, index) => {
                  const rombel = data.rombels.find(
                    (row) => String(row.id) === String(item.rombelId)
                  );
                  const subject = data.subjects.find(
                    (row) => String(row.id) === String(item.mapelId)
                  );
                  const teacher = data.teachers.find(
                    (row) => String(row.id) === String(item.guruId)
                  );

                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td><strong>{item.judul}</strong></td>
                      <td><span className={`as-type ${item.jenis.toLowerCase()}`}>{item.jenis}</span></td>
                      <td>{item.tanggal || "-"}</td>
                      <td>{rombel?.namaRombel || "-"}</td>
                      <td>{getName(subject, ["nama", "namaMapel"])}</td>
                      <td>{getName(teacher, ["nama", "namaGuru"])}</td>
                      <td>{item.kkm ?? 75}</td>
                      <td>
                        <div className="as-actions">
                          <button
                            className="as-action-primary"
                            onClick={() => openScoreEntry(item)}
                          >
                            Isi Nilai
                          </button>

                          {role === "wakasek" && (
                            <button
                              className="as-action-danger"
                              title="Nonaktifkan asesmen"
                              onClick={() => deactivateAssessment(item)}
                            >
                              Nonaktifkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="as-table-footer">
          Menampilkan {visibleAssessments.length} asesmen.
        </div>
      </section>

      {selectedAssessment && (
        <section className="as-panel as-score-panel">
          <div className="as-panel-heading">
            <div>
              <span className="as-eyebrow">PENGISIAN HASIL</span>
              <h3>{selectedAssessment.judul}</h3>
              <p>
                {data.rombels.find(
                  (item) => String(item.id) === String(selectedAssessment.rombelId)
                )?.namaRombel || "-"}
                {" · "}
                KKM {selectedAssessment.kkm}
              </p>
            </div>
            <button
              className="as-close-btn"
              onClick={() => setSelectedAssessmentId("")}
              title="Tutup pengisian nilai"
            >
              <X size={19} />
            </button>
          </div>

          {studentsForAssessment.length === 0 ? (
            <div className="as-empty-inline">
              <GraduationCap size={27} />
              <strong>Belum ada siswa pada rombel ini.</strong>
              <span>
                Periksa Data Siswa dan Penempatan Siswa untuk tahun ajaran
                {` ${selectedAssessment.tahunAjaran}`}.
              </span>
            </div>
          ) : (
            <>
              <div className="as-score-info">
                <Users size={17} />
                {studentsForAssessment.length} siswa terdaftar pada rombel ini.
                Nilai kosong tidak akan dihitung sebagai nilai.
              </div>

              <div className="as-table-wrap">
                <table className="as-table as-score-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Nama Siswa</th>
                      <th>NIS</th>
                      <th>Nilai (0–100)</th>
                      <th>Status Kehadiran</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsForAssessment.map((student, index) => {
                      const input = scoreInputs[String(student.id)] || {};

                      return (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td><strong>{student.nama}</strong></td>
                          <td>{student.nis || "-"}</td>
                          <td>
                            <input
                              className="as-score-input"
                              type="number"
                              min="0"
                              max="100"
                              value={input.nilai ?? ""}
                              onChange={(event) =>
                                updateScore(student.id, "nilai", event.target.value)
                              }
                              disabled={input.status === "Tidak Hadir"}
                              placeholder="Nilai"
                            />
                          </td>
                          <td>
                            <select
                              className="as-score-select"
                              value={input.status || "Hadir"}
                              onChange={(event) =>
                                updateScore(student.id, "status", event.target.value)
                              }
                            >
                              <option value="Hadir">Hadir</option>
                              <option value="Tidak Hadir">Tidak Hadir</option>
                              <option value="Susulan">Susulan</option>
                              <option value="Belum Diisi">Belum Diisi</option>
                            </select>
                          </td>
                          <td>
                            <input
                              className="as-note-input"
                              value={input.catatan || ""}
                              onChange={(event) =>
                                updateScore(student.id, "catatan", event.target.value)
                              }
                              placeholder="Catatan"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="as-score-footer">
                <span>
                  {assessmentScores.filter((item) => item.nilai !== null).length}
                  {" "}nilai sudah tersimpan sebelumnya.
                </span>
                <button className="as-primary-btn" onClick={saveScores}>
                  <Save size={17} />
                  Simpan Nilai
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {showForm && (
        <div className="as-modal-backdrop" onMouseDown={() => setShowForm(false)}>
          <section
            className="as-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="as-modal-header">
              <div>
                <h3>Buat Asesmen</h3>
                <p>Tentukan jenis, jadwal, rombel, dan penugasan mengajar.</p>
              </div>
              <button onClick={() => setShowForm(false)} type="button">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveAssessment}>
              <div className="as-form-grid">
                <label className="as-full">
                  Judul Asesmen *
                  <input
                    required
                    value={form.judul}
                    onChange={(event) =>
                      setForm({ ...form, judul: event.target.value })
                    }
                    placeholder="Contoh: Asesmen Sumatif Bab 1"
                  />
                </label>

                <label>
                  Jenis Asesmen *
                  <select
                    value={form.jenis}
                    onChange={(event) =>
                      setForm({ ...form, jenis: event.target.value })
                    }
                  >
                    <option value="Formatif">Formatif</option>
                    <option value="Sumatif">Sumatif</option>
                  </select>
                </label>

                <label>
                  Tanggal *
                  <input
                    type="date"
                    required
                    value={form.tanggal}
                    onChange={(event) =>
                      setForm({ ...form, tanggal: event.target.value })
                    }
                  />
                </label>

                <label>
                  Rombongan Belajar *
                  <select
                    required
                    value={form.rombelId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        rombelId: event.target.value,
                        tugasMengajarId: "",
                      })
                    }
                  >
                    <option value="">Pilih rombel</option>
                    {activeRombels.map((rombel) => (
                      <option key={rombel.id} value={rombel.id}>
                        {rombel.namaRombel}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Penugasan / Mata Pelajaran *
                  <select
                    required
                    value={form.tugasMengajarId}
                    onChange={(event) =>
                      setForm({ ...form, tugasMengajarId: event.target.value })
                    }
                  >
                    <option value="">Pilih penugasan</option>
                    {assignmentOptions.map((assignment) => {
                      const subject = data.subjects.find(
                        (item) => String(item.id) === String(assignment.mapelId)
                      );
                      const teacher = data.teachers.find(
                        (item) => String(item.id) === String(assignment.guruId)
                      );

                      return (
                        <option key={assignment.id} value={assignment.id}>
                          {getName(subject, ["nama", "namaMapel"])}
                          {" — "}
                          {getName(teacher, ["nama", "namaGuru"])}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label>
                  KKM *
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={form.kkm}
                    onChange={(event) =>
                      setForm({ ...form, kkm: event.target.value })
                    }
                  />
                </label>

                <label className="as-full">
                  Keterangan
                  <textarea
                    rows="3"
                    value={form.deskripsi}
                    onChange={(event) =>
                      setForm({ ...form, deskripsi: event.target.value })
                    }
                    placeholder="Keterangan atau cakupan materi asesmen"
                  />
                </label>
              </div>

              {error && <div className="as-form-error">{error}</div>}

              <div className="as-modal-footer">
                <button
                  type="button"
                  className="as-secondary-btn"
                  onClick={() => setShowForm(false)}
                >
                  Batal
                </button>
                <button type="submit" className="as-primary-btn">
                  <Save size={16} />
                  Simpan Asesmen
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
