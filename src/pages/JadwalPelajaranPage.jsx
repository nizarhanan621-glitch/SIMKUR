import { generateTimetableBlocks } from "../utils/timetableGenerator";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Clock3, Plus, Search, Pencil, Trash2, X,
  Users, BookOpen, GraduationCap, AlertTriangle, Settings,
  Save, WandSparkles, Lock, Unlock, RefreshCw, Printer,
  School, CalendarRange, CheckCircle2, SlidersHorizontal,
  Coffee, Sun, ChevronDown, Download,
} from "lucide-react";
import "../styles/JadwalPelajaranPage.css";

const KEY = {
  jadwal: "simkur_data_jadwal_pelajaran",
  pengaturan: "simkur_pengaturan_jadwal",
  tugas: "simkur_data_tugas_mengajar",
  guru: "simkur_data_guru",
  rombel: "simkur_data_rombel",
  mapel: "simkur_data_mata_pelajaran",
  teacherColors: "simkur_teacher_color_map",
};

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const DEFAULT_DAY = {
  jumlahJP: 8,
  pembiasaan: [
    { id: "pembiasaan-1", nama: "Pembiasaan Pagi", durasi: 30 },
  ],
  istirahat: [
    { id: "istirahat-1", nama: "Istirahat 1", setelahJP: 3, durasi: 20 },
    { id: "istirahat-2", nama: "Istirahat 2", setelahJP: 6, durasi: 30 },
  ],
};

const DEFAULT_SETTINGS = {
  polaHari: "senin-jumat",
  jamMulai: "07:00",
  durasiJP: 40,
  hari: Object.fromEntries(
    DAYS.map((day) => [day, structuredClone(DEFAULT_DAY)])
  ),
};

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
const TEACHER_COLORS = [
  { bg: "#EAF2FF", border: "#3978D5" },
  { bg: "#E8F7EF", border: "#27945B" },
  { bg: "#F1EAFF", border: "#8155C5" },
  { bg: "#FFF1E5", border: "#D98236" },
  { bg: "#FDECEF", border: "#D65370" },
  { bg: "#E5F6F7", border: "#26969D" },
  { bg: "#FFF8DF", border: "#C49A25" },
  { bg: "#EEF0F4", border: "#68758A" },
  { bg: "#FCEBFF", border: "#AE56B9" },
  { bg: "#EAF5E8", border: "#699C42" },
  { bg: "#E0F2FE", border: "#0284C7" },
  { bg: "#FAE8FF", border: "#A21CAF" },
  { bg: "#ECFCCB", border: "#65A30D" },
  { bg: "#FFE4E6", border: "#E11D48" },
  { bg: "#EDE9FE", border: "#6D28D9" },
  { bg: "#CCFBF1", border: "#0F766E" },
  { bg: "#FEF3C7", border: "#B45309" },
  { bg: "#DBEAFE", border: "#1D4ED8" },
  { bg: "#FCE7F3", border: "#BE185D" },
  { bg: "#DCFCE7", border: "#15803D" },
];

function toMinutes(time) {
  const [hour, minute] = String(time || "07:00").split(":").map(Number);
  return hour * 60 + minute;
}

function toTime(minutes) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeSettings(saved) {
  const result = {
    ...DEFAULT_SETTINGS,
    ...(saved || {}),
  };

  result.hari = { ...DEFAULT_SETTINGS.hari };

  DAYS.forEach((day) => {
    const oldDay = saved?.hari?.[day] || {};
    result.hari[day] = {
      jumlahJP: Number(oldDay.jumlahJP ?? DEFAULT_DAY.jumlahJP),
      pembiasaan: Array.isArray(oldDay.pembiasaan)
        ? oldDay.pembiasaan
        : structuredClone(DEFAULT_DAY.pembiasaan),
      istirahat: Array.isArray(oldDay.istirahat)
        ? oldDay.istirahat
        : structuredClone(DEFAULT_DAY.istirahat),
    };
  });

  return result;
}

function buildTimeline(settings, day) {
  const config = settings.hari[day];
  let cursor = toMinutes(settings.jamMulai);
  const blocks = [];

  (config.pembiasaan || []).forEach((item) => {
    const start = cursor;
    cursor += Number(item.durasi || 0);
    blocks.push({
      type: "activity",
      id: item.id,
      name: item.nama,
      start: toTime(start),
      end: toTime(cursor),
    });
  });

  const periods = [];

  for (let number = 1; number <= Number(config.jumlahJP || 0); number += 1) {
    const start = cursor;
    cursor += Number(settings.durasiJP || 40);

    periods.push({
      number,
      start: toTime(start),
      end: toTime(cursor),
    });

    (config.istirahat || [])
      .filter((item) => Number(item.setelahJP) === number)
      .forEach((item) => {
        const breakStart = cursor;
        cursor += Number(item.durasi || 0);
        blocks.push({
          type: "break",
          id: item.id,
          name: item.nama,
          start: toTime(breakStart),
          end: toTime(cursor),
        });
      });
  }

  return {
    periods,
    blocks: blocks.sort(
      (a, b) => toMinutes(a.start) - toMinutes(b.start)
    ),
  };
}

function getItemName(list, id, field = "nama") {
  return list.find((item) => String(item.id) === String(id))?.[field] || "-";
}

function assignmentDetails(assignment, guru, rombel, mapel) {
  if (!assignment) return null;

  return {
    teacher: getItemName(guru, assignment.guruId),
    className: getItemName(rombel, assignment.rombelId, "namaRombel"),
    subject: getItemName(mapel, assignment.mapelId),
  };
}

function conflictsWith(candidate, current, ignoredId = null) {
  return current.some((item) => {
    if (String(item.id) === String(ignoredId)) return false;
    if (item.hari !== candidate.hari) return false;
    if (Number(item.jamKe) !== Number(candidate.jamKe)) return false;

    return (
      String(item.guruId) === String(candidate.guruId) ||
      String(item.rombelId) === String(candidate.rombelId)
    );
  });
}

export default function JadwalPelajaranPage() {
  const [jadwal, setJadwal] = useState(() =>
    readJSON(KEY.jadwal, [])
  );
  const [settings, setSettings] = useState(() =>
    normalizeSettings(readJSON(KEY.pengaturan, DEFAULT_SETTINGS))
  );

  const [tugasMengajar] = useState(() => readJSON(KEY.tugas, []));
  const [guru] = useState(() => readJSON(KEY.guru, []));
  const [teacherColorMap, setTeacherColorMap] = useState(() =>
  readJSON(KEY.teacherColors, {})
  );
  const [rombel] = useState(() => readJSON(KEY.rombel, []));
  const [mapel] = useState(() => readJSON(KEY.mapel, []));

  const [view, setView] = useState("sekolah");
  const [selectedRombel, setSelectedRombel] = useState(() => {
  const activeGroups = readJSON(KEY.rombel, []).filter(
    (item) => item.status === "Aktif"
  );

  return activeGroups.length ? String(activeGroups[0].id) : "";
});
  const [selectedGuru, setSelectedGuru] = useState("");
  const [selectedDay, setSelectedDay] = useState("Senin");
  const [search, setSearch] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [generatorResult, setGeneratorResult] = useState(null);
  const [generatorBusy, setGeneratorBusy] = useState(false);

  const [form, setForm] = useState({
    tugasMengajarId: "",
    hari: "Senin",
    jamKe: "1",
  });

  useEffect(() => {
    localStorage.setItem(KEY.jadwal, JSON.stringify(jadwal));
  }, [jadwal]);

  useEffect(() => {
  setTeacherColorMap((current) => {
    const next = { ...current };

    const preferredColors = {
      susi: 1,  // Hijau
      nizar: 17, // Biru
      elin: 2,  // Ungu
    };

    const reservedIds = new Set();

    // Tetapkan warna khusus untuk guru yang ditentukan.
    guru.forEach((teacher) => {
      const name = String(teacher.nama || "").trim().toLowerCase();
      const id = String(teacher.id);

      if (preferredColors[name] !== undefined) {
        next[id] = preferredColors[name];
        reservedIds.add(id);
      }
    });

    // Warna khusus tidak boleh dipakai guru lain.
    const usedColors = new Set(
      Object.entries(next)
        .filter(([id]) => !reservedIds.has(id))
        .map(([, index]) => index)
    );

    Object.values(preferredColors).forEach((index) => {
      usedColors.add(index);
    });

    let changed = false;

    guru.forEach((teacher) => {
      const id = String(teacher.id);
      const name = String(teacher.nama || "").trim().toLowerCase();

      if (preferredColors[name] !== undefined) {
        if (current[id] !== preferredColors[name]) changed = true;
        return;
      }

      if (
        next[id] !== undefined &&
        !Object.values(preferredColors).includes(next[id])
      ) {
        return;
      }

      let colorIndex = TEACHER_COLORS.findIndex(
        (_, index) => !usedColors.has(index)
      );

      if (colorIndex === -1) {
        colorIndex = Object.keys(next).length % TEACHER_COLORS.length;
      }

      next[id] = colorIndex;
      usedColors.add(colorIndex);
      changed = true;
    });

    return changed ? next : current;
  });
}, [guru]);

useEffect(() => {
  localStorage.setItem(
    KEY.teacherColors,
    JSON.stringify(teacherColorMap)
  );
}, [teacherColorMap]);

  useEffect(() => {
    localStorage.setItem(KEY.pengaturan, JSON.stringify(settings));
  }, [settings]);

  const activeDays = useMemo(
    () => DAYS.filter((day) =>
      settings.polaHari === "senin-sabtu" ? true : day !== "Sabtu"
    ),
    [settings.polaHari]
  );

  const activeAssignments = useMemo(
    () => tugasMengajar.filter((item) => {
      const teacher = guru.find(
        (person) => String(person.id) === String(item.guruId)
      );
      const group = rombel.find(
        (person) => String(person.id) === String(item.rombelId)
      );
      const subject = mapel.find(
        (person) => String(person.id) === String(item.mapelId)
      );

      return (
        item.status === "Aktif" &&
        teacher?.status === "Aktif" &&
        group?.status === "Aktif" &&
        subject?.status === "Aktif"
      );
    }),
    [tugasMengajar, guru, rombel, mapel]
  );

  const getAssignment = (id) =>
    tugasMengajar.find((item) => String(item.id) === String(id));

  const getDetails = (item) =>
    assignmentDetails(item, guru, rombel, mapel);
  const getTeacherColor = (teacherId) => {
  const colorIndex = teacherColorMap[String(teacherId)];

  if (
    colorIndex === undefined ||
    !TEACHER_COLORS[colorIndex]
  ) {
    return TEACHER_COLORS[0];
  }

  return TEACHER_COLORS[colorIndex];
};

  const visibleSchedule = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return jadwal
      .filter((item) => activeDays.includes(item.hari))
      .filter((item) => {
        if (view === "kelas" && selectedRombel) {
          return String(item.rombelId) === String(selectedRombel);
        }
        if (view === "guru" && selectedGuru) {
          return String(item.guruId) === String(selectedGuru);
        }
        if (view === "hari") return item.hari === selectedDay;
        return true;
      })
      .filter((item) => {
        if (!keyword) return true;
        const details = getDetails(getAssignment(item.tugasMengajarId));
        return [
          details?.teacher,
          details?.className,
          details?.subject,
          item.hari,
        ].join(" ").toLowerCase().includes(keyword);
      })
      .sort((a, b) => {
        const dayDiff =
          activeDays.indexOf(a.hari) - activeDays.indexOf(b.hari);
        return dayDiff || Number(a.jamKe) - Number(b.jamKe);
      });
  }, [
    jadwal, activeDays, view, selectedRombel, selectedGuru,
    selectedDay, search, tugasMengajar, guru, rombel, mapel,
  ]);

  const stats = useMemo(() => ({
    total: jadwal.filter((item) => activeDays.includes(item.hari)).length,
    guru: new Set(jadwal.map((item) => item.guruId)).size,
    rombel: new Set(jadwal.map((item) => item.rombelId)).size,
    locked: jadwal.filter((item) => item.locked).length,
  }), [jadwal, activeDays]);

  const timelineByDay = useMemo(() => {
    return Object.fromEntries(
      activeDays.map((day) => [day, buildTimeline(settings, day)])
    );
  }, [activeDays, settings]);

const selectedTeacherStats = useMemo(() => {
  if (!selectedGuru) return null;

  const teacherSchedule = jadwal.filter(
    (item) =>
      String(item.guruId) === String(selectedGuru) &&
      activeDays.includes(item.hari)
  );

  const byDay = activeDays.map((day) => {
    const entries = teacherSchedule.filter(
      (item) => item.hari === day
    );

    const occupied = new Set(
      entries.map((item) => Number(item.jamKe))
    );

    const available = Number(settings.hari[day].jumlahJP);

    return {
      day,
      scheduled: occupied.size,
      free: Math.max(0, available - occupied.size),
    };
  });

  return {
    totalJP: byDay.reduce((total, item) => total + item.scheduled, 0),
    freeJP: byDay.reduce((total, item) => total + item.free, 0),
    byDay,
  };
}, [selectedGuru, jadwal, activeDays, settings]);

const teacherWorkload = useMemo(() => {
  const availableJP = activeDays.reduce(
    (total, day) =>
      total + Number(settings.hari[day].jumlahJP || 0),
    0
  );

  return guru
    .filter((teacher) => teacher.status === "Aktif")
    .map((teacher) => {
      const assignments = activeAssignments.filter(
        (item) => String(item.guruId) === String(teacher.id)
      );

      const assignedJP = assignments.reduce(
        (total, item) =>
          total + Number(item.jpPerMinggu || 0),
        0
      );

      const assignmentIds = new Set(
        assignments.map((item) => String(item.id))
      );

      const scheduledJP = jadwal.filter(
        (item) =>
          assignmentIds.has(String(item.tugasMengajarId)) &&
          activeDays.includes(item.hari)
      ).length;

      const missingJP = Math.max(0, assignedJP - scheduledJP);
      const excessJP = Math.max(0, scheduledJP - assignedJP);

      return {
        id: teacher.id,
        nama: teacher.nama,
        assignedJP,
        scheduledJP,
        missingJP,
        excessJP,
        freeJP: Math.max(0, availableJP - scheduledJP),
      };
    })
    .sort((a, b) => b.scheduledJP - a.scheduledJP);
}, [guru, activeAssignments, jadwal, activeDays, settings]);

  const updateDaySetting = (day, patch) => {
    setSettings((current) => ({
      ...current,
      hari: {
        ...current.hari,
        [day]: {
          ...current.hari[day],
          ...patch,
        },
      },
    }));
  };

  const updateActivity = (day, id, patch) => {
    const list = settings.hari[day].pembiasaan.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    updateDaySetting(day, { pembiasaan: list });
  };

  const updateBreak = (day, id, patch) => {
    const list = settings.hari[day].istirahat.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    updateDaySetting(day, { istirahat: list });
  };

  const addActivity = (day) => {
    updateDaySetting(day, {
      pembiasaan: [
        ...settings.hari[day].pembiasaan,
        { id: makeId(), nama: "Kegiatan Pagi", durasi: 15 },
      ],
    });
  };

  const removeActivity = (day, id) => {
    updateDaySetting(day, {
      pembiasaan: settings.hari[day].pembiasaan.filter(
        (item) => item.id !== id
      ),
    });
  };

  const addBreak = (day) => {
    updateDaySetting(day, {
      istirahat: [
        ...settings.hari[day].istirahat,
        {
          id: makeId(),
          nama: `Istirahat ${settings.hari[day].istirahat.length + 1}`,
          setelahJP: 3,
          durasi: 20,
        },
      ],
    });
  };

  const removeBreak = (day, id) => {
    updateDaySetting(day, {
      istirahat: settings.hari[day].istirahat.filter(
        (item) => item.id !== id
      ),
    });
  };

  const openAddForm = (day = selectedDay, period = 1) => {
    setEditingId(null);
    setForm({
      tugasMengajarId: activeAssignments[0]
        ? String(activeAssignments[0].id)
        : "",
      hari: day,
      jamKe: String(period),
    });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setForm({
      tugasMengajarId: String(item.tugasMengajarId),
      hari: item.hari,
      jamKe: String(item.jamKe),
    });
    setFormError("");
    setShowForm(true);
  };

  const saveManualSchedule = (event) => {
    event.preventDefault();

    const assignment = getAssignment(form.tugasMengajarId);
    if (!assignment) {
      setFormError("Pilih penugasan mengajar terlebih dahulu.");
      return;
    }

    if (!activeDays.includes(form.hari)) {
      setFormError("Hari tersebut tidak termasuk pola belajar sekolah.");
      return;
    }

    const period = Number(form.jamKe);
    const dayConfig = settings.hari[form.hari];

    if (period < 1 || period > Number(dayConfig.jumlahJP)) {
      setFormError("Jam pelajaran melebihi jumlah JP pada hari tersebut.");
      return;
    }

    const candidate = {
      id: editingId || makeId(),
      tugasMengajarId: assignment.id,
      guruId: assignment.guruId,
      rombelId: assignment.rombelId,
      mapelId: assignment.mapelId,
      hari: form.hari,
      jamKe: period,
      locked: false,
      sumber: "Manual",
      status: "Aktif",
    };

    if (conflictsWith(candidate, jadwal, editingId)) {
      setFormError("Terjadi bentrok guru atau rombel pada hari dan jam tersebut.");
      return;
    }

    setJadwal((current) => editingId
      ? current.map((item) =>
          String(item.id) === String(editingId) ? candidate : item
        )
      : [...current, candidate]
    );

    setShowForm(false);
    setEditingId(null);
  };

  const deleteSchedule = (id) => {
    const item = jadwal.find((entry) => String(entry.id) === String(id));
    if (item?.locked) {
      window.alert("Jadwal terkunci. Buka kunci terlebih dahulu.");
      return;
    }

    if (!window.confirm("Hapus jadwal ini?")) return;
    setJadwal((current) =>
      current.filter((entry) => String(entry.id) !== String(id))
    );
  };

  const toggleLock = (id) => {
    setJadwal((current) => current.map((item) =>
      String(item.id) === String(id)
        ? { ...item, locked: !item.locked }
        : item
    ));
  };

  const runGenerator = () => {
  if (!activeAssignments.length) {
    setGeneratorResult({
      error: "Belum ada penugasan mengajar aktif yang dapat diproses.",
    });
    return;
  }

  const locked = jadwal.filter((item) => item.locked);

  setGeneratorBusy(true);

  window.setTimeout(() => {
    try {
      const result = generateTimetableBlocks(
        activeAssignments,
        settings,
        locked,
        DAYS
      );

      if (!result.error) {
        setJadwal(result.schedules);
      }

      setGeneratorResult(result);
      setGeneratorBusy(false);
      setShowGenerator(false);
    } catch (error) {
      console.error("Generator jadwal:", error);

      setGeneratorResult({
        error:
          "Terjadi kesalahan saat menyusun jadwal. Periksa data penugasan dan pengaturan waktu.",
      });

      setGeneratorBusy(false);
    }
  }, 80);
};

  const getCellSchedules = (day, period) =>
    visibleSchedule.filter(
      (item) =>
        item.hari === day && Number(item.jamKe) === Number(period)
    );

  const getScheduleCard = (item) => {
  const details = getDetails(getAssignment(item.tugasMengajarId));
  const teacherColor = getTeacherColor(item.guruId);

  return (
    <article
      className="jt-card"
      key={item.id}
      style={{
        background: teacherColor.bg,
    border: `1px solid ${teacherColor.border}`,
    borderLeft: `5px solid ${teacherColor.border}`,
      }}
    >
        <div className="jt-card-top">
          <span className="jt-card-time">
            JP {item.jamKe}
          </span>
          <span className={`jt-source ${item.sumber === "Generate" ? "generated" : ""}`}>
            {item.sumber === "Generate" ? "Otomatis" : "Manual"}
          </span>
        </div>
        <strong className="jt-subject">{details?.subject || "Mapel tidak ditemukan"}</strong>
        <span className="jt-card-detail">
          <GraduationCap size={12} /> {details?.className}
        </span>
        <span className="jt-card-detail">
          <Users size={12} /> {details?.teacher}
        </span>
        <div className="jt-card-actions">
          <button type="button" title={item.locked ? "Buka kunci" : "Kunci jadwal"} onClick={() => toggleLock(item.id)}>
            {item.locked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
          <button type="button" title="Edit" disabled={item.locked} onClick={() => openEditForm(item)}>
            <Pencil size={13} />
          </button>
          <button type="button" title="Hapus" disabled={item.locked} onClick={() => deleteSchedule(item.id)}>
            <Trash2 size={13} />
          </button>
        </div>
      </article>
    );
  };

  const renderTimetable = () => {
    const daysToShow = view === "hari" ? [selectedDay] : activeDays;

    return (
      <div className="jt-timetable-scroll">
        <div className="jt-timetable" style={{ "--day-count": daysToShow.length }}>
          <div className="jt-time-head">WAKTU</div>
          {daysToShow.map((day) => (
            <div className="jt-day-head" key={day}>{day}</div>
          ))}

          {Array.from({
            length: Math.max(...daysToShow.map((day) => settings.hari[day].jumlahJP)),
          }, (_, index) => index + 1).map((period) => {
            const hasPeriod = daysToShow.some(
              (day) => period <= settings.hari[day].jumlahJP
            );

            if (!hasPeriod) return null;

            return (
              <div className="jt-grid-row" key={`period-${period}`}>
                <div className="jt-time-cell">
                  <strong>JP {period}</strong>
                  <span>
                    {daysToShow
                      .map((day) => timelineByDay[day].periods.find((p) => p.number === period))
                      .find(Boolean)?.start || "--:--"}
                  </span>
                </div>

                {daysToShow.map((day) => {
                  const time = timelineByDay[day].periods.find(
                    (p) => p.number === period
                  );
                  const entries = time ? getCellSchedules(day, period) : [];

                  return (
                    <div className="jt-slot" key={`${day}-${period}`}>
                      {!time ? (
                        <span className="jt-not-available">—</span>
                      ) : entries.length ? (
                        entries.map(getScheduleCard)
                      ) : (
                        <button
                          type="button"
                          className="jt-add-slot"
                          onClick={() => openAddForm(day, period)}
                          disabled={!activeAssignments.length}
                        >
                          <Plus size={13} /> Tambah
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {daysToShow.map((day) => (
            <div className="jt-day-summary" key={`summary-${day}`}>
              <strong>{day}</strong>
              <span>{visibleSchedule.filter((item) => item.hari === day).length} slot terisi</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTimelineBlocks = (day) => {
    const timeline = timelineByDay[day];
    const allBlocks = [
      ...timeline.blocks,
      ...timeline.periods.map((period) => ({
        type: "period",
        name: `Jam Pelajaran ${period.number}`,
        start: period.start,
        end: period.end,
        number: period.number,
      })),
    ].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    return (
      <div className="jt-day-timeline" key={day}>
        <strong>{day}</strong>
        <div className="jt-timeline-track">
          {allBlocks.map((block, index) => (
            <div
              key={`${day}-${index}`}
              className={`jt-timeline-block ${block.type}`}
            >
              <b>{block.name}</b>
              <span>{block.start}–{block.end}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const printTimetable = () => window.print();

  const exportCSV = () => {
    const header = ["Hari", "Jam Ke", "Mulai", "Selesai", "Kelas", "Mata Pelajaran", "Guru"];
    const rows = visibleSchedule.map((item) => {
      const details = getDetails(getAssignment(item.tugasMengajarId));
      const period = timelineByDay[item.hari]?.periods.find(
        (entry) => entry.number === Number(item.jamKe)
      );

      return [
        item.hari,
        item.jamKe,
        period?.start || "",
        period?.end || "",
        details?.className || "",
        details?.subject || "",
        details?.teacher || "",
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map((value) =>
        `"${String(value).replaceAll('"', '""')}"`
      ).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jadwal-pelajaran-simkur.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="jadwal-page">
      <header className="jt-page-heading">
        <div>
          <span className="jt-eyebrow">MANAJEMEN KURIKULUM</span>
          <h1>Jadwal Pelajaran</h1>
          <p>Kelola master timetable sekolah dan distribusi jadwal setiap guru serta kelas.</p>
        </div>
        <div className="jt-heading-actions">
          <button className="jt-secondary-btn" onClick={() => setShowSettings(true)}>
            <Settings size={16} /> Pengaturan Waktu
          </button>
          <button className="jt-primary-btn" onClick={() => setShowGenerator(true)}>
            <WandSparkles size={16} /> Generate Jadwal
          </button>
        </div>
      </header>

      <section className="jt-settings-summary">
        <div className="jt-summary-item">
          <CalendarRange size={19} />
          <div><span>Pola belajar</span><strong>{settings.polaHari === "senin-sabtu" ? "Senin–Sabtu" : "Senin–Jumat"}</strong></div>
        </div>
        <div className="jt-summary-item">
          <Clock3 size={19} />
          <div><span>Jam masuk</span><strong>{settings.jamMulai}</strong></div>
        </div>
        <div className="jt-summary-item">
          <BookOpen size={19} />
          <div><span>Durasi 1 JP</span><strong>{settings.durasiJP} menit</strong></div>
        </div>
        <div className="jt-summary-item">
          <Sun size={19} />
          <div><span>Jumlah hari</span><strong>{activeDays.length} hari</strong></div>
        </div>
      </section>

      <section className="jt-stats-grid">
        <div className="jt-stat-card"><CalendarDays /><div><span>Slot Terjadwal</span><strong>{stats.total}</strong></div></div>
        <div className="jt-stat-card"><Users /><div><span>Guru Terlibat</span><strong>{stats.guru}</strong></div></div>
        <div className="jt-stat-card"><School /><div><span>Rombel Terjadwal</span><strong>{stats.rombel}</strong></div></div>
        <div className="jt-stat-card"><Lock /><div><span>Jadwal Terkunci</span><strong>{stats.locked}</strong></div></div>
      </section>

      <section className="jt-generator-banner">
        <div className="jt-generator-icon"><WandSparkles size={23} /></div>
        <div className="jt-generator-copy">
          <strong>Generator Timetable Otomatis</strong>
          <span>Susun jadwal berdasarkan alokasi JP Tugas Mengajar dan ketersediaan waktu sekolah.</span>
        </div>
        <button onClick={() => setShowGenerator(true)}>
          Mulai Generate <ChevronDown size={15} />
        </button>
      </section>

      <section className="jt-main-panel">
        <div className="jt-panel-heading">
          <div>
            <h2>Master Timetable</h2>
            <p>Satu sumber jadwal untuk seluruh kelas dan guru.</p>
          </div>
          <div className="jt-export-actions">
            <button onClick={exportCSV}><Download size={15} /> CSV</button>
            <button onClick={printTimetable}><Printer size={15} /> Cetak</button>
          </div>
        </div>

        <div className="jt-view-toolbar">
          <div className="jt-view-tabs">
            {[
              ["sekolah", "Seluruh Sekolah", School],
              ["kelas", "Per Kelas", GraduationCap],
              ["guru", "Per Guru", Users],
              ["hari", "Per Hari", CalendarDays],
            ].map(([value, label, Icon]) => (
              <button
                key={value}
                className={view === value ? "active" : ""}
                onClick={() => setView(value)}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div className="jt-view-filters">
            {view === "kelas" && (
              <select value={selectedRombel} onChange={(e) => setSelectedRombel(e.target.value)}>
                <option value="">Semua kelas</option>
                {rombel.filter((item) => item.status === "Aktif").map((item) => (
                  <option key={item.id} value={item.id}>{item.namaRombel}</option>
                ))}
              </select>
            )}
            {view === "guru" && (
              <select value={selectedGuru} onChange={(e) => setSelectedGuru(e.target.value)}>
                <option value="">Semua guru</option>
                {guru.filter((item) => item.status === "Aktif").map((item) => (
                  <option key={item.id} value={item.id}>{item.nama}</option>
                ))}
              </select>
            )}
            {view === "hari" && (
              <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                {activeDays.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            )}
            <label className="jt-search">
              <Search size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari guru, kelas, mapel..." />
            </label>
          </div>
        </div>

        {view === "guru" && selectedGuru && selectedTeacherStats && (
  <section className="jt-teacher-summary">
    <div className="jt-teacher-summary-heading">
      <div>
        <span>REKAP BEBAN MENGAJAR</span>
        <h3>{getItemName(guru, selectedGuru)}</h3>
      </div>
      <GraduationCap size={25} />
    </div>

    <div className="jt-teacher-summary-stats">
      <div>
        <span>Total JP Terjadwal</span>
        <strong>{selectedTeacherStats.totalJP} JP</strong>
      </div>

      <div>
        <span>Total JP Kosong</span>
        <strong>{selectedTeacherStats.freeJP} JP</strong>
      </div>
    </div>

    <div className="jt-teacher-daily">
      {selectedTeacherStats.byDay.map((item) => (
        <div key={item.day}>
          <strong>{item.day}</strong>
          <span>{item.scheduled} JP mengajar</span>
          <span>{item.free} JP kosong</span>
        </div>
      ))}
    </div>
  </section>
)}

{renderTimetable()}

        <div className="jt-legend">
  <span><i className="subject-dot" /> Pelajaran</span>
  <span><i className="activity-dot" /> Pembiasaan</span>
  <span><i className="break-dot" /> Istirahat</span>
  <span><Lock size={12} /> Jadwal terkunci</span>

  <div className="jt-teacher-legend">
    <strong>Identitas warna guru:</strong>

    {[...new Map(
      visibleSchedule.map((item) => [
        String(item.guruId),
        {
          id: item.guruId,
          name: getDetails(getAssignment(item.tugasMengajarId))?.teacher || "Guru tidak ditemukan",
        },
      ])
    ).values()].map((teacher) => {
      const color = getTeacherColor(teacher.id);

      return (
        <span className="jt-teacher-legend-item" key={teacher.id}>
          <i style={{ backgroundColor: color.border }} />
          {teacher.name}
        </span>
      );
    })}
  </div>
</div>
      </section>

      <section className="jt-daily-structure">
        <div className="jt-panel-heading">
          <div>
            <h2>Struktur Waktu Harian</h2>
            <p>Ringkasan pembiasaan, jam pelajaran, dan istirahat.</p>
          </div>
        </div>
        {activeDays.map(renderTimelineBlocks)}
      </section>

      <section className="jt-workload-panel">
  <div className="jt-panel-heading">
    <div>
      <h2>Analisis Beban Mengajar Guru</h2>
      <p>
        Perbandingan alokasi JP mingguan dengan jadwal yang berhasil ditempatkan.
      </p>
    </div>
    <Users size={21} />
  </div>

  <div className="jt-workload-table-wrap">
    <table className="jt-workload-table">
      <thead>
        <tr>
          <th>Guru</th>
          <th>JP Ditugaskan</th>
          <th>JP Terjadwal</th>
          <th>Belum Terjadwal</th>
          <th>Kelebihan JP</th>
          <th>JP Kosong</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {teacherWorkload.map((teacher) => (
          <tr key={teacher.id}>
            <td>
              <strong>{teacher.nama}</strong>
            </td>
            <td>{teacher.assignedJP} JP</td>
            <td>{teacher.scheduledJP} JP</td>
            <td>
              <span className={teacher.missingJP > 0 ? "jt-workload-warning" : "jt-workload-good"}>
                {teacher.missingJP} JP
              </span>
            </td>
            <td>
  <span className={teacher.excessJP > 0 ? "jt-workload-warning" : "jt-workload-good"}>
    {teacher.excessJP} JP
  </span>
</td>
            <td>{teacher.freeJP} JP</td>
            <td>
              <span
  className={`jt-workload-status ${
    teacher.excessJP > 0
      ? "excess"
      : teacher.missingJP > 0
        ? "incomplete"
        : "complete"
  }`}
>
  {teacher.excessJP > 0
    ? `Melebihi ${teacher.excessJP} JP`
    : teacher.missingJP > 0
      ? "Belum Lengkap"
      : "Terpenuhi"}
</span>
            </td>
          </tr>
        ))}

        {!teacherWorkload.length && (
          <tr>
            <td colSpan="7" className="jt-workload-empty">
              Belum ada data guru aktif.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  <div className="jt-workload-note">
    <AlertTriangle size={15} />
    JP kosong merupakan kapasitas slot yang belum digunakan, bukan otomatis jam kerja wajib guru.
  </div>
</section>

{generatorResult && (
  <section
    className={`jt-result-panel ${
      generatorResult.error ? "error" : ""
    }`}
  >
    <div className="jt-result-title">
      {generatorResult.error ? (
        <AlertTriangle />
      ) : generatorResult.complete ? (
        <CheckCircle2 />
      ) : (
        <AlertTriangle />
      )}

      <div>
        <strong>
          {generatorResult.error
            ? "Generator belum dapat dijalankan"
            : generatorResult.complete
              ? "Jadwal berhasil disusun"
              : "Jadwal berhasil disusun sebagian"}
        </strong>

        <span>
          {generatorResult.error ||
            "Berikut ringkasan hasil penyusunan master timetable."}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setGeneratorResult(null)}
      >
        <X size={16} />
      </button>
    </div>

    {!generatorResult.error && (
      <>
        <div className="jt-result-numbers">
          <div>
            <strong>{generatorResult.placed}</strong>
            <span>JP berhasil ditempatkan</span>
          </div>

          <div>
            <strong>{generatorResult.missing}</strong>
            <span>JP belum terjadwal</span>
          </div>

          <div>
            <strong>{generatorResult.total}</strong>
            <span>Total kebutuhan JP</span>
          </div>
        </div>

        {generatorResult.capacityWarning && (
          <div className="jt-warning-note">
            <AlertTriangle size={17} />
            {generatorResult.capacityWarning}
          </div>
        )}

        {generatorResult.missingBlocks?.length > 0 && (
          <div className="jt-report-section">
            <h3>
              <AlertTriangle size={17} />
              Blok Penugasan Belum Terjadwal
            </h3>

            <div className="jt-report-table-wrap">
              <table className="jt-report-table">
                <thead>
                  <tr>
                    <th>Guru</th>
                    <th>Mata Pelajaran</th>
                    <th>Rombel</th>
                    <th>Blok JP</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>

                <tbody>
                  {generatorResult.missingBlocks.map(
                    (item, index) => {
                      const assignment =
                        item.assignment ||
                        getAssignment(item.tugasMengajarId);

                      const details = assignment
                        ? getDetails(assignment)
                        : null;

                      return (
                        <tr key={`${index}-${assignment?.id || "invalid"}`}>
                          <td>
                            {details?.teacher || "-"}
                          </td>

                          <td>
                            {details?.subject || "-"}
                          </td>

                          <td>
                            {details?.className || "-"}
                          </td>

                          <td>
                            <strong>{item.size} JP</strong>
                          </td>

                          <td>
                            {item.reason ||
                              "Blok belum dapat ditempatkan."}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {generatorResult.emptyByClass?.length > 0 && (
          <div className="jt-report-section">
            <h3>
              <CalendarDays size={17} />
              Slot Kosong per Rombel
            </h3>

            {generatorResult.emptyByClass.map((item) => (
              <div
                className="jt-empty-class-report"
                key={item.rombelId}
              >
                <strong>{item.className}</strong>

                <div className="jt-empty-slot-list">
                  {item.emptySlots.map((slot, index) => (
                    <span key={`${slot.hari}-${slot.jamKe}-${index}`}>
                      {slot.hari} · JP {slot.jamKe}
                    </span>
                  ))}
                </div>

                <small>
                  Slot kosong dapat ditinjau untuk pemerataan
                  kegiatan atau evaluasi pembagian tugas mengajar.
                  Jangan mengisi slot tanpa penugasan yang sah.
                </small>
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </section>
)}


      {showSettings && (
        <div className="jt-modal-backdrop" onMouseDown={() => setShowSettings(false)}>
          <div className="jt-modal jt-settings-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="jt-modal-header">
              <div><span className="jt-eyebrow">KONFIGURASI SEKOLAH</span><h2>Pengaturan Waktu Pembelajaran</h2><p>Atur jam sekolah, pembiasaan, JP, dan istirahat.</p></div>
              <button className="jt-close" onClick={() => setShowSettings(false)}><X /></button>
            </div>

            <div className="jt-modal-content">
              <div className="jt-config-grid">
                <label className="jt-field"><span>Pola Hari Belajar</span>
                  <select value={settings.polaHari} onChange={(e) => setSettings((s) => ({ ...s, polaHari: e.target.value }))}>
                    <option value="senin-jumat">Senin–Jumat</option>
                    <option value="senin-sabtu">Senin–Sabtu</option>
                  </select>
                </label>
                <label className="jt-field"><span>Jam Mulai Sekolah</span>
                  <input type="time" value={settings.jamMulai} onChange={(e) => setSettings((s) => ({ ...s, jamMulai: e.target.value }))} />
                </label>
                <label className="jt-field"><span>Durasi 1 JP (menit)</span>
                  <input type="number" min="1" max="180" value={settings.durasiJP} onChange={(e) => setSettings((s) => ({ ...s, durasiJP: Number(e.target.value) }))} />
                </label>
              </div>

              <div className="jt-config-days">
                {activeDays.map((day) => {
                  const config = settings.hari[day];
                  return (
                    <details className="jt-day-config" key={day} open={day === "Senin"}>
                      <summary><strong>{day}</strong><span>{config.jumlahJP} JP · {config.pembiasaan.length} pembiasaan · {config.istirahat.length} istirahat</span></summary>
                      <div className="jt-day-config-body">
                        <label className="jt-field"><span>Jumlah JP hari {day}</span>
                          <input type="number" min="1" max="16" value={config.jumlahJP} onChange={(e) => updateDaySetting(day, { jumlahJP: Number(e.target.value) })} />
                        </label>

                        <div className="jt-config-subheading"><Sun size={16} /><strong>Pembiasaan dan kegiatan pagi</strong>
                          <button onClick={() => addActivity(day)}><Plus size={14} /> Tambah</button>
                        </div>
                        {config.pembiasaan.map((item) => (
                          <div className="jt-config-row" key={item.id}>
                            <input aria-label="Nama kegiatan" value={item.nama} onChange={(e) => updateActivity(day, item.id, { nama: e.target.value })} />
                            <label><input type="number" min="1" max="240" value={item.durasi} onChange={(e) => updateActivity(day, item.id, { durasi: Number(e.target.value) })} /> menit</label>
                            <button className="jt-remove" onClick={() => removeActivity(day, item.id)}><Trash2 size={14} /></button>
                          </div>
                        ))}

                        <div className="jt-config-subheading"><Coffee size={16} /><strong>Istirahat</strong>
                          <button onClick={() => addBreak(day)}><Plus size={14} /> Tambah</button>
                        </div>
                        {config.istirahat.map((item) => (
                          <div className="jt-config-row jt-break-row" key={item.id}>
                            <input aria-label="Nama istirahat" value={item.nama} onChange={(e) => updateBreak(day, item.id, { nama: e.target.value })} />
                            <label>Setelah JP
                              <input type="number" min="1" max={config.jumlahJP} value={item.setelahJP} onChange={(e) => updateBreak(day, item.id, { setelahJP: Number(e.target.value) })} />
                            </label>
                            <label>
                              <input type="number" min="1" max="180" value={item.durasi} onChange={(e) => updateBreak(day, item.id, { durasi: Number(e.target.value) })} /> menit
                            </label>
                            <button className="jt-remove" onClick={() => removeBreak(day, item.id)}><Trash2 size={14} /></button>
                          </div>
                        ))}
                        <div className="jt-day-preview">
                          <Clock3 size={14} />
                          Perkiraan selesai: <strong>{timelineByDay[day].periods.at(-1)?.end || "--:--"}</strong>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>

            <div className="jt-modal-footer">
              <button className="jt-secondary-btn" onClick={() => setShowSettings(false)}>Tutup</button>
              <button className="jt-primary-btn" onClick={() => setShowSettings(false)}><Save size={15} /> Simpan Pengaturan</button>
            </div>
          </div>
        </div>
      )}

      {showGenerator && (
        <div className="jt-modal-backdrop" onMouseDown={() => setShowGenerator(false)}>
          <div className="jt-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="jt-modal-header">
              <div><span className="jt-eyebrow">PENYUSUNAN OTOMATIS</span><h2>Generate Master Timetable</h2><p>Sistem akan menyusun jadwal dari seluruh penugasan aktif.</p></div>
              <button className="jt-close" onClick={() => setShowGenerator(false)}><X /></button>
            </div>
            <div className="jt-modal-content">
              <div className="jt-generator-info">
                <div><BookOpen /><span><strong>{activeAssignments.length}</strong> penugasan aktif</span></div>
                <div><CalendarDays /><span><strong>{activeDays.length}</strong> hari belajar</span></div>
                <div><Lock /><span><strong>{jadwal.filter((item) => item.locked).length}</strong> slot terkunci</span></div>
              </div>
              <div className="jt-warning-note">
                <AlertTriangle size={18} />
                Jadwal yang dikunci akan dipertahankan. Jadwal lain akan disusun ulang berdasarkan kebutuhan JP mingguan. Hasil terbaik dari sejumlah percobaan akan dipilih.
              </div>
              <p className="jt-generator-caption">Generator menghindari bentrok guru dan rombel, serta mengupayakan distribusi mata pelajaran ke beberapa hari. Penempatan yang tidak memungkinkan akan dilaporkan.</p>
            </div>
            <div className="jt-modal-footer">
              <button className="jt-secondary-btn" onClick={() => setShowGenerator(false)}>Batal</button>
              <button className="jt-primary-btn" disabled={generatorBusy || !activeAssignments.length} onClick={runGenerator}>
                {generatorBusy ? <RefreshCw className="jt-spin" size={16} /> : <WandSparkles size={16} />}
                {generatorBusy ? "Menyusun Jadwal..." : "Mulai Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
