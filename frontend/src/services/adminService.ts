import api from "./api";
import type { AuditLog, ConflictLog } from "../types/api";

export async function listConflicts(): Promise<ConflictLog[]> {
  const { data } = await api.get<ConflictLog[]>("/supervision/conflicts");
  return data;
}

export async function resolveConflict(
  conflictId: string,
  payload: { resolution_notes?: string; apply_client_payload?: boolean },
): Promise<ConflictLog> {
  const { data } = await api.patch<ConflictLog>(`/supervision/conflicts/${conflictId}`, payload);
  return data;
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  const { data } = await api.get<AuditLog[]>("/supervision/audit-logs");
  return data;
}
