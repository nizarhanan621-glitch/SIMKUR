
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  Users,
  GraduationCap,
  Clock3,
  Filter,
  CheckCircle2,
  AlertCircle,
  Power,
  Layers3,
} from "lucide-react";

import "../styles/TugasMengajarPage.css";

const STORAGE_KEYS = {
  assignments: "simkur_data_tugas_mengajar",
  teachers: "simkur_data_guru",
  rombels: "simkur_data_rombel",
  subjects: "simkur_data_mata_pelajaran",
};

const initialForm = {
  guruId: "",
  rombelId: "",
  mapelId: "",
  tahunAjaran: "2026/2027",
  semester: "Ganjil",
  jpPerMinggu: 2,
  jenisPenugasan: "Reguler",
  status: "Aktif",
  keterangan: "",
};

function readStorage(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readAssignmentsStorage() {
  try {
    const raw = localStorage.getItem(
      STORAGE_KEYS.assignments
    );

    if (raw === null) {
      return {
        data: [],
        valid: true,
        message: "",
      };
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return {
        data: [],
        valid: false,
        message:
          "Format data Tugas Mengajar tidak sesuai. Penyimpanan perubahan dikunci untuk melindungi data lama.",
      };
    }

    // Pastikan setiap baris merupakan objek penugasan
    // dan memiliki ID.
    const invalidIndex = parsed.findIndex(
      (item) =>
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        item.id == null ||
        String(item.id).trim() === ""
    );

    if (invalidIndex !== -1) {
      return {
        data: [],
        valid: false,
        message:
          `Data penugasan pada baris ke-${invalidIndex + 1} tidak memiliki struktur atau ID yang valid. Penyimpanan perubahan dikunci untuk melindungi data lama.`,
      };
    }

    // Pastikan tidak ada ID penugasan yang sama.
    const ids = parsed.map(
      (item) => String(item.id)
    );

    if (new Set(ids).size !== ids.length) {
      return {
        data: [],
        valid: false,
        message:
          "Ditemukan ID penugasan yang ganda. Penyimpanan perubahan dikunci untuk melindungi riwayat data.",
      };
    }

    return {
      data: parsed,
      valid: true,
      message: "",
    };
  } catch (error) {
    console.error(
      "Gagal membaca data Tugas Mengajar:",
      error
    );

    return {
      data: [],
      valid: false,
      message:
        "Data Tugas Mengajar tidak dapat dibaca. Penyimpanan perubahan dikunci agar data lama tidak tertimpa.",
    };
  }
}

function createId(existingAssignments = []) {
  const existingIds = new Set(
    existingAssignments.map((item) => String(item.id))
  );

  let candidate = "";
  let attempts = 0;

  do {
    const randomId =
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}-${Math.random()
            .toString(36)
            .slice(2)}`;

    candidate = `tm-${randomId}`;
    attempts += 1;

    if (attempts > 20) {
      throw new Error(
        "Sistem gagal membuat ID penugasan yang unik."
      );
    }
  } while (existingIds.has(candidate));

  return candidate;
}

function getPattern(total, jenis = "Reguler") {
  const jp = Number(total);

  if (!Number.isInteger(jp) || jp < 1) {
    return {
      valid: false,
      label: "Alokasi JP tidak valid",
      blocks: [],
    };
  }

  if (jp === 1) {
    if (jenis === "Tambahan") {
      return {
        valid: true,
        label: "1 JP",
        blocks: [1],
      };
    }

    return {
      valid: false,
      label: "Reguler tidak boleh 1 JP",
      blocks: [],
    };
  }

  const blocks = [];
  let remaining = jp;

  while (remaining > 0) {
    if (remaining === 4) {
      blocks.push(2, 2);
      remaining = 0;
    } else if (remaining === 5) {
      blocks.push(3, 2);
      remaining = 0;
    } else if (remaining === 2 || remaining === 3) {
      blocks.push(remaining);
      remaining = 0;
    } else if (remaining >= 6) {
      blocks.push(3);
      remaining -= 3;
    } else {
      return {
        valid: false,
        label: "Pola pembagian tidak valid",
        blocks: [],
      };
    }
  }

  return {
    valid: true,
    blocks,
    label: blocks.join(" + ") + " JP",
  };
}

function getActive(item) {
  return Boolean(item) && item.status !== "Nonaktif";
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="tm-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="tm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="tm-modal-header">
          <div>
            <h2>{title}</h2>
            <p>Pengelolaan penugasan mengajar SIMKUR</p>
          </div>

          <button
            type="button"
            className="tm-icon-button"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={19} />
          </button>
        </div>

        <div className="tm-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function TugasMengajarPage() {
  const [assignmentStorage] = useState(() =>
  readAssignmentsStorage()
);

const assignmentStorageReady = assignmentStorage.valid;

const [assignments, setAssignments] = useState(
  () => assignmentStorage.data
);
  const assignmentsRef = useRef(assignments);

const commitAssignments = useCallback((updater) => {
  if (!assignmentStorageReady) {
  alert(
    assignmentStorage.message ||
      "Data Tugas Mengajar tidak dapat dibaca. Perubahan dibatalkan untuk melindungi data lama."
  );

  return false;
}
  const previous = assignmentsRef.current;

  try {
    const next =
      typeof updater === "function"
        ? updater(previous)
        : updater;

    if (!Array.isArray(next)) {
      throw new Error("Format data penugasan tidak valid.");
    }

    const serialized = JSON.stringify(next);

    if (typeof serialized !== "string") {
      throw new Error("Data penugasan gagal dikonversi.");
    }

    // Simpan terlebih dahulu sebelum memperbarui tampilan.
    localStorage.setItem(
      STORAGE_KEYS.assignments,
      serialized
    );

    // Perbarui referensi dan tampilan hanya jika penyimpanan berhasil.
    assignmentsRef.current = next;
    setAssignments(next);

    return true;
  } catch (error) {
    console.error(
      "Gagal menyimpan data Tugas Mengajar:",
      error
    );

    alert(
      "Perubahan Tugas Mengajar gagal disimpan. Data pada tampilan tidak diubah. Periksa kapasitas penyimpanan atau pengaturan browser, kemudian coba kembali."
    );

    return false;
  }
}, [assignmentStorageReady, assignmentStorage.message]);

  const [teachers, setTeachers] = useState(() =>
  readStorage(STORAGE_KEYS.teachers)
);

const [rombels, setRombels] = useState(() =>
  readStorage(STORAGE_KEYS.rombels)
);

const [subjects, setSubjects] = useState(() =>
  readStorage(STORAGE_KEYS.subjects)
);

useEffect(() => {
  const refreshMasterData = () => {
    setTeachers(readStorage(STORAGE_KEYS.teachers));
    setRombels(readStorage(STORAGE_KEYS.rombels));
    setSubjects(readStorage(STORAGE_KEYS.subjects));
  };

  window.addEventListener("focus", refreshMasterData);
  window.addEventListener("storage", refreshMasterData);

  document.addEventListener("visibilitychange", refreshMasterData);

  return () => {
    window.removeEventListener("focus", refreshMasterData);
    window.removeEventListener("storage", refreshMasterData);
    document.removeEventListener(
      "visibilitychange",
      refreshMasterData
    );
  };
}, []);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterYear, setFilterYear] = useState("Semua");
  const [filterSemester, setFilterSemester] =
    useState("Semua");

  const [modal, setModal] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

const selected = useMemo(
  () =>
    assignments.find(
      (item) => String(item.id) === String(selectedId)
    ) || null,
  [assignments, selectedId]
);

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const activeTeachers = useMemo(
    () => teachers.filter(getActive),
    [teachers]
  );

  const activeRombels = useMemo(
    () => rombels.filter(getActive),
    [rombels]
  );

  const activeSubjects = useMemo(
    () => subjects.filter(getActive),
    [subjects]
  );

  useEffect(() => {
  if (!assignmentStorageReady) return;

  const previous = assignmentsRef.current;
  let changed = false;

  const updated = previous.map((assignment) => {
    if (assignment.status !== "Aktif") {
      return assignment;
    }

    const teacher = teachers.find(
      (item) =>
        String(item.id) === String(assignment.guruId)
    );

    const rombel = rombels.find(
      (item) =>
        String(item.id) === String(assignment.rombelId)
    );

    const subject = subjects.find(
      (item) =>
        String(item.id) === String(assignment.mapelId)
    );

    // Jangan menonaktifkan jika data master tidak ditemukan.
    if (!teacher || !rombel || !subject) {
      return assignment;
    }

    const relationValid =
      getActive(teacher) &&
      getActive(rombel) &&
      getActive(subject);

    if (!relationValid) {
      changed = true;

      return {
        ...assignment,
        status: "Nonaktif",
        alasanNonaktifOtomatis:
          "Guru, rombel, atau mata pelajaran terkait tidak lagi aktif.",
        updatedAt: new Date().toISOString(),
      };
    }

    return assignment;
  });

  if (changed) {
    commitAssignments(updated);
  }
}, [
  teachers,
  rombels,
  subjects,
  commitAssignments,
  assignmentStorageReady,
]);

  const availableSubjects = useMemo(() => {
    if (!form.rombelId) return activeSubjects;

    const rombel = rombels.find(
      (item) =>
        String(item.id) === String(form.rombelId)
    );

    if (!rombel?.tingkat) return activeSubjects;

    return activeSubjects.filter(
      (subject) =>
        !Array.isArray(subject.tingkat) ||
        subject.tingkat.length === 0 ||
        subject.tingkat.includes(rombel.tingkat)
    );
  }, [form.rombelId, activeSubjects, rombels]);

  const patternPreview = getPattern(
    form.jpPerMinggu,
    form.jenisPenugasan
  );

  const years = [
    ...new Set(
      assignments.map((item) => item.tahunAjaran)
    ),
  ].filter(Boolean);

  const filteredAssignments = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return assignments.filter((item) => {
      const teacher = teachers.find(
        (teacherItem) =>
          String(teacherItem.id) === String(item.guruId)
      );

      const rombel = rombels.find(
        (rombelItem) =>
          String(rombelItem.id) === String(item.rombelId)
      );

      const subject = subjects.find(
        (subjectItem) =>
          String(subjectItem.id) === String(item.mapelId)
      );

      const searchable = [
        teacher?.nama,
        teacher?.namaGuru,
        rombel?.namaRombel,
        subject?.nama,
        subject?.namaMapel,
        item.tahunAjaran,
        item.semester,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch =
        !keyword || searchable.includes(keyword);

      const matchStatus =
        filterStatus === "Semua" ||
        item.status === filterStatus;

      const matchYear =
        filterYear === "Semua" ||
        item.tahunAjaran === filterYear;

      const matchSemester =
        filterSemester === "Semua" ||
        item.semester === filterSemester;

      return (
        matchSearch &&
        matchStatus &&
        matchYear &&
        matchSemester
      );
    });
  }, [
    assignments,
    teachers,
    rombels,
    subjects,
    search,
    filterStatus,
    filterYear,
    filterSemester,
  ]);

  const activeAssignments = assignments.filter((item) => {
  if (item.status !== "Aktif") return false;

  const teacher = teachers.find(
    (record) =>
      String(record.id) === String(item.guruId)
  );

  const rombel = rombels.find(
    (record) =>
      String(record.id) === String(item.rombelId)
  );

  const subject = subjects.find(
    (record) =>
      String(record.id) === String(item.mapelId)
  );

  return (
  getActive(teacher) &&
  getActive(rombel) &&
  getActive(subject)
);
});

  const totalJP = activeAssignments.reduce(
    (sum, item) =>
      sum + Number(item.jpPerMinggu || 0),
    0
  );

  const uniqueTeachers = new Set(
    activeAssignments.map((item) => String(item.guruId))
  ).size;

  const uniqueRombels = new Set(
    activeAssignments.map((item) => String(item.rombelId))
  ).size;

  function getTeacher(id) {
    return teachers.find(
      (item) => String(item.id) === String(id)
    );
  }

  function getRombel(id) {
    return rombels.find(
      (item) => String(item.id) === String(id)
    );
  }

  function getSubject(id) {
    return subjects.find(
      (item) => String(item.id) === String(id)
    );
  }

  function getTeacherName(id) {
    const item = getTeacher(id);
    return item?.nama || item?.namaGuru || "Guru tidak ditemukan";
  }

  function getRombelName(id) {
    return (
      getRombel(id)?.namaRombel ||
      "Rombel tidak ditemukan"
    );
  }

  function getSubjectName(id) {
    const item = getSubject(id);
    return (
      item?.nama ||
      item?.namaMapel ||
      "Mata pelajaran tidak ditemukan"
    );
  }

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  }

  function openAdd() {
    setEditingId(null);
    setForm({
      ...initialForm,
      tahunAjaran:
        rombels.find(getActive)?.tahunAjaran ||
        "2026/2027",
    });
    setError("");
    setModal("form");
  }

  function openEdit(item) {
    setEditingId(item.id);

    setForm({
      ...initialForm,
      ...item,
      jenisPenugasan:
        item.jenisPenugasan || "Reguler",
    });

    setError("");
    setModal("form");
  }

  function validateForm() {
    if (
      !form.guruId ||
      !form.rombelId ||
      !form.mapelId
    ) {
      return "Guru, rombel, dan mata pelajaran wajib dipilih.";
    }

    const selectedTeacher = getTeacher(form.guruId);
    const selectedRombel = getRombel(form.rombelId);
    const selectedSubject = getSubject(form.mapelId);

if (
  selectedRombel.tingkat &&
  Array.isArray(selectedSubject.tingkat) &&
  selectedSubject.tingkat.length > 0 &&
  !selectedSubject.tingkat.includes(
    selectedRombel.tingkat
  )
) {
  return "Mata pelajaran tersebut tidak diperuntukkan bagi tingkat rombel yang dipilih.";
}

if (!getActive(selectedTeacher)) {
  return "Guru yang dipilih tidak ditemukan atau sudah nonaktif. Pilih guru yang masih aktif.";
}

if (!getActive(selectedRombel)) {
  return "Rombel yang dipilih tidak ditemukan atau sudah nonaktif.";
}

if (!getActive(selectedSubject)) {
  return "Mata pelajaran yang dipilih tidak ditemukan atau sudah nonaktif.";
}

    const jp = Number(form.jpPerMinggu);

    if (!Number.isInteger(jp) || jp < 1 || jp > 40) {
      return "Alokasi JP harus berupa angka 1 sampai 40.";
    }

    const pattern = getPattern(
      jp,
      form.jenisPenugasan
    );

    if (!pattern.valid) {
      return "Penugasan Reguler tidak boleh memiliki alokasi 1 JP.";
    }

    const rombel = getRombel(form.rombelId);

    if (
      rombel?.tahunAjaran &&
      rombel.tahunAjaran !== form.tahunAjaran
    ) {
      return `Tahun ajaran tidak sesuai dengan rombel ${rombel.namaRombel}.`;
    }

    const duplicate = assignments.find(
  (item) =>
    item.status === "Aktif" &&
    String(item.id) !== String(editingId) &&
    String(item.guruId) === String(form.guruId) &&
    String(item.rombelId) === String(form.rombelId) &&
    String(item.mapelId) === String(form.mapelId) &&
    item.tahunAjaran === form.tahunAjaran &&
    item.semester === form.semester
);

if (duplicate) {
  return "Penugasan aktif dengan guru, rombel, mata pelajaran, tahun ajaran, dan semester tersebut sudah terdaftar.";
}

    return "";
  }

  function handleSubmit(event) {
  event.preventDefault();

  const validation = validateForm();

  if (validation) {
    setError(validation);
    return;
  }

  const now = new Date().toISOString();

  // Hanya mengambil kolom yang memang boleh diedit.
  const editableFields = {
    guruId: form.guruId,
    rombelId: form.rombelId,
    mapelId: form.mapelId,
    tahunAjaran: form.tahunAjaran,
    semester: form.semester,
    jpPerMinggu: Number(form.jpPerMinggu),
    jenisPenugasan:
      form.jenisPenugasan || "Reguler",
    keterangan: form.keterangan || "",
  };

  let saved = false;

  if (editingId) {
    const existing = assignments.find(
      (item) =>
        String(item.id) === String(editingId)
    );

    if (!existing) {
      setError(
        "Penugasan yang akan diedit tidak ditemukan. Muat ulang halaman dan periksa kembali data."
      );
      return;
    }

    saved = commitAssignments((previous) =>
      previous.map((item) =>
        String(item.id) === String(editingId)
          ? {
              ...item,
              ...editableFields,

              // Identitas dan riwayat sistem dipertahankan.
              id: item.id,
              status: item.status,
              sumber: item.sumber || "Manual",
              createdAt: item.createdAt || now,

              // Catatan bahwa data pernah diubah manual.
              perubahanManual: true,
              updatedAt: now,
            }
          : item
      )
    );
  } else {
    const newAssignment = {
      id: createId(assignmentsRef.current),
      ...editableFields,
      status: "Aktif",
      perubahanManual: true,
      sumber: "Manual",
      createdAt: now,
      updatedAt: now,
    };

    saved = commitAssignments((previous) => [
      newAssignment,
      ...previous,
    ]);
  }

  // Form hanya ditutup setelah penyimpanan berhasil.
  if (!saved) return;

  setModal("");
  setEditingId(null);
  setForm(initialForm);
  setError("");
}

  function toggleStatus(item) {
  const nextStatus =
    item.status === "Aktif" ? "Nonaktif" : "Aktif";

  if (nextStatus === "Aktif") {
    const teacher = getTeacher(item.guruId);
    const rombel = getRombel(item.rombelId);
    const subject = getSubject(item.mapelId);

    if (!getActive(teacher)) {
  alert(
    "Penugasan tidak dapat diaktifkan karena guru belum aktif."
  );
  return;
}

    if (!getActive(rombel)) {
  alert(
    "Penugasan tidak dapat diaktifkan karena rombel belum aktif."
  );
  return;
}

    if (!getActive(subject)) {
  alert(
    "Penugasan tidak dapat diaktifkan karena mata pelajaran belum aktif."
  );
  return;
}

    const duplicate = assignments.find(
      (record) =>
        record.status === "Aktif" &&
        String(record.id) !== String(item.id) &&
        String(record.guruId) === String(item.guruId) &&
        String(record.rombelId) === String(item.rombelId) &&
        String(record.mapelId) === String(item.mapelId) &&
        record.tahunAjaran === item.tahunAjaran &&
        record.semester === item.semester
    );

    if (duplicate) {
      alert(
        "Penugasan tidak dapat diaktifkan karena sudah ada penugasan aktif dengan kombinasi guru, rombel, mata pelajaran, tahun ajaran, dan semester yang sama."
      );
      return;
    }
  }

  const confirmed = window.confirm(
    nextStatus === "Nonaktif"
      ? "Nonaktifkan penugasan ini? Data dan hubungan dengan jadwal lama tetap dipertahankan."
      : "Aktifkan kembali penugasan ini?"
  );

  if (!confirmed) return;

  commitAssignments((previous) =>
  previous.map((record) =>
    String(record.id) === String(item.id)
      ? {
          ...record,
          status: nextStatus,
          alasanNonaktifOtomatis:
            nextStatus === "Aktif"
              ? null
              : record.alasanNonaktifOtomatis,
          perubahanManual: true,
          updatedAt: new Date().toISOString(),
        }
      : record
  )
);
  }

  function deleteAssignment(item) {
  if (item.status === "Nonaktif") {
    alert(
      "Penugasan ini sudah nonaktif. Data tetap disimpan untuk menjaga riwayat dan hubungan dengan jadwal lama."
    );
    return;
  }

  const confirmed = window.confirm(
    `Nonaktifkan penugasan ${getTeacherName(item.guruId)} - ${getSubjectName(item.mapelId)} - ${getRombelName(item.rombelId)}?\n\nData tidak akan dihapus dan ID penugasan tetap dipertahankan.`
  );

  if (!confirmed) return;

  commitAssignments((previous) =>
  previous.map((record) =>
    String(record.id) === String(item.id)
      ? {
          ...record,
          status: "Nonaktif",
          perubahanManual: true,
          alasanNonaktifOtomatis: null,
          updatedAt: new Date().toISOString(),
        }
      : record
  )
);
}

  function openDetail(item) {
  setSelectedId(item.id);
  setModal("detail");
}

  return (
    <div className="tm-page">
      {!assignmentStorageReady && (
  <div className="tm-form-error" role="alert">
    <AlertCircle size={19} />
    <span>{assignmentStorage.message}</span>
  </div>
)}
      <div className="tm-page-heading">
        <div>
          <div className="tm-eyebrow">
            WAKASEK KURIKULUM
          </div>

          <h1>Tugas Mengajar</h1>

          <p>
            Atur pembagian guru, mata pelajaran, rombongan
            belajar, dan alokasi JP mingguan.
          </p>
        </div>

        <button
          type="button"
          className="tm-primary-button"
          onClick={openAdd}
        >
          <Plus size={18} />
          Tambah Penugasan
        </button>
      </div>

      <div className="tm-stat-grid">
        <div className="tm-stat-card">
          <div className="tm-stat-icon blue">
            <BookOpen size={20} />
          </div>
          <div>
            <span>Total Penugasan Aktif</span>
            <strong>{activeAssignments.length}</strong>
          </div>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon green">
            <GraduationCap size={20} />
          </div>
          <div>
            <span>Guru Terlibat</span>
            <strong>{uniqueTeachers}</strong>
          </div>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon purple">
            <Users size={20} />
          </div>
          <div>
            <span>Rombel Terlayani</span>
            <strong>{uniqueRombels}</strong>
          </div>
        </div>

        <div className="tm-stat-card">
          <div className="tm-stat-icon orange">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Total Beban JP/Minggu</span>
            <strong>{totalJP}</strong>
          </div>
        </div>
      </div>

      <div className="tm-info-panel">
        <div className="tm-info-icon">
          <Layers3 size={20} />
        </div>

        <div>
          <strong>Aturan pembagian blok JP</strong>
          <p>
            Sistem menyusun penugasan Reguler dalam blok
            2–3 JP berurutan. Contoh: 4 JP = 2 + 2,
            5 JP = 3 + 2, 6 JP = 3 + 3, dan 7 JP =
            3 + 2 + 2. Penugasan Tambahan dapat menggunakan
            alokasi 1 JP.
          </p>
        </div>
      </div>

      <div className="tm-toolbar">
        <div className="tm-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cari guru, mata pelajaran, atau rombel..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="tm-filter">
          <Filter size={16} />

          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value)
            }
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>

          <select
            value={filterYear}
            onChange={(event) =>
              setFilterYear(event.target.value)
            }
          >
            <option value="Semua">Semua Tahun Ajaran</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={filterSemester}
            onChange={(event) =>
              setFilterSemester(event.target.value)
            }
          >
            <option value="Semua">Semua Semester</option>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      <div className="tm-table-card">
        <div className="tm-table-heading">
          <div>
            <h2>Daftar Penugasan Mengajar</h2>
            <p>
              {filteredAssignments.length} data ditemukan
            </p>
          </div>
        </div>

        <div className="tm-table-wrap">
          <table className="tm-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Guru</th>
                <th>Mata Pelajaran</th>
                <th>Rombel</th>
                <th>Jenis</th>
                <th>Tahun Ajaran</th>
                <th>Semester</th>
                <th>JP/Minggu</th>
                <th>Pola Blok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredAssignments.map((item, index) => {
                const pattern = getPattern(
                  item.jpPerMinggu,
                  item.jenisPenugasan || "Reguler"
                );

                return (
                  <tr key={item.id}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>
                        {getTeacherName(item.guruId)}
                      </strong>
                    </td>

                    <td>
                      {getSubjectName(item.mapelId)}
                    </td>

                    <td>
                      {getRombelName(item.rombelId)}
                    </td>

                    <td>
                      <span
                        className={`tm-type-badge ${
                          item.jenisPenugasan === "Tambahan"
                            ? "additional"
                            : "regular"
                        }`}
                      >
                        {item.jenisPenugasan || "Reguler"}
                      </span>
                    </td>

                    <td>{item.tahunAjaran}</td>
                    <td>{item.semester}</td>
                    <td>
                      <strong>{item.jpPerMinggu} JP</strong>
                    </td>

                    <td>
                      <span className="tm-pattern-badge">
                        {pattern.label}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`tm-status ${
                          item.status === "Aktif"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <div className="tm-actions">
                        <button
                          type="button"
                          title="Detail"
                          onClick={() => openDetail(item)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title={
                            item.status === "Aktif"
                              ? "Nonaktifkan"
                              : "Aktifkan"
                          }
                          onClick={() => toggleStatus(item)}
                        >
                          <Power size={16} />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan="11">
                    <div className="tm-empty">
                      <BookOpen size={30} />
                      <strong>Belum ada penugasan</strong>
                      <span>
                        Tambahkan penugasan mengajar atau
                        ubah kata kunci pencarian.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "form" && (
        <Modal
          title={
            editingId
              ? "Edit Penugasan Mengajar"
              : "Tambah Penugasan Mengajar"
          }
          onClose={() => {
  setModal("");
  setSelectedId(null);
}}
        >
          <form onSubmit={handleSubmit}>
            <div className="tm-form-grid">
              <label className="tm-field tm-full">
                <span>Guru Pengampu *</span>
                <select
                  value={form.guruId}
                  onChange={(event) =>
                    updateForm("guruId", event.target.value)
                  }
                  required
                >
                  <option value="">Pilih guru</option>
                  {activeTeachers.map((teacher) => (
                    <option
                      key={teacher.id}
                      value={teacher.id}
                    >
                      {teacher.nama || teacher.namaGuru}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tm-field">
                <span>Rombongan Belajar *</span>
                <select
                  value={form.rombelId}
                  onChange={(event) => {
                    const value = event.target.value;
                    const rombel = getRombel(value);

                    setForm((previous) => ({
                      ...previous,
                      rombelId: value,
                      tahunAjaran:
                        rombel?.tahunAjaran ||
                        previous.tahunAjaran,
                      mapelId: "",
                    }));

                    setError("");
                  }}
                  required
                >
                  <option value="">Pilih rombel</option>
                  {activeRombels.map((rombel) => (
                    <option
                      key={rombel.id}
                      value={rombel.id}
                    >
                      {rombel.namaRombel}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tm-field">
                <span>Mata Pelajaran *</span>
                <select
                  value={form.mapelId}
                  onChange={(event) =>
                    updateForm("mapelId", event.target.value)
                  }
                  required
                >
                  <option value="">Pilih mata pelajaran</option>
                  {availableSubjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.nama || subject.namaMapel}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tm-field">
                <span>Jenis Penugasan *</span>
                <select
                  value={form.jenisPenugasan}
                  onChange={(event) =>
                    updateForm(
                      "jenisPenugasan",
                      event.target.value
                    )
                  }
                >
                  <option value="Reguler">Reguler</option>
                  <option value="Tambahan">Tambahan</option>
                </select>
                <small>
                  Tambahan digunakan untuk penugasan yang
                  memang dialokasikan 1 JP.
                </small>
              </label>

              <label className="tm-field">
                <span>Alokasi JP per Minggu *</span>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={form.jpPerMinggu}
                  onChange={(event) =>
                    updateForm(
                      "jpPerMinggu",
                      event.target.value
                    )
                  }
                  required
                />
              </label>

              <label className="tm-field">
                <span>Tahun Ajaran *</span>
                <input
                  type="text"
                  value={form.tahunAjaran}
                  onChange={(event) =>
                    updateForm(
                      "tahunAjaran",
                      event.target.value
                    )
                  }
                  placeholder="2026/2027"
                  required
                />
              </label>

              <label className="tm-field">
                <span>Semester *</span>
                <select
                  value={form.semester}
                  onChange={(event) =>
                    updateForm("semester", event.target.value)
                  }
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </label>

              <label className="tm-field tm-full">
                <span>Keterangan</span>
                <textarea
                  rows="3"
                  value={form.keterangan}
                  onChange={(event) =>
                    updateForm("keterangan", event.target.value)
                  }
                  placeholder="Keterangan tambahan (opsional)"
                />
              </label>
            </div>

            <div className="tm-pattern-preview">
              <div className="tm-preview-heading">
                <Layers3 size={18} />
                <strong>Pratinjau Pembagian Blok JP</strong>
              </div>

              {patternPreview.valid ? (
                <>
                  <div className="tm-block-list">
                    {patternPreview.blocks.map(
                      (block, index) => (
                        <div
                          className="tm-block-item"
                          key={`${block}-${index}`}
                        >
                          <strong>{block} JP</strong>
                          <span>
                            Pertemuan {index + 1}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  <p>
                    Total {form.jpPerMinggu} JP per minggu
                    dibagi menjadi {patternPreview.label}.
                    Setiap blok dijadwalkan berurutan dalam
                    satu hari.
                  </p>
                </>
              ) : (
                <div className="tm-pattern-error">
                  <AlertCircle size={17} />
                  Penugasan Reguler minimal 2 JP.
                  Alokasi 1 JP hanya diperbolehkan untuk
                  jenis Tambahan.
                </div>
              )}
            </div>

            {error && (
              <div className="tm-form-error">
                <AlertCircle size={17} />
                {error}
              </div>
            )}

            <div className="tm-form-footer">
              <button
                type="button"
                className="tm-secondary-button"
                onClick={() => setModal("")}
              >
                Batal
              </button>

              <button
                type="submit"
                className="tm-primary-button"
              >
                <CheckCircle2 size={17} />
                {editingId
                  ? "Simpan Perubahan"
                  : "Simpan Penugasan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "detail" && selected && (
        <Modal
          title="Detail Penugasan Mengajar"
          onClose={() => setModal("")}
        >
          <div className="tm-detail-grid">
            <div>
              <span>Guru Pengampu</span>
              <strong>
                {getTeacherName(selected.guruId)}
              </strong>
            </div>

            <div>
              <span>Mata Pelajaran</span>
              <strong>
                {getSubjectName(selected.mapelId)}
              </strong>
            </div>

            <div>
              <span>Rombongan Belajar</span>
              <strong>
                {getRombelName(selected.rombelId)}
              </strong>
            </div>

            <div>
              <span>Jenis Penugasan</span>
              <strong>
                {selected.jenisPenugasan || "Reguler"}
              </strong>
            </div>

            <div>
              <span>Alokasi JP/Minggu</span>
              <strong>{selected.jpPerMinggu} JP</strong>
            </div>

            <div>
              <span>Pola Pembagian</span>
              <strong>
                {
                  getPattern(
                    selected.jpPerMinggu,
                    selected.jenisPenugasan || "Reguler"
                  ).label
                }
              </strong>
            </div>

            <div>
              <span>Tahun Ajaran</span>
              <strong>{selected.tahunAjaran}</strong>
            </div>

            <div>
              <span>Semester</span>
              <strong>{selected.semester}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{selected.status}</strong>
            </div>

            <div>
              <span>Sumber Data</span>
              <strong>{selected.sumber || "Manual"}</strong>
            </div>

            <div className="tm-detail-full">
              <span>Keterangan</span>
              <strong>
                {selected.keterangan || "-"}
              </strong>
            </div>
          </div>

          <div className="tm-form-footer">
            <button
              type="button"
              className="tm-secondary-button"
              onClick={() => {
                setModal("");
                setSelectedId(null);
              }}
            >
              Tutup
            </button>

            <button
              type="button"
              className="tm-primary-button"
              onClick={() => openEdit(selected)}
            >
              <Pencil size={16} />
              Edit Penugasan
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
