
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import LoginPopup from "./pages/LoginPopup";

import MainLayout from "./layouts/MainLayout";

import WakasekDashboard from "./pages/WakasekDashboard";
import KepsekDashboard from "./pages/KepsekDashboard";
import GuruDashboardPage from "./pages/GuruDashboardPage";

import KurikulumPage from "./pages/KurikulumPage";
import KalenderAkademikPage from "./pages/KalenderAkademikPage";
import ReferensiKalenderPage from "./pages/ReferensiKalenderPage";
import PersetujuanPage from "./pages/PersetujuanPage";

import DataGuruPage from "./pages/DataGuruPage";
import RombelPage from "./pages/RombelPage";
import MataPelajaranPage from "./pages/MataPelajaranPage";
import TugasMengajarPage from "./pages/TugasMengajarPage";
import JadwalPelajaranPage from "./pages/JadwalPelajaranPage";
import JadwalSayaPage from "./pages/JadwalSayaPage";
import DataSiswaPage from "./pages/DataSiswaPage";
import DaftarSiswaKeluarPage from "./pages/DaftarSiswaKeluarPage";
import PenempatanSiswaPage from "./pages/PenempatanSiswaPage";

import AdministrasiGuruPage from "./pages/AdministrasiGuruPage";
import AdministrasiPembelajaranPage from "./pages/AdministrasiPembelajaranPage";
import DataSekolahPage from "./pages/DataSekolahPage";
import JurnalMengajarPage from "./pages/JurnalMengajarPage";

import MonitoringKbmPage from "./pages/MonitoringKbmPage";
import AsesmenPage from "./pages/AsesmenPage";
import SupervisiPage from "./pages/SupervisiPage";
import ProgramKerjaPage from "./pages/ProgramKerjaPage";
import LaporanPage from "./pages/LaporanPage";

import PengaturanTampilanPage from "./pages/PengaturanTampilanPage";
import KurikulumSekolahPage from "./pages/KurikulumSekolahPage";

// HALAMAN KEPALA SEKOLAH
import RingkasanSekolahPage from "./pages/RingkasanSekolahPage";
import ArsipDokumenPage from "./pages/ArsipDokumenPage";
import ManajemenAkunWakasekPage from "./pages/ManajemenAkunWakasekPage";
import ManajemenAkunPenggunaPage from "./pages/ManajemenAkunPenggunaPage";


function App() {
  const [role, setRole] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;

    const applySession = (session) => {
      if (!mounted) return;

      if (!session?.user) {
        setRole(null);
        setUserEmail("");
        setUserId("");
        return;
      }

      const assignedRole = session.user.app_metadata?.role;
      const allowedRoles = ["superadmin", "wakasek", "kepsek", "guru"];

      if (!allowedRoles.includes(assignedRole)) {
        setRole(null);
        setUserEmail("");
        setUserId("");
        setAuthError(
          "Akun belum memiliki hak akses SIMKUR. Hubungi administrator."
        );
        
        return;
      }

      setRole(assignedRole);
      setUserEmail(session.user.email || "");
      setUserId(session.user.id);
      setAuthError("");
      setActiveMenu("Dashboard");
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        setAuthError(error.message);
      } else {
        applySession(data.session);
      }

      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      return;
    }

    setRole(null);
    setUserEmail("");
    setUserId("");
    setActiveMenu("Dashboard");
  };

  if (authLoading) {
    return <div style={{ minHeight: "100vh", background: "#eaf1fa" }} />;
  }

  if (!role) {
    return <LoginPopup accessError={authError} />;
  }

  const roleNames = {
  superadmin: "Super Admin",
  wakasek: "Wakasek Kurikulum",
  kepsek: "Kepala Sekolah",
  guru: "Guru",
};

  const handleRoleChange = () => {
    setActiveMenu("Dashboard");
  };


  const renderDashboard = () => {
    // DASHBOARD
    // DASHBOARD SUPER ADMIN
if (role === "superadmin" && activeMenu === "Dashboard") {
  return (
    <section
      style={{
        padding: "28px",
        background: "#FFFFFF",
        border: "1px solid #D9E2EC",
        borderRadius: "12px",
      }}
    >
      <h2 style={{ color: "#173B68" }}>
        Dashboard Super Admin
      </h2>

      <p style={{ color: "#68788C" }}>
        Selamat datang di pusat pengelolaan SIMKUR SMP.
      </p>

      <p style={{ color: "#68788C" }}>
        Gunakan menu Manajemen Akun untuk mengelola akun Wakasek.
      </p>
    </section>
  );
}

if (role === "superadmin" && activeMenu === "Manajemen Akun") {
  return <ManajemenAkunWakasekPage />;
}
if (role === "wakasek" && activeMenu === "Manajemen Akun Pengguna") {
  return <ManajemenAkunPenggunaPage />;
}
    if (role === "wakasek" && activeMenu === "Dashboard") {
      return <WakasekDashboard />;
    }

    if (role === "kepsek" && activeMenu === "Dashboard") {
      return <KepsekDashboard />;
    }

    if (role === "guru" && activeMenu === "Dashboard") {
      return <GuruDashboardPage userId={userId} />;
    }

    // RINGKASAN SEKOLAH - KHUSUS KEPALA SEKOLAH
    if (role === "kepsek" && activeMenu === "Ringkasan Sekolah") {
      return <RingkasanSekolahPage />;
    }

    // ARSIP DOKUMEN - KHUSUS KEPALA SEKOLAH
    if (role === "kepsek" && activeMenu === "Arsip Dokumen") {
      return <ArsipDokumenPage />;
    }

    // DATA SEKOLAH
    if (role === "wakasek" && activeMenu === "Data Sekolah") {
      return <DataSekolahPage role={role} />;
    }

    // DATA GURU
    if (role === "wakasek" && activeMenu === "Data Guru") {
      return <DataGuruPage userId={userId} />;
    }

    // DATA SISWA
    if (role === "wakasek" && activeMenu === "Data Siswa") {
  return <DataSiswaPage userId={userId} />;
}

if (role === "wakasek" && activeMenu === "Daftar Siswa Keluar") {
  return <DaftarSiswaKeluarPage userId={userId} />;
}

    // PENEMPATAN SISWA
    if (role === "wakasek" && activeMenu === "Penempatan Siswa") {
      return <PenempatanSiswaPage />;
    }

    // ROMBONGAN BELAJAR
    if (role === "wakasek" && activeMenu === "Rombongan Belajar") {
      return <RombelPage />;
    }

    // MATA PELAJARAN
    if (role === "wakasek" && activeMenu === "Mata Pelajaran") {
      return <MataPelajaranPage />;
    }

    // TUGAS MENGAJAR
    if (role === "wakasek" && activeMenu === "Tugas Mengajar") {
      return <TugasMengajarPage />;
    }

    // ADMINISTRASI GURU
    if (role === "wakasek" && activeMenu === "Administrasi Guru") {
      return <AdministrasiGuruPage userId={userId} />;
    }

    // KURIKULUM
    if (role === "wakasek" && activeMenu === "Kurikulum") {
      return <KurikulumPage />;
    }

    // KALENDER AKADEMIK
    if (role === "wakasek" && activeMenu === "Kalender Akademik") {
      return <KalenderAkademikPage />;
    }

    // REFERENSI KALENDER PENDIDIKAN
    if (
      role === "wakasek" &&
      activeMenu === "Referensi Kalender Pendidikan"
    ) {
      return <ReferensiKalenderPage />;
    }

    // KURIKULUM SEKOLAH
    if (role === "wakasek" && activeMenu === "Kurikulum Sekolah") {
      return <KurikulumSekolahPage />;
    }

    // JADWAL PELAJARAN
    if (role === "wakasek" && activeMenu === "Jadwal Pelajaran") {
      return <JadwalPelajaranPage />;
    }

    // JADWAL SAYA - GURU
    if (role === "guru" && activeMenu === "Jadwal Saya") {
      return <JadwalSayaPage />;
    }

    // JURNAL MENGAJAR GURU
    if (role === "guru" && activeMenu === "Jurnal Mengajar") {
      return <JurnalMengajarPage />;
    }

    // ADMINISTRASI PEMBELAJARAN - GURU
    if (role === "guru" && activeMenu === "Administrasi Pembelajaran") {
      return <AdministrasiPembelajaranPage userId={userId} />;
    }

    // MONITORING KBM - KHUSUS WAKASEK
    if (role === "wakasek" && activeMenu === "Monitoring KBM") {
      return <MonitoringKbmPage />;
    }

    // ASESMEN - KODE DIPERTAHANKAN UNTUK UPDATER
    if (
      (role === "wakasek" || role === "guru") &&
      activeMenu === "Asesmen"
    ) {
      return <AsesmenPage role={role} />;
    }

    // PERSETUJUAN - KEPALA SEKOLAH
    if (role === "kepsek" && activeMenu === "Persetujuan") {
      return <PersetujuanPage />;
    }

    // SUPERVISI AKADEMIK
    if (
      ["wakasek", "kepsek", "guru"].includes(role) &&
      activeMenu === "Supervisi"
    ) {
      return <SupervisiPage role={role} />;
    }

    // PROGRAM KERJA - WAKASEK
    if (role === "wakasek" && activeMenu === "Program Kerja") {
      return <ProgramKerjaPage role={role} />;
    }

    // LAPORAN
    if (
      (role === "wakasek" || role === "kepsek") &&
      activeMenu === "Laporan"
    ) {
      return <LaporanPage role={role} />;
    }

    // PENGATURAN TAMPILAN
    if (role === "wakasek" && activeMenu === "Pengaturan Tampilan") {
      return <PengaturanTampilanPage />;
    }

    // HALAMAN BELUM TERSEDIA / AKSES TIDAK DIIZINKAN
    return (
      <section
        style={{
          minHeight: "350px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "35px",
          background: "#FFFFFF",
          border: "1px solid #D9E2EC",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#173B68" }}>
          {activeMenu === "Dashboard"
            ? `Dashboard ${roleNames[role]}`
            : activeMenu}
        </h2>

        <p style={{ color: "#68788C" }}>
          Modul belum tersedia atau akses tidak diizinkan.
        </p>
      </section>
    );
  };

  return (
    <MainLayout
  role={role}
  userEmail={userEmail}
  onLogout={handleLogout}
  activeMenu={activeMenu}
  onMenuChange={setActiveMenu}
>
      {renderDashboard()}
    </MainLayout>
  );
}

export default App;
