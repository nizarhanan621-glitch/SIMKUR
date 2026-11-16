
const STORAGE_KEY = "simkur_kurikulum_sekolah";

const DATA_KURIKULUM_DEFAULT = {
  namaKurikulum: "Kurikulum Merdeka",
  tahunMulaiPenerapan: "",
  pendekatanPembelajaran: "Pembelajaran Mendalam",
  status: "Aktif",

  // Pengaturan kurikulum dapat berbeda untuk setiap tingkat kelas.
  kurikulumPerKelas: {
    VII: "Kurikulum Merdeka",
    VIII: "Kurikulum Merdeka",
    IX: "Kurikulum Merdeka",
  },

  keterangan: "",
};

export function getKurikulumSekolah() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {
        ...DATA_KURIKULUM_DEFAULT,
        kurikulumPerKelas: {
          ...DATA_KURIKULUM_DEFAULT.kurikulumPerKelas,
        },
      };
    }

    return {
      ...DATA_KURIKULUM_DEFAULT,
      ...data,
      kurikulumPerKelas: {
        ...DATA_KURIKULUM_DEFAULT.kurikulumPerKelas,
        ...(data.kurikulumPerKelas || {}),
      },
    };
  } catch {
    return {
      ...DATA_KURIKULUM_DEFAULT,
      kurikulumPerKelas: {
        ...DATA_KURIKULUM_DEFAULT.kurikulumPerKelas,
      },
    };
  }
}

export function simpanKurikulumSekolah(dataKurikulum) {
  try {
    const data = {
      ...DATA_KURIKULUM_DEFAULT,
      ...dataKurikulum,
      kurikulumPerKelas: {
        ...DATA_KURIKULUM_DEFAULT.kurikulumPerKelas,
        ...(dataKurikulum.kurikulumPerKelas || {}),
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    window.dispatchEvent(
      new Event("simkur-kurikulum-sekolah-updated")
    );

    return true;
  } catch (error) {
    console.error("Gagal menyimpan kurikulum sekolah:", error);
    return false;
  }
}
