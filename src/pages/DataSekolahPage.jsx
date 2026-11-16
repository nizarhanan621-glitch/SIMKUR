
import { useEffect, useState } from "react";
import {
  School,
  MapPin,
  Phone,
  Mail,
  Globe,
  UserRound,
  Save,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import {
  getDataSekolah,
  simpanDataSekolah,
} from "../utils/dataSekolahStorage";

import "../styles/DataSekolah.css";

function DataSekolahPage({ role }) {
  const [formData, setFormData] = useState(() => getDataSekolah());
  const [dataTersimpan, setDataTersimpan] = useState(() =>
    getDataSekolah()
  );
  const [pesan, setPesan] = useState("");

  const hanyaBaca = role !== "wakasek";

  useEffect(() => {
    const perbaruiData = () => {
      const data = getDataSekolah();
      setFormData(data);
      setDataTersimpan(data);
    };

    window.addEventListener(
      "simkur-data-sekolah-updated",
      perbaruiData
    );

    return () => {
      window.removeEventListener(
        "simkur-data-sekolah-updated",
        perbaruiData
      );
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((sebelumnya) => ({
      ...sebelumnya,
      [name]: value,
    }));

    setPesan("");
  };

  const handleSimpan = (event) => {
    event.preventDefault();

    if (hanyaBaca) return;

    if (!formData.namaSekolah.trim()) {
      setPesan("Nama sekolah wajib diisi.");
      return;
    }

    if (
      formData.npsn &&
      !/^\d{8}$/.test(formData.npsn)
    ) {
      setPesan("NPSN harus terdiri dari 8 angka.");
      return;
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      setPesan("Format alamat email belum benar.");
      return;
    }

    const berhasil = simpanDataSekolah(formData);

    if (berhasil) {
      const data = getDataSekolah();
      setFormData(data);
      setDataTersimpan(data);
      setPesan("Identitas sekolah berhasil disimpan.");
    } else {
      setPesan("Data gagal disimpan. Silakan coba kembali.");
    }
  };

  const handleBatal = () => {
    setFormData({ ...dataTersimpan });
    setPesan("");
  };

  const field = (label, name, placeholder = "", type = "text") => (
    <div className="ds-form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={formData[name] || ""}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={hanyaBaca}
      />
    </div>
  );

  const selectField = (label, name, options) => (
    <div className="ds-form-group">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        disabled={hanyaBaca}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="ds-page">
      <section className="ds-welcome">
        <div className="ds-welcome-icon">
          <School size={28} />
        </div>

        <div className="ds-welcome-text">
          <span className="ds-eyebrow">PUSAT DATA SEKOLAH</span>
          <h2>Identitas Sekolah</h2>
          <p>
            Informasi resmi sekolah sebagai sumber data utama
            bagi seluruh modul SIMKUR SMP.
          </p>
        </div>
      </section>

      <div className="ds-access-info">
        <ShieldCheck size={19} />
        <div>
          <strong>
            {hanyaBaca
              ? "Mode Lihat Data"
              : "Pengelolaan Identitas Sekolah"}
          </strong>
          <p>
            {hanyaBaca
              ? "Operator hanya dapat melihat data sekolah. Pengisian dan perubahan data dilakukan oleh Wakasek Kurikulum."
              : "Silakan lengkapi identitas resmi sekolah. Data yang disimpan akan menjadi referensi bagi modul SIMKUR lainnya."}
          </p>
        </div>
      </div>

      <form className="ds-form-card" onSubmit={handleSimpan}>
        <div className="ds-form-heading">
          <div className="ds-form-heading-icon">
            <School size={20} />
          </div>
          <div>
            <h3>Informasi Umum Sekolah</h3>
            <p>Identitas dasar dan status satuan pendidikan.</p>
          </div>
        </div>

        <div className="ds-form-grid">
          {field("NPSN", "npsn", "Masukkan 8 digit NPSN")}
          {field("Nama Resmi Sekolah", "namaSekolah", "Nama sekolah sesuai dokumen resmi")}
          {selectField("Jenjang Pendidikan", "jenjang", ["SMP", "SD", "SMA", "SMK", "SLB", "Lainnya"])}
          {selectField("Status Sekolah", "statusSekolah", ["Negeri", "Swasta"])}
        </div>

        <div className="ds-form-divider" />

        <div className="ds-form-heading">
          <div className="ds-form-heading-icon">
            <MapPin size={20} />
          </div>
          <div>
            <h3>Alamat Sekolah</h3>
            <p>Lokasi dan alamat lengkap satuan pendidikan.</p>
          </div>
        </div>

        <div className="ds-form-grid">
          {field("Alamat Jalan", "alamatJalan", "Nama jalan, nomor, atau dusun")}
          {field("Desa / Kelurahan", "kelurahan", "Nama desa atau kelurahan")}
          {field("Kecamatan", "kecamatan", "Nama kecamatan")}
          {field("Kabupaten / Kota", "kabupatenKota", "Nama kabupaten atau kota")}
          {field("Provinsi", "provinsi", "Nama provinsi")}
          {field("Kode Pos", "kodePos", "Kode pos")}
        </div>

        <div className="ds-form-divider" />

        <div className="ds-form-heading">
          <div className="ds-form-heading-icon">
            <Phone size={20} />
          </div>
          <div>
            <h3>Kontak Sekolah</h3>
            <p>Informasi komunikasi resmi sekolah.</p>
          </div>
        </div>

        <div className="ds-form-grid">
          {field("Nomor Telepon", "telepon", "Nomor telepon sekolah", "tel")}
          {field("Alamat Email", "email", "contoh@sekolah.sch.id", "email")}
          {field("Website Sekolah", "website", "https://www.sekolah.sch.id")}
        </div>

        <div className="ds-form-divider" />

        <div className="ds-form-heading">
          <div className="ds-form-heading-icon">
            <UserRound size={20} />
          </div>
          <div>
            <h3>Identitas Kepala Sekolah</h3>
            <p>Data kepala sekolah yang sedang menjabat.</p>
          </div>
        </div>

        <div className="ds-form-grid">
          {field("Nama Kepala Sekolah", "namaKepalaSekolah", "Nama lengkap kepala sekolah")}
          {field("NIP Kepala Sekolah", "nipKepalaSekolah", "Nomor Induk Pegawai")}
        </div>

        {pesan && (
          <div
            className={`ds-form-message ${
              pesan.includes("berhasil") ? "success" : "error"
            }`}
          >
            {pesan.includes("berhasil") ? (
              <ShieldCheck size={17} />
            ) : (
              <AlertCircle size={17} />
            )}
            <span>{pesan}</span>
          </div>
        )}

        {!hanyaBaca && (
          <div className="ds-form-actions">
            <button
              type="button"
              className="ds-btn-cancel"
              onClick={handleBatal}
            >
              <RotateCcw size={16} />
              Batal
            </button>

            <button type="submit" className="ds-btn-save">
              <Save size={17} />
              Simpan Perubahan
            </button>
          </div>
        )}
      </form>

      <div className="ds-footer-note">
        <ShieldCheck size={18} />
        <p>
          Data identitas sekolah digunakan sebagai referensi bersama
          sesuai hak akses pengguna SIMKUR.
        </p>
      </div>
    </div>
  );
}

export default DataSekolahPage;
