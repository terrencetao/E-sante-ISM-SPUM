import { addRxPlugin, createRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";

let dbPromise: ReturnType<typeof createDb> | null = null;

const collectedSchema = {
  title: "collected-data schema",
  version: 0,
  type: "object",
  primaryKey: "id",
  properties: {
    id: { type: "string", maxLength: 100 },
    campaign_id: { type: "string" },
    health_area_id: { type: "string" },
    village_id: { type: ["string", "null"] },
    data_payload: { type: "object", additionalProperties: true },
    source_timestamp: { type: "string" },
    sync_status: { type: "string" }
  },
  required: ["id", "campaign_id", "health_area_id", "data_payload", "source_timestamp", "sync_status"],
  additionalProperties: false
} as const;

function createDb() {
  if (import.meta.env.DEV) {
    addRxPlugin(RxDBDevModePlugin);
  }
  return createRxDatabase({
    name: "e_sante_local",
    storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
  }).then(async (db) => {
    await db.addCollections({
      collected_data: { schema: collectedSchema },
    });
    return db;
  });
}

export async function getDb() {
  if (!dbPromise) {
    dbPromise = createDb();
  }
  return dbPromise;
}

export async function resetLocalData(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.remove();
    dbPromise = null;
  }

  if (typeof indexedDB !== "undefined") {
    indexedDB.deleteDatabase("e_sante_local");
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("current_email");
  localStorage.removeItem("current_role");
  localStorage.removeItem("dev_previous_user");
}
