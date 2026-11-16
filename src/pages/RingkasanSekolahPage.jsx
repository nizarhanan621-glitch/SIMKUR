
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  BriefcaseBusiness,
  ChartNoAxesCombined,
} from "lucide-react";

import "../styles/RingkasanSekolahPage.css";

const KEYS = {
  guru: "simkur_data_guru",
  siswa: "simkur_data_siswa",
  rombel: "simkur_data_rombel",
  penempatan: "simkur_penempatan_siswa",
  mapel: "simkur_data_mata_pelajaran",
  tugas: "simkur_data_tugas_mengajar",
  jadwal: "simkur_data_jadwal_pelajaran",
  jurnal: "simkur_data_jurnal_mengajar",
  program: "simkur_program_kerja_kurikulum",
};

const bacaData = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const aktif = (item) => item?.status === "Aktif";

const angka = (value) => Number(value || 0).toLocaleString("id-ID");

export default function RingkasanSekolahPage() {
  const [data, setData] = useState({});

  const muatData = useCallback(() => {
    const hasil = {};
    Object.entries(KEYS).forEach(([nama, key]) => {
      hasil[nama] = bacaData(key);
    });
    setData(hasil);
  }, []);

  useEffect(() => {
    muatData();

    const perbarui = () => muatData();
    window.addEventListener("storage", perbarui);
    window.addEventListener("simkur_administrasi_updated", perbarui);

    return () => {
      window.removeEventListener("storage", perbarui);
      window.removeEventListener("simkur_administrasi_updated", perbarui);
    };
  }, [muatData]);

  const guru = data.guru || [];
  const siswa = data.siswa || [];
  const rombel = data.rombel || [];
  const penempatan = data.penempatan || [];
  const mapel = data.mapel || [];
  const tugas = data.tugas || [];
  const jadwal = data.jadwal || [];
  const jurnal = data.jurnal || [];
  const program = data.program || [];

  const guruAktif = guru.filter(aktif).length;
  const siswaAktif = siswa.filter((item) => item?.status !== "Tidak Aktif").length;
  const rombelAktif = rombel.filter(aktif).length;
  const mapelAktif = mapel.filter(aktif).length;
  const tugasAktif = tugas.filter(aktif).length;
  const jadwalAktif = jadwal.filter(
    (item) => item?.status !== "Tidak Aktif" && item?.status !== "Nonaktif"
  ).length;

  const jurnalHariIni = useMemo(() => {
    const sekarang = new Date();
    const tanggal = [
      sekarang.getFullYear(),
      String(sekarang.getMonth() + 1).padStart(2, "0"),
      String(sekarang.getDate()).padStart(2, "0"),
    ].join("-");

    return jurnal.filter((item) => {
      const tanggalData =
        item?.tanggal ||
        item?.tanggalMengajar ||
        item?.tanggalPelaksanaan ||
        "";
      return String(tanggalData).slice(0, 10) === tanggal;
    }).length;
  }, [jurnal]);

  const programAktif = program.filter(
    (item) => item?.status === "Aktif" || item?.status === "Berjalan"
  ).length;

  const jumlahPenempatan = penempatan.length;
  const persentasePenempatan =
    siswa.length > 0
      ? Math.min(100, Math.round((jumlahPenempatan / siswa.length) * 100))
      : 0;

  const kartu = [
    {
      label: "Guru",
      nilai: guruAktif,
      total: guru.length,
      keterangan: "Data guru aktif",
      icon: Users,
      warna: "biru",
    },
    {
      label: "Peserta Didik",
      nilai: siswaAktif,
      total: siswa.length,
      keterangan: "Data peserta didik",
      icon: GraduationCap,
      warna: "hijau",
    },
    {
      label: "Rombongan Belajar",
      nilai: rombelAktif,
      total: rombel.length,
      keterangan: "Rombel aktif",
      icon: School,
      warna: "ungu",
    },
    {
      label: "Mata Pelajaran",
      nilai: mapelAktif,
      total: mapel.length,
      keterangan: "Mata pelajaran aktif",
      icon: BookOpen,
      warna: "jingga",
    },
    {
      label: "Tugas Mengajar",
      nilai: tugasAktif,
      total: tugas.length,
      keterangan: "Penugasan aktif",
      icon: ClipboardCheck,
      warna: "biru",
    },
    {
      label: "Jadwal Pelajaran",
      nilai: jadwalAktif,
      total: jadwal.length,
      keterangan: "Data jadwal tersimpan",
      icon: CalendarDays,
      warna: "hijau",
    },
    {
      label: "Jurnal Mengajar",
      nilai: jurnal.length,
      total: null,
      keterangan: `${angka(jurnalHariIni)} catatan hari ini`,
      icon: ChartNoAxesCombined,
      warna: "ungu",
    },
    {
      label: "Program Kerja",
      nilai: programAktif,
      total: program.length,
      keterangan: "Program aktif/berjalan",
      icon: BriefcaseBusiness,
      warna: "jingga",
    },
  ];

  const ringkasanData = [
    { label: "Data Guru", jumlah: guru.length, aktif: guruAktif },
    { label: "Data Siswa", jumlah: siswa.length, aktif: siswaAktif },
    { label: "Rombongan Belajar", jumlah: rombel.length, aktif: rombelAktif },
    { label: "Mata Pelajaran", jumlah: mapel.length, aktif: mapelAktif },
    { label: "Tugas Mengajar", jumlah: tugas.length, aktif: tugasAktif },
    { label: "Jadwal Pelajaran", jumlah: jadwal.length, aktif: jadwalAktif },
  ];

  return (
    <main className="ringkasan-page">
      <header className="ringkasan-header">
        <div className="ringkasan-header-icon">
          <School size={25} />
        </div>
        <div>
          <h1>Ringkasan Sekolah</h1>
          <p>Gambaran umum data dan aktivitas akademik sekolah.</p>
        </div>
        <button
          type="button"
          className="ringkasan-refresh"
          onClick={muatData}
        >
          <RefreshCw size={16} />
          Perbarui Data
        </button>
      </header>

      <section className="ringkasan-intro">
        <div>
          <span className="ringkasan-eyebrow">INFORMASI AKADEMIK</span>
          <h2>Ikhtisar Kondisi Sekolah</h2>
          <p>
            Ringkasan ini dihimpun dari data yang dikelola melalui modul
            aplikasi SIMKUR SMP.
          </p>
        </div>
        <div className="ringkasan-intro-mark">
          <ChartNoAxesCombined size={38} />
        </div>
      </section>

      <section className="ringkasan-card-grid">
        {kartu.map((item) => {
          const Icon = item.icon;
          return (
            <article className="ringkasan-card" key={item.label}>
              <div className={`ringkasan-card-icon ${item.warna}`}>
                <Icon size={20} />
              </div>
              <div className="ringkasan-card-label">{item.label}</div>
              <div className="ringkasan-card-value">{angka(item.nilai)}</div>
              <div className="ringkasan-card-note">
                {item.total !== null
                  ? `${angka(item.total)} data tersimpan · ${item.keterangan}`
                  : item.keterangan}
              </div>
            </article>
          );
        })}
      </section>

      <section className="ringkasan-content-grid">
        <article className="ringkasan-panel">
          <div className="ringkasan-panel-heading">
            <div>
              <h2>Rekapitulasi Data Sekolah</h2>
              <p>Perbandingan jumlah data tersimpan dan data aktif.</p>
            </div>
          </div>

          <div className="ringkasan-data-list">
            {ringkasanData.map((item) => {
              const persen =
                item.jumlah > 0
                  ? Math.round((item.aktif / item.jumlah) * 100)
                  : 0;

              return (
                <div className="ringkasan-data-item" key={item.label}>
                  <div className="ringkasan-data-info">
                    <strong>{item.label}</strong>
                    <span>
                      {angka(item.aktif)} aktif dari {angka(item.jumlah)} data
                    </span>
                  </div>
                  <div className="ringkasan-progress-track">
                    <div
                      className="ringkasan-progress-value"
                      style={{ width: `${persen}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="ringkasan-panel">
          <div className="ringkasan-panel-heading">
            <div>
              <h2>Penempatan Peserta Didik</h2>
              <p>Data penempatan siswa pada rombongan belajar.</p>
            </div>
          </div>

          <div className="ringkasan-placement-number">
            <strong>{angka(jumlahPenempatan)}</strong>
            <span>data penempatan tercatat</span>
          </div>

          <div className="ringkasan-progress-track ringkasan-placement-track">
            <div
              className="ringkasan-progress-value"
              style={{ width: `${persentasePenempatan}%` }}
            />
          </div>

          <div className="ringkasan-placement-caption">
            <span>{persentasePenempatan}% dibanding jumlah data siswa</span>
            <strong>{angka(siswa.length)} siswa</strong>
          </div>

          <div className="ringkasan-note">
            Persentase ini membandingkan jumlah data penempatan dengan jumlah
            data siswa. Angka tersebut bukan penilaian mutu atau hasil belajar.
          </div>
        </article>
      </section>

      <section className="ringkasan-activity">
        <div className="ringkasan-panel-heading">
          <div>
            <h2>Aktivitas Akademik Tercatat</h2>
            <p>Jumlah catatan yang tersimpan dalam aplikasi.</p>
          </div>
        </div>

        <div className="ringkasan-activity-grid">
          <div>
            <span>Jurnal Mengajar</span>
            <strong>{angka(jurnal.length)}</strong>
            <small>{angka(jurnalHariIni)} catatan bertanggal hari ini</small>
          </div>
          <div>
            <span>Jadwal Pelajaran</span>
            <strong>{angka(jadwalAktif)}</strong>
            <small>Data jadwal aktif/tersimpan</small>
          </div>
          <div>
            <span>Program Kerja</span>
            <strong>{angka(programAktif)}</strong>
            <small>Program aktif atau berjalan</small>
          </div>
        </div>
      </section>

      <footer className="ringkasan-footer">
        Ringkasan diperbarui dari data lokal aplikasi. Kelengkapan informasi
        mengikuti data yang telah dimasukkan pada masing-masing modul.
      </footer>
    </main>
  );
}
