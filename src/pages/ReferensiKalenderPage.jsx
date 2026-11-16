
import { useState } from "react";
import {
  CalendarRange,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Info,
  CalendarDays,
  Clock3,
  Building2,
  X,
  Send,
} from "lucide-react";

import "../styles/ReferensiKalenderPage.css";
import {
  loadReferenceCalendarItems,
  saveReferenceCalendarItems,
  publishReferenceCalendarItem,
} from "../lib/calendarStorage";

import { readCalendarDocument } from "../lib/documentReader";
import { extractCalendarActivities } from "../lib/calendarExtractor";

function ReferensiKalenderPage() {
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [institution, setInstitution] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [isReadingDocument, setIsReadingDocument] = useState(false);
  const [documentReadResult, setDocumentReadResult] = useState(null);
  const [documentReadError, setDocumentReadError] = useState("");
  const [extractedActivities, setExtractedActivities] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [calendarItems, setCalendarItems] = useState(
    () => loadReferenceCalendarItems()
    );

  const [formData, setFormData] = useState({
    title: "",
    category: "Pembelajaran Efektif",
    startDate: "",
    endDate: "",
    description: "",
});

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedExtensions = /\.(pdf|xlsx|xls|csv)$/i;

    if (!allowedExtensions.test(file.name)) {
      alert("Gunakan file PDF, Excel, atau CSV.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10 MB.");
      event.target.value = "";
      return;
    }

    setDocumentFile(file);
  };


const handleReadDocument = async () => {
  if (!documentFile) {
    setDocumentReadError("Silakan pilih dokumen terlebih dahulu.");
    return;
  }

  setIsReadingDocument(true);
  setDocumentReadError("");
  setDocumentReadResult(null);

  try {
    const result = await readCalendarDocument(documentFile);

    if (!result.fullText.trim()) {
      throw new Error(
        "Teks tidak ditemukan. PDF mungkin berupa hasil scan dan memerlukan OCR."
      );
    }

    setDocumentReadResult(result);
    
    const activities = extractCalendarActivities(result);
    setExtractedActivities(activities);

  } catch (error) {
    console.error("Pembacaan dokumen gagal:", error);

    setDocumentReadError(
      error.message || "Dokumen gagal dibaca."
    );

  } finally {
    setIsReadingDocument(false);
  }
};


  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddItem = (event) => {
  event.preventDefault();

  if (!formData.title || !formData.startDate || !formData.endDate) {
    alert("Lengkapi nama kegiatan dan tanggal.");
    return;
  }

  if (formData.endDate < formData.startDate) {
    alert("Tanggal akhir tidak boleh sebelum tanggal mulai.");
    return;
  }

  const newItem = {
    id: Date.now(),
    ...formData,
    academicYear,
  };

  const updatedItems = [...calendarItems, newItem];

  const saved = saveReferenceCalendarItems(updatedItems);

  if (!saved) {
    alert("Gagal menyimpan data kalender.");
    return;
  }

  setCalendarItems(updatedItems);

  setFormData({
    title: "",
    category: "Pembelajaran Efektif",
    startDate: "",
    endDate: "",
    description: "",
  });

  setShowForm(false);

  alert("Butir kalender berhasil disimpan.");
};

  const handleDeleteItem = (id) => {
  const confirmed = window.confirm(
    "Hapus butir kalender ini dari daftar referensi?"
  );

  if (!confirmed) return;

  const updatedItems = calendarItems.filter(
    (item) => item.id !== id
  );

  const saved = saveReferenceCalendarItems(updatedItems);

  if (!saved) {
    alert("Gagal menghapus data kalender.");
    return;
  }

  setCalendarItems(updatedItems);
};
const handlePublishItem = (item) => {
  if (item.verificationStatus === "rejected") {
    alert("Kegiatan ini ditolak dan tidak dapat diteruskan ke Kalender Akademik.");
    return;
  }

  const confirmed = window.confirm(
    `Teruskan "${item.title}" ke Kalender Akademik sebagai draft?`
  );

  if (!confirmed) return;

  const result = publishReferenceCalendarItem(item);

  alert(result.message);
};

const handleExtractedChange = (id, field, value) => {
  setExtractedActivities((previous) =>
    previous.map((item) =>
      item.id === id
        ? { ...item, [field]: value }
        : item
    )
  );
};


const handleSaveExtractedActivities = () => {
  const acceptedActivities = extractedActivities.filter(
    (item) => item.verificationStatus !== "rejected"
  );

  if (acceptedActivities.length === 0) {
    alert("Tidak ada kegiatan yang akan disimpan. Semua kegiatan mungkin sudah ditolak.");
    return;
  }

  const invalidItem = acceptedActivities.find(
    (item) =>
      !item.title.trim() ||
      !item.startDate ||
      !item.endDate ||
      item.endDate < item.startDate
  );

  if (invalidItem) {
    alert(
      `Periksa kembali data kegiatan: ${invalidItem.title || "Nama belum diisi"}.`
    );
    return;
  }

  const confirmed = window.confirm(
    `Simpan ${acceptedActivities.length} kegiatan yang diterima ke Referensi Kalender Pendidikan? Kegiatan yang ditolak tidak akan disimpan.`
  );

  if (!confirmed) return;

  const preparedItems = acceptedActivities.map((item) => ({
    ...item,
    title: item.title.trim(),
    academicYear,
    verificationStatus: "reviewed",
  }));

  const existingKeys = new Set(
    calendarItems.map((item) =>
      [
        item.title,
        item.category,
        item.startDate,
        item.endDate,
        item.academicYear,
      ].join("|")
    )
  );

  const newItems = preparedItems.filter((item) => {
    const key = [
      item.title,
      item.category,
      item.startDate,
      item.endDate,
      item.academicYear,
    ].join("|");

    return !existingKeys.has(key);
  });

  const updatedItems = [...calendarItems, ...newItems];

  const saved = saveReferenceCalendarItems(updatedItems);

  if (!saved) {
    alert("Gagal menyimpan hasil pemeriksaan.");
    return;
  }

  setCalendarItems(updatedItems);

  const rejectedCount = extractedActivities.length - acceptedActivities.length;

  alert(
    `${newItems.length} kegiatan berhasil disimpan. ${rejectedCount} kegiatan ditolak dan tidak dimasukkan. Kegiatan yang sama tidak ditambahkan ulang.`
  );
};


const formatDate = (value) => {
  if (!value) return "-";

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};
const filteredItems = calendarItems.filter((item) =>
  String(item.title || "")
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);
  return (
    <div className="reference-calendar-page">

      {/* HEADER */}
      <section className="reference-calendar-heading">
        <div>
          <div className="reference-calendar-breadcrumb">
            MANAJEMEN KURIKULUM
            <span>/</span>
            REFERENSI KALENDER PENDIDIKAN
          </div>

          <h2>Referensi Kalender Pendidikan</h2>

          <p>
            Kelola dokumen dan tanggal penting berdasarkan kalender
            pendidikan resmi dari Dinas Pendidikan.
          </p>
        </div>

        <div className="reference-year-control">
          <label>Tahun Ajaran</label>
          <select
            value={academicYear}
            onChange={(event) => setAcademicYear(event.target.value)}
          >
            <option value="2026/2027">2026/2027</option>
            <option value="2027/2028">2027/2028</option>
          </select>
        </div>
      </section>

      {/* INFORMASI */}
      <section className="reference-calendar-banner">
        <div className="reference-banner-icon">
          <CalendarRange size={25} />
        </div>

        <div>
          <span>DOKUMEN ACUAN KALENDER SEKOLAH</span>
          <h3>Kalender Pendidikan Dinas</h3>
          <p>
            Tahun Ajaran {academicYear} · Dokumen resmi wilayah sekolah
          </p>
        </div>

        <div className="reference-banner-status">
          <span />
          {documentFile ? "Dokumen dipilih" : "Belum ada dokumen"}
        </div>
      </section>

      {/* GRID UTAMA */}
      <section className="reference-calendar-grid">

        {/* FORM DOKUMEN */}
        <article className="reference-panel">

          <div className="reference-panel-heading">
            <div>
              <h3>Identitas Dokumen</h3>
              <p>Informasi sumber kalender pendidikan.</p>
            </div>

            <FileText size={20} />
          </div>

          <div className="reference-form">

            <div className="reference-field">
              <label>Instansi Penerbit</label>
              <div className="reference-input-icon">
                <Building2 size={16} />
                <input
                  type="text"
                  placeholder="Contoh: Dinas Pendidikan Provinsi Jawa Barat"
                  value={institution}
                  onChange={(event) => setInstitution(event.target.value)}
                />
              </div>
            </div>

            <div className="reference-field">
              <label>Nomor Dokumen / Surat Edaran</label>
              <input
                type="text"
                placeholder="Masukkan nomor dokumen resmi"
                value={documentNumber}
                onChange={(event) =>
                  setDocumentNumber(event.target.value)
                }
              />
            </div>

            <div className="reference-field">
              <label>Tanggal Dokumen</label>
              <input
                type="date"
                value={documentDate}
                onChange={(event) =>
                  setDocumentDate(event.target.value)
                }
              />
            </div>

            <div className="reference-field">
              <label>Dokumen Kalender Pendidikan</label>

              <label className="reference-upload-area">
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  hidden
                />

                <span className="reference-upload-icon">
                  {documentFile?.name.match(/\.(xlsx|xls|csv)$/i) ? (
                    <FileSpreadsheet size={25} />
                  ) : (
                    <UploadCloud size={25} />
                  )}
                </span>

                <strong>
                  {documentFile
                    ? documentFile.name
                    : "Klik untuk memilih dokumen"}
                </strong>

                <small>PDF, Excel, atau CSV · Maksimal 10 MB</small>
              </label>
            </div>


{documentFile && (
  <div className="reference-read-actions">
    <button
      type="button"
      className="reference-read-button"
      onClick={handleReadDocument}
      disabled={isReadingDocument}
    >
      {isReadingDocument ? (
        <Clock3 size={16} />
      ) : (
        <FileText size={16} />
      )}

      {isReadingDocument
        ? "Sedang membaca dokumen..."
        : "Baca dan Analisis Dokumen"}
    </button>
  </div>
)}

{documentReadError && (
  <div className="reference-read-error" role="alert">
    {documentReadError}
  </div>
)}


            {documentFile && (
              <button
                type="button"
                className="reference-remove-file"
                onClick={() => setDocumentFile(null)}
              >
                <X size={14} />
                Batalkan pilihan dokumen
              </button>
            )}

            <div className="reference-form-note">
              <Info size={15} />
              File yang dipilih saat ini belum diunggah ke server.
              Pengunggahan permanen akan diaktifkan setelah database
              dan penyimpanan dokumen SIMKUR terhubung.
            </div>

          </div>

        </article>

        {/* RINGKASAN */}
        <article className="reference-panel reference-summary-panel">

          <div className="reference-panel-heading">
            <div>
              <h3>Ringkasan Referensi</h3>
              <p>Status kelengkapan dokumen acuan.</p>
            </div>

            <CheckCircle2 size={20} />
          </div>

          <div className="reference-summary-list">

            <div className="reference-summary-item">
              <span>Tahun Ajaran</span>
              <strong>{academicYear}</strong>
            </div>

            <div className="reference-summary-item">
              <span>Instansi Penerbit</span>
              <strong>{institution || "Belum diisi"}</strong>
            </div>

            <div className="reference-summary-item">
              <span>Nomor Dokumen</span>
              <strong>{documentNumber || "Belum diisi"}</strong>
            </div>

            <div className="reference-summary-item">
              <span>Tanggal Dokumen</span>
              <strong>{formatDate(documentDate)}</strong>
            </div>

            <div className="reference-summary-item">
              <span>Butir Kalender</span>
              <strong>{calendarItems.length} butir</strong>
            </div>

          </div>

          <div className="reference-summary-notice">
            <Info size={16} />
            <span>
              Periksa kesesuaian nomor, tanggal, dan penerbit
              sebelum referensi digunakan sebagai dasar kalender sekolah.
            </span>
          </div>

        </article>

      </section>


{/* HASIL PEMBACAAN DOKUMEN */}

{documentReadResult && (
  <section className="reference-panel document-preview-panel">

    <div className="reference-panel-heading">
      <div>
        <h3>Hasil Pembacaan Dokumen</h3>
        <p>
          Dokumen berhasil dibaca. Periksa isi teks sebelum diproses lebih lanjut.
        </p>
      </div>

      <CheckCircle2 size={21} />
    </div>

    <div className="document-preview-summary">
      <div>
        <span>Nama File</span>
        <strong>{documentReadResult.fileName}</strong>
      </div>

      <div>
        <span>Jenis Dokumen</span>
        <strong>
          {documentReadResult.fileType.toUpperCase()}
        </strong>
      </div>

      <div>
        <span>Jumlah Halaman / Baris</span>
        <strong>
          {documentReadResult.totalPages ??
            documentReadResult.totalRows}
        </strong>
      </div>
    </div>

    <div className="document-preview-text">
      <pre>{documentReadResult.fullText}</pre>
    </div>

  </section>
)}


{/* HASIL EKSTRAKSI KEGIATAN */}

{documentReadResult && (
  <section className="reference-panel extracted-calendar-panel">

    <div className="reference-panel-heading">
      <div>
        <h3>Kegiatan yang Berhasil Dikenali</h3>
        <p>
          Periksa hasil pembacaan. Terima kegiatan yang akan digunakan
          dan tolak kegiatan yang tidak diperlukan.
        </p>
      </div>

      <span className="extracted-count">
        {extractedActivities.length} kegiatan ditemukan
      </span>
    </div>

    {extractedActivities.length > 0 ? (
      <div className="reference-items-table-wrapper">
        <table className="reference-items-table">

          <thead>
            <tr>
              <th>Nama Kegiatan</th>
              <th>Kategori</th>
              <th>Tanggal Mulai</th>
              <th>Tanggal Selesai</th>
              <th>Sumber</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {extractedActivities.map((item) => (
              <tr key={item.id}>

                <td>
                  <input
                    className="extracted-edit-input"
                    type="text"
                    value={item.title}
                    disabled={item.verificationStatus === "rejected"}
                    onChange={(event) =>
                      handleExtractedChange(
                        item.id,
                        "title",
                        event.target.value
                      )
                    }
                  />
                </td>

                <td>
                  <select
                    className="extracted-edit-input"
                    value={item.category}
                    disabled={item.verificationStatus === "rejected"}
                    onChange={(event) =>
                      handleExtractedChange(
                        item.id,
                        "category",
                        event.target.value
                      )
                    }
                  >
                    <option>Pembelajaran Efektif</option>
                    <option>Awal/Akhir Semester</option>
                    <option>Libur Nasional</option>
                    <option>Cuti Bersama</option>
                    <option>Libur Sekolah</option>
                    <option>Libur Daerah</option>
                    <option>Asesmen</option>
                    <option>Kegiatan Dinas</option>
                    <option>Kegiatan Sekolah</option>
                    <option>Hari Penting Pendidikan</option>
                    <option>Lainnya</option>
                  </select>
                </td>

                <td>
                  <input
                    className="extracted-edit-input"
                    type="date"
                    value={item.startDate}
                    disabled={item.verificationStatus === "rejected"}
                    onChange={(event) =>
                      handleExtractedChange(
                        item.id,
                        "startDate",
                        event.target.value
                      )
                    }
                  />
                </td>

                <td>
                  <input
                    className="extracted-edit-input"
                    type="date"
                    value={item.endDate}
                    disabled={item.verificationStatus === "rejected"}
                    onChange={(event) =>
                      handleExtractedChange(
                        item.id,
                        "endDate",
                        event.target.value
                      )
                    }
                  />
                </td>

                <td>
                  {item.sourcePage
                    ? `Halaman ${item.sourcePage}`
                    : item.sourceRow
                      ? `Baris ${item.sourceRow}`
                      : "Dokumen"}
                </td>

                <td>
                  {item.verificationStatus === "rejected" ? (
                    <span className="extracted-rejected-status">
                      Ditolak
                    </span>
                  ) : (
                    <span className="extracted-review-status">
                      Perlu diperiksa
                    </span>
                  )}
                </td>

                <td>
                  {item.verificationStatus === "rejected" ? (
                    <button
                      type="button"
                      className="extracted-restore-button"
                      onClick={() =>
                        handleExtractedChange(
                          item.id,
                          "verificationStatus",
                          "pending"
                        )
                      }
                    >
                      Pulihkan
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="extracted-reject-button"
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Tolak kegiatan "${item.title}"? Kegiatan ini tidak akan dimasukkan ke kalender sekolah.`
                        );

                        if (confirmed) {
                          handleExtractedChange(
                            item.id,
                            "verificationStatus",
                            "rejected"
                          );
                        }
                      }}
                    >
                      <X size={14} />
                      Tolak
                    </button>
                  )}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    ) : (
      <div className="reference-empty">
        <FileText size={27} />
        <strong>Belum ditemukan kegiatan bertanggal</strong>
        <span>
          Periksa teks hasil pembacaan. Format tanggal atau
          susunan tabel dokumen mungkin belum dikenali.
        </span>
      </div>
    )}

    <div className="extracted-save-actions">
      <button
        type="button"
        className="reference-primary-button"
        onClick={handleSaveExtractedActivities}
      >
        <CheckCircle2 size={16} />
        Simpan Hasil Pemeriksaan
      </button>
    </div>

  </section>
)}


      {/* BUTIR KALENDER */}
      <section className="reference-panel reference-items-panel">

        <div className="reference-panel-heading">
          <div>
            <h3>Butir Kalender Pendidikan</h3>
            <p>
              Catat tanggal penting berdasarkan dokumen resmi yang telah diperiksa.
            </p>
          </div>

          <button
            className="reference-primary-button"
            onClick={() => setShowForm((previous) => !previous)}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Tutup Formulir" : "Tambah Butir Kalender"}
          </button>
        </div>

        {showForm && (
          <form
            className="reference-item-form"
            onSubmit={handleAddItem}
          >

            <div className="reference-field reference-field-wide">
              <label>Nama Kegiatan / Periode</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Contoh: Awal tahun ajaran"
                required
              />
            </div>

            <div className="reference-field">
              <label>Kategori</label>
              <select
  name="category"
  value={formData.category}
  onChange={handleFormChange}
>
  <option>Pembelajaran Efektif</option>
  <option>Awal/Akhir Semester</option>
  <option>Libur Nasional</option>
  <option>Cuti Bersama</option>
  <option>Libur Sekolah</option>
  <option>Libur Daerah</option>
  <option>Asesmen</option>
  <option>Kegiatan Dinas</option>
  <option>Kegiatan Sekolah</option>
  <option>Hari Penting Pendidikan</option>
  <option>Lainnya</option>
</select>
            </div>

            <div className="reference-field">
              <label>Tanggal Mulai</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="reference-field">
              <label>Tanggal Selesai</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="reference-field reference-field-wide">
              <label>Keterangan</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Keterangan berdasarkan dokumen sumber..."
                rows={3}
              />
            </div>

            <div className="reference-form-actions">
              <button
                type="button"
                className="reference-secondary-button"
                onClick={() => setShowForm(false)}
              >
                Batal
              </button>

              <button
                type="submit"
                className="reference-primary-button"
              >
                <Plus size={15} />
                Simpan Butir
              </button>
            </div>

          </form>
        )}

        <div className="reference-items-toolbar">
          <div className="reference-items-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari nama kegiatan..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <span>
            {filteredItems.length} dari {calendarItems.length} butir
          </span>
        </div>

        <div className="reference-items-table-wrapper">

          <table className="reference-items-table">
            <thead>
              <tr>
                <th>Nama Kegiatan</th>
                <th>Kategori</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>

              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.title}</strong></td>
                  <td>
                    <span className="reference-category-badge">
                      {item.category}
                    </span>
                  </td>
                  <td>{formatDate(item.startDate)}</td>
                  <td>{formatDate(item.endDate)}</td>
                  <td>{item.description || "-"}</td>
                  <td>
  <div className="reference-row-actions">

    <button
      className="reference-publish-button"
      onClick={() => handlePublishItem(item)}
      title="Teruskan ke Kalender Akademik"
    >
      <Send size={14} />
      Teruskan
    </button>

    <button
      className="reference-delete-button"
      onClick={() => handleDeleteItem(item.id)}
      title="Hapus butir referensi"
    >
      <Trash2 size={16} />
    </button>

  </div>
</td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="reference-empty">
                    <CalendarDays size={27} />
                    <strong>Belum ada butir kalender</strong>
                    <span>
                      Tambahkan tanggal penting berdasarkan dokumen
                      Kalender Pendidikan Dinas.
                    </span>
                  </td>
                </tr>
              )}

            </tbody>
          </table>

        </div>

      </section>

      {/* CATATAN */}
      <div className="reference-calendar-note">
        <Clock3 size={15} />
        Semua perubahan di halaman ini masih bersifat sementara
        selama sesi browser. Penyimpanan permanen dan pembacaan
        otomatis dokumen akan dibuat pada tahap integrasi database.
      </div>

    </div>
  );
}

export default ReferensiKalenderPage;
