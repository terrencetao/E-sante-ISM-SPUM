import api from "./api";
import type { SyncResponse } from "../types/api";

export async function syncChanges(changes: Array<Record<string, unknown>>): Promise<SyncResponse> {
  const { data } = await api.post<SyncResponse>("/sync", {
    changes,
    timestamp: new Date().toISOString(),
  });
  return data;
}
