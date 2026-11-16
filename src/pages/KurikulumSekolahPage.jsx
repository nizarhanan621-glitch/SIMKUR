
import { useEffect, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Info,
  CheckCircle2,
} from "lucide-react";

import { getKurikulumSekolah } from "../utils/kurikulumSekolahStorage";
import "../styles/KurikulumSekolah.css";

const DAFTAR_KELAS = ["VII", "VIII", "IX"];

const NAMA_KURIKULUM = {
  merdeka: "Kurikulum Merdeka",
  k13: "Kurikulum 2013",
  "Kurikulum Merdeka": "Kurikulum Merdeka",
  "Kurikulum 2013": "Kurikulum 2013",
};

export default function KurikulumSekolahPage() {
  const [data, setData] = useState(() => getKurikulumSekolah());

  useEffect(() => {
    const perbaruiData = () => {
      setData(getKurikulumSekolah());
    };

    window.addEventListener(
      "simkur-kurikulum-sekolah-updated",
      perbaruiData
    );

    return () => {
      window.removeEventListener(
        "simkur-kurikulum-sekolah-updated",
        perbaruiData
      );
    };
  }, []);

  const kurikulumPerKelas = data.kurikulumPerKelas || {};

  return (
    <div className="kurikulum-sekolah-page">
      <div className="ks-header">
        <div className="ks-header-icon">
          <BookOpen size={26} />
        </div>

        <div>
          <h1>Kurikulum Sekolah</h1>
          <p>
            Ringkasan informasi kurikulum yang diterapkan di sekolah.
          </p>
        </div>
      </div>

      <div className="ks-info">
        <Info size={19} />
        <p>
          Pengaturan jenis kurikulum untuk setiap tingkat kelas
          dilakukan melalui menu Manajemen Kurikulum. Halaman ini
          menampilkan ringkasan pengaturannya.
        </p>
      </div>

      <div className="ks-summary-grid">
        <div className="ks-summary-card">
          <div className="ks-card-icon">
            <BookOpen size={22} />
          </div>
          <div>
            <span>Nama Kurikulum Sekolah</span>
            <strong>
              {data.namaKurikulum || "Belum diatur"}
            </strong>
          </div>
        </div>

        <div className="ks-summary-card">
          <div className="ks-card-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <span>Pendekatan Pembelajaran</span>
            <strong>
              {data.pendekatanPembelajaran || "Belum diatur"}
            </strong>
          </div>
        </div>
      </div>

      <div className="ks-section">
        <div className="ks-section-header">
          <div>
            <h2>Kurikulum Berdasarkan Tingkat Kelas</h2>
            <p>
              Informasi kurikulum yang dipilih pada Manajemen Kurikulum.
            </p>
          </div>
        </div>

        <div className="ks-grade-list">
          {DAFTAR_KELAS.map((kelas) => {
            const jenisKurikulum = kurikulumPerKelas[kelas];
            const namaKurikulum =
              NAMA_KURIKULUM[jenisKurikulum] ||
              jenisKurikulum ||
              "Belum diatur";

            return (
              <div className="ks-grade-card" key={kelas}>
                <div className="ks-grade-icon">
                  <GraduationCap size={23} />
                </div>

                <div className="ks-grade-info">
                  <span>KELAS</span>
                  <strong>{kelas}</strong>
                  <p>{namaKurikulum}</p>
                </div>

                <div className="ks-grade-status">
                  <CheckCircle2 size={17} />
                  <span>
                    {jenisKurikulum ? "Terdata" : "Belum diatur"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ks-footer">
        <Info size={17} />
        <span>
          Untuk mengubah jenis kurikulum setiap kelas, silakan buka
          menu Manajemen Kurikulum → Kurikulum.
        </span>
      </div>
    </div>
  );
}
