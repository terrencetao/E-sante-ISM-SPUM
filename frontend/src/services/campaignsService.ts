import api from "./api";
import type { Assignment, Campaign } from "../types/api";

export async function listCampaigns(): Promise<Campaign[]> {
  const { data } = await api.get<Campaign[]>("/campaigns");
  return data;
}

export async function createCampaign(payload: { name: string; description?: string }): Promise<Campaign> {
  const { data } = await api.post<Campaign>("/campaigns", payload);
  return data;
}

export async function assignCampaign(
  campaignId: string,
  payload: { health_area_id: string; user_id: string },
): Promise<Assignment> {
  const { data } = await api.post<Assignment>(`/campaigns/${campaignId}/assignments`, payload);
  return data;
}
