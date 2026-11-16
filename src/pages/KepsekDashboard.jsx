
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  School,
  CalendarCheck,
  CalendarDays,
  Clock3,
  ArrowUpRight,
  CircleAlert,
  CheckCircle2,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { StatCard, DonutChart } from "../components/DashboardWidgets";
import { loadAcademicCalendarEvents } from "../lib/calendarStorage";
import "../styles/WakasekDashboard.css";

const KEY = {
  teachers: "simkur_data_guru",
  students: "simkur_data_siswa",
  rombels: "simkur_data_rombel",
  placements: "simkur_penempatan_siswa",
  subjects: "simkur_data_mata_pelajaran",
  assignments: "simkur_data_tugas_mengajar",
  schedules: "simkur_data_jadwal_pelajaran",
  journals: "simkur_data_jurnal_mengajar",
  programs: "simkur_program_kerja_kurikulum",
};

const DAY_SHORT = {
  Senin: "Sen",
  Selasa: "Sel",
  Rabu: "Rab",
  Kamis: "Kam",
  Jumat: "Jum",
  Sabtu: "Sab",
};

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error(`Gagal membaca ${key}:`, error);
    return [];
  }
}

function readDashboardData() {
  return {
    teachers: readArray(KEY.teachers),
    students: readArray(KEY.students),
    rombels: readArray(KEY.rombels),
    placements: readArray(KEY.placements),
    subjects: readArray(KEY.subjects),
    assignments: readArray(KEY.assignments),
    schedules: readArray(KEY.schedules),
    journals: readArray(KEY.journals),
    programs: readArray(KEY.programs),
    calendar: loadAcademicCalendarEvents(),
  };
}

function isActive(item) {
  return Boolean(item) && item.status !== "Nonaktif";
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getCurrentWeek() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: toDateKey(monday),
    end: toDateKey(sunday),
    today: toDateKey(today),
  };
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
    day: "numeric",
    month: "short",
  });
}

function getEventDate(event) {
  return String(event?.startDate || event?.date || "").slice(0, 10);
}

function getEventTime(event) {
  const value =
    event?.startTime || event?.time || event?.jamMulai || "";

  return String(value).replace(":", ".") || "Agenda";
}

function getEventDetail(event) {
  return (
    event?.location ||
    event?.lokasi ||
    event?.description ||
    event?.category ||
    "Agenda sekolah"
  );
}

function KepsekDashboard() {
  const [data, setData] = useState(readDashboardData);

  const week = useMemo(() => getCurrentWeek(), []);

  useEffect(() => {
    const refresh = () => setData(readDashboardData());

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("simkur-calendar-updated", refresh);
    window.addEventListener("simkur-program-kerja-updated", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("simkur-calendar-updated", refresh);
      window.removeEventListener("simkur-program-kerja-updated", refresh);
    };
  }, []);

  const activeTeachers = data.teachers.filter(isActive);
  const activeStudents = data.students.filter(isActive);

  const currentYear =
    data.rombels
      .filter((item) => isActive(item) && item.tahunAjaran)
      .map((item) => item.tahunAjaran)
      .sort((a, b) => String(b).localeCompare(String(a)))[0] ||
    data.programs.find((item) => item.tahunAjaran)?.tahunAjaran ||
    "2026/2027";

  const activeRombels = data.rombels.filter(
    (item) =>
      isActive(item) && item.tahunAjaran === currentYear
  );

  const activeRombelIds = new Set(
    activeRombels.map((item) => String(item.id))
  );

  const activeStudentIds = new Set(
    activeStudents.map((item) => String(item.id))
  );

  const currentPlacements = data.placements.filter(
    (item) =>
      item.tahunAjaran === currentYear &&
      activeRombelIds.has(String(item.rombelId)) &&
      activeStudentIds.has(String(item.siswaId))
  );

  const placedStudentIds = new Set(
    currentPlacements.map((item) => String(item.siswaId))
  );

  const unplacedStudents = Math.max(
    0,
    activeStudents.length - placedStudentIds.size
  );

  const activeAssignments = data.assignments.filter((assignment) => {
    if (!isActive(assignment)) return false;

    const teacher = data.teachers.find(
      (item) => String(item.id) === String(assignment.guruId)
    );

    const rombel = data.rombels.find(
      (item) => String(item.id) === String(assignment.rombelId)
    );

    const subject = data.subjects.find(
      (item) => String(item.id) === String(assignment.mapelId)
    );

    return (
      isActive(teacher) &&
      isActive(rombel) &&
      isActive(subject) &&
      rombel.tahunAjaran === currentYear
    );
  });

  const activeAssignmentIds = new Set(
    activeAssignments.map((item) => String(item.id))
  );

  const activeSchedules = data.schedules.filter(
    (item) =>
      item.status !== "Nonaktif" &&
      activeAssignmentIds.has(String(item.tugasMengajarId))
  );

  const weekJournals = data.journals.filter((item) => {
    const date = String(item.tanggal || "").slice(0, 10);

    return date >= week.start && date <= week.end;
  });

  const journalSummary = weekJournals.reduce(
    (result, journal) => {
      const scheduled = Math.max(
        0,
        safeNumber(journal.jpTerjadwal)
      );

      const actual = Math.min(
        scheduled,
        Math.max(0, safeNumber(journal.jpTerlaksana))
      );

      result.scheduledJP += scheduled;
      result.actualJP += actual;
      result.count += 1;

      if (journal.statusPelaksanaan === "Terlaksana") {
        result.done += 1;
      }

      if (journal.statusPelaksanaan === "Sebagian") {
        result.partial += 1;
      }

      if (journal.statusPelaksanaan === "Tidak Terlaksana") {
        result.missed += 1;
      }

      return result;
    },
    {
      scheduledJP: 0,
      actualJP: 0,
      count: 0,
      done: 0,
      partial: 0,
      missed: 0,
    }
  );

  const percentage = journalSummary.scheduledJP
    ? Math.round(
        (journalSummary.actualJP / journalSummary.scheduledJP) * 100
      )
    : 0;

  const activeDays =
    data.settings?.polaHari === "senin-sabtu"
      ? ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
      : ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  const kbmData = activeDays.map((day, index) => {
    const dayJournals = weekJournals.filter((journal) => {
      const [year, month, date] = String(journal.tanggal || "")
        .slice(0, 10)
        .split("-")
        .map(Number);

      const parsed = new Date(year, month - 1, date);

      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.getDay() === index + 1
      );
    });

    const scheduled = dayJournals.reduce(
      (sum, item) => sum + Math.max(0, safeNumber(item.jpTerjadwal)),
      0
    );

    const actual = dayJournals.reduce((sum, item) => {
      const target = Math.max(0, safeNumber(item.jpTerjadwal));

      return sum + Math.min(
        target,
        Math.max(0, safeNumber(item.jpTerlaksana))
      );
    }, 0);

    return {
      day: DAY_SHORT[day] || day,
      terjadwal: scheduled,
      terlaksana: actual,
    };
  });

  const journalStatusData = [
    {
      name: "Terlaksana",
      value: journalSummary.done,
      color: "#2878C8",
    },
    {
      name: "Sebagian",
      value: journalSummary.partial,
      color: "#F0A43A",
    },
    {
      name: "Tidak terlaksana",
      value: journalSummary.missed,
      color: "#D86B65",
    },
  ].filter((item) => item.value > 0);

  const chartData =
    journalStatusData.length > 0
      ? journalStatusData
      : [{ name: "Belum ada jurnal", value: 1, color: "#DCE5EF" }];

  const currentPrograms = data.programs.filter(
    (item) => item.tahunAjaran === currentYear
  );

  const programSummary = {
    total: currentPrograms.length,
    running: currentPrograms.filter(
      (item) => item.status === "Berjalan"
    ).length,
    completed: currentPrograms.filter(
      (item) => item.status === "Selesai"
    ).length,
    delayed: currentPrograms.filter(
      (item) => item.status === "Ditunda"
    ).length,
    average: currentPrograms.length
      ? Math.round(
          currentPrograms.reduce(
            (sum, item) => sum + safeNumber(item.progres),
            0
          ) / currentPrograms.length
        )
      : 0,
  };

  const agendaData = (Array.isArray(data.calendar) ? data.calendar : [])
    .filter((event) => {
      const date = getEventDate(event);
      return (
        event.status === "approved" &&
        date &&
        date >= week.today
      );
    })
    .sort((a, b) =>
      getEventDate(a).localeCompare(getEventDate(b))
    )
    .slice(0, 4)
    .map((event) => ({
      time: getEventTime(event),
      title: event.title || "Agenda sekolah",
      detail: `${formatDate(getEventDate(event))} · ${getEventDetail(event)}`,
      type: "blue",
    }));

  const attentionData = [];

  const followUpCount =
    journalSummary.partial + journalSummary.missed;

  if (followUpCount > 0) {
    attentionData.push({
      title: "Pelaksanaan KBM perlu diperhatikan",
      detail: `${journalSummary.partial} jurnal sebagian dan ${journalSummary.missed} jurnal tidak terlaksana.`,
      count: `${followUpCount} jurnal`,
      icon: ClipboardList,
      color: "orange",
    });
  }

  if (unplacedStudents > 0) {
    attentionData.push({
      title: "Penempatan siswa",
      detail: "Masih terdapat siswa aktif yang belum ditempatkan pada rombel.",
      count: `${unplacedStudents} siswa`,
      icon: GraduationCap,
      color: "blue",
    });
  }

  if (programSummary.delayed > 0) {
    attentionData.push({
      title: "Program kerja tertunda",
      detail: "Perlu perhatian terhadap kendala pelaksanaan program kurikulum.",
      count: `${programSummary.delayed} program`,
      icon: FileText,
      color: "purple",
    });
  }

  return (
    <div className="wakasek-dashboard">
      <section className="dashboard-welcome">
        <div className="welcome-copy">
          <span className="welcome-eyebrow">
            RINGKASAN PENGAWASAN SEKOLAH
          </span>

          <h2>Selamat Datang, Kepala Sekolah</h2>

          <p>
            Pantau kondisi akademik sekolah melalui ringkasan
            pelaksanaan pembelajaran, administrasi, dan program
            kerja kurikulum.
          </p>
        </div>

        <div className="welcome-period">
          <CalendarDays size={18} />
          <div>
            <span>TAHUN AJARAN AKTIF</span>
            <strong>{currentYear}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-stat-grid">
        <StatCard
          title="Total Guru"
          value={String(activeTeachers.length)}
          icon={Users}
          caption="Guru aktif"
          color="blue"
        />

        <StatCard
          title="Total Siswa"
          value={String(activeStudents.length)}
          icon={GraduationCap}
          caption="Siswa aktif"
          color="green"
        />

        <StatCard
          title="Rombongan Belajar"
          value={String(activeRombels.length)}
          icon={School}
          caption="Rombel aktif"
          color="purple"
        />

        <StatCard
          title="Realisasi KBM"
          value={
            journalSummary.scheduledJP > 0
              ? `${percentage}%`
              : "-"
          }
          icon={CalendarCheck}
          caption="Berdasarkan jurnal minggu ini"
          color="orange"
        />
      </section>

      <section className="dashboard-analytics-grid">
        <DonutChart
          title="Status Pelaksanaan KBM"
          subtitle="Ringkasan status jurnal minggu berjalan"
          centerValue={String(journalSummary.count)}
          centerLabel="Jurnal"
          data={chartData}
        />

        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Ringkasan Pelaksanaan KBM</h3>
              <p>JP terjadwal dan terlaksana berdasarkan jurnal guru</p>
            </div>

            <span className="analytics-period">Minggu ini</span>
          </div>

          <div className="kbm-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={kbmData}
                margin={{ top: 12, right: 8, left: -20, bottom: 3 }}
                barGap={5}
              >
                <CartesianGrid
                  stroke="#E8EEF5"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  tick={{ fill: "#68788C", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#68788C", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value, name) => [
                    `${value} JP`,
                    name === "terjadwal"
                      ? "JP Terjadwal dalam Jurnal"
                      : "JP Terlaksana",
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #D9E2EC",
                    fontSize: 11,
                  }}
                />

                <Bar
                  dataKey="terjadwal"
                  name="terjadwal"
                  fill="#DCE5EF"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={25}
                />

                <Bar
                  dataKey="terlaksana"
                  name="terlaksana"
                  fill="#2878C8"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={25}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-summary">
            <span>
              <i className="chart-dot blue-dot" />
              JP Terlaksana
            </span>

            <strong>
              {journalSummary.actualJP} dari {journalSummary.scheduledJP} JP
            </strong>
          </div>
        </section>
      </section>

      <section className="dashboard-bottom-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h3>Agenda Sekolah</h3>
              <p>Agenda kalender akademik yang telah disetujui</p>
            </div>

            <CalendarDays size={19} />
          </div>

          <div className="agenda-list">
            {agendaData.length === 0 ? (
              <div className="attention-information">
                <strong>Belum ada agenda mendatang</strong>
                <span>
                  Agenda yang disetujui akan ditampilkan di sini.
                </span>
              </div>
            ) : (
              agendaData.map((item, index) => (
                <div className="agenda-item" key={`${item.title}-${index}`}>
                  <div className="agenda-time">
                    <Clock3 size={13} />
                    <strong>{item.time}</strong>
                  </div>

                  <div className="agenda-marker">
                    <span className={`marker-${item.type}`} />
                  </div>

                  <div className="agenda-information">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h3>Perlu Perhatian</h3>
              <p>Ringkasan kondisi yang memerlukan tindak lanjut</p>
            </div>

            <CircleAlert size={19} />
          </div>

          <div className="attention-list">
            {attentionData.length === 0 ? (
              <div className="attention-information">
                <strong>Tidak ada temuan pada ringkasan ini</strong>
                <span>
                  Belum ditemukan jurnal bermasalah, siswa belum
                  ditempatkan, atau program kerja tertunda berdasarkan
                  data yang tersedia.
                </span>
              </div>
            ) : (
              attentionData.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div className="attention-item" key={`${item.title}-${index}`}>
                    <div className={`attention-icon ${item.color}`}>
                      <Icon size={19} />
                    </div>

                    <div className="attention-information">
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>

                    <span className="attention-count">{item.count}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="dashboard-panel quick-access-panel">
          <div className="panel-heading">
            <div>
              <h3>Ringkasan Kurikulum</h3>
              <p>Informasi umum pelaksanaan kurikulum</p>
            </div>

            <BookOpen size={19} />
          </div>

          <div className="quick-access-list">
            <div className="quick-access-item">
              <div className="quick-icon">
                <BookOpen size={18} />
              </div>

              <div>
                <strong>Penugasan Mengajar</strong>
                <span>{activeAssignments.length} penugasan aktif</span>
              </div>

              <ArrowUpRight size={17} />
            </div>

            <div className="quick-access-item">
              <div className="quick-icon">
                <CalendarCheck size={18} />
              </div>

              <div>
                <strong>Jadwal Pelajaran</strong>
                <span>{activeSchedules.length} slot jadwal aktif</span>
              </div>

              <ArrowUpRight size={17} />
            </div>

            <div className="quick-access-item">
              <div className="quick-icon">
                <ClipboardCheck size={18} />
              </div>

              <div>
                <strong>Program Kerja</strong>
                <span>
                  {programSummary.total} program · {programSummary.average}% rata-rata progres
                </span>
              </div>

              <ArrowUpRight size={17} />
            </div>
          </div>
        </section>
      </section>

      <div className="dashboard-update-info">
        <CheckCircle2 size={15} />
        <span>
          Dashboard menampilkan ringkasan data aktual SIMKUR.
          Rincian pengelolaan dan monitoring KBM tetap berada
          pada kewenangan Wakasek Kurikulum.
        </span>
      </div>
    </div>
  );
}

export default KepsekDashboard;
