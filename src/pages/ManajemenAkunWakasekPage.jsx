
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ManajemenAkunWakasekPage() {
  const [namaSekolah, setNamaSekolah] = useState(
  () => sessionStorage.getItem("simkur_nama_sekolah") || ""
);
const [npsn, setNpsn] = useState(
  () => sessionStorage.getItem("simkur_npsn") || ""
);
const [nama, setNama] = useState(
  () => sessionStorage.getItem("simkur_nama_wakasek") || ""
);
const [email, setEmail] = useState(
  () => sessionStorage.getItem("simkur_email_wakasek") || ""
);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [wakasekList, setWakasekList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [sekolahList, setSekolahList] = useState([]);
  const [loadingSekolah, setLoadingSekolah] = useState(true);
  const [sekolahError, setSekolahError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchWakasek = useCallback(async () => {
    setLoadingList(true);
    setListError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "list-wakasek",
        { body: {} }
      );

      if (error) {
        let detail = error.message;

        if (error.context instanceof Response) {
          const result = await error.context.json().catch(() => null);
          detail = result?.error || detail;
        }

        throw new Error(detail);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Gagal mengambil daftar Wakasek.");
      }

      setWakasekList(data.users || []);
    } catch (error) {
      setListError(error.message || "Gagal memuat daftar akun.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchWakasek();
  }, [fetchWakasek]);

  const fetchSekolah = useCallback(async () => {
  setLoadingSekolah(true);
  setSekolahError("");

  try {
    const { data, error } = await supabase.functions.invoke(
      "list-sekolah",
      { body: {} }
    );

    if (error) {
      let detail = error.message;

      if (error.context instanceof Response) {
        const result = await error.context.json().catch(() => null);
        detail = result?.error || detail;
      }

      throw new Error(detail);
    }

    if (!data?.success) {
      throw new Error(data?.error || "Gagal mengambil daftar sekolah.");
    }

    setSekolahList(data.sekolah || []);
  } catch (error) {
    setSekolahError(error.message || "Gagal memuat daftar sekolah.");
  } finally {
    setLoadingSekolah(false);
  }
}, []);

  useEffect(() => {
    fetchSekolah();
  }, [fetchSekolah]);

  useEffect(() => {
  sessionStorage.setItem("simkur_nama_sekolah", namaSekolah);
  sessionStorage.setItem("simkur_npsn", npsn);
  sessionStorage.setItem("simkur_nama_wakasek", nama);
  sessionStorage.setItem("simkur_email_wakasek", email);
}, [namaSekolah, npsn, nama, email]);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
  };

  const manageAccount = async (userId, action, extra = {}) => {
    setActionLoading(userId + action);
    setMessage("");
    setMessageType("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "manage-wakasek",
        {
          body: {
            userId,
            action,
            ...extra,
          },
        }
      );

      if (error) {
        let detail = error.message;

        if (error.context instanceof Response) {
          const result = await error.context.json().catch(() => null);
          detail = result?.error || detail;
        }

        throw new Error(detail);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Tindakan gagal dilakukan.");
      }

      showMessage(data.message, "success");
      await fetchWakasek();
    } catch (error) {
      showMessage(error.message || "Terjadi kesalahan.", "error");
    } finally {
      setActionLoading("");
    }
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

  setMessage("");
  setMessageType("");

  if (!namaSekolah.trim() || !nama.trim() || !email.trim() || !password) {
    showMessage(
      "Nama sekolah, nama Wakasek, email, dan password wajib diisi.",
      "error"
    );
    return;
  }

  if (npsn.trim() && !/^\d{8}$/.test(npsn.trim())) {
    showMessage("NPSN harus terdiri dari 8 angka.", "error");
    return;
  }

  if (password.length < 8) {
    showMessage("Password minimal 8 karakter.", "error");
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabase.functions.invoke(
      "provision-school",
      {
        body: {
          namaSekolah: namaSekolah.trim(),
          npsn: npsn.trim(),
          namaWakasek: nama.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
      }
    );

    if (error) {
      let detail = error.message;

      if (error.context instanceof Response) {
        const result = await error.context.json().catch(() => null);
        detail = result?.error || detail;
      }

      throw new Error(detail);
    }

    if (!data?.success) {
      throw new Error(data?.error || "Pendaftaran sekolah gagal.");
    }

    showMessage(
      "Sekolah " + data.sekolah.nama_sekolah +
      " dan akun Wakasek " + data.wakasek.email +
      " berhasil dibuat.",
      "success"
    );

    setNamaSekolah("");
setNpsn("");
setNama("");
setEmail("");
setPassword("");

sessionStorage.removeItem("simkur_nama_sekolah");
sessionStorage.removeItem("simkur_npsn");
sessionStorage.removeItem("simkur_nama_wakasek");
sessionStorage.removeItem("simkur_email_wakasek");

await fetchWakasek();
await fetchSekolah();
  } catch (error) {
    showMessage(error.message || "Terjadi kesalahan.", "error");
  } finally {
    setLoading(false);
  }
};



  const handleEdit = async (user) => {
    const namaBaru = window.prompt("Nama Wakasek:", user.nama);

    if (namaBaru === null) return;

    if (!namaBaru.trim()) {
      showMessage("Nama tidak boleh kosong.", "error");
      return;
    }

    const emailBaru = window.prompt("Email Wakasek:", user.email);

    if (emailBaru === null) return;

    if (!emailBaru.trim()) {
      showMessage("Email tidak boleh kosong.", "error");
      return;
    }

    if (!window.confirm("Simpan perubahan data akun Wakasek ini?")) {
      return;
    }

    await manageAccount(user.id, "edit", {
      nama: namaBaru.trim(),
      email: emailBaru.trim().toLowerCase(),
    });
  };

  const handleResetPassword = async (user) => {
    const newPassword = window.prompt(
      "Masukkan password baru untuk " + user.nama + " (minimal 8 karakter):"
    );

    if (newPassword === null) return;

    if (newPassword.length < 8) {
      showMessage("Password minimal 8 karakter.", "error");
      return;
    }

    if (!window.confirm("Reset password akun " + user.email + "?")) {
      return;
    }

    await manageAccount(user.id, "reset_password", {
      password: newPassword,
    });
  };

  const handleToggleStatus = async (user) => {
    const isActive = user.status === "Aktif";
    const action = isActive ? "deactivate" : "activate";

    const confirmation = isActive
      ? "Nonaktifkan akun " + user.email + "?"
      : "Aktifkan kembali akun " + user.email + "?";

    if (!window.confirm(confirmation)) return;

    await manageAccount(user.id, action);
  };

  const handleDelete = async (user) => {
    const confirmation = window.confirm(
      "PERHATIAN!\n\nAkun " +
        user.email +
        " akan dihapus secara permanen dari Supabase Authentication.\n\nTindakan ini tidak dapat dibatalkan. Lanjutkan?"
    );

    if (!confirmation) return;

    await manageAccount(user.id, "delete");
  };

  return (
    <section style={{ width: "100%" }}>
      <div style={cardStyle}>
        <h2 style={headingStyle}>Pendaftaran Sekolah Baru</h2>

        <p style={descriptionStyle}>
          Daftarkan sekolah dan buat akun Wakasek pertama secara bersamaan.
        </p>

        {message && (
          <div
            role="alert"
            style={{
              padding: "12px 14px",
              marginBottom: "20px",
              borderRadius: "8px",
              background:
                messageType === "success" ? "#E8F7EE" : "#FDECEC",
              color: messageType === "success" ? "#18713B" : "#B42318",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField label="Nama Sekolah" id="nama-sekolah">
  <input
    id="nama-sekolah"
    type="text"
    value={namaSekolah}
    onChange={(event) => setNamaSekolah(event.target.value)}
    placeholder="Masukkan nama sekolah"
    required
    style={inputStyle}
  />
</FormField>

<FormField label="NPSN (opsional)" id="npsn-sekolah">
  <input
    id="npsn-sekolah"
    type="text"
    inputMode="numeric"
    maxLength={8}
    value={npsn}
    onChange={(event) => setNpsn(event.target.value.replace(/\D/g, ""))}
    placeholder="8 angka NPSN"
    style={inputStyle}
  />
</FormField>
          <FormField label="Nama Lengkap" id="nama-wakasek">
            <input
              id="nama-wakasek"
              type="text"
              value={nama}
              onChange={(event) => setNama(event.target.value)}
              placeholder="Masukkan nama lengkap"
              required
              style={inputStyle}
            />
          </FormField>

          <FormField label="Email" id="email-wakasek">
            <input
              id="email-wakasek"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              required
              style={inputStyle}
            />
          </FormField>

          <FormField label="Password Awal" id="password-wakasek">
            <input
              id="password-wakasek"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 8 karakter"
              minLength={8}
              required
              style={inputStyle}
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle(loading)}
          >
            {loading ? "Mendaftarkan..." : "Daftarkan Sekolah dan Wakasek"}
          </button>
        </form>
      </div>


      <div style={{ ...cardStyle, maxWidth: "none" }}>
        <div style={headerStyle}>
          <div>
            <h2 style={headingStyle}>Daftar Sekolah Terdaftar</h2>
            <p style={descriptionStyle}>
              Jumlah sekolah: {sekolahList.length}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSekolah}
            disabled={loadingSekolah}
            style={buttonStyle(loadingSekolah)}
          >
            {loadingSekolah ? "Memuat..." : "Muat Ulang"}
          </button>
        </div>

        {sekolahError && (
          <div style={errorStyle}>
            {sekolahError}
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#F1F5F9", color: "#173B68" }}>
                {[
                  "No.",
                  "Nama Sekolah",
                  "NPSN",
                  "Tanggal Terdaftar",
                  "Status",
                ].map((heading) => (
                  <th key={heading} style={thStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loadingSekolah ? (
                <tr>
                  <td colSpan={5} style={emptyCellStyle}>
                    Sedang memuat daftar sekolah...
                  </td>
                </tr>
              ) : sekolahError ? (
                <tr>
                  <td colSpan={5} style={emptyCellStyle}>
                    Gagal memuat data sekolah.
                  </td>
                </tr>
              ) : sekolahList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={emptyCellStyle}>
                    Belum ada sekolah yang terdaftar.
                  </td>
                </tr>
              ) : (
                sekolahList.map((sekolah, index) => (
                  <tr key={sekolah.id}>
                    <td style={cellStyle}>{index + 1}</td>
                    <td style={cellStyle}>
                      {sekolah.nama_sekolah}
                    </td>
                    <td style={cellStyle}>
                      {sekolah.npsn || "-"}
                    </td>
                    <td style={cellStyle}>
                      {sekolah.created_at
                        ? new Date(sekolah.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          ...statusStyle,
                          background:
                            sekolah.status === "aktif"
                              ? "#E8F7EE"
                              : "#FDECEC",
                          color:
                            sekolah.status === "aktif"
                              ? "#18713B"
                              : "#B42318",
                        }}
                      >
                        {sekolah.status === "aktif"
                          ? "Aktif"
                          : "Nonaktif"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      <div style={{ ...cardStyle, maxWidth: "none" }}>
        <div style={headerStyle}>
          <div>
            <h2 style={headingStyle}>Daftar Akun Wakasek</h2>
            <p style={descriptionStyle}>
              Jumlah akun: {wakasekList.length}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchWakasek}
            disabled={loadingList}
            style={buttonStyle(loadingList)}
          >
            {loadingList ? "Memuat..." : "Muat Ulang"}
          </button>
        </div>

        {listError && (
          <div style={errorStyle}>
            {listError}
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#F1F5F9", color: "#173B68" }}>
                {[
                  "No.",
                  "Nama Wakasek",
                  "Email",
                  "Tanggal Dibuat",
                  "Status",
                  "Aksi",
                ].map((heading) => (
                  <th key={heading} style={thStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loadingList ? (
                <tr>
                  <td colSpan={6} style={emptyCellStyle}>
                    Sedang memuat daftar akun...
                  </td>
                </tr>
              ) : wakasekList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyCellStyle}>
                    Belum ada akun Wakasek yang terdaftar.
                  </td>
                </tr>
              ) : (
                wakasekList.map((user, index) => {
                  const busy = actionLoading.startsWith(user.id);

                  return (
                    <tr key={user.id}>
                      <td style={cellStyle}>{index + 1}</td>
                      <td style={cellStyle}>{user.nama}</td>
                      <td style={cellStyle}>{user.email}</td>
                      <td style={cellStyle}>
                        {user.dibuat
                          ? new Date(user.dibuat).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            ...statusStyle,
                            background:
                              user.status === "Aktif" ? "#E8F7EE" : "#FDECEC",
                            color:
                              user.status === "Aktif" ? "#18713B" : "#B42318",
                          }}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <div style={actionsStyle}>
                          <ActionButton
                            disabled={busy}
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </ActionButton>

                          <ActionButton
                            disabled={busy}
                            onClick={() => handleResetPassword(user)}
                          >
                            Reset Password
                          </ActionButton>

                          <ActionButton
                            disabled={busy}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === "Aktif"
                              ? "Nonaktifkan"
                              : "Aktifkan"}
                          </ActionButton>

                          <ActionButton
                            disabled={busy}
                            danger
                            onClick={() => handleDelete(user)}
                          >
                            Hapus
                          </ActionButton>

                          {busy && (
                            <span style={{ fontSize: "12px", color: "#68788C" }}>
                              Memproses...
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function FormField({ label, id, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          marginBottom: "7px",
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionButton({ children, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "7px 10px",
        border: "1px solid",
        borderColor: danger ? "#F0B4B4" : "#CBD5E1",
        borderRadius: "6px",
        background: disabled ? "#E2E8F0" : danger ? "#FFF1F1" : "#FFFFFF",
        color: danger ? "#B42318" : "#173B68",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "12px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

const cardStyle = {
  padding: "28px",
  background: "#FFFFFF",
  border: "1px solid #D9E2EC",
  borderRadius: "12px",
  maxWidth: "760px",
  marginBottom: "28px",
};

const headingStyle = {
  color: "#173B68",
  marginTop: 0,
  marginBottom: "8px",
};

const descriptionStyle = {
  color: "#68788C",
  marginBottom: "24px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #CBD5E1",
  borderRadius: "8px",
  fontSize: "14px",
};

const buttonStyle = (disabled) => ({
  padding: "11px 18px",
  background: disabled ? "#8BA1BB" : "#173B68",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "8px",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 600,
});

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "20px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "950px",
  fontSize: "14px",
};

const thStyle = {
  padding: "13px 12px",
  textAlign: "left",
  borderBottom: "1px solid #D9E2EC",
  whiteSpace: "nowrap",
};

const cellStyle = {
  padding: "13px 12px",
  borderBottom: "1px solid #E2E8F0",
  color: "#334155",
  textAlign: "left",
  verticalAlign: "top",
};

const emptyCellStyle = {
  padding: "24px 12px",
  textAlign: "center",
  color: "#68788C",
};

const statusStyle = {
  display: "inline-block",
  padding: "5px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 600,
};

const actionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: "280px",
};

const errorStyle = {
  padding: "12px 14px",
  marginBottom: "16px",
  borderRadius: "8px",
  background: "#FDECEC",
  color: "#B42318",
};
