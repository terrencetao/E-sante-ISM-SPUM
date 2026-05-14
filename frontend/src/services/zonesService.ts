import api from "./api";
import type { HealthArea } from "../types/api";

export async function listZones(): Promise<HealthArea[]> {
  const { data } = await api.get<HealthArea[]>("/zones");
  return data;
}

export async function createZone(payload: { name: string; description?: string }): Promise<HealthArea> {
  const { data } = await api.post<HealthArea>("/zones", payload);
  return data;
}

export async function updateZone(zoneId: string, payload: { name?: string; description?: string }): Promise<HealthArea> {
  const { data } = await api.patch<HealthArea>(`/zones/${zoneId}`, payload);
  return data;
}

export async function deleteZone(zoneId: string): Promise<void> {
  await api.delete(`/zones/${zoneId}`);
}
