
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertCircle,
  Database,
  MapPin,
} from "lucide-react";

import { getDataSekolah } from "../utils/dataSekolahStorage";
import "../styles/OperatorDashboard.css";

const STORAGE_KEYS = {
  guru: "simkur_data_guru",
  siswa: "simkur_data_siswa",
  rombel: "simkur_data_rombel",
  mapel: "simkur_data_mata_pelajaran",
  penempatan: "simkur_penempatan_siswa",
};

const readData = (key) => {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function OperatorDashboard() {
  const [data, setData] = useState(() => ({
    sekolah: getDataSekolah(),
    guru: readData(STORAGE_KEYS.guru),
    siswa: readData(STORAGE_KEYS.siswa),
    rombel: readData(STORAGE_KEYS.rombel),
    mapel: readData(STORAGE_KEYS.mapel),
    penempatan: readData(STORAGE_KEYS.penempatan),
  }));

  useEffect(() => {
    const refreshData = () => {
      setData({
        sekolah: getDataSekolah(),
        guru: readData(STORAGE_KEYS.guru),
        siswa: readData(STORAGE_KEYS.siswa),
        rombel: readData(STORAGE_KEYS.rombel),
        mapel: readData(STORAGE_KEYS.mapel),
        penempatan: readData(STORAGE_KEYS.penempatan),
      });
    };

    window.addEventListener(
      "simkur-data-sekolah-updated",
      refreshData
    );

    window.addEventListener("storage", refreshData);

    return () => {
      window.removeEventListener(
        "simkur-data-sekolah-updated",
        refreshData
      );

      window.removeEventListener("storage", refreshData);
    };
  }, []);

  const stats = useMemo(() => {
    const guruAktif = data.guru.filter(
      (item) => item.status !== "Nonaktif"
    ).length;

    const guruNonaktif = data.guru.filter(
      (item) => item.status === "Nonaktif"
    ).length;

    const siswaAktif = data.siswa.filter(
      (item) => item.status === "Aktif"
    );

    const rombelAktif = data.rombel.filter(
      (item) => item.status === "Aktif"
    );

    const mapelAktif = data.mapel.filter(
      (item) => item.status === "Aktif"
    ).length;

    const tahunAjaran = rombelAktif[0]?.tahunAjaran || "";

    const rombelTahunIni = rombelAktif.filter(
      (item) => item.tahunAjaran === tahunAjaran
    );

    const rombelIds = new Set(
      rombelTahunIni.map((item) => String(item.id))
    );

    const siswaIds = new Set(
      siswaAktif.map((item) => String(item.id))
    );

    const siswaDitempatkan = new Set(
      data.penempatan
        .filter(
          (item) =>
            item.tahunAjaran === tahunAjaran &&
            rombelIds.has(String(item.rombelId)) &&
            siswaIds.has(String(item.siswaId))
        )
        .map((item) => String(item.siswaId))
    );

    return {
      guruAktif,
      guruNonaktif,
      totalGuru: data.guru.length,
      totalSiswa: siswaAktif.length,
      totalRombel: rombelTahunIni.length,
      totalMapel: mapelAktif,
      sudahDitempatkan: tahunAjaran
        ? siswaDitempatkan.size
        : null,
      belumDitempatkan: tahunAjaran
        ? Math.max(0, siswaAktif.length - siswaDitempatkan.size)
        : null,
      tahunAjaran,
    };
  }, [data]);

  const sekolah = data.sekolah;

  const formatAlamat = [
    sekolah.alamatJalan,
    sekolah.kelurahan,
    sekolah.kecamatan,
    sekolah.kabupatenKota,
    sekolah.provinsi,
  ].filter(Boolean).join(", ");

  const statCards = [
    {
      title: "Total Guru",
      value: stats.totalGuru,
      caption: `${stats.guruAktif} aktif · ${stats.guruNonaktif} nonaktif`,
      icon: Users,
      color: "blue",
    },
    {
      title: "Total Siswa Aktif",
      value: stats.totalSiswa,
      caption: "Peserta didik aktif",
      icon: GraduationCap,
      color: "green",
    },
    {
      title: "Rombongan Belajar",
      value: stats.totalRombel,
      caption: stats.tahunAjaran || "Tahun ajaran belum tersedia",
      icon: School,
      color: "purple",
    },
    {
      title: "Mata Pelajaran Aktif",
      value: stats.totalMapel,
      caption: "Data mata pelajaran",
      icon: BookOpen,
      color: "orange",
    },
  ];

  return (
    <div className="operator-dashboard">

      <section className="operator-welcome">
        <div className="operator-welcome-copy">
          <span className="operator-eyebrow">
            PUSAT DATA DAN ADMINISTRASI SEKOLAH
          </span>

          <h2>Dashboard Operator Sekolah</h2>

          <p>
            Selamat datang. Pantau data sekolah, peserta didik,
            tenaga pendidik, dan administrasi data akademik.
          </p>
        </div>

        <div className="operator-welcome-icon">
          <Database size={36} />
        </div>
      </section>

      <section className="operator-school-card">
        <div className="operator-school-icon">
          <School size={25} />
        </div>

        <div className="operator-school-info">
          <span>IDENTITAS SEKOLAH</span>

          <h3>
            {sekolah.namaSekolah || "Nama sekolah belum diisi"}
          </h3>

          <div className="operator-school-meta">
            <span>NPSN: {sekolah.npsn || "-"}</span>
            <span>{sekolah.jenjang || "SMP"}</span>
            <span>{sekolah.statusSekolah || "-"}</span>
          </div>

          <p>
            <MapPin size={15} />
            {formatAlamat || "Alamat sekolah belum tersedia"}
          </p>
        </div>
      </section>

      <section className="operator-stat-grid">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <div className="operator-stat-card" key={item.title}>
              <div className={`operator-stat-icon ${item.color}`}>
                <Icon size={22} />
              </div>

              <div className="operator-stat-info">
                <span>{item.title}</span>
                <strong>{item.value}</strong>
                <small>{item.caption}</small>
              </div>
            </div>
          );
        })}
      </section>

      <section className="operator-content-grid">

        <div className="operator-panel">
          <div className="operator-panel-heading">
            <div>
              <h3>Status Penempatan Siswa</h3>
              <p>
                Ringkasan penempatan berdasarkan tahun ajaran aktif.
              </p>
            </div>
            <UserCheck size={21} />
          </div>

          <div className="operator-placement-grid">
            <div className="operator-placement-item">
              <CheckCircle2 size={21} />
              <div>
                <span>Sudah Ditempatkan</span>
                <strong>
                  {stats.sudahDitempatkan ?? "-"}
                </strong>
              </div>
            </div>

            <div className="operator-placement-item warning">
              <UserX size={21} />
              <div>
                <span>Belum Ditempatkan</span>
                <strong>
                  {stats.belumDitempatkan ?? "-"}
                </strong>
              </div>
            </div>
          </div>

          {!stats.tahunAjaran && (
            <div className="operator-info-note">
              <AlertCircle size={17} />
              <span>
                Belum ada rombongan belajar aktif untuk menentukan
                tahun ajaran penempatan.
              </span>
            </div>
          )}

          {stats.tahunAjaran && (
            <div className="operator-year-label">
              Tahun Ajaran: {stats.tahunAjaran}
            </div>
          )}
        </div>

        <div className="operator-panel">
          <div className="operator-panel-heading">
            <div>
              <h3>Status Integrasi Dapodik</h3>
              <p>Informasi kesiapan integrasi data sekolah.</p>
            </div>
            <Database size={21} />
          </div>

          <div className="operator-integration-status">
            <div className="operator-integration-icon">
              <AlertCircle size={22} />
            </div>

            <div>
              <strong>Belum terhubung</strong>
              <span>
                Integrasi Dapodik belum diaktifkan.
                Hubungkan melalui modul integrasi setelah
                SIMKUR Connector tersedia.
              </span>
            </div>
          </div>

          <div className="operator-integration-footer">
            Data yang ditampilkan berasal dari penyimpanan
            lokal aplikasi saat ini.
          </div>
        </div>

      </section>

      <div className="operator-update-info">
        <CheckCircle2 size={16} />
        <span>
          Ringkasan dashboard menggunakan data dari modul
          SIMKUR yang sudah tersedia pada perangkat ini.
        </span>
      </div>

    </div>
  );
}

export default OperatorDashboard;
