
import "../styles/MainLayout.css";
import { useEffect, useState } from "react";
import {
  School,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  ChartNoAxesCombined,
  FileChartColumn,
  FileText,
  ShieldCheck,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  CircleHelp,
  UserRound,
  BriefcaseBusiness,
  ClipboardPenLine,
  BookMarked,
  CheckSquare,
  FolderOpen,
  LogOut,
} from "lucide-react";

import { loadAcademicCalendarEvents } from "../lib/calendarStorage";
import UpdateManager from "./UpdateManager";

const roleMenus = {
  superadmin: [
    {
      title: "MENU UTAMA",
      items: [
        { label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "MANAJEMEN SISTEM",
      items: [
        { label: "Manajemen Akun", icon: Users },
      ],
    },
  ],

  wakasek: [
    {
      title: "MENU UTAMA",
      items: [
        { label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "DATA SEKOLAH",
      items: [
        { label: "Data Sekolah", icon: School },
        { label: "Data Guru", icon: Users },
        { label: "Data Siswa", icon: GraduationCap },
        { label: "Daftar Siswa Keluar", icon: GraduationCap },
        { label: "Penempatan Siswa", icon: GraduationCap },
        { label: "Rombongan Belajar", icon: School },
        { label: "Mata Pelajaran", icon: BookOpen },
        { label: "Kurikulum Sekolah", icon: BookOpen },
      ],
    },
    {
      title: "MANAJEMEN PENGGUNA",
      items: [
        { label: "Manajemen Akun Pengguna", icon: Users },
      ],
    },
    {
      title: "MANAJEMEN KURIKULUM",
      items: [
        { label: "Kurikulum", icon: BookOpen },
        { label: "Kalender Akademik", icon: CalendarDays },
        { label: "Referensi Kalender Pendidikan", icon: CalendarDays },
        { label: "Tugas Mengajar", icon: BriefcaseBusiness },
        { label: "Jadwal Pelajaran", icon: CalendarClock },
        { label: "Administrasi Guru", icon: FileText },
      ],
    },
    {
      title: "MONITORING & EVALUASI",
      items: [
        { label: "Monitoring KBM", icon: ChartNoAxesCombined },
        { label: "Supervisi", icon: ShieldCheck },
        { label: "Program Kerja", icon: ClipboardList },
        { label: "Laporan", icon: FileChartColumn },
      ],
    },
  ],

  kepsek: [
    {
      title: "MENU UTAMA",
      items: [
        { label: "Dashboard", icon: LayoutDashboard },
        { label: "Ringkasan Sekolah", icon: School },
        { label: "Persetujuan", icon: CheckSquare },
      ],
    },
    {
      title: "PENGAWASAN",
      items: [
        { label: "Supervisi", icon: ShieldCheck },
        { label: "Laporan", icon: FileChartColumn },
        { label: "Arsip Dokumen", icon: FolderOpen },
      ],
    },
  ],

  guru: [
    {
      title: "MENU UTAMA",
      items: [
        { label: "Dashboard", icon: LayoutDashboard },
        { label: "Jadwal Saya", icon: CalendarClock },
        { label: "Jurnal Mengajar", icon: ClipboardPenLine },
      ],
    },
    {
      title: "PEMBELAJARAN",
      items: [
        { label: "Administrasi Pembelajaran", icon: BookMarked },
        { label: "Supervisi", icon: ShieldCheck },
      ],
    },
  ],
};

const roleDescriptions = {
  superadmin: "Administrasi Sistem",
  wakasek: "Manajemen Kurikulum",
  kepsek: "Pengawasan Sekolah",
  guru: "Ruang Kerja Guru",
};

const roleNames = {
  superadmin: "Super Admin",
  wakasek: "Wakasek Kurikulum",
  kepsek: "Kepala Sekolah",
  guru: "Guru",
};

function MainLayout({
  role = "wakasek",
  userEmail = "",
  onLogout,
  activeMenu = "Dashboard",
  onMenuChange,
  onRoleChange,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  const [academicEvents, setAcademicEvents] = useState(() =>
    loadAcademicCalendarEvents()
  );

  useEffect(() => {
    const updateAcademicEvents = () => {
      setAcademicEvents(loadAcademicCalendarEvents());
    };

    window.addEventListener(
      "simkur-calendar-updated",
      updateAcademicEvents
    );

    window.addEventListener("storage", updateAcademicEvents);

    return () => {
      window.removeEventListener(
        "simkur-calendar-updated",
        updateAcademicEvents
      );

      window.removeEventListener("storage", updateAcademicEvents);
    };
  }, []);

  const rejectedNotifications =
    role === "wakasek"
      ? academicEvents.filter(
          (event) => event.status === "rejected_by_head"
        )
      : [];

  const menus = roleMenus[role] || roleMenus.wakasek;

  const handleMenuClick = (label) => {
    onMenuChange?.(label);
    setMobileOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const hasilPencarianMenu = menus
    .flatMap((group) => group.items)
    .filter((item) =>
      item.label
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase())
    );

  // Membuka agenda tertentu dari notifikasi penolakan.
  const handleOpenRejectedAgenda = (event) => {
    if (!event?.id) {
      alert(
        "ID agenda tidak ditemukan. Silakan periksa kembali data agenda."
      );
      return;
    }

    localStorage.setItem(
      "simkur_open_calendar_event_id",
      String(event.id)
    );

    if (role !== "wakasek") {
      onRoleChange?.("wakasek");
    }

    onMenuChange?.("Kalender Akademik");

    window.dispatchEvent(
      new CustomEvent("simkur-open-calendar-event")
    );

    setNotificationOpen(false);
    setMobileOpen(false);
  };

  return (
    <div className={`app-shell ${mobileOpen ? "sidebar-open" : ""}`}>
      {mobileOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Tutup navigasi"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="app-frame">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo">
              <School size={25} />
            </div>

            <div className="brand-text">
              <h2>SIMKUR SMP</h2>
              <span>Sistem Manajemen Kurikulum</span>
            </div>

            <button
              className="sidebar-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="sidebar-role">
            <div className="role-icon">
              <UserRound size={19} />
            </div>

            <div>
              <span>AKSES PENGGUNA</span>
              <strong>{roleNames[role] || "Pengguna"}</strong>
            </div>
          </div>

          <nav className="sidebar-navigation">
            {menus.map((group) => (
              <div className="nav-group" key={group.title}>
                <div className="nav-group-title">
                  {group.title}
                </div>

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeMenu === item.label;

                  return (
                    <button
                      key={item.label}
                      className={`nav-item ${active ? "active" : ""}`}
                      onClick={() => handleMenuClick(item.label)}
                    >
                      <Icon size={18} strokeWidth={1.9} />

                      <span>{item.label}</span>

                      {active && (
                        <span className="nav-active-indicator" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-footer-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <strong>SIMKUR Terlindungi</strong>
              <span>Akses berbasis hak pengguna</span>
            </div>
          </div>
        </aside>

        {/* AREA UTAMA */}
        <div className="app-main">
          {/* HEADER */}
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="mobile-menu-button"
                onClick={() => setMobileOpen(true)}
                aria-label="Buka navigasi"
              >
                <Menu size={22} />
              </button>

              <div className="page-heading">
                <div className="breadcrumb">
                  SIMKUR SMP <span>/</span>{" "}
                  {roleDescriptions[role]}
                </div>

                <h1>{activeMenu}</h1>
              </div>
            </div>

            <div className="topbar-actions">
              {/* TAHUN AJARAN */}
              <div className="academic-period">
                <CalendarDays size={17} />

                <div>
                  <span>TAHUN AJARAN</span>
                  <strong>2026/2027</strong>
                </div>

                <ChevronDown size={15} />
              </div>

              {/* PEMBARUAN APLIKASI */}
              <UpdateManager />

              {/* PENCARIAN */}
              <div className="simkur-search-wrapper">
                <button
                  type="button"
                  className="topbar-icon"
                  aria-label="Pencarian"
                  title="Pencarian"
                  onClick={() => {
                    setSearchOpen(!searchOpen);
                    setSearchQuery("");
                  }}
                >
                  <Search size={19} />
                </button>

                {searchOpen && (
                  <div className="simkur-search-panel">
                    <div className="simkur-search-input">
                      <Search size={18} />

                      <input
                        type="text"
                        autoFocus
                        placeholder="Cari menu SIMKUR..."
                        value={searchQuery}
                        onChange={(event) =>
                          setSearchQuery(event.target.value)
                        }
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <X size={17} />
                      </button>
                    </div>

                    {searchQuery.trim() !== "" && (
                      <div className="simkur-search-results">
                        {hasilPencarianMenu.length > 0 ? (
                          hasilPencarianMenu.map((item) => (
                            <button
                              type="button"
                              key={item.label}
                              onClick={() =>
                                handleMenuClick(item.label)
                              }
                            >
                              <item.icon size={17} />
                              <span>{item.label}</span>
                            </button>
                          ))
                        ) : (
                          <p>Menu tidak ditemukan.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* NOTIFIKASI */}
              <div className="notification-wrapper">
                <button
                  className="topbar-icon notification-button"
                  aria-label="Notifikasi"
                  title="Notifikasi"
                  onClick={() =>
                    setNotificationOpen(!notificationOpen)
                  }
                >
                  <Bell size={19} />

                  {rejectedNotifications.length > 0 && (
                    <span className="notification-count">
                      {rejectedNotifications.length}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="notification-panel">
                    <div className="notification-header">
                      <div>
                        <strong>Notifikasi</strong>
                        <span>
                          Pemberitahuan agenda sekolah
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setNotificationOpen(false)
                        }
                        aria-label="Tutup notifikasi"
                      >
                        <X size={17} />
                      </button>
                    </div>

                    {role !== "wakasek" ? (
                      <div className="notification-empty">
                        Notifikasi penolakan agenda ditampilkan
                        pada dashboard Wakasek.
                      </div>
                    ) : rejectedNotifications.length === 0 ? (
                      <div className="notification-empty">
                        <Bell size={25} />

                        <strong>
                          Belum ada penolakan agenda
                        </strong>

                        <span>
                          Notifikasi akan muncul jika Kepala
                          Sekolah menolak agenda.
                        </span>
                      </div>
                    ) : (
                      <div className="notification-list">
                        {rejectedNotifications.map((event) => (
                          <div
                            className="notification-item"
                            key={event.id}
                          >
                            <div className="notification-item-icon">
                              <X size={17} />
                            </div>

                            <div className="notification-item-content">
                              <strong>
                                Agenda ditolak Kepala Sekolah
                              </strong>

                              <span className="notification-item-title">
                                {event.title}
                              </span>

                              <span className="notification-item-date">
                                Tanggal kegiatan:{" "}
                                {event.startDate ||
                                  event.date ||
                                  "-"}
                              </span>

                              <p>
                                Alasan:{" "}
                                {event.headRejectionReason ||
                                  "Tidak ada alasan yang dicantumkan."}
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenRejectedAgenda(event)
                                }
                              >
                                Lihat dan Perbaiki Agenda
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PUSAT BANTUAN */}
              <button
                type="button"
                className="topbar-icon"
                aria-label="Bantuan"
                title="Bantuan"
                onClick={() => setHelpOpen(true)}
              >
                <CircleHelp size={19} />
              </button>

              {/* PROFIL PENGGUNA */}
              <div className="user-profile">
                <div className="user-avatar">
                  {(roleNames[role] || "Pengguna").charAt(0)}
                </div>

                <div className="user-profile-info">
                  <strong>
                    {roleNames[role] || "Pengguna"}
                  </strong>

                  <span>
                    {userEmail || "Pengguna SIMKUR"}
                  </span>
                </div>
              </div>

              {/* KELUAR */}
              <button
                type="button"
                className="topbar-icon"
                aria-label="Keluar"
                title="Keluar dari SIMKUR"
                onClick={() => onLogout?.()}
              >
                <LogOut size={19} />
              </button>
            </div>
          </header>

          {/* KONTEN DASHBOARD */}
          <main className="page-content">
            {children}
          </main>

          {/* FOOTER */}
          <footer className="app-footer">
            <span>SIMKUR SMP</span>
            <span>
              Sistem Informasi Manajemen Kurikulum
            </span>
            <span>Versi 1.0</span>
          </footer>
        </div>
      </div>

      {/* PUSAT BANTUAN */}
      {helpOpen && (
        <div
          className="simkur-help-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setHelpOpen(false);
            }
          }}
        >
          <div className="simkur-help-panel">
            <div className="simkur-help-header">
              <div>
                <CircleHelp size={24} />

                <div>
                  <h2>Pusat Bantuan SIMKUR</h2>
                  <p>Panduan penggunaan aplikasi</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Tutup bantuan"
              >
                <X size={20} />
              </button>
            </div>

            <div className="simkur-help-content">
              <h3>Selamat datang di SIMKUR</h3>

              <p>
                SIMKUR merupakan Sistem Informasi Manajemen
                Kurikulum untuk membantu pengelolaan administrasi
                dan kegiatan akademik sekolah.
              </p>

              <h3>Panduan penggunaan</h3>

              <ul>
                <li>
                  <strong>Dashboard:</strong> melihat ringkasan
                  informasi dan aktivitas sekolah.
                </li>

                <li>
                  <strong>Data Sekolah:</strong> mengelola data
                  guru, siswa, rombongan belajar, dan mata pelajaran
                  sesuai hak akses.
                </li>

                <li>
                  <strong>Kalender Akademik:</strong> mengelola
                  agenda dan kegiatan akademik.
                </li>

                <li>
                  <strong>Tugas Mengajar dan Jadwal:</strong>
                  mengelola pembagian tugas serta jadwal pelajaran.
                </li>

                <li>
                  <strong>Laporan:</strong> melihat dan mengelola
                  laporan kegiatan akademik.
                </li>
              </ul>

              <p>
                Gunakan fitur pencarian untuk menemukan menu
                dengan cepat. Menu yang tersedia mengikuti
                hak akses akun Anda.
              </p>
            </div>

            <div className="simkur-help-footer">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainLayout;
