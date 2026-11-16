
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

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const wakasek = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data, error } =
        await adminClient.auth.admin.listUsers({
          page,
          perPage,
        });

      if (error) throw error;

      const users = data.users || [];

      wakasek.push(
        ...users
          .filter(
            (user) => user.app_metadata?.role === "wakasek"
          )
          .map((user) => ({
            id: user.id,
            nama: user.user_metadata?.nama || "-",
            email: user.email || "-",
            dibuat: user.created_at,
            status: user.banned_until ? "Nonaktif" : "Aktif",
          }))
      );

      if (users.length < perPage) break;

      page++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        users: wakasek,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("List Wakasek error:", error);

    return new Response(
      JSON.stringify({
        error: "Gagal mengambil daftar akun Wakasek.",
      }),
      { status: 500, headers }
    );
  }
});
