import { useCallback } from "react";

import { useOfflineStore } from "../store/offline";
import { useSyncStore } from "../store/sync";
import { syncChanges } from "../services/sync";
import { getDb } from "../services/rxdb";

export function useSync() {
  const { setQueued } = useOfflineStore();
  const { syncing, setSyncing, setLastSyncAt } = useSyncStore();

  const runSync = useCallback(async () => {
    setSyncing(true);
    try {
      const db = await getDb();
      const docs = await db.collections.collected_data.find().exec();
      const pending = docs
        .map((d) => d.toJSON())
        .filter((row) => row.sync_status === "pending")
        .map((row) => ({
          id: row.id,
          campaign_id: row.campaign_id,
          health_area_id: row.health_area_id,
          village_id: row.village_id,
          data_payload: row.data_payload,
          source_timestamp: row.source_timestamp,
        }));

      if (pending.length === 0) {
        setQueued(0);
        return;
      }

      const response = await syncChanges(pending);
      const acceptedSet = new Set(response.accepted);
      for (const doc of docs) {
        if (acceptedSet.has(doc.get("id"))) {
          await doc.patch({ sync_status: "synced" });
        }
      }

      const refreshed = await db.collections.collected_data.find().exec();
      setQueued(refreshed.map((d) => d.toJSON()).filter((row) => row.sync_status === "pending").length);
      setLastSyncAt(response.timestamp);
    } finally {
      setSyncing(false);
    }
  }, [setLastSyncAt, setQueued, setSyncing]);

  return { runSync, syncing };
}
