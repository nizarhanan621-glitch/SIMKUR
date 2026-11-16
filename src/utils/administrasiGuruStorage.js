
const STORAGE_KEY = "simkur_pengaturan_administrasi_guru";

/**
 * Membaca seluruh pengaturan administrasi.
 * Format dan kunci penyimpanan lama tetap dipertahankan.
 */
export function getPengaturanAdministrasi() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Menyimpan pengaturan administrasi untuk satu periode.
 * Data lama yang tidak dikirim tetap dipertahankan.
 */
export function simpanPengaturanAdministrasi(pengaturan) {
  const data = getPengaturanAdministrasi();

  const index = data.findIndex(
    (item) =>
      item.tahunAjaran === pengaturan.tahunAjaran &&
      item.semester === pengaturan.semester
  );

  const dataBaru = {
    ...pengaturan,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    data[index] = {
      ...data[index],
      ...dataBaru,
    };
  } else {
    data.push({
      ...dataBaru,
      id: `adm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  window.dispatchEvent(
    new Event("simkur_administrasi_updated")
  );

  return data;
}

/**
 * Mengambil pengaturan untuk tahun ajaran dan semester tertentu.
 */
export function getPengaturanPeriode(tahunAjaran, semester) {
  const data = getPengaturanAdministrasi();

  return (
    data.find(
      (item) =>
        item.tahunAjaran === tahunAjaran &&
        item.semester === semester
    ) || null
  );
}

/**
 * Mengambil data pengumpulan berdasarkan ID penugasan mengajar.
 * Data administrasi lama tanpa tugasMengajarId tidak dicampur
 * dengan administrasi penugasan yang baru.
 */
export function getPengumpulanPerPenugasan(
  pengumpulanGuru,
  tugasMengajarId
) {
  if (!Array.isArray(pengumpulanGuru) || !tugasMengajarId) {
    return null;
  }

  return (
    pengumpulanGuru.find(
      (item) =>
        item.tugasMengajarId &&
        String(item.tugasMengajarId) ===
          String(tugasMengajarId)
    ) || null
  );
}

/**
 * Memperbarui satu dokumen dalam satu penugasan.
 * Penugasan lain dan seluruh data administrasi lama tetap utuh.
 */
export function perbaruiDokumenPenugasan(
  pengumpulanGuru,
  penugasan,
  dokumenBaru
) {
  if (!Array.isArray(pengumpulanGuru)) {
    throw new Error("Data pengumpulan administrasi tidak valid.");
  }

  if (!penugasan?.tugasMengajarId || !dokumenBaru?.dokumenId) {
    throw new Error(
      "Identitas penugasan dan dokumen harus tersedia."
    );
  }

  const dataBaru = [...pengumpulanGuru];

  let indexPenugasan = dataBaru.findIndex(
    (item) =>
      item.tugasMengajarId &&
      String(item.tugasMengajarId) ===
        String(penugasan.tugasMengajarId)
  );

  if (indexPenugasan < 0) {
    dataBaru.push({
      tugasMengajarId: penugasan.tugasMengajarId,
      guruId: penugasan.guruId,
      rombelId: penugasan.rombelId,
      mapelId: penugasan.mapelId,
      tahunAjaran: penugasan.tahunAjaran,
      semester: penugasan.semester,
      dokumen: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    indexPenugasan = dataBaru.length - 1;
  }

  const dataPenugasan = {
    ...dataBaru[indexPenugasan],
    ...penugasan,
    dokumen: [...(dataBaru[indexPenugasan].dokumen || [])],
    updatedAt: new Date().toISOString(),
  };

  const indexDokumen = dataPenugasan.dokumen.findIndex(
    (item) =>
      String(item.dokumenId) === String(dokumenBaru.dokumenId)
  );

  const dataDokumenLama =
    indexDokumen >= 0
      ? dataPenugasan.dokumen[indexDokumen]
      : {};

  const dataDokumen = {
    ...dataDokumenLama,
    ...dokumenBaru,
    updatedAt: new Date().toISOString(),
  };

  if (indexDokumen >= 0) {
    dataPenugasan.dokumen[indexDokumen] = dataDokumen;
  } else {
    dataPenugasan.dokumen.push(dataDokumen);
  }

  dataBaru[indexPenugasan] = dataPenugasan;

  return dataBaru;
}

/**
 * Mengambil administrasi lama yang belum terhubung
 * dengan penugasan mengajar.
 * Data ini disediakan agar dapat ditinjau tanpa dihapus.
 */
export function getPengumpulanLama(pengumpulanGuru) {
  if (!Array.isArray(pengumpulanGuru)) {
    return [];
  }

  return pengumpulanGuru.filter(
    (item) => !item.tugasMengajarId
  );
}
