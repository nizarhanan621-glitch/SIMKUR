
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
        JSON.stringify({
          error: "Akses ditolak. Khusus Super Admin.",
        }),
        { status: 403, headers }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: sekolah, error } = await adminClient
      .from("sekolah")
      .select("id, nama_sekolah, npsn, status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        sekolah: sekolah || [],
      }),
      { status: 200, headers }
    );
    } catch (error: unknown) {
    console.error("List Sekolah error:", error);

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