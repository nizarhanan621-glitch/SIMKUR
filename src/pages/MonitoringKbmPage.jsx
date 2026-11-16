
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Users,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Search,
  RefreshCw,
  FileText,
} from "lucide-react";

import { loadAcademicCalendarEvents } from "../lib/calendarStorage";
import "../styles/MonitoringKbmPage.css";

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

    return parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
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
        message: "Format penyimpanan jurnal tidak valid.",
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
        message: `Data jurnal baris ${invalidIndex + 1} tidak memiliki identitas valid.`,
      };
    }

    const ids = parsed.map((item) => String(item.id));

    if (new Set(ids).size !== ids.length) {
      return {
        data: [],
        valid: false,
        message: "Ditemukan ID jurnal ganda.",
      };
    }

    return { data: parsed, valid: true, message: "" };
  } catch (error) {
    console.error("Gagal membaca jurnal:", error);

    return {
      data: [],
      valid: false,
      message: "Data jurnal tidak dapat dibaca.",
    };
  }
}

function toMinutes(value) {
  const [hour, minute] = String(value || "07:00")
    .split(":")
    .map(Number);

  return hour * 60 + minute;
}

function toTime(value) {
  const safe = Math.max(0, Number(value) || 0);
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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

function buildMeetingSessions(assignment, scheduleRows, settings, date) {
  const expected = getExpectedBlocks(assignment);

  if (!expected.length) return [];

  const dayName = DAYS[new Date(`${date}T12:00:00`).getDay()];

  const periodRows = scheduleRows
    .filter(
      (item) =>
        String(item.tugasMengajarId) === String(assignment.id) &&
        item.hari === dayName &&
        item.status !== "Nonaktif"
    )
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

  if (!periodRows.length) return [];

  const uniquePeriods = [
    ...new Set(periodRows.map((item) => item.period)),
  ];

  if (uniquePeriods.length !== periodRows.length) return [];

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
  const sessions = [];
  const periodTimes = getPeriodTimes(settings, dayName);

  const orderedRuns = [...runs].sort(
    (a, b) => b.length - a.length || a[0] - b[0]
  );

  orderedRuns.forEach((run) => {
    const positions = findSubsetPositions(remaining, run.length);

    if (!positions) return;

    const selectedBlocks = positions
      .map((position) => remaining[position])
      .sort((a, b) => a.index - b.index);

    let offset = 0;

    selectedBlocks.forEach((block) => {
      const blockPeriods = run.slice(
        offset,
        offset + block.size
      );

      offset += block.size;

      const firstPeriod = blockPeriods[0];
      const lastPeriod = blockPeriods[blockPeriods.length - 1];

      sessions.push({
        meetingKey:
          `${date}|${assignment.id}|${dayName}|${firstPeriod}-${lastPeriod}`,
        tanggal: date,
        hari: dayName,
        tugasMengajarId: assignment.id,
        guruId: assignment.guruId,
        rombelId: assignment.rombelId,
        mapelId: assignment.mapelId,
        jpTerjadwal: block.size,
        periods: blockPeriods,
        startTime: periodTimes[firstPeriod]?.start || "",
        endTime: periodTimes[lastPeriod]?.end || "",
      });
    });

    positions
      .sort((a, b) => b - a)
      .forEach((position) => remaining.splice(position, 1));
  });

  sessions.sort((a, b) => a.periods[0] - b.periods[0]);

  return sessions;
}

function getActualJP(item) {
  const journal = item?.journal;

  if (!journal) return 0;

  const scheduled = Math.max(
    0,
    Number(item.jpTerjadwal) || 0
  );

  let actual = 0;

  if (journal.statusPelaksanaan === "Terlaksana") {
    actual = Number(journal.jpTerlaksana ?? scheduled);
  } else if (journal.statusPelaksanaan === "Sebagian") {
    actual = Number(journal.jpTerlaksana) || 0;
  }

  return Math.max(0, Math.min(actual, scheduled));
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(`${value}T12:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function todayString() {
  const date = new Date();
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
}

export default function MonitoringKbmPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterGuru, setFilterGuru] = useState("");
  const [filterRombel, setFilterRombel] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(todayString());
  const [endDate, setEndDate] = useState(todayString());

  const data = useMemo(() => {
    let calendar = [];

    try {
      const events = loadAcademicCalendarEvents();
      calendar = Array.isArray(events) ? events : [];
    } catch (error) {
      console.error("Gagal membaca kalender akademik:", error);
    }

    return {
      journals: readJournalStorage(),
      schedules: readArray(KEY.schedules),
      settings: readObject(KEY.settings),
      assignments: readArray(KEY.assignments),
      teachers: readArray(KEY.teachers),
      rombels: readArray(KEY.rombels),
      subjects: readArray(KEY.subjects),
      calendar,
    };
  }, [refreshKey]);

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1);

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("simkur-calendar-updated", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("simkur-calendar-updated", refresh);
    };
  }, []);

  const teacherMap = useMemo(
    () => new Map(data.teachers.map((item) => [String(item.id), item])),
    [data.teachers]
  );

  const rombelMap = useMemo(
    () => new Map(data.rombels.map((item) => [String(item.id), item])),
    [data.rombels]
  );

  const subjectMap = useMemo(
    () => new Map(data.subjects.map((item) => [String(item.id), item])),
    [data.subjects]
  );

  const activeDays = useMemo(
    () =>
      data.settings.polaHari === "senin-sabtu"
        ? ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
        : ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    [data.settings.polaHari]
  );

  const monitoringRecords = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) {
      return [];
    }

    // Jika data jurnal tidak valid, jadwal tetap ditampilkan.
    const journalData = data.journals.valid
      ? data.journals.data
      : [];

    const journalMap = new Map(
      journalData.map((item) => [
        String(item.meetingKey).trim(),
        item,
      ])
    );

    const records = [];
    let cursor = startDate;

    while (cursor <= endDate) {
      const dateObject = new Date(`${cursor}T12:00:00`);
      const dayName = DAYS[dateObject.getDay()];

      if (activeDays.includes(dayName)) {
        const approvedEvents = data.calendar.filter((event) => {
          const start = event.startDate || event.date || "";
          const end = event.endDate || event.startDate || event.date || "";

          return (
            event.status === "approved" &&
            start &&
            end &&
            start <= cursor &&
            cursor <= end
          );
        });

        const isHoliday = approvedEvents.some(
          (event) =>
            [
              "libur_nasional",
              "libur_sekolah",
              "libur_daerah",
            ].includes(event.category) ||
            (
              event.category === "cuti_bersama" &&
              event.keputusanSekolah === "libur"
            )
        );

        if (!isHoliday) {
          data.assignments.forEach((assignment) => {
            const sessions = buildMeetingSessions(
              assignment,
              data.schedules,
              data.settings,
              cursor
            );

            sessions.forEach((session) => {
              const teacher = teacherMap.get(String(session.guruId));
              const rombel = rombelMap.get(String(session.rombelId));
              const subject = subjectMap.get(String(session.mapelId));

              records.push({
                ...session,

                // Samakan nama properti tanggal untuk seluruh komponen.
                date: session.tanggal,

                teacherName:
                  teacher?.nama ||
                  teacher?.namaGuru ||
                  "Guru tidak ditemukan",

                rombelName:
                  rombel?.namaRombel ||
                  "Rombel tidak ditemukan",

                subjectName:
                  subject?.nama ||
                  subject?.namaMapel ||
                  "Mapel tidak ditemukan",

                journal:
                  journalMap.get(String(session.meetingKey).trim()) ||
                  null,
              });
            });
          });
        }
      }

      dateObject.setDate(dateObject.getDate() + 1);

      cursor = [
        dateObject.getFullYear(),
        String(dateObject.getMonth() + 1).padStart(2, "0"),
        String(dateObject.getDate()).padStart(2, "0"),
      ].join("-");
    }

    return records;
  }, [
    data,
    activeDays,
    startDate,
    endDate,
    teacherMap,
    rombelMap,
    subjectMap,
  ]);

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return monitoringRecords.filter((item) => {
      if (filterGuru && String(item.guruId) !== filterGuru) {
        return false;
      }

      if (filterRombel && String(item.rombelId) !== filterRombel) {
        return false;
      }

      if (filterMapel && String(item.mapelId) !== filterMapel) {
        return false;
      }

      if (keyword) {
        const searchable = [
          item.teacherName,
          item.rombelName,
          item.subjectName,
          item.journal?.materiPokok,
          item.journal?.alasanTidakTerlaksana,
          item.journal?.tindakLanjut,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(keyword)) return false;
      }

      return true;
    });
  }, [
    monitoringRecords,
    filterGuru,
    filterRombel,
    filterMapel,
    search,
  ]);

  const monitoringSummary = useMemo(() => {
    const scheduledJP = filteredRecords.reduce(
      (total, item) =>
        total + Math.max(0, Number(item.jpTerjadwal) || 0),
      0
    );

    const actualJP = filteredRecords.reduce(
      (total, item) => total + getActualJP(item),
      0
    );

    return {
      totalPertemuan: filteredRecords.length,

      jurnalTerisi: filteredRecords.filter(
        (item) => Boolean(item.journal)
      ).length,

      belumDiisi: filteredRecords.filter(
        (item) => !item.journal
      ).length,

      terlaksana: filteredRecords.filter(
        (item) =>
          item.journal?.statusPelaksanaan === "Terlaksana"
      ).length,

      sebagian: filteredRecords.filter(
        (item) =>
          item.journal?.statusPelaksanaan === "Sebagian"
      ).length,

      tidakTerlaksana: filteredRecords.filter(
        (item) =>
          item.journal?.statusPelaksanaan === "Tidak Terlaksana"
      ).length,

      scheduledJP,
      actualJP,

      belumTerlaksanaJP: Math.max(
        0,
        scheduledJP - actualJP
      ),

      persentase:
        scheduledJP > 0
          ? Math.round((actualJP / scheduledJP) * 100)
          : 0,
    };
  }, [filteredRecords]);

  const analysis = useMemo(() => {
    const missingByTeacher = new Map();

    filteredRecords.forEach((item) => {
      if (!item.journal) {
        const key = String(item.guruId || item.teacherName);

        if (!missingByTeacher.has(key)) {
          missingByTeacher.set(key, {
            name: item.teacherName,
            count: 0,
          });
        }

        missingByTeacher.get(key).count += 1;
      }
    });

    const followUps = filteredRecords.filter(
      (item) =>
        item.journal?.statusPelaksanaan === "Sebagian" ||
        item.journal?.statusPelaksanaan === "Tidak Terlaksana"
    );

    return {
      missingTeachers: Array.from(missingByTeacher.values()).sort(
        (a, b) => b.count - a.count
      ),
      followUps,
    };
  }, [filteredRecords]);

  const dailyData = useMemo(() => {
    const daily = new Map();

    filteredRecords.forEach((item) => {
      if (!daily.has(item.date)) {
        daily.set(item.date, {
          scheduled: 0,
          actual: 0,
        });
      }

      const row = daily.get(item.date);

      row.scheduled += Math.max(
        0,
        Number(item.jpTerjadwal) || 0
      );

      row.actual += getActualJP(item);
    });

    return Array.from(daily.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({
        date,
        scheduled: value.scheduled,
        actual: value.actual,
        percent:
          value.scheduled > 0
            ? Math.round(
                (value.actual / value.scheduled) * 100
              )
            : 0,
      }));
  }, [filteredRecords]);

  const trend = dailyData;

  const trendPoints = useMemo(() => {
    const points = trend.map((item, index) => ({
      ...item,
      x:
        trend.length <= 1
          ? 450
          : 65 + (index / (trend.length - 1)) * 770,
      y: 235 - item.percent * 1.8,
    }));

    return {
      points,
      linePoints: points
        .map((point) => `${point.x},${point.y}`)
        .join(" "),
      areaPoints: points.length
        ? `65,235 ${points
            .map((point) => `${point.x},${point.y}`)
            .join(" ")} 835,235`
        : "",
    };
  }, [trend]);

  const firstPercent = trend[0]?.percent ?? 0;
  const lastPercent =
    trend[trend.length - 1]?.percent ?? 0;
  const trendDifference = lastPercent - firstPercent;

  return (
    <div className="mkbm-page">
      <div className="mkbm-header">
        <div>
          <span className="mkbm-eyebrow">
            PENGAWASAN AKADEMIK
          </span>

          <h1>Monitoring KBM</h1>

          <p>
            Pemantauan pelaksanaan pembelajaran berdasarkan jadwal dan
            jurnal mengajar guru.
          </p>
        </div>

        <button
          type="button"
          className="mkbm-refresh"
          onClick={() => setRefreshKey((value) => value + 1)}
        >
          <RefreshCw size={16} />
          Perbarui Data
        </button>
      </div>

      {!data.journals.valid && (
        <div className="mkbm-warning">
          <AlertTriangle size={18} />
          <span>
            {data.journals.message} Jadwal tetap ditampilkan,
            tetapi jurnal belum dapat dicocokkan.
          </span>
        </div>
      )}

      <div className="mkbm-toolbar">
        <div className="mkbm-filter">
          <label>Dari Tanggal</label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="mkbm-filter">
          <label>Sampai Tanggal</label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <div className="mkbm-filter">
          <label>Guru</label>
          <select
            value={filterGuru}
            onChange={(event) => setFilterGuru(event.target.value)}
          >
            <option value="">Semua Guru</option>

            {data.teachers.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.nama || item.namaGuru}
              </option>
            ))}
          </select>
        </div>

        <div className="mkbm-filter">
          <label>Rombongan Belajar</label>
          <select
            value={filterRombel}
            onChange={(event) => setFilterRombel(event.target.value)}
          >
            <option value="">Semua Rombel</option>

            {data.rombels.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.namaRombel}
              </option>
            ))}
          </select>
        </div>

        <div className="mkbm-filter">
          <label>Mata Pelajaran</label>
          <select
            value={filterMapel}
            onChange={(event) => setFilterMapel(event.target.value)}
          >
            <option value="">Semua Mata Pelajaran</option>

            {data.subjects.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.nama || item.namaMapel}
              </option>
            ))}
          </select>
        </div>

        <div className="mkbm-filter mkbm-search">
          <label>Cari Data</label>
          <input
            type="search"
            placeholder="Cari guru, materi, tindak lanjut..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {startDate > endDate && (
        <div className="mkbm-warning">
          <AlertTriangle size={18} />
          <span>
            Tanggal awal tidak boleh melebihi tanggal akhir.
          </span>
        </div>
      )}

      <div className="mkbm-trend-card">
        <div className="mkbm-trend-header">
          <div>
            <span className="mkbm-trend-eyebrow">
              ANALISIS PERKEMBANGAN
            </span>

            <h2>Tren Keterlaksanaan KBM</h2>

            <p>
              Perkembangan persentase pembelajaran berdasarkan
              jurnal mengajar guru.
            </p>
          </div>

          {trend.length > 1 && (
            <div
              className={`mkbm-trend-indicator ${
                trendDifference >= 0
                  ? "trend-up"
                  : "trend-down"
              }`}
            >
              {trendDifference >= 0 ? "↗" : "↘"}{" "}
              {Math.abs(trendDifference)}%

              <small>
                {trendDifference >= 0
                  ? " Meningkat"
                  : " Menurun"}
              </small>
            </div>
          )}
        </div>

        <div className="mkbm-trend-main-value">
          <strong>{lastPercent}%</strong>
          <span>Keterlaksanaan pada tanggal terakhir</span>
        </div>

        {trendPoints.points.length > 0 ? (
          <div className="mkbm-trend-chart">
            <svg
              viewBox="0 0 900 290"
              role="img"
              aria-label="Grafik tren keterlaksanaan KBM"
            >
              <defs>
                <linearGradient
                  id="mkbmAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#38bdf8"
                    stopOpacity="0.55"
                  />

                  <stop
                    offset="100%"
                    stopColor="#2563eb"
                    stopOpacity="0.03"
                  />
                </linearGradient>

                <linearGradient
                  id="mkbmLineGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {[55, 100, 145, 190, 235].map((y, index) => (
                <g key={y}>
                  <line
                    x1="65"
                    y1={y}
                    x2="835"
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="5 6"
                  />

                  <text
                    x="45"
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#94a3b8"
                  >
                    {[100, 75, 50, 25, 0][index]}%
                  </text>
                </g>
              ))}

              {trendPoints.points.length > 1 && (
                <polygon
                  points={
                    trendPoints.points
                      .map((point) => `${point.x},${point.y + 13}`)
                      .join(" ") +
                    ` ${
                      trendPoints.points[
                        trendPoints.points.length - 1
                      ].x
                    },248 ${
                      trendPoints.points[0].x
                    },248`
                  }
                  fill="#1e40af"
                  opacity="0.16"
                />
              )}

              <polygon
                points={trendPoints.areaPoints}
                fill="url(#mkbmAreaGradient)"
              />

              {trendPoints.points.length > 1 && (
                <polyline
                  points={trendPoints.linePoints}
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="9"
                  strokeOpacity="0.12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(0 5)"
                />
              )}

              {trendPoints.points.length > 1 && (
                <polyline
                  points={trendPoints.linePoints}
                  fill="none"
                  stroke="url(#mkbmLineGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {trendPoints.points.map((point, index) => (
                <g key={`${point.date}-${index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="9"
                    fill="#0ea5e9"
                    opacity="0.16"
                  />

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#fff"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />

                  <text
                    x={point.x}
                    y={point.y - 17}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="#1e40af"
                  >
                    {point.percent}%
                  </text>

                  <text
                    x={point.x}
                    y="270"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                  >
                    {point.date
                      ? `${point.date.slice(8, 10)}/${point.date.slice(5, 7)}`
                      : "—"}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="mkbm-trend-empty">
            Belum ada data jurnal untuk membentuk grafik tren.
          </div>
        )}

        <div className="mkbm-comparison-card">
          <div className="mkbm-comparison-header">
            <div>
              <span className="mkbm-trend-eyebrow">
                ANALISIS BEBAN PEMBELAJARAN
              </span>

              <h2>JP Terjadwal vs JP Terlaksana</h2>

              <p>
                Perbandingan jumlah jam pelajaran berdasarkan tanggal
                monitoring.
              </p>
            </div>
          </div>

          <div className="mkbm-comparison-legend">
            <span>
              <i className="legend-scheduled" />
              JP Terjadwal
            </span>

            <span>
              <i className="legend-actual" />
              JP Terlaksana
            </span>
          </div>

          <div className="mkbm-comparison-chart">
            {dailyData.length > 0 ? (
              (() => {
                const maximum = Math.max(
                  1,
                  ...dailyData.map((item) =>
                    Math.max(item.scheduled, item.actual)
                  )
                );

                return dailyData.map((item) => (
                  <div
                    className="mkbm-comparison-column"
                    key={item.date}
                  >
                    <div className="mkbm-comparison-bars">
                      <div
                        className="mkbm-bar mkbm-bar-scheduled"
                        style={{
                          height: `${(item.scheduled / maximum) * 100}%`,
                        }}
                        title={`JP Terjadwal: ${item.scheduled}`}
                      >
                        <span>{item.scheduled}</span>
                      </div>

                      <div
                        className="mkbm-bar mkbm-bar-actual"
                        style={{
                          height: `${(item.actual / maximum) * 100}%`,
                        }}
                        title={`JP Terlaksana: ${item.actual}`}
                      >
                        <span>{item.actual}</span>
                      </div>
                    </div>

                    <small>
                      {`${item.date.slice(8, 10)}/${item.date.slice(5, 7)}`}
                    </small>
                  </div>
                ));
              })()
            ) : (
              <div className="mkbm-trend-empty">
                Belum ada data jadwal dan jurnal untuk dibandingkan.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mkbm-summary-grid">
        <div className="mkbm-summary-card">
          <span>Total Pertemuan</span>
          <strong>{monitoringSummary.totalPertemuan}</strong>
        </div>

        <div className="mkbm-summary-card">
          <span>Jurnal Terisi</span>
          <strong>{monitoringSummary.jurnalTerisi}</strong>
        </div>

        <div className="mkbm-summary-card">
          <span>Belum Diisi</span>
          <strong>{monitoringSummary.belumDiisi}</strong>
        </div>

        <div className="mkbm-summary-card">
          <span>JP Terjadwal</span>
          <strong>{monitoringSummary.scheduledJP}</strong>
        </div>

        <div className="mkbm-summary-card">
          <span>JP Terlaksana</span>
          <strong>{monitoringSummary.actualJP}</strong>
        </div>

        <div className="mkbm-summary-card">
          <span>JP Belum Terlaksana</span>
          <strong>{monitoringSummary.belumTerlaksanaJP}</strong>
        </div>

        <div className="mkbm-summary-card">
          <span>Persentase Keterlaksanaan</span>
          <strong>{monitoringSummary.persentase}%</strong>
        </div>
      </div>

      <div className="mkbm-status-summary">
        <span>
          Terlaksana:{" "}
          <strong>{monitoringSummary.terlaksana}</strong>
        </span>

        <span>
          Sebagian:{" "}
          <strong>{monitoringSummary.sebagian}</strong>
        </span>

        <span>
          Tidak Terlaksana:{" "}
          <strong>{monitoringSummary.tidakTerlaksana}</strong>
        </span>
      </div>

      <div className="mkbm-table-section">
        <div className="mkbm-table-heading">
          <div>
            <h2>Rincian Monitoring Pembelajaran</h2>
            <p>
              Data pertemuan berdasarkan jadwal dan jurnal mengajar.
            </p>
          </div>

          <span>{filteredRecords.length} data</span>
        </div>

        <div className="mkbm-table-wrapper">
          <table className="mkbm-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Waktu</th>
                <th>Guru</th>
                <th>Rombel</th>
                <th>Mata Pelajaran</th>
                <th>JP Terjadwal</th>
                <th>JP Terlaksana</th>
                <th>Status Jurnal</th>
                <th>Status Pelaksanaan</th>
                <th>Materi</th>
                <th>Tindak Lanjut</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="11" className="mkbm-no-data">
                    Belum ada data pertemuan pada periode dan filter
                    yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const journal = item.journal;
                  const status = journal?.statusPelaksanaan;
                  const scheduled = Math.max(
                    0,
                    Number(item.jpTerjadwal) || 0
                  );

                  const actual = getActualJP(item);

                  return (
                    <tr key={item.meetingKey}>
                      <td>{formatDate(item.date)}</td>

                      <td>
                        {item.startTime}–{item.endTime}
                      </td>

                      <td>{item.teacherName}</td>
                      <td>{item.rombelName}</td>
                      <td>{item.subjectName}</td>
                      <td>{scheduled}</td>
                      <td>{actual}</td>

                      <td>
                        <span
                          className={`mkbm-status ${
                            journal ? "is-done" : "is-empty"
                          }`}
                        >
                          {journal ? "Terisi" : "Belum Diisi"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`mkbm-status ${
                            !journal
                              ? "is-empty"
                              : status === "Terlaksana"
                                ? "is-done"
                                : status === "Sebagian"
                                  ? "is-partial"
                                  : "is-failed"
                          }`}
                        >
                          {status || "Belum Diisi"}
                        </span>
                      </td>

                      <td>{journal?.materiPokok || "—"}</td>
                      <td>{journal?.tindakLanjut || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mkbm-analysis-grid">
          <section className="mkbm-analysis-card">
            <h3>Guru Belum Mengisi Jurnal</h3>

            <p>
              Daftar guru dengan pertemuan yang belum memiliki jurnal.
            </p>

            {analysis.missingTeachers.length > 0 ? (
              analysis.missingTeachers.map((item, index) => (
                <div
                  className="mkbm-analysis-row"
                  key={`${item.name}-${index}`}
                >
                  <strong>{item.name}</strong>

                  <span>
                    {item.count} pertemuan belum diisi
                  </span>
                </div>
              ))
            ) : (
              <p className="mkbm-analysis-empty">
                Semua jurnal pada filter ini sudah terisi.
              </p>
            )}
          </section>

          
<section className="mkbm-analysis-card">
  <h3>Pembelajaran Perlu Tindak Lanjut</h3>

  <p>
    Pertemuan yang sebagian atau tidak terlaksana.
  </p>

  {analysis.followUps.length > 0 ? (
    analysis.followUps.map((item) => (
      <div
        className="mkbm-analysis-row"
        key={item.meetingKey}
      >
        <strong>
          {item.teacherName} — {item.rombelName}
        </strong>

        <span>
          {item.subjectName}:{" "}
          {item.journal.statusPelaksanaan}
        </span>

        <small>
          {item.journal.tindakLanjut ||
            "Belum ada catatan tindak lanjut."}
        </small>
      </div>
    ))
  ) : filteredRecords.some((item) => !item.journal) ? (
    <p className="mkbm-analysis-empty">
      Belum dapat dianalisis karena{" "}
      {filteredRecords.filter((item) => !item.journal).length}{" "}
      pertemuan belum memiliki jurnal mengajar.
    </p>
  ) : (
    <p className="mkbm-analysis-empty">
      Tidak ada pembelajaran yang memerlukan tindak lanjut
      berdasarkan jurnal yang telah diisi pada filter ini.
    </p>
  )}
</section>

        </div>
      </div>
    </div>
  );
}
