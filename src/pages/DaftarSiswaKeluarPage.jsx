
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  GraduationCap,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

import { getSekolahAktifWakasek } from "../services/guruRepository";
import { getDataSiswaSekolah } from "../services/siswaRepository";
import "../styles/DataSiswaPage.css";

export default function DaftarSiswaKeluarPage({ userId }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let masihAktif = true;

    async function muatData() {
      setLoading(true);
      setError("");

      try {
        if (!userId) {
          throw new Error("Identitas akun tidak ditemukan.");
        }

        const sekolahId = await getSekolahAktifWakasek(userId);
        const data = await getDataSiswaSekolah(sekolahId);

        if (!masihAktif) return;

        setStudents(
          data.filter((student) =>
            ["Mutasi", "Keluar (Dropout)"].includes(student.status)
          )
        );
      } catch (err) {
        if (masihAktif) {
          setError(
            err?.message || "Gagal memuat Daftar Siswa Keluar."
          );
        }
      } finally {
        if (masihAktif) setLoading(false);
      }
    }

    muatData();

    return () => {
      masihAktif = false;
    };
  }, [userId]);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return students.filter((student) =>
      [
        student.nama,
        student.nis,
        student.nisn,
        student.jenisRegistrasi,
        student.keteranganRegistrasi,
      ].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [students, search]);

  const jumlahMutasi = students.filter(
    (student) => student.status === "Mutasi"
  ).length;

  const jumlahDropout = students.filter(
    (student) => student.status === "Keluar (Dropout)"
  ).length;

  return (
    <div className="ds-page">
      <div className="ds-header">
        <div>
          <div className="ds-breadcrumb">
            Operator <span>/</span> Data Sekolah <span>/</span> Daftar Siswa Keluar
          </div>

          <h1>Daftar Siswa Keluar</h1>

          <p>
            Data siswa yang telah diregistrasikan Mutasi atau Keluar (Dropout).
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: 12,
            marginBottom: 14,
            color: "#b91c1c",
            background: "#fef2f2",
            borderRadius: 8,
          }}
        >
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="ds-stats">
        <div className="ds-stat-card">
          <div className="ds-stat-icon blue">
            <GraduationCap size={21} />
          </div>
          <div>
            <span>Total Siswa Keluar</span>
            <strong>{students.length}</strong>
          </div>
        </div>

        <div className="ds-stat-card">
          <div className="ds-stat-icon green">
            <ClipboardList size={21} />
          </div>
          <div>
            <span>Mutasi</span>
            <strong>{jumlahMutasi}</strong>
          </div>
        </div>

        <div className="ds-stat-card">
          <div className="ds-stat-icon orange">
            <ClipboardList size={21} />
          </div>
          <div>
            <span>Keluar (Dropout)</span>
            <strong>{jumlahDropout}</strong>
          </div>
        </div>
      </div>

      <div className="ds-panel">
        <div className="ds-panel-heading">
          <div>
            <h2>Riwayat Siswa Keluar</h2>
            <p>
              Data dibaca langsung dari Supabase sekolah yang sedang aktif.
            </p>
          </div>
        </div>

        <div className="ds-toolbar">
          <div className="ds-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, NIS, NISN, atau keterangan..."
            />
          </div>
        </div>

        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Siswa</th>
                <th>NIS</th>
                <th>NISN</th>
                <th>Jenis Registrasi</th>
                <th>Tanggal</th>
                <th>Alasan/Keterangan</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="ds-empty">
                    Memuat data dari Supabase...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="ds-empty">
                    <GraduationCap size={34} />
                    <strong>Belum ada siswa keluar</strong>
                    <span>
                      Siswa yang diregistrasikan Mutasi atau Keluar akan muncul di sini.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td className="ds-student-name">{student.nama}</td>
                    <td>{student.nis || "-"}</td>
                    <td>{student.nisn || "-"}</td>
                    <td>
                      <span
                        className={`ds-status ${
                          student.status === "Mutasi" ? "active" : "inactive"
                        }`}
                      >
                        {student.jenisRegistrasi || student.status}
                      </span>
                    </td>
                    <td>{student.tanggalRegistrasi || "-"}</td>
                    <td style={{ minWidth: 220, whiteSpace: "normal" }}>
                      {student.keteranganRegistrasi || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ds-table-footer">
          Menampilkan {filteredStudents.length} dari {students.length} siswa keluar
        </div>
      </div>
    </div>
  );
}
