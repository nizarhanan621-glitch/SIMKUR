
import { supabase } from "../lib/supabase";

const JENIS_DATA = "data_guru";

// Mengambil sekolah aktif milik akun Wakasek.
export async function getSekolahAktifWakasek(userId) {
  if (!userId) {
    throw new Error("ID pengguna tidak ditemukan.");
  }

  const { data, error } = await supabase
    .from("keanggotaan_sekolah")
    .select("sekolah_id")
    .eq("user_id", userId)
    .eq("role", "wakasek")
    .eq("status", "aktif")
    .maybeSingle();

  if (error) {
    throw new Error("Gagal mengenali sekolah: " + error.message);
  }

  if (!data?.sekolah_id) {
    throw new Error("Keanggotaan sekolah Wakasek tidak ditemukan.");
  }

  return data.sekolah_id;
}

// Membaca seluruh data Guru dari Supabase.
export async function getDataGuruSekolah(sekolahId) {
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
    throw new Error("Gagal membaca data Guru: " + error.message);
  }

  return (data || []).map((row) => ({
    ...(row.payload || {}),
    id: String(row.record_id),
    updatedAt: row.payload?.updatedAt || row.updated_at,
  }));
}

// Menyimpan satu Guru tanpa mengganti ID lama.
export async function simpanDataGuruSekolah({
  sekolahId,
  userId,
  guru,
}) {
  if (!sekolahId || !userId || !guru?.id) {
    throw new Error("Identitas sekolah, akun, dan Guru wajib tersedia.");
  }

  const recordId = String(guru.id);
  const sekarang = new Date().toISOString();

  const payload = {
    ...guru,
    id: recordId,
    nama: String(guru.nama || "").trim(),
    status: guru.status === "Nonaktif" ? "Nonaktif" : "Aktif",
    sumber: guru.sumber || "Manual",
    updatedAt: sekarang,
  };

  const { data: existing, error: readError } = await supabase
    .from("data_akademik_sekolah")
    .select("id")
    .eq("sekolah_id", sekolahId)
    .eq("jenis_data", JENIS_DATA)
    .eq("record_id", recordId)
    .maybeSingle();

  if (readError) {
    throw new Error("Gagal memeriksa data Guru: " + readError.message);
  }

  if (existing) {
    const { error } = await supabase
      .from("data_akademik_sekolah")
      .update({
        guru_id: recordId,
        payload,
        updated_by: userId,
        updated_at: sekarang,
      })
      .eq("id", existing.id);

    if (error) {
      throw new Error("Gagal memperbarui Guru: " + error.message);
    }

    return;
  }

  const { error: insertError } = await supabase
    .from("data_akademik_sekolah")
    .insert({
      sekolah_id: sekolahId,
      jenis_data: JENIS_DATA,
      record_id: recordId,
      guru_id: recordId,
      akses_guru_ids: [],
      payload,
      created_by: userId,
      updated_by: userId,
    });

  if (insertError) {
    // Menangani kemungkinan data yang sama dibuat bersamaan.
    if (insertError.code === "23505") {
      const { data: conflict, error: conflictError } = await supabase
        .from("data_akademik_sekolah")
        .select("id")
        .eq("sekolah_id", sekolahId)
        .eq("jenis_data", JENIS_DATA)
        .eq("record_id", recordId)
        .maybeSingle();

      if (conflictError || !conflict) {
        throw new Error("Konflik penyimpanan Guru: " + insertError.message);
      }

      const { error: updateError } = await supabase
        .from("data_akademik_sekolah")
        .update({
          guru_id: recordId,
          payload,
          updated_by: userId,
          updated_at: sekarang,
        })
        .eq("id", conflict.id);

      if (updateError) {
        throw new Error("Gagal menyelesaikan konflik Guru: " + updateError.message);
      }

      return;
    }

    throw new Error("Gagal menyimpan Guru: " + insertError.message);
  }
}


// Migrasi data Guru lokal ke cloud.
// Hanya menambahkan ID yang belum ada; data cloud tidak ditimpa.
export async function migrasikanDataGuruSekolah({
  sekolahId,
  userId,
  guruLokal,
}) {
  if (!sekolahId || !userId || !Array.isArray(guruLokal)) {
    throw new Error("Data migrasi, akun, dan sekolah harus valid.");
  }

  const dataCloud = await getDataGuruSekolah(sekolahId);
  const idCloud = new Set(dataCloud.map((guru) => String(guru.id)));
  const idLokal = new Set();

  let berhasil = 0;
  let dilewati = 0;
  let tidakValid = 0;
  const gagal = [];

  for (const item of guruLokal) {
    const id = String(item?.id || "").trim();

    if (!id || !item?.nama?.trim?.()) {
      tidakValid++;
      continue;
    }

    if (idCloud.has(id) || idLokal.has(id)) {
      dilewati++;
      continue;
    }

    idLokal.add(id);

    const sekarang = new Date().toISOString();
    const payload = {
      ...item,
      id,
      nama: String(item.nama).trim(),
      status: item.status === "Nonaktif" ? "Nonaktif" : "Aktif",
      sumber: item.sumber || "Manual",
      createdAt: item.createdAt || sekarang,
      updatedAt: sekarang,
    };

    const { error } = await supabase
      .from("data_akademik_sekolah")
      .insert({
        sekolah_id: sekolahId,
        jenis_data: JENIS_DATA,
        record_id: id,
        guru_id: id,
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
          nama: payload.nama,
          pesan: error.message,
        });
      }
      continue;
    }

    berhasil++;
    idCloud.add(id);
  }

  const dataAkhir = await getDataGuruSekolah(sekolahId);

  return {
    berhasil,
    dilewati,
    tidakValid,
    gagal,
    data: dataAkhir,
  };
}
