import api from "./api";
import type { AssignmentResponse, MyAssignment } from "../types/api";

export async function getMyAssignment(): Promise<AssignmentResponse> {
  const { data } = await api.get<AssignmentResponse>("/me/assignment");
  return data;
}

export async function getMyAssignments(): Promise<MyAssignment[]> {
  const { data } = await api.get<MyAssignment[]>("/me/assignments");
  return data;
}
