
import { supabase } from "../lib/supabase";

const JENIS_DATA = "data_siswa";

const clean = (value) => String(value ?? "").trim();

const cleanIdentifier = (value) => {
  const result = clean(value).toUpperCase();
  return ["-", "–", "—"].includes(result) ? "" : result;
};

function buildPayload(siswa, sekarang = new Date().toISOString()) {
  const statusYangDiizinkan = [
    "Aktif",
    "Mutasi",
    "Keluar (Dropout)",
    "Nonaktif",
  ];

  const status = statusYangDiizinkan.includes(siswa.status)
    ? siswa.status
    : "Aktif";

  return {
    ...siswa,
    id: String(siswa.id),
    nama: clean(siswa.nama),
    nis: cleanIdentifier(siswa.nis),
    nisn: cleanIdentifier(siswa.nisn),
    status,
    sumber: siswa.sumber || "Manual",
    createdAt: siswa.createdAt || sekarang,
    updatedAt: sekarang,
  };
}

export async function getDataSiswaSekolah(sekolahId) {
  if (!sekolahId) {
    throw new Error("ID sekolah tidak tersedia.");
  }

  const { data, error } = await supabase
    .from("data_akademik_sekolah")
    .select("record_id, payload, updated_at")
    .eq("sekolah_id", sekolahId)
    .eq("jenis_data", JENIS_DATA)
    .order("record_id", { ascending: true });

  if (error) {
    throw new Error("Gagal membaca Data Siswa: " + error.message);
  }

  return (data || []).map((row) => ({
    ...(row.payload || {}),
    id: String(row.record_id),
    updatedAt: row.payload?.updatedAt || row.updated_at,
  }));
}

export async function simpanDataSiswaSekolah({
  sekolahId,
  userId,
  siswa,
}) {
  if (!sekolahId || !userId || !siswa?.id || !clean(siswa.nama)) {
    throw new Error(
      "Identitas sekolah, akun, ID, dan nama Siswa wajib tersedia."
    );
  }

  const recordId = String(siswa.id);
  const sekarang = new Date().toISOString();
  const payload = buildPayload(siswa, sekarang);

  const { data: existing, error: readError } = await supabase
    .from("data_akademik_sekolah")
    .select("id")
    .eq("sekolah_id", sekolahId)
    .eq("jenis_data", JENIS_DATA)
    .eq("record_id", recordId)
    .maybeSingle();

  if (readError) {
    throw new Error("Gagal memeriksa data Siswa: " + readError.message);
  }

  // Memperbarui data Siswa yang sudah ada.
  if (existing) {
    const { error } = await supabase
      .from("data_akademik_sekolah")
      .update({
        payload,
        updated_by: userId,
        updated_at: sekarang,
      })
      .eq("id", existing.id)
      .eq("sekolah_id", sekolahId)
      .eq("jenis_data", JENIS_DATA)
      .eq("record_id", recordId);

    if (error) {
      throw new Error("Gagal memperbarui Siswa: " + error.message);
    }

    return payload;
  }

  // Menambahkan data Siswa baru.
  const { error: insertError } = await supabase
    .from("data_akademik_sekolah")
    .insert({
      sekolah_id: sekolahId,
      jenis_data: JENIS_DATA,
      record_id: recordId,
      akses_guru_ids: [],
      payload,
      created_by: userId,
      updated_by: userId,
    });

  if (insertError) {
    // Menangani kemungkinan data yang sama disimpan bersamaan.
    if (insertError.code === "23505") {
      const { data: conflict, error: conflictError } = await supabase
        .from("data_akademik_sekolah")
        .select("id")
        .eq("sekolah_id", sekolahId)
        .eq("jenis_data", JENIS_DATA)
        .eq("record_id", recordId)
        .maybeSingle();

      if (conflictError || !conflict) {
        throw new Error(
          "Konflik penyimpanan Siswa: " + insertError.message
        );
      }

      const { error: updateError } = await supabase
        .from("data_akademik_sekolah")
        .update({
          payload,
          updated_by: userId,
          updated_at: sekarang,
        })
        .eq("id", conflict.id)
        .eq("sekolah_id", sekolahId)
        .eq("jenis_data", JENIS_DATA)
        .eq("record_id", recordId);

      if (updateError) {
        throw new Error(
          "Gagal menyelesaikan konflik Siswa: " + updateError.message
        );
      }

      return payload;
    }

    throw new Error("Gagal menyimpan Siswa: " + insertError.message);
  }

  return payload;
}

// Impor massal menggunakan satu operasi INSERT.
// Data lama tidak ditimpa.
export async function simpanBanyakDataSiswaSekolah({
  sekolahId,
  userId,
  siswaList,
}) {
  if (!sekolahId || !userId || !Array.isArray(siswaList)) {
    throw new Error(
      "Identitas sekolah, akun, dan daftar Siswa harus valid."
    );
  }

  if (!siswaList.length) {
    return getDataSiswaSekolah(sekolahId);
  }

  const sekarang = new Date().toISOString();

  const records = siswaList.map((item) => {
    if (!item?.id || !clean(item.nama)) {
      throw new Error("Ada data impor yang tidak memiliki ID atau nama.");
    }

    const payload = buildPayload(item, sekarang);

    return {
      sekolah_id: sekolahId,
      jenis_data: JENIS_DATA,
      record_id: String(item.id),
      akses_guru_ids: [],
      payload,
      created_by: userId,
      updated_by: userId,
    };
  });

  const { error } = await supabase
    .from("data_akademik_sekolah")
    .insert(records);

  if (error) {
    throw new Error("Gagal mengimpor Data Siswa: " + error.message);
  }

  return getDataSiswaSekolah(sekolahId);
}

// Migrasi hanya dijalankan setelah pengguna mengonfirmasi
// bahwa seluruh data lokal memang milik sekolah aktif.
export async function migrasikanDataSiswaSekolah({
  sekolahId,
  userId,
  siswaLokal,
}) {
  if (!sekolahId || !userId || !Array.isArray(siswaLokal)) {
    throw new Error("Data migrasi, akun, dan sekolah harus valid.");
  }

  const dataCloud = await getDataSiswaSekolah(sekolahId);

  const idCloud = new Set(
    dataCloud.map((item) => String(item.id))
  );

  const nisCloud = new Set(
    dataCloud
      .map((item) => cleanIdentifier(item.nis))
      .filter(Boolean)
  );

  const nisnCloud = new Set(
    dataCloud
      .map((item) => cleanIdentifier(item.nisn))
      .filter(Boolean)
  );

  let berhasil = 0;
  let dilewati = 0;
  let tidakValid = 0;
  const gagal = [];

  for (const item of siswaLokal) {
    const id = String(item?.id || "").trim();
    const nama = clean(item?.nama);
    const nis = cleanIdentifier(item?.nis);
    const nisn = cleanIdentifier(item?.nisn);

    if (!id || !nama) {
      tidakValid++;
      continue;
    }

    if (
      idCloud.has(id) ||
      (nis && nisCloud.has(nis)) ||
      (nisn && nisnCloud.has(nisn))
    ) {
      dilewati++;
      continue;
    }

    const sekarang = new Date().toISOString();

    const payload = buildPayload(
      {
        ...item,
        id,
        nama,
        status: item.status || "Aktif",
        sumber: item.sumber || "Migrasi Data Lokal",
      },
      sekarang
    );

    const { error } = await supabase
      .from("data_akademik_sekolah")
      .insert({
        sekolah_id: sekolahId,
        jenis_data: JENIS_DATA,
        record_id: id,
        akses_guru_ids: [],
        payload,
        created_by: userId,
        updated_by: userId,
      });

    if (error) {
      if (error.code === "23505") {
        dilewati++;
      } else {
        gagal.push({
          id,
          nama,
          pesan: error.message,
        });
      }

      continue;
    }

    berhasil++;
    idCloud.add(id);

    if (nis) nisCloud.add(nis);
    if (nisn) nisnCloud.add(nisn);
  }

  return {
    berhasil,
    dilewati,
    tidakValid,
    gagal,
    data: await getDataSiswaSekolah(sekolahId),
  };
}
