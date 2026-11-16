
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  Users,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  RefreshCw,
} from "lucide-react";

import "../styles/AdministrasiPembelajaranPage.css";
import { supabase } from "../lib/supabase";

import {
  kategoriAdministrasiGuru,
  statusAdministrasiGuru,
} from "../data/administrasiGuru";

import {
  getPengaturanAdministrasi,
  getPengaturanPeriode,
  getPengumpulanPerPenugasan,
  simpanPengaturanAdministrasi,
  perbaruiDokumenPenugasan,
} from "../utils/administrasiGuruStorage";

const KEYS = {
  guru: "simkur_data_guru",
  tugas: "simkur_data_tugas_mengajar",
  rombel: "simkur_data_rombel",
  mapel: "simkur_data_mata_pelajaran",
};

const STATUS_DEFAULT = "Belum Dikumpulkan";

function bacaData(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function aktif(item) {
  return item && item.status === "Aktif";
}

function namaRombel(item) {
  return (
    item?.namaRombel ||
    item?.nama ||
    item?.rombel ||
    item?.namaKelas ||
    item?.kelas ||
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
    "-"
  );
}

function tanggalHariIni() {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const tanggal = String(sekarang.getDate()).padStart(2, "0");
  return `${tahun}-${bulan}-${tanggal}`;
}

function formatTanggal(nilai) {
  if (!nilai) return "-";

  const tanggal = new Date(`${nilai}T00:00:00`);

  if (Number.isNaN(tanggal.getTime())) return nilai;

  return tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function warnaStatus(status) {
  if (status === "Diterima") return "#15803d";
  if (status === "Perlu Revisi") return "#dc2626";
  if (status === "Sedang Diperiksa") return "#2563eb";
  if (status === "Sudah Dikumpulkan") return "#0891b2";
  return "#64748b";
}

export default function AdministrasiPembelajaranPage({ userId }) {
  const [guru, setGuru] = useState(() => bacaData(KEYS.guru));
  const [tugas, setTugas] = useState(() => bacaData(KEYS.tugas));
  const [rombel, setRombel] = useState(() => bacaData(KEYS.rombel));
  const [mapel, setMapel] = useState(() => bacaData(KEYS.mapel));

  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [semester, setSemester] = useState("Ganjil");
  const [guruId, setGuruId] = useState("");
  const [mappingLoading, setMappingLoading] = useState(true);
  const [mappingError, setMappingError] = useState("");
  const [sekolahId, setSekolahId] = useState("");
  const [tugasId, setTugasId] = useState("");

  const [kewajibanDokumen, setKewajibanDokumen] = useState([]);
  const [pengecualianGuru, setPengecualianGuru] = useState([]);
  const [pengumpulanGuru, setPengumpulanGuru] = useState([]);

  const [catatanGuru, setCatatanGuru] = useState({});
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [sedangUnggah, setSedangUnggah] = useState("");
  useEffect(() => {
  let aktif = true;

  async function muatRelasiGuru() {
    setMappingLoading(true);
    setMappingError("");
    setGuruId("");
    setSekolahId("");

    if (!userId) {
      setMappingError("ID akun pengguna tidak ditemukan.");
      setMappingLoading(false);
      return;
    }

    const { data: relasi, error } = await supabase
      .from("relasi_akun_guru")
      .select("guru_id, sekolah_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!aktif) return;

    if (error) {
      setMappingError(
        "Gagal membaca relasi akun Guru: " + error.message
      );
    } else if (!relasi) {
      setMappingError(
        "Akun Guru belum terhubung dengan profil Guru."
      );
    } else {
      setGuruId(String(relasi.guru_id));
      setSekolahId(String(relasi.sekolah_id));
    }

    setMappingLoading(false);
  }

  muatRelasiGuru();

  return () => {
    aktif = false;
  };
}, [userId]);

  const muatReferensi = useCallback(() => {
    setGuru(bacaData(KEYS.guru));
    setTugas(bacaData(KEYS.tugas));
    setRombel(bacaData(KEYS.rombel));
    setMapel(bacaData(KEYS.mapel));
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (
        !event.key ||
        Object.values(KEYS).includes(event.key)
      ) {
        muatReferensi();
      }
    };

    const handleFocus = () => muatReferensi();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("simkur_guru_updated", muatReferensi);
    window.addEventListener(
      "simkur_tugas_mengajar_updated",
      muatReferensi
    );
    window.addEventListener("simkur_rombel_updated", muatReferensi);
    window.addEventListener("simkur_mapel_updated", muatReferensi);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("simkur_guru_updated", muatReferensi);
      window.removeEventListener(
        "simkur_tugas_mengajar_updated",
        muatReferensi
      );
      window.removeEventListener(
        "simkur_rombel_updated",
        muatReferensi
      );
      window.removeEventListener(
        "simkur_mapel_updated",
        muatReferensi
      );
    };
  }, [muatReferensi]);

  const guruAktif = useMemo(
    () => guru.filter(aktif),
    [guru]
  );

  const guruTerpilih = guruAktif.find(
    (item) => String(item.id) === String(guruId)
  );

  const pengaturanPeriode = getPengaturanPeriode(
    tahunAjaran,
    semester
  );

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

    setTugasId("");
    setCatatanGuru({});
    setPesan("");
  }, [tahunAjaran, semester]);

  const tugasAktifPeriode = useMemo(() => {
    return tugas.filter((item) => {
      if (
        String(item.tahunAjaran) !== String(tahunAjaran) ||
        item.semester !== semester ||
        item.status !== "Aktif"
      ) {
        return false;
      }

      const dataGuru = guru.find(
        (data) => String(data.id) === String(item.guruId)
      );

      const dataRombel = rombel.find(
        (data) => String(data.id) === String(item.rombelId)
      );

      const dataMapel = mapel.find(
        (data) => String(data.id) === String(item.mapelId)
      );

      return (
        aktif(dataGuru) &&
        aktif(dataRombel) &&
        aktif(dataMapel)
      );
    });
  }, [tugas, guru, rombel, mapel, tahunAjaran, semester]);

  const tugasGuru = tugasAktifPeriode.filter(
    (item) => String(item.guruId) === String(guruId)
  );

  const pengecualianTerpilih = pengecualianGuru.find(
    (item) => String(item.guruId) === String(guruId)
  );

  const dokumenDikecualikan =
    pengecualianTerpilih?.dokumenDikecualikan || [];

  const semuaDokumen = useMemo(
    () =>
      kategoriAdministrasiGuru.flatMap((kategori) =>
        kategori.dokumen.map((dokumen) => ({
          ...dokumen,
          kategori: kategori.nama,
        }))
      ),
    []
  );

  const dokumenWajib = semuaDokumen.filter(
    (dokumen) =>
      kewajibanDokumen.includes(dokumen.id) &&
      !dokumenDikecualikan.includes(dokumen.id)
  );

  const tugasTerpilih = tugasGuru.find(
    (item) => String(item.id) === String(tugasId)
  );

  const rombelTerpilih = rombel.find(
    (item) =>
      String(item.id) === String(tugasTerpilih?.rombelId)
  );

  const mapelTerpilih = mapel.find(
    (item) =>
      String(item.id) === String(tugasTerpilih?.mapelId)
  );

  const pengumpulanTerpilih = tugasTerpilih
    ? getPengumpulanPerPenugasan(
        pengumpulanGuru,
        tugasTerpilih.id
      )
    : null;

  function getDokumen(dokumenId) {
    return (
      pengumpulanTerpilih?.dokumen?.find(
        (item) => String(item.dokumenId) === String(dokumenId)
      ) || {
        dokumenId,
        status: STATUS_DEFAULT,
        catatan: "",
        catatanGuru: "",
        tanggalKumpul: "",
      }
    );
  }

  const jumlahSudahDikumpulkan = dokumenWajib.filter(
    (dokumen) => {
      const status = getDokumen(dokumen.id).status;
      return [
        "Sudah Dikumpulkan",
        "Sedang Diperiksa",
        "Diterima",
      ].includes(status);
    }
  ).length;

  const jumlahDiterima = dokumenWajib.filter(
    (dokumen) => getDokumen(dokumen.id).status === "Diterima"
  ).length;

  function simpanDokumen(dokumenId, perubahan) {
    if (!tugasTerpilih || !guruTerpilih) return;

    const dataBaru = perbaruiDokumenPenugasan(
      pengumpulanGuru,
      {
        tugasMengajarId: tugasTerpilih.id,
        guruId: tugasTerpilih.guruId,
        rombelId: tugasTerpilih.rombelId,
        mapelId: tugasTerpilih.mapelId,
        tahunAjaran: tugasTerpilih.tahunAjaran,
        semester: tugasTerpilih.semester,
      },
      {
        dokumenId,
        ...perubahan,
      }
    );

    try {
      const hasil = simpanPengaturanAdministrasi({
        tahunAjaran,
        semester,
        kewajibanDokumen,
        pengecualianGuru,
        pengumpulanGuru: dataBaru,
      });

      setPengumpulanGuru(dataBaru);

      const pengaturanBaru = hasil.find(
        (item) =>
          item.tahunAjaran === tahunAjaran &&
          item.semester === semester
      );

      if (pengaturanBaru) {
        setPengumpulanGuru(
          pengaturanBaru.pengumpulanGuru || dataBaru
        );
      }

      setPesan("Perubahan berhasil disimpan.");
    } catch (error) {
      console.error("Gagal menyimpan administrasi:", error);
      setPesan("Gagal menyimpan perubahan. Silakan coba kembali.");
    }
  }

  async function unggahDokumen(file, dokumenId) {
  if (!file) return;

  if (
    !userId ||
    !guruId ||
    !sekolahId ||
    !tugasTerpilih ||
    !guruTerpilih
  ) {
    setPesan("Identitas akun, Guru, atau penugasan belum terverifikasi.");
    return;
  }

  if (String(tugasTerpilih.guruId) !== String(guruId)) {
    setPesan("Penugasan ini bukan milik akun Guru yang login.");
    return;
  }

  const mimeMap = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  const extension = file.name.split(".").pop().toLowerCase();

  if (!mimeMap[extension]) {
    setPesan("Format berkas harus PDF, DOC, DOCX, XLS, atau XLSX.");
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    setPesan("Ukuran berkas maksimal 20 MB.");
    return;
  }

  const safeName = file.name
    .replace(/[^\w.-]/g, "_")
    .slice(-120);

  const uniqueName =
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;

  const objectPath = [
    sekolahId,
    guruId,
    tugasTerpilih.id,
    dokumenId,
    uniqueName,
  ].join("/");

  const uploadedAt = new Date().toISOString();
  const recordId = `${tugasTerpilih.id}:${dokumenId}`;

  setSedangUnggah(dokumenId);
  setPesan("");

  try {
    // 1. Unggah berkas ke bucket privat
    const { error: uploadError } = await supabase.storage
      .from("administrasi-pembelajaran")
      .upload(objectPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: mimeMap[extension],
      });

    if (uploadError) {
      throw uploadError;
    }

    // 2. Baca metadata dokumen sebelumnya
    const { data: existing, error: readError } = await supabase
      .from("data_akademik_sekolah")
      .select("id, payload")
      .eq("sekolah_id", sekolahId)
      .eq("jenis_data", "administrasi_guru")
      .eq("record_id", recordId)
      .maybeSingle();

    if (readError) {
      throw new Error(
        "Berkas berhasil diunggah, tetapi metadata gagal dibaca: " +
          readError.message +
          ". Lokasi berkas: " +
          objectPath
      );
    }

    // 3. Pertahankan riwayat revisi sebelumnya
    const oldPayload = existing?.payload || {};

    const oldHistory = Array.isArray(oldPayload.riwayatRevisi)
      ? oldPayload.riwayatRevisi
      : oldPayload.filePath
        ? [{
            fileName: oldPayload.fileName,
            filePath: oldPayload.filePath,
            uploadedAt: oldPayload.uploadedAt || null,
          }]
        : [];

    const revisionNumber = oldHistory.length + 1;

    const newRevision = {
      revision: revisionNumber,
      fileName: file.name,
      filePath: objectPath,
      mimeType: mimeMap[extension],
      fileSize: file.size,
      uploadedAt,
    };

    const payload = {
      ...oldPayload,
      dokumenId,
      dokumenNama:
        semuaDokumen.find((item) => item.id === dokumenId)?.nama ||
        dokumenId,
      tugasMengajarId: tugasTerpilih.id,
      tahunAjaran,
      semester,
      status: STATUS_DEFAULT,
      tanggalKumpul: "",
      fileName: file.name,
      filePath: objectPath,
      mimeType: mimeMap[extension],
      fileSize: file.size,
      uploadedAt,
      revisionNumber,
      riwayatRevisi: [...oldHistory, newRevision],
    };

    // 4. Simpan metadata di Supabase
    if (existing) {
      const { error: saveError } = await supabase
        .from("data_akademik_sekolah")
        .update({
          payload,
          updated_by: userId,
          updated_at: uploadedAt,
        })
        .eq("id", existing.id);

      if (saveError) throw saveError;
    } else {
      const { error: saveError } = await supabase
        .from("data_akademik_sekolah")
        .insert({
          sekolah_id: sekolahId,
          jenis_data: "administrasi_guru",
          record_id: recordId,
          guru_id: guruId,
          akses_guru_ids: [],
          payload,
          created_by: userId,
          updated_by: userId,
        });

      if (saveError) throw saveError;
    }

    // 5. Pertahankan kompatibilitas tampilan administrasi lama
    const dataLama = getDokumen(dokumenId);

    const riwayatLokal = Array.isArray(dataLama.riwayatRevisi)
      ? dataLama.riwayatRevisi
      : dataLama.filePath
        ? [{
            fileName: dataLama.fileName,
            filePath: dataLama.filePath,
          }]
        : [];

    simpanDokumen(dokumenId, {
      fileName: file.name,
      filePath: objectPath,
      fileUrl: "",
      fileSize: file.size,
      mimeType: mimeMap[extension],
      uploadedAt,
      revisionNumber,
      riwayatRevisi: [...riwayatLokal, newRevision],
      status: STATUS_DEFAULT,
      tanggalKumpul: "",
    });

    setPesan(
    `Berkas berhasil diunggah sebagai Revisi ke-${revisionNumber}. Status masih Belum Dikumpulkan. Silakan klik Konfirmasi Pengumpulan.`
    );
  } catch (error) {
    console.error("Gagal mengunggah dokumen:", error);
    setPesan("Gagal mengunggah dokumen: " + error.message);
  } finally {
    setSedangUnggah("");
  }
}
  
  async function konfirmasiPengumpulan(dokumenId) {
  const dataLama = getDokumen(dokumenId);

  if (!dataLama.filePath) {
    setPesan("Silakan unggah dokumen terlebih dahulu.");
    return;
  }

  if (
    ["Sudah Dikumpulkan", "Sedang Diperiksa", "Diterima"]
      .includes(dataLama.status)
  ) {
    setPesan(
      dataLama.status === "Sudah Dikumpulkan"
        ? "Dokumen sudah dikonfirmasi dan menunggu pemeriksaan Wakasek."
        : "Dokumen sedang dalam proses pemeriksaan atau sudah diterima."
    );
    return;
  }

  const tanggal = tanggalHariIni();
  const recordId = `${tugasTerpilih.id}:${dokumenId}`;

  try {
    const { data: existing, error: readError } = await supabase
      .from("data_akademik_sekolah")
      .select("id, payload")
      .eq("sekolah_id", sekolahId)
      .eq("jenis_data", "administrasi_guru")
      .eq("record_id", recordId)
      .maybeSingle();

    if (readError) throw readError;

    if (!existing) {
      throw new Error("Metadata dokumen tidak ditemukan di Supabase.");
    }

    const catatan =
      catatanGuru[dokumenId] ??
      dataLama.catatanGuru ??
      "";

    const payloadBaru = {
      ...existing.payload,
      status: "Sudah Dikumpulkan",
      tanggalKumpul: tanggal,
      catatanGuru: catatan,
      submittedAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("data_akademik_sekolah")
      .update({
        payload: payloadBaru,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) throw updateError;

    simpanDokumen(dokumenId, {
      status: "Sudah Dikumpulkan",
      tanggalKumpul: tanggal,
      catatanGuru: catatan,
    });

    setPesan("");

    window.alert(
      "Berhasil! Dokumen telah dikonfirmasi dan dikirim untuk pemeriksaan Wakasek."
    );
  } catch (error) {
    console.error("Gagal mengonfirmasi dokumen:", error);
    setPesan(
      "Konfirmasi gagal disimpan: " + error.message
    );
  }
}

  function simpanCatatan(dokumenId) {
    const dataLama = getDokumen(dokumenId);

    simpanDokumen(dokumenId, {
      catatanGuru: catatanGuru[dokumenId] ?? dataLama.catatanGuru ?? "",
    });
  }

  function pilihGuru(nilai) {
    setGuruId(nilai);
    setTugasId("");
    setCatatanGuru({});
    setPesan("");
  }

  const statusRingkasan =
    dokumenWajib.length === 0
      ? "Belum Ada Pengaturan"
      : jumlahDiterima === dokumenWajib.length
        ? "Lengkap"
        : jumlahSudahDikumpulkan > 0
          ? "Dalam Proses"
          : "Belum Dikumpulkan";

  return (
    <main className="ap-page">
      <header className="ap-header">
        <div className="ap-header-icon">
          <BookOpen size={27} />
        </div>
        <div>
          <h1>Administrasi Pembelajaran</h1>
          <p>
            Pengelolaan dan pemantauan dokumen administrasi pembelajaran Guru.
          </p>
        </div>
      </header>

      <section className="ap-panel">
        <div className="ap-panel-title">
          <CalendarDays size={20} />
          <h2>Periode Administrasi</h2>
        </div>

        <div className="ap-filter-grid">
          <label>
            Tahun Ajaran
            <input
              value={tahunAjaran}
              onChange={(event) => setTahunAjaran(event.target.value)}
              placeholder="Contoh: 2026/2027"
            />
          </label>

          <label>
            Semester
            <select
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </label>
        </div>
      </section>

      <section className="ap-panel">
        <div className="ap-panel-title">
          <Users size={20} />
          <h2>Identitas Guru</h2>
        </div>

        {mappingLoading ? (
  <div className="ap-empty">
    Memverifikasi identitas akun Guru...
  </div>
) : mappingError ? (
  <div className="ap-empty">
    {mappingError}
  </div>
) : guruTerpilih ? (
  <div className="ap-identity">
    <strong>
      {guruTerpilih.nama || guruTerpilih.namaGuru}
    </strong>
    <span>
      NIP: {guruTerpilih.nip || guruTerpilih.NIP || "-"}
    </span>
    <small>Identitas terhubung otomatis dengan akun login.</small>
  </div>
) : (
  <div className="ap-empty">
    Profil Guru dari relasi akun tidak ditemukan pada data perangkat ini.
  </div>
)}
      </section>

      {guruId && (
        <>
          <section className="ap-summary-grid">
            <article className="ap-summary-card">
              <span>Dokumen Wajib</span>
              <strong>{dokumenWajib.length}</strong>
            </article>
            <article className="ap-summary-card">
              <span>Sudah Dikumpulkan</span>
              <strong>{jumlahSudahDikumpulkan}</strong>
            </article>
            <article className="ap-summary-card">
              <span>Sudah Diterima</span>
              <strong>{jumlahDiterima}</strong>
            </article>
            <article className="ap-summary-card">
              <span>Status Administrasi</span>
              <strong className="ap-summary-status">
                {statusRingkasan}
              </strong>
            </article>
          </section>

          <section className="ap-panel">
            <div className="ap-panel-title">
              <ClipboardList size={20} />
              <h2>Penugasan Mengajar</h2>
            </div>

            {tugasGuru.length === 0 ? (
              <div className="ap-empty">
                <AlertCircle size={22} />
                <p>
                  Belum ada penugasan mengajar aktif untuk Guru ini pada
                  periode {tahunAjaran} semester {semester}.
                </p>
              </div>
            ) : (
              <>
                <label className="ap-full-label">
                  Pilih Penugasan
                  <select
                    value={tugasId}
                    onChange={(event) => {
                      setTugasId(event.target.value);
                      setPesan("");
                    }}
                  >
                    <option value="">-- Pilih kelas dan mata pelajaran --</option>
                    {tugasGuru.map((item) => {
                      const dataRombel = rombel.find(
                        (data) => String(data.id) === String(item.rombelId)
                      );
                      const dataMapel = mapel.find(
                        (data) => String(data.id) === String(item.mapelId)
                      );

                      return (
                        <option key={item.id} value={item.id}>
                          {namaRombel(dataRombel)} — {namaMapel(dataMapel)}
                        </option>
                      );
                    })}
                  </select>
                </label>

                {tugasTerpilih && (
                  <div className="ap-assignment-info">
                    <div>
                      <span>Rombongan Belajar</span>
                      <strong>{namaRombel(rombelTerpilih)}</strong>
                    </div>
                    <div>
                      <span>Mata Pelajaran</span>
                      <strong>{namaMapel(mapelTerpilih)}</strong>
                    </div>
                    <div>
                      <span>Jam Pelajaran per Minggu</span>
                      <strong>{tugasTerpilih.jpPerMinggu || 0} JP</strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {tugasTerpilih && (
            <section className="ap-panel">
              <div className="ap-panel-title">
                <FileText size={20} />
                <h2>Dokumen Administrasi Pembelajaran</h2>
              </div>

              {dokumenWajib.length === 0 ? (
                <div className="ap-empty">
                  <AlertCircle size={22} />
                  <p>
                    Belum ada dokumen wajib yang ditetapkan Wakasek
                    untuk periode ini, atau seluruh dokumen Guru ini
                    mendapat pengecualian.
                  </p>
                </div>
              ) : (
                kategoriAdministrasiGuru.map((kategori) => {
                  const dokumenKategori = dokumenWajib.filter(
                    (dokumen) =>
                      kategori.dokumen.some(
                        (item) => item.id === dokumen.id
                      )
                  );

                  if (dokumenKategori.length === 0) return null;

                  return (
                    <div className="ap-category" key={kategori.id}>
                      <h3>{kategori.nama}</h3>

                      {dokumenKategori.map((dokumen) => {
                        const data = getDokumen(dokumen.id);
                        const status = data.status || STATUS_DEFAULT;
                        const dapatDikonfirmasi =
                          Boolean(data.filePath) &&
                          ![
                            "Sudah Dikumpulkan",
                            "Sedang Diperiksa",
                            "Diterima",
                          ].includes(status);

                        return (
                          <article className="ap-document" key={dokumen.id}>
                            <div className="ap-document-heading">
                              <div className="ap-document-icon">
                                <FileText size={19} />
                              </div>
                              <div className="ap-document-name">
                                <strong>{dokumen.nama}</strong>
                                {dokumen.keterangan && (
                                  <small>{dokumen.keterangan}</small>
                                )}
                              </div>
                              <span
                                className="ap-status"
                                style={{
                                  color: warnaStatus(status),
                                  backgroundColor: `${warnaStatus(status)}14`,
                                }}
                              >
                                {status}
                              </span>
                            </div>

                            <div className="ap-document-meta">
                              <span>
                                Tanggal pengumpulan:{" "}
                                {formatTanggal(data.tanggalKumpul)}
                              </span>
                              {data.fileName && (
                                <span>Nama berkas: {data.fileName}</span>
                              )}
                            </div>

                            {data.catatan && (
                              <div className="ap-review-note">
                                <strong>Catatan Wakasek:</strong>
                                <p>{data.catatan}</p>
                              </div>
                            )}

                            <label className="ap-full-label ap-note-label">
                              Catatan Guru
                              <textarea
                                rows={2}
                                value={
                                  catatanGuru[dokumen.id] ??
                                  data.catatanGuru ??
                                  ""
                                }
                                onChange={(event) =>
                                  setCatatanGuru((sebelumnya) => ({
                                    ...sebelumnya,
                                    [dokumen.id]: event.target.value,
                                  }))
                                }
                                placeholder="Tambahkan keterangan jika diperlukan..."
                              />
                            </label>

                            <div className="ap-document-actions">
                              <label className="ap-button ap-button-primary">
  <FileText size={16} />
  {sedangUnggah === dokumen.id
    ? "Mengunggah..."
    : data.fileName
      ? "Unggah Revisi"
      : "Unggah Berkas"}

  <input
    type="file"
    hidden
    accept=".pdf,.doc,.docx,.xls,.xlsx"
    disabled={
      sedangUnggah === dokumen.id ||
      mappingLoading ||
      Boolean(mappingError)
    }
    onChange={(event) => {
      const file = event.target.files?.[0];

      if (file) {
        unggahDokumen(file, dokumen.id);
      }

      event.target.value = "";
    }}
  />
</label>
                              <button
                                type="button"
                                className="ap-button ap-button-secondary"
                                onClick={() => simpanCatatan(dokumen.id)}
                              >
                                <Save size={16} />
                                Simpan Catatan
                              </button>

                              {dapatDikonfirmasi && (
                                <button
                                  type="button"
                                  className="ap-button ap-button-primary"
                                  onClick={() =>
                                    konfirmasiPengumpulan(dokumen.id)
                                  }
                                >
                                  <CheckCircle2 size={16} />
                                  Konfirmasi Pengumpulan
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  );
                })
              )}

              <div className="ap-upload-notice">
  <AlertCircle size={19} />
  <p>
    Unggah dokumen melalui tombol Unggah Berkas.
    Format yang didukung: PDF, DOC, DOCX, XLS, dan XLSX,
    maksimal 20 MB. Berkas disiapkan untuk disimpan
    secara privat di Supabase. Setiap revisi akan
    dicatat tanpa menimpa berkas sebelumnya.
  </p>
</div>

              {pesan && (
                <div className="ap-message" role="status">
                  {pesan}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <footer className="ap-footer">
        <RefreshCw size={15} />
        Data administrasi terhubung dengan pengaturan Wakasek Kurikulum.
      </footer>
    </main>
  );
}
