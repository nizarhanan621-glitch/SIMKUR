
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  const headers = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  // deno-lint-ignore no-explicit-any
let adminClient: any = null;
  let createdSchoolId: string | null = null;
  let createdUserId: string | null = null;

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Metode tidak diizinkan." }),
        { status: 405, headers }
      );
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Token autentikasi tidak ditemukan." }),
        { status: 401, headers }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const token = authorization.replace("Bearer ", "");

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: authData, error: authError } =
      await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "Sesi pengguna tidak valid." }),
        { status: 401, headers }
      );
    }

    if (authData.user.app_metadata?.role !== "superadmin") {
      return new Response(
        JSON.stringify({ error: "Akses ditolak. Khusus Super Admin." }),
        { status: 403, headers }
      );
    }

    const body = await req.json();

    const namaSekolah = String(body.namaSekolah || "").trim();
    const npsn = String(body.npsn || "").trim();
    const namaWakasek = String(body.namaWakasek || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!namaSekolah || !namaWakasek || !email || !password) {
      return new Response(
        JSON.stringify({
          error: "Nama sekolah, nama Wakasek, email, dan password wajib diisi.",
        }),
        { status: 400, headers }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password minimal 8 karakter." }),
        { status: 400, headers }
      );
    }

    if (npsn && !/^\d{8}$/.test(npsn)) {
      return new Response(
        JSON.stringify({ error: "NPSN harus terdiri dari 8 angka." }),
        { status: 400, headers }
      );
    }

    adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Membuat identitas sekolah.
    const { data: school, error: schoolError } =
      await adminClient
        .from("sekolah")
        .insert({
          nama_sekolah: namaSekolah,
          npsn: npsn || null,
        })
        .select("id, nama_sekolah, npsn")
        .single();

    if (schoolError) throw schoolError;

    createdSchoolId = school.id;

    // 2. Membuat akun Wakasek.
    const { data: userData, error: userError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: {
          role: "wakasek",
        },
        user_metadata: {
          nama: namaWakasek,
          sekolah_id: school.id,
        },
      });

    if (userError) throw userError;

    createdUserId = userData.user.id;

    // 3. Membuat profil pengguna.
    const { error: profileError } =
      await adminClient
        .from("profil_pengguna")
        .insert({
          id: userData.user.id,
          nama_lengkap: namaWakasek,
        });

    if (profileError) throw profileError;

    // 4. Menghubungkan Wakasek dengan sekolah.
    const { error: membershipError } =
      await adminClient
        .from("keanggotaan_sekolah")
        .insert({
          sekolah_id: school.id,
          user_id: userData.user.id,
          role: "wakasek",
          status: "aktif",
        });

    if (membershipError) throw membershipError;

    // 5. Menyiapkan pengaturan awal sekolah.
    const { error: settingError } =
      await adminClient
        .from("pengaturan_sekolah")
        .insert({
          sekolah_id: school.id,
        });

    if (settingError) throw settingError;

    // 6. Menyiapkan lisensi awal.
    const { error: licenseError } =
      await adminClient
        .from("lisensi_sekolah")
        .insert({
          sekolah_id: school.id,
          status: "aktif",
          mulai_berlaku: new Date().toISOString(),
        });

    if (licenseError) throw licenseError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sekolah dan akun Wakasek berhasil dibuat.",
        sekolah: school,
        wakasek: {
          id: userData.user.id,
          nama: namaWakasek,
          email: userData.user.email,
          role: "wakasek",
        },
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Provision school error:", error);

    // Membersihkan data jika proses pembuatan gagal.
    if (adminClient && createdUserId) {
      const { error: cleanupUserError } =
        await adminClient.auth.admin.deleteUser(createdUserId);

      if (cleanupUserError) {
        console.error("Cleanup user error:", cleanupUserError);
      }
    }

    if (adminClient && createdSchoolId) {
      const { error: cleanupSchoolError } =
        await adminClient
          .from("sekolah")
          .delete()
          .eq("id", createdSchoolId);

      if (cleanupSchoolError) {
        console.error("Cleanup school error:", cleanupSchoolError);
      }
    }

        const detail =
      typeof error === "object" && error !== null
        ? error as {
            message?: string;
            details?: string;
            hint?: string;
            code?: string;
          }
        : { message: String(error) };

    return new Response(
      JSON.stringify({
        error: {
          message: detail.message || null,
          details: detail.details || null,
          hint: detail.hint || null,
          code: detail.code || null,
        },
      }),
      { status: 500, headers }
    );
  }
});
