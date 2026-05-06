import api from "./api";
import type { AnalyticsSummary, CollectedDataRow } from "../types/api";

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data } = await api.get<AnalyticsSummary>("/analytics/summary");
  return data;
}

export async function listAnalyticsData(): Promise<CollectedDataRow[]> {
  const { data } = await api.get<CollectedDataRow[]>("/analytics/data");
  return data;
}
