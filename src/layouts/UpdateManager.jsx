
import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import {
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  MonitorDown,
} from "lucide-react";

export default function UpdateManager() {
  const [open, setOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState("-");
  const [availableUpdate, setAvailableUpdate] = useState(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;

    getVersion()
      .then(setCurrentVersion)
      .catch(() => setCurrentVersion("Tidak diketahui"));
  }, []);

  const handleCheck = async () => {
    setChecking(true);
    setError("");
    setMessage("");
    setAvailableUpdate(null);
    setProgressVisible(false);

    try {
      if (!isTauri()) {
        throw new Error(
          "Pemeriksaan pembaruan hanya tersedia pada aplikasi desktop SIMKUR."
        );
      }

      const update = await check();

      if (update) {
        setAvailableUpdate(update);
        setMessage("Pembaruan versi terbaru tersedia.");
      } else {
        setMessage("SIMKUR sudah menggunakan versi terbaru.");
      }
    } catch (err) {
      setError(
        err?.message || "Gagal memeriksa pembaruan. Periksa koneksi internet."
      );
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async () => {
    if (!availableUpdate) return;

    setInstalling(true);
    setError("");
    setMessage("Sedang mengunduh pembaruan...");
    setProgress(0);
    setProgressVisible(true);

    let downloaded = 0;
    let total = 0;

    try {
      await availableUpdate.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength || 0;
          downloaded = 0;
          setProgress(0);
        }

        if (event.event === "Progress") {
          downloaded += event.data.chunkLength || 0;

          if (total > 0) {
            setProgress(
              Math.min(100, Math.round((downloaded / total) * 100))
            );
          }
        }

        if (event.event === "Finished") {
          setProgress(100);
          setMessage("Unduhan selesai. Menyiapkan pemasangan...");
        }
      });

      setMessage(
        "Pembaruan berhasil diproses. Ikuti proses pemasangan yang muncul."
      );
    } catch (err) {
      setError(
        err?.message || "Pemasangan pembaruan gagal. Silakan coba kembali."
      );
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="topbar-icon simkur-update-trigger"
        title="Pembaruan SIMKUR"
        aria-label="Pembaruan SIMKUR"
        onClick={() => setOpen(true)}
      >
        <MonitorDown size={19} />
      </button>

      {open && (
        <div
          className="simkur-update-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !installing) {
              setOpen(false);
            }
          }}
        >
          <section
            className="simkur-update-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="simkur-update-title"
          >
            <div className="simkur-update-header">
              <div className="simkur-update-heading">
                <div className="simkur-update-logo">
                  <MonitorDown size={25} />
                </div>

                <div>
                  <h2 id="simkur-update-title">
                    Pembaruan SIMKUR
                  </h2>
                  <p>Pemeriksaan dan pemasangan versi terbaru</p>
                </div>
              </div>

              <button
                type="button"
                className="simkur-update-close"
                onClick={() => setOpen(false)}
                disabled={installing}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <div className="simkur-update-content">
              <div className="simkur-update-version">
                <div>
                  <span>VERSI TERPASANG</span>
                  <strong>{currentVersion}</strong>
                </div>

                <div>
                  <span>VERSI TERBARU</span>
                  <strong>
                    {availableUpdate?.version || "-"}
                  </strong>
                </div>
              </div>

              {message && (
                <div className="simkur-update-message">
                  <CheckCircle2 size={19} />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="simkur-update-error">
                  <AlertCircle size={19} />
                  <span>{error}</span>
                </div>
              )}

              {availableUpdate && (
                <div className="simkur-update-notes">
                  <h3>Catatan pembaruan</h3>
                  <p>
                    {availableUpdate.body ||
                      "Tidak ada catatan pembaruan yang disertakan."}
                  </p>

                  {availableUpdate.date && (
                    <span>
                      Tanggal rilis:{" "}
                      {new Date(availableUpdate.date).toLocaleString(
                        "id-ID"
                      )}
                    </span>
                  )}
                </div>
              )}

              {progressVisible && (
                <div className="simkur-update-progress">
                  <div className="simkur-update-progress-label">
                    <span>Progres unduhan</span>
                    <strong>{progress}%</strong>
                  </div>

                  <div className="simkur-update-progress-track">
                    <div
                      className="simkur-update-progress-value"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="simkur-update-security">
                Pembaruan resmi SIMKUR diverifikasi menggunakan tanda
                tangan digital sebelum dipasang.
              </p>
            </div>

            <div className="simkur-update-actions">
              <button
                type="button"
                className="simkur-update-check"
                onClick={handleCheck}
                disabled={checking || installing}
              >
                <RefreshCw
                  size={17}
                  className={checking ? "simkur-update-spin" : ""}
                />
                {checking ? "Memeriksa..." : "Periksa Pembaruan"}
              </button>

              {availableUpdate && (
                <button
                  type="button"
                  className="simkur-update-install"
                  onClick={handleInstall}
                  disabled={installing || checking}
                >
                  <Download size={17} />
                  {installing ? "Memasang..." : "Unduh dan Pasang"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
