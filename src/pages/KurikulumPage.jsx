
import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Clock3,
  Layers3,
  Target,
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  CalendarDays,
  Info,
  Settings2,
  Check,
} from "lucide-react";

import "../styles/KurikulumPage.css";
import {
  getKurikulumSekolah,
  simpanKurikulumSekolah,
} from "../utils/kurikulumSekolahStorage";
import {
  getStrukturKurikulum,
  simpanStrukturKurikulum,
} from "../utils/strukturKurikulumStorage";

const curriculumOptions = {
  merdeka: {
    name: "Kurikulum Merdeka",
    tabs: [
      "Struktur Kurikulum",
      "Capaian Pembelajaran (CP)",
      "Tujuan Pembelajaran (TP)",
      "Alur Tujuan Pembelajaran (ATP)",
      "Muatan Lokal",
    ],
    description:
      "Pengelolaan struktur kurikulum, capaian pembelajaran, tujuan pembelajaran, dan alur tujuan pembelajaran.",
  },

  k13: {
    name: "Kurikulum 2013 (K13)",
    tabs: [
      "Struktur Kurikulum",
      "Kompetensi Inti (KI)",
      "Kompetensi Dasar (KD)",
      "Silabus",
      "RPP dan Penilaian",
    ],
    description:
      "Pengelolaan struktur kurikulum, kompetensi inti, kompetensi dasar, silabus, dan rencana pelaksanaan pembelajaran.",
  },
};

/* Data contoh. Alokasi dan daftar mata pelajaran
   harus disesuaikan dengan dokumen resmi sekolah.
*/

const baseSubjects = [
  { code: "PAI", name: "Pendidikan Agama dan Budi Pekerti", hours: 3 },
  { code: "PP", name: "Pendidikan Pancasila", hours: 3 },
  { code: "BIND", name: "Bahasa Indonesia", hours: 5 },
  { code: "MAT", name: "Matematika", hours: 4 },
  { code: "IPA", name: "Ilmu Pengetahuan Alam", hours: 4 },
  { code: "IPS", name: "Ilmu Pengetahuan Sosial", hours: 3 },
  { code: "BING", name: "Bahasa Inggris", hours: 3 },
  { code: "PJOK", name: "Pendidikan Jasmani, Olahraga dan Kesehatan", hours: 2 },
  { code: "INF", name: "Informatika", hours: 2 },
  { code: "SBD", name: "Seni dan Budaya", hours: 2 },
];

const subjectData = ["VII", "VIII", "IX"].flatMap((grade) =>
  baseSubjects.map((subject) => ({
    ...subject,
    grade,
    category: "Wajib",
  }))
);

function KurikulumPage() {
  const [activeTab, setActiveTab] = useState("Struktur Kurikulum");

  const [selectedGrade, setSelectedGrade] = useState("VII");

  const [selectedYear, setSelectedYear] = useState("2026/2027");
  const [subjectsByGrade, setSubjectsByGrade] = useState(
  () => getStrukturKurikulum()
);

const [curriculumByGrade, setCurriculumByGrade] = useState(() => {
  const dataKurikulum = getKurikulumSekolah();
  const dataPerKelas = dataKurikulum.kurikulumPerKelas || {};

  const ubahKeKode = (nilai) => {
    if (nilai === "Kurikulum Merdeka" || nilai === "merdeka") {
      return "merdeka";
    }

    if (
      nilai === "Kurikulum 2013" ||
      nilai === "Kurikulum 2013 (K13)" ||
      nilai === "k13"
    ) {
      return "k13";
    }

    return "merdeka";
  };

  return {
    VII: ubahKeKode(dataPerKelas.VII),
    VIII: ubahKeKode(dataPerKelas.VIII),
    IX: ubahKeKode(dataPerKelas.IX),
  };
});

const [showSubjectForm, setShowSubjectForm] = useState(false);

const [editingSubject, setEditingSubject] = useState(null);

const [subjectForm, setSubjectForm] = useState({
  code: "",
  name: "",
  grade: "VII",
  hours: 2,
  category: "Wajib",
});


  const [searchTerm, setSearchTerm] = useState("");

  const selectedCurriculum = curriculumByGrade[selectedGrade];

  const currentCurriculum = curriculumOptions[selectedCurriculum];

  const currentTabs = currentCurriculum.tabs;

  
const dataMataPelajaran =
  subjectsByGrade[selectedGrade] || [];

const filteredSubjects = dataMataPelajaran.filter((subject) => {
  const matchesSearch =
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase());

  return matchesSearch;
});


  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    setActiveTab("Struktur Kurikulum");
    setSearchTerm("");
  };

  const handleCurriculumChange = (value) => {
  const dataBaru = {
    ...curriculumByGrade,
    [selectedGrade]: value,
  };

  setCurriculumByGrade(dataBaru);

  const dataTersimpan = getKurikulumSekolah();

  simpanKurikulumSekolah({
    ...dataTersimpan,
    kurikulumPerKelas: {
      VII:
        dataBaru.VII === "merdeka"
          ? "Kurikulum Merdeka"
          : "Kurikulum 2013",
      VIII:
        dataBaru.VIII === "merdeka"
          ? "Kurikulum Merdeka"
          : "Kurikulum 2013",
      IX:
        dataBaru.IX === "merdeka"
          ? "Kurikulum Merdeka"
          : "Kurikulum 2013",
    },
  });

  setActiveTab("Struktur Kurikulum");
};
const handleAddSubject = () => {
  setEditingSubject(null);

  setSubjectForm({
    code: "",
    name: "",
    grade: selectedGrade,
    hours: 2,
    category: "Wajib",
  });

  setShowSubjectForm(true);
};

const handleEditSubject = (subject) => {
  setEditingSubject(subject);

  setSubjectForm({
    code: subject.code,
    name: subject.name,
    grade: subject.grade,
    hours: subject.hours,
    category: subject.category,
  });

  setShowSubjectForm(true);
};

const handleSubjectFormChange = (event) => {
  const { name, value } = event.target;

  setSubjectForm((previous) => ({
    ...previous,
    [name]: name === "hours" ? Number(value) : value,
  }));
};

const handleCloseSubjectForm = () => {
  setShowSubjectForm(false);
  setEditingSubject(null);
};
const handleSaveSubject = (event) => {
  event.preventDefault();

  if (
    !subjectForm.code.trim() ||
    !subjectForm.name.trim() ||
    subjectForm.hours < 1
  ) {
    alert("Kode, nama mata pelajaran, dan alokasi JP wajib diisi.");
    return;
  }

  const semuaData = getStrukturKurikulum();

  const kelasTujuan = subjectForm.grade;

  const daftarMapel = [...(semuaData[kelasTujuan] || [])];

  const kodeMapel = subjectForm.code.trim().toUpperCase();

  const kodeSudahAda = daftarMapel.some(
    (subject) =>
      subject.code.toUpperCase() === kodeMapel &&
      (
        !editingSubject ||
        subject.code !== editingSubject.code
      )
  );

  if (kodeSudahAda) {
    alert("Kode mata pelajaran sudah digunakan pada kelas tersebut.");
    return;
  }

  const dataMapelBaru = {
    code: kodeMapel,
    name: subjectForm.name.trim(),
    grade: kelasTujuan,
    hours: Number(subjectForm.hours),
    category: subjectForm.category,
  };

  let daftarBaru;

  if (editingSubject) {
    daftarBaru = daftarMapel.map((subject) =>
      subject.code === editingSubject.code
        ? dataMapelBaru
        : subject
    );
  } else {
    daftarBaru = [...daftarMapel, dataMapelBaru];
  }

  const berhasil = simpanStrukturKurikulum({
    ...semuaData,
    [kelasTujuan]: daftarBaru,
  });

  
if (!berhasil) {
  alert("Data mata pelajaran gagal disimpan.");
  return;
}

setSubjectsByGrade((previous) => ({
  ...previous,
  [kelasTujuan]: daftarBaru,
}));

setShowSubjectForm(false);
setEditingSubject(null);
alert("Mata pelajaran berhasil disimpan.");

};
  return (
    <div className="curriculum-page">

      {/* HEADER HALAMAN */}
      <section className="curriculum-heading">
        <div>
          <div className="curriculum-breadcrumb">
            MANAJEMEN KURIKULUM
            <ChevronRight size={13} />
            KURIKULUM
          </div>

          <h2>Manajemen Kurikulum</h2>

          <p>
            Kelola struktur kurikulum dan administrasi pembelajaran
            sesuai kurikulum yang diterapkan sekolah.
          </p>
        </div>

        <div className="curriculum-heading-actions">
          <button className="curriculum-secondary-button">
            <Download size={16} />
            Ekspor Data
          </button>

          <button className="curriculum-primary-button">
            <Plus size={17} />
            Tambah Data
          </button>
        </div>
      </section>
      
{/* PANEL PEMILIHAN KURIKULUM */}

<section className="curriculum-period-panel">

  <div className="curriculum-period-header">

    <div className="curriculum-period-title">
      <div className="period-title-icon">
        <Settings2 size={21} />
      </div>

      <div>
        <strong>Pengaturan Kurikulum</strong>
        <span>
          Tentukan kurikulum sesuai tingkat kelas dan tahun ajaran.
        </span>
      </div>
    </div>

    <div className="curriculum-year-control">
      <label htmlFor="curriculum-year">TAHUN AJARAN</label>

      <div className="curriculum-year-select">
        <CalendarDays size={17} />

        <select
          id="curriculum-year"
          value={selectedYear}
          onChange={(event) => setSelectedYear(event.target.value)}
        >
          <option value="2026/2027">2026/2027</option>
          <option value="2027/2028">2027/2028</option>
        </select>

        <ChevronDown size={16} />
      </div>
    </div>

  </div>

  <div className="curriculum-choice-grid">

    {/* PILIH TINGKAT */}

    <div className="curriculum-choice-section">

      <div className="curriculum-choice-heading">
        <div className="choice-heading-icon">
          <GraduationCap size={19} />
        </div>

        <div>
          <strong>Tingkat Kelas</strong>
          <span>Pilih tingkat yang akan dikelola</span>
        </div>
      </div>

      <div className="curriculum-grade-options">

        {["VII", "VIII", "IX"].map((grade) => (
          <button
            key={grade}
            type="button"
            aria-pressed={selectedGrade === grade}
            className={`curriculum-option-card ${
              selectedGrade === grade ? "selected" : ""
            }`}
            onClick={() => handleGradeChange(grade)}
          >
            <span className="curriculum-option-code">
              {grade}
            </span>

            <span className="curriculum-option-copy">
              <strong>Kelas {grade}</strong>
              <small>Jenjang SMP</small>
            </span>

            {selectedGrade === grade && (
              <span className="curriculum-option-check">
                <Check size={14} />
              </span>
            )}
          </button>
        ))}

      </div>

    </div>

    {/* PILIH JENIS KURIKULUM */}

    <div className="curriculum-choice-section">

      <div className="curriculum-choice-heading">
        <div className="choice-heading-icon">
          <BookOpen size={19} />
        </div>

        <div>
          <strong>Jenis Kurikulum</strong>
          <span>Pilih kurikulum untuk tingkat ini</span>
        </div>
      </div>

      <div className="curriculum-type-options">

        <button
          type="button"
          aria-pressed={selectedCurriculum === "merdeka"}
          className={`curriculum-type-card ${
            selectedCurriculum === "merdeka" ? "selected" : ""
          }`}
          onClick={() => handleCurriculumChange("merdeka")}
        >
          <span className="curriculum-type-icon">
            <BookOpen size={21} />
          </span>

          <span className="curriculum-type-copy">
            <strong>Kurikulum Merdeka</strong>
            <small>CP, TP, ATP, dan modul ajar</small>
          </span>

          {selectedCurriculum === "merdeka" && (
            <span className="curriculum-option-check">
              <Check size={14} />
            </span>
          )}
        </button>

        <button
          type="button"
          aria-pressed={selectedCurriculum === "k13"}
          className={`curriculum-type-card ${
            selectedCurriculum === "k13" ? "selected" : ""
          }`}
          onClick={() => handleCurriculumChange("k13")}
        >
          <span className="curriculum-type-icon">
            <ClipboardList size={21} />
          </span>

          <span className="curriculum-type-copy">
            <strong>Kurikulum 2013 (K13)</strong>
            <small>KI, KD, silabus, dan RPP</small>
          </span>

          {selectedCurriculum === "k13" && (
            <span className="curriculum-option-check">
              <Check size={14} />
            </span>
          )}
        </button>

      </div>

    </div>

  </div>

  <div className="curriculum-setting-note">
  <Info size={15} />
  <span>
    Perubahan pilihan kurikulum tersimpan pada penyimpanan lokal
    aplikasi. Data struktur dan alokasi mata pelajaran masih berupa
    data ilustrasi.
  </span>
</div>

</section>


      {/* INFORMASI KURIKULUM AKTIF */}
      <section className="curriculum-info-banner">

        <div className="curriculum-info-icon">
          <BookOpen size={25} />
        </div>

        <div className="curriculum-info-copy">
          <span>KURIKULUM KELAS {selectedGrade}</span>

          <h3>{currentCurriculum.name}</h3>

          <p>
            Tahun Ajaran {selectedYear} · Jenjang SMP
          </p>
        </div>

        <div className="curriculum-info-status">
          <span className="curriculum-status-dot" />
          Pengaturan contoh
        </div>

      </section>

      {/* STATISTIK */}
      <section className="curriculum-stat-grid">

        <article className="curriculum-stat-card">
          <div className="curriculum-stat-icon blue">
            <Layers3 size={21} />
          </div>
          <div>
            <span>Struktur Kurikulum</span>
            <strong>3 Tingkat</strong>
            <small>VII, VIII, dan IX</small>
          </div>
        </article>

        <article className="curriculum-stat-card">
          <div className="curriculum-stat-icon green">
            <BookOpen size={21} />
          </div>
          <div>
            <span>Mata Pelajaran</span>
            <strong>{baseSubjects.length} Mapel</strong>
            <small>Data ilustrasi</small>
          </div>
        </article>

        <article className="curriculum-stat-card">
          <div className="curriculum-stat-icon purple">
            <Target size={21} />
          </div>
          <div>
            <span>Perangkat Kurikulum</span>
            <strong>{selectedCurriculum === "merdeka" ? "CP / TP / ATP" : "KI / KD / RPP"}</strong>
            <small>Menyesuaikan pilihan kurikulum</small>
          </div>
        </article>

        <article className="curriculum-stat-card">
          <div className="curriculum-stat-icon orange">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Alokasi Pembelajaran</span>
            <strong>Per Tingkat</strong>
            <small>Sesuai struktur yang ditetapkan</small>
          </div>
        </article>

      </section>

      {/* AREA KERJA KURIKULUM */}
      <section className="curriculum-workspace">

        {/* TAB DINAMIS */}
        <div className="curriculum-tabs">
          {currentTabs.map((tab) => (
            <button
              key={tab}
              className={`curriculum-tab ${
                activeTab === tab ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Struktur Kurikulum" ? (

          <div className="curriculum-content">

            <div className="curriculum-section-heading">
              <div>
                <h3>Struktur Kurikulum Sekolah</h3>
                <p>{currentCurriculum.description}</p>
              </div>
            </div>

            {/* TINGKAT KELAS */}
<div className="grade-selector">

  {["VII", "VIII", "IX"].map((grade) => (
    <button
      key={grade}
      className={selectedGrade === grade ? "selected" : ""}
      onClick={() => handleGradeChange(grade)}
    >
      <GraduationCap size={17} />
      Kelas {grade}
    </button>
  ))}

</div>

            {/* TOOLBAR */}
            <div className="curriculum-table-toolbar">

              <div className="curriculum-search">
                <Search size={17} />
                <input
                  type="text"
                  placeholder="Cari mata pelajaran..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <button className="curriculum-filter-button">
                <Filter size={16} />
                Filter
              </button>

              <button
  className="curriculum-add-subject"
  onClick={handleAddSubject}
>
  <Plus size={16} />
  Tambah Mata Pelajaran
</button>

            </div>

            {/* TABEL STRUKTUR */}
            <div className="curriculum-table-wrapper">

              <table className="curriculum-table">

                <thead>
                  <tr>
                    <th width="70">Kode</th>
                    <th>Mata Pelajaran</th>
                    <th width="110">Tingkat</th>
                    <th width="130">Alokasi / Minggu</th>
                    <th width="120">Kategori</th>
                    <th width="100">Aksi</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredSubjects.map((subject) => (
                    <tr key={`${subject.grade}-${subject.code}`}>

                      <td>
                        <span className="subject-code">
                          {subject.code}
                        </span>
                      </td>

                      <td className="subject-name">
                        {subject.name}
                      </td>

                      <td>
                        <span className="grade-badge">
                          Kelas {subject.grade}
                        </span>
                      </td>

                      <td>
                        <strong>{subject.hours} JP</strong>
                      </td>

                      <td>
                        <span className="subject-category">
                          {subject.category}
                        </span>
                      </td>

                      <td>
                        <button className="subject-action">
                          Detail <ChevronRight size={14} />
                        </button>
                      </td>

                    </tr>
                  ))}

                  {filteredSubjects.length === 0 && (
                    <tr>
                      <td colSpan="6" className="curriculum-empty">
                        Mata pelajaran tidak ditemukan.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>

            </div>

            <div className="curriculum-table-footer">
              <span>
                Menampilkan {filteredSubjects.length} mata pelajaran
                untuk kelas {selectedGrade}
              </span>

              <span>
                {currentCurriculum.name} · Data ilustrasi
              </span>
            </div>

          </div>

        ) : (

          <div className="curriculum-placeholder">

            <div className="curriculum-placeholder-icon">
              {selectedCurriculum === "merdeka" ? (
                <Target size={30} />
              ) : (
                <ClipboardList size={30} />
              )}
            </div>

            <h3>{activeTab}</h3>

            <p>
              {activeTab} akan dikelola melalui modul
              {selectedCurriculum === "merdeka"
                ? " Kurikulum Merdeka."
                : " Kurikulum 2013."}
            </p>

            <p>
              Struktur formulir, data, dan dokumen akan disesuaikan
              dengan kurikulum yang dipilih.
            </p>

          </div>

        )}

      </section>


      {showSubjectForm && (
        <div className="subject-modal-overlay">
          <div className="subject-modal">
            <div className="subject-modal-header">
              <div>
                <h3>
                  {editingSubject
                    ? "Edit Mata Pelajaran"
                    : "Tambah Mata Pelajaran"}
                </h3>
                <p>Lengkapi informasi mata pelajaran.</p>
              </div>

              <button
                type="button"
                onClick={handleCloseSubjectForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveSubject}>
              <label>Kode Mata Pelajaran</label>
              <input
                type="text"
                name="code"
                value={subjectForm.code}
                onChange={handleSubjectFormChange}
                placeholder="Contoh: MAT"
                required
              />

              <label>Nama Mata Pelajaran</label>
              <input
                type="text"
                name="name"
                value={subjectForm.name}
                onChange={handleSubjectFormChange}
                placeholder="Masukkan nama mata pelajaran"
                required
              />

              <label>Kelas</label>
              <select
                name="grade"
                value={subjectForm.grade}
                onChange={handleSubjectFormChange}
              >
                <option value="VII">Kelas VII</option>
                <option value="VIII">Kelas VIII</option>
                <option value="IX">Kelas IX</option>
              </select>

              <label>Alokasi Waktu (JP per Minggu)</label>
              <input
                type="number"
                name="hours"
                min="1"
                value={subjectForm.hours}
                onChange={handleSubjectFormChange}
                required
              />

              <label>Kategori</label>
              <select
                name="category"
                value={subjectForm.category}
                onChange={handleSubjectFormChange}
              >
                <option value="Wajib">Wajib</option>
                <option value="Pilihan">Pilihan</option>
                <option value="Muatan Lokal">Muatan Lokal</option>
              </select>

              <div className="subject-modal-actions">
                <button
                  type="button"
                  onClick={handleCloseSubjectForm}
                >
                  Batal
                </button>

                <button type="submit">
                  Simpan Mata Pelajaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <div className="curriculum-note">
        <FileText size={15} />
        <span>
          Data mata pelajaran dan alokasi waktu pada tahap ini hanya ilustrasi.
          Data resmi sekolah akan ditetapkan dan dikelola melalui aplikasi.
        </span>
      </div>

    </div>
  );
}

export default KurikulumPage;
