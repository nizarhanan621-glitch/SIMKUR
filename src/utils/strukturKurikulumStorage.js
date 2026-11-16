
const STORAGE_KEY = "simkur_struktur_kurikulum";

const DATA_STRUKTUR_DEFAULT = {
  VII: [],
  VIII: [],
  IX: [],
};

export function getStrukturKurikulum() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {
        VII: [],
        VIII: [],
        IX: [],
      };
    }

    return {
      ...DATA_STRUKTUR_DEFAULT,
      ...data,
    };
  } catch {
    return {
      VII: [],
      VIII: [],
      IX: [],
    };
  }
}

export function simpanStrukturKurikulum(data) {
  try {
    const struktur = {
      ...DATA_STRUKTUR_DEFAULT,
      ...data,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(struktur));

    window.dispatchEvent(
      new Event("simkur-struktur-kurikulum-updated")
    );

    return true;
  } catch (error) {
    console.error("Gagal menyimpan struktur kurikulum:", error);
    return false;
  }
}
