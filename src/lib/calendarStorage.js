
/* ==========================================
   SIMKUR SMP
   CALENDAR DATA SERVICE
   ==========================================

   Penyimpanan sementara menggunakan localStorage.
   Nantinya akan dipindahkan ke Supabase agar
   dapat digunakan bersama oleh seluruh dashboard.
*/

const REFERENCE_KEY = "simkur_reference_calendar_v1";
const ACADEMIC_KEY = "simkur_academic_calendar_v1";

function readStorage(key) {
  try {
    const value = localStorage.getItem(key);

    if (!value) return [];

    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gagal membaca data kalender:", error);
    return [];
  }
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));

    window.dispatchEvent(
      new CustomEvent("simkur-calendar-updated")
    );

    return true;
  } catch (error) {
    console.error("Gagal menyimpan data kalender:", error);
    return false;
  }
}

/* ==========================================
   DATA REFERENSI DINAS
   ========================================== */

export function loadReferenceCalendarItems() {
  return readStorage(REFERENCE_KEY);
}

export function saveReferenceCalendarItems(items) {
  return writeStorage(REFERENCE_KEY, items);
}

/* ==========================================
   DATA KALENDER AKADEMIK SEKOLAH
   ========================================== */

export function loadAcademicCalendarEvents() {
  return readStorage(ACADEMIC_KEY);
}

export function saveAcademicCalendarEvents(events) {
  return writeStorage(ACADEMIC_KEY, events);
}

/* ==========================================
   PEMETAAN KATEGORI KALDIK
   ========================================== */

export const calendarCategoryMap = {
  "Pembelajaran Efektif": "kbm",
  "Awal/Akhir Semester": "semester",
  "Libur Nasional": "libur_nasional",
  "Cuti Bersama": "cuti_bersama",
  "Libur Sekolah": "libur_sekolah",
  "Libur Daerah": "libur_daerah",
  "Asesmen": "asesmen",
  "Kegiatan Dinas": "kegiatan_dinas",
  "Kegiatan Sekolah": "kegiatan_sekolah",
  "Hari Penting Pendidikan": "hari_penting",
  "Lainnya": "lainnya",
};

/* ==========================================
   TERUSKAN DATA REFERENSI KE KALENDER SEKOLAH
   ========================================== */

export function publishReferenceCalendarItem(item) {

  // Pastikan data tersedia
  if (!item) {
    return {
      success: false,
      message: "Data kalender tidak ditemukan.",
    };
  }

  // Pengaman: kegiatan yang ditolak tidak boleh diteruskan
  if (item.verificationStatus === "rejected") {
    return {
      success: false,
      message: "Kegiatan ini telah ditolak dan tidak dapat diteruskan ke Kalender Akademik.",
    };
  }

  // Validasi kelengkapan data
  if (
    !item.id ||
    !item.title ||
    !item.title.trim() ||
    !item.startDate ||
    !item.endDate
  ) {
    return {
      success: false,
      message: "Data kalender belum lengkap.",
    };
  }

  // Validasi rentang tanggal
  if (item.endDate < item.startDate) {
    return {
      success: false,
      message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
    };
  }

  const events = loadAcademicCalendarEvents();

  // Periksa apakah kegiatan sudah pernah diteruskan
  const existingIndex = events.findIndex(
    (event) => event.referenceId === item.id
  );

  const newEvent = {
    id:
      existingIndex >= 0
        ? events[existingIndex].id
        : `kaldik-${item.id}`,

    referenceId: item.id,

    title: item.title.trim(),

    category:
      calendarCategoryMap[item.category] || "lainnya",

    startDate: item.startDate,

    endDate: item.endDate,

    date: item.startDate,

    time: "Sepanjang hari",

    location: "Mengacu pada Kalender Pendidikan Dinas",

    description: item.description || "",

    source: "Kalender Pendidikan Dinas",

    academicYear: item.academicYear || "2026/2027",

    status: "draft",
  };

  // Perbarui kegiatan yang sudah ada atau tambahkan kegiatan baru
  if (existingIndex >= 0) {
    events[existingIndex] = newEvent;
  } else {
    events.push(newEvent);
  }

  const saved = saveAcademicCalendarEvents(events);

  return {
    success: saved,
    message: saved
      ? existingIndex >= 0
        ? "Data Kalender Akademik berhasil diperbarui."
        : "Berhasil diteruskan ke Kalender Akademik sebagai draft."
      : "Gagal menyimpan data kalender.",
  };
}
