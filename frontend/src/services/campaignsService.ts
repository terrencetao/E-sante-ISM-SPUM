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

export async function updateCampaign(
  campaignId: string,
  payload: { name?: string; description?: string; status?: string },
): Promise<Campaign> {
  const { data } = await api.patch<Campaign>(`/campaigns/${campaignId}`, payload);
  return data;
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  await api.delete(`/campaigns/${campaignId}`);
}

export async function assignCampaign(
  campaignId: string,
  payload: { health_area_id: string; user_id: string },
): Promise<Assignment> {
  const { data } = await api.post<Assignment>(`/campaigns/${campaignId}/assignments`, payload);
  return data;
}

export async function listAssignments(): Promise<Assignment[]> {
  const { data } = await api.get<Assignment[]>("/campaigns/assignments");
  return data;
}

export async function updateAssignment(
  assignmentId: string,
  payload: { campaign_id?: string; health_area_id?: string; user_id?: string; status?: string },
): Promise<Assignment> {
  const { data } = await api.patch<Assignment>(`/campaigns/assignments/${assignmentId}`, payload);
  return data;
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  await api.delete(`/campaigns/assignments/${assignmentId}`);
}
