import api from "./api";
import type { AssignmentResponse } from "../types/api";

export async function getMyAssignment(): Promise<AssignmentResponse> {
  const { data } = await api.get<AssignmentResponse>("/me/assignment");
  return data;
}
