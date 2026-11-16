
import { useEffect, useState } from "react";
import {
  ImagePlus,
  Save,
  RotateCcw,
  Upload,
  Image,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  DEFAULT_APPEARANCE,
  loadSchoolAppearance,
  saveSchoolAppearance,
  resetSchoolAppearance,
} from "../lib/appearanceStorage";

import "../styles/PengaturanTampilan.css";

// Identitas sementara untuk pengujian lokal.
// Nantinya diganti dengan ID sekolah dari akun yang login.
const LOCAL_SCHOOL_ID = "simkur-local-preview";

function PengaturanTampilanPage() {
  const [appearance, setAppearance] = useState({
    ...DEFAULT_APPEARANCE,
  });

  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const saved = await loadSchoolAppearance(LOCAL_SCHOOL_ID);

        if (mounted) {
          setAppearance(saved);
        }
      } catch (error) {
        if (mounted) {
          setMessage(error.message || "Gagal memuat pengaturan.");
          setMessageType("error");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  // Membuat URL pratinjau dari foto yang dipilih.
  useEffect(() => {
    if (!appearance.imageBlob) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(appearance.imageBlob);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [appearance.imageBlob]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    // Memungkinkan file yang sama dipilih kembali.
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("File harus berupa gambar.");
      setMessageType("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Ukuran foto maksimal 5 MB.");
      setMessageType("error");
      return;
    }

    setAppearance((previous) => ({
      ...previous,
      imageBlob: file,
      imageName: file.name,
    }));

    setMessage("Foto berhasil dipilih. Simpan untuk menerapkan perubahan.");
    setMessageType("success");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      await saveSchoolAppearance(
        LOCAL_SCHOOL_ID,
        appearance
      );

      setMessage("Pengaturan tampilan berhasil disimpan.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Gagal menyimpan pengaturan.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Kembalikan tampilan ke pengaturan awal? Foto yang tersimpan pada pengaturan ini akan dihapus."
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      await resetSchoolAppearance(LOCAL_SCHOOL_ID);

      setAppearance({
        ...DEFAULT_APPEARANCE,
      });

      setMessage("Tampilan berhasil dikembalikan ke pengaturan awal.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Gagal mengembalikan tampilan.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="appearance-loading">
        Memuat pengaturan tampilan...
      </div>
    );
  }

  return (
    <div className="appearance-page">
      <div className="appearance-intro">
        <div className="appearance-intro-icon">
          <Image size={24} />
        </div>

        <div>
          <h2>Pengaturan Tampilan Sekolah</h2>
          <p>
            Sesuaikan foto latar dan tampilan dashboard
            agar mencerminkan identitas sekolah.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`appearance-message ${messageType}`}
          role="status"
        >
          {messageType === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{message}</span>
        </div>
      )}

      <div className="appearance-grid">
        <section className="appearance-card">
          <div className="appearance-card-heading">
            <div>
              <h3>Foto Latar Sekolah</h3>
              <p>Unggah foto lingkungan atau gedung sekolah.</p>
            </div>

            <ImagePlus size={21} />
          </div>

          <div
            className="appearance-preview"
            style={{
              backgroundImage: previewUrl
                ? `url("${previewUrl}")`
                : "linear-gradient(135deg, #dceafa, #f5f8fc, #cbdff2)",
              backgroundPosition: appearance.position,
            }}
          >
            <div
              className="appearance-preview-overlay"
              style={{
                backdropFilter: `blur(${appearance.blur}px)`,
                WebkitBackdropFilter: `blur(${appearance.blur}px)`,
                backgroundColor: `rgba(255, 255, 255, ${
                  appearance.overlay / 100
                })`,
              }}
            >
              <div className="appearance-preview-content">
                <div className="appearance-preview-logo">
                  <Image size={24} />
                </div>
                <strong>SIMKUR SMP</strong>
                <span>Dashboard Sekolah</span>
              </div>
            </div>
          </div>

          <div className="appearance-file-info">
            <span>
              {appearance.imageName || "Belum ada foto khusus"}
            </span>
            <span>Maksimal 5 MB</span>
          </div>

          <label className="appearance-upload-button">
            <Upload size={17} />
            <span>Pilih Foto Sekolah</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
            />
          </label>

          <p className="appearance-hint">
            Format yang disarankan: JPG, PNG, atau WebP.
            Gunakan foto horizontal agar hasilnya lebih baik.
          </p>
        </section>

        <section className="appearance-card">
          <div className="appearance-card-heading">
            <div>
              <h3>Penyesuaian Tampilan</h3>
              <p>Atur kenyamanan tampilan foto latar.</p>
            </div>
          </div>

          <div className="appearance-control">
            <div className="appearance-control-label">
              <label htmlFor="appearance-blur">
                Tingkat Blur
              </label>
              <strong>{appearance.blur}px</strong>
            </div>

            <input
              id="appearance-blur"
              type="range"
              min="0"
              max="12"
              step="1"
              value={appearance.blur}
              onChange={(event) =>
                setAppearance((previous) => ({
                  ...previous,
                  blur: Number(event.target.value),
                }))
              }
            />

            <div className="appearance-range-labels">
              <span>Jelas</span>
              <span>Lebih kabur</span>
            </div>
          </div>

          <div className="appearance-control">
            <div className="appearance-control-label">
              <label htmlFor="appearance-overlay">
                Transparansi Lapisan Putih
              </label>
              <strong>{appearance.overlay}%</strong>
            </div>

            <input
              id="appearance-overlay"
              type="range"
              min="0"
              max="90"
              step="5"
              value={appearance.overlay}
              onChange={(event) =>
                setAppearance((previous) => ({
                  ...previous,
                  overlay: Number(event.target.value),
                }))
              }
            />

            <div className="appearance-range-labels">
              <span>Foto terlihat</span>
              <span>Lebih putih</span>
            </div>
          </div>

          <div className="appearance-control">
            <label htmlFor="appearance-position">
              Posisi Foto
            </label>

            <select
              id="appearance-position"
              value={appearance.position}
              onChange={(event) =>
                setAppearance((previous) => ({
                  ...previous,
                  position: event.target.value,
                }))
              }
            >
              <option value="center">Tengah</option>
              <option value="top">Atas</option>
              <option value="bottom">Bawah</option>
            </select>
          </div>

          <div className="appearance-note">
            <strong>Catatan</strong>
            <p>
              Pengaturan ini akan memengaruhi tampilan
              latar dashboard, bukan ukuran sidebar,
              header, atau area konten.
            </p>
          </div>
        </section>
      </div>

      <div className="appearance-actions">
        <button
          type="button"
          className="appearance-reset-button"
          onClick={handleReset}
          disabled={saving}
        >
          <RotateCcw size={17} />
          Kembalikan Default
        </button>

        <button
          type="button"
          className="appearance-save-button"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={17} />
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>

      <div className="appearance-local-notice">
        <AlertCircle size={17} />
        <span>
          Saat ini pengaturan disimpan pada browser perangkat
          ini. Sinkronisasi antarperangkat akan diaktifkan
          setelah SIMKUR terhubung ke database online.
        </span>
      </div>
    </div>
  );
}

export default PengaturanTampilanPage;
