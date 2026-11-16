
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

    const authClient = createClient(supabaseUrl, anonKey);
    const token = authorization.replace("Bearer ", "");

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
    const action = String(body.action || "");
    const userId = String(body.userId || "").trim();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "ID akun tidak ditemukan." }),
        { status: 400, headers }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: targetData, error: targetError } =
      await adminClient.auth.admin.getUserById(userId);

    if (targetError || !targetData.user) {
      return new Response(
        JSON.stringify({ error: "Akun Wakasek tidak ditemukan." }),
        { status: 404, headers }
      );
    }

    const targetUser = targetData.user;

    if (targetUser.app_metadata?.role !== "wakasek") {
      return new Response(
        JSON.stringify({ error: "Tindakan hanya berlaku untuk akun Wakasek." }),
        { status: 403, headers }
      );
    }

    if (action === "reset_password") {
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

      return new Response(
        JSON.stringify({
          success: true,
          message: "Password Wakasek berhasil direset.",
        }),
        { status: 200, headers }
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

      const { error } = await adminClient.auth.admin.updateUserById(
        userId,
        {
          email,
          email_confirm: true,
          user_metadata: {
            ...targetUser.user_metadata,
            nama,
          },
        }
      );

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Data akun Wakasek berhasil diperbarui.",
        }),
        { status: 200, headers }
      );
    }

    if (action === "deactivate" || action === "activate") {
      const { error } = await adminClient.auth.admin.updateUserById(
        userId,
        {
          ban_duration:
            action === "deactivate" ? "876000h" : "none",
        }
      );

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          message:
            action === "deactivate"
              ? "Akun Wakasek berhasil dinonaktifkan."
              : "Akun Wakasek berhasil diaktifkan kembali.",
        }),
        { status: 200, headers }
      );
    }

    if (action === "delete") {
      const { error } =
        await adminClient.auth.admin.deleteUser(userId);

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Akun Wakasek berhasil dihapus.",
        }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({ error: "Tindakan tidak dikenal." }),
      { status: 400, headers }
    );
  } catch (error) {
    console.error("Manage Wakasek error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : "Terjadi kesalahan pada server.",
      }),
      { status: 500, headers }
    );
  }
});
