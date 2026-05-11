import { Assignment } from "../types";

const DB_NAME = "digital-student-planner-db";
const DB_VERSION = 1;
const ASSIGNMENT_STORE = "assignments";

function openAssignmentDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(ASSIGNMENT_STORE)) {
        database.createObjectStore(ASSIGNMENT_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open assignment database."));
  });
}

export async function getAllAssignments(): Promise<Assignment[]> {
  const database = await openAssignmentDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ASSIGNMENT_STORE, "readonly");
    const store = transaction.objectStore(ASSIGNMENT_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result as Assignment[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error("Failed to load assignments from IndexedDB."));

    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
    transaction.onabort = () => database.close();
  });
}

export async function saveAssignment(assignment: Assignment): Promise<void> {
  const database = await openAssignmentDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ASSIGNMENT_STORE, "readwrite");
    const store = transaction.objectStore(ASSIGNMENT_STORE);

    store.put(assignment);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Failed to save assignment to IndexedDB."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Saving assignment was aborted."));
    };
  });
}

export async function saveAssignments(assignments: Assignment[]): Promise<void> {
  const database = await openAssignmentDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ASSIGNMENT_STORE, "readwrite");
    const store = transaction.objectStore(ASSIGNMENT_STORE);

    assignments.forEach((assignment) => {
      store.put(assignment);
    });

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Failed to seed assignments in IndexedDB."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Seeding assignments was aborted."));
    };
  });
}
