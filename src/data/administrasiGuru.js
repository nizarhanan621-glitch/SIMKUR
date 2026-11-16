
export const kategoriAdministrasiGuru = [
  {
    id: "perencanaan",
    nama: "Perencanaan Pembelajaran",
    deskripsi: "Dokumen perencanaan kegiatan pembelajaran.",
    dokumen: [
      {
        id: "atp",
        nama: "Alur Tujuan Pembelajaran (ATP)",
        pilihan: false,
        kurikulum: ["Merdeka"],
        kewajibanDefault: "Sesuai kurikulum",
      },
      {
        id: "rpp_modul",
        nama: "RPP / Modul Ajar",
        pilihan: true,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Sesuai kurikulum",
        keterangan: "Guru menggunakan bentuk perencanaan yang sesuai dengan kurikulum sekolah.",
      },
      {
        id: "prota",
        nama: "Program Tahunan",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Kebijakan sekolah",
      },
      {
        id: "promes",
        nama: "Program Semester",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Kebijakan sekolah",
      },
    ],
  },
  {
    id: "pelaksanaan",
    nama: "Pelaksanaan Pembelajaran",
    deskripsi: "Bukti dan catatan pelaksanaan kegiatan pembelajaran.",
    dokumen: [
      {
        id: "jurnal_mengajar",
        nama: "Jurnal Mengajar",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Kebijakan sekolah",
      },
      {
        id: "daftar_hadir",
        nama: "Daftar Kehadiran Peserta Didik",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Kebijakan sekolah",
      },
      {
        id: "bukti_pembelajaran",
        nama: "Bukti Pelaksanaan Pembelajaran",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Kebijakan sekolah",
      },
    ],
  },
  {
    id: "asesmen",
    nama: "Asesmen dan Penilaian",
    deskripsi: "Perencanaan, pelaksanaan, dan pengolahan hasil asesmen.",
    dokumen: [
      {
        id: "instrumen_asesmen",
        nama: "Instrumen Asesmen",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Sesuai kebutuhan pembelajaran",
      },
      {
        id: "hasil_asesmen",
        nama: "Pengolahan Hasil Asesmen",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Sesuai kebutuhan pembelajaran",
      },
      {
        id: "tindak_lanjut",
        nama: "Tindak Lanjut Hasil Asesmen",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Sesuai kebutuhan pembelajaran",
        keterangan: "Termasuk remedial atau pengayaan apabila diperlukan.",
      },
      {
        id: "daftar_nilai",
        nama: "Rekapitulasi Hasil Belajar",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Kebijakan sekolah",
      },
    ],
  },
  {
    id: "pengembangan",
    nama: "Pengembangan dan Tugas Tambahan",
    deskripsi: "Dokumen pendukung sesuai penugasan dan pengembangan profesional guru.",
    dokumen: [
      {
        id: "tugas_tambahan",
        nama: "Dokumen Tugas Tambahan",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Jika mendapat penugasan",
      },
      {
        id: "pengembangan_kompetensi",
        nama: "Bukti Pengembangan Kompetensi",
        pilihan: false,
        kurikulum: ["Merdeka", "K13", "Lainnya"],
        kewajibanDefault: "Sesuai program sekolah",
      },
    ],
  },
];

export const statusAdministrasiGuru = [
  "Belum Dikumpulkan",
  "Sudah Dikumpulkan",
  "Sedang Diperiksa",
  "Perlu Revisi",
  "Diterima",
];
