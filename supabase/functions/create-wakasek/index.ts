
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Metode tidak diizinkan." }),
        { status: 405, headers: jsonHeaders }
      );
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Token autentikasi tidak ditemukan." }),
        { status: 401, headers: jsonHeaders }
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
        { status: 401, headers: jsonHeaders }
      );
    }

    if (authData.user.app_metadata?.role !== "superadmin") {
      return new Response(
        JSON.stringify({ error: "Akses ditolak. Khusus Super Admin." }),
        { status: 403, headers: jsonHeaders }
      );
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const nama = String(body.nama || "").trim();

    if (!email || !password || !nama) {
      return new Response(
        JSON.stringify({ error: "Nama, email, dan password wajib diisi." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password minimal 8 karakter." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: "wakasek",
      },
      user_metadata: {
        nama,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Akun Wakasek berhasil dibuat.",
        user: {
          id: data.user.id,
          email: data.user.email,
          nama,
          role: "wakasek",
        },
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error("Create Wakase error:", error);

    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan pada server." }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
