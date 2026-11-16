
const DB_NAME = "simkur_appearance_db";
const DB_VERSION = 1;
const STORE_NAME = "school_appearances";

export const DEFAULT_APPEARANCE = {
  imageBlob: null,
  imageName: "",
  blur: 0,
  overlay: 15,
  position: "center",
};

function openAppearanceDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Browser tidak mendukung IndexedDB."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "schoolId",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error("Gagal membuka penyimpanan tampilan.")
      );
    };

    request.onblocked = () => {
      reject(
        new Error(
          "Penyimpanan sedang digunakan tab lain. Tutup tab SIMKUR lainnya."
        )
      );
    };
  });
}

export async function loadSchoolAppearance(schoolId) {
  if (!schoolId) {
    throw new Error("Identitas sekolah belum tersedia.");
  }

  const db = await openAppearanceDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(String(schoolId));

    request.onsuccess = () => {
      resolve({
        ...DEFAULT_APPEARANCE,
        ...(request.result || {}),
      });
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error("Gagal membaca pengaturan tampilan.")
      );
    };

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => db.close();
  });
}

export async function saveSchoolAppearance(
  schoolId,
  appearance
) {
  if (!schoolId) {
    throw new Error("Identitas sekolah belum tersedia.");
  }

  const db = await openAppearanceDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      schoolId: String(schoolId),
      ...DEFAULT_APPEARANCE,
      ...appearance,
      updatedAt: new Date().toISOString(),
    };

    store.put(record);

    transaction.oncomplete = () => {
      db.close();
      resolve(record);
    };

    transaction.onerror = () => {
      db.close();
      reject(
        transaction.error ||
          new Error("Gagal menyimpan pengaturan tampilan.")
      );
    };

    transaction.onabort = () => {
      db.close();
      reject(
        transaction.error ||
          new Error("Penyimpanan tampilan dibatalkan.")
      );
    };
  });
}

export async function resetSchoolAppearance(schoolId) {
  if (!schoolId) {
    throw new Error("Identitas sekolah belum tersedia.");
  }

  const db = await openAppearanceDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.delete(String(schoolId));

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = () => {
      db.close();
      reject(
        transaction.error ||
          new Error("Gagal menghapus pengaturan tampilan.")
      );
    };
  });
}
