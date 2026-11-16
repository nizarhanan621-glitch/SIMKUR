
import { useEffect, useMemo, useState } from "react";

import {
  loadAcademicCalendarEvents,
  saveAcademicCalendarEvents,
} from "../lib/calendarStorage";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Flag,
  CalendarCheck2,
  Plus,
  Info,
  CheckCircle2,
  X,
  Pencil,
} from "lucide-react";

import "../styles/KalenderAkademikPage.css";

/* ==========================================
   DATA ILUSTRASI
   ========================================== */

const initialEvents = [
  {
    id: 1,
    date: "2026-11-09",
    title: "Kegiatan Pembelajaran",
    category: "kbm",
    time: "07.00–13.00",
    location: "Seluruh ruang kelas",
  },
  {
    id: 2,
    date: "2026-11-12",
    title: "Rapat Evaluasi Akademik",
    category: "rapat",
    time: "13.00–15.00",
    location: "Ruang Guru",
  },
  {
    id: 3,
    date: "2026-11-16",
    title: "Pelaksanaan Asesmen",
    category: "asesmen",
    time: "07.00–10.00",
    location: "Ruang kelas",
  },
  {
    id: 4,
    date: "2026-11-20",
    title: "Monitoring Pembelajaran",
    category: "monitoring",
    time: "09.00–11.00",
    location: "Kelas VII–IX",
  },
  {
    id: 5,
    date: "2026-11-25",
    title: "Evaluasi Program Kurikulum",
    category: "rapat",
    time: "13.00–15.00",
    location: "Ruang Kurikulum",
  },
  {
    id: 6,
    date: "2026-11-30",
    title: "Evaluasi Bulanan KBM",
    category: "monitoring",
    time: "09.00–11.00",
    location: "Ruang Wakasek",
  },
];

const sampleEventIds = new Set(
  initialEvents.map((event) => event.id)
);

/* ==========================================
   KATEGORI AGENDA
   ========================================== */

const categories = [
  { id: "all", label: "Semua Agenda", color: "#2878C8" },
  { id: "kbm", label: "Pembelajaran", color: "#2878C8" },
  { id: "semester", label: "Awal/Akhir Semester", color: "#4776A8" },
  { id: "asesmen", label: "Asesmen", color: "#7657B8" },
  { id: "rapat", label: "Rapat", color: "#C17B19" },
  { id: "monitoring", label: "Monitoring", color: "#23845B" },
  { id: "libur_nasional", label: "Libur Nasional", color: "#D34B4B" },
  { id: "cuti_bersama", label: "Cuti Bersama", color: "#D17A45" },
  { id: "libur_sekolah", label: "Libur Sekolah", color: "#A45A9C" },
  { id: "libur_daerah", label: "Libur Daerah", color: "#8B6D45" },
  { id: "kegiatan_dinas", label: "Kegiatan Dinas", color: "#477F91" },
  { id: "kegiatan_sekolah", label: "Kegiatan Sekolah", color: "#39866A" },
  { id: "hari_penting", label: "Hari Penting Pendidikan", color: "#9673B8" },
  { id: "lainnya", label: "Lainnya", color: "#7B8490" },
];

/* ==========================================
   DATA KALENDER
   ========================================== */

const weekdays = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const dateKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function getCategory(category) {
  return categories.find((item) => item.id === category);
}

/* ==========================================
   STYLE MODAL EDIT AGENDA
   ========================================== */

const editLabelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#173B68",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1.4,
};

const editInputStyle = {
  display: "block",
  width: "100%",
  minHeight: "46px",
  padding: "12px 14px",
  border: "1px solid #C9D8E9",
  borderRadius: "9px",
  background: "#FFFFFF",
  color: "#1E293B",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: 1.5,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const editFieldStyle = {
  minWidth: 0,
  marginBottom: "18px",
};

const modalButtonStyle = {
  minHeight: "46px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "11px 20px",
  borderRadius: "9px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

/* ==========================================
   HALAMAN KALENDER AKADEMIK
   ========================================== */

function KalenderAkademikPage() {
  const [currentDate, setCurrentDate] = useState(
    new Date(2026, 10, 1)
  );

  const [selectedDate, setSelectedDate] = useState(
    "2026-11-09"
  );

  const [activeFilter, setActiveFilter] = useState("all");

  const [events, setEvents] = useState(() => {
    const savedEvents = loadAcademicCalendarEvents();
    return [...initialEvents, ...savedEvents];
  });

  const [editingEventId, setEditingEventId] = useState(null);
  const [focusedEventId, setFocusedEventId] = useState(null);

  const [editForm, setEditForm] = useState({
    title: "",
    date: "",
    category: "lainnya",
    time: "",
    location: "",
    description: "",
  });

  const editingEvent = events.find(
    (event) => String(event.id) === String(editingEventId)
  );

  /* ==========================================
     KUNCI SCROLL SAAT MODAL TERBUKA
     ========================================== */

  useEffect(() => {
    if (editingEventId === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editingEventId]);

  /* ==========================================
     TUTUP MODAL DENGAN TOMBOL ESC
     ========================================== */

  useEffect(() => {
    if (editingEventId === null) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        handleCancelEdit();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [editingEventId]);

  /* ==========================================
     BUKA AGENDA DARI NOTIFIKASI
     ========================================== */

  useEffect(() => {
  const openTargetEvent = () => {
    const targetEventId = localStorage.getItem(
      "simkur_open_calendar_event_id"
    );

    if (!targetEventId) return;

    // Baca ulang data terbaru dari penyimpanan.
    const latestEvents = [
      ...initialEvents,
      ...loadAcademicCalendarEvents(),
    ];

    const targetEvent = latestEvents.find(
      (event) =>
        String(event.id) === String(targetEventId)
    );

    localStorage.removeItem(
      "simkur_open_calendar_event_id"
    );

    if (!targetEvent) {
      alert(
        "Agenda yang dipilih tidak ditemukan. Data mungkin sudah berubah."
      );
      return;
    }

    const targetDate =
      targetEvent.date || targetEvent.startDate;

    if (!targetDate) {
      alert("Tanggal agenda tidak ditemukan.");
      return;
    }

    const [targetYear, targetMonth] = targetDate
      .split("-")
      .map(Number);

    setEvents(latestEvents);

    setCurrentDate(
      new Date(targetYear, targetMonth - 1, 1)
    );

    setSelectedDate(targetDate);
    setActiveFilter("all");
    setFocusedEventId(targetEvent.id);
  };

  // Periksa ketika halaman pertama kali dibuka.
  openTargetEvent();

  // Periksa kembali ketika notifikasi diklik saat
  // halaman Kalender Akademik sudah terbuka.
  window.addEventListener(
    "simkur-open-calendar-event",
    openTargetEvent
  );

  return () => {
    window.removeEventListener(
      "simkur-open-calendar-event",
      openTargetEvent
    );
  };
}, []);

  /* ==========================================
     PENGAJUAN PERSETUJUAN KEPALA SEKOLAH
     ========================================== */

  const handleApproveEvent = (eventId) => {
    const eventToApprove = events.find(
      (event) => event.id === eventId
    );

    if (!eventToApprove || !eventToApprove.referenceId) {
      alert(
        "Agenda ini bukan kegiatan dari Referensi Kalender Pendidikan."
      );
      return;
    }

    if (eventToApprove.status !== "draft") {
      alert("Agenda ini tidak berstatus Draft.");
      return;
    }

    const confirmed = window.confirm(
      `Ajukan agenda "${eventToApprove.title}" kepada Kepala Sekolah untuk mendapatkan persetujuan?`
    );

    if (!confirmed) return;

    const updatedEvents = events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            status: "pending_head_approval",
            submittedToHeadAt: new Date().toISOString(),
          }
        : event
    );

    const saved = saveAcademicCalendarEvents(
      updatedEvents.filter(
        (event) => !sampleEventIds.has(event.id)
      )
    );

    if (!saved) {
      alert("Gagal menyimpan pengajuan agenda.");
      return;
    }

    setEvents(updatedEvents);

    alert(
      "Agenda berhasil diajukan kepada Kepala Sekolah untuk mendapatkan persetujuan."
    );
  };

  /* ==========================================
     EDIT AGENDA YANG DITOLAK
     ========================================== */

  const handleEditEvent = (event) => {
    setEditingEventId(event.id);

    setEditForm({
      title: event.title || "",
      date: event.date || event.startDate || "",
      category: event.category || "lainnya",
      time: event.time || "",
      location: event.location || "",
      description: event.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);

    setEditForm({
      title: "",
      date: "",
      category: "lainnya",
      time: "",
      location: "",
      description: "",
    });
  };

  /* ==========================================
     SIMPAN PERUBAHAN AGENDA
     ========================================== */

  const handleSaveEdit = (eventId) => {
    if (!editForm.title.trim()) {
      alert("Judul agenda wajib diisi.");
      return;
    }

    if (!editForm.date) {
      alert("Tanggal agenda wajib diisi.");
      return;
    }

    const confirmed = window.confirm(
      "Simpan perubahan agenda ini?"
    );

    if (!confirmed) return;

    const updatedEvents = events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            title: editForm.title.trim(),
            date: editForm.date,
            category: editForm.category,
            time: editForm.time.trim(),
            location: editForm.location.trim(),
            description: editForm.description.trim(),
            status: "rejected_by_head",
            editedAfterRejectionAt: new Date().toISOString(),
          }
        : event
    );

    const saved = saveAcademicCalendarEvents(
      updatedEvents.filter(
        (event) => !sampleEventIds.has(event.id)
      )
    );

    if (!saved) {
      alert("Gagal menyimpan perubahan agenda.");
      return;
    }

    setEvents(updatedEvents);
    setSelectedDate(editForm.date);

    setCurrentDate(
      new Date(
        Number(editForm.date.slice(0, 4)),
        Number(editForm.date.slice(5, 7)) - 1,
        1
      )
    );

    setFocusedEventId(eventId);
    setEditingEventId(null);

    alert(
      "Perubahan agenda berhasil disimpan. Silakan ajukan kembali kepada Kepala Sekolah."
    );
  };

  /* ==========================================
     AJUKAN ULANG AGENDA
     ========================================== */

  const handleResubmitEvent = (eventId) => {
    const eventToSubmit = events.find(
      (event) => event.id === eventId
    );

    if (
      !eventToSubmit ||
      eventToSubmit.status !== "rejected_by_head"
    ) {
      alert("Agenda tidak dapat diajukan ulang.");
      return;
    }

    const confirmed = window.confirm(
      `Ajukan ulang agenda "${eventToSubmit.title}" kepada Kepala Sekolah?`
    );

    if (!confirmed) return;

    const existingHistory =
      eventToSubmit.headDecisionHistory || [];

    const alreadyRecorded = existingHistory.some(
      (history) =>
        history.decidedAt === eventToSubmit.headDecisionAt
    );

    const previousHistory =
      eventToSubmit.headDecisionAt && !alreadyRecorded
        ? [
            ...existingHistory,
            {
              decision: "rejected_by_head",
              decidedAt: eventToSubmit.headDecisionAt,
              reason: eventToSubmit.headRejectionReason || "",
            },
          ]
        : existingHistory;

    const updatedEvents = events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            status: "pending_head_approval",
            submittedToHeadAt: new Date().toISOString(),
            headDecisionHistory: previousHistory,
            headDecisionAt: "",
            headRejectionReason: "",
          }
        : event
    );

    const saved = saveAcademicCalendarEvents(
      updatedEvents.filter(
        (event) => !sampleEventIds.has(event.id)
      )
    );

    if (!saved) {
      alert("Gagal mengajukan ulang agenda.");
      return;
    }

    setEvents(updatedEvents);

    alert(
      "Agenda berhasil diajukan ulang kepada Kepala Sekolah."
    );
  };

  /* ==========================================
     PERIODE KALENDER
     ========================================== */

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7;

    return [
      ...Array(offset).fill(null),
      ...Array.from(
        { length: totalDays },
        (_, index) => index + 1
      ),
    ];
  }, [year, month]);

  /* ==========================================
     FILTER AGENDA
     ========================================== */

  const monthEvents = events.filter((event) => {
    const eventDate = new Date(
      `${event.date || event.startDate}T00:00:00`
    );

    return (
      eventDate.getFullYear() === year &&
      eventDate.getMonth() === month
    );
  });

  const selectedEvents = monthEvents
    .filter(
      (event) =>
        (event.date || event.startDate) === selectedDate &&
        (activeFilter === "all" ||
          event.category === activeFilter)
    )
    .sort((a, b) => {
      if (String(a.id) === String(focusedEventId)) return -1;
      if (String(b.id) === String(focusedEventId)) return 1;
      return 0;
    });

  const filteredMonthEvents = monthEvents.filter(
    (event) =>
      activeFilter === "all" ||
      event.category === activeFilter
  );

  /* ==========================================
     NAVIGASI KALENDER
     ========================================== */

  const changeMonth = (direction) => {
    setCurrentDate(
      new Date(year, month + direction, 1)
    );

    setFocusedEventId(null);
  };

  const goToToday = () => {
    const today = new Date();

    setCurrentDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    setSelectedDate(
      dateKey(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
    );

    setFocusedEventId(null);
  };

  /* ==========================================
     TAMPILAN
     ========================================== */

  return (
    <div className="academic-calendar-page">

      {/* HEADER HALAMAN */}
      <section className="academic-calendar-heading">
        <div>
          <div className="academic-calendar-breadcrumb">
            MANAJEMEN KURIKULUM
            <ChevronRight size={13} />
            KALENDER AKADEMIK
          </div>

          <h2>Kalender Akademik</h2>

          <p>
            Rencanakan dan pantau seluruh kegiatan akademik sekolah
            dalam satu kalender terpadu.
          </p>
        </div>

        <div className="calendar-heading-actions">
          <button
            className="calendar-secondary-button"
            onClick={goToToday}
          >
            <CalendarDays size={16} />
            Hari Ini
          </button>

          <span className="calendar-development-label">
            <Plus size={15} />
            Pengelolaan agenda tahap berikutnya
          </span>
        </div>
      </section>

      {/* RINGKASAN */}
      <section className="calendar-summary-grid">
        <article className="calendar-summary-card">
          <div className="calendar-summary-icon blue">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>Agenda Bulan Ini</span>
            <strong>{monthEvents.length}</strong>
            <small>Seluruh kategori</small>
          </div>
        </article>

        <article className="calendar-summary-card">
          <div className="calendar-summary-icon purple">
            <ClipboardList size={21} />
          </div>
          <div>
            <span>Agenda Asesmen</span>
            <strong>
              {monthEvents.filter(
                (event) => event.category === "asesmen"
              ).length}
            </strong>
            <small>Kegiatan penilaian</small>
          </div>
        </article>

        <article className="calendar-summary-card">
          <div className="calendar-summary-icon green">
            <GraduationCap size={21} />
          </div>
          <div>
            <span>Kegiatan Pembelajaran</span>
            <strong>
              {monthEvents.filter(
                (event) => event.category === "kbm"
              ).length}
            </strong>
            <small>Agenda KBM</small>
          </div>
        </article>

        <article className="calendar-summary-card">
          <div className="calendar-summary-icon orange">
            <Flag size={21} />
          </div>
          <div>
            <span>Rapat dan Monitoring</span>
            <strong>
              {monthEvents.filter(
                (event) =>
                  event.category === "rapat" ||
                  event.category === "monitoring"
              ).length}
            </strong>
            <small>Kegiatan koordinasi</small>
          </div>
        </article>
      </section>

      {/* INFORMASI PERIODE */}
      <section className="calendar-period-banner">
        <div className="calendar-period-left">
          <div className="calendar-period-icon">
            <BookOpen size={23} />
          </div>
          <div>
            <span>KALENDER PENDIDIKAN</span>
            <strong>Tahun Ajaran 2026/2027</strong>
            <small>Semester Ganjil · Jenjang SMP</small>
          </div>
        </div>

        <div className="calendar-period-status">
          <span />
          Data contoh dan referensi
        </div>
      </section>

      {/* WORKSPACE KALENDER */}
      <section className="calendar-workspace">

        {/* KALENDER UTAMA */}
        <div className="calendar-main-panel">
          <div className="calendar-panel-heading">
            <div>
              <h3>Agenda Akademik Sekolah</h3>
              <p>Pilih tanggal untuk melihat detail kegiatan.</p>
            </div>

            <div className="calendar-navigation">
              <button
                onClick={() => changeMonth(-1)}
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>

              <strong>
                {monthNames[month]} {year}
              </strong>

              <button
                onClick={() => changeMonth(1)}
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* FILTER KATEGORI */}
          <div className="calendar-filters">
            {categories.map((category) => (
              <button
                key={category.id}
                className={
                  activeFilter === category.id ? "active" : ""
                }
                onClick={() => {
                  setActiveFilter(category.id);
                  setFocusedEventId(null);
                }}
              >
                {category.id !== "all" && (
                  <span
                    className="calendar-filter-dot"
                    style={{
                      backgroundColor: category.color,
                    }}
                  />
                )}
                {category.label}
              </button>
            ))}
          </div>

          {/* GRID HARI */}
          <div className="calendar-grid">
            {weekdays.map((day) => (
              <div className="calendar-weekday" key={day}>
                {day}
              </div>
            ))}

            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    className="calendar-empty-day"
                    key={`empty-${index}`}
                  />
                );
              }

              const key = dateKey(year, month, day);

              const dayEvents = monthEvents.filter(
                (event) =>
                  (event.date || event.startDate) === key &&
                  (activeFilter === "all" ||
                    event.category === activeFilter)
              );

              const active = selectedDate === key;

              return (
                <button
                  key={key}
                  className={`calendar-day ${
                    active ? "selected" : ""
                  } ${dayEvents.length ? "has-events" : ""}`}
                  onClick={() => {
                    setSelectedDate(key);
                    setFocusedEventId(null);
                  }}
                >
                  <span className="calendar-day-number">
                    {day}
                  </span>

                  {dayEvents.length > 0 && (
                    <div className="calendar-day-events">
                      {dayEvents.slice(0, 2).map((event) => {
                        const category = getCategory(event.category);

                        return (
                          <span
                            key={event.id}
                            className="calendar-event-marker"
                            style={{
                              backgroundColor: category?.color,
                            }}
                          >
                            {event.title}
                          </span>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <small>
                          +{dayEvents.length - 2} lainnya
                        </small>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* LEGENDA */}
          <div className="calendar-legend">
            {categories
              .filter((category) => category.id !== "all")
              .map((category) => (
                <span key={category.id}>
                  <i
                    style={{
                      backgroundColor: category.color,
                    }}
                  />
                  {category.label}
                </span>
              ))}
          </div>
        </div>

        {/* PANEL AGENDA SAMPING */}
        <aside className="calendar-agenda-panel">
          <div className="calendar-agenda-heading">
            <div>
              <span>AGENDA TERPILIH</span>
              <h3>
                {Number(selectedDate.slice(8, 10))}{" "}
                {monthNames[
                  Number(selectedDate.slice(5, 7)) - 1
                ]}{" "}
                {selectedDate.slice(0, 4)}
              </h3>
            </div>

            <div className="calendar-agenda-heading-icon">
              <CalendarCheck2 size={20} />
            </div>
          </div>

          {selectedEvents.length > 0 ? (
            <div className="calendar-selected-events">
              {selectedEvents.map((event) => {
                const category = getCategory(event.category);
                const isFocused =
                  String(event.id) === String(focusedEventId);

                return (
                  <article
                    className="calendar-selected-event"
                    key={event.id}
                    style={
                      isFocused
                        ? {
                            border: "2px solid #2878C8",
                            boxShadow:
                              "0 4px 16px rgba(40,120,200,0.12)",
                            padding: "13px",
                            borderRadius: "10px",
                          }
                        : {}
                    }
                  >
                    {isFocused && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          marginBottom: "9px",
                          padding: "5px 9px",
                          borderRadius: "20px",
                          background: "#EAF2FA",
                          color: "#173B68",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Agenda yang dipilih dari notifikasi
                      </div>
                    )}

                    <span
                      className="calendar-event-category"
                      style={{ color: category?.color }}
                    >
                      {category?.label || "Agenda"}
                    </span>

                    {/* STATUS DRAFT */}
                    {event.status === "draft" && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "7px",
                          padding: "5px 9px",
                          borderRadius: "20px",
                          background: "#FFF3D6",
                          color: "#A66A00",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        DRAFT · MENUNGGU PERSETUJUAN WAKASEK
                      </span>
                    )}

                    {/* MENUNGGU PERSETUJUAN KEPALA SEKOLAH */}
                    {event.status === "pending_head_approval" && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "7px",
                          padding: "5px 9px",
                          borderRadius: "20px",
                          background: "#E8F0FF",
                          color: "#245DA8",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        MENUNGGU PERSETUJUAN KEPALA SEKOLAH
                      </span>
                    )}

                    {/* DISETUJUI */}
                    {event.status === "approved" && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "7px",
                          padding: "5px 9px",
                          borderRadius: "20px",
                          background: "#E3F5EA",
                          color: "#23845B",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        DISETUJUI KEPALA SEKOLAH
                      </span>
                    )}

                    {/* DITOLAK */}
                    {event.status === "rejected_by_head" && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "7px",
                          padding: "5px 9px",
                          borderRadius: "20px",
                          background: "#FCE8E8",
                          color: "#B42318",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        DITOLAK KEPALA SEKOLAH
                      </span>
                    )}

                    <h4>{event.title}</h4>

                    <div>
                      <Clock3 size={14} />
                      {event.time || "Sepanjang hari"}
                    </div>

                    <div>
                      <MapPin size={14} />
                      {event.location || "Belum ditentukan"}
                    </div>

                    {/* HASIL KEPUTUSAN KEPALA SEKOLAH */}
                    {(event.status === "approved" ||
                      event.status === "rejected_by_head") && (
                      <div
                        style={{
                          marginTop: "13px",
                          padding: "13px",
                          borderRadius: "9px",
                          background:
                            event.status === "approved"
                              ? "#E3F5EA"
                              : "#FCE8E8",
                          border: `1px solid ${
                            event.status === "approved"
                              ? "#B9E5C9"
                              : "#F0C5C5"
                          }`,
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            color:
                              event.status === "approved"
                                ? "#23845B"
                                : "#B42318",
                            fontSize: "12px",
                            marginBottom: "7px",
                          }}
                        >
                          {event.status === "approved"
                            ? "✓ DISETUJUI KEPALA SEKOLAH"
                            : "✕ DITOLAK KEPALA SEKOLAH"}
                        </strong>

                        {event.headDecisionAt && (
                          <div
                            style={{
                              color: "#68788C",
                              fontSize: "12px",
                            }}
                          >
                            Tanggal keputusan:{" "}
                            {new Date(
                              event.headDecisionAt
                            ).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}

                        {event.headRejectionReason && (
                          <div
                            style={{
                              marginTop: "8px",
                              color: "#8F2929",
                              fontSize: "13px",
                              lineHeight: 1.6,
                            }}
                          >
                            <strong>Alasan penolakan:</strong>
                            <p style={{ margin: "5px 0 0" }}>
                              {event.headRejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* RIWAYAT KEPUTUSAN SEBELUMNYA */}
                    {(event.headDecisionHistory || []).filter(
                      (history) =>
                        history.decidedAt !== event.headDecisionAt
                    ).length > 0 && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "13px",
                          border: "1px solid #DCE4ED",
                          borderRadius: "9px",
                          background: "#F8FAFC",
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            color: "#173B68",
                            fontSize: "13px",
                            marginBottom: "9px",
                          }}
                        >
                          Riwayat Keputusan Sebelumnya
                        </strong>

                        {(event.headDecisionHistory || [])
                          .filter(
                            (history) =>
                              history.decidedAt !==
                              event.headDecisionAt
                          )
                          .map((history, index) => (
                            <div
                              key={`${event.id}-previous-${index}`}
                              style={{
                                padding: "10px",
                                marginTop: "7px",
                                borderRadius: "8px",
                                background:
                                  history.decision === "approved"
                                    ? "#E3F5EA"
                                    : "#FCE8E8",
                              }}
                            >
                              <strong
                                style={{
                                  color:
                                    history.decision === "approved"
                                      ? "#23845B"
                                      : "#B42318",
                                  fontSize: "11px",
                                }}
                              >
                                {history.decision === "approved"
                                  ? "DISETUJUI"
                                  : "DITOLAK"}
                              </strong>

                              <div
                                style={{
                                  color: "#68788C",
                                  fontSize: "11px",
                                  marginTop: "5px",
                                }}
                              >
                                {history.decidedAt
                                  ? new Date(
                                      history.decidedAt
                                    ).toLocaleString("id-ID")
                                  : "Waktu tidak tersedia"}
                              </div>

                              {history.reason && (
                                <p
                                  style={{
                                    color: "#8F2929",
                                    fontSize: "12px",
                                    margin: "6px 0 0",
                                    lineHeight: 1.5,
                                  }}
                                >
                                  Alasan: {history.reason}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {/* TOMBOL EDIT AGENDA */}
                    {event.status === "rejected_by_head" && (
                      <button
                        type="button"
                        onClick={() => handleEditEvent(event)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "7px",
                          width: "100%",
                          marginTop: "14px",
                          padding: "11px",
                          border: "1px solid #2878C8",
                          borderRadius: "8px",
                          background: "#EAF2FA",
                          color: "#173B68",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={15} />
                        Edit Agenda
                      </button>
                    )}

                    {/* TOMBOL AJUKAN ULANG */}
                    {event.status === "rejected_by_head" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleResubmitEvent(event.id)
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "7px",
                          width: "100%",
                          marginTop: "8px",
                          padding: "11px",
                          border: "none",
                          borderRadius: "8px",
                          background: "#23845B",
                          color: "#FFFFFF",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <CheckCircle2 size={16} />
                        Ajukan Ulang ke Kepala Sekolah
                      </button>
                    )}

                    {/* TOMBOL PENGAJUAN KE KEPALA SEKOLAH */}
                    {event.status === "draft" &&
                      event.referenceId && (
                        <button
                          type="button"
                          onClick={() =>
                            handleApproveEvent(event.id)
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "7px",
                            width: "100%",
                            marginTop: "14px",
                            padding: "11px 14px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#23845B",
                            color: "#FFFFFF",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <CheckCircle2 size={16} />
                          Setujui & Ajukan ke Kepala Sekolah
                        </button>
                      )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="calendar-no-events">
              <CalendarDays size={31} />
              <strong>Tidak ada agenda</strong>
              <span>
                Belum ada kegiatan pada tanggal ini
                untuk filter yang dipilih.
              </span>
            </div>
          )}

          <div className="calendar-agenda-footer">
            <strong>Agenda bulan ini</strong>
            <span>
              {filteredMonthEvents.length} kegiatan terdaftar
            </span>
          </div>
        </aside>
      </section>

      {/* CATATAN */}
      <div className="calendar-information-note">
        <Info size={15} />
        <span>
          Agenda dari Referensi Kalender Pendidikan disimpan sebagai
          Draft untuk diperiksa Wakasek Kurikulum. Setelah diajukan,
          agenda menunggu persetujuan Kepala Sekolah sebelum dapat
          dipublikasikan. Penyimpanan saat ini masih menggunakan
          localStorage.
        </span>
      </div>

      {/* ==========================================
          MODAL EDIT AGENDA - TENGAH LAYAR
          ========================================== */}

      {editingEvent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelEdit();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(15, 30, 50, 0.58)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-agenda-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "760px",
              maxHeight: "calc(100vh - 48px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "16px",
              background: "#FFFFFF",
              boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
              animation: "simkurModalAppear 0.2s ease-out",
            }}
          >
            {/* HEADER MODAL */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                padding: "20px 25px",
                background:
                  "linear-gradient(120deg, #173B68, #2878C8)",
                color: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  minWidth: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.16)",
                }}
              >
                <Pencil size={25} />
              </div>

              <div style={{ flex: 1 }}>
                <h2
                  id="edit-agenda-title"
                  style={{
                    margin: 0,
                    color: "#FFFFFF",
                    fontSize: "21px",
                    fontWeight: 800,
                    lineHeight: 1.35,
                  }}
                >
                  Edit Agenda
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#E5F0FF",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  Perbaiki informasi agenda sesuai catatan dari
                  Kepala Sekolah.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelEdit}
                aria-label="Tutup modal"
                style={{
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  borderRadius: "9px",
                  background: "rgba(255,255,255,0.14)",
                  color: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* ISI MODAL */}
            <div
              style={{
                padding: "24px 28px 10px",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {/* CATATAN PENOLAKAN */}
              {editingEvent.headRejectionReason && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    marginBottom: "23px",
                    padding: "15px 17px",
                    border: "1px solid #F2BFC0",
                    borderLeft: "4px solid #C83E3E",
                    borderRadius: "10px",
                    background: "#FFF1F1",
                  }}
                >
                  <div
                    style={{
                      width: "25px",
                      height: "25px",
                      minWidth: "25px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      background: "#C83E3E",
                      color: "#FFFFFF",
                      fontWeight: 800,
                      fontSize: "15px",
                    }}
                  >
                    !
                  </div>

                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#A52B2B",
                        fontSize: "14px",
                        marginBottom: "5px",
                      }}
                    >
                      Catatan dari Kepala Sekolah:
                    </strong>
                    <p
                      style={{
                        margin: 0,
                        color: "#713333",
                        fontSize: "14px",
                        lineHeight: 1.65,
                      }}
                    >
                      {editingEvent.headRejectionReason}
                    </p>
                  </div>
                </div>
              )}

              {/* FORM ISIAN */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  columnGap: "22px",
                  rowGap: "0",
                }}
              >
                <div
                  style={{
                    ...editFieldStyle,
                    gridColumn: "1 / -1",
                  }}
                >
                  <label style={editLabelStyle}>
                    Judul Agenda
                    <span style={{ color: "#DC2626" }}> *</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="Masukkan judul kegiatan"
                    style={editInputStyle}
                    autoFocus
                  />
                </div>

                <div style={editFieldStyle}>
                  <label style={editLabelStyle}>
                    Tanggal Kegiatan
                    <span style={{ color: "#DC2626" }}> *</span>
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        date: e.target.value,
                      })
                    }
                    style={editInputStyle}
                  />
                </div>

                <div style={editFieldStyle}>
                  <label style={editLabelStyle}>
                    Kategori Agenda
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        category: e.target.value,
                      })
                    }
                    style={editInputStyle}
                  >
                    {categories
                      .filter((item) => item.id !== "all")
                      .map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div style={editFieldStyle}>
                  <label style={editLabelStyle}>
                    Waktu Kegiatan
                  </label>
                  <input
                    type="text"
                    value={editForm.time}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        time: e.target.value,
                      })
                    }
                    placeholder="Contoh: 07.00–10.00"
                    style={editInputStyle}
                  />
                </div>

                <div style={editFieldStyle}>
                  <label style={editLabelStyle}>
                    Lokasi Kegiatan
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        location: e.target.value,
                      })
                    }
                    placeholder="Contoh: Ruang Guru"
                    style={editInputStyle}
                  />
                </div>

                <div
                  style={{
                    ...editFieldStyle,
                    gridColumn: "1 / -1",
                  }}
                >
                  <label style={editLabelStyle}>
                    Deskripsi dan Keterangan
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Tuliskan penjelasan atau keterangan tambahan mengenai agenda..."
                    style={{
                      ...editInputStyle,
                      minHeight: "105px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              {/* INFORMASI SETELAH EDIT */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "13px 15px",
                  marginBottom: "17px",
                  border: "1px solid #BBD7F5",
                  borderRadius: "9px",
                  background: "#EDF6FF",
                  color: "#245A91",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                <Info
                  size={18}
                  style={{ minWidth: "18px", marginTop: "1px" }}
                />
                <span>
                  Setelah perubahan disimpan, agenda tetap berstatus
                  ditolak sampai Wakasek mengajukan ulang agenda ini
                  kepada Kepala Sekolah.
                </span>
              </div>
            </div>

            {/* FOOTER MODAL */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                flexWrap: "wrap",
                gap: "11px",
                padding: "16px 28px 20px",
                borderTop: "1px solid #E2E8F0",
                background: "#F8FAFC",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  ...modalButtonStyle,
                  minWidth: "125px",
                  border: "1px solid #B8C7D9",
                  background: "#FFFFFF",
                  color: "#475569",
                }}
              >
                <X size={18} />
                Batal
              </button>

              <button
                type="button"
                onClick={() => handleSaveEdit(editingEvent.id)}
                style={{
                  ...modalButtonStyle,
                  minWidth: "190px",
                  border: "none",
                  background:
                    "linear-gradient(120deg, #16834F, #229E64)",
                  color: "#FFFFFF",
                  boxShadow: "0 3px 9px rgba(22,131,79,0.18)",
                }}
              >
                <CheckCircle2 size={19} />
                Simpan Perubahan
              </button>
            </div>
          </div>

          {/* RESPONSIVE MODAL */}
          <style>
            {`
              @keyframes simkurModalAppear {
                from {
                  opacity: 0;
                  transform: translateY(12px) scale(0.98);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }

              @media (max-width: 600px) {
                .academic-calendar-page .simkur-edit-modal-grid {
                  grid-template-columns: 1fr;
                }
              }
            `}
          </style>
        </div>
      )}
    </div>
  );
}

export default KalenderAkademikPage;
