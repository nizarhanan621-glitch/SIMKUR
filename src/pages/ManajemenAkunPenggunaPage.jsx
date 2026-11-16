
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const styles = {
  page: { padding: 24, maxWidth: 1200, margin: "0 auto" },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 6 },
  subtitle: { color: "#64748b", marginBottom: 24 },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  heading: { fontSize: 17, fontWeight: 700, marginBottom: 16 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
  },
  button: {
    border: 0,
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer",
    background: "#2563eb",
    color: "#fff",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: 12,
    background: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
};

export default function ManajemenAkunPenggunaPage() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("guru");
  const [daftarGuru, setDaftarGuru] = useState([]);
  const [guruTerpilihId, setGuruTerpilihId] = useState("");
  const [loadingGuru, setLoadingGuru] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  
  const fetchDaftarGuru = useCallback(async () => {
    setLoadingGuru(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Sesi Wakasek tidak ditemukan.");
      }

      const { data: membership, error: membershipError } =
        await supabase
          .from("keanggotaan_sekolah")
          .select("sekolah_id")
          .eq("user_id", authData.user.id)
          .eq("role", "wakasek")
          .eq("status", "aktif")
          .maybeSingle();

      if (membershipError || !membership) {
        throw new Error("Sekolah aktif Wakasek tidak ditemukan.");
      }

      const { data, error } = await supabase
        .from("data_akademik_sekolah")
        .select("record_id, payload")
        .eq("sekolah_id", membership.sekolah_id)
        .eq("jenis_data", "data_guru");

      if (error) throw error;

      const hasil = (data || [])
        .map((row) => ({
          ...(row.payload || {}),
          id: String(row.record_id),
        }))
        .filter(
          (guru) => guru.nama && guru.status !== "Nonaktif"
        )
        .sort((a, b) => a.nama.localeCompare(b.nama));

      setDaftarGuru(hasil);
    } catch (error) {
      showMessage(error.message, "error");
      setDaftarGuru([]);
    } finally {
      setLoadingGuru(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingList(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "list-akun-pengguna",
        { body: {} }
      );

      if (error) {
        let detail = error.message || "Gagal mengambil daftar akun.";

        if (error.context instanceof Response) {
          try {
            const result = await error.context.json();
            detail = result.error || detail;
          } catch {
            // Gunakan pesan awal jika respons bukan JSON.
          }
        }

        showMessage(detail, "error");
        setUsers([]);
      } else if (data?.success) {
        setUsers(data.users || []);
      } else {
        showMessage(
          data?.error || "Gagal mengambil daftar akun.",
          "error"
        );
        setUsers([]);
      }
    } catch (error) {
      showMessage(
        error.message || "Gagal mengambil daftar akun.",
        "error"
      );
      setUsers([]);
    } finally {
      setLoadingList(false);
    }
  }, []);


  useEffect(() => {
  fetchUsers();
  fetchDaftarGuru();
}, [fetchUsers, fetchDaftarGuru]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!nama.trim() || !email.trim() || !password) {
      showMessage("Nama, email, dan password wajib diisi.", "error");
      return;
    }

    if (password.length < 8) {
      showMessage("Password minimal 8 karakter.", "error");
      return;
    }
    const guruTerpilih = daftarGuru.find(
  (guru) => String(guru.id) === String(guruTerpilihId)
);

const namaAkun =
  role === "guru"
    ? guruTerpilih?.nama?.trim()
    : nama.trim();

if (
  !namaAkun ||
  !email.trim() ||
  !password ||
  (role === "guru" && !guruTerpilihId)
) {
  showMessage(
    "Pilih Guru dari daftar sekolah atau lengkapi nama Kepala Sekolah, email, dan password.",
    "error"
  );
  return;
}

    setLoading(true);

    const { data, error } = await supabase.functions.invoke(
      "create-akun-pengguna",
      {
        body: {
  nama: namaAkun,
  email: email.trim().toLowerCase(),
  password,
  role,
  guru_id: role === "guru" ? guruTerpilihId : null,
},
      }
    );

    setLoading(false);

    if (error || !data?.success) {
      let detail = data?.error || error?.message || "Gagal membuat akun.";

      if (error?.context instanceof Response) {
        try {
          const result = await error.context.json();
          detail = result.error || detail;
        } catch {
          // Gunakan pesan awal.
        }
      }

      showMessage(detail, "error");
      return;
    }

    showMessage("Akun berhasil dibuat.");
setNama("");
setEmail("");
setPassword("");
setRole("guru");
setGuruTerpilihId("");
fetchUsers();
fetchDaftarGuru();
  };

  const manageAccount = async (userId, action, extra = {}) => {
    const { data, error } = await supabase.functions.invoke(
      "manage-akun-pengguna",
      {
        body: { userId, action, ...extra },
      }
    );

    if (error || !data?.success) {
      let detail = data?.error || error?.message || "Gagal mengelola akun.";

      if (error?.context instanceof Response) {
        try {
          const result = await error.context.json();
          detail = result.error || detail;
        } catch {
          // Gunakan pesan awal.
        }
      }

      showMessage(detail, "error");
      return false;
    }

    showMessage(data.message || "Akun berhasil diperbarui.");
    await fetchUsers();
    return true;
  };

  const handleEdit = async (user) => {
    const namaBaru = window.prompt("Nama lengkap:", user.nama);
    if (namaBaru === null) return;

    const emailBaru = window.prompt("Email:", user.email);
    if (emailBaru === null) return;

    if (!namaBaru.trim() || !emailBaru.trim()) {
      showMessage("Nama dan email tidak boleh kosong.", "error");
      return;
    }

    await manageAccount(user.id, "edit", {
      nama: namaBaru.trim(),
      email: emailBaru.trim().toLowerCase(),
    });
  };

  const handleResetPassword = async (user) => {
    const passwordBaru = window.prompt(
      `Password baru untuk ${user.nama} (minimal 8 karakter):`
    );

    if (passwordBaru === null) return;

    if (passwordBaru.length < 8) {
      showMessage("Password minimal 8 karakter.", "error");
      return;
    }

    if (!window.confirm("Reset password akun ini?")) return;

    await manageAccount(user.id, "reset_password", {
      password: passwordBaru,
    });
  };

  const handleToggleStatus = async (user) => {
    const aktif = user.status === "Aktif";
    const action = aktif ? "deactivate" : "activate";

    if (
      !window.confirm(
        `${aktif ? "Nonaktifkan" : "Aktifkan"} akun ${user.nama}?`
      )
    ) {
      return;
    }

    await manageAccount(user.id, action);
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Hapus akun ${user.nama} secara permanen? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    await manageAccount(user.id, "delete");
  };

  const roleLabel = (value) =>
    value === "kepsek" ? "Kepala Sekolah" : "Guru";

  return (
    <div style={styles.page}>
      <div style={styles.title}>Manajemen Akun Pengguna</div>
      <div style={styles.subtitle}>
        Kelola akun Guru dan Kepala Sekolah di sekolah Anda.
      </div>

      {message && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 18,
            background: messageType === "error" ? "#fee2e2" : "#dcfce7",
            color: messageType === "error" ? "#991b1b" : "#166534",
          }}
        >
          {message}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.heading}>Tambah Akun Pengguna</div>

        <form onSubmit={handleCreate}>
          <div style={styles.grid}>
            <div>
  <label style={styles.label}>Nama Lengkap</label>

  {role === "guru" ? (
    <select
      style={styles.input}
      value={guruTerpilihId}
      required
      disabled={loadingGuru || daftarGuru.length === 0}
      onChange={(e) => {
        const id = e.target.value;
        setGuruTerpilihId(id);

        const guru = daftarGuru.find(
          (item) => String(item.id) === id
        );

        setNama(guru?.nama || "");
      }}
    >
      <option value="">
        {loadingGuru
          ? "Memuat Guru sekolah Anda..."
          : daftarGuru.length
            ? "Pilih Guru dari sekolah Anda"
            : "Belum ada data Guru di sekolah Anda"}
      </option>

      {daftarGuru.map((guru) => (
        <option key={guru.id} value={guru.id}>
          {guru.nama}{guru.nip ? ` — ${guru.nip}` : ""}
        </option>
      ))}
    </select>
  ) : (
    <input
      style={styles.input}
      value={nama}
      onChange={(e) => setNama(e.target.value)}
      placeholder="Nama lengkap Kepala Sekolah"
      required
    />
  )}
</div>

            <div>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />
            </div>

            <div>
              <label style={styles.label}>Password Awal</label>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                minLength={8}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Peran Akun</label>
              <select
                style={styles.input}
                value={role}
                onChange={(e) => {
  setRole(e.target.value);
  setNama("");
  setGuruTerpilihId("");
}}
              >
                <option value="guru">Guru</option>
                <option value="kepsek">Kepala Sekolah</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Buat Akun"}
            </button>
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={styles.heading}>Daftar Akun Pengguna</div>
          <button
            type="button"
            style={{ ...styles.button, background: "#475569" }}
            onClick={fetchUsers}
            disabled={loadingList}
          >
            {loadingList ? "Memuat..." : "Muat Ulang"}
          </button>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>No.</th>
                <th style={styles.th}>Nama</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Peran</th>
                <th style={styles.th}>Tanggal Dibuat</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loadingList ? (
                <tr>
                  <td style={styles.td} colSpan={7}>
                    Memuat daftar akun...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    style={{ ...styles.td, textAlign: "center" }}
                    colSpan={7}
                  >
                    Belum ada akun Guru atau Kepala Sekolah.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{user.nama}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>{roleLabel(user.role)}</td>
                    <td style={styles.td}>
                      {user.dibuat
                        ? new Date(user.dibuat).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 20,
                          fontSize: 12,
                          background:
                            user.status === "Aktif" ? "#dcfce7" : "#fee2e2",
                          color:
                            user.status === "Aktif" ? "#166534" : "#991b1b",
                        }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          style={{
                            ...styles.button,
                            background: "#0f766e",
                            padding: "7px 10px",
                          }}
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          style={{
                            ...styles.button,
                            background: "#7c3aed",
                            padding: "7px 10px",
                          }}
                          onClick={() => handleResetPassword(user)}
                        >
                          Reset Password
                        </button>

                        <button
                          type="button"
                          style={{
                            ...styles.button,
                            background:
                              user.status === "Aktif" ? "#d97706" : "#16a34a",
                            padding: "7px 10px",
                          }}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button
                          type="button"
                          style={{
                            ...styles.button,
                            background: "#dc2626",
                            padding: "7px 10px",
                          }}
                          onClick={() => handleDelete(user)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
