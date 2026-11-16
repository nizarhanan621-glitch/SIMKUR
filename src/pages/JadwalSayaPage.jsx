
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  BookOpen,
  GraduationCap,
  Users,
  AlertTriangle,
  CheckCircle2,
  School,
} from "lucide-react";

const KEY = {
  schedules: "simkur_data_jadwal_pelajaran",
  settings: "simkur_pengaturan_jadwal",
  assignments: "simkur_data_tugas_mengajar",
  teachers: "simkur_data_guru",
  rombels: "simkur_data_rombel",
  subjects: "simkur_data_mata_pelajaran",
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
    DAYS.map((day) => [
      day,
      {
        jumlahJP: DEFAULT_DAY.jumlahJP,
        pembiasaan: DEFAULT_DAY.pembiasaan.map((item) => ({ ...item })),
        istirahat: DEFAULT_DAY.istirahat.map((item) => ({ ...item })),
      },
    ])
  ),
};

const styles = `
.js-page{display:flex;flex-direction:column;gap:18px;color:#26384d}
.js-header,.js-panel-head{display:flex;align-items:center;justify-content:space-between;gap:14px}
.js-eyebrow{color:#3977b5;font-size:10px;font-weight:800;letter-spacing:1.1px}
.js-header h2{margin:5px 0;color:#173b68;font-size:26px}
.js-header p,.js-panel-head p{margin:5px 0 0;color:#718096;font-size:13px;line-height:1.5}
.js-header-icon{width:52px;height:52px;display:grid;place-items:center;flex-shrink:0;border-radius:13px;background:#eaf2ff;color:#2c69a8}
.js-notice{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid #d7e7f7;border-radius:9px;background:#f2f8ff;color:#386b9d;font-size:12px;line-height:1.5}
.js-profile,.js-stats,.js-panel{border:1px solid #e2e8f0;border-radius:12px;background:#fff;box-shadow:0 3px 12px rgba(25,48,75,.035)}
.js-profile{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:15px;padding:15px}
.js-profile label{display:flex;flex-direction:column;gap:7px;color:#52657b;font-size:12px;font-weight:700}
.js-profile select{width:100%;max-width:420px;padding:10px;border:1px solid #dce4ed;border-radius:8px;background:#fff;color:#26384d;font-size:12px}
.js-profile-summary{display:flex;align-items:center;gap:10px;color:#52657b;font-size:12px}
.js-avatar{width:38px;height:38px;display:grid;place-items:center;flex-shrink:0;border-radius:50%;background:#eaf2ff;color:#2863a5;font-weight:800}
.js-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));overflow:hidden}
.js-stat{display:flex;align-items:center;gap:11px;padding:16px;border-right:1px solid #edf1f5}
.js-stat:last-child{border-right:0}
.js-stat-icon{width:39px;height:39px;display:grid;place-items:center;flex-shrink:0;border-radius:11px;background:#eaf2ff;color:#3476bd}
.js-stat-icon.green{background:#e8f7ef;color:#278657}
.js-stat-icon.orange{background:#fff3e6;color:#c47727}
.js-stat-icon.purple{background:#f1edff;color:#7959bb}
.js-stat span{display:block;color:#718096;font-size:11px}
.js-stat strong{display:block;margin-top:4px;color:#1c3553;font-size:22px}
.js-panel{padding:17px}
.js-panel-head{margin-bottom:14px}
.js-panel-head h3{margin:0;color:#1d3d62;font-size:16px}
.js-day-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.js-day-card{min-width:0;overflow:hidden;border:1px solid #e5ebf2;border-radius:10px;background:#fff}
.js-day-head{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:12px 13px;background:#f5f8fc;border-bottom:1px solid #e8eef5}
.js-day-head strong{color:#294867;font-size:13px}
.js-day-head span{padding:4px 8px;border-radius:20px;background:#eaf2ff;color:#2863a5;font-size:10px;font-weight:750}
.js-day-head span.today{background:#e8f7ef;color:#278657}
.js-period-list{display:flex;flex-direction:column;padding:5px 12px}
.js-period{display:grid;grid-template-columns:62px minmax(0,1fr) auto;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #edf1f5}
.js-period:last-child{border-bottom:0}
.js-period-time{display:flex;flex-direction:column;gap:3px;color:#3476bd;font-size:10px;font-weight:750}
.js-period-time small{color:#91a0b0;font-size:9px;font-weight:500}
.js-period-info{min-width:0;display:flex;flex-direction:column;gap:4px}
.js-period-info strong{overflow-wrap:anywhere;color:#344c67;font-size:12px}
.js-period-info span{color:#8291a3;font-size:10px}
.js-period-number{padding:5px 7px;border-radius:7px;background:#f0f5fb;color:#536b85;font-size:10px;font-weight:750;white-space:nowrap}
.js-break{display:flex;align-items:center;gap:9px;margin:5px 0;padding:8px 9px;border-radius:7px;background:#fff8e9;color:#97702a;font-size:10px}
.js-break strong{font-weight:750}
.js-empty{padding:25px 12px;color:#8392a4;text-align:center;font-size:11px}
.js-empty svg{display:block;margin:0 auto 7px;color:#91a4ba}
.js-empty strong{display:block;margin-bottom:4px;color:#52657b}
.js-footer{display:flex;align-items:flex-start;gap:8px;color:#8391a2;font-size:11px;line-height:1.5}
@media(max-width:850px){.js-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.js-stat:nth-child(2){border-right:0}.js-stat:nth-child(-n+2){border-bottom:1px solid #edf1f5}}
@media(max-width:650px){.js-day-grid{grid-template-columns:1fr}}
@media(max-width:560px){.js-header{align-items:flex-start}.js-profile{grid-template-columns:1fr}.js-profile-summary{justify-content:flex-start}.js-stats{grid-template-columns:1fr}.js-stat{border-right:0;border-bottom:1px solid #edf1f5}.js-stat:last-child{border-bottom:0}.js-period{grid-template-columns:57px minmax(0,1fr) auto;gap:7px}}
`;

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error(`Gagal membaca ${key}:`, error);
    return [];
  }
}

function readObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");

    return value &&
      typeof value === "object" &&
      !Array.isArray(value)
      ? value
      : {};
  } catch (error) {
    console.error(`Gagal membaca ${key}:`, error);
    return {};
  }
}

function normalizeSettings(saved) {
  const result = {
    ...DEFAULT_SETTINGS,
    ...(saved || {}),
    hari: {},
  };

  DAYS.forEach((day) => {
    const oldDay = saved?.hari?.[day] || {};

    result.hari[day] = {
      jumlahJP: Number(
        oldDay.jumlahJP ?? DEFAULT_DAY.jumlahJP
      ),
      pembiasaan: Array.isArray(oldDay.pembiasaan)
        ? oldDay.pembiasaan
        : DEFAULT_DAY.pembiasaan.map((item) => ({ ...item })),
      istirahat: Array.isArray(oldDay.istirahat)
        ? oldDay.istirahat
        : DEFAULT_DAY.istirahat.map((item) => ({ ...item })),
    };
  });

  return result;
}

function readData() {
  return {
    schedules: readArray(KEY.schedules),
    settings: normalizeSettings(readObject(KEY.settings)),
    assignments: readArray(KEY.assignments),
    teachers: readArray(KEY.teachers),
    rombels: readArray(KEY.rombels),
    subjects: readArray(KEY.subjects),
  };
}

function isActive(item) {
  return Boolean(item) && item.status !== "Nonaktif";
}

function getName(item, fields) {
  for (const field of fields) {
    if (item?.[field]) return item[field];
  }

  return "-";
}

function toMinutes(value) {
  const [hour, minute] = String(value || "07:00")
    .split(":")
    .map(Number);

  return hour * 60 + minute;
}

function toTime(minutes) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function buildPeriodTimes(settings, day) {
  const config = settings?.hari?.[day] || DEFAULT_DAY;
  const total = Math.max(0, Number(config.jumlahJP || 0));
  const duration = Math.max(1, Number(settings.durasiJP || 40));

  let cursor = toMinutes(settings.jamMulai);

  (config.pembiasaan || []).forEach((item) => {
    cursor += Math.max(0, Number(item.durasi || 0));
  });

  const periods = {};
  const breaksAfter = {};

  (config.istirahat || []).forEach((item) => {
    const key = Number(item.setelahJP);
    if (!breaksAfter[key]) breaksAfter[key] = [];
    breaksAfter[key].push(item);
  });

  for (let number = 1; number <= total; number += 1) {
    const start = cursor;
    cursor += duration;

    periods[number] = {
      start: toTime(start),
      end: toTime(cursor),
    };

    (breaksAfter[number] || []).forEach((item) => {
      cursor += Math.max(0, Number(item.durasi || 0));
    });
  }

  return periods;
}

function formatToday() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getTodayName() {
  return DAYS[new Date().getDay()];
}

export default function JadwalSayaPage() {
  const [data, setData] = useState(readData);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const todayName = getTodayName();

  useEffect(() => {
    const refresh = () => setData(readData());

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
    const available = activeTeachers.some(
      (item) =>
        String(item.id) === String(selectedTeacherId)
    );

    if (!available) {
      setSelectedTeacherId(
        activeTeachers[0]
          ? String(activeTeachers[0].id)
          : ""
      );
    }
  }, [activeTeachers, selectedTeacherId]);

  const selectedTeacher = activeTeachers.find(
    (item) =>
      String(item.id) === String(selectedTeacherId)
  );

  const activeDays =
    data.settings.polaHari === "senin-sabtu"
      ? DAYS
      : DAYS.filter((day) => day !== "Sabtu");

  const assignments = useMemo(
    () =>
      data.assignments.filter((assignment) => {
        if (!isActive(assignment)) return false;

        if (
          String(assignment.guruId) !==
          String(selectedTeacherId)
        ) {
          return false;
        }

        const teacher = data.teachers.find(
          (item) =>
            String(item.id) === String(assignment.guruId)
        );

        const rombel = data.rombels.find(
          (item) =>
            String(item.id) === String(assignment.rombelId)
        );

        const subject = data.subjects.find(
          (item) =>
            String(item.id) === String(assignment.mapelId)
        );

        return (
          isActive(teacher) &&
          isActive(rombel) &&
          isActive(subject)
        );
      }),
    [
      data.assignments,
      data.teachers,
      data.rombels,
      data.subjects,
      selectedTeacherId,
    ]
  );

  const assignmentMap = useMemo(
    () =>
      new Map(
        assignments.map((item) => [
          String(item.id),
          item,
        ])
      ),
    [assignments]
  );

  const teacherSchedules = useMemo(
    () =>
      data.schedules
        .filter(
          (item) =>
            item.status !== "Nonaktif" &&
            activeDays.includes(item.hari) &&
            assignmentMap.has(
              String(item.tugasMengajarId)
            )
        )
        .sort((a, b) => {
          const dayDifference =
            activeDays.indexOf(a.hari) -
            activeDays.indexOf(b.hari);

          return dayDifference ||
            Number(a.jamKe) - Number(b.jamKe);
        }),
    [data.schedules, activeDays, assignmentMap]
  );

  const scheduleByDay = useMemo(
    () =>
      Object.fromEntries(
        activeDays.map((day) => [
          day,
          teacherSchedules.filter(
            (item) => item.hari === day
          ),
        ])
      ),
    [activeDays, teacherSchedules]
  );

  const dayCount = activeDays.filter(
    (day) => scheduleByDay[day]?.length > 0
  ).length;

  const subjectCount = new Set(
    assignments.map((item) => String(item.mapelId))
  ).size;

  const rombelCount = new Set(
    assignments.map((item) => String(item.rombelId))
  ).size;

  const todayCount = scheduleByDay[todayName]?.length || 0;

  const timelineByDay = useMemo(
    () =>
      Object.fromEntries(
        activeDays.map((day) => [
          day,
          buildPeriodTimes(data.settings, day),
        ])
      ),
    [activeDays, data.settings]
  );

  function getAssignment(id) {
    return assignmentMap.get(String(id));
  }

  function getScheduleDetails(schedule) {
    const assignment = getAssignment(
      schedule.tugasMengajarId
    );

    if (!assignment) return null;

    const subject = data.subjects.find(
      (item) =>
        String(item.id) === String(assignment.mapelId)
    );

    const rombel = data.rombels.find(
      (item) =>
        String(item.id) === String(assignment.rombelId)
    );

    return {
      subject: getName(subject, ["nama", "namaMapel"]),
      rombel: getName(rombel, ["namaRombel"]),
    };
  }

  return (
    <main className="js-page">
      <style>{styles}</style>

      <header className="js-header">
        <div>
          <span className="js-eyebrow">RUANG KERJA GURU</span>
          <h2>Jadwal Saya</h2>
          <p>
            Lihat jadwal mengajar pribadi berdasarkan penugasan
            dan master timetable sekolah.
          </p>
        </div>

        <div className="js-header-icon">
          <CalendarDays size={25} />
        </div>
      </header>

      <div className="js-notice">
        <CheckCircle2 size={17} />
        Jadwal bersifat baca-saja dan mengikuti pengaturan
        jadwal resmi yang dikelola Wakasek Kurikulum.
      </div>

      <section className="js-profile">
        <label>
          Profil Guru
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

        {selectedTeacher && (
          <div className="js-profile-summary">
            <div className="js-avatar">
              {getName(selectedTeacher, ["nama", "namaGuru"])
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {getName(selectedTeacher, ["nama", "namaGuru"])}
              </strong>
              <div>{formatToday()}</div>
            </div>
          </div>
        )}
      </section>

      <section className="js-stats">
        <article className="js-stat">
          <div className="js-stat-icon">
            <CalendarDays size={20} />
          </div>
          <div>
            <span>Total Slot Mingguan</span>
            <strong>{teacherSchedules.length}</strong>
          </div>
        </article>

        <article className="js-stat">
          <div className="js-stat-icon green">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Jadwal Hari Ini</span>
            <strong>{todayCount}</strong>
          </div>
        </article>

        <article className="js-stat">
          <div className="js-stat-icon purple">
            <BookOpen size={20} />
          </div>
          <div>
            <span>Mata Pelajaran</span>
            <strong>{subjectCount}</strong>
          </div>
        </article>

        <article className="js-stat">
          <div className="js-stat-icon orange">
            <School size={20} />
          </div>
          <div>
            <span>Rombel Diampu</span>
            <strong>{rombelCount}</strong>
          </div>
        </article>
      </section>

      <section className="js-panel">
        <div className="js-panel-head">
          <div>
            <h3>Jadwal Mengajar Mingguan</h3>
            <p>
              Pola belajar sekolah:{" "}
              {data.settings.polaHari === "senin-sabtu"
                ? "Senin–Sabtu"
                : "Senin–Jumat"}
              . Jam pelajaran mengikuti pengaturan sekolah.
            </p>
          </div>

          <CalendarDays size={21} />
        </div>

        {!selectedTeacherId ? (
          <div className="js-empty">
            <Users size={28} />
            <strong>Profil guru belum tersedia</strong>
            Pilih profil guru untuk melihat jadwal mengajar.
          </div>
        ) : teacherSchedules.length === 0 ? (
          <div className="js-empty">
            <BookOpen size={28} />
            <strong>Belum ada jadwal mengajar</strong>
            Tidak ditemukan jadwal aktif untuk guru ini.
          </div>
        ) : (
          <div className="js-day-grid">
            {activeDays.map((day) => {
              const entries = scheduleByDay[day] || [];
              const periods = timelineByDay[day] || {};

              return (
                <section className="js-day-card" key={day}>
                  <div className="js-day-head">
                    <strong>{day}</strong>
                    <span
                      className={
                        day === todayName ? "today" : ""
                      }
                    >
                      {entries.length} slot
                      {day === todayName ? " · Hari ini" : ""}
                    </span>
                  </div>

                  {entries.length === 0 ? (
                    <div className="js-empty">
                      Tidak ada jadwal mengajar.
                    </div>
                  ) : (
                    <div className="js-period-list">
                      {entries.map((schedule) => {
                        const details =
                          getScheduleDetails(schedule);

                        const period =
                          Number(schedule.jamKe);

                        const time = periods[period];

                        const config =
                          data.settings.hari[day];

                        const breaks = (
                          config?.istirahat || []
                        ).filter(
                          (item) =>
                            Number(item.setelahJP) === period
                        );

                        return (
                          <div key={schedule.id}>
                            <article className="js-period">
                              <div className="js-period-time">
                                <span>
                                  {time?.start || "--:--"}
                                </span>
                                <small>
                                  {time?.end || "--:--"}
                                </small>
                              </div>

                              <div className="js-period-info">
                                <strong>
                                  {details?.subject || "Mapel tidak ditemukan"}
                                </strong>
                                <span>
                                  <GraduationCap
                                    size={12}
                                    style={{
                                      display: "inline",
                                      verticalAlign: "middle",
                                    }}
                                  />
                                  {" "}
                                  {details?.rombel || "Rombel tidak ditemukan"}
                                </span>
                              </div>

                              <span className="js-period-number">
                                JP {period}
                              </span>
                            </article>

                            {breaks.map((item) => (
                              <div
                                className="js-break"
                                key={item.id}
                              >
                                <Clock3 size={13} />
                                <strong>{item.nama}</strong>
                                <span>
                                  {item.durasi} menit
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>

      <div className="js-footer">
        <AlertTriangle size={14} />
        Jadwal ditampilkan dari master timetable sekolah.
        Perubahan jadwal hanya dapat dilakukan melalui menu
        Jadwal Pelajaran oleh Wakasek Kurikulum. Profil guru
        masih dipilih manual selama sistem menggunakan mode preview.
      </div>
    </main>
  );
}
