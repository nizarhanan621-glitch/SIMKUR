// deno-lint-ignore no-import-prefix
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
        console.error("DIAGNOSTIK KEANGGOTAAN WAKASEK", {
    user_id: authData.user.id,
    code: membershipError?.code,
    message: membershipError?.message,
    details: membershipError?.details,
    hint: membershipError?.hint,
  });
      return new Response(
        JSON.stringify({
          error: "Keanggotaan sekolah Wakasek tidak ditemukan atau tidak aktif.",
        }),
        { status: 403, headers }
      );
    }

    const { data: members, error: membersError } =
      await adminClient
        .from("keanggotaan_sekolah")
        .select("user_id, role, status")
        .eq("sekolah_id", membership.sekolah_id)
        .in("role", ["guru", "kepsek"]);

    if (membersError) throw membersError;

    const memberIds = (members || []).map((item) => item.user_id);

    const profilesResult = memberIds.length
      ? await adminClient
          .from("profil_pengguna")
          .select("id, nama_lengkap")
          .in("id", memberIds)
      : { data: [], error: null };

    if (profilesResult.error) throw profilesResult.error;

    const profileMap = new Map(
      (profilesResult.data || []).map((profile) => [
        profile.id,
        profile.nama_lengkap,
      ])
    );

    const users = [];

    for (const member of members || []) {
      const { data: userData, error: userError } =
        await adminClient.auth.admin.getUserById(member.user_id);

      if (userError || !userData.user) continue;

      users.push({
        id: userData.user.id,
        nama:
          profileMap.get(member.user_id) ||
          userData.user.user_metadata?.nama ||
          "-",
        email: userData.user.email || "-",
        role: member.role,
        status: member.status === "aktif" ? "Aktif" : "Nonaktif",
        dibuat: userData.user.created_at,
      });
    }

    users.sort((a, b) => a.nama.localeCompare(b.nama, "id"));

    return new Response(
      JSON.stringify({
        success: true,
        users,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("List akun pengguna error:", error);

    return new Response(
      JSON.stringify({
        error: "Gagal mengambil daftar akun pengguna.",
      }),
      { status: 500, headers }
    );
  }
});
