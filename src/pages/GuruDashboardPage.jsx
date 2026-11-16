
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  CalendarDays,
  Clock3,
  BookOpen,
  ClipboardPenLine,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Users,
  FileText,
  CalendarCheck,
} from "lucide-react";

const KEY = {
  teachers: "simkur_data_guru",
  rombels: "simkur_data_rombel",
  subjects: "simkur_data_mata_pelajaran",
  assignments: "simkur_data_tugas_mengajar",
  schedules: "simkur_data_jadwal_pelajaran",
  settings: "simkur_pengaturan_jadwal",
  journals: "simkur_data_jurnal_mengajar",
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

const DAY_SHORT = {
  Senin: "Sen",
  Selasa: "Sel",
  Rabu: "Rab",
  Kamis: "Kam",
  Jumat: "Jum",
  Sabtu: "Sab",
};

const pageStyles = `
.gd-page{display:flex;flex-direction:column;gap:18px;color:#26384d}
.gd-header,.gd-panel-head{display:flex;align-items:center;justify-content:space-between;gap:14px}
.gd-eyebrow{color:#3977b5;font-size:10px;font-weight:800;letter-spacing:1.1px}
.gd-header h2{margin:5px 0;color:#173b68;font-size:26px}
.gd-header p,.gd-panel-head p{margin:5px 0 0;color:#718096;font-size:13px;line-height:1.5}
.gd-icon{width:52px;height:52px;display:grid;place-items:center;flex-shrink:0;border-radius:13px;background:#eaf2ff;color:#2c69a8}
.gd-notice,.gd-info{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid #f0d9a8;border-radius:9px;background:#fffaf0;color:#95651a;font-size:12px;line-height:1.5}
.gd-info{border-color:#d7e7f7;background:#f2f8ff;color:#386b9d}
.gd-profile,.gd-stats,.gd-panel{border:1px solid #e2e8f0;border-radius:12px;background:#fff;box-shadow:0 3px 12px rgba(25,48,75,.035)}
.gd-profile{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:15px;padding:15px}
.gd-profile label{display:flex;flex-direction:column;gap:7px;color:#52657b;font-size:12px;font-weight:700}
.gd-profile select{width:100%;max-width:420px;padding:10px;border:1px solid #dce4ed;border-radius:8px;background:#fff;color:#26384d;font-size:12px}
.gd-profile-summary{display:flex;align-items:center;gap:10px;color:#52657b;font-size:12px}
.gd-avatar{width:38px;height:38px;display:grid;place-items:center;flex-shrink:0;border-radius:50%;background:#eaf2ff;color:#2863a5;font-weight:800}
.gd-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));overflow:hidden}
.gd-stat{display:flex;align-items:center;gap:11px;padding:16px;border-right:1px solid #edf1f5}
.gd-stat:last-child{border-right:0}
.gd-stat-icon{width:39px;height:39px;display:grid;place-items:center;flex-shrink:0;border-radius:11px;background:#eaf2ff;color:#3476bd}
.gd-stat-icon.green{background:#e8f7ef;color:#278657}
.gd-stat-icon.orange{background:#fff3e6;color:#c47727}
.gd-stat-icon.purple{background:#f1edff;color:#7959bb}
.gd-stat span{display:block;color:#718096;font-size:11px}
.gd-stat strong{display:block;margin-top:4px;color:#1c3553;font-size:22px}
.gd-panel{padding:17px}
.gd-panel-head{margin-bottom:14px}
.gd-panel-head h3{margin:0;color:#1d3d62;font-size:16px}
.gd-panel-head p{font-size:12px}
.gd-schedule-list,.gd-history-list{display:flex;flex-direction:column;gap:9px}
.gd-schedule-item,.gd-history-item{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #edf1f5;border-radius:9px}
.gd-time{min-width:92px;display:flex;align-items:center;gap:6px;color:#3476bd;font-size:11px;font-weight:800}
.gd-schedule-info,.gd-history-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.gd-schedule-info strong,.gd-history-info strong{color:#344c67;font-size:12px}
.gd-schedule-info span,.gd-history-info span{color:#8291a3;font-size:11px}
.gd-period{padding:5px 8px;border-radius:7px;background:#f0f5fb;color:#536b85;font-size:10px;font-weight:750}
.gd-status{padding:5px 8px;border-radius:20px;background:#edf2f7;color:#5d6c7e;font-size:10px;font-weight:750}
.gd-status.done{background:#e8f7ef;color:#278657}
.gd-status.partial{background:#fff3e6;color:#c47727}
.gd-status.missed{background:#fff0ef;color:#ae4942}
.gd-empty{padding:28px 15px;border:1px dashed #dce4ed;border-radius:9px;color:#8392a4;text-align:center;font-size:12px}
.gd-empty svg{display:block;margin:0 auto 8px;color:#91a4ba}
.gd-empty strong{display:block;margin-bottom:5px;color:#52657b}
.gd-progress{height:9px;overflow:hidden;border-radius:30px;background:#e9eef4}
.gd-progress span{display:block;height:100%;border-radius:30px;background:#4386cc}
.gd-progress-label{display:flex;justify-content:space-between;gap:10px;margin-top:7px;color:#75869a;font-size:11px}
.gd-status-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:15px}
.gd-status-card{padding:12px;border:1px solid #edf1f5;border-radius:8px}
.gd-status-card span{display:block;color:#718096;font-size:10px}
.gd-status-card strong{display:block;margin-top:5px;color:#1d3d62;font-size:20px}
.gd-history-item{justify-content:space-between}
.gd-note{display:flex;align-items:flex-start;gap:9px;color:#8391a2;font-size:11px;line-height:1.5}
@media(max-width:800px){.gd-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.gd-stat:nth-child(2){border-right:0}.gd-stat:nth-child(-n+2){border-bottom:1px solid #edf1f5}}
@media(max-width:560px){.gd-header{align-items:flex-start}.gd-profile{grid-template-columns:1fr}.gd-profile-summary{justify-content:flex-start}.gd-stats{grid-template-columns:1fr}.gd-stat{border-right:0;border-bottom:1px solid #edf1f5}.gd-stat:last-child{border-bottom:0}.gd-status-grid{grid-template-columns:1fr}.gd-schedule-item{align-items:flex-start;flex-wrap:wrap}.gd-period{margin-left:auto}}
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
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch (error) {
    console.error(`Gagal membaca ${key}:`, error);
    return {};
  }
}

function readData() {
  return {
    teachers: readArray(KEY.teachers),
    rombels: readArray(KEY.rombels),
    subjects: readArray(KEY.subjects),
    assignments: readArray(KEY.assignments),
    schedules: readArray(KEY.schedules),
    settings: readObject(KEY.settings),
    journals: readArray(KEY.journals),
  };
}

function isActive(item) {
  return Boolean(item) && item.status !== "Nonaktif";
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getName(item, fields) {
  for (const field of fields) {
    if (item?.[field]) return item[field];
  }
  return "-";
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getWeekRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: dateKey(monday),
    end: dateKey(sunday),
  };
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

  (Array.isArray(config.pembiasaan) ? config.pembiasaan : [])
    .forEach((item) => {
      cursor += Math.max(0, Number(item.durasi || 0));
    });

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

function formatDate(value) {
  if (!value) return "-";

  const [year, month, day] = String(value)
    .slice(0, 10)
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getStatusClass(status) {
  if (status === "Terlaksana") return "done";
  if (status === "Sebagian") return "partial";
  if (status === "Tidak Terlaksana") return "missed";
  return "";
}

export default function GuruDashboardPage({ userId }) {
  const [data, setData] = useState(readData);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [mappingLoading, setMappingLoading] = useState(true);
  const [mappingError, setMappingError] = useState("");
  useEffect(() => {
  let aktif = true;

  async function ambilRelasiGuru() {
    setMappingLoading(true);
    setMappingError("");

    if (!userId) {
      setMappingError("ID akun pengguna tidak ditemukan.");
      setMappingLoading(false);
      return;
    }

    const { data: relasi, error } = await supabase
      .from("relasi_akun_guru")
      .select("guru_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!aktif) return;

    if (error || !relasi) {
      setMappingError(
        error?.message || "Akun Guru belum terhubung dengan profil Guru."
      );
    } else {
      setSelectedTeacherId(String(relasi.guru_id));
    }

    setMappingLoading(false);
  }

  ambilRelasiGuru();

  return () => {
    aktif = false;
  };
}, [userId]);

  const today = dateKey(new Date());
  const todayName = DAYS[new Date().getDay()];
  const week = useMemo(() => getWeekRange(), []);

  useEffect(() => {
    const refresh = () => setData(readData());

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("simkur-calendar-updated", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("simkur-calendar-updated", refresh);
    };
  }, []);

  const activeTeachers = useMemo(
    () => data.teachers.filter(isActive),
    [data.teachers]
  );

  useEffect(() => {
  if (mappingLoading || !selectedTeacherId) return;

  const available = activeTeachers.some(
    (item) => String(item.id) === String(selectedTeacherId)
  );

  if (!available) {
    setMappingError(
      "Profil Guru yang terhubung dengan akun tidak ditemukan atau tidak aktif."
    );
    setSelectedTeacherId("");
  }
}, [activeTeachers, mappingLoading, selectedTeacherId]);

  const selectedTeacher = activeTeachers.find(
    (item) => String(item.id) === String(selectedTeacherId)
  );

  const assignments = useMemo(
    () =>
      data.assignments.filter((assignment) => {
        if (!isActive(assignment)) return false;

        const teacher = activeTeachers.find(
          (item) => String(item.id) === String(assignment.guruId)
        );

        const rombel = data.rombels.find(
          (item) => String(item.id) === String(assignment.rombelId)
        );

        const subject = data.subjects.find(
          (item) => String(item.id) === String(assignment.mapelId)
        );

        return (
          String(assignment.guruId) === String(selectedTeacherId) &&
          isActive(teacher) &&
          isActive(rombel) &&
          isActive(subject)
        );
      }),
    [
      data.assignments,
      data.rombels,
      data.subjects,
      activeTeachers,
      selectedTeacherId,
    ]
  );

  const assignmentMap = useMemo(
    () => new Map(assignments.map((item) => [String(item.id), item])),
    [assignments]
  );

  const activeDays =
    data.settings?.polaHari === "senin-sabtu"
      ? ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
      : ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  const schoolDay = activeDays.includes(todayName);

  const todaySchedule = useMemo(() => {
    if (!selectedTeacherId || !schoolDay) return [];

    const periodTimes = getPeriodTimes(data.settings, todayName);

    return data.schedules
      .filter(
        (item) =>
          item.hari === todayName &&
          item.status !== "Nonaktif" &&
          assignmentMap.has(String(item.tugasMengajarId))
      )
      .map((item) => {
        const assignment = assignmentMap.get(
          String(item.tugasMengajarId)
        );

        const subject = data.subjects.find(
          (row) => String(row.id) === String(assignment.mapelId)
        );

        const rombel = data.rombels.find(
          (row) => String(row.id) === String(assignment.rombelId)
        );

        const period = Number(item.jamKe);
        const time = periodTimes[period];

        return {
          id: item.id,
          period,
          subject: getName(subject, ["nama", "namaMapel"]),
          rombel: getName(rombel, ["namaRombel"]),
          start: time?.start || "--:--",
          end: time?.end || "--:--",
        };
      })
      .filter((item) => Number.isInteger(item.period) && item.period > 0)
      .sort((a, b) => a.period - b.period);
  }, [
    data.schedules,
    data.subjects,
    data.rombels,
    data.settings,
    assignmentMap,
    selectedTeacherId,
    todayName,
    schoolDay,
  ]);

  const teacherJournals = useMemo(
    () =>
      data.journals.filter(
        (item) =>
          String(item.guruId) === String(selectedTeacherId)
      ),
    [data.journals, selectedTeacherId]
  );

  const todayJournals = teacherJournals.filter(
    (item) => String(item.tanggal || "").slice(0, 10) === today
  );

  const weekJournals = teacherJournals.filter((item) => {
    const date = String(item.tanggal || "").slice(0, 10);
    return date >= week.start && date <= week.end;
  });

  const weekSummary = weekJournals.reduce(
    (result, item) => {
      const scheduled = Math.max(0, safeNumber(item.jpTerjadwal));
      const actual = Math.min(
        scheduled,
        Math.max(0, safeNumber(item.jpTerlaksana))
      );

      result.scheduledJP += scheduled;
      result.actualJP += actual;

      if (item.statusPelaksanaan === "Terlaksana") result.done += 1;
      if (item.statusPelaksanaan === "Sebagian") result.partial += 1;
      if (item.statusPelaksanaan === "Tidak Terlaksana") result.missed += 1;

      return result;
    },
    {
      scheduledJP: 0,
      actualJP: 0,
      done: 0,
      partial: 0,
      missed: 0,
    }
  );

  const actualPercentage = weekSummary.scheduledJP
    ? Math.round(
        (weekSummary.actualJP / weekSummary.scheduledJP) * 100
      )
    : 0;

  const recentJournals = [...teacherJournals]
    .sort((a, b) =>
      String(b.tanggal).localeCompare(String(a.tanggal))
    )
    .slice(0, 5);

  const todayStatus = {
    completed: todayJournals.filter(
      (item) => item.statusPelaksanaan === "Terlaksana"
    ).length,
    partial: todayJournals.filter(
      (item) => item.statusPelaksanaan === "Sebagian"
    ).length,
    missed: todayJournals.filter(
      (item) => item.statusPelaksanaan === "Tidak Terlaksana"
    ).length,
  };

  return (
    <div className="gd-page">
      <style>{pageStyles}</style>

      <header className="gd-header">
        <div>
          <span className="gd-eyebrow">RUANG KERJA GURU</span>
          <h2>Dashboard Guru</h2>
          <p>
            Pantau jadwal mengajar dan perkembangan jurnal pembelajaran
            berdasarkan data penugasan Anda.
          </p>
        </div>

        <div className="gd-icon">
          <GraduationCap size={26} />
        </div>
      </header>

      <div className="gd-notice">
  {mappingLoading ? (
    <span>Memuat identitas akun Guru...</span>
  ) : mappingError ? (
    <span>{mappingError}</span>
  ) : (
    <span>Identitas Guru terhubung otomatis dengan akun yang login.</span>
  )}
</div>

<section className="gd-profile">
  {selectedTeacher && !mappingLoading && !mappingError && (
    <div className="gd-profile-summary">
      <div className="gd-avatar">
        {getName(selectedTeacher, ["nama", "namaGuru"])
          .charAt(0)
          .toUpperCase()}
      </div>
      <div>
        <strong>
          {getName(selectedTeacher, ["nama", "namaGuru"])}
        </strong>
        <div>{assignments.length} penugasan mengajar aktif</div>
      </div>
    </div>
  )}
</section>

      {!mappingLoading && !mappingError && selectedTeacher && (
      <section className="gd-stats">
        <article className="gd-stat">
          <div className="gd-stat-icon">
            <BookOpen size={20} />
          </div>
          <div>
            <span>Penugasan Mengajar</span>
            <strong>{assignments.length}</strong>
          </div>
        </article>

        <article className="gd-stat">
          <div className="gd-stat-icon purple">
            <CalendarDays size={20} />
          </div>
          <div>
            <span>JP Dijadwalkan Hari Ini</span>
            <strong>{todaySchedule.length}</strong>
          </div>
        </article>

        <article className="gd-stat">
          <div className="gd-stat-icon green">
            <ClipboardPenLine size={20} />
          </div>
          <div>
            <span>Jurnal Hari Ini</span>
            <strong>{todayJournals.length}</strong>
          </div>
        </article>

        <article className="gd-stat">
          <div className="gd-stat-icon orange">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Realisasi JP Minggu Ini</span>
            <strong>
              {weekSummary.scheduledJP > 0
                ? `${actualPercentage}%`
                : "-"}
            </strong>
          </div>
        </article>
      </section>
      )}

      <section className="gd-panel">
        <div className="gd-panel-head">
          <div>
            <h3>Jadwal Mengajar Hari Ini</h3>
            <p>{formatDate(today)}</p>
          </div>
          <CalendarCheck size={21} />
        </div>

        {mappingLoading ? (
  <div className="gd-empty">
    Memverifikasi identitas akun Guru...
  </div>
) : mappingError ? (
  <div className="gd-empty">
    <strong>Identitas Guru belum terverifikasi</strong>
    {mappingError}
  </div>
) : !selectedTeacherId ? (
  <div className="gd-empty">
    <Users size={29} />
    <strong>Profil Guru belum tersedia</strong>
    Hubungi Wakasek untuk memeriksa relasi akun Guru.
  </div> 
        ) : !schoolDay ? (
          <div className="gd-empty">
            <CalendarDays size={29} />
            <strong>Bukan hari belajar sekolah</strong>
            {todayName} tidak termasuk pola hari belajar yang aktif.
          </div>
        ) : todaySchedule.length === 0 ? (
          <div className="gd-empty">
            <BookOpen size={29} />
            <strong>Tidak ada jadwal mengajar hari ini</strong>
            Tidak ditemukan penugasan pada hari ini.
          </div>
        ) : (
          <div className="gd-schedule-list">
            {todaySchedule.map((item) => (
              <article className="gd-schedule-item" key={item.id}>
                <div className="gd-time">
                  <Clock3 size={15} />
                  {item.start}–{item.end}
                </div>

                <div className="gd-schedule-info">
                  <strong>{item.subject}</strong>
                  <span>{item.rombel}</span>
                </div>

                <span className="gd-period">
                  JP {item.period}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="gd-panel">
        <div className="gd-panel-head">
          <div>
            <h3>Ringkasan Jurnal Mengajar Hari Ini</h3>
            <p>
              Status jurnal yang telah disimpan untuk tanggal ini.
            </p>
          </div>
          <ClipboardPenLine size={21} />
        </div>

        <div className="gd-status-grid">
          <div className="gd-status-card">
            <span>Terlaksana</span>
            <strong>{todayStatus.completed}</strong>
          </div>

          <div className="gd-status-card">
            <span>Terlaksana Sebagian</span>
            <strong>{todayStatus.partial}</strong>
          </div>

          <div className="gd-status-card">
            <span>Tidak Terlaksana</span>
            <strong>{todayStatus.missed}</strong>
          </div>
        </div>
      </section>

      <section className="gd-panel">
        <div className="gd-panel-head">
          <div>
            <h3>Rekap Pembelajaran Minggu Ini</h3>
            <p>
              {formatDate(week.start)} sampai {formatDate(week.end)}
            </p>
          </div>
          <CheckCircle2 size={21} />
        </div>

        <div className="gd-status-grid">
          <div className="gd-status-card">
            <span>JP Terjadwal dalam Jurnal</span>
            <strong>{weekSummary.scheduledJP}</strong>
          </div>

          <div className="gd-status-card">
            <span>JP Terlaksana</span>
            <strong>{weekSummary.actualJP}</strong>
          </div>

          <div className="gd-status-card">
            <span>JP Belum Terlaksana</span>
            <strong>
              {Math.max(
                0,
                weekSummary.scheduledJP - weekSummary.actualJP
              )}
            </strong>
          </div>
        </div>

        <div style={{ marginTop: 15 }}>
          <div className="gd-progress">
            <span style={{ width: `${actualPercentage}%` }} />
          </div>

          <div className="gd-progress-label">
            <span>Realisasi berdasarkan jurnal tersimpan</span>
            <strong>{actualPercentage}%</strong>
          </div>
        </div>
      </section>

      <section className="gd-panel">
        <div className="gd-panel-head">
          <div>
            <h3>Riwayat Jurnal Terakhir</h3>
            <p>Lima catatan jurnal terakhir dari profil guru terpilih.</p>
          </div>
          <FileText size={21} />
        </div>

        {mappingLoading || mappingError || !selectedTeacherId ? (
  <div className="gd-empty">
    <strong>Riwayat jurnal belum tersedia</strong>
    {mappingLoading
      ? "Memverifikasi identitas akun Guru..."
      : mappingError || "Profil Guru belum terhubung."}
  </div>
) : recentJournals.length === 0 ? (
          <div className="gd-empty">
            <FileText size={28} />
            <strong>Belum ada riwayat jurnal</strong>
            Catatan jurnal yang sudah disimpan akan tampil di sini.
          </div>
        ) : (
          <div className="gd-history-list">
            {recentJournals.map((item) => (
              <article className="gd-history-item" key={item.id}>
                <div className="gd-history-info">
                  <strong>
                    {item.snapshot?.namaMapel || "Mata Pelajaran"}
                  </strong>
                  <span>
                    {formatDate(item.tanggal)} ·{" "}
                    {item.snapshot?.namaRombel || "Rombel"}
                  </span>
                  <span>
                    {item.materiPokok || "Materi tidak dicantumkan"}
                  </span>
                </div>

                <span
                  className={`gd-status ${getStatusClass(
                    item.statusPelaksanaan
                  )}`}
                >
                  {item.statusPelaksanaan || "Belum Diisi"}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="gd-note">
        <AlertTriangle size={15} />
        Dashboard menampilkan data berdasarkan profil guru yang dipilih.
        Penguncian akses per akun guru dan sinkronisasi database online
        belum diaktifkan.
      </div>
    </div>
  );
}
