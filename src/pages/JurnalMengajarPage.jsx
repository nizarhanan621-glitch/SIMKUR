
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ClipboardPenLine,
  BookOpen,
  Clock3,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertTriangle,
    Save,
  X,
  Pencil,
  Info,
  FileText,
  CalendarOff,
  RefreshCw,
} from "lucide-react";

import { loadAcademicCalendarEvents } from "../lib/calendarStorage";
import "../styles/JurnalMengajarPage.css";

const KEY = {
  journals: "simkur_data_jurnal_mengajar",
  schedules: "simkur_data_jadwal_pelajaran",
  settings: "simkur_pengaturan_jadwal",
  assignments: "simkur_data_tugas_mengajar",
  teachers: "simkur_data_guru",
  rombels: "simkur_data_rombel",
  subjects: "simkur_data_mata_pelajaran",
};

const DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const CLOSURE_CATEGORIES = [
  "libur_nasional",
  "libur_sekolah",
  "libur_daerah",
];

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Gagal membaca ${key}:`, error);
    return [];
  }
}

function readObject(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch (error) {
    console.error(`Gagal membaca ${key}:`, error);
    return {};
  }
}

function readJournalStorage() {
  try {
    const raw = localStorage.getItem(KEY.journals);

    if (raw === null) {
      return { data: [], valid: true, message: "" };
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return {
        data: [],
        valid: false,
        message:
          "Format penyimpanan jurnal tidak valid. Perubahan dikunci untuk melindungi data lama.",
      };
    }

    const invalidIndex = parsed.findIndex(
      (item) =>
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        item.id == null ||
        String(item.id).trim() === "" ||
        !item.meetingKey
    );

    if (invalidIndex !== -1) {
      return {
        data: [],
        valid: false,
        message:
          `Data jurnal pada baris ke-${invalidIndex + 1} tidak memiliki identitas yang valid. Penyimpanan dikunci untuk melindungi data.`,
      };
    }

    const ids = parsed.map((item) => String(item.id));

    if (new Set(ids).size !== ids.length) {
      return {
        data: [],
        valid: false,
        message:
          "Ditemukan ID jurnal ganda. Penyimpanan dikunci untuk melindungi data.",
      };
    }

    return { data: parsed, valid: true, message: "" };
  } catch (error) {
    console.error("Gagal membaca data jurnal:", error);

    return {
      data: [],
      valid: false,
      message:
        "Data jurnal tidak dapat dibaca. Penyimpanan dikunci agar data lama tidak tertimpa.",
    };
  }
}

function isActive(item) {
  return Boolean(item) && item.status !== "Nonaktif";
}

function createId() {
  const random =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `jurnal-${random}`;
}

function todayKey() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDateInfo(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return {
    date,
    dayName: DAYS[date.getDay()],
  };
}

function formatDate(value) {
  const info = getDateInfo(value);

  if (!info) return value || "-";

  return info.date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getName(item, fields) {
  for (const field of fields) {
    if (item?.[field]) return item[field];
  }

  return "Data tidak ditemukan";
}

function getExpectedBlocks(assignment) {
  const total = Number(assignment?.jpPerMinggu || 0);
  const type = assignment?.jenisPenugasan || "Reguler";

  if (!Number.isInteger(total) || total < 1 || total > 40) {
    return [];
  }

  if (total === 1) {
    return type === "Tambahan" ? [1] : [];
  }

  const blocks = [];
  let remaining = total;

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
      return [];
    }
  }

  return blocks;
}

function findSubsetPositions(blocks, target, start = 0, selected = []) {
  if (target === 0) return [...selected];
  if (target < 0) return null;

  for (let index = start; index < blocks.length; index += 1) {
    selected.push(index);

    const result = findSubsetPositions(
      blocks,
      target - blocks[index].size,
      index + 1,
      selected
    );

    if (result) return result;
    selected.pop();
  }

  return null;
}

function toMinutes(value) {
  const [hour, minute] = String(value || "07:00")
    .split(":")
    .map(Number);

  return hour * 60 + minute;
}

function toTime(value) {
  const hour = Math.floor(value / 60) % 24;
  const minute = value % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getPeriodTimes(settings, day) {
  const config = settings?.hari?.[day] || {};
  const total = Math.max(0, Number(config.jumlahJP ?? 8));
  const duration = Math.max(1, Number(settings?.durasiJP || 40));

  let cursor = toMinutes(settings?.jamMulai || "07:00");

  (Array.isArray(config.pembiasaan) ? config.pembiasaan : []).forEach(
    (item) => {
      cursor += Math.max(0, Number(item.durasi || 0));
    }
  );

  const result = {};

  for (let number = 1; number <= total; number += 1) {
    const start = cursor;
    cursor += duration;

    result[number] = {
      start: toTime(start),
      end: toTime(cursor),
    };

    (Array.isArray(config.istirahat) ? config.istirahat : [])
      .filter((item) => Number(item.setelahJP) === number)
      .forEach((item) => {
        cursor += Math.max(0, Number(item.durasi || 0));
      });
  }

  return result;
}

function getDateRange(event) {
  const start = event.startDate || event.date || "";
  const end = event.endDate || event.startDate || event.date || "";

  return { start, end };
}

function eventCoversDate(event, date) {
  const { start, end } = getDateRange(event);

  return Boolean(start && end && start <= date && date <= end);
}

function buildMeetingSessions(
  rows,
  assignment,
  selectedDate,
  settings,
  teacher,
  rombel,
  subject,
  dayName
) {
  const expected = getExpectedBlocks(assignment);

  if (!expected.length) {
    return {
      sessions: [],
      warnings: [
        `${getName(subject, ["nama", "namaMapel"])} memiliki alokasi JP yang tidak membentuk pola blok yang valid.`,
      ],
    };
  }

  const periodRows = rows
    .map((item) => ({
      period: Number(item.jamKe),
      id: item.id,
    }))
    .filter(
      (item) =>
        Number.isInteger(item.period) &&
        item.period > 0
    )
    .sort((a, b) => a.period - b.period);

  const uniquePeriods = [...new Set(periodRows.map((item) => item.period))];

  if (uniquePeriods.length !== periodRows.length) {
    return {
      sessions: [],
      warnings: [
        `${getName(subject, ["nama", "namaMapel"])} memiliki slot JP ganda pada ${dayName}. Periksa Jadwal Pelajaran.`,
      ],
    };
  }

  const runs = [];
  let currentRun = [];

  uniquePeriods.forEach((period) => {
    if (
      currentRun.length === 0 ||
      period === currentRun[currentRun.length - 1] + 1
    ) {
      currentRun.push(period);
    } else {
      runs.push(currentRun);
      currentRun = [period];
    }
  });

  if (currentRun.length) runs.push(currentRun);

  const available = expected.map((size, index) => ({
    size,
    index,
  }));

  const remaining = [...available];
  const warnings = [];
  const sessions = [];
  const periodTimes = getPeriodTimes(settings, dayName);

  // Rangkaian terpanjang diproses terlebih dahulu.
  const orderedRuns = [...runs].sort(
    (a, b) => b.length - a.length || a[0] - b[0]
  );

  orderedRuns.forEach((run) => {
    const positions = findSubsetPositions(remaining, run.length);

    if (!positions) {
      warnings.push(
        `${getName(subject, ["nama", "namaMapel"])} memiliki rangkaian JP ${run[0]}–${run[run.length - 1]} yang tidak sesuai dengan pola blok penugasan.`
      );
      return;
    }

    const selectedBlocks = positions
      .map((position) => remaining[position])
      .sort((a, b) => a.index - b.index);

    let offset = 0;

    selectedBlocks.forEach((block) => {
      const blockPeriods = run.slice(offset, offset + block.size);
      offset += block.size;

      const firstPeriod = blockPeriods[0];
      const lastPeriod = blockPeriods[blockPeriods.length - 1];

      const startTime = periodTimes[firstPeriod]?.start || "--:--";
      const endTime = periodTimes[lastPeriod]?.end || "--:--";

      sessions.push({
        meetingKey:
          `${selectedDate}|${assignment.id}|${dayName}|${firstPeriod}-${lastPeriod}`,
        tanggal: selectedDate,
        hari: dayName,
        tugasMengajarId: assignment.id,
        guruId: assignment.guruId,
        rombelId: assignment.rombelId,
        mapelId: assignment.mapelId,
        teacherName: getName(teacher, ["nama", "namaGuru"]),
        rombelName: getName(rombel, ["namaRombel"]),
        subjectName: getName(subject, ["nama", "namaMapel"]),
        jpTerjadwal: block.size,
        periods: blockPeriods,
        startPeriod: firstPeriod,
        endPeriod: lastPeriod,
        startTime,
        endTime,
        scheduleIds: periodRows
          .filter((item) => blockPeriods.includes(item.period))
          .map((item) => item.id),
      });
    });

    // Blok yang sudah digunakan tidak boleh dipakai lagi.
    positions
      .sort((a, b) => b - a)
      .forEach((position) => remaining.splice(position, 1));
  });

  sessions.sort((a, b) => a.startPeriod - b.startPeriod);

  return { sessions, warnings };
}

function getStatusLabel(status) {
  if (status === "Terlaksana") return "Terlaksana";
  if (status === "Tidak Terlaksana") return "Tidak Terlaksana";
  if (status === "Sebagian") return "Terlaksana Sebagian";
  return "Belum Diisi";
}

export default function JurnalMengajarPage() {
  const [teachers, setTeachers] = useState(() =>
    readArray(KEY.teachers)
  );
  const [rombels, setRombels] = useState(() =>
    readArray(KEY.rombels)
  );
  const [subjects, setSubjects] = useState(() =>
    readArray(KEY.subjects)
  );
  const [assignments, setAssignments] = useState(() =>
    readArray(KEY.assignments)
  );
  const [schedules, setSchedules] = useState(() =>
    readArray(KEY.schedules)
  );
  const [settings, setSettings] = useState(() =>
    readObject(KEY.settings)
  );
  const [calendarEvents, setCalendarEvents] = useState(() =>
    loadAcademicCalendarEvents()
  );

  const [journalLoad] = useState(() => readJournalStorage());
  const [journals, setJournals] = useState(journalLoad.data);
  const journalsRef = useRef(journalLoad.data);

  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey());

  const [editingBlock, setEditingBlock] = useState(null);
  const [form, setForm] = useState({
    statusPelaksanaan: "",
    jpTerlaksana: "",
    materiPokok: "",
    kegiatanPembelajaran: "",
    metodePembelajaran: "",
    alasanTidakTerlaksana: "",
    tindakLanjut: "",
    catatan: "",
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    const refreshMasterData = () => {
      setTeachers(readArray(KEY.teachers));
      setRombels(readArray(KEY.rombels));
      setSubjects(readArray(KEY.subjects));
      setAssignments(readArray(KEY.assignments));
      setSchedules(readArray(KEY.schedules));
      setSettings(readObject(KEY.settings));
      setCalendarEvents(loadAcademicCalendarEvents());
    };

    window.addEventListener("focus", refreshMasterData);
    window.addEventListener("storage", refreshMasterData);
    window.addEventListener(
      "simkur-calendar-updated",
      refreshMasterData
    );

    return () => {
      window.removeEventListener("focus", refreshMasterData);
      window.removeEventListener("storage", refreshMasterData);
      window.removeEventListener(
        "simkur-calendar-updated",
        refreshMasterData
      );
    };
  }, []);

  const activeTeachers = useMemo(
    () => teachers.filter(isActive),
    [teachers]
  );

  useEffect(() => {
    const stillAvailable = activeTeachers.some(
      (item) => String(item.id) === String(selectedTeacherId)
    );

    if (!stillAvailable) {
      setSelectedTeacherId(
        activeTeachers[0] ? String(activeTeachers[0].id) : ""
      );
    }
  }, [activeTeachers, selectedTeacherId]);

  const activeDays = useMemo(
    () =>
      settings.polaHari === "senin-sabtu"
        ? ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
        : ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    [settings.polaHari]
  );

  const selectedTeacher = activeTeachers.find(
    (item) => String(item.id) === String(selectedTeacherId)
  );

  const selectedDateInfo = getDateInfo(selectedDate);
  const isFutureDate = selectedDate > todayKey();

  const activeAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        if (!isActive(assignment)) return false;

        const teacher = teachers.find(
          (item) => String(item.id) === String(assignment.guruId)
        );
        const rombel = rombels.find(
          (item) => String(item.id) === String(assignment.rombelId)
        );
        const subject = subjects.find(
          (item) => String(item.id) === String(assignment.mapelId)
        );

        return (
          isActive(teacher) &&
          isActive(rombel) &&
          isActive(subject)
        );
      }),
    [assignments, teachers, rombels, subjects]
  );

  const calendarEventsForDate = useMemo(
    () =>
      calendarEvents.filter(
        (event) =>
          event.status === "approved" &&
          eventCoversDate(event, selectedDate)
      ),
    [calendarEvents, selectedDate]
  );

  const closureEvents = calendarEventsForDate.filter(
    (event) =>
      CLOSURE_CATEGORIES.includes(event.category) ||
      (
        event.category === "cuti_bersama" &&
        event.keputusanSekolah === "libur"
      )
  );

  const cutiNeedsDecision = calendarEventsForDate.filter(
    (event) =>
      event.category === "cuti_bersama" &&
      !event.keputusanSekolah
  );

  const isSchoolDay =
    selectedDateInfo &&
    activeDays.includes(selectedDateInfo.dayName);

  const scheduleResult = useMemo(() => {
    if (!selectedTeacherId || !selectedDateInfo || !isSchoolDay) {
      return { sessions: [], warnings: [] };
    }

    if (closureEvents.length > 0) {
      return { sessions: [], warnings: [] };
    }

    const teacherAssignments = activeAssignments.filter(
      (item) =>
        String(item.guruId) === String(selectedTeacherId)
    );

    const sessions = [];
    const warnings = [];

    teacherAssignments.forEach((assignment) => {
      const rows = schedules.filter(
        (item) =>
          String(item.tugasMengajarId) === String(assignment.id) &&
          item.hari === selectedDateInfo.dayName &&
          item.status !== "Nonaktif"
      );

      if (!rows.length) return;

      const teacher = teachers.find(
        (item) => String(item.id) === String(assignment.guruId)
      );
      const rombel = rombels.find(
        (item) => String(item.id) === String(assignment.rombelId)
      );
      const subject = subjects.find(
        (item) => String(item.id) === String(assignment.mapelId)
      );

      const result = buildMeetingSessions(
        rows,
        assignment,
        selectedDate,
        settings,
        teacher,
        rombel,
        subject,
        selectedDateInfo.dayName
      );

      sessions.push(...result.sessions);
      warnings.push(...result.warnings);
    });

    sessions.sort(
      (a, b) => a.startPeriod - b.startPeriod
    );

    return { sessions, warnings };
  }, [
    selectedTeacherId,
    selectedDate,
    selectedDateInfo,
    isSchoolDay,
    closureEvents,
    activeAssignments,
    schedules,
    teachers,
    rombels,
    subjects,
    settings,
  ]);

  const currentJournals = useMemo(
    () =>
      journals.filter(
        (item) =>
          String(item.guruId) === String(selectedTeacherId) &&
          item.tanggal === selectedDate
      ),
    [journals, selectedTeacherId, selectedDate]
  );

  const journalHistory = useMemo(
    () =>
      journals
        .filter(
          (item) =>
            String(item.guruId) === String(selectedTeacherId)
        )
        .sort((a, b) =>
          String(b.tanggal).localeCompare(String(a.tanggal))
        )
        .slice(0, 5),
    [journals, selectedTeacherId]
  );

  const completedCount = scheduleResult.sessions.filter(
    (session) =>
      journals.some(
        (item) => item.meetingKey === session.meetingKey
      )
  ).length;

  const totalScheduledJP = scheduleResult.sessions.reduce(
    (sum, session) => sum + session.jpTerjadwal,
    0
  );

  const totalCompletedJP = currentJournals.reduce(
    (sum, item) => sum + Number(item.jpTerlaksana || 0),
    0
  );

  function commitJournals(updater) {
    if (!journalLoad.valid) {
      alert(
        journalLoad.message ||
          "Penyimpanan jurnal dikunci untuk melindungi data."
      );
      return false;
    }

    try {
      const previous = journalsRef.current;
      const next =
        typeof updater === "function"
          ? updater(previous)
          : updater;

      if (!Array.isArray(next)) {
        throw new Error("Format data jurnal tidak valid.");
      }

      const ids = next.map((item) => String(item.id));

      if (new Set(ids).size !== ids.length) {
        throw new Error("Ditemukan ID jurnal yang sama.");
      }

      localStorage.setItem(
        KEY.journals,
        JSON.stringify(next)
      );

      journalsRef.current = next;
      setJournals(next);

      return true;
    } catch (error) {
      console.error("Gagal menyimpan jurnal:", error);

      alert(
        "Jurnal gagal disimpan. Tampilan tidak diubah. Periksa kapasitas penyimpanan browser."
      );

      return false;
    }
  }

  function openJournal(session) {
    const existing = journals.find(
      (item) => item.meetingKey === session.meetingKey
    );

    setForm({
      statusPelaksanaan: existing?.statusPelaksanaan || "",
      jpTerlaksana:
        existing?.jpTerlaksana != null
          ? String(existing.jpTerlaksana)
          : "",
      materiPokok: existing?.materiPokok || "",
      kegiatanPembelajaran: existing?.kegiatanPembelajaran || "",
      metodePembelajaran: existing?.metodePembelajaran || "",
      alasanTidakTerlaksana: existing?.alasanTidakTerlaksana || "",
      tindakLanjut: existing?.tindakLanjut || "",
      catatan: existing?.catatan || "",
    });

    setFormError("");
    setEditingBlock(session);
  }

  function closeJournal() {
    setEditingBlock(null);
    setFormError("");
  }

  function handleSaveJournal(event) {
    event.preventDefault();

    if (!editingBlock) return;

    if (!journalLoad.valid) {
      setFormError(journalLoad.message);
      return;
    }

    if (isFutureDate) {
      setFormError(
        "Jurnal belum dapat diisi untuk tanggal yang akan datang."
      );
      return;
    }

    const status = form.statusPelaksanaan;

    if (!status) {
      setFormError("Pilih status pelaksanaan pembelajaran.");
      return;
    }

    if (
      status !== "Tidak Terlaksana" &&
      !form.materiPokok.trim()
    ) {
      setFormError("Materi pokok wajib diisi untuk KBM yang terlaksana.");
      return;
    }

    if (
      (status === "Tidak Terlaksana" || status === "Sebagian") &&
      !form.alasanTidakTerlaksana.trim()
    ) {
      setFormError("Alasan ketidakterlaksanaan wajib diisi.");
      return;
    }

    let jpTerlaksana = editingBlock.jpTerjadwal;

    if (status === "Tidak Terlaksana") {
      jpTerlaksana = 0;
    }

    if (status === "Sebagian") {
      jpTerlaksana = Number(form.jpTerlaksana);

      if (
        !Number.isInteger(jpTerlaksana) ||
        jpTerlaksana < 1 ||
        jpTerlaksana >= editingBlock.jpTerjadwal
      ) {
        setFormError(
          `JP terlaksana harus antara 1 sampai ${editingBlock.jpTerjadwal - 1}.`
        );
        return;
      }
    }

    const now = new Date().toISOString();
    const previous = journalsRef.current;
    const existing = previous.find(
      (item) => item.meetingKey === editingBlock.meetingKey
    );

    const record = {
      id: existing?.id || createId(),
      meetingKey: editingBlock.meetingKey,
      tanggal: editingBlock.tanggal,
      hari: editingBlock.hari,
      tugasMengajarId: editingBlock.tugasMengajarId,
      guruId: editingBlock.guruId,
      rombelId: editingBlock.rombelId,
      mapelId: editingBlock.mapelId,
      jpTerjadwal: editingBlock.jpTerjadwal,
      jpTerlaksana,
      jamKe: editingBlock.periods,
      jamMulai: editingBlock.startTime,
      jamSelesai: editingBlock.endTime,
      statusPelaksanaan: status,
      materiPokok: form.materiPokok.trim(),
      kegiatanPembelajaran: form.kegiatanPembelajaran.trim(),
      metodePembelajaran: form.metodePembelajaran.trim(),
      alasanTidakTerlaksana: form.alasanTidakTerlaksana.trim(),
      tindakLanjut: form.tindakLanjut.trim(),
      catatan: form.catatan.trim(),
      snapshot: {
        namaGuru: editingBlock.teacherName,
        namaRombel: editingBlock.rombelName,
        namaMapel: editingBlock.subjectName,
        jpTerjadwal: editingBlock.jpTerjadwal,
        jamKe: editingBlock.periods,
        jamMulai: editingBlock.startTime,
        jamSelesai: editingBlock.endTime,
      },
      sumber: "Jurnal Mengajar Guru",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const saved = commitJournals((current) => {
      const index = current.findIndex(
        (item) => item.meetingKey === record.meetingKey
      );

      if (index === -1) return [record, ...current];

      return current.map((item, itemIndex) =>
        itemIndex === index ? record : item
      );
    });

    if (saved) closeJournal();
  }

  const journalBlocked =
    closureEvents.length > 0 ||
    !isSchoolDay ||
    !selectedDateInfo ||
    !selectedTeacher;

  return (
    <div className="jm-page">
      <header className="jm-heading">
        <div>
          <span className="jm-eyebrow">RUANG KERJA GURU</span>
          <h2>Jurnal Mengajar</h2>
          <p>
            Catat pelaksanaan pembelajaran berdasarkan jadwal mengajar
            yang telah ditetapkan sekolah.
          </p>
        </div>

        <div className="jm-heading-icon">
          <ClipboardPenLine size={25} />
        </div>
      </header>

      <div className="jm-preview-notice">
        <AlertTriangle size={18} />
        <div>
          <strong>Mode Preview Guru</strong>
          <span>
            Profil guru dipilih secara manual untuk pengujian. Penguncian
            identitas berdasarkan akun belum aktif.
          </span>
        </div>
      </div>

      {!journalLoad.valid && (
        <div className="jm-alert error" role="alert">
          <AlertTriangle size={18} />
          {journalLoad.message}
        </div>
      )}

      <section className="jm-filter-panel">
        <label>
          <span>Profil Guru</span>
          <select
            value={selectedTeacherId}
            onChange={(event) =>
              setSelectedTeacherId(event.target.value)
            }
          >
            <option value="">Pilih profil guru</option>
            {activeTeachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {getName(teacher, ["nama", "namaGuru"])}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Tanggal Jurnal</span>
          <input
            type="date"
            value={selectedDate}
            max={todayKey()}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>

        <div className="jm-date-display">
          <CalendarDays size={18} />
          <div>
            <span>TANGGAL DIPILIH</span>
            <strong>{formatDate(selectedDate)}</strong>
          </div>
        </div>
      </section>

      <section className="jm-summary-grid">
        <article>
          <div className="jm-summary-icon blue">
            <BookOpen size={20} />
          </div>
          <div>
            <span>Pertemuan Terjadwal</span>
            <strong>{scheduleResult.sessions.length}</strong>
          </div>
        </article>

        <article>
          <div className="jm-summary-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Jurnal Terisi</span>
            <strong>{completedCount}</strong>
          </div>
        </article>

        <article>
          <div className="jm-summary-icon purple">
            <Clock3 size={20} />
          </div>
          <div>
            <span>JP Terjadwal</span>
            <strong>{totalScheduledJP}</strong>
          </div>
        </article>

        <article>
          <div className="jm-summary-icon orange">
            <GraduationCap size={20} />
          </div>
          <div>
            <span>JP Terlaksana</span>
            <strong>{totalCompletedJP}</strong>
          </div>
        </article>
      </section>

      {cutiNeedsDecision.length > 0 && (
        <div className="jm-alert warning">
          <AlertTriangle size={18} />
          <div>
            <strong>Ada agenda Cuti Bersama</strong>
            <span>
              Cuti bersama tidak otomatis menghentikan KBM. Keputusan
              operasional sekolah perlu ditetapkan terlebih dahulu.
            </span>
          </div>
        </div>
      )}

      {closureEvents.length > 0 && (
        <div className="jm-alert warning">
          <CalendarOff size={19} />
          <div>
            <strong>Tidak ada pengisian jurnal pada tanggal ini</strong>
            <span>
              {closureEvents.map((item) => item.title).join(", ")}
              {" — "}agenda libur telah disetujui pada Kalender Akademik.
            </span>
          </div>
        </div>
      )}

      {!isSchoolDay && selectedDateInfo && (
        <div className="jm-alert warning">
          <CalendarOff size={19} />
          <div>
            <strong>Bukan hari belajar sekolah</strong>
            <span>
              {selectedDateInfo.dayName} tidak termasuk pola hari belajar
              sekolah yang sedang dikonfigurasi.
            </span>
          </div>
        </div>
      )}

      {isFutureDate && (
        <div className="jm-alert info">
          <Clock3 size={18} />
          Jurnal hanya dapat diisi setelah tanggal pembelajaran berlangsung.
        </div>
      )}

      <section className="jm-session-panel">
        <div className="jm-panel-heading">
          <div>
            <h3>Jadwal Pertemuan pada Tanggal Terpilih</h3>
            <p>
              Pertemuan ditampilkan berdasarkan blok JP yang terdaftar
              pada Jadwal Pelajaran.
            </p>
          </div>
          <CalendarDays size={22} />
        </div>

        {scheduleResult.warnings.length > 0 && (
          <div className="jm-alert warning">
            <AlertTriangle size={18} />
            <div>
              <strong>Perlu pemeriksaan susunan jadwal</strong>
              {scheduleResult.warnings.map((warning, index) => (
                <span key={index}>{warning}</span>
              ))}
            </div>
          </div>
        )}

        {journalBlocked ? (
          <div className="jm-empty">
            <CalendarOff size={30} />
            <strong>Belum ada pertemuan yang dapat dijurnal</strong>
            <span>
              Periksa profil guru, tanggal, pola hari sekolah, dan Kalender
              Akademik.
            </span>
          </div>
        ) : scheduleResult.sessions.length === 0 ? (
          <div className="jm-empty">
            <BookOpen size={30} />
            <strong>Tidak ada jadwal mengajar</strong>
            <span>
              Tidak ditemukan jadwal mengajar untuk guru dan tanggal yang
              dipilih.
            </span>
          </div>
        ) : (
          <div className="jm-session-list">
            {scheduleResult.sessions.map((session) => {
              const savedJournal = journals.find(
                (item) => item.meetingKey === session.meetingKey
              );

              return (
                <article
                  className="jm-session-card"
                  key={session.meetingKey}
                >
                  <div className="jm-session-main">
                    <div className="jm-session-time">
                      <Clock3 size={16} />
                      <strong>
                        {session.startTime}–{session.endTime}
                      </strong>
                    </div>

                    <h4>{session.subjectName}</h4>

                    <div className="jm-session-meta">
                      <span>
                        <GraduationCap size={14} />
                        {session.rombelName}
                      </span>
                      <span>
                        <Users size={14} />
                        {session.teacherName}
                      </span>
                      <span>
                        <BookOpen size={14} />
                        JP {session.startPeriod}–{session.endPeriod}
                        {" "}({session.jpTerjadwal} JP)
                      </span>
                    </div>
                  </div>

                  <div className="jm-session-action">
                    <span
                      className={`jm-status ${
                        savedJournal
                          ? savedJournal.statusPelaksanaan === "Terlaksana"
                            ? "done"
                            : savedJournal.statusPelaksanaan === "Tidak Terlaksana"
                              ? "missed"
                              : "partial"
                          : "empty"
                      }`}
                    >
                      {savedJournal
                        ? getStatusLabel(savedJournal.statusPelaksanaan)
                        : "Belum Diisi"}
                    </span>

                    <button
                      type="button"
                      onClick={() => openJournal(session)}
                      disabled={
                        isFutureDate ||
                        !journalLoad.valid ||
                        closureEvents.length > 0
                      }
                    >
                      {savedJournal ? (
                        <>
                          <PencilIcon />
                          Ubah Jurnal
                        </>
                      ) : (
                        <>
                          <ClipboardPenLine size={15} />
                          Isi Jurnal
                        </>
                      )}
                    </button>
                  </div>

                  {savedJournal && (
                    <div className="jm-saved-preview">
                      <strong>Materi:</strong>{" "}
                      {savedJournal.materiPokok || "-"}
                      {savedJournal.alasanTidakTerlaksana && (
                        <span>
                          <strong>Alasan:</strong>{" "}
                          {savedJournal.alasanTidakTerlaksana}
                        </span>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="jm-history-panel">
        <div className="jm-panel-heading">
          <div>
            <h3>Riwayat Jurnal Terakhir</h3>
            <p>Lima catatan terakhir dari profil guru yang dipilih.</p>
          </div>
          <FileText size={21} />
        </div>

        {journalHistory.length === 0 ? (
          <div className="jm-history-empty">
            Belum ada jurnal yang tersimpan untuk guru ini.
          </div>
        ) : (
          <div className="jm-history-list">
            {journalHistory.map((item) => (
              <div className="jm-history-item" key={item.id}>
                <div>
                  <strong>
                    {item.snapshot?.namaMapel || "Mata pelajaran"}
                  </strong>
                  <span>
                    {formatDate(item.tanggal)} ·{" "}
                    {item.snapshot?.namaRombel || "Rombel"}
                  </span>
                  <small>
                    {item.materiPokok || "Materi tidak dicantumkan"}
                  </small>
                </div>

                <span
                  className={`jm-status ${
                    item.statusPelaksanaan === "Terlaksana"
                      ? "done"
                      : item.statusPelaksanaan === "Tidak Terlaksana"
                        ? "missed"
                        : "partial"
                  }`}
                >
                  {getStatusLabel(item.statusPelaksanaan)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="jm-note">
        <InfoIcon />
        Jurnal disimpan pada browser ini menggunakan localStorage.
        Integrasi database online dan penguncian akun guru akan dilakukan
        pada tahap pengembangan berikutnya.
      </div>

      {editingBlock && (
        <div
          className="jm-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeJournal();
          }}
        >
          <section className="jm-modal" role="dialog" aria-modal="true">
            <div className="jm-modal-header">
              <div>
                <span>JURNAL PEMBELAJARAN</span>
                <h3>{editingBlock.subjectName}</h3>
                <p>
                  {editingBlock.rombelName} · {formatDate(editingBlock.tanggal)}
                  {" · "}JP {editingBlock.startPeriod}–{editingBlock.endPeriod}
                </p>
              </div>

              <button
                type="button"
                onClick={closeJournal}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveJournal}>
              <div className="jm-modal-body">
                <div className="jm-form-grid">
                  <label className="jm-field jm-full">
                    <span>Status Pelaksanaan *</span>
                    <select
                      value={form.statusPelaksanaan}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          statusPelaksanaan: event.target.value,
                          jpTerlaksana:
                            event.target.value === "Sebagian"
                              ? ""
                              : form.jpTerlaksana,
                        })
                      }
                      required
                    >
                      <option value="">Pilih status</option>
                      <option value="Terlaksana">Terlaksana</option>
                      <option value="Sebagian">Terlaksana Sebagian</option>
                      <option value="Tidak Terlaksana">Tidak Terlaksana</option>
                    </select>
                  </label>

                  {form.statusPelaksanaan === "Sebagian" && (
                    <label className="jm-field jm-full">
                      <span>Jumlah JP yang benar-benar terlaksana *</span>
                      <input
                        type="number"
                        min="1"
                        max={editingBlock.jpTerjadwal - 1}
                        value={form.jpTerlaksana}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            jpTerlaksana: event.target.value,
                          })
                        }
                        required
                      />
                    </label>
                  )}

                  <label className="jm-field jm-full">
                    <span>Materi Pokok Pembelajaran *</span>
                    <textarea
                      rows="3"
                      value={form.materiPokok}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          materiPokok: event.target.value,
                        })
                      }
                      placeholder="Materi yang benar-benar disampaikan"
                      disabled={form.statusPelaksanaan === "Tidak Terlaksana"}
                      required={form.statusPelaksanaan !== "Tidak Terlaksana"}
                    />
                  </label>

                  <label className="jm-field jm-full">
                    <span>Kegiatan Pembelajaran</span>
                    <textarea
                      rows="3"
                      value={form.kegiatanPembelajaran}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          kegiatanPembelajaran: event.target.value,
                        })
                      }
                      placeholder="Ringkasan kegiatan pembelajaran di kelas"
                    />
                  </label>

                  <label className="jm-field jm-full">
                    <span>Metode Pembelajaran</span>
                    <input
                      type="text"
                      value={form.metodePembelajaran}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          metodePembelajaran: event.target.value,
                        })
                      }
                      placeholder="Contoh: diskusi, praktik, demonstrasi"
                    />
                  </label>

                  {(form.statusPelaksanaan === "Tidak Terlaksana" ||
                    form.statusPelaksanaan === "Sebagian") && (
                    <label className="jm-field jm-full">
                      <span>Alasan Tidak Terlaksana / Sebagian *</span>
                      <textarea
                        rows="3"
                        value={form.alasanTidakTerlaksana}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            alasanTidakTerlaksana: event.target.value,
                          })
                        }
                        placeholder="Jelaskan penyebabnya"
                        required
                      />
                    </label>
                  )}

                  <label className="jm-field jm-full">
                    <span>Rencana Tindak Lanjut</span>
                    <textarea
                      rows="2"
                      value={form.tindakLanjut}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          tindakLanjut: event.target.value,
                        })
                      }
                      placeholder="Rencana pengganti atau tindak lanjut"
                    />
                  </label>

                  <label className="jm-field jm-full">
                    <span>Catatan Tambahan</span>
                    <textarea
                      rows="2"
                      value={form.catatan}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          catatan: event.target.value,
                        })
                      }
                      placeholder="Catatan lain (opsional)"
                    />
                  </label>
                </div>

                {formError && (
                  <div className="jm-alert error">
                    <AlertTriangle size={17} />
                    {formError}
                  </div>
                )}
              </div>

              <div className="jm-modal-footer">
                <button
                  type="button"
                  className="jm-secondary-button"
                  onClick={closeJournal}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="jm-primary-button"
                >
                  <Save size={16} />
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function PencilIcon() {
  return <Pencil size={15} />;
}

function InfoIcon() {
  return <Info size={16} />;
}
