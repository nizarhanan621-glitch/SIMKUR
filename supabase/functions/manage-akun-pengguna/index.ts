
import { createClient } from "npm:@supabase/supabase-js@2";

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
        const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")!);
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
    const anonKey = publishableKeys.default;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    if (authData.user.app_metadata?.role !== "wakasek") {
      return new Response(
        JSON.stringify({ error: "Akses khusus Wakasek." }),
        { status: 403, headers }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: membership, error: membershipError } =
      await adminClient
        .from("keanggotaan_sekolah")
        .select("sekolah_id")
        .eq("user_id", authData.user.id)
        .eq("role", "wakasek")
        .eq("status", "aktif")
        .single();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({
          error: "Keanggotaan sekolah Wakasek tidak ditemukan atau tidak aktif.",
        }),
        { status: 403, headers }
      );
    }

    const body = await req.json();

    const userId = String(body.userId || "").trim();
    const action = String(body.action || "").trim();

    if (!userId || !action) {
      return new Response(
        JSON.stringify({ error: "Data permintaan tidak lengkap." }),
        { status: 400, headers }
      );
    }

    if (userId === authData.user.id) {
      return new Response(
        JSON.stringify({ error: "Tidak dapat mengelola akun sendiri." }),
        { status: 400, headers }
      );
    }

    const { data: targetMembership, error: targetError } =
      await adminClient
        .from("keanggotaan_sekolah")
        .select("user_id, role, status")
        .eq("sekolah_id", membership.sekolah_id)
        .eq("user_id", userId)
        .in("role", ["guru", "kepsek"])
        .single();

    if (targetError || !targetMembership) {
      return new Response(
        JSON.stringify({
          error: "Akun tidak ditemukan di sekolah Anda atau tidak memiliki izin.",
        }),
        { status: 404, headers }
      );
    }

    const { data: targetData, error: targetAuthError } =
      await adminClient.auth.admin.getUserById(userId);

    if (targetAuthError || !targetData.user) {
      return new Response(
        JSON.stringify({ error: "Data akun autentikasi tidak ditemukan." }),
        { status: 404, headers }
      );
    }

    if (targetData.user.app_metadata?.role !== targetMembership.role) {
      return new Response(
        JSON.stringify({ error: "Data peran akun tidak sesuai." }),
        { status: 403, headers }
      );
    }

    if (action === "edit") {
      const nama = String(body.nama || "").trim();
      const email = String(body.email || "").trim().toLowerCase();

      if (!nama || !email) {
        return new Response(
          JSON.stringify({ error: "Nama dan email wajib diisi." }),
          { status: 400, headers }
        );
      }

      const oldNama = targetData.user.user_metadata?.nama || "";
      const oldProfile = await adminClient
        .from("profil_pengguna")
        .select("nama_lengkap")
        .eq("id", userId)
        .maybeSingle();

      if (oldProfile.error) throw oldProfile.error;

      const { error: profileError } = await adminClient
        .from("profil_pengguna")
        .upsert({
          id: userId,
          nama_lengkap: nama,
        });

      if (profileError) throw profileError;

      const { error: updateError } =
        await adminClient.auth.admin.updateUserById(userId, {
          email,
          email_confirm: true,
          user_metadata: {
            ...(targetData.user.user_metadata || {}),
            nama,
          },
        });

      if (updateError) {
        await adminClient
          .from("profil_pengguna")
          .upsert({
            id: userId,
            nama_lengkap: oldProfile.data?.nama_lengkap ?? oldNama,
          });

        throw updateError;
      }
    } else if (action === "reset_password") {
      const password = String(body.password || "");

      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password minimal 8 karakter." }),
          { status: 400, headers }
        );
      }

      const { error } = await adminClient.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (error) throw error;
    } else if (action === "deactivate" || action === "activate") {
      const newStatus = action === "activate" ? "aktif" : "nonaktif";
      const banDuration = action === "activate" ? "none" : "876000h";

      const { error: authUpdateError } =
        await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: banDuration,
        });

      if (authUpdateError) throw authUpdateError;

      const { error: statusError } = await adminClient
        .from("keanggotaan_sekolah")
        .update({ status: newStatus })
        .eq("sekolah_id", membership.sekolah_id)
        .eq("user_id", userId);

      if (statusError) {
        await adminClient.auth.admin.updateUserById(userId, {
          ban_duration:
            targetMembership.status === "aktif" ? "none" : "876000h",
        });

        throw statusError;
      }
    } else if (action === "delete") {
      const { error } =
        await adminClient.auth.admin.deleteUser(userId);

      if (error) throw error;
    } else {
      return new Response(
        JSON.stringify({ error: "Aksi tidak dikenali." }),
        { status: 400, headers }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pengelolaan akun berhasil dilakukan.",
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Manage akun pengguna error:", error);

    return new Response(
      JSON.stringify({
        error: "Gagal mengelola akun pengguna. Periksa kembali data.",
      }),
      { status: 500, headers }
    );
  }
});
