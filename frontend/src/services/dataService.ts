import api from "./api";
import type { CollectedDataInput, DataStatusResponse } from "../types/api";

export async function createData(payload: CollectedDataInput) {
  const { data } = await api.post("/data", payload);
  return data;
}

export async function getDataStatus(): Promise<DataStatusResponse> {
  const { data } = await api.get<DataStatusResponse>("/data/status");
  return data;
}
