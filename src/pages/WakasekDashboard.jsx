
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  School,
  CalendarCheck,
  ClipboardList,
  FileText,
  CalendarDays,
  Clock3,
  ArrowUpRight,
  CircleAlert,
  CheckCircle2,
  BookOpen,
  ClipboardCheck,
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
  settings: "simkur_pengaturan_jadwal",
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

function readDashboardData() {
  return {
    teachers: readArray(KEY.teachers),
    students: readArray(KEY.students),
    rombels: readArray(KEY.rombels),
    placements: readArray(KEY.placements),
    subjects: readArray(KEY.subjects),
    assignments: readArray(KEY.assignments),
    schedules: readArray(KEY.schedules),
    settings: readObject(KEY.settings),
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
    "Agenda kalender akademik"
  );
}

function getProgressPercentage(actual, scheduled) {
  if (!scheduled) return 0;
  return Math.round((actual / scheduled) * 100);
}

function WakasekDashboard() {
  const [data, setData] = useState(readDashboardData);

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

  const week = useMemo(() => getCurrentWeek(), []);

  const activeTeachers = useMemo(
    () => data.teachers.filter(isActive),
    [data.teachers]
  );

  const activeStudents = useMemo(
    () => data.students.filter(isActive),
    [data.students]
  );

  const currentYear =
    data.rombels
      .filter((item) => isActive(item) && item.tahunAjaran)
      .map((item) => item.tahunAjaran)
      .sort((a, b) => String(b).localeCompare(String(a)))[0] ||
    data.programs.find((item) => item.tahunAjaran)?.tahunAjaran ||
    "2026/2027";

  const activeRombels = useMemo(
    () =>
      data.rombels.filter(
        (item) => isActive(item) && item.tahunAjaran === currentYear
      ),
    [data.rombels, currentYear]
  );

  const activeRombelIds = useMemo(
    () => new Set(activeRombels.map((item) => String(item.id))),
    [activeRombels]
  );

  const activeStudentIds = useMemo(
    () => new Set(activeStudents.map((item) => String(item.id))),
    [activeStudents]
  );

  const currentPlacements = useMemo(
    () =>
      data.placements.filter(
        (item) =>
          item.tahunAjaran === currentYear &&
          activeRombelIds.has(String(item.rombelId)) &&
          activeStudentIds.has(String(item.siswaId))
      ),
    [data.placements, currentYear, activeRombelIds, activeStudentIds]
  );

  const unplacedStudents = Math.max(
    0,
    activeStudents.length -
      new Set(currentPlacements.map((item) => String(item.siswaId))).size
  );

  const activeAssignments = useMemo(
    () =>
      data.assignments.filter((assignment) => {
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
      }),
    [data.assignments, data.teachers, data.rombels, data.subjects, currentYear]
  );

  const activeAssignmentIds = useMemo(
    () => new Set(activeAssignments.map((item) => String(item.id))),
    [activeAssignments]
  );

  const activeSchedules = useMemo(
    () =>
      data.schedules.filter(
        (item) =>
          item.status !== "Nonaktif" &&
          activeAssignmentIds.has(String(item.tugasMengajarId))
      ),
    [data.schedules, activeAssignmentIds]
  );

  const weekJournals = useMemo(
    () =>
      data.journals.filter((item) => {
        const date = String(item.tanggal || "").slice(0, 10);
        return date >= week.start && date <= week.end;
      }),
    [data.journals, week]
  );

  const weeklySummary = useMemo(
    () =>
      weekJournals.reduce(
        (result, journal) => {
          const scheduled = Math.max(0, safeNumber(journal.jpTerjadwal));
          const actual = Math.min(
            scheduled,
            Math.max(0, safeNumber(journal.jpTerlaksana))
          );

          result.scheduledJP += scheduled;
          result.actualJP += actual;
          result.journalCount += 1;

          if (journal.statusPelaksanaan === "Terlaksana") result.done += 1;
          if (journal.statusPelaksanaan === "Sebagian") result.partial += 1;
          if (journal.statusPelaksanaan === "Tidak Terlaksana") result.missed += 1;

          return result;
        },
        {
          scheduledJP: 0,
          actualJP: 0,
          journalCount: 0,
          done: 0,
          partial: 0,
          missed: 0,
        }
      ),
    [weekJournals]
  );

  const realization = getProgressPercentage(
    weeklySummary.actualJP,
    weeklySummary.scheduledJP
  );

  const activeDays =
    data.settings?.polaHari === "senin-sabtu"
      ? ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
      : ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  const kbmData = useMemo(
    () =>
      activeDays.map((day, index) => {
        const weekdayNumber = index + 1;

        const dayJournals = weekJournals.filter((journal) => {
          const [year, month, date] = String(journal.tanggal || "")
            .slice(0, 10)
            .split("-")
            .map(Number);

          const parsed = new Date(year, month - 1, date);

          return (
            !Number.isNaN(parsed.getTime()) &&
            parsed.getDay() === weekdayNumber
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
      }),
    [activeDays, weekJournals]
  );

  const journalStatusData = [
    {
      name: "Terlaksana",
      value: weeklySummary.done,
      color: "#2878C8",
    },
    {
      name: "Sebagian",
      value: weeklySummary.partial,
      color: "#F0A43A",
    },
    {
      name: "Tidak terlaksana",
      value: weeklySummary.missed,
      color: "#D86B65",
    },
  ].filter((item) => item.value > 0);

  const currentPrograms = useMemo(
    () => data.programs.filter((item) => item.tahunAjaran === currentYear),
    [data.programs, currentYear]
  );

  const attentionData = useMemo(() => {
    const items = [];

    const followUpCount = weeklySummary.partial + weeklySummary.missed;

    if (followUpCount > 0) {
      items.push({
        title: "Jurnal KBM perlu ditindaklanjuti",
        detail: `${weeklySummary.partial} jurnal sebagian dan ${weeklySummary.missed} jurnal tidak terlaksana.`,
        count: `${followUpCount} jurnal`,
        icon: ClipboardList,
        color: "blue",
      });
    }

    if (unplacedStudents > 0) {
      items.push({
        title: "Penempatan siswa",
        detail: "Masih ada siswa aktif yang belum ditempatkan pada rombel tahun ajaran ini.",
        count: `${unplacedStudents} siswa`,
        icon: GraduationCap,
        color: "orange",
      });
    }

    const delayedPrograms = currentPrograms.filter(
      (item) => item.status === "Ditunda"
    ).length;

    if (delayedPrograms > 0) {
      items.push({
        title: "Program kerja ditunda",
        detail: "Periksa kendala dan tindak lanjut program kerja kurikulum.",
        count: `${delayedPrograms} program`,
        icon: FileText,
        color: "purple",
      });
    }

    return items;
  }, [weeklySummary, unplacedStudents, currentPrograms]);

  const agendaData = useMemo(() => {
    const nextWeek = new Date(`${week.today}T00:00:00`);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const limit = toDateKey(nextWeek);

    return (Array.isArray(data.calendar) ? data.calendar : [])
      .filter((event) => {
        const date = getEventDate(event);
        return event.status === "approved" &&
          date &&
          date >= week.today &&
          date <= limit;
      })
      .sort((a, b) => getEventDate(a).localeCompare(getEventDate(b)))
      .slice(0, 4)
      .map((event) => ({
        time: getEventTime(event),
        title: event.title || "Agenda sekolah",
        detail: `${formatDate(getEventDate(event))} · ${getEventDetail(event)}`,
        type:
          event.category === "libur_nasional" ||
          event.category === "libur_sekolah"
            ? "orange"
            : "blue",
      }));
  }, [data.calendar, week.today]);

  const subjectCount = data.subjects.filter(isActive).length;

  const programAverage = currentPrograms.length
    ? Math.round(
        currentPrograms.reduce(
          (sum, item) => sum + safeNumber(item.progres),
          0
        ) / currentPrograms.length
      )
    : 0;

  return (
    <div className="wakasek-dashboard">
      <section className="dashboard-welcome">
        <div className="welcome-copy">
          <span className="welcome-eyebrow">
            PUSAT MANAJEMEN KURIKULUM
          </span>

          <h2>Selamat Datang, Wakasek Kurikulum</h2>

          <p>
            Pantau kegiatan akademik dan administrasi pembelajaran
            berdasarkan data yang tercatat dalam SIMKUR.
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
          caption="Guru berstatus aktif"
          color="blue"
        />

        <StatCard
          title="Total Siswa"
          value={String(activeStudents.length)}
          icon={GraduationCap}
          caption="Siswa berstatus aktif"
          color="green"
        />

        <StatCard
          title="Rombongan Belajar"
          value={String(activeRombels.length)}
          icon={School}
          caption="Rombel aktif tercatat"
          color="purple"
        />

        <StatCard
          title="Realisasi KBM"
          value={weeklySummary.scheduledJP ? `${realization}%` : "-"}
          icon={CalendarCheck}
          caption="Dari JP pada jurnal minggu ini"
          color="orange"
        />
      </section>

      <section className="dashboard-analytics-grid">
        <DonutChart
          title="Status Jurnal Mengajar"
          subtitle="Status pelaksanaan dari jurnal minggu berjalan"
          centerValue={String(weeklySummary.journalCount)}
          centerLabel="Jurnal"
          data={journalStatusData}
        />

        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Rekap Pelaksanaan KBM</h3>
              <p>
                Perbandingan JP terjadwal dan terlaksana dari jurnal yang tersimpan
              </p>
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
                      ? "JP Terjadwal pada Jurnal"
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
              JP Terjadwal
            </span>

            <strong>
              {weeklySummary.actualJP} dari {weeklySummary.scheduledJP} JP terlaksana
            </strong>
          </div>
        </section>
      </section>

      <section className="dashboard-bottom-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h3>Agenda Kegiatan</h3>
              <p>Agenda kalender akademik yang telah disetujui, tujuh hari ke depan</p>
            </div>

            <CalendarDays size={19} />
          </div>

          <div className="agenda-list">
            {agendaData.length === 0 ? (
              <div className="attention-information">
                <strong>Belum ada agenda terdekat</strong>
                <span>
                  Agenda yang telah disetujui akan tampil di bagian ini.
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
              <h3>Perlu Tindak Lanjut</h3>
              <p>Temuan berdasarkan data yang sudah tercatat</p>
            </div>

            <CircleAlert size={19} />
          </div>

          <div className="attention-list">
            {attentionData.length === 0 ? (
              <div className="attention-information">
                <strong>Tidak ada temuan pada ringkasan ini</strong>
                <span>
                  Belum ditemukan jurnal bermasalah, siswa belum ditempatkan,
                  atau program kerja tertunda berdasarkan data yang tersedia.
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
              <p>Data modul yang aktif pada tahun ajaran berjalan</p>
            </div>

            <BookOpen size={19} />
          </div>

          <div className="quick-access-list">
            <div className="quick-access-item">
              <div className="quick-icon">
                <BookOpen size={18} />
              </div>

              <div>
                <strong>Mata Pelajaran</strong>
                <span>{subjectCount} mata pelajaran aktif</span>
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
                  {currentPrograms.length} program · rata-rata progres {programAverage}%
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
          Dashboard membaca data aktual dari penyimpanan lokal SIMKUR.
          Angka realisasi KBM dihitung dari jurnal yang sudah diisi,
          bukan dari seluruh JP jadwal yang belum tentu memiliki jurnal.
        </span>
      </div>
    </div>
  );
}

export default WakasekDashboard;
