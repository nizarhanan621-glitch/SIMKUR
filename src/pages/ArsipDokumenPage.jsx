
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Search,
  FileText,
  Download,
  RefreshCw,
  Filter,
  FolderOpen,
} from "lucide-react";

import "../styles/ArsipDokumenPage.css";
import { kategoriAdministrasiGuru } from "../data/administrasiGuru";
import { getPengaturanAdministrasi } from "../utils/administrasiGuruStorage";

const KEYS = {
  guru: "simkur_data_guru",
  tugas: "simkur_data_tugas_mengajar",
  rombel: "simkur_data_rombel",
  mapel: "simkur_data_mata_pelajaran",
};

const bacaData = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const nilai = (obj, keys, fallback = "-") => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
};

const cocokId = (a, b) =>
  a !== undefined && b !== undefined && String(a) === String(b);

const formatTanggal = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}`.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const semuaDokumen = kategoriAdministrasiGuru.flatMap((kategori) =>
  kategori.dokumen.map((dokumen) => ({
    ...dokumen,
    kategoriId: kategori.id,
    kategoriNama: kategori.nama,
  }))
);

export default function ArsipDokumenPage() {
  const [periode, setPeriode] = useState([]);
  const [guru, setGuru] = useState([]);
  const [tugas, setTugas] = useState([]);
  const [rombel, setRombel] = useState([]);
  const [mapel, setMapel] = useState([]);
  const [pencarian, setPencarian] = useState("");
  const [filterTahun, setFilterTahun] = useState("Semua");
  const [filterSemester, setFilterSemester] = useState("Semua");
  const [filterGuru, setFilterGuru] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");

  const muatData = () => {
    setPeriode(getPengaturanAdministrasi());
    setGuru(bacaData(KEYS.guru));
    setTugas(bacaData(KEYS.tugas));
    setRombel(bacaData(KEYS.rombel));
    setMapel(bacaData(KEYS.mapel));
  };

  useEffect(() => {
    muatData();

    const perbarui = () => muatData();
    window.addEventListener("simkur_administrasi_updated", perbarui);
    window.addEventListener("storage", perbarui);

    return () => {
      window.removeEventListener("simkur_administrasi_updated", perbarui);
      window.removeEventListener("storage", perbarui);
    };
  }, []);

  const arsip = useMemo(() => {
    const hasil = [];

    periode.forEach((periodeData) => {
      const tahunAjaran = periodeData?.tahunAjaran || "-";
      const semester = periodeData?.semester || "-";
      const daftarPengumpulan = Array.isArray(periodeData?.pengumpulanGuru)
        ? periodeData.pengumpulanGuru
        : [];

      daftarPengumpulan.forEach((pengumpulan) => {
        const guruId = pengumpulan?.guruId;
        const guruData = guru.find((item) =>
          cocokId(nilai(item, ["id", "guruId", "nip"], null), guruId)
        );
        const tugasData = tugas.find((item) =>
          cocokId(nilai(item, ["id", "tugasMengajarId"], null), pengumpulan?.tugasMengajarId)
        );
        const rombelData = rombel.find((item) =>
          cocokId(nilai(item, ["id", "rombelId"], null), pengumpulan?.rombelId)
        );
        const mapelData = mapel.find((item) =>
          cocokId(nilai(item, ["id", "mapelId"], null), pengumpulan?.mapelId)
        );

        const daftarDokumen = Array.isArray(pengumpulan?.dokumen)
          ? pengumpulan.dokumen
          : [];

        daftarDokumen.forEach((dokumen) => {
          const master = semuaDokumen.find(
            (item) => item.id === dokumen?.dokumenId
          );

          hasil.push({
            id: `${tahunAjaran}-${semester}-${pengumpulan?.tugasMengajarId}-${guruId}-${dokumen?.dokumenId}`,
            tahunAjaran,
            semester,
            guruId: guruId ?? "",
            namaGuru: nilai(guruData, ["nama", "namaGuru", "namaLengkap"], `Guru ${guruId || "tidak diketahui"}`),
            nip: nilai(guruData, ["nip", "NIP"], "-"),
            dokumenId: dokumen?.dokumenId || "",
            namaDokumen: master?.nama || dokumen?.namaDokumen || dokumen?.nama || dokumen?.dokumenId || "Dokumen",
            kategoriId: master?.kategoriId || "lainnya",
            kategoriNama: master?.kategoriNama || "Dokumen lainnya",
            status: dokumen?.status || "Belum Dikumpulkan",
            tanggalKumpul: dokumen?.tanggalKumpul || "",
            catatan: dokumen?.catatan || dokumen?.catatanGuru || "",
            fileName: dokumen?.fileName || "",
            fileUrl: dokumen?.fileUrl || "",
            tugasMengajarId: pengumpulan?.tugasMengajarId || "",
            namaRombel:
              nilai(rombelData, ["namaRombel", "nama", "rombel", "namaKelas", "kelas"], null) ||
              nilai(tugasData, ["namaRombel", "rombel"], "-"),
            namaMapel:
              nilai(mapelData, ["namaMapel", "namaMataPelajaran", "mataPelajaran", "nama", "mapel"], null) ||
              nilai(tugasData, ["namaMapel", "mataPelajaran", "mapel"], "-"),
          });
        });
      });
    });

    return hasil.sort((a, b) => {
      const periodeA = `${a.tahunAjaran} ${a.semester}`;
      const periodeB = `${b.tahunAjaran} ${b.semester}`;
      return periodeB.localeCompare(periodeA);
    });
  }, [periode, guru, tugas, rombel, mapel]);

  const pilihanTahun = useMemo(
    () => [...new Set(arsip.map((item) => item.tahunAjaran))].sort().reverse(),
    [arsip]
  );

  const pilihanGuru = useMemo(() => {
    const daftar = new Map();
    arsip.forEach((item) => daftar.set(String(item.guruId), item.namaGuru));
    return [...daftar.entries()].map(([id, nama]) => ({ id, nama }));
  }, [arsip]);

  const hasilFilter = useMemo(() => {
    const q = pencarian.trim().toLowerCase();

    return arsip.filter((item) => {
      const cocokPencarian =
        !q ||
        [
          item.namaGuru,
          item.nip,
          item.namaDokumen,
          item.namaMapel,
          item.namaRombel,
          item.fileName,
        ].some((value) => String(value || "").toLowerCase().includes(q));

      return (
        cocokPencarian &&
        (filterTahun === "Semua" || item.tahunAjaran === filterTahun) &&
        (filterSemester === "Semua" || item.semester === filterSemester) &&
        (filterGuru === "Semua" || String(item.guruId) === filterGuru) &&
        (filterKategori === "Semua" || item.kategoriId === filterKategori) &&
        (filterStatus === "Semua" || item.status === filterStatus)
      );
    });
  }, [
    arsip,
    pencarian,
    filterTahun,
    filterSemester,
    filterGuru,
    filterKategori,
    filterStatus,
  ]);

  const jumlahTerkumpul = hasilFilter.filter(
    (item) => item.status !== "Belum Dikumpulkan"
  ).length;
  const jumlahDiterima = hasilFilter.filter(
    (item) => item.status === "Diterima"
  ).length;
  const jumlahRevisi = hasilFilter.filter(
    (item) => item.status === "Perlu Revisi"
  ).length;

  const resetFilter = () => {
    setPencarian("");
    setFilterTahun("Semua");
    setFilterSemester("Semua");
    setFilterGuru("Semua");
    setFilterKategori("Semua");
    setFilterStatus("Semua");
  };

  return (
    <main className="arsip-page">
      <header className="arsip-header">
        <div className="arsip-heading-icon">
          <Archive size={25} />
        </div>
        <div>
          <h1>Arsip Dokumen</h1>
          <p>Arsip administrasi pembelajaran guru berdasarkan periode akademik.</p>
        </div>
        <button className="arsip-refresh" onClick={muatData} type="button">
          <RefreshCw size={16} />
          Muat Ulang
        </button>
      </header>

      <section className="arsip-stats">
        <article>
          <span>Total Arsip</span>
          <strong>{hasilFilter.length}</strong>
          <small>Dokumen tercatat sesuai filter</small>
        </article>
        <article>
          <span>Sudah Dikumpulkan</span>
          <strong>{jumlahTerkumpul}</strong>
          <small>Termasuk yang sedang diperiksa</small>
        </article>
        <article>
          <span>Diterima</span>
          <strong>{jumlahDiterima}</strong>
          <small>Dokumen berstatus diterima</small>
        </article>
        <article>
          <span>Perlu Revisi</span>
          <strong>{jumlahRevisi}</strong>
          <small>Dokumen perlu ditindaklanjuti</small>
        </article>
      </section>

      <section className="arsip-filter-panel">
        <div className="arsip-section-title">
          <Filter size={18} />
          <h2>Filter Arsip</h2>
        </div>

        <div className="arsip-filter-grid">
          <label>
            Tahun Ajaran
            <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)}>
              <option value="Semua">Semua Tahun</option>
              {pilihanTahun.map((tahun) => (
                <option key={tahun} value={tahun}>{tahun}</option>
              ))}
            </select>
          </label>

          <label>
            Semester
            <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
              <option value="Semua">Semua Semester</option>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </label>

          <label>
            Guru
            <select value={filterGuru} onChange={(e) => setFilterGuru(e.target.value)}>
              <option value="Semua">Semua Guru</option>
              {pilihanGuru.map((item) => (
                <option key={item.id} value={item.id}>{item.nama}</option>
              ))}
            </select>
          </label>

          <label>
            Kategori
            <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
              <option value="Semua">Semua Kategori</option>
              {kategoriAdministrasiGuru.map((item) => (
                <option key={item.id} value={item.id}>{item.nama}</option>
              ))}
              <option value="lainnya">Dokumen lainnya</option>
            </select>
          </label>

          <label>
            Status
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="Semua">Semua Status</option>
              <option>Belum Dikumpulkan</option>
              <option>Sudah Dikumpulkan</option>
              <option>Sedang Diperiksa</option>
              <option>Perlu Revisi</option>
              <option>Diterima</option>
            </select>
          </label>
        </div>

        <div className="arsip-search-row">
          <div className="arsip-search">
            <Search size={17} />
            <input
              value={pencarian}
              onChange={(e) => setPencarian(e.target.value)}
              placeholder="Cari nama guru, dokumen, mata pelajaran, atau nama file..."
            />
          </div>
          <button type="button" className="arsip-reset" onClick={resetFilter}>
            Reset Filter
          </button>
        </div>
      </section>

      <section className="arsip-table-panel">
        <div className="arsip-table-heading">
          <div>
            <h2>Daftar Arsip Dokumen</h2>
            <p>{hasilFilter.length} data ditampilkan</p>
          </div>
        </div>

        {hasilFilter.length === 0 ? (
          <div className="arsip-empty">
            <FolderOpen size={38} />
            <strong>Belum ada arsip yang sesuai</strong>
            <span>Data akan muncul setelah dokumen tercatat pada Administrasi Pembelajaran.</span>
          </div>
        ) : (
          <div className="arsip-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Dokumen</th>
                  <th>Guru</th>
                  <th>Periode</th>
                  <th>Kelas / Mapel</th>
                  <th>Tanggal Kumpul</th>
                  <th>Status</th>
                  <th>Berkas</th>
                </tr>
              </thead>
              <tbody>
                {hasilFilter.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.namaDokumen}</strong>
                      <small>{item.kategoriNama}</small>
                    </td>
                    <td>
                      <strong>{item.namaGuru}</strong>
                      <small>NIP: {item.nip}</small>
                    </td>
                    <td>
                      <strong>{item.tahunAjaran}</strong>
                      <small>Semester {item.semester}</small>
                    </td>
                    <td>
                      <strong>{item.namaRombel}</strong>
                      <small>{item.namaMapel}</small>
                    </td>
                    <td>{formatTanggal(item.tanggalKumpul)}</td>
                    <td>
                      <span className={`arsip-status arsip-status-${item.status.toLowerCase().replaceAll(" ", "-")}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.fileUrl ? (
                        <a
                          className="arsip-file-link"
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download size={15} />
                          {item.fileName || "Buka berkas"}
                        </a>
                      ) : item.fileName ? (
                        <span className="arsip-file-name">
                          <FileText size={15} />
                          {item.fileName}
                          <small>Lokasi berkas tidak tersedia</small>
                        </span>
                      ) : (
                        <span className="arsip-no-file">Belum ada berkas</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
