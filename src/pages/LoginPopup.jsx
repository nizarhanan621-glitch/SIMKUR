
import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  School,
  CheckCircle2,
  BookOpen,
  ChartNoAxesCombined,
  FileText,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "../styles/LoginPopup.css";

function LoginPopup({ accessError = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
    } catch (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Email atau password tidak sesuai."
          : err.message || "Login gagal. Silakan coba kembali."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
  className="login-overlay"
  onMouseMove={(event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    event.currentTarget.style.setProperty("--matrix-x", `${x * 45}px`);
    event.currentTarget.style.setProperty("--matrix-y", `${y * 35}px`);
  }}
  onMouseLeave={(event) => {
    event.currentTarget.style.setProperty("--matrix-x", "0px");
    event.currentTarget.style.setProperty("--matrix-y", "0px");
  }}
>
  <div className="login-matrix-world" aria-hidden="true">
    <div className="login-matrix-grid"></div>
    <div className="login-matrix-code"></div>
    <div className="login-matrix-glow"></div>

<svg
  className="login-data-chart"
  viewBox="0 0 1200 600"
  preserveAspectRatio="none"
  aria-hidden="true"
>
  <defs>
    <filter id="chartGlow">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <g className="chart-lines" filter="url(#chartGlow)">
    <polyline
      className="chart-line-blue"
      points="20,390 180,300 280,350 390,160 530,210 610,390 750,130 890,260 1010,100 1180,170"
    />
    <polyline
      className="chart-line-cyan"
      points="20,500 180,180 300,430 440,320 550,500 690,260 830,420 970,300 1180,450"
    />
  </g>

  <g className="chart-points-blue">
    <circle cx="180" cy="300" r="8" />
    <circle cx="280" cy="350" r="8" />
    <circle cx="390" cy="160" r="8" />
    <circle cx="610" cy="390" r="8" />
    <circle cx="750" cy="130" r="8" />
    <circle cx="890" cy="260" r="8" />
    <circle cx="1010" cy="100" r="8" />
  </g>

  <g className="chart-points-cyan">
    <circle cx="180" cy="180" r="8" />
    <circle cx="300" cy="430" r="8" />
    <circle cx="440" cy="320" r="8" />
    <circle cx="550" cy="500" r="8" />
    <circle cx="690" cy="260" r="8" />
    <circle cx="830" cy="420" r="8" />
    <circle cx="970" cy="300" r="8" />
  </g>
</svg>

  </div>
      <div
  className="login-popup"
  onMouseMove={(event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    event.currentTarget.style.setProperty("--tilt-x", `${-y * 5}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 6}deg`);
    event.currentTarget.style.setProperty("--shadow-x", `${x * 22}px`);
    event.currentTarget.style.setProperty("--shadow-y", `${y * 22}px`);
  }}
  onMouseLeave={(event) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
    event.currentTarget.style.setProperty("--shadow-x", "0px");
    event.currentTarget.style.setProperty("--shadow-y", "0px");
  }}
>

        {/* PANEL KIRI */}
        <section className="login-info-panel">
          <div className="login-brand">
            <div className="login-logo">
              <School size={34} />
            </div>
            <div>
              <h1>SIMKUR SMP</h1>
              <span>Sistem Informasi Manajemen Kurikulum</span>
            </div>
          </div>

          <div className="login-info-content">
            <span className="login-eyebrow">
              PENGELOLAAN KURIKULUM TERINTEGRASI
            </span>

            <h2>
              Kurikulum Tertata,
              <br />
              Pembelajaran
              <br />
              Lebih Bermakna.
            </h2>

            <p>
              SIMKUR SMP membantu sekolah mengelola seluruh
              kegiatan kurikulum secara terencana, sistematis,
              dan terintegrasi. Mulai dari perencanaan hingga
              evaluasi pembelajaran.
            </p>

            <div className="login-feature-heading">
              <span>ALUR KERJA TERPADU</span>
              <div></div>
            </div>

            <div className="login-features">
              <div>
                <BookOpen />
                <section>
                  <strong>01. Perencanaan</strong>
                  <span>Program kerja, jadwal, dan administrasi pembelajaran.</span>
                </section>
              </div>

              <div>
                <FileText />
                <section>
                  <strong>02. Pelaksanaan</strong>
                  <span>Dokumentasi kegiatan dan jurnal pembelajaran.</span>
                </section>
              </div>

              <div>
                <ChartNoAxesCombined />
                <section>
                  <strong>03. Monitoring</strong>
                  <span>Pemantauan keterlaksanaan kegiatan belajar mengajar.</span>
                </section>
              </div>

              <div>
                <CheckCircle2 />
                <section>
                  <strong>04. Evaluasi</strong>
                  <span>Pelaporan dan tindak lanjut peningkatan mutu sekolah.</span>
                </section>
              </div>
            </div>

            <div className="login-inspiration">
              <span>“</span>
              <p>
                Pendidikan berkualitas dimulai dari perencanaan
                yang baik, pelaksanaan yang konsisten, dan
                evaluasi yang berkelanjutan.
              </p>
            </div>
          </div>

          <div className="login-info-footer">
            SIMKUR SMP · Sistem Informasi Manajemen Kurikulum
          </div>
        </section>

        {/* PANEL KANAN */}
        <section className="login-form-panel">
          <div className="login-form-inner">
            <div className="login-form-heading">
              <span className="login-welcome">SELAMAT DATANG</span>
              <h2>Masuk ke Akun</h2>
              <p>Gunakan akun yang telah diberikan administrator.</p>
            </div>

            {(accessError || error) && (
              <div className="login-error">
                {error || accessError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <label htmlFor="login-email">Email</label>
              <div className="login-input">
                <Mail size={19} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  autoComplete="username"
                  required
                />
              </div>

              <label htmlFor="login-password">Password</label>
              <div className="login-input">
                <LockKeyhole size={19} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan atau sembunyikan password"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? "MEMERIKSA AKUN..." : "MASUK"}
              </button>
            </form>

            <div className="login-security">
              <LockKeyhole size={15} />
              <span>Akses dilindungi autentikasi akun.</span>
            </div>
          </div>

          <div className="login-form-footer">
            © SIMKUR SMP
          </div>
        </section>

      </div>
    </div>
  );
}

export default LoginPopup;
