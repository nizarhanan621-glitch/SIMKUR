
/*
 * SIMKUR SMP
 * GENERATOR JADWAL BERBASIS BLOK JP
 *
 * Aturan pembagian:
 * 1 JP  = hanya untuk penugasan Tambahan
 * 2 JP  = 2
 * 3 JP  = 3
 * 4 JP  = 2 + 2
 * 5 JP  = 3 + 2
 * 6 JP  = 3 + 3
 * 7 JP  = 3 + 2 + 2
 * 8 JP  = 3 + 3 + 2
 * 9 JP  = 3 + 3 + 3
 */

export function buildMeetingBlocks(assignment) {
  const total = Math.max(
    0,
    Number(assignment?.jpPerMinggu || 0)
  );

  const type = assignment?.jenisPenugasan || "Reguler";

  if (!Number.isInteger(total) || total < 0) {
    return [];
  }

  if (total === 0) return [];

  if (total === 1) {
    return type === "Tambahan" ? [1] : [];
  }

  const blocks = [];
  let remaining = total;

  while (remaining > 0) {
    if (remaining === 4) {
      blocks.push(2, 2);
      break;
    }

    if (remaining === 5) {
      blocks.push(3, 2);
      break;
    }

    if (remaining === 2 || remaining === 3) {
      blocks.push(remaining);
      break;
    }

    if (remaining >= 6) {
      blocks.push(3);
      remaining -= 3;
      continue;
    }

    return [];
  }

  return blocks;
}

export function getAssignmentTypeLabel(assignment) {
  return assignment?.jenisPenugasan === "Tambahan"
    ? "Tambahan"
    : "Reguler";
}

function hasConflict(candidate, schedules) {
  return schedules.some((item) => {
    const sameDay = item.hari === candidate.hari;
    const samePeriod =
      Number(item.jamKe) === Number(candidate.jamKe);

    if (!sameDay || !samePeriod) return false;

    const sameTeacher =
      String(item.guruId) === String(candidate.guruId);

    const sameClass =
      String(item.rombelId) === String(candidate.rombelId);

    return sameTeacher || sameClass;
  });
}

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}


function validateLockedBlocks(assignments, lockedSchedules) {
  for (const assignment of assignments) {
    const assignmentId = String(assignment.id);
    const total = Number(assignment.jpPerMinggu || 0);
    const type = assignment.jenisPenugasan || "Reguler";

    const lockedItems = lockedSchedules.filter(
      (item) =>
        String(item.tugasMengajarId) === assignmentId
    );

    if (lockedItems.length > total) {
      return (
        `Penugasan ${assignmentId} memiliki jadwal terkunci ` +
        `sebanyak ${lockedItems.length} JP, melebihi alokasi ${total} JP.`
      );
    }

    if (lockedItems.length === 0) continue;

    const targetBlocks = buildMeetingBlocks({
      ...assignment,
      jpPerMinggu: total,
      jenisPenugasan: type,
    });

    if (!targetBlocks.length) {
      return (
        `Penugasan ${assignmentId} tidak memiliki pola blok JP yang valid.`
      );
    }

    // Kelompokkan slot terkunci berdasarkan hari.
    const byDay = {};

    lockedItems.forEach((item) => {
      if (!byDay[item.hari]) byDay[item.hari] = [];

      byDay[item.hari].push(Number(item.jamKe));
    });

    const lockedRuns = [];

    for (const [day, periods] of Object.entries(byDay)) {
      const sorted = [...periods].sort((a, b) => a - b);

      let currentRun = [];

      sorted.forEach((period) => {
        if (
          currentRun.length === 0 ||
          period === currentRun[currentRun.length - 1] + 1
        ) {
          currentRun.push(period);
        } else {
          lockedRuns.push({
            day,
            size: currentRun.length,
          });

          currentRun = [period];
        }
      });

      if (currentRun.length) {
        lockedRuns.push({
          day,
          size: currentRun.length,
        });
      }
    }

    // Setiap rangkaian slot terkunci harus dapat dipetakan
    // ke satu atau beberapa blok resmi penugasan.
    function canMatchRuns(runIndex, availableBlocks) {
      if (runIndex >= lockedRuns.length) {
        return true;
      }

      const run = lockedRuns[runIndex];
      const selected = [];

      function findCombination(startIndex, sum) {
        if (sum === run.size) {
          const remainingBlocks = availableBlocks.filter(
            (_, index) => !selected.includes(index)
          );

          return canMatchRuns(
            runIndex + 1,
            remainingBlocks
          );
        }

        if (sum > run.size) return false;

        for (
          let i = startIndex;
          i < availableBlocks.length;
          i++
        ) {
          selected.push(i);

          if (
            findCombination(
              i + 1,
              sum + availableBlocks[i]
            )
          ) {
            return true;
          }

          selected.pop();
        }

        return false;
      }

      return findCombination(0, 0);
    }

    if (!canMatchRuns(0, targetBlocks)) {
      return (
        `Jadwal terkunci untuk penugasan ${assignmentId} ` +
        `tidak sesuai dengan pola blok ${targetBlocks.join(" + ")} JP. ` +
        "Blok yang terkunci harus berupa pertemuan utuh 2 atau 3 JP " +
        "(atau 1 JP khusus penugasan tambahan). " +
        "Silakan buka kunci dan perbaiki susunannya."
      );
    }
  }

  return "";
}


export function generateTimetableBlocks(
  assignments,
  settings,
  lockedSchedules,
  days
) {
  const activeDays = days.filter((day) =>
    settings.polaHari === "senin-sabtu"
      ? true
      : day !== "Sabtu"
  );

  const slotsByDay = {};

  activeDays.forEach((day) => {
    const jumlahJP = Math.max(
      0,
      Number(settings.hari?.[day]?.jumlahJP || 0)
    );

    slotsByDay[day] = Array.from(
      { length: jumlahJP },
      (_, index) => index + 1
    );
  });

  const totalRequired = assignments.reduce(
    (sum, item) =>
      sum + Number(item.jpPerMinggu || 0),
    0
  );

  const activeIds = new Set(
    assignments.map((item) => String(item.id))
  );

  const locked = [...lockedSchedules];

  // Periksa apakah jadwal terkunci masih memiliki penugasan aktif.
  const invalidLockedAssignment = locked.find(
    (item) =>
      item.tugasMengajarId &&
      !activeIds.has(String(item.tugasMengajarId))
  );

  if (invalidLockedAssignment) {
    return {
      error:
        "Ada jadwal terkunci yang penugasannya sudah tidak aktif atau tidak ditemukan. Periksa jadwal tersebut dan buka kuncinya sebelum menjalankan generator.",
    };
  }

  // Periksa bentrok pada jadwal yang dikunci.
  const lockedConflict = locked.some(
    (item, index) =>
      hasConflict(item, locked.slice(0, index))
  );

  if (lockedConflict) {
    return {
      error:
        "Jadwal terkunci memiliki bentrok guru atau rombel. Perbaiki terlebih dahulu.",
    };
  }

  // Periksa jadwal terkunci di luar hari atau JP aktif.
  const lockedOutside = locked.some(
    (item) =>
      !activeDays.includes(item.hari) ||
      !slotsByDay[item.hari]?.includes(
        Number(item.jamKe)
      )
  );

  if (lockedOutside) {
    return {
      error:
        "Ada jadwal terkunci di luar hari atau jumlah JP aktif. Sesuaikan pengaturan atau buka kuncinya.",
    };
  }

    const lockedBlockError = validateLockedBlocks(
    assignments,
    locked
  );

  if (lockedBlockError) {
    return {
      error: lockedBlockError,
    };
  }

  // Hitung JP yang sudah terkunci untuk setiap penugasan.
    const lockedCounts = {};

  locked.forEach((item) => {
    const id = String(item.tugasMengajarId);

    if (item.tugasMengajarId && activeIds.has(id)) {
      lockedCounts[id] =
        (lockedCounts[id] || 0) + 1;
    }
  });

  const pendingBlocks = [];
  const invalidAssignments = [];

  assignments.forEach((assignment) => {
    const total = Number(
      assignment.jpPerMinggu || 0
    );

    const lockedCount =
      lockedCounts[String(assignment.id)] || 0;

    const remaining = Math.max(
      0,
      total - lockedCount
    );

    const type =
      assignment.jenisPenugasan || "Reguler";

    if (total === 1 && type !== "Tambahan") {
      invalidAssignments.push({
        assignment,
        size: 1,
        reason:
          "Penugasan reguler 1 JP tidak diperbolehkan. Ubah menjadi penugasan tambahan atau perbaiki alokasi JP.",
      });

      return;
    }

    if (remaining === 0) return;

    const blocks = buildMeetingBlocks({
      ...assignment,
      jpPerMinggu: remaining,
      jenisPenugasan: type,
    });

    if (!blocks.length) {
      invalidAssignments.push({
        assignment,
        size: remaining,
        reason:
          `Sisa ${remaining} JP tidak dapat dibentuk menjadi blok yang valid. Periksa jadwal terkunci dan alokasi JP.`,
      });

      return;
    }

    blocks.forEach((size, index) => {
      pendingBlocks.push({
        assignment,
        size,
        blockIndex: index + 1,
      });
    });
  });

  const slotCapacity = activeDays.reduce(
    (sum, day) =>
      sum + slotsByDay[day].length,
    0
  );

  let bestSchedules = [...locked];
  let bestPlacedJP = -1;
  let bestScore = Infinity;
  let bestUnplaced = [];

  // Beberapa percobaan untuk mencari susunan yang lebih baik.
  for (let attempt = 0; attempt < 600; attempt++) {
    const current = [...locked];

    const pending = shuffle(pendingBlocks).sort(
      (a, b) => b.size - a.size
    );

    const unplaced = [];
    let placedJP = 0;
    let totalScore = 0;

        current.forEach((item) => {
      if (
        item.tugasMengajarId &&
        activeIds.has(String(item.tugasMengajarId))
      ) {
        placedJP += 1;
      }
    });

    for (const block of pending) {
      const assignment = block.assignment;
      const size = block.size;

      const candidates = [];

      activeDays.forEach((day) => {
        const daySlots = slotsByDay[day];

        for (
          let start = 1;
          start <= daySlots.length - size + 1;
          start++
        ) {
          const proposed = Array.from(
            { length: size },
            (_, offset) => ({
              hari: day,
              jamKe: start + offset,
              guruId: assignment.guruId,
              rombelId: assignment.rombelId,
              mapelId: assignment.mapelId,
              tugasMengajarId: assignment.id,
            })
          );

          const collision = proposed.some(
            (candidate) =>
              hasConflict(candidate, current)
          );

          if (collision) continue;

          const sameSubjectDay = current.filter(
            (item) =>
              item.hari === day &&
              String(item.rombelId) ===
                String(assignment.rombelId) &&
              String(item.mapelId) ===
                String(assignment.mapelId)
          ).length;

          const sameTeacherDay = current.filter(
            (item) =>
              item.hari === day &&
              String(item.guruId) ===
                String(assignment.guruId)
          ).length;

          const sameClassDay = current.filter(
            (item) =>
              item.hari === day &&
              String(item.rombelId) ===
                String(assignment.rombelId)
          ).length;

          const classPeriods = current
            .filter(
              (item) =>
                item.hari === day &&
                String(item.rombelId) ===
                  String(assignment.rombelId)
            )
            .map((item) => Number(item.jamKe));

          const combined = [
            ...classPeriods,
            ...proposed.map((item) => item.jamKe),
          ].sort((a, b) => a - b);

          let gapPenalty = 0;

          for (
            let i = 1;
            i < combined.length;
            i++
          ) {
            const gap =
              combined[i] - combined[i - 1];

            if (gap > 1) {
              gapPenalty += gap - 1;
            }
          }

          const score =
            sameSubjectDay * 18 +
            sameTeacherDay * 4 +
            sameClassDay * 3 +
            gapPenalty * 7 +
            Math.random() * 3;

          candidates.push({
            proposed,
            score,
          });
        }
      });

      candidates.sort(
        (a, b) => a.score - b.score
      );

      if (candidates.length === 0) {
        unplaced.push(block);
        continue;
      }

      const chosen = candidates[0];

      chosen.proposed.forEach((slot) => {
        current.push({
          id:
            `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 9)}`,
          ...slot,
          status: "Aktif",
          locked: false,
          sumber: "Generate",
        });
      });

      placedJP += size;
      totalScore += chosen.score;
    }

    const better =
      placedJP > bestPlacedJP ||
      (
        placedJP === bestPlacedJP &&
        totalScore < bestScore
      );

    if (better) {
      bestSchedules = current;
      bestPlacedJP = placedJP;
      bestScore = totalScore;
      bestUnplaced = unplaced;
    }

    if (unplaced.length === 0) break;
  }

  const missingBlocks = [
    ...invalidAssignments,

    ...bestUnplaced.map((item) => ({
      ...item,
      reason:
        `Blok ${item.size} JP berurutan tidak menemukan slot yang bebas dari bentrok guru dan rombel.`,
    })),
  ];

  const placedForActive = bestSchedules.filter(
    (item) =>
      activeIds.has(
        String(item.tugasMengajarId)
      )
  ).length;

  const missingJP = Math.max(
    0,
    totalRequired - placedForActive
  );

  // Identifikasi slot kosong pada setiap rombel.
  const classMap = new Map();

  assignments.forEach((assignment) => {
    const id = String(assignment.rombelId);

    if (!classMap.has(id)) {
      classMap.set(id, {
        rombelId: assignment.rombelId,
        className:
          assignment.namaRombel || id,
      });
    }
  });

  const emptyByClass = [];

  classMap.forEach((classInfo) => {
    const emptySlots = [];

    activeDays.forEach((day) => {
      slotsByDay[day].forEach((period) => {
        const occupied = bestSchedules.some(
          (item) =>
            item.hari === day &&
            Number(item.jamKe) === period &&
            String(item.rombelId) ===
              String(classInfo.rombelId)
        );

        if (!occupied) {
          emptySlots.push({
            hari: day,
            jamKe: period,
          });
        }
      });
    });

    if (emptySlots.length > 0) {
      emptyByClass.push({
        ...classInfo,
        emptySlots,
      });
    }
  });

  // Kapasitas dihitung per rombel dan per guru,
  // bukan dari total kebutuhan seluruh sekolah.
  const classDemand = new Map();
  const teacherDemand = new Map();

  assignments.forEach((assignment) => {
    const jp = Number(assignment.jpPerMinggu || 0);
    const classId = String(assignment.rombelId);
    const teacherId = String(assignment.guruId);

    classDemand.set(
      classId,
      (classDemand.get(classId) || 0) + jp
    );

    teacherDemand.set(
      teacherId,
      (teacherDemand.get(teacherId) || 0) + jp
    );
  });

  const capacityWarnings = [];

  classDemand.forEach((demand, classId) => {
    if (demand > slotCapacity) {
      capacityWarnings.push(
        `Rombel ${classId} membutuhkan ${demand} JP, ` +
        `sedangkan kapasitasnya hanya ${slotCapacity} slot JP.`
      );
    }
  });

  teacherDemand.forEach((demand, teacherId) => {
    if (demand > slotCapacity) {
      capacityWarnings.push(
        `Guru ${teacherId} memiliki beban ${demand} JP, ` +
        `sedangkan kapasitas waktunya hanya ${slotCapacity} slot JP.`
      );
    }
  });

  return {
    schedules: bestSchedules,
    placed: placedForActive,
    missing: missingJP,
    total: totalRequired,
    complete:
      missingJP === 0 &&
      missingBlocks.length === 0,
    missingBlocks,
    emptyByClass,

        capacityWarning: capacityWarnings.join(" "),
    capacityWarnings,
  };
}
