const STORAGE_KEY = "simkur_data_sekolah";

const DATA_SEKOLAH_DEFAULT = {
  npsn: "",
  namaSekolah: "",
  jenjang: "SMP",
  statusSekolah: "Negeri",
  alamatJalan: "",
  kelurahan: "",
  kecamatan: "",
  kabupatenKota: "",
  provinsi: "",
  kodePos: "",
  telepon: "",
  email: "",
  website: "",
  namaKepalaSekolah: "",
  nipKepalaSekolah: "",
};

export function getDataSekolah() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ...DATA_SEKOLAH_DEFAULT };
    }

    return {
      ...DATA_SEKOLAH_DEFAULT,
      ...data,
    };
  } catch {
    return { ...DATA_SEKOLAH_DEFAULT };
  }
}

export function simpanDataSekolah(dataSekolah) {
  try {
    const data = {
      ...DATA_SEKOLAH_DEFAULT,
      ...dataSekolah,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    window.dispatchEvent(
      new Event("simkur-data-sekolah-updated")
    );

    return true;
  } catch (error) {
    console.error("Gagal menyimpan data sekolah:", error);
    return false;
  }
}