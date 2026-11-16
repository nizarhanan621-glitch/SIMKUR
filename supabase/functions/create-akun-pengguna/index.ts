
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, {
      error: "Metode tidak diizinkan.",
    });
  }

  try {
    // 1. VALIDASI TOKEN LOGIN
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(401, {
        error: "Token autentikasi tidak ditemukan.",
      });
    }

    // 2. KONFIGURASI SUPABASE
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKeysRaw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !publishableKeysRaw || !serviceKey) {
      throw new Error("Konfigurasi Supabase Edge Function belum lengkap.");
    }

    let publishableKeys: { default?: string };

    try {
      publishableKeys = JSON.parse(publishableKeysRaw);
    } catch {
      throw new Error("Konfigurasi SUPABASE_PUBLISHABLE_KEYS tidak valid.");
    }

    const anonKey = publishableKeys.default;

    if (!anonKey) {
      throw new Error("Publishable key Supabase tidak ditemukan.");
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const token = authorization.slice(7);

    const { data: authData, error: authError } =
      await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return jsonResponse(401, {
        error: "Sesi pengguna tidak valid.",
      });
    }

    if (authData.user.app_metadata?.role !== "wakasek") {
      return jsonResponse(403, {
        error: "Akses khusus Wakasek.",
      });
    }

    // CLIENT ADMIN HANYA DIGUNAKAN DI SERVER
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. TENTUKAN SEKOLAH DARI AKUN WAKASEK
    const { data: membership, error: membershipError } =
      await adminClient
        .from("keanggotaan_sekolah")
        .select("sekolah_id")
        .eq("user_id", authData.user.id)
        .eq("role", "wakasek")
        .eq("status", "aktif")
        .maybeSingle();

    if (membershipError || !membership?.sekolah_id) {
      return jsonResponse(403, {
        error:
          "Keanggotaan sekolah Wakasek tidak ditemukan, tidak aktif, atau tidak tunggal.",
      });
    }

    const sekolahId = membership.sekolah_id;

    // 4. BACA INPUT
    let body: {
      nama?: string;
      email?: string;
      password?: string;
      role?: string;
      guru_id?: string | null;
    };

    try {
      body = await req.json();
    } catch {
      return jsonResponse(400, {
        error: "Format permintaan tidak valid.",
      });
    }

    const requestedNama = String(body.nama || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "").trim();
    const guruId = String(body.guru_id || "").trim();

    if (!email || !password || !role) {
      return jsonResponse(400, {
        error: "Email, password, dan peran wajib diisi.",
      });
    }

    if (!["guru", "kepsek"].includes(role)) {
      return jsonResponse(400, {
        error: "Peran akun tidak diizinkan.",
      });
    }

    if (password.length < 8) {
      return jsonResponse(400, {
        error: "Password minimal 8 karakter.",
      });
    }

    let nama = requestedNama;

    // 5. VALIDASI GURU DI SEKOLAH YANG SAMA
    if (role === "guru") {
      if (!guruId) {
        return jsonResponse(400, {
          error: "Pilih Guru yang sudah terdaftar di sekolah Anda.",
        });
      }

      const { data: guruRecord, error: guruError } =
        await adminClient
          .from("data_akademik_sekolah")
          .select("record_id, payload")
          .eq("sekolah_id", sekolahId)
          .eq("jenis_data", "data_guru")
          .eq("record_id", guruId)
          .maybeSingle();

      if (guruError) {
        throw new Error(
          "Gagal memeriksa data Guru: " + guruError.message
        );
      }

      if (!guruRecord) {
        return jsonResponse(404, {
          error: "Guru tidak ditemukan di sekolah Anda.",
        });
      }

      const payload = guruRecord.payload as Record<string, unknown>;
      nama = String(payload.nama || "").trim();

      if (!nama) {
        return jsonResponse(400, {
          error: "Nama Guru pada data induk belum valid.",
        });
      }

      if (payload.status === "Nonaktif") {
        return jsonResponse(409, {
          error: "Guru nonaktif tidak dapat dibuatkan akun.",
        });
      }

      // CEGAH SATU GURU MEMILIKI DUA AKUN
      const { data: existingRelation, error: relationReadError } =
        await adminClient
          .from("relasi_akun_guru")
          .select("id")
          .eq("sekolah_id", sekolahId)
          .eq("guru_id", guruId)
          .maybeSingle();

      if (relationReadError) {
        throw new Error(
          "Gagal memeriksa relasi akun Guru: " +
            relationReadError.message
        );
      }

      if (existingRelation) {
        return jsonResponse(409, {
          error: "Guru tersebut sudah memiliki akun login.",
        });
      }
    }

    if (role === "kepsek" && !nama) {
      return jsonResponse(400, {
        error: "Nama Kepala Sekolah wajib diisi.",
      });
    }

    // 6. BUAT AKUN AUTH
    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: {
          role,
        },
        user_metadata: {
          nama,
          sekolah_id: sekolahId,
        },
      });

    if (createError || !created.user) {
      return jsonResponse(400, {
        error: createError?.message || "Gagal membuat akun.",
      });
    }

    const userId = created.user.id;

    // 7. PEMBERSIHAN JIKA PROSES LANJUTAN GAGAL
    const rollback = async () => {
      const { error: relationDeleteError } = await adminClient
        .from("relasi_akun_guru")
        .delete()
        .eq("user_id", userId);

      if (relationDeleteError) {
        console.error(
          "Rollback relasi Guru gagal:",
          relationDeleteError
        );
      }

      // Profil dan keanggotaan memiliki FK ON DELETE CASCADE.
      const { error: deleteError } =
        await adminClient.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error("Rollback akun gagal:", deleteError);
      }
    };

    try {
      // 8. SIMPAN PROFIL
      const { error: profileError } = await adminClient
        .from("profil_pengguna")
        .insert({
          id: userId,
          nama_lengkap: nama,
        });

      if (profileError) {
        throw new Error(
          "Gagal menyimpan profil: " + profileError.message
        );
      }

      // 9. SIMPAN KEANGGOTAAN SEKOLAH
      const { error: memberError } = await adminClient
        .from("keanggotaan_sekolah")
        .insert({
          sekolah_id: sekolahId,
          user_id: userId,
          role,
          status: "aktif",
        });

      if (memberError) {
        throw new Error(
          "Gagal menyimpan keanggotaan sekolah: " +
            memberError.message
        );
      }

      // 10. HUBUNGKAN AKUN DENGAN GURU YANG SUDAH ADA
      if (role === "guru") {
        const { error: relationError } = await adminClient
          .from("relasi_akun_guru")
          .insert({
            sekolah_id: sekolahId,
            user_id: userId,
            guru_id: guruId,
          });

        if (relationError) {
          throw new Error(
            "Gagal menghubungkan akun dengan Guru: " +
              relationError.message
          );
        }
      }
    } catch (saveError) {
      await rollback();

      return jsonResponse(500, {
        error:
          saveError instanceof Error
            ? saveError.message
            : "Penyimpanan profil dan relasi gagal.",
      });
    }

    // 11. HASIL
    return jsonResponse(200, {
      success: true,
      message:
        role === "guru"
          ? "Akun Guru berhasil dibuat dan dihubungkan dengan data Guru."
          : "Akun Kepala Sekolah berhasil dibuat untuk sekolah Anda.",
      user: {
        id: userId,
        nama,
        email,
        role,
        guru_id: role === "guru" ? guruId : null,
        sekolah_id: sekolahId,
        status: "Aktif",
      },
    });
  } catch (error) {
    console.error("Create akun pengguna error:", error);

    return jsonResponse(500, {
      error:
        error instanceof Error
          ? error.message
          : "Gagal membuat akun pengguna.",
    });
  }
});
