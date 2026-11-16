
import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Settings,
  Save,
  CalendarDays,
  Eye,
  X,
  ChevronDown,
  BookOpen,
} from "lucide-react";

import {
  kategoriAdministrasiGuru,
  statusAdministrasiGuru,
} from "../data/administrasiGuru";

import {
  getPengaturanAdministrasi,
  getPengaturanPeriode,
  simpanPengaturanAdministrasi,
  perbaruiDokumenPenugasan,
} from "../utils/administrasiGuruStorage";

import "../styles/AdministrasiGuruPage.css";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "simkur_data_guru";
const TUGAS_KEY = "simkur_data_tugas_mengajar";
const ROMBEL_KEY = "simkur_data_rombel";
const MAPEL_KEY = "simkur_data_mata_pelajaran";

const STATUS_DEFAULT = "Belum Dikumpulkan";

function AccordionSection({
  title,
  description,
  icon: Icon,
  color,
  open,
  onToggle,
  badge,
  children,
}) {
  return (
    <section className={`ag-accordion ag-accordion--${color}`}>
      <button
        type="button"
        className="ag-accordion-trigger"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="ag-accordion-icon">
          <Icon size={21} />
        </span>

        <span className="ag-accordion-heading">
          <strong>{title}</strong>
          <small>{description}</small>
        </span>

        {badge && (
          <span className="ag-accordion-badge">{badge}</span>
        )}

        <span
          className={`ag-accordion-chevron ${open ? "expanded" : ""}`}
        >
          <ChevronDown size={21} />
        </span>
      </button>

      {open && (
        <div className="ag-accordion-content">{children}</div>
      )}
    </section>
  );
}

function readJSON(key, fallback = []) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

function getTanggalHariIni() {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const tanggal = String(sekarang.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${tanggal}`;
}

function formatTanggal(tanggal) {
  if (!tanggal) return "-";

  const nilai = new Date(`${tanggal}T00:00:00`);

  if (Number.isNaN(nilai.getTime())) return tanggal;

  return nilai.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function namaRombel(item) {
  return (
    item?.namaRombel ||
    item?.nama ||
    item?.rombel ||
    item?.namaKelas ||
    item?.kelas ||
    item?.id ||
    "-"
  );
}

function namaMapel(item) {
  return (
    item?.namaMapel ||
    item?.namaMataPelajaran ||
    item?.mataPelajaran ||
    item?.nama ||
    item?.mapel ||
    item?.id ||
    "-"
  );
}

function dataAktif(item) {
  return item && item.status === "Aktif";
}

export default function AdministrasiGuruPage({ userId }) {
  const [guru, setGuru] = useState(() => readJSON(STORAGE_KEY));
  const [daftarTugas, setDaftarTugas] = useState(() =>
    readJSON(TUGAS_KEY)
  );
  const [daftarRombel, setDaftarRombel] = useState(() =>
    readJSON(ROMBEL_KEY)
  );
  const [daftarMapel, setDaftarMapel] = useState(() =>
    readJSON(MAPEL_KEY)
  );

  const [search, setSearch] = useState("");

  const muatDataReferensi = useCallback(() => {
    setGuru(readJSON(STORAGE_KEY));
    setDaftarTugas(readJSON(TUGAS_KEY));
    setDaftarRombel(readJSON(ROMBEL_KEY));
    setDaftarMapel(readJSON(MAPEL_KEY));
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (
        !event.key ||
        [
          STORAGE_KEY,
          TUGAS_KEY,
          ROMBEL_KEY,
          MAPEL_KEY,
        ].includes(event.key)
      ) {
        muatDataReferensi();
      }
    };

    const handleFocus = () => muatDataReferensi();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        muatDataReferensi();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("simkur_guru_updated", muatDataReferensi);
    window.addEventListener(
      "simkur_tugas_mengajar_updated",
      muatDataReferensi
    );
    window.addEventListener(
      "simkur_rombel_updated",
      muatDataReferensi
    );
    window.addEventListener(
      "simkur_mapel_updated",
      muatDataReferensi
    );
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        "simkur_guru_updated",
        muatDataReferensi
      );
      window.removeEventListener(
        "simkur_tugas_mengajar_updated",
        muatDataReferensi
      );
      window.removeEventListener(
        "simkur_rombel_updated",
        muatDataReferensi
      );
      window.removeEventListener(
        "simkur_mapel_updated",
        muatDataReferensi
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [muatDataReferensi]);

  const [bagianTerbuka, setBagianTerbuka] = useState({
    ringkasan: true,
    pengaturan: false,
    pengecualian: false,
    master: false,
    daftarGuru: true,
    rincian: true,
  });

  function toggleBagian(key) {
    setBagianTerbuka((sebelumnya) => ({
      ...sebelumnya,
      [key]: !sebelumnya[key],
    }));
  }

  // PERIODE ADMINISTRASI
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [inputTahunAjaran, setInputTahunAjaran] =
    useState("2026/2027");
  const [semester, setSemester] = useState("Ganjil");

  // PENGATURAN KEWAJIBAN
  const [kewajibanDokumen, setKewajibanDokumen] = useState([]);
  const [pesanSimpan, setPesanSimpan] = useState("");

  const [daftarPengaturan, setDaftarPengaturan] = useState(() =>
    getPengaturanAdministrasi()
  );

  // PENGECUALIAN GURU
  const [guruPengecualianId, setGuruPengecualianId] = useState("");
  const [dokumenDikecualikan, setDokumenDikecualikan] = useState([]);
  const [catatanPengecualian, setCatatanPengecualian] = useState("");
  const [pesanPengecualian, setPesanPengecualian] = useState("");
  const [pengecualianGuru, setPengecualianGuru] = useState([]);

  // DATA PENGUMPULAN
  const [pengumpulanGuru, setPengumpulanGuru] = useState([]);
  const [sekolahId, setSekolahId] = useState("");
  const [memuatDokumenCloud, setMemuatDokumenCloud] = useState(false);
  const [errorDokumenCloud, setErrorDokumenCloud] = useState("");
  useEffect(() => {
  let masihAktif = true;

  async function muatSekolahWakasek() {
    setMemuatDokumenCloud(true);
    setErrorDokumenCloud("");
    setSekolahId("");

    if (!userId) {
      setErrorDokumenCloud("ID akun Wakasek tidak ditemukan.");
      setMemuatDokumenCloud(false);
      return;
    }

    const { data, error } = await supabase
      .from("keanggotaan_sekolah")
      .select("sekolah_id")
      .eq("user_id", userId)
      .eq("role", "wakasek")
      .eq("status", "aktif")
      .maybeSingle();

    if (!masihAktif) return;

    if (error) {
      setErrorDokumenCloud(
        "Gagal mengambil identitas sekolah: " + error.message
      );
    } else if (!data) {
      setErrorDokumenCloud(
        "Keanggotaan Wakasek aktif tidak ditemukan."
      );
    } else {
      setSekolahId(data.sekolah_id);
    }

    setMemuatDokumenCloud(false);
  }

  muatSekolahWakasek();

  return () => {
    masihAktif = false;
  };
}, [userId]);
  const [guruAdministrasiId, setGuruAdministrasiId] = useState("");
  const [tugasAdministrasiId, setTugasAdministrasiId] = useState("");
  const [pesanPengumpulan, setPesanPengumpulan] = useState("");

  const totalJenisAdministrasi = kategoriAdministrasiGuru.reduce(
    (total, kategori) => total + kategori.dokumen.length,
    0
  );

  const semuaDokumen = kategoriAdministrasiGuru.flatMap(
    (kategori) =>
      kategori.dokumen.map((dokumen) => ({
        ...dokumen,
        kategori: kategori.nama,
      }))
  );

  const dokumenWajib = semuaDokumen.filter((dokumen) =>
    kewajibanDokumen.includes(dokumen.id)
  );

  const guruAktif = guru.filter(dataAktif);

  const filteredGuru = guruAktif.filter((item) =>
    (item.nama || "").toLowerCase().includes(search.toLowerCase())
  );

  const guruTerpilih = guruAktif.find(
    (item) => String(item.id) === String(guruPengecualianId)
  );

  const guruAdministrasiTerpilih = guruAktif.find(
    (item) => String(item.id) === String(guruAdministrasiId)
  );

  const totalWajib = kewajibanDokumen.length;

  useEffect(() => {
    setInputTahunAjaran(tahunAjaran);
  }, [tahunAjaran]);

  // MEMUAT DATA SESUAI PERIODE
  useEffect(() => {
    const pengaturan = getPengaturanPeriode(
      tahunAjaran,
      semester
    );

    setKewajibanDokumen(
      Array.isArray(pengaturan?.kewajibanDokumen)
        ? pengaturan.kewajibanDokumen
        : []
    );

    setPengecualianGuru(
      Array.isArray(pengaturan?.pengecualianGuru)
        ? pengaturan.pengecualianGuru
        : []
    );

    setPengumpulanGuru(
      Array.isArray(pengaturan?.pengumpulanGuru)
        ? pengaturan.pengumpulanGuru
        : []
    );

    setGuruPengecualianId("");
    setDokumenDikecualikan([]);
    setCatatanPengecualian("");
    setPesanPengecualian("");

    setGuruAdministrasiId("");
    setTugasAdministrasiId("");
    setPesanPengumpulan("");
    setPesanSimpan("");

    setDaftarPengaturan(getPengaturanAdministrasi());
  }, [tahunAjaran, semester]);

// MEMUAT DOKUMEN GURU DARI SUPABASE
useEffect(() => {
  let masihAktif = true;

  async function muatDokumenGuruCloud() {
    if (!sekolahId) return;

    setMemuatDokumenCloud(true);
    setErrorDokumenCloud("");

    try {
      const { data, error } = await supabase
        .from("data_akademik_sekolah")
        .select("record_id, guru_id, payload, updated_at")
        .eq("sekolah_id", sekolahId)
        .eq("jenis_data", "administrasi_guru");

      if (error) throw error;
      if (!masihAktif) return;

      const tugasMap = new Map(
        daftarTugas.map((item) => [
          String(item.id),
          item,
        ])
      );

      const kelompok = new Map();

      (data || []).forEach((row) => {
        const payload = row.payload || {};

        if (
          String(payload.tahunAjaran) !== String(tahunAjaran) ||
          String(payload.semester) !== String(semester)
        ) {
          return;
        }

        const bagianRecord = String(row.record_id).split(":");

        const tugasIdCloud = String(
          payload.tugasMengajarId || bagianRecord[0]
        );

        const dokumenId = String(
          payload.dokumenId ||
          bagianRecord.slice(1).join(":")
        );

        if (!tugasIdCloud || !dokumenId) return;

        const tugas = tugasMap.get(tugasIdCloud);

        if (!kelompok.has(tugasIdCloud)) {
          kelompok.set(tugasIdCloud, {
            tugasMengajarId: tugasIdCloud,
            guruId: String(row.guru_id),
            rombelId: tugas?.rombelId || "",
            mapelId: tugas?.mapelId || "",
            tahunAjaran: payload.tahunAjaran,
            semester: payload.semester,
            dokumen: [],
          });
        }

        const dokumen = {
          dokumenId,
          status: payload.status || STATUS_DEFAULT,
          tanggalKumpul: payload.tanggalKumpul || "",
          fileName: payload.fileName || "",
          filePath: payload.filePath || "",
          fileUrl: "",
          mimeType: payload.mimeType || "",
          fileSize: payload.fileSize || 0,
          uploadedAt: payload.uploadedAt || "",
          revisionNumber: payload.revisionNumber || 0,
          riwayatRevisi: Array.isArray(payload.riwayatRevisi)
            ? payload.riwayatRevisi
            : [],
          updatedAt: row.updated_at,
        };

        if (payload.catatan != null) {
          dokumen.catatan = payload.catatan;
        }

        if (payload.catatanGuru != null) {
          dokumen.catatanGuru = payload.catatanGuru;
        }

        kelompok.get(tugasIdCloud).dokumen.push(dokumen);
      });

      // Gabungkan dokumen cloud dengan data lokal lama.
      setPengumpulanGuru((sebelumnya) => {
        const hasil = [...sebelumnya];

        kelompok.forEach((cloud) => {
          const index = hasil.findIndex(
            (item) =>
              item.tugasMengajarId &&
              String(item.tugasMengajarId) ===
                String(cloud.tugasMengajarId)
          );

          if (index < 0) {
            hasil.push(cloud);
            return;
          }

          const lokal = hasil[index];
          const dokumenLokal = [
            ...(lokal.dokumen || []),
          ];

          cloud.dokumen.forEach((dokumenCloud) => {
            const indexDokumen = dokumenLokal.findIndex(
              (item) =>
                String(item.dokumenId) ===
                String(dokumenCloud.dokumenId)
            );

            if (indexDokumen >= 0) {
              dokumenLokal[indexDokumen] = {
                ...dokumenLokal[indexDokumen],
                ...dokumenCloud,
              };
            } else {
              dokumenLokal.push(dokumenCloud);
            }
          });

          hasil[index] = {
            ...lokal,
            ...cloud,
            dokumen: dokumenLokal,
          };
        });

        return hasil;
      });
    } catch (error) {
      console.error(
        "Gagal memuat dokumen Supabase:",
        error
      );

      if (masihAktif) {
        setErrorDokumenCloud(error.message);
      }
    } finally {
      if (masihAktif) {
        setMemuatDokumenCloud(false);
      }
    }
  }

  muatDokumenGuruCloud();

  return () => {
    masihAktif = false;
  };
}, [sekolahId, tahunAjaran, semester, daftarTugas]);

  // PENUGASAN AKTIF SESUAI PERIODE
  const tugasAktifPeriode = daftarTugas.filter((tugas) => {
    if (String(tugas.tahunAjaran) !== String(tahunAjaran)) {
      return false;
    }

    if (String(tugas.semester) !== String(semester)) {
      return false;
    }

    if (tugas.status !== "Aktif") {
      return false;
    }

    const guruTugas = guru.find(
      (item) => String(item.id) === String(tugas.guruId)
    );

    const rombelTugas = daftarRombel.find(
      (item) => String(item.id) === String(tugas.rombelId)
    );

    const mapelTugas = daftarMapel.find(
      (item) => String(item.id) === String(tugas.mapelId)
    );

    return (
      dataAktif(guruTugas) &&
      dataAktif(rombelTugas) &&
      dataAktif(mapelTugas)
    );
  });

  function getTugasGuru(guruId) {
    return tugasAktifPeriode.filter(
      (item) => String(item.guruId) === String(guruId)
    );
  }

  function getInfoTugas(tugas) {
    const rombel = daftarRombel.find(
      (item) => String(item.id) === String(tugas.rombelId)
    );

    const mapel = daftarMapel.find(
      (item) => String(item.id) === String(tugas.mapelId)
    );

    return {
      rombel: namaRombel(rombel),
      mapel: namaMapel(mapel),
    };
  }

  // PENGECUALIAN GURU TETAP BERLAKU PER GURU
  function getPengecualianGuru(guruId) {
    return pengecualianGuru.find(
      (item) => String(item.guruId) === String(guruId)
    );
  }

  function getDokumenWajibGuru(guruId) {
    const pengecualian = getPengecualianGuru(guruId);

    return dokumenWajib.filter(
      (dokumen) =>
        !pengecualian?.dokumenDikecualikan?.includes(dokumen.id)
    );
  }

  // DATA LAMA: MASIH BERDASARKAN GURU
  function getDataPengumpulanGuru(guruId) {
    return pengumpulanGuru.find(
      (item) =>
        !item.tugasMengajarId &&
        String(item.guruId) === String(guruId)
    );
  }

  function getStatusDokumenLama(guruId, dokumenId) {
    const dataGuru = getDataPengumpulanGuru(guruId);

    const dokumen = dataGuru?.dokumen?.find(
      (item) => String(item.dokumenId) === String(dokumenId)
    );

    return {
      status: dokumen?.status || STATUS_DEFAULT,
      catatan: dokumen?.catatan || "",
      tanggalKumpul: dokumen?.tanggalKumpul || "",
      updatedAt: dokumen?.updatedAt || "",
    };
  }

  // DATA BARU: BERDASARKAN PENUGASAN
  function getDataPengumpulanPenugasan(tugasMengajarId) {
    return pengumpulanGuru.find(
      (item) =>
        item.tugasMengajarId &&
        String(item.tugasMengajarId) === String(tugasMengajarId)
    );
  }

  function getStatusDokumenPenugasan(tugasMengajarId, dokumenId) {
    const dataTugas =
      getDataPengumpulanPenugasan(tugasMengajarId);

    const dokumen = dataTugas?.dokumen?.find(
      (item) => String(item.dokumenId) === String(dokumenId)
    );

    return {
      status: dokumen?.status || STATUS_DEFAULT,
      catatan: dokumen?.catatan || "",
      tanggalKumpul: dokumen?.tanggalKumpul || "",
      updatedAt: dokumen?.updatedAt || "",
      fileName: dokumen?.fileName || "",
      filePath: dokumen?.filePath || "",
      fileUrl: dokumen?.fileUrl || "",
    };
  }

  function getRingkasanDokumen(daftarDokumen, getStatus) {
    if (daftarDokumen.length === 0) {
      return {
        total: 0,
        diterima: 0,
        belumDikumpulkan: 0,
        perluRevisi: 0,
        status: "Belum Ada Kewajiban",
        progress: 0,
      };
    }

    const semuaStatus = daftarDokumen.map(
      (dokumen) => getStatus(dokumen.id).status
    );

    const diterima = semuaStatus.filter(
      (status) => status === "Diterima"
    ).length;

    const belum = semuaStatus.filter(
      (status) => status === STATUS_DEFAULT
    ).length;

    const revisi = semuaStatus.filter(
      (status) => status === "Perlu Revisi"
    ).length;

    let status = "Belum Lengkap";

    if (diterima === daftarDokumen.length) {
      status = "Lengkap";
    } else if (revisi > 0) {
      status = "Perlu Revisi";
    } else if (semuaStatus.includes("Sedang Diperiksa")) {
      status = "Sedang Diperiksa";
    } else if (semuaStatus.includes("Sudah Dikumpulkan")) {
      status = "Dalam Pemeriksaan";
    } else if (belum === daftarDokumen.length) {
      status = "Belum Dikumpulkan";
    }

    return {
      total: daftarDokumen.length,
      diterima,
      belumDikumpulkan: belum,
      perluRevisi: revisi,
      status,
      progress: Math.round(
        (diterima / daftarDokumen.length) * 100
      ),
    };
  }

  function getRingkasanPenugasan(tugasMengajarId, guruId) {
    const dokumen = getDokumenWajibGuru(guruId);

    return getRingkasanDokumen(dokumen, (dokumenId) =>
      getStatusDokumenPenugasan(tugasMengajarId, dokumenId)
    );
  }

  function getRingkasanGuru(guruId) {
    const tugasGuru = getTugasGuru(guruId);

    if (tugasGuru.length > 0) {
      const ringkasanTugas = tugasGuru.map((tugas) =>
        getRingkasanPenugasan(tugas.id, guruId)
      );

      const total = ringkasanTugas.reduce(
        (hasil, item) => hasil + item.total,
        0
      );

      const diterima = ringkasanTugas.reduce(
        (hasil, item) => hasil + item.diterima,
        0
      );

      const belumDikumpulkan = ringkasanTugas.reduce(
        (hasil, item) => hasil + item.belumDikumpulkan,
        0
      );

      const perluRevisi = ringkasanTugas.reduce(
        (hasil, item) => hasil + item.perluRevisi,
        0
      );

      if (total === 0) {
        return {
          total: 0,
          diterima: 0,
          belumDikumpulkan: 0,
          perluRevisi: 0,
          status: "Belum Ada Kewajiban",
          progress: 0,
        };
      }

      let status = "Belum Lengkap";

      if (diterima === total) {
        status = "Lengkap";
      } else if (perluRevisi > 0) {
        status = "Perlu Revisi";
      } else if (belumDikumpulkan === total) {
        status = "Belum Dikumpulkan";
      } else {
        status = "Dalam Pemeriksaan";
      }

      return {
        total,
        diterima,
        belumDikumpulkan,
        perluRevisi,
        status,
        progress: Math.round((diterima / total) * 100),
      };
    }

    // Kompatibilitas untuk guru yang belum memiliki penugasan aktif.
    return getRingkasanDokumen(
      getDokumenWajibGuru(guruId),
      (dokumenId) => getStatusDokumenLama(guruId, dokumenId)
    );
  }

  const jumlahAdministrasiLengkap = guruAktif.filter(
    (item) =>
      getRingkasanGuru(item.id).total > 0 &&
      getRingkasanGuru(item.id).status === "Lengkap"
  ).length;

  const jumlahPerluDilengkapi = guruAktif.filter((item) => {
    const ringkasan = getRingkasanGuru(item.id);

    return (
      ringkasan.belumDikumpulkan > 0 ||
      ringkasan.perluRevisi > 0
    );
  }).length;

  const jumlahBelumDiperiksa = guruAktif.filter((item) => {
    const ringkasan = getRingkasanGuru(item.id);

    return (
      ringkasan.total > 0 &&
      ringkasan.status === "Belum Dikumpulkan"
    );
  }).length;

  // PENGATURAN KEWAJIBAN
  function toggleKewajiban(dokumenId) {
    setKewajibanDokumen((sebelumnya) =>
      sebelumnya.includes(dokumenId)
        ? sebelumnya.filter((id) => id !== dokumenId)
        : [...sebelumnya, dokumenId]
    );

    setPesanSimpan("");
  }

  function handleSimpanPengaturan() {
    const tahun = inputTahunAjaran.trim();

    if (!tahun) {
      setPesanSimpan("Tahun ajaran harus diisi.");
      return;
    }

    const pengecualianBersih = pengecualianGuru
      .map((item) => ({
        ...item,
        dokumenDikecualikan: (
          item.dokumenDikecualikan || []
        ).filter((id) => kewajibanDokumen.includes(id)),
      }))
      .filter(
        (item) => item.dokumenDikecualikan.length > 0
      );

    try {
      const hasil = simpanPengaturanAdministrasi({
        tahunAjaran: tahun,
        semester,
        kewajibanDokumen,
        pengecualianGuru: pengecualianBersih,
        pengumpulanGuru,
      });

      setTahunAjaran(tahun);
      setPengecualianGuru(pengecualianBersih);
      setDaftarPengaturan(hasil);
      setPesanSimpan(
        "Pengaturan administrasi berhasil disimpan."
      );
    } catch (error) {
      console.error("Gagal menyimpan pengaturan:", error);
      setPesanSimpan(
        "Gagal menyimpan pengaturan. Silakan coba kembali."
      );
    }
  }

  // PENGECUALIAN GURU
  function handlePilihGuruPengecualian(guruId) {
    setGuruPengecualianId(guruId);

    const dataGuru = pengecualianGuru.find(
      (item) => String(item.guruId) === String(guruId)
    );

    setDokumenDikecualikan(
      dataGuru?.dokumenDikecualikan || []
    );

    setCatatanPengecualian(dataGuru?.catatan || "");
    setPesanPengecualian("");
  }

  function toggleDokumenDikecualikan(dokumenId) {
    setDokumenDikecualikan((sebelumnya) =>
      sebelumnya.includes(dokumenId)
        ? sebelumnya.filter((id) => id !== dokumenId)
        : [...sebelumnya, dokumenId]
    );

    setPesanPengecualian("");
  }

  function handleSimpanPengecualian() {
    if (!guruPengecualianId) {
      setPesanPengecualian("Pilih guru terlebih dahulu.");
      return;
    }

    const dataBaru = pengecualianGuru.filter(
      (item) =>
        String(item.guruId) !== String(guruPengecualianId)
    );

    const dokumenValid = dokumenDikecualikan.filter(
      (id) => kewajibanDokumen.includes(id)
    );

    if (dokumenValid.length > 0) {
      dataBaru.push({
        guruId: guruPengecualianId,
        dokumenDikecualikan: dokumenValid,
        catatan: catatanPengecualian.trim(),
      });
    }

    try {
      const hasil = simpanPengaturanAdministrasi({
        tahunAjaran: tahunAjaran.trim(),
        semester,
        kewajibanDokumen,
        pengecualianGuru: dataBaru,
        pengumpulanGuru,
      });

      setPengecualianGuru(dataBaru);
      setDokumenDikecualikan(dokumenValid);
      setDaftarPengaturan(hasil);
      setPesanPengecualian(
        "Pengecualian guru berhasil disimpan."
      );
    } catch (error) {
      console.error("Gagal menyimpan pengecualian:", error);
      setPesanPengecualian(
        "Gagal menyimpan pengecualian. Silakan coba kembali."
      );
    }
  }

  // MEMBUKA RINCIAN GURU DAN PENUGASANNYA
  function handleBukaAdministrasiGuru(guruId) {
    const tugasGuru = getTugasGuru(guruId);

    setGuruAdministrasiId(guruId);
    setTugasAdministrasiId(tugasGuru[0]?.id || "");

    setBagianTerbuka((sebelumnya) => ({
      ...sebelumnya,
      daftarGuru: true,
      rincian: true,
    }));

    setPesanPengumpulan("");
  }

  // MEMPERBARUI STATUS/CATATAN DOKUMEN PENUGASAN
  function ubahDokumenPenugasan(
    tugasMengajarId,
    guruId,
    dokumenId,
    perubahan
  ) {
    const tugas = tugasAktifPeriode.find(
      (item) => String(item.id) === String(tugasMengajarId)
    );

    if (!tugas) return;

    setPengumpulanGuru((sebelumnya) =>
      perbaruiDokumenPenugasan(
        sebelumnya,
        {
          tugasMengajarId: tugas.id,
          guruId: tugas.guruId,
          rombelId: tugas.rombelId,
          mapelId: tugas.mapelId,
          tahunAjaran: tugas.tahunAjaran,
          semester: tugas.semester,
        },
        {
          dokumenId,
          ...perubahan,
        }
      )
    );

    setPesanPengumpulan("");
  }

  function handleUbahStatusPenugasan(
    tugasMengajarId,
    guruId,
    dokumenId,
    status
  ) {
    const dataLama = getStatusDokumenPenugasan(
      tugasMengajarId,
      dokumenId
    );

    let tanggalKumpul = dataLama.tanggalKumpul;

    if (status === "Sudah Dikumpulkan" && !tanggalKumpul) {
      tanggalKumpul = getTanggalHariIni();
    }

    if (status === STATUS_DEFAULT) {
      tanggalKumpul = "";
    }

    ubahDokumenPenugasan(
      tugasMengajarId,
      guruId,
      dokumenId,
      {
        status,
        tanggalKumpul,
      }
    );
  }

  function handleUbahCatatanPenugasan(
    tugasMengajarId,
    guruId,
    dokumenId,
    catatan
  ) {
    ubahDokumenPenugasan(
      tugasMengajarId,
      guruId,
      dokumenId,
      { catatan }
    );
  }

  // DATA LAMA TETAP DAPAT DIPERIKSA DAN DIPERBARUI
  function ubahDokumenLama(guruId, dokumenId, perubahan) {
    setPengumpulanGuru((sebelumnya) => {
      const dataBaru = [...sebelumnya];

      let indexGuru = dataBaru.findIndex(
        (item) =>
          !item.tugasMengajarId &&
          String(item.guruId) === String(guruId)
      );

      if (indexGuru < 0) {
        dataBaru.push({
          guruId,
          dokumen: [],
        });

        indexGuru = dataBaru.length - 1;
      }

      const dataGuru = {
        ...dataBaru[indexGuru],
        dokumen: [...(dataBaru[indexGuru].dokumen || [])],
      };

      const indexDokumen = dataGuru.dokumen.findIndex(
        (item) => String(item.dokumenId) === String(dokumenId)
      );

      const dataLama =
        indexDokumen >= 0
          ? dataGuru.dokumen[indexDokumen]
          : {};

      const dataDokumen = {
        ...dataLama,
        dokumenId,
        ...perubahan,
        updatedAt: new Date().toISOString(),
      };

      if (indexDokumen >= 0) {
        dataGuru.dokumen[indexDokumen] = dataDokumen;
      } else {
        dataGuru.dokumen.push(dataDokumen);
      }

      dataBaru[indexGuru] = dataGuru;
      return dataBaru;
    });

    setPesanPengumpulan("");
  }

  function handleUbahStatusDokumenLama(guruId, dokumenId, status) {
    const dataLama = getStatusDokumenLama(guruId, dokumenId);

    let tanggalKumpul = dataLama.tanggalKumpul;

    if (status === "Sudah Dikumpulkan" && !tanggalKumpul) {
      tanggalKumpul = getTanggalHariIni();
    }

    if (status === STATUS_DEFAULT) {
      tanggalKumpul = "";
    }

    ubahDokumenLama(guruId, dokumenId, {
      status,
      tanggalKumpul,
    });
  }

  function handleSimpanPengumpulan() {
    if (!guruAdministrasiId) {
      setPesanPengumpulan("Pilih guru terlebih dahulu.");
      return;
    }

    try {
      const hasil = simpanPengaturanAdministrasi({
        tahunAjaran: tahunAjaran.trim(),
        semester,
        kewajibanDokumen,
        pengecualianGuru,
        pengumpulanGuru,
      });

      setDaftarPengaturan(hasil);
      setPesanPengumpulan(
        "Administrasi guru berhasil disimpan."
      );
    } catch (error) {
      console.error("Gagal menyimpan pengumpulan:", error);
      setPesanPengumpulan(
        "Gagal menyimpan administrasi guru. Silakan coba kembali."
      );
    }
  }

async function bukaBerkasAdministrasi(filePath, mode = "view") {
  if (!filePath) {
    setPesanPengumpulan("Lokasi dokumen tidak ditemukan.");
    return;
  }

  const tab = window.open("about:blank", "_blank");

  if (!tab) {
    setPesanPengumpulan(
      "Izinkan pop-up browser untuk membuka dokumen."
    );
    return;
  }

  tab.opener = null;

  try {
    const { data, error } = await supabase.storage
      .from("administrasi-pembelajaran")
      .createSignedUrl(
        filePath,
        120,
        mode === "download" ? { download: true } : {}
      );

    if (error) throw error;

    if (!data?.signedUrl) {
      throw new Error("URL dokumen tidak berhasil dibuat.");
    }

    tab.location.replace(data.signedUrl);
    setPesanPengumpulan("");
  } catch (error) {
    tab.close();
    console.error("Gagal membuka dokumen:", error);

    setPesanPengumpulan(
      "Gagal membuka dokumen: " + error.message
    );
  }
}

  function getStatusClass(status) {
    switch (status) {
      case "Lengkap":
      case "Diterima":
        return "accepted";

      case "Sudah Dikumpulkan":
      case "Dalam Pemeriksaan":
        return "submitted";

      case "Sedang Diperiksa":
        return "review";

      case "Perlu Revisi":
        return "revision";

      default:
        return "pending";
    }
  }

  const tugasGuruTerpilih = getTugasGuru(guruAdministrasiId);

  const tugasTerpilih = tugasGuruTerpilih.find(
    (item) => String(item.id) === String(tugasAdministrasiId)
  );

  const dokumenWajibGuruTerpilih =
    guruAdministrasiId
      ? getDokumenWajibGuru(guruAdministrasiId)
      : [];

  const dataLamaTerpilih = guruAdministrasiId
    ? getDataPengumpulanGuru(guruAdministrasiId)
    : null;

  return (
    <div className="ag-page">
      <div className="ag-header">
        <div>
          <h1>Administrasi Guru</h1>
          <p>
            Pengelolaan dan pemantauan kelengkapan administrasi guru
            berdasarkan penugasan mengajar.
          </p>
        </div>
      </div>

      {/* RINGKASAN */}
      <AccordionSection
        title="Ringkasan Administrasi"
        description="Ikhtisar kondisi kelengkapan administrasi seluruh guru."
        icon={ClipboardList}
        color="blue"
        open={bagianTerbuka.ringkasan}
        onToggle={() => toggleBagian("ringkasan")}
        badge={`${guruAktif.length} Guru`}
      >
        <div className="ag-stats">
          <div className="ag-stat-card">
            <div className="ag-stat-icon blue">
              <Users />
            </div>
            <div>
              <span>Total Guru Aktif</span>
              <strong>{guruAktif.length}</strong>
            </div>
          </div>

          <div className="ag-stat-card">
            <div className="ag-stat-icon green">
              <CheckCircle2 />
            </div>
            <div>
              <span>Administrasi Lengkap</span>
              <strong>{jumlahAdministrasiLengkap}</strong>
            </div>
          </div>

          <div className="ag-stat-card">
            <div className="ag-stat-icon orange">
              <AlertCircle />
            </div>
            <div>
              <span>Perlu Dilengkapi</span>
              <strong>{jumlahPerluDilengkapi}</strong>
            </div>
          </div>

          <div className="ag-stat-card">
            <div className="ag-stat-icon purple">
              <ClipboardList />
            </div>
            <div>
              <span>Belum Mengumpulkan</span>
              <strong>{jumlahBelumDiperiksa}</strong>
            </div>
          </div>
        </div>

        <div className="ag-period-archive">
          <strong>Periode Pemantauan</strong>
          <span>
            Tahun Ajaran {tahunAjaran} · Semester {semester}
          </span>
          <span>
            {tugasAktifPeriode.length} penugasan mengajar aktif
          </span>
        </div>
      </AccordionSection>

      {/* PENGATURAN KEWAJIBAN */}
      <AccordionSection
        title="Pengaturan Kewajiban Administrasi"
        description="Tentukan dokumen yang harus dikumpulkan guru pada setiap periode."
        icon={Settings}
        color="purple"
        open={bagianTerbuka.pengaturan}
        onToggle={() => toggleBagian("pengaturan")}
        badge={`${totalWajib} Dokumen Wajib`}
      >
        <div className="ag-section ag-settings-section">
          <div className="ag-period-form">
            <div className="ag-period-field">
              <label>
                <CalendarDays size={16} />
                Tahun Ajaran
              </label>

              <input
                type="text"
                value={inputTahunAjaran}
                onChange={(e) => setInputTahunAjaran(e.target.value)}
                onBlur={() => {
                  const nilai = inputTahunAjaran.trim();

                  if (nilai && nilai !== tahunAjaran) {
                    setTahunAjaran(nilai);
                  }
                }}
                placeholder="Contoh: 2026/2027"
              />
            </div>

            <div className="ag-period-field">
              <label>Semester</label>

              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            <div className="ag-period-info">
              <span>Dokumen yang diwajibkan</span>
              <strong>{totalWajib} jenis</strong>
            </div>
          </div>

          <div className="ag-settings-instruction">
            Centang dokumen yang diwajibkan kepada guru pada periode
            ini. Kewajiban yang sama berlaku pada setiap penugasan
            mengajar guru, kecuali dokumen yang dikecualikan untuk
            guru tersebut.
          </div>

          <div className="ag-settings-grid">
            {kategoriAdministrasiGuru.map((kategori) => (
              <div className="ag-settings-category" key={kategori.id}>
                <div className="ag-settings-category-header">
                  <h3>{kategori.nama}</h3>
                  <span>
                    {kategori.dokumen.filter((dokumen) =>
                      kewajibanDokumen.includes(dokumen.id)
                    ).length}{" "}
                    dipilih
                  </span>
                </div>

                {kategori.dokumen.map((dokumen) => {
                  const terpilih = kewajibanDokumen.includes(
                    dokumen.id
                  );

                  return (
                    <label
                      className={`ag-obligation-item ${
                        terpilih ? "selected" : ""
                      }`}
                      key={dokumen.id}
                    >
                      <input
                        type="checkbox"
                        checked={terpilih}
                        onChange={() => toggleKewajiban(dokumen.id)}
                      />

                      <span className="ag-obligation-content">
                        <strong>{dokumen.nama}</strong>
                        <small>{dokumen.kewajibanDefault}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="ag-settings-footer">
            <div>
              {pesanSimpan && (
                <span className="ag-save-success">
                  <CheckCircle2 size={16} />
                  {pesanSimpan}
                </span>
              )}
            </div>

            <button
              type="button"
              className="ag-save-settings-btn"
              onClick={handleSimpanPengaturan}
              disabled={!inputTahunAjaran.trim()}
            >
              <Save size={16} />
              Simpan Pengaturan
            </button>
          </div>

          <div className="ag-period-archive">
            <strong>Arsip Pengaturan Periode</strong>
            <span>
              {daftarPengaturan.length} periode tersimpan
            </span>

            {daftarPengaturan.length > 0 && (
              <div className="ag-archive-list">
                {daftarPengaturan.map((item) => (
                  <div
                    className="ag-archive-item"
                    key={
                      item.id ||
                      `${item.tahunAjaran}-${item.semester}`
                    }
                  >
                    <span>
                      Tahun Ajaran {item.tahunAjaran} — Semester{" "}
                      {item.semester}
                    </span>
                    <small>
                      {item.kewajibanDokumen?.length || 0} dokumen wajib
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AccordionSection>

      {/* PENGECUALIAN */}
      <AccordionSection
        title="Pengecualian Administrasi Guru"
        description="Atur dokumen yang tidak diwajibkan kepada guru tertentu."
        icon={Users}
        color="orange"
        open={bagianTerbuka.pengecualian}
        onToggle={() => toggleBagian("pengecualian")}
        badge={`${pengecualianGuru.length} Guru`}
      >
        <div className="ag-section ag-exception-section">
          <div className="ag-exception-form">
            <div className="ag-exception-field">
              <label>Pilih Guru</label>

              <select
                value={guruPengecualianId}
                onChange={(e) =>
                  handlePilihGuruPengecualian(e.target.value)
                }
              >
                <option value="">-- Pilih Guru --</option>

                {guruAktif.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama}
                  </option>
                ))}
              </select>
            </div>

            {guruTerpilih && (
              <div className="ag-exception-teacher">
                <strong>{guruTerpilih.nama}</strong>
                <span>
                  {guruTerpilih.mataPelajaran ||
                    "Mata pelajaran belum diisi"}
                </span>
              </div>
            )}
          </div>

          {guruPengecualianId && (
            <>
              <div className="ag-exception-document-header">
                <strong>Dokumen yang Dikecualikan</strong>
                <span>
                  {dokumenDikecualikan.length} dokumen dipilih
                </span>
              </div>

              {dokumenWajib.length > 0 ? (
                <div className="ag-exception-list">
                  {dokumenWajib.map((dokumen) => (
                    <label
                      className={`ag-exception-item ${
                        dokumenDikecualikan.includes(dokumen.id)
                          ? "selected"
                          : ""
                      }`}
                      key={dokumen.id}
                    >
                      <input
                        type="checkbox"
                        checked={dokumenDikecualikan.includes(
                          dokumen.id
                        )}
                        onChange={() =>
                          toggleDokumenDikecualikan(dokumen.id)
                        }
                      />

                      <span>
                        <strong>{dokumen.nama}</strong>
                        <small>{dokumen.kategori}</small>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="ag-empty">
                  Belum ada dokumen wajib pada periode ini.
                  Atur kewajiban administrasi terlebih dahulu.
                </div>
              )}

              <div className="ag-exception-field ag-exception-note">
                <label>Alasan / Catatan Pengecualian</label>
                <textarea
                  rows="3"
                  value={catatanPengecualian}
                  onChange={(e) =>
                    setCatatanPengecualian(e.target.value)
                  }
                  placeholder="Tuliskan alasan pengecualian jika diperlukan..."
                />
              </div>

              <div className="ag-settings-footer">
                <div>
                  {pesanPengecualian && (
                    <span className="ag-save-success">
                      <CheckCircle2 size={16} />
                      {pesanPengecualian}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="ag-save-settings-btn"
                  onClick={handleSimpanPengecualian}
                >
                  <Save size={16} />
                  Simpan Pengecualian
                </button>
              </div>
            </>
          )}

          <div className="ag-period-archive">
            <strong>Daftar Pengecualian Periode Ini</strong>

            {pengecualianGuru.length === 0 ? (
              <span>Belum ada pengecualian untuk guru.</span>
            ) : (
              <div className="ag-archive-list">
                {pengecualianGuru.map((item) => {
                  const namaGuru =
                    guru.find(
                      (guruItem) =>
                        String(guruItem.id) === String(item.guruId)
                    )?.nama || "Guru tidak ditemukan";

                  return (
                    <div
                      className="ag-archive-item"
                      key={item.guruId}
                    >
                      <span>{namaGuru}</span>
                      <small>
                        {item.dokumenDikecualikan?.length || 0}{" "}
                        dokumen dikecualikan
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AccordionSection>

      {/* MASTER DOKUMEN */}
      <AccordionSection
        title="Master Jenis Administrasi"
        description="Referensi administrasi guru berdasarkan kategori dan ketentuan yang berlaku."
        icon={FileText}
        color="teal"
        open={bagianTerbuka.master}
        onToggle={() => toggleBagian("master")}
        badge={`${totalJenisAdministrasi} Jenis Dokumen`}
      >
        <div className="ag-master-section">
          <div className="ag-master-grid">
            {kategoriAdministrasiGuru.map((kategori) => (
              <div className="ag-master-card" key={kategori.id}>
                <h3>{kategori.nama}</h3>
                <p>{kategori.deskripsi}</p>

                <div className="ag-document-list">
                  {kategori.dokumen.map((dokumen) => (
                    <div
                      className="ag-document-item"
                      key={dokumen.id}
                    >
                      <div>
                        <strong>{dokumen.nama}</strong>
                        <small>{dokumen.kewajibanDefault}</small>
                      </div>
                      <span>Referensi</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* DAFTAR GURU */}
      <AccordionSection
        title="Daftar Guru"
        description="Pantau kelengkapan administrasi setiap guru dan penugasan mengajarnya."
        icon={Users}
        color="navy"
        open={bagianTerbuka.daftarGuru}
        onToggle={() => toggleBagian("daftarGuru")}
        badge={`${guruAktif.length} Guru Aktif`}
      >
        <div className="ag-section">
          <div className="ag-section-header">
            <div>
              <h2>Data Guru</h2>
              <p>
                Pilih guru untuk melihat administrasi berdasarkan
                setiap mata pelajaran dan rombongan belajar.
              </p>
            </div>

            <div className="ag-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Cari nama guru..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="ag-table-wrap">
            <table className="ag-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nama Guru</th>
                  <th>NIP</th>
                  <th>Penugasan Aktif</th>
                  <th>Progres Administrasi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredGuru.length > 0 ? (
                  filteredGuru.map((item, index) => {
                    const ringkasan = getRingkasanGuru(item.id);
                    const tugasGuru = getTugasGuru(item.id);

                    return (
                      <tr key={item.id || index}>
                        <td>{index + 1}</td>

                        <td className="ag-teacher-name">
                          {item.nama}
                        </td>

                        <td>{item.nip || "-"}</td>

                        <td>
                          {tugasGuru.length > 0
                            ? `${tugasGuru.length} penugasan`
                            : "Belum ada penugasan"}
                        </td>

                        <td>
                          {ringkasan.total > 0 ? (
                            <span>
                              {ringkasan.diterima}/
                              {ringkasan.total} dokumen
                              {" · "}
                              {ringkasan.progress}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td>
                          <span
                            className={`ag-status ${getStatusClass(
                              ringkasan.status
                            )}`}
                          >
                            {ringkasan.status}
                          </span>
                        </td>

                        <td>
                          <button
                            className="ag-detail-btn"
                            type="button"
                            title="Lihat administrasi guru"
                            onClick={() =>
                              handleBukaAdministrasiGuru(item.id)
                            }
                          >
                            <Eye size={15} />
                            Lihat
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="ag-empty">
                      {guruAktif.length === 0
                        ? "Belum ada data guru aktif."
                        : "Guru tidak ditemukan."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MODAL RINCIAN ADMINISTRASI */}
          {guruAdministrasiTerpilih && (
            <div
              className="ag-modal-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setGuruAdministrasiId("");
                  setTugasAdministrasiId("");
                }
              }}
            >
              <div
                className="ag-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Rincian Administrasi Guru"
              >
                <div className="ag-modal-header">
                  <div className="ag-detail-heading">
                    <span className="ag-detail-icon">
                      <FileText size={19} />
                    </span>

                    <div>
                      <h3>Rincian Administrasi Guru</h3>
                      <p>
                        {guruAdministrasiTerpilih.nama}
                        {" · "}
                        Tahun Ajaran {tahunAjaran}
                        {" · "}
                        Semester {semester}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ag-close-detail-btn"
                    onClick={() => {
                      setGuruAdministrasiId("");
                      setTugasAdministrasiId("");
                    }}
                    title="Tutup rincian guru"
                    aria-label="Tutup rincian guru"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="ag-modal-body">
                  {/* PILIH PENUGASAN */}
                  <div className="ag-assignment-section">
                    <div className="ag-assignment-heading">
                      <BookOpen size={18} />
                      <strong>Penugasan Mengajar</strong>
                    </div>

                    {tugasGuruTerpilih.length > 0 ? (
                      <div className="ag-assignment-list">
                        {tugasGuruTerpilih.map((tugas) => {
                          const info = getInfoTugas(tugas);
                          const ringkasan = getRingkasanPenugasan(
                            tugas.id,
                            guruAdministrasiId
                          );

                          const dipilih =
                            String(tugasAdministrasiId) ===
                            String(tugas.id);

                          return (
                            <button
                              type="button"
                              key={tugas.id}
                              className={`ag-assignment-card ${
                                dipilih ? "selected" : ""
                              }`}
                              onClick={() => {
                                setTugasAdministrasiId(tugas.id);
                                setPesanPengumpulan("");
                              }}
                            >
                              <span className="ag-assignment-card-title">
                                {info.mapel}
                              </span>

                              <span className="ag-assignment-card-subtitle">
                                Rombel {info.rombel}
                              </span>

                              <span className="ag-assignment-card-progress">
                                {ringkasan.diterima}/
                                {ringkasan.total} dokumen diterima
                                {" · "}
                                {ringkasan.progress}%
                              </span>

                              <span
                                className={`ag-status ${getStatusClass(
                                  ringkasan.status
                                )}`}
                              >
                                {ringkasan.status}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="ag-empty">
                        Guru ini belum memiliki penugasan mengajar aktif
                        pada periode yang dipilih.
                      </div>
                    )}
                  </div>

                  {/* DOKUMEN PENUGASAN TERPILIH */}
                  {tugasTerpilih && (
                    <div className="ag-document-monitor">
                      <div className="ag-assignment-detail-title">
                        <strong>
                          {getInfoTugas(tugasTerpilih).mapel}
                        </strong>
                        <span>
                          Rombel {getInfoTugas(tugasTerpilih).rombel}
                        </span>
                      </div>

                      {dokumenWajibGuruTerpilih.length > 0 ? (
                        dokumenWajibGuruTerpilih.map(
                          (dokumen, index) => {
                            const dataDokumen =
                              getStatusDokumenPenugasan(
                                tugasTerpilih.id,
                                dokumen.id
                              );

                            return (
                              <div
                                className="ag-monitor-item"
                                key={`${tugasTerpilih.id}-${dokumen.id}`}
                              >
                                <div className="ag-monitor-number">
                                  {index + 1}
                                </div>

                                <div className="ag-monitor-content">
                                  <div className="ag-monitor-title">
                                    <div>
                                      <strong>{dokumen.nama}</strong>
                                      <small>{dokumen.kategori}</small>
                                    </div>

                                    <span
                                      className={`ag-status ${getStatusClass(
                                        dataDokumen.status
                                      )}`}
                                    >
                                      {dataDokumen.status}
                                    </span>
                                  </div>

                                  <div className="ag-monitor-fields">
                                    <div className="ag-exception-field">
                                      <label>Status Dokumen</label>

                                      <select
                                        value={dataDokumen.status}
                                        onChange={(e) =>
                                          handleUbahStatusPenugasan(
                                            tugasTerpilih.id,
                                            guruAdministrasiId,
                                            dokumen.id,
                                            e.target.value
                                          )
                                        }
                                      >
                                        {statusAdministrasiGuru.map(
                                          (status) => (
                                            <option
                                              key={status}
                                              value={status}
                                            >
                                              {status}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>

                                    <div className="ag-exception-field">
                                      <label>
                                        Catatan Pemeriksaan / Revisi
                                      </label>

                                      <textarea
                                        rows="2"
                                        value={dataDokumen.catatan}
                                        onChange={(e) =>
                                          handleUbahCatatanPenugasan(
                                            tugasTerpilih.id,
                                            guruAdministrasiId,
                                            dokumen.id,
                                            e.target.value
                                          )
                                        }
                                        placeholder="Tambahkan catatan jika diperlukan..."
                                      />
                                    </div>
                                  </div>


{dataDokumen.fileName && (
  <div className="ag-document-card">
    <div className="ag-document-main">
      <div className="ag-document-icon">
        <FileText size={25} />
      </div>

      <div className="ag-document-info">
        <span className="ag-document-label">DOKUMEN TERKUMPUL</span>
        <strong className="ag-document-name">
          {dataDokumen.fileName}
        </strong>
        <small>Dokumen administrasi guru</small>
      </div>
    </div>

    <div className="ag-document-actions">
      <button
        type="button"
        className="ag-document-view"
        onClick={() =>
          bukaBerkasAdministrasi(dataDokumen.filePath, "view")
        }
        disabled={!dataDokumen.filePath}
      >
        <Eye size={16} />
        Lihat Dokumen
      </button>

      <button
        type="button"
        className="ag-document-download"
        onClick={() =>
          bukaBerkasAdministrasi(dataDokumen.filePath, "download")
        }
        disabled={!dataDokumen.filePath}
      >
        <FileText size={16} />
        Unduh Dokumen
      </button>
    </div>

    {Array.isArray(dataDokumen.riwayatRevisi) &&
      dataDokumen.riwayatRevisi.length > 0 && (
        <details className="ag-document-history">
          <summary>
            Riwayat Revisi
            <span>{dataDokumen.riwayatRevisi.length} berkas</span>
          </summary>

          <div className="ag-document-history-list">
            {[...dataDokumen.riwayatRevisi]
              .sort(
                (a, b) =>
                  Number(a.revision || 0) -
                  Number(b.revision || 0)
              )
              .map((revisi, index) => (
                <div
                  className="ag-document-history-item"
                  key={revisi.filePath || index}
                >
                  <div className="ag-document-history-info">
                    <FileText size={17} />
                    <span>
                      <strong>
                        Revisi {revisi.revision || index + 1}
                      </strong>
                      <small>{revisi.fileName}</small>
                    </span>
                  </div>

                  <div className="ag-document-history-actions">
                    <button
                      type="button"
                      onClick={() =>
                        bukaBerkasAdministrasi(revisi.filePath, "view")
                      }
                      disabled={!revisi.filePath}
                    >
                      Lihat
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        bukaBerkasAdministrasi(revisi.filePath, "download")
                      }
                      disabled={!revisi.filePath}
                    >
                      Unduh
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </details>
      )}
  </div>
)}

                                  {dataDokumen.tanggalKumpul && (
                                    <small className="ag-monitor-updated">
                                      Tanggal dikumpulkan:{" "}
                                      {formatTanggal(
                                        dataDokumen.tanggalKumpul
                                      )}
                                    </small>
                                  )}

                                  {dataDokumen.updatedAt && (
                                    <small className="ag-monitor-updated">
                                      Terakhir diperbarui:{" "}
                                      {new Date(
                                        dataDokumen.updatedAt
                                      ).toLocaleString("id-ID")}
                                    </small>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )
                      ) : (
                        <div className="ag-empty">
                          Belum ada dokumen wajib untuk guru ini pada
                          periode yang dipilih.
                        </div>
                      )}
                    </div>
                  )}

                  {/* DATA LAMA TETAP DIPERTAHANKAN */}
                  {dataLamaTerpilih &&
                    Array.isArray(dataLamaTerpilih.dokumen) &&
                    dataLamaTerpilih.dokumen.length > 0 && (
                      <div className="ag-legacy-section">
                        <div className="ag-legacy-heading">
                          <FileText size={18} />
                          <div>
                            <strong>
                              Data Administrasi Lama
                            </strong>
                            <small>
                              Data ini tersimpan dari sistem sebelumnya
                              dan belum terhubung dengan penugasan
                              mengajar tertentu.
                            </small>
                          </div>
                        </div>

                        {dataLamaTerpilih.dokumen.map(
                          (item, index) => {
                            const dokumen = semuaDokumen.find(
                              (data) =>
                                String(data.id) ===
                                String(item.dokumenId)
                            );

                            if (!dokumen) return null;

                            const dataStatus =
                              getStatusDokumenLama(
                                guruAdministrasiId,
                                dokumen.id
                              );

                            return (
                              <div
                                className="ag-monitor-item"
                                key={`legacy-${dokumen.id}`}
                              >
                                <div className="ag-monitor-number">
                                  {index + 1}
                                </div>

                                <div className="ag-monitor-content">
                                  <div className="ag-monitor-title">
                                    <div>
                                      <strong>{dokumen.nama}</strong>
                                      <small>
                                        {dokumen.kategori} · Data lama
                                      </small>
                                    </div>

                                    <span
                                      className={`ag-status ${getStatusClass(
                                        dataStatus.status
                                      )}`}
                                    >
                                      {dataStatus.status}
                                    </span>
                                  </div>

                                  <div className="ag-monitor-fields">
                                    <div className="ag-exception-field">
                                      <label>Status Dokumen Lama</label>
                                      <select
                                        value={dataStatus.status}
                                        onChange={(e) =>
                                          handleUbahStatusDokumenLama(
                                            guruAdministrasiId,
                                            dokumen.id,
                                            e.target.value
                                          )
                                        }
                                      >
                                        {statusAdministrasiGuru.map(
                                          (status) => (
                                            <option
                                              key={status}
                                              value={status}
                                            >
                                              {status}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>

                                    <div className="ag-exception-field">
                                      <label>Catatan</label>
                                      <textarea
                                        rows="2"
                                        value={dataStatus.catatan}
                                        onChange={(e) =>
                                          ubahDokumenLama(
                                            guruAdministrasiId,
                                            dokumen.id,
                                            {
                                              catatan: e.target.value,
                                            }
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                  <div className="ag-settings-footer">
                    <div>
                      {pesanPengumpulan && (
                        <span className="ag-save-success">
                          <CheckCircle2 size={16} />
                          {pesanPengumpulan}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="ag-save-settings-btn"
                      onClick={handleSimpanPengumpulan}
                    >
                      <Save size={16} />
                      Simpan Administrasi Guru
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AccordionSection>
    </div>
  );
}
