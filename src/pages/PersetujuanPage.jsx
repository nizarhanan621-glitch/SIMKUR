
import { useState } from "react";

import {
  loadAcademicCalendarEvents,
  saveAcademicCalendarEvents,
} from "../lib/calendarStorage";

import {
  CheckCircle2,
  XCircle,
  Clock3,
  CalendarDays,
  ClipboardCheck,
  Inbox,
  FileCheck2,
} from "lucide-react";

const categoryNames = {
  kbm: "Pembelajaran",
  semester: "Awal/Akhir Semester",
  asesmen: "Asesmen",
  rapat: "Rapat",
  monitoring: "Monitoring",
  libur_nasional: "Libur Nasional",
  cuti_bersama: "Cuti Bersama",
  libur_sekolah: "Libur Sekolah",
  libur_daerah: "Libur Daerah",
  kegiatan_dinas: "Kegiatan Dinas",
  kegiatan_sekolah: "Kegiatan Sekolah",
  hari_penting: "Hari Penting Pendidikan",
  lainnya: "Lainnya",
};

function formatDate(dateString) {
  if (!dateString) return "Tanggal belum ditentukan";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PersetujuanPage() {
  const [events, setEvents] = useState(() =>
    loadAcademicCalendarEvents()
  );

  const [message, setMessage] = useState("");

  const pendingEvents = events.filter(
    (event) => event.status === "pending_head_approval"
  );

  const decidedEvents = events.filter(
  (event) =>
    event.status === "approved" ||
    event.status === "rejected_by_head" ||
    (event.headDecisionHistory || []).length > 0
);

  const handleDecision = (eventId, decision) => {
    const selectedEvent = events.find(
      (event) => event.id === eventId
    );

    if (!selectedEvent) {
      setMessage("Agenda tidak ditemukan.");
      return;
    }

    if (selectedEvent.status !== "pending_head_approval") {
      setMessage("Agenda ini sudah pernah diproses.");
      return;
    }

    let rejectionReason = "";

    if (decision === "rejected_by_head") {
      rejectionReason = window.prompt(
        `Tuliskan alasan penolakan agenda "${selectedEvent.title}":`
      );

      if (rejectionReason === null) return;

      rejectionReason = rejectionReason.trim();

      if (!rejectionReason) {
        alert("Alasan penolakan harus diisi.");
        return;
      }
    }

    const confirmation =
      decision === "approved"
        ? window.confirm(
            `Apakah Anda yakin menyetujui agenda "${selectedEvent.title}"?`
          )
        : window.confirm(
            `Apakah Anda yakin menolak agenda "${selectedEvent.title}"?`
          );

    if (!confirmation) return;

    const decisionAt = new Date().toISOString();

const updatedEvents = events.map((event) =>
  event.id === eventId
    ? {
        ...event,
        status: decision,
        headDecisionAt: decisionAt,
        headRejectionReason:
          decision === "rejected_by_head"
            ? rejectionReason
            : "",
        headDecisionHistory: [
          ...(event.headDecisionHistory || []),
          {
            decision,
            decidedAt: decisionAt,
            reason:
              decision === "rejected_by_head"
                ? rejectionReason
                : "",
          },
        ],
      }
    : event
);

    const saved = saveAcademicCalendarEvents(updatedEvents);

    if (!saved) {
      setMessage("Keputusan gagal disimpan. Silakan coba kembali.");
      return;
    }

    setEvents(updatedEvents);

    setMessage(
      decision === "approved"
        ? "Agenda berhasil disetujui oleh Kepala Sekolah."
        : "Agenda berhasil ditolak."
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* HEADER */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            color: "#718096",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.7px",
            marginBottom: 9,
          }}
        >
          PENGAWASAN
          <span>/</span>
          PERSETUJUAN AGENDA
        </div>

        <h2 style={{ color: "#173B68", margin: "0 0 8px" }}>
          Persetujuan Agenda
        </h2>

        <p style={{ color: "#68788C", margin: 0, fontSize: 13 }}>
          Periksa dan berikan keputusan final terhadap agenda
          akademik yang diajukan oleh Wakasek Kurikulum.
        </p>
      </section>

      {/* RINGKASAN */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 14,
        }}
      >
        <SummaryCard
          icon={<Clock3 size={21} />}
          label="Menunggu Persetujuan"
          value={pendingEvents.length}
          color="#C17B19"
          background="#FFF3D6"
        />

        <SummaryCard
          icon={<CheckCircle2 size={21} />}
          label="Disetujui"
          value={events.filter((e) => e.status === "approved").length}
          color="#23845B"
          background="#E3F5EA"
        />

        <SummaryCard
          icon={<XCircle size={21} />}
          label="Ditolak"
          value={
            events.filter((e) => e.status === "rejected_by_head").length
          }
          color="#C14444"
          background="#FCE8E8"
        />
      </section>

      {/* NOTIFIKASI */}
      {message && (
        <div
          style={{
            padding: "12px 15px",
            borderRadius: 9,
            background: "#EAF2FA",
            color: "#24527D",
            fontSize: 13,
          }}
        >
          {message}
        </div>
      )}

      {/* DAFTAR PENGAJUAN */}
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #DCE4ED",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 5px", color: "#173B68" }}>
              Agenda Menunggu Keputusan
            </h3>
            <p style={{ margin: 0, color: "#7B8794", fontSize: 12 }}>
              Pengajuan dari Wakasek Kurikulum
            </p>
          </div>

          <div
            style={{
              background: "#FFF3D6",
              color: "#A66A00",
              padding: "6px 11px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {pendingEvents.length} Pengajuan
          </div>
        </div>

        {pendingEvents.length === 0 ? (
          <div
            style={{
              padding: "42px 15px",
              textAlign: "center",
              color: "#8492A3",
            }}
          >
            <Inbox size={38} />
            <h4 style={{ color: "#526477", marginBottom: 6 }}>
              Belum Ada Pengajuan
            </h4>
            <p style={{ fontSize: 12, margin: 0 }}>
              Agenda yang diajukan Wakasek akan tampil di sini.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {pendingEvents.map((event) => (
              <article
                key={event.id}
                style={{
                  border: "1px solid #E1E8F0",
                  borderRadius: 10,
                  padding: 17,
                  background: "#FFFFFF",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      color: "#4776A8",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {categoryNames[event.category] || "Agenda"}
                  </span>

                  <span
  style={{
    background: "#E8F0FF",
    color: "#245DA8",
    padding: "5px 9px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 700,
  }}
>
  {(event.headDecisionHistory || []).length > 0
    ? "MENUNGGU KEPUTUSAN ULANG"
    : "MENUNGGU PERSETUJUAN"}
</span>
                </div>

                <h4 style={{ color: "#173B68", margin: "0 0 12px" }}>
                  {event.title}
                </h4>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px 20px",
                    color: "#68788C",
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  <span>
                    <CalendarDays
                      size={14}
                      style={{ verticalAlign: "middle", marginRight: 5 }}
                    />
                    {formatDate(event.date || event.startDate)}
                  </span>

                  <span>
                    <Clock3
                      size={14}
                      style={{ verticalAlign: "middle", marginRight: 5 }}
                    />
                    {event.time || "Sepanjang hari"}
                  </span>
                </div>

                {event.description && (
                  <p
                    style={{
                      color: "#68788C",
                      fontSize: 12,
                      lineHeight: 1.6,
                      margin: "0 0 14px",
                    }}
                  >
                    {event.description}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 9,
                    flexWrap: "wrap",
                    marginTop: 15,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleDecision(event.id, "approved")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 15px",
                      background: "#23845B",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Setujui Agenda
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDecision(event.id, "rejected_by_head")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      border: "1px solid #E3B5B5",
                      borderRadius: 8,
                      padding: "10px 15px",
                      background: "#FFFFFF",
                      color: "#B42318",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <XCircle size={16} />
                    Tolak Agenda
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* RIWAYAT KEPUTUSAN */}
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #DCE4ED",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 16,
          }}
        >
          <FileCheck2 size={20} color="#2878C8" />
          <h3 style={{ margin: 0, color: "#173B68" }}>
            Riwayat Keputusan
          </h3>
        </div>

        {decidedEvents.length === 0 ? (
          <p style={{ color: "#8492A3", fontSize: 12 }}>
            Belum ada agenda yang diputuskan.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 11 }}>
            {decidedEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                  padding: "12px 0",
                  borderBottom: "1px solid #EDF1F5",
                }}
              >
                <div>
                  <strong style={{ color: "#34495E", fontSize: 13 }}>
                    {event.title}
                  </strong>

                  <div style={{ color: "#8492A3", fontSize: 11, marginTop: 5 }}>
                    {formatDate(event.date || event.startDate)}
                  </div>

                  {(event.headDecisionHistory || []).length > 0 && (
  <div style={{ marginTop: "9px" }}>
    <strong style={{ color: "#526477", fontSize: 11 }}>
      Riwayat keputusan:
    </strong>

    {(event.headDecisionHistory || []).map((history, index) => (
      <div
        key={`${event.id}-history-${index}`}
        style={{
          marginTop: "7px",
          padding: "9px",
          borderRadius: "7px",
          background:
            history.decision === "approved" ? "#E3F5EA" : "#FCE8E8",
        }}
      >
        <strong
          style={{
            color:
              history.decision === "approved" ? "#23845B" : "#B42318",
            fontSize: 10,
          }}
        >
          {history.decision === "approved" ? "DISETUJUI" : "DITOLAK"}
        </strong>

        <div style={{ color: "#68788C", fontSize: 10, marginTop: "4px" }}>
          {history.decidedAt
            ? new Date(history.decidedAt).toLocaleString("id-ID")
            : "Waktu tidak tersedia"}
        </div>

        {history.reason && (
          <p style={{ color: "#8F2929", fontSize: 11, marginBottom: 0 }}>
            Alasan: {history.reason}
          </p>
        )}
      </div>
    ))}
  </div>
)}
                </div>

                <span
  style={{
    color:
      event.status === "approved"
        ? "#23845B"
        : event.status === "rejected_by_head"
          ? "#B42318"
          : "#245DA8",
    fontSize: 10,
    fontWeight: 700,
  }}
>
  {event.status === "approved"
    ? "DISETUJUI"
    : event.status === "rejected_by_head"
      ? "DITOLAK"
      : event.status === "pending_head_approval"
        ? "MENUNGGU KEPUTUSAN ULANG"
        : "RIWAYAT KEPUTUSAN"}
</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 9,
          color: "#718096",
          fontSize: 11,
          lineHeight: 1.6,
        }}
      >
        <ClipboardCheck size={16} />
        <span>
          Keputusan Kepala Sekolah saat ini disimpan menggunakan
          localStorage pada browser. Sinkronisasi lintas pengguna
          akan dilakukan setelah integrasi database online.
        </span>
      </div>

    </div>
  );
}

function SummaryCard({ icon, label, value, color, background }) {
  return (
    <article
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: 17,
        background: "#FFFFFF",
        border: "1px solid #DCE4ED",
        borderRadius: 11,
      }}
    >
      <div
        style={{
          width: 43,
          height: 43,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          color,
          background,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div style={{ color: "#718096", fontSize: 11 }}>
          {label}
        </div>
        <strong style={{ color: "#173B68", fontSize: 23 }}>
          {value}
        </strong>
      </div>
    </article>
  );
}

export default PersetujuanPage;
